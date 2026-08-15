import { useEffect, useState } from 'react';
import type { CropContribution } from '../lib/raidCalc';
import { formatNumber, pluralize } from '../lib/format';
import { CropControl } from './CropControl';
import { Bolt } from './Bolt';
import styles from './CropConsole.module.css';

interface CropConsoleProps {
  contributions: readonly CropContribution[];
  isEmpty: boolean;
  onSet: (cropId: string, value: number) => void;
  onAdjust: (cropId: string, delta: number) => void;
  onClear: () => void;
}

export function CropConsole({
  contributions,
  isEmpty,
  onSet,
  onAdjust,
  onClear,
}: CropConsoleProps) {
  const [confirming, setConfirming] = useState(false);

  // A cleared farm has nothing left to confirm.
  useEffect(() => {
    if (isEmpty) setConfirming(false);
  }, [isEmpty]);

  useEffect(() => {
    if (!confirming) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirming(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirming]);

  const plantedKinds = contributions.filter((entry) => entry.quantity > 0).length;
  const plantedTotal = contributions.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <section className={`plate ${styles.console}`} aria-labelledby="crop-console-title">
      <Bolt className={styles.boltTL} />
      <Bolt className={styles.boltTR} />

      <div className={styles.head}>
        <div className={styles.headText}>
          <h2 className={styles.title} id="crop-console-title">
            Planted Crops
          </h2>
          <p className={styles.subtitle}>
            {isEmpty
              ? 'Enter how many of each crop you have planted.'
              : `${pluralize(plantedTotal, 'plant')} across ${pluralize(plantedKinds, 'crop type')}`}
          </p>
        </div>

        {confirming ? (
          <div className={styles.confirm} role="group" aria-label="Confirm clearing the farm">
            <span className={styles.confirmText}>Clear all?</span>
            <button type="button" className={styles.confirmYes} onClick={onClear} autoFocus>
              Clear
            </button>
            <button type="button" className={styles.confirmNo} onClick={() => setConfirming(false)}>
              Keep
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.clear}
            onClick={() => setConfirming(true)}
            disabled={isEmpty}
          >
            Clear Farm
          </button>
        )}
      </div>

      <hr className={`seam ${styles.seam}`} />

      <ul className={styles.grid}>
        {contributions.map(({ crop, quantity, value }) => (
          <CropControl
            key={crop.id}
            crop={crop}
            quantity={quantity}
            contribution={value}
            onSet={(next) => onSet(crop.id, next)}
            onAdjust={(delta) => onAdjust(crop.id, delta)}
          />
        ))}
      </ul>

      <p className={styles.footnote}>
        Cotton and pigment flowers are safe to farm at any scale — they add{' '}
        <strong>{formatNumber(0)}</strong> raid pressure.
      </p>
    </section>
  );
}
