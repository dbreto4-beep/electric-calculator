// Gráfica de caída de tensión (%) para cada sección normalizada (Chart.js 3)
let voltageDropChart = null;
let lastChartArgs = null;

function renderVoltageDropChart(power, voltage, distance, material, selectedSection) {
  const canvas = document.getElementById('dropChart');
  if (!canvas || typeof Chart === 'undefined') return;

  lastChartArgs = [power, voltage, distance, material, selectedSection];

  const sections = STANDARD_SECTIONS;
  const drops = sections.map(s => voltageDropVolts(power, voltage, distance, s, material) / voltage * 100);

  const colors = drops.map((d, i) => {
    if (sections[i] === selectedSection) return '#1E40AF';
    if (d <= 3) return 'rgba(40, 167, 69, 0.55)';
    if (d <= 5) return 'rgba(252, 211, 77, 0.8)';
    return 'rgba(220, 53, 69, 0.55)';
  });

  const dark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  const textColor = dark ? '#cbd5e1' : '#475569';
  const gridColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const yMax = Math.min(Math.max(8, Math.ceil(drops[0] * 1.1)), 20);

  const limitLine = (value, color) => ({
    type: 'line',
    data: sections.map(() => value),
    borderColor: color,
    borderWidth: 2,
    borderDash: [6, 4],
    pointRadius: 0,
    fill: false
  });

  if (voltageDropChart) voltageDropChart.destroy();

  voltageDropChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sections.map(s => s + ' mm²'),
      datasets: [
        Object.assign(limitLine(3, '#28a745'), { label: 'Límite 3 % (alumbrado)' }),
        Object.assign(limitLine(5, '#dc3545'), { label: 'Límite 5 % (otros usos)' }),
        {
          type: 'bar',
          label: 'Caída de tensión (%)',
          data: drops.map(d => Math.min(d, yMax)),
          backgroundColor: colors,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: yMax,
          ticks: { color: textColor, callback: v => v + ' %' },
          grid: { color: gridColor }
        },
        x: { ticks: { color: textColor }, grid: { display: false } }
      },
      plugins: {
        legend: { labels: { color: textColor, boxWidth: 14 } },
        tooltip: {
          callbacks: {
            label: ctx => ctx.dataset.type === 'line'
              ? ctx.dataset.label
              : 'Caída: ' + fmt(drops[ctx.dataIndex], 2) + ' %'
          }
        }
      }
    }
  });
}

// Redibujar con los colores del tema al cambiar claro/oscuro
document.addEventListener('themechange', () => {
  if (lastChartArgs) renderVoltageDropChart(...lastChartArgs);
});
