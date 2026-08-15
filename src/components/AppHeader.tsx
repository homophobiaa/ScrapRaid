import { Bolt } from './Bolt';
import styles from './AppHeader.module.css';

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Bolt className={styles.boltLeft} />
        <Bolt className={styles.boltRight} />

        <span aria-hidden="true" className={styles.mark}>
          <svg viewBox="0 0 40 44" focusable="false">
            <path
              d="M20 3 36 12v20L20 41 4 32V12z"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            <rect x="17" y="13" width="6" height="13" rx="1.2" fill="currentColor" />
            <rect x="17" y="29" width="6" height="5" rx="1.2" fill="currentColor" />
          </svg>
        </span>

        <div className={styles.brand}>
          <p className={styles.kicker}>Scrap Mechanic</p>
          <h1 className={styles.title}>Farm Raid Calculator</h1>
        </div>

        <p className={styles.status}>
          <span aria-hidden="true" className={styles.lamp} />
          Survival 1.0
        </p>
      </div>
      <hr className={`seam ${styles.seam}`} />
    </header>
  );
}
