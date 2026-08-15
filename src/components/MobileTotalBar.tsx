import { raidDisplay, type RaidTier } from '../data/raid';
import { formatNumber } from '../lib/format';
import styles from './MobileTotalBar.module.css';

interface MobileTotalBarProps {
  tier: RaidTier;
  totalValue: number;
  pointsToNext: number | null;
  nextLabel: string | null;
  /** Hidden while the full readout is already on screen. */
  hidden: boolean;
  onJumpToForecast: () => void;
}

export function MobileTotalBar({
  tier,
  totalValue,
  pointsToNext,
  nextLabel,
  hidden,
  onJumpToForecast,
}: MobileTotalBarProps) {
  const { word, ordinal } = raidDisplay(tier);

  return (
    <div
      className={styles.bar}
      data-level={tier.level}
      data-hidden={hidden || undefined}
      aria-hidden={hidden}
    >
      <button
        type="button"
        className={styles.inner}
        onClick={onJumpToForecast}
        tabIndex={hidden ? -1 : 0}
        aria-label={`Current result: ${tier.label}, ${formatNumber(totalValue)} points. Jump to the full raid forecast.`}
      >
        <span className={styles.level}>
          <span className={styles.word}>{word}</span>
          {ordinal ? <span className={styles.ordinal}>{ordinal}</span> : null}
        </span>

        <span className={styles.divider} aria-hidden="true" />

        <span className={styles.total}>
          <span className={`tabular ${styles.totalValue}`}>{formatNumber(totalValue)}</span>
          <span className={styles.totalLabel}>pts</span>
        </span>

        {pointsToNext !== null && nextLabel ? (
          <span className={styles.next}>
            <span className="tabular">{formatNumber(pointsToNext)}</span> to {nextLabel}
          </span>
        ) : (
          <span className={styles.next}>Max pressure</span>
        )}

        <svg className={styles.chevron} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            d="M4 10.5 8 6l4 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
