(function () {

  // ── State ────────────────────────────────────────────────
  let mainNorm    = [];  // normalised freq, index 1-39
  let tbNorm      = [];  // normalised freq, index 1-14
  let mainLast    = [];  // draws-since-last-seen, index 1-39
  let tbLast      = [];  // draws-since-last-seen, index 1-14
  let totalDraws  = 0;
  let currentStrat = 'hot';

  // ── Init ─────────────────────────────────────────────────
  async function init() {
    const resp = await fetch('data/thunderball.csv');
    const text = await resp.text();
    // Rows newest-first (header on line 0)
    const rows = text.trim().split('\n').slice(1);
    totalDraws = rows.length;

    const mainFreq = Array(40).fill(0);
    const tbFreq   = Array(15).fill(0);
    mainLast = Array(40).fill(Infinity);
    tbLast   = Array(15).fill(Infinity);

    // CSV: Date,N1,N2,N3,N4,N5,Thunderball  (indices 0-6)
    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split(',');
      for (let c = 1; c <= 5; c++) {
        const n = parseInt(cols[c], 10);
        if (n >= 1 && n <= 39) {
          mainFreq[n]++;
          if (mainLast[n] === Infinity) mainLast[n] = i;
        }
      }
      const tb = parseInt(cols[6], 10);
      if (tb >= 1 && tb <= 14) {
        tbFreq[tb]++;
        if (tbLast[tb] === Infinity) tbLast[tb] = i;
      }
    }

    // No range expansions in Thunderball history — all draws eligible for all numbers
    mainNorm = Array(40).fill(0);
    for (let n = 1; n <= 39; n++) mainNorm[n] = mainFreq[n] / totalDraws;

    tbNorm = Array(15).fill(0);
    for (let t = 1; t <= 14; t++) tbNorm[t] = tbFreq[t] / totalDraws;

    const mainNums = Array.from({ length: 39 }, (_, i) => i + 1);
    const tbNums   = Array.from({ length: 14 }, (_, i) => i + 1);

    document.getElementById('tb-draws-count').textContent =
      `Based on ${totalDraws.toLocaleString()} draws`;

    renderMainChart(mainNums, mainFreq);
    renderTbChart(tbNums, tbFreq);
    renderHotCold(mainNums, mainFreq, tbNums, tbFreq);
    initSuggestions(mainNums, tbNums);
  }

  // ── Main ball chart ───────────────────────────────────────
  function renderMainChart(numbers, freq) {
    const counts = numbers.map(n => freq[n]);
    const avg    = counts.reduce((a, b) => a + b, 0) / counts.length;
    const colors = counts.map(c =>
      c > avg * 1.05 ? '#f77f00' : c < avg * 0.95 ? '#ffd180' : '#a0aec0'
    );

    new Chart(document.getElementById('tb-main-chart').getContext('2d'), {
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
                const n = numbers[item.dataIndex];
                return [` Drawn ${item.raw} times`, ` Rate: ${(mainNorm[n] * 100).toFixed(1)}%`];
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

  // ── Thunderball chart ─────────────────────────────────────
  function renderTbChart(numbers, freq) {
    const counts = numbers.map(t => freq[t]);
    const avg    = counts.reduce((a, b) => a + b, 0) / counts.length;
    const colors = counts.map(c =>
      c > avg * 1.05 ? '#d62828' : c < avg * 0.95 ? '#f4a261' : '#a0aec0'
    );

    new Chart(document.getElementById('tb-ball-chart').getContext('2d'), {
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
              title: items => `Thunderball ${items[0].label}`,
              label: item => {
                const t = numbers[item.dataIndex];
                return [` Drawn ${item.raw} times`, ` Rate: ${(tbNorm[t] * 100).toFixed(1)}%`];
              },
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Thunderball number', color: '#718096' }, ticks: { font: { size: 12 } }, grid: { display: false } },
          y: { title: { display: true, text: 'Times drawn', color: '#718096' }, ticks: { font: { size: 11 } }, grid: { color: '#e2e8f0' } }
        }
      }
    });
  }

  // ── Hot / Cold tables ─────────────────────────────────────
  function renderHotCold(mainNums, mainFreq, tbNums, tbFreq) {
    const sortedMain = [...mainNums].sort((a, b) => mainNorm[b] - mainNorm[a]);
    const hotMain    = sortedMain.slice(0, 10);
    const coldMain   = sortedMain.slice(-10).reverse();

    hotMain.forEach((n, i) => {
      document.getElementById('tb-hot-main').insertAdjacentHTML('beforeend', `
        <tr>
          <td>${i + 1}</td>
          <td><span class="ball ball--tb">${n}</span></td>
          <td>${mainFreq[n]}</td>
          <td>${(mainNorm[n] * 100).toFixed(1)}%</td>
        </tr>`);
    });

    coldMain.forEach((n, i) => {
      document.getElementById('tb-cold-main').insertAdjacentHTML('beforeend', `
        <tr>
          <td>${i + 1}</td>
          <td><span class="ball ball--tb-cold">${n}</span></td>
          <td>${mainFreq[n]}</td>
          <td>${(mainNorm[n] * 100).toFixed(1)}%</td>
        </tr>`);
    });

    // Thunderball — all 14, split hot (7) / cold (7)
    const sortedTb = [...tbNums].sort((a, b) => tbNorm[b] - tbNorm[a]);

    sortedTb.slice(0, 7).forEach((t, i) => {
      document.getElementById('tb-hot-tb').insertAdjacentHTML('beforeend', `
        <tr>
          <td>${i + 1}</td>
          <td><span class="ball ball--tbolt">${t}</span></td>
          <td>${tbFreq[t]}</td>
          <td>${(tbNorm[t] * 100).toFixed(1)}%</td>
        </tr>`);
    });

    sortedTb.slice(-7).reverse().forEach((t, i) => {
      document.getElementById('tb-cold-tb').insertAdjacentHTML('beforeend', `
        <tr>
          <td>${i + 1}</td>
          <td><span class="ball ball--tbolt-cold">${t}</span></td>
          <td>${tbFreq[t]}</td>
          <td>${(tbNorm[t] * 100).toFixed(1)}%</td>
        </tr>`);
    });
  }

  // ── Suggestions ───────────────────────────────────────────
  const STRATS = {
    hot: {
      desc: '5 hot main balls drawn from the top-frequency pool, plus the most frequently drawn Thunderball.',
    },
    overdue: {
      desc: 'Main balls and Thunderball that have gone the longest without being drawn.',
    },
    balanced: {
      desc: '3 hot + 2 cold main balls, constrained to 2–3 odd and 2–3 low (1–19). One hot Thunderball.',
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

  function pickNumbers(strategy, mainNums, tbNums) {
    const byMain = [...mainNums].sort((a, b) => mainNorm[b] - mainNorm[a]);
    const byTb   = [...tbNums].sort((a, b) => tbNorm[b] - tbNorm[a]);

    if (strategy === 'hot') {
      return {
        main: sample(byMain.slice(0, 13), 5).sort((a, b) => a - b),
        tb:   sample(byTb.slice(0, 5), 1),
      };
    }

    if (strategy === 'overdue') {
      const byMainOvd = [...mainNums].sort((a, b) =>
        (mainLast[b] === Infinity ? 1e9 : mainLast[b]) - (mainLast[a] === Infinity ? 1e9 : mainLast[a]));
      const byTbOvd = [...tbNums].sort((a, b) =>
        (tbLast[b] === Infinity ? 1e9 : tbLast[b]) - (tbLast[a] === Infinity ? 1e9 : tbLast[a]));
      return {
        main: sample(byMainOvd.slice(0, 10), 5).sort((a, b) => a - b),
        tb:   sample(byTbOvd.slice(0, 4), 1),
      };
    }

    if (strategy === 'balanced') {
      const hotPool  = byMain.slice(0, 13);
      const coldPool = byMain.slice(-13);
      return {
        main: balancedMainPick(hotPool, coldPool),
        tb:   sample(byTb.slice(0, 5), 1),
      };
    }

    return { main: [], tb: [] };
  }

  function balancedMainPick(hotPool, coldPool) {
    // 5 main balls (1-39): 2-3 odd, 2-3 low (1-19)
    for (let attempt = 0; attempt < 500; attempt++) {
      const hot3  = sample(hotPool, 3);
      const cold2 = sample(coldPool, 2);
      const picks = [...hot3, ...cold2];

      if (new Set(picks).size < 5) continue;

      const odd = picks.filter(n => n % 2 !== 0).length;
      const low = picks.filter(n => n <= 19).length;

      if (odd >= 2 && odd <= 3 && low >= 2 && low <= 3) {
        return picks.sort((a, b) => a - b);
      }
    }
    return [...sample(hotPool, 3), ...sample(coldPool, 2)].sort((a, b) => a - b);
  }

  function showSuggestion(strategy, mainNums, tbNums) {
    const { main, tb } = pickNumbers(strategy, mainNums, tbNums);

    const mainEl = document.getElementById('tb-suggestion-main');
    const tbEl   = document.getElementById('tb-suggestion-tb');

    mainEl.innerHTML = '';
    tbEl.innerHTML   = '';

    main.forEach(n => {
      const span = document.createElement('span');
      span.className   = 'ball ball--tb-pick';
      span.textContent = n;
      mainEl.appendChild(span);
    });

    tb.forEach(t => {
      const span = document.createElement('span');
      span.className   = 'ball ball--tbolt-pick';
      span.textContent = t;
      tbEl.appendChild(span);
    });

    document.getElementById('tb-strategy-desc').textContent = STRATS[strategy].desc;
  }

  function initSuggestions(mainNums, tbNums) {
    document.querySelectorAll('.tb-strategy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tb-strategy-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStrat = btn.dataset.strategy;
        showSuggestion(currentStrat, mainNums, tbNums);
      });
    });

    document.getElementById('tb-regenerate-btn').addEventListener('click', () => {
      const btn = document.getElementById('tb-regenerate-btn');
      btn.classList.add('spinning');
      btn.addEventListener('animationend', () => btn.classList.remove('spinning'), { once: true });
      showSuggestion(currentStrat, mainNums, tbNums);
    });

    showSuggestion('hot', mainNums, tbNums);
  }

  // Lazy-init: render charts only once the tab is made visible
  let initialized = false;
  window.addEventListener('tab-shown', (e) => {
    if (e.detail.game === 'thunderball' && !initialized) {
      initialized = true;
      init();
    }
  });

})();
