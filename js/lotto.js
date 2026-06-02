// Module-level state shared between render functions and the suggestion picker
let _normalizedFreq    = [];
let _lastSeenIndex     = [];
let _numbers           = [];
let _totalDraws        = 0;
let _eligibleHighBalls = 0;
let _currentStrategy   = 'hot';

async function initLotto() {
  const resp = await fetch('data/lotto.csv');
  const text = await resp.text();
  // Rows are newest-first (index 0 = latest draw, last index = draw #1, Nov 1994)
  const rows = text.trim().split('\n').slice(1);

  const freq     = Array(60).fill(0);
  _lastSeenIndex = Array(60).fill(Infinity);
  _totalDraws    = rows.length;

  // Find how many draws balls 50-59 were eligible for.
  // Scan from the oldest row; stop at the first draw containing a main ball ≥ 50.
  // All rows from that index to 0 (newest) are the eligible pool for 50-59.
  for (let i = rows.length - 1; i >= 0; i--) {
    const cols = rows[i].split(',');
    for (let c = 5; c <= 10; c++) {
      if (parseInt(cols[c], 10) >= 50) { _eligibleHighBalls = i + 1; break; }
    }
    if (_eligibleHighBalls > 0) break;
  }

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i].split(',');
    for (let c = 5; c <= 10; c++) {
      const n = parseInt(cols[c], 10);
      if (n >= 1 && n <= 59) {
        freq[n]++;
        if (_lastSeenIndex[n] === Infinity) _lastSeenIndex[n] = i;
      }
    }
  }

  // Normalise: balls 50-59 had fewer eligible draws (added Oct 2015)
  _normalizedFreq = Array(60).fill(0);
  for (let n = 1; n <= 59; n++) {
    _normalizedFreq[n] = freq[n] / eligible(n);
  }

  _numbers = Array.from({ length: 59 }, (_, i) => i + 1);

  renderChart(_numbers, freq);
  renderHotCold(_numbers, freq);
  initSuggestions();
}

// Returns how many draws ball n was eligible for
function eligible(n) {
  return n <= 49 ? _totalDraws : _eligibleHighBalls;
}

// ── Bar chart ──────────────────────────────────────────────
function renderChart(numbers, freq) {
  const counts = numbers.map(n => freq[n]);
  const avg    = counts.reduce((a, b) => a + b, 0) / counts.length;

  const colors = counts.map(c =>
    c > avg * 1.05 ? '#d62828' : c < avg * 0.95 ? '#4a90d9' : '#a0aec0'
  );

  const ctx = document.getElementById('lotto-freq-chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: numbers,
      datasets: [{
        label: 'Times drawn',
        data: counts,
        backgroundColor: colors,
        borderRadius: 3,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => `Ball ${items[0].label}`,
            label: item => {
              const n    = numbers[item.dataIndex];
              const norm = (_normalizedFreq[n] * 100).toFixed(1);
              return [` Drawn ${item.raw} times`, ` Normalised rate: ${norm}%`];
            },
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Ball number', color: '#718096' },
          ticks: { font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: 'Times drawn', color: '#718096' },
          ticks: { font: { size: 11 } },
          grid: { color: '#e2e8f0' },
        }
      }
    }
  });
}

// ── Hot / Cold table ───────────────────────────────────────
// Sorted by normalised frequency so balls 50-59 aren't unfairly penalised.
function renderHotCold(numbers, freq) {
  const sorted = [...numbers].sort((a, b) => _normalizedFreq[b] - _normalizedFreq[a]);
  const hot    = sorted.slice(0, 10);
  const cold   = sorted.slice(-10).reverse();

  document.getElementById('lotto-draws-count').textContent =
    `Based on ${_totalDraws.toLocaleString()} draws`;

  const hotBody  = document.getElementById('hot-body');
  const coldBody = document.getElementById('cold-body');

  hot.forEach((n, i) => {
    hotBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${i + 1}</td>
        <td><span class="ball ball--hot">${n}</span></td>
        <td>${freq[n]}</td>
        <td>${(_normalizedFreq[n] * 100).toFixed(1)}%</td>
      </tr>`);
  });

  cold.forEach((n, i) => {
    coldBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${i + 1}</td>
        <td><span class="ball ball--cold">${n}</span></td>
        <td>${freq[n]}</td>
        <td>${(_normalizedFreq[n] * 100).toFixed(1)}%</td>
      </tr>`);
  });
}

// ── Suggestions ────────────────────────────────────────────
const STRATEGY_META = {
  hot: {
    desc: 'Drawn from the 15 most frequently appearing numbers, normalised for the 2015 expansion (balls 50–59 have fewer eligible draws).',
  },
  overdue: {
    desc: '6 numbers overdue for a return — ranked by how long they\'ve been absent as a proportion of their eligible lifetime.',
  },
  balanced: {
    desc: '3 hot + 3 cold numbers (normalised). Constrained to include 2–4 odd numbers and 2–4 low numbers (1–29).',
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

function overdueScore(n) {
  if (_lastSeenIndex[n] === Infinity) return Infinity;
  // Proportion of eligible lifetime since last drawn
  return _lastSeenIndex[n] / eligible(n);
}

function pickNumbers(strategy) {
  const byNorm = [..._numbers].sort((a, b) => _normalizedFreq[b] - _normalizedFreq[a]);

  if (strategy === 'hot') {
    return sample(byNorm.slice(0, 15), 6).sort((a, b) => a - b);
  }

  if (strategy === 'overdue') {
    const byOverdue = [..._numbers].sort((a, b) => overdueScore(b) - overdueScore(a));
    return sample(byOverdue.slice(0, 12), 6).sort((a, b) => a - b);
  }

  if (strategy === 'balanced') {
    return balancedPick(byNorm.slice(0, 15), byNorm.slice(-15));
  }

  return [];
}

function balancedPick(hotPool, coldPool) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const hot3  = sample(hotPool, 3);
    const cold3 = sample(coldPool, 3);
    const picks = [...hot3, ...cold3];

    if (new Set(picks).size < 6) continue;

    const odd = picks.filter(n => n % 2 !== 0).length;
    const low = picks.filter(n => n <= 29).length;

    if (odd >= 2 && odd <= 4 && low >= 2 && low <= 4) {
      return picks.sort((a, b) => a - b);
    }
  }
  // Fallback — near-impossible to reach with these pool sizes
  return [...sample(hotPool, 3), ...sample(coldPool, 3)].sort((a, b) => a - b);
}

function showSuggestion(strategy) {
  const balls     = pickNumbers(strategy);
  const container = document.getElementById('suggestion-balls');

  container.innerHTML = '';
  balls.forEach(n => {
    const span = document.createElement('span');
    span.className = 'ball ball--pick';
    span.textContent = n;
    container.appendChild(span);
  });

  document.getElementById('strategy-desc').textContent = STRATEGY_META[strategy].desc;
}

function initSuggestions() {
  document.querySelectorAll('.strategy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _currentStrategy = btn.dataset.strategy;
      showSuggestion(_currentStrategy);
    });
  });

  document.getElementById('regenerate-btn').addEventListener('click', () => {
    const btn = document.getElementById('regenerate-btn');
    btn.classList.add('spinning');
    btn.addEventListener('animationend', () => btn.classList.remove('spinning'), { once: true });
    showSuggestion(_currentStrategy);
  });

  showSuggestion('hot');
}

initLotto();
