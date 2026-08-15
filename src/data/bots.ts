/**
 * Hostile units that can appear in a farm raid.
 *
 * `id` doubles as the asset filename under public/assets/bots.
 * `abbr` is the text fallback shown if the image fails to load.
 */

export type BotId =
  | 'green-totebot'
  | 'haybot'
  | 'blue-totebot'
  | 'red-totebot'
  | 'green-tapebot'
  | 'yellow-tapebot'
  | 'yellow-totebot'
  | 'blue-tapebot'
  | 'farmbot';

export interface Bot {
  readonly id: BotId;
  readonly name: string;
  /** Two-part text fallback: family line plus short code. */
  readonly abbr: string;
  readonly family: 'Totebot' | 'Tapebot' | 'Haybot' | 'Farmbot';
  readonly note: string;
}

export const BOTS: Readonly<Record<BotId, Bot>> = {
  'green-totebot': {
    id: 'green-totebot',
    name: 'Green Totebot',
    abbr: 'G-TOTE',
    family: 'Totebot',
    note: 'Basic crawler',
  },
  haybot: {
    id: 'haybot',
    name: 'Haybot',
    abbr: 'HAY',
    family: 'Haybot',
    note: 'Scythe melee',
  },
  'blue-totebot': {
    id: 'blue-totebot',
    name: 'Blue Totebot',
    abbr: 'B-TOTE',
    family: 'Totebot',
    note: 'Tougher plating',
  },
  'red-totebot': {
    id: 'red-totebot',
    name: 'Red Totebot',
    abbr: 'R-TOTE',
    family: 'Totebot',
    note: 'Explosive',
  },
  'green-tapebot': {
    id: 'green-tapebot',
    name: 'Green Tapebot',
    abbr: 'G-TAPE',
    family: 'Tapebot',
    note: 'Ranged tape',
  },
  'yellow-tapebot': {
    id: 'yellow-tapebot',
    name: 'Yellow Tapebot',
    abbr: 'Y-TAPE',
    family: 'Tapebot',
    note: 'Glue support',
  },
  'yellow-totebot': {
    id: 'yellow-totebot',
    name: 'Yellow Totebot',
    abbr: 'Y-TOTE',
    family: 'Totebot',
    note: 'Heavy crawler',
  },
  'blue-tapebot': {
    id: 'blue-tapebot',
    name: 'Blue Tapebot',
    abbr: 'B-TAPE',
    family: 'Tapebot',
    note: 'Armoured elite',
  },
  farmbot: {
    id: 'farmbot',
    name: 'Farmbot',
    abbr: 'FARM',
    family: 'Farmbot',
    note: 'Fast, deadly',
  },
};

export const botAssetUrl = (id: BotId): string =>
  `${import.meta.env.BASE_URL}assets/bots/${id}.webp`;
