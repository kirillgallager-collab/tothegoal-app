// Логика мастера цели (M-1…M-3, screens.md §3.2) без DOM: черновик из пресета → проверка → запрос goal.create.
(function (root) {
  'use strict';

  var K = typeof module !== 'undefined' && module.exports ? require('./dates.js') : root.GT.dates;
  var F = typeof module !== 'undefined' && module.exports ? require('./format.js') : root.GT.format;

  var PERIODS = [30, 60, 90];

  // preset — элемент presets.list; ctx: { today: 'YYYY-MM-DD', timezone: 'Europe/Moscow' }
  function initDraft(preset, ctx) {
    var days = preset.example && preset.example.days ? preset.example.days : 30;
    return {
      presetId: preset.id,
      title: preset.example.title || '', unit: preset.unit || '',
      direction: preset.direction, inputMode: preset.inputMode,
      startValue: preset.example.startValue, targetValue: preset.example.targetValue,
      days: days, startDate: ctx.today, endDate: K.addDays(ctx.today, days - 1),
      timezone: ctx.timezone,
      actions: preset.actions.map(function (a) {
        return { title: a.title, unit: a.unit, startNorm: a.startNorm, growsOnLag: a.growsOnLag, inPlan: a.inPlan, countStreak: a.countStreak,
          step: a.step, normCeiling: preset.normCeiling != null ? preset.normCeiling : null };
      }),
      tasks: preset.tasks.map(function (t) { return { title: t.title, checked: true }; })
    };
  }

  function setDays(draft, n) {
    draft.days = n;
    draft.endDate = K.addDays(draft.startDate, n - 1);
  }

  // Кнопки «−/+» у нормы: шаг действия, норма не ниже шага.
  function stepNorm(action, dir) {
    var step = action.step > 0 ? action.step : 1;
    var v = F.addStep(action.startNorm, dir * step);
    action.startNorm = v < step ? step : v;
  }

  function addAction(draft) {
    draft.actions.push({ title: '', unit: '', startNorm: 1, growsOnLag: true, inPlan: true, countStreak: true, step: 1, normCeiling: null });
  }

  // Проверка на клиенте (зеркало api.md goal.create): { поле: код ошибки }; пусто — можно отправлять.
  function validate(draft, today, maxActions) {
    var e = {};
    if (!draft.title || !draft.title.trim()) e.title = 'required'; else if (draft.title.length > 80) e.title = 'too_long';
    if (!draft.unit || !draft.unit.trim()) e.unit = 'required'; else if (draft.unit.length > 20) e.unit = 'too_long';
    var okNum = function (x) { return typeof x === 'number' && isFinite(x); };
    if (!okNum(draft.startValue)) e.startValue = 'required';
    if (!okNum(draft.targetValue)) e.targetValue = 'required';
    if (!e.startValue && !e.targetValue) {
      if (draft.startValue === draft.targetValue) e.targetValue = 'same';
      else if (draft.direction === 'growth' && draft.targetValue < draft.startValue) e.targetValue = 'direction';
      else if (draft.direction === 'decline' && draft.targetValue > draft.startValue) e.targetValue = 'direction';
    }
    if (!K.isDate(draft.endDate) || draft.endDate < K.addDays(draft.startDate, 1)) e.endDate = 'period';
    if (draft.actions.length > (maxActions || 15)) e.actions = 'limit';
    draft.actions.forEach(function (a, i) {
      if (!a.title || !a.title.trim()) e['actions.' + i + '.title'] = 'required';
      if (!(a.startNorm > 0)) e['actions.' + i + '.startNorm'] = 'required';
      if (a.normCeiling != null && !(a.normCeiling >= 1)) e['actions.' + i + '.normCeiling'] = 'range';
    });
    return e;
  }

  // Запрос goal.create. moduleTasks — включён ли модуль «Разовые задачи» (задачи иначе не отправляем).
  function toParams(draft, moduleTasks) {
    var p = {
      presetId: draft.presetId, title: draft.title.trim(), unit: draft.unit.trim(),
      startValue: draft.startValue, targetValue: draft.targetValue, direction: draft.direction, inputMode: draft.inputMode,
      startDate: draft.startDate, endDate: draft.endDate, timezone: draft.timezone,
      actions: draft.actions.map(function (a) {
        var o = { ownerMemberId: null, title: a.title.trim(), unit: (a.unit || '').trim(), startNorm: a.startNorm, growsOnLag: !!a.growsOnLag,
          inPlan: !!a.inPlan, countStreak: !!a.countStreak, normCeiling: a.normCeiling == null ? null : a.normCeiling };
        if (a.step > 0) o.step = a.step;
        return o;
      })
    };
    if (moduleTasks) {
      var n = 0;
      p.tasks = draft.tasks.filter(function (t) { return t.checked; }).map(function (t) {
        return { title: t.title, date: K.addDays(draft.startDate, 1 + n++), assigneeMemberIds: [] };
      });
    }
    return p;
  }

  // Ошибки сервера (validation_failed.details.fields) → ключи ошибок черновика.
  function serverFields(fields) {
    var out = {};
    (fields || []).forEach(function (f) {
      var m = /^actions\[(\d+)\]\.(\w+)$/.exec(f.field);
      out[m ? 'actions.' + m[1] + '.' + m[2] : f.field] = f.code;
    });
    return out;
  }

  var api = { PERIODS: PERIODS, initDraft: initDraft, setDays: setDays, stepNorm: stepNorm, addAction: addAction,
    validate: validate, toParams: toParams, serverFields: serverFields };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.wizardLogic = api; }
})(globalThis);
