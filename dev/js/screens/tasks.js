// S-11 Разовые задачи: список через task.list (все задачи цели, включая будущие и выполненные), создание, отметка, архив.
(function (root) {
  'use strict';

  var screens = root.GT.screens = root.GT.screens || {};

  screens.tasks = function (env, params) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var ro = env.readOnly();
    var box = h('div');
    var list = h('div');
    var me = env.myMember();
    var members = (env.boot().cabinet.members || []).filter(function (m) { return m.status === 'active'; });
    var other = members.filter(function (m) { return !me || m.id !== me.id; })[0] || null;
    var today = env.todayStr();

    function names(ids) {
      return ids.map(function (id) {
        var m = (env.boot().cabinet.members || []).filter(function (x) { return x.id === id; })[0];
        return m ? (me && m.id === me.id ? t('tasks.me') : m.displayName) : '';
      }).filter(Boolean).join(', ');
    }

    function row(tk) {
      var mine = !!me && tk.assigneeMemberIds.indexOf(me.id) >= 0;
      var overdue = tk.status === 'open' && tk.date < today;
      var c = h('input', { type: 'checkbox', checked: tk.status === 'done', disabled: ro || !mine,
        'aria-label': mine ? tk.title : t('tasks.notYours', { title: tk.title }) });
      c.addEventListener('change', function () {
        env.call('task.setDone', { taskId: tk.id, done: c.checked }).then(function (r) { if (!r.ok) env.fail(r); load(); });
      });
      var canArchive = !ro && (env.isOwner() || mine);
      return h('div', { class: 'row between task' + (overdue ? ' overdue' : '') },
        h('label', { class: 'check' }, c, h('span', null,
          tk.title, h('span', { class: 'hint block', text: [env.F.dateFull(tk.date), names(tk.assigneeMemberIds), overdue ? t('today.overdue') : ''].filter(Boolean).join(' · ') }))),
        canArchive ? U.button(t('tasks.archive'), function () {
          env.call('task.archive', { taskId: tk.id }).then(function (r) { if (!r.ok) env.fail(r); load(); });
        }, { secondary: true }) : null);
    }

    function load() {
      return env.call('task.list', { goalId: params.goalId }).then(function (res) {
        list.textContent = '';
        if (!res.ok) {
          list.appendChild(h('p', { class: res.error.code === 'module_disabled' ? 'notice' : 'error',
            text: res.error.code === 'module_disabled' ? t('tasks.disabled') : env.S.errorText(res.error) }));
          return;
        }
        var open = res.data.tasks.filter(function (x) { return x.status === 'open'; });
        var done = res.data.tasks.filter(function (x) { return x.status === 'done'; });
        if (!res.data.tasks.length) list.appendChild(h('p', { class: 'hint', text: t('tasks.empty') }));
        open.forEach(function (tk) { list.appendChild(row(tk)); }); // сначала открытые, по сроку
        if (done.length) list.appendChild(h('h3', { text: t('tasks.doneTitle') }));
        done.forEach(function (tk) { list.appendChild(row(tk)); });
      });
    }

    var title = h('input', { type: 'text', 'aria-label': t('tasks.fTitle'), placeholder: t('tasks.fTitle') });
    var date = h('input', { type: 'date', value: today, 'aria-label': t('tasks.fDate') });
    var who = h('select', { 'aria-label': t('tasks.fWho') },
      h('option', { value: 'me', text: t('tasks.me') }),
      other && env.isOwner() ? h('option', { value: 'other', text: other.displayName }) : null,
      other && env.isOwner() ? h('option', { value: 'both', text: t('tasks.both') }) : null);
    var err = h('p', { class: 'error', hidden: true });
    var add = U.button(t('tasks.add'), function () {
      if (!title.value.trim()) { err.textContent = t('wizard.err.required'); err.hidden = false; return; }
      var ids = who.value === 'other' ? [other.id] : who.value === 'both' ? [me.id, other.id] : [];
      add.disabled = true;
      env.call('task.create', { goalId: params.goalId, title: title.value.trim(), date: date.value, assigneeMemberIds: ids }).then(function (res) {
        add.disabled = false;
        if (!res.ok) { err.textContent = env.S.errorText(res.error); err.hidden = false; return; }
        err.hidden = true; title.value = '';
        env.toast(t('tasks.added'));
        load();
      });
    });

    box.appendChild(h('h2', { text: t('tasks.title') }));
    box.appendChild(list);
    if (!ro) {
      box.appendChild(h('section', { class: 'card' }, h('h3', { text: t('tasks.new') }),
        U.field(t('tasks.fTitle'), title), U.field(t('tasks.fDate'), date), U.field(t('tasks.fWho'), who), err, add));
    }
    box.appendChild(h('p', { class: 'hint', text: t('tasks.limitHint') }));
    load();
    return box;
  };
})(globalThis);
