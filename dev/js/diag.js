// Журнал запросов для блока «Диагностика» в настройках: последние 10 вызовов и сводка по времени ответа.
// Холодный вызов = самый первый вызов за сеанс (обычно app.bootstrap при открытии: Apps Script «просыпается»);
// тёплые = все следующие успешные вызовы. Чистая логика без DOM; браузер и Node.
(function (root) {
  'use strict';

  function stats(values) {
    if (!values.length) return null;
    var a = values.slice().sort(function (x, y) { return x - y; });
    var sum = a.reduce(function (s, x) { return s + x; }, 0);
    var mid = Math.floor(a.length / 2);
    return {
      n: a.length, min: a[0], max: a[a.length - 1], avg: Math.round(sum / a.length),
      median: a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2),
      p90: a[Math.min(a.length - 1, Math.ceil(a.length * 0.9) - 1)]
    };
  }

  // o: { max = 10 — сколько последних запросов показывать, keep = 300 — сколько замеров держать для сводки }
  function createDiag(o) {
    var max = (o && o.max) || 10;
    var keep = (o && o.keep) || 300;
    var recent = []; // новые первыми
    var cold = null;
    var warm = []; // успешные вызовы после первого: { method, ms }
    var failures = 0;
    var total = 0;

    // r — запись клиента API: { method, requestId, startedAt, ms, attempts:[{ms,result}], ok, code, replayed, serverTime }
    function record(r) {
      total++;
      if (!cold) cold = { method: r.method, ms: r.ms, ok: r.ok, code: r.code };
      else if (r.ok) { warm.push({ method: r.method, ms: r.ms }); if (warm.length > keep) warm.shift(); }
      if (!r.ok) failures++;
      recent.unshift(r);
      if (recent.length > max) recent.pop();
    }

    function summary() {
      var byMethod = {};
      warm.forEach(function (w) { (byMethod[w.method] = byMethod[w.method] || []).push(w.ms); });
      var perMethod = Object.keys(byMethod).sort().map(function (m) { var st = stats(byMethod[m]); return { method: m, n: st.n, avg: st.avg, max: st.max }; });
      return { total: total, failures: failures, cold: cold, warm: stats(warm.map(function (w) { return w.ms; })), perMethod: perMethod };
    }

    return { record: record, list: function () { return recent.slice(); }, summary: summary, clear: function () { recent = []; warm = []; cold = null; failures = 0; total = 0; } };
  }

  var api = { createDiag: createDiag, stats: stats };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.diagLogic = api; }
})(globalThis);
