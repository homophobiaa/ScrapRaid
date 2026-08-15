import { describe, expect, it } from 'vitest';
import { calculateComposition } from './composition';
import { spawnTableForLevel, GUARANTEED_FARMBOTS, type RaidSpawnTable } from '../data/raidGroups';
import type { BotId } from '../data/bots';
import type { RaidLevel } from '../data/raid';
import { RAID_TIERS } from '../data/raid';
import { calculateRaid } from './raidCalc';
import { CROPS, EMPTY_FARM } from '../data/crops';

const LEVELS: RaidLevel[] = [1, 2, 3, 4, 5, 6, 7];

const estimateFor = (level: RaidLevel, budget: number, id: BotId) => {
  const composition = calculateComposition(level, budget);
  expect(composition).not.toBeNull();
  const estimate = composition?.estimates.find((entry) => entry.bot.id === id);
  expect(estimate).toBeDefined();
  return estimate!;
};

/* ------------------------------------------------------------------ *
 * Independent Monte Carlo model of the documented raid process.
 * The engine solves this exactly; simulating it separately proves the
 * recurrence models the right process rather than merely being stable.
 * ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulateOnce(table: RaidSpawnTable, budget: number, random: () => number): number {
  // Opening wave: uniform choice between the level's possible groups.
  const opening = table.initial[Math.floor(random() * table.initial.length)] ?? {};
  let farmbots = opening.farmbot ?? 0;

  let remaining = budget;
  for (;;) {
    const affordable = table.groups.filter((group) => group.cost <= remaining);
    if (affordable.length === 0) break;

    const totalWeight = affordable.reduce((sum, group) => sum + group.weight, 0);
    let roll = random() * totalWeight;
    let chosen = affordable[affordable.length - 1]!;
    for (const group of affordable) {
      roll -= group.weight;
      if (roll <= 0) {
        chosen = group;
        break;
      }
    }

    farmbots += chosen.bots.farmbot ?? 0;
    remaining -= chosen.cost;
  }
  return farmbots;
}

function simulateFarmbots(level: RaidLevel, budget: number, runs: number, seed: number) {
  const table = spawnTableForLevel(level)!;
  const random = mulberry32(seed);
  const counts: number[] = [];
  let total = 0;
  for (let i = 0; i < runs; i++) {
    const value = simulateOnce(table, budget, random);
    counts.push(value);
    total += value;
  }
  counts.sort((a, b) => a - b);
  return {
    mean: total / runs,
    p10: counts[Math.floor(runs * 0.1)]!,
    p90: counts[Math.floor(runs * 0.9)]!,
  };
}

/* ------------------------------------------------------------------ */

describe('guaranteed Farmbots by raid level', () => {
  it('reports exactly zero Farmbots at levels 1 to 4', () => {
    for (const level of [1, 2, 3, 4] as RaidLevel[]) {
      const budget = 5000; // Deliberately huge: no budget can buy a Farmbot here.
      const farmbot = estimateFor(level, budget, 'farmbot');
      expect(farmbot.guaranteed).toBe(0);
      expect(farmbot.expected).toBe(0);
      expect(farmbot.range).toEqual({ low: 0, high: 0 });

      const composition = calculateComposition(level, budget)!;
      expect(composition.farmbot?.chanceOfExtra).toBe(0);
      expect(composition.farmbot?.expected).toBe(0);
    }
  });

  it('guarantees one Farmbot at levels 5 and 6', () => {
    for (const level of [5, 6] as RaidLevel[]) {
      const composition = calculateComposition(level, 400)!;
      expect(composition.farmbot?.guaranteed).toBe(1);
      expect(GUARANTEED_FARMBOTS[level]).toBe(1);
      // The guarantee is a floor: the 10th percentile can never fall below it.
      expect(composition.farmbot!.p10).toBeGreaterThanOrEqual(1);
      expect(composition.farmbot!.expected).toBeGreaterThan(1);
    }
  });

  it('guarantees three Farmbots at level 7', () => {
    const composition = calculateComposition(7, 1200)!;
    expect(composition.farmbot?.guaranteed).toBe(3);
    expect(GUARANTEED_FARMBOTS[7]).toBe(3);
    expect(composition.farmbot!.p10).toBeGreaterThanOrEqual(3);
    expect(composition.farmbot!.expected).toBeGreaterThan(3);
  });

  it('never lets a budget below the Farmbot group cost buy an extra one', () => {
    // The Farmbot group costs 75, so a 74 budget can only ever yield the opening wave.
    const composition = calculateComposition(5, 74)!;
    expect(composition.farmbot!.chanceOfExtra).toBe(0);
    expect(composition.farmbot!.expected).toBe(1);
    expect(composition.farmbot!.p90).toBe(1);
  });
});

describe('Farmbot estimates match an independent simulation', () => {
  const cases: Array<{ level: RaidLevel; budget: number }> = [
    { level: 5, budget: 300 },
    { level: 5, budget: 800 },
    { level: 6, budget: 600 },
    { level: 7, budget: 1000 },
    { level: 7, budget: 2000 },
  ];

  for (const { level, budget } of cases) {
    it(`level ${level} at budget ${budget}`, () => {
      const composition = calculateComposition(level, budget)!;
      const farmbot = composition.farmbot!;
      const simulated = simulateFarmbots(level, budget, 40_000, 0x5ca1ab1e + budget);

      // Within 3% of the simulated mean, and never off by more than a third of a bot.
      const tolerance = Math.max(0.33, simulated.mean * 0.03);
      expect(Math.abs(farmbot.expected - simulated.mean)).toBeLessThan(tolerance);

      // Exact percentiles should land on the simulated ones, give or take one bot.
      expect(Math.abs(farmbot.p10 - simulated.p10)).toBeLessThanOrEqual(1);
      expect(Math.abs(farmbot.p90 - simulated.p90)).toBeLessThanOrEqual(1);
      expect(farmbot.p10).toBeLessThanOrEqual(farmbot.p90);
    });
  }
});

describe('estimates are deterministic and internally consistent', () => {
  it('returns identical numbers on repeated calls', () => {
    const first = calculateComposition(7, 1500)!;
    const second = calculateComposition(7, 1500)!;
    expect(second.farmbot).toEqual(first.farmbot);
    expect(second.estimates.map((entry) => entry.expected)).toEqual(
      first.estimates.map((entry) => entry.expected),
    );
  });

  it('keeps the expected value inside the 10th-90th percentile band', () => {
    for (const level of LEVELS) {
      const composition = calculateComposition(level, 500)!;
      for (const estimate of composition.estimates) {
        if (!estimate.range) continue;
        expect(estimate.expected).toBeGreaterThanOrEqual(estimate.range.low - 1e-9);
        expect(estimate.expected).toBeLessThanOrEqual(estimate.range.high + 1e-9);
        expect(estimate.guaranteed).toBeLessThanOrEqual(estimate.expected + 1e-9);
      }
    }
  });

  it('probabilities stay within [0, 1]', () => {
    for (const level of LEVELS) {
      for (const budget of [0, 50, 300, 1200]) {
        const chance = calculateComposition(level, budget)!.farmbot!.chanceOfExtra;
        expect(chance).toBeGreaterThanOrEqual(0);
        expect(chance).toBeLessThanOrEqual(1);
      }
    }
  });

  it('spends the floor of a fractional budget', () => {
    expect(calculateComposition(7, 1200.9)).toEqual(calculateComposition(7, 1200));
  });

  it('buys nothing when no group is affordable', () => {
    // Level 5's cheapest group costs 7.
    const composition = calculateComposition(5, 6)!;
    expect(composition.expectedTotalBots).toBe(1); // The opening Farmbot only.
    expect(composition.farmbot!.expected).toBe(1);
  });
});

describe('estimates scale with budget', () => {
  it('grows monotonically as the budget rises', () => {
    let previous = -1;
    for (const budget of [100, 300, 600, 1200, 2400]) {
      const total = calculateComposition(7, budget)!.expectedTotalBots;
      expect(total).toBeGreaterThan(previous);
      previous = total;
    }
  });

  it('produces more Farmbots at a higher budget', () => {
    const low = calculateComposition(7, 800)!.farmbot!.expected;
    const high = calculateComposition(7, 3000)!.farmbot!.expected;
    expect(high).toBeGreaterThan(low);
  });
});

describe('composition responds to crop value and player count', () => {
  const farmWith = (cropId: string, quantity: number) => ({
    ...EMPTY_FARM,
    [cropId]: quantity,
  });

  const compositionFor = (cropId: string, quantity: number, players: '1' | '2' | '3+') => {
    const result = calculateRaid(farmWith(cropId, quantity), players);
    return {
      result,
      composition: calculateComposition(result.tier.level, result.rawBudget),
    };
  };

  it('adds bots as crop value climbs within a tier', () => {
    // Both land in level 7, so only the budget fraction differs.
    const low = compositionFor('pineapple', 11, '1');
    const high = compositionFor('pineapple', 40, '1');
    expect(low.result.tier.level).toBe(7);
    expect(high.result.tier.level).toBe(7);
    expect(high.composition!.expectedTotalBots).toBeGreaterThan(
      low.composition!.expectedTotalBots,
    );
    expect(high.composition!.farmbot!.expected).toBeGreaterThan(
      low.composition!.farmbot!.expected,
    );
  });

  it('adds bots as the party grows', () => {
    const solo = compositionFor('pineapple', 20, '1');
    const duo = compositionFor('pineapple', 20, '2');
    const squad = compositionFor('pineapple', 20, '3+');

    expect(solo.composition!.budget).toBeLessThan(duo.composition!.budget);
    expect(duo.composition!.budget).toBeLessThan(squad.composition!.budget);
    expect(squad.composition!.expectedTotalBots).toBeGreaterThan(
      duo.composition!.expectedTotalBots,
    );
    expect(duo.composition!.expectedTotalBots).toBeGreaterThan(
      solo.composition!.expectedTotalBots,
    );
  });

  it('has no composition at all without a raid', () => {
    const result = calculateRaid(EMPTY_FARM, '1');
    expect(result.tier.level).toBe(0);
    expect(calculateComposition(result.tier.level, result.rawBudget)).toBeNull();
  });

  it('only ever offers bots that the tier has actually unlocked', () => {
    for (const tier of RAID_TIERS) {
      if (tier.level === 0) continue;
      const result = calculateRaid({ ...EMPTY_FARM, potato: tier.min }, '3+');
      const composition = calculateComposition(result.tier.level, result.rawBudget)!;
      const poolIds = new Set(result.pool.map((bot) => bot.id));
      for (const estimate of composition.estimates) {
        if (estimate.expected > 0) expect(poolIds.has(estimate.bot.id)).toBe(true);
      }
    }
  });

  it('covers every crop id with an asset-backed entry', () => {
    expect(CROPS).toHaveLength(12);
    expect(new Set(CROPS.map((crop) => crop.id)).size).toBe(12);
  });
});
