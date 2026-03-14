/* ==============================================================
   TravelRunning — Prenotazione: Partecipanti
   ============================================================== */
window.TR = window.TR || {};
TR.Prenota = TR.Prenota || {};

// ── Effective counts (accounting for deletions) ──
TR.Prenota.effectiveNewParts = function() { return TR.STATE.new_part_counter - TR.STATE.deleted_new_parts.size; };
TR.Prenota.effectiveNewPetts = function() { return TR.STATE.new_pett_counter - TR.STATE.deleted_new_petts.size; };

// ── Render Partecipanti (new booking mode) ──
TR.Prenota.renderPartecipanti = function() {
  var S = TR.STATE;
  if (S.modalita === 'modifica') return TR.Prenota.renderPartecipantiModifica();
  var n = S.n_partecipanti;
  var container = TR.$('partecipanti-container');
  container.innerHTML = '';

  for (var i = 1; i <= n; i++) {
    var isP1 = i === 1;
    var block = document.createElement('div');
    block.className = 'partecipante-block';

    var headerText = isP1 ? 'Partecipante 1 (Contraente)' : 'Partecipante ' + i;
    var badgeHtml  = isP1 ? '<span class="readonly-badge">Auto-compilato dal contraente</span>' : '';

    var ro = isP1 ? ' readonly' : '';
    var roSel = isP1 ? ' disabled' : '';

    var req = isP1 ? '' : ' <span class="req">*</span>';
    var reqAttr = isP1 ? '' : ' required';
    var nazione_val = isP1 ? ' value="Italia"' : '';
    var nazione_ph  = isP1 ? '' : ' placeholder="es. Italia"';
    block.innerHTML =
      '<div class="part-header">' + headerText + badgeHtml + '</div>' +
      '<div class="part-body">' +
        '<div class="form-grid">' +
          '<div class="field"><label>Nome' + req + '</label>' +
            '<input type="text" name="p' + i + '_nome" id="p' + i + '_nome"' + ro + reqAttr + ' /></div>' +
          '<div class="field"><label>Cognome' + req + '</label>' +
            '<input type="text" name="p' + i + '_cognome" id="p' + i + '_cognome"' + ro + reqAttr + ' /></div>' +
          '<div class="field"><label>Data di nascita' + req + '</label>' +
            '<input type="date" name="p' + i + '_data_nascita" id="p' + i + '_data_nascita"' + ro + reqAttr + ' /></div>' +
          '<div class="field"><label>Luogo di nascita' + req + '</label>' +
            '<input type="text" name="p' + i + '_luogo_nascita" id="p' + i + '_luogo_nascita"' + ro + reqAttr + ' /></div>' +
          (!isP1 ? '<div class="field"><label>Telefono <span class="req">*</span></label><input type="tel" name="p' + i + '_telefono" id="p' + i + '_telefono" required /></div>' : '') +
          '<div class="field"><label>Nazionalit\u00e0' + req + '</label>' +
            '<input type="text" name="p' + i + '_nazione" id="p' + i + '_nazione"' + nazione_val + nazione_ph + ro + reqAttr + ' /></div>' +
          '<div class="field"><label>Tipo documento' + req + '</label>' +
            '<select name="p' + i + '_doc_tipo" id="p' + i + '_doc_tipo"' + roSel + reqAttr + '>' +
              '<option value="">\u2014 seleziona \u2014</option>' +
              '<option value="Carta d\'identit\u00e0">Carta d\'identit\u00e0</option>' +
              '<option value="Passaporto">Passaporto</option>' +
            '</select></div>' +
          '<div class="field"><label>N\u00b0 documento' + req + '</label>' +
            '<input type="text" name="p' + i + '_doc_numero" id="p' + i + '_doc_numero"' + ro + reqAttr + ' /></div>' +
          '<div class="field"><label>Scadenza documento' + req + '</label>' +
            '<input type="date" name="p' + i + '_doc_scadenza" id="p' + i + '_doc_scadenza"' + ro + reqAttr + ' /></div>' +
        '</div>' +
      '</div>';
    container.appendChild(block);

    // After P1 is appended, sync current contraente values into readonly P1 fields
    if (isP1) TR.Prenota.syncP1Fields();

    // P2+ name inputs trigger dropdown refresh
    if (!isP1) {
      var nomeEl    = block.querySelector('[name="p' + i + '_nome"]');
      var cognomeEl = block.querySelector('[name="p' + i + '_cognome"]');
      [nomeEl, cognomeEl].forEach(function(el) { if (el) el.addEventListener('input', TR.Prenota.refreshPettoraleDropdowns); });
    }
  }
};

// ── Partecipanti — Modification Mode ──
TR.Prenota.renderPartecipantiModifica = function() {
  var S = TR.STATE;
  var container = TR.$('partecipanti-container');
  container.innerHTML = '';

  // Existing participants - readonly summary
  S.existing_partecipanti.forEach(function(p, idx) {
    var block = document.createElement('div');
    block.className = 'partecipante-block';
    var indice = p.indice_passeggero || idx + 1;
    block.innerHTML =
      '<div class="part-header">' +
        'Partecipante ' + indice + (indice === 1 ? ' (Contraente)' : '') +
        '<span class="mod-existing-badge">Confermato</span>' +
      '</div>' +
      '<div class="part-body">' +
        '<div class="form-grid">' +
          '<div class="field"><label>Nome</label>' +
            '<input type="text" value="' + (p.nome || '') + '" readonly /></div>' +
          '<div class="field"><label>Cognome</label>' +
            '<input type="text" value="' + (p.cognome || '') + '" readonly /></div>' +
        '</div>' +
      '</div>';
    container.appendChild(block);
  });

  // "Aggiungi Partecipante" button
  var btnWrap = document.createElement('div');
  btnWrap.className = 'btn-add-wrap';
  btnWrap.id = 'btn-add-part-wrap';
  btnWrap.innerHTML = '<button type="button" class="btn-add" id="btn-add-part">+ Aggiungi Partecipante</button>';
  container.appendChild(btnWrap);

  TR.$('btn-add-part').addEventListener('click', TR.Prenota.addNewPartecipante);
};

// ── Add new participant (modification mode) ──
TR.Prenota.addNewPartecipante = function() {
  var S = TR.STATE;
  S.new_part_counter++;
  var idx = S.existing_partecipanti.length + S.new_part_counter;
  var n = S.new_part_counter;

  var block = document.createElement('div');
  block.className = 'partecipante-block';
  block.id = 'new-part-block-' + n;
  block.dataset.newRef = 'new_' + n;

  block.innerHTML =
    '<div class="part-header">Nuovo Partecipante ' + idx +
      '<span class="readonly-badge" style="background:#fef3c7;color:#92400e">Da aggiungere</span>' +
      '<button type="button" class="btn-delete-mod" onclick="window.removeNewPartecipante(' + n + ')" title="Elimina partecipante">Elimina</button></div>' +
    '<div class="part-body">' +
      '<div class="form-grid">' +
        '<div class="field"><label>Nome <span class="req">*</span></label>' +
          '<input type="text" name="np' + n + '_nome" id="np' + n + '_nome" required /></div>' +
        '<div class="field"><label>Cognome <span class="req">*</span></label>' +
          '<input type="text" name="np' + n + '_cognome" id="np' + n + '_cognome" required /></div>' +
        '<div class="field"><label>Data di nascita <span class="req">*</span></label>' +
          '<input type="date" name="np' + n + '_data_nascita" required /></div>' +
        '<div class="field"><label>Luogo di nascita <span class="req">*</span></label>' +
          '<input type="text" name="np' + n + '_luogo_nascita" required /></div>' +
        '<div class="field"><label>Nazionalit\u00e0 <span class="req">*</span></label>' +
          '<input type="text" name="np' + n + '_nazione" required placeholder="es. Italiana" /></div>' +
        '<div class="field"><label>Tipo documento <span class="req">*</span></label>' +
          '<select name="np' + n + '_doc_tipo" required>' +
            '<option value="">\u2014 seleziona \u2014</option>' +
            '<option value="Carta d\'identit\u00e0">Carta d\'identit\u00e0</option>' +
            '<option value="Passaporto">Passaporto</option>' +
          '</select></div>' +
        '<div class="field"><label>N\u00b0 documento <span class="req">*</span></label>' +
          '<input type="text" name="np' + n + '_doc_numero" required /></div>' +
        '<div class="field"><label>Scadenza documento <span class="req">*</span></label>' +
          '<input type="date" name="np' + n + '_doc_scadenza" required /></div>' +
        '<div class="field"><label>Telefono <span class="req">*</span></label>' +
          '<input type="tel" name="np' + n + '_telefono" id="np' + n + '_telefono" required /></div>' +
      '</div>' +
    '</div>';

  // Insert before the button wrap
  var container = TR.$('partecipanti-container');
  var btnWrap = TR.$('btn-add-part-wrap');
  container.insertBefore(block, btnWrap);

  // Refresh pettorale dropdowns to include new participant
  TR.Prenota.refreshModPettoraleDropdowns();

  // Wire name changes -> dropdown refresh
  var nomeEl = block.querySelector('[name="np' + n + '_nome"]');
  var cognomeEl = block.querySelector('[name="np' + n + '_cognome"]');
  [nomeEl, cognomeEl].forEach(function(el) { if (el) el.addEventListener('input', TR.Prenota.refreshModPettoraleDropdowns); });

  // Wire tel validation
  block.querySelectorAll('input[type="tel"]').forEach(TR.attachTelValidation);

  TR.Prenota.updatePriceSummary();
  TR.Prenota.updateAddPettBtn();
  TR.Prenota.renumberNewPartecipanti();
  if (S.modalita === 'modifica') {
    TR.Prenota.showModCamereCard();
    TR.Prenota.updateCamereValidation();
    TR.Prenota.updatePriceSummaryModifica();
  }
};

// ── Renumber visible new participants after add/delete ──
TR.Prenota.renumberNewPartecipanti = function() {
  var S = TR.STATE;
  var seq = 0;
  for (var n = 1; n <= S.new_part_counter; n++) {
    if (S.deleted_new_parts.has(n)) continue;
    seq++;
    var block = TR.$('new-part-block-' + n);
    if (!block) continue;
    var hdr = block.querySelector('.part-header');
    if (hdr) hdr.childNodes[0].textContent = 'Nuovo Partecipante ' + (S.existing_partecipanti.length + seq) + ' ';
  }
};

TR.Prenota.renumberNewPettorali = function() {
  var S = TR.STATE;
  var seq = 0;
  for (var i = 1; i <= S.new_pett_counter; i++) {
    if (S.deleted_new_petts.has(i)) continue;
    seq++;
    var block = TR.$('new-pett-block-' + i);
    if (!block) continue;
    var hdr = block.querySelector('.pett-header');
    if (hdr) hdr.childNodes[0].textContent = 'Nuovo Pettorale ' + (S.existing_pettorali.length + seq) + ' ';
  }
};

// ── Remove a newly-added participant (and any linked pettorali) ──
TR.Prenota.removeNewPartecipante = function(n) {
  var S = TR.STATE;
  var ref = 'new_' + n;
  // Auto-remove any pettorali assigned to this participant
  for (var i = 1; i <= S.new_pett_counter; i++) {
    if (S.deleted_new_petts.has(i)) continue;
    var sel = document.querySelector('[name="npett' + i + '_partecipante"]');
    if (sel && sel.value === ref) TR.Prenota.removeNewPettorale(i);
  }
  // Remove DOM + mark deleted
  var block = TR.$('new-part-block-' + n);
  if (block) block.remove();
  S.deleted_new_parts.add(n);
  TR.Prenota.refreshModPettoraleDropdowns();
  TR.Prenota.updateAddPettBtn();
  TR.Prenota.updatePriceSummaryModifica();
  // Hide camere card if no new participants remain
  if (TR.Prenota.effectiveNewParts() === 0) {
    var card = TR.$('modifica-camere-card');
    if (card) card.classList.add('hidden');
    var camHead = TR.$('modifica-camere-head');
    if (camHead) camHead.classList.add('hidden');
  }
  var camereCard = TR.$('modifica-camere-card');
  if (camereCard && !camereCard.classList.contains('hidden')) {
    TR.Prenota.updateCamereValidation();
  }
  TR.Prenota.renumberNewPartecipanti();
  var errEl = TR.$('form-error');
  if (errEl) errEl.classList.add('hidden');
};

// ── Remove a newly-added pettorale ──
TR.Prenota.removeNewPettorale = function(i) {
  var block = TR.$('new-pett-block-' + i);
  if (block) block.remove();
  TR.STATE.deleted_new_petts.add(i);
  TR.Prenota.updateAddPettBtn();
  TR.Prenota.updatePriceSummaryModifica();
  TR.Prenota.renumberNewPettorali();
  var errEl = TR.$('form-error');
  if (errEl) errEl.classList.add('hidden');
};

// ── Attach inline onclick handlers to window ──
window.removeNewPartecipante = TR.Prenota.removeNewPartecipante;
window.removeNewPettorale    = TR.Prenota.removeNewPettorale;

// ── Sync current contraente values into P1 readonly fields ──
TR.Prenota.syncP1Fields = function() {
  var pairs = [
    ['c_nome',         'p1_nome'],
    ['c_cognome',      'p1_cognome'],
    ['c_data_nascita', 'p1_data_nascita'],
    ['c_luogo_nascita','p1_luogo_nascita'],
    ['c_nazionalita',  'p1_nazione'],
    ['c_doc_tipo',     'p1_doc_tipo'],
    ['c_doc_numero',   'p1_doc_numero'],
    ['c_doc_scadenza', 'p1_doc_scadenza'],
  ];
  pairs.forEach(function(pair) {
    var src = document.getElementById(pair[0]);
    var dst = document.getElementById(pair[1]);
    if (src && dst) dst.value = src.value;
  });
};

// ── Wire contraente inputs -> P1 auto-fill + dropdown refresh ──
TR.Prenota.wireContraenteSync = function() {
  var mapping = [
    ['c_nome',         'p1_nome'],
    ['c_cognome',      'p1_cognome'],
    ['c_data_nascita', 'p1_data_nascita'],
    ['c_luogo_nascita','p1_luogo_nascita'],
    ['c_nazionalita',  'p1_nazione'],
    ['c_doc_tipo',     'p1_doc_tipo'],
    ['c_doc_numero',   'p1_doc_numero'],
    ['c_doc_scadenza', 'p1_doc_scadenza'],
  ];

  mapping.forEach(function(pair) {
    var srcId = pair[0];
    var srcEl = TR.$(srcId);
    if (!srcEl) return;
    var sync = function() {
      var dstEl = TR.$(pair[1]);
      if (dstEl) dstEl.value = srcEl.value;
      if (srcId === 'c_nome' || srcId === 'c_cognome') TR.Prenota.refreshPettoraleDropdowns();
    };
    srcEl.addEventListener('input',  sync);
    srcEl.addEventListener('change', sync);
  });
};
