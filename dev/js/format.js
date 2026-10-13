// Форматирование чисел, дат и поясов для интерфейса (русская локаль). Чистые функции; браузер и Node.
(function (root) {
  'use strict';

  // 87.4 → «87,4»; 1000000 → «1 000 000» (неразрывные пробелы); до maxDec знаков, лишние нули убираются.
  function num(n, maxDec) {
    if (n == null || !isFinite(n)) return '—';
    var v = Math.round(n * 1e6) / 1e6;
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: maxDec == null ? 2 : maxDec }).format(v);
  }

  // Знак для изменений без красных минусов: «+3», «−3», «0».
  function delta(n) {
    if (!n) return '0';
    return (n > 0 ? '+' : '−') + num(Math.abs(n));
  }

  function plural(n, forms) { // [один, несколько, много]: 1 день, 2 дня, 5 дней
    var a = Math.abs(n) % 100;
    var b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  function parts(dateStr) {
    var p = String(dateStr).split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  }

  // «вт, 13 октября»
  function dayLong(dateStr) {
    return new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(parts(dateStr));
  }
  // «13 окт»
  function dayShort(dateStr) {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parts(dateStr)).replace('.', '');
  }
  // «13.10.2026»
  function dateFull(dateStr) {
    var p = String(dateStr).split('-');
    return p[2] + '.' + p[1] + '.' + p[0];
  }
  // «13.10.2026 – 11.12.2026»
  function period(a, b) { return dateFull(a) + ' – ' + dateFull(b); }

  var TZ_NAMES = {
    'Europe/Kaliningrad': 'Калининград', 'Europe/Moscow': 'Москва', 'Europe/Samara': 'Самара', 'Asia/Yekaterinburg': 'Екатеринбург',
    'Asia/Omsk': 'Омск', 'Asia/Krasnoyarsk': 'Красноярск', 'Asia/Irkutsk': 'Иркутск', 'Asia/Yakutsk': 'Якутск',
    'Asia/Vladivostok': 'Владивосток', 'Asia/Magadan': 'Магадан', 'Asia/Kamchatka': 'Камчатка'
  };

  // Смещение пояса в часах на момент nowMs: «UTC+3».
  function utcOffset(tz, nowMs) {
    try {
      var s = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date(nowMs))
        .filter(function (p) { return p.type === 'timeZoneName'; })[0].value; // «GMT+3»
      return s === 'GMT' ? 'UTC+0' : s.replace('GMT', 'UTC');
    } catch (e) { return 'UTC'; }
  }
  // «Москва (UTC+3)»; неизвестные пояса — по названию города.
  function tzLabel(tz, nowMs) {
    var name = TZ_NAMES[tz] || String(tz).split('/').pop().replace(/_/g, ' ');
    return name + ' (' + utcOffset(tz, nowMs == null ? Date.now() : nowMs) + ')';
  }

  // Шаг кнопок «−/+» для прогресса цели: степень десяти от 1/100 диапазона, не меньше 0,1.
  function progressStep(startValue, targetValue, divisor) {
    var range = Math.abs(targetValue - startValue);
    if (!(range > 0)) return 1;
    return Math.max(0.1, Math.pow(10, Math.floor(Math.log10(range / (divisor || 100)) + 1e-9)));
  }

  // Прибавить шаг без хвостов плавающей запятой: 0.1 + 0.2 → 0.3.
  function addStep(value, step) {
    return Math.round((value + step) * 1e6) / 1e6;
  }

  var api = { num: num, delta: delta, plural: plural, dayLong: dayLong, dayShort: dayShort, dateFull: dateFull, period: period,
    tzLabel: tzLabel, utcOffset: utcOffset, TZ_NAMES: TZ_NAMES, progressStep: progressStep, addStep: addStep };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.format = api; }
})(globalThis);
