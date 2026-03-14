/* ══════════════════════════════════════════════════════════
   TravelRunning — Preventivo: Build Form
   Builds all 7 sections dynamically after event config loads
   ══════════════════════════════════════════════════════════ */
window.TR = window.TR || {};
TR.Preventivo = TR.Preventivo || {};

/**
 * Build the preventivo form from event config data.
 * @param {string} eventId
 * @param {Object} config - { event, distances }
 */
TR.Preventivo.buildForm = function(eventId, config) {
  var event = config.event;
  var distances = config.distances;
  var hotelOptions = config.hotel_options || [];
  var qs = TR.qs;

  // Determine price source: hotel option (preferred) or event (fallback)
  var selectedHotel = hotelOptions.length > 0 ? hotelOptions[0] : null;
  function getPriceSource() { return selectedHotel || event; }

  // Update hero
  qs('#skeleton-name').replaceWith(document.createTextNode(event.nome_evento));
  qs('#hero-event-name').id = '';

  // Show event date in hero
  if (event.data_evento) {
    var raceDate = TR.parseAirtableDate(event.data_evento);
    qs('#hero-date').textContent = TR.formatDateIT(raceDate);
  } else {
    qs('#hero-date').style.display = 'none';
  }

  // Parse checkin/checkout
  var checkinDefault  = TR.parseAirtableDate(event.checkin);
  var checkoutDefault = TR.parseAirtableDate(event.checkout);

  var main = qs('#main-content');
  var form = document.createElement('form');
  form.id = 'preventivo-form';
  form.noValidate = true;

  /* ── SECTION 1: Dati personali ── */
  form.insertAdjacentHTML('beforeend', '\
    <div class="section-head"><span class="section-num">1</span><span class="section-title">I tuoi dati</span></div>\
    <div class="card">\
      <div class="g2">\
        <div class="field">\
          <label for="nome">Nome <span class="req">*</span></label>\
          <input type="text" id="nome" name="nome" required autocomplete="given-name" placeholder="Mario" />\
        </div>\
        <div class="field">\
          <label for="cognome">Cognome <span class="req">*</span></label>\
          <input type="text" id="cognome" name="cognome" required autocomplete="family-name" placeholder="Rossi" />\
        </div>\
        <div class="field">\
          <label for="email">Email <span class="req">*</span></label>\
          <input type="email" id="email" name="email" required autocomplete="email" placeholder="mario@email.it" />\
        </div>\
        <div class="field">\
          <label for="telefono">Telefono <span class="req">*</span></label>\
          <input type="tel" id="telefono" name="telefono" required autocomplete="tel" placeholder="+39 333 1234567" />\
        </div>\
      </div>\
    </div>\
  ');

  /* ── SECTION 2: Soggiorno ── */
  form.insertAdjacentHTML('beforeend', '\
    <div class="section-head"><span class="section-num">2</span><span class="section-title">Soggiorno</span></div>\
    <div class="card" id="soggiorno-card">\
      <div class="g2">\
        <div class="field">\
          <label for="sel-checkin">Check-in <span class="req">*</span></label>\
          <select id="sel-checkin" name="checkin" required></select>\
          <span class="hint">Data di arrivo in hotel</span>\
        </div>\
        <div class="field">\
          <label for="sel-checkout">Check-out <span class="req">*</span></label>\
          <select id="sel-checkout" name="checkout" required></select>\
          <span class="hint">Data di partenza dall\'hotel</span>\
        </div>\
      </div>\
      <div class="notti-wrap" id="notti-display"></div>\
    </div>\
  ');

  var selCheckin  = form.querySelector('#sel-checkin');
  var selCheckout = form.querySelector('#sel-checkout');
  var nottiDisplay = form.querySelector('#notti-display');

  // Hidden inputs for ISO dates
  var hiddenCheckin = document.createElement('input');
  hiddenCheckin.type = 'hidden'; hiddenCheckin.name = 'checkin_iso';
  var hiddenCheckout = document.createElement('input');
  hiddenCheckout.type = 'hidden'; hiddenCheckout.name = 'checkout_iso';
  var hiddenNotti = document.createElement('input');
  hiddenNotti.type = 'hidden'; hiddenNotti.name = 'notti';
  form.appendChild(hiddenCheckin);
  form.appendChild(hiddenCheckout);
  form.appendChild(hiddenNotti);

  function buildDateOptions(select, baseDate, selectedOffset) {
    select.innerHTML = '';
    [-1, 0, 1].forEach(function(offset) {
      var d = TR.addDays(baseDate, offset);
      var opt = document.createElement('option');
      opt.value = offset;
      opt.textContent = TR.formatDateIT(d) + (offset === 0 ? ' (data standard)' : offset === -1 ? ' (giorno prima)' : ' (giorno dopo)');
      if (offset === selectedOffset) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function updateRoomPrices(notti) { /* prices hidden from user */ }

  function updateNotti() {
    if (!checkinDefault || !checkoutDefault) return;
    var ciOffset = parseInt(selCheckin.value);
    var coOffset = parseInt(selCheckout.value);
    var ci = TR.addDays(checkinDefault, ciOffset);
    var co = TR.addDays(checkoutDefault, coOffset);
    var diff = Math.round((co - ci) / (1000 * 60 * 60 * 24));
    hiddenCheckin.value  = TR.formatDateISO(ci);
    hiddenCheckout.value = TR.formatDateISO(co);
    hiddenNotti.value    = diff;
    if (diff > 0) {
      nottiDisplay.innerHTML = '<span class="notti-badge">' + diff + ' nott' + (diff === 1 ? 'e' : 'i') + '</span>';
    } else {
      nottiDisplay.innerHTML = '<span class="notti-badge err">\u26a0 Checkout deve essere dopo checkin</span>';
    }
    updateRoomPrices(diff);
  }

  if (checkinDefault && checkoutDefault) {
    buildDateOptions(selCheckin,  checkinDefault,  0);
    buildDateOptions(selCheckout, checkoutDefault, 0);
    selCheckin.addEventListener('change',  updateNotti);
    selCheckout.addEventListener('change', updateNotti);
  } else {
    form.querySelector('#soggiorno-card').innerHTML =
      '<p class="hint">Date soggiorno non ancora disponibili per questo evento.</p>';
  }

  /* ── HOTEL SELECTOR (only if >1 hotel option) ── */
  var hiddenHotelId = document.createElement('input');
  hiddenHotelId.type = 'hidden';
  hiddenHotelId.name = 'hotel_opzione_id';
  hiddenHotelId.value = selectedHotel ? selectedHotel.id : '';
  form.appendChild(hiddenHotelId);

  if (hotelOptions.length > 1) {
    form.insertAdjacentHTML('beforeend', '\
      <div class="section-head"><span class="section-num">&bull;</span><span class="section-title">Seleziona Hotel</span></div>\
      <div class="card" id="hotel-selector-card">\
        <div class="field">\
          <label for="sel-hotel">Hotel <span class="req">*</span></label>\
          <select id="sel-hotel" required></select>\
        </div>\
      </div>\
    ');
    var selHotel = form.querySelector('#sel-hotel');
    hotelOptions.forEach(function(ho, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = ho.hotel_nome;
      if (i === 0) opt.selected = true;
      selHotel.appendChild(opt);
    });

    selHotel.addEventListener('change', function() {
      var idx = parseInt(selHotel.value);
      selectedHotel = hotelOptions[idx];
      hiddenHotelId.value = selectedHotel.id;
      rebuildCamereSection();
    });
  }

  /* ── SECTION 3: Partecipanti ── */
  form.insertAdjacentHTML('beforeend', '\
    <div class="section-head"><span class="section-num">3</span><span class="section-title">Partecipanti</span></div>\
    <div class="card">\
      <div class="g3" id="parti-grid"></div>\
    </div>\
  ');

  var partiGrid = form.querySelector('#parti-grid');

  var boxAdulti = document.createElement('div');
  boxAdulti.className = 'counter-box';
  boxAdulti.innerHTML = '<div class="cb-label">Adulti</div><div class="cb-age">18+ anni</div>';
  var ctrAdulti = TR.makeCounter({ name: 'n_adulti', min: 1, max: 20, initial: 1 });
  boxAdulti.appendChild(ctrAdulti.el);
  partiGrid.appendChild(boxAdulti);

  var boxRagazzi = document.createElement('div');
  boxRagazzi.className = 'counter-box';
  boxRagazzi.innerHTML = '<div class="cb-label">Ragazzi</div><div class="cb-age">12\u201318 anni</div>';
  var ctrRagazzi = TR.makeCounter({ name: 'n_ragazzi', min: 0, max: 10, initial: 0 });
  boxRagazzi.appendChild(ctrRagazzi.el);
  partiGrid.appendChild(boxRagazzi);

  var boxBambini = document.createElement('div');
  boxBambini.className = 'counter-box';
  boxBambini.innerHTML = '<div class="cb-label">Bambini</div><div class="cb-age">2\u201312 anni</div>';
  var ctrBambini = TR.makeCounter({ name: 'n_bambini', min: 0, max: 10, initial: 0 });
  boxBambini.appendChild(ctrBambini.el);
  partiGrid.appendChild(boxBambini);

  /* ── SECTION 4: Camere ── */
  form.insertAdjacentHTML('beforeend', '\
    <div class="section-head"><span class="section-num">4</span><span class="section-title">Camere</span></div>\
    <div class="card">\
      <div class="pettorali-section" id="camere-section"></div>\
    </div>\
  ');

  var camereSection = form.querySelector('#camere-section');
  var roomCounters  = {};

  function rebuildCamereSection() {
    camereSection.innerHTML = '';
    roomCounters = {};
    var availableRooms = TR.ROOM_TYPES;

    if (availableRooms.length === 0) {
      camereSection.innerHTML = '<p class="no-pettorali">Tipologie camera non ancora configurate per questo evento.</p>';
    } else {
      availableRooms.forEach(function(rt) {
        var row = document.createElement('div');
        row.className = 'row-item';
        row.innerHTML = '<div class="row-info"><div class="row-label">' + rt.label + '</div></div>';

        var ctrWrap = document.createElement('div');
        ctrWrap.className = 'row-counter';
        var counter = TR.makeCounter({ name: 'n_' + rt.key, min: 0, max: 10, initial: 0 });
        ctrWrap.appendChild(counter.el);
        row.appendChild(ctrWrap);
        camereSection.appendChild(row);
        roomCounters[rt.key] = counter;
      });
      // Re-wire capacity check on new room counters
      Object.values(roomCounters).forEach(function(c) {
        var btns = c.el.querySelectorAll('.counter-btn');
        btns.forEach(function(btn) { btn.addEventListener('click', checkCapacity); });
      });
    }
  }

  rebuildCamereSection();

  // Initial notti calculation
  if (checkinDefault && checkoutDefault) updateNotti();

  // Capacity warning
  form.insertAdjacentHTML('beforeend', '\
    <div class="capacity-warning" id="capacity-warning" style="display:none">\
      <span id="capacity-msg"></span>\
    </div>\
  ');

  /* ── Capacity Check ── */
  function checkCapacity() {
    var totalPax = ctrAdulti.getValue() + ctrRagazzi.getValue() + ctrBambini.getValue();
    var totalBeds = 0;
    Object.entries(roomCounters).forEach(function(entry) {
      totalBeds += (TR.ROOM_CAPACITY[entry[0]] || 0) * entry[1].getValue();
    });

    var warning = form.querySelector('#capacity-warning');
    var msg     = form.querySelector('#capacity-msg');

    if (totalPax === 0) {
      warning.style.display = 'none';
      return true;
    }
    if (totalBeds === 0) {
      warning.style.display = 'flex';
      msg.textContent = 'Seleziona almeno una camera per ' + totalPax + ' partecipant' + (totalPax === 1 ? 'e' : 'i') + '.';
      return false;
    }
    if (totalBeds < totalPax) {
      warning.style.display = 'flex';
      msg.textContent = 'Le camere selezionate possono ospitare ' + totalBeds + ' person' + (totalBeds === 1 ? 'a' : 'e') + ', ma hai ' + totalPax + ' partecipant' + (totalPax === 1 ? 'e' : 'i') + '. Aggiungi camere.';
      return false;
    }
    if (totalBeds > totalPax) {
      warning.style.display = 'flex';
      warning.className = 'capacity-warning capacity-soft';
      msg.textContent = 'Nota: le camere selezionate hanno capacit\u00e0 per ' + totalBeds + ' posti ma hai ' + totalPax + ' partecipant' + (totalPax === 1 ? 'e' : 'i') + '. Verifica la selezione.';
      return true;
    }
    warning.style.display = 'none';
    warning.className = 'capacity-warning';
    return true;
  }

  // Store petCounters reference for pettorali check
  var petCounters = [];

  function checkPettorali() {
    var totalPax = ctrAdulti.getValue() + ctrRagazzi.getValue() + ctrBambini.getValue();
    var totalPet = petCounters.reduce(function(s, c) { return s + c.counter.getValue(); }, 0);
    var warning  = form.querySelector('#pettorali-warning');
    var msg      = form.querySelector('#pettorali-msg');
    if (!warning) return true;
    if (totalPet > totalPax) {
      warning.style.display = 'flex';
      msg.textContent = 'Hai selezionato ' + totalPet + ' ' + (totalPet === 1 ? 'pettorale' : 'pettorali') + ' ma solo ' + totalPax + ' partecipante' + (totalPax === 1 ? '' : 'i') + '. I pettorali non possono superare il numero di partecipanti.';
      return false;
    }
    warning.style.display = 'none';
    return true;
  }

  // Wire capacity check into participant and room counters
  [ctrAdulti, ctrRagazzi, ctrBambini].forEach(function(c) {
    var origMinus = c.el.querySelector('.counter-btn:first-child');
    var origPlus  = c.el.querySelector('.counter-btn:last-of-type');
    origMinus.addEventListener('click', function() { checkCapacity(); checkPettorali(); });
    origPlus.addEventListener('click',  function() { checkCapacity(); checkPettorali(); });
  });
  /* ── SECTION 5: Volo ── */
  form.insertAdjacentHTML('beforeend', '\
    <div class="section-head"><span class="section-num">5</span><span class="section-title">Volo</span></div>\
    <div class="card">\
      <div class="form-row volo-checkbox-row">\
        <label class="checkbox-label" for="volo_richiesto_chk">\
          <input type="checkbox" id="volo_richiesto_chk" name="volo_richiesto" value="true">\
          <span>Sono interessato al servizio volo (organizzazione volo andata/ritorno)</span>\
        </label>\
      </div>\
      <div id="volo-details" style="display:none; margin-top:16px;">\
        <label class="field-label" for="aeroporto_partenza">Da quali aeroporti potresti partire? <span class="required">*</span></label>\
        <p class="field-hint">Indica 1-2 aeroporti preferiti, es. "Milano Malpensa (MXP), Roma Fiumicino (FCO)"</p>\
        <textarea id="aeroporto_partenza" name="aeroporto_partenza" rows="2" placeholder="es. Milano Malpensa (MXP), Roma Fiumicino (FCO)" style="width:100%;box-sizing:border-box;"></textarea>\
      </div>\
    </div>\
  ');

  var voloChk = form.querySelector('#volo_richiesto_chk');
  var voloDetails = form.querySelector('#volo-details');
  var aeroportoTa = form.querySelector('#aeroporto_partenza');
  voloChk.addEventListener('change', function() {
    voloDetails.style.display = voloChk.checked ? 'block' : 'none';
    aeroportoTa.required = voloChk.checked;
  });

  /* ── SECTION 6: Pettorali ── */
  form.insertAdjacentHTML('beforeend', '\
    <div class="section-head"><span class="section-num">6</span><span class="section-title">Iscrizioni alla gara (pettorali)</span></div>\
    <div class="card">\
      <div class="pettorali-section" id="pettorali-section"></div>\
      <p class="pettorali-total" id="pettorali-total" style="display:none"></p>\
    </div>\
  ');

  var petSection = form.querySelector('#pettorali-section');
  var petTotal = form.querySelector('#pettorali-total');

  if (distances.length === 0) {
    petSection.innerHTML = '<p class="no-pettorali">Pettorali non ancora disponibili per questo evento.</p>';
  } else {
    var updatePetTotal = function() {
      var total = petCounters.reduce(function(sum, c) { return sum + c.counter.getValue(); }, 0);
      if (total === 0) {
        petTotal.style.display = 'none';
      } else {
        petTotal.style.display = 'block';
        petTotal.innerHTML = 'Totale pettorali selezionati: <strong>' + total + '</strong>';
      }
    };

    distances.forEach(function(dist) {
      var row = document.createElement('div');
      row.className = 'row-item';

      var info = document.createElement('div');
      info.className = 'row-info';
      info.innerHTML = '<div class="pettorale-name">' + dist.nome_distanza + ' <em style="font-size:12px;color:#aaa">' + dist.codice + '</em></div>' +
        (dist.note ? '<div class="hint" style="margin-top:3px">' + dist.note + '</div>' : '');

      var ctrWrap = document.createElement('div');
      ctrWrap.className = 'row-counter';

      var counter = TR.makeCounter({
        name: 'pettorali_' + dist.id,
        min: 0, max: 20, initial: 0,
        onChange: updatePetTotal
      });
      ctrWrap.appendChild(counter.el);

      var hiddenName = document.createElement('input');
      hiddenName.type = 'hidden';
      hiddenName.name = 'distanza_nome_' + dist.id;
      hiddenName.value = dist.nome_distanza;
      var hiddenCodice = document.createElement('input');
      hiddenCodice.type = 'hidden';
      hiddenCodice.name = 'distanza_codice_' + dist.id;
      hiddenCodice.value = dist.codice;
      ctrWrap.appendChild(hiddenName);
      ctrWrap.appendChild(hiddenCodice);

      row.appendChild(info);
      row.appendChild(ctrWrap);
      petSection.appendChild(row);

      var petBtns = counter.el.querySelectorAll('.counter-btn');
      petBtns.forEach(function(btn) { btn.addEventListener('click', checkPettorali); });
      petCounters.push({ dist: dist, counter: counter });
    });
  }

  // Pettorali warning
  form.insertAdjacentHTML('beforeend', '\
    <div class="capacity-warning" id="pettorali-warning" style="display:none">\
      <span id="pettorali-msg"></span>\
    </div>\
  ');

  /* ── SECTION 7: Messaggio ── */
  form.insertAdjacentHTML('beforeend', '\
    <div class="section-head"><span class="section-num">7</span><span class="section-title">Note e richieste</span></div>\
    <div class="card">\
      <div class="field">\
        <label for="messaggio">Messaggio</label>\
        <textarea id="messaggio" name="messaggio"\
          placeholder="Descrivici le tue esigenze: tipo di camera preferita (singola, doppia, matrimoniale\u2026), eventuali richieste speciali, se hai bisogno del volo, o qualsiasi altra informazione utile."></textarea>\
        <span class="hint">Il nostro team legger\u00e0 il tuo messaggio e preparer\u00e0 il preventivo su misura. Pi\u00f9 dettagli ci dai, meglio possiamo aiutarti.</span>\
      </div>\
    </div>\
  ');

  /* ── ALERTS + SUBMIT ── */
  var alertEl = document.createElement('div');
  alertEl.className = 'alert alert-error';
  alertEl.id = 'form-alert';
  alertEl.setAttribute('role', 'alert');

  var successEl = document.createElement('div');
  successEl.className = 'alert alert-success';
  successEl.id = 'form-success';
  successEl.setAttribute('role', 'status');
  successEl.innerHTML = '<strong>\u2713 Richiesta inviata con successo!</strong><br />Ti risponderemo all\'indirizzo email fornito entro 24 ore.';

  var submitArea = document.createElement('div');
  submitArea.className = 'submit-area';

  var submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn-submit';
  submitBtn.textContent = 'Invia richiesta di preventivo';

  submitArea.appendChild(alertEl);

  var submitNote = document.createElement('p');
  submitNote.className = 'submit-note';
  submitNote.innerHTML = 'I campi contrassegnati con <span style="color:var(--brand-accent)">*</span> sono obbligatori.';
  submitArea.appendChild(submitNote);
  submitArea.appendChild(submitBtn);
  form.appendChild(submitArea);

  // Hidden event_id
  var hiddenEventId = document.createElement('input');
  hiddenEventId.type = 'hidden';
  hiddenEventId.name = 'event_id';
  hiddenEventId.value = eventId;
  form.appendChild(hiddenEventId);

  // Store references for submit handler
  TR.Preventivo._form = form;
  TR.Preventivo._alertEl = alertEl;
  TR.Preventivo._successEl = successEl;
  TR.Preventivo._submitBtn = submitBtn;
  TR.Preventivo._petCounters = petCounters;
  TR.Preventivo._checkCapacity = checkCapacity;
  TR.Preventivo._checkPettorali = checkPettorali;

  // Wire form submit
  TR.Preventivo.wireSubmit(form, alertEl, successEl, submitBtn, petCounters, checkCapacity, checkPettorali);

  main.appendChild(form);
  main.appendChild(successEl);
};
