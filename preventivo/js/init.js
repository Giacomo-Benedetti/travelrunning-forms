/* ══════════════════════════════════════════════════════════
   TravelRunning — Preventivo: Init
   Entry point — reads ?event= param, loads config, builds form
   ══════════════════════════════════════════════════════════ */
(async function() {
  var eventId = TR.getParam('event');

  if (!eventId) {
    TR.renderError('Nessun evento specificato nell\'URL. Usa il link corretto ricevuto da TravelRunning.');
    return;
  }

  try {
    var config = await TR.loadEventConfig(eventId);
    TR.Preventivo.buildForm(eventId, config);
  } catch (err) {
    console.error(err);
    TR.renderError(err.message || 'Impossibile caricare i dati dell\'evento. Riprova tra qualche minuto.');
  }
})();
