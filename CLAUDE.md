# UK Lottery Dashboard

This is a UK Lottery dashboard with 3 games: Lotto, Thunderball, and EuroMillions.

**Tech stack:** HTML + vanilla JS + Chart.js, hosted on GitHub Pages.  
**Live site:** https://costacory.github.io/uk-lottery-dashboard/

## Data

Historical draw data lives in `data/` as CSV files (newest draw first):

| File | Game | Draws | Range |
|------|------|-------|-------|
| `data/lotto.csv` | Lotto | 3,176 | Nov 1994 – present |
| `data/euromillions.csv` | EuroMillions | 1,950 | Feb 2004 – present |
| `data/thunderball.csv` | Thunderball | 3,913 | Jun 1999 – present |

## Ball ranges

| Game | Main balls | Extra ball |
|------|-----------|------------|
| Lotto | 1–59 | 1 bonus ball (excluded from analysis) |
| EuroMillions | 1–50 main | 2 Lucky Stars (1–12) |
| Thunderball | 1–39 main | 1 Thunderball (1–14) |

## Frequency normalisation

- **Lotto balls 50–59** were added in October 2015 (draw #2066). Their eligible draw count is detected dynamically from the CSV and used to normalise frequencies.
- **EuroMillions Lucky Stars** expanded twice: LS 10–11 added May 2011, LS 12 added Sep 2016. Both cutoffs are detected dynamically.
- **Thunderball** has no expansions — all numbers eligible for all draws.

## JS structure

Each game script is an IIFE (to avoid global name collisions) and lazy-initialises on first tab click via the `tab-shown` custom event fired by `app.js`.

| File | Responsibility |
|------|---------------|
| `js/app.js` | Tab switching; fires `tab-shown` CustomEvent on each click |
| `js/lotto.js` | Lotto analysis (not wrapped in IIFE — loaded first, Lotto is default tab) |
| `js/euromillions.js` | EuroMillions analysis (IIFE, lazy-init) |
| `js/thunderball.js` | Thunderball analysis (IIFE, lazy-init) |

## Features per game

Each game tab has:
1. **Frequency bar chart** — main balls colour-coded above/below average
2. **Second chart** — Lucky Stars (EuroMillions) or Thunderball (Thunderball)
3. **Hot/Cold tables** — top 10 each for main balls; top half/bottom half for the extra ball
4. **Suggested Numbers** — 3 strategies with a Regenerate button:
   - **Hot Pick** — random sample from the top-frequency pool
   - **Overdue Pick** — numbers ranked by time absent as a proportion of eligible lifetime
   - **Balanced Pick** — mix of hot + cold constrained by odd/even and low/high balance
