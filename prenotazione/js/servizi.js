/* ==============================================================
   TravelRunning — Prenotazione: Servizi Opzionali
   ============================================================== */
window.TR = window.TR || {};
TR.Prenota = TR.Prenota || {};

TR.Prenota.renderServizi = function() {
  var S = TR.STATE;
  var ev = S.event;
  var sv = S.servizi;
  var container = TR.$('servizi-list');
  container.innerHTML = '';

  // If flight is included, ass_annullamento is mandatory
  if (S.volo) S.servizi.ass_annullamento = true;

  var items = [
    { key: 'visita_guidata', label: 'Visita guidata', note: ev.visita_guidata_note || '', price: ev.visita_guidata_prezzo },
    { key: 'cena_conviviale', label: 'Cena conviviale domenica sera', note: 'Serata con tutti i partecipanti', price: ev.cena_conviviale_prezzo },
    { key: 'ass_annullamento', label: 'Assicurazione annullamento viaggio', note: (ev.ass_annullamento_perc || 0) + '% su soggiorno+pettorali' + (S.volo ? '+volo' : ''), price: null },
    { key: 'ass_medica', label: 'Assicurazione medica', note: 'Copertura sanitaria durante il viaggio', price: ev.ass_medica_prezzo },
  ];

  items.forEach(function(item) {
    var showPrice = item.price > 0;
    var showAnn   = item.key === 'ass_annullamento' && ev.ass_annullamento_perc > 0;
    if (!showPrice && !showAnn) return;

    var isForced  = item.key === 'ass_annullamento' && !!S.volo;
    var isChecked = sv[item.key] || isForced;
    var note = isForced
      ? 'Obbligatoria in caso di volo \u2014 ' + (ev.ass_annullamento_perc || 0) + '% su soggiorno+pettorali+volo'
      : item.note;

    var div = document.createElement('label');
    div.className = 'servizio-item' + (isChecked ? ' checked' : '') + (isForced ? ' forced' : '');

    var priceText = item.key === 'ass_annullamento'
      ? ev.ass_annullamento_perc + '%'
      : TR.fmt(item.price) + ' / persona';

    div.innerHTML =
      '<input type="checkbox" data-key="' + item.key + '"' + (isChecked ? ' checked' : '') + (isForced ? ' disabled' : '') + ' />' +
      '<div class="sv-text">' +
        '<div class="sv-name">' + item.label + '</div>' +
        (note ? '<div class="sv-note">' + note + '</div>' : '') +
      '</div>' +
      '<div class="sv-price">' + priceText + '</div>';

    if (!isForced) {
      div.querySelector('input').addEventListener('change', function(e) {
        S.servizi[item.key] = e.target.checked;
        div.classList.toggle('checked', e.target.checked);
        TR.Prenota.updatePriceSummary();
      });
    }

    container.appendChild(div);
  });

  if (!container.children.length) {
    container.innerHTML = '<p class="section-note">Nessun servizio opzionale disponibile per questo evento.</p>';
  }
};

TR.Prenota.renderServiziModifica = function() {
  var S = TR.STATE;
  var pren = S.prenotazione;
  var ev = S.event;
  if (!pren || !ev) return;

  var card = TR.$('servizi-card');
  TR.$('servizi-head').style.display = '';
  card.style.display = '';
  var container = TR.$('servizi-list');
  container.innerHTML = '';

  // Header text
  var infoP = TR.$('part-info-text');
  if (infoP) infoP.textContent = 'I servizi già inclusi non possono essere rimossi. Puoi aggiungerne di nuovi.';

  // Change card header for mod mode
  document.querySelector('#servizi-title').textContent = 'Servizi Opzionali';

  var items = [
    { key: 'visita_guidata', label: 'Visita guidata', note: ev.visita_guidata_note || '', price: ev.visita_guidata_prezzo },
    { key: 'cena_conviviale', label: 'Cena conviviale domenica sera', note: 'Serata con tutti i partecipanti', price: ev.cena_conviviale_prezzo },
    { key: 'ass_annullamento', label: 'Assicurazione annullamento viaggio', note: (ev.ass_annullamento_perc || 0) + '% su soggiorno+pettorali' + (S.volo ? '+volo' : ''), price: null },
    { key: 'ass_medica', label: 'Assicurazione medica', note: 'Copertura sanitaria durante il viaggio', price: ev.ass_medica_prezzo },
  ];

  items.forEach(function(item) {
    var showPrice = item.price > 0;
    var showAnn   = item.key === 'ass_annullamento' && ev.ass_annullamento_perc > 0;
    if (!showPrice && !showAnn) return;

    var alreadySelected = !!pren[item.key];
    var isForced = alreadySelected; // existing services are locked

    var priceText = item.key === 'ass_annullamento'
      ? (ev.ass_annullamento_perc || 0) + '%'
      : TR.fmt(item.price) + ' / persona';

    var div = document.createElement('label');
    div.className = 'servizio-item' + (alreadySelected ? ' checked forced' : '') + (S.servizi_modifica[item.key] ? ' checked' : '');

    var noteText = alreadySelected ? 'Già incluso nella prenotazione' : item.note;

    div.innerHTML =
      '<input type="checkbox" data-key="' + item.key + '"' +
        (alreadySelected || S.servizi_modifica[item.key] ? ' checked' : '') +
        (isForced ? ' disabled' : '') + ' />' +
      '<div class="sv-text">' +
        '<div class="sv-name">' + item.label + '</div>' +
        (noteText ? '<div class="sv-note">' + noteText + '</div>' : '') +
      '</div>' +
      '<div class="sv-price">' + priceText + '</div>';

    if (!isForced) {
      div.querySelector('input').addEventListener('change', function(e) {
        S.servizi_modifica[item.key] = e.target.checked;
        div.classList.toggle('checked', e.target.checked);
        TR.Prenota.updatePriceSummaryModifica();
      });
    }

    container.appendChild(div);
  });

  if (!container.children.length) {
    card.style.display = 'none';
  }
};

TR.Prenota.hideServiziModifica = function() {
  TR.$('servizi-head').style.display = 'none';
  TR.$('servizi-card').style.display = 'none';
};
