# ScrapRaid — Scrap Mechanic Farm Raid Calculator

A frontend-only calculator for Scrap Mechanic Survival. Enter how many of each crop
you have planted and it instantly shows the total crop value, the raid level it
triggers, how far you are from the next level, which bots can spawn, and the
player-adjusted raid budget.

Everything runs in the browser. No backend, no database, no runtime network requests.

## Features

- Live results with no Calculate button — every keystroke recalculates.
- All 12 farmable crops with their real in-game icons, raid values and harvest yields.
- Raid levels from **NO RAID** through **SUPER RAID 07**, with the exact points
  remaining until the next level.
- Bot pool for the current level, with the units newly unlocked at that level
  highlighted, using real in-game bot renders.
- Raid budget scaled for 1, 2 or 3+ players.
- Farm and player count persist in `localStorage`.
- Keyboard accessible, screen-reader labelled, and respects `prefers-reduced-motion`.

## Quick start

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev       # http://localhost:5173
```

## Build

```bash
npm run build     # type-checks, then emits a static site to dist/
npm run preview   # serve the production build locally
```

Other scripts:

```bash
npm run typecheck # tsc only
npm run lint      # oxlint
```

## Deployment

`dist/` is a plain static bundle with no server-side requirements. `vite.config.ts`
sets `base: './'`, so the same build works from a domain root or from a subpath.

| Host | Setup |
| --- | --- |
| **Vercel** | Import the repo. Framework preset **Vite**; build `npm run build`; output `dist`. |
| **Netlify** | Import the repo. Build `npm run build`; publish directory `dist`. |
| **GitHub Pages** | Push to `main`. The included workflow at `.github/workflows/deploy.yml` builds and publishes automatically once Pages is set to **GitHub Actions** under Settings → Pages. |

Any other static host works too — upload the contents of `dist/`.

## How the numbers work

All crop, threshold, bot and budget data lives in [`src/data/`](src/data/); no component
hardcodes a raid number of its own. The maths is in
[`src/lib/raidCalc.ts`](src/lib/raidCalc.ts).

**Crop values** — cotton and pigment flowers are worth 0 and never create raid
pressure, so a farm of nothing but those stays at **NO RAID**.

**Raid levels**

| Level | Total crop value | Bots added to the pool |
| --- | ---: | --- |
| No raid | 0 | — |
| 1 | 1–49 | Green Totebot, Haybot |
| 2 | 50–99 | Blue Totebot |
| 3 | 100–549 | Red Totebot, Green Tapebot, Yellow Tapebot |
| 4 | 550–999 | Yellow Totebot |
| 5 | 1,000–5,499 | Blue Tapebot, Farmbot |
| 6 | 5,500–10,000 | — (same pool as level 5) |
| 7 — Super Raid | 10,001+ | — (same pool as level 5) |

Note the top boundary: **10,000 is level 6; level 7 starts at 10,001.**

**Raid budget** — the position within the current tier drives the budget:

```
fraction × (maximumBudget − minimumBudget) + minimumBudget × playerModifier
```

`fraction` is clamped to 0–1. Level 1 interpolates from 0 to 50; every other level
interpolates from its own floor to the next level's floor; level 7 interpolates from
10,001 up to the 100,000 difficulty cap. Player modifiers are 1 / 1.5 / 2. Totals
above 100,000 still display their real value, but difficulty stops scaling.

**Randomness** — the level fixes the *pool* and the *budget*, not the roster. The game
spends the budget on weighted random bot groups, so the exact composition of any given
raid varies. The result panel says so directly.

## Project structure

```
public/assets/crops/   12 crop icons (webp)
public/assets/bots/     9 bot renders (webp, transparent)
src/assets/fonts/       self-hosted woff2 subsets
src/data/               crops, bots, raid tiers, budgets — the single source of truth
src/lib/                pure calculation, formatting and storage helpers
src/hooks/              farm state, reduced motion, tier escalation, viewport helpers
src/components/         UI, one CSS Module per component
src/styles/             design tokens, fonts, global reset and industrial primitives
```

## Assets and attribution

Crop icons and bot renders were taken from the
[Official Scrap Mechanic Wiki](https://scrapmechanic.fandom.com/wiki/Farming) (Fandom,
CC BY-SA), then cropped, background-keyed and re-encoded as optimised local WebP files
under `public/assets/`. Nothing is hotlinked at runtime, and every image has a text
fallback if it fails to load.

Typography is [Archivo Black](https://fonts.google.com/specimen/Archivo+Black) and
[Barlow](https://fonts.google.com/specimen/Barlow) (SIL Open Font License), self-hosted
as latin-subset woff2.

Unofficial fan-made tool. Not affiliated with Axolot Games.
