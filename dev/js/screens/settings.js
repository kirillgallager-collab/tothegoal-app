// W5: настройки S-50…S-56. Экспорт данных и недельный срез — после беты.
(function (root) {
  'use strict';

  var screens = root.GT.screens = root.GT.screens || {};
  var SUPPORT_URL = 'https://t.me/say_5g'; // чат для «Сообщить о проблеме» (решение владельца, screens.md §3.9)

  function fieldErrors(env, res, map) { // validation_failed → { поле: текст }
    var out = {};
    ((res.error.details && res.error.details.fields) || []).forEach(function (f) {
      out[f.field] = env.t(f.code === 'too_long' ? 'wizard.err.tooLong' : f.code === 'out_of_range' ? 'wizard.err.range' : 'wizard.err.required');
    });
    return out;
  }

  function errorBox(env) { return env.h('p', { class: 'error', hidden: true }); }
  function showErr(box, text) { box.textContent = text; box.hidden = false; }

  // ---------- S-50 Настройки ----------
  screens.settings = function (env) {
    var h = env.h;
    var t = env.t;
    var b = env.boot();
    var box = h('div');
    box.appendChild(h('h2', { text: t('settings.title') }));
    function item(label, name, params) {
      return h('button', { type: 'button', class: 'secondary list-item', text: label, onclick: function () { env.go(name, params || {}); } });
    }
    if (b.activeGoal) box.appendChild(item(t('settings.goal'), 'goalSettings', { goalId: b.activeGoal.id }));
    if (b.activeGoal) box.appendChild(item(t('settings.actions'), 'actions', { goalId: b.activeGoal.id }));
    box.appendChild(item(t('settings.messages'), 'messages'));
    box.appendChild(item(t('settings.members'), 'members'));
    if (env.isOwner()) box.appendChild(item(t('settings.cabinet'), 'cabinet'));
    if (b.mode === 'whitelist') { // только в режиме беты
      box.appendChild(h('section', { class: 'card' },
        h('p', { class: 'hint', text: t('settings.betaVersion', { v: env.cfg.APP_VERSION || '0', env: b.env }) }),
        env.U.button(t('settings.report'), function () { env.openTg(SUPPORT_URL); }, { secondary: true })));
    }
    box.appendChild(diagnostics(env));
    return box;
  };

  // ---------- Диагностика: последние запросы и время ответа сервера (для разработчика) ----------
  function reportText(env) {
    var t = env.t;
    var d = env.diag;
    var sm = d.summary();
    var b = env.boot();
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    var clock = function (ms) { var x = new Date(ms); return two(x.getHours()) + ':' + two(x.getMinutes()) + ':' + two(x.getSeconds()); };
    var tgInfo = env.tg ? (env.tg.platform || '?') + ' ' + (env.tg.version || '?') : '—';
    var lines = [
      t('diag.header', { env: b.env, mode: b.mode, version: env.cfg.APP_VERSION || '0', when: new Date().toISOString() }),
      t('diag.client', { ua: navigator.userAgent, size: window.innerWidth + '×' + window.innerHeight, tg: tgInfo })
    ];
    if (!sm.total) lines.push(t('diag.noCalls'));
    if (sm.cold) lines.push(t('diag.cold', { method: sm.cold.method, ms: sm.cold.ms, result: sm.cold.code }));
    if (sm.warm) lines.push(t('diag.warm', { n: sm.warm.n, avg: sm.warm.avg, median: sm.warm.median, min: sm.warm.min, max: sm.warm.max, p90: sm.warm.p90 }));
    if (sm.total) lines.push(t('diag.failures', { n: sm.failures, total: sm.total }));
    if (sm.perMethod.length) lines.push(t('diag.perMethod', { list: sm.perMethod.map(function (m) { return m.method + ' ' + m.avg + ' (' + m.n + ')'; }).join('; ') }));
    var list = d.list();
    if (list.length) {
      lines.push(t('diag.last', { n: list.length }));
      list.forEach(function (r) {
        var att = r.attempts.length > 1 || r.code !== 'ok'
          ? t('diag.attempts', { list: r.attempts.map(function (a) { return a.ms + ' ' + a.result; }).join(', ') }) : '';
        lines.push(t('diag.line', { time: clock(r.startedAt), method: r.method, ms: r.ms, code: r.code, id: r.requestId, attempts: att }));
      });
    }
    return lines.join('\n');
  }

  // Копирование: сначала буфер обмена, запасной путь — выделение и execCommand (в части клиентов Telegram буфер недоступен).
  function copyText(area) {
    var text = area.value;
    function legacy() {
      try { area.focus(); area.select(); area.setSelectionRange(0, text.length); return !!document.execCommand('copy'); } catch (e) { return false; }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacy(); });
    }
    return Promise.resolve(legacy());
  }

  function diagnostics(env) {
    var h = env.h;
    var t = env.t;
    var area = h('textarea', { readonly: true, rows: '14', class: 'mono', 'aria-label': t('diag.title') });
    var msg = h('p', { class: 'hint' });
    function fill() { area.value = reportText(env); msg.textContent = ''; }
    fill();
    var copy = env.U.button(t('diag.copy'), function () {
      fill();
      copyText(area).then(function (ok) { msg.textContent = ok ? t('diag.copied') : t('diag.copyFail'); });
    });
    var box = h('details', { class: 'card' }, h('summary', { text: t('diag.title') }), h('p', { class: 'hint', text: t('diag.hint') }), area,
      h('div', { class: 'actions' }, copy, env.U.button(t('diag.refresh'), fill, { secondary: true })), msg);
    box.addEventListener('toggle', function () { if (box.open) fill(); });
    return box;
  }

  // ---------- S-51 Цель ----------
  screens.goalSettings = function (env, params) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var F = env.F;
    var owner = env.isOwner() && !env.readOnly();
    return env.call('goal.get', { goalId: params.goalId }).then(function (res) {
      var box = h('div');
      if (!res.ok) { box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); return box; }
      var g = res.data.goal;
      var title = h('input', { type: 'text', value: g.title, disabled: !owner, 'aria-label': t('wizard.fTitle') });
      var unit = h('input', { type: 'text', value: g.unit, disabled: !owner, 'aria-label': t('wizard.fUnit') });
      var end = h('input', { type: 'date', value: g.endDate, disabled: !owner, min: env.todayStr(), 'aria-label': t('wizard.fEnd') });
      var err = errorBox(env);
      var rev = g.rev;
      box.appendChild(h('h2', { text: t('settings.goal') }));
      box.appendChild(U.field(t('wizard.fTitle'), title));
      box.appendChild(U.field(t('wizard.fUnit'), unit));
      box.appendChild(U.field(t('wizard.fEnd'), end, t('goalSettings.endHint')));
      box.appendChild(h('section', { class: 'card' }, h('h3', { text: t('goalSettings.locked') }),
        h('p', { text: t('goalSettings.lockedRow', { start: F.num(g.startValue), target: F.num(g.targetValue), unit: g.unit,
          dir: t(g.direction === 'growth' ? 'wizard.growth' : 'wizard.decline'), mode: t(g.inputMode === 'current' ? 'wizard.modeCurrent' : 'wizard.modeDelta'), from: F.dateFull(g.startDate) }) }),
        h('p', { class: 'hint', text: t('goalSettings.lockedHint') })));
      box.appendChild(err);
      if (owner && g.status === 'active') {
        var save = U.button(t('settings.save'), function () {
          save.disabled = true; err.hidden = true;
          env.call('goal.update', { goalId: g.id, title: title.value.trim(), unit: unit.value.trim(), endDate: end.value, expectedRev: rev }).then(function (r) {
            save.disabled = false;
            if (!r.ok) {
              if (r.error.code === 'conflict') { env.toast(t('settings.conflict'), 'error'); return env.back(); }
              var fe = r.error.code === 'validation_failed' ? Object.keys(fieldErrors(env, r)).join(', ') : '';
              return showErr(err, env.S.errorText(r.error) + (fe ? ' (' + fe + ')' : ''));
            }
            rev = r.data.goal.rev;
            env.boot().activeGoal.title = r.data.goal.title;
            env.toast(t('settings.saved'));
          });
        });
        box.appendChild(save);
        box.appendChild(h('div', { class: 'stack' },
          U.button(t('reached.raise'), function () { env.go('raiseBar', { goalId: g.id }); }, { secondary: true }),
          U.button(t('goalSettings.complete'), function () {
            U.confirmDialog(t('reached.confirm'), t('reached.finish'), true).then(function (ok) {
              if (ok) env.call('goal.complete', { goalId: g.id }).then(function (r) { if (r.ok) env.reboot(); else env.fail(r); });
            });
          }, { danger: true })));
      }
      return box;
    });
  };

  // ---------- S-53 Действия ----------
  screens.actions = function (env, params) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var ro = env.readOnly();
    var me = env.myMember();
    var members = (env.boot().cabinet.members || []).filter(function (m) { return m.status === 'active'; });
    var other = members.filter(function (m) { return !me || m.id !== me.id; })[0] || null;
    var box = h('div');
    var whose = me ? me.id : null;
    var list = h('div');
    var data = null;

    function drawList() {
      list.textContent = '';
      var acts = data.actions.filter(function (a) { return a.ownerMemberId === whose; });
      var active = acts.filter(function (a) { return a.status === 'active'; });
      var archived = acts.filter(function (a) { return a.status === 'archived'; });
      if (!acts.length) list.appendChild(h('p', { class: 'hint', text: t('actions.empty') }));
      active.concat(archived).forEach(function (a) {
        list.appendChild(h('div', { class: 'card' + (a.status === 'archived' ? ' archived' : '') },
          h('strong', { text: a.title }),
          h('p', { class: 'hint', text: t('today.norm', { n: env.F.num(a.startNorm), unit: a.unit }) + (a.status === 'archived' ? ' · ' + t('actions.archived') : '') }),
          ro || (whose !== (me && me.id) && !env.isOwner()) ? null : h('div', { class: 'actions' },
            U.button(t('actions.edit'), function () { env.go('actionEdit', { goalId: params.goalId, action: a, ownerMemberId: whose }); }, { secondary: true }),
            U.button(t(a.status === 'archived' ? 'actions.restore' : 'actions.archive'), function () {
              env.call('action.archive', { actionId: a.id, archived: a.status !== 'archived' }).then(function (r) { if (r.ok) load(); else env.fail(r); });
            }, { secondary: true }))));
      });
      var activeCount = data.actions.filter(function (a) { return a.status === 'active'; }).length;
      if (!ro) {
        list.appendChild(U.button(t('wizard.addAction'), function () { env.go('actionEdit', { goalId: params.goalId, ownerMemberId: whose }); }, { disabled: activeCount >= 15 }));
        list.appendChild(h('p', { class: 'hint', text: t('actions.limit', { n: activeCount }) }));
      }
    }

    function load() {
      return env.call('goal.get', { goalId: params.goalId }).then(function (res) {
        if (!res.ok) { list.textContent = ''; list.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); return; }
        data = res.data;
        drawList();
      });
    }

    box.appendChild(h('h2', { text: t('settings.actions') }));
    if (env.isOwner() && other) {
      var seg = h('div', { class: 'seg' });
      [[me, t('actions.mine')], [other, other.displayName]].forEach(function (p) {
        var b = h('button', { type: 'button', class: p[0].id === whose ? 'on' : 'secondary', text: p[1], onclick: function () { whose = p[0].id; seg.querySelectorAll('button').forEach(function (x) { x.className = 'secondary'; }); b.className = 'on'; drawList(); } });
        seg.appendChild(b);
      });
      box.appendChild(seg);
    }
    box.appendChild(h('p', { class: 'hint', text: t('actions.tomorrow') }));
    box.appendChild(list);
    load();
    return box;
  };

  // ---------- S-53 редактор действия ----------
  screens.actionEdit = function (env, params) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var a = params.action || null;
    var box = h('div');
    var v = a ? { title: a.title, unit: a.unit, startNorm: a.startNorm, step: a.step, normCeiling: a.normCeiling, growsOnLag: a.growsOnLag, inPlan: a.inPlan, countStreak: a.countStreak }
      : { title: '', unit: '', startNorm: 1, step: 1, normCeiling: null, growsOnLag: true, inPlan: true, countStreak: true };
    var errs = {};
    var err = errorBox(env);

    function draw() {
      box.textContent = '';
      var title = h('input', { type: 'text', value: v.title, 'aria-label': t('wizard.actionTitle') });
      title.addEventListener('change', function () { v.title = title.value; });
      var unit = h('input', { type: 'text', value: v.unit, 'aria-label': t('wizard.actionUnit') });
      unit.addEventListener('change', function () { v.unit = unit.value; });
      var norm = U.numberInput(v.startNorm, function (x) { v.startNorm = x; });
      var step = U.numberInput(v.step, function (x) { v.step = x; });
      var ceil = U.numberInput(v.normCeiling, function (x) { v.normCeiling = x; });
      function check(key, label) {
        var c = h('input', { type: 'checkbox', checked: !!v[key] });
        c.addEventListener('change', function () { v[key] = c.checked; });
        return h('label', { class: 'check' }, c, h('span', { text: label }));
      }
      box.appendChild(h('h2', { text: t(a ? 'actions.editTitle' : 'actions.newTitle') }));
      box.appendChild(U.field(t('wizard.actionTitle'), title, null, errs.title));
      box.appendChild(U.field(t('wizard.actionUnit'), unit, null, errs.unit));
      box.appendChild(U.field(t('wizard.norm'), norm, a ? t('actions.normTomorrow') : t('actions.normHint'), errs.startNorm));
      box.appendChild(U.field(t('actions.step'), step, t('actions.stepHint'), errs.step));
      box.appendChild(U.field(t('wizard.ceiling'), ceil, t('wizard.ceilingHint'), errs.normCeiling));
      box.appendChild(check('growsOnLag', t('wizard.growsOnLag')));
      box.appendChild(check('inPlan', t('actions.inPlan')));
      box.appendChild(check('countStreak', t('actions.countStreak')));
      box.appendChild(err);
      var save = U.button(t('settings.save'), function () {
        save.disabled = true; err.hidden = true;
        var body = { title: v.title.trim(), unit: v.unit.trim(), startNorm: v.startNorm, step: v.step, normCeiling: v.normCeiling,
          growsOnLag: v.growsOnLag, inPlan: v.inPlan, countStreak: v.countStreak };
        var p;
        if (a) { body.actionId = a.id; p = env.call('action.update', body); }
        else { body.goalId = params.goalId; if (params.ownerMemberId) body.ownerMemberId = params.ownerMemberId; p = env.call('action.create', body); }
        p.then(function (r) {
          if (r.ok) { env.toast(t('settings.saved')); return env.back(); }
          save.disabled = false;
          if (r.error.code === 'validation_failed') { errs = fieldErrors(env, r); return draw(); }
          showErr(err, env.S.errorText(r.error));
        });
      });
      box.appendChild(h('div', { class: 'actions' }, save, U.button(t('common.cancel'), function () { env.back(); }, { secondary: true })));
    }
    draw();
    return box;
  };

  // ---------- S-54 Сообщения Telegram ----------
  screens.messages = function (env) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var owner = env.isOwner() && !env.readOnly();
    return env.call('cabinet.get', {}).then(function (res) {
      var box = h('div');
      if (!res.ok) { box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); return box; }
      var m = res.data.cabinet.messages;
      var rev = res.data.cabinet.rev;
      var err = errorBox(env);
      box.appendChild(h('h2', { text: t('settings.messages') }));

      function send(patch, revert) {
        err.hidden = true;
        patch.expectedRev = rev;
        env.call('messages.update', patch).then(function (r) {
          if (r.ok) { m = r.data.messages; rev++; env.toast(t('settings.saved')); return; }
          revert();
          showErr(err, r.error.code === 'validation_failed' ? t('messages.deadlineError') : r.error.code === 'conflict' ? t('settings.conflict') : env.S.errorText(r.error));
        });
      }

      function block(key, label, hint, deadline) {
        var cb = h('input', { type: 'checkbox', checked: !!m[key].enabled, disabled: !owner });
        var time = h('input', { type: 'time', value: m[key].time, disabled: !owner, 'aria-label': label });
        var row = h('section', { class: 'card' }, h('label', { class: 'check' }, cb, h('strong', { text: label })),
          deadline ? null : h('div', { class: 'field' }, time),
          hint ? h('p', { class: 'hint', text: hint }) : null);
        cb.addEventListener('change', function () { var p = {}; p[key] = { enabled: cb.checked }; send(p, function () { cb.checked = !cb.checked; }); });
        if (!deadline) time.addEventListener('change', function () { var old = m[key].time; var p = {}; p[key] = { time: time.value }; send(p, function () { time.value = old; }); });
        if (deadline) {
          var dl = h('input', { type: 'time', value: m.daySummary.deadlineTime, disabled: !owner, 'aria-label': t('messages.deadline') });
          dl.addEventListener('change', function () { var old = m.daySummary.deadlineTime; send({ daySummary: { deadlineTime: dl.value } }, function () { dl.value = old; }); });
          row.appendChild(U.field(t('messages.deadline'), dl, t('messages.deadlineHint')));
        }
        return row;
      }

      box.appendChild(block('morning', t('messages.morning'), t('messages.morningHint')));
      box.appendChild(block('evening', t('messages.evening'), t('messages.eveningHint')));
      box.appendChild(block('daySummary', t('messages.summary'), t('messages.summaryHint'), true));
      box.appendChild(h('p', { class: 'hint', text: t('messages.weeklyLater') }));
      box.appendChild(err);

      if (env.boot().notifyStatus !== 'ok') {
        box.appendChild(h('section', { class: 'card' }, h('h3', { text: t('wizard.notifyTitle') }), h('p', { text: t('wizard.notifyText') }),
          U.button(t('messages.allow'), function () {
            var report = function (granted) { env.call('notify.reportWriteAccess', { granted: granted }).then(function (r) { if (r.ok) { env.boot().notifyStatus = r.data.notifyStatus; env.back(); } }); };
            if (env.tg && env.tg.requestWriteAccess) env.tg.requestWriteAccess(function (g) { report(!!g); }); else report(true);
          })));
      }
      return box;
    });
  };

  // ---------- S-55 Участники ----------
  screens.members = function (env) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var owner = env.isOwner() && !env.readOnly();
    var box = h('div');
    var body = h('div');
    var shownLink = null;
    box.appendChild(h('h2', { text: t('settings.members') }));
    box.appendChild(body);

    function load() {
      return env.call('cabinet.get', {}).then(function (res) {
        body.textContent = '';
        if (!res.ok) { body.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); return; }
        var members = res.data.members;
        var invite = res.data.invite;
        members.forEach(function (m) {
          body.appendChild(h('div', { class: 'card' },
            h('strong', { text: m.displayName }),
            h('p', { class: 'hint', text: t(m.role === 'owner' ? 'members.owner' : 'members.participant') + (m.status !== 'active' ? ' · ' + t('members.readonly') : '') }),
            owner && m.role !== 'owner' && m.status === 'active' ? U.button(t('members.revoke'), function () {
              U.confirmDialog(t('members.revokeConfirm', { name: m.displayName }), t('members.revoke'), true).then(function (ok) {
                if (ok) env.call('member.revoke', { memberId: m.id }).then(function (r) { if (r.ok) load(); else env.fail(r); });
              });
            }, { secondary: true }) : null));
        });
        var active = members.filter(function (m) { return m.status === 'active'; }).length;
        if (owner) {
          if (active >= 2) body.appendChild(h('p', { class: 'hint', text: t('members.full') }));
          else {
            body.appendChild(h('div', { class: 'actions' },
              U.button(t('members.invite'), function () {
                env.call('invite.create', {}).then(function (r) {
                  if (!r.ok) return env.fail(r);
                  shownLink = r.data.link; // код показывается только в ответе на создание
                  load();
                });
              }),
              invite ? U.button(t('members.revokeInvite'), function () {
                shownLink = null;
                env.call('invite.revoke', { inviteId: invite.id }).then(function (r) { if (r.ok) load(); else env.fail(r); });
              }, { secondary: true }) : null));
            if (shownLink && invite) {
              var link = shownLink;
              body.appendChild(h('div', null,
                h('p', { class: 'hint', text: t('members.inviteHint') }),
                h('p', { class: 'telegram-id', text: link }),
                h('div', { class: 'actions' },
                  U.button(t('members.copy'), function () { try { navigator.clipboard.writeText(link).then(function () { env.toast(t('noAccess.copied')); }, function () {}); } catch (e) { /* выделить вручную */ } }, { secondary: true }),
                  U.button(t('members.share'), function () { env.openTg('https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(t('members.shareText'))); }, { secondary: true }))));
            }
          }
        }
        if (env.boot().role === 'participant' || env.boot().role === 'readonly') {
          body.appendChild(U.button(t('members.leave'), function () {
            U.confirmDialog(t('members.leaveConfirm'), t('members.leave'), true).then(function (ok) {
              if (ok) env.call('member.leave', {}).then(function (r) { if (r.ok) env.reboot(); else env.fail(r); });
            });
          }, { danger: true }));
        }
      });
    }
    load();
    return box;
  };

  // ---------- S-56 Кабинет ----------
  screens.cabinet = function (env) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var owner = env.isOwner() && !env.readOnly();
    return env.call('cabinet.get', {}).then(function (res) {
      var box = h('div');
      if (!res.ok) { box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); return box; }
      var c = res.data.cabinet;
      var rev = c.rev;
      var err = errorBox(env);
      var tz = h('select', { disabled: !owner, 'aria-label': t('wizard.fTz') });
      var zones = Object.keys(env.F.TZ_NAMES);
      if (zones.indexOf(c.timezone) < 0) zones.unshift(c.timezone);
      zones.forEach(function (z) { tz.appendChild(h('option', { value: z, text: env.F.tzLabel(z, Date.now()), selected: z === c.timezone })); });
      tz.addEventListener('change', function () {
        env.call('cabinet.update', { timezone: tz.value, expectedRev: rev }).then(function (r) {
          if (!r.ok) { tz.value = c.timezone; return showErr(err, env.S.errorText(r.error)); }
          c = r.data.cabinet; rev = c.rev; env.boot().cabinet.timezone = c.timezone; env.toast(t('settings.saved'));
        });
      });
      var mod = h('input', { type: 'checkbox', checked: !!c.modules.oneOffTasks, disabled: !owner });
      mod.addEventListener('change', function () {
        env.call('cabinet.update', { modules: { oneOffTasks: mod.checked }, expectedRev: rev }).then(function (r) {
          if (!r.ok) { mod.checked = !mod.checked; return showErr(err, env.S.errorText(r.error)); }
          c = r.data.cabinet; rev = c.rev; env.boot().cabinet.modules.oneOffTasks = c.modules.oneOffTasks; env.toast(t('settings.saved'));
        });
      });
      box.appendChild(h('h2', { text: t('settings.cabinet') }));
      box.appendChild(U.field(t('wizard.fTz'), tz, t('wizard.hintTz')));
      box.appendChild(h('label', { class: 'check' }, mod, h('span', { text: t('cabinet.moduleTasks') })));
      box.appendChild(h('p', { class: 'hint', text: t('cabinet.moduleHint') }));
      box.appendChild(err);
      box.appendChild(h('p', { class: 'hint', text: t('cabinet.exportLater') }));
      if (owner) {
        // что будет после удаления, зависит от режима доступа (в бете — новый пустой кабинет, в боевом режиме — доступ не восстанавливается)
        var deleteText = t(env.boot().mode === 'codes' ? 'cabinet.deleteTextCodes' : 'cabinet.deleteTextBeta');
        box.appendChild(h('section', { class: 'card' }, h('h3', { text: t('cabinet.deleteTitle') }), h('p', { text: deleteText }),
          U.button(t('cabinet.delete'), function () {
            U.wordDialog(deleteText + ' ' + t('cabinet.deletePrompt', { word: t('cabinet.word') }), t('cabinet.word'), t('cabinet.delete')).then(function (word) {
              if (word === null) return;
              env.call('cabinet.delete', { confirm: word }).then(function (r) {
                if (r.ok) return env.reboot();
                showErr(err, r.error.code === 'confirmation_mismatch' ? t('cabinet.mismatch') : env.S.errorText(r.error));
              });
            });
          }, { danger: true })));
      }
      return box;
    });
  };
})(globalThis);
