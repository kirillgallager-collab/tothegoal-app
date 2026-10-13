// S-40 «Цель достигнута», S-52 «Поднять планку». (S-51 «Цель» — в settings.js.)
(function (root) {
  'use strict';

  var screens = root.GT.screens = root.GT.screens || {};

  // ---------- S-52 Поднять планку: предпросмотр K и применение ----------
  // params: { goalId, onCancel? } — onCancel вызывается вместо «назад» (внутри экрана «Цель достигнута»).
  screens.raiseBar = function (env, params) {
    var h = env.h;
    var t = env.t;
    var F = env.F;
    var U = env.U;
    var box = h('div');
    return env.call('goal.get', { goalId: params.goalId }).then(function (res) {
      if (!res.ok) { box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); return box; }
      var g = res.data.goal;
      var preview = h('div', { class: 'card', hidden: true });
      var err = h('p', { class: 'error', hidden: true });
      var target = U.numberInput(g.targetValue, check, { negative: true, aria: t('raise.newTarget') });
      var end = h('input', { type: 'date', value: g.endDate, min: env.D.addDays(env.todayStr(), 1), 'aria-label': t('raise.newEnd') });
      end.addEventListener('change', check);
      var apply = U.button(t('raise.apply'), doApply, { disabled: true });
      var current = null;

      function check() {
        var v = U.parseNum(target.value);
        err.hidden = true; apply.disabled = true; preview.hidden = true;
        if (v === null || v === g.targetValue) return;
        var p = { goalId: g.id, newTarget: v };
        if (end.value && end.value !== g.endDate && env.D.isDate(end.value)) p.newEndDate = end.value;
        env.call('goal.raiseBar.preview', p).then(function (r) {
          if (!r.ok) {
            err.textContent = r.error.code === 'validation_failed' ? t('raise.invalid') : env.S.errorText(r.error);
            err.hidden = false; return;
          }
          preview.textContent = '';
          preview.hidden = false;
          if (r.data.factor === null) { // впереди нет дней: нормы не посчитать, предлагаем продлить дату, применить нельзя
            preview.appendChild(h('p', { class: 'notice', text: t('raise.noDays') }));
            current = null;
            return;
          }
          current = p;
          preview.appendChild(h('p', { class: 'big', text: r.data.factor <= 1 ? t('raise.same') : t('raise.grow', { k: F.num(r.data.factor, 1) }) }));
          if (r.data.suggestExtend) preview.appendChild(h('p', { class: 'notice', text: t('raise.extend') }));
          apply.disabled = false;
        });
      }

      function doApply() {
        if (!current) return;
        apply.disabled = true;
        env.call('goal.raiseBar', current).then(function (r) {
          if (r.ok) { env.toast(t('raise.done')); return env.reboot(); }
          apply.disabled = false;
          err.textContent = env.S.errorText(r.error); err.hidden = false;
        });
      }

      box.appendChild(h('h2', { text: t('raise.title') }));
      box.appendChild(h('p', { text: t('raise.now', { v: F.num(g.targetValue), unit: g.unit, end: F.dateFull(g.endDate) }) }));
      box.appendChild(U.field(t('raise.newTarget'), target, t('raise.hintTarget', { dir: t(g.direction === 'growth' ? 'raise.more' : 'raise.less') })));
      box.appendChild(U.field(t('raise.newEnd'), end, t('raise.hintEnd')));
      box.appendChild(preview);
      box.appendChild(err);
      box.appendChild(h('div', { class: 'actions' }, apply,
        U.button(t('common.cancel'), function () { if (params.onCancel) params.onCancel(); else env.back(); }, { secondary: true })));
      return box;
    });
  };

  // ---------- S-40 Цель достигнута ----------
  screens.goalReached = function (env) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var goal = env.boot().activeGoal;
    var box = h('div');

    function main() {
      box.textContent = '';
      box.appendChild(h('h2', { text: t('reached.title') }));
      box.appendChild(h('p', { text: t('reached.text', { title: goal.title }) }));
      box.appendChild(h('div', { class: 'stack' },
        U.button(t('reached.finish'), function () {
          U.confirmDialog(t('reached.confirm'), t('reached.finish')).then(function (ok) {
            if (!ok) return;
            env.call('goal.complete', { goalId: goal.id }).then(function (r) { if (r.ok) env.reboot(); else env.fail(r); });
          });
        }),
        U.button(t('reached.raise'), function () {
          box.textContent = '';
          Promise.resolve(screens.raiseBar(env, { goalId: goal.id, onCancel: main })).then(function (el) { box.appendChild(el); });
        }, { secondary: true }),
        U.button(t('reached.keep'), function () {
          env.call('goal.dismissReached', { goalId: goal.id }).then(function (r) { if (r.ok) env.reboot(); else env.fail(r); });
        }, { secondary: true })));
      box.appendChild(h('p', { class: 'hint', text: t('reached.hint') }));
    }
    main();
    return box;
  };
})(globalThis);
