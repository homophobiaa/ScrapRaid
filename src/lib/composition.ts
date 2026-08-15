/**
 * Expected raid composition.
 *
 * The raid system does not build one fixed roster. It places a free initial
 * group, then repeatedly draws a weighted group that the remaining budget can
 * still afford, subtracting its cost until nothing is affordable. So the honest
 * answer is a distribution, not a single number.
 *
 * Everything here is solved with deterministic dynamic programming over integer
 * budgets — no sampling — so the same inputs always produce byte-identical
 * output and React re-renders never shift the numbers.
 */

import { BOTS, type Bot, type BotId } from '../data/bots';
import type { RaidLevel } from '../data/raid';
import {
  spawnTableForLevel,
  type BotCounts,
  type RaidGroup,
  type RaidSpawnTable,
} from '../data/raidGroups';

/** Column order of every internal count vector. */
const BOT_ORDER: readonly BotId[] = [
  'green-totebot',
  'haybot',
  'blue-totebot',
  'red-totebot',
  'green-tapebot',
  'yellow-tapebot',
  'yellow-totebot',
  'blue-tapebot',
  'farmbot',
];

const FARMBOT_INDEX = BOT_ORDER.indexOf('farmbot');

/**
 * Ceiling on distribution cells computed per request.
 *
 * Exact percentiles for every bot cost roughly 0.37 x budget^2 cells. The
 * highest budget the game can reach is 6000 (level 7 at the difficulty cap with
 * 3+ players), which needs about 13.4M cells, so this limit covers every
 * reachable budget and the fallback below is a guard rather than a normal path.
 * It is a cell count rather than a wall-clock cutoff so the result stays a pure
 * function of the inputs on every machine.
 */
const DISTRIBUTION_CELL_LIMIT = 16_000_000;

export interface CountRange {
  readonly low: number;
  readonly high: number;
}

export interface BotEstimate {
  readonly bot: Bot;
  /** Lowest count the opening wave always places, before any budget is spent. */
  readonly guaranteed: number;
  /** Average opening-wave count (levels with several possible waves average them). */
  readonly expectedInitial: number;
  /** Average total count, opening wave included. Unrounded. */
  readonly expected: number;
  /** Central 80% of outcomes (10th to 90th percentile), when computed exactly. */
  readonly range: CountRange | null;
}

export interface FarmbotEstimate {
  readonly guaranteed: number;
  readonly expected: number;
  readonly p10: number;
  readonly p90: number;
  /** Probability of at least one Farmbot beyond the guaranteed opening ones. */
  readonly chanceOfExtra: number;
  readonly expectedExtra: number;
}

export interface RaidComposition {
  /** Floored budget actually available for group purchases. */
  readonly budget: number;
  readonly estimates: readonly BotEstimate[];
  readonly farmbot: FarmbotEstimate | null;
  readonly expectedTotalBots: number;
  /** True when 10th/90th percentiles were solved exactly for every bot. */
  readonly hasExactRanges: boolean;
  /** How many different opening waves this level can roll. */
  readonly initialVariants: number;
}

interface PreparedGroup {
  readonly cost: number;
  readonly weight: number;
  readonly counts: readonly number[];
}

const toVector = (counts: BotCounts): number[] => BOT_ORDER.map((id) => counts[id] ?? 0);

const prepare = (groups: readonly RaidGroup[]): PreparedGroup[] =>
  groups.map((group) => ({
    cost: group.cost,
    weight: group.weight,
    counts: toVector(group.bots),
  }));

/**
 * Expected count of every bot bought with `budget`.
 *
 * E[b | B] = sum over affordable groups g of P(g) * (count_g[b] + E[b | B - cost_g]),
 * with P(g) renormalised across only the groups still affordable at B.
 */
function expectedCounts(groups: readonly PreparedGroup[], budget: number): Float64Array {
  const n = BOT_ORDER.length;
  const table = new Float64Array((budget + 1) * n);

  for (let remaining = 0; remaining <= budget; remaining++) {
    let totalWeight = 0;
    for (const group of groups) if (group.cost <= remaining) totalWeight += group.weight;
    if (totalWeight === 0) continue; // Nothing affordable: the raid stops here.

    const row = remaining * n;
    for (const group of groups) {
      if (group.cost > remaining) continue;
      const probability = group.weight / totalWeight;
      const previous = (remaining - group.cost) * n;
      for (let i = 0; i < n; i++) {
        const cell = row + i;
        table[cell] =
          (table[cell] ?? 0) + probability * ((group.counts[i] ?? 0) + (table[previous + i] ?? 0));
      }
    }
  }

  return table.subarray(budget * n, budget * n + n);
}

/** Smallest budget that buys one more of a bot, used to bound its count vector. */
function cheapestPerUnit(groups: readonly PreparedGroup[], botIndex: number): number {
  let best = Infinity;
  for (const group of groups) {
    const count = group.counts[botIndex] ?? 0;
    if (count > 0) best = Math.min(best, group.cost / count);
  }
  return best === Infinity ? Infinity : Math.max(1, Math.floor(best));
}

/**
 * Exact probability distribution over how many of one bot the budget buys.
 *
 * dist[B][k] = sum over affordable g of P(g) * dist[B - cost_g][k - count_g]
 */
function countDistribution(
  groups: readonly PreparedGroup[],
  budget: number,
  botIndex: number,
  perUnit: number,
): Float64Array {
  // Every row lives in one flat buffer. Allocating thousands of small arrays
  // instead costs far more than the arithmetic does.
  const lengths = new Int32Array(budget + 1);
  const offsets = new Int32Array(budget + 2);
  for (let b = 0; b <= budget; b++) {
    const length = Math.floor(b / perUnit) + 1;
    lengths[b] = length;
    offsets[b + 1] = (offsets[b] ?? 0) + length;
  }
  const flat = new Float64Array(offsets[budget + 1] ?? 1);

  for (let remaining = 0; remaining <= budget; remaining++) {
    let totalWeight = 0;
    for (const group of groups) if (group.cost <= remaining) totalWeight += group.weight;

    const rowStart = offsets[remaining] ?? 0;
    if (totalWeight === 0) {
      flat[rowStart] = 1; // Budget exhausted: zero further bots, with certainty.
      continue;
    }

    for (const group of groups) {
      if (group.cost > remaining) continue;
      const probability = group.weight / totalWeight;
      const shift = group.counts[botIndex] ?? 0;
      const previous = remaining - group.cost;
      const sourceStart = offsets[previous] ?? 0;
      const sourceLength = lengths[previous] ?? 0;
      const target = rowStart + shift;
      for (let k = 0; k < sourceLength; k++) {
        const value = flat[sourceStart + k] ?? 0;
        if (value === 0) continue;
        const cell = target + k;
        flat[cell] = (flat[cell] ?? 0) + probability * value;
      }
    }
  }

  const start = offsets[budget] ?? 0;
  return flat.slice(start, start + (lengths[budget] ?? 1));
}

/** Number of distribution cells `countDistribution` would allocate. */
const distributionCells = (budget: number, perUnit: number): number =>
  Math.floor(((budget + 1) * (budget / perUnit + 2)) / 2);

/** Smallest count whose cumulative probability reaches `target`. */
function percentile(distribution: Float64Array, target: number): number {
  let cumulative = 0;
  for (let k = 0; k < distribution.length; k++) {
    cumulative += distribution[k] ?? 0;
    if (cumulative >= target - 1e-9) return k;
  }
  return distribution.length - 1;
}

const mean = (distribution: Float64Array): number => {
  let total = 0;
  for (let k = 0; k < distribution.length; k++) total += k * (distribution[k] ?? 0);
  return total;
};

/** Convolve an outcome distribution with the uniform choice of opening wave. */
function shiftByInitial(distribution: Float64Array, initialCounts: readonly number[]): Float64Array {
  const maxInitial = Math.max(...initialCounts);
  const result = new Float64Array(distribution.length + maxInitial);
  const share = 1 / initialCounts.length;
  for (const initial of initialCounts) {
    for (let k = 0; k < distribution.length; k++) {
      result[k + initial] = (result[k + initial] ?? 0) + share * (distribution[k] ?? 0);
    }
  }
  return result;
}

function build(table: RaidSpawnTable, budget: number): RaidComposition {
  const groups = prepare(table.groups);
  const initialVectors = table.initial.map(toVector);

  const budgetExpected = expectedCounts(groups, budget);

  // Work out how much exact-percentile work this budget implies before starting.
  const perUnits = BOT_ORDER.map((_, index) => cheapestPerUnit(groups, index));
  let plannedCells = 0;
  for (let index = 0; index < BOT_ORDER.length; index++) {
    const perUnit = perUnits[index];
    if (perUnit === undefined || !Number.isFinite(perUnit)) continue;
    plannedCells += distributionCells(budget, perUnit);
  }
  const hasExactRanges = plannedCells <= DISTRIBUTION_CELL_LIMIT;

  const estimates: BotEstimate[] = [];
  let expectedTotalBots = 0;
  let farmbot: FarmbotEstimate | null = null;

  for (let index = 0; index < BOT_ORDER.length; index++) {
    const id = BOT_ORDER[index];
    if (!id) continue;
    const bot = BOTS[id];
    const initialCounts = initialVectors.map((vector) => vector[index] ?? 0);

    const guaranteed = Math.min(...initialCounts);
    const expectedInitial =
      initialCounts.reduce((sum, value) => sum + value, 0) / initialCounts.length;
    const fromBudget = budgetExpected[index] ?? 0;
    const expected = expectedInitial + fromBudget;
    expectedTotalBots += expected;

    const perUnit = perUnits[index];
    const isFarmbot = index === FARMBOT_INDEX;
    const buyable = perUnit !== undefined && Number.isFinite(perUnit);

    // Farmbots always get an exact distribution; the rest get one when the
    // whole request fits inside the cell budget. A bot that no purchasable
    // group can yield has a degenerate distribution: zero extras, guaranteed.
    let extraDistribution: Float64Array | null = null;
    if (!buyable) {
      extraDistribution = Float64Array.of(1);
    } else if ((isFarmbot || hasExactRanges) && perUnit !== undefined) {
      extraDistribution = countDistribution(groups, budget, index, perUnit);
    }

    let range: CountRange | null = null;
    if (extraDistribution) {
      const totalDistribution = shiftByInitial(extraDistribution, initialCounts);
      range = { low: percentile(totalDistribution, 0.1), high: percentile(totalDistribution, 0.9) };

      if (isFarmbot) {
        const expectedExtra = mean(extraDistribution);
        farmbot = {
          guaranteed,
          expected: expectedInitial + expectedExtra,
          p10: range.low,
          p90: range.high,
          chanceOfExtra: 1 - (extraDistribution[0] ?? 0),
          expectedExtra,
        };
      }
    }

    estimates.push({ bot, guaranteed, expectedInitial, expected, range });
  }

  return {
    budget,
    estimates,
    farmbot,
    expectedTotalBots,
    hasExactRanges,
    initialVariants: table.initial.length,
  };
}

// Results are pure functions of (level table, budget), so caching them keeps
// typing responsive without ever changing an answer.
const cache = new Map<string, RaidComposition>();
const CACHE_LIMIT = 120;

/**
 * Expected composition of the raid a farm will trigger.
 *
 * `rawBudget` is the unrounded raid budget; the game spends whole points, so it
 * is floored before any group is purchased.
 */
export function calculateComposition(
  level: RaidLevel,
  rawBudget: number | null,
): RaidComposition | null {
  const table = spawnTableForLevel(level);
  if (!table || rawBudget === null) return null;

  const budget = Math.max(0, Math.floor(rawBudget));
  const key = `${table.id}:${budget}`;

  const cached = cache.get(key);
  if (cached) return cached;

  const composition = build(table, budget);

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, composition);

  return composition;
}
