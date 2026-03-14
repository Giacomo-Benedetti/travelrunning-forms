/* ══════════════════════════════════════════════════════════
   TravelRunning — Shared Utilities
   DOM helpers, URL params, formatting
   ══════════════════════════════════════════════════════════ */
window.TR = window.TR || {};

/** querySelector shorthand */
TR.qs = function(selector, ctx) {
  return (ctx || document).querySelector(selector);
};

/** getElementById shorthand */
TR.$ = function(id) {
  return document.getElementById(id);
};

/** Get URL query parameter */
TR.getParam = function(key) {
  return new URLSearchParams(window.location.search).get(key) || '';
};

/** Format price as €X (0 decimals) */
TR.formatPrice = function(val) {
  if (!val) return '';
  return '€' + Number(val).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

/** Format price as €X.XX (2 decimals, used by prenotazione) */
TR.fmt = function(n) {
  return '€' + Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** Format date string as DD/MM/YYYY */
TR.fmtDate = function(d) {
  return d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
};

/** Show/hide element by id */
TR.toggle = function(id, show) {
  var el = TR.$(id);
  if (el) el.classList.toggle('hidden', !show);
};

/** Escape HTML special characters to prevent XSS */
TR.escapeHtml = function(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};
