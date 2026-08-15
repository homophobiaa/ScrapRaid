/** Pure raid maths. No React, no DOM — everything here is derived from the tables in src/data. */

import { CROPS, type Crop, type FarmQuantities } from '../data/crops';
import { BOTS, type Bot, type BotId } from '../data/bots';
import {
  PLAYER_OPTIONS,
  RAID_TIERS,
  type PlayerCount,
  type RaidTier,
} from '../data/raid';

export interface CropContribution {
  readonly crop: Crop;
  readonly quantity: number;
  readonly value: number;
}

export interface RaidResult {
  readonly totalValue: number;
  readonly tier: RaidTier;
  /** The tier above the current one, or `null` at the top tier. */
  readonly nextTier: RaidTier | null;
  /** Exact points still needed to reach `nextTier`, or `null` at the top tier. */
  readonly pointsToNext: number | null;
  /** 0–1 position between this tier's floor and the next tier's floor. */
  readonly progress: number;
  /** True once the farm is in the open-ended top tier. */
  readonly isMaxTier: boolean;
  /** 0–1 position between the top tier's floor and the difficulty cap. */
  readonly cappedPressure: number;
  /** Every bot that can appear at this tier. */
  readonly pool: readonly Bot[];
  /** Bots that this tier added to the pool. */
  readonly newBots: readonly Bot[];
  /** Player-adjusted raid budget, or `null` when there is no raid. */
  readonly budget: number | null;
  /** Per-crop breakdown, ordered like the crop table. */
  readonly contributions: readonly CropContribution[];
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const clampQuantity = (value: number, max: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(0, Math.trunc(value)));
};

export const playerModifier = (players: PlayerCount): number =>
  PLAYER_OPTIONS.find((option) => option.id === players)?.modifier ?? 1;

export function totalCropValue(quantities: FarmQuantities): number {
  let total = 0;
  for (const crop of CROPS) {
    total += (quantities[crop.id] ?? 0) * crop.raidValue;
  }
  return total;
}

export function tierForValue(totalValue: number): RaidTier {
  // Tiers are ordered ascending, so the last tier whose floor we have reached wins.
  let match = RAID_TIERS[0] as RaidTier;
  for (const tier of RAID_TIERS) {
    if (totalValue >= tier.min) match = tier;
  }
  return match;
}

/** How far into its own tier a total sits, as a 0–1 fraction. */
export function tierFraction(totalValue: number, tier: RaidTier): number {
  if (!tier.interpolation) return 0;
  const { from, to } = tier.interpolation;
  if (to === from) return 0;
  return clamp01((totalValue - from) / (to - from));
}

/**
 * Raid budget for the current tier and player count.
 *
 * fraction × (maximumBudget − minimumBudget) + minimumBudget × playerModifier
 */
export function raidBudget(totalValue: number, tier: RaidTier, players: PlayerCount): number | null {
  if (!tier.budget) return null;
  const fraction = tierFraction(totalValue, tier);
  const { min, max } = tier.budget;
  return Math.round(fraction * (max - min) + min * playerModifier(players));
}

/** Every bot available at or below `level`, in unlock order. */
export function botPoolForLevel(level: number): readonly Bot[] {
  const ids: BotId[] = [];
  for (const tier of RAID_TIERS) {
    if (tier.level > level) break;
    for (const id of tier.unlocks) {
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids.map((id) => BOTS[id]);
}

export function calculateRaid(quantities: FarmQuantities, players: PlayerCount): RaidResult {
  const contributions = CROPS.map((crop) => {
    const quantity = quantities[crop.id] ?? 0;
    return { crop, quantity, value: quantity * crop.raidValue };
  });

  const totalValue = contributions.reduce((sum, entry) => sum + entry.value, 0);
  const tier = tierForValue(totalValue);
  const nextTier = RAID_TIERS.find((candidate) => candidate.level === tier.level + 1) ?? null;
  const isMaxTier = nextTier === null;

  const progress = (() => {
    if (isMaxTier || !nextTier) return 1;
    if (tier.level === 0) return 0;
    const span = nextTier.min - tier.min;
    return span <= 0 ? 0 : clamp01((totalValue - tier.min) / span);
  })();

  return {
    totalValue,
    tier,
    nextTier,
    pointsToNext: nextTier ? Math.max(0, nextTier.min - totalValue) : null,
    progress,
    isMaxTier,
    cappedPressure: isMaxTier ? tierFraction(totalValue, tier) : 0,
    pool: botPoolForLevel(tier.level),
    newBots: tier.unlocks.map((id) => BOTS[id]),
    budget: raidBudget(totalValue, tier, players),
    contributions,
  };
}
