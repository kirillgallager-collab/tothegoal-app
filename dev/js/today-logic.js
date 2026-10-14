// Логика экрана «Сегодня» (S-10) без DOM: явное сохранение дня (screens.md §3.3, §5; api.md §4, §11).
//
// МОДЕЛЬ. Нажатия «−», «+», «Норма выполнена», ввод числа и прогресс цели меняют ТОЛЬКО экран (черновик): запросов нет.
// Черновик (отличия экрана от того, что на сервере) хранится в localStorage по кабинету, цели и дате (createStore: чтение и запись
// в try/catch, если localStorage недоступен — живёт в памяти страницы). Несохранённое уходит одним day.save со всем днём
// (save: кнопка Telegram MainButton «Сохранить»). «Все нормы выполнены» и «Готово на сегодня» сохраняют сразу: несохранённые
// facts и progress едут в том же запросе. «Отменить» после «Все нормы» возвращает прежние значения через day.save.
//
// ЗАПИСЬ (day.save, day.completeAll, day.finish) — правила, потому что сервер не хранит журнал повторов для этих методов:
// повтор запроса выполняется заново и может затереть более новое значение.
//  1. Не больше ОДНОГО запроса записи одновременно: общая очередь (createWriteQueue) на всю сессию, а не на экран;
//     пока идёт «Сохранить», второе нажатие запроса не отправляет.
//  2. Повтор после ошибки допустим, только если после запроса экран не менялся. Иначе автоповторы клиента API отменяются
//     (canRetry → 'superseded'), черновик остаётся несохранённым, а «Сохранить» отправляет актуальные значения всего дня.
//  3. Перед загрузкой другого дня черновик уже лежит в хранилище: дни не теряют введённое, у каждого дня свой черновик.
// Счётчик taps — число нажатий пользователя (для проверки схемы нажатий screens.md §5; «Сохранить» — одно нажатие).
(function (root) {
  'use strict';

  var F = typeof module !== 'undefined' && module.exports ? require('./format.js') : root.GT.format;

  // Ошибки, при которых кнопка «Повторить» имеет смысл (rate_limited: клиент сам не повторяет, но человек может нажать после паузы)
  var RETRYABLE = { network: true, unavailable: true, busy: true, service_busy: true, request_in_progress: true, internal: true, rate_limited: true };

  // Ответы, после которых черновик дня теряет смысл (цель уже не активна)
  // (в каталоге ошибок api.md §5 есть только not_found, но changelog (7) называет goal_not_found: обрабатываем оба; для day.save,
  // day.completeAll и day.finish «не найдено» может относиться только к цели или действиям этой цели)
  var GOAL_GONE = { goal_archived: true, goal_not_found: true, not_found: true };

  // Очередь записи: задачи выполняются строго по одной. Один экземпляр на сессию (на кабинет).
  function createWriteQueue() {
    var tail = Promise.resolve();
    var n = 0;
    function idle() {
      var t = tail;
      return t.then(function () { return t === tail ? undefined : idle(); });
    }
    function run(fn) {
      n++;
      var p = tail.then(fn);
      tail = p.then(function () {}, function () {});
      return p.then(function (r) { n--; return r; }, function (e) { n--; throw e; });
    }
    return { run: run, idle: idle, outstanding: function () { return n; } };
  }

  // Хранилище значений по ключу (черновики дней, кэш последнего «Сегодня»): localStorage в try/catch + копия в памяти.
  // getStorage() → объект с getItem/setItem/removeItem или null. Любая ошибка доступа не ломает экран.
  function createStore(getStorage, prefix) {
    var mem = {};
    var pre = prefix || '';
    function st() { try { return getStorage ? getStorage() : null; } catch (e) { return null; } }
    return {
      get: function (key) {
        if (Object.prototype.hasOwnProperty.call(mem, key)) return mem[key];
        try {
          var s = st();
          var raw = s ? s.getItem(pre + key) : null;
          if (raw) { var v = JSON.parse(raw); mem[key] = v; return v; }
        } catch (e) { /* повреждённая запись или запрет доступа: считаем, что значения нет */ }
        return null;
      },
      put: function (key, v) {
        mem[key] = v;
        try { var s = st(); if (s) s.setItem(pre + key, JSON.stringify(v)); } catch (e) { /* остаётся в памяти страницы */ }
      },
      remove: function (key) {
        mem[key] = null;
        try { var s = st(); if (s) s.removeItem(pre + key); } catch (e) { /* остаётся в памяти страницы */ }
      },
      // Удалить все значения хранилища (смена цели: черновики прежней цели больше не нужны)
      clear: function () {
        Object.keys(mem).forEach(function (k) { mem[k] = null; });
        try {
          var s = st();
          if (!s || typeof s.key !== 'function') return;
          var doomed = [];
          for (var i = 0; i < s.length; i++) { var k = s.key(i); if (k && k.indexOf(pre) === 0) doomed.push(k); }
          doomed.forEach(function (k) { s.removeItem(k); });
        } catch (e) { /* остаётся в памяти страницы */ }
      }
    };
  }

  function nv(v) { return v === undefined ? null : v; }

  // o: { call(method, params, opts) → Promise<результат клиента API> (opts: { requestId?, canRetry? }), queue?, drafts? (createStore),
  //      scope() → строка кабинета для ключа черновика, onChange(), onStatus(), onServer(todayData), onGoalReached(), onError(error),
  //      schedule(fn, ms) → handle, cancel(handle), now(), undoMs=10000, savedMs=2500, maxAgeMs=600000, myMemberId (значение или функция) }
  function createToday(o) {
    var undoMs = o.undoMs != null ? o.undoMs : 10000;
    var savedMs = o.savedMs != null ? o.savedMs : 2500;
    var maxAgeMs = o.maxAgeMs != null ? o.maxAgeMs : 600000;
    var now = o.now || Date.now;
    var q = o.queue || createWriteQueue();
    var drafts = o.drafts || createStore(null, '');
    var handlers = { onChange: o.onChange, onGoalReached: o.onGoalReached, onError: o.onError };
    var s = {
      date: null, data: null, values: {}, markers: {}, // markers[actionId] = значение до «Норма выполнена»
      base: { values: {}, progress: null },            // что сейчас на сервере (последнее известное)
      progress: null,                                  // { value } — что показано в поле прогресса цели
      day: null,                                       // итог дня с сервера { doneCount, totalCount, percent, percentRaw, dayEntered }
      status: 'idle',                                  // idle | dirty | saving | saved | error
      error: null, undo: null, taps: 0, goalReached: false,
      restored: null,                                  // дата дня, чей черновик найден при открытии (предложить «Сохранить» / «Отбросить»)
      stale: false, justSaved: false, loadedAt: 0
    };
    var failed = null;       // упавший запрос, который можно повторить: { method, params, requestId, seq, onOk }
    var queued = 0;          // сколько запросов поставлено в очередь и ещё не завершено
    var saveInFlight = null; // промис «Сохранить» в пути: второе нажатие запроса не отправляет
    var loadToken = 0;
    var changeSeq = 0;       // порядковый номер пользовательских изменений
    var lastChange = {};     // actionId → номер последнего изменения пользователем (ответ сервера не должен затирать более новое)
    var lastProgressChange = 0;
    var touched = {};        // ключ черновика → правили в этой сессии (тогда это не «найденный при открытии»)
    var seen = {};           // ключ черновика → уже показывали
    var undoTimer = null;
    var savedTimer = null;

    function changed() { if (handlers.onChange) handlers.onChange(); }
    function notify() { if (o.onStatus) o.onStatus(); }
    function actions() { return s.data ? s.data.actions : []; }
    function byId(id) { return actions().filter(function (a) { return a.id === id; })[0]; }
    function bump() { return ++changeSeq; }
    function touch(id) { lastChange[id] = bump(); }
    function myMemberId() { return typeof o.myMemberId === 'function' ? o.myMemberId() : o.myMemberId; }
    function keyOf(date) { return (o.scope ? o.scope() : '') + ':' + s.data.goal.id + ':' + date; }

    // ---------- черновик: чем экран отличается от сервера ----------
    function value(id) { var v = s.values[id]; return v === undefined ? null : v; }
    function dirtyIds() { return actions().filter(function (a) { return value(a.id) !== nv(s.base.values[a.id]); }).map(function (a) { return a.id; }); }
    function progressDirty() { return !!s.progress && s.progress.value !== s.base.progress; }
    function dirty() { return !!s.data && (dirtyIds().length > 0 || progressDirty()); }
    function isRowDirty(id) { return value(id) !== nv(s.base.values[id]); }

    function persist() {
      if (!s.data) return;
      var k = keyOf(s.date);
      if (!dirty()) { drafts.remove(k); return; }
      var facts = {};
      dirtyIds().forEach(function (id) { facts[id] = value(id); });
      var d = { facts: facts, at: now() };
      if (progressDirty()) d.progress = s.progress.value;
      drafts.put(k, d);
    }

    function status() {
      if (failed) return 'error';
      if (queued > 0) return 'saving';
      if (dirty()) return 'dirty';
      return s.justSaved ? 'saved' : 'idle';
    }
    function refreshStatus() {
      s.status = status();
      if (!failed) s.error = null;
    }
    function settle() { refreshStatus(); notify(); changed(); }

    function clearUndo() {
      if (undoTimer) { o.cancel(undoTimer); undoTimer = null; }
      s.undo = null;
    }
    // «Отменить» гаснет через undoMs после того, как сервер ответил на всё (до этого держится сколько угодно)
    function confirmUndoIfIdle() {
      if (!s.undo || s.undo.confirmed || failed || queued > 0) return;
      s.undo.confirmed = true;
      var u = s.undo;
      undoTimer = o.schedule(function () { undoTimer = null; if (s.undo === u) { s.undo = null; changed(); } }, undoMs);
    }
    function flashSaved() {
      s.justSaved = true;
      if (savedTimer) o.cancel(savedTimer);
      savedTimer = o.schedule(function () { savedTimer = null; s.justSaved = false; settle(); }, savedMs);
    }

    // Данные дня в том виде, как они на сервере (для кэша «последнего Сегодня»): значения из base, не из черновика.
    function serverView() {
      if (!s.data) return null;
      var d = JSON.parse(JSON.stringify(s.data));
      d.actions.forEach(function (a) { a.value = nv(s.base.values[a.id]); a.done = a.value !== null && a.value >= a.norm; });
      d.progress.value = s.base.progress;
      if (s.day) {
        d.dayEntered = s.day.dayEntered;
        var mid = myMemberId();
        d.members.forEach(function (m) { if (m.id === mid) { m.doneCount = s.day.doneCount; m.totalCount = s.day.totalCount; m.percent = s.day.percent; m.percentRaw = s.day.percentRaw; m.factEntered = s.day.dayEntered; } });
      }
      return d;
    }
    function reportServer() { if (o.onServer && s.data) o.onServer(serverView()); }

    // ---------- данные дня с сервера ----------
    // Принять данные дня (today.get или app.bootstrap.today) и наложить на них черновик из хранилища.
    function applyServer(data) {
      s.data = data;
      s.date = data.date;
      s.loadedAt = now();
      s.base = { values: {}, progress: data.progress.value };
      s.values = {};
      data.actions.forEach(function (a) { s.base.values[a.id] = a.value; s.values[a.id] = a.value; });
      s.progress = { value: data.progress.value };
      s.markers = {};
      s.undo = null;
      if (undoTimer) { o.cancel(undoTimer); undoTimer = null; }
      failed = null;
      lastChange = {}; lastProgressChange = 0; changeSeq = 0;
      var mid = myMemberId();
      var me = data.members.filter(function (m) { return m.id === mid; })[0] || data.members[0];
      s.day = me ? { doneCount: me.doneCount, totalCount: me.totalCount, percent: me.percent, percentRaw: me.percentRaw, dayEntered: data.dayEntered } : null;
      s.goalReached = !!data.prompts.goalReached;
      var k = keyOf(data.date);
      var d = drafts.get(k);
      if (d && d.facts) {
        Object.keys(d.facts).forEach(function (id) { if (id in s.values) s.values[id] = d.facts[id]; });
        if (d.progress != null) s.progress = { value: d.progress };
        if (!dirty()) drafts.remove(k);
        else if (!touched[k] && !seen[k]) s.restored = data.date; // черновик с прошлого раза: предложить «Сохранить» или «Отбросить»
        seen[k] = true;
      }
      reportServer();
      refreshStatus();
    }

    // Загрузить день: today.get. Черновик дня остаётся и накладывается на ответ. load(date, { discard: true }) — отбросить черновик
    // этого дня («Обновить экран» при ошибке, которую повтором не исправить). Сначала ждём, пока допишутся запросы записи.
    function load(date, opts) {
      var discard = !!(opts && opts.discard);
      var token = ++loadToken;
      if (discard && s.data) { drafts.remove(keyOf(s.date)); s.restored = null; }
      return q.idle().then(function () {
        if (token !== loadToken) return { ok: true, data: s.data, superseded: true };
        return o.call('today.get', date ? { date: date } : {}).then(function (res) {
          if (token !== loadToken) return res;
          if (!res.ok) return res;
          applyServer(res.data);
          settle();
          return res;
        });
      });
    }

    // Загрузить день заново с сервера и отбросить несохранённое этого дня (кнопка «Обновить экран»).
    function refresh() { return load(s.date, { discard: true }); }

    // Открытие экрана «Сегодня»: уже загруженное не запрашиваем заново (запрос ≥ 2 с), пока оно свежее. Первый день берётся
    // из app.bootstrap (adoptBoot), поэтому при открытии отдельного today.get нет.
    function open(date, todayStr) {
      if (s.data && (date ? date === s.date : s.date === todayStr) && now() - s.loadedAt < maxAgeMs) return Promise.resolve({ ok: true, data: s.data });
      return load(date || undefined);
    }

    // Данные «Сегодня» из ответа app.bootstrap (или из кэша): принять без запроса. Пока идёт запись, ответ сервера может быть старше неё — пропускаем.
    function adoptBoot(today) {
      if (!today) { if (queued === 0) { s.data = null; } return false; }
      if (queued > 0) return false;
      if (s.data && s.data.goal.id === today.goal.id && s.date !== today.date) return false; // пользователь смотрит другой день
      applyServer(today);
      settle();
      return true;
    }

    function setStale(v) { s.stale = !!v; notify(); changed(); }

    // ---------- локальные значения ----------
    function entered() { return actions().filter(function (a) { return value(a.id) !== null; }).length; }
    function allEntered() { return entered() === actions().length; }
    function anyBelowNorm() { return actions().some(function (a) { var v = value(a.id); return v === null || v < a.norm; }); }

    // Локальная оценка итога дня до ответа сервера: считаются только действия «в плане» (today.get.actions[].inPlan),
    // «день внесён» — по всем действиям (data-model.md §4).
    function localSummary() {
      var acts = actions();
      var plan = acts.filter(function (a) { return a.inPlan !== false; });
      var done = 0;
      var cap = 0;
      plan.forEach(function (a) {
        var v = value(a.id) == null ? 0 : value(a.id);
        if (v >= a.norm) done++;
        cap += a.norm > 0 ? Math.min(v / a.norm, 1) : 0;
      });
      return { doneCount: done, totalCount: plan.length, percent: plan.length ? Math.round(cap / plan.length * 100) : 0, dayEntered: acts.length === entered() };
    }
    function summary() {
      // пока есть несохранённое или запросы в пути, показываем локальный расчёт; после ответа — серверный
      if (s.day && !dirty() && queued === 0) return s.day;
      return localSummary();
    }

    // ---------- отправка ----------
    function applyDay(res) {
      if (res.data.day) {
        var d = res.data.day;
        s.day = { doneCount: d.doneCount, totalCount: d.totalCount, percent: d.percent, percentRaw: d.percentRaw, dayEntered: d.dayEntered };
        d.streaks.forEach(function (x) { var a = byId(x.actionId); if (a) a.streak = x.streak; });
      }
      if (res.data.goalReached && !s.goalReached) { s.goalReached = true; if (handlers.onGoalReached) handlers.onGoalReached(); }
    }

    // Ответ сервера уточняет то, что на сервере (base), и значения на экране, но не затирает то, что пользователь изменил после отправки.
    function absorbOk(res, seq) {
      (res.data.facts || []).forEach(function (f) {
        s.base.values[f.actionId] = f.value;
        if (!(lastChange[f.actionId] > seq)) s.values[f.actionId] = f.value;
      });
      if (res.data.progress) {
        s.base.progress = res.data.progress.value;
        if (!(lastProgressChange > seq)) s.progress = { value: res.data.progress.value };
        s.progressTotal = res.data.progress.currentValue;
      }
      applyDay(res);
    }

    // Единственное место, где запрос записи уходит в сеть: через общую очередь, по одному.
    function send(method, params, requestId, onOk) {
      queued++;
      refreshStatus();
      notify();
      changed();
      var seq = changeSeq;
      var p = q.run(function () { return doSend(method, params, requestId, onOk, seq); });
      return p.then(function (r) { queued--; after(r); return r; }, function (e) { queued--; after(); throw e; });
    }

    function after(res) {
      if (res && res.ok) { persist(); reportServer(); if (!dirty()) flashSaved(); }
      refreshStatus();
      confirmUndoIfIdle();
      notify();
      changed();
    }

    function doSend(method, params, requestId, onOk, seq) {
      var callOpts = { canRetry: function () { return changeSeq === seq; } }; // новое нажатие отменяет автоповторы старого тела
      if (requestId) callOpts.requestId = requestId;
      return o.call(method, params, callOpts).then(function (res) {
        if (res.ok) {
          failed = null;
          absorbOk(res, seq);
          if (onOk) onOk(res);
          return res;
        }
        // после запроса появилось более новое изменение: старое тело повторять нельзя; черновик остаётся несохранённым, «Сохранить» отправит актуальное
        if (res.error.code === 'superseded') return res;
        // цель завершена или удалена: черновик не нужен и не отправляется повторно (screens.md §3.3)
        if (GOAL_GONE[res.error.code]) { forget(); if (o.onGoalGone) o.onGoalGone(res.error); return res; }
        failed = { method: method, params: params, requestId: res.requestId, seq: seq, onOk: onOk || null };
        s.error = res.error;
        if (handlers.onError) handlers.onError(res.error);
        return res;
      });
    }

    // Тело для «Все нормы» и «Готово»: несохранённые facts и progress (необязательные поля запроса)
    function draftBody() {
      var body = {};
      var facts = dirtyIds().map(function (id) { return { actionId: id, value: value(id) }; });
      if (facts.length) body.facts = facts;
      if (progressDirty()) body.progress = { value: s.progress.value };
      return body;
    }

    function mutated() {
      s.justSaved = false;
      touched[keyOf(s.date)] = true;
      persist();
      refreshStatus();
      notify();
      changed();
    }

    function setValueLocal(id, v) {
      clearUndo(); // следующее действие на экране убирает «Отменить»
      s.values[id] = v;
      touch(id);
      mutated();
    }

    // ---------- действия пользователя ----------
    function plus(id) {
      var a = byId(id);
      if (!a) return;
      s.taps++;
      var v = value(id);
      setValueLocal(id, v === null ? a.step : F.addStep(v, a.step));
    }
    function minus(id) {
      var a = byId(id);
      if (!a) return;
      s.taps++;
      var v = value(id);
      if (v === null) return; // «−» на «—» не действует
      setValueLocal(id, Math.max(0, F.addStep(v, -a.step)));
    }
    // Точное число: нажатие на число, ввод, «Готово» — 2 нажатия + цифры (число нажатий считаем здесь: 2).
    function setExact(id, v) {
      s.taps += 2;
      if (v === null || (typeof v === 'number' && isFinite(v) && v >= 0)) setValueLocal(id, v);
    }
    // «Норма выполнена»; повторное нажатие возвращает прежнее значение.
    function toggleNorm(id) {
      var a = byId(id);
      if (!a) return;
      s.taps++;
      if (Object.prototype.hasOwnProperty.call(s.markers, id)) {
        var prev = s.markers[id];
        delete s.markers[id];
        setValueLocal(id, prev);
        return;
      }
      var v = value(id);
      if (v !== null && v >= a.norm) return; // уже выполнено шагами: кнопка неактивна
      var before = v;
      setValueLocal(id, a.norm);
      s.markers[id] = before;
    }
    function isNormMarked(id) { return Object.prototype.hasOwnProperty.call(s.markers, id); }
    function isDone(id) { var a = byId(id); var v = value(id); return !!a && v !== null && v >= a.norm; }

    function setProgress(v) {
      s.taps++;
      clearUndo();
      lastProgressChange = bump();
      s.progress = { value: v };
      mutated();
    }
    function stepProgress(dir, step) {
      var cur = s.progress ? s.progress.value : 0;
      setProgress(Math.max(s.data.progress.inputMode === 'delta' ? -1e12 : 0, F.addStep(cur, dir * step)));
    }

    // «Сохранить» (MainButton): один day.save со всем днём — значения всех действий (не внесённое уходит как null) и прогресс, если менялся.
    // Пока запрос идёт, повторное нажатие второй запрос не отправляет. Пока данные обновляются (stale), не сохраняем.
    function save() {
      if (!s.data || s.stale) return Promise.resolve(null);
      if (saveInFlight) return saveInFlight;
      if (!dirty()) return Promise.resolve(null);
      s.taps++;
      s.restored = null;
      failed = null;
      var params = { goalId: s.data.goal.id, date: s.date, facts: actions().map(function (a) { return { actionId: a.id, value: value(a.id) }; }) };
      if (progressDirty()) params.progress = { value: s.progress.value };
      var p = send('day.save', params, undefined, null);
      var clear = function () { if (saveInFlight === p) saveInFlight = null; };
      saveInFlight = p;
      p.then(clear, clear);
      return p;
    }

    // «Все нормы выполнены»: экран меняется сразу, «Отменить» виден сразу; несохранённое едет в том же запросе.
    function completeAll() {
      if (s.stale) return Promise.resolve(null);
      s.taps++;
      s.restored = null;
      clearUndo();
      bump();
      var body = draftBody();
      var prev = actions().map(function (a) { return { actionId: a.id, value: value(a.id) }; });
      actions().forEach(function (a) {
        var v = value(a.id);
        var nv2 = Math.max(v === null ? 0 : v, a.norm);
        if (nv2 !== v) { s.values[a.id] = nv2; touch(a.id); }
      });
      s.markers = {};
      s.undo = { prev: prev, confirmed: false };
      mutated();
      return send('day.completeAll', Object.assign({ goalId: s.data.goal.id, date: s.date }, body), undefined, null);
    }

    // «Готово на сегодня»: у действий без значения сразу появляется 0; несохранённое едет в том же запросе.
    function finish() {
      if (s.stale) return Promise.resolve(null);
      s.taps++;
      s.restored = null;
      clearUndo();
      bump();
      var body = draftBody();
      actions().forEach(function (a) { if (value(a.id) === null) { s.values[a.id] = 0; touch(a.id); } });
      s.markers = {};
      mutated();
      return send('day.finish', Object.assign({ goalId: s.data.goal.id, date: s.date }, body), undefined, null);
    }

    // «Отменить»: прежние значения возвращаются сразу, на сервер уходит абсолютный снимок (после всего, что уже в очереди).
    function undo() {
      if (!s.undo) return Promise.resolve();
      s.taps++;
      var prev = s.undo.prev;
      clearUndo();
      bump();
      failed = null; // снимок ниже перекрывает всё, что не успело дойти
      prev.forEach(function (p) { s.values[p.actionId] = p.value; touch(p.actionId); });
      s.markers = {};
      mutated();
      return send('day.save', { goalId: s.data.goal.id, date: s.date, facts: prev }, undefined, null);
    }

    // «Отбросить» черновик: на экране снова то, что на сервере.
    function discard() {
      if (!s.data) return;
      drafts.remove(keyOf(s.date));
      s.values = {};
      Object.keys(s.base.values).forEach(function (id) { s.values[id] = s.base.values[id]; });
      s.progress = { value: s.base.progress };
      s.markers = {};
      s.restored = null;
      failed = null;
      clearUndo();
      settle();
    }

    // Цель сменилась (goal.complete, goal.create) или сервер ответил goal_archived / goal_not_found: все черновики дней и упавший запрос
    // забываются без повторной отправки; экран «Сегодня» снова берётся из app.bootstrap.
    function forget() {
      drafts.clear();
      s.data = null;
      s.values = {}; s.base = { values: {}, progress: null }; s.progress = null; s.markers = {}; s.day = null;
      s.restored = null; s.error = null; s.goalReached = false;
      failed = null; touched = {}; seen = {};
      clearUndo();
      settle();
    }

    function isRetryable() { return !!failed && !!s.error && !!RETRYABLE[s.error.code]; }

    // «Повторить»: тот же запрос с тем же requestId — только если после него ничего не менялось; иначе уходит актуальный день целиком.
    function retry() {
      if (!failed) return save();
      var f = failed;
      if (f.seq !== changeSeq) { failed = null; refreshStatus(); return save(); }
      failed = null;
      refreshStatus();
      return send(f.method, f.params, f.requestId, f.onOk);
    }

    // Что показывать на кнопке Telegram и нужно ли подтверждение закрытия.
    function ui() {
      var d = dirty();
      return { show: !!s.data && !s.stale && (d || queued > 0 || !!failed), loading: queued > 0, dirty: d, confirmClose: d || queued > 0 || !!failed };
    }
    // Нажатие кнопки «Сохранить»: после ошибки — повтор, иначе обычное сохранение
    function press() { return failed ? retry() : save(); }

    // Экран «Сегодня» один на сессию: при смене вкладки он отвязывается, черновик остаётся, запросы доигрывают в фоне.
    function bind(h) { handlers = { onChange: h.onChange, onGoalReached: h.onGoalReached, onError: h.onError }; }
    function leave() { handlers = {}; }

    return { state: s, load: load, open: open, adoptBoot: adoptBoot, setStale: setStale, refresh: refresh, plus: plus, minus: minus, setExact: setExact,
      toggleNorm: toggleNorm, isNormMarked: isNormMarked, isDone: isDone, isRowDirty: isRowDirty, idle: function () { return q.idle(); },
      save: save, press: press, completeAll: completeAll, finish: finish, undo: undo, discard: discard, retry: retry, ui: ui,
      forget: forget, value: value, summary: summary, entered: entered, allEntered: allEntered, anyBelowNorm: anyBelowNorm, setProgress: setProgress,
      stepProgress: stepProgress, hasDraft: dirty, isRetryable: isRetryable, serverView: serverView, bind: bind, leave: leave };
  }

  var api = { createToday: createToday, createWriteQueue: createWriteQueue, createStore: createStore, RETRYABLE: RETRYABLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.todayLogic = api; }
})(globalThis);
