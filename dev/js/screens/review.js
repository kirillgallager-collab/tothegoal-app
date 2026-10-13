// W4: дашборд S-20, история S-30, карточка цели S-31, рефлексия S-32. Без украшений.
(function (root) {
  'use strict';

  var screens = root.GT.screens = root.GT.screens || {};

  function memberName(env, id) {
    var m = (env.boot().cabinet.members || []).filter(function (x) { return x.id === id; })[0];
    return m ? m.displayName : '';
  }

  function outcomeText(env, o) {
    return env.t(o === 'success' ? 'review.success' : o === 'fail' ? 'review.fail' : 'review.running');
  }

  function notice(env, text) { return env.h('p', { class: 'notice', text: text }); }

  // ---------- S-20 Дашборд ----------
  screens.dashboard = function (env, params) {
    var h = env.h;
    var t = env.t;
    var F = env.F;
    var box = h('div');
    var period = params.periodDays || 14;
    var goalId = params.goalId;

    function load() {
      return env.call('dashboard.get', goalId ? { goalId: goalId, periodDays: period } : { periodDays: period }).then(function (res) {
        box.textContent = '';
        if (!res.ok) {
          if (res.error.code === 'no_active_goal') { box.appendChild(h('h2', { text: t('noGoal.title') })); box.appendChild(h('p', { text: t('noGoal.text') })); return box; }
          box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) }));
          box.appendChild(env.U.button(t('common.retry'), load));
          return box;
        }
        draw(res.data);
        return box;
      });
    }

    function draw(d) {
      var g = d.goal;
      var p = d.progress;
      box.appendChild(h('h2', { text: t('review.dashboard') }));
      box.appendChild(h('section', { class: 'card' },
        h('p', { class: 'big', text: t('review.progressLine', { cur: F.num(p.currentValue), target: F.num(p.targetValue), unit: g.unit }) }),
        h('p', { text: t('review.progressPct', { p: p.percent, rem: F.num(Math.max(0, p.remaining)) }) }),
        h('p', { class: 'hint', text: t('review.period', { period: F.period(g.startDate, g.endDate) }) })));

      if (d.outcome.state === 'running') {
        var f = d.forecast;
        var txt = f.date === null ? t('review.forecastNone') : f.onTrack ? t('review.forecastOn', { date: F.dateFull(f.date) }) : t('review.forecastLate', { date: F.dateFull(f.date), end: F.dateFull(g.endDate) });
        box.appendChild(h('section', { class: 'card' }, h('h3', { text: t('review.forecast') }), h('p', { text: txt }),
          f.avgPace7d === null ? null : h('p', { class: 'hint', text: t('review.pace', { n: F.num(f.avgPace7d), unit: g.unit }) })));
      } else {
        box.appendChild(h('section', { class: 'card' }, h('h3', { text: t('review.result') }),
          h('p', { text: outcomeText(env, d.outcome.state) + (d.outcome.finalValue != null ? ' · ' + t('review.final', { v: F.num(d.outcome.finalValue), unit: g.unit }) : '') })));
      }

      box.appendChild(h('section', { class: 'card' }, h('h3', { text: t('review.planFact') }),
        d.planFact.map(function (m) {
          return h('p', { text: t('review.planFactRow', { name: memberName(env, m.memberId) || t('review.member'), done: m.doneCount, total: m.totalCount, p: m.percent }) });
        })));

      if (d.normWarning.active) box.appendChild(notice(env, t('review.normWarning')));

      var seg = h('div', { class: 'seg' }, [7, 14, 30].map(function (n) {
        return h('button', { type: 'button', class: n === period ? 'on' : 'secondary', text: t('review.daysN', { n: n }), onclick: function () { period = n; load(); } });
      }));
      box.appendChild(h('section', { class: 'card' }, h('h3', { text: t('review.slice') }), seg,
        d.slice.days.slice().reverse().map(function (day) {
          var parts = day.perMember.map(function (m) { return (memberName(env, m.memberId) || t('review.member')) + ' ' + m.percent + ' %' + (m.missing ? ' (' + t('review.missing') + ')' : ''); }).join(' · ');
          var row = h('button', { type: 'button', class: 'secondary slice-row', onclick: function () { env.go('today', { date: day.date }); } },
            h('strong', { text: F.dayShort(day.date) }), h('span', { text: t('review.dayDelta', { d: F.delta(day.progressDelta), unit: g.unit }) }), h('span', { class: 'hint', text: parts }));
          return row;
        })));
    }

    return load();
  };

  // ---------- S-30 История ----------
  screens.history = function (env) {
    var h = env.h;
    var t = env.t;
    var F = env.F;
    var box = h('div');
    var list = h('div');
    var more = h('div');
    box.appendChild(h('h2', { text: t('review.history') }));
    box.appendChild(list);
    box.appendChild(more);

    function load(cursor) {
      var p = { limit: 20 };
      if (cursor) p.cursor = cursor;
      return env.call('history.list', p).then(function (res) {
        more.textContent = '';
        if (!res.ok) { list.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); more.appendChild(env.U.button(t('common.retry'), function () { load(cursor); })); return; }
        if (!res.data.items.length && !cursor) list.appendChild(h('p', { class: 'hint', text: t('review.historyEmpty') }));
        res.data.items.forEach(function (it) {
          list.appendChild(h('button', { type: 'button', class: 'secondary history-row', onclick: function () { env.go('card', { goalId: it.goalId }); } },
            h('strong', { text: it.title }),
            h('span', { class: 'hint', text: F.period(it.startDate, it.endDate) }),
            h('span', { text: t('review.histLine', { target: F.num(it.targetValue), unit: it.unit, final: F.num(it.finalValue), p: it.percent }) }),
            h('span', { class: 'badge ' + (it.outcome === 'success' ? 'ok' : ''), text: outcomeText(env, it.outcome) }),
            it.reflectionPreview ? h('span', { class: 'hint', text: it.reflectionPreview }) : null));
        });
        if (res.data.nextCursor) more.appendChild(env.U.button(t('review.more'), function () { load(res.data.nextCursor); }, { secondary: true }));
      });
    }
    load();
    return box;
  };

  // ---------- S-31 Карточка цели ----------
  screens.card = function (env, params) {
    var h = env.h;
    var t = env.t;
    var F = env.F;
    var ro = env.readOnly();
    return env.call('history.get', { goalId: params.goalId }).then(function (res) {
      var box = h('div');
      if (!res.ok) { box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); return box; }
      var d = res.data;
      var g = d.goal;
      box.appendChild(h('h2', { text: g.title }));
      box.appendChild(h('p', { class: 'hint', text: F.period(g.startDate, g.endDate) + ' · ' + t('review.target', { v: F.num(g.targetValue), unit: g.unit }) }));
      if (d.result) {
        var r = d.result;
        box.appendChild(h('section', { class: 'card' }, h('h3', { text: t('review.result') }),
          h('p', { class: 'big', text: outcomeText(env, r.outcome) }),
          h('p', { text: t('review.final', { v: F.num(r.finalValue), unit: g.unit }) + ' · ' + r.percent + ' %' }),
          h('p', { text: t('review.planFactPct', { p: r.planFactPercent }) }),
          h('p', { text: t('review.bestStreak', { n: r.bestStreak }) })));
      } else {
        box.appendChild(h('p', { class: 'notice', text: t('review.stillRunning') }));
      }
      if (d.achievements) {
        box.appendChild(h('p', { text: t('review.firstReached', { date: F.dateFull(d.achievements.firstReachedAt.slice(0, 10)), v: F.num(d.achievements.firstReachedValue), unit: g.unit, days: d.achievements.firstReachedDays }) }));
      }
      box.appendChild(h('section', { class: 'card' }, h('h3', { text: t('review.reflection') }),
        d.reflections.length ? d.reflections.map(function (rf) {
          return h('div', { class: 'reflection' },
            h('p', { class: 'hint', text: rf.authorName + ' · ' + F.dateFull(rf.updatedAt.slice(0, 10)) }),
            [['worked', 'reflection.worked'], ['mistakes', 'reflection.mistakes'], ['different', 'reflection.different']].map(function (k) {
              return rf[k[0]] ? h('p', null, h('strong', { text: t(k[1]) + ': ' }), rf[k[0]]) : null;
            }));
        }) : h('p', { class: 'hint', text: t('review.noReflection') }),
        ro ? null : env.U.button(t('review.editReflection'), function () { env.go('reflection', { goalId: g.id, fromCard: true }); }, { secondary: true })));
      box.appendChild(env.U.button(t('review.toDashboard'), function () { env.go('dashboard', { goalId: g.id }); }, { secondary: true }));
      return box;
    });
  };

  // ---------- S-32 Рефлексия (после завершения цели и из карточки) ----------
  screens.reflection = function (env, params) {
    var h = env.h;
    var t = env.t;
    var goalId = params.goalId || params.reflectionGoalId;
    var overlay = !params.fromCard;
    var me = env.myMember();
    var box = h('div');
    var fields = {};
    var err = h('p', { class: 'error', hidden: true });

    function finish() { if (overlay) env.reboot(); else env.back(); }

    return env.call('history.get', { goalId: goalId }).then(function (res) {
      var mine = res.ok ? res.data.reflections.filter(function (r) { return me && r.authorMemberId === me.id; })[0] : null;
      box.appendChild(h('h2', { text: t('reflection.title') }));
      if (res.ok) box.appendChild(h('p', { class: 'hint', text: res.data.goal.title }));
      [['worked', 'reflection.worked'], ['mistakes', 'reflection.mistakes'], ['different', 'reflection.different']].forEach(function (k) {
        var ta = h('textarea', { 'aria-label': t(k[1]), maxlength: '1000' });
        ta.value = mine && mine[k[0]] ? mine[k[0]] : '';
        fields[k[0]] = ta;
        box.appendChild(env.U.field(t(k[1]), ta));
      });
      box.appendChild(err);
      var save = env.U.button(t('reflection.save'), function () {
        save.disabled = true;
        err.hidden = true;
        env.call('reflection.save', { goalId: goalId, worked: fields.worked.value, mistakes: fields.mistakes.value, different: fields.different.value }).then(function (r) {
          if (r.ok) return finish();
          save.disabled = false;
          err.textContent = env.S.errorText(r.error); err.hidden = false;
        });
      });
      var actions = h('div', { class: 'actions' }, save);
      if (overlay) {
        actions.appendChild(env.U.button(t('reflection.skip'), function () {
          env.call('reflection.dismiss', { goalId: goalId }).then(function (r) { if (r.ok) finish(); else env.fail(r); });
        }, { secondary: true }));
      } else {
        actions.appendChild(env.U.button(t('common.cancel'), function () { env.back(); }, { secondary: true }));
      }
      box.appendChild(actions);
      if (overlay) box.appendChild(h('p', { class: 'hint', text: t('reflection.thenNew') }));
      return box;
    });
  };
})(globalThis);
