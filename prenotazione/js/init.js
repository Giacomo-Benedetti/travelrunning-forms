/* ==============================================================
   TravelRunning — Prenotazione: Init
   Entry point — reads ?token= param, loads config, builds form
   ============================================================== */
// Hide logo gracefully if image fails to load (replaces inline onerror for CSP compliance)
var logoImg = document.getElementById('logo-img');
if (logoImg) logoImg.addEventListener('error', function() { this.style.display = 'none'; });

(async function() {
  var params = new URLSearchParams(window.location.search);
  var token  = params.get('token');

  if (!token) {
    TR.Prenota.showError('Link non valido: token mancante.');
    return;
  }

  TR.STATE.token = token;

  try {
    var res = await fetch(TR.Prenota.CONFIG.N8N_CONFIG_URL + '?token=' + encodeURIComponent(token));
    var data = await res.json();

    if (!res.ok || data.error) {
      TR.Prenota.showError(data.error || 'Link non valido o gi\u00e0 utilizzato.');
      return;
    }

    TR.STATE.event = data.event;
    TR.STATE.distances = data.distances || [];
    TR.STATE.volo = (data.volo && data.volo.id) ? data.volo : null;
    TR.STATE.hotel_options = data.hotel_options || [];

    // Determine selected hotel: match by hotel_opzione_id if present, else primary
    var hotelOpts = TR.STATE.hotel_options;
    if (hotelOpts.length > 0) {
      var hoId = (data.richiesta && data.richiesta.hotel_opzione_id)
        || (data.prenotazione && data.prenotazione.hotel_opzione_id)
        || null;
      TR.STATE.selectedHotel = hoId
        ? hotelOpts.find(function(h) { return h.id === hoId; }) || hotelOpts[0]
        : hotelOpts[0];
    }

    if (data.modalita === 'modifica') {
      TR.STATE.modalita = 'modifica';
      TR.STATE.prenotazione = data.prenotazione;
      TR.STATE.existing_partecipanti = data.partecipanti || [];
      TR.STATE.existing_pettorali = data.pettorali || [];
      // Map prenotazione fields to richiesta shape for shared rendering
      var p = data.prenotazione;
      TR.STATE.richiesta = {
        ...p,
        importo_preventivo: p.prezzo_totale || 0,
        importo_camere: p.prezzo_camere || 0,
        importo_pettorali: p.prezzo_pettorali || 0,
        n_pettorali: p.n_pettorali || 0,
        distanze_selezionate: [],
        distanze_quote: {},
      };
      TR.STATE.n_partecipanti = p.n_partecipanti || 1;
      TR.STATE.servizi = {
        visita_guidata: p.visita_guidata || false,
        cena_conviviale: p.cena_conviviale || false,
        ass_annullamento: p.ass_annullamento || false,
        ass_medica: p.ass_medica || false,
      };
    } else {
      TR.STATE.richiesta = data.richiesta;
      TR.STATE.n_partecipanti = TR.calcNPartecipanti(data.richiesta);
    }

    TR.Prenota.renderPage();
    TR.Prenota.wireSubmit();
  } catch (e) {
    TR.Prenota.showError('Errore di connessione. Riprova pi\u00f9 tardi.');
  }
})();
