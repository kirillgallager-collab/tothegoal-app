// Обработчики методов заглушки (api.md §7–§13). Работают над состоянием S (см. scenarios.js).
// Режим доступа — whitelist (бета v0): оплата, коды, восстановление, подтверждение email и админка → not_available.
// Каждый обработчик: (ctx, params) → data, либо бросает fail(code, details, retryAfterSec).
// ctx = { S, today, nowIso, me (участник|null), role, newId(prefix), randomCode(n) }.
(function (root) {
  'use strict';

  var K = typeof module !== 'undefined' && module.exports ? require('./calc.js') : root.GT.mockCalc;
  var PRESETS = (typeof module !== 'undefined' && module.exports ? require('./presets.js') : root.GT.mockPresets).PRESETS;

  var BOT = 'ToTheGoalTrackerBot'; // публичное имя бота беты, не секрет
  var MAX_ACTIONS = 15;
  var MAX_TASKS = 50;
  var PRESET_IDS = PRESETS.map(function (p) { return p.id; });

  // ---------- ошибки и проверка параметров ----------
  function fail(code, details, retryAfterSec) {
    var e = new Error(code);
    e.api = { code: code, details: details || null, retryAfterSec: retryAfterSec == null ? null : retryAfterSec };
    return e;
  }

  function validator(p) {
    var fields = [];
    var v = {
      bad: function (field, code) { fields.push({ field: field, code: code }); },
      str: function (f, o) {
        o = o || {};
        var x = p[f];
        if (x == null) { if (!o.optional) v.bad(f, 'required'); return undefined; }
        if (typeof x !== 'string' || (!o.allowEmpty && x.trim() === '')) { v.bad(f, x === '' || (typeof x === 'string') ? 'required' : 'bad_format'); return undefined; }
        if (o.max && x.length > o.max) { v.bad(f, 'too_long'); return undefined; }
        return x;
      },
      num: function (f, o) {
        o = o || {};
        var x = p[f];
        if (x == null) { if (!o.optional) v.bad(f, 'required'); return undefined; }
        if (typeof x !== 'number' || !isFinite(x) || Math.abs(x) > 1e12) { v.bad(f, 'bad_format'); return undefined; }
        if ((o.min != null && x < o.min) || (o.gt != null && x <= o.gt)) { v.bad(f, 'out_of_range'); return undefined; }
        return x;
      },
      date: function (f, o) {
        var x = p[f];
        if (x == null) { if (!(o && o.optional)) v.bad(f, 'required'); return undefined; }
        if (!K.isDate(x)) { v.bad(f, 'bad_format'); return undefined; }
        return x;
      },
      oneOf: function (f, list, o) {
        var x = p[f];
        if (x == null) { if (!(o && o.optional)) v.bad(f, 'required'); return undefined; }
        if (list.indexOf(x) < 0) { v.bad(f, 'bad_format'); return undefined; }
        return x;
      },
      done: function () { if (fields.length) throw fail('validation_failed', { fields: fields }); }
    };
    return v;
  }

  // ---------- выборки ----------
  function activeGoal(S) { return S.goals.find(function (g) { return g.status === 'active'; }) || null; }
  function goalById(S, id) {
    var g = typeof id === 'string' && S.goals.find(function (x) { return x.id === id; });
    if (!g) throw fail('not_found');
    return g;
  }
  function memberById(S, id) { return S.members.find(function (m) { return m.id === id; }) || null; }
  function activeMembers(S) { return S.members.filter(function (m) { return m.status === 'active'; }); }
  function entriesOf(S, goalId) { return S.progress.filter(function (e) { return e.goalId === goalId; }); }
  function factVal(S, actionId, date) {
    var v = S.facts[actionId + '|' + date];
    return v === undefined ? null : v;
  }
  function actionsOf(S, goalId, memberId, onlyActive) {
    return S.actions.filter(function (a) {
      return a.goalId === goalId && (memberId == null || a.ownerMemberId === memberId) && (!onlyActive || a.status === 'active');
    }).sort(function (a, b) { return a.sortOrder - b.sortOrder; });
  }
  function lastVersion(a) { return a.versions[a.versions.length - 1]; }
  function currentValue(S, goal, date) { return K.valueAt(goal, entriesOf(S, goal.id), date); }

  // ---------- публичные формы ----------
  function pubGoal(g) {
    return { id: g.id, presetId: g.presetId, title: g.title, unit: g.unit, startValue: g.startValue, targetValue: g.targetValue,
      direction: g.direction, inputMode: g.inputMode, startDate: g.startDate, endDate: g.endDate, status: g.status,
      reachedDismissed: g.reachedDismissed, rev: g.rev, createdAt: g.createdAt };
  }
  function goalBrief(g) {
    return { id: g.id, title: g.title, unit: g.unit, direction: g.direction, startDate: g.startDate, endDate: g.endDate, inputMode: g.inputMode, status: g.status };
  }
  function pubAction(a) {
    var v = lastVersion(a);
    return { id: a.id, goalId: a.goalId, ownerMemberId: a.ownerMemberId, title: a.title, unit: a.unit, startNorm: v.startNorm,
      growsOnLag: v.growsOnLag, inPlan: a.inPlan, countStreak: a.countStreak, normCeiling: v.normCeiling, step: a.step,
      sortOrder: a.sortOrder, status: a.status, rev: a.rev };
  }
  function pubTask(t) {
    // doneByMemberId и doneAt есть всегда: у невыполненной задачи null (defs.json → task)
    return { id: t.id, goalId: t.goalId, title: t.title, date: t.date, assigneeMemberIds: t.assigneeMemberIds.slice(), status: t.status,
      doneByMemberId: t.status === 'done' ? t.doneByMemberId : null, doneAt: t.status === 'done' ? t.doneAt : null };
  }
  // Форма revision из defs.json: {id, at, byMemberId, kind, before, after} (без goalId)
  function revisionsOf(S, goalId) {
    return S.revisions.filter(function (r) { return r.goalId === goalId; }).map(function (r) {
      return { id: r.id, at: r.at, byMemberId: r.byMemberId, kind: r.kind, before: r.before, after: r.after };
    });
  }
  function pubMember(m) { return { id: m.id, displayName: m.displayName, role: m.role, status: m.status }; }
  function pubCabinet(c) {
    return { id: c.id, timezone: c.timezone, status: c.status, modules: { oneOffTasks: !!c.modules.oneOffTasks }, messages: c.messages, createdAt: c.createdAt, rev: c.rev };
  }
  function cabinetBrief(ctx) {
    var c = ctx.S.cabinet;
    return { id: c.id, timezone: c.timezone, status: c.status, modules: { oneOffTasks: !!c.modules.oneOffTasks }, members: ctx.S.members.map(pubMember) };
  }

  // ---------- расчёты дня ----------
  // Нормы дня: для закрытых дней сохраняются при первом чтении (DayPlan), на сегодня и вперёд считаются заново.
  function dayNorms(ctx, goal, date) {
    var S = ctx.S;
    var closed = date < ctx.today;
    var coeff = K.coefficientFor(goal, entriesOf(S, goal.id), date);
    var out = {};
    actionsOf(S, goal.id, null, false).forEach(function (a) {
      var key = goal.id + '|' + date + '|' + a.id;
      if (closed && S.plans[key]) { out[a.id] = S.plans[key]; return; }
      var n = K.normFor(K.versionFor(a, date), coeff);
      if (closed) S.plans[key] = n;
      out[a.id] = n;
    });
    return out;
  }

  function streakFor(S, goal, action, date) {
    var n = 0;
    var d = K.addDays(date, -1);
    while (d >= goal.startDate) {
      var v = factVal(S, action.id, d);
      if (v != null && v >= K.versionFor(action, d).startNorm) { n++; d = K.addDays(d, -1); } else break;
    }
    var t = factVal(S, action.id, date);
    if (t != null && t >= K.versionFor(action, date).startNorm) n++;
    return n;
  }

  function dayEntered(S, goal, memberId, date) {
    return actionsOf(S, goal.id, memberId, true).every(function (a) { return factVal(S, a.id, date) !== null; });
  }

  function planFactOf(ctx, goal, memberId, date) {
    var norms = dayNorms(ctx, goal, date);
    var acts = actionsOf(ctx.S, goal.id, memberId, true).filter(function (a) { return a.inPlan; });
    return K.planFact(acts.map(function (a) { return { norm: norms[a.id].norm, value: factVal(ctx.S, a.id, date) }; }));
  }

  function dayResult(ctx, goal, memberId, date) {
    var S = ctx.S;
    var pf = planFactOf(ctx, goal, memberId, date);
    var acts = actionsOf(S, goal.id, memberId, true);
    var coeffTomorrow = K.coefficientFor(goal, entriesOf(S, goal.id), K.addDays(date, 1));
    return {
      doneCount: pf.doneCount, totalCount: pf.totalCount, percent: pf.percent, percentRaw: pf.percentRaw,
      dayEntered: dayEntered(S, goal, memberId, date),
      streaks: acts.filter(function (a) { return a.countStreak; }).map(function (a) { return { actionId: a.id, streak: streakFor(S, goal, a, date) }; }),
      tomorrowNorms: acts.map(function (a) { return { actionId: a.id, norm: K.normFor(K.versionFor(a, K.addDays(date, 1)), coeffTomorrow).norm }; })
    };
  }

  function isReached(ctx, goal) {
    if (goal.status !== 'active' || goal.reachedDismissed) return false;
    return K.remaining(goal, currentValue(ctx.S, goal, ctx.today)) <= 0;
  }

  // Первое достижение сохраняется (firstReached*), как только цель впервые достигнута.
  function noteReached(ctx, goal) {
    if (goal.firstReachedAt || goal.status !== 'active') return;
    var v = currentValue(ctx.S, goal, ctx.today);
    if (K.remaining(goal, v) <= 0) {
      goal.firstReachedAt = ctx.nowIso;
      goal.firstReachedValue = v;
      goal.firstReachedDays = K.diffDays(ctx.today, goal.startDate) + 1;
    }
  }

  function pendingReflection(S, meId) {
    if (!meId) return null;
    var done = S.goals.filter(function (g) { return g.status === 'completed'; })
      .sort(function (a, b) { return a.completedAt < b.completedAt ? 1 : -1; });
    for (var i = 0; i < done.length; i++) {
      var has = S.reflections.some(function (r) { return r.goalId === done[i].id && r.authorMemberId === meId; });
      if (!has) return done[i].id;
    }
    return null;
  }

  function checkWritableGoal(goal) { if (goal.status !== 'active') throw fail('goal_archived'); }

  function checkFactDate(ctx, goal, date) {
    checkWritableGoal(goal);
    if (date > ctx.today) throw fail('date_in_future');
    if (date < goal.startDate || date > goal.endDate) throw fail('date_out_of_range');
  }

  function fractionPair(goal, value) { return K.pair(K.progressFraction(goal, value)); }

  // ---------- «Сегодня» ----------
  function todayView(ctx, goal, date) {
    var S = ctx.S;
    var me = ctx.me;
    var value = currentValue(S, goal, date);
    var norms = dayNorms(ctx, goal, date);
    var p = fractionPair(goal, value);
    var prevValue = K.valueAt(goal, entriesOf(S, goal.id), K.addDays(date, -1));
    var entriesToday = entriesOf(S, goal.id).filter(function (e) { return e.date === date; });
    var deltaForDay = goal.inputMode === 'delta'
      ? entriesToday.reduce(function (s, e) { return s + e.value; }, 0)
      : value - prevValue;
    var out = {
      date: date,
      goal: { id: goal.id, title: goal.title, unit: goal.unit, currentValue: K.round2(value), targetValue: goal.targetValue,
        percent: p.percent, percentRaw: p.percentRaw, daysLeft: Math.max(0, K.diffDays(goal.endDate, date)) },
      dayEntered: me ? dayEntered(S, goal, me.id, date) : true,
      actions: me ? actionsOf(S, goal.id, me.id, true).map(function (a) {
        var n = norms[a.id];
        var v = factVal(S, a.id, date);
        return { id: a.id, title: a.title, unit: a.unit, step: a.step, norm: n.norm, startNorm: n.startNorm, value: v,
          done: v !== null && v >= n.norm, inPlan: !!a.inPlan, streak: a.countStreak ? streakFor(S, goal, a, date) : 0, normWarning: K.warns(n) };
      }) : [],
      // value: «прирост за день» — ввод вызывающего за день (0, если нет); «текущее значение» — значение цели на день. deltaForDay — общий прирост за день
      progress: { inputMode: goal.inputMode, deltaForDay: K.round2(deltaForDay),
        value: goal.inputMode === 'delta'
          ? K.round2(entriesToday.filter(function (e) { return me && e.memberId === me.id; }).reduce(function (s, e) { return s + e.value; }, 0))
          : K.round2(value) },
      members: activeMembers(S).map(function (m) {
        var pf = planFactOf(ctx, goal, m.id, date);
        return { id: m.id, displayName: m.displayName, factEntered: dayEntered(S, goal, m.id, date),
          doneCount: pf.doneCount, totalCount: pf.totalCount, percent: pf.percent, percentRaw: pf.percentRaw };
      }),
      prompts: { goalReached: isReached(ctx, goal), reflectionGoalId: pendingReflection(S, me && me.id), needsNewGoal: false },
      serverTime: ctx.nowIso
    };
    if (S.cabinet.modules.oneOffTasks) {
      out.tasks = S.tasks.filter(function (t) {
        return t.goalId === goal.id && !t.archived && me && t.assigneeMemberIds.indexOf(me.id) >= 0 &&
          ((t.status === 'open' && t.date <= date) || (t.status === 'done' && t.date === date));
      }).sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (t) {
        return { id: t.id, title: t.title, date: t.date, overdue: t.status === 'open' && t.date < ctx.today,
          assigneeMemberIds: t.assigneeMemberIds.slice(), done: t.status === 'done' };
      });
    }
    return out;
  }

  // ---------- создание цели (общее ядро для метода и заготовок сценариев) ----------
  function createGoalCore(ctx, p, caller, noChecks) {
    var S = ctx.S;
    var baseRate = K.baseRateOf(p.startValue, p.targetValue, p.startDate, p.endDate);
    var goal = { id: ctx.newId('gol'), presetId: p.presetId == null ? null : p.presetId, title: p.title, unit: p.unit,
      startValue: p.startValue, targetValue: p.targetValue, direction: p.direction, inputMode: p.inputMode,
      baseRate: baseRate, startDate: p.startDate, endDate: p.endDate, status: 'active', reachedDismissed: false,
      firstReachedAt: null, firstReachedValue: null, firstReachedDays: null, completedAt: null, result: null,
      rev: 1, createdAt: ctx.nowIso };
    S.goals.push(goal);
    var actions = (p.actions || []).map(function (a, i) {
      var owner = a.ownerMemberId == null ? caller.id : a.ownerMemberId;
      var act = { id: ctx.newId('act'), goalId: goal.id, ownerMemberId: owner, title: a.title, unit: a.unit,
        inPlan: a.inPlan, countStreak: a.countStreak, step: a.step == null ? 1 : a.step, sortOrder: i, status: 'active', rev: 1,
        versions: [{ effectiveFrom: goal.startDate, startNorm: a.startNorm, growsOnLag: a.growsOnLag, normCeiling: a.normCeiling == null ? null : a.normCeiling }] };
      S.actions.push(act);
      return act;
    });
    var tasks = [];
    if (S.cabinet.modules.oneOffTasks) {
      tasks = (p.tasks || []).map(function (t) {
        var task = { id: ctx.newId('tsk'), goalId: goal.id, title: t.title, date: t.date,
          assigneeMemberIds: t.assigneeMemberIds && t.assigneeMemberIds.length ? t.assigneeMemberIds.slice() : [caller.id],
          status: 'open', doneByMemberId: null, doneAt: null, archived: false, createdByMemberId: caller.id, rev: 1 };
        S.tasks.push(task);
        return task;
      });
    }
    return { goal: goal, actions: actions, tasks: tasks };
  }

  // ---------- завершение цели ----------
  function bestStreakOf(S, goal, upTo) {
    var best = 0;
    actionsOf(S, goal.id, null, false).filter(function (a) { return a.countStreak; }).forEach(function (a) {
      var run = 0;
      for (var d = goal.startDate; d <= upTo; d = K.addDays(d, 1)) {
        var v = factVal(S, a.id, d);
        if (v != null && v >= K.versionFor(a, d).startNorm) { run++; if (run > best) best = run; } else run = 0;
      }
    });
    return best;
  }

  function completeCore(ctx, goal, by) {
    var S = ctx.S;
    var endDay = ctx.today < goal.endDate ? ctx.today : goal.endDate;
    var finalValue = currentValue(S, goal, endDay);
    var p = fractionPair(goal, finalValue);
    var sumP = 0;
    var sumR = 0;
    var n = 0;
    var ctxAt = Object.assign({}, ctx, { today: K.addDays(endDay, 1) }); // нормы всех дней периода — как для закрытых
    for (var d = goal.startDate; d <= endDay; d = K.addDays(d, 1)) {
      activeMembers(S).forEach(function (m) {
        if (!actionsOf(S, goal.id, m.id, true).some(function (a) { return a.inPlan; })) return;
        var pf = planFactOf(ctxAt, goal, m.id, d);
        sumP += pf.percent; sumR += pf.percentRaw; n++;
      });
    }
    goal.status = 'completed';
    goal.completedAt = ctx.nowIso;
    goal.completedBy = by;
    goal.result = {
      finalValue: K.round2(finalValue), percent: p.percent, percentRaw: p.percentRaw,
      outcome: (goal.direction === 'growth' ? finalValue >= goal.targetValue : finalValue <= goal.targetValue) ? 'success' : 'fail',
      planFactPercent: n ? Math.round(sumP / n) : 0, planFactPercentRaw: n ? K.round2(sumR / n) : 0,
      bestStreak: bestStreakOf(S, goal, endDay)
    };
    goal.rev++;
    return goal.result;
  }

  // ---------- «Поднять планку»: коэффициент и нормы после ----------
  function raiseBarCalc(ctx, goal, p) {
    var v = validator(p);
    var newTarget = v.num('newTarget');
    var newEnd = v.date('newEndDate', { optional: true });
    v.done();
    var beyond = goal.direction === 'growth' ? newTarget > goal.targetValue : newTarget < goal.targetValue;
    if (!beyond) throw fail('validation_failed', { fields: [{ field: 'newTarget', code: 'out_of_range' }] });
    if (newEnd && newEnd < ctx.today) throw fail('validation_failed', { fields: [{ field: 'newEndDate', code: 'out_of_range' }] });
    var end = newEnd || goal.endDate;
    var days = K.diffDays(end, ctx.today); // от завтрашнего дня до даты окончания включительно
    // Впереди нет дней (последний день цели): factor = null, suggestExtend = true, normsAfter пуст (api.md goal.raiseBar.preview)
    if (days < 1) return { newTarget: newTarget, newEnd: newEnd, factor: null, normsAfter: [], suggestExtend: true };
    var cur = currentValue(ctx.S, goal, ctx.today);
    var required = Math.abs(newTarget - cur) / days;
    var factor = K.round2(required / goal.baseRate);
    var norms = actionsOf(ctx.S, goal.id, null, true).map(function (a) {
      return { actionId: a.id, norm: K.normFor(K.versionFor(a, K.addDays(ctx.today, 1)), Math.max(1, factor)).norm };
    });
    return { newTarget: newTarget, newEnd: newEnd, factor: factor, normsAfter: norms, suggestExtend: factor > 2 };
  }

  // ---------- факты ----------
  function ownAction(ctx, actionId) {
    var a = typeof actionId === 'string' && ctx.S.actions.find(function (x) { return x.id === actionId; });
    if (!a) throw fail('not_found');
    if (a.ownerMemberId !== ctx.me.id) throw fail('forbidden');
    return a;
  }

  function setFact(S, actionId, date, value) {
    var key = actionId + '|' + date;
    if (value === null) delete S.facts[key]; else S.facts[key] = value;
  }

  function factRows(S, acts, date) {
    return acts.map(function (a) { return { actionId: a.id, date: date, value: factVal(S, a.id, date) }; });
  }

  // Черновик дня (facts и progress) применяется атомарно, как day.save: сначала все проверки, потом запись.
  // Возвращает { acts, progressOut } (progressOut — только если progress передан).
  function applyDraft(ctx, goal, date, p, factsRequired) {
    var S = ctx.S;
    var v = validator(p);
    if (factsRequired ? !Array.isArray(p.facts) : (p.facts !== undefined && !Array.isArray(p.facts))) v.bad('facts', 'required');
    v.done();
    var seen = {};
    var rows = (p.facts || []).map(function (f, i) {
      var key = 'facts[' + i + ']';
      if (!f || typeof f.actionId !== 'string') { v.bad(key + '.actionId', 'required'); return null; }
      if (f.value !== null && !(typeof f.value === 'number' && isFinite(f.value) && f.value >= 0 && f.value <= 1e12)) { v.bad(key + '.value', 'out_of_range'); return null; }
      if (seen[f.actionId]) { v.bad(key + '.actionId', 'bad_format'); return null; }
      seen[f.actionId] = true;
      return f;
    });
    if (p.progress != null && !(typeof p.progress.value === 'number' && isFinite(p.progress.value) && Math.abs(p.progress.value) <= 1e12)) v.bad('progress.value', 'bad_format');
    v.done();
    var acts = rows.map(function (f) { return ownAction(ctx, f.actionId); }); // атомарно: сначала все проверки
    acts.forEach(function (a) { if (a.goalId !== goal.id || a.status !== 'active') throw fail('not_found'); });
    rows.forEach(function (f) { setFact(S, f.actionId, date, f.value); });
    var progressOut;
    if (p.progress) {
      var list = S.progress;
      var memberKey = goal.inputMode === 'delta' ? ctx.me.id : null;
      var e = list.find(function (x) { return x.goalId === goal.id && x.date === date && x.memberId === memberKey; });
      if (e) { e.value = p.progress.value; e.updatedAt = ctx.nowIso; } else list.push({ goalId: goal.id, date: date, memberId: memberKey, value: p.progress.value, updatedAt: ctx.nowIso });
      var cur = currentValue(S, goal, date);
      var prev = K.valueAt(goal, entriesOf(S, goal.id), K.addDays(date, -1));
      progressOut = { value: p.progress.value, currentValue: K.round2(cur), deltaForDay: K.round2(goal.inputMode === 'delta'
        ? entriesOf(S, goal.id).filter(function (x) { return x.date === date; }).reduce(function (s, x) { return s + x.value; }, 0) : cur - prev) };
      noteReached(ctx, goal);
    }
    return { acts: acts, progressOut: progressOut };
  }

  // day.completeAll и day.finish: необязательные facts и progress (несохранённый черновик) применяются первыми, как в day.save
  function dayAction(ctx, p, mode) {
    var v = validator(p);
    var goalId = v.str('goalId');
    var date = v.date('date');
    v.done();
    var goal = goalById(ctx.S, goalId);
    checkFactDate(ctx, goal, date);
    var draft = p.facts !== undefined || p.progress != null ? applyDraft(ctx, goal, date, p, false) : null;
    var acts = actionsOf(ctx.S, goal.id, ctx.me.id, true);
    var norms = dayNorms(ctx, goal, date);
    var changed = [];
    acts.forEach(function (a) {
      var cur = factVal(ctx.S, a.id, date);
      if (mode === 'all') {
        var next = Math.max(cur == null ? 0 : cur, norms[a.id].norm);
        if (cur === null || next > cur) { setFact(ctx.S, a.id, date, next); changed.push(a.id); }
      } else if (cur === null) { setFact(ctx.S, a.id, date, 0); changed.push(a.id); }
    });
    var out = { facts: factRows(ctx.S, acts, date), changed: changed, day: dayResult(ctx, goal, ctx.me.id, date), goalReached: isReached(ctx, goal) };
    if (draft && draft.progressOut) out.progress = draft.progressOut;
    return out;
  }

  // ---------- методы ----------
  var M = {};

  M['app.bootstrap'] = function (ctx, p) {
    var S = ctx.S;
    var consented = !!(S.user && S.user.consentVersion === S.policyVersion);
    var consent = { required: !consented, version: S.policyVersion, acceptedVersion: S.user ? S.user.consentVersion || null : null };
    if (!consented) {
      return { mode: S.mode, env: S.env, consent: consent,
        user: { telegramId: S.tg.telegramId, firstName: S.tg.firstName, username: S.tg.username },
        apiVersion: 1, serverTime: ctx.nowIso };
    }
    if (S.mode === 'whitelist' && S.whitelisted && !S.cabinet) { // белый список: кабинет и владелец создаются после согласия, повтор безвреден
      var tz = p && K.validTz(p.tz) ? p.tz : 'Europe/Moscow';
      S.cabinet = { id: ctx.newId('cab'), timezone: tz, status: 'active', modules: { oneOffTasks: true }, rev: 1, createdAt: ctx.nowIso,
        messages: { morning: { enabled: true, time: '08:00' }, evening: { enabled: true, time: '20:00' },
          daySummary: { enabled: true, deadlineTime: '23:00' }, weekly: { enabled: false, dayOfWeek: 1, time: '09:00' } } };
      var owner = { id: ctx.newId('mem'), userId: S.user.id, role: 'owner', status: 'active', displayName: S.user.firstName, joinedAt: ctx.nowIso };
      S.members.push(owner);
      S.meMemberId = owner.id;
      ctx.me = owner;
      ctx.role = 'owner';
    }
    var me = S.meMemberId ? memberById(S, S.meMemberId) : null;
    var goal = activeGoal(S);
    var access = !me || !S.cabinet ? 'none' : me.status === 'active' ? 'active' : 'readonly';
    var role = !me ? 'none' : me.status === 'active' ? me.role : 'readonly';
    var writable = access === 'active';
    return {
      mode: S.mode, env: S.env, consent: consent,
      user: { id: S.user.id, telegramId: S.user.telegramId, firstName: S.user.firstName, username: S.user.username },
      me: access === 'none' ? null : { memberId: me.id }, // своя запись в кабинете; клиент ищет себя по ней, а не по роли
      notifyStatus: S.user.notifyStatus, access: access, role: role,
      cabinet: access === 'none' ? null : cabinetBrief(ctx),
      activeGoal: access === 'none' || !goal ? null : goalBrief(goal),
      prompts: { goalReached: writable && !!goal && isReached(ctx, goal), reflectionGoalId: writable ? pendingReflection(S, me.id) : null,
        needsNewGoal: writable && role === 'owner' && !goal,
        // только режим codes: владелец бесплатного бета-доступа без подтверждённого email (api.md app.bootstrap)
        needsRecoveryEmail: S.mode === 'codes' && writable && role === 'owner' && !!S.access && S.access.source === 'beta_whitelist' && !S.access.email },
      limits: { maxActions: MAX_ACTIONS, maxTasksPerGoal: MAX_TASKS },
      // «Сегодня» за серверное сегодня кабинета: клиент не делает второго запроса при открытии (api.md app.bootstrap)
      // вне периода активной цели today = null (клиент today.get не вызывает), todayDate нужен для сравнения с датами цели
      today: access === 'none' || !goal || ctx.today < goal.startDate || ctx.today > goal.endDate ? null : todayView(ctx, goal, ctx.today),
      todayDate: access === 'none' ? null : ctx.today,
      apiVersion: 1, serverTime: ctx.nowIso
    };
  };

  M['consent.accept'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var version = v.str('version');
    v.done();
    if (S.bumpOnAccept) { S.bumpOnAccept = false; S.policyVersion = String(Number(S.policyVersion) + 1); }
    if (version !== S.policyVersion) throw fail('consent_outdated');
    if (!S.user) {
      S.user = { id: ctx.newId('usr'), telegramId: S.tg.telegramId, firstName: S.tg.firstName, username: S.tg.username,
        consentVersion: version, consentAt: ctx.nowIso, notifyStatus: 'unknown', createdAt: ctx.nowIso };
    } else if (S.user.consentVersion !== version) {
      S.user.consentVersion = version;
      S.user.consentAt = ctx.nowIso;
    } // иначе повтор: acceptedAt не перезаписывается
    return { consent: { acceptedVersion: S.user.consentVersion, acceptedAt: S.user.consentAt } };
  };

  M['presets.list'] = function () { return { presets: PRESETS }; };

  // --- кабинет и участники ---
  M['cabinet.get'] = function (ctx) {
    var S = ctx.S;
    // только действующее приглашение (не отозвано, не использовано, срок не истёк)
    var inv = ctx.role === 'owner' ? S.invites.find(function (i) { return i.status === 'active' && i.cabinetId === S.cabinet.id && i.expiresAt > ctx.nowIso; }) : null;
    return { cabinet: pubCabinet(S.cabinet),
      members: S.members.map(function (m) { return { id: m.id, displayName: m.displayName, role: m.role, status: m.status, joinedAt: m.joinedAt }; }),
      invite: inv ? { id: inv.id, expiresAt: inv.expiresAt, status: inv.status } : null };
  };

  M['cabinet.update'] = function (ctx, p) {
    var c = ctx.S.cabinet;
    var v = validator(p);
    if (p.timezone != null && !K.validTz(p.timezone)) v.bad('timezone', 'bad_format');
    if (p.modules != null && (typeof p.modules !== 'object' || (p.modules.oneOffTasks != null && typeof p.modules.oneOffTasks !== 'boolean'))) v.bad('modules', 'bad_format');
    v.done();
    if (p.expectedRev != null && p.expectedRev !== c.rev) throw fail('conflict');
    if (p.timezone != null) c.timezone = p.timezone;
    if (p.modules && p.modules.oneOffTasks != null) c.modules.oneOffTasks = p.modules.oneOffTasks;
    c.rev++;
    return { cabinet: pubCabinet(c) };
  };

  M['messages.update'] = function (ctx, p) {
    var c = ctx.S.cabinet;
    var m = JSON.parse(JSON.stringify(c.messages));
    var v = validator(p);
    var time = /^([01]\d|2[0-3]):[0-5]\d$/;
    ['morning', 'evening', 'daySummary', 'weekly'].forEach(function (k) {
      if (p[k] == null) return;
      if (typeof p[k] !== 'object') return v.bad(k, 'bad_format');
      ['time', 'deadlineTime'].forEach(function (f) { if (p[k][f] != null && !time.test(p[k][f])) v.bad(k + '.' + f, 'bad_format'); });
      if (p[k].enabled != null && typeof p[k].enabled !== 'boolean') v.bad(k + '.enabled', 'bad_format');
      if (k === 'weekly' && p.weekly.dayOfWeek != null && !(Number.isInteger(p.weekly.dayOfWeek) && p.weekly.dayOfWeek >= 1 && p.weekly.dayOfWeek <= 7)) v.bad('weekly.dayOfWeek', 'out_of_range');
      Object.assign(m[k], p[k]);
    });
    v.done();
    if (m.daySummary.deadlineTime <= m.evening.time) throw fail('validation_failed', { fields: [{ field: 'daySummary.deadlineTime', code: 'out_of_range' }] });
    if (p.expectedRev != null && p.expectedRev !== c.rev) throw fail('conflict');
    c.messages = m;
    c.rev++;
    return { messages: m };
  };

  M['notify.reportWriteAccess'] = function (ctx, p) {
    if (typeof p.granted !== 'boolean') throw fail('validation_failed', { fields: [{ field: 'granted', code: 'required' }] });
    if (p.granted && ctx.S.user.notifyStatus === 'unknown') ctx.S.user.notifyStatus = 'ok';
    return { notifyStatus: ctx.S.user.notifyStatus };
  };

  M['invite.create'] = function (ctx) {
    var S = ctx.S;
    if (activeMembers(S).length >= 2) throw fail('cabinet_full');
    S.invites.forEach(function (i) { if (i.cabinetId === S.cabinet.id && i.status === 'active') i.status = 'revoked'; });
    var code = ctx.randomCode(12);
    var inv = { id: ctx.newId('inv'), cabinetId: S.cabinet.id, code: code, status: 'active', createdByMemberId: ctx.me.id,
      expiresAt: new Date(Date.parse(ctx.nowIso) + 7 * 86400000).toISOString().replace(/\.\d+Z$/, 'Z') };
    S.invites.push(inv);
    return { invite: { id: inv.id, expiresAt: inv.expiresAt }, link: 'https://t.me/' + BOT + '?startapp=inv_' + code };
  };

  M['invite.revoke'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('inviteId');
    v.done();
    var inv = ctx.S.invites.find(function (i) { return i.id === id && i.cabinetId === ctx.S.cabinet.id; });
    if (!inv) throw fail('not_found');
    if (inv.status === 'active') inv.status = 'revoked';
    return { revoked: true };
  };

  M['invite.accept'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var code = v.str('code');
    v.done();
    if (S.counters.inviteWrong >= 5) throw fail('locked', null, 3600);
    var inv = S.invites.find(function (i) { return i.code === code && i.status === 'active' && i.expiresAt > ctx.nowIso; });
    if (!inv) { S.counters.inviteWrong++; throw fail('invite_invalid'); }
    if (activeMembers(S).length >= 2) throw fail('cabinet_full');
    S.counters.inviteWrong = 0;
    var m = { id: ctx.newId('mem'), userId: S.user.id, role: 'participant', status: 'active', displayName: S.user.firstName, joinedAt: ctx.nowIso };
    S.members.push(m);
    S.meMemberId = m.id;
    inv.status = 'used';
    return { cabinet: { id: S.cabinet.id }, role: 'participant' };
  };

  M['member.revoke'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('memberId');
    v.done();
    var m = memberById(ctx.S, id);
    if (!m) throw fail('not_found');
    if (m.role === 'owner') throw fail('forbidden');
    m.status = 'readonly';
    return { member: pubMember(m) };
  };

  M['member.leave'] = function (ctx) {
    ctx.me.status = 'left';
    ctx.S.meMemberId = null;
    return { left: true };
  };

  // ---------- вход по коду и email для восстановления (только режим codes; в бете — not_available) ----------
  // Коды заглушки (настоящие коды выдаёт сервер после оплаты):
  //   ABCD2345EFGH — действующий код покупки (новый кабинет);   RECOVERYCODE — код восстановления (перенос чужого кабинета, сценарий codes-transfer);
  //   USEDUSEDUSED → code_used;  EXPIREDEXPIR → code_expired;  TOOSOON30DAY → transfer_too_soon;  HASACCESS001 → already_has_access;
  //   INCABINET001 → already_in_cabinet;  любой другой → code_invalid (5 неверных подряд → locked на час).
  // Код из письма для email всегда 123456; адреса: taken@example.com → email_in_use, fail@example.com → unavailable.
  var HOUR = 3600;
  function lockLeft(ctx, until) { return until && until > ctx.nowMs ? Math.ceil((until - ctx.nowMs) / 1000) : 0; }

  M['access.activate'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var code = v.str('code');
    v.done();
    var left = lockLeft(ctx, S.counters.codeLockUntil);
    if (left > 0) throw fail('locked', null, left);
    var activate = function (kind) {
      var transferred = false;
      if (kind === 'recovery') { // перенос: прежний владелец теряет доступ, кабинет и данные остаются
        var owner = S.members.find(function (m) { return m.role === 'owner'; });
        owner.userId = S.user.id; owner.displayName = S.user.firstName; owner.status = 'active';
        S.meMemberId = owner.id;
        transferred = true;
      } else {
        makeOwnCabinet(ctx);
      }
      S.access = { source: 'payment', email: 'buyer@example.com' };
      S.counters.codeWrong = 0; S.counters.codeLockUntil = 0;
      S.usedByMe = (S.usedByMe || []).concat([code]);
      return { cabinet: { id: S.cabinet.id, timezone: S.cabinet.timezone, status: S.cabinet.status }, role: 'owner', transferred: transferred, previousOwnerNotified: transferred };
    };
    if ((S.usedByMe || []).indexOf(code) >= 0 && S.meMemberId) { // повтор своего же кода другим requestId: успех без изменений
      return { cabinet: { id: S.cabinet.id, timezone: S.cabinet.timezone, status: S.cabinet.status }, role: 'owner', transferred: false, previousOwnerNotified: false };
    }
    if (code === 'HASACCESS001') throw fail('already_has_access');
    if (code === 'INCABINET001') throw fail('already_in_cabinet');
    if (code === 'USEDUSEDUSED') throw fail('code_used');
    if (code === 'EXPIREDEXPIR') throw fail('code_expired');
    if (code === 'TOOSOON30DAY') throw fail('transfer_too_soon', { nextAt: new Date(ctx.nowMs + 12 * 86400000).toISOString().replace(/\.\d+Z$/, 'Z') });
    if (S.meMemberId) throw fail('already_has_access'); // у аккаунта уже есть кабинет
    if (code === 'ABCD2345EFGH' && !S.cabinet) return activate('purchase');
    if (code === 'RECOVERYCODE' && S.cabinet && S.members.some(function (m) { return m.role === 'owner'; })) return activate('recovery');
    S.counters.codeWrong = (S.counters.codeWrong || 0) + 1; // «код не найден»: счётчик неверных +1, пятый — блокировка на час
    if (S.counters.codeWrong >= 5) { S.counters.codeLockUntil = ctx.nowMs + HOUR * 1000; S.counters.codeWrong = 0; }
    throw fail('code_invalid');
  };

  M['recovery.request'] = function (ctx, p) { // страница сайта; всегда «принято», что бы ни ввели (api.md)
    if (typeof p.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) throw fail('validation_failed', { fields: [{ field: 'email', code: 'bad_format' }] });
    return { accepted: true };
  };

  function betaOwnerAccess(S) {
    if (!S.access || S.access.source !== 'beta_whitelist') throw fail('forbidden');
    return S.access;
  }

  M['access.setRecoveryEmail'] = function (ctx, p) {
    var S = ctx.S;
    var access = betaOwnerAccess(S);
    var v = validator(p);
    var email = v.str('email', { max: 254 });
    if (email !== undefined && !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email.trim())) v.bad('email', 'bad_format');
    v.done();
    email = email.trim().toLowerCase();
    if (access.email) throw fail('email_already_set');
    if (email === 'taken@example.com') throw fail('email_in_use');
    var sends = (S.counters.emailSends || []).filter(function (x) { return x.at > ctx.nowMs - 86400000; });
    var last = sends[sends.length - 1];
    if (last && ctx.nowMs - last.at < 60000) throw fail('rate_limited', null, Math.ceil((60000 - (ctx.nowMs - last.at)) / 1000));
    if (sends.length >= 5 || sends.filter(function (x) { return x.email === email; }).length >= 3) throw fail('rate_limited', null, 3600);
    if (email === 'fail@example.com') throw fail('unavailable'); // письмо не ушло
    sends.push({ at: ctx.nowMs, email: email });
    S.counters.emailSends = sends;
    S.emailVerification = { email: email, code: '123456', expiresAt: ctx.nowMs + 1800000, wrong: 0 }; // прежний неподтверждённый запрос аннулируется
    return { codeSent: true, expiresInSec: 1800, resendAfterSec: 60 };
  };

  M['access.confirmRecoveryEmail'] = function (ctx, p) {
    var S = ctx.S;
    var access = betaOwnerAccess(S);
    var v = validator(p);
    var code = v.str('code');
    v.done();
    if (access.email) return { emailSet: true }; // повтор после успеха безвреден
    var left = lockLeft(ctx, S.counters.emailLockUntil);
    if (left > 0) throw fail('locked', null, left);
    var ev = S.emailVerification;
    if (!ev) throw fail('code_invalid');
    if (ctx.nowMs > ev.expiresAt) throw fail('code_expired');
    if (code !== ev.code) {
      ev.wrong++;
      if (ev.wrong >= 5) { S.emailVerification = null; S.counters.emailLockUntil = ctx.nowMs + HOUR * 1000; throw fail('locked', null, HOUR); }
      throw fail('code_invalid');
    }
    access.email = ev.email;
    S.emailVerification = null;
    return { emailSet: true };
  };

  // Новый собственный кабинет после оплаты (access.activate, код покупки).
  function makeOwnCabinet(ctx) {
    var S = ctx.S;
    S.cabinet = { id: ctx.newId('cab'), timezone: 'Europe/Moscow', status: 'active', modules: { oneOffTasks: true }, rev: 1, createdAt: ctx.nowIso,
      messages: { morning: { enabled: true, time: '08:00' }, evening: { enabled: true, time: '20:00' },
        daySummary: { enabled: true, deadlineTime: '23:00' }, weekly: { enabled: false, dayOfWeek: 1, time: '09:00' } } };
    var owner = { id: ctx.newId('mem'), userId: S.user.id, role: 'owner', status: 'active', displayName: S.user.firstName, joinedAt: ctx.nowIso };
    S.members.push(owner);
    S.meMemberId = owner.id;
  }

  M['cabinet.delete'] = function (ctx, p) {
    var S = ctx.S;
    if (p.confirm !== 'УДАЛИТЬ') throw fail('confirmation_mismatch');
    ['members', 'goals', 'actions', 'tasks', 'progress', 'reflections', 'invites', 'revisions'].forEach(function (k) { S[k] = []; });
    S.facts = {}; S.plans = {}; S.cabinet = null; S.meMemberId = null;
    S.access = null; // в режиме codes доступ после удаления не восстанавливается; в whitelist новый кабинет создаст app.bootstrap
    return { deleted: true };
  };

  // --- цель ---
  M['goal.create'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var title = v.str('title', { max: 80 });
    var unit = v.str('unit', { max: 20 });
    var startValue = v.num('startValue');
    var targetValue = v.num('targetValue');
    var direction = v.oneOf('direction', ['growth', 'decline']);
    var inputMode = v.oneOf('inputMode', ['delta', 'current']);
    var startDate = v.date('startDate');
    var endDate = v.date('endDate');
    if (p.presetId != null && PRESET_IDS.indexOf(p.presetId) < 0) v.bad('presetId', 'bad_format');
    if (p.timezone != null && !K.validTz(p.timezone)) v.bad('timezone', 'bad_format');
    if (!Array.isArray(p.actions)) v.bad('actions', 'required');
    if (p.tasks != null && !Array.isArray(p.tasks)) v.bad('tasks', 'bad_format');
    v.done();
    if (startValue === targetValue) v.bad('targetValue', 'out_of_range');
    if (direction === 'growth' && targetValue < startValue) v.bad('targetValue', 'out_of_range');
    if (direction === 'decline' && targetValue > startValue) v.bad('targetValue', 'out_of_range');
    if (startDate > endDate || K.periodDays(startDate, endDate) < 2) v.bad('endDate', 'out_of_range');
    if (startDate < K.addDays(ctx.today, -1)) v.bad('startDate', 'out_of_range');
    var members = activeMembers(S);
    p.actions.forEach(function (a, i) {
      var f = 'actions[' + i + '].';
      if (!a || typeof a !== 'object') return v.bad('actions[' + i + ']', 'bad_format');
      if (typeof a.title !== 'string' || !a.title.trim() || a.title.length > 80) v.bad(f + 'title', 'bad_format');
      if (typeof a.unit !== 'string' || a.unit.length > 20) v.bad(f + 'unit', 'bad_format');
      if (typeof a.startNorm !== 'number' || !(a.startNorm > 0)) v.bad(f + 'startNorm', 'out_of_range');
      if (a.normCeiling != null && !(typeof a.normCeiling === 'number' && a.normCeiling >= 1)) v.bad(f + 'normCeiling', 'out_of_range');
      if (typeof a.growsOnLag !== 'boolean') v.bad(f + 'growsOnLag', 'required');
      if (typeof a.inPlan !== 'boolean') v.bad(f + 'inPlan', 'required');
      if (typeof a.countStreak !== 'boolean') v.bad(f + 'countStreak', 'required');
      if (a.ownerMemberId != null && !members.some(function (m) { return m.id === a.ownerMemberId; })) v.bad(f + 'ownerMemberId', 'bad_format');
    });
    (p.tasks || []).forEach(function (t, i) {
      var f = 'tasks[' + i + '].';
      if (!t || typeof t.title !== 'string' || !t.title.trim() || t.title.length > 1000) v.bad(f + 'title', 'bad_format');
      if (!t || !K.isDate(t.date)) v.bad(f + 'date', 'bad_format');
    });
    v.done();
    if (activeGoal(S)) throw fail('goal_active_exists');
    if (p.actions.length > MAX_ACTIONS) throw fail('limit_reached', { limit: MAX_ACTIONS, kind: 'actions' });
    if ((p.tasks || []).length > MAX_TASKS) throw fail('limit_reached', { limit: MAX_TASKS, kind: 'tasks' });
    if (p.timezone) S.cabinet.timezone = p.timezone;
    var r = createGoalCore(ctx, { presetId: p.presetId, title: title, unit: unit, startValue: startValue, targetValue: targetValue,
      direction: direction, inputMode: inputMode, startDate: startDate, endDate: endDate, actions: p.actions, tasks: p.tasks }, ctx.me);
    ctx.today = K.todayIn(S.cabinet.timezone, ctx.nowMs);
    return { goal: pubGoal(r.goal), actions: r.actions.map(pubAction), tasks: r.tasks.map(pubTask), todayPlan: todayView(ctx, r.goal, ctx.today) };
  };

  M['goal.get'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('goalId');
    v.done();
    var g = goalById(ctx.S, id);
    return { goal: pubGoal(g), actions: actionsOf(ctx.S, g.id, null, false).map(pubAction), revisions: revisionsOf(ctx.S, g.id) };
  };

  M['goal.update'] = function (ctx, p) {
    var S = ctx.S;
    ['startValue', 'targetValue', 'direction', 'startDate', 'inputMode'].forEach(function (f) { if (p[f] !== undefined) throw fail('field_immutable', { field: f }); });
    var v = validator(p);
    var id = v.str('goalId');
    var title = v.str('title', { optional: true, max: 80 });
    var unit = v.str('unit', { optional: true, max: 20 });
    var endDate = v.date('endDate', { optional: true });
    v.done();
    var g = goalById(S, id);
    checkWritableGoal(g);
    if (endDate && (endDate < ctx.today || endDate < g.startDate)) throw fail('validation_failed', { fields: [{ field: 'endDate', code: 'out_of_range' }] });
    if (p.expectedRev != null && p.expectedRev !== g.rev) throw fail('conflict');
    function rev(kind, before, after) { S.revisions.push({ id: ctx.newId('gvr'), goalId: g.id, at: ctx.nowIso, byMemberId: ctx.me.id, kind: kind, before: before, after: after }); }
    if (title !== undefined && title !== g.title) { rev('rename', { title: g.title }, { title: title }); g.title = title; }
    if (unit !== undefined && unit !== g.unit) { rev('unit', { unit: g.unit }, { unit: unit }); g.unit = unit; }
    if (endDate !== undefined && endDate !== g.endDate) { rev('endDate', { endDate: g.endDate }, { endDate: endDate }); g.endDate = endDate; } // baseRate не меняется
    g.rev++;
    return { goal: pubGoal(g) };
  };

  M['goal.complete'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('goalId');
    v.done();
    var g = goalById(ctx.S, id);
    checkWritableGoal(g);
    var result = completeCore(ctx, g, ctx.me.id);
    return { goal: pubGoal(g), result: result, prompts: { reflectionGoalId: g.id, needsNewGoal: true } };
  };

  M['goal.raiseBar.preview'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('goalId');
    v.done();
    var g = goalById(ctx.S, id);
    checkWritableGoal(g);
    var r = raiseBarCalc(ctx, g, p);
    return { factor: r.factor, normsAfter: r.normsAfter, suggestExtend: r.suggestExtend };
  };

  M['goal.raiseBar'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var id = v.str('goalId');
    v.done();
    var g = goalById(S, id);
    checkWritableGoal(g);
    var r = raiseBarCalc(ctx, g, p);
    if (p.expectedRev != null && p.expectedRev !== g.rev) throw fail('conflict');
    noteReached(ctx, g); // первое достижение сохраняется
    S.revisions.push({ id: ctx.newId('gvr'), goalId: g.id, at: ctx.nowIso, byMemberId: ctx.me.id, kind: 'raiseBar',
      before: { targetValue: g.targetValue, endDate: g.endDate }, after: { targetValue: r.newTarget, endDate: r.newEnd || g.endDate } });
    g.targetValue = r.newTarget;
    if (r.newEnd) g.endDate = r.newEnd;
    g.reachedDismissed = false; // базовый темп baseRate не меняется
    g.rev++;
    return { goal: pubGoal(g), factor: r.factor };
  };

  M['goal.dismissReached'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('goalId');
    v.done();
    var g = goalById(ctx.S, id);
    noteReached(ctx, g);
    g.reachedDismissed = true;
    g.rev++;
    return { goal: pubGoal(g) };
  };

  // --- действия ---
  function actionFields(v, p, optional) {
    var o = { title: v.str('title', { optional: optional, max: 80 }), unit: v.str('unit', { optional: optional, max: 20 }),
      startNorm: v.num('startNorm', { optional: optional, gt: 0 }), step: v.num('step', { optional: true, gt: 0 }) };
    if (p.normCeiling != null && !(typeof p.normCeiling === 'number' && p.normCeiling >= 1)) v.bad('normCeiling', 'out_of_range');
    ['growsOnLag', 'inPlan', 'countStreak'].forEach(function (f) {
      if (p[f] == null) { if (!optional) v.bad(f, 'required'); } else if (typeof p[f] !== 'boolean') v.bad(f, 'bad_format');
    });
    return o;
  }

  M['action.create'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var goalId = v.str('goalId');
    var f = actionFields(v, p, false);
    v.done();
    var g = goalById(S, goalId);
    checkWritableGoal(g);
    var owner = p.ownerMemberId == null ? ctx.me.id : p.ownerMemberId;
    if (owner !== ctx.me.id && ctx.role !== 'owner') throw fail('forbidden');
    var om = memberById(S, owner);
    if (!om || om.status !== 'active') throw fail('validation_failed', { fields: [{ field: 'ownerMemberId', code: 'bad_format' }] });
    var active = S.actions.filter(function (a) { return a.status === 'active'; }).length;
    if (active >= MAX_ACTIONS) throw fail('limit_reached', { limit: MAX_ACTIONS, kind: 'actions' });
    var a = { id: ctx.newId('act'), goalId: g.id, ownerMemberId: owner, title: f.title, unit: f.unit, inPlan: p.inPlan, countStreak: p.countStreak,
      step: f.step == null ? 1 : f.step, sortOrder: S.actions.filter(function (x) { return x.goalId === g.id; }).length, status: 'active', rev: 1,
      versions: [{ effectiveFrom: ctx.today, startNorm: f.startNorm, growsOnLag: p.growsOnLag, normCeiling: p.normCeiling == null ? null : p.normCeiling }] };
    S.actions.push(a);
    return { action: pubAction(a) };
  };

  function actionForWrite(ctx, id) {
    var a = typeof id === 'string' && ctx.S.actions.find(function (x) { return x.id === id; });
    if (!a) throw fail('not_found');
    if (ctx.role !== 'owner' && a.ownerMemberId !== ctx.me.id) throw fail('forbidden');
    return a;
  }

  M['action.update'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('actionId');
    var f = actionFields(v, p, true);
    if (p.sortOrder != null && !Number.isInteger(p.sortOrder)) v.bad('sortOrder', 'bad_format');
    v.done();
    var a = actionForWrite(ctx, id);
    checkWritableGoal(goalById(ctx.S, a.goalId));
    if (p.expectedRev != null && p.expectedRev !== a.rev) throw fail('conflict');
    var last = lastVersion(a);
    var next = { effectiveFrom: K.addDays(ctx.today, 1), startNorm: f.startNorm !== undefined ? f.startNorm : last.startNorm,
      growsOnLag: p.growsOnLag != null ? p.growsOnLag : last.growsOnLag,
      normCeiling: p.normCeiling !== undefined ? p.normCeiling : last.normCeiling };
    var normChanged = next.startNorm !== last.startNorm || next.growsOnLag !== last.growsOnLag || next.normCeiling !== last.normCeiling;
    if (normChanged) { // новая стартовая норма действует со следующего дня
      a.versions = a.versions.filter(function (x) { return x.effectiveFrom !== next.effectiveFrom; });
      a.versions.push(next);
    }
    if (f.title !== undefined) a.title = f.title;
    if (f.unit !== undefined) a.unit = f.unit;
    if (f.step !== undefined) a.step = f.step;
    if (p.inPlan != null) a.inPlan = p.inPlan;
    if (p.countStreak != null) a.countStreak = p.countStreak;
    if (p.sortOrder != null) a.sortOrder = p.sortOrder;
    a.rev++;
    return { action: pubAction(a), effectiveFrom: normChanged ? next.effectiveFrom : null }; // null — менялись только остальные поля
  };

  M['action.archive'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('actionId');
    if (typeof p.archived !== 'boolean') v.bad('archived', 'required');
    v.done();
    var a = actionForWrite(ctx, id);
    if (!p.archived && a.status === 'archived' && ctx.S.actions.filter(function (x) { return x.status === 'active'; }).length >= MAX_ACTIONS) {
      throw fail('limit_reached', { limit: MAX_ACTIONS, kind: 'actions' });
    }
    var st = p.archived ? 'archived' : 'active';
    if (a.status !== st) { a.status = st; a.rev++; }
    return { action: pubAction(a) };
  };

  // --- разовые задачи ---
  function taskById(S, id) {
    var t = typeof id === 'string' && S.tasks.find(function (x) { return x.id === id && !x.archived; });
    if (!t) throw fail('not_found');
    return t;
  }
  function assignees(ctx, ids) {
    if (ids == null || ids.length === 0) return [ctx.me.id];
    if (!Array.isArray(ids) || ids.length > 2) throw fail('validation_failed', { fields: [{ field: 'assigneeMemberIds', code: 'out_of_range' }] });
    ids.forEach(function (id) {
      var m = memberById(ctx.S, id);
      if (!m || m.status !== 'active') throw fail('validation_failed', { fields: [{ field: 'assigneeMemberIds', code: 'bad_format' }] });
      if (id !== ctx.me.id && ctx.role !== 'owner') throw fail('forbidden');
    });
    return ids.slice();
  }

  M['task.create'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var goalId = v.str('goalId');
    var title = v.str('title', { max: 1000 });
    var date = v.date('date');
    v.done();
    if (!S.cabinet.modules.oneOffTasks) throw fail('module_disabled');
    var g = goalById(S, goalId);
    checkWritableGoal(g);
    if (S.tasks.filter(function (t) { return t.goalId === g.id && !t.archived; }).length >= MAX_TASKS) throw fail('limit_reached', { limit: MAX_TASKS, kind: 'tasks' });
    var t = { id: ctx.newId('tsk'), goalId: g.id, title: title, date: date, assigneeMemberIds: assignees(ctx, p.assigneeMemberIds), status: 'open',
      doneByMemberId: null, doneAt: null, archived: false, createdByMemberId: ctx.me.id, rev: 1 };
    S.tasks.push(t);
    return { task: pubTask(t) };
  };

  M['task.update'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('taskId');
    var title = v.str('title', { optional: true, max: 1000 });
    var date = v.date('date', { optional: true });
    v.done();
    var t = taskById(ctx.S, id);
    if (ctx.role !== 'owner' && t.createdByMemberId !== ctx.me.id) throw fail('forbidden');
    if (p.expectedRev != null && p.expectedRev !== t.rev) throw fail('conflict');
    if (title !== undefined) t.title = title;
    if (date !== undefined) t.date = date;
    if (p.assigneeMemberIds !== undefined) t.assigneeMemberIds = assignees(ctx, p.assigneeMemberIds);
    t.rev++;
    return { task: pubTask(t) };
  };

  // Все задачи цели обоих исполнителей, включая будущие и выполненные; не архивные; по возрастанию срока (api.md task.list).
  M['task.list'] = function (ctx, p) {
    var v = validator(p);
    var goalId = v.str('goalId');
    var from = v.date('from', { optional: true });
    var to = v.date('to', { optional: true });
    v.done();
    if (!ctx.S.cabinet.modules.oneOffTasks) throw fail('module_disabled');
    var g = goalById(ctx.S, goalId);
    if (from && to && from > to) throw fail('validation_failed', { fields: [{ field: 'from', code: 'out_of_range' }] });
    return { tasks: ctx.S.tasks.filter(function (t) {
      return t.goalId === g.id && !t.archived && (!from || t.date >= from) && (!to || t.date <= to);
    }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1; }).map(pubTask) };
  };

  M['task.setDone'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('taskId');
    if (typeof p.done !== 'boolean') v.bad('done', 'required');
    v.done();
    var t = taskById(ctx.S, id);
    if (t.assigneeMemberIds.indexOf(ctx.me.id) < 0) throw fail('forbidden');
    checkWritableGoal(goalById(ctx.S, t.goalId));
    if (p.done && t.status !== 'done') { t.status = 'done'; t.doneByMemberId = ctx.me.id; t.doneAt = ctx.nowIso; t.rev++; }
    if (!p.done && t.status === 'done') { t.status = 'open'; t.doneByMemberId = null; t.doneAt = null; t.rev++; }
    return { task: pubTask(t) };
  };

  M['task.archive'] = function (ctx, p) {
    var v = validator(p);
    var id = v.str('taskId');
    v.done();
    var t = ctx.S.tasks.find(function (x) { return x.id === id; });
    if (!t) throw fail('not_found');
    if (ctx.role !== 'owner' && t.createdByMemberId !== ctx.me.id) throw fail('forbidden');
    t.archived = true;
    return { archived: true };
  };

  // --- факт ---
  M['fact.set'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var actionId = v.str('actionId');
    var date = v.date('date');
    if (p.value !== null) v.num('value', { min: 0 });
    v.done();
    var a = ownAction(ctx, actionId);
    var goal = goalById(S, a.goalId);
    checkFactDate(ctx, goal, date);
    if (a.status !== 'active') throw fail('not_found');
    setFact(S, a.id, date, p.value);
    return { fact: { actionId: a.id, date: date, value: factVal(S, a.id, date) }, day: dayResult(ctx, goal, ctx.me.id, date), goalReached: isReached(ctx, goal) };
  };

  M['day.save'] = function (ctx, p) {
    var v = validator(p);
    var goalId = v.str('goalId');
    var date = v.date('date');
    if (!Array.isArray(p.facts)) v.bad('facts', 'required');
    v.done();
    var goal = goalById(ctx.S, goalId);
    checkFactDate(ctx, goal, date);
    var draft = applyDraft(ctx, goal, date, p, true);
    var out = { facts: factRows(ctx.S, draft.acts, date), day: dayResult(ctx, goal, ctx.me.id, date), goalReached: isReached(ctx, goal) };
    if (draft.progressOut) out.progress = draft.progressOut;
    return out;
  };

  M['day.completeAll'] = function (ctx, p) { return dayAction(ctx, p, 'all'); };
  M['day.finish'] = function (ctx, p) { return dayAction(ctx, p, 'finish'); };

  M['today.get'] = function (ctx, p) {
    var v = validator(p);
    var date = v.date('date', { optional: true });
    v.done();
    var g = activeGoal(ctx.S);
    if (!g) throw fail('no_active_goal');
    var d = date || ctx.today;
    if (d > ctx.today) throw fail('date_in_future');
    if (d < g.startDate || d > g.endDate) throw fail('date_out_of_range');
    return todayView(ctx, g, d);
  };

  // --- дашборд, история ---
  // План/факт за весь период цели: суммы выполненных и запланированных действий, проценты — среднее по дням.
  // Сегодняшний день входит, только если он у участника уже внесён (api.md dashboard.get).
  function planFactPeriod(ctx, goal, memberId, upTo) {
    var done = 0, total = 0, sumP = 0, sumR = 0, n = 0;
    for (var d = goal.startDate; d <= upTo; d = K.addDays(d, 1)) {
      if (d === ctx.today && !dayEntered(ctx.S, goal, memberId, d)) continue;
      var pf = planFactOf(ctx, goal, memberId, d);
      if (!pf.totalCount) continue;
      done += pf.doneCount; total += pf.totalCount; sumP += pf.percent; sumR += pf.percentRaw; n++;
    }
    return { memberId: memberId, doneCount: done, totalCount: total, percent: n ? Math.round(sumP / n) : 0, percentRaw: n ? K.round2(sumR / n) : 0 };
  }

  M['dashboard.get'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var gid = v.str('goalId', { optional: true });
    var period = v.num('periodDays', { optional: true, gt: 0 });
    v.done();
    var g = gid ? goalById(S, gid) : activeGoal(S);
    if (!g) throw fail('no_active_goal');
    var upTo = g.status === 'completed' ? (g.result && ctx.today > g.endDate ? g.endDate : ctx.today) : ctx.today;
    if (upTo > g.endDate) upTo = g.endDate;
    var value = currentValue(S, g, upTo);
    var pr = fractionPair(g, value);
    var rem = K.remaining(g, value);
    var pace = (value - currentValue(S, g, K.addDays(upTo, -7))) / 7 * (g.direction === 'growth' ? 1 : -1);
    var forecastDate = rem <= 0 ? upTo : pace > 0 ? K.addDays(upTo, Math.ceil(rem / pace)) : null;
    var warnActions = [];
    var norms = dayNorms(ctx, g, upTo);
    actionsOf(S, g.id, null, true).forEach(function (a) { if (K.warns(norms[a.id])) warnActions.push({ actionId: a.id, normBeforeCeiling: norms[a.id].normBeforeCeiling, startNorm: norms[a.id].startNorm }); });
    var days = [];
    var n = Math.min(period || 14, K.diffDays(upTo, g.startDate) + 1);
    for (var i = n - 1; i >= 0; i--) {
      var d = K.addDays(upTo, -i);
      var delta = currentValue(S, g, d) - (d > g.startDate ? currentValue(S, g, K.addDays(d, -1)) : g.startValue);
      // open: текущий день активной цели ещё не закрыт, данные могут измениться; «не внесён» у него не пропуск
      days.push({ date: d, open: g.status !== 'completed' && d === ctx.today, progressDelta: K.round2(delta), perMember: activeMembers(S).map(function (m) {
        var pf = planFactOf(ctx, g, m.id, d);
        return { memberId: m.id, percent: pf.percent, percentRaw: pf.percentRaw, missing: !dayEntered(S, g, m.id, d) };
      }) });
    }
    var outcome = g.status === 'completed' ? { state: g.result.outcome, finalValue: g.result.finalValue } : { state: 'running' };
    return {
      goal: pubGoal(g),
      progress: { currentValue: K.round2(value), startValue: g.startValue, targetValue: g.targetValue, percent: pr.percent, percentRaw: pr.percentRaw, remaining: K.round2(rem) },
      forecast: { date: forecastDate, avgPace7d: K.diffDays(upTo, g.startDate) < 1 ? null : K.round2(pace), onTrack: forecastDate !== null && forecastDate <= g.endDate },
      planFact: activeMembers(S).map(function (m) { return planFactPeriod(ctx, g, m.id, upTo); }),
      normWarning: { active: warnActions.length > 0, actions: warnActions },
      slice: { days: days },
      outcome: outcome
    };
  };

  function reflectionPreview(S, goalId) {
    var rs = S.reflections.filter(function (r) { return r.goalId === goalId; });
    rs.sort(function (a, b) { var ao = memberById(S, a.authorMemberId); var bo = memberById(S, b.authorMemberId); return (ao && ao.role === 'owner' ? 0 : 1) - (bo && bo.role === 'owner' ? 0 : 1); });
    for (var i = 0; i < rs.length; i++) {
      var t = rs[i].worked || rs[i].mistakes || rs[i].different;
      if (t) return t;
    }
    return null;
  }

  M['history.list'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var limit = v.num('limit', { optional: true, gt: 0 });
    v.done();
    var offset = p.cursor == null ? 0 : parseInt(p.cursor, 10);
    if (!(offset >= 0)) throw fail('validation_failed', { fields: [{ field: 'cursor', code: 'bad_format' }] });
    var all = S.goals.filter(function (g) { return g.status === 'active'; })
      .concat(S.goals.filter(function (g) { return g.status === 'completed'; }).sort(function (a, b) { return a.completedAt < b.completedAt ? 1 : -1; }));
    var page = all.slice(offset, offset + (limit || 50));
    return { items: page.map(function (g) {
      var running = g.status === 'active';
      var val = running ? currentValue(S, g, ctx.today) : g.result.finalValue;
      var pr = running ? fractionPair(g, val) : { percent: g.result.percent, percentRaw: g.result.percentRaw };
      return { goalId: g.id, title: g.title, unit: g.unit, startDate: g.startDate, endDate: g.endDate, targetValue: g.targetValue,
        finalValue: K.round2(val), percent: pr.percent, percentRaw: pr.percentRaw, outcome: running ? 'running' : g.result.outcome,
        reflectionPreview: reflectionPreview(S, g.id), status: g.status };
    }), nextCursor: offset + page.length < all.length ? String(offset + page.length) : null };
  };

  M['history.get'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var id = v.str('goalId');
    v.done();
    var g = goalById(S, id);
    return {
      goal: pubGoal(g), result: g.result,
      achievements: g.firstReachedAt ? { firstReachedAt: g.firstReachedAt, firstReachedValue: g.firstReachedValue, firstReachedDays: g.firstReachedDays } : null,
      reflections: S.reflections.filter(function (r) { return r.goalId === g.id && !r.onlyDismissed; }).map(function (r) {
        var m = memberById(S, r.authorMemberId);
        return { authorMemberId: r.authorMemberId, authorName: m ? m.displayName : '', worked: r.worked, mistakes: r.mistakes, different: r.different, updatedAt: r.updatedAt };
      }),
      revisions: revisionsOf(S, g.id)
    };
  };

  M['reflection.save'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var id = v.str('goalId');
    ['worked', 'mistakes', 'different'].forEach(function (f) {
      if (p[f] != null && (typeof p[f] !== 'string' || p[f].length > 1000)) v.bad(f, typeof p[f] === 'string' ? 'too_long' : 'bad_format');
    });
    v.done();
    var g = goalById(S, id);
    var r = S.reflections.find(function (x) { return x.goalId === g.id && x.authorMemberId === ctx.me.id; });
    if (!r) { r = { goalId: g.id, authorMemberId: ctx.me.id, worked: null, mistakes: null, different: null, dismissedAt: null, onlyDismissed: false }; S.reflections.push(r); }
    ['worked', 'mistakes', 'different'].forEach(function (f) { if (p[f] !== undefined) r[f] = p[f] === null || p[f] === '' ? null : p[f]; });
    r.onlyDismissed = false;
    r.updatedAt = ctx.nowIso;
    return { reflection: { authorMemberId: r.authorMemberId, worked: r.worked, mistakes: r.mistakes, different: r.different, updatedAt: r.updatedAt } };
  };

  M['reflection.dismiss'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var id = v.str('goalId');
    v.done();
    var g = goalById(S, id);
    var r = S.reflections.find(function (x) { return x.goalId === g.id && x.authorMemberId === ctx.me.id; });
    if (!r) { S.reflections.push({ goalId: g.id, authorMemberId: ctx.me.id, worked: null, mistakes: null, different: null, dismissedAt: ctx.nowIso, onlyDismissed: true, updatedAt: ctx.nowIso }); }
    else if (!r.dismissedAt) r.dismissedAt = ctx.nowIso;
    return { dismissed: true };
  };

  // export.cabinet в бете не включён (not_available, после беты) — см. NOT_AVAILABLE ниже.

  // ---------- таблица доступа (api.md §6) ----------
  var ANY = 'any';
  var ALL = ['owner', 'participant', 'readonly'];
  var OWN = ['owner'];
  var WORK = ['owner', 'participant'];
  var ACCESS = {
    'app.bootstrap': { roles: ANY, consent: false }, 'presets.list': { roles: ANY, consent: false }, 'consent.accept': { roles: ANY, consent: false, write: true },
    'notify.reportWriteAccess': { roles: ANY, write: true },
    'invite.accept': { roles: ['none'], write: true, wrongRole: 'already_in_cabinet' },
    // только ACCESS_MODE=codes (в бете not_available, см. CODES_ONLY)
    'access.activate': { roles: ANY, write: true }, 'recovery.request': { roles: ANY, consent: false, write: true },
    'access.setRecoveryEmail': { roles: OWN, write: true }, 'access.confirmRecoveryEmail': { roles: OWN, write: true },
    'cabinet.get': { roles: ALL }, 'goal.get': { roles: ALL }, 'today.get': { roles: ALL }, 'dashboard.get': { roles: ALL },
    'history.list': { roles: ALL }, 'history.get': { roles: ALL },
    'cabinet.update': { roles: OWN, write: true }, 'messages.update': { roles: OWN, write: true },
    'invite.create': { roles: OWN, write: true }, 'invite.revoke': { roles: OWN, write: true }, 'member.revoke': { roles: OWN, write: true },
    'goal.create': { roles: OWN, write: true }, 'goal.update': { roles: OWN, write: true }, 'goal.complete': { roles: OWN, write: true },
    'goal.raiseBar.preview': { roles: OWN }, 'goal.raiseBar': { roles: OWN, write: true }, 'goal.dismissReached': { roles: OWN, write: true },
    'cabinet.delete': { roles: OWN, write: true },
    'action.create': { roles: WORK, write: true }, 'action.update': { roles: WORK, write: true }, 'action.archive': { roles: WORK, write: true },
    'task.list': { roles: ALL }, 'task.create': { roles: WORK, write: true }, 'task.update': { roles: WORK, write: true }, 'task.setDone': { roles: WORK, write: true }, 'task.archive': { roles: WORK, write: true },
    // Ввод факта: сервер НЕ хранит журнал повторов (journal: false) — повтор выполняется заново, поэтому клиент не должен
    // повторять устаревшее тело после более нового нажатия (today-logic.js: очередь записи, canRetry).
    'fact.set': { roles: WORK, write: true, journal: false }, 'day.save': { roles: WORK, write: true, journal: false },
    'day.completeAll': { roles: WORK, write: true, journal: false }, 'day.finish': { roles: WORK, write: true, journal: false },
    'reflection.save': { roles: WORK, write: true }, 'reflection.dismiss': { roles: WORK, write: true },
    'member.leave': { roles: ['participant', 'readonly'], write: true }
  };

  // В бете (whitelist) эти методы отвечают not_available (api.md §5, §7, §13).
  var CODES_ONLY = ['access.activate', 'recovery.request', 'access.setRecoveryEmail', 'access.confirmRecoveryEmail']; // в whitelist — not_available
  var NOT_AVAILABLE = ['export.cabinet',
    'admin.search', 'admin.access.grant', 'admin.access.revoke', 'admin.code.reissue', 'admin.access.transfer', 'admin.log.list',
    'admin.export.page', 'admin.import.page'];
  var PUBLIC = ['recovery.request']; // без initData

  var api = { M: M, ACCESS: ACCESS, NOT_AVAILABLE: NOT_AVAILABLE, CODES_ONLY: CODES_ONLY, PUBLIC: PUBLIC, fail: fail,
    core: { createGoalCore: createGoalCore, completeCore: completeCore, activeGoal: activeGoal, memberById: memberById, dayNorms: dayNorms,
      activeMembers: activeMembers, setFact: setFact, pubGoal: pubGoal, pubAction: pubAction, noteReached: noteReached },
    PRESET_IDS: PRESET_IDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.mockMethods = api; }
})(globalThis);
