/* ══════════════════════════════════════════════════════════
   TravelRunning — Reusable Counter Component
   +/- buttons with hidden input for form submission
   ══════════════════════════════════════════════════════════ */
window.TR = window.TR || {};

/**
 * Create a counter component.
 * @param {Object} opts
 * @param {string} opts.name    - hidden input name attribute
 * @param {number} [opts.min=0]
 * @param {number} [opts.max=99]
 * @param {number} [opts.initial=0]
 * @param {Function} [opts.onChange] - called with new value
 * @returns {{ el: HTMLElement, getValue: Function, setValue: Function }}
 */
TR.makeCounter = function(opts) {
  var name = opts.name;
  var min = opts.min != null ? opts.min : 0;
  var max = opts.max != null ? opts.max : 99;
  var val = opts.initial || 0;
  var onChange = opts.onChange;

  var el = document.createElement('div');
  el.className = 'counter-ctrl';

  var btnMinus = document.createElement('button');
  btnMinus.type = 'button';
  btnMinus.className = 'counter-btn';
  btnMinus.textContent = '\u2212';
  btnMinus.setAttribute('aria-label', 'Riduci');

  var display = document.createElement('span');
  display.className = 'counter-value';
  display.textContent = val;
  display.setAttribute('aria-live', 'polite');

  var btnPlus = document.createElement('button');
  btnPlus.type = 'button';
  btnPlus.className = 'counter-btn';
  btnPlus.textContent = '+';
  btnPlus.setAttribute('aria-label', 'Aumenta');

  var hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.name = name;
  hidden.value = val;

  function update(newVal) {
    val = Math.min(max, Math.max(min, newVal));
    display.textContent = val;
    hidden.value = val;
    btnMinus.disabled = val <= min;
    btnPlus.disabled = val >= max;
    if (onChange) onChange(val);
  }

  btnMinus.addEventListener('click', function() { update(val - 1); });
  btnPlus.addEventListener('click', function() { update(val + 1); });
  update(val); // init disabled state

  el.appendChild(btnMinus);
  el.appendChild(display);
  el.appendChild(btnPlus);
  el.appendChild(hidden);

  return {
    el: el,
    getValue: function() { return val; },
    setValue: function(v) { update(v); }
  };
};
