import styles from './AppFooter.module.css';

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <hr className={`seam ${styles.seam}`} />
      <div className={styles.inner}>
        <p className={styles.line}>
          Developed by{' '}
          <a href="https://github.com/homophobiaa" target="_blank" rel="noopener noreferrer">
            homophobiaa
          </a>
        </p>
        <p className={styles.line}>
          Farming data source:{' '}
          <a
            href="https://scrapmechanic.fandom.com/wiki/Farming"
            target="_blank"
            rel="noopener noreferrer"
          >
            Official Scrap Mechanic Wiki
          </a>
        </p>
        <p className={styles.disclaimer}>
          Unofficial fan-made tool. Not affiliated with Axolot Games.
        </p>
      </div>
    </footer>
  );
}
