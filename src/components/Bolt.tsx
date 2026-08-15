import styles from './Bolt.module.css';

/** Decorative panel bolt. Purely visual — hidden from assistive tech. */
export function Bolt({ className }: { className?: string | undefined }) {
  return <span aria-hidden="true" className={[styles.bolt, className].filter(Boolean).join(' ')} />;
}
