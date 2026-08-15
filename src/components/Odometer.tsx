import { useMemo } from 'react';
import { formatNumber } from '../lib/format';
import { useReducedMotion } from '../hooks/useReducedMotion';
import styles from './Odometer.module.css';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface OdometerProps {
  value: number;
  /** Optional prefix rendered inside the same readout, e.g. "~". */
  prefix?: string | undefined;
  className?: string | undefined;
}

/**
 * Thousands-separated number whose digits roll into place like a mechanical
 * counter. The rolling strip is decorative; the plain value is exposed to
 * assistive tech as ordinary text.
 */
export function Odometer({ value, prefix = '', className }: OdometerProps) {
  const reducedMotion = useReducedMotion();
  const characters = useMemo(() => formatNumber(value).split(''), [value]);
  const text = `${prefix}${formatNumber(value)}`;

  return (
    <span className={[styles.odometer, reducedMotion ? styles.still : '', className]
      .filter(Boolean)
      .join(' ')}
    >
      <span className="visually-hidden">{text}</span>
      <span className={styles.track} aria-hidden="true">
        {prefix ? <span className={styles.separator}>{prefix}</span> : null}
        {characters.map((character, index) => {
          const digit = DIGITS.indexOf(character);
          const key = `${index}-${characters.length}`;

          if (digit < 0) {
            return (
              <span className={styles.separator} key={key}>
                {character}
              </span>
            );
          }

          return (
            <span className={styles.slot} key={key}>
              <span
                className={styles.strip}
                style={
                  {
                    '--digit': digit,
                    '--index': characters.length - index - 1,
                  } as React.CSSProperties
                }
              >
                {DIGITS.map((numeral) => (
                  <span className={styles.digit} key={numeral}>
                    {numeral}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
