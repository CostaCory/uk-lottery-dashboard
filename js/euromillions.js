(function () {

  // ── State ────────────────────────────────────────────────
  let mainNorm    = [];  // normalised freq, index 1-50
  let lsNorm      = [];  // normalised freq, index 1-12
  let mainLast    = [];  // draws-since-last-seen, index 1-50
  let lsLast      = [];  // draws-since-last-seen, index 1-12
  let totalDraws  = 0;
  let eligible11  = 0;   // draws where LS 10 & 11 were eligible (May 2011 expansion)
  let eligible12  = 0;   // draws where LS 12 was eligible (Sep 2016 expansion)
  let currentStrat = 'hot';

  // ── Init ─────────────────────────────────────────────────
  async function init() {
    const resp = await fetch('data/euromillions.csv');
    const text = await resp.text();
    // Rows are newest-first (index 0 = draw #1950)
    const rows = text.trim().split('\n').slice(1);

    totalDraws = rows.length;
    const mainFreq = Array(51).fill(0);
    const lsFreq   = Array(13).fill(0);
    mainLast = Array(51).fill(Infinity);
    lsLast   = Array(13).fill(Infinity);

    // Detect LS expansion points by scanning from oldest row toward newest.
    // Stop once both thresholds are found.
    for (let i = rows.length - 1; i >= 0; i--) {
      const cols = rows[i].split(',');
      const maxLS = Math.max(parseInt(cols[10]), parseInt(cols[11]));
      if (eligible11 === 0 && maxLS >= 10) eligible11 = i + 1;
      if (eligible12 === 0 && maxLS >= 12) eligible12 = i + 1;
      if (eligible11 > 0 && eligible12 > 0) break;
    }

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split(',');
      for (let c = 5; c <= 9; c++) {
        const n = parseInt(cols[c], 10);
        if (n >= 1 && n <= 50) {
          mainFreq[n]++;
          if (mainLast[n] === Infinity) mainLast[n] = i;
        }
      }
      for (let c = 10; c <= 11; c++) {
        const s = parseInt(cols[c], 10);
        if (s >= 1 && s <= 12) {
          lsFreq[s]++;
          if (lsLast[s] === Infinity) lsLast[s] = i;
        }
      }
    }

    mainNorm = Array(51).fill(0);
    for (let n = 1; n <= 50; n++) mainNorm[n] = mainFreq[n] / totalDraws;

    lsNorm = Array(13).fill(0);
    for (let s = 1; s <= 12; s++) {
      const el = lsEligible(s);
      lsNorm[s] = lsFreq[s] / el;
    }

    const mainNums = Array.from({ length: 50 }, (_, i) => i + 1);
    const lsNums   = Array.from({ length: 12 }, (_, i) => i + 1);

    document.getElementById('em-draws-count').textContent =
      `Based on ${totalDraws.toLocaleString()} draws`;

    renderMainChart(mainNums, mainFreq);
    renderLsChart(lsNums, lsFreq);
    renderHotCold(mainNums, mainFreq, lsNums, lsFreq);
    initSuggestions(mainNums, lsNums);
  }

  function lsEligible(s) {
    if (s <= 9)  return totalDraws;
    if (s <= 11) return eligible11;
    return eligible12;
  }

  function mainEligible() { return totalDraws; }

  // ── Main ball chart ───────────────────────────────────────
  function renderMainChart(numbers, freq) {
    const counts = numbers.map(n => freq[n]);
    const avg    = counts.reduce((a, b) => a + b, 0) / counts.length;
    const colors = counts.map(c =>
      c > avg * 1.05 ? '#003087' : c < avg * 0.95 ? '#4a90d9' : '#a0aec0'
    );

    new Chart(document.getElementById('em-main-chart').getContext('2d'), {
      type: 'bar',
      data: {
        labels: numbers,
        datasets: [{ label: 'Times drawn', data: counts, backgroundColor: colors, borderRadius: 3, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => `Ball ${items[0].label}`,
              label: item => {
                const n    = numbers[item.dataIndex];
                const norm = (mainNorm[n] * 100).toFixed(1);
                return [` Drawn ${item.raw} times`, ` Rate: ${norm}%`];
              },
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Ball number', color: '#718096' }, ticks: { font: { size: 11 } }, grid: { display: false } },
          y: { title: { display: true, text: 'Times drawn', color: '#718096' }, ticks: { font: { size: 11 } }, grid: { color: '#e2e8f0' } }
        }
      }
    });
  }

  // ── Lucky Star chart ──────────────────────────────────────
  function renderLsChart(numbers, freq) {
    const counts = numbers.map(s => freq[s]);
    // Compare normalised rates for fair colouring
    const normCounts = numbers.map(s => lsNorm[s]);
    const avg        = normCounts.reduce((a, b) => a + b, 0) / normCounts.length;
    const colors     = normCounts.map(r =>
      r > avg * 1.05 ? '#b8860b' : r < avg * 0.95 ? '#daa520' : '#f4b942'
    );

    new Chart(document.getElementById('em-ls-chart').getContext('2d'), {
      type: 'bar',
      data: {
        labels: numbers,
        datasets: [{ label: 'Times drawn', data: counts, backgroundColor: colors, borderRadius: 4, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => `Lucky Star ${items[0].label}`,
              label: item => {
                const s    = numbers[item.dataIndex];
                const norm = (lsNorm[s] * 100).toFixed(1);
                const el   = lsEligible(s);
                return [` Drawn ${item.raw} times`, ` Eligible draws: ${el.toLocaleString()}`, ` Normalised rate: ${norm}%`];
              },
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Lucky Star', color: '#718096' }, ticks: { font: { size: 12 } }, grid: { display: false } },
          y: { title: { display: true, text: 'Times drawn', color: '#718096' }, ticks: { font: { size: 11 } }, grid: { color: '#e2e8f0' } }
        }
      }
    });
  }

  // ── Hot / Cold tables ─────────────────────────────────────
  function renderHotCold(mainNums, mainFreq, lsNums, lsFreq) {
    // Main balls — sorted by normalised freq (same as raw since all eligible)
    const sortedMain = [...mainNums].sort((a, b) => mainNorm[b] - mainNorm[a]);
    const hotMain    = sortedMain.slice(0, 10);
    const coldMain   = sortedMain.slice(-10).reverse();

    hotMain.forEach((n, i) => {
      document.getElementById('em-hot-main').insertAdjacentHTML('beforeend', `
        <tr>
          <td>${i + 1}</td>
          <td><span class="ball ball--em">${n}</span></td>
          <td>${mainFreq[n]}</td>
          <td>${(mainNorm[n] * 100).toFixed(1)}%</td>
        </tr>`);
    });

    coldMain.forEach((n, i) => {
      document.getElementById('em-cold-main').insertAdjacentHTML('beforeend', `
        <tr>
          <td>${i + 1}</td>
          <td><span class="ball ball--em-cold">${n}</span></td>
          <td>${mainFreq[n]}</td>
          <td>${(mainNorm[n] * 100).toFixed(1)}%</td>
        </tr>`);
    });

    // Lucky Stars — all 12 sorted by normalised freq, split hot (6) / cold (6)
    const sortedLS = [...lsNums].sort((a, b) => lsNorm[b] - lsNorm[a]);
    const hotLS    = sortedLS.slice(0, 6);
    const coldLS   = sortedLS.slice(-6).reverse();

    hotLS.forEach((s, i) => {
      document.getElementById('em-hot-ls').insertAdjacentHTML('beforeend', `
        <tr>
          <td>${i + 1}</td>
          <td><span class="ball ball--star">${s}</span></td>
          <td>${lsFreq[s]}</td>
          <td>${(lsNorm[s] * 100).toFixed(1)}%</td>
        </tr>`);
    });

    coldLS.forEach((s, i) => {
      document.getElementById('em-cold-ls').insertAdjacentHTML('beforeend', `
        <tr>
          <td>${i + 1}</td>
          <td><span class="ball ball--star-cold">${s}</span></td>
          <td>${lsFreq[s]}</td>
          <td>${(lsNorm[s] * 100).toFixed(1)}%</td>
        </tr>`);
    });
  }

  // ── Suggestions ───────────────────────────────────────────
  const STRATS = {
    hot: {
      desc: '5 hot main balls + 2 hot Lucky Stars, drawn randomly from each game\'s top-frequency pool. Lucky Stars normalised for the 2011 and 2016 expansions.',
    },
    overdue: {
      desc: 'Most overdue main balls and Lucky Stars — ranked by time absent as a proportion of each number\'s eligible lifetime.',
    },
    balanced: {
      desc: '5 main balls balanced across odd/even and low (1–25)/high (26–50), drawn from hot and cold pools. 2 Lucky Stars from opposite ends of the frequency range.',
    },
  };

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function sample(arr, n) {
    return shuffle([...arr]).slice(0, n);
  }

  function mainOverdueScore(n) {
    return mainLast[n] === Infinity ? Infinity : mainLast[n] / totalDraws;
  }

  function lsOverdueScore(s) {
    return lsLast[s] === Infinity ? Infinity : lsLast[s] / lsEligible(s);
  }

  function pickNumbers(strategy, mainNums, lsNums) {
    const byMainNorm = [...mainNums].sort((a, b) => mainNorm[b] - mainNorm[a]);
    const byLsNorm   = [...lsNums].sort((a, b)   => lsNorm[b]   - lsNorm[a]);

    if (strategy === 'hot') {
      return {
        main: sample(byMainNorm.slice(0, 15), 5).sort((a, b) => a - b),
        ls:   sample(byLsNorm.slice(0, 5), 2).sort((a, b) => a - b),
      };
    }

    if (strategy === 'overdue') {
      const byMainOverdue = [...mainNums].sort((a, b) => mainOverdueScore(b) - mainOverdueScore(a));
      const byLsOverdue   = [...lsNums].sort((a, b)   => lsOverdueScore(b)   - lsOverdueScore(a));
      return {
        main: sample(byMainOverdue.slice(0, 12), 5).sort((a, b) => a - b),
        ls:   sample(byLsOverdue.slice(0, 4), 2).sort((a, b) => a - b),
      };
    }

    if (strategy === 'balanced') {
      const hotPool  = byMainNorm.slice(0, 15);
      const coldPool = byMainNorm.slice(-15);
      const main = balancedMainPick(hotPool, coldPool);
      // LS: one from hot half (1-6 normalised), one from cold half (7-12 normalised)
      const lsHot  = byLsNorm.slice(0, 6);
      const lsCold = byLsNorm.slice(-6);
      const ls = [sample(lsHot, 1)[0], sample(lsCold, 1)[0]].sort((a, b) => a - b);
      return { main, ls };
    }

    return { main: [], ls: [] };
  }

  function balancedMainPick(hotPool, coldPool) {
    // 5 main balls: 2-3 odd, 2-3 even, 2-3 low (1-25), 2-3 high (26-50)
    for (let attempt = 0; attempt < 500; attempt++) {
      const hot3  = sample(hotPool, 3);
      const cold2 = sample(coldPool, 2);
      const picks = [...hot3, ...cold2];

      if (new Set(picks).size < 5) continue;

      const odd = picks.filter(n => n % 2 !== 0).length;
      const low = picks.filter(n => n <= 25).length;

      if (odd >= 2 && odd <= 3 && low >= 2 && low <= 3) {
        return picks.sort((a, b) => a - b);
      }
    }
    return [...sample(hotPool, 3), ...sample(coldPool, 2)].sort((a, b) => a - b);
  }

  function showSuggestion(strategy, mainNums, lsNums) {
    const { main, ls } = pickNumbers(strategy, mainNums, lsNums);

    const mainEl = document.getElementById('em-suggestion-main');
    const lsEl   = document.getElementById('em-suggestion-ls');

    mainEl.innerHTML = '';
    lsEl.innerHTML   = '';

    main.forEach(n => {
      const span = document.createElement('span');
      span.className   = 'ball ball--em-pick';
      span.textContent = n;
      mainEl.appendChild(span);
    });

    ls.forEach(s => {
      const span = document.createElement('span');
      span.className   = 'ball ball--star-pick';
      span.textContent = s;
      lsEl.appendChild(span);
    });

    document.getElementById('em-strategy-desc').textContent = STRATS[strategy].desc;
  }

  function initSuggestions(mainNums, lsNums) {
    document.querySelectorAll('.em-strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.em-strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStrat = btn.dataset.strategy;
        showSuggestion(currentStrat, mainNums, lsNums);
      });
    });

    document.getElementById('em-regenerate-btn').addEventListener('click', () => {
      const btn = document.getElementById('em-regenerate-btn');
      btn.classList.add('spinning');
      btn.addEventListener('animationend', () => btn.classList.remove('spinning'), { once: true });
      showSuggestion(currentStrat, mainNums, lsNums);
    });

    showSuggestion('hot', mainNums, lsNums);
  }

  // Defer chart rendering until the panel is first made visible —
  // Chart.js needs a non-zero canvas size to render correctly.
  let initialized = false;
  window.addEventListener('tab-shown', (e) => {
    if (e.detail.game === 'euromillions' && !initialized) {
      initialized = true;
      init();
    }
  });

})();
