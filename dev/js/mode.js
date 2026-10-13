// Выбор режима работы страницы: mock (без сети) или real (настоящий API).
// В сборке beta publish.js ставит ALLOW_MOCK:false — тогда параметр страницы ?mode=mock игнорируется (решение владельца).
(function (root) {
  'use strict';

  function resolveMode(cfg, queryMode) {
    var c = cfg || {};
    if (c.ALLOW_MOCK === false) return 'real';
    var m = queryMode || c.DEFAULT_MODE || 'mock';
    return m === 'real' ? 'real' : 'mock';
  }

  var api = { resolveMode: resolveMode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.mode = api; }
})(globalThis);
