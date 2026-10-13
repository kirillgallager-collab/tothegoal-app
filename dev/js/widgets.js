// Общие элементы интерфейса (только браузер). Любой текст сервера выводится через textContent, не как HTML.
(function (root) {
  'use strict';

  var S = root.GT.strings;
  var t = S.t;

  // h('div', {class:'x', onclick: fn, text:'…'}, дети…) — создать элемент.
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (k === 'text') el.textContent = v;
        else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else if (v !== false && v != null) el.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x != null && x !== false) el.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
      else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }

  function button(label, onclick, opts) {
    var o = opts || {};
    return h('button', { type: 'button', class: o.secondary ? 'secondary' : (o.danger ? 'danger' : null), text: label, onclick: onclick,
      disabled: !!o.disabled, 'aria-label': o.aria || null });
  }

  // Подпись + поле + подсказка + текст ошибки.
  function field(label, input, hint, error) {
    return h('div', { class: 'field' },
      h('label', null, h('span', { class: 'label', text: label }), input),
      hint ? h('p', { class: 'hint', text: hint }) : null,
      error ? h('p', { class: 'field-error', text: error }) : null);
  }

  // Число с запятой или точкой → number | null.
  function parseNum(str) {
    var s = String(str).replace(/\s/g, '').replace(',', '.');
    if (s === '' || s === '-' || s === '.') return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  }

  function numberInput(value, onchange, opts) {
    var o = opts || {};
    var input = h('input', { type: 'text', inputmode: o.negative ? 'text' : 'decimal', value: value == null ? '' : String(value).replace('.', ','),
      'aria-label': o.aria || null, class: o.class || null });
    input.addEventListener('change', function () { onchange(parseNum(input.value), input); });
    return input;
  }

  var toastTimer = null;
  function toast(text, kind) {
    var old = document.getElementById('toast');
    if (old) old.remove();
    var el = h('div', { id: 'toast', class: 'toast ' + (kind || ''), role: 'status', text: text });
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.remove(); }, 3500);
  }

  // Подтверждение внутри страницы (alert/confirm в мини-приложении недоступны или неудобны). → Promise<boolean>
  function confirmDialog(text, okLabel, danger) {
    return new Promise(function (resolve) {
      var done = function (v) { back.remove(); resolve(v); };
      var back = h('div', { class: 'dialog-back' },
        h('div', { class: 'dialog', role: 'dialog' },
          h('p', { text: text }),
          h('div', { class: 'actions' },
            button(okLabel || t('common.ok'), function () { done(true); }, { danger: !!danger }),
            button(t('common.cancel'), function () { done(false); }, { secondary: true }))));
      document.body.appendChild(back);
    });
  }

  // Подтверждение вводом слова (удаление кабинета).
  function wordDialog(text, word, okLabel) {
    return new Promise(function (resolve) {
      var done = function (v) { back.remove(); resolve(v); };
      var input = h('input', { type: 'text', 'aria-label': word, autocomplete: 'off' });
      var ok = button(okLabel, function () { done(input.value); }, { danger: true, disabled: true });
      input.addEventListener('input', function () { ok.disabled = input.value.trim() === ''; });
      var back = h('div', { class: 'dialog-back' },
        h('div', { class: 'dialog', role: 'dialog' }, h('p', { text: text }), input,
          h('div', { class: 'actions' }, ok, button(t('common.cancel'), function () { done(null); }, { secondary: true }))));
      document.body.appendChild(back);
    });
  }

  function spinner() { return h('div', { class: 'spinner', role: 'status' }); }
  function section(title, children) { return h('section', { class: 'card' }, title ? h('h3', { text: title }) : null, children); }

  root.GT.ui = { h: h, button: button, field: field, numberInput: numberInput, parseNum: parseNum, toast: toast,
    confirmDialog: confirmDialog, wordDialog: wordDialog, spinner: spinner, section: section };
})(globalThis);
