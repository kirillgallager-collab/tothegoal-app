// Клиент API (api.md §1, §4, §5). Без зависимостей; браузер и Node.
// Ответ call() всегда объект, исключений наружу не бросает:
//   { ok:true, data, replayed, serverTime, requestId }
//   { ok:false, requestId, error:{ code, message, retryable, retryAfterSec, details } }
// Локальный код ошибки 'network' — нет связи (таймаут, не-JSON, сбой сети) после всех попыток.
(function (root) {
  'use strict';

  var API_VERSION = 1;
  var PUBLIC_METHODS = { 'recovery.request': true }; // без initData (api.md §2)
  // Повторяем автоматически только эти коды (api.md §4); rate_limited и locked ждут retryAfterSec.
  var RETRY_CODES = { busy: true, request_in_progress: true, service_busy: true, unavailable: true };

  function uuidV4() {
    var c = (typeof globalThis !== 'undefined' && globalThis.crypto) || null;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    var b = new Uint8Array(16);
    if (c && c.getRandomValues) c.getRandomValues(b);
    else for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return (x + 0x100).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  function defaultSleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function networkError(requestId, reason) {
    return {
      ok: false,
      requestId: requestId,
      error: { code: 'network', message: reason || 'network', retryable: true, retryAfterSec: null, details: null }
    };
  }

  // options:
  //   apiUrl, fetch, getInitData()           — обязательны (fetch в тестах поддельный)
  //   timeoutMs=10000, attempts=3, pauses=[1000,3000], jitterMs=500
  //   slowMs=1000, onSlow()                  — вызвать, если ответа нет через slowMs
  //   sleep(ms), random(), uuid()            — подменяются в тестах
  function createClient(options) {
    var o = options || {};
    var doFetch = o.fetch;
    var timeoutMs = o.timeoutMs != null ? o.timeoutMs : 10000;
    var attempts = o.attempts != null ? o.attempts : 3;
    var pauses = o.pauses || [1000, 3000];
    var jitterMs = o.jitterMs != null ? o.jitterMs : 500;
    var slowMs = o.slowMs != null ? o.slowMs : 1000;
    var sleep = o.sleep || defaultSleep;
    var random = o.random || Math.random;
    var uuid = o.uuid || uuidV4;
    // Замеры для «Диагностики»: now() в миллисекундах (performance.now), onCall(запись) после каждого вызова
    var now = o.now || (typeof performance !== 'undefined' && performance.now ? performance.now.bind(performance) : Date.now);

    // Одна попытка: вернуть разобранный ответ-конверт или бросить Error (сеть, таймаут, не-JSON).
    function attempt(body) {
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer;
      var timeout = new Promise(function (_, reject) {
        timer = setTimeout(function () {
          if (controller) controller.abort();
          reject(new Error('timeout'));
        }, timeoutMs);
      });
      var request = Promise.resolve()
        .then(function () {
          return doFetch(o.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: body,
            signal: controller ? controller.signal : undefined
          });
        })
        .then(function (res) { return res.text(); })
        .then(function (text) {
          var json;
          try { json = JSON.parse(text); } catch (e) { throw new Error('not-json'); }
          if (!json || typeof json !== 'object' || typeof json.ok !== 'boolean') throw new Error('not-envelope');
          return json;
        });
      // request.catch — чтобы после победы таймаута поздний отказ не стал «необработанным».
      request.catch(function () {});
      return Promise.race([request, timeout]).then(
        function (v) { clearTimeout(timer); return v; },
        function (e) { clearTimeout(timer); throw e; }
      );
    }

    // call(method, params, { requestId }) — requestId можно передать, чтобы повторить действие
    // новой серией попыток с тем же идентификатором (api.md §4).
    function call(method, params, opts) {
      var requestId = (opts && opts.requestId) || uuid();
      var envelope = { v: API_VERSION, method: method, requestId: requestId };
      if (!PUBLIC_METHODS[method]) envelope.initData = o.getInitData ? o.getInitData() : '';
      envelope.params = params || {};
      var body = JSON.stringify(envelope);

      var slowTimer = null;
      if (o.onSlow) slowTimer = setTimeout(function () { o.onSlow(); }, slowMs);

      var t0 = now();
      var startedAt = Date.now();
      var log = []; // по каждой попытке: сколько миллисекунд и чем кончилась (для «Диагностики»)
      var serverTime = null;

      function finish(result) {
        if (slowTimer) clearTimeout(slowTimer);
        if (o.onCall) {
          try {
            o.onCall({ method: method, requestId: requestId, startedAt: startedAt, ms: Math.round(now() - t0), attempts: log,
              ok: !!result.ok, code: result.ok ? 'ok' : result.error.code, replayed: !!result.replayed, serverTime: result.serverTime || serverTime });
          } catch (e) { /* замер не должен ломать запрос */ }
        }
        return result;
      }

        function entry(ms, result, serverMs) {
        var e = { ms: ms, result: result };
        if (serverMs != null) e.serverMs = serverMs;
        return e;
      }

      function run(n) {
        var a0 = now();
        return attempt(body).then(
          function (json) {
            var ms = Math.round(now() - a0);
            if (json.serverTime) serverTime = json.serverTime;
            var serverMs = typeof json.serverMs === 'number' ? json.serverMs : null; // сколько сервер обрабатывал запрос (без сети и холодного старта)
            if (json.ok) {
              log.push(entry(ms, 'ok', serverMs));
              return finish({ ok: true, data: json.data, replayed: !!json.replayed, serverTime: json.serverTime, requestId: requestId });
            }
            var e = json.error || {};
            var error = {
              code: e.code || 'bad_request',
              message: e.message || '',
              retryable: !!e.retryable,
              retryAfterSec: typeof e.retryAfterSec === 'number' ? e.retryAfterSec : null,
              details: e.details || null
            };
            log.push(entry(ms, error.code, serverMs));
            if (RETRY_CODES[error.code] && n < attempts) return pauseThen(n);
            return finish({ ok: false, requestId: requestId, error: error });
          },
          function (err) {
            log.push({ ms: Math.round(now() - a0), result: 'network:' + (err && err.message ? err.message : 'error') });
            if (n < attempts) return pauseThen(n);
            return finish(networkError(requestId, err && err.message));
          }
        );
      }

      // opts.canRetry() — вызывающий может запретить повторы: если после запроса появилось более новое изменение,
      // повторять старое тело нельзя (сервер не хранит журнал повторов для записи факта), вызов заканчивается кодом 'superseded'
      function superseded() {
        log.push({ ms: 0, result: 'superseded' });
        return finish({ ok: false, requestId: requestId, error: { code: 'superseded', message: 'newer change', retryable: false, retryAfterSec: null, details: null } });
      }
      var canRetry = opts && opts.canRetry;

      function pauseThen(n) {
        if (canRetry && !canRetry()) return superseded();
        var base = pauses[Math.min(n - 1, pauses.length - 1)];
        return sleep(base + Math.floor(random() * jitterMs)).then(function () {
          if (canRetry && !canRetry()) return superseded(); // за время паузы могли нажать ещё раз
          return run(n + 1);
        });
      }

      return run(1);
    }

    return { call: call };
  }

  var api = { createClient: createClient, uuidV4: uuidV4, API_VERSION: API_VERSION, RETRY_CODES: RETRY_CODES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.api = api; }
})(globalThis);
