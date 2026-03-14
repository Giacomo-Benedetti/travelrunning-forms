/* ==============================================================
   TravelRunning — Prenotazione: Render Page & Volo
   ============================================================== */
window.TR = window.TR || {};
TR.Prenota = TR.Prenota || {};

TR.Prenota.showError = function(msg) {
  TR.$('loading-state').classList.add('hidden');
  TR.$('error-state').classList.remove('hidden');
  TR.$('error-msg').textContent = msg;
};

TR.Prenota.renderPage = function() {
  var S = TR.STATE;
  var r = S.richiesta;
  var ev = S.event;

  // Banner
  TR.$('event-banner').style.display = '';
  TR.$('banner-title').textContent = ev.nome_evento || '';

  var isMod = S.modalita === 'modifica';

  if (isMod) {
    document.querySelector('.ev-pretitle').textContent = 'Modifica prenotazione per';
    document.title = 'Modifica Prenotazione — TravelRunning';
    // Show mod info card, hide contraente (servizi stays visible)
    TR.$('mod-info-head').classList.remove('hidden');
    TR.$('mod-info-card').classList.remove('hidden');
    TR.$('contraente-head').style.display = 'none';
    TR.$('contraente-card').style.display = 'none';
    // Remove required from hidden contraente fields
    TR.$('contraente-card').querySelectorAll('[required]').forEach(function(el) { el.removeAttribute('required'); });
    // Populate mod info
    var p1 = S.existing_partecipanti.find(function(p) { return p.indice_passeggero === 1; }) || S.existing_partecipanti[0];
    var p1Name = p1 ? (p1.nome + ' ' + p1.cognome) : '';
    TR.$('mod-info-title').textContent = 'Prenotazione ' + (r.riferimento_prenotazione || S.prenotazione.record_id);
    TR.$('mod-info-details').textContent = 'Contraente: ' + p1Name + ' \u2014 ' + S.n_partecipanti + ' partecipanti, ' + (r.notti || '\u2014') + ' notti';
    // Volo: hide confirmation checkbox in mod mode
    var chkVolo = TR.$('chk-volo');
    if (chkVolo) { chkVolo.checked = true; chkVolo.closest('.condizioni-row').style.display = 'none'; }
  } else {
    // Prefill contraente from richiesta data
    if (r.nome)     { TR.$('c_nome').value    = r.nome; }
    if (r.cognome)  { TR.$('c_cognome').value = r.cognome; }
    if (r.email)    { var el = document.querySelector('[name="c_email"]');    if (el) el.value = r.email; }
    if (r.telefono) { var el2 = document.querySelector('[name="c_telefono"]'); if (el2) el2.value = r.telefono; }
  }

  // Section 1 - Riepilogo
  TR.$('s-evento').textContent = ev.data_evento
    ? (ev.nome_evento || '\u2014') + ' \u2014 ' + TR.fmtDate(ev.data_evento)
    : ev.nome_evento || '\u2014';
  TR.$('s-hotel').textContent    = (S.selectedHotel ? S.selectedHotel.hotel_nome : ev.hotel_nome) || '\u2014';
  TR.$('s-checkin').textContent  = TR.fmtDate(r.checkin);
  TR.$('s-checkout').textContent = TR.fmtDate(r.checkout);
  TR.$('s-partecipanti').textContent = S.n_partecipanti ? S.n_partecipanti + (S.n_partecipanti === 1 ? ' persona' : ' persone') : '\u2014';

  // Camere
  var camere = [];
  if (r.n_singole)       camere.push(r.n_singole + ' singola' + (r.n_singole > 1 ? 'e' : ''));
  if (r.n_doppie)        camere.push(r.n_doppie + ' doppia' + (r.n_doppie > 1 ? 'e' : ''));
  if (r.n_matrimoniali)  camere.push(r.n_matrimoniali + ' matrimoniale' + (r.n_matrimoniali > 1 ? 'i' : ''));
  if (r.n_mat3_ragazzo)  camere.push(r.n_mat3_ragazzo + ' mat+ragazzo');
  if (r.n_mat3_bambino)  camere.push(r.n_mat3_bambino + ' mat+bambino');
  if (r.n_triple)        camere.push(r.n_triple + ' tripla' + (r.n_triple > 1 ? 'e' : ''));
  if (r.n_quadruple)     camere.push(r.n_quadruple + ' quadrupla' + (r.n_quadruple > 1 ? 'e' : ''));
  if (r.modifica_soggiorno && r.modifica_soggiorno !== 'Nessuna') camere.push('(modifica: ' + r.modifica_soggiorno + ')');
  TR.$('s-camere').textContent    = camere.length ? camere.join(', ') : '\u2014';
  TR.$('s-pettorali').textContent = r.n_pettorali > 0 ? r.n_pettorali : 'Nessuno';

  // Section 3 - Partecipanti info
  TR.$('part-info-text').textContent = 'Partecipanti al viaggio: ' + S.n_partecipanti + ' (in base alle camere prenotate)';

  // Section 1b - Volo
  TR.Prenota.renderVolo();

  // Section 3 - Servizi
  if (isMod) {
    TR.Prenota.renderServiziModifica();
  } else {
    TR.Prenota.renderServizi();
  }

  // Sections 4+5 - dynamic
  TR.Prenota.renderPartecipanti();
  TR.Prenota.renderPettorali();

  // Price summary
  TR.Prenota.updatePriceSummary();

  // Show form
  TR.$('loading-state').classList.add('hidden');
  TR.$('prenota-form').classList.remove('hidden');

  // Wire contraente -> P1 sync (not needed in mod mode)
  if (!isMod) TR.Prenota.wireContraenteSync();

  // Wire tel validation on all tel inputs
  document.querySelectorAll('input[type="tel"]').forEach(TR.attachTelValidation);

  // Wire condizioni checkbox
  TR.$('chk-condizioni').addEventListener('change', TR.Prenota.updateSubmitBtn);

  // Mod mode: update button text and section headers
  if (isMod) {
    TR.$('btn-submit').textContent = 'Conferma Modifica';
    document.querySelector('#pettorali-title').textContent = 'Pettorali Gara';
  }
};

TR.Prenota.renderVolo = function() {
  var card = TR.$('volo-card');
  var head = TR.$('volo-head');
  if (!TR.STATE.volo) { if (card) card.style.display = 'none'; if (head) head.style.display = 'none'; return; }
  card.style.display = '';
  if (head) head.style.display = '';

  var v = TR.STATE.volo;
  // Convert UTC ISO string to Europe/Rome display
  var fmtDT = function(dt) {
    return dt
      ? new Date(dt).toLocaleString('it-IT', {
          timeZone: 'Europe/Rome',
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '\u2014';
  };

  TR.$('volo-compagnia').textContent   = v.compagnia || '\u2014';
  TR.$('volo-tratta').textContent      = (v.aeroporto_partenza || '?') + ' \u2192 ' + (v.aeroporto_arrivo || '?');
  TR.$('volo-partenza').textContent    = fmtDT(v.partenza);
  TR.$('volo-ritorno').textContent     = fmtDT(v.ritorno);
  TR.$('volo-prezzo-pp').textContent   = v.prezzo_per_persona  ? TR.fmt(v.prezzo_per_persona)  : '\u2014';
  TR.$('volo-prezzo-tot').textContent  = v.prezzo_totale_volo  ? TR.fmt(v.prezzo_totale_volo)  : '\u2014';

  if (v.note_volo) {
    TR.$('volo-note').textContent = v.note_volo;
    TR.$('volo-note-row').classList.remove('hidden');
  }
};
