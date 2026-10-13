// Логика экранов доступа боевого режима (ACCESS_MODE=codes) без DOM:
//  - S-02 «Ввод кода активации»: нормализация, ошибки по каталогу api.md, блокировка locked с обратным отсчётом;
//  - S-04 «Email для восстановления доступа»: email → код из письма → готово (access.setRecoveryEmail / confirmRecoveryEmail).
// В бете (whitelist) эти методы отвечают not_available, а роутер экранов не показывает (router.js).
(function (root) {
  'use strict';

  // «abcd-2345 efgh» → «ABCD2345EFGH»: убираем пробелы и дефисы, верхний регистр (api.md access.activate).
  function normalizeCode(raw) {
    return String(raw == null ? '' : raw).toUpperCase().replace(/[\s\-‐-―]+/g, '');
  }
  function isCodeShape(code) { return /^[A-Z0-9]{12}$/.test(code); }

  function normalizeEmail(raw) { return String(raw == null ? '' : raw).trim().toLowerCase(); }
  function isEmail(s) { return s.length <= 254 && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s); }

  // Код из письма: 6 цифр, пробелы убираются.
  function normalizeMailCode(raw) { return String(raw == null ? '' : raw).replace(/[\s\-]+/g, ''); }
  function isMailCode(s) { return /^\d{6}$/.test(s); }

  // 125 → «2:05», 3600 → «1:00:00»
  function formatClock(sec) {
    var s = Math.max(0, Math.ceil(sec));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    return h ? h + ':' + two(m) + ':' + two(r) : m + ':' + two(r);
  }

  // Обратный отсчёт: onTick(осталось секунд) каждую секунду, пока не дойдёт до нуля.
  // o: { seconds, now(), schedule(fn, ms), cancel(h), onTick(left) }
  function createCountdown(o) {
    var endAt = o.now() + o.seconds * 1000;
    var handle = null;
    var stopped = false;
    function left() { return Math.max(0, Math.ceil((endAt - o.now()) / 1000)); }
    function tick() {
      handle = null;
      if (stopped) return;
      var l = left();
      o.onTick(l);
      if (l > 0) handle = o.schedule(tick, 1000);
    }
    o.onTick(left());
    if (left() > 0) handle = o.schedule(tick, 1000);
    return { left: left, stop: function () { stopped = true; if (handle) o.cancel(handle); } };
  }

  // ---------- S-02: активация кода ----------
  // o: { call, now, schedule, cancel, onChange(), onSuccess(data) }
  function createActivation(o) {
    var s = { status: 'idle', error: null, lockLeft: 0, code: '' };
    var lock = null;
    var pending = null; // { code, requestId } после «нет связи»: повтор того же кода с тем же requestId
    function change() { if (o.onChange) o.onChange(); }

    function startLock(sec) {
      if (lock) lock.stop();
      lock = createCountdown({ seconds: sec, now: o.now, schedule: o.schedule, cancel: o.cancel, onTick: function (l) {
        s.lockLeft = l;
        if (l === 0) { s.status = 'idle'; if (s.error && s.error.code === 'locked') s.error = null; }
        change();
      } });
    }

    function submit(raw) {
      if (s.status === 'busy' || s.lockLeft > 0) return Promise.resolve(null);
      var code = normalizeCode(raw);
      s.code = code;
      if (!isCodeShape(code)) { s.status = 'error'; s.error = { code: 'bad_format' }; change(); return Promise.resolve(null); } // ввод с ошибкой формата не тратит попытки
      s.status = 'busy'; s.error = null; change();
      var reqId = pending && pending.code === code ? pending.requestId : undefined;
      return o.call('access.activate', { code: code }, reqId ? { requestId: reqId } : undefined).then(function (res) {
        if (res.ok) { pending = null; s.status = 'done'; change(); if (o.onSuccess) o.onSuccess(res.data); return res; }
        pending = res.error.code === 'network' ? { code: code, requestId: res.requestId } : null;
        s.status = res.error.code === 'locked' ? 'locked' : 'error';
        s.error = res.error;
        if (res.error.code === 'locked') startLock(res.error.retryAfterSec || 3600); else change();
        return res;
      });
    }

    return { state: s, submit: submit, stop: function () { if (lock) lock.stop(); } };
  }

  // ---------- S-04: подтверждение email ----------
  // o: { call, now, schedule, cancel, onChange() }
  function createEmailFlow(o) {
    var s = { step: 'email', email: '', busy: false, error: null, resendLeft: 0, lockLeft: 0, expiresInSec: 1800 };
    var resend = null;
    var lock = null;
    var pending = null; // повтор после «нет связи» с тем же requestId: { key, requestId }
    function change() { if (o.onChange) o.onChange(); }

    function startResend(sec) {
      if (resend) resend.stop();
      resend = createCountdown({ seconds: sec, now: o.now, schedule: o.schedule, cancel: o.cancel, onTick: function (l) { s.resendLeft = l; change(); } });
    }
    function startLock(sec) {
      if (lock) lock.stop();
      lock = createCountdown({ seconds: sec, now: o.now, schedule: o.schedule, cancel: o.cancel, onTick: function (l) {
        s.lockLeft = l;
        if (l === 0 && s.error && s.error.code === 'locked') { // запись аннулирована: после блокировки нужен новый код
          s.error = null;
          s.step = 'email';
          if (resend) resend.stop();
          s.resendLeft = 0;
        }
        change();
      } });
    }

    function send(email, isResend) {
      var key = 'send:' + email;
      var reqId = !isResend && pending && pending.key === key ? pending.requestId : undefined;
      s.busy = true; s.error = null; change();
      return o.call('access.setRecoveryEmail', { email: email }, reqId ? { requestId: reqId } : undefined).then(function (res) {
        s.busy = false;
        if (res.ok) {
          pending = null;
          s.email = email; s.step = 'code'; s.expiresInSec = res.data.expiresInSec;
          startResend(res.data.resendAfterSec);
          change();
          return res;
        }
        pending = res.error.code === 'network' ? { key: key, requestId: res.requestId } : null;
        s.error = res.error;
        if (res.error.code === 'rate_limited' && res.error.retryAfterSec && s.step === 'code') startResend(res.error.retryAfterSec);
        change();
        return res;
      });
    }

    function submitEmail(raw) {
      if (s.busy) return Promise.resolve(null);
      var email = normalizeEmail(raw);
      s.email = email;
      if (!isEmail(email)) { s.error = { code: 'bad_format' }; change(); return Promise.resolve(null); }
      return send(email, false);
    }

    function resendCode() {
      if (s.busy || s.step !== 'code' || s.resendLeft > 0 || s.lockLeft > 0) return Promise.resolve(null);
      return send(s.email, true);
    }

    function submitCode(raw) {
      if (s.busy || s.step !== 'code' || s.lockLeft > 0) return Promise.resolve(null);
      var code = normalizeMailCode(raw);
      if (!isMailCode(code)) { s.error = { code: 'bad_format' }; change(); return Promise.resolve(null); }
      var key = 'confirm:' + code;
      var reqId = pending && pending.key === key ? pending.requestId : undefined;
      s.busy = true; s.error = null; change();
      return o.call('access.confirmRecoveryEmail', { code: code }, reqId ? { requestId: reqId } : undefined).then(function (res) {
        s.busy = false;
        if (res.ok) { pending = null; s.step = 'done'; if (resend) resend.stop(); change(); return res; }
        pending = res.error.code === 'network' ? { key: key, requestId: res.requestId } : null;
        s.error = res.error;
        if (res.error.code === 'locked') startLock(res.error.retryAfterSec || 3600); else change();
        return res;
      });
    }

    // «Изменить адрес»: назад к вводу адреса (введённое сохраняется, письмо уже отправленное остаётся действующим до нового запроса)
    function changeAddress() { s.step = 'email'; s.error = null; if (resend) resend.stop(); s.resendLeft = 0; change(); }

    return { state: s, submitEmail: submitEmail, resendCode: resendCode, submitCode: submitCode, changeAddress: changeAddress,
      stop: function () { if (resend) resend.stop(); if (lock) lock.stop(); } };
  }

  var api = { normalizeCode: normalizeCode, isCodeShape: isCodeShape, normalizeEmail: normalizeEmail, isEmail: isEmail,
    normalizeMailCode: normalizeMailCode, isMailCode: isMailCode, formatClock: formatClock, createCountdown: createCountdown,
    createActivation: createActivation, createEmailFlow: createEmailFlow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.accessLogic = api; }
})(globalThis);
