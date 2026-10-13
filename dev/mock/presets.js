// Каталог пресетов (brief.md §7) — как отвечает presets.list. Цифры — рабочие примеры из ТЗ.
(function (root) {
  'use strict';

  function a(title, unit, startNorm, growsOnLag, step) {
    return { title: title, unit: unit, startNorm: startNorm, growsOnLag: growsOnLag, step: step, inPlan: true, countStreak: true };
  }
  function tasks() { return Array.prototype.map.call(arguments, function (t) { return { title: t }; }); }

  var PRESETS = [
    { id: 'money', name: 'Деньги', unit: '₽', direction: 'growth', inputMode: 'current',
      example: { title: 'Заработать 400 000 ₽', startValue: 0, targetValue: 400000, days: 30 },
      actions: [a('Сообщения потенциальным клиентам', 'шт', 15, true, 5), a('Звонки', 'шт', 3, true, 1), a('Посты', 'шт', 2, true, 1), a('Ответ на заявки', 'шт', 5, true, 1)],
      tasks: tasks('Оформить приём оплаты', 'Написать оффер', 'Собрать первые 30 контактов') },
    { id: 'audience', name: 'Аудитория', unit: 'подписчики', direction: 'growth', inputMode: 'current',
      example: { title: '100 000 подписчиков', startValue: 0, targetValue: 100000, days: 30 }, normCeiling: 1.5,
      actions: [a('Сторис', 'шт', 1, true, 1), a('Рилсы', 'шт', 2, true, 1), a('Пост-карусель', 'шт', 1, true, 1), a('Комментарии в профилях', 'шт', 10, true, 5)],
      tasks: tasks('Создать Instagram', 'Создать Telegram-канал', 'Закрепить Telegram в профиле') },
    { id: 'savings', name: 'Накопления', unit: '₽', direction: 'growth', inputMode: 'current',
      example: { title: 'Накопить 150 000 ₽', startValue: 50000, targetValue: 150000, days: 90 },
      actions: [a('Отложить на счёт', '₽', 500, true, 100), a('Записать расходы', 'шт', 1, false, 1), a('Дополнительный заработок', 'шт', 1, true, 1), a('Покупки без импульса', 'шт', 1, false, 1)],
      tasks: tasks('Открыть накопительный счёт', 'Настроить автоперевод', 'Проверить и отменить лишние подписки') },
    { id: 'weight', name: 'Вес (уменьшение)', unit: 'кг', direction: 'decline', inputMode: 'current',
      example: { title: 'Вес 82 кг', startValue: 90, targetValue: 82, days: 60 },
      actions: [a('Тренировка', 'шт', 1, true, 1), a('Шаги', 'шаг', 8000, false, 1000), a('Вода', 'л', 2, false, 0.5), a('Запись еды', 'шт', 1, false, 1)],
      tasks: tasks('Купить весы', 'Записаться к врачу', 'Составить меню на неделю') },
    { id: 'sport', name: 'Спорт', unit: 'км', direction: 'growth', inputMode: 'delta',
      example: { title: 'Пробежать 100 км', startValue: 0, targetValue: 100, days: 30 },
      actions: [a('Пробежка/ходьба', 'км', 3, true, 1), a('Силовая', 'мин', 20, true, 5), a('Растяжка', 'мин', 10, true, 5), a('Шаги', 'шаг', 8000, false, 1000)],
      tasks: tasks('Выбрать маршрут и расписание', 'Купить экипировку', 'Записаться на пробный старт или тест') },
    { id: 'learning', name: 'Обучение/навык', unit: 'слова', direction: 'growth', inputMode: 'delta',
      example: { title: 'Выучить 300 слов', startValue: 0, targetValue: 300, days: 30 },
      actions: [a('Новые слова', 'шт', 10, true, 5), a('Практика', 'мин', 20, true, 5), a('Урок', 'шт', 1, true, 1), a('Повторение', 'карточек', 15, true, 5)],
      tasks: tasks('Выбрать курс', 'Настроить ежедневное напоминание', 'Найти партнёра для практики') },
    { id: 'reading', name: 'Чтение', unit: 'страницы', direction: 'growth', inputMode: 'delta',
      example: { title: 'Прочитать 600 страниц', startValue: 0, targetValue: 600, days: 30 },
      actions: [a('Чтение', 'стр', 20, true, 5), a('Чтение без телефона', 'мин', 30, false, 5), a('Заметка по прочитанному', 'шт', 1, true, 1), a('Аудиокнига в дороге', 'мин', 15, true, 5)],
      tasks: tasks('Составить список книг', 'Купить или скачать первую книгу', 'Выбрать постоянное время для чтения') },
    { id: 'custom', name: 'Своя цель', unit: '', direction: 'growth', inputMode: 'current',
      example: { title: '', startValue: 0, targetValue: 0, days: 30 }, actions: [], tasks: [] }
  ];

  var api = { PRESETS: PRESETS, ids: PRESETS.map(function (p) { return p.id; }) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.mockPresets = api; }
})(globalThis);
