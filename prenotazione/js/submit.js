/* ==============================================================
   TravelRunning — Prenotazione: Form Submit Handler
   ============================================================== */
window.TR = window.TR || {};
TR.Prenota = TR.Prenota || {};

TR.Prenota.wireSubmit = function() {
  var form = TR.$('prenota-form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    var S = TR.STATE;
    TR.$('form-error').classList.add('hidden');
    // Clear previous validation highlights
    document.querySelectorAll('.field.invalid').forEach(function(f) { f.classList.remove('invalid'); });

    // Volo confirmation (manual check - skip in mod mode)
    if (S.modalita !== 'modifica' && S.volo) {
      var chkVolo = TR.$('chk-volo');
      if (chkVolo && !chkVolo.checked) {
        var errEl = TR.$('form-error');
        errEl.textContent = 'Devi confermare i dettagli del volo prima di procedere.';
        errEl.classList.remove('hidden');
        chkVolo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    if (!e.target.checkValidity()) {
      // Highlight all invalid fields in red
      e.target.querySelectorAll(':invalid').forEach(function(el) {
        var field = el.closest('.field');
        if (field) {
          field.classList.add('invalid');
          el.addEventListener('input', function() { field.classList.remove('invalid'); }, { once: true });
          el.addEventListener('change', function() { field.classList.remove('invalid'); }, { once: true });
        }
      });
      e.target.reportValidity();
      return;
    }

    // Mod mode: must have at least one change (new participant, pettorale, or service)
    if (S.modalita === 'modifica' && TR.Prenota.effectiveNewParts() === 0 && TR.Prenota.effectiveNewPetts() === 0) {
      var sm = S.servizi_modifica;
      var hasNewServizi = (sm.visita_guidata && !S.prenotazione.visita_guidata) ||
        (sm.cena_conviviale && !S.prenotazione.cena_conviviale) ||
        (sm.ass_annullamento && !S.prenotazione.ass_annullamento) ||
        (sm.ass_medica && !S.prenotazione.ass_medica);
      if (!hasNewServizi) {
        var errEl2 = TR.$('form-error');
        errEl2.textContent = 'Aggiungi almeno un nuovo partecipante, pettorale o servizio prima di confermare.';
        errEl2.classList.remove('hidden');
        return;
      }
    }

    // Mod mode: room capacity must match total participants when camere card is visible
    var camereCard = TR.$('modifica-camere-card');
    if (S.modalita === 'modifica' && camereCard && !camereCard.classList.contains('hidden')) {
      var totalPart = S.existing_partecipanti.length + TR.Prenota.effectiveNewParts();
      var posti = TR.calcPostiFromRooms(TR.Prenota.getModRoomCounts());
      if (posti !== totalPart) {
        var errEl3 = TR.$('form-error');
        errEl3.textContent = 'I posti nelle camere (' + posti + ') devono corrispondere al numero di partecipanti (' + totalPart + ').';
        errEl3.classList.remove('hidden');
        camereCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    var fd = new FormData(e.target);
    var g  = function(k) { return fd.get(k) || null; };

    var payload;

    if (S.modalita === 'modifica') {
      // ── Modification payload ──
      var new_partecipanti = [];
      var indiceOffset = 0;
      for (var n = 1; n <= S.new_part_counter; n++) {
        if (S.deleted_new_parts.has(n)) continue;
        indiceOffset++;
        new_partecipanti.push({
          ref: 'new_' + n,
          indice: S.existing_partecipanti.length + indiceOffset,
          nome:          g('np' + n + '_nome'),
          cognome:       g('np' + n + '_cognome'),
          data_nascita:  g('np' + n + '_data_nascita'),
          luogo_nascita: g('np' + n + '_luogo_nascita'),
          nazione:       g('np' + n + '_nazione') || 'Italia',
          doc_tipo:      g('np' + n + '_doc_tipo'),
          doc_numero:    g('np' + n + '_doc_numero'),
          doc_scadenza:  g('np' + n + '_doc_scadenza'),
          telefono:      g('np' + n + '_telefono'),
        });
      }

      var new_pettorali = [];
      for (var i = 1; i <= S.new_pett_counter; i++) {
        if (S.deleted_new_petts.has(i)) continue;
        var distanza_id = g('npett' + i + '_distanza');
        if (!distanza_id) continue;
        var participant_ref = g('npett' + i + '_partecipante');
        var partSel = document.querySelector('[name="npett' + i + '_partecipante"]');
        var participant_nome = '';
        if (partSel && partSel.options[partSel.selectedIndex]) {
          participant_nome = partSel.options[partSel.selectedIndex].textContent.replace(/\s*\(P\d+\)\s*$/, '').trim();
        }
        var dist = S.distances.find(function(d) { return d.id === distanza_id; });
        new_pettorali.push({
          participant_ref: participant_ref,
          participant_nome: participant_nome,
          distanza_id: distanza_id,
          prezzo_pettorale: (dist ? dist.prezzo_pettorale : 0) || 0,
          distanza_nome:    dist ? dist.nome_distanza : null,
          taglia_maglia:       g('npett' + i + '_taglia_maglia'),
          codice_fiscale:      g('npett' + i + '_codice_fiscale'),
          indirizzo:           g('npett' + i + '_indirizzo'),
          citta:               g('npett' + i + '_citta'),
          cap:                 g('npett' + i + '_cap'),
          provincia:           g('npett' + i + '_provincia'),
          email:               g('npett' + i + '_email'),
          emergenza_nome:      g('npett' + i + '_emergenza_nome'),
          emergenza_telefono:  g('npett' + i + '_emergenza_telefono'),
          societa_sportiva:    g('npett' + i + '_societa_sportiva'),
          federazione:         g('npett' + i + '_federazione'),
          tessera_numero:      g('npett' + i + '_tessera_numero'),
          tessera_scadenza:    g('npett' + i + '_tessera_scadenza'),
          cert_medico_data:    g('npett' + i + '_cert_medico_data'),
          miglior_prestazione: g('npett' + i + '_miglior_prestazione'),
        });
      }

      // Room changes (only if camere card is visible AND values actually changed)
      var camereCardVisible = camereCard && !camereCard.classList.contains('hidden');
      var camere_modificate = null;
      if (camereCardVisible) {
        var newRooms = TR.Prenota.getModRoomCounts();
        var roomFields = ['n_singole','n_doppie','n_matrimoniali','n_triple','n_quadruple','n_mat3_ragazzo','n_mat3_bambino'];
        var changed = roomFields.some(function(f) { return (newRooms[f] || 0) !== (S.prenotazione[f] || 0); });
        camere_modificate = changed ? newRooms : null;
      }

      // Newly added services (only ones not already in the booking)
      var new_servizi = {};
      var sm = S.servizi_modifica;
      if (sm.visita_guidata && !S.prenotazione.visita_guidata)     new_servizi.visita_guidata = true;
      if (sm.cena_conviviale && !S.prenotazione.cena_conviviale)   new_servizi.cena_conviviale = true;
      if (sm.ass_annullamento && !S.prenotazione.ass_annullamento) new_servizi.ass_annullamento = true;
      if (sm.ass_medica && !S.prenotazione.ass_medica)             new_servizi.ass_medica = true;

      payload = {
        token: S.token,
        modalita: 'modifica',
        prenotazione_id: S.prenotazione.record_id,
        n_new_partecipanti: TR.Prenota.effectiveNewParts(),
        new_partecipanti: new_partecipanti,
        new_pettorali: new_pettorali,
        volo_id: S.volo ? S.volo.id : null,
        camere_modificate: camere_modificate,
        new_servizi: Object.keys(new_servizi).length > 0 ? new_servizi : null,
        consenso_modifica_timestamp: new Date().toISOString(),
        consenso_modifica_device:    navigator.userAgent,
        consenso_modifica_versione:  'TC-2026-v1 — https://travelrunning.it/termini-condizioni',
      };
    } else {
      // ── Normal booking payload ──
      var contraente = {
        nome:          g('c_nome'),
        cognome:       g('c_cognome'),
        email:         g('c_email'),
        telefono:      g('c_telefono'),
        data_nascita:  g('c_data_nascita'),
        luogo_nascita: g('c_luogo_nascita'),
        nazionalita:   g('c_nazionalita'),
        codice_fiscale:(g('c_codice_fiscale') || '').toUpperCase(),
        indirizzo:     g('c_indirizzo'),
        citta:         g('c_citta'),
        cap:           g('c_cap'),
        provincia:     g('c_provincia'),
        doc_tipo:      g('c_doc_tipo'),
        doc_numero:    g('c_doc_numero'),
        doc_scadenza:  g('c_doc_scadenza'),
      };

      var nPart = S.n_partecipanti;
      var partecipanti = [];
      for (var pi = 1; pi <= nPart; pi++) {
        partecipanti.push({
          indice:        pi,
          nome:          g('p' + pi + '_nome'),
          cognome:       g('p' + pi + '_cognome'),
          data_nascita:  g('p' + pi + '_data_nascita'),
          luogo_nascita: g('p' + pi + '_luogo_nascita'),
          nazione:       g('p' + pi + '_nazione') || 'Italia',
          doc_tipo:     g('p' + pi + '_doc_tipo')    || (pi === 1 ? g('c_doc_tipo')     : null),
          doc_numero:   g('p' + pi + '_doc_numero')  || (pi === 1 ? g('c_doc_numero')   : null),
          doc_scadenza: g('p' + pi + '_doc_scadenza') || (pi === 1 ? g('c_doc_scadenza') : null),
          telefono:     pi === 1 ? null : g('p' + pi + '_telefono'),
        });
      }

      var nPett = S.richiesta.n_pettorali || 0;
      var pettorali = [];
      for (var qi = 1; qi <= nPett; qi++) {
        var distanza_id2 = g('pett' + qi + '_distanza');
        if (!distanza_id2) continue;
        var indice_partecipante = parseInt(g('pett' + qi + '_partecipante')) || 1;
        var dist2 = S.distances.find(function(d) { return d.id === distanza_id2; });
        pettorali.push({
          indice_partecipante: indice_partecipante,
          distanza_id: distanza_id2,
          prezzo_pettorale: (dist2 ? dist2.prezzo_pettorale : 0) || 0,
          distanza_nome:    dist2 ? dist2.nome_distanza : null,
          taglia_maglia:       g('pett' + qi + '_taglia_maglia'),
          codice_fiscale:      indice_partecipante === 1 ? null : g('pett' + qi + '_codice_fiscale'),
          indirizzo:           indice_partecipante === 1 ? null : g('pett' + qi + '_indirizzo'),
          citta:               indice_partecipante === 1 ? null : g('pett' + qi + '_citta'),
          cap:                 indice_partecipante === 1 ? null : g('pett' + qi + '_cap'),
          provincia:           indice_partecipante === 1 ? null : g('pett' + qi + '_provincia'),
          email:               indice_partecipante === 1 ? null : g('pett' + qi + '_email'),
          emergenza_nome:      g('pett' + qi + '_emergenza_nome'),
          emergenza_telefono:  g('pett' + qi + '_emergenza_telefono'),
          societa_sportiva:    g('pett' + qi + '_societa_sportiva'),
          federazione:         g('pett' + qi + '_federazione'),
          tessera_numero:      g('pett' + qi + '_tessera_numero'),
          tessera_scadenza:    g('pett' + qi + '_tessera_scadenza'),
          cert_medico_data:    g('pett' + qi + '_cert_medico_data'),
          miglior_prestazione: g('pett' + qi + '_miglior_prestazione'),
        });
      }

      payload = {
        token: S.token,
        contraente: contraente,
        n_partecipanti: nPart,
        visita_guidata:   S.servizi.visita_guidata,
        cena_conviviale:  S.servizi.cena_conviviale,
        ass_annullamento: S.servizi.ass_annullamento,
        ass_medica:       S.servizi.ass_medica,
        partecipanti: partecipanti,
        pettorali: pettorali,
        volo_id: S.volo ? S.volo.id : null,
        consenso_tc_timestamp: new Date().toISOString(),
        consenso_tc_device:    navigator.userAgent,
        consenso_tc_versione:  'TC-2026-v1 \u2014 https://travelrunning.it/termini-condizioni',
      };
    }

    var btn = TR.$('btn-submit');
    btn.disabled = true;
    btn.textContent = 'Invio in corso\u2026';

    try {
      var submitUrl = S.modalita === 'modifica' ? TR.Prenota.CONFIG.N8N_SUBMIT_MOD_URL : TR.Prenota.CONFIG.N8N_SUBMIT_URL;
      var res  = await fetch(submitUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      var data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Errore ' + res.status);
      }

      // Show success
      TR.$('prenota-form').style.display = 'none';
      TR.$('event-banner').style.display = 'none';
      var sp = TR.$('success-page');
      sp.style.display = 'block';
      if (S.modalita === 'modifica') {
        sp.querySelector('h2').textContent = 'Modifica Confermata!';
        sp.querySelector('p').textContent = 'I nuovi partecipanti sono stati aggiunti alla prenotazione.';
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      var errEl4 = TR.$('form-error');
      errEl4.textContent = err.message || 'Errore durante l\'invio. Riprova.';
      errEl4.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = S.modalita === 'modifica' ? 'Conferma Modifica' : 'Conferma Prenotazione';
    }
  });
};
