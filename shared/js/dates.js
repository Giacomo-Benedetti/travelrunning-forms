/* ══════════════════════════════════════════════════════════
   TravelRunning — Shared Date Helpers
   ══════════════════════════════════════════════════════════ */
window.TR = window.TR || {};

/** Parse Airtable YYYY-MM-DD string to Date */
TR.parseAirtableDate = function(str) {
  if (!str) return null;
  var parts = str.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

/** Format Date as Italian long form: "02 marzo 2026" */
TR.formatDateIT = function(date) {
  if (!date) return '';
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
};

/** Format Date as ISO: "2026-03-02" */
TR.formatDateISO = function(date) {
  if (!date) return '';
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
};

/** Add N days to a date (returns new Date) */
TR.addDays = function(date, n) {
  var d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
