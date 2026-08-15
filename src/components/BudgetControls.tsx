import { PLAYER_OPTIONS, type PlayerCount } from '../data/raid';
import { Odometer } from './Odometer';
import styles from './BudgetControls.module.css';

interface BudgetControlsProps {
  players: PlayerCount;
  budget: number | null;
  onPlayersChange: (players: PlayerCount) => void;
}

export function BudgetControls({ players, budget, onPlayersChange }: BudgetControlsProps) {
  const active = PLAYER_OPTIONS.find((option) => option.id === players) ?? PLAYER_OPTIONS[0];

  return (
    <section className={styles.section}>
      <fieldset className={styles.players}>
        <legend className={`label ${styles.legend}`}>Players</legend>
        <div className={`inset ${styles.segmented}`}>
          {PLAYER_OPTIONS.map((option) => (
            <label className={styles.segment} key={option.id} data-selected={players === option.id || undefined}>
              <input
                className="visually-hidden"
                type="radio"
                name="player-count"
                value={option.id}
                aria-label={option.srLabel}
                checked={players === option.id}
                onChange={() => onPlayersChange(option.id)}
              />
              <span className={styles.face} aria-hidden="true">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={`inset ${styles.budget}`}>
        <div className={styles.budgetMeta}>
          <span className="label">Raid budget</span>
          <span className={styles.modifier}>×{active?.modifier ?? 1} player scaling</span>
        </div>
        <span className={`tabular ${styles.budgetValue}`}>
          {budget === null ? (
            <span className={styles.budgetNone}>—</span>
          ) : (
            <Odometer value={budget} prefix="~" />
          )}
        </span>
      </div>
    </section>
  );
}
