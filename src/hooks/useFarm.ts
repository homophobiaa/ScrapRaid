import { useCallback, useEffect, useMemo, useState } from 'react';
import { MAX_CROP_QUANTITY, EMPTY_FARM, type FarmQuantities } from '../data/crops';
import type { PlayerCount } from '../data/raid';
import { clampQuantity } from '../lib/raidCalc';
import { DEFAULT_STATE, loadState, saveState } from '../lib/storage';

export interface FarmController {
  readonly quantities: FarmQuantities;
  readonly players: PlayerCount;
  readonly isEmpty: boolean;
  setQuantity: (cropId: string, value: number) => void;
  adjustQuantity: (cropId: string, delta: number) => void;
  setPlayers: (players: PlayerCount) => void;
  clearFarm: () => void;
}

export function useFarm(): FarmController {
  // Read storage once, during the initial render, so the first paint is already correct.
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    return loadState();
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setQuantity = useCallback((cropId: string, value: number) => {
    setState((current) => {
      const next = clampQuantity(value, MAX_CROP_QUANTITY);
      if (current.quantities[cropId] === next) return current;
      return { ...current, quantities: { ...current.quantities, [cropId]: next } };
    });
  }, []);

  const adjustQuantity = useCallback((cropId: string, delta: number) => {
    setState((current) => {
      const next = clampQuantity((current.quantities[cropId] ?? 0) + delta, MAX_CROP_QUANTITY);
      if (current.quantities[cropId] === next) return current;
      return { ...current, quantities: { ...current.quantities, [cropId]: next } };
    });
  }, []);

  const setPlayers = useCallback((players: PlayerCount) => {
    setState((current) => (current.players === players ? current : { ...current, players }));
  }, []);

  const clearFarm = useCallback(() => {
    setState((current) => ({ ...current, quantities: { ...EMPTY_FARM } }));
  }, []);

  const isEmpty = useMemo(
    () => Object.values(state.quantities).every((quantity) => quantity === 0),
    [state.quantities],
  );

  return {
    quantities: state.quantities,
    players: state.players,
    isEmpty,
    setQuantity,
    adjustQuantity,
    setPlayers,
    clearFarm,
  };
}
