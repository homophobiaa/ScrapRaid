/**
 * Raid spawn tables.
 *
 * A raid is assembled in two stages:
 *
 *  1. An initial spawn group is placed for free. It does not consume the raid
 *     budget. Most levels have exactly one; level 4 picks between three with
 *     equal probability.
 *  2. The remaining budget is spent in a loop: every group the budget can still
 *     afford is entered into a weighted draw, the winner is added, its cost is
 *     subtracted, and the loop repeats until nothing is affordable.
 *
 * Mechanics source: https://steamcommunity.com/sharedfiles/filedetails/?id=3773250375
 */

import type { BotId } from './bots';
import type { RaidLevel } from './raid';

export type BotCounts = Partial<Record<BotId, number>>;

export interface RaidGroup {
  /** Budget consumed when this group is selected. */
  readonly cost: number;
  /** Relative draw weight among the groups currently affordable. */
  readonly weight: number;
  readonly bots: BotCounts;
}

/** A free opening wave. Levels with several are drawn from uniformly. */
export type InitialGroup = BotCounts;

/** Levels 5, 6 and 7 all draw from the same purchase table. */
const LATE_GAME_GROUPS: readonly RaidGroup[] = [
  { cost: 7, weight: 1, bots: { haybot: 1, 'green-totebot': 1 } },
  { cost: 14, weight: 10, bots: { haybot: 2, 'green-totebot': 2 } },
  { cost: 21, weight: 100, bots: { haybot: 3, 'green-totebot': 3 } },
  { cost: 21, weight: 100, bots: { 'blue-totebot': 3, 'green-totebot': 3 } },
  { cost: 36, weight: 100, bots: { 'yellow-totebot': 2, 'green-totebot': 3 } },
  { cost: 36, weight: 100, bots: { 'red-totebot': 2, 'green-totebot': 3 } },
  {
    cost: 31,
    weight: 100,
    bots: { 'green-tapebot': 3, 'yellow-tapebot': 2, 'green-totebot': 3 },
  },
  { cost: 56, weight: 80, bots: { 'blue-tapebot': 2, 'green-totebot': 3 } },
  { cost: 75, weight: 60, bots: { farmbot: 1 } },
] as const;

export interface RaidSpawnTable {
  /** Shared identity for levels that use the same tables, used as a cache key. */
  readonly id: string;
  readonly initial: readonly InitialGroup[];
  readonly groups: readonly RaidGroup[];
}

const TABLES: Readonly<Record<RaidLevel, RaidSpawnTable | null>> = {
  0: null,

  1: {
    id: 'L1',
    initial: [{ haybot: 1, 'green-totebot': 2 }],
    groups: [
      { cost: 2, weight: 1, bots: { 'green-totebot': 1 } },
      { cost: 4, weight: 10, bots: { 'green-totebot': 2 } },
      { cost: 5, weight: 100, bots: { haybot: 1 } },
      { cost: 9, weight: 100, bots: { haybot: 1, 'green-totebot': 2 } },
      { cost: 12, weight: 100, bots: { haybot: 2, 'green-totebot': 1 } },
    ],
  },

  2: {
    id: 'L2',
    initial: [{ haybot: 3, 'green-totebot': 2 }],
    groups: [
      { cost: 7, weight: 1, bots: { haybot: 1, 'green-totebot': 1 } },
      { cost: 12, weight: 10, bots: { haybot: 1, 'green-totebot': 1, 'blue-totebot': 1 } },
      { cost: 17, weight: 50, bots: { haybot: 2, 'green-totebot': 1, 'blue-totebot': 1 } },
      { cost: 19, weight: 100, bots: { haybot: 3, 'green-totebot': 2 } },
    ],
  },

  3: {
    id: 'L3',
    initial: [{ haybot: 3, 'green-totebot': 2, 'blue-totebot': 1 }],
    groups: [
      { cost: 7, weight: 1, bots: { haybot: 1, 'green-totebot': 1 } },
      { cost: 12, weight: 10, bots: { haybot: 1, 'green-totebot': 1, 'blue-totebot': 1 } },
      { cost: 17, weight: 50, bots: { haybot: 2, 'green-totebot': 1, 'blue-totebot': 1 } },
      { cost: 19, weight: 100, bots: { haybot: 3, 'green-totebot': 2 } },
      { cost: 24, weight: 50, bots: { 'red-totebot': 1, 'green-totebot': 1 } },
      {
        cost: 16,
        weight: 50,
        bots: { 'green-tapebot': 1, 'yellow-tapebot': 1, 'green-totebot': 1 },
      },
    ],
  },

  4: {
    id: 'L4',
    initial: [
      { haybot: 2, 'blue-totebot': 1, 'green-tapebot': 1, 'yellow-tapebot': 1 },
      { haybot: 2, 'green-totebot': 2, 'blue-totebot': 1, 'green-tapebot': 1 },
      { 'green-totebot': 2, 'red-totebot': 1 },
    ],
    groups: [
      { cost: 7, weight: 1, bots: { haybot: 1, 'green-totebot': 1 } },
      { cost: 12, weight: 10, bots: { haybot: 1, 'green-totebot': 1, 'blue-totebot': 1 } },
      { cost: 17, weight: 50, bots: { haybot: 2, 'green-totebot': 1, 'blue-totebot': 1 } },
      { cost: 19, weight: 100, bots: { haybot: 3, 'green-totebot': 2 } },
      { cost: 19, weight: 50, bots: { 'red-totebot': 1, 'green-totebot': 2 } },
      { cost: 19, weight: 50, bots: { 'yellow-totebot': 1, 'green-totebot': 2 } },
      {
        cost: 16,
        weight: 50,
        bots: { 'green-tapebot': 1, 'yellow-tapebot': 1, 'green-totebot': 3 },
      },
      {
        cost: 19,
        weight: 50,
        bots: { 'green-tapebot': 2, 'yellow-tapebot': 1, 'green-totebot': 2 },
      },
    ],
  },

  5: { id: 'L5', initial: [{ farmbot: 1 }], groups: LATE_GAME_GROUPS },
  6: { id: 'L6', initial: [{ farmbot: 1 }], groups: LATE_GAME_GROUPS },
  7: { id: 'L7', initial: [{ farmbot: 3 }], groups: LATE_GAME_GROUPS },
};

export const spawnTableForLevel = (level: RaidLevel): RaidSpawnTable | null => TABLES[level];

/** Farmbots placed for free by the opening wave, before any budget is spent. */
export const GUARANTEED_FARMBOTS: Readonly<Record<RaidLevel, number>> = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 1,
  6: 1,
  7: 3,
};
