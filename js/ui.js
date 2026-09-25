// Aplicar el tema lo antes posible para evitar el parpadeo al cargar
initializeTheme();

document.addEventListener('DOMContentLoaded', function () {
  setupThemeToggle();
  setupCalculatorForm();
  loadAnalytics();
});

function getSavedTheme() {
  try {
    return localStorage.getItem('theme');
  } catch (e) {
    return null;
  }
}

function initializeTheme() {
  const savedTheme = getSavedTheme() ||
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
}

function setupThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  const paint = () => {
    const dark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  };

  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* sin almacenamiento */ }
    paint();
    document.dispatchEvent(new CustomEvent('themechange'));
  });

  paint();
}

// Enter calcula; "Limpiar" restablece los valores y oculta los resultados
function setupCalculatorForm() {
  const form = document.getElementById('calcForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fn = window[form.dataset.calculate];
    if (typeof fn === 'function') fn();
  });

  form.addEventListener('reset', () => {
    if (typeof hideResults === 'function') hideResults();
  });
}

function loadAnalytics() {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
      page_title: document.title,
      page_path: window.location.pathname
    });
  }
}
