# UK Lottery Dashboard

A browser-based dashboard for exploring UK lottery draw history, frequency statistics, and trend analysis across three games: **Lotto**, **Thunderball**, and **EuroMillions**.

Hosted on **GitHub Pages**. Data persisted via **Firebase Firestore** (Phase 2+).

---

## Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| 1 | Done | Project scaffold, layout, tab navigation |
| 2 | Planned | Draw data import, number frequency charts (Chart.js) |
| 3 | Planned | Firebase Firestore integration, real-time updates |
| 4 | Planned | Advanced stats, hot/cold numbers, jackpot tracker |

---

## Folder structure

```
uk-lottery-dashboard/
├── index.html          # Single-page shell with tab navigation
├── css/
│   └── styles.css      # Global styles
├── js/
│   └── app.js          # Tab switching; game logic added in Phase 2
├── data/               # Static JSON draw data (Phase 2)
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
