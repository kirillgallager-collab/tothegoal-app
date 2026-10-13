// Даты в виде строк YYYY-MM-DD (клиентская копия нужных функций; заглушка mock/ живёт отдельно).
(function (root) {
  'use strict';

  function dayNum(s) { var p = String(s).split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
  function dayStr(n) {
    var d = new Date(n * 86400000);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function addDays(s, n) { return dayStr(dayNum(s) + n); }
  function diffDays(a, b) { return dayNum(a) - dayNum(b); }
  function isDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && dayStr(dayNum(s)) === s; }

  // «Сегодня» по часам устройства в заданном поясе (подсказка для мастера; настоящее «сегодня» — на сервере).
  function todayIn(tz, nowMs) {
    try {
      var s = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(nowMs));
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    } catch (e) { /* неизвестный пояс */ }
    return new Date(nowMs).toISOString().slice(0, 10);
  }

  var api = { dayNum: dayNum, dayStr: dayStr, addDays: addDays, diffDays: diffDays, isDate: isDate, todayIn: todayIn };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.dates = api; }
})(globalThis);
