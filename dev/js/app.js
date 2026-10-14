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

  GT.diag = GT.diagLogic.createDiag(); // журнал запросов для блока «Диагностика»
  var tg = null;          // Telegram.WebApp (real) или null
  var flow = null;
  var desc = null;        // последний descriptor потока запуска
  var nav = { tab: 'today', stack: [], first: true }; // stack — подэкраны внутри вкладки
  var helpOpen = false;
  var viewToken = 0;
  var shell = null;
  var staleState = null;  // null | 'loading' (показан кэш, bootstrap идёт) | 'failed' (кэш показан, связи нет)
  var lastBoot = null;    // последний свежий ответ app.bootstrap (из него и из сохранений строится кэш «Сегодня»)
  var uid = 'anon';       // ключ кэша: Telegram ID (в mock — сценарий)

  var TABS = ['today', 'dashboard', 'history', 'settings'];

  // Хранилища в localStorage (чтение и запись в try/catch внутри createStore): черновики дней и кэш последнего «Сегодня»
  function getStorage() { return window.localStorage; }
  var draftStore = GT.todayLogic.createStore(getStorage, 'gt:draft:v1:');
  var cacheStore = GT.todayLogic.createStore(getStorage, 'gt:today:v1:');

  // ---------- env: всё, что нужно экранам ----------
  function boot() { return desc && desc.boot ? desc.boot : flow.state.boot; }
  var READS = /\.(get|list)$|^app\.bootstrap$/;
  // Фоновая подгрузка дашборда и истории (по одному запросу, после показа «Сегодня»); любая успешная запись делает загруженное устаревшим
  var presetsPromise = null;
  var prefetch = { version: 0, started: false, dashboard: null, history: null };
  var env = {
    h: h, t: t, S: S, U: U, F: GT.format, D: GT.dates, cfg: cfg, mode: mode, diag: GT.diag,
    get tg() { return tg; },
    call: function (method, params, opts) {
      return flow.call(method, params, opts).then(function (res) {
        if (res.ok && !READS.test(method)) prefetch.version++;
        if (res.ok && (method === 'goal.complete' || method === 'goal.create')) forgetGoal(); // цель сменилась: черновики прежней цели не нужны
        return res;
      });
    },
    // presets.list не меняется за сеанс: один запрос на сеанс, неудача в кэш не попадает
    presets: function () {
      if (!presetsPromise) {
        presetsPromise = env.call('presets.list', {}).then(function (res) { if (!res.ok) presetsPromise = null; return res; });
      }
      return presetsPromise;
    },
    // Ответ, подгруженный в фоне (одноразовый): промис результата или null, если подгрузки нет или она устарела
    prefetched: function (key) {
      var e = prefetch[key];
      prefetch[key] = null;
      if (!e || e.version !== prefetch.version) return null;
      return e.promise.then(function (res) { return prefetch.version === e.version ? res : null; });
    },
    staleState: function () { return staleState; },
    hasMainButton: function () { return !!(tg && tg.MainButton); },
    retryBoot: function () { staleState = 'loading'; if (todayCtrl) todayCtrl.setStale(true); flow.run(); },
    boot: boot,
    // Свою запись в кабинете узнаём по me.memberId из app.bootstrap, а не по роли.
    myMember: function () {
      var b = boot();
      if (!b.me || !b.cabinet) return null;
      return (b.cabinet.members || []).filter(function (m) { return m.id === b.me.memberId; })[0] || null;
    },
    isOwner: function () { return boot().role === 'owner'; },
    readOnly: function () { return !!(desc && desc.readOnly); },
    period: function () { return desc && desc.period ? desc.period : null; }, // 'before' | 'after': сегодня вне периода активной цели
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

  // ---------- ввод факта: один контроллер и одна очередь записи на сессию ----------
  // Нажатия на «Сегодня» меняют только экран (черновик в localStorage); на сервер день уходит одним day.save по кнопке «Сохранить»
  // (Telegram MainButton). Сервер не хранит журнал повторов для day.save, day.completeAll, day.finish, поэтому запросы записи идут
  // строго по одному через общую очередь, а контроллер «Сегодня» переживает смену вкладок (иначе у нового экрана была бы своя очередь).
  var writeQueue = GT.todayLogic.createWriteQueue();
  var todayCtrl = null;
  // Смена цели (goal.complete, goal.create) или ответ goal_archived / goal_not_found: черновики и кэш «Сегодня» прежней цели удаляются без отправки
  function forgetGoal() {
    draftStore.clear();
    cacheStore.remove(uid);
    lastBoot = null;
    if (todayCtrl) todayCtrl.forget();
  }
  var leaveHooks = [];
  env.todayController = function () {
    if (!todayCtrl) {
      todayCtrl = GT.todayLogic.createToday({
        call: function (m, p, o2) { return env.call(m, p, o2); }, queue: writeQueue, schedule: env.schedule, cancel: env.cancel,
        drafts: draftStore, scope: function () { var b = boot(); return b && b.cabinet ? b.cabinet.id : ''; },
        onStatus: syncTelegramButtons, onServer: saveCache,
        onGoalGone: function () { cacheStore.remove(uid); lastBoot = null; U.toast(t('today.goalGone'), 'error'); env.reboot(); },
        myMemberId: function () { var m = env.myMember(); return m && m.id; }
      });
    }
    return todayCtrl;
  };
  env.onLeave = function (fn) { leaveHooks.push(fn); };
  function runLeaveHooks() {
    var hooks = leaveHooks;
    leaveHooks = [];
    hooks.forEach(function (fn) { try { fn(); } catch (e) { /* уход с экрана не должен ломаться */ } });
  }

  // Кнопка Telegram «Сохранить» видна только при несохранённом; пока есть несохранённое, закрытие приложения просит подтверждение.
  var lastButtons = '';
  function syncTelegramButtons() {
    if (!tg || !todayCtrl) return;
    var u = todayCtrl.ui();
    var show = u.show && GT.router.saveButtonAllowed(desc, nav, helpOpen); // «Сохранить» только на экране «Сегодня»
    var sig = [show, u.loading, u.confirmClose].join();
    if (sig === lastButtons) return;
    lastButtons = sig;
    try {
      var mb = tg.MainButton;
      if (mb) {
        if (show) {
          mb.setText(t('today.save'));
          mb.show();
          if (u.loading) mb.showProgress(false); else mb.hideProgress();
        } else { mb.hideProgress(); mb.hide(); }
      }
      if (u.confirmClose) tg.enableClosingConfirmation(); else tg.disableClosingConfirmation();
    } catch (e) { /* старый клиент Telegram без этих методов: остаётся кнопка на странице */ }
  }

  // Кэш последнего «Сегодня» (ключ — пользователь): при открытии показывается сразу, пока идёт app.bootstrap.
  // Обновляется свежим bootstrap и каждым подтверждённым сохранением (значения сервера, не черновика).
  function saveCache(view) {
    if (!lastBoot || !lastBoot.today || view.date !== lastBoot.today.date || view.goal.id !== lastBoot.today.goal.id) return;
    lastBoot.today = view;
    cacheStore.put(uid, { boot: lastBoot, at: Date.now() });
  }
  function readCache(start) {
    var c = cacheStore.get(uid);
    var b = c && c.boot;
    if (!b || !b.today || !b.cabinet || !GT.router.checkEnv(b.env, cfg.EXPECTED_ENV)) return null;
    if (b.today.date !== GT.dates.todayIn(b.cabinet.timezone, Date.now())) return null; // кэш другого дня не показываем
    var d = GT.router.decideScreen(b, start);
    if (d.screen !== 'today') return null;
    d.boot = b;
    d.cached = true;
    return d;
  }

  // Подгрузка дашборда и истории в фоне: по одному запросу, следующий начинается после предыдущего и после дописанной записи
  function startPrefetch() {
    if (prefetch.started) return;
    prefetch.started = true;
    var steps = [{ key: 'dashboard', method: 'dashboard.get', params: { periodDays: 14 } }, { key: 'history', method: 'history.list', params: { limit: 20 } }];
    (function next(i) {
      if (i >= steps.length) return;
      var st = steps[i];
      var entry = { version: prefetch.version, promise: writeQueue.idle().then(function () { return env.call(st.method, st.params); }) };
      prefetch[st.key] = entry;
      entry.promise.then(function () { next(i + 1); }, function () { next(i + 1); });
    })(0);
  }

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
    runLeaveHooks();
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
    var r = showCurrentInner();
    syncTelegramButtons(); // кнопка Telegram зависит от экрана: после любой смены экрана пересчитываем
    return r;
  }

  function showCurrentInner() {
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
    document.body.classList.remove('slow');
    if (desc && desc.cached) {
      // Показан кэш «Сегодня», пока шёл app.bootstrap.
      if (d.screen === 'offline') { // связи нет: остаёмся на кэше с пометкой и «Повторить»
        staleState = 'failed';
        if (todayCtrl) todayCtrl.setStale(true);
        return;
      }
      staleState = null;
      if (d.screen === 'today' && !!d.readOnly === !!desc.readOnly && !helpOpen) { // тот же экран: подменяем данные, не перерисовывая страницу
        desc = d;
        lastBoot = d.boot;
        env.todayController().setStale(false);
        env.todayController().adoptBoot(d.boot.today);
        startPrefetch();
        return;
      }
      if (todayCtrl) todayCtrl.setStale(false);
    }
    desc = d;
    helpOpen = false;
    if (d.boot) {
      if (d.screen === 'today' && d.boot.today) { lastBoot = d.boot; cacheStore.put(uid, { boot: d.boot, at: Date.now() }); } // кэш для следующего открытия
      else cacheStore.remove(uid);
    }
    if (d.screen === 'today') {
      if (!nav.keepTab) { nav.tab = 'today'; }
      nav.keepTab = false;
      nav.stack = [];
      // первый день «Сегодня» приходит в app.bootstrap: принимаем без запроса
      var ctrl = env.todayController();
      if (d.boot && d.boot.today) ctrl.adoptBoot(d.boot.today); else ctrl.adoptBoot(null);
    }
    if (d.screen === 'today' && d.period === 'after') startPrefetch(); // экран завершённого периода сам берёт подгруженный дашборд
    showCurrent();
    if (d.screen === 'today' && !d.cached) setTimeout(startPrefetch, 0);
    syncTelegramButtons();
  }

  // ---------- запуск ----------
  var flowStarted = false;
  function startFlow() {
    if (flowStarted) return; // onload и onerror скрипта Telegram не должны запускать открытие дважды
    flowStarted = true;
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
      apiUrl: cfg.API_URL, fetch: fetchFn, getInitData: getInitData, onCall: function (r) { GT.diag.record(r); },
      onSlow: function () { document.body.classList.add('slow'); }
    });
    var tz;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { tz = undefined; }
    flow = GT.flow.createFlow({ api: client, expectedEnv: cfg.EXPECTED_ENV, startParam: startParam, tz: tz, onScreen: onDescriptor });
    uid = mode === 'mock' ? 'mock:' + (query.get('scenario') || 'new') + ':' + (query.get('as') || 'owner')
      : String(tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 'anon');
    var cached = readCache(GT.router.parseStartParam(startParam));
    if (cached) { // последний «Сегодня» сразу, с пометкой «обновляем»; настоящие данные заменят его ответом bootstrap
      staleState = 'loading';
      lastBoot = cached.boot;
      desc = cached;
      var ctrl = env.todayController();
      ctrl.adoptBoot(cached.boot.today);
      ctrl.setStale(true);
      showCurrent();
      syncTelegramButtons();
    } else {
      onDescriptor({ screen: 'loading' });
    }
    flow.run();
  }

  onDescriptor({ screen: 'loading' });
  if (mode === 'real') {
    var s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-web-app.js';
    s.onload = s.onerror = function () {
      tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
      if (tg) {
        try { tg.ready(); tg.expand(); } catch (e) { /* не критично */ }
        try { tg.MainButton.onClick(function () { if (todayCtrl) todayCtrl.press(); }); } catch (e) { /* без кнопки Telegram «Сохранить» рисуется на странице */ }
      }
      startFlow();
    };
    document.head.appendChild(s);
  } else {
    startFlow();
  }

  GT.env = env; // для отладки в консоли
})();
