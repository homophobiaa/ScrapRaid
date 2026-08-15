/**
 * Raid tier table, bot unlocks and raid budget ranges.
 *
 * Every threshold and budget number lives here — nothing in the UI hardcodes
 * a raid number of its own.
 *
 * Note the boundary between the top two tiers: 10,000 is still level 6, and
 * level 7 (Super Raid) starts at 10,001.
 */

import type { BotId } from './bots';

export type RaidLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface BudgetRange {
  readonly min: number;
  readonly max: number;
}

export interface RaidTier {
  readonly level: RaidLevel;
  /** Industrial readout label, e.g. `RAID 03`. */
  readonly label: string;
  /** Lowest total crop value that lands in this tier. */
  readonly min: number;
  /** Highest total crop value in this tier; `null` on the open-ended top tier. */
  readonly max: number | null;
  readonly threat: string;
  readonly summary: string;
  /**
   * Range used to work out how far into the tier the farm sits. Level 1 starts
   * its interpolation at 0 rather than at its own minimum, and the top tier
   * runs up to the difficulty cap.
   */
  readonly interpolation: { readonly from: number; readonly to: number } | null;
  readonly budget: BudgetRange | null;
  /** Bots that become available for the first time at this tier. */
  readonly unlocks: readonly BotId[];
}

/** Difficulty and budget scaling stop rising past this total crop value. */
export const DIFFICULTY_CAP = 100_000;

export const RAID_TIERS: readonly RaidTier[] = [
  {
    level: 0,
    label: 'NO RAID',
    min: 0,
    max: 0,
    threat: 'Dormant',
    summary: 'Nothing on this farm registers as loot. No bots will come.',
    interpolation: null,
    budget: null,
    unlocks: [],
  },
  {
    level: 1,
    label: 'RAID 01',
    min: 1,
    max: 49,
    threat: 'Minimal',
    summary: 'A token probe. A single wall and a spudgun will hold.',
    interpolation: { from: 0, to: 50 },
    budget: { min: 2, max: 30 },
    unlocks: ['green-totebot', 'haybot'],
  },
  {
    level: 2,
    label: 'RAID 02',
    min: 50,
    max: 99,
    threat: 'Low',
    summary: 'Small mixed group. Tougher totebots start showing up.',
    interpolation: { from: 50, to: 100 },
    budget: { min: 20, max: 50 },
    unlocks: ['blue-totebot'],
  },
  {
    level: 3,
    label: 'RAID 03',
    min: 100,
    max: 549,
    threat: 'Moderate',
    summary: 'Ranged tapebots and explosive barrels enter the pool.',
    interpolation: { from: 100, to: 550 },
    budget: { min: 75, max: 135 },
    unlocks: ['red-totebot', 'green-tapebot', 'yellow-tapebot'],
  },
  {
    level: 4,
    label: 'RAID 04',
    min: 550,
    max: 999,
    threat: 'Elevated',
    summary: 'Heavy crawlers join. Expect sustained pressure on your walls.',
    interpolation: { from: 550, to: 1000 },
    budget: { min: 125, max: 200 },
    unlocks: ['yellow-totebot'],
  },
  {
    level: 5,
    label: 'RAID 05',
    min: 1000,
    max: 5499,
    threat: 'High',
    summary: 'Full roster unlocked. Farmbots and blue tapebots hit hard.',
    interpolation: { from: 1000, to: 5500 },
    budget: { min: 300, max: 500 },
    unlocks: ['blue-tapebot', 'farmbot'],
  },
  {
    level: 6,
    label: 'RAID 06',
    min: 5500,
    max: 10_000,
    threat: 'Severe',
    summary: 'Same roster as level 5, spent in far larger groups.',
    interpolation: { from: 5500, to: 10_001 },
    budget: { min: 500, max: 700 },
    unlocks: [],
  },
  {
    level: 7,
    label: 'SUPER RAID 07',
    min: 10_001,
    max: null,
    threat: 'Maximum',
    summary: 'Top tier. Budget climbs until your crop value reaches the cap.',
    interpolation: { from: 10_001, to: DIFFICULTY_CAP },
    budget: { min: 1000, max: 5000 },
    unlocks: [],
  },
] as const;

/**
 * Splits a tier label into the parts the industrial readout draws separately:
 * the word block and the large two-digit ordinal.
 */
export function raidDisplay(tier: RaidTier): { word: string; ordinal: string | null } {
  if (tier.level === 0) return { word: 'No Raid', ordinal: null };
  const word = tier.level === 7 ? 'Super Raid' : 'Raid';
  return { word, ordinal: String(tier.level).padStart(2, '0') };
}

export type PlayerCount = '1' | '2' | '3+';

export interface PlayerOption {
  readonly id: PlayerCount;
  readonly label: string;
  readonly srLabel: string;
  readonly modifier: number;
}

export const PLAYER_OPTIONS: readonly PlayerOption[] = [
  { id: '1', label: '1', srLabel: '1 player', modifier: 1 },
  { id: '2', label: '2', srLabel: '2 players', modifier: 1.5 },
  { id: '3+', label: '3+', srLabel: '3 or more players', modifier: 2 },
] as const;

export const RANDOMNESS_NOTE =
  'The game spends this budget using weighted random bot groups, so the exact raid composition can vary.';
