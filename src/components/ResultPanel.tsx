import { useMemo, type RefObject } from 'react';
import type { PlayerCount } from '../data/raid';
import type { RaidResult } from '../lib/raidCalc';
import { calculateComposition } from '../lib/composition';
import { useTierEscalation } from '../hooks/useTierChange';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RaidReadout } from './RaidReadout';
import { TierGauge } from './TierGauge';
import { BudgetControls } from './BudgetControls';
import { BotLineup } from './BotLineup';
import { Bolt } from './Bolt';
import styles from './ResultPanel.module.css';

interface ResultPanelProps {
  result: RaidResult;
  players: PlayerCount;
  isEmpty: boolean;
  onPlayersChange: (players: PlayerCount) => void;
  readoutRef: RefObject<HTMLDivElement | null>;
}

export function ResultPanel({
  result,
  players,
  isEmpty,
  onPlayersChange,
  readoutRef,
}: ResultPanelProps) {
  const reducedMotion = useReducedMotion();
  const escalating = useTierEscalation(result.tier.level, !reducedMotion);
  const { tier } = result;

  // Solved deterministically and memoised per (level, floored budget), so the
  // figures never shift on an unrelated re-render.
  const composition = useMemo(
    () => calculateComposition(tier.level, result.rawBudget),
    [tier.level, result.rawBudget],
  );

  const summary =
    tier.level > 0
      ? tier.summary
      : isEmpty
        ? 'Nothing planted yet. Add crops on the left to see what your farm will attract.'
        : 'Only zero-value crops are planted. Nothing here registers as loot.';

  return (
    <aside
      className={`plate ${styles.panel}`}
      data-level={tier.level}
      data-escalating={escalating || undefined}
      aria-labelledby="result-panel-title"
    >
      <Bolt className={styles.boltTR} />
      <Bolt className={styles.boltBL} />

      <header className={styles.head}>
        <h2 className={styles.title} id="result-panel-title">
          Raid Forecast
        </h2>
        <span className={styles.live}>
          <span aria-hidden="true" className={styles.liveDot} />
          Live
        </span>
      </header>

      <hr className={`seam ${styles.seam}`} />

      <p role="status" className="visually-hidden">
        {tier.label}. Threat {tier.threat}.
      </p>

      <div className={styles.body}>
        <div ref={readoutRef}>
          <RaidReadout
            tier={tier}
            totalValue={result.totalValue}
            escalating={escalating}
            summary={summary}
          />
        </div>

        <TierGauge result={result} />

        <BudgetControls
          players={players}
          budget={result.budget}
          onPlayersChange={onPlayersChange}
        />

        <BotLineup pool={result.pool} newBots={result.newBots} composition={composition} />
      </div>
    </aside>
  );
}
