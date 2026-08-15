import { useState } from 'react';
import { botAssetUrl, type Bot } from '../data/bots';
import { RANDOMNESS_NOTE } from '../data/raid';
import type { BotEstimate, RaidComposition } from '../lib/composition';
import { formatNumber } from '../lib/format';
import styles from './BotLineup.module.css';

/** One decimal, but whole numbers stay whole so "0" never reads as "0.0". */
const formatExpected = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const formatRange = (low: number, high: number): string =>
  low === high ? String(low) : `${low}–${high}`;

function BotCard({
  bot,
  estimate,
  isNew,
  index,
}: {
  bot: Bot;
  estimate: BotEstimate | undefined;
  isNew: boolean;
  index: number;
}) {
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

      <div className={styles.figures}>
        {estimate ? (
          <>
            <span className={`tabular ${styles.expected}`}>
              <span className={styles.approx} aria-hidden="true">
                ≈
              </span>
              {formatExpected(estimate.expected)}
            </span>
            {estimate.range ? (
              <span className={`tabular ${styles.range}`}>
                {formatRange(estimate.range.low, estimate.range.high)} typical
              </span>
            ) : null}
          </>
        ) : null}

        <span className={styles.name}>{bot.name}</span>

        {estimate && estimate.guaranteed > 0 ? (
          <span className={styles.guaranteed}>{estimate.guaranteed} guaranteed</span>
        ) : (
          <span className={styles.note}>{bot.note}</span>
        )}
      </div>

      {isNew ? <span className={styles.newTag}>New</span> : null}
    </li>
  );
}

function FarmbotHighlight({ composition }: { composition: RaidComposition }) {
  const [failed, setFailed] = useState(false);

  const { farmbot } = composition;
  if (!farmbot) return null;

  const chance = Math.round(farmbot.chanceOfExtra * 100);

  return (
    <div className={styles.farmbot}>
      <span className={`inset ${styles.farmbotViewport}`}>
        {failed ? (
          <span className={styles.fallbackCode}>FARM</span>
        ) : (
          <img
            className={styles.farmbotImage}
            src={botAssetUrl('farmbot')}
            alt=""
            width={512}
            height={512}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
      </span>

      <div className={styles.farmbotText}>
        <p className={styles.farmbotHeadline}>
          <span className={styles.approx} aria-hidden="true">
            ≈
          </span>
          <span className="tabular">{formatExpected(farmbot.expected)}</span>{' '}
          {farmbot.expected === 1 ? 'Farmbot' : 'Farmbots'} expected
        </p>
        <p className={styles.farmbotRange}>
          Most raids: <strong className="tabular">{formatRange(farmbot.p10, farmbot.p90)}</strong>
        </p>
        <p className={styles.farmbotDetail}>
          <span className="tabular">{farmbot.guaranteed}</span> guaranteed
          {farmbot.chanceOfExtra > 0.005 ? (
            <>
              {' · '}
              <span className="tabular">{chance}%</span> chance of at least one additional Farmbot
            </>
          ) : (
            <> · not enough budget for additional Farmbots</>
          )}
        </p>
      </div>
    </div>
  );
}

interface BotLineupProps {
  pool: readonly Bot[];
  newBots: readonly Bot[];
  composition: RaidComposition | null;
}

export function BotLineup({ pool, newBots, composition }: BotLineupProps) {
  const newIds = new Set(newBots.map((bot) => bot.id));

  if (pool.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="bot-lineup-title">
        <header className={styles.head}>
          <h3 className="label" id="bot-lineup-title">
            Expected raid composition
          </h3>
        </header>
        <p className={`inset ${styles.none}`}>
          No bots will spawn. Plant something with raid value to see the forecast.
        </p>
      </section>
    );
  }

  const byId = new Map(composition?.estimates.map((estimate) => [estimate.bot.id, estimate]) ?? []);
  const hasFarmbot = pool.some((bot) => bot.id === 'farmbot');

  return (
    <section className={styles.section} aria-labelledby="bot-lineup-title">
      <header className={styles.head}>
        <h3 className="label" id="bot-lineup-title">
          Expected raid composition
        </h3>
        {composition ? (
          <span className={styles.count}>
            ≈ {formatNumber(Math.round(composition.expectedTotalBots))} bots
          </span>
        ) : null}
      </header>

      {composition && hasFarmbot ? <FarmbotHighlight composition={composition} /> : null}

      <ul className={styles.grid}>
        {pool.map((bot, index) => (
          <BotCard
            key={bot.id}
            bot={bot}
            estimate={byId.get(bot.id)}
            isNew={newIds.has(bot.id)}
            index={index}
          />
        ))}
      </ul>

      {newIds.size === 0 && pool.length > 0 ? (
        <p className={styles.poolNote}>
          No new unit types at this level — the same roster arrives in larger, denser groups.
        </p>
      ) : null}

      <p className={styles.disclaimer}>
        <span aria-hidden="true" className={styles.disclaimerMark} />
        {RANDOMNESS_NOTE}
      </p>

      <details className={styles.explainer}>
        <summary className={styles.explainerSummary}>How is this estimated?</summary>
        <div className={styles.explainerBody}>
          <p>
            A raid places a free opening wave, then repeatedly draws a random bot group it can still
            afford, subtracting that group&rsquo;s cost until nothing fits in the remaining budget.
            Groups carry very different weights, so some appear far more often than others.
          </p>
          <p>
            These figures are solved exactly from those spawn tables rather than sampled, so they do
            not drift between visits. <strong>Expected</strong> is the average across every possible
            outcome; <strong>typical</strong> is the middle 80% of outcomes, from the 10th to the
            90th percentile. <strong>Guaranteed</strong> bots come from the opening wave and cost no
            budget.
          </p>
          {composition && !composition.hasExactRanges ? (
            <p>
              At this budget only Farmbot ranges are solved exactly; the other bots show expected
              averages.
            </p>
          ) : null}
          <p className={styles.explainerSource}>
            Raid mechanics:{' '}
            <a
              href="https://steamcommunity.com/sharedfiles/filedetails/?id=3773250375"
              target="_blank"
              rel="noopener noreferrer"
            >
              Scrap Mechanic raid system breakdown
            </a>
          </p>
        </div>
      </details>
    </section>
  );
}
