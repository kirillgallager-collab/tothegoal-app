// Мастер цели: M-1 пресет → M-2 поправить цифры → M-3 готово (screens.md §3.2).
(function (root) {
  'use strict';

  var screens = root.GT.screens = root.GT.screens || {};
  var W = root.GT.wizardLogic;

  var ERR = { required: 'wizard.err.required', too_long: 'wizard.err.tooLong', same: 'wizard.err.same', direction: 'wizard.err.direction',
    period: 'wizard.err.period', limit: 'wizard.err.limit', range: 'wizard.err.range', out_of_range: 'wizard.err.range', bad_format: 'wizard.err.required' };

  screens.wizard = function (env) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var box = h('div');
    var presets = null;
    var draft = null;
    var errors = {};
    var tried = false;
    var request = null; // { key, requestId } — повтор той же отправки с тем же requestId
    var moduleTasks = !!(env.boot().cabinet && env.boot().cabinet.modules.oneOffTasks);
    var tz = env.boot().cabinet ? env.boot().cabinet.timezone : 'Europe/Moscow';

    function errText(key) { return errors[key] ? t(ERR[errors[key]] || 'wizard.err.required') : null; }
    function refresh() { errors = tried ? W.validate(draft, env.todayStr(), env.boot().limits.maxActions) : {}; }

    // ----- M-1 -----
    function step1() {
      box.textContent = '';
      box.appendChild(h('h2', { text: t('wizard.title') }));
      box.appendChild(h('p', { text: t('wizard.pickPreset') }));
      if (!presets) { box.appendChild(U.spinner()); return; }
      presets.forEach(function (p) {
        box.appendChild(h('button', { type: 'button', class: 'preset', onclick: function () {
          draft = W.initDraft(p, { today: env.todayStr(), timezone: tz });
          tried = false; errors = {};
          step2();
        } }, h('strong', { text: p.name }), h('span', { text: p.example.title || t('wizard.customHint') })));
      });
    }

    // ----- M-2 -----
    function seg(options, current, onpick) { // переключатель из кнопок
      return h('div', { class: 'seg' }, options.map(function (o) {
        var b = h('button', { type: 'button', class: o.value === current ? 'on' : 'secondary', text: o.label, onclick: function () { onpick(o.value); } });
        if (o.value === current) b.setAttribute('aria-pressed', 'true');
        return b;
      }));
    }

    function actionRow(a, i) {
      var title = h('input', { type: 'text', value: a.title, 'aria-label': t('wizard.actionTitle'), placeholder: t('wizard.actionTitle') });
      title.addEventListener('change', function () { a.title = title.value; refresh(); step2(true); });
      var unit = h('input', { type: 'text', value: a.unit, class: 'unit', 'aria-label': t('wizard.actionUnit'), placeholder: t('wizard.actionUnit') });
      unit.addEventListener('change', function () { a.unit = unit.value; });
      var norm = U.numberInput(a.startNorm, function (v) { if (v > 0) a.startNorm = v; step2(true); }, { aria: t('wizard.norm'), class: 'num' });
      var ceil = U.numberInput(a.normCeiling, function (v) { a.normCeiling = v; refresh(); step2(true); }, { aria: t('wizard.ceiling'), class: 'num' });
      var lag = h('input', { type: 'checkbox', checked: !!a.growsOnLag });
      lag.addEventListener('change', function () { a.growsOnLag = lag.checked; });
      return h('div', { class: 'action-row' },
        h('div', { class: 'row' }, title, U.button(t('wizard.remove'), function () { draft.actions.splice(i, 1); refresh(); step2(true); }, { secondary: true, aria: t('wizard.remove') })),
        errText('actions.' + i + '.title') ? h('p', { class: 'field-error', text: errText('actions.' + i + '.title') }) : null,
        h('div', { class: 'row' },
          U.button('−', function () { W.stepNorm(a, -1); step2(true); }, { aria: t('wizard.less') }),
          norm, unit,
          U.button('+', function () { W.stepNorm(a, 1); step2(true); }, { aria: t('wizard.more') })),
        h('details', null, h('summary', { text: t('wizard.advanced') }),
          U.field(t('wizard.ceiling'), ceil, t('wizard.ceilingHint'), errText('actions.' + i + '.normCeiling')),
          h('label', { class: 'check' }, lag, h('span', { text: t('wizard.growsOnLag') }))));
    }

    function step2(keepScroll) {
      var y = window.scrollY;
      box.textContent = '';
      var title = h('input', { type: 'text', value: draft.title, 'aria-label': t('wizard.fTitle') });
      title.addEventListener('change', function () { draft.title = title.value; refresh(); step2(true); });
      var unit = h('input', { type: 'text', value: draft.unit, 'aria-label': t('wizard.fUnit') });
      unit.addEventListener('change', function () { draft.unit = unit.value; refresh(); step2(true); });
      var start = U.numberInput(draft.startValue, function (v) { draft.startValue = v; refresh(); step2(true); }, { negative: true, aria: t('wizard.fStart') });
      var target = U.numberInput(draft.targetValue, function (v) { draft.targetValue = v; refresh(); step2(true); }, { negative: true, aria: t('wizard.fTarget') });
      var end = h('input', { type: 'date', value: draft.endDate, min: env.D.addDays(draft.startDate, 1), 'aria-label': t('wizard.fEnd') });
      end.addEventListener('change', function () {
        if (!env.D.isDate(end.value)) return;
        draft.endDate = end.value; draft.days = env.D.diffDays(end.value, draft.startDate) + 1; refresh(); step2(true);
      });

      box.appendChild(h('h2', { text: t('wizard.step2') }));
      box.appendChild(U.field(t('wizard.fTitle'), title, t('wizard.hintTitle'), errText('title')));
      box.appendChild(U.field(t('wizard.fUnit'), unit, t('wizard.hintUnit'), errText('unit')));
      box.appendChild(h('div', { class: 'field' }, h('span', { class: 'label', text: t('wizard.fDirection') }),
        seg([{ value: 'growth', label: t('wizard.growth') }, { value: 'decline', label: t('wizard.decline') }], draft.direction,
          function (v) { draft.direction = v; refresh(); step2(true); })));
      box.appendChild(U.field(t('wizard.fStart'), start, t('wizard.hintStart'), errText('startValue')));
      box.appendChild(U.field(t('wizard.fTarget'), target, t('wizard.hintTarget'), errText('targetValue')));
      box.appendChild(h('div', { class: 'field' }, h('span', { class: 'label', text: t('wizard.fPeriod') }),
        seg(W.PERIODS.map(function (n) { return { value: n, label: t('wizard.days', { n: n }) }; }), draft.days, function (n) { W.setDays(draft, n); refresh(); step2(true); }),
        h('label', null, h('span', { class: 'label', text: t('wizard.fEnd') }), end),
        errText('endDate') ? h('p', { class: 'field-error', text: errText('endDate') }) : null));
      box.appendChild(h('div', { class: 'field' }, h('span', { class: 'label', text: t('wizard.fInputMode') }),
        seg([{ value: 'current', label: t('wizard.modeCurrent') }, { value: 'delta', label: t('wizard.modeDelta') }], draft.inputMode, function (v) { draft.inputMode = v; step2(true); }),
        h('p', { class: 'hint', text: t(draft.inputMode === 'current' ? 'wizard.hintModeCurrent' : 'wizard.hintModeDelta') })));

      box.appendChild(h('h3', { text: t('wizard.actions') }));
      box.appendChild(h('p', { class: 'hint', text: t('wizard.hintActions') }));
      draft.actions.forEach(function (a, i) { box.appendChild(actionRow(a, i)); });
      if (errors.actions) box.appendChild(h('p', { class: 'field-error', text: errText('actions') }));
      box.appendChild(U.button(t('wizard.addAction'), function () { W.addAction(draft); step2(true); }, { secondary: true, disabled: draft.actions.length >= env.boot().limits.maxActions }));

      if (moduleTasks && draft.tasks.length) {
        box.appendChild(h('h3', { text: t('wizard.tasks') }));
        draft.tasks.forEach(function (tk) {
          var c = h('input', { type: 'checkbox', checked: tk.checked });
          c.addEventListener('change', function () { tk.checked = c.checked; });
          box.appendChild(h('label', { class: 'check' }, c, h('span', { text: tk.title })));
        });
      }

      var tzSel = h('select', { 'aria-label': t('wizard.fTz') });
      var zones = Object.keys(env.F.TZ_NAMES);
      if (zones.indexOf(draft.timezone) < 0) zones.unshift(draft.timezone);
      zones.forEach(function (z) { tzSel.appendChild(h('option', { value: z, text: env.F.tzLabel(z, Date.now()), selected: z === draft.timezone })); });
      tzSel.addEventListener('change', function () { draft.timezone = tzSel.value; });
      box.appendChild(U.field(t('wizard.fTz'), tzSel, t('wizard.hintTz')));

      var bottom = h('p', { class: 'error', hidden: true });
      var done = U.button(t('wizard.done'), function () { submit(done, bottom); });
      box.appendChild(bottom);
      box.appendChild(h('div', { class: 'actions' }, done, U.button(t('common.back'), function () { step1(); }, { secondary: true })));
      if (keepScroll) window.scrollTo(0, y);
    }

    function submit(btn, bottom) {
      tried = true;
      refresh();
      if (Object.keys(errors).length) { step2(true); var first = document.querySelector('.field-error'); if (first) first.scrollIntoView({ block: 'center' }); return; }
      var params = W.toParams(draft, moduleTasks);
      var key = JSON.stringify(params);
      if (!request || request.key !== key) request = { key: key, requestId: null };
      btn.disabled = true;
      bottom.hidden = true;
      env.call('goal.create', params, request.requestId ? { requestId: request.requestId } : undefined).then(function (res) {
        request.requestId = res.requestId;
        if (res.ok) { step3(res.data.goal); return; }
        btn.disabled = false;
        if (res.error.code === 'validation_failed') { errors = W.serverFields(res.error.details && res.error.details.fields); step2(true); }
        if (res.error.code === 'goal_active_exists') return env.reboot();
        bottom.textContent = env.S.errorText(res.error) + (res.error.code === 'network' ? '' : '');
        bottom.hidden = false;
        btn.textContent = res.error.code === 'network' ? t('common.retry') : t('wizard.done');
      });
    }

    // ----- M-3 -----
    function step3(goal) {
      box.textContent = '';
      var notify = h('div', { class: 'card' });
      function renderNotify() {
        notify.textContent = '';
        if (env.boot().notifyStatus === 'ok') return;
        notify.appendChild(h('h3', { text: t('wizard.notifyTitle') }));
        notify.appendChild(h('p', { text: t('wizard.notifyText') }));
        var report = function (granted) {
          env.call('notify.reportWriteAccess', { granted: granted }).then(function () { notify.remove(); });
        };
        notify.appendChild(h('div', { class: 'actions' },
          U.button(t('wizard.notifyAllow'), function () {
            if (env.tg && env.tg.requestWriteAccess) env.tg.requestWriteAccess(function (granted) { report(!!granted); });
            else report(true); // вне Telegram (mock) просто сообщаем «разрешено»
          }),
          U.button(t('wizard.notifySkip'), function () { notify.remove(); }, { secondary: true })));
      }
      renderNotify();
      box.appendChild(h('h2', { text: t('wizard.created', { title: goal.title }) }));
      box.appendChild(notify);
      box.appendChild(h('p', { class: 'hint', text: t('wizard.inviteLater') }));
      box.appendChild(U.button(t('wizard.toToday'), function () { env.reboot(); }));
    }

    step1();
    env.call('presets.list', {}).then(function (res) {
      if (!res.ok) { box.textContent = ''; box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); box.appendChild(U.button(t('common.retry'), function () { env.reboot(); })); return; }
      presets = res.data.presets;
      if (!draft) step1();
    });
    return box;
  };
})(globalThis);
