// Заглушка сервера по контракту (api.md): конвейер §2, идемпотентность, роли, сценарии сбоев.
// createMock({ scenario, as, env, storage, now, rand, latencyMs, reset }) → { handle, fetch, state, scenarios }.
//   handle(envelope) → объект ответа (синхронно, для тестов); fetch(url, init) → как настоящий fetch (для клиента).
//   storage — localStorage-подобный объект ({getItem,setItem,removeItem}) или null: сохранение на время разработки.
(function (root) {
  'use strict';

  var dep = function (file, name) { return typeof module !== 'undefined' && module.exports ? require(file) : root.GT[name]; };
  var K = dep('./calc.js', 'mockCalc');
  var Mth = dep('./methods.js', 'mockMethods');
  var Sc = dep('./scenarios.js', 'mockScenarios');

  var RETRYABLE = { busy: true, request_in_progress: true, service_busy: true, unavailable: true };
  var ALPH = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // как у ULID: без I, L, O, U

  function stable(x) {
    if (Array.isArray(x)) return '[' + x.map(stable).join(',') + ']';
    if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(x[k]); }).join(',') + '}';
    return JSON.stringify(x === undefined ? null : x);
  }

  function createMock(opts) {
    var o = opts || {};
    var scenario = o.scenario || 'new';
    var as = o.as || 'owner';
    var env = o.env || 'dev';
    var rand = o.rand || Math.random;
    var nowFn = o.now || Date.now;
    var storage = o.storage || null;
    var latencyMs = o.latencyMs || 0;
    var sc = Sc.resolve(scenario);
    var key = 'gt-mock:v2:' + scenario + ':' + as;
    var flags = { busyLeft: sc.flag === 'busy' ? 2 : 0, flakyLeft: sc.flag === 'flaky' ? 2 : 0 };

    function randomCode(n) {
      var s = '';
      for (var i = 0; i < n; i++) s += ALPH[Math.floor(rand() * 32)];
      return s;
    }
    function newId(S, prefix) {
      S.seq++;
      var head = '';
      var n = S.seq;
      for (var i = 0; i < 8; i++) { head = ALPH[n % 32] + head; n = Math.floor(n / 32); }
      return prefix + '_' + head + randomCode(18);
    }
    function baseCtx(S) {
      var nowMs = nowFn();
      var tz = S.cabinet ? S.cabinet.timezone : 'Europe/Moscow';
      return { S: S, nowMs: nowMs, nowIso: new Date(nowMs).toISOString().replace(/\.\d+Z$/, 'Z'), today: K.todayIn(tz, nowMs),
        newId: function (p) { return newId(S, p); }, randomCode: randomCode, me: null, role: 'none' };
    }

    function load() {
      if (storage && !o.reset) {
        try {
          var raw = storage.getItem(key);
          if (raw) { var s = JSON.parse(raw); if (s && s.schema === 2) return s; }
        } catch (e) { /* повреждённое сохранение — начнём заново */ }
      }
      var S = Sc.blank(env);
      Sc.seed(baseCtx(S), scenario, as);
      return S;
    }
    var S = load();
    if (sc.flag === 'wrongenv') S.env = 'beta'; else S.env = env;

    function persist() {
      if (!storage) return;
      try { storage.setItem(key, JSON.stringify(S)); } catch (e) { /* переполнено или запрещено — не критично */ }
    }
    if (o.reset && storage) { try { storage.removeItem(key); } catch (e) { /* ничего */ } }
    persist();

    function ok(requestId, data, replayed) {
      return { v: 1, ok: true, requestId: requestId, replayed: !!replayed, serverTime: baseCtx(S).nowIso, data: data };
    }
    function err(requestId, code, details, retryAfterSec) {
      return { v: 1, ok: false, requestId: requestId, serverTime: baseCtx(S).nowIso,
        error: { code: code, message: code, retryable: !!RETRYABLE[code], retryAfterSec: retryAfterSec == null ? null : retryAfterSec, details: details || null } };
    }

    function handle(env_) {
      var requestId = env_ && typeof env_.requestId === 'string' ? env_.requestId : '';
      try { return pipeline(env_, requestId); } catch (e) {
        if (e && e.api) return err(requestId, e.api.code, e.api.details, e.api.retryAfterSec);
        return err(requestId, 'internal', { errorId: 'mock-' + (e && e.message ? String(e.message).slice(0, 40) : 'unknown') });
      }
    }

    function pipeline(e, requestId) {
      // 1. конверт
      if (!e || typeof e !== 'object' || typeof e.method !== 'string') throw Mth.fail('bad_request');
      if (e.v !== 1) throw Mth.fail('version_unsupported');
      var method = e.method;
      var def = Mth.ACCESS[method];
      // оплата, коды, email для восстановления — только режим codes; админка и экспорт в бете недоступны всегда
      var na = Mth.NOT_AVAILABLE.indexOf(method) >= 0 || (Mth.CODES_ONLY.indexOf(method) >= 0 && S.mode !== 'codes');
      if (!def && !na) throw Mth.fail('bad_request');
      var params = e.params && typeof e.params === 'object' && !Array.isArray(e.params) ? e.params : {};
      var isPublic = Mth.PUBLIC.indexOf(method) >= 0;
      // 3. initData (в заглушке — любая непустая строка) и срок
      if (!isPublic) {
        if (typeof e.initData !== 'string' || !e.initData) throw Mth.fail('auth_invalid');
        if (sc.flag === 'expired') throw Mth.fail('auth_expired');
      }
      if (na) throw Mth.fail('not_available');

      var ctx = baseCtx(S);
      // 4. согласие
      var consented = !!(S.user && S.user.consentVersion === S.policyVersion);
      if (def.consent !== false && !consented) throw Mth.fail('consent_required', { version: S.policyVersion });
      // 5. роль
      var me = S.meMemberId ? Mth.core.memberById(S, S.meMemberId) : null;
      var role = 'none';
      if (me && S.cabinet && me.status !== 'left') role = me.status === 'active' && S.cabinet.status === 'active' ? me.role : 'readonly';
      ctx.me = me && role !== 'none' ? me : null;
      ctx.role = role;
      if (def.roles !== 'any' && def.roles.indexOf(role) < 0) {
        if (role === 'none') throw Mth.fail('access_required');
        if (def.wrongRole) throw Mth.fail(def.wrongRole); // invite.accept уже состоящему в кабинете
        if (role === 'readonly' && def.write) throw Mth.fail('read_only');
        throw Mth.fail('forbidden');
      }
      // 6–7. сбои сценариев и идемпотентность (методы записи)
      if (def.write) {
        if (!requestId) throw Mth.fail('bad_request', { fields: [{ field: 'requestId', code: 'required' }] });
        if (flags.busyLeft > 0) { flags.busyLeft--; throw Mth.fail('busy'); }
        if (sc.flag === 'ratelimit' && method !== 'consent.accept') throw Mth.fail('rate_limited', null, 30);
      }
      var logKey = (S.user ? S.user.id : 'anon') + '|' + requestId;
      var hash = stable(params);
      if (def.write) {
        var prev = S.reqLog[logKey];
        if (prev) {
          if (prev.hash !== hash || prev.method !== method) throw Mth.fail('request_conflict');
          return ok(requestId, JSON.parse(prev.data), true);
        }
      }
      // 8. выполнение
      var data = Mth.M[method](ctx, params);
      if (def.write) {
        S.reqLog[logKey] = { hash: hash, method: method, data: JSON.stringify(data) };
        persist();
      } else if (method === 'app.bootstrap') persist();
      return ok(requestId, data, false);
    }

    function textReply(text) { return { ok: true, status: 200, text: function () { return Promise.resolve(text); } }; }

    // Поддельный fetch для клиента: добавляет задержку и сбои транспорта по сценарию.
    function fetchFn(url, init) {
      return new Promise(function (resolve, reject) {
        var body;
        try { body = JSON.parse(init.body); } catch (e) { return reject(new Error('bad body')); }
        if (sc.flag === 'offline') return resolve(textReply('<html>offline</html>'));
        if (flags.flakyLeft > 0) { flags.flakyLeft--; return resolve(textReply('<html>404</html>')); }
        var delay = sc.flag === 'slow' ? 3000 : latencyMs;
        setTimeout(function () { resolve(textReply(JSON.stringify(handle(body)))); }, delay);
      });
    }

    return { handle: handle, fetch: fetchFn, get state() { return S; }, scenarios: Sc.SCENARIOS };
  }

  var api = { createMock: createMock, SCENARIOS: Sc.SCENARIOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.mock = api; }
})(globalThis);
