/* ══════════════════════════════════════════════════════════
   TravelRunning — Shared API Helpers
   Event config loading, error rendering
   ══════════════════════════════════════════════════════════ */
window.TR = window.TR || {};

/**
 * Load event config from n8n proxy webhook (no token in browser).
 * @param {string} eventId
 * @returns {Promise<{event: Object, distances: Array}>}
 */
TR.loadEventConfig = async function(eventId) {
  var url = TR.CONFIG.N8N_BASE_URL + '/webhook/evento-config?event_id=' + encodeURIComponent(eventId);
  var res = await fetch(url);
  if (!res.ok) throw new Error('Servizio non disponibile. Riprova tra qualche minuto.');
  var data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
};

/** Render error state in #main-content (preventivo style) */
TR.renderError = function(msg) {
  var main = TR.qs('#main-content') || TR.qs('.main-wrap');
  if (!main) return;
  main.innerHTML =
    '<div class="load-error">' +
      '<h2>Evento non disponibile</h2>' +
      '<p>' + (TR.escapeHtml ? TR.escapeHtml(msg) : msg) + '</p>' +
      '<p style="margin-top:16px">Per assistenza: <a href="mailto:info@travelrunning.it">info@travelrunning.it</a></p>' +
    '</div>';
  var heroName = TR.$('hero-event-name');
  if (heroName) heroName.textContent = 'TravelRunning';
};
