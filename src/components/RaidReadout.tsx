import { raidDisplay, type RaidTier } from '../data/raid';
import { Odometer } from './Odometer';
import styles from './RaidReadout.module.css';

interface RaidReadoutProps {
  tier: RaidTier;
  totalValue: number;
  escalating: boolean;
  /** Sentence under the screen; lets the panel distinguish empty from no-raid. */
  summary: string;
}

export function RaidReadout({ tier, totalValue, escalating, summary }: RaidReadoutProps) {
  const { word, ordinal } = raidDisplay(tier);
  const lampCount = 3;

  return (
    <div className={styles.wrap}>
      <div
        className={`inset ${styles.screen}`}
        data-idle={tier.level === 0 || undefined}
        data-escalating={escalating || undefined}
      >
        <div className={styles.lamps} aria-hidden="true">
          {Array.from({ length: lampCount }, (_, index) => (
            <span className={styles.lamp} key={index} style={{ '--i': index } as React.CSSProperties} />
          ))}
        </div>

        <p className={styles.display}>
          <span className={styles.word}>{word}</span>
          {ordinal ? <span className={styles.ordinal}>{ordinal}</span> : null}
        </p>

        <p className={styles.threat}>
          <span className="label">Threat</span>
          <span className={styles.threatValue}>{tier.threat}</span>
        </p>
      </div>

      <p className={styles.summary}>{summary}</p>

      <div className={`inset ${styles.totalRow}`}>
        <span className="label">Total crop value</span>
        <span className={`tabular ${styles.totalValue}`}>
          <Odometer value={totalValue} />
          <span className={styles.totalUnit}>pts</span>
        </span>
      </div>
    </div>
  );
}
