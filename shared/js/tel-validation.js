/* ══════════════════════════════════════════════════════════
   TravelRunning — Telephone Input Validation
   ══════════════════════════════════════════════════════════ */
window.TR = window.TR || {};

/** Restrict tel input to digits, +, spaces, -, (, ), . */
TR.attachTelValidation = function(el) {
  if (!el) return;
  el.setAttribute('pattern', '[+0-9\\s\\-()]*');
  el.addEventListener('keydown', function(e) {
    var allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','Home','End'];
    if (allowed.indexOf(e.key) !== -1) return;
    if ((e.ctrlKey || e.metaKey) && ['a','c','v','x','z'].indexOf(e.key.toLowerCase()) !== -1) return;
    if (!/^[+0-9\s\-()\.]$/.test(e.key)) e.preventDefault();
  });
};
