// Логика экрана «Сегодня» (S-10) без DOM: ввод факта в минимум нажатий (screens.md §3.3, §5; api.md §4).
// Ввод ОПТИМИСТИЧНЫЙ: любое нажатие сразу меняет значение на экране, сервер догоняет в фоне, ввод не блокируется.
//  - «−/+», число, «Норма выполнена», прогресс цели: значение меняется сразу, на сервер уходит одним запросом после паузы 400 мс (склейка);
//  - «Все нормы выполнены» и «Готово на сегодня» тоже меняют экран сразу, запрос уходит в фоне, строго по очереди после ожидающих нажатий;
//  - «Отменить» появляется сразу и остаётся до следующего действия на экране или undoMs (10 с) после того, как сервер ответил на всё;
//  - при ошибке значения остаются на экране, status = 'error', «Повторить» шлёт тот же запрос с тем же requestId; следующие нажатия
//    не теряют неотправленное (оно уходит вместе с новыми значениями: значения абсолютные, повтор безвреден).
// Счётчик taps — число нажатий пользователя (для проверки схемы нажатий screens.md §5).
(function (root) {
  'use strict';

  var F = typeof module !== 'undefined' && module.exports ? require('./format.js') : root.GT.format;

  // Ошибки, при которых кнопка «Повторить» имеет смысл (rate_limited: клиент сам не повторяет, но человек может нажать после паузы)
  var RETRYABLE = { network: true, unavailable: true, busy: true, service_busy: true, request_in_progress: true, internal: true, rate_limited: true };

  // o: { call(method, params, opts) → Promise<результат клиента API>, onChange(), onGoalReached(), onError(error),
  //      schedule(fn, ms) → handle, cancel(handle), debounceMs=400, undoMs=10000, myMemberId }
  function createToday(o) {
    var debounceMs = o.debounceMs != null ? o.debounceMs : 400;
    var undoMs = o.undoMs != null ? o.undoMs : 10000;
    var s = {
      date: null, data: null, values: {}, markers: {}, // markers[actionId] = значение до «Норма выполнена»
      progress: null, // { value } — что показано в поле прогресса цели
      day: null, // итог дня с сервера { doneCount, totalCount, percent, percentRaw, dayEntered }
      status: 'saved', // saved | saving | error — индикатор, ввод не блокирует
      error: null, undo: null, taps: 0, goalReached: false
    };
    var pendingFacts = {}; // actionId → число | null: ещё не отправленное
    var pendingProgress = null; // { value } | null
    var timer = null;
    var undoTimer = null;
    var failed = null; // упавший запрос, который можно повторить: { method, params, requestId, batch, onOk, all }
    var busy = false;
    var queued = 0; // сколько запросов поставлено в очередь и ещё не завершено
    var loadToken = 0;
    var changeSeq = 0; // порядковый номер пользовательских изменений
    var lastChange = {}; // actionId → номер последнего изменения пользователем (ответ сервера не должен затирать более новое)

    function changed() { if (o.onChange) o.onChange(); }
    function actions() { return s.data ? s.data.actions : []; }
    function byId(id) { return actions().filter(function (a) { return a.id === id; })[0]; }
    function touch(id) { lastChange[id] = ++changeSeq; }
    function hasPending() { return Object.keys(pendingFacts).length > 0 || pendingProgress !== null; }
    function refreshStatus() {
      s.status = failed ? 'error' : (queued > 0 || hasPending() ? 'saving' : 'saved');
      if (!failed) s.error = null;
    }

    function clearUndo() {
      if (undoTimer) { o.cancel(undoTimer); undoTimer = null; }
      s.undo = null;
    }
    // «Отменить» гаснет через undoMs после того, как сервер ответил на всё (до этого держится сколько угодно)
    function confirmUndoIfIdle() {
      if (!s.undo || s.undo.confirmed || failed || hasPending() || queued > 1) return;
      s.undo.confirmed = true;
      var u = s.undo;
      undoTimer = o.schedule(function () { undoTimer = null; if (s.undo === u) { s.undo = null; changed(); } }, undoMs);
    }

    function load(date) {
      var token = ++loadToken;
      var params = date ? { date: date } : {};
      return o.call('today.get', params).then(function (res) {
        if (token !== loadToken) return res;
        if (!res.ok) return res;
        s.data = res.data;
        s.date = res.data.date;
        s.values = {};
        res.data.actions.forEach(function (a) { s.values[a.id] = a.value; });
        s.markers = {};
        // progress.value: «прирост за день» — ввод вызывающего за день, «текущее значение» — значение цели на день
        s.progress = { value: res.data.progress.value };
        var me = res.data.members.filter(function (m) { return m.id === o.myMemberId; })[0] || res.data.members[0];
        s.day = me ? { doneCount: me.doneCount, totalCount: me.totalCount, percent: me.percent, percentRaw: me.percentRaw, dayEntered: res.data.dayEntered } : null;
        s.goalReached = !!res.data.prompts.goalReached;
        pendingFacts = {}; pendingProgress = null; failed = null; lastChange = {}; changeSeq = 0;
        clearUndo();
        refreshStatus();
        changed();
        return res;
      });
    }

    // Загрузить день заново с сервера и отбросить несохранённое (кнопка «Обновить экран» при неисправимой ошибке).
    function refresh() { return load(s.date); }

    // ---------- локальные значения ----------
    function value(id) { var v = s.values[id]; return v === undefined ? null : v; }
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
      if (s.day && !hasPending() && s.status === 'saved') return s.day;
      return localSummary();
    }

    // ---------- отправка ----------
    function schedule() {
      if (timer) o.cancel(timer);
      timer = o.schedule(flush, debounceMs);
    }

    function applyDay(res) {
      if (res.data.day) {
        var d = res.data.day;
        s.day = { doneCount: d.doneCount, totalCount: d.totalCount, percent: d.percent, percentRaw: d.percentRaw, dayEntered: d.dayEntered };
        d.streaks.forEach(function (x) { var a = byId(x.actionId); if (a) a.streak = x.streak; });
      }
      if (res.data.goalReached && !s.goalReached) { s.goalReached = true; if (o.onGoalReached) o.onGoalReached(); }
    }

    // Ответ сервера на пакетный запрос уточняет значения, но не затирает то, что пользователь изменил после отправки.
    function reconcile(res, seq) {
      (res.data.facts || []).forEach(function (f) {
        if (lastChange[f.actionId] > seq || (f.actionId in pendingFacts)) return;
        s.values[f.actionId] = f.value;
      });
    }

    var tail = Promise.resolve(); // запросы идут строго по очереди
    function send(method, params, requestId, batch, onOk, meta) {
      queued++;
      refreshStatus();
      changed();
      var p = tail.then(function () { return doSend(method, params, requestId, batch, onOk, meta); });
      tail = p.catch(function () {});
      return p.then(function (r) { queued--; refreshStatus(); changed(); return r; }, function (e) { queued--; refreshStatus(); changed(); throw e; });
    }

    // Дождаться, пока все поставленные в очередь запросы закончатся (в том числе «хвост» после сохранения).
    function idle() {
      var t = tail;
      return t.then(function () { return t === tail ? undefined : idle(); });
    }

    function doSend(method, params, requestId, batch, onOk, meta) {
      busy = true;
      return o.call(method, params, requestId ? { requestId: requestId } : undefined).then(function (res) {
        busy = false;
        if (res.ok) {
          if (failed) absorbFailed(); // раньше что-то не дошло: пусть уйдёт вместе с актуальными значениями
          applyDay(res);
          if (onOk) onOk(res);
          if (res.data.progress) s.progressTotal = res.data.progress.currentValue;
          if (hasPending()) flush(); // за время запроса появились новые нажатия; ждать это изнутри очереди нельзя (idle() ждёт снаружи)
          confirmUndoIfIdle();
          changed();
          return res;
        }
        var older = failed; // уже есть упавший запрос (в очереди было два): объединяем, чтобы ничего не потерять
        failed = { method: method, params: params, requestId: res.requestId, batch: batch || null, onOk: onOk || null, all: !!(meta && meta.all), count: 1 };
        if (older) {
          failed.count = older.count + 1;
          failed.all = true;
          failed.onOk = null;
          var facts = ((older.batch && older.batch.facts) || []).concat((batch && batch.facts) || []);
          failed.batch = { facts: facts, progress: (batch && batch.progress) || (older.batch && older.batch.progress) || null };
        }
        s.error = res.error;
        if (o.onError) o.onError(res.error);
        return res;
      });
    }

    function flush() {
      timer = null;
      if (busy || !hasPending()) return Promise.resolve();
      var facts = Object.keys(pendingFacts).map(function (id) { return { actionId: id, value: pendingFacts[id] }; });
      var progress = pendingProgress;
      pendingFacts = {}; pendingProgress = null;
      var goalId = s.data.goal.id;
      var batch = { facts: facts, progress: progress };
      if (facts.length === 1 && !progress) {
        return send('fact.set', { actionId: facts[0].actionId, date: s.date, value: facts[0].value }, undefined, batch);
      }
      var params = { goalId: goalId, date: s.date, facts: facts };
      if (progress) params.progress = { value: progress.value };
      return send('day.save', params, undefined, batch);
    }

    // Упавший запрос возвращается в очередь неотправленного. Источник правды — значения на экране (они всегда самые свежие):
    // для каждого действия из упавшего пакета уходит его ТЕКУЩЕЕ значение, а не то, что было в пакете.
    // Для «Все нормы» и «Готово» в очередь идут все внесённые значения экрана (на сервере они уже могли примениться: повтор безвреден).
    function absorbFailed() {
      if (!failed) return;
      var f = failed;
      failed = null;
      if (f.batch) {
        f.batch.facts.forEach(function (x) { pendingFacts[x.actionId] = value(x.actionId); });
        if (f.batch.progress && pendingProgress === null) pendingProgress = s.progress ? { value: s.progress.value } : f.batch.progress;
      }
      if (f.all) actions().forEach(function (a) { var v = value(a.id); if (v !== null) pendingFacts[a.id] = v; });
      if (hasPending()) schedule();
      refreshStatus();
    }

    function setValueLocal(id, v) {
      absorbFailed();
      clearUndo(); // следующее действие на экране убирает «Отменить»
      s.values[id] = v;
      touch(id);
      pendingFacts[id] = v;
      refreshStatus();
      schedule();
      changed();
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
      absorbFailed();
      clearUndo();
      s.progress = { value: v };
      pendingProgress = { value: v };
      refreshStatus();
      schedule();
      changed();
    }
    function stepProgress(dir, step) {
      var cur = s.progress ? s.progress.value : 0;
      setProgress(Math.max(s.data.progress.inputMode === 'delta' ? -1e12 : 0, F.addStep(cur, dir * step)));
    }

    // Ожидающие нажатия уходят первыми (очередь сохраняет порядок), потом пакетный запрос.
    function flushNow() { if (timer) { o.cancel(timer); timer = null; } if (hasPending()) flush(); }

    // «Все нормы выполнены»: экран меняется сразу, «Отменить» виден сразу.
    function completeAll() {
      s.taps++;
      absorbFailed();
      clearUndo();
      var prev = actions().map(function (a) { return { actionId: a.id, value: value(a.id) }; });
      actions().forEach(function (a) {
        var v = value(a.id);
        var nv = Math.max(v === null ? 0 : v, a.norm);
        if (nv !== v) { s.values[a.id] = nv; touch(a.id); }
      });
      s.markers = {};
      s.undo = { prev: prev, confirmed: false };
      var seq = changeSeq;
      flushNow();
      return send('day.completeAll', { goalId: s.data.goal.id, date: s.date }, undefined, null, function (res) { reconcile(res, seq); }, { all: true });
    }

    // «Готово на сегодня»: у действий без значения сразу появляется 0.
    function finish() {
      s.taps++;
      absorbFailed();
      clearUndo();
      actions().forEach(function (a) { if (value(a.id) === null) { s.values[a.id] = 0; touch(a.id); } });
      s.markers = {};
      var seq = changeSeq;
      flushNow();
      return send('day.finish', { goalId: s.data.goal.id, date: s.date }, undefined, null, function (res) { reconcile(res, seq); }, { all: true });
    }

    // «Отменить»: прежние значения возвращаются сразу, на сервер уходит абсолютный снимок (после всего, что уже в очереди).
    function undo() {
      if (!s.undo) return Promise.resolve();
      s.taps++;
      var prev = s.undo.prev;
      clearUndo();
      failed = null; // снимок ниже перекрывает всё, что не успело дойти
      prev.forEach(function (p) { s.values[p.actionId] = p.value; touch(p.actionId); delete pendingFacts[p.actionId]; });
      s.markers = {};
      var seq = changeSeq;
      refreshStatus();
      changed();
      return send('day.save', { goalId: s.data.goal.id, date: s.date, facts: prev }, undefined, { facts: prev, progress: null }, function (res) { reconcile(res, seq); }, {});
    }

    function isRetryable() { return !!failed && !!s.error && !!RETRYABLE[s.error.code]; }

    // «Повторить»: тот же запрос с тем же requestId. Если упало сразу несколько запросов, уходит один общий снимок текущих значений.
    function retry() {
      if (!failed) { if (hasPending()) return flush(); return Promise.resolve(); }
      var f = failed;
      if (f.count > 1) { absorbFailed(); flushNow(); return Promise.resolve(); }
      failed = null;
      refreshStatus();
      return send(f.method, f.params, f.requestId, f.batch, f.onOk, { all: f.all });
    }

    return { state: s, load: load, refresh: refresh, plus: plus, minus: minus, setExact: setExact, toggleNorm: toggleNorm, isNormMarked: isNormMarked,
      isDone: isDone, idle: idle, completeAll: completeAll, finish: finish, undo: undo, retry: retry, flush: flush, value: value,
      summary: summary, entered: entered, allEntered: allEntered, anyBelowNorm: anyBelowNorm, setProgress: setProgress,
      stepProgress: stepProgress, hasPending: hasPending, isRetryable: isRetryable };
  }

  var api = { createToday: createToday, RETRYABLE: RETRYABLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.todayLogic = api; }
})(globalThis);
