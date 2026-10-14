// S-10 «Сегодня»: ввод факта в минимум нажатий (screens.md §3.3, §5). Логика — js/today-logic.js.
(function (root) {
  'use strict';

  var screens = root.GT.screens = root.GT.screens || {};

  screens.today = function (env, params) {
    var h = env.h;
    var t = env.t;
    var F = env.F;
    var U = env.U;
    var ro = env.readOnly();
    var box = h('div', { class: 'today' });
    var editing = null;      // actionId, у которого сейчас открыт ввод числа
    var statusEl = null;
    var highlightDone = false;
    var me = env.myMember();
    var goalBrief = env.boot().activeGoal;
    var today = env.todayStr();

    // Контроллер один на сессию (вместе с очередью записи): при смене вкладки он отвязывается, накопленное уходит в фоне,
    // а возвращаясь сюда, экран подключается к тому же контроллеру и видит и значения, и плашку ошибки, если что-то не сохранилось.
    var ctrl = env.todayController();
    ctrl.bind({ onChange: draw, onGoalReached: function () { env.reboot(); }, onError: function () { /* статус виден на экране */ } });
    env.onLeave(function () { ctrl.leave(); });

    function s() { return ctrl.state; }

    function statusText() {
      var st = s().status;
      if (st === 'saving') return t('today.saving');
      if (st === 'error') return t('today.saveError');
      if (st === 'dirty') return t('today.dirty');
      return st === 'saved' ? t('today.saved') : '';
    }
    // Плашка ошибки сохранения: введённое остаётся на экране; можно повторить (сеть, занятость сервера) или обновить экран (повтором не исправить)
    function errorBanner() {
      var e = s().error || { code: 'network' };
      var retryable = ctrl.isRetryable();
      return h('div', { class: 'err-bar', role: 'alert' },
        h('span', { text: t(retryable ? 'today.errBannerRetry' : 'today.errBannerHard', { reason: env.S.errorText(e) }) }),
        U.button(t(retryable ? 'common.retry' : 'today.refresh'), function () { if (retryable) ctrl.retry(); else ctrl.refresh(); }));
    }

    function updateStatus() { if (statusEl) { statusEl.textContent = statusText(); statusEl.className = 'save-status ' + s().status; } }

    // ----- шапка дня -----
    function dayHeader() {
      var d = s().data;
      var date = s().date;
      var rem = goalBrief && goalBrief.direction === 'decline' ? d.goal.currentValue - d.goal.targetValue : d.goal.targetValue - d.goal.currentValue;
      var best = 0;
      d.actions.forEach(function (a) { if (a.streak > best) best = a.streak; });
      var label = date === today ? t('today.todayLabel', { date: F.dayLong(date) }) : F.dayLong(date);
      var prev = U.button('←', function () { go(env.D.addDays(date, -1)); }, { secondary: true, aria: t('today.prevDay'), disabled: !!goalBrief && date <= goalBrief.startDate });
      var next = U.button('→', function () { go(env.D.addDays(date, 1)); }, { secondary: true, aria: t('today.nextDay'), disabled: date >= today });
      return h('section', { class: 'card day-head' },
        h('div', { class: 'row between' }, prev, h('strong', { text: label }), next),
        h('p', { class: 'goal-line', text: t('today.goalLine', { cur: F.num(d.goal.currentValue), target: F.num(d.goal.targetValue), unit: d.goal.unit,
          rem: F.num(Math.max(0, rem)), days: d.goal.daysLeft, daysWord: F.plural(d.goal.daysLeft, [t('today.day1'), t('today.day2'), t('today.day5')]) }) }),
        best > 0 ? h('p', { class: 'hint', text: t('today.streak', { n: best }) }) : null);
    }

    function go(date) {
      ctrl.load(date).then(function (res) { if (!res.ok) env.fail(res); });
    }

    // ----- строка действия -----
    function valueButton(a) {
      var v = ctrl.value(a.id);
      var shown = v === null ? '—' : F.num(v);
      return h('button', { type: 'button', class: 'value' + (v === null ? ' empty' : ''), text: shown, disabled: ro,
        'aria-label': t('today.enterValue', { title: a.title }), onclick: function () { startEdit(a); } });
    }

    function startEdit(a) {
      editing = a.id;
      draw();
      var input = box.querySelector('input[data-edit="' + a.id + '"]');
      if (input) { input.focus(); input.select(); }
    }

    function commitEdit(a, input, cancel) {
      if (editing !== a.id) return;
      editing = null;
      var raw = input.value.trim();
      if (!cancel && raw !== '') {
        var v = U.parseNum(raw);
        if (v !== null && v >= 0) ctrl.setExact(a.id, v);
      }
      draw();
    }

    function editInput(a) {
      var v = ctrl.value(a.id);
      var input = h('input', { type: 'text', inputmode: 'decimal', 'data-edit': a.id, value: v === null ? '' : String(v).replace('.', ','), 'aria-label': a.title });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') commitEdit(a, input); if (e.key === 'Escape') commitEdit(a, input, true); });
      input.addEventListener('blur', function () { commitEdit(a, input); });
      return input;
    }

    function actionRow(a) {
      var marked = ctrl.isNormMarked(a.id);
      var done = ctrl.isDone(a.id);
      var normLine = t('today.norm', { n: F.num(a.norm), unit: a.unit }) + (a.norm > a.startNorm ? ' · ' + t('today.normGrew', { was: F.num(a.startNorm) }) : '');
      var normBtn = ro ? null : h('button', { type: 'button', class: 'sm' + (marked || done ? ' secondary' : ''), disabled: done && !marked,
        text: marked ? t('today.normUndo') : (done ? t('today.normDone') : t('today.normButton')), onclick: function () { ctrl.toggleNorm(a.id); } });
      var state = done ? t('today.done') : t('today.notDone');
      return h('div', { class: 'action' + (done ? ' done' : '') },
        h('div', { class: 'row between' }, h('strong', { text: a.title }), normBtn),
        h('p', { class: 'hint', text: normLine + ' · ' + state + (a.streak ? ' · ' + t('today.streakShort', { n: a.streak }) : '') + (ctrl.isRowDirty(a.id) ? ' · ' + t('today.rowDirty') : '') }),
        h('div', { class: 'row stepper' },
          ro ? null : U.button('−', function () { ctrl.minus(a.id); }, { aria: t('today.less', { title: a.title }) }),
          editing === a.id ? editInput(a) : valueButton(a),
          h('span', { class: 'unit-label', text: a.unit }),
          ro ? null : U.button('+', function () { ctrl.plus(a.id); }, { aria: t('today.more', { title: a.title }) })));
    }

    // ----- прогресс цели за день -----
    function progressBlock() {
      var d = s().data;
      var mode = d.progress.inputMode;
      // шаг «−/+» по оставшемуся диапазону (старта в today.get нет): для прироста за день — масштаб дня, для текущего значения — 1/100 диапазона
      var step = F.progressStep(d.goal.currentValue, d.goal.targetValue, mode === 'delta' ? 30 : 100);
      var val = s().progress ? s().progress.value : 0;
      var input = h('input', { type: 'text', inputmode: 'decimal', value: String(val).replace('.', ','), disabled: ro, 'aria-label': t(mode === 'current' ? 'today.progressNow' : 'today.progressAdded') });
      input.addEventListener('change', function () {
        var v = U.parseNum(input.value);
        if (v !== null && (mode === 'delta' || v >= 0)) ctrl.setProgress(v);
        else draw();
      });
      return h('section', { class: 'card' },
        h('label', null, h('span', { class: 'label', text: t(mode === 'current' ? 'today.progressNow' : 'today.progressAdded') }),
          h('div', { class: 'row stepper' },
            ro ? null : U.button('−', function () { ctrl.stepProgress(-1, step); }, { aria: t('today.progressLess') }),
            input, h('span', { class: 'unit-label', text: d.goal.unit }),
            ro ? null : U.button('+', function () { ctrl.stepProgress(1, step); }, { aria: t('today.progressMore') }))));
    }

    // ----- итог дня -----
    function summaryBlock() {
      var d = s().data;
      var sum = ctrl.summary();
      var K = ctrl.entered();
      var total = d.actions.length;
      var others = d.members.filter(function (m) { return !me || m.id !== me.id; });
      return h('section', { class: 'card' },
        total ? h('p', { class: 'summary', text: t('today.summary', { done: sum.doneCount, total: sum.totalCount, p: sum.percent }) }) : null,
        total ? h('p', { class: sum.dayEntered ? 'entered ok' : 'entered', text: sum.dayEntered ? t('today.dayEntered') : t('today.entered', { k: K, m: total }) }) : null,
        others.map(function (m) {
          return h('p', { class: 'hint', text: t('today.other', { name: m.displayName, done: m.doneCount, total: m.totalCount, state: t(m.factEntered ? 'today.otherEntered' : 'today.otherNot') }) });
        }));
    }

    // ----- разовые задачи -----
    function tasksBlock() {
      var d = s().data;
      if (!d.tasks) return null;
      return h('section', { class: 'card' }, h('h3', { text: t('today.tasks') }),
        d.tasks.length ? d.tasks.map(function (tk) {
          var c = h('input', { type: 'checkbox', checked: tk.done, disabled: ro });
          c.addEventListener('change', function () {
            tk.done = c.checked;
            env.call('task.setDone', { taskId: tk.id, done: c.checked }).then(function (res) { if (!res.ok) { tk.done = !c.checked; env.fail(res); } draw(); });
          });
          return h('label', { class: 'check' + (tk.overdue ? ' overdue' : '') }, c,
            h('span', { text: tk.title + (tk.overdue ? ' · ' + t('today.overdue') : '') }));
        }) : h('p', { class: 'hint', text: t('today.noTasks') }),
        ro ? null : U.button(t('today.addTask'), function () { env.go('tasks', { goalId: d.goal.id }); }, { secondary: true }));
    }

    function draw() {
      if (!s().data) return;
      if (editing) { updateStatus(); return; }
      var d = s().data;
      var scroll = window.scrollY;
      box.textContent = '';
      var stale = env.staleState();
      if (stale === 'loading') box.appendChild(h('p', { class: 'notice', text: t('today.refreshing') }));
      if (stale === 'failed') box.appendChild(h('div', { class: 'notice' }, h('span', { text: t('today.cachedOffline') }), U.button(t('common.retry'), function () { env.retryBoot(); }, { secondary: true })));
      if (s().restored && !ro) {
        box.appendChild(h('div', { class: 'notice restored' }, h('p', { text: t('today.restored', { date: F.dayLong(s().restored) }) }),
          h('div', { class: 'actions' }, U.button(t('today.save'), function () { ctrl.save(); }, { disabled: !!stale }), U.button(t('today.discard'), function () { ctrl.discard(); }, { secondary: true }))));
      }
      if (s().undo && !ro) {
        box.appendChild(h('div', { class: 'undo-bar' }, h('span', { text: t('today.allMarked') }), U.button(t('today.undo'), function () { ctrl.undo(); }, { secondary: true })));
      }
      if (s().status === 'error') box.appendChild(errorBanner());
      box.appendChild(dayHeader());
      var fact = h('section', { class: 'card fact' + (params.factMode && !highlightDone ? ' highlight' : ''), id: 'fact' }, h('h3', { text: t('today.factTitle') }));
      if (!d.actions.length) fact.appendChild(h('p', { class: 'hint', text: t('today.noActions') }));
      d.actions.forEach(function (a) { fact.appendChild(actionRow(a)); });
      var sum = ctrl.summary();
      if (!ro && d.actions.length) {
        var row = h('div', { class: 'actions' });
        if (ctrl.anyBelowNorm()) row.appendChild(U.button(t('today.completeAll'), function () { ctrl.completeAll(); }, { disabled: !!stale }));
        if (!sum.dayEntered) row.appendChild(U.button(t('today.finish'), function () { ctrl.finish(); }, { secondary: true, disabled: !!stale }));
        fact.appendChild(row);
      }
      statusEl = h('p', { class: 'save-status ' + s().status, text: statusText() });
      fact.appendChild(statusEl);
      // Вне Telegram (кнопки MainButton нет) «Сохранить» рисуется на странице
      var ui = ctrl.ui();
      if (!ro && ui.show && !env.hasMainButton()) {
        fact.appendChild(U.button(t('today.save'), function () { ctrl.press(); }, { disabled: ui.loading }));
      }
      box.appendChild(fact);
      box.appendChild(progressBlock());
      box.appendChild(summaryBlock());
      var tb = tasksBlock();
      if (tb) box.appendChild(tb);
      if (d.actions.some(function (a) { return a.normWarning; })) box.appendChild(h('p', { class: 'notice', text: t('today.normWarning') }));
      if (params.factMode && !highlightDone) { highlightDone = true; fact.scrollIntoView({ block: 'start' }); } else window.scrollTo(0, scroll);
    }

    // Первый день приходит в app.bootstrap (env выставил его в контроллер), отдельного запроса при открытии нет
    return ctrl.open(params.date, today).then(function (res) {
      if (!res.ok) {
        if (res.error.code === 'no_active_goal') return h('div', null, h('h2', { text: t('noGoal.title') }), h('p', { text: t('noGoal.text') }));
        return h('div', null, h('p', { class: 'error', text: env.S.errorText(res.error) }), U.button(t('common.retry'), function () { env.tab('today'); }));
      }
      draw();
      return box;
    });
  };
})(globalThis);
