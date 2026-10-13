// Заготовки данных для сценариев заглушки (параметр страницы ?scenario=…). Секретов и настоящих ID здесь нет.
//
//   new       первый вход: согласие → кабинет без цели (мастер)
//   outdated  как new, но политика сменится при первом согласии (consent_outdated)
//   noaccess  согласие дано, ID нет в белом списке: «закрытая бета»
//   invited   нет доступа, но есть приглашение inv_MOCKINVITE01 в чужой кабинет
//   active    кабинет, цель на 30 дней (9 дней истории, «сегодня» не внесено)
//   pair      как active, но в кабинете двое (?as=participant — войти вторым участником)
//   reached   цель уже достигнута (экран «Цель достигнута»)
//   finished  цель завершена, ждёт рефлексии; новой цели нет
//   readonly  участник отозван / кабинет неактивен: только просмотр
//   codes-new           боевой режим (mode=codes): нет доступа, экран ввода кода; рабочий код ABCD2345EFGH (остальные коды — в methods.js)
//   codes-transfer      боевой режим: чужой кабинет, код восстановления RECOVERYCODE переносит доступ на этот аккаунт
//   codes-beta-noemail  боевой режим: владелец бесплатного бета-доступа без email → экран S-04 (код из письма всегда 123456)
// Сбои (поверх active): offline, flaky, slow, expired, wrongenv, busy, ratelimit.
(function (root) {
  'use strict';

  var dep = function (file, name) { return typeof module !== 'undefined' && module.exports ? require(file) : root.GT[name]; };
  var K = dep('./calc.js', 'mockCalc');
  var Mth = dep('./methods.js', 'mockMethods');
  var PRESETS = dep('./presets.js', 'mockPresets').PRESETS;

  var BASES = ['new', 'outdated', 'noaccess', 'invited', 'active', 'pair', 'reached', 'finished', 'readonly',
    'codes-new', 'codes-transfer', 'codes-beta-noemail'];
  var FLAGS = ['offline', 'flaky', 'slow', 'expired', 'wrongenv', 'busy', 'ratelimit'];
  var SCENARIOS = BASES.concat(FLAGS);

  // → { base, flag }
  function resolve(name) {
    if (FLAGS.indexOf(name) >= 0) return { base: 'active', flag: name };
    return { base: BASES.indexOf(name) >= 0 ? name : 'new', flag: null };
  }

  function blank(env) {
    return {
      schema: 2, seq: 0, env: env, mode: 'whitelist', policyVersion: '1', bumpOnAccept: false, whitelisted: true,
      access: null, // AccessRight вызывающего в режиме codes: { source: 'beta_whitelist' | 'payment', email: string | null }
      emailVerification: null, usedByMe: [],
      tg: { telegramId: 100000001, firstName: 'Тест', username: 'mock_user' },
      user: null, users: [], meMemberId: null, cabinet: null, members: [],
      goals: [], revisions: [], actions: [], tasks: [], facts: {}, progress: [], plans: {}, reflections: [], invites: [],
      reqLog: {}, counters: { inviteWrong: 0, exports: 0 }
    };
  }

  function consentUser(ctx) {
    var S = ctx.S;
    S.user = { id: ctx.newId('usr'), telegramId: S.tg.telegramId, firstName: S.tg.firstName, username: S.tg.username,
      consentVersion: S.policyVersion, consentAt: ctx.nowIso, notifyStatus: 'unknown', createdAt: ctx.nowIso };
  }

  function makeCabinet(ctx) {
    ctx.S.cabinet = { id: ctx.newId('cab'), timezone: 'Europe/Moscow', status: 'active', modules: { oneOffTasks: true }, rev: 1, createdAt: ctx.nowIso,
      messages: { morning: { enabled: true, time: '08:00' }, evening: { enabled: true, time: '20:00' },
        daySummary: { enabled: true, deadlineTime: '23:00' }, weekly: { enabled: false, dayOfWeek: 1, time: '09:00' } } };
  }

  function makeMember(ctx, userId, role, name, status) {
    var m = { id: ctx.newId('mem'), userId: userId, role: role, status: status || 'active', displayName: name, joinedAt: ctx.nowIso };
    ctx.S.members.push(m);
    return m;
  }

  function otherUser(ctx, name) {
    var u = { id: ctx.newId('usr'), telegramId: 200000000 + ctx.S.users.length, firstName: name, username: null, createdAt: ctx.nowIso };
    ctx.S.users.push(u);
    return u;
  }

  function presetActions(presetId, ownerId, count) {
    return PRESETS.find(function (p) { return p.id === presetId; }).actions.slice(0, count).map(function (a) {
      return { ownerMemberId: ownerId, title: a.title, unit: a.unit, startNorm: a.startNorm, growsOnLag: a.growsOnLag, inPlan: a.inPlan, countStreak: a.countStreak, step: a.step, normCeiling: null };
    });
  }

  // Цель «Пробежать 100 км» (прирост за день), startOffset дней назад, всего 30 дней.
  function sportGoal(ctx, owner, others, startOffset, daysTotal) {
    var preset = PRESETS.find(function (p) { return p.id === 'sport'; });
    var start = K.addDays(ctx.today, -startOffset);
    var actions = presetActions('sport', owner.id, 4);
    others.forEach(function (o) { actions = actions.concat(presetActions('sport', o.id, 2)); });
    var tasks = preset.tasks.slice(0, 3).map(function (t, i) {
      return { title: t.title, date: K.addDays(ctx.today, i - 1), assigneeMemberIds: [owner.id] };
    });
    return Mth.core.createGoalCore(ctx, { presetId: 'sport', title: preset.example.title, unit: 'км', startValue: 0, targetValue: 100,
      direction: 'growth', inputMode: 'delta', startDate: start, endDate: K.addDays(start, daysTotal - 1), actions: actions, tasks: tasks }, owner);
  }

  var FACTORS = [1.2, 0.8, 1, 0.5, 1.1, 0.9, 1, 0.7, 1.3];

  // Факты и прирост за прошедшие дни (всего days дней с начала цели).
  function fillHistory(ctx, goal, members, days, perDay) {
    var S = ctx.S;
    for (var i = 0; i < days; i++) {
      var d = K.addDays(goal.startDate, i);
      members.forEach(function (m, mi) {
        S.actions.filter(function (a) { return a.goalId === goal.id && a.ownerMemberId === m.id; }).forEach(function (a, k) {
          Mth.core.setFact(S, a.id, d, Math.round(a.versions[0].startNorm * FACTORS[(i + k + mi) % FACTORS.length] * 10) / 10);
        });
      });
      S.progress.push({ goalId: goal.id, date: d, memberId: members[0].id, value: perDay + (i % 3) * 0.5, updatedAt: ctx.nowIso });
    }
  }

  function seed(ctx, name, as) {
    var S = ctx.S;
    var sc = resolve(name);
    var base = sc.base;
    if (sc.flag === 'wrongenv') S.env = 'beta';
    // Боевой режим (ACCESS_MODE=codes): вход по коду, email для восстановления
    if (/^codes-/.test(base)) {
      S.mode = 'codes';
      S.whitelisted = false;
      if (base === 'codes-new') { consentUser(ctx); return; } // нового покупателя ждёт ввод кода (ABCD2345EFGH)
      if (base === 'codes-transfer') base = 'invited'; // чужой кабинет с владельцем: код RECOVERYCODE переносит доступ на этот аккаунт
      else { base = 'active'; S.access = { source: 'beta_whitelist', email: null }; } // codes-beta-noemail: бесплатный бета-доступ без email
    }
    if (base === 'new' || base === 'outdated') { S.bumpOnAccept = base === 'outdated'; return; }
    consentUser(ctx);
    if (base === 'noaccess') { S.whitelisted = false; return; }

    if (base === 'invited') {
      S.whitelisted = false;
      makeCabinet(ctx);
      var ou = otherUser(ctx, 'Алексей');
      var ow = makeMember(ctx, ou.id, 'owner', 'Алексей');
      sportGoal(ctx, ow, [], 3, 30);
      S.invites.push({ id: ctx.newId('inv'), cabinetId: S.cabinet.id, code: 'MOCKINVITE01', status: 'active', createdByMemberId: ow.id,
        expiresAt: new Date(ctx.nowMs + 7 * 86400000).toISOString().replace(/\.\d+Z$/, 'Z') });
      return;
    }

    makeCabinet(ctx);
    var me;
    var partner = null;
    if (base === 'pair' && as === 'participant') {
      var ou2 = otherUser(ctx, 'Алексей');
      partner = makeMember(ctx, ou2.id, 'owner', 'Алексей');
      me = makeMember(ctx, S.user.id, 'participant', S.user.firstName);
      S.whitelisted = false;
    } else {
      me = makeMember(ctx, S.user.id, 'owner', S.user.firstName);
      if (base === 'pair') partner = makeMember(ctx, otherUser(ctx, 'Анна').id, 'participant', 'Анна');
    }
    S.meMemberId = me.id;
    if (base === 'readonly') { me.status = 'readonly'; S.cabinet.status = 'inactive'; }

    var owner = me.role === 'owner' ? me : partner;
    var second = me.role === 'owner' ? partner : me;
    var members = [owner].concat(second ? [second] : []);
    var offset = base === 'finished' ? 40 : 9;
    var r = sportGoal(ctx, owner, second ? [second] : [], offset, 30);
    var goal = r.goal;

    if (base === 'finished') {
      goal.endDate = K.addDays(ctx.today, -10);
      fillHistory(ctx, goal, members, K.periodDays(goal.startDate, goal.endDate), 3.5);
      Mth.core.completeCore(Object.assign({}, ctx, { today: goal.endDate }), goal, 'system');
      return;
    }

    fillHistory(ctx, goal, members, 9, 3);
    if (base === 'reached') {
      S.progress.push({ goalId: goal.id, date: K.addDays(ctx.today, -1), memberId: owner.id, value: 80, updatedAt: ctx.nowIso });
      Mth.core.noteReached(ctx, goal);
    }
    // сегодня внесено только первое действие первого участника: «—» у остальных
    var first = S.actions.find(function (a) { return a.goalId === goal.id && a.ownerMemberId === owner.id; });
    Mth.core.setFact(S, first.id, ctx.today, first.versions[0].startNorm);
  }

  var api = { SCENARIOS: SCENARIOS, resolve: resolve, blank: blank, seed: seed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.mockScenarios = api; }
})(globalThis);
