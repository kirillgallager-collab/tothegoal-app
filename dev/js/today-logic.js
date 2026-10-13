// Логика экрана «Сегодня» (S-10) без DOM: ввод факта в минимум нажатий (screens.md §3.3, §5; api.md §4).
//  - значения меняются на экране сразу, на сервер уходят одним запросом после паузы 400 мс (склейка быстрых нажатий);
//  - один запрос за раз; при ошибке введённое не теряется, «Повторить» шлёт то же действие с тем же requestId;
//  - «Все нормы выполнены» и «Готово на сегодня» — по одному запросу; «Отменить» возвращает прежние значения.
// Счётчик taps — число нажатий пользователя (для проверки схемы нажатий screens.md §5).
(function (root) {
  'use strict';

  var F = typeof module !== 'undefined' && module.exports ? require('./format.js') : root.GT.format;

  // o: { call(method, params, opts) → Promise<результат клиента API>, onChange(), onGoalReached(), onError(error),
  //      schedule(fn, ms) → handle, cancel(handle), debounceMs=400, undoMs=6000, step для прогресса считается сам }
  function createToday(o) {
    var debounceMs = o.debounceMs != null ? o.debounceMs : 400;
    var undoMs = o.undoMs != null ? o.undoMs : 6000;
    var s = {
      date: null, data: null, values: {}, markers: {}, // markers[actionId] = значение до «Норма выполнена»
      progress: null, // { value, delta } — что показано в поле прогресса цели
      day: null, // итог дня с сервера { doneCount, totalCount, percent, percentRaw, dayEntered, streaks }
      status: 'saved', error: null, undo: null, taps: 0, goalReached: false
    };
    var pendingFacts = {}; // actionId → число | null: ещё не отправленное
    var pendingProgress = null; // { value } | null
    var timer = null;
    var undoTimer = null;
    var inflight = null; // { requestId, kind } — запрос в пути или упавший (для повтора с тем же requestId)
    var failed = null; // { method, params, requestId } — упавший запрос, который можно повторить
    var busy = false;
    var loadToken = 0;

    function changed() { if (o.onChange) o.onChange(); }
    function actions() { return s.data ? s.data.actions : []; }
    function byId(id) { return actions().filter(function (a) { return a.id === id; })[0]; }

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
        pendingFacts = {}; pendingProgress = null; s.undo = null; s.status = 'saved'; s.error = null; failed = null;
        changed();
        return res;
      });
    }

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
      // пока есть несохранённое или ответа ещё не было, показываем локальный расчёт; после ответа — серверный
      if (s.day && !hasPending() && s.status === 'saved') return s.day;
      return localSummary();
    }
    function hasPending() { return Object.keys(pendingFacts).length > 0 || pendingProgress !== null; }

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

    var tail = Promise.resolve(); // запросы идут строго по очереди
    function send(method, params, requestId, batch) {
      var p = tail.then(function () { return doSend(method, params, requestId, batch); });
      tail = p.catch(function () {});
      return p;
    }

    // Дождаться, пока все поставленные в очередь запросы закончатся (в том числе «хвост» после сохранения).
    function idle() {
      var t = tail;
      return t.then(function () { return t === tail ? undefined : idle(); });
    }

    function doSend(method, params, requestId, batch) {
      busy = true;
      s.status = 'saving';
      s.error = null;
      changed();
      return o.call(method, params, requestId ? { requestId: requestId } : undefined).then(function (res) {
        busy = false;
        if (res.ok) {
          failed = null;
          s.status = 'saved';
          applyDay(res);
          if (res.data.progress) s.progressTotal = res.data.progress.currentValue;
          changed();
          if (hasPending()) flush(); // за время запроса появились новые нажатия; ждать это изнутри очереди нельзя (idle() ждёт снаружи)
          return res;
        }
        failed = { method: method, params: params, requestId: res.requestId, batch: batch || null };
        s.status = 'error';
        s.error = res.error;
        if (o.onError) o.onError(res.error);
        changed();
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

    // Новые нажатия после ошибки: неотправленное из упавшего запроса возвращается в очередь
    // (значения абсолютные, более новые побеждают), дальше уходит один общий запрос.
    function absorbFailed() {
      if (!failed) return;
      if (failed.batch) {
        failed.batch.facts.forEach(function (f) { if (!(f.actionId in pendingFacts)) pendingFacts[f.actionId] = f.value; });
        if (failed.batch.progress && pendingProgress === null) pendingProgress = failed.batch.progress;
      }
      failed = null;
    }

    function setValueLocal(id, v) {
      absorbFailed();
      s.values[id] = v;
      pendingFacts[id] = v;
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
      s.markers[id] = v;
      setValueLocal(id, a.norm);
    }
    function isNormMarked(id) { return Object.prototype.hasOwnProperty.call(s.markers, id); }
    function isDone(id) { var a = byId(id); var v = value(id); return !!a && v !== null && v >= a.norm; }

    function setProgress(v) {
      s.taps++;
      absorbFailed();
      s.progress = { value: v };
      pendingProgress = { value: v };
      schedule();
      changed();
    }
    function stepProgress(dir, step) {
      var cur = s.progress ? s.progress.value : 0;
      setProgress(Math.max(s.data.progress.inputMode === 'delta' ? -1e12 : 0, F.addStep(cur, dir * step)));
    }

    function afterBulk(res, prevValues) {
      if (!res.ok) return res;
      res.data.facts.forEach(function (f) { s.values[f.actionId] = f.value; });
      s.markers = {};
      applyDay(res);
      s.status = 'saved';
      if (prevValues) {
        s.undo = { prev: prevValues };
        if (undoTimer) o.cancel(undoTimer);
        undoTimer = o.schedule(function () { s.undo = null; undoTimer = null; changed(); }, undoMs);
      }
      changed();
      return res;
    }

    function bulk(method, withUndo) {
      s.taps++;
      return (hasPending() ? (timer && o.cancel(timer), flush()) : Promise.resolve()).then(function () {
        var prev = actions().map(function (a) { return { actionId: a.id, value: value(a.id) }; });
        return send(method, { goalId: s.data.goal.id, date: s.date }).then(function (res) { return afterBulk(res, withUndo ? prev : null); });
      });
    }
    function completeAll() { return bulk('day.completeAll', true); }
    function finish() { return bulk('day.finish', false); }

    function undo() {
      if (!s.undo) return Promise.resolve();
      s.taps++;
      var prev = s.undo.prev;
      s.undo = null;
      if (undoTimer) { o.cancel(undoTimer); undoTimer = null; }
      prev.forEach(function (p) { s.values[p.actionId] = p.value; });
      changed();
      return send('day.save', { goalId: s.data.goal.id, date: s.date, facts: prev }).then(function (res) {
        if (res.ok) res.data.facts.forEach(function (f) { s.values[f.actionId] = f.value; });
        changed();
        return res;
      });
    }

    // «Повторить» после «нет связи»: тот же запрос с тем же requestId.
    function retry() {
      if (!failed) { if (hasPending()) return flush(); return Promise.resolve(); }
      var f = failed;
      return send(f.method, f.params, f.requestId, f.batch);
    }

    return { state: s, load: load, plus: plus, minus: minus, setExact: setExact, toggleNorm: toggleNorm, isNormMarked: isNormMarked,
      isDone: isDone, idle: idle, completeAll: completeAll, finish: finish, undo: undo, retry: retry, flush: flush, value: value,
      summary: summary, entered: entered, allEntered: allEntered, anyBelowNorm: anyBelowNorm, setProgress: setProgress,
      stepProgress: stepProgress, hasPending: hasPending };
  }

  var api = { createToday: createToday };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.todayLogic = api; }
})(globalThis);
