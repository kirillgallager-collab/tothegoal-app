// Поток запуска: app.bootstrap → проверка env → согласие → экран. Без DOM; браузер и Node.
// Экран сообщается через onScreen(descriptor); descriptor = { screen, boot?, error?, ... } (см. router.js).
(function (root) {
  'use strict';

  var router = (typeof module !== 'undefined' && module.exports) ? require('./router.js') : root.GT.router;

  // opts: api ({call}), expectedEnv, startParam (строка из Telegram), tz, onScreen(descriptor)
  function createFlow(opts) {
    var api = opts.api;
    var start = router.parseStartParam(opts.startParam);
    var state = { boot: null, descriptor: null };
    var bootRequestId = null;   // один requestId на «Повторить» после «Нет связи»
    var consentRetry = null;    // { version, requestId } — повтор согласия с тем же requestId

    function emit(d) {
      state.descriptor = d;
      opts.onScreen(d);
      return d;
    }

    function bootParams() {
      var p = {};
      if (opts.tz) p.tz = opts.tz;
      if (typeof opts.startParam === 'string' && opts.startParam) p.startParam = opts.startParam;
      return p;
    }

    // Запуск (и повторный запуск после согласия или «Повторить»).
    function run() {
      return api.call('app.bootstrap', bootParams(), bootRequestId ? { requestId: bootRequestId } : undefined).then(function (res) {
        if (!res.ok) {
          bootRequestId = res.error.code === 'network' ? res.requestId : null;
          return emit({ screen: router.screenForError(res.error.code), error: res.error });
        }
        bootRequestId = null;
        var boot = res.data;
        state.boot = boot;
        // Проверка окружения — до всего остального: неверная сборка ничего не показывает и не пишет.
        if (!router.checkEnv(boot.env, opts.expectedEnv)) {
          return emit({ screen: 'wrongEnv', expected: opts.expectedEnv, actual: boot.env == null ? '' : boot.env });
        }
        var d = router.decideScreen(boot, start);
        d.boot = boot;
        return emit(d);
      });
    }

    // Согласие S-05. Возвращает { ok:true } (экран уже сменился) или { ok:false, error, reloaded? }.
    function acceptConsent(version) {
      var reqId = consentRetry && consentRetry.version === version ? consentRetry.requestId : undefined;
      return api.call('consent.accept', { version: version }, reqId ? { requestId: reqId } : undefined).then(function (res) {
        if (res.ok) {
          consentRetry = null;
          return run().then(function () { return { ok: true }; });
        }
        if (res.error.code === 'consent_outdated') {
          consentRetry = null;
          return run().then(function () { return { ok: false, error: res.error, reloaded: true }; });
        }
        if (res.error.code === 'network') consentRetry = { version: version, requestId: res.requestId };
        else consentRetry = null;
        return { ok: false, error: res.error };
      });
    }

    // Любой вызов рабочего экрана идёт через call: общие реакции на ошибки собраны здесь.
    function call(method, params, callOpts) {
      return api.call(method, params, callOpts).then(function (res) {
        if (res.ok) return res;
        var code = res.error.code;
        if (code === 'consent_required') {
          return run().then(function () { return res; }); // bootstrap вернёт consent.required → S-05
        }
        if (code === 'auth_expired' || code === 'auth_invalid' || code === 'version_unsupported') {
          emit({ screen: router.screenForError(code), error: res.error });
        }
        return res;
      });
    }

    return {
      run: run,
      retry: run,
      acceptConsent: acceptConsent,
      call: call,
      get state() { return state; }
    };
  }

  var api = { createFlow: createFlow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.flow = api; }
})(globalThis);
