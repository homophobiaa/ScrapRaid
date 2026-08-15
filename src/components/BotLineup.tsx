import { useState } from 'react';
import { botAssetUrl, type Bot } from '../data/bots';
import { RANDOMNESS_NOTE } from '../data/raid';
import styles from './BotLineup.module.css';

function BotCard({ bot, isNew, index }: { bot: Bot; isNew: boolean; index: number }) {
  const [failed, setFailed] = useState(false);

  return (
    <li
      className={styles.card}
      data-new={isNew || undefined}
      style={{ '--i': index } as React.CSSProperties}
    >
      <span className={`inset ${styles.viewport}`}>
        {failed ? (
          <span className={styles.fallback}>
            <span className={styles.fallbackCode}>{bot.abbr}</span>
            <span className={styles.fallbackFamily}>{bot.family}</span>
          </span>
        ) : (
          <img
            className={styles.image}
            src={botAssetUrl(bot.id)}
            alt=""
            width={512}
            height={512}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
      </span>

      <span className={styles.name}>{bot.name}</span>
      <span className={styles.note}>{bot.note}</span>
      {isNew ? <span className={styles.newTag}>New</span> : null}
    </li>
  );
}

interface BotLineupProps {
  pool: readonly Bot[];
  newBots: readonly Bot[];
}

export function BotLineup({ pool, newBots }: BotLineupProps) {
  const newIds = new Set(newBots.map((bot) => bot.id));

  if (pool.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="bot-lineup-title">
        <header className={styles.head}>
          <h3 className="label" id="bot-lineup-title">
            Hostile units
          </h3>
        </header>
        <p className={`inset ${styles.none}`}>
          No bots will spawn. Plant something with raid value to see the lineup.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="bot-lineup-title">
      <header className={styles.head}>
        <h3 className="label" id="bot-lineup-title">
          Hostile units
        </h3>
        <span className={styles.count}>
          {pool.length} in pool
          {newIds.size > 0 ? ` · ${newIds.size} new` : ''}
        </span>
      </header>

      <ul className={styles.grid}>
        {pool.map((bot, index) => (
          <BotCard key={bot.id} bot={bot} isNew={newIds.has(bot.id)} index={index} />
        ))}
      </ul>

      {newIds.size === 0 ? (
        <p className={styles.poolNote}>
          No new unit types at this level — the same roster arrives in larger, denser groups.
        </p>
      ) : null}

      <p className={styles.disclaimer}>
        <span aria-hidden="true" className={styles.disclaimerMark} />
        {RANDOMNESS_NOTE}
      </p>
    </section>
  );
}
