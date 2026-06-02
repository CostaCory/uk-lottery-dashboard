async function initLotto() {
  const resp = await fetch('data/lotto.csv');
  const text = await resp.text();
  const rows = text.trim().split('\n').slice(1); // skip header

  // Count frequency of each main ball (1-59); bonus ball excluded
  const freq = Array(60).fill(0); // index 0 unused

  for (const row of rows) {
    const cols = row.split(',');
    // columns: DrawNo,Day,DD,MMM,YYYY,N1,N2,N3,N4,N5,N6,BonusBall,...
    for (let i = 5; i <= 10; i++) {
      const n = parseInt(cols[i], 10);
      if (n >= 1 && n <= 59) freq[n]++;
    }
  }

  const totalDraws = rows.length;
  const numbers = Array.from({ length: 59 }, (_, i) => i + 1);

  renderChart(numbers, freq);
  renderHotCold(numbers, freq, totalDraws);
}

// ── Bar chart ──────────────────────────────────────────────
function renderChart(numbers, freq) {
  const counts = numbers.map(n => freq[n]);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

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
            label: item => ` Drawn ${item.raw} times`,
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
          title: { display: true, text: 'Frequency', color: '#718096' },
          ticks: { font: { size: 11 } },
          grid: { color: '#e2e8f0' },
        }
      }
    }
  });
}

// ── Hot / Cold table ───────────────────────────────────────
function renderHotCold(numbers, freq, totalDraws) {
  const sorted = [...numbers].sort((a, b) => freq[b] - freq[a]);
  const hot  = sorted.slice(0, 10);
  const cold = sorted.slice(-10).reverse();

  const pct = n => ((freq[n] / totalDraws) * 100).toFixed(1);

  document.getElementById('lotto-draws-count').textContent =
    `Based on ${totalDraws.toLocaleString()} draws`;

  const hotBody  = document.getElementById('hot-body');
  const coldBody = document.getElementById('cold-body');

  hot.forEach((n, i) => {
    hotBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${i + 1}</td>
        <td><span class="ball ball--hot">${n}</span></td>
        <td>${freq[n]}</td>
        <td>${pct(n)}%</td>
      </tr>`);
  });

  cold.forEach((n, i) => {
    coldBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${i + 1}</td>
        <td><span class="ball ball--cold">${n}</span></td>
        <td>${freq[n]}</td>
        <td>${pct(n)}%</td>
      </tr>`);
  });
}

initLotto();
