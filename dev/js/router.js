// Чистая логика выбора экрана (screens.md §1): разбор startapp, проверка env, стартовая логика.
// Без DOM и сети; браузер и Node.
(function (root) {
  'use strict';

  var CODE_RE = /^[A-Za-z0-9_-]{1,64}$/;

  // startapp: «fact», «inv_<код>», «act_<код>»; всё прочее — как будто параметра нет.
  function parseStartParam(raw) {
    if (typeof raw !== 'string') return { type: 'none' };
    var s = raw.trim();
    if (s === 'fact') return { type: 'fact' };
    if (s === 'today') return { type: 'today' }; // кнопки утреннего сообщения и итога дня: обычное «Сегодня»
    var m = /^(inv|act)_(.+)$/.exec(s);
    if (!m || !CODE_RE.test(m[2])) return { type: 'none' };
    if (m[1] === 'inv') return { type: 'invite', code: m[2] };
    // код активации: без пробелов и дефисов, в верхнем регистре (api.md access.activate)
    var act = m[2].replace(/[\s-]/g, '').toUpperCase();
    return act ? { type: 'activate', code: act } : { type: 'none' };
  }

  // Совпало ли окружение сервера с ожидаемым для этой сборки (dev-plan.md §3.1, п. 3).
  function checkEnv(actual, expected) {
    return typeof actual === 'string' && actual === expected;
  }

  // Какой экран показать после успешного app.bootstrap (env уже проверен).
  // Возвращает { screen, readOnly, factMode, inviteCode, activateCode }.
  function decideScreen(boot, start) {
    var st = start || { type: 'none' };
    var out = { screen: 'today', readOnly: false, factMode: false, inviteCode: null, activateCode: null };

    if (boot.consent && boot.consent.required) {
      out.screen = 'consent';
      return out;
    }

    // Экраны ввода кода (S-02 боевой) и email (S-04) существуют только в режиме codes; в бете (whitelist) — «Закрытая бета».
    var codes = boot.mode === 'codes';

    if (boot.access === 'none') {
      if (st.type === 'invite') {
        out.screen = 'invite';
        out.inviteCode = st.code;
      } else if (codes) {
        out.screen = 'activate';
        if (st.type === 'activate') out.activateCode = st.code; // подстановка из startapp=act_<код>
      } else {
        out.screen = 'noAccess';
      }
      return out;
    }

    out.readOnly = boot.access === 'readonly' || boot.role === 'readonly';

    if (!out.readOnly) {
      var p = boot.prompts || {};
      if (p.goalReached) { out.screen = 'goalReached'; return out; }
      if (p.reflectionGoalId) { out.screen = 'reflection'; out.reflectionGoalId = p.reflectionGoalId; return out; } // рефлексия раньше новой цели
      if (!boot.activeGoal && boot.role === 'owner') { out.screen = 'wizard'; return out; }
      if (p.needsRecoveryEmail && codes) { out.screen = 'email'; return out; }
    }

    out.screen = 'today';
    out.factMode = st.type === 'fact' && !!boot.activeGoal && !out.readOnly;
    return out;
  }

  // Экран для ошибок, которые нельзя исправить повтором (api.md §5).
  function screenForError(code) {
    if (code === 'network') return 'offline';
    if (code === 'auth_expired') return 'authExpired';
    if (code === 'auth_invalid') return 'authInvalid';
    if (code === 'version_unsupported') return 'update';
    return 'error';
  }

  var api = { parseStartParam: parseStartParam, checkEnv: checkEnv, decideScreen: decideScreen, screenForError: screenForError };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.router = api; }
})(globalThis);
