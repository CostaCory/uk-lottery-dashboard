# UK Lottery Dashboard

**Live site:** https://costacory.github.io/uk-lottery-dashboard/

A browser-based dashboard for exploring UK lottery draw history, frequency statistics, and trend analysis across three games: **Lotto**, **Thunderball**, and **EuroMillions**.

Hosted on **GitHub Pages**. Data persisted via **Firebase Firestore** (Phase 3+).

---

## Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| 1 | ✅ Done | Project scaffold, layout, tab navigation |
| 2 | ✅ Done | Draw data, frequency charts, hot/cold tables, suggested numbers |
| 3 | Planned | Firebase Firestore integration, real-time updates |
| 4 | Planned | Advanced stats, jackpot tracker |

---

## Folder structure

```
uk-lottery-dashboard/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js              # Tab switching, tab-shown event
│   ├── lotto.js            # Lotto analysis (3,176 draws, 1994–present)
│   ├── euromillions.js     # EuroMillions analysis (1,950 draws, 2004–present)
│   └── thunderball.js      # Thunderball analysis (3,913 draws, 1999–present)
├── data/
│   ├── lotto.csv
│   ├── euromillions.csv
│   └── thunderball.csv
├── .gitignore
└── README.md
```

---

## Running locally

No build step required — open `index.html` directly in a browser, or serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

---

## Tech stack

- HTML5 / CSS3 / Vanilla JS
- [Chart.js](https://www.chartjs.org/) — charting (Phase 2)
- [Firebase Firestore](https://firebase.google.com/docs/firestore) — data persistence (Phase 3)
- GitHub Pages — hosting
