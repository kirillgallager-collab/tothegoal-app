// Оболочка: запуск, навигация (вкладки и подэкраны), общий env для экранов. Сами экраны — js/screens/*.js.
(function () {
  'use strict';

  var GT = window.GT;
  var S = GT.strings;
  var t = S.t;
  var U = GT.ui;
  var h = U.h;
  var cfg = window.GT_CONFIG || {};
  var query = new URLSearchParams(location.search);
  var mode = GT.mode.resolveMode(cfg, query.get('mode')); // в beta всегда real (ALLOW_MOCK:false)
  var root = document.getElementById('app');

  var tg = null;          // Telegram.WebApp (real) или null
  var flow = null;
  var desc = null;        // последний descriptor потока запуска
  var nav = { tab: 'today', stack: [], first: true }; // stack — подэкраны внутри вкладки
  var helpOpen = false;
  var viewToken = 0;
  var shell = null;

  var TABS = ['today', 'dashboard', 'history', 'settings'];

  // ---------- env: всё, что нужно экранам ----------
  function boot() { return desc && desc.boot ? desc.boot : flow.state.boot; }
  var env = {
    h: h, t: t, S: S, U: U, F: GT.format, D: GT.dates, cfg: cfg, mode: mode,
    get tg() { return tg; },
    call: function (method, params, opts) { return flow.call(method, params, opts); },
    boot: boot,
    // Свою запись в кабинете узнаём по me.memberId из app.bootstrap, а не по роли.
    myMember: function () {
      var b = boot();
      if (!b.me || !b.cabinet) return null;
      return (b.cabinet.members || []).filter(function (m) { return m.id === b.me.memberId; })[0] || null;
    },
    isOwner: function () { return boot().role === 'owner'; },
    readOnly: function () { return !!(desc && desc.readOnly); },
    todayStr: function () { var b = boot(); return GT.dates.todayIn(b.cabinet ? b.cabinet.timezone : 'Europe/Moscow', Date.now()); },
    go: function (name, params) { nav.stack.push({ name: name, params: params || {} }); showCurrent(); },
    back: function () { nav.stack.pop(); showCurrent(); },
    tab: function (name) { nav.tab = name; nav.stack = []; renderChrome(); showCurrent(); },
    reboot: function (keepTab) { nav.keepTab = !!keepTab; return flow.run(); },
    toast: U.toast,
    fail: function (res) { U.toast(S.errorText(res.error), 'error'); },
    openLink: function (url) { if (tg && tg.openLink) tg.openLink(new URL(url, location.href).href); else window.open(url, '_blank', 'noopener'); },
    openTg: function (url) { if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank', 'noopener'); },
    schedule: function (fn, ms) { return setTimeout(fn, ms); },
    cancel: function (hnd) { clearTimeout(hnd); },
    flow: function () { return flow; },
    loading: function () { onDescriptor({ screen: 'loading' }); },
    skipEmail: function () { onDescriptor(Object.assign({}, desc, { screen: 'today' })); }
  };

  // ---------- оболочка ----------
  function titleText() {
    var b = desc && desc.boot;
    return b && b.activeGoal ? b.activeGoal.title : t('app.name');
  }

  function renderChrome() {
    var d = desc || { screen: 'loading' };
    var inTabs = d.screen === 'today';
    root.textContent = '';
    var canBack = inTabs && nav.stack.length > 0;
    var header = h('header', null,
      canBack ? h('button', { type: 'button', class: 'secondary', 'aria-label': t('common.back'), text: '←', onclick: env.back }) : null,
      h('h1', { text: titleText() }),
      d.screen === 'loading' ? null :
        h('button', { type: 'button', class: 'secondary', 'aria-label': t('common.help'), text: 'i', onclick: function () { helpOpen = !helpOpen; renderChrome(); showCurrent(); } }));
    root.appendChild(header);
    if (d.readOnly) root.appendChild(h('div', { class: 'banner', text: t('common.readOnlyBanner') }));
    var main = h('main', { id: 'view' });
    root.appendChild(main);
    if (inTabs && !helpOpen) {
      var nav_ = h('nav', { class: 'tabs' });
      TABS.forEach(function (k) {
        var b = h('button', { type: 'button', text: t('tabs.' + k), onclick: function () { env.tab(k); } });
        if (k === nav.tab) b.setAttribute('aria-current', 'page');
        nav_.appendChild(b);
      });
      root.appendChild(nav_);
    }
    var b2 = d.boot;
    if (b2) root.appendChild(h('footer', { class: 'service', text: [t('service.env', { env: b2.env }), t('service.mode', { mode: b2.mode }), t('service.api', { v: b2.apiVersion })].join(' · ') }));
    shell = { main: main };
  }

  function setView(el) { if (shell) { shell.main.textContent = ''; shell.main.appendChild(el); } }

  function showScreen(name, params) {
    var token = ++viewToken;
    var fn = GT.screens[name];
    if (!fn) return setView(h('div', null, h('p', { text: t('fatal.generic.text') })));
    setView(h('div', { class: 'center' }, U.spinner()));
    var started = Date.now();
    Promise.resolve().then(function () { return fn(env, params || {}); }).then(function (el) {
      if (token === viewToken && el) setView(el);
    }).catch(function (e) {
      if (token !== viewToken) return;
      if (window.console) console.error(e);
      setView(h('div', null, h('h2', { text: t('fatal.generic.title') }), h('p', { text: t('fatal.generic.text') }),
        U.button(t('common.retry'), function () { showScreen(name, params); })));
    });
    return started;
  }

  function showCurrent() {
    renderChrome();
    if (helpOpen) {
      return setView(h('div', null, h('h2', { text: t('help.title') }), h('p', { text: t('help.text') }),
        U.button(t('common.close'), function () { helpOpen = false; renderChrome(); showCurrent(); })));
    }
    var d = desc || { screen: 'loading' };
    if (d.screen === 'today') {
      var top = nav.stack[nav.stack.length - 1];
      if (top) return showScreen(top.name, top.params);
      var params = {};
      if (nav.tab === 'today' && nav.first && d.factMode) params.factMode = true;
      if (nav.tab === 'today') nav.first = false;
      return showScreen(nav.tab, params);
    }
    var map = { loading: 'loading', consent: 'consent', noAccess: 'noAccess', activate: 'activate', invite: 'invite', wizard: 'wizard', goalReached: 'goalReached',
      reflection: 'reflection', email: 'email', offline: 'offline', wrongEnv: 'wrongEnv', authExpired: 'fatal', authInvalid: 'fatal', update: 'fatal',
      noApiUrl: 'fatal', error: 'fatal' };
    return showScreen(map[d.screen] || 'fatal', d);
  }

  function onDescriptor(d) {
    desc = d;
    helpOpen = false;
    document.body.classList.remove('slow');
    if (d.screen === 'today') {
      if (!nav.keepTab) { nav.tab = 'today'; }
      nav.keepTab = false;
      nav.stack = [];
    }
    showCurrent();
  }

  // ---------- запуск ----------
  function startFlow() {
    var fetchFn;
    var getInitData;
    var startParam;
    if (mode === 'mock') {
      var store = null;
      try { store = window.localStorage; } catch (e) { /* запрещено — работаем без сохранения */ }
      fetchFn = GT.mock.createMock({
        scenario: query.get('scenario') || 'new', as: query.get('as') || 'owner', env: cfg.EXPECTED_ENV,
        storage: store, reset: query.get('reset') === '1', latencyMs: 250
      }).fetch;
      getInitData = function () { return 'mock-init-data'; };
      startParam = query.get('startapp') || '';
    } else {
      if (!cfg.API_URL) return onDescriptor({ screen: 'noApiUrl' });
      fetchFn = window.fetch.bind(window);
      getInitData = function () { return tg && tg.initData ? tg.initData : ''; };
      startParam = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '';
      if (!getInitData()) return onDescriptor({ screen: 'authInvalid' }); // страница открыта не из Telegram
    }
    var client = GT.api.createClient({
      apiUrl: cfg.API_URL, fetch: fetchFn, getInitData: getInitData,
      onSlow: function () { document.body.classList.add('slow'); }
    });
    var tz;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { tz = undefined; }
    flow = GT.flow.createFlow({ api: client, expectedEnv: cfg.EXPECTED_ENV, startParam: startParam, tz: tz, onScreen: onDescriptor });
    onDescriptor({ screen: 'loading' });
    flow.run();
  }

  onDescriptor({ screen: 'loading' });
  if (mode === 'real') {
    var s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-web-app.js';
    s.onload = s.onerror = function () {
      tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
      if (tg) { try { tg.ready(); tg.expand(); } catch (e) { /* не критично */ } }
      startFlow();
    };
    document.head.appendChild(s);
  } else {
    startFlow();
  }

  GT.env = env; // для отладки в консоли
})();
