/** localStorage persistence for the farm. Every read is defensive — stored data may be stale or hand-edited. */

import { CROPS, EMPTY_FARM, MAX_CROP_QUANTITY, type FarmQuantities } from '../data/crops';
import { PLAYER_OPTIONS, type PlayerCount } from '../data/raid';
import { clampQuantity } from './raidCalc';

const STORAGE_KEY = 'scrapraid.farm.v1';

export interface SavedState {
  readonly quantities: FarmQuantities;
  readonly players: PlayerCount;
}

export const DEFAULT_STATE: SavedState = { quantities: EMPTY_FARM, players: '1' };

const isPlayerCount = (value: unknown): value is PlayerCount =>
  PLAYER_OPTIONS.some((option) => option.id === value);

/** Rebuild a known-good farm from arbitrary parsed JSON, dropping anything unrecognised. */
function sanitize(raw: unknown): SavedState {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_STATE;
  const record = raw as Record<string, unknown>;

  const storedQuantities =
    typeof record['quantities'] === 'object' && record['quantities'] !== null
      ? (record['quantities'] as Record<string, unknown>)
      : {};

  const quantities: Record<string, number> = {};
  for (const crop of CROPS) {
    const value = storedQuantities[crop.id];
    quantities[crop.id] = clampQuantity(typeof value === 'number' ? value : 0, MAX_CROP_QUANTITY);
  }

  return {
    quantities,
    players: isPlayerCount(record['players']) ? record['players'] : DEFAULT_STATE.players,
  };
}

export function loadState(): SavedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_STATE;
  } catch {
    // Private browsing, disabled storage or corrupt JSON — start clean.
    return DEFAULT_STATE;
  }
}

export function saveState(state: SavedState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is a convenience; never let it break the calculator.
  }
}
