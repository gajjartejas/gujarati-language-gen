/**
 * theme.js: Handles Dark/Light mode theme toggle with localStorage persistence.
 */

(function () {
  const THEME_KEY = 'gujarati_font_theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const btn = document.getElementById('btn-theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'light' ? '🌙' : '☀️';
      btn.title = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    }
  }

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
  };

  // Initialize early
  const initial = getPreferredTheme();
  applyTheme(initial);

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(initial);
  });
})();
