// Расчёты заглушки (brief.md §4–§5, api.md §1). Упрощённая копия логики ядра: заглушка не обязана
// совпадать с сервером до последней цифры, но формулы те же, а формы ответов проверяются по фикстурам.
// Чистые функции без DOM и сети; браузер и Node.
(function (root) {
  'use strict';

  // ---------- даты (строки YYYY-MM-DD) ----------
  function dayNum(s) {
    var p = String(s).split('-');
    return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  }
  function dayStr(n) {
    var d = new Date(n * 86400000);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function addDays(s, n) { return dayStr(dayNum(s) + n); }
  function diffDays(a, b) { return dayNum(a) - dayNum(b); } // a − b

  // Дата «сегодня» в поясе кабинета.
  function todayIn(tz, nowMs) {
    try {
      var parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(nowMs));
      if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) return parts;
    } catch (e) { /* неизвестный пояс — UTC */ }
    return new Date(nowMs).toISOString().slice(0, 10);
  }
  function validTz(tz) {
    try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }); return typeof tz === 'string' && tz.length > 0; } catch (e) { return false; }
  }
  function isDate(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && dayStr(dayNum(s)) === s;
  }

  // ---------- числа ----------
  // Округление вверх, устойчивое к ошибкам плавающей запятой: 15 × 1,0000000001 = 15, а не 16.
  function ceilStable(x) { return Math.ceil(Math.round(x * 1e6) / 1e6); }
  function round2(x) { return Math.round(x * 100) / 100; }

  // percentRaw — без ограничения (число с 2 знаками), percent — целое 0–100.
  function pair(rawFraction) {
    var raw = round2(rawFraction * 100);
    return { percent: Math.max(0, Math.min(100, Math.round(raw))), percentRaw: raw };
  }

  // ---------- цель ----------
  function periodDays(startDate, endDate) { return diffDays(endDate, startDate) + 1; }
  function baseRateOf(startValue, targetValue, startDate, endDate) {
    return Math.abs(targetValue - startValue) / periodDays(startDate, endDate);
  }

  // Значение цели на конец даты (data-model.md ProgressEntry). entries: [{date, memberId, value}]
  function valueAt(goal, entries, date) {
    if (goal.inputMode === 'delta') {
      var sum = 0;
      entries.forEach(function (e) { if (e.date <= date) sum += e.value; });
      return goal.startValue + sum;
    }
    var best = null;
    entries.forEach(function (e) { if (e.date <= date && (!best || e.date >= best.date)) best = e; });
    return best ? best.value : goal.startValue;
  }

  function remaining(goal, value) {
    return goal.direction === 'growth' ? goal.targetValue - value : value - goal.targetValue;
  }

  // Прогресс к цели 0..1 (без ограничения): откат даёт < 0, перевыполнение > 1.
  function progressFraction(goal, value) {
    var total = Math.abs(goal.targetValue - goal.startValue);
    if (total === 0) return 0;
    return goal.direction === 'growth' ? (value - goal.startValue) / total : (goal.startValue - value) / total;
  }

  // ---------- нормы ----------
  // Версия действия на дату: последняя с effectiveFrom ≤ date (ActionVersion).
  function versionFor(action, date) {
    var v = action.versions[0];
    action.versions.forEach(function (x) { if (x.effectiveFrom <= date && x.effectiveFrom >= v.effectiveFrom) v = x; });
    return v;
  }

  // Коэффициент дня T: по значению на конец T−1 и оставшимся дням с T до окончания включительно.
  function coefficientFor(goal, entries, date) {
    var value = valueAt(goal, entries, addDays(date, -1));
    var rem = remaining(goal, value);
    if (rem <= 0) return 1; // цель достигнута: нормы стартовые
    var daysLeft = Math.max(1, diffDays(goal.endDate, date) + 1);
    return (rem / daysLeft) / goal.baseRate;
  }

  // Норма действия при коэффициенте coeff → { norm, normBeforeCeiling, startNorm }.
  function normFor(version, coeff) {
    var start = version.startNorm;
    if (!version.growsOnLag) return { norm: start, normBeforeCeiling: start, startNorm: start };
    var before = Math.max(start, ceilStable(start * coeff));
    var norm = before;
    if (version.normCeiling != null) norm = Math.min(before, ceilStable(start * version.normCeiling));
    return { norm: norm, normBeforeCeiling: before, startNorm: start };
  }

  // Предупреждение: норма до потолка больше чем в 2 раза выше стартовой (brief.md §4).
  function warns(n) { return n.startNorm > 0 && n.normBeforeCeiling > 2 * n.startNorm + 1e-9; }

  // ---------- день ----------
  // План/факт одного участника: acts — [{norm, value|null}] по действиям «в плане».
  function planFact(acts) {
    var done = 0;
    var capSum = 0;
    var rawSum = 0;
    acts.forEach(function (a) {
      var v = a.value == null ? 0 : a.value;
      var r = a.norm > 0 ? v / a.norm : 0;
      if (v >= a.norm) done++;
      capSum += Math.min(r, 1);
      rawSum += r;
    });
    var n = acts.length;
    var p = pair(n ? capSum / n : 0);
    return { doneCount: done, totalCount: n, percent: p.percent, percentRaw: n ? round2(rawSum / n * 100) : 0 };
  }

  var api = {
    dayNum: dayNum, dayStr: dayStr, addDays: addDays, diffDays: diffDays, todayIn: todayIn, validTz: validTz, isDate: isDate,
    ceilStable: ceilStable, round2: round2, pair: pair,
    periodDays: periodDays, baseRateOf: baseRateOf, valueAt: valueAt, remaining: remaining, progressFraction: progressFraction,
    versionFor: versionFor, coefficientFor: coefficientFor, normFor: normFor, warns: warns, planFact: planFact
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.mockCalc = api; }
})(globalThis);
