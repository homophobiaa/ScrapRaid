import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { cropAssetUrl, MAX_CROP_QUANTITY, type Crop } from '../data/crops';
import { formatNumber } from '../lib/format';
import { useHoldRepeat } from '../hooks/useHoldRepeat';
import styles from './CropControl.module.css';

const MAX_INPUT_LENGTH = String(MAX_CROP_QUANTITY).length;

interface CropControlProps {
  crop: Crop;
  quantity: number;
  contribution: number;
  onSet: (value: number) => void;
  onAdjust: (delta: number) => void;
}

export function CropControl({ crop, quantity, contribution, onSet, onAdjust }: CropControlProps) {
  // While the field has focus the user's raw keystrokes win; otherwise the
  // committed quantity is the source of truth.
  const [draft, setDraft] = useState<string | null>(null);
  const [iconFailed, setIconFailed] = useState(false);

  const decrement = () => onAdjust(-1);
  const increment = () => onAdjust(1);
  const holdDecrement = useHoldRepeat(decrement);
  const holdIncrement = useHoldRepeat(increment);

  const isInert = crop.raidValue === 0;
  const inputId = `crop-${crop.id}`;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Digits only — negatives, decimals and NaN can never be entered.
    const digits = event.target.value.replace(/\D/g, '').slice(0, MAX_INPUT_LENGTH);
    setDraft(digits);
    onSet(digits === '' ? 0 : Number(digits));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setDraft(null);
      increment();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setDraft(null);
      decrement();
    }
  };

  return (
    <li
      className={styles.row}
      data-inert={isInert || undefined}
      data-active={quantity > 0 || undefined}
    >
      <div className={styles.top}>
        <span className={`inset ${styles.socket}`}>
          {iconFailed ? (
            <abbr className={styles.iconFallback} title={crop.name}>
              {crop.name.slice(0, 2).toUpperCase()}
            </abbr>
          ) : (
            <img
              className={styles.icon}
              src={cropAssetUrl(crop.id)}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              onError={() => setIconFailed(true)}
            />
          )}
        </span>

        <div className={styles.meta}>
          <label className={styles.name} htmlFor={inputId}>
            {crop.name}
          </label>
          <p className={styles.stats}>
            {isInert ? (
              <span className={styles.inertTag}>No raid value</span>
            ) : (
              <span className={styles.rate}>
                {formatNumber(crop.raidValue)} {crop.raidValue === 1 ? 'pt' : 'pts'} each
              </span>
            )}
            <span className={styles.divider} aria-hidden="true" />
            <span className={styles.harvest}>Yields {formatNumber(crop.harvestAmount)}</span>
          </p>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.step}
            aria-label={`Remove one ${crop.name}`}
            onClick={decrement}
            disabled={quantity === 0}
            {...holdDecrement}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <rect x="3.5" y="8.7" width="13" height="2.6" rx="0.6" fill="currentColor" />
            </svg>
          </button>

          <input
            id={inputId}
            className={`tabular ${styles.input}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            spellCheck={false}
            value={draft ?? String(quantity)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={(event) => event.currentTarget.select()}
            onBlur={() => setDraft(null)}
          />

          <button
            type="button"
            className={styles.step}
            aria-label={`Add one ${crop.name}`}
            onClick={increment}
            disabled={quantity >= MAX_CROP_QUANTITY}
            {...holdIncrement}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <rect x="3.5" y="8.7" width="13" height="2.6" rx="0.6" fill="currentColor" />
              <rect x="8.7" y="3.5" width="2.6" height="13" rx="0.6" fill="currentColor" />
            </svg>
          </button>
        </div>

        <output className={`tabular ${styles.contribution}`} htmlFor={inputId}>
          <span className={styles.contributionValue}>
            {isInert ? '—' : `+${formatNumber(contribution)}`}
          </span>
          <span className={styles.contributionLabel}>{isInert ? 'inert' : 'pts'}</span>
        </output>
      </div>
    </li>
  );
}
