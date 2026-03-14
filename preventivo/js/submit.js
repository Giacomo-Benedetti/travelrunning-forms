/* ══════════════════════════════════════════════════════════
   TravelRunning — Preventivo: Form Submit Handler
   ══════════════════════════════════════════════════════════ */
window.TR = window.TR || {};
TR.Preventivo = TR.Preventivo || {};

TR.Preventivo.wireSubmit = function(form, alertEl, successEl, submitBtn, petCounters, checkCapacity, checkPettorali) {
  var WEBHOOK_URL = TR.CONFIG.N8N_BASE_URL + '/webhook/preventivo';

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Basic validation
    alertEl.classList.remove('on');
    var requiredFields = form.querySelectorAll('[required]');
    var firstInvalid = null;
    requiredFields.forEach(function(f) {
      f.style.borderColor = '';
      if (!f.value.trim()) {
        f.style.borderColor = 'var(--brand-accent)';
        if (!firstInvalid) firstInvalid = f;
      }
    });
    if (firstInvalid) {
      alertEl.textContent = 'Compila tutti i campi obbligatori.';
      alertEl.classList.add('on');
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Capacity check
    if (!checkCapacity()) {
      alertEl.textContent = 'Le camere selezionate non sono sufficienti per il numero di partecipanti.';
      alertEl.classList.add('on');
      form.querySelector('#capacity-warning').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Pettorali check
    if (!checkPettorali()) {
      alertEl.textContent = 'Il numero di pettorali non pu\u00f2 superare il numero di partecipanti.';
      alertEl.classList.add('on');
      form.querySelector('#pettorali-warning').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Validate email
    var emailVal = TR.qs('#email', form).value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      alertEl.textContent = 'Inserisci un indirizzo email valido.';
      alertEl.classList.add('on');
      TR.qs('#email', form).focus();
      return;
    }

    // Build payload
    var formData = new FormData(form);
    var payload = {};
    for (var entry of formData.entries()) {
      payload[entry[0]] = entry[1];
    }

    // Build distanze_richieste summary
    var distanzeSummary = petCounters
      .filter(function(c) { return c.counter.getValue() > 0; })
      .map(function(c) { return c.counter.getValue() + 'x ' + c.dist.codice; })
      .join(', ');
    payload.distanze_richieste = distanzeSummary;

    // n_pettorali total
    payload.n_pettorali = petCounters.reduce(function(s, c) { return s + c.counter.getValue(); }, 0);

    // Volo: convert checkbox to boolean
    payload.volo_richiesto = payload.volo_richiesto === 'true';
    if (!payload.volo_richiesto) payload.aeroporto_partenza = null;

    // Submit
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span>Invio in corso\u2026';

    try {
      var res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      // Show success (escape user input to prevent XSS)
      var nomeVal  = TR.escapeHtml(TR.qs('#nome',  form).value.trim());
      var emailDisplay = TR.escapeHtml(TR.qs('#email', form).value.trim());
      successEl.innerHTML = '<strong>Grazie ' + nomeVal + ',</strong><br/>abbiamo ricevuto la sua richiesta di preventivo.<br/>Le invieremo il preventivo a breve all\'indirizzo email <strong>' + emailDisplay + '</strong>.';
      form.style.display = 'none';
      successEl.classList.add('on');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      alertEl.textContent = 'Si \u00e8 verificato un errore durante l\'invio. Riprova tra qualche minuto o scrivici a info@travelrunning.it.';
      alertEl.classList.add('on');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Invia richiesta di preventivo';
    }
  });
};
