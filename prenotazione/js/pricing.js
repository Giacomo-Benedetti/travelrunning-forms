/* ==============================================================
   TravelRunning — Prenotazione: Pricing & Room Validation
   ============================================================== */
window.TR = window.TR || {};
TR.Prenota = TR.Prenota || {};

// ── Price summary (formulas aligned with WF-PRICING canonical engine) ──
TR.Prenota.updatePriceSummary = function() {
  var S = TR.STATE;
  if (S.modalita === 'modifica') return TR.Prenota.updatePriceSummaryModifica();

  var r  = S.richiesta;
  var ev = S.event;
  var sv = S.servizi;
  var n  = S.n_partecipanti;

  var prezzo_pettorali = r.importo_pettorali || 0;
  var prezzo_volo      = S.volo ? (S.volo.prezzo_totale_volo || 0) : 0;
  var prezzo_camere    = r.importo_camere || 0;
  var prezzo_visita    = sv.visita_guidata   ? (ev.visita_guidata_prezzo   || 0) * n : 0;
  var prezzo_cena      = sv.cena_conviviale  ? (ev.cena_conviviale_prezzo  || 0) * n : 0;
  var prezzo_servizi   = prezzo_visita + prezzo_cena;

  var ass_ann_base   = prezzo_camere + prezzo_pettorali + prezzo_volo;
  var prezzo_ass_ann = sv.ass_annullamento ? Math.round(ass_ann_base * (ev.ass_annullamento_perc || 0) / 100 * 100) / 100 : 0;
  var prezzo_ass_med = sv.ass_medica       ? (ev.ass_medica_prezzo || 0) * n : 0;
  var prezzo_assicurazioni = prezzo_ass_ann + prezzo_ass_med;

  var totale = prezzo_camere + prezzo_pettorali + prezzo_volo + prezzo_servizi + prezzo_assicurazioni;

  // Update DOM
  TR.$('pr-camere').textContent = TR.fmt(prezzo_camere);

  TR.toggle('pr-pett-row',   prezzo_pettorali > 0);
  TR.$('pr-pettorali').textContent = TR.fmt(prezzo_pettorali);

  TR.toggle('pr-volo-row',   prezzo_volo > 0);
  TR.$('pr-volo').textContent = TR.fmt(prezzo_volo);

  TR.toggle('pr-visita-row', prezzo_visita > 0);
  TR.$('pr-visita').textContent = TR.fmt(prezzo_visita);

  TR.toggle('pr-cena-row',   prezzo_cena > 0);
  TR.$('pr-cena').textContent = TR.fmt(prezzo_cena);

  TR.toggle('pr-assann-row', prezzo_ass_ann > 0);
  TR.$('pr-assann').textContent = TR.fmt(prezzo_ass_ann);

  TR.toggle('pr-assmed-row', prezzo_ass_med > 0);
  TR.$('pr-assmed').textContent = TR.fmt(prezzo_ass_med);

  TR.$('pr-totale').textContent = TR.fmt(totale);
};

// ── Get modification room counts from inputs ──
TR.Prenota.getModRoomCounts = function() {
  return {
    n_singole:      parseInt(TR.$('mod_n_singole')      ? TR.$('mod_n_singole').value      : '0') || 0,
    n_doppie:       parseInt(TR.$('mod_n_doppie')       ? TR.$('mod_n_doppie').value       : '0') || 0,
    n_matrimoniali: parseInt(TR.$('mod_n_matrimoniali') ? TR.$('mod_n_matrimoniali').value : '0') || 0,
    n_triple:       parseInt(TR.$('mod_n_triple')       ? TR.$('mod_n_triple').value       : '0') || 0,
    n_quadruple:    parseInt(TR.$('mod_n_quadruple')    ? TR.$('mod_n_quadruple').value    : '0') || 0,
    n_mat3_ragazzo: parseInt(TR.$('mod_n_mat3_ragazzo') ? TR.$('mod_n_mat3_ragazzo').value : '0') || 0,
    n_mat3_bambino: parseInt(TR.$('mod_n_mat3_bambino') ? TR.$('mod_n_mat3_bambino').value : '0') || 0,
  };
};

// ── Show modification camere card ──
TR.Prenota.showModCamereCard = function() {
  var card = TR.$('modifica-camere-card');
  if (!card || !card.classList.contains('hidden')) return;
  card.classList.remove('hidden');
  var camHead = TR.$('modifica-camere-head');
  if (camHead) camHead.classList.remove('hidden');
  // Pre-fill with current room counts
  var p = TR.STATE.prenotazione;
  TR.$('mod_n_singole').value      = p.n_singole || 0;
  TR.$('mod_n_doppie').value       = p.n_doppie || 0;
  TR.$('mod_n_matrimoniali').value = p.n_matrimoniali || 0;
  TR.$('mod_n_triple').value       = p.n_triple || 0;
  TR.$('mod_n_quadruple').value    = p.n_quadruple || 0;
  TR.$('mod_n_mat3_ragazzo').value = p.n_mat3_ragazzo || 0;
  TR.$('mod_n_mat3_bambino').value = p.n_mat3_bambino || 0;
  // Wire input events
  document.querySelectorAll('#camere-inputs input').forEach(function(inp) {
    inp.addEventListener('input', function() {
      TR.Prenota.updateCamereValidation();
      TR.Prenota.updatePriceSummaryModifica();
      TR.$('form-error').classList.add('hidden');
    });
  });
  TR.Prenota.updateCamereValidation();
};

// ── Room capacity validation ──
TR.Prenota.updateCamereValidation = function() {
  var rc = TR.Prenota.getModRoomCounts();
  var posti = TR.calcPostiFromRooms(rc);
  var totalPart = TR.STATE.existing_partecipanti.length + TR.Prenota.effectiveNewParts();
  TR.$('camere-posti').textContent = 'Posti: ' + posti;
  TR.$('camere-partecipanti').textContent = 'Partecipanti: ' + totalPart;
  var statusEl = TR.$('camere-status');
  if (posti === totalPart) {
    statusEl.textContent = '\u2705';
    statusEl.style.color = '#16a34a';
  } else {
    statusEl.textContent = posti < totalPart ? '\u26a0 Servono pi\u00f9 posti' : '\u26a0 Troppi posti';
    statusEl.style.color = '#dc2626';
  }
};

// ── Price summary — Modification Mode (delta logic aligned with WF2b Calculate Delta) ──
TR.Prenota.updatePriceSummaryModifica = function() {
  var S = TR.STATE;
  var pren = S.prenotazione;
  var ev = S.event;
  var priceSource = S.selectedHotel || ev; // hotel option pricing preferred
  var n_new = TR.Prenota.effectiveNewParts();
  var camereCard = TR.$('modifica-camere-card');
  var camereCardVisible = camereCard && !camereCard.classList.contains('hidden');

  // Current volo price (Rollup - reflects Paolo's manual updates)
  var current_prezzo_volo = S.volo ? (S.volo.prezzo_totale_volo || 0) : 0;

  // Reconstruct current total from components
  var originale = (pren.prezzo_camere || 0) + (pren.prezzo_pettorali || 0) + current_prezzo_volo + (pren.prezzo_servizi || 0) + (pren.prezzo_assicurazioni || 0);

  // Delta from room changes
  var delta_camere = 0;
  if (camereCardVisible) {
    var newRooms = TR.Prenota.getModRoomCounts();
    var new_prezzo_camere = TR.calcPrezzoCamere(newRooms, priceSource, pren.notti);
    var old_prezzo_camere = pren.prezzo_camere || 0;
    delta_camere = Math.round((new_prezzo_camere - old_prezzo_camere) * 100) / 100;
  }

  // Delta from new pettorali (skip deleted)
  var delta_pettorali = 0;
  for (var i = 1; i <= S.new_pett_counter; i++) {
    if (S.deleted_new_petts.has(i)) continue;
    var distSel = document.querySelector('[name="npett' + i + '_distanza"]');
    var distId = distSel ? distSel.value : '';
    if (!distId) continue;
    var dist = S.distances.find(function(d) { return d.id === distId; });
    delta_pettorali += (dist ? dist.prezzo_pettorale : 0) || 0;
  }

  // Delta from per-person services
  // Existing services: apply to new participants only
  // Newly added services: apply to ALL participants (existing + new)
  var sm = S.servizi_modifica;
  var total_part = S.existing_partecipanti.length + n_new;
  var delta_visita = 0;
  if (pren.visita_guidata) {
    delta_visita = (ev.visita_guidata_prezzo || 0) * n_new;
  } else if (sm.visita_guidata) {
    delta_visita = (ev.visita_guidata_prezzo || 0) * total_part;
  }
  var delta_cena = 0;
  if (pren.cena_conviviale) {
    delta_cena = (ev.cena_conviviale_prezzo || 0) * n_new;
  } else if (sm.cena_conviviale) {
    delta_cena = (ev.cena_conviviale_prezzo || 0) * total_part;
  }
  var delta_servizi = delta_visita + delta_cena;

  // Delta insurance - recalculate on FULL new base when rooms change
  var has_ass_ann = pren.ass_annullamento || sm.ass_annullamento;
  var delta_ass_ann = 0;
  if (has_ass_ann) {
    if (pren.ass_annullamento) {
      // Already had it - recalculate delta
      if (camereCardVisible) {
        var newRooms2 = TR.Prenota.getModRoomCounts();
        var new_prezzo_camere2 = TR.calcPrezzoCamere(newRooms2, priceSource, pren.notti);
        var total_pettorali = (pren.prezzo_pettorali || 0) + delta_pettorali;
        var new_base = new_prezzo_camere2 + total_pettorali + current_prezzo_volo;
        var new_ass_ann = Math.round(new_base * (ev.ass_annullamento_perc || 0) / 100 * 100) / 100;
        var old_ass_ann = pren.prezzo_assicurazioni - (pren.ass_medica ? (ev.ass_medica_prezzo || 0) * pren.n_partecipanti : 0);
        delta_ass_ann = Math.round((new_ass_ann - Math.max(old_ass_ann, 0)) * 100) / 100;
      } else {
        delta_ass_ann = Math.round(delta_pettorali * (ev.ass_annullamento_perc || 0) / 100 * 100) / 100;
      }
    } else {
      // Newly added - calculate on full base
      var base_camere = camereCardVisible
        ? TR.calcPrezzoCamere(TR.Prenota.getModRoomCounts(), priceSource, pren.notti)
        : (pren.prezzo_camere || 0);
      var base_pett = (pren.prezzo_pettorali || 0) + delta_pettorali;
      var full_base = base_camere + base_pett + current_prezzo_volo;
      delta_ass_ann = Math.round(full_base * (ev.ass_annullamento_perc || 0) / 100 * 100) / 100;
    }
  }
  var delta_ass_med = 0;
  if (pren.ass_medica) {
    delta_ass_med = (ev.ass_medica_prezzo || 0) * n_new;
  } else if (sm.ass_medica) {
    delta_ass_med = (ev.ass_medica_prezzo || 0) * total_part;
  }

  var delta_totale = delta_camere + delta_pettorali + delta_servizi + delta_ass_ann + delta_ass_med;
  var nuovo_totale = originale + delta_totale;

  // Acconto display for "Pagato" status
  var acconto_pagato = pren.acconto_importo || 0;
  var rimanente = nuovo_totale - acconto_pagato;

  // Replace price table content for mod mode
  var table = document.querySelector('.price-table');
  var html = '<tr><td>Prenotazione attuale</td><td>' + TR.fmt(originale) + '</td></tr>';
  if (current_prezzo_volo > 0) {
    html += '<tr class="mod-info-row"><td class="price-label-muted">di cui Volo</td><td>' + TR.fmt(current_prezzo_volo) + '</td></tr>';
  }
  if (delta_camere !== 0) {
    html += '<tr class="mod-delta-row"><td>' + (delta_camere > 0 ? '+' : '') + ' Modifica sistemazione</td><td>' + TR.fmt(delta_camere) + '</td></tr>';
  }
  html += '<tr id="pr-mod-pett-row" class="' + (delta_pettorali > 0 ? 'mod-delta-row' : 'hidden') + '">' +
    '<td>+ Nuovi pettorali</td><td>' + TR.fmt(delta_pettorali) + '</td></tr>';
  html += '<tr id="pr-mod-servizi-row" class="' + (delta_servizi > 0 ? 'mod-delta-row' : 'hidden') + '">' +
    '<td>+ Nuovi servizi</td><td>' + TR.fmt(delta_servizi) + '</td></tr>';
  html += '<tr id="pr-mod-ass-row" class="' + ((delta_ass_ann + delta_ass_med) > 0 ? 'mod-delta-row' : 'hidden') + '">' +
    '<td>+ Assicurazioni aggiuntive</td><td>' + TR.fmt(delta_ass_ann + delta_ass_med) + '</td></tr>';
  html += '<tr class="total"><td>Nuovo Totale</td><td>' + TR.fmt(nuovo_totale) + '</td></tr>';
  if (pren.acconto_status === 'Pagato') {
    html += '<tr class="payment-row"><td class="price-label-muted">Acconto pagato</td><td>' + TR.fmt(acconto_pagato) + '</td></tr>';
    html += '<tr class="payment-row"><td class="price-label-muted">Rimanente da saldare</td><td>' + TR.fmt(rimanente) + '</td></tr>';
  }
  if (delta_totale > 0) {
    html += '<tr class="payment-row"><td class="price-label-muted">Importo aggiuntivo</td><td>' + TR.fmt(delta_totale) + '</td></tr>';
  }
  table.innerHTML = html;
};

// ── Submit button enable/disable ──
TR.Prenota.updateSubmitBtn = function() {
  TR.$('btn-submit').disabled = !TR.$('chk-condizioni').checked;
};
