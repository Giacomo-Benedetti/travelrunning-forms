/* ==============================================================
   TravelRunning — Prenotazione: Pettorali (Race Bibs)
   ============================================================== */
window.TR = window.TR || {};
TR.Prenota = TR.Prenota || {};

// ── Render Pettorali (new booking mode) ──
TR.Prenota.renderPettorali = function() {
  var S = TR.STATE;
  if (S.modalita === 'modifica') return TR.Prenota.renderPettoraliModifica();
  var nPett = S.richiesta.n_pettorali || 0;
  var card  = TR.$('pettorali-card');

  if (nPett === 0) { card.style.display = 'none'; TR.$('pettorali-head').style.display = 'none'; return; }
  card.style.display = '';
  TR.$('pettorali-head').style.display = '';

  var container = TR.$('pettorali-container');
  container.innerHTML = '';

  // Distance options - filter by quoted distances if available
  var selDist = S.richiesta.distanze_selezionate || [];
  var filteredDistances = selDist.length > 0
    ? S.distances.filter(function(d) { return selDist.indexOf(d.id) >= 0; })
    : S.distances;

  var distOptions = '<option value="">\u2014 seleziona distanza \u2014</option>';
  filteredDistances.forEach(function(d) {
    distOptions += '<option value="' + d.id + '">' + (d.nome_distanza || d.codice || d.id) + '</option>';
  });

  for (var i = 1; i <= nPett; i++) {
    (function(i) {
      var block = document.createElement('div');
      block.className = 'pettorale-block';
      block.id = 'pett-block-' + i;

      block.innerHTML =
        '<div class="pett-header">Pettorale ' + i + '</div>' +
        '<div class="pett-body">' +
          '<div class="form-grid">' +
            '<div class="field"><label>Partecipante <span class="req">*</span></label>' +
              '<select name="pett' + i + '_partecipante" id="pett' + i + '_partecipante" data-pett-part-select data-pett-idx="' + i + '" required></select></div>' +
            '<div class="field"><label>Distanza <span class="req">*</span></label>' +
              '<select name="pett' + i + '_distanza" required>' + distOptions + '</select></div>' +
            '<div class="field"><label>Taglia maglia</label>' +
              '<select name="pett' + i + '_taglia_maglia">' +
                '<option value="">\u2014 seleziona \u2014</option>' +
                '<option>XS</option><option>S</option><option>M</option>' +
                '<option>L</option><option>XL</option><option>XXL</option>' +
              '</select></div>' +
            '<div class="field"><!-- spacer --></div>' +

            '<!-- Info contraente (shown when P1 selected) -->' +
            '<div class="pett-note-contraente hidden" id="pett' + i + '_note_contraente">' +
              'I dati del contraente (CF, indirizzo, telefono, email) verranno utilizzati automaticamente.' +
            '</div>' +

            '<!-- Contact fields (shown when P2+ selected) -->' +
            '<div class="hidden full" id="pett' + i + '_contact_fields">' +
              '<div class="form-grid" style="padding:0">' +
                '<div class="pett-section-header">Dati anagrafici partecipante</div>' +
                '<div class="field full"><label>Codice Fiscale <span class="req">*</span></label>' +
                  '<input type="text" name="pett' + i + '_codice_fiscale" data-required style="text-transform:uppercase" /></div>' +
                '<div class="field"><label>Indirizzo <span class="req">*</span></label>' +
                  '<input type="text" name="pett' + i + '_indirizzo" data-required /></div>' +
                '<div class="field"><label>Citt\u00e0 <span class="req">*</span></label>' +
                  '<input type="text" name="pett' + i + '_citta" data-required /></div>' +
                '<div class="field"><label>CAP <span class="req">*</span></label>' +
                  '<input type="text" name="pett' + i + '_cap" data-required /></div>' +
                '<div class="field"><label>Provincia <span class="req">*</span></label>' +
                  '<input type="text" name="pett' + i + '_provincia" maxlength="2" data-required placeholder="RM" /></div>' +
                '<div class="field"><label>Email <span class="req">*</span></label>' +
                  '<input type="email" name="pett' + i + '_email" data-required /></div>' +
              '</div>' +
            '</div>' +

            '<!-- Emergenza (always required) -->' +
            '<div class="pett-section-header">Contatto di emergenza</div>' +
            '<div class="field"><label>Nome contatto <span class="req">*</span></label>' +
              '<input type="text" name="pett' + i + '_emergenza_nome" required /></div>' +
            '<div class="field"><label>Telefono emergenza <span class="req">*</span></label>' +
              '<input type="tel" name="pett' + i + '_emergenza_telefono" required /></div>' +

            '<!-- Dati gara opzionali -->' +
            '<div class="pett-optional-header">Dati gara opzionali</div>' +
            '<div class="field"><label>Societ\u00e0 sportiva</label>' +
              '<input type="text" name="pett' + i + '_societa_sportiva" /></div>' +
            '<div class="field"><label>Federazione</label>' +
              '<input type="text" name="pett' + i + '_federazione" /></div>' +
            '<div class="field"><label>N\u00b0 tessera</label>' +
              '<input type="text" name="pett' + i + '_tessera_numero" /></div>' +
            '<div class="field"><label>Scadenza tessera</label>' +
              '<input type="date" name="pett' + i + '_tessera_scadenza" /></div>' +
            '<div class="field"><label>Data cert. medico</label>' +
              '<input type="date" name="pett' + i + '_cert_medico_data" /></div>' +
            '<div class="field"><label>Miglior prestazione</label>' +
              '<input type="text" name="pett' + i + '_miglior_prestazione" placeholder="es. 1h45m" /></div>' +
          '</div>' +
        '</div>';
      container.appendChild(block);

      // Wire participant dropdown change -> mutual exclusion + contact fields toggle
      var partSel = block.querySelector('[data-pett-part-select]');
      partSel.addEventListener('change', function() {
        TR.Prenota.refreshPettoraleDropdowns(partSel);
        TR.Prenota.onPettoralePartChange(i);
      });

      // Wire distanza change -> mismatch check + quota counter
      var distSel = block.querySelector('[name="pett' + i + '_distanza"]');
      if (distSel) distSel.addEventListener('change', function() { TR.Prenota.checkPettoraleMismatch(); TR.Prenota.updateDistanzaQuotaCounter(); });
    })(i);
  }

  // Populate dropdowns
  TR.Prenota.refreshPettoraleDropdowns();
  // Initialize quota counter
  TR.Prenota.updateDistanzaQuotaCounter();
};

// ── Handle pettorale participant selection ──
TR.Prenota.onPettoralePartChange = function(i) {
  var sel           = TR.$('pett' + i + '_partecipante');
  var noteContr     = TR.$('pett' + i + '_note_contraente');
  var contactFields = TR.$('pett' + i + '_contact_fields');
  if (!sel) return;

  var val = parseInt(sel.value);

  if (!val) {
    noteContr.classList.add('hidden');
    contactFields.classList.add('hidden');
    contactFields.querySelectorAll('input[data-required]').forEach(function(inp) { inp.required = false; });
  } else if (val === 1) {
    noteContr.classList.remove('hidden');
    contactFields.classList.add('hidden');
    contactFields.querySelectorAll('input[data-required]').forEach(function(inp) { inp.required = false; });
  } else {
    noteContr.classList.add('hidden');
    contactFields.classList.remove('hidden');
    contactFields.querySelectorAll('input[data-required]').forEach(function(inp) { inp.required = true; });
  }
};

// ── Refresh pettorale participant dropdowns with live names (mutual exclusion) ──
TR.Prenota.refreshPettoraleDropdowns = function(changedSel) {
  changedSel = changedSel || null;
  var n = TR.STATE.n_partecipanti;
  var allSelects = [].slice.call(document.querySelectorAll('[data-pett-part-select]'));

  // If a select just changed, clear any other select that had the same value
  if (changedSel && changedSel.value !== '') {
    allSelects.forEach(function(s) {
      if (s !== changedSel && s.value === changedSel.value) s.value = '';
    });
  }

  // Snapshot current values before rebuilding
  var currentVals = new Map(allSelects.map(function(s) { return [s, s.value]; }));

  allSelects.forEach(function(sel) {
    var currentVal = currentVals.get(sel) || '';
    var usedByOthers = new Set();
    currentVals.forEach(function(v, s) { if (s !== sel && v !== '') usedByOthers.add(v); });

    sel.innerHTML = '<option value="" hidden>\u2014 Seleziona Partecipante \u2014</option>';
    for (var i = 1; i <= n; i++) {
      var strI = String(i);
      if (usedByOthers.has(strI)) continue;
      var opt = document.createElement('option');
      opt.value = strI;
      opt.textContent = TR.Prenota.getPartLabel(i);
      sel.appendChild(opt);
    }

    // Restore selection if option still available
    if (currentVal && [].slice.call(sel.options).some(function(o) { return o.value === currentVal; })) {
      sel.value = currentVal;
    } else {
      sel.value = '';
    }
  });
};

// ── Per-distance quota counter ──
TR.Prenota.updateDistanzaQuotaCounter = function() {
  var el = document.getElementById('dist-quota-counter');
  if (!el) return;
  var quote = TR.STATE.richiesta && TR.STATE.richiesta.distanze_quote;
  if (!quote || Object.keys(quote).length === 0) { el.style.display = 'none'; return; }

  var nPett = TR.STATE.richiesta.n_pettorali || 0;
  var selected = {};
  for (var i = 1; i <= nPett; i++) {
    var distSel = document.querySelector('[name="pett' + i + '_distanza"]');
    var v = distSel ? distSel.value : '';
    if (v) selected[v] = (selected[v] || 0) + 1;
  }

  var parts = [];
  for (var distId in quote) {
    if (!quote.hasOwnProperty(distId)) continue;
    var quota = quote[distId];
    var dist = TR.STATE.distances.find(function(d) { return d.id === distId; });
    var label = dist ? (dist.nome_distanza || distId) : distId;
    var used = selected[distId] || 0;
    var remaining = quota - used;
    var color = remaining === 0 ? '#dc2626' : remaining <= 1 ? '#d97706' : '#1d4ed8';
    parts.push('<span style="margin-right:16px;color:' + color + '"><strong>' + label + '</strong>: ' + remaining + ' rimast' + (remaining === 1 ? 'o' : 'i') + ' su ' + quota + '</span>');

    // Disable option in other dropdowns when quota exhausted
    for (var j = 1; j <= nPett; j++) {
      var sel = document.querySelector('[name="pett' + j + '_distanza"]');
      if (!sel) continue;
      var opt = sel.querySelector('option[value="' + distId + '"]');
      if (!opt) continue;
      var thisSelected = sel.value === distId;
      opt.disabled = !thisSelected && remaining <= 0;
    }
  }

  el.style.display = 'block';
  el.innerHTML = '<strong>Iscrizioni disponibili:</strong> ' + parts.join('');
};

// ── Pettorale mismatch warning ──
TR.Prenota.checkPettoraleMismatch = function() {
  var nPett = TR.STATE.richiesta ? TR.STATE.richiesta.n_pettorali || 0 : 0;
  var warn = TR.$('pett-mismatch-warn');
  if (!warn || nPett === 0) return;

  var total = 0;
  var allSelected = true;
  for (var i = 1; i <= nPett; i++) {
    var distSel = document.querySelector('[name="pett' + i + '_distanza"]');
    var distId = distSel ? distSel.value : '';
    if (!distId) { allSelected = false; continue; }
    var dist = TR.STATE.distances.find(function(d) { return d.id === distId; });
    total += (dist ? dist.prezzo_pettorale : 0) || 0;
  }

  var expected = TR.STATE.richiesta.importo_pettorali || 0;
  if (allSelected && expected > 0 && Math.abs(total - expected) > 0.01) {
    warn.textContent = '\u26a0\ufe0f Le distanze selezionate (' + TR.fmt(total) + ') non corrispondono all\'importo pettorali concordato (' + TR.fmt(expected) + '). Verifica le selezioni.';
    warn.classList.remove('hidden');
  } else {
    warn.classList.add('hidden');
  }
};

TR.Prenota.getPartLabel = function(i) {
  var nome, cognome;
  if (i === 1) {
    var nEl = document.querySelector('[name="c_nome"]');
    var cEl = document.querySelector('[name="c_cognome"]');
    nome    = nEl ? nEl.value : '';
    cognome = cEl ? cEl.value : '';
  } else {
    var nEl2 = document.querySelector('[name="p' + i + '_nome"]');
    var cEl2 = document.querySelector('[name="p' + i + '_cognome"]');
    nome    = nEl2 ? nEl2.value : '';
    cognome = cEl2 ? cEl2.value : '';
  }
  var display = [nome, cognome].filter(Boolean).join(' ');
  return display ? display + ' (P' + i + ')' : 'Partecipante ' + i;
};

// ── Pettorali — Modification Mode ──
TR.Prenota.renderPettoraliModifica = function() {
  var S = TR.STATE;
  var card = TR.$('pettorali-card');
  card.style.display = '';
  TR.$('pettorali-head').style.display = '';

  var container = TR.$('pettorali-container');
  container.innerHTML = '';

  // Existing pettorali - readonly
  S.existing_pettorali.forEach(function(p, idx) {
    var partId = (p.partecipante_id || [])[0];
    var part = S.existing_partecipanti.find(function(pp) { return pp.id === partId; });
    var partName = part ? (part.nome + ' ' + part.cognome) : 'Partecipante';

    var block = document.createElement('div');
    block.className = 'pettorale-block';
    var distName = Array.isArray(p.nome_distanza) ? p.nome_distanza[0] : (p.nome_distanza || '\u2014');
    block.innerHTML =
      '<div class="pett-header">Pettorale ' + (idx + 1) +
        '<span style="font-weight:400;font-size:12px;opacity:.8"> \u2014 ' + partName + '</span></div>' +
      '<div class="pett-body">' +
        '<div class="form-grid">' +
          '<div class="field"><label>Partecipante</label>' +
            '<input type="text" value="' + partName + '" readonly /></div>' +
          '<div class="field"><label>Distanza</label>' +
            '<input type="text" value="' + distName + '" readonly /></div>' +
          '<div style="grid-column:1/-1">' +
            '<span class="mod-existing-badge">Assegnato</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    container.appendChild(block);
  });

  // "Aggiungi Pettorale" button
  var btnWrap = document.createElement('div');
  btnWrap.className = 'btn-add-wrap';
  btnWrap.id = 'btn-add-pett-wrap';
  btnWrap.innerHTML = '<button type="button" class="btn-add" id="btn-add-pett">+ Aggiungi Pettorale</button>';
  container.appendChild(btnWrap);

  TR.$('btn-add-pett').addEventListener('click', TR.Prenota.addNewPettorale);
  TR.Prenota.updateAddPettBtn();
};

TR.Prenota.updateAddPettBtn = function() {
  var totalPart = TR.STATE.existing_partecipanti.length + TR.Prenota.effectiveNewParts();
  var totalPett = TR.STATE.existing_pettorali.length + TR.Prenota.effectiveNewPetts();
  var btn = TR.$('btn-add-pett');
  if (btn) {
    btn.disabled = (totalPett >= totalPart);
    btn.title = btn.disabled ? 'Massimo pettorali raggiunto (= partecipanti)' : '';
  }
};

TR.Prenota.addNewPettorale = function() {
  var S = TR.STATE;
  var totalPart = S.existing_partecipanti.length + TR.Prenota.effectiveNewParts();
  var totalPett = S.existing_pettorali.length + TR.Prenota.effectiveNewPetts();
  if (totalPett >= totalPart) return;

  S.new_pett_counter++;
  var i = S.new_pett_counter;

  var distOptions = '<option value="">\u2014 seleziona distanza \u2014</option>' +
    S.distances.map(function(d) { return '<option value="' + d.id + '">' + (d.nome_distanza || d.id) + '</option>'; }).join('');

  var block = document.createElement('div');
  block.className = 'pettorale-block';
  block.id = 'new-pett-block-' + i;

  block.innerHTML =
    '<div class="pett-header">Nuovo Pettorale ' + i +
      '<button type="button" class="btn-delete-mod" onclick="window.removeNewPettorale(' + i + ')" title="Elimina pettorale">Elimina</button></div>' +
    '<div class="pett-body">' +
      '<div class="form-grid">' +
        '<div class="field"><label>Partecipante <span class="req">*</span></label>' +
          '<select name="npett' + i + '_partecipante" id="npett' + i + '_partecipante" data-mod-pett-select required></select></div>' +
        '<div class="field"><label>Distanza <span class="req">*</span></label>' +
          '<select name="npett' + i + '_distanza" id="npett' + i + '_distanza" required>' + distOptions + '</select></div>' +
        '<div class="field"><label>Taglia maglia</label>' +
          '<select name="npett' + i + '_taglia_maglia">' +
            '<option value="">\u2014 seleziona \u2014</option>' +
            '<option>XS</option><option>S</option><option>M</option>' +
            '<option>L</option><option>XL</option><option>XXL</option>' +
          '</select></div>' +
        '<div class="field"><!-- spacer --></div>' +
        '<div class="pett-section-header">Dati anagrafici per iscrizione gara</div>' +
        '<div class="field full"><label>Codice Fiscale <span class="req">*</span></label>' +
          '<input type="text" name="npett' + i + '_codice_fiscale" required style="text-transform:uppercase" /></div>' +
        '<div class="field"><label>Indirizzo <span class="req">*</span></label>' +
          '<input type="text" name="npett' + i + '_indirizzo" required /></div>' +
        '<div class="field"><label>Citt\u00e0 <span class="req">*</span></label>' +
          '<input type="text" name="npett' + i + '_citta" required /></div>' +
        '<div class="field"><label>CAP <span class="req">*</span></label>' +
          '<input type="text" name="npett' + i + '_cap" required /></div>' +
        '<div class="field"><label>Provincia <span class="req">*</span></label>' +
          '<input type="text" name="npett' + i + '_provincia" maxlength="2" required placeholder="RM" /></div>' +
        '<div class="field"><label>Email <span class="req">*</span></label>' +
          '<input type="email" name="npett' + i + '_email" required /></div>' +
        '<div class="pett-section-header">Contatto di emergenza</div>' +
        '<div class="field"><label>Nome contatto <span class="req">*</span></label>' +
          '<input type="text" name="npett' + i + '_emergenza_nome" required /></div>' +
        '<div class="field"><label>Telefono emergenza <span class="req">*</span></label>' +
          '<input type="tel" name="npett' + i + '_emergenza_telefono" required /></div>' +
        '<div class="pett-optional-header">Dati gara opzionali</div>' +
        '<div class="field"><label>Societ\u00e0 sportiva</label>' +
          '<input type="text" name="npett' + i + '_societa_sportiva" /></div>' +
        '<div class="field"><label>Federazione</label>' +
          '<input type="text" name="npett' + i + '_federazione" /></div>' +
        '<div class="field"><label>N\u00b0 tessera</label>' +
          '<input type="text" name="npett' + i + '_tessera_numero" /></div>' +
        '<div class="field"><label>Scadenza tessera</label>' +
          '<input type="date" name="npett' + i + '_tessera_scadenza" /></div>' +
        '<div class="field"><label>Data cert. medico</label>' +
          '<input type="date" name="npett' + i + '_cert_medico_data" /></div>' +
        '<div class="field"><label>Miglior prestazione</label>' +
          '<input type="text" name="npett' + i + '_miglior_prestazione" placeholder="es. 1h45m" /></div>' +
      '</div>' +
    '</div>';

  var container = TR.$('pettorali-container');
  var btnWrap = TR.$('btn-add-pett-wrap');
  container.insertBefore(block, btnWrap);

  TR.Prenota.refreshModPettoraleDropdowns();

  var partSel = TR.$('npett' + i + '_partecipante');
  partSel.addEventListener('change', function() { TR.Prenota.refreshModPettoraleDropdowns(partSel); });

  // Wire distanza change -> price update
  var distSel = TR.$('npett' + i + '_distanza');
  if (distSel) distSel.addEventListener('change', TR.Prenota.updatePriceSummary);

  block.querySelectorAll('input[type="tel"]').forEach(TR.attachTelValidation);
  TR.Prenota.updatePriceSummary();
  TR.Prenota.updateAddPettBtn();
  TR.Prenota.renumberNewPettorali();
};

// ── Mod mode: pettorale participant dropdown with mutual exclusion ──
TR.Prenota.refreshModPettoraleDropdowns = function(changedSel) {
  changedSel = changedSel || null;
  var S = TR.STATE;
  var allSelects = [].slice.call(document.querySelectorAll('[data-mod-pett-select]'));
  if (!allSelects.length) return;

  // Mutual exclusion: clear duplicates
  if (changedSel && changedSel.value !== '') {
    allSelects.forEach(function(s) {
      if (s !== changedSel && s.value === changedSel.value) s.value = '';
    });
  }

  var currentVals = new Map(allSelects.map(function(s) { return [s, s.value]; }));

  // Existing participants WITHOUT existing pettorali
  var existingWithPett = new Set();
  S.existing_pettorali.forEach(function(p) {
    (p.partecipante_id || []).forEach(function(id) { existingWithPett.add(id); });
  });
  var availableExisting = S.existing_partecipanti.filter(function(p) { return !existingWithPett.has(p.id); });

  // New participants (skip deleted)
  var newParts = [];
  var newSeq = 0;
  for (var n = 1; n <= S.new_part_counter; n++) {
    if (S.deleted_new_parts.has(n)) continue;
    newSeq++;
    var nomeEl = document.querySelector('[name="np' + n + '_nome"]');
    var cognomeEl = document.querySelector('[name="np' + n + '_cognome"]');
    var nome = nomeEl ? nomeEl.value : '';
    var cognome = cognomeEl ? cognomeEl.value : '';
    var label = [nome, cognome].filter(Boolean).join(' ') || 'Nuovo Partecipante';
    newParts.push({
      value: 'new_' + n,
      label: label + ' (Nuovo P' + (S.existing_partecipanti.length + newSeq) + ')'
    });
  }

  allSelects.forEach(function(sel) {
    var currentVal = currentVals.get(sel) || '';
    var usedByOthers = new Set();
    currentVals.forEach(function(v, s) { if (s !== sel && v !== '') usedByOthers.add(v); });

    sel.innerHTML = '<option value="" hidden>\u2014 Seleziona Partecipante \u2014</option>';

    // Existing participants without pettorale
    availableExisting.forEach(function(p) {
      var val = 'rec_' + p.id;
      if (usedByOthers.has(val)) return;
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = p.nome + ' ' + p.cognome + ' (P' + p.indice_passeggero + ')';
      sel.appendChild(opt);
    });

    // New participants
    newParts.forEach(function(np) {
      if (usedByOthers.has(np.value)) return;
      var opt = document.createElement('option');
      opt.value = np.value;
      opt.textContent = np.label;
      sel.appendChild(opt);
    });

    // Restore
    if (currentVal && [].slice.call(sel.options).some(function(o) { return o.value === currentVal; })) {
      sel.value = currentVal;
    } else {
      sel.value = '';
    }
  });
};
