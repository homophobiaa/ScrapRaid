import { DIFFICULTY_CAP } from '../data/raid';
import { formatNumber } from '../lib/format';
import type { RaidResult } from '../lib/raidCalc';
import styles from './TierGauge.module.css';

export function TierGauge({ result }: { result: RaidResult }) {
  const { tier, nextTier, pointsToNext, progress, isMaxTier, cappedPressure, totalValue } = result;
  const fraction = isMaxTier ? cappedPressure : progress;
  const percent = Math.round(fraction * 100);

  const floor = isMaxTier ? tier.min : tier.level === 0 ? 0 : tier.min;
  const ceiling = isMaxTier ? DIFFICULTY_CAP : (nextTier?.min ?? 0);

  return (
    <section className={styles.gauge} data-capped={isMaxTier || undefined}>
      <header className={styles.head}>
        <h3 className="label">{isMaxTier ? 'Maximum pressure' : 'Progress to next level'}</h3>
        <span className={`tabular ${styles.percent}`}>{percent}%</span>
      </header>

      <div className={styles.rail} aria-hidden="true">
        <span className={styles.pointer} style={{ '--fraction': fraction } as React.CSSProperties} />
      </div>

      <div
        className={`inset ${styles.track}`}
        role="progressbar"
        aria-valuemin={floor}
        aria-valuemax={ceiling}
        aria-valuenow={Math.min(totalValue, ceiling)}
        aria-valuetext={
          isMaxTier
            ? `${formatNumber(totalValue)} of ${formatNumber(DIFFICULTY_CAP)} points, scaling capped`
            : `${formatNumber(totalValue)} points, ${percent}% of the way to ${nextTier?.label ?? ''}`
        }
      >
        <span className={styles.fill} style={{ '--fraction': fraction } as React.CSSProperties} />
        <span className={styles.ticks} aria-hidden="true" />
      </div>

      <div className={`tabular ${styles.scale}`} aria-hidden="true">
        <span>{formatNumber(floor)}</span>
        <span>{formatNumber(ceiling)}</span>
      </div>

      {isMaxTier ? (
        <p className={styles.capNote}>
          Difficulty scaling stops at <strong>{formatNumber(DIFFICULTY_CAP)}</strong> pts. Anything
          above that raids at the same maximum strength.
        </p>
      ) : (
        <p className={styles.remaining}>
          <strong className="tabular">{formatNumber(pointsToNext ?? 0)}</strong>
          <span className={styles.remainingUnit}>
            {pointsToNext === 1 ? 'pt' : 'pts'} until {nextTier?.label ?? ''}
          </span>
        </p>
      )}
    </section>
  );
}
