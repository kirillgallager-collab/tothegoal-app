// Экраны входа и доступа: загрузка, нет связи, окружение, согласие S-05, «Закрытая бета» S-02/S-02a, приглашение S-03.
(function (root) {
  'use strict';

  var screens = root.GT.screens = root.GT.screens || {};

  screens.loading = function (env) {
    return env.h('div', { class: 'center' }, env.U.spinner(), env.h('p', { class: 'loading-text', text: env.t('common.loading') }));
  };

  function message(env, title, text, retry) {
    var el = env.h('div', null, env.h('h2', { text: title }), env.h('p', { text: text }));
    if (retry) el.appendChild(env.h('div', { class: 'actions' }, env.U.button(env.t('common.retry'), retry)));
    return el;
  }

  screens.offline = function (env) {
    return message(env, env.t('offline.title'), env.t('offline.text'), function () { env.loading(); env.flow().retry(); });
  };

  screens.wrongEnv = function (env, d) {
    return message(env, env.t('wrongEnv.title'), env.t('wrongEnv.text', { expected: d.expected, actual: d.actual }));
  };

  var FATAL = { authExpired: 'fatal.authExpired', authInvalid: 'fatal.authInvalid', update: 'fatal.update', noApiUrl: 'fatal.noApiUrl' };
  screens.fatal = function (env, d) {
    var key = FATAL[d.screen];
    if (key) return message(env, env.t(key + '.title'), env.t(key + '.text'));
    return message(env, env.t('fatal.generic.title'), d.error ? env.S.errorText(d.error) : env.t('fatal.generic.text'),
      function () { env.loading(); env.flow().retry(); });
  };

  // ---------- S-05 Согласие ----------
  screens.consent = function (env, d) {
    var h = env.h;
    var c = d.boot.consent;
    var updated = c.acceptedVersion != null;
    var box = h('input', { type: 'checkbox', id: 'consent-box' });
    var btn = env.U.button(env.t('consent.submit'), null, { disabled: true });
    var notice = h('p', { class: 'notice', id: 'consent-notice', hidden: true });
    var errBox = h('p', { class: 'error', hidden: true });
    box.addEventListener('change', function () { btn.disabled = !box.checked; });
    btn.addEventListener('click', function () {
      if (!box.checked) return;
      btn.disabled = true;
      errBox.hidden = true;
      env.flow().acceptConsent(c.version).then(function (r) {
        if (r.ok) return;
        if (r.reloaded) { // экран уже перерисован с новой версией
          var n = document.getElementById('consent-notice');
          if (n) { n.textContent = env.t('consent.outdatedReloaded'); n.hidden = false; }
          return;
        }
        errBox.textContent = env.S.errorText(r.error); // галочка остаётся как была
        errBox.hidden = false;
        btn.textContent = env.t('common.retry');
        btn.disabled = !box.checked;
      });
    });
    return h('div', null, notice,
      h('h2', { text: env.t(updated ? 'consent.titleUpdated' : 'consent.title') }),
      h('p', { text: env.t('consent.intro') }),
      h('p', null, env.U.button(env.t('consent.policyLink'), function () { env.openLink(env.cfg.PRIVACY_URL || '#'); }, { secondary: true })),
      h('p', { text: env.t('consent.version', { version: c.version }) }),
      h('label', { class: 'check', for: 'consent-box' }, box, h('span', { text: env.t('consent.checkbox') })),
      errBox, btn);
  };

  // ---------- S-02 Закрытая бета и S-02a просмотр пресетов ----------
  function presetCard(env, p) {
    var h = env.h;
    return h('details', { class: 'card' },
      h('summary', { text: p.name }),
      h('p', { text: env.t('presets.example', { title: p.example.title || '—', days: p.example.days }) }),
      p.actions.length ? h('ul', null, p.actions.map(function (a) { return h('li', { text: a.title + ' — ' + env.F.num(a.startNorm) + ' ' + a.unit }); })) : null,
      p.tasks.length ? h('p', { class: 'hint', text: env.t('presets.tasks') + ' ' + p.tasks.map(function (x) { return x.title; }).join('; ') }) : null);
  }

  screens.noAccess = function (env, d) {
    var h = env.h;
    var id = String(d.boot.user.telegramId);
    var copy = env.U.button(env.t('noAccess.copy'), function () {
      try { navigator.clipboard.writeText(id).then(function () { copy.textContent = env.t('noAccess.copied'); }, function () {}); } catch (e) { /* выделить вручную */ }
    }, { secondary: true });
    var list = h('div', { class: 'presets' });
    var show = env.U.button(env.t('noAccess.presets'), function () {
      show.disabled = true;
      env.call('presets.list', {}).then(function (res) {
        if (!res.ok) { show.disabled = false; return env.fail(res); }
        res.data.presets.forEach(function (p) { list.appendChild(presetCard(env, p)); });
        show.hidden = true;
      });
    }, { secondary: true });
    return h('div', null,
      h('h2', { text: env.t('noAccess.title') }), h('p', { text: env.t('noAccess.text') }),
      h('p', { class: 'telegram-id', text: env.t('noAccess.telegramId', { id: id }) }), h('p', { text: env.t('noAccess.sendId') }),
      h('div', { class: 'actions' }, copy, show), list);
  };

  // ---------- S-03 Приглашение ----------
  screens.invite = function (env, d) {
    var h = env.h;
    var err = h('p', { class: 'error', hidden: true });
    var btn = env.U.button(env.t('invite.accept'), function () {
      btn.disabled = true;
      err.hidden = true;
      env.call('invite.accept', { code: d.inviteCode }).then(function (res) {
        if (res.ok) return env.reboot();
        btn.disabled = false;
        err.textContent = env.S.errorText(res.error);
        err.hidden = false;
      });
    });
    return h('div', null, h('h2', { text: env.t('invite.title') }), h('p', { text: env.t('invite.text') }), err, btn);
  };

  // ---------- S-02 боевой режим (mode=codes): ввод кода активации ----------
  // Роутер показывает экран только при mode=codes; в бете вместо него «Закрытая бета» (router.js). Логика — js/access-logic.js.
  screens.activate = function (env, d) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var AL = root.GT.accessLogic;
    var input = h('input', { type: 'text', class: 'code-input', value: d.activateCode || '', autocomplete: 'off', autocapitalize: 'characters',
      spellcheck: 'false', 'aria-label': t('activate.field'), placeholder: t('activate.placeholder') });
    var err = h('p', { class: 'error', hidden: true, role: 'alert' });
    var btn = U.button(t('activate.submit'), function () { act.submit(input.value); });
    var list = h('div', { class: 'presets' });

    function errorText(e) {
      if (e.code === 'locked') return t('activate.locked', { clock: AL.formatClock(act.state.lockLeft) });
      if (e.code === 'transfer_too_soon') {
        var next = e.details && e.details.nextAt ? env.F.dateFull(e.details.nextAt.slice(0, 10)) : '';
        return t('activate.err.transfer_too_soon', { date: next });
      }
      var key = 'activate.err.' + e.code;
      return t(key) !== key ? t(key) : env.S.errorText(e); // network, rate_limited, unavailable и прочее — общие тексты
    }

    function render() {
      var s = act.state;
      var locked = s.lockLeft > 0;
      btn.disabled = s.status === 'busy' || locked;
      btn.textContent = s.status === 'busy' ? t('activate.busy') : (s.error && s.error.code === 'network' ? t('common.retry') : t('activate.submit'));
      input.disabled = s.status === 'busy';
      if (s.error) { err.textContent = errorText(s.error); err.hidden = false; } else err.hidden = true;
    }

    // Пока человек печатает, убираем пробелы и дефисы и приводим к верхнему регистру: вставка «abcd-2345 efgh» сразу выглядит как код
    input.addEventListener('input', function () { input.value = AL.normalizeCode(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') act.submit(input.value); });

    var act = AL.createActivation({ call: env.call, now: Date.now, schedule: env.schedule, cancel: env.cancel, onChange: render,
      onSuccess: function (data) { if (data.transferred) env.toast(t('activate.transferred')); env.reboot(); } });

    var presets = U.button(t('activate.presets'), function () {
      presets.disabled = true;
      env.call('presets.list', {}).then(function (res) {
        if (!res.ok) { presets.disabled = false; return env.fail(res); }
        res.data.presets.forEach(function (p) { list.appendChild(presetCard(env, p)); });
        presets.hidden = true;
      });
    }, { secondary: true });

    // страница «Восстановить доступ» на сайте (адрес задаёт сборка, config.RECOVERY_URL); без адреса кнопки нет
    var recover = env.cfg.RECOVERY_URL ? U.button(t('activate.recover'), function () { env.openLink(env.cfg.RECOVERY_URL); }, { secondary: true }) : null;

    render();
    return h('div', null, h('h2', { text: t('activate.title') }), h('p', { text: t('activate.text') }),
      U.field(t('activate.field'), input), err, h('div', { class: 'actions' }, btn, presets, recover),
      h('p', { class: 'hint', text: t('activate.lostHint') }), list);
  };

  // ---------- S-04 «Email для восстановления доступа»: три шага на одном экране ----------
  // Показывается только в режиме codes владельцу бесплатного бета-доступа без email (router.js). «Позже» закрывает экран до следующего входа.
  screens.email = function (env) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var AL = root.GT.accessLogic;
    var box = h('div');
    var shown = null; // какой шаг сейчас нарисован
    var els = {};

    var flow = AL.createEmailFlow({ call: env.call, now: Date.now, schedule: env.schedule, cancel: env.cancel, onChange: sync });

    function errorText(e) {
      var s = flow.state;
      if (e.code === 'bad_format') return t(s.step === 'email' ? 'email.err.bad_format_email' : 'email.err.bad_format_code');
      if (e.code === 'locked') return t('email.locked', { clock: AL.formatClock(s.lockLeft) });
      var key = 'email.err.' + e.code;
      return t(key) !== key ? t(key) : env.S.errorText(e); // rate_limited с паузой, network, forbidden и прочее
    }

    function later() { flow.stop(); env.skipEmail(); }

    function build() {
      var s = flow.state;
      shown = s.step;
      box.textContent = '';
      els = { err: h('p', { class: 'error', hidden: true, role: 'alert' }) };
      box.appendChild(h('h2', { text: t('email.title') }));
      if (s.step === 'email') {
        els.email = h('input', { type: 'text', inputmode: 'email', autocomplete: 'email', autocapitalize: 'none', spellcheck: 'false', value: s.email, 'aria-label': t('email.field') });
        els.email.addEventListener('keydown', function (e) { if (e.key === 'Enter') flow.submitEmail(els.email.value); });
        els.send = U.button(t('email.send'), function () { flow.submitEmail(els.email.value); });
        box.appendChild(h('p', { text: t('email.intro') }));
        box.appendChild(U.field(t('email.field'), els.email));
        box.appendChild(els.err);
        box.appendChild(h('div', { class: 'actions' }, els.send, U.button(t('common.later'), later, { secondary: true })));
      } else if (s.step === 'code') {
        els.code = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '9', 'aria-label': t('email.codeField') });
        els.code.addEventListener('keydown', function (e) { if (e.key === 'Enter') flow.submitCode(els.code.value); });
        els.confirm = U.button(t('email.confirm'), function () { flow.submitCode(els.code.value); });
        els.resend = U.button(t('email.resend'), function () { flow.resendCode(); }, { secondary: true });
        box.appendChild(h('p', { text: t('email.codeIntro', { email: s.email }) }));
        box.appendChild(U.field(t('email.codeField'), els.code, t('email.codeHint')));
        box.appendChild(els.err);
        box.appendChild(h('div', { class: 'actions' }, els.confirm, els.resend));
        box.appendChild(h('div', { class: 'actions' }, U.button(t('email.change'), function () { flow.changeAddress(); }, { secondary: true }),
          U.button(t('common.later'), later, { secondary: true })));
      } else {
        box.appendChild(h('p', { class: 'notice', text: t('email.done') }));
        box.appendChild(U.button(t('email.finish'), function () { flow.stop(); env.reboot(); }));
      }
    }

    // Подвижные части (кнопки, ошибки, отсчёт) обновляются на месте, чтобы не сбивать ввод
    function sync() {
      var s = flow.state;
      if (s.step !== shown) build();
      if (els.send) { els.send.disabled = s.busy; els.send.textContent = s.busy ? t('email.sending') : t('email.send'); }
      if (els.confirm) els.confirm.disabled = s.busy || s.lockLeft > 0;
      if (els.code) els.code.disabled = s.lockLeft > 0;
      if (els.resend) {
        els.resend.disabled = s.busy || s.resendLeft > 0 || s.lockLeft > 0;
        els.resend.textContent = s.resendLeft > 0 ? t('email.resendIn', { clock: AL.formatClock(s.resendLeft) }) : t('email.resend');
      }
      if (els.err) { if (s.error) { els.err.textContent = errorText(s.error); els.err.hidden = false; } else els.err.hidden = true; }
    }

    build();
    sync();
    return box;
  };
})(globalThis);
