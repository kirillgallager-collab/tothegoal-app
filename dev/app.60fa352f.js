// Создано web/publish.js для окружения «dev». Руками не править: пересоберите командой node web/publish.js dev.
// Ничего секретного здесь нет: страница публичная.
window.GT_CONFIG = {
  "API_URL": "https://script.google.com/macros/s/AKfycbwqhjcllgST7tjIWH0ROfZ3YjYvZm0eUuyENDD9HSl2lLf_9zqJjykouoU3LY0eDQyH/exec",
  "RECOVERY_URL": "",
  "EXPECTED_ENV": "dev",
  "ALLOW_MOCK": true,
  "DEFAULT_MODE": "real",
  "PRIVACY_URL": "../legal/privacy.html",
  "APP_VERSION": "0.1.0"
};

;
// Словарь строк (только русский, brief.md §14 п. 24). Все тексты интерфейса — только отсюда.
// Без зависимостей; работает и в браузере, и в Node (IIFE + module.exports).
(function (root) {
  'use strict';

  var S = {
    app: { name: 'ДоЦели' },

    tabs: { label: 'Разделы', today: 'Сегодня', dashboard: 'Дашборд', history: 'История', settings: 'Настройки' },

    common: {
      retry: 'Повторить',
      close: 'Закрыть',
      loading: 'Загружаем…',
      help: 'Справка',
      later: 'Позже',
      back: 'Назад', ok: 'Да', cancel: 'Отмена',
      readOnlyBanner: 'Только просмотр',
      factModeNote: 'Открыто из напоминания: здесь будет ввод факта за сегодня.',
      placeholder:'Этот раздел появится на следующих этапах разработки.',
      retryAfter: 'Повторите через {n} с.',
      retryAfterMin: 'Повторите через {n} мин.',
      errorId: 'Код ошибки: {id}'
    },

    offline: {
      title: 'Нет связи',
      text: 'Не удалось связаться с сервером. Введённое не потеряно.'
    },

    wrongEnv: {
      title: 'Неверное окружение',
      text: 'Эта сборка рассчитана на «{expected}», а сервер ответил «{actual}». Работа остановлена, ничего не сохранено.'
    },

    fatal: {
      authExpired: { title: 'Сеанс устарел', text: 'Закройте приложение и откройте его заново.' },
      authInvalid: { title: 'Не удалось проверить вход', text: 'Закройте приложение и откройте его из Telegram заново.' },
      update: { title: 'Нужно обновление', text: 'Обновите Telegram или приложение и откройте его заново.' },
      noApiUrl: { title: 'Не задан адрес сервера', text: 'В этой сборке не указан адрес API.' },
      generic: { title: 'Что-то пошло не так', text: 'Попробуйте открыть приложение заново.' }
    },

    consent: {
      title: 'Согласие на обработку данных',
      titleUpdated: 'Мы обновили политику конфиденциальности',
      intro: 'Чтобы приложение считало нормы и присылало напоминания, нам нужно сохранять: ваш Telegram ID и имя, цели, внесённые значения и рефлексии. Данные хранятся в хранилище сервиса и не передаются третьим лицам.',
      policyLink: 'Политика конфиденциальности',
      version: 'Версия политики: {version}',
      checkbox: 'Согласен на обработку персональных данных',
      submit: 'Продолжить',
      outdatedReloaded: 'Текст политики обновился, пожалуйста, прочитайте и подтвердите ещё раз.'
    },

    noAccess: {
      title: 'Закрытая бета',
      text: 'Доступ по приглашению разработчика.',
      telegramId: 'Ваш Telegram ID: {id}',
      sendId: 'Пришлите этот номер разработчику, чтобы получить доступ.',
      copy: 'Скопировать',
      copied: 'Скопировано',
      presets: 'Посмотреть заготовки целей'
    },

    invite: { title: 'Приглашение в кабинет', text: 'Вас пригласили вести цель вместе. Оплата не нужна.', accept: 'Принять приглашение' },

    presets: { example: 'Пример: {title} · {days} дней', tasks: 'Разовые задачи:' },

    wizard: {
      title: 'Новая цель', pickPreset: 'Выберите заготовку: цифры можно поправить на следующем шаге.', customHint: 'Заполните сами',
      step2: 'Проверьте цифры', fTitle: 'Название', fUnit: 'Единица', fDirection: 'Направление', growth: 'Рост', decline: 'Уменьшение',
      fStart: 'Сейчас', fTarget: 'Цель', fPeriod: 'Срок', fEnd: 'Дата окончания', days: '{n} дней', fInputMode: 'Как вносить прогресс',
      modeCurrent: 'Текущее значение', modeDelta: 'Прирост за день', fTz: 'Часовой пояс',
      hintTitle: 'Например: «Вес 82 кг» или «100 000 подписчиков».', hintUnit: 'Например: кг, ₽, подписчики, страницы.',
      hintStart: 'С чего начинаете. Менять после старта нельзя.', hintTarget: 'Куда хотите прийти. Поднять планку можно позже.',
      hintModeCurrent: 'Каждый день вносите, сколько сейчас (например, вес на весах).',
      hintModeDelta: 'Каждый день вносите, сколько добавилось за день (например, пробежали км).',
      hintActions: 'Ежедневные действия и их норма на день. Если отстаёте, норма растёт.', hintTz: 'От него зависит, когда заканчивается день.',
      actions: 'Действия в день', actionTitle: 'Название действия', actionUnit: 'ед.', norm: 'Норма в день', less: 'Меньше', more: 'Больше',
      remove: 'Убрать', addAction: '+ Добавить действие', advanced: 'Дополнительно', ceiling: 'Потолок нормы (во сколько раз максимум)',
      ceilingHint: 'Например 1,5: норма не вырастет больше чем в полтора раза. Пусто — без потолка.', growsOnLag: 'Норма растёт при отставании',
      tasks: 'Разовые задачи', done: 'Готово',
      created: 'Цель создана: {title}', notifyTitle: 'Уведомления от бота', notifyText: 'Бот напомнит внести день и пришлёт итог. Для этого нужно разрешение.',
      notifyAllow: 'Разрешить', notifySkip: 'Пропустить', inviteLater: 'Пригласить второго участника можно позже: Настройки → Участники.',
      toToday: 'К сегодняшнему дню',
      fStartDate: 'Старт', startToday: 'Сегодня', startTomorrow: 'Завтра', startOtherChoice: 'Другая дата', startOther: 'Дата старта',
      startHint: 'Цель начнётся {date}. Вносить факт можно с первого дня.',
      err: {
        startRange: 'Старт — от сегодня до 14 дней вперёд', required: 'Заполните это поле', tooLong: 'Слишком длинно', same: 'Цель должна отличаться от текущего значения',
        direction: 'Цель не соответствует направлению', period: 'Дата окончания должна быть позже начала', limit: 'Слишком много действий',
        range: 'Допустимо число не меньше 1' }
    },

    today: {
      todayLabel: 'Сегодня, {date}', prevDay: 'Предыдущий день', nextDay: 'Следующий день',
      goalLine: '{cur} из {target} {unit} · осталось {rem} · {days} {daysWord}', day1: 'день', day2: 'дня', day5: 'дней',
      streak: 'Лучшая серия: {n}', streakShort: 'серия {n}', factTitle: 'Факт дня', noActions: 'Ежедневных действий нет. Добавьте их в настройках.',
      norm: 'Норма: {n} {unit}', normGrew: 'норма выросла: было {was}', done: 'выполнено', notDone: 'не выполнено',
      normButton: 'Норма выполнена', normDone: '✓ Норма выполнена', normUndo: 'Отменить «Норма выполнена»',
      enterValue: 'Ввести число: {title}', less: 'Меньше: {title}', more: 'Больше: {title}',
      completeAll: 'Все нормы выполнены', finish: 'Готово на сегодня', allMarked: 'Нормы отмечены', undo: 'Отменить',
      saving: 'Сохраняется…', goalGone: 'Цель завершена. Черновик удалён.', saved: 'Сохранено ✓', saveError: 'не сохранено', dirty: 'Есть несохранённое: нажмите «Сохранить»', rowDirty: 'не сохранено',
      save: 'Сохранить', discard: 'Отбросить', restored: 'Есть несохранённые изменения за {date}. Сохранить или отбросить?',
      refreshing: 'Данные обновляются…', cachedOffline: 'Нет связи. Показаны сохранённые данные, сохранить пока нельзя.',
      errBannerRetry: 'Не удалось сохранить. {reason} Всё введённое осталось на экране.',
      errBannerHard: 'Не удалось сохранить: {reason} Это не исправить повтором, экран можно обновить.', refresh: 'Обновить экран',
      progressNow: 'Сколько сейчас', progressAdded: 'Сколько добавилось', progressLess: 'Меньше', progressMore: 'Больше',
      summary: 'Выполнено {done} из {total} · {p} %', dayEntered: 'День внесён ✓', entered: 'Внесено {k} из {m} действий',
      other: '{name}: {done} из {total} · {state}', otherEntered: 'внёс', otherNot: 'ещё нет',
      tasks: 'Разовые задачи', noTasks: 'Задач на сегодня нет.', overdue: 'просрочено', addTask: '+ Задача',
      normWarning: 'Нормы растут быстро: цель требует больше обычного. Можно продлить срок в настройках цели.'
    },

    outOfPeriod: {
      notStarted: 'Цель начнётся {date}', notStartedText: 'Вносить факт можно с первого дня периода: {period}.',
      ended: 'Период цели закончился', endedText: '«{title}»: период {period} завершён. Подведите итог: цель уйдёт в историю.',
      summary: 'Достигнуто {cur} из {target} {unit} · {p} %', finish: 'Подвести итог'
    },

    tasks: {
      title: 'Разовые задачи', empty: 'Задач пока нет.', archive: 'В архив', new: 'Новая задача', doneTitle: 'Выполненные',
      notYours: 'Отметить может только исполнитель: {title}', disabled: 'Модуль «Разовые задачи» выключен: включить его можно в настройках кабинета.',
      fTitle: 'Название', fDate: 'Срок', fWho: 'Кто делает', me: 'Я', both: 'Оба', add: 'Добавить', added: 'Задача добавлена',
      limitHint: 'До 50 задач на цель. Отметить задачу выполненной может только её исполнитель.'
    },
    reached: {
      title: 'Цель достигнута', text: '«{title}»: вы дошли до цели. Что дальше?', finish: 'Завершить', raise: 'Поднять планку', keep: 'Продолжить как есть',
      confirm: 'Завершить цель? Данные останутся в истории, внести факт за прошлые дни уже нельзя.',
      hint: 'Все три действия останутся доступными в настройках цели.'
    },
    raise: {
      title: 'Поднять планку', now: 'Сейчас цель: {v} {unit}, срок до {end}.', newTarget: 'Новая цель', newEnd: 'Новая дата окончания',
      hintTarget: 'Должна быть {dir}, чем сейчас.', more: 'больше', less: 'меньше', hintEnd: 'Можно не менять. Если нормы растут сильно, продлите срок.',
      grow: 'Нормы вырастут примерно в {k} раза.', same: 'Нормы не изменятся.',
      noDays: 'До конца срока не осталось дней, нормы посчитать нельзя. Продлите дату окончания.', extend: 'Нормы растут сильно: можно продлить дату окончания.',
      invalid: 'Новая цель должна быть дальше текущей, а срок не раньше завтрашнего дня.', apply: 'Применить', done: 'Планка поднята'
    },
    reflection: {
      title: 'Рефлексия', worked: 'Что сработало', mistakes: 'Какие ошибки', different: 'Что сделаю иначе', save: 'Сохранить', skip: 'Пропустить'
    },
    summary: { title: 'Итог цели', saved: 'Рефлексия сохранена ✓', newGoal: 'Новая цель', repeat: 'Повторить эту цель' },
    review: {
      dashboard: 'Дашборд', history: 'История целей', member: 'Участник',
      progressLine: '{cur} из {target} {unit}', progressPct: 'Выполнено {p} %, осталось {rem}', period: 'Период: {period}',
      forecast: 'Прогноз', forecastNone: 'Пока мало данных для прогноза.', forecastOn: 'При текущем темпе выйдем на цель {date}.',
      forecastLate: 'При текущем темпе выйдем на цель {date}, срок — {end}.', pace: 'Средний темп за 7 дней: {n} {unit} в день',
      result: 'Итог', final: 'Достигнуто: {v} {unit}', success: 'Успех', fail: 'Не успех', running: 'идёт',
      planFact: 'План / факт сегодня', planFactRow: '{name}: {done} из {total} · {p} %', normWarning: 'Норма выросла больше чем вдвое против стартовой: цель требует заметно больше обычного. Можно поднять срок или цель в настройках.',
      slice: 'Срез по дням', daysN: '{n} дн.', dayDelta: '{d} {unit}', missing: 'не внесено',
      todayOpen: 'сегодня, {date}', openNotEntered: 'ещё не внесён', openEntered: '{p} % · день идёт',
      historyEmpty: 'Целей пока нет.', histLine: 'Цель {target} {unit} · достигнуто {final} · {p} %', more: 'Показать ещё',
      target: 'цель {v} {unit}', planFactPct: 'План/факт по действиям: {p} %', bestStreak: 'Лучшая серия: {n}',
      stillRunning: 'Цель ещё идёт.', firstReached: 'Впервые цель достигнута {date}: {v} {unit} за {days} дн.',
      reflection: 'Рефлексия', noReflection: 'Пока ничего не заполнено.', editReflection: 'Заполнить / изменить рефлексию', toDashboard: 'Дашборд цели'
    },
    // S-02 боевой режим (mode=codes): ввод кода активации
    activate: {
      title: 'Введите код активации', text: 'Код пришёл на email, который вы указали при оплате. В нём 12 букв и цифр: пробелы и дефисы можно не убирать.',
      field: 'Код активации', placeholder: 'ABCD-2345-EFGH', submit: 'Активировать', busy: 'Проверяем…', presets: 'Посмотреть заготовки целей',
      recover: 'Восстановить доступ на сайте',
      transferred: 'Доступ перенесён на этот аккаунт.', locked: 'Слишком много неверных попыток. Попробуйте через {clock}.',
      lostHint: 'Потеряли код? Новый можно получить на странице «Восстановить доступ» на сайте: он придёт на email из оплаты.',
      err: {
        bad_format: 'В коде 12 букв и цифр. Проверьте, что вы ввели его полностью.', code_invalid: 'Код не найден. Проверьте, нет ли опечатки.',
        code_used: 'Этот код уже использован.', code_expired: 'Срок кода истёк. Новый код можно получить на странице «Восстановить доступ» на сайте.',
        already_has_access: 'У этого аккаунта уже есть доступ.', already_in_cabinet: 'Этот аккаунт уже состоит в другом кабинете.',
        transfer_too_soon: 'Перенос доступа возможен не чаще раза в 30 дней. Следующий перенос: {date}.'
      }
    },

    // S-04 «Email для восстановления доступа» (режим codes, владелец бесплатного бета-доступа без email)
    email: {
      title: 'Email для восстановления доступа', intro: 'Укажите email: по нему можно будет восстановить доступ, если вы потеряете аккаунт Telegram.',
      field: 'Email', send: 'Отправить код', sending: 'Отправляем…', codeIntro: 'Мы отправили код на {email}, он действует 30 минут.', codeField: 'Код из письма',
      codeHint: '6 цифр', confirm: 'Подтвердить', resend: 'Отправить ещё раз', resendIn: 'Отправить ещё раз через {clock}', change: 'Изменить адрес',
      done: 'Email подтверждён: теперь доступ можно восстановить по письму.', finish: 'Готово', locked: 'Слишком много неверных попыток. Попробуйте через {clock}.',
      err: {
        bad_format_email: 'Некорректный адрес', bad_format_code: 'В коде 6 цифр', email_in_use: 'Этот адрес уже используется',
        email_already_set: 'Email уже указан', code_invalid: 'Код неверный', code_expired: 'Срок кода истёк, отправьте новый',
        unavailable: 'Не удалось отправить письмо, повторите'
      }
    },

    settings: {
      title: 'Настройки', goal: 'Цель', actions: 'Действия', messages: 'Сообщения Telegram', members: 'Участники', cabinet: 'Кабинет',
      theme: 'Тема', save: 'Сохранить', saved: 'Сохранено', conflict: 'Данные изменились на другом устройстве. Откройте экран заново.',
      betaVersion: 'Версия беты: {v} · окружение {env}', report: 'Сообщить о проблеме', copyReport: 'Скопировать отчёт'
    },
    theme: { auto: 'Авто', light: 'Светлая', dark: 'Тёмная' },
    diag: {
      title: 'Диагностика', hint: 'Для разработчика: последние запросы к серверу и время ответа. Если что-то не работает, нажмите «Скопировать» и пришлите текст.',
      header: 'ДоЦели · диагностика · окружение {env} · режим {mode} · версия {version} · {when}',
      client: 'Устройство: {ua} · экран {size} · Telegram {tg}', noCalls: 'Запросов к серверу пока не было.',
      cold: 'Холодный (первый вызов за сеанс): {method} — {ms} мс, результат {result}',
      warm: 'Тёплые вызовы: {n} шт. · среднее {avg} мс · медиана {median} · минимум {min} · максимум {max} · 9 из 10 быстрее {p90} мс',
      failures: 'Неудачных вызовов: {n} из {total}', perMethod: 'По методам (тёплые, среднее в мс, в скобках число): {list}',
      marks: 'Старт (мс от открытия страницы): скрипты готовы {scripts}, первый экран {first} ({what})',
      reasons: { start: 'старт', action: 'действие', tab: 'вкладка', background: 'фон' },
      last: 'Последние {n} запросов, новые сверху:', line: '{time} {method} [{reason}] · отправлен на {since} мс · ждали {ms} мс · {code} · requestId {id}{attempts}', ageSec: '{n} с', ageMin: '{n} мин', ageHour: '{n} ч', cachedMark: ' · из кэша (экран за {shown} мс, данным {age})', cacheHeader: 'Показано из кэша (экран за … мс от открытия вкладки):', cacheLine: '{time} {method} · из кэша · экран за {shown} мс · данным {age} · {refresh}', cacheRefresh: 'свежие запрошены', cacheNoRefresh: 'без запроса (данные не меняются)', attempts: ' · попытки (мс, итог): {list}', serverMs: ' (сервер {n} мс)',
      copy: 'Скопировать', copied: 'Скопировано', copyFail: 'Не удалось скопировать автоматически: выделите текст выше и скопируйте вручную.', refresh: 'Обновить'
    },
    goalSettings: {
      endHint: 'Дату окончания можно менять; нормы пересчитаются только для будущих дней.', locked: 'Менять нельзя',
      lockedRow: '{dir}: с {start} до {target} {unit}; ввод: {mode}; старт {from}.',
      lockedHint: 'Менять нельзя — завершите цель и создайте новую. Повысить цель можно через «Поднять планку».', complete: 'Завершить цель'
    },
    actions: {
      empty: 'Действий нет.', archived: 'в архиве', edit: 'Изменить', archive: 'В архив', restore: 'Вернуть', mine: 'Мои',
      limit: 'Активных действий: {n} из 15.', tomorrow: 'Новая стартовая норма начинает действовать со следующего дня.',
      newTitle: 'Новое действие', editTitle: 'Действие', step: 'Шаг кнопок «−/+»', stepHint: 'На сколько меняется число за одно нажатие.',
      normHint: 'Минимум на день; максимума нет.', normTomorrow: 'Изменение нормы начнёт действовать с завтрашнего дня.',
      inPlan: 'Входит в план/факт', countStreak: 'Считать серию'
    },
    messages: {
      morning: 'Утреннее напоминание', morningHint: 'Бот напомнит о целях на день.', evening: 'Вечернее напоминание',
      eveningHint: 'Кнопка в сообщении откроет ввод факта за день.', summary: 'Итог дня', deadline: 'Крайний срок итога',
      summaryHint: 'Придёт не раньше вечернего напоминания: сразу, если все внесли день, иначе в крайний срок.',
      deadlineHint: 'Нельзя поставить раньше вечернего напоминания.', deadlineError: 'Крайний срок должен быть позже вечернего напоминания.',
      weeklyLater: 'Недельный срез появится после беты.', allow: 'Разрешить уведомления'
    },
    members: {
      owner: 'владелец', participant: 'участник', readonly: 'только просмотр', revoke: 'Отозвать доступ',
      revokeConfirm: 'Отозвать доступ у «{name}»? Участник сможет только смотреть кабинет.', full: 'В кабинете уже два участника.',
      invite: 'Пригласить', inviteHint: 'Отправьте эту ссылку второму участнику. Она действует 7 дней и одноразовая.', copy: 'Скопировать',
      share: 'Отправить в Telegram', shareText: 'Присоединяйся к моей цели в ДоЦели', revokeInvite: 'Отозвать приглашение',
      leave: 'Выйти из кабинета', leaveConfirm: 'Выйти из кабинета? Ваши данные останутся в кабинете, но вы потеряете доступ.'
    },
    cabinet: {
      moduleTasks: 'Разовые задачи', moduleHint: 'Данные выключенного модуля сохраняются скрытыми.',
      exportLater: 'Экспорт данных появится после беты.', deleteTitle: 'Удалить кабинет',
      // текст подтверждения зависит от режима доступа из app.bootstrap.mode (screens.md S-56)
      deleteTextBeta: 'Все цели, факты и рефлексии будут удалены без возможности вернуть. Вы останетесь в закрытой бете: при следующем входе создастся новый пустой кабинет.',
      deleteTextCodes: 'Все цели, факты и рефлексии будут удалены без возможности вернуть. Доступ не восстанавливается: чтобы пользоваться приложением снова, нужно купить доступ заново, возврата нет.',
      delete: 'Удалить кабинет',
      deletePrompt: 'Для подтверждения введите слово «{word}».', word: 'УДАЛИТЬ', mismatch: 'Слово введено неверно.'
    },

    noGoal: {
      title: 'Цель ещё не создана',
      text: 'Цель создаёт владелец кабинета.',
      none: 'Нет активной цели', archived: 'Прошлые цели сохранены в истории', create: 'Создать цель', ownerOnly: 'Новую цель создаёт владелец кабинета'
    },

    help: {
      title: 'Справка',
      text: 'ДоЦели помогает идти к цели небольшими ежедневными шагами: приложение считает норму на каждый день и пересчитывает её, если вы отстаёте или опережаете. Начните с цели, затем вносите факт за день: одно-два нажатия.'
    },

    service: { env: 'Окружение: {env}', mode: 'режим: {mode}', api: 'API v{v}' },

    // Каталог ошибок api.md §5: ключ — код ошибки. Плюс локальный код network.
    errors: {
      network: 'Нет связи с сервером.',
      superseded: 'Запрос заменён более новым.',
      unsaved: 'Сначала нужно сохранить введённое. Нажмите «Повторить» на плашке сверху.',
      bad_request: 'Что-то пошло не так. Попробуйте ещё раз.',
      version_unsupported: 'Нужно обновить Telegram или приложение.',
      payload_too_large: 'Слишком большой объём данных.',
      auth_invalid: 'Не удалось проверить вход. Откройте приложение заново.',
      auth_expired: 'Сеанс устарел. Откройте приложение заново.',
      rate_limited: 'Слишком часто. Подождите немного.',
      locked: 'Слишком много неверных попыток.',
      service_busy: 'Сервис перегружен. Попробуйте чуть позже.',
      busy: 'Кабинет занят, попробуйте ещё раз.',
      request_in_progress: 'Запрос ещё выполняется.',
      request_conflict: 'Запрос не удалось выполнить. Обновите экран.',
      unavailable: 'Сервис временно недоступен. Повторите позже.',
      internal: 'Внутренняя ошибка. Сообщите нам, если она повторится.',
      not_found: 'Не найдено.',
      forbidden: 'Это действие вам недоступно.',
      access_required: 'Доступ не активирован.',
      read_only: 'Только просмотр: изменения недоступны.',
      validation_failed: 'Проверьте введённые данные.',
      field_immutable: 'Это поле нельзя менять после старта.',
      conflict: 'Данные изменились. Обновите экран.',
      limit_reached: 'Достигнут лимит.',
      date_out_of_range: 'Дата вне периода цели.',
      date_in_future: 'Нельзя вносить данные за будущие дни.',
      goal_archived: 'Цель завершена, данные только для чтения.',
      goal_not_found: 'Цель не найдена.',
      goal_active_exists: 'В кабинете уже есть активная цель.',
      no_active_goal: 'Нет активной цели.',
      module_disabled: 'Этот модуль выключен.',
      code_invalid: 'Код не найден или неверен.',
      code_used: 'Код уже использован.',
      code_expired: 'Срок кода истёк.',
      already_has_access: 'У вас уже есть доступ.',
      already_in_cabinet: 'Вы уже состоите в кабинете.',
      transfer_too_soon: 'Перенос возможен не чаще раза в 30 дней.',
      invite_invalid: 'Приглашение недействительно.',
      cabinet_full: 'В кабинете уже два участника.',
      confirmation_mismatch: 'Подтверждающее слово не совпало.',
      not_available: 'Недоступно в бете.',
      consent_required: 'Нужно согласие на обработку данных.',
      consent_outdated: 'Политика обновилась, обновляем.',
      health_consent_required: 'Нужно согласие на обработку сведений о здоровье.',
      health_consent_outdated: 'Текст согласия обновился, обновляем.',
      email_in_use: 'Этот адрес уже используется.',
      email_already_set: 'Email уже указан.'
    }
  };

  // Подстановка {name} в строку.
  function fill(str, params) {
    return String(str).replace(/\{(\w+)\}/g, function (m, k) {
      return params && params[k] != null ? String(params[k]) : m;
    });
  }

  // t('consent.version', {version: '1'}) — строка по пути.
  function t(path, params) {
    var cur = S;
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++) {
      cur = cur != null ? cur[parts[i]] : undefined;
    }
    if (typeof cur !== 'string') return path; // видно сразу, что строки не хватает
    return fill(cur, params);
  }

  // Текст ошибки для пользователя по коду из каталога. error — {code, retryAfterSec?, details?}.
  function errorText(error) {
    var code = error && error.code;
    var base = Object.prototype.hasOwnProperty.call(S.errors, code) ? S.errors[code] : S.errors.bad_request;
    var out = base;
    var sec = error && error.retryAfterSec;
    if (typeof sec === 'number' && sec > 0) {
      out += ' ' + (sec < 60
        ? fill(S.common.retryAfter, { n: Math.ceil(sec) })
        : fill(S.common.retryAfterMin, { n: Math.ceil(sec / 60) }));
    }
    var errorId = error && error.details && error.details.errorId;
    if (code === 'internal' && errorId) out += ' ' + fill(S.common.errorId, { id: errorId });
    return out;
  }

  var api = { strings: S, t: t, errorText: errorText, fill: fill };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.strings = api; }
})(globalThis);

;
// Даты в виде строк YYYY-MM-DD (клиентская копия нужных функций; заглушка mock/ живёт отдельно).
(function (root) {
  'use strict';

  function dayNum(s) { var p = String(s).split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
  function dayStr(n) {
    var d = new Date(n * 86400000);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function addDays(s, n) { return dayStr(dayNum(s) + n); }
  function diffDays(a, b) { return dayNum(a) - dayNum(b); }
  function isDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && dayStr(dayNum(s)) === s; }

  // «Сегодня» по часам устройства в заданном поясе (подсказка для мастера; настоящее «сегодня» — на сервере).
  function todayIn(tz, nowMs) {
    try {
      var s = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(nowMs));
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    } catch (e) { /* неизвестный пояс */ }
    return new Date(nowMs).toISOString().slice(0, 10);
  }

  var api = { dayNum: dayNum, dayStr: dayStr, addDays: addDays, diffDays: diffDays, isDate: isDate, todayIn: todayIn };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.dates = api; }
})(globalThis);

;
// Форматирование чисел, дат и поясов для интерфейса (русская локаль). Чистые функции; браузер и Node.
(function (root) {
  'use strict';

  // 87.4 → «87,4»; 1000000 → «1 000 000» (неразрывные пробелы); до maxDec знаков, лишние нули убираются.
  function num(n, maxDec) {
    if (n == null || !isFinite(n)) return '—';
    var v = Math.round(n * 1e6) / 1e6;
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: maxDec == null ? 2 : maxDec }).format(v);
  }

  // Знак для изменений без красных минусов: «+3», «−3», «0».
  function delta(n) {
    if (!n) return '0';
    return (n > 0 ? '+' : '−') + num(Math.abs(n));
  }

  function plural(n, forms) { // [один, несколько, много]: 1 день, 2 дня, 5 дней
    var a = Math.abs(n) % 100;
    var b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  function parts(dateStr) {
    var p = String(dateStr).split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  }

  // «вт, 13 октября»
  function dayLong(dateStr) {
    return new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(parts(dateStr));
  }
  // «13 окт»
  function dayShort(dateStr) {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parts(dateStr)).replace('.', '');
  }
  // «13.10.2026»
  function dateFull(dateStr) {
    var p = String(dateStr).split('-');
    return p[2] + '.' + p[1] + '.' + p[0];
  }
  // «13.10.2026 – 11.12.2026»
  function period(a, b) { return dateFull(a) + ' – ' + dateFull(b); }

  var TZ_NAMES = {
    'Europe/Kaliningrad': 'Калининград', 'Europe/Moscow': 'Москва', 'Europe/Samara': 'Самара', 'Asia/Yekaterinburg': 'Екатеринбург',
    'Asia/Omsk': 'Омск', 'Asia/Krasnoyarsk': 'Красноярск', 'Asia/Irkutsk': 'Иркутск', 'Asia/Yakutsk': 'Якутск',
    'Asia/Vladivostok': 'Владивосток', 'Asia/Magadan': 'Магадан', 'Asia/Kamchatka': 'Камчатка'
  };

  // Смещение пояса в часах на момент nowMs: «UTC+3».
  function utcOffset(tz, nowMs) {
    try {
      var s = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date(nowMs))
        .filter(function (p) { return p.type === 'timeZoneName'; })[0].value; // «GMT+3»
      return s === 'GMT' ? 'UTC+0' : s.replace('GMT', 'UTC');
    } catch (e) { return 'UTC'; }
  }
  // «Москва (UTC+3)»; неизвестные пояса — по названию города.
  function tzLabel(tz, nowMs) {
    var name = TZ_NAMES[tz] || String(tz).split('/').pop().replace(/_/g, ' ');
    return name + ' (' + utcOffset(tz, nowMs == null ? Date.now() : nowMs) + ')';
  }

  // Шаг кнопок «−/+» для прогресса цели: степень десяти от 1/100 диапазона, не меньше 0,1.
  function progressStep(startValue, targetValue, divisor) {
    var range = Math.abs(targetValue - startValue);
    if (!(range > 0)) return 1;
    return Math.max(0.1, Math.pow(10, Math.floor(Math.log10(range / (divisor || 100)) + 1e-9)));
  }

  // Прибавить шаг без хвостов плавающей запятой: 0.1 + 0.2 → 0.3.
  function addStep(value, step) {
    return Math.round((value + step) * 1e6) / 1e6;
  }

  var api = { num: num, delta: delta, plural: plural, dayLong: dayLong, dayShort: dayShort, dateFull: dateFull, period: period,
    tzLabel: tzLabel, utcOffset: utcOffset, TZ_NAMES: TZ_NAMES, progressStep: progressStep, addStep: addStep };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.format = api; }
})(globalThis);

;
// Клиент API (api.md §1, §4, §5). Без зависимостей; браузер и Node.
// Ответ call() всегда объект, исключений наружу не бросает:
//   { ok:true, data, replayed, serverTime, requestId }
//   { ok:false, requestId, error:{ code, message, retryable, retryAfterSec, details } }
// Локальный код ошибки 'network' — нет связи (таймаут, не-JSON, сбой сети) после всех попыток.
(function (root) {
  'use strict';

  var API_VERSION = 1;
  var PUBLIC_METHODS = { 'recovery.request': true }; // без initData (api.md §2)
  // Повторяем автоматически только сетевую ошибку, таймаут и эти коды (api.md §4); бизнес-ошибки (goal_archived, goal_not_found,
  // date_out_of_range, validation_failed, …) не повторяются никогда; rate_limited и locked ждут retryAfterSec.
  var RETRY_CODES = { busy: true, request_in_progress: true, service_busy: true, unavailable: true };

  function uuidV4() {
    var c = (typeof globalThis !== 'undefined' && globalThis.crypto) || null;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
    var b = new Uint8Array(16);
    if (c && c.getRandomValues) c.getRandomValues(b);
    else for (var i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return (x + 0x100).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  function defaultSleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function networkError(requestId, reason) {
    return {
      ok: false,
      requestId: requestId,
      error: { code: 'network', message: reason || 'network', retryable: true, retryAfterSec: null, details: null }
    };
  }

  // options:
  //   apiUrl, fetch, getInitData()           — обязательны (fetch в тестах поддельный)
  //   timeoutMs=10000, attempts=3, pauses=[1000,3000], jitterMs=500
  //   slowMs=1000, onSlow()                  — вызвать, если ответа нет через slowMs
  //   sleep(ms), random(), uuid()            — подменяются в тестах
  function createClient(options) {
    var o = options || {};
    var doFetch = o.fetch;
    var timeoutMs = o.timeoutMs != null ? o.timeoutMs : 10000;
    // goal.create тяжелее остальных методов (цель, действия, задачи одним вызовом): 20 с (api.md §4); повтор безопасен, у метода есть журнал
    var methodTimeouts = o.methodTimeouts || (o.timeoutMs != null ? {} : { 'goal.create': 20000 });
    var attempts = o.attempts != null ? o.attempts : 3;
    var pauses = o.pauses || [1000, 3000];
    var jitterMs = o.jitterMs != null ? o.jitterMs : 500;
    var slowMs = o.slowMs != null ? o.slowMs : 1000;
    var sleep = o.sleep || defaultSleep;
    var random = o.random || Math.random;
    var uuid = o.uuid || uuidV4;
    // Замеры для «Диагностики»: now() в миллисекундах (performance.now), onCall(запись) после каждого вызова
    var now = o.now || (typeof performance !== 'undefined' && performance.now ? performance.now.bind(performance) : Date.now);

    // Одна попытка: вернуть разобранный ответ-конверт или бросить Error (сеть, таймаут, не-JSON).
    function attempt(body, timeoutMs) {
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer;
      var timeout = new Promise(function (_, reject) {
        timer = setTimeout(function () {
          if (controller) controller.abort();
          reject(new Error('timeout'));
        }, timeoutMs);
      });
      var request = Promise.resolve()
        .then(function () {
          return doFetch(o.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: body,
            signal: controller ? controller.signal : undefined
          });
        })
        .then(function (res) { return res.text(); })
        .then(function (text) {
          var json;
          try { json = JSON.parse(text); } catch (e) { throw new Error('not-json'); }
          if (!json || typeof json !== 'object' || typeof json.ok !== 'boolean') throw new Error('not-envelope');
          return json;
        });
      // request.catch — чтобы после победы таймаута поздний отказ не стал «необработанным».
      request.catch(function () {});
      return Promise.race([request, timeout]).then(
        function (v) { clearTimeout(timer); return v; },
        function (e) { clearTimeout(timer); throw e; }
      );
    }

    // call(method, params, { requestId }) — requestId можно передать, чтобы повторить действие
    // новой серией попыток с тем же идентификатором (api.md §4).
    function call(method, params, opts) {
      var requestId = (opts && opts.requestId) || uuid();
      var envelope = { v: API_VERSION, method: method, requestId: requestId };
      if (!PUBLIC_METHODS[method]) envelope.initData = o.getInitData ? o.getInitData() : '';
      envelope.params = params || {};
      var body = JSON.stringify(envelope);

      var slowTimer = null;
      if (o.onSlow) slowTimer = setTimeout(function () { o.onSlow(); }, slowMs);

      var t0 = now();
      var startedAt = Date.now();
      var log = []; // по каждой попытке: сколько миллисекунд и чем кончилась (для «Диагностики»)
      var serverTime = null;

      function finish(result) {
        if (slowTimer) clearTimeout(slowTimer);
        if (o.onCall) {
          try {
            // reason: почему ушёл запрос (start | action | tab | background); sinceOpen — мс от открытия страницы до отправки (видно цепочки запросов)
            o.onCall({ method: method, requestId: requestId, startedAt: startedAt, ms: Math.round(now() - t0), attempts: log,
              reason: (opts && opts.reason) || null, sinceOpen: Math.round(t0), cached: (opts && opts.cached) || null, // cached: данные уже показаны из кэша { ageMs, shownMs }
              ok: !!result.ok, code: result.ok ? 'ok' : result.error.code, replayed: !!result.replayed, serverTime: result.serverTime || serverTime });
          } catch (e) { /* замер не должен ломать запрос */ }
        }
        return result;
      }

        function entry(ms, result, serverMs) {
        var e = { ms: ms, result: result };
        if (serverMs != null) e.serverMs = serverMs;
        return e;
      }

      function run(n) {
        var a0 = now();
        return attempt(body, methodTimeouts[method] || timeoutMs).then(
          function (json) {
            var ms = Math.round(now() - a0);
            if (json.serverTime) serverTime = json.serverTime;
            var serverMs = typeof json.serverMs === 'number' ? json.serverMs : null; // сколько сервер обрабатывал запрос (без сети и холодного старта)
            if (json.ok) {
              log.push(entry(ms, 'ok', serverMs));
              return finish({ ok: true, data: json.data, replayed: !!json.replayed, serverTime: json.serverTime, requestId: requestId });
            }
            var e = json.error || {};
            var error = {
              code: e.code || 'bad_request',
              message: e.message || '',
              retryable: !!e.retryable,
              retryAfterSec: typeof e.retryAfterSec === 'number' ? e.retryAfterSec : null,
              details: e.details || null
            };
            log.push(entry(ms, error.code, serverMs));
            if (RETRY_CODES[error.code] && n < attempts) return pauseThen(n);
            return finish({ ok: false, requestId: requestId, error: error });
          },
          function (err) {
            log.push({ ms: Math.round(now() - a0), result: 'network:' + (err && err.message ? err.message : 'error') });
            if (n < attempts) return pauseThen(n);
            return finish(networkError(requestId, err && err.message));
          }
        );
      }

      // opts.canRetry() — вызывающий может запретить повторы: если после запроса появилось более новое изменение,
      // повторять старое тело нельзя (сервер не хранит журнал повторов для записи факта), вызов заканчивается кодом 'superseded'
      function superseded() {
        log.push({ ms: 0, result: 'superseded' });
        return finish({ ok: false, requestId: requestId, error: { code: 'superseded', message: 'newer change', retryable: false, retryAfterSec: null, details: null } });
      }
      var canRetry = opts && opts.canRetry;

      function pauseThen(n) {
        if (canRetry && !canRetry()) return superseded();
        var base = pauses[Math.min(n - 1, pauses.length - 1)];
        return sleep(base + Math.floor(random() * jitterMs)).then(function () {
          if (canRetry && !canRetry()) return superseded(); // за время паузы могли нажать ещё раз
          return run(n + 1);
        });
      }

      return run(1);
    }

    return { call: call };
  }

  var api = { createClient: createClient, uuidV4: uuidV4, API_VERSION: API_VERSION, RETRY_CODES: RETRY_CODES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.api = api; }
})(globalThis);

;
// Журнал запросов для блока «Диагностика» в настройках: последние 10 вызовов и сводка по времени ответа.
// Холодный вызов = самый первый вызов за сеанс (обычно app.bootstrap при открытии: Apps Script «просыпается»);
// тёплые = все следующие успешные вызовы. Чистая логика без DOM; браузер и Node.
(function (root) {
  'use strict';

  function stats(values) {
    if (!values.length) return null;
    var a = values.slice().sort(function (x, y) { return x - y; });
    var sum = a.reduce(function (s, x) { return s + x; }, 0);
    var mid = Math.floor(a.length / 2);
    return {
      n: a.length, min: a[0], max: a[a.length - 1], avg: Math.round(sum / a.length),
      median: a.length % 2 ? a[mid] : Math.round((a[mid - 1] + a[mid]) / 2),
      p90: a[Math.min(a.length - 1, Math.ceil(a.length * 0.9) - 1)]
    };
  }

  // o: { max = 10 — сколько последних запросов показывать, keep = 300 — сколько замеров держать для сводки }
  function createDiag(o) {
    var max = (o && o.max) || 10;
    var keep = (o && o.keep) || 300;
    var recent = []; // новые первыми
    var cold = null;
    var warm = []; // успешные вызовы после первого: { method, ms }
    var failures = 0;
    var total = 0;
    var marks = {}; // отметки старта: мс от открытия страницы (scripts, telegram, firstScreen); первая запись остаётся

    // r — запись клиента API: { method, requestId, startedAt, ms, attempts:[{ms,result}], ok, code, replayed, serverTime }
    function record(r) {
      total++;
      if (!cold) cold = { method: r.method, ms: r.ms, ok: r.ok, code: r.code };
      else if (r.ok) { warm.push({ method: r.method, ms: r.ms }); if (warm.length > keep) warm.shift(); }
      if (!r.ok) failures++;
      recent.unshift(r);
      if (recent.length > max) recent.pop();
    }

    function summary() {
      var byMethod = {};
      warm.forEach(function (w) { (byMethod[w.method] = byMethod[w.method] || []).push(w.ms); });
      var perMethod = Object.keys(byMethod).sort().map(function (m) { var st = stats(byMethod[m]); return { method: m, n: st.n, avg: st.avg, max: st.max }; });
      return { total: total, failures: failures, cold: cold, warm: stats(warm.map(function (w) { return w.ms; })), perMethod: perMethod };
    }

    function mark(name, ms, note) { if (!marks[name]) marks[name] = { ms: Math.round(ms), note: note || null }; }

    // Показ данных из кэша: { method, at (Date.now), shownMs — от открытия вкладки до показа, ageMs — возраст данных, refreshed — ушёл ли запрос за свежим }
    var shown = [];
    function cacheShown(r) { shown.unshift(r); if (shown.length > max) shown.pop(); }

    return { record: record, mark: mark, marks: function () { return Object.assign({}, marks); }, list: function () { return recent.slice(); }, summary: summary,
      cacheShown: cacheShown, cacheList: function () { return shown.slice(); },
      clear: function () { recent = []; warm = []; cold = null; failures = 0; total = 0; marks = {}; shown = []; } };
  }

  var api = { createDiag: createDiag, stats: stats };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.diagLogic = api; }
})(globalThis);

;
// Кэш чтений вкладок (дашборд, история, карточка цели, настройки цели) в localStorage: «сначала показать сохранённое, свежее запросить в фоне».
// Чистая логика без DOM; браузер и Node. Любая ошибка localStorage не ломает экран: записи живут в памяти страницы.
//
// Ключ записи: gt:data:v2: + область (окружение, кабинет, участник) + вид + id цели + уточнение (например, 'completed'). При смене
// кабинета или участника область другая, чужие записи не показываются и удаляются (purge). Формат записи изменился → поднять
// версию префикса (VERSION), новая сборка не читает старые записи.
// Свежесть: запись показывается всегда, а свежие данные запрашивает экран. Один запрос на вид+цель+уточнение: пока он в пути,
// второй вызов ждёт тот же ответ. Запись (факт, смена цели) обновляет «поколение» затронутых видов: ответ, начатый до записи,
// в кэш не попадает, и второй вызов после записи не присоединяется к старому запросу.
(function (root) {
  'use strict';

  var VERSION = 'v2';
  var PREFIX = 'gt:data:' + VERSION + ':';
  var SEP = '|';

  // Методы чтения: ответ записи не нужен, кэш они не сбрасывают
  var READ_ONLY = /\.(get|list|preview)$/;
  // Запись факта дня: меняет дашборд и строку активной цели в истории
  var FACT_WRITES = { 'day.save': 1, 'fact.set': 1, 'day.completeAll': 1, 'day.finish': 1 };

  // o: { getStorage() → Storage|null, scope() → строка области или null (кабинет неизвестен), now(), maxBytes = 250000 }
  function createDataCache(o) {
    var now = o.now || Date.now;
    var maxBytes = o.maxBytes || 250000;
    var mem = {};        // key → запись { at, data } или null (удалена)
    var gens = {};       // 'вид|цель' → счётчик «поколения»
    var flights = {};    // key + поколение → Promise ответа

    function st() { try { return o.getStorage ? o.getStorage() : null; } catch (e) { return null; } }
    function scope() { var s; try { s = o.scope(); } catch (e) { s = null; } return s ? String(s).split(SEP).join('_') : null; }
    function part(v) { return v == null ? '' : String(v).split(SEP).join('_'); }
    function keyOf(sc, kind, goalId, extra) { return PREFIX + sc + SEP + kind + SEP + part(goalId) + SEP + part(extra); }

    // Все ключи (хранилище и память) с префиксом
    function allKeys() {
      var seen = {};
      Object.keys(mem).forEach(function (k) { if (mem[k]) seen[k] = 1; });
      try {
        var s = st();
        if (s && typeof s.key === 'function') for (var i = 0; i < s.length; i++) { var k = s.key(i); if (k && k.indexOf(PREFIX) === 0) seen[k] = 1; }
      } catch (e) { /* остаётся память */ }
      return Object.keys(seen);
    }

    function readEntry(key) {
      if (Object.prototype.hasOwnProperty.call(mem, key)) return mem[key];
      try {
        var s = st();
        var raw = s ? s.getItem(key) : null;
        if (raw) { var v = JSON.parse(raw); if (v && typeof v.at === 'number') { mem[key] = v; return v; } }
      } catch (e) { /* повреждённая запись: считаем, что её нет */ }
      return null;
    }

    function removeKey(key) {
      mem[key] = null;
      try { var s = st(); if (s) s.removeItem(key); } catch (e) { /* остаётся в памяти */ }
    }

    function sizeOf(key) {
      try { var s = st(); var raw = s ? s.getItem(key) : null; if (raw) return raw.length; } catch (e) { /* ниже оценка по памяти */ }
      var e2 = mem[key];
      return e2 ? JSON.stringify(e2).length : 0;
    }

    // Общий размер не больше maxBytes: сначала удаляются самые старые записи (сама новая запись остаётся)
    function enforceLimit(keep) {
      var list = allKeys().map(function (k) { var e = readEntry(k); return { key: k, at: e ? e.at : 0, size: sizeOf(k) }; });
      var total = list.reduce(function (n, x) { return n + x.size; }, 0);
      if (total <= maxBytes) return;
      list.sort(function (a, b) { return a.at - b.at; });
      for (var i = 0; i < list.length && total > maxBytes; i++) {
        if (list[i].key === keep) continue;
        total -= list[i].size;
        removeKey(list[i].key);
      }
    }

    function parse(key) { // ключ → части; null для чужого формата
      if (key.indexOf(PREFIX) !== 0) return null;
      var p = key.slice(PREFIX.length).split(SEP);
      return p.length === 4 ? { scope: p[0], kind: p[1], goalId: p[2], extra: p[3] } : null;
    }

    // ---------- чтение и запись ----------
    // { data, at } или null. Записи другой области (кабинет, участник) не возвращаются.
    function get(kind, goalId, extra) {
      var sc = scope();
      if (!sc) return null;
      var e = readEntry(keyOf(sc, kind, goalId, extra));
      return e ? { data: e.data, at: e.at } : null;
    }

    function set(kind, goalId, extra, data) {
      var sc = scope();
      if (!sc) return false;
      var key = keyOf(sc, kind, goalId, extra);
      var entry = { at: now(), data: data };
      var raw;
      try { raw = JSON.stringify(entry); } catch (e) { return false; }
      if (raw.length > maxBytes / 2) return false; // одна запись больше половины лимита — не храним
      mem[key] = entry;
      try {
        var s = st();
        if (s) {
          try { s.setItem(key, raw); } catch (e2) { enforceLimit(key); s.setItem(key, raw); } // нет места: убираем старое и пробуем ещё раз
        }
      } catch (e3) { /* остаётся в памяти страницы */ }
      enforceLimit(key);
      return true;
    }

    // ---------- поколения и сброс ----------
    function genSig(kind, goalId) { return (gens[kind + SEP + '*'] || 0) + '.' + (goalId ? (gens[kind + SEP + goalId] || 0) : 0); }
    function bump(kind, goalId) { var k = kind + SEP + (goalId || '*'); gens[k] = (gens[k] || 0) + 1; }

    // Удалить записи вида (goalId, extra не заданы — все) и обновить поколение: начатые ранее ответы в кэш не попадут.
    function invalidate(kind, goalId, extra) {
      bump(kind, goalId);
      allKeys().forEach(function (k) {
        var p = parse(k);
        if (!p || p.kind !== kind) return;
        if (goalId !== undefined && p.goalId !== part(goalId)) return;
        if (extra !== undefined && p.extra !== part(extra)) return;
        removeKey(k);
      });
    }

    // Записи других кабинетов и участников удаляются (вызывать, когда область известна)
    function purge() {
      var sc = scope();
      if (!sc) return; // кабинет ещё неизвестен: ничего не удаляем
      allKeys().forEach(function (k) { var p = parse(k); if (!p || p.scope !== sc) removeKey(k); });
      // Старые версии формата (gt:data:v1: и др.) не читаются и не мешают, но место занимают: чистим их тоже
      try {
        var s = st();
        if (s && typeof s.key === 'function') {
          var old = [];
          for (var i = 0; i < s.length; i++) { var k2 = s.key(i); if (k2 && k2.indexOf('gt:data:') === 0 && k2.indexOf(PREFIX) !== 0) old.push(k2); }
          old.forEach(function (k3) { s.removeItem(k3); });
        }
      } catch (e) { /* не критично */ }
    }

    function clear() { allKeys().forEach(removeKey); gens = {}; flights = {}; }

    // ---------- запрос с общим ответом ----------
    // fetcher() → Promise<результат клиента API { ok, data|error }>. opts.cacheable(data) → false, если ответ в кэш класть нельзя.
    // Возвращает Promise того же результата; пока запрос в пути (и поколение не менялось), повторный вызов получает тот же Promise.
    function load(kind, goalId, extra, fetcher, opts) {
      var sc = scope();
      var sig = genSig(kind, goalId);
      var fkey = (sc || '') + SEP + kind + SEP + part(goalId) + SEP + part(extra) + SEP + sig;
      if (flights[fkey]) return flights[fkey];
      var p = Promise.resolve().then(fetcher).then(function (res) {
        if (res && res.ok && genSig(kind, goalId) === sig && sc === scope() && (!opts || !opts.cacheable || opts.cacheable(res.data))) set(kind, goalId, extra, res.data);
        return res;
      });
      var done = function () { if (flights[fkey] === p) delete flights[fkey]; };
      flights[fkey] = p;
      p.then(done, done);
      return p;
    }

    function inFlight(kind, goalId, extra) {
      return !!flights[(scope() || '') + SEP + kind + SEP + part(goalId) + SEP + part(extra) + SEP + genSig(kind, goalId)];
    }

    // ---------- реакции на записи ----------
    // До отправки записи: затронутые виды получают новое поколение, ответы, начатые раньше, в кэш не попадут;
    // факт дня дополнительно сразу убирает дашборд (его нельзя показывать без только что сохранённого).
    function beforeWrite(method, params) {
      if (READ_ONLY.test(method) || method === 'presets.list') return;
      if (FACT_WRITES[method]) { invalidate('dashboard'); invalidate('history.list', undefined, 'all'); return; }
      bump('dashboard'); bump('history.list'); bump('goal.get');
      if (params && params.goalId) bump('history.get', params.goalId);
    }

    // После ответа записи (успех или нет: при «нет связи» запись могла выполниться): затронутое удаляется,
    // кроме goal.update, где настройки цели обновляются из ответа.
    function afterWrite(method, params, res) {
      if (READ_ONLY.test(method) || method === 'presets.list') return;
      var goalId = params && params.goalId;
      if (FACT_WRITES[method]) { invalidate('dashboard'); invalidate('history.list', undefined, 'all'); return; }
      if (method === 'goal.update' && res && res.ok && res.data && res.data.goal) {
        invalidate('dashboard'); invalidate('history.list'); bump('goal.get', res.data.goal.id);
        var cur = get('goal.get', res.data.goal.id, '');
        if (cur) { cur.data.goal = res.data.goal; set('goal.get', res.data.goal.id, '', cur.data); }
        return;
      }
      if (method === 'reflection.save' || method === 'reflection.dismiss') {
        if (goalId) invalidate('history.get', goalId); else invalidate('history.get');
        invalidate('history.list');
        return;
      }
      if (method === 'cabinet.delete') { clear(); return; }
      // goal.create, goal.complete, goal.raiseBar, action.*, прочее: меняющееся удаляем; завершённые карточки (history.get) не трогаем
      invalidate('dashboard'); invalidate('history.list'); invalidate('goal.get');
      if (goalId && (method === 'goal.raiseBar' || method === 'goal.dismissReached')) invalidate('history.get', goalId);
    }

    return {
      get: get, set: set, invalidate: invalidate, purge: purge, clear: clear, load: load, inFlight: inFlight,
      beforeWrite: beforeWrite, afterWrite: afterWrite, keys: allKeys, PREFIX: PREFIX
    };
  }

  // Чтения вкладок поверх кэша: единый вход для экранов и фоновая загрузка.
  // o: { cache (createDataCache), call(method, params, opts) → Promise<результат API>, writes: { outstanding(), idle() } | null (очередь записи факта),
  //      boot() → app.bootstrap, noGoal() → bool, clock() → мс от открытия страницы, now() → Date.now, onShown(запись для «Диагностики») }
  function createTabData(o) {
    var cache = o.cache;
    var now = o.now || Date.now;
    var clock = o.clock || function () { return 0; };

    // Описания чтений: одни и те же параметры у экрана и у фона, иначе фоновый ответ вкладке не пригодится (ключ кэша и общий запрос совпадают)
    var spec = {
      // дашборд за 14 дней (период по умолчанию); explicit — дашборд прошлой цели из карточки
      dashboard: function (goalId, explicit) {
        return { kind: 'dashboard', goalId: goalId, extra: '14', method: 'dashboard.get', params: explicit ? { goalId: goalId, periodDays: 14 } : { periodDays: 14 } };
      },
      // при активной цели список с ней (первой), без неё — только завершённые
      historyList: function () {
        var done = o.noGoal();
        return { kind: 'history.list', goalId: '', extra: done ? 'completed' : 'all', method: 'history.list', params: done ? { limit: 20, status: 'completed' } : { limit: 20 } };
      },
      // завершённая цель не меняется (кроме рефлексии); идущая в кэш не кладётся
      card: function (goalId) {
        return { kind: 'history.get', goalId: goalId, extra: '', method: 'history.get', params: { goalId: goalId }, immutable: true, cacheable: function (d) { return !!(d && d.result); } };
      },
      goal: function (goalId) { return { kind: 'goal.get', goalId: goalId, extra: '', method: 'goal.get', params: { goalId: goalId } }; }
    };

    // Запрос за свежим: один на вид+цель+уточнение. Дашборд и история ждут запись факта в очереди (иначе ответ мог бы прийти без неё).
    function fetchRead(s, reason, info) {
      return cache.load(s.kind, s.goalId, s.extra, function () {
        var q = o.writes;
        var wait = q && (s.kind === 'dashboard' || s.kind === 'history.list') && q.outstanding() ? q.idle() : Promise.resolve();
        return wait.then(function () { return o.call(s.method, s.params, { reason: reason, cached: info }); });
      }, { cacheable: s.cacheable });
    }

    // → { cached: {data, at}|null, fresh: Promise|null, shown() }. cached показывают сразу и вызывают shown() (замер для «Диагностики»);
    // fresh — запрос за свежим (null, если данные не меняются и они уже есть).
    var refreshedOnce = {};
    function read(s) {
      var t0 = clock();
      var hit = cache.get(s.kind, s.goalId, s.extra);
      var info = hit ? { ageMs: now() - hit.at, shownMs: null } : null;
      // неизменяемое из кэша обновляется один раз за сеанс (рефлексию мог поправить второй участник)
      var mark = s.kind + SEP + s.goalId + SEP + s.extra;
      var needFresh = !(hit && s.immutable && refreshedOnce[mark]);
      if (s.immutable) refreshedOnce[mark] = true;
      var fresh = needFresh ? fetchRead(s, 'tab', info) : null;
      return {
        cached: hit, fresh: fresh,
        shown: function () {
          if (!hit) return;
          info.shownMs = Math.round(clock() - t0);
          if (o.onShown) o.onShown({ method: s.method, at: now(), shownMs: info.shownMs, ageMs: info.ageMs, refreshed: needFresh });
        }
      };
    }

    // То же в фоне: результат только в кэш, ошибка молчит
    function prefetch(s) { return fetchRead(s, 'background', null).then(function (res) { return res; }, function () { return { ok: false }; }); }

    // Фон: один раз за сеанс после показа первого экрана, по очереди; действия пользователя не ждут. Открыл вкладку, пока её запрос идёт, — ждёт тот же.
    var started = false;
    function startBackground() {
      if (started) return false;
      var b = o.boot();
      if (!b || !b.cabinet || !b.me || (b.access !== 'active' && b.access !== 'readonly') || (b.consent && b.consent.required)) return false;
      started = true;
      var g = b.activeGoal;
      var items = null;
      var chain = Promise.resolve();
      function step(fn) { chain = chain.then(fn).then(null, function () { /* фон молчит */ }); }
      if (g) step(function () { return prefetch(spec.dashboard(g.id)); });
      step(function () {
        var s = spec.historyList();
        return prefetch(s).then(function (res) {
          var c = cache.get(s.kind, s.goalId, s.extra);
          items = res.ok ? res.data.items : (c ? c.data.items : null);
        });
      });
      step(function () { // последняя завершённая цель: карточка не меняется, если уже в кэше — запрос не нужен
        var last = (items || []).filter(function (it) { return it.status === 'completed'; })[0];
        if (!last || cache.get('history.get', last.goalId, '')) return null;
        return prefetch(spec.card(last.goalId));
      });
      if (g) step(function () { return prefetch(spec.goal(g.id)); }); // app.bootstrap не отдаёт startValue, targetValue, rev и действия — настройкам нужен goal.get
      return chain; // промис конца цепочки (нужен тестам; приложение его не ждёт)
    }

    return { spec: spec, read: read, prefetch: prefetch, startBackground: startBackground, fetchRead: fetchRead };
  }

  var api = { createDataCache: createDataCache, createTabData: createTabData, PREFIX: PREFIX, VERSION: VERSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.dataCache = api; }
})(globalThis);

;
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

;
// Тема (контракт 10): «Авто» / «Светлая» / «Тёмная». Выбор только на устройстве (localStorage, ключ tothegoal.theme), на сервер не уходит.
// «Авто» выбирает нашу палитру по Telegram.WebApp.colorScheme и следует за событием themeChanged; themeParams не используются.
(function (root) {
  'use strict';

  var KEY = 'tothegoal.theme';
  var PREFS = ['auto', 'light', 'dark'];
  // Цвета шапки, фона и нижней панели Telegram — те же, что --bg и --card в css/theme.css
  // btn/ink — цвет акцента (--btn-bg) и текст на нём (--btn-ink) для MainButton
  var TG_COLORS = { light: { bg: '#F7F3EC', bar: '#FFFDF9', btn: '#0B4A33', ink: '#F7F3EC' }, dark: { bg: '#121614', bar: '#1B201D', btn: '#E0D3B8', ink: '#121614' } };

  function normalize(pref) { return PREFS.indexOf(pref) >= 0 ? pref : 'auto'; }
  function resolve(pref, scheme) { return pref === 'light' || pref === 'dark' ? pref : scheme === 'dark' ? 'dark' : 'light'; }

  // o: getStorage() → Storage, getTg() → Telegram.WebApp | null, isDark() → bool (запасной вариант вне Telegram), root — элемент <html>
  function createTheme(o) {
    var mem = null;
    function store() { try { return o.getStorage ? o.getStorage() : null; } catch (e) { return null; } }
    function get() {
      var s = store();
      try { if (s) return normalize(s.getItem(KEY)); } catch (e) { /* хранилище недоступно */ }
      return normalize(mem);
    }
    function scheme() {
      var tg = o.getTg ? o.getTg() : null;
      if (tg && tg.colorScheme) return tg.colorScheme;
      return o.isDark && o.isDark() ? 'dark' : 'light';
    }
    function apply() {
      var name = resolve(get(), scheme());
      if (o.root) o.root.setAttribute('data-theme', name);
      var tg = o.getTg ? o.getTg() : null;
      if (tg) {
        var c = TG_COLORS[name];
        try { tg.setHeaderColor(c.bg); } catch (e) { /* старый клиент Telegram */ }
        try { tg.setBackgroundColor(c.bg); } catch (e) { /* старый клиент Telegram */ }
        try { tg.setBottomBarColor(c.bar); } catch (e) { /* старый клиент Telegram */ }
      }
      return name;
    }
    function set(pref) {
      var p = normalize(pref);
      mem = p;
      var s = store();
      try { if (s) s.setItem(KEY, p); } catch (e) { /* остаётся в памяти страницы */ }
      return apply();
    }
    function init() {
      var tg = o.getTg ? o.getTg() : null;
      if (tg && tg.onEvent) tg.onEvent('themeChanged', apply);
      return apply();
    }
    return { get: get, set: set, apply: apply, init: init, resolved: function () { return resolve(get(), scheme()); } };
  }

  var api = { KEY: KEY, PREFS: PREFS, TG_COLORS: TG_COLORS, resolve: resolve, createTheme: createTheme };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.theme = api; }
})(globalThis);

;
// Чистая логика выбора экрана (screens.md §1): разбор startapp, проверка env, стартовая логика.
// Без DOM и сети; браузер и Node.
(function (root) {
  'use strict';

  var CODE_RE = /^[A-Za-z0-9_-]{1,64}$/;

  // startapp: «fact», «inv_<код>», «act_<код>»; всё прочее — как будто параметра нет.
  function parseStartParam(raw) {
    if (typeof raw !== 'string') return { type: 'none' };
    var s = raw.trim();
    if (s === 'fact') return { type: 'fact' };
    if (s === 'today') return { type: 'today' }; // кнопки утреннего сообщения и итога дня: обычное «Сегодня»
    var m = /^(inv|act)_(.+)$/.exec(s);
    if (!m || !CODE_RE.test(m[2])) return { type: 'none' };
    if (m[1] === 'inv') return { type: 'invite', code: m[2] };
    // код активации: без пробелов и дефисов, в верхнем регистре (api.md access.activate)
    var act = m[2].replace(/[\s-]/g, '').toUpperCase();
    return act ? { type: 'activate', code: act } : { type: 'none' };
  }

  // Совпало ли окружение сервера с ожидаемым для этой сборки (dev-plan.md §3.1, п. 3).
  function checkEnv(actual, expected) {
    return typeof actual === 'string' && actual === expected;
  }

  // Какой экран показать после успешного app.bootstrap (env уже проверен).
  // Возвращает { screen, readOnly, factMode, inviteCode, activateCode }.
  function decideScreen(boot, start) {
    var st = start || { type: 'none' };
    var out = { screen: 'today', readOnly: false, factMode: false, inviteCode: null, activateCode: null };

    if (boot.consent && boot.consent.required) {
      out.screen = 'consent';
      return out;
    }

    // Экраны ввода кода (S-02 боевой) и email (S-04) существуют только в режиме codes; в бете (whitelist) — «Закрытая бета».
    var codes = boot.mode === 'codes';

    if (boot.access === 'none') {
      if (st.type === 'invite') {
        out.screen = 'invite';
        out.inviteCode = st.code;
      } else if (codes) {
        out.screen = 'activate';
        if (st.type === 'activate') out.activateCode = st.code; // подстановка из startapp=act_<код>
      } else {
        out.screen = 'noAccess';
      }
      return out;
    }

    out.readOnly = boot.access === 'readonly' || boot.role === 'readonly';

    if (!out.readOnly) {
      var p = boot.prompts || {};
      if (p.goalReached) { out.screen = 'goalReached'; return out; }
      if (p.reflectionGoalId) { out.screen = 'summary'; out.reflectionGoalId = p.reflectionGoalId; return out; } // итог цели S-33 раньше новой цели
      // целей не было никогда → мастер; активной нет, а архивные есть → «Нет активной цели» (S-41), ниже
      if (!boot.activeGoal && boot.role === 'owner' && !boot.hasArchivedGoals) { out.screen = 'wizard'; return out; }
      if (p.needsRecoveryEmail && codes) { out.screen = 'email'; return out; }
    }

    out.screen = 'today';
    if (!boot.activeGoal) { out.noGoal = true; return out; } // S-41: вкладки «Сегодня» и «Дашборд» показывают один экран
    out.factMode = st.type === 'fact' && !!boot.activeGoal && !out.readOnly;
    // Сегодня вне периода цели: today = null, today.get не вызываем (api.md app.bootstrap)
    var g = boot.activeGoal;
    if (g && !boot.today && boot.todayDate) {
      if (boot.todayDate < g.startDate) out.period = 'before';
      else if (boot.todayDate > g.endDate) out.period = 'after';
      if (out.period) out.factMode = false;
    }
    return out;
  }

  // Состояния без app.bootstrap (changelog (8), (9)): экран строится из ответа метода, лишний запрос стоит ~3 с на телефоне.
  // Все три функции возвращают новый boot (старый не меняют); экран по нему выбирает decideScreen.

  // goal.create: цель активна, «Сегодня» — из todayPlan; todayPlan = null (старт позже) → decideScreen даёт period = 'before'
  function bootAfterCreate(boot, data, sent) {
    var g = data.goal;
    var b = Object.assign({}, boot, { today: data.todayPlan, todayDate: data.todayDate,
      activeGoal: { id: g.id, title: g.title, unit: g.unit, direction: g.direction, startDate: g.startDate, endDate: g.endDate, inputMode: g.inputMode, status: g.status } });
    b.prompts = Object.assign({}, boot.prompts, { goalReached: false, reflectionGoalId: null, needsNewGoal: false });
    if (sent && sent.timezone && boot.cabinet) b.cabinet = Object.assign({}, boot.cabinet, { timezone: sent.timezone }); // пояс из запроса: cabinet в ответе не приходит
    return b;
  }

  // goal.complete: активной цели нет, архивные есть, рефлексия этой цели ждёт на экране итога S-33
  function bootAfterComplete(boot, goalId) {
    var b = Object.assign({}, boot, { activeGoal: null, today: null, hasArchivedGoals: true });
    b.prompts = Object.assign({}, boot.prompts, { goalReached: false, reflectionGoalId: goalId, needsNewGoal: true });
    return b;
  }

  // Закрыли S-33: рефлексия больше не показывается
  function bootAfterSummary(boot) {
    return Object.assign({}, boot, { prompts: Object.assign({}, boot.prompts, { reflectionGoalId: null }) });
  }

  // Экран для ошибок, которые нельзя исправить повтором (api.md §5).
  function screenForError(code) {
    if (code === 'network') return 'offline';
    if (code === 'auth_expired') return 'authExpired';
    if (code === 'auth_invalid') return 'authInvalid';
    if (code === 'version_unsupported') return 'update';
    return 'error';
  }

  // Кнопка Telegram «Сохранить» нужна только на экране «Сегодня» (вкладка «Сегодня», без подэкранов и справки).
  function saveButtonAllowed(desc, nav, helpOpen) {
    return !!desc && desc.screen === 'today' && !desc.readOnly && !desc.period && !desc.noGoal && !helpOpen && nav.tab === 'today' && nav.stack.length === 0;
  }

  var api = { parseStartParam: parseStartParam, checkEnv: checkEnv, decideScreen: decideScreen, screenForError: screenForError, saveButtonAllowed: saveButtonAllowed,
    bootAfterCreate: bootAfterCreate, bootAfterComplete: bootAfterComplete, bootAfterSummary: bootAfterSummary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.router = api; }
})(globalThis);

;
// Правила каркаса (screens.md §1, контракт 10): когда видны меню-пилюля, BackButton и MainButton «Сохранить». Без DOM; браузер и Node.
(function (root) {
  'use strict';

  var router = (typeof module !== 'undefined' && module.exports) ? require('./router.js') : root.GT.router;

  // Подэкраны вкладок, где меню нет (экраны-сценарии): мастер (из S-41 и «Повторить эту цель») и «Цель» S-51.
  // Остальные экраны без меню (S-02…S-06, S-33, S-40, загрузка, ошибки) — это отдельные экраны запуска (desc.screen ≠ 'today').
  var NO_MENU_SUB = { wizard: true, goalSettings: true };

  function top(nav) { return nav.stack.length ? nav.stack[nav.stack.length - 1].name : null; }

  // Меню-пилюля: на рабочих экранах («Сегодня», вкладки и их подэкраны, S-41); справка — поверх, меню скрыто.
  function menuVisible(desc, nav, helpOpen) {
    if (!desc || desc.screen !== 'today' || helpOpen) return false;
    return !NO_MENU_SUB[top(nav)];
  }

  // Экранная клавиатура: окно стало ниже самой большой высоты (> 20 %) и в фокусе поле ввода.
  function keyboardOpen(baseHeight, height, editing) {
    return !!editing && baseHeight > 0 && height < baseHeight * 0.8;
  }

  // BackButton: inner — выбор самого экрана: undefined — по умолчанию, false — скрыть, функция — свой шаг назад (шаг мастера).
  // Справка закрывается BackButton; на корневых экранах (вкладки без подэкрана, запуск, доступ, согласия, S-33, S-40) кнопки нет.
  function backVisible(desc, nav, helpOpen, inner) {
    if (helpOpen) return true;
    if (inner === false) return false;
    if (typeof inner === 'function') return true;
    return !!desc && desc.screen === 'today' && nav.stack.length > 0;
  }

  // MainButton «Сохранить»: только «Сегодня» (без подэкранов и справки) и только при несохранённом
  function mainButtonVisible(desc, nav, helpOpen, unsaved) {
    return !!unsaved && router.saveButtonAllowed(desc, nav, helpOpen);
  }

  // Значки пунктов меню (из design-preview): [тег, атрибуты] в SVG 24×24
  var TAB_ICONS = {
    today: [['path', { d: 'M8 2v4' }], ['path', { d: 'M16 2v4' }], ['rect', { width: '18', height: '18', x: '3', y: '4', rx: '2' }], ['path', { d: 'M3 10h18' }], ['path', { d: 'm9 16 2 2 4-4' }]],
    dashboard: [['line', { x1: '18', x2: '18', y1: '20', y2: '10' }], ['line', { x1: '12', x2: '12', y1: '20', y2: '4' }], ['line', { x1: '6', x2: '6', y1: '20', y2: '14' }]],
    history: [['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }], ['path', { d: 'M3 3v5h5' }], ['path', { d: 'M12 7v5l4 2' }]],
    settings: [['line', { x1: '21', x2: '14', y1: '4', y2: '4' }], ['line', { x1: '10', x2: '3', y1: '4', y2: '4' }], ['line', { x1: '21', x2: '12', y1: '12', y2: '12' }],
      ['line', { x1: '8', x2: '3', y1: '12', y2: '12' }], ['line', { x1: '21', x2: '16', y1: '20', y2: '20' }], ['line', { x1: '12', x2: '3', y1: '20', y2: '20' }],
      ['line', { x1: '14', x2: '14', y1: '2', y2: '6' }], ['line', { x1: '8', x2: '8', y1: '10', y2: '14' }], ['line', { x1: '16', x2: '16', y1: '18', y2: '22' }]]
  };

  var api = { NO_MENU_SUB: NO_MENU_SUB, TAB_ICONS: TAB_ICONS, menuVisible: menuVisible, keyboardOpen: keyboardOpen, backVisible: backVisible, mainButtonVisible: mainButtonVisible };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.chrome = api; }
})(globalThis);

;
// Поток запуска: app.bootstrap → проверка env → согласие → экран. Без DOM; браузер и Node.
// Экран сообщается через onScreen(descriptor); descriptor = { screen, boot?, error?, ... } (см. router.js).
(function (root) {
  'use strict';

  var router = (typeof module !== 'undefined' && module.exports) ? require('./router.js') : root.GT.router;

  // opts: api ({call}), expectedEnv, startParam (строка из Telegram), tz, onScreen(descriptor)
  function createFlow(opts) {
    var api = opts.api;
    var start = router.parseStartParam(opts.startParam);
    var state = { boot: null, descriptor: null };
    var bootRequestId = null;   // один requestId на «Повторить» после «Нет связи»
    var consentRetry = null;    // { version, requestId } — повтор согласия с тем же requestId

    function emit(d) {
      state.descriptor = d;
      opts.onScreen(d);
      return d;
    }

    function bootParams() {
      var p = {};
      if (opts.tz) p.tz = opts.tz;
      if (typeof opts.startParam === 'string' && opts.startParam) p.startParam = opts.startParam;
      return p;
    }

    // Запуск (и повторный запуск после согласия или «Повторить»).
    // Пока app.bootstrap в пути, повторный run() получает тот же запрос: за открытие он уходит один раз (api.md §4).
    // reason — причина запроса для «Диагностики»: 'start' (открытие приложения, по умолчанию) или 'action' (повтор, согласие, смена цели)
    var running = null;
    function run(reason) {
      if (running) return running;
      var p = running = runOnce(reason === 'action' ? 'action' : 'start');
      var done = function () { if (running === p) running = null; };
      p.then(done, done);
      return p;
    }
    function rerun() { return run('action'); }

    function runOnce(reason) {
      var callOpts = { reason: reason };
      if (bootRequestId) callOpts.requestId = bootRequestId;
      return api.call('app.bootstrap', bootParams(), callOpts).then(function (res) {
        if (!res.ok) {
          bootRequestId = res.error.code === 'network' ? res.requestId : null;
          return emit({ screen: router.screenForError(res.error.code), error: res.error });
        }
        bootRequestId = null;
        var boot = res.data;
        state.boot = boot;
        // Проверка окружения — до всего остального: неверная сборка ничего не показывает и не пишет.
        if (!router.checkEnv(boot.env, opts.expectedEnv)) {
          return emit({ screen: 'wrongEnv', expected: opts.expectedEnv, actual: boot.env == null ? '' : boot.env });
        }
        var d = router.decideScreen(boot, start);
        d.boot = boot;
        return emit(d);
      });
    }

    // Согласие S-05. Возвращает { ok:true } (экран уже сменился) или { ok:false, error, reloaded? }.
    function acceptConsent(version) {
      var reqId = consentRetry && consentRetry.version === version ? consentRetry.requestId : undefined;
      return api.call('consent.accept', { version: version }, reqId ? { requestId: reqId } : undefined).then(function (res) {
        if (res.ok) {
          consentRetry = null;
          return rerun().then(function () { return { ok: true }; });
        }
        if (res.error.code === 'consent_outdated') {
          consentRetry = null;
          return rerun().then(function () { return { ok: false, error: res.error, reloaded: true }; });
        }
        if (res.error.code === 'network') consentRetry = { version: version, requestId: res.requestId };
        else consentRetry = null;
        return { ok: false, error: res.error };
      });
    }

    // Любой вызов рабочего экрана идёт через call: общие реакции на ошибки собраны здесь.
    function call(method, params, callOpts) {
      return api.call(method, params, callOpts).then(function (res) {
        if (res.ok) return res;
        var code = res.error.code;
        if (code === 'consent_required') {
          return rerun().then(function () { return res; }); // bootstrap вернёт consent.required → S-05
        }
        if (code === 'auth_expired' || code === 'auth_invalid' || code === 'version_unsupported') {
          emit({ screen: router.screenForError(code), error: res.error });
        }
        return res;
      });
    }

    return {
      run: run,
      retry: rerun,
      acceptConsent: acceptConsent,
      call: call,
      get state() { return state; }
    };
  }

  var api = { createFlow: createFlow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.flow = api; }
})(globalThis);

;
// Расчёты заглушки (brief.md §4–§5, api.md §1). Упрощённая копия логики ядра: заглушка не обязана
// совпадать с сервером до последней цифры, но формулы те же, а формы ответов проверяются по фикстурам.
// Чистые функции без DOM и сети; браузер и Node.
(function (root) {
  'use strict';

  // ---------- даты (строки YYYY-MM-DD) ----------
  function dayNum(s) {
    var p = String(s).split('-');
    return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  }
  function dayStr(n) {
    var d = new Date(n * 86400000);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
  }
  function addDays(s, n) { return dayStr(dayNum(s) + n); }
  function diffDays(a, b) { return dayNum(a) - dayNum(b); } // a − b

  // Дата «сегодня» в поясе кабинета.
  function todayIn(tz, nowMs) {
    try {
      var parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(nowMs));
      if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) return parts;
    } catch (e) { /* неизвестный пояс — UTC */ }
    return new Date(nowMs).toISOString().slice(0, 10);
  }
  function validTz(tz) {
    try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }); return typeof tz === 'string' && tz.length > 0; } catch (e) { return false; }
  }
  function isDate(s) {
    return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && dayStr(dayNum(s)) === s;
  }

  // ---------- числа ----------
  // Округление вверх, устойчивое к ошибкам плавающей запятой: 15 × 1,0000000001 = 15, а не 16.
  function ceilStable(x) { return Math.ceil(Math.round(x * 1e6) / 1e6); }
  function round2(x) { return Math.round(x * 100) / 100; }

  // percentRaw — без ограничения (число с 2 знаками), percent — целое 0–100.
  function pair(rawFraction) {
    var raw = round2(rawFraction * 100);
    return { percent: Math.max(0, Math.min(100, Math.round(raw))), percentRaw: raw };
  }

  // ---------- цель ----------
  function periodDays(startDate, endDate) { return diffDays(endDate, startDate) + 1; }
  function baseRateOf(startValue, targetValue, startDate, endDate) {
    return Math.abs(targetValue - startValue) / periodDays(startDate, endDate);
  }

  // Значение цели на конец даты (data-model.md ProgressEntry). entries: [{date, memberId, value}]
  function valueAt(goal, entries, date) {
    if (goal.inputMode === 'delta') {
      var sum = 0;
      entries.forEach(function (e) { if (e.date <= date) sum += e.value; });
      return goal.startValue + sum;
    }
    var best = null;
    entries.forEach(function (e) { if (e.date <= date && (!best || e.date >= best.date)) best = e; });
    return best ? best.value : goal.startValue;
  }

  function remaining(goal, value) {
    return goal.direction === 'growth' ? goal.targetValue - value : value - goal.targetValue;
  }

  // Прогресс к цели 0..1 (без ограничения): откат даёт < 0, перевыполнение > 1.
  function progressFraction(goal, value) {
    var total = Math.abs(goal.targetValue - goal.startValue);
    if (total === 0) return 0;
    return goal.direction === 'growth' ? (value - goal.startValue) / total : (goal.startValue - value) / total;
  }

  // ---------- нормы ----------
  // Версия действия на дату: последняя с effectiveFrom ≤ date (ActionVersion).
  function versionFor(action, date) {
    var v = action.versions[0];
    action.versions.forEach(function (x) { if (x.effectiveFrom <= date && x.effectiveFrom >= v.effectiveFrom) v = x; });
    return v;
  }

  // Коэффициент дня T: по значению на конец T−1 и оставшимся дням с T до окончания включительно.
  function coefficientFor(goal, entries, date) {
    var value = valueAt(goal, entries, addDays(date, -1));
    var rem = remaining(goal, value);
    if (rem <= 0) return 1; // цель достигнута: нормы стартовые
    var daysLeft = Math.max(1, diffDays(goal.endDate, date) + 1);
    return (rem / daysLeft) / goal.baseRate;
  }

  // Норма действия при коэффициенте coeff → { norm, normBeforeCeiling, startNorm }.
  function normFor(version, coeff) {
    var start = version.startNorm;
    if (!version.growsOnLag) return { norm: start, normBeforeCeiling: start, startNorm: start };
    var before = Math.max(start, ceilStable(start * coeff));
    var norm = before;
    if (version.normCeiling != null) norm = Math.min(before, ceilStable(start * version.normCeiling));
    return { norm: norm, normBeforeCeiling: before, startNorm: start };
  }

  // Предупреждение: норма до потолка больше чем в 2 раза выше стартовой (brief.md §4).
  function warns(n) { return n.startNorm > 0 && n.normBeforeCeiling > 2 * n.startNorm + 1e-9; }

  // ---------- день ----------
  // План/факт одного участника: acts — [{norm, value|null}] по действиям «в плане».
  function planFact(acts) {
    var done = 0;
    var capSum = 0;
    var rawSum = 0;
    acts.forEach(function (a) {
      var v = a.value == null ? 0 : a.value;
      var r = a.norm > 0 ? v / a.norm : 0;
      if (v >= a.norm) done++;
      capSum += Math.min(r, 1);
      rawSum += r;
    });
    var n = acts.length;
    var p = pair(n ? capSum / n : 0);
    return { doneCount: done, totalCount: n, percent: p.percent, percentRaw: n ? round2(rawSum / n * 100) : 0 };
  }

  var api = {
    dayNum: dayNum, dayStr: dayStr, addDays: addDays, diffDays: diffDays, todayIn: todayIn, validTz: validTz, isDate: isDate,
    ceilStable: ceilStable, round2: round2, pair: pair,
    periodDays: periodDays, baseRateOf: baseRateOf, valueAt: valueAt, remaining: remaining, progressFraction: progressFraction,
    versionFor: versionFor, coefficientFor: coefficientFor, normFor: normFor, warns: warns, planFact: planFact
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.mockCalc = api; }
})(globalThis);

;
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

;
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

  // Проверка согласия на здоровье по api.md §7 («после прав и валидации params, до записи»): server.js взводит её
  // перед методом, а validator.done() срабатывает после проверки полей — ошибка валидации приходит раньше health_consent_required.
  var armedHealth = null;
  function armHealthGuard(fn) { armedHealth = fn; }

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
      done: function () {
        if (fields.length) throw fail('validation_failed', { fields: fields });
        if (armedHealth) { var guard = armedHealth; armedHealth = null; guard(); }
      }
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
  // Участники цели: вышедшие после отзыва согласия на сведения о здоровье (Goal.leftMemberIds) не учитываются (api.md, контракт 10.1)
  function goalMembers(S, goal) {
    var left = goal.leftMemberIds || [];
    return activeMembers(S).filter(function (m) { return left.indexOf(m.id) < 0; });
  }

  // ---------- согласие на сведения о здоровье (контракты 10, 10.1) ----------
  // Умолчания как у сервера: версия "1", группы ["body","habits"]. У пресетов заглушки поля group нет (придёт с контрактом 11),
  // поэтому требование срабатывает, только когда в S.presetGroups задано соответствие «пресет → группа» (тесты и сценарии health-*).
  var HEALTH_METHODS = ['goal.create', 'goal.update', 'goal.complete', 'goal.raiseBar', 'goal.dismissReached',
    'action.create', 'action.update', 'action.archive', 'task.create', 'task.update', 'task.setDone', 'task.archive',
    'fact.set', 'day.save', 'day.completeAll', 'day.finish', 'reflection.save'];
  function healthVersion(S) { return S.healthVersion || '1'; }
  function healthGroups(S) { return S.healthGroups || ['body', 'habits']; }
  function healthView(S) {
    var u = S.user;
    var acceptedVersion = u && u.healthConsentVersion || null;
    return { given: acceptedVersion !== null && acceptedVersion === healthVersion(S), version: healthVersion(S),
      acceptedVersion: acceptedVersion, acceptedAt: u && u.healthConsentAt || null };
  }
  function isHealthGoal(S, goal) {
    var g = goal && goal.presetId && S.presetGroups && S.presetGroups[goal.presetId];
    return !!g && healthGroups(S).indexOf(g) >= 0;
  }
  // Правило для 17 методов записи: цель группы здоровья (по цели, действию или задаче) и нет действующего согласия → health_consent_required
  function healthGuard(ctx, method, p) {
    var S = ctx.S;
    if (HEALTH_METHODS.indexOf(method) < 0 || healthView(S).given) return;
    var goal = null;
    if (method === 'goal.create') goal = { presetId: p.presetId };
    else if (p.goalId) goal = S.goals.find(function (g) { return g.id === p.goalId; });
    else {
      var item = p.actionId ? S.actions.find(function (a) { return a.id === p.actionId; })
        : p.taskId ? S.tasks.find(function (t) { return t.id === p.taskId; }) : null;
      goal = item && S.goals.find(function (g) { return g.id === item.goalId; });
    }
    if (isHealthGoal(S, goal)) throw fail('health_consent_required', { version: healthVersion(S) });
  }
  function removeGoalData(S, goalIds, memberId) { // memberId не задан → цели целиком; задан → только данные этого участника
    var own = function (x) { return memberId == null || x.ownerMemberId === memberId; };
    var gone = S.actions.filter(function (a) { return goalIds.indexOf(a.goalId) >= 0 && own(a); }).map(function (a) { return a.id; });
    S.actions = S.actions.filter(function (a) { return gone.indexOf(a.id) < 0; });
    Object.keys(S.facts).forEach(function (k) { if (gone.indexOf(k.split('|')[0]) >= 0) delete S.facts[k]; });
    Object.keys(S.plans).forEach(function (k) { if (gone.indexOf(k.split('|')[2]) >= 0) delete S.plans[k]; });
    var mine = function (x, id) { return goalIds.indexOf(x.goalId) >= 0 && (memberId == null || id === memberId); };
    S.progress = S.progress.filter(function (e) { return !mine(e, e.memberId); });
    S.reflections = S.reflections.filter(function (r) { return !mine(r, r.authorMemberId); });
    if (memberId == null) {
      S.tasks = S.tasks.filter(function (t) { return goalIds.indexOf(t.goalId) < 0; });
      S.revisions = S.revisions.filter(function (r) { return goalIds.indexOf(r.goalId) < 0; });
    } else {
      S.tasks.forEach(function (t) {
        if (goalIds.indexOf(t.goalId) >= 0) t.assigneeMemberIds = t.assigneeMemberIds.filter(function (id) { return id !== memberId; });
      });
    }
  }

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
      members: goalMembers(S, goal).map(function (m) {
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

  // «Повторить эту цель» (goal.complete, history.get): заготовка мастера. suggestedStartValue: цель-уровень (current) — последнее значение, цель-сумма (delta) — 0.
  function repeatOf(ctx, goal) {
    var S = ctx.S;
    var active = activeMembers(S).map(function (m) { return m.id; });
    return {
      presetId: goal.presetId, title: goal.title, unit: goal.unit, direction: goal.direction, inputMode: goal.inputMode, targetValue: goal.targetValue,
      suggestedStartValue: goal.inputMode === 'current' ? goal.result.finalValue : 0, periodDays: K.periodDays(goal.startDate, goal.endDate),
      actions: actionsOf(S, goal.id, null, true).filter(function (a) { return active.indexOf(a.ownerMemberId) >= 0; }).map(function (a) {
        var ver = lastVersion(a);
        return { ownerMemberId: a.ownerMemberId, title: a.title, unit: a.unit, startNorm: ver.startNorm, growsOnLag: ver.growsOnLag, inPlan: a.inPlan,
          countStreak: a.countStreak, normCeiling: ver.normCeiling == null ? null : ver.normCeiling, step: a.step };
      })
    };
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
      mode: S.mode, env: S.env, consent: consent, healthConsent: healthView(S),
      user: { id: S.user.id, telegramId: S.user.telegramId, firstName: S.user.firstName, username: S.user.username },
      me: access === 'none' ? null : { memberId: me.id }, // своя запись в кабинете; клиент ищет себя по ней, а не по роли
      notifyStatus: S.user.notifyStatus, access: access, role: role,
      cabinet: access === 'none' ? null : cabinetBrief(ctx),
      activeGoal: access === 'none' || !goal ? null : goalBrief(goal),
      hasArchivedGoals: access !== 'none' && S.goals.some(function (g) { return g.status === 'completed'; }),
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

  M['healthConsent.accept'] = function (ctx, p) {
    var S = ctx.S;
    var v = validator(p);
    var version = v.str('version');
    v.done();
    if (version !== healthVersion(S)) throw fail('health_consent_outdated');
    S.user.healthConsentVersion = version;
    S.user.healthConsentAt = ctx.nowIso; // повтор с той же версией перезаписывает время
    if (ctx.me) { // возврат участника: он снова в целях кабинета, план/факт считается с даты возврата
      S.goals.forEach(function (g) {
        var i = (g.leftMemberIds || []).indexOf(ctx.me.id);
        if (i < 0) return;
        g.leftMemberIds.splice(i, 1);
        g.returnedOn = g.returnedOn || {};
        g.returnedOn[ctx.me.id] = ctx.today;
      });
    }
    return { healthConsent: healthView(S) };
  };

  M['healthConsent.revoke'] = function (ctx) {
    var S = ctx.S;
    var deletedGoals = 0;
    var leftGoals = 0;
    if (S.cabinet && ctx.me) {
      var health = S.goals.filter(function (g) { return isHealthGoal(S, g); });
      if (ctx.role === 'owner') { // цели групп здоровья удаляются целиком, с данными всех участников
        var ids = health.map(function (g) { return g.id; });
        removeGoalData(S, ids, null);
        S.goals = S.goals.filter(function (g) { return ids.indexOf(g.id) < 0; });
        deletedGoals = ids.length;
      } else { // участник: удаляются только его данные, он выходит из целей, цели остаются у остальных
        health.forEach(function (g) {
          if ((g.leftMemberIds || []).indexOf(ctx.me.id) >= 0) return;
          removeGoalData(S, [g.id], ctx.me.id);
          g.leftMemberIds = (g.leftMemberIds || []).concat(ctx.me.id);
          leftGoals++;
        });
      }
    }
    S.user.healthConsentVersion = null;
    S.user.healthConsentAt = null;
    return { healthConsent: healthView(S), deletedGoals: deletedGoals, leftGoals: leftGoals };
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
    var startDate = v.date('startDate', { optional: true });
    var endDate = v.date('endDate');
    if (p.presetId != null && PRESET_IDS.indexOf(p.presetId) < 0) v.bad('presetId', 'bad_format');
    if (p.timezone != null && !K.validTz(p.timezone)) v.bad('timezone', 'bad_format');
    if (!Array.isArray(p.actions)) v.bad('actions', 'required');
    if (p.tasks != null && !Array.isArray(p.tasks)) v.bad('tasks', 'bad_format');
    v.done();
    // «сегодня» кабинета считается с учётом timezone из запроса; startDate не передан → старт сегодня, допустимо сегодня…+14 дней (api.md goal.create)
    var todayDate = K.todayIn(p.timezone || S.cabinet.timezone, ctx.nowMs);
    if (startDate === undefined) startDate = todayDate;
    if (startValue === targetValue) v.bad('targetValue', 'out_of_range');
    if (direction === 'growth' && targetValue < startValue) v.bad('targetValue', 'out_of_range');
    if (direction === 'decline' && targetValue > startValue) v.bad('targetValue', 'out_of_range');
    if (startDate > endDate || K.periodDays(startDate, endDate) < 2) v.bad('endDate', 'out_of_range');
    if (startDate < todayDate || startDate > K.addDays(todayDate, 14)) v.bad('startDate', 'out_of_range');
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
    ctx.today = todayDate;
    // todayPlan = null, если цель начнётся позже: экран «Цель начнётся» строится из ответа без app.bootstrap
    return { goal: pubGoal(r.goal), actions: r.actions.map(pubAction), tasks: r.tasks.map(pubTask), todayDate: todayDate,
      todayPlan: startDate > todayDate ? null : todayView(ctx, r.goal, ctx.today) };
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
    return { goal: pubGoal(g), result: result, repeat: repeatOf(ctx, g), prompts: { reflectionGoalId: g.id, needsNewGoal: true } };
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
      days.push({ date: d, open: g.status !== 'completed' && d === ctx.today, progressDelta: K.round2(delta), perMember: goalMembers(S, g).map(function (m) {
        var pf = planFactOf(ctx, g, m.id, d);
        return { memberId: m.id, percent: pf.percent, percentRaw: pf.percentRaw, missing: !dayEntered(S, g, m.id, d) };
      }) });
    }
    var outcome = g.status === 'completed' ? { state: g.result.outcome, finalValue: g.result.finalValue } : { state: 'running' };
    return {
      goal: pubGoal(g),
      progress: { currentValue: K.round2(value), startValue: g.startValue, targetValue: g.targetValue, percent: pr.percent, percentRaw: pr.percentRaw, remaining: K.round2(rem) },
      forecast: { date: forecastDate, avgPace7d: K.diffDays(upTo, g.startDate) < 1 ? null : K.round2(pace), onTrack: forecastDate !== null && forecastDate <= g.endDate },
      planFact: goalMembers(S, g).map(function (m) { return planFactPeriod(ctx, g, m.id, upTo); }),
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
    var status = v.oneOf('status', ['completed'], { optional: true }); // только архивные цели
    v.done();
    var offset = p.cursor == null ? 0 : parseInt(p.cursor, 10);
    if (!(offset >= 0)) throw fail('validation_failed', { fields: [{ field: 'cursor', code: 'bad_format' }] });
    var all = S.goals.filter(function (g) { return g.status === 'active' && !status; })
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
      goal: pubGoal(g), result: g.result, repeat: g.result ? repeatOf(ctx, g) : null,
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
    // естественная идемпотентность, журнала повторов нет (api.md §2 п. 7, контракт 10.1)
    'healthConsent.accept': { roles: ANY, write: true, journal: false }, 'healthConsent.revoke': { roles: ANY, write: true, journal: false },
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

  var api = { M: M, ACCESS: ACCESS, healthGuard: healthGuard, armHealthGuard: armHealthGuard, NOT_AVAILABLE: NOT_AVAILABLE, CODES_ONLY: CODES_ONLY, PUBLIC: PUBLIC, fail: fail,
    core: { createGoalCore: createGoalCore, completeCore: completeCore, activeGoal: activeGoal, memberById: memberById, dayNorms: dayNorms,
      activeMembers: activeMembers, setFact: setFact, pubGoal: pubGoal, pubAction: pubAction, noteReached: noteReached },
    PRESET_IDS: PRESET_IDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.mockMethods = api; }
})(globalThis);

;
// Заготовки данных для сценариев заглушки (параметр страницы ?scenario=…). Секретов и настоящих ID здесь нет.
//
//   new       первый вход: согласие → кабинет без цели (мастер)
//   outdated  как new, но политика сменится при первом согласии (consent_outdated)
//   health-new   как new, но пресет «Вес» требует согласия на сведения о здоровье (health_consent_required → S-06)
//   health-left  участник пары вышел из цели группы здоровья (нет согласия): цель только для чтения, без его плана
//   noaccess  согласие дано, ID нет в белом списке: «закрытая бета»
//   invited   нет доступа, но есть приглашение inv_MOCKINVITE01 в чужой кабинет
//   active    кабинет, цель на 30 дней (9 дней истории, «сегодня» не внесено)
//   pair      как active, но в кабинете двое (?as=participant — войти вторым участником)
//   reached   цель уже достигнута (экран «Цель достигнута»)
//   finished  цель завершена, ждёт рефлексии; новой цели нет
//   ended     цель активна, но её период закончился (today = null, экран завершённого периода)
//   notstarted  цель активна, но начнётся через 5 дней (today = null, «Цель начнётся ДД.ММ»)
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

  var BASES = ['new', 'outdated', 'health-new', 'health-left', 'noaccess', 'invited', 'active', 'pair', 'reached', 'finished', 'ended', 'notstarted', 'readonly',
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
    if (base === 'health-new') { S.presetGroups = { weight: 'body' }; base = 'new'; } // пресет «Вес» требует согласия на сведения о здоровье
    if (base === 'health-left') { S.presetGroups = { sport: 'body' }; base = 'pair'; as = 'participant'; } // участник без согласия уже вышел из цели
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
    var offset = base === 'finished' || base === 'ended' ? 40 : base === 'notstarted' ? -5 : 9;
    var r = sportGoal(ctx, owner, second ? [second] : [], offset, 30);
    var goal = r.goal;

    if (base === 'finished') {
      goal.endDate = K.addDays(ctx.today, -10);
      fillHistory(ctx, goal, members, K.periodDays(goal.startDate, goal.endDate), 3.5);
      Mth.core.completeCore(Object.assign({}, ctx, { today: goal.endDate }), goal, 'system');
      return;
    }

    if (base === 'notstarted') return;
    if (base === 'ended') { fillHistory(ctx, goal, members, K.periodDays(goal.startDate, goal.endDate), 1.5); return; }
    fillHistory(ctx, goal, members, 9, 3);
    if (base === 'reached') {
      S.progress.push({ goalId: goal.id, date: K.addDays(ctx.today, -1), memberId: owner.id, value: 80, updatedAt: ctx.nowIso });
      Mth.core.noteReached(ctx, goal);
    }
    // сегодня внесено только первое действие первого участника: «—» у остальных
    var first = S.actions.find(function (a) { return a.goalId === goal.id && a.ownerMemberId === owner.id; });
    Mth.core.setFact(S, first.id, ctx.today, first.versions[0].startNorm);
    if (sc.base === 'health-left') Mth.M['healthConsent.revoke'](Object.assign({}, ctx, { me: me, role: me.role }));
  }

  var api = { SCENARIOS: SCENARIOS, resolve: resolve, blank: blank, seed: seed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.mockScenarios = api; }
})(globalThis);

;
// Заглушка сервера по контракту (api.md): конвейер §2, идемпотентность, роли, сценарии сбоев.
// createMock({ scenario, as, env, storage, now, rand, latencyMs, reset }) → { handle, fetch, state, scenarios }.
//   handle(envelope) → объект ответа (синхронно, для тестов); fetch(url, init) → как настоящий fetch (для клиента).
//   storage — localStorage-подобный объект ({getItem,setItem,removeItem}) или null: сохранение на время разработки.
(function (root) {
  'use strict';

  var dep = function (file, name) { return typeof module !== 'undefined' && module.exports ? require(file) : root.GT[name]; };
  var K = dep('./calc.js', 'mockCalc');
  var Mth = dep('./methods.js', 'mockMethods');
  var Sc = dep('./scenarios.js', 'mockScenarios');

  var RETRYABLE = { busy: true, request_in_progress: true, service_busy: true, unavailable: true };
  var ALPH = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // как у ULID: без I, L, O, U

  function stable(x) {
    if (Array.isArray(x)) return '[' + x.map(stable).join(',') + ']';
    if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(x[k]); }).join(',') + '}';
    return JSON.stringify(x === undefined ? null : x);
  }

  function createMock(opts) {
    var o = opts || {};
    var scenario = o.scenario || 'new';
    var as = o.as || 'owner';
    var env = o.env || 'dev';
    var rand = o.rand || Math.random;
    var nowFn = o.now || Date.now;
    var storage = o.storage || null;
    var latencyMs = o.latencyMs || 0;
    var sc = Sc.resolve(scenario);
    var key = 'gt-mock:v2:' + scenario + ':' + as;
    var flags = { busyLeft: sc.flag === 'busy' ? 2 : 0, flakyLeft: sc.flag === 'flaky' ? 2 : 0 };

    function randomCode(n) {
      var s = '';
      for (var i = 0; i < n; i++) s += ALPH[Math.floor(rand() * 32)];
      return s;
    }
    function newId(S, prefix) {
      S.seq++;
      var head = '';
      var n = S.seq;
      for (var i = 0; i < 8; i++) { head = ALPH[n % 32] + head; n = Math.floor(n / 32); }
      return prefix + '_' + head + randomCode(18);
    }
    function baseCtx(S) {
      var nowMs = nowFn();
      var tz = S.cabinet ? S.cabinet.timezone : 'Europe/Moscow';
      return { S: S, nowMs: nowMs, nowIso: new Date(nowMs).toISOString().replace(/\.\d+Z$/, 'Z'), today: K.todayIn(tz, nowMs),
        newId: function (p) { return newId(S, p); }, randomCode: randomCode, me: null, role: 'none' };
    }

    function load() {
      if (storage && !o.reset) {
        try {
          var raw = storage.getItem(key);
          if (raw) { var s = JSON.parse(raw); if (s && s.schema === 2) return s; }
        } catch (e) { /* повреждённое сохранение — начнём заново */ }
      }
      var S = Sc.blank(env);
      Sc.seed(baseCtx(S), scenario, as);
      return S;
    }
    var S = load();
    if (sc.flag === 'wrongenv') S.env = 'beta'; else S.env = env;

    function persist() {
      if (!storage) return;
      try { storage.setItem(key, JSON.stringify(S)); } catch (e) { /* переполнено или запрещено — не критично */ }
    }
    if (o.reset && storage) { try { storage.removeItem(key); } catch (e) { /* ничего */ } }
    persist();

    function ok(requestId, data, replayed) {
      return { v: 1, ok: true, requestId: requestId, replayed: !!replayed, serverTime: baseCtx(S).nowIso, data: data };
    }
    function err(requestId, code, details, retryAfterSec) {
      return { v: 1, ok: false, requestId: requestId, serverTime: baseCtx(S).nowIso,
        error: { code: code, message: code, retryable: !!RETRYABLE[code], retryAfterSec: retryAfterSec == null ? null : retryAfterSec, details: details || null } };
    }

    function handle(env_) {
      var requestId = env_ && typeof env_.requestId === 'string' ? env_.requestId : '';
      try { return pipeline(env_, requestId); } catch (e) {
        if (e && e.api) return err(requestId, e.api.code, e.api.details, e.api.retryAfterSec);
        return err(requestId, 'internal', { errorId: 'mock-' + (e && e.message ? String(e.message).slice(0, 40) : 'unknown') });
      }
    }

    function pipeline(e, requestId) {
      // 1. конверт
      if (!e || typeof e !== 'object' || typeof e.method !== 'string') throw Mth.fail('bad_request');
      if (e.v !== 1) throw Mth.fail('version_unsupported');
      var method = e.method;
      var def = Mth.ACCESS[method];
      // оплата, коды, email для восстановления — только режим codes; админка и экспорт в бете недоступны всегда
      var na = Mth.NOT_AVAILABLE.indexOf(method) >= 0 || (Mth.CODES_ONLY.indexOf(method) >= 0 && S.mode !== 'codes');
      if (!def && !na) throw Mth.fail('bad_request');
      var params = e.params && typeof e.params === 'object' && !Array.isArray(e.params) ? e.params : {};
      var isPublic = Mth.PUBLIC.indexOf(method) >= 0;
      // 3. initData (в заглушке — любая непустая строка) и срок
      if (!isPublic) {
        if (typeof e.initData !== 'string' || !e.initData) throw Mth.fail('auth_invalid');
        if (sc.flag === 'expired') throw Mth.fail('auth_expired');
      }
      if (na) throw Mth.fail('not_available');

      var ctx = baseCtx(S);
      // 4. согласие
      var consented = !!(S.user && S.user.consentVersion === S.policyVersion);
      if (def.consent !== false && !consented) throw Mth.fail('consent_required', { version: S.policyVersion });
      // 5. роль
      var me = S.meMemberId ? Mth.core.memberById(S, S.meMemberId) : null;
      var role = 'none';
      if (me && S.cabinet && me.status !== 'left') role = me.status === 'active' && S.cabinet.status === 'active' ? me.role : 'readonly';
      ctx.me = me && role !== 'none' ? me : null;
      ctx.role = role;
      if (def.roles !== 'any' && def.roles.indexOf(role) < 0) {
        if (role === 'none') throw Mth.fail('access_required');
        if (def.wrongRole) throw Mth.fail(def.wrongRole); // invite.accept уже состоящему в кабинете
        if (role === 'readonly' && def.write) throw Mth.fail('read_only');
        throw Mth.fail('forbidden');
      }
      // 6–7. сбои сценариев и идемпотентность (методы записи)
      var journaled = def.write && def.journal !== false; // у fact.set, day.save, day.completeAll, day.finish журнала повторов нет
      if (def.write) {
        if (!requestId && journaled) throw Mth.fail('bad_request', { fields: [{ field: 'requestId', code: 'required' }] });
        if (flags.busyLeft > 0) { flags.busyLeft--; throw Mth.fail('busy'); }
        if (sc.flag === 'ratelimit' && method !== 'consent.accept') throw Mth.fail('rate_limited', null, 30);
      }
      var logKey = (S.user ? S.user.id : 'anon') + '|' + requestId;
      var hash = stable(params);
      if (journaled) {
        var prev = S.reqLog[logKey];
        if (prev) {
          if (prev.hash !== hash || prev.method !== method) throw Mth.fail('request_conflict');
          return ok(requestId, JSON.parse(prev.data), true);
        }
      }
      // 7а. согласие на сведения о здоровье: после прав и валидации params, до записи (срабатывает в validator.done())
      Mth.armHealthGuard(function () { Mth.healthGuard(ctx, method, params); });
      // 8. выполнение
      var data;
      try { data = Mth.M[method](ctx, params); } finally { Mth.armHealthGuard(null); }
      if (journaled) {
        S.reqLog[logKey] = { hash: hash, method: method, data: JSON.stringify(data) };
        persist();
      } else if (def.write || method === 'app.bootstrap') persist();
      return ok(requestId, data, false);
    }

    function textReply(text) { return { ok: true, status: 200, text: function () { return Promise.resolve(text); } }; }

    // Поддельный fetch для клиента: добавляет задержку и сбои транспорта по сценарию.
    function fetchFn(url, init) {
      return new Promise(function (resolve, reject) {
        var body;
        try { body = JSON.parse(init.body); } catch (e) { return reject(new Error('bad body')); }
        if (sc.flag === 'offline') return resolve(textReply('<html>offline</html>'));
        if (flags.flakyLeft > 0) { flags.flakyLeft--; return resolve(textReply('<html>404</html>')); }
        var delay = sc.flag === 'slow' ? 3000 : latencyMs;
        setTimeout(function () { resolve(textReply(JSON.stringify(handle(body)))); }, delay);
      });
    }

    return { handle: handle, fetch: fetchFn, get state() { return S; }, scenarios: Sc.SCENARIOS };
  }

  var api = { createMock: createMock, SCENARIOS: Sc.SCENARIOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.mock = api; }
})(globalThis);

;
// Логика экрана «Сегодня» (S-10) без DOM: явное сохранение дня (screens.md §3.3, §5; api.md §4, §11).
//
// МОДЕЛЬ. Нажатия «−», «+», «Норма выполнена», ввод числа и прогресс цели меняют ТОЛЬКО экран (черновик): запросов нет.
// Черновик (отличия экрана от того, что на сервере) хранится в localStorage по кабинету, цели и дате (createStore: чтение и запись
// в try/catch, если localStorage недоступен — живёт в памяти страницы). Несохранённое уходит одним day.save со всем днём
// (save: кнопка Telegram MainButton «Сохранить»). «Все нормы выполнены» и «Готово на сегодня» сохраняют сразу: несохранённые
// facts и progress едут в том же запросе. «Отменить» после «Все нормы» возвращает прежние значения через day.save.
//
// ЗАПИСЬ (day.save, day.completeAll, day.finish) — правила, потому что сервер не хранит журнал повторов для этих методов:
// повтор запроса выполняется заново и может затереть более новое значение.
//  1. Не больше ОДНОГО запроса записи одновременно: общая очередь (createWriteQueue) на всю сессию, а не на экран;
//     пока идёт «Сохранить», второе нажатие запроса не отправляет.
//  2. Повтор после ошибки допустим, только если после запроса экран не менялся. Иначе автоповторы клиента API отменяются
//     (canRetry → 'superseded'), черновик остаётся несохранённым, а «Сохранить» отправляет актуальные значения всего дня.
//  3. Перед загрузкой другого дня черновик уже лежит в хранилище: дни не теряют введённое, у каждого дня свой черновик.
// Счётчик taps — число нажатий пользователя (для проверки схемы нажатий screens.md §5; «Сохранить» — одно нажатие).
(function (root) {
  'use strict';

  var F = typeof module !== 'undefined' && module.exports ? require('./format.js') : root.GT.format;

  // Ошибки, при которых кнопка «Повторить» имеет смысл (rate_limited: клиент сам не повторяет, но человек может нажать после паузы)
  var RETRYABLE = { network: true, unavailable: true, busy: true, service_busy: true, request_in_progress: true, internal: true, rate_limited: true };

  // Ответы, после которых черновик дня теряет смысл (цель уже не активна)
  // (в каталоге ошибок api.md §5 есть только not_found, но changelog (7) называет goal_not_found: обрабатываем оба; для day.save,
  // day.completeAll и day.finish «не найдено» может относиться только к цели или действиям этой цели)
  var GOAL_GONE = { goal_archived: true, goal_not_found: true, not_found: true };

  // Очередь записи: задачи выполняются строго по одной. Один экземпляр на сессию (на кабинет).
  function createWriteQueue() {
    var tail = Promise.resolve();
    var n = 0;
    function idle() {
      var t = tail;
      return t.then(function () { return t === tail ? undefined : idle(); });
    }
    function run(fn) {
      n++;
      var p = tail.then(fn);
      tail = p.then(function () {}, function () {});
      return p.then(function (r) { n--; return r; }, function (e) { n--; throw e; });
    }
    return { run: run, idle: idle, outstanding: function () { return n; } };
  }

  // Хранилище значений по ключу (черновики дней, кэш последнего «Сегодня»): localStorage в try/catch + копия в памяти.
  // getStorage() → объект с getItem/setItem/removeItem или null. Любая ошибка доступа не ломает экран.
  function createStore(getStorage, prefix) {
    var mem = {};
    var pre = prefix || '';
    function st() { try { return getStorage ? getStorage() : null; } catch (e) { return null; } }
    return {
      get: function (key) {
        if (Object.prototype.hasOwnProperty.call(mem, key)) return mem[key];
        try {
          var s = st();
          var raw = s ? s.getItem(pre + key) : null;
          if (raw) { var v = JSON.parse(raw); mem[key] = v; return v; }
        } catch (e) { /* повреждённая запись или запрет доступа: считаем, что значения нет */ }
        return null;
      },
      put: function (key, v) {
        mem[key] = v;
        try { var s = st(); if (s) s.setItem(pre + key, JSON.stringify(v)); } catch (e) { /* остаётся в памяти страницы */ }
      },
      remove: function (key) {
        mem[key] = null;
        try { var s = st(); if (s) s.removeItem(pre + key); } catch (e) { /* остаётся в памяти страницы */ }
      },
      // Удалить все значения хранилища (смена цели: черновики прежней цели больше не нужны)
      clear: function () {
        Object.keys(mem).forEach(function (k) { mem[k] = null; });
        try {
          var s = st();
          if (!s || typeof s.key !== 'function') return;
          var doomed = [];
          for (var i = 0; i < s.length; i++) { var k = s.key(i); if (k && k.indexOf(pre) === 0) doomed.push(k); }
          doomed.forEach(function (k) { s.removeItem(k); });
        } catch (e) { /* остаётся в памяти страницы */ }
      }
    };
  }

  function nv(v) { return v === undefined ? null : v; }

  // o: { call(method, params, opts) → Promise<результат клиента API> (opts: { requestId?, canRetry? }), queue?, drafts? (createStore),
  //      scope() → строка кабинета для ключа черновика, onChange(), onStatus(), onServer(todayData), onGoalReached(), onError(error),
  //      schedule(fn, ms) → handle, cancel(handle), now(), undoMs=10000, savedMs=2500, maxAgeMs=600000, myMemberId (значение или функция) }
  function createToday(o) {
    var undoMs = o.undoMs != null ? o.undoMs : 10000;
    var savedMs = o.savedMs != null ? o.savedMs : 2500;
    var maxAgeMs = o.maxAgeMs != null ? o.maxAgeMs : 600000;
    var now = o.now || Date.now;
    var q = o.queue || createWriteQueue();
    var drafts = o.drafts || createStore(null, '');
    var handlers = { onChange: o.onChange, onGoalReached: o.onGoalReached, onError: o.onError };
    var s = {
      date: null, data: null, values: {}, markers: {}, // markers[actionId] = значение до «Норма выполнена»
      base: { values: {}, progress: null },            // что сейчас на сервере (последнее известное)
      progress: null,                                  // { value } — что показано в поле прогресса цели
      day: null,                                       // итог дня с сервера { doneCount, totalCount, percent, percentRaw, dayEntered }
      status: 'idle',                                  // idle | dirty | saving | saved | error
      error: null, undo: null, taps: 0, goalReached: false,
      restored: null,                                  // дата дня, чей черновик найден при открытии (предложить «Сохранить» / «Отбросить»)
      stale: false, justSaved: false, loadedAt: 0
    };
    var failed = null;       // упавший запрос, который можно повторить: { method, params, requestId, seq, onOk }
    var queued = 0;          // сколько запросов поставлено в очередь и ещё не завершено
    var saveInFlight = null; // промис «Сохранить» в пути: второе нажатие запроса не отправляет
    var loadToken = 0;
    var changeSeq = 0;       // порядковый номер пользовательских изменений
    var lastChange = {};     // actionId → номер последнего изменения пользователем (ответ сервера не должен затирать более новое)
    var lastProgressChange = 0;
    var touched = {};        // ключ черновика → правили в этой сессии (тогда это не «найденный при открытии»)
    var seen = {};           // ключ черновика → уже показывали
    var undoTimer = null;
    var savedTimer = null;

    function changed() { if (handlers.onChange) handlers.onChange(); }
    function notify() { if (o.onStatus) o.onStatus(); }
    function actions() { return s.data ? s.data.actions : []; }
    function byId(id) { return actions().filter(function (a) { return a.id === id; })[0]; }
    function bump() { return ++changeSeq; }
    function touch(id) { lastChange[id] = bump(); }
    function myMemberId() { return typeof o.myMemberId === 'function' ? o.myMemberId() : o.myMemberId; }
    function keyOf(date) { return (o.scope ? o.scope() : '') + ':' + s.data.goal.id + ':' + date; }

    // ---------- черновик: чем экран отличается от сервера ----------
    function value(id) { var v = s.values[id]; return v === undefined ? null : v; }
    function dirtyIds() { return actions().filter(function (a) { return value(a.id) !== nv(s.base.values[a.id]); }).map(function (a) { return a.id; }); }
    function progressDirty() { return !!s.progress && s.progress.value !== s.base.progress; }
    function dirty() { return !!s.data && (dirtyIds().length > 0 || progressDirty()); }
    function isRowDirty(id) { return value(id) !== nv(s.base.values[id]); }

    function persist() {
      if (!s.data) return;
      var k = keyOf(s.date);
      if (!dirty()) { drafts.remove(k); return; }
      var facts = {};
      dirtyIds().forEach(function (id) { facts[id] = value(id); });
      var d = { facts: facts, at: now() };
      if (progressDirty()) d.progress = s.progress.value;
      drafts.put(k, d);
    }

    function status() {
      if (failed) return 'error';
      if (queued > 0) return 'saving';
      if (dirty()) return 'dirty';
      return s.justSaved ? 'saved' : 'idle';
    }
    function refreshStatus() {
      s.status = status();
      if (!failed) s.error = null;
    }
    function settle() { refreshStatus(); notify(); changed(); }

    function clearUndo() {
      if (undoTimer) { o.cancel(undoTimer); undoTimer = null; }
      s.undo = null;
    }
    // «Отменить» гаснет через undoMs после того, как сервер ответил на всё (до этого держится сколько угодно)
    function confirmUndoIfIdle() {
      if (!s.undo || s.undo.confirmed || failed || queued > 0) return;
      s.undo.confirmed = true;
      var u = s.undo;
      undoTimer = o.schedule(function () { undoTimer = null; if (s.undo === u) { s.undo = null; changed(); } }, undoMs);
    }
    function flashSaved() {
      s.justSaved = true;
      if (savedTimer) o.cancel(savedTimer);
      savedTimer = o.schedule(function () { savedTimer = null; s.justSaved = false; settle(); }, savedMs);
    }

    // Данные дня в том виде, как они на сервере (для кэша «последнего Сегодня»): значения из base, не из черновика.
    function serverView() {
      if (!s.data) return null;
      var d = JSON.parse(JSON.stringify(s.data));
      d.actions.forEach(function (a) { a.value = nv(s.base.values[a.id]); a.done = a.value !== null && a.value >= a.norm; });
      d.progress.value = s.base.progress;
      if (s.day) {
        d.dayEntered = s.day.dayEntered;
        var mid = myMemberId();
        d.members.forEach(function (m) { if (m.id === mid) { m.doneCount = s.day.doneCount; m.totalCount = s.day.totalCount; m.percent = s.day.percent; m.percentRaw = s.day.percentRaw; m.factEntered = s.day.dayEntered; } });
      }
      return d;
    }
    function reportServer() { if (o.onServer && s.data) o.onServer(serverView()); }

    // ---------- данные дня с сервера ----------
    // Принять данные дня (today.get или app.bootstrap.today) и наложить на них черновик из хранилища.
    function applyServer(data) {
      s.data = data;
      s.date = data.date;
      s.loadedAt = now();
      s.base = { values: {}, progress: data.progress.value };
      s.values = {};
      data.actions.forEach(function (a) { s.base.values[a.id] = a.value; s.values[a.id] = a.value; });
      s.progress = { value: data.progress.value };
      s.markers = {};
      s.undo = null;
      if (undoTimer) { o.cancel(undoTimer); undoTimer = null; }
      failed = null;
      lastChange = {}; lastProgressChange = 0; changeSeq = 0;
      var mid = myMemberId();
      var me = data.members.filter(function (m) { return m.id === mid; })[0] || data.members[0];
      s.day = me ? { doneCount: me.doneCount, totalCount: me.totalCount, percent: me.percent, percentRaw: me.percentRaw, dayEntered: data.dayEntered } : null;
      s.goalReached = !!data.prompts.goalReached;
      var k = keyOf(data.date);
      var d = drafts.get(k);
      if (d && d.facts) {
        Object.keys(d.facts).forEach(function (id) { if (id in s.values) s.values[id] = d.facts[id]; });
        if (d.progress != null) s.progress = { value: d.progress };
        if (!dirty()) drafts.remove(k);
        else if (!touched[k] && !seen[k]) s.restored = data.date; // черновик с прошлого раза: предложить «Сохранить» или «Отбросить»
        seen[k] = true;
      }
      reportServer();
      refreshStatus();
    }

    // Загрузить день: today.get. Черновик дня остаётся и накладывается на ответ. load(date, { discard: true }) — отбросить черновик
    // этого дня («Обновить экран» при ошибке, которую повтором не исправить). Сначала ждём, пока допишутся запросы записи.
    function load(date, opts) {
      var discard = !!(opts && opts.discard);
      var token = ++loadToken;
      if (discard && s.data) { drafts.remove(keyOf(s.date)); s.restored = null; }
      return q.idle().then(function () {
        if (token !== loadToken) return { ok: true, data: s.data, superseded: true };
        return o.call('today.get', date ? { date: date } : {}).then(function (res) {
          if (token !== loadToken) return res;
          if (!res.ok) return res;
          applyServer(res.data);
          settle();
          return res;
        });
      });
    }

    // Загрузить день заново с сервера и отбросить несохранённое этого дня (кнопка «Обновить экран»).
    function refresh() { return load(s.date, { discard: true }); }

    // Открытие экрана «Сегодня»: уже загруженное не запрашиваем заново (запрос ≥ 2 с), пока оно свежее. Первый день берётся
    // из app.bootstrap (adoptBoot), поэтому при открытии отдельного today.get нет.
    function open(date, todayStr) {
      if (s.data && (date ? date === s.date : s.date === todayStr) && now() - s.loadedAt < maxAgeMs) return Promise.resolve({ ok: true, data: s.data });
      return load(date || undefined);
    }

    // Данные «Сегодня» из ответа app.bootstrap (или из кэша): принять без запроса. Пока идёт запись, ответ сервера может быть старше неё — пропускаем.
    function adoptBoot(today) {
      if (!today) { if (queued === 0) { s.data = null; } return false; }
      if (queued > 0) return false;
      if (s.data && s.data.goal.id === today.goal.id && s.date !== today.date) return false; // пользователь смотрит другой день
      applyServer(today);
      settle();
      return true;
    }

    function setStale(v) { s.stale = !!v; notify(); changed(); }

    // ---------- локальные значения ----------
    function entered() { return actions().filter(function (a) { return value(a.id) !== null; }).length; }
    function allEntered() { return entered() === actions().length; }
    function anyBelowNorm() { return actions().some(function (a) { var v = value(a.id); return v === null || v < a.norm; }); }

    // Локальная оценка итога дня до ответа сервера: считаются только действия «в плане» (today.get.actions[].inPlan),
    // «день внесён» — по всем действиям (data-model.md §4).
    function localSummary() {
      var acts = actions();
      var plan = acts.filter(function (a) { return a.inPlan !== false; });
      var done = 0;
      var cap = 0;
      plan.forEach(function (a) {
        var v = value(a.id) == null ? 0 : value(a.id);
        if (v >= a.norm) done++;
        cap += a.norm > 0 ? Math.min(v / a.norm, 1) : 0;
      });
      return { doneCount: done, totalCount: plan.length, percent: plan.length ? Math.round(cap / plan.length * 100) : 0, dayEntered: acts.length === entered() };
    }
    function summary() {
      // пока есть несохранённое или запросы в пути, показываем локальный расчёт; после ответа — серверный
      if (s.day && !dirty() && queued === 0) return s.day;
      return localSummary();
    }

    // ---------- отправка ----------
    function applyDay(res) {
      if (res.data.day) {
        var d = res.data.day;
        s.day = { doneCount: d.doneCount, totalCount: d.totalCount, percent: d.percent, percentRaw: d.percentRaw, dayEntered: d.dayEntered };
        d.streaks.forEach(function (x) { var a = byId(x.actionId); if (a) a.streak = x.streak; });
      }
      if (res.data.goalReached && !s.goalReached) { s.goalReached = true; if (handlers.onGoalReached) handlers.onGoalReached(); }
    }

    // Ответ сервера уточняет то, что на сервере (base), и значения на экране, но не затирает то, что пользователь изменил после отправки.
    function absorbOk(res, seq) {
      (res.data.facts || []).forEach(function (f) {
        s.base.values[f.actionId] = f.value;
        if (!(lastChange[f.actionId] > seq)) s.values[f.actionId] = f.value;
      });
      if (res.data.progress) {
        s.base.progress = res.data.progress.value;
        if (!(lastProgressChange > seq)) s.progress = { value: res.data.progress.value };
        s.progressTotal = res.data.progress.currentValue;
      }
      applyDay(res);
    }

    // Единственное место, где запрос записи уходит в сеть: через общую очередь, по одному.
    function send(method, params, requestId, onOk) {
      queued++;
      refreshStatus();
      notify();
      changed();
      var seq = changeSeq;
      var p = q.run(function () { return doSend(method, params, requestId, onOk, seq); });
      return p.then(function (r) { queued--; after(r); return r; }, function (e) { queued--; after(); throw e; });
    }

    function after(res) {
      if (res && res.ok) { persist(); reportServer(); if (!dirty()) flashSaved(); }
      refreshStatus();
      confirmUndoIfIdle();
      notify();
      changed();
    }

    function doSend(method, params, requestId, onOk, seq) {
      var callOpts = { canRetry: function () { return changeSeq === seq; } }; // новое нажатие отменяет автоповторы старого тела
      if (requestId) callOpts.requestId = requestId;
      return o.call(method, params, callOpts).then(function (res) {
        if (res.ok) {
          failed = null;
          absorbOk(res, seq);
          if (onOk) onOk(res);
          return res;
        }
        // после запроса появилось более новое изменение: старое тело повторять нельзя; черновик остаётся несохранённым, «Сохранить» отправит актуальное
        if (res.error.code === 'superseded') return res;
        // цель завершена или удалена: черновик не нужен и не отправляется повторно (screens.md §3.3)
        if (GOAL_GONE[res.error.code]) { forget(); if (o.onGoalGone) o.onGoalGone(res.error); return res; }
        failed = { method: method, params: params, requestId: res.requestId, seq: seq, onOk: onOk || null };
        s.error = res.error;
        if (handlers.onError) handlers.onError(res.error);
        return res;
      });
    }

    // Тело для «Все нормы» и «Готово»: несохранённые facts и progress (необязательные поля запроса)
    function draftBody() {
      var body = {};
      var facts = dirtyIds().map(function (id) { return { actionId: id, value: value(id) }; });
      if (facts.length) body.facts = facts;
      if (progressDirty()) body.progress = { value: s.progress.value };
      return body;
    }

    function mutated() {
      s.justSaved = false;
      touched[keyOf(s.date)] = true;
      persist();
      refreshStatus();
      notify();
      changed();
    }

    function setValueLocal(id, v) {
      clearUndo(); // следующее действие на экране убирает «Отменить»
      s.values[id] = v;
      touch(id);
      mutated();
    }

    // ---------- действия пользователя ----------
    function plus(id) {
      var a = byId(id);
      if (!a) return;
      s.taps++;
      var v = value(id);
      setValueLocal(id, v === null ? a.step : F.addStep(v, a.step));
    }
    function minus(id) {
      var a = byId(id);
      if (!a) return;
      s.taps++;
      var v = value(id);
      if (v === null) return; // «−» на «—» не действует
      setValueLocal(id, Math.max(0, F.addStep(v, -a.step)));
    }
    // Точное число: нажатие на число, ввод, «Готово» — 2 нажатия + цифры (число нажатий считаем здесь: 2).
    function setExact(id, v) {
      s.taps += 2;
      if (v === null || (typeof v === 'number' && isFinite(v) && v >= 0)) setValueLocal(id, v);
    }
    // «Норма выполнена»; повторное нажатие возвращает прежнее значение.
    function toggleNorm(id) {
      var a = byId(id);
      if (!a) return;
      s.taps++;
      if (Object.prototype.hasOwnProperty.call(s.markers, id)) {
        var prev = s.markers[id];
        delete s.markers[id];
        setValueLocal(id, prev);
        return;
      }
      var v = value(id);
      if (v !== null && v >= a.norm) return; // уже выполнено шагами: кнопка неактивна
      var before = v;
      setValueLocal(id, a.norm);
      s.markers[id] = before;
    }
    function isNormMarked(id) { return Object.prototype.hasOwnProperty.call(s.markers, id); }
    function isDone(id) { var a = byId(id); var v = value(id); return !!a && v !== null && v >= a.norm; }

    function setProgress(v) {
      s.taps++;
      clearUndo();
      lastProgressChange = bump();
      s.progress = { value: v };
      mutated();
    }
    function stepProgress(dir, step) {
      var cur = s.progress ? s.progress.value : 0;
      setProgress(Math.max(s.data.progress.inputMode === 'delta' ? -1e12 : 0, F.addStep(cur, dir * step)));
    }

    // «Сохранить» (MainButton): один day.save со всем днём — значения всех действий (не внесённое уходит как null) и прогресс, если менялся.
    // Пока запрос идёт, повторное нажатие второй запрос не отправляет. Пока данные обновляются (stale), не сохраняем.
    function save() {
      if (!s.data || s.stale) return Promise.resolve(null);
      if (saveInFlight) return saveInFlight;
      if (!dirty()) return Promise.resolve(null);
      s.taps++;
      s.restored = null;
      failed = null;
      var params = { goalId: s.data.goal.id, date: s.date, facts: actions().map(function (a) { return { actionId: a.id, value: value(a.id) }; }) };
      if (progressDirty()) params.progress = { value: s.progress.value };
      var p = send('day.save', params, undefined, null);
      var clear = function () { if (saveInFlight === p) saveInFlight = null; };
      saveInFlight = p;
      p.then(clear, clear);
      return p;
    }

    // «Все нормы выполнены»: экран меняется сразу, «Отменить» виден сразу; несохранённое едет в том же запросе.
    function completeAll() {
      if (s.stale) return Promise.resolve(null);
      s.taps++;
      s.restored = null;
      clearUndo();
      bump();
      var body = draftBody();
      var prev = actions().map(function (a) { return { actionId: a.id, value: value(a.id) }; });
      actions().forEach(function (a) {
        var v = value(a.id);
        var nv2 = Math.max(v === null ? 0 : v, a.norm);
        if (nv2 !== v) { s.values[a.id] = nv2; touch(a.id); }
      });
      s.markers = {};
      s.undo = { prev: prev, confirmed: false };
      mutated();
      return send('day.completeAll', Object.assign({ goalId: s.data.goal.id, date: s.date }, body), undefined, null);
    }

    // «Готово на сегодня»: у действий без значения сразу появляется 0; несохранённое едет в том же запросе.
    function finish() {
      if (s.stale) return Promise.resolve(null);
      s.taps++;
      s.restored = null;
      clearUndo();
      bump();
      var body = draftBody();
      actions().forEach(function (a) { if (value(a.id) === null) { s.values[a.id] = 0; touch(a.id); } });
      s.markers = {};
      mutated();
      return send('day.finish', Object.assign({ goalId: s.data.goal.id, date: s.date }, body), undefined, null);
    }

    // «Отменить»: прежние значения возвращаются сразу, на сервер уходит абсолютный снимок (после всего, что уже в очереди).
    function undo() {
      if (!s.undo) return Promise.resolve();
      s.taps++;
      var prev = s.undo.prev;
      clearUndo();
      bump();
      failed = null; // снимок ниже перекрывает всё, что не успело дойти
      prev.forEach(function (p) { s.values[p.actionId] = p.value; touch(p.actionId); });
      s.markers = {};
      mutated();
      return send('day.save', { goalId: s.data.goal.id, date: s.date, facts: prev }, undefined, null);
    }

    // «Отбросить» черновик: на экране снова то, что на сервере.
    function discard() {
      if (!s.data) return;
      drafts.remove(keyOf(s.date));
      s.values = {};
      Object.keys(s.base.values).forEach(function (id) { s.values[id] = s.base.values[id]; });
      s.progress = { value: s.base.progress };
      s.markers = {};
      s.restored = null;
      failed = null;
      clearUndo();
      settle();
    }

    // Цель сменилась (goal.complete, goal.create) или сервер ответил goal_archived / goal_not_found: все черновики дней и упавший запрос
    // забываются без повторной отправки; экран «Сегодня» снова берётся из app.bootstrap.
    function forget() {
      drafts.clear();
      s.data = null;
      s.values = {}; s.base = { values: {}, progress: null }; s.progress = null; s.markers = {}; s.day = null;
      s.restored = null; s.error = null; s.goalReached = false;
      failed = null; touched = {}; seen = {};
      clearUndo();
      settle();
    }

    function isRetryable() { return !!failed && !!s.error && !!RETRYABLE[s.error.code]; }

    // «Повторить»: тот же запрос с тем же requestId — только если после него ничего не менялось; иначе уходит актуальный день целиком.
    function retry() {
      if (!failed) return save();
      var f = failed;
      if (f.seq !== changeSeq) { failed = null; refreshStatus(); return save(); }
      failed = null;
      refreshStatus();
      return send(f.method, f.params, f.requestId, f.onOk);
    }

    // Что показывать на кнопке Telegram и нужно ли подтверждение закрытия.
    function ui() {
      var d = dirty();
      return { show: !!s.data && !s.stale && (d || queued > 0 || !!failed), loading: queued > 0, dirty: d, confirmClose: d || queued > 0 || !!failed };
    }
    // Нажатие кнопки «Сохранить»: после ошибки — повтор, иначе обычное сохранение
    function press() { return failed ? retry() : save(); }

    // Экран «Сегодня» один на сессию: при смене вкладки он отвязывается, черновик остаётся, запросы доигрывают в фоне.
    function bind(h) { handlers = { onChange: h.onChange, onGoalReached: h.onGoalReached, onError: h.onError }; }
    function leave() { handlers = {}; }

    return { state: s, load: load, open: open, adoptBoot: adoptBoot, setStale: setStale, refresh: refresh, plus: plus, minus: minus, setExact: setExact,
      toggleNorm: toggleNorm, isNormMarked: isNormMarked, isDone: isDone, isRowDirty: isRowDirty, idle: function () { return q.idle(); },
      save: save, press: press, completeAll: completeAll, finish: finish, undo: undo, discard: discard, retry: retry, ui: ui,
      forget: forget, value: value, summary: summary, entered: entered, allEntered: allEntered, anyBelowNorm: anyBelowNorm, setProgress: setProgress,
      stepProgress: stepProgress, hasDraft: dirty, isRetryable: isRetryable, serverView: serverView, bind: bind, leave: leave };
  }

  var api = { createToday: createToday, createWriteQueue: createWriteQueue, createStore: createStore, RETRYABLE: RETRYABLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.todayLogic = api; }
})(globalThis);

;
// Логика мастера цели (M-1…M-3, screens.md §3.2) без DOM: черновик из пресета → проверка → запрос goal.create.
(function (root) {
  'use strict';

  var K = typeof module !== 'undefined' && module.exports ? require('./dates.js') : root.GT.dates;
  var F = typeof module !== 'undefined' && module.exports ? require('./format.js') : root.GT.format;

  var PERIODS = [30, 60, 90];
  var MAX_START_AHEAD = 14; // старт можно отложить не дальше чем на 14 дней (api.md goal.create)

  // preset — элемент presets.list; ctx: { today: 'YYYY-MM-DD', timezone: 'Europe/Moscow' }
  function initDraft(preset, ctx) {
    var days = preset.example && preset.example.days ? preset.example.days : 30;
    return {
      presetId: preset.id,
      title: preset.example.title || '', unit: preset.unit || '',
      direction: preset.direction, inputMode: preset.inputMode,
      startValue: preset.example.startValue, targetValue: preset.example.targetValue,
      days: days, startChoice: 'today', startDate: ctx.today, endDate: K.addDays(ctx.today, days - 1),
      timezone: ctx.timezone,
      actions: preset.actions.map(function (a) {
        return { title: a.title, unit: a.unit, startNorm: a.startNorm, growsOnLag: a.growsOnLag, inPlan: a.inPlan, countStreak: a.countStreak,
          step: a.step, normCeiling: preset.normCeiling != null ? preset.normCeiling : null };
      }),
      tasks: preset.tasks.map(function (t) { return { title: t.title, checked: true }; })
    };
  }

  // «Повторить эту цель» (S-33): мастер заполнен из repeat (goal.complete / history.get); старт «Сегодня», длина периода — periodDays,
  // стартовое значение — suggestedStartValue (поле можно править)
  function initFromRepeat(repeat, ctx) {
    var days = repeat.periodDays > 1 ? repeat.periodDays : 30;
    return {
      presetId: repeat.presetId || 'custom',
      title: repeat.title, unit: repeat.unit, direction: repeat.direction, inputMode: repeat.inputMode,
      startValue: repeat.suggestedStartValue, targetValue: repeat.targetValue,
      days: days, startChoice: 'today', startDate: ctx.today, endDate: K.addDays(ctx.today, days - 1),
      timezone: ctx.timezone,
      actions: repeat.actions.map(function (a) {
        return { ownerMemberId: a.ownerMemberId, title: a.title, unit: a.unit, startNorm: a.startNorm, growsOnLag: a.growsOnLag, inPlan: a.inPlan,
          countStreak: a.countStreak, step: a.step, normCeiling: a.normCeiling == null ? null : a.normCeiling };
      }),
      tasks: []
    };
  }

  function setDays(draft, n) {
    draft.days = n;
    draft.endDate = K.addDays(draft.startDate, n - 1);
  }

  // Дата старта: 'today' | 'tomorrow' | 'other' (otherDate — выбранная дата). Длина периода сохраняется, дата окончания сдвигается.
  function setStart(draft, choice, today, otherDate) {
    draft.startChoice = choice;
    draft.startDate = choice === 'today' ? today : choice === 'tomorrow' ? K.addDays(today, 1) : (otherDate || K.addDays(today, 2));
    draft.endDate = K.addDays(draft.startDate, draft.days - 1);
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
    if (!K.isDate(draft.startDate) || draft.startDate < today || draft.startDate > K.addDays(today, MAX_START_AHEAD)) e.startDate = 'out_of_range';
    if (!K.isDate(draft.endDate) || !K.isDate(draft.startDate) || draft.endDate < K.addDays(draft.startDate, 1)) e.endDate = 'period';
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
      endDate: draft.endDate, timezone: draft.timezone,
      actions: draft.actions.map(function (a) {
        var o = { ownerMemberId: a.ownerMemberId || null, title: a.title.trim(), unit: (a.unit || '').trim(), startNorm: a.startNorm, growsOnLag: !!a.growsOnLag,
          inPlan: !!a.inPlan, countStreak: !!a.countStreak, normCeiling: a.normCeiling == null ? null : a.normCeiling };
        if (a.step > 0) o.step = a.step;
        return o;
      })
    };
    if (draft.startChoice !== 'today') p.startDate = draft.startDate; // выбрано «Сегодня» — поле не отправляем, старт = серверное «сегодня»
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

  var api = { PERIODS: PERIODS, MAX_START_AHEAD: MAX_START_AHEAD, initDraft: initDraft, initFromRepeat: initFromRepeat, setDays: setDays, setStart: setStart, stepNorm: stepNorm, addAction: addAction,
    validate: validate, toParams: toParams, serverFields: serverFields };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.wizardLogic = api; }
})(globalThis);

;
// Логика экранов доступа боевого режима (ACCESS_MODE=codes) без DOM:
//  - S-02 «Ввод кода активации»: нормализация, ошибки по каталогу api.md, блокировка locked с обратным отсчётом;
//  - S-04 «Email для восстановления доступа»: email → код из письма → готово (access.setRecoveryEmail / confirmRecoveryEmail).
// В бете (whitelist) эти методы отвечают not_available, а роутер экранов не показывает (router.js).
(function (root) {
  'use strict';

  // «abcd-2345 efgh» → «ABCD2345EFGH»: убираем пробелы и дефисы, верхний регистр (api.md access.activate).
  function normalizeCode(raw) {
    return String(raw == null ? '' : raw).toUpperCase().replace(/[\s\-‐-―]+/g, '');
  }
  function isCodeShape(code) { return /^[A-Z0-9]{12}$/.test(code); }

  function normalizeEmail(raw) { return String(raw == null ? '' : raw).trim().toLowerCase(); }
  function isEmail(s) { return s.length <= 254 && /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s); }

  // Код из письма: 6 цифр, пробелы убираются.
  function normalizeMailCode(raw) { return String(raw == null ? '' : raw).replace(/[\s\-]+/g, ''); }
  function isMailCode(s) { return /^\d{6}$/.test(s); }

  // 125 → «2:05», 3600 → «1:00:00»
  function formatClock(sec) {
    var s = Math.max(0, Math.ceil(sec));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
    return h ? h + ':' + two(m) + ':' + two(r) : m + ':' + two(r);
  }

  // Обратный отсчёт: onTick(осталось секунд) каждую секунду, пока не дойдёт до нуля.
  // o: { seconds, now(), schedule(fn, ms), cancel(h), onTick(left) }
  function createCountdown(o) {
    var endAt = o.now() + o.seconds * 1000;
    var handle = null;
    var stopped = false;
    function left() { return Math.max(0, Math.ceil((endAt - o.now()) / 1000)); }
    function tick() {
      handle = null;
      if (stopped) return;
      var l = left();
      o.onTick(l);
      if (l > 0) handle = o.schedule(tick, 1000);
    }
    o.onTick(left());
    if (left() > 0) handle = o.schedule(tick, 1000);
    return { left: left, stop: function () { stopped = true; if (handle) o.cancel(handle); } };
  }

  // ---------- S-02: активация кода ----------
  // o: { call, now, schedule, cancel, onChange(), onSuccess(data) }
  function createActivation(o) {
    var s = { status: 'idle', error: null, lockLeft: 0, code: '' };
    var lock = null;
    var pending = null; // { code, requestId } после «нет связи»: повтор того же кода с тем же requestId
    function change() { if (o.onChange) o.onChange(); }

    function startLock(sec) {
      if (lock) lock.stop();
      lock = createCountdown({ seconds: sec, now: o.now, schedule: o.schedule, cancel: o.cancel, onTick: function (l) {
        s.lockLeft = l;
        if (l === 0) { s.status = 'idle'; if (s.error && s.error.code === 'locked') s.error = null; }
        change();
      } });
    }

    function submit(raw) {
      if (s.status === 'busy' || s.lockLeft > 0) return Promise.resolve(null);
      var code = normalizeCode(raw);
      s.code = code;
      if (!isCodeShape(code)) { s.status = 'error'; s.error = { code: 'bad_format' }; change(); return Promise.resolve(null); } // ввод с ошибкой формата не тратит попытки
      s.status = 'busy'; s.error = null; change();
      var reqId = pending && pending.code === code ? pending.requestId : undefined;
      return o.call('access.activate', { code: code }, reqId ? { requestId: reqId } : undefined).then(function (res) {
        if (res.ok) { pending = null; s.status = 'done'; change(); if (o.onSuccess) o.onSuccess(res.data); return res; }
        pending = res.error.code === 'network' ? { code: code, requestId: res.requestId } : null;
        s.status = res.error.code === 'locked' ? 'locked' : 'error';
        s.error = res.error;
        if (res.error.code === 'locked') startLock(res.error.retryAfterSec || 3600); else change();
        return res;
      });
    }

    return { state: s, submit: submit, stop: function () { if (lock) lock.stop(); } };
  }

  // ---------- S-04: подтверждение email ----------
  // o: { call, now, schedule, cancel, onChange() }
  function createEmailFlow(o) {
    var s = { step: 'email', email: '', busy: false, error: null, resendLeft: 0, lockLeft: 0, expiresInSec: 1800 };
    var resend = null;
    var lock = null;
    var pending = null; // повтор после «нет связи» с тем же requestId: { key, requestId }
    function change() { if (o.onChange) o.onChange(); }

    function startResend(sec) {
      if (resend) resend.stop();
      resend = createCountdown({ seconds: sec, now: o.now, schedule: o.schedule, cancel: o.cancel, onTick: function (l) { s.resendLeft = l; change(); } });
    }
    function startLock(sec) {
      if (lock) lock.stop();
      lock = createCountdown({ seconds: sec, now: o.now, schedule: o.schedule, cancel: o.cancel, onTick: function (l) {
        s.lockLeft = l;
        if (l === 0 && s.error && s.error.code === 'locked') { // запись аннулирована: после блокировки нужен новый код
          s.error = null;
          s.step = 'email';
          if (resend) resend.stop();
          s.resendLeft = 0;
        }
        change();
      } });
    }

    function send(email, isResend) {
      var key = 'send:' + email;
      var reqId = !isResend && pending && pending.key === key ? pending.requestId : undefined;
      s.busy = true; s.error = null; change();
      return o.call('access.setRecoveryEmail', { email: email }, reqId ? { requestId: reqId } : undefined).then(function (res) {
        s.busy = false;
        if (res.ok) {
          pending = null;
          s.email = email; s.step = 'code'; s.expiresInSec = res.data.expiresInSec;
          startResend(res.data.resendAfterSec);
          change();
          return res;
        }
        pending = res.error.code === 'network' ? { key: key, requestId: res.requestId } : null;
        s.error = res.error;
        if (res.error.code === 'rate_limited' && res.error.retryAfterSec && s.step === 'code') startResend(res.error.retryAfterSec);
        change();
        return res;
      });
    }

    function submitEmail(raw) {
      if (s.busy) return Promise.resolve(null);
      var email = normalizeEmail(raw);
      s.email = email;
      if (!isEmail(email)) { s.error = { code: 'bad_format' }; change(); return Promise.resolve(null); }
      return send(email, false);
    }

    function resendCode() {
      if (s.busy || s.step !== 'code' || s.resendLeft > 0 || s.lockLeft > 0) return Promise.resolve(null);
      return send(s.email, true);
    }

    function submitCode(raw) {
      if (s.busy || s.step !== 'code' || s.lockLeft > 0) return Promise.resolve(null);
      var code = normalizeMailCode(raw);
      if (!isMailCode(code)) { s.error = { code: 'bad_format' }; change(); return Promise.resolve(null); }
      var key = 'confirm:' + code;
      var reqId = pending && pending.key === key ? pending.requestId : undefined;
      s.busy = true; s.error = null; change();
      return o.call('access.confirmRecoveryEmail', { code: code }, reqId ? { requestId: reqId } : undefined).then(function (res) {
        s.busy = false;
        if (res.ok) { pending = null; s.step = 'done'; if (resend) resend.stop(); change(); return res; }
        pending = res.error.code === 'network' ? { key: key, requestId: res.requestId } : null;
        s.error = res.error;
        if (res.error.code === 'locked') startLock(res.error.retryAfterSec || 3600); else change();
        return res;
      });
    }

    // «Изменить адрес»: назад к вводу адреса (введённое сохраняется, письмо уже отправленное остаётся действующим до нового запроса)
    function changeAddress() { s.step = 'email'; s.error = null; if (resend) resend.stop(); s.resendLeft = 0; change(); }

    return { state: s, submitEmail: submitEmail, resendCode: resendCode, submitCode: submitCode, changeAddress: changeAddress,
      stop: function () { if (resend) resend.stop(); if (lock) lock.stop(); } };
  }

  var api = { normalizeCode: normalizeCode, isCodeShape: isCodeShape, normalizeEmail: normalizeEmail, isEmail: isEmail,
    normalizeMailCode: normalizeMailCode, isMailCode: isMailCode, formatClock: formatClock, createCountdown: createCountdown,
    createActivation: createActivation, createEmailFlow: createEmailFlow };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GT = root.GT || {}; root.GT.accessLogic = api; }
})(globalThis);

;
// Общие элементы интерфейса (только браузер). Любой текст сервера выводится через textContent, не как HTML.
(function (root) {
  'use strict';

  var S = root.GT.strings;
  var t = S.t;

  // h('div', {class:'x', onclick: fn, text:'…'}, дети…) — создать элемент.
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (k === 'text') el.textContent = v;
        else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else if (v !== false && v != null) el.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x != null && x !== false) el.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
      else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }

  function button(label, onclick, opts) {
    var o = opts || {};
    return h('button', { type: 'button', class: o.secondary ? 'secondary' : (o.danger ? 'danger' : null), text: label, onclick: onclick,
      disabled: !!o.disabled, 'aria-label': o.aria || null });
  }

  // Подпись + поле + подсказка + текст ошибки.
  function field(label, input, hint, error) {
    return h('div', { class: 'field' },
      h('label', null, h('span', { class: 'label', text: label }), input),
      hint ? h('p', { class: 'hint', text: hint }) : null,
      error ? h('p', { class: 'field-error', text: error }) : null);
  }

  // Число с запятой или точкой → number | null.
  function parseNum(str) {
    var s = String(str).replace(/\s/g, '').replace(',', '.');
    if (s === '' || s === '-' || s === '.') return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  }

  function numberInput(value, onchange, opts) {
    var o = opts || {};
    var input = h('input', { type: 'text', inputmode: o.negative ? 'text' : 'decimal', value: value == null ? '' : String(value).replace('.', ','),
      'aria-label': o.aria || null, class: o.class || null });
    input.addEventListener('change', function () { onchange(parseNum(input.value), input); });
    return input;
  }

  var toastTimer = null;
  function toast(text, kind) {
    var old = document.getElementById('toast');
    if (old) old.remove();
    var el = h('div', { id: 'toast', class: 'toast ' + (kind || ''), role: 'status', text: text });
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.remove(); }, 3500);
  }

  // Подтверждение внутри страницы (alert/confirm в мини-приложении недоступны или неудобны). → Promise<boolean>
  function confirmDialog(text, okLabel, danger) {
    return new Promise(function (resolve) {
      var done = function (v) { back.remove(); resolve(v); };
      var back = h('div', { class: 'dialog-back' },
        h('div', { class: 'dialog', role: 'dialog' },
          h('p', { text: text }),
          h('div', { class: 'actions' },
            button(okLabel || t('common.ok'), function () { done(true); }, { danger: !!danger }),
            button(t('common.cancel'), function () { done(false); }, { secondary: true }))));
      document.body.appendChild(back);
    });
  }

  // Подтверждение вводом слова (удаление кабинета).
  function wordDialog(text, word, okLabel) {
    return new Promise(function (resolve) {
      var done = function (v) { back.remove(); resolve(v); };
      var input = h('input', { type: 'text', 'aria-label': word, autocomplete: 'off' });
      var ok = button(okLabel, function () { done(input.value); }, { danger: true, disabled: true });
      input.addEventListener('input', function () { ok.disabled = input.value.trim() === ''; });
      var back = h('div', { class: 'dialog-back' },
        h('div', { class: 'dialog', role: 'dialog' }, h('p', { text: text }), input,
          h('div', { class: 'actions' }, ok, button(t('common.cancel'), function () { done(null); }, { secondary: true }))));
      document.body.appendChild(back);
    });
  }

  function spinner() { return h('div', { class: 'spinner', role: 'status' }); }
  function section(title, children) { return h('section', { class: 'card' }, title ? h('h3', { text: title }) : null, children); }

  root.GT.ui = { h: h, button: button, field: field, numberInput: numberInput, parseNum: parseNum, toast: toast,
    confirmDialog: confirmDialog, wordDialog: wordDialog, spinner: spinner, section: section };
})(globalThis);

;
// Экраны входа и доступа: загрузка, нет связи, окружение, согласие S-05, «Закрытая бета» S-02/S-02a, приглашение S-03.
(function (root) {
  'use strict';

  var screens = root.GT.screens = root.GT.screens || {};

  screens.loading = function (env) {
    return env.h('div', { class: 'center' }, env.U.spinner(), env.h('p', { class: 'loading-text', text: env.t('common.loading') }));
  };

  function message(env, title, text, retry) {
    var el = env.h('div', null, env.h('h2', { text: title }), env.h('p', { text: text }));
    if (retry) el.appendChild(env.h('div', { class: 'actions' }, env.U.button(env.t('common.retry'), retry)));
    return el;
  }

  screens.offline = function (env) {
    return message(env, env.t('offline.title'), env.t('offline.text'), function () { env.loading(); env.flow().retry(); });
  };

  screens.wrongEnv = function (env, d) {
    return message(env, env.t('wrongEnv.title'), env.t('wrongEnv.text', { expected: d.expected, actual: d.actual }));
  };

  var FATAL = { authExpired: 'fatal.authExpired', authInvalid: 'fatal.authInvalid', update: 'fatal.update', noApiUrl: 'fatal.noApiUrl' };
  screens.fatal = function (env, d) {
    var key = FATAL[d.screen];
    if (key) return message(env, env.t(key + '.title'), env.t(key + '.text'));
    return message(env, env.t('fatal.generic.title'), d.error ? env.S.errorText(d.error) : env.t('fatal.generic.text'),
      function () { env.loading(); env.flow().retry(); });
  };

  // ---------- S-05 Согласие ----------
  screens.consent = function (env, d) {
    var h = env.h;
    var c = d.boot.consent;
    var updated = c.acceptedVersion != null;
    var box = h('input', { type: 'checkbox', id: 'consent-box' });
    var btn = env.U.button(env.t('consent.submit'), null, { disabled: true });
    var notice = h('p', { class: 'notice', id: 'consent-notice', hidden: true });
    var errBox = h('p', { class: 'error', hidden: true });
    box.addEventListener('change', function () { btn.disabled = !box.checked; });
    btn.addEventListener('click', function () {
      if (!box.checked) return;
      btn.disabled = true;
      errBox.hidden = true;
      env.flow().acceptConsent(c.version).then(function (r) {
        if (r.ok) return;
        if (r.reloaded) { // экран уже перерисован с новой версией
          var n = document.getElementById('consent-notice');
          if (n) { n.textContent = env.t('consent.outdatedReloaded'); n.hidden = false; }
          return;
        }
        errBox.textContent = env.S.errorText(r.error); // галочка остаётся как была
        errBox.hidden = false;
        btn.textContent = env.t('common.retry');
        btn.disabled = !box.checked;
      });
    });
    return h('div', null, notice,
      h('h2', { text: env.t(updated ? 'consent.titleUpdated' : 'consent.title') }),
      h('p', { text: env.t('consent.intro') }),
      h('p', null, env.U.button(env.t('consent.policyLink'), function () { env.openLink(env.cfg.PRIVACY_URL || '#'); }, { secondary: true })),
      h('p', { text: env.t('consent.version', { version: c.version }) }),
      h('label', { class: 'check', for: 'consent-box' }, box, h('span', { text: env.t('consent.checkbox') })),
      errBox, btn);
  };

  // ---------- S-02 Закрытая бета и S-02a просмотр пресетов ----------
  function presetCard(env, p) {
    var h = env.h;
    return h('details', { class: 'card' },
      h('summary', { text: p.name }),
      h('p', { text: env.t('presets.example', { title: p.example.title || '—', days: p.example.days }) }),
      p.actions.length ? h('ul', null, p.actions.map(function (a) { return h('li', { text: a.title + ' — ' + env.F.num(a.startNorm) + ' ' + a.unit }); })) : null,
      p.tasks.length ? h('p', { class: 'hint', text: env.t('presets.tasks') + ' ' + p.tasks.map(function (x) { return x.title; }).join('; ') }) : null);
  }

  screens.noAccess = function (env, d) {
    var h = env.h;
    var id = String(d.boot.user.telegramId);
    var copy = env.U.button(env.t('noAccess.copy'), function () {
      try { navigator.clipboard.writeText(id).then(function () { copy.textContent = env.t('noAccess.copied'); }, function () {}); } catch (e) { /* выделить вручную */ }
    }, { secondary: true });
    var list = h('div', { class: 'presets' });
    var show = env.U.button(env.t('noAccess.presets'), function () {
      show.disabled = true;
      env.presets().then(function (res) {
        if (!res.ok) { show.disabled = false; return env.fail(res); }
        res.data.presets.forEach(function (p) { list.appendChild(presetCard(env, p)); });
        show.hidden = true;
      });
    }, { secondary: true });
    return h('div', null,
      h('h2', { text: env.t('noAccess.title') }), h('p', { text: env.t('noAccess.text') }),
      h('p', { class: 'telegram-id', text: env.t('noAccess.telegramId', { id: id }) }), h('p', { text: env.t('noAccess.sendId') }),
      h('div', { class: 'actions' }, copy, show), list);
  };

  // ---------- S-03 Приглашение ----------
  screens.invite = function (env, d) {
    var h = env.h;
    var err = h('p', { class: 'error', hidden: true });
    var btn = env.U.button(env.t('invite.accept'), function () {
      btn.disabled = true;
      err.hidden = true;
      env.call('invite.accept', { code: d.inviteCode }).then(function (res) {
        if (res.ok) return env.reboot();
        btn.disabled = false;
        err.textContent = env.S.errorText(res.error);
        err.hidden = false;
      });
    });
    return h('div', null, h('h2', { text: env.t('invite.title') }), h('p', { text: env.t('invite.text') }), err, btn);
  };

  // ---------- S-02 боевой режим (mode=codes): ввод кода активации ----------
  // Роутер показывает экран только при mode=codes; в бете вместо него «Закрытая бета» (router.js). Логика — js/access-logic.js.
  screens.activate = function (env, d) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var AL = root.GT.accessLogic;
    var input = h('input', { type: 'text', class: 'code-input', value: d.activateCode || '', autocomplete: 'off', autocapitalize: 'characters',
      spellcheck: 'false', 'aria-label': t('activate.field'), placeholder: t('activate.placeholder') });
    var err = h('p', { class: 'error', hidden: true, role: 'alert' });
    var btn = U.button(t('activate.submit'), function () { act.submit(input.value); });
    var list = h('div', { class: 'presets' });

    function errorText(e) {
      if (e.code === 'locked') return t('activate.locked', { clock: AL.formatClock(act.state.lockLeft) });
      if (e.code === 'transfer_too_soon') {
        var next = e.details && e.details.nextAt ? env.F.dateFull(e.details.nextAt.slice(0, 10)) : '';
        return t('activate.err.transfer_too_soon', { date: next });
      }
      var key = 'activate.err.' + e.code;
      return t(key) !== key ? t(key) : env.S.errorText(e); // network, rate_limited, unavailable и прочее — общие тексты
    }

    function render() {
      var s = act.state;
      var locked = s.lockLeft > 0;
      btn.disabled = s.status === 'busy' || locked;
      btn.textContent = s.status === 'busy' ? t('activate.busy') : (s.error && s.error.code === 'network' ? t('common.retry') : t('activate.submit'));
      input.disabled = s.status === 'busy';
      if (s.error) { err.textContent = errorText(s.error); err.hidden = false; } else err.hidden = true;
    }

    // Пока человек печатает, убираем пробелы и дефисы и приводим к верхнему регистру: вставка «abcd-2345 efgh» сразу выглядит как код
    input.addEventListener('input', function () { input.value = AL.normalizeCode(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') act.submit(input.value); });

    var act = AL.createActivation({ call: env.call, now: Date.now, schedule: env.schedule, cancel: env.cancel, onChange: render,
      onSuccess: function (data) { if (data.transferred) env.toast(t('activate.transferred')); env.reboot(); } });

    var presets = U.button(t('activate.presets'), function () {
      presets.disabled = true;
      env.presets().then(function (res) {
        if (!res.ok) { presets.disabled = false; return env.fail(res); }
        res.data.presets.forEach(function (p) { list.appendChild(presetCard(env, p)); });
        presets.hidden = true;
      });
    }, { secondary: true });

    // страница «Восстановить доступ» на сайте (адрес задаёт сборка, config.RECOVERY_URL); без адреса кнопки нет
    var recover = env.cfg.RECOVERY_URL ? U.button(t('activate.recover'), function () { env.openLink(env.cfg.RECOVERY_URL); }, { secondary: true }) : null;

    render();
    return h('div', null, h('h2', { text: t('activate.title') }), h('p', { text: t('activate.text') }),
      U.field(t('activate.field'), input), err, h('div', { class: 'actions' }, btn, presets, recover),
      h('p', { class: 'hint', text: t('activate.lostHint') }), list);
  };

  // ---------- S-04 «Email для восстановления доступа»: три шага на одном экране ----------
  // Показывается только в режиме codes владельцу бесплатного бета-доступа без email (router.js). «Позже» закрывает экран до следующего входа.
  screens.email = function (env) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var AL = root.GT.accessLogic;
    var box = h('div');
    var shown = null; // какой шаг сейчас нарисован
    var els = {};

    var flow = AL.createEmailFlow({ call: env.call, now: Date.now, schedule: env.schedule, cancel: env.cancel, onChange: sync });

    function errorText(e) {
      var s = flow.state;
      if (e.code === 'bad_format') return t(s.step === 'email' ? 'email.err.bad_format_email' : 'email.err.bad_format_code');
      if (e.code === 'locked') return t('email.locked', { clock: AL.formatClock(s.lockLeft) });
      var key = 'email.err.' + e.code;
      return t(key) !== key ? t(key) : env.S.errorText(e); // rate_limited с паузой, network, forbidden и прочее
    }

    function later() { flow.stop(); env.skipEmail(); }

    function build() {
      var s = flow.state;
      shown = s.step;
      box.textContent = '';
      els = { err: h('p', { class: 'error', hidden: true, role: 'alert' }) };
      box.appendChild(h('h2', { text: t('email.title') }));
      if (s.step === 'email') {
        els.email = h('input', { type: 'text', inputmode: 'email', autocomplete: 'email', autocapitalize: 'none', spellcheck: 'false', value: s.email, 'aria-label': t('email.field') });
        els.email.addEventListener('keydown', function (e) { if (e.key === 'Enter') flow.submitEmail(els.email.value); });
        els.send = U.button(t('email.send'), function () { flow.submitEmail(els.email.value); });
        box.appendChild(h('p', { text: t('email.intro') }));
        box.appendChild(U.field(t('email.field'), els.email));
        box.appendChild(els.err);
        box.appendChild(h('div', { class: 'actions' }, els.send, U.button(t('common.later'), later, { secondary: true })));
      } else if (s.step === 'code') {
        els.code = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '9', 'aria-label': t('email.codeField') });
        els.code.addEventListener('keydown', function (e) { if (e.key === 'Enter') flow.submitCode(els.code.value); });
        els.confirm = U.button(t('email.confirm'), function () { flow.submitCode(els.code.value); });
        els.resend = U.button(t('email.resend'), function () { flow.resendCode(); }, { secondary: true });
        box.appendChild(h('p', { text: t('email.codeIntro', { email: s.email }) }));
        box.appendChild(U.field(t('email.codeField'), els.code, t('email.codeHint')));
        box.appendChild(els.err);
        box.appendChild(h('div', { class: 'actions' }, els.confirm, els.resend));
        box.appendChild(h('div', { class: 'actions' }, U.button(t('email.change'), function () { flow.changeAddress(); }, { secondary: true }),
          U.button(t('common.later'), later, { secondary: true })));
      } else {
        box.appendChild(h('p', { class: 'notice', text: t('email.done') }));
        box.appendChild(U.button(t('email.finish'), function () { flow.stop(); env.reboot(); }));
      }
    }

    // Подвижные части (кнопки, ошибки, отсчёт) обновляются на месте, чтобы не сбивать ввод
    function sync() {
      var s = flow.state;
      if (s.step !== shown) build();
      if (els.send) { els.send.disabled = s.busy; els.send.textContent = s.busy ? t('email.sending') : t('email.send'); }
      if (els.confirm) els.confirm.disabled = s.busy || s.lockLeft > 0;
      if (els.code) els.code.disabled = s.lockLeft > 0;
      if (els.resend) {
        els.resend.disabled = s.busy || s.resendLeft > 0 || s.lockLeft > 0;
        els.resend.textContent = s.resendLeft > 0 ? t('email.resendIn', { clock: AL.formatClock(s.resendLeft) }) : t('email.resend');
      }
      if (els.err) { if (s.error) { els.err.textContent = errorText(s.error); els.err.hidden = false; } else els.err.hidden = true; }
    }

    build();
    sync();
    return box;
  };
})(globalThis);

;
// Мастер цели: M-1 пресет → M-2 поправить цифры → M-3 готово (screens.md §3.2).
(function (root) {
  'use strict';

  var screens = root.GT.screens = root.GT.screens || {};
  var W = root.GT.wizardLogic;

  var ERR = { required: 'wizard.err.required', too_long: 'wizard.err.tooLong', same: 'wizard.err.same', direction: 'wizard.err.direction',
    period: 'wizard.err.period', limit: 'wizard.err.limit', range: 'wizard.err.range', out_of_range: 'wizard.err.range', bad_format: 'wizard.err.required' };

  // params.repeat — «Повторить эту цель» (S-33): мастер сразу на шаге 2, заполненный из repeat
  screens.wizard = function (env, params) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var box = h('div');
    var presets = null;
    var draft = null;
    var onStep1 = false;
    var highlightTarget = false; // после «Повторить» цель подсвечена, пока равна старту и не изменена
    var errors = {};
    var tried = false;
    var request = null; // { key, requestId } — повтор той же отправки с тем же requestId
    var moduleTasks = !!(env.boot().cabinet && env.boot().cabinet.modules.oneOffTasks);
    var tz = env.boot().cabinet ? env.boot().cabinet.timezone : 'Europe/Moscow';

    function errText(key) {
      if (!errors[key]) return null;
      if (key === 'startDate') return t('wizard.err.startRange'); // validation_failed field=startDate показывается у поля старта
      return t(ERR[errors[key]] || 'wizard.err.required');
    }
    function refresh() { errors = tried ? W.validate(draft, env.todayStr(), env.boot().limits.maxActions) : {}; }

    // ----- M-1 -----
    function step1() {
      onStep1 = true;
      env.setBack(); // с S-41 BackButton ведёт назад на S-41, на первом запуске его нет
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
      onStep1 = false;
      box.textContent = '';
      var title = h('input', { type: 'text', value: draft.title, 'aria-label': t('wizard.fTitle') });
      title.addEventListener('change', function () { draft.title = title.value; refresh(); step2(true); });
      var unit = h('input', { type: 'text', value: draft.unit, 'aria-label': t('wizard.fUnit') });
      unit.addEventListener('change', function () { draft.unit = unit.value; refresh(); step2(true); });
      var start = U.numberInput(draft.startValue, function (v) { draft.startValue = v; refresh(); step2(true); }, { negative: true, aria: t('wizard.fStart') });
      var target = U.numberInput(draft.targetValue, function (v) { draft.targetValue = v; highlightTarget = false; refresh(); step2(true); }, { negative: true, aria: t('wizard.fTarget') });
      var today = env.todayStr();
      var startOther = h('input', { type: 'date', value: draft.startDate, min: today, max: env.D.addDays(today, W.MAX_START_AHEAD), 'aria-label': t('wizard.startOther') });
      startOther.addEventListener('change', function () {
        if (!env.D.isDate(startOther.value)) return;
        W.setStart(draft, 'other', today, startOther.value); refresh(); step2(true);
      });
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
      var targetField = U.field(t('wizard.fTarget'), target, t('wizard.hintTarget'), errText('targetValue'));
      if (highlightTarget && draft.startValue === draft.targetValue) targetField.classList.add('highlight');
      box.appendChild(targetField);
      box.appendChild(h('div', { class: 'field' }, h('span', { class: 'label', text: t('wizard.fStartDate') }),
        seg([{ value: 'today', label: t('wizard.startToday') }, { value: 'tomorrow', label: t('wizard.startTomorrow') }, { value: 'other', label: t('wizard.startOtherChoice') }],
          draft.startChoice, function (v) { W.setStart(draft, v, today, draft.startChoice === 'other' ? draft.startDate : undefined); refresh(); step2(true); }),
        draft.startChoice === 'other' ? h('label', null, h('span', { class: 'label', text: t('wizard.startOther') }), startOther) : null,
        draft.startChoice !== 'today' ? h('p', { class: 'hint', text: t('wizard.startHint', { date: env.F.dateFull(draft.startDate) }) }) : null,
        errText('startDate') ? h('p', { class: 'field-error', text: errText('startDate') }) : null));
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
      box.appendChild(h('div', { class: 'actions' }, done));
      env.setBack(step1); // шаг назад — BackButton (вне Telegram «←» в шапке), своей кнопки «Назад» нет
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
        if (res.ok) { step3(res.data, params); return; }
        btn.disabled = false;
        if (res.error.code === 'validation_failed') { errors = W.serverFields(res.error.details && res.error.details.fields); step2(true); }
        if (res.error.code === 'goal_active_exists') return env.reboot();
        bottom.textContent = env.S.errorText(res.error) + (res.error.code === 'network' ? '' : '');
        bottom.hidden = false;
        btn.textContent = res.error.code === 'network' ? t('common.retry') : t('wizard.done');
      });
    }

    // ----- M-3 -----
    function step3(data, sent) {
      var goal = data.goal;
      onStep1 = false;
      env.setBack(false); // цель уже создана: назад к выбору пресета нельзя
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
      // Экран строится из ответа goal.create (todayPlan = null — «Цель начнётся»), app.bootstrap не вызывается
      box.appendChild(U.button(t('wizard.toToday'), function () { env.goalCreated(data, sent); }));
    }

    if (params && params.repeat) { // «Повторить эту цель»: сразу шаг 2; заготовки (presets) нужны только для кнопки «Назад»
      draft = W.initFromRepeat(params.repeat, { today: env.todayStr(), timezone: tz });
      highlightTarget = true;
      step2();
    } else {
      step1();
    }
    env.presets().then(function (res) {
      if (!res.ok) { if (onStep1) { box.textContent = ''; box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); box.appendChild(U.button(t('common.retry'), function () { env.reboot(); })); } return; }
      presets = res.data.presets;
      if (onStep1) step1();
    });
    return box;
  };
})(globalThis);

;
// S-10 «Сегодня»: ввод факта в минимум нажатий (screens.md §3.3, §5). Логика — js/today-logic.js.
(function (root) {
  'use strict';

  var screens = root.GT.screens = root.GT.screens || {};

  // Сегодня вне периода цели (app.bootstrap.today = null): ни today.get, ни ввода факта, ни «Сохранить»
  function outOfPeriod(env, kind) {
    var h = env.h;
    var t = env.t;
    var F = env.F;
    var U = env.U;
    var g = env.boot().activeGoal;
    var box = h('div', { class: 'today' });
    var period = F.period(g.startDate, g.endDate);
    if (kind === 'before') {
      box.appendChild(h('h2', { text: t('outOfPeriod.notStarted', { date: F.dateFull(g.startDate).slice(0, 5) }) }));
      box.appendChild(h('p', { class: 'big', text: g.title }));
      box.appendChild(h('p', { class: 'hint', text: t('outOfPeriod.notStartedText', { period: period }) }));
      return Promise.resolve(box);
    }
    box.appendChild(h('h2', { text: t('outOfPeriod.ended') }));
    box.appendChild(h('p', { text: t('outOfPeriod.endedText', { title: g.title, period: period }) }));
    var sum = h('p', { class: 'big' });
    box.appendChild(sum);
    // Одна кнопка: goal.complete → экран итога S-33 (строится из ответа, без app.bootstrap). Завершает владелец.
    if (env.isOwner() && !env.readOnly()) {
      var finish = U.button(t('outOfPeriod.finish'), function () {
        finish.disabled = true;
        env.completeGoal(g.id).then(function (r) { if (!r.ok) { finish.disabled = false; env.fail(r); } });
      });
      box.appendChild(h('div', { class: 'stack' }, finish));
    }
    // итог периода: один dashboard.get
    function fill(d) {
      var p = d.progress;
      sum.textContent = t('outOfPeriod.summary', { cur: F.num(p.currentValue), target: F.num(p.targetValue), unit: d.goal.unit, p: p.percent });
    }
    var rd = env.read(env.readSpec.dashboard(g.id)); // сохранённый итог сразу, свежий подменяет его
    if (rd.cached) { fill(rd.cached.data); rd.shown(); }
    rd.fresh.then(function (res) { if (res.ok) fill(res.data); });
    return Promise.resolve(box);
  }

  // S-41 «Нет активной цели» (screens.md §3.10): вкладки «Сегодня» и «Дашборд». «Создать цель» — владельцу с правом записи.
  screens.noGoal = function (env) {
    var h = env.h;
    var t = env.t;
    var box = h('div', { class: 'today' });
    box.appendChild(h('h2', { text: t('noGoal.none') }));
    if (env.boot().hasArchivedGoals) box.appendChild(h('p', { text: t('noGoal.archived') }));
    if (env.isOwner() && !env.readOnly()) box.appendChild(env.U.button(t('noGoal.create'), function () { env.go('wizard', {}); }));
    else if (!env.readOnly()) box.appendChild(h('p', { class: 'hint', text: t('noGoal.ownerOnly') }));
    return box;
  };

  screens.today = function (env, params) {
    if (env.noGoal()) return screens.noGoal(env);
    if (env.period()) return outOfPeriod(env, env.period());
    var h = env.h;
    var t = env.t;
    var F = env.F;
    var U = env.U;
    var ro = env.readOnly();
    var box = h('div', { class: 'today' });
    var editing = null;      // actionId, у которого сейчас открыт ввод числа
    var statusEl = null;
    var highlightDone = false;
    var me = env.myMember();
    var goalBrief = env.boot().activeGoal;
    var today = env.todayStr();

    // Контроллер один на сессию (вместе с очередью записи): при смене вкладки он отвязывается, накопленное уходит в фоне,
    // а возвращаясь сюда, экран подключается к тому же контроллеру и видит и значения, и плашку ошибки, если что-то не сохранилось.
    var ctrl = env.todayController();
    ctrl.bind({ onChange: draw, onGoalReached: function () { env.reboot(); }, onError: function () { /* статус виден на экране */ } });
    env.onLeave(function () { ctrl.leave(); });

    function s() { return ctrl.state; }

    function statusText() {
      var st = s().status;
      if (st === 'saving') return t('today.saving');
      if (st === 'error') return t('today.saveError');
      if (st === 'dirty') return t('today.dirty');
      return st === 'saved' ? t('today.saved') : '';
    }
    // Плашка ошибки сохранения: введённое остаётся на экране; можно повторить (сеть, занятость сервера) или обновить экран (повтором не исправить)
    function errorBanner() {
      var e = s().error || { code: 'network' };
      var retryable = ctrl.isRetryable();
      return h('div', { class: 'err-bar', role: 'alert' },
        h('span', { text: t(retryable ? 'today.errBannerRetry' : 'today.errBannerHard', { reason: env.S.errorText(e) }) }),
        U.button(t(retryable ? 'common.retry' : 'today.refresh'), function () { if (retryable) ctrl.retry(); else ctrl.refresh(); }));
    }

    function updateStatus() { if (statusEl) { statusEl.textContent = statusText(); statusEl.className = 'save-status ' + s().status; } }

    // ----- шапка дня -----
    function dayHeader() {
      var d = s().data;
      var date = s().date;
      var rem = goalBrief && goalBrief.direction === 'decline' ? d.goal.currentValue - d.goal.targetValue : d.goal.targetValue - d.goal.currentValue;
      var best = 0;
      d.actions.forEach(function (a) { if (a.streak > best) best = a.streak; });
      var label = date === today ? t('today.todayLabel', { date: F.dayLong(date) }) : F.dayLong(date);
      var prev = U.button('←', function () { go(env.D.addDays(date, -1)); }, { secondary: true, aria: t('today.prevDay'), disabled: !!goalBrief && date <= goalBrief.startDate });
      var next = U.button('→', function () { go(env.D.addDays(date, 1)); }, { secondary: true, aria: t('today.nextDay'), disabled: date >= today });
      return h('section', { class: 'card day-head' },
        h('div', { class: 'row between' }, prev, h('strong', { text: label }), next),
        h('p', { class: 'goal-line', text: t('today.goalLine', { cur: F.num(d.goal.currentValue), target: F.num(d.goal.targetValue), unit: d.goal.unit,
          rem: F.num(Math.max(0, rem)), days: d.goal.daysLeft, daysWord: F.plural(d.goal.daysLeft, [t('today.day1'), t('today.day2'), t('today.day5')]) }) }),
        best > 0 ? h('p', { class: 'hint', text: t('today.streak', { n: best }) }) : null);
    }

    function go(date) {
      ctrl.load(date).then(function (res) { if (!res.ok) env.fail(res); });
    }

    // ----- строка действия -----
    function valueButton(a) {
      var v = ctrl.value(a.id);
      var shown = v === null ? '—' : F.num(v);
      return h('button', { type: 'button', class: 'value' + (v === null ? ' empty' : ''), text: shown, disabled: ro,
        'aria-label': t('today.enterValue', { title: a.title }), onclick: function () { startEdit(a); } });
    }

    function startEdit(a) {
      editing = a.id;
      draw();
      var input = box.querySelector('input[data-edit="' + a.id + '"]');
      if (input) { input.focus(); input.select(); }
    }

    function commitEdit(a, input, cancel) {
      if (editing !== a.id) return;
      editing = null;
      var raw = input.value.trim();
      if (!cancel && raw !== '') {
        var v = U.parseNum(raw);
        if (v !== null && v >= 0) ctrl.setExact(a.id, v);
      }
      draw();
    }

    function editInput(a) {
      var v = ctrl.value(a.id);
      var input = h('input', { type: 'text', inputmode: 'decimal', 'data-edit': a.id, value: v === null ? '' : String(v).replace('.', ','), 'aria-label': a.title });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') commitEdit(a, input); if (e.key === 'Escape') commitEdit(a, input, true); });
      input.addEventListener('blur', function () { commitEdit(a, input); });
      return input;
    }

    function actionRow(a) {
      var marked = ctrl.isNormMarked(a.id);
      var done = ctrl.isDone(a.id);
      var normLine = t('today.norm', { n: F.num(a.norm), unit: a.unit }) + (a.norm > a.startNorm ? ' · ' + t('today.normGrew', { was: F.num(a.startNorm) }) : '');
      var normBtn = ro ? null : h('button', { type: 'button', class: 'sm' + (marked || done ? ' secondary' : ''), disabled: done && !marked,
        text: marked ? t('today.normUndo') : (done ? t('today.normDone') : t('today.normButton')), onclick: function () { ctrl.toggleNorm(a.id); } });
      var state = done ? t('today.done') : t('today.notDone');
      return h('div', { class: 'action' + (done ? ' done' : '') },
        h('div', { class: 'row between' }, h('strong', { text: a.title }), normBtn),
        h('p', { class: 'hint', text: normLine + ' · ' + state + (a.streak ? ' · ' + t('today.streakShort', { n: a.streak }) : '') + (ctrl.isRowDirty(a.id) ? ' · ' + t('today.rowDirty') : '') }),
        h('div', { class: 'row stepper' },
          ro ? null : U.button('−', function () { ctrl.minus(a.id); }, { aria: t('today.less', { title: a.title }) }),
          editing === a.id ? editInput(a) : valueButton(a),
          h('span', { class: 'unit-label', text: a.unit }),
          ro ? null : U.button('+', function () { ctrl.plus(a.id); }, { aria: t('today.more', { title: a.title }) })));
    }

    // ----- прогресс цели за день -----
    function progressBlock() {
      var d = s().data;
      var mode = d.progress.inputMode;
      // шаг «−/+» по оставшемуся диапазону (старта в today.get нет): для прироста за день — масштаб дня, для текущего значения — 1/100 диапазона
      var step = F.progressStep(d.goal.currentValue, d.goal.targetValue, mode === 'delta' ? 30 : 100);
      var val = s().progress ? s().progress.value : 0;
      var input = h('input', { type: 'text', inputmode: 'decimal', value: String(val).replace('.', ','), disabled: ro, 'aria-label': t(mode === 'current' ? 'today.progressNow' : 'today.progressAdded') });
      input.addEventListener('change', function () {
        var v = U.parseNum(input.value);
        if (v !== null && (mode === 'delta' || v >= 0)) ctrl.setProgress(v);
        else draw();
      });
      return h('section', { class: 'card' },
        h('label', null, h('span', { class: 'label', text: t(mode === 'current' ? 'today.progressNow' : 'today.progressAdded') }),
          h('div', { class: 'row stepper' },
            ro ? null : U.button('−', function () { ctrl.stepProgress(-1, step); }, { aria: t('today.progressLess') }),
            input, h('span', { class: 'unit-label', text: d.goal.unit }),
            ro ? null : U.button('+', function () { ctrl.stepProgress(1, step); }, { aria: t('today.progressMore') }))));
    }

    // ----- итог дня -----
    function summaryBlock() {
      var d = s().data;
      var sum = ctrl.summary();
      var K = ctrl.entered();
      var total = d.actions.length;
      var others = d.members.filter(function (m) { return !me || m.id !== me.id; });
      return h('section', { class: 'card' },
        total ? h('p', { class: 'summary', text: t('today.summary', { done: sum.doneCount, total: sum.totalCount, p: sum.percent }) }) : null,
        total ? h('p', { class: sum.dayEntered ? 'entered ok' : 'entered', text: sum.dayEntered ? t('today.dayEntered') : t('today.entered', { k: K, m: total }) }) : null,
        others.map(function (m) {
          return h('p', { class: 'hint', text: t('today.other', { name: m.displayName, done: m.doneCount, total: m.totalCount, state: t(m.factEntered ? 'today.otherEntered' : 'today.otherNot') }) });
        }));
    }

    // ----- разовые задачи -----
    function tasksBlock() {
      var d = s().data;
      if (!d.tasks) return null;
      return h('section', { class: 'card' }, h('h3', { text: t('today.tasks') }),
        d.tasks.length ? d.tasks.map(function (tk) {
          var c = h('input', { type: 'checkbox', checked: tk.done, disabled: ro });
          c.addEventListener('change', function () {
            tk.done = c.checked;
            env.call('task.setDone', { taskId: tk.id, done: c.checked }).then(function (res) { if (!res.ok) { tk.done = !c.checked; env.fail(res); } draw(); });
          });
          return h('label', { class: 'check' + (tk.overdue ? ' overdue' : '') }, c,
            h('span', { text: tk.title + (tk.overdue ? ' · ' + t('today.overdue') : '') }));
        }) : h('p', { class: 'hint', text: t('today.noTasks') }),
        ro ? null : U.button(t('today.addTask'), function () { env.go('tasks', { goalId: d.goal.id }); }, { secondary: true }));
    }

    function draw() {
      if (!s().data) return;
      if (editing) { updateStatus(); return; }
      var d = s().data;
      var scroll = window.scrollY;
      box.textContent = '';
      var stale = env.staleState();
      if (stale === 'loading') box.appendChild(h('p', { class: 'notice', text: t('today.refreshing') }));
      if (stale === 'failed') box.appendChild(h('div', { class: 'notice' }, h('span', { text: t('today.cachedOffline') }), U.button(t('common.retry'), function () { env.retryBoot(); }, { secondary: true })));
      if (s().restored && !ro) {
        box.appendChild(h('div', { class: 'notice restored' }, h('p', { text: t('today.restored', { date: F.dayLong(s().restored) }) }),
          h('div', { class: 'actions' }, U.button(t('today.save'), function () { ctrl.save(); }, { disabled: !!stale }), U.button(t('today.discard'), function () { ctrl.discard(); }, { secondary: true }))));
      }
      if (s().undo && !ro) {
        box.appendChild(h('div', { class: 'undo-bar' }, h('span', { text: t('today.allMarked') }), U.button(t('today.undo'), function () { ctrl.undo(); }, { secondary: true })));
      }
      if (s().status === 'error') box.appendChild(errorBanner());
      box.appendChild(dayHeader());
      var fact = h('section', { class: 'card fact' + (params.factMode && !highlightDone ? ' highlight' : ''), id: 'fact' }, h('h3', { text: t('today.factTitle') }));
      if (!d.actions.length) fact.appendChild(h('p', { class: 'hint', text: t('today.noActions') }));
      d.actions.forEach(function (a) { fact.appendChild(actionRow(a)); });
      var sum = ctrl.summary();
      if (!ro && d.actions.length) {
        var row = h('div', { class: 'actions' });
        if (ctrl.anyBelowNorm()) row.appendChild(U.button(t('today.completeAll'), function () { ctrl.completeAll(); }, { disabled: !!stale }));
        if (!sum.dayEntered) row.appendChild(U.button(t('today.finish'), function () { ctrl.finish(); }, { secondary: true, disabled: !!stale }));
        fact.appendChild(row);
      }
      statusEl = h('p', { class: 'save-status ' + s().status, text: statusText() });
      fact.appendChild(statusEl);
      // Вне Telegram (кнопки MainButton нет) «Сохранить» рисуется на странице
      var ui = ctrl.ui();
      if (!ro && ui.show && !env.hasMainButton()) {
        fact.appendChild(U.button(t('today.save'), function () { ctrl.press(); }, { disabled: ui.loading }));
      }
      box.appendChild(fact);
      box.appendChild(progressBlock());
      box.appendChild(summaryBlock());
      var tb = tasksBlock();
      if (tb) box.appendChild(tb);
      if (d.actions.some(function (a) { return a.normWarning; })) box.appendChild(h('p', { class: 'notice', text: t('today.normWarning') }));
      if (params.factMode && !highlightDone) { highlightDone = true; fact.scrollIntoView({ block: 'start' }); } else window.scrollTo(0, scroll);
    }

    // Первый день приходит в app.bootstrap (env выставил его в контроллер), отдельного запроса при открытии нет
    return ctrl.open(params.date, today).then(function (res) {
      if (!res.ok) {
        if (res.error.code === 'no_active_goal') return h('div', null, h('h2', { text: t('noGoal.title') }), h('p', { text: t('noGoal.text') }));
        return h('div', null, h('p', { class: 'error', text: env.S.errorText(res.error) }), U.button(t('common.retry'), function () { env.tab('today'); }));
      }
      draw();
      return box;
    });
  };
})(globalThis);

;
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

;
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
    if (env.noGoal() && !params.goalId) return screens.noGoal(env); // S-41: дашборд прошлой цели открывается из карточки истории
    var h = env.h;
    var t = env.t;
    var F = env.F;
    var box = h('div');
    var period = params.periodDays || 14;
    var goalId = params.goalId;

    function render(res) {
      box.textContent = '';
      if (!res.ok) {
        if (res.error.code === 'no_active_goal') { box.appendChild(h('h2', { text: t('noGoal.title') })); box.appendChild(h('p', { text: t('noGoal.text') })); return box; }
        box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) }));
        box.appendChild(env.U.button(t('common.retry'), load));
        return box;
      }
      draw(res.data);
      return box;
    }

    // Период по умолчанию (14 дней) идёт через кэш: сначала сохранённое, свежее подменяет его тихо; 7 и 30 дней — обычный запрос
    var seq = 0;
    function load() {
      var my = ++seq;
      var gid = goalId || (env.boot().activeGoal && env.boot().activeGoal.id);
      if (period !== 14 || !gid) return env.call('dashboard.get', goalId ? { goalId: goalId, periodDays: period } : { periodDays: period }).then(render);
      var r = env.read(env.readSpec.dashboard(gid, !!goalId));
      var shownJson = null;
      if (r.cached) { render({ ok: true, data: r.cached.data }); shownJson = JSON.stringify(r.cached.data); r.shown(); }
      var fresh = r.fresh.then(function (res) {
        if (my !== seq) return box; // за это время выбран другой период
        if (r.cached && ((res.ok && JSON.stringify(res.data) === shownJson) || (!res.ok && res.error.code !== 'no_active_goal'))) return box; // то же самое или свежих нет: остаётся сохранённое
        return render(res);
      });
      return r.cached ? box : fresh;
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
          // Открытый день (open) — это сегодня, он ещё не закрыт: «не внесён» — не пропуск и не 0 %
          var parts = day.perMember.map(function (m) {
            var name = memberName(env, m.memberId) || t('review.member');
            if (day.open) return name + ' ' + (m.missing ? t('review.openNotEntered') : t('review.openEntered', { p: m.percent }));
            return name + ' ' + m.percent + ' %' + (m.missing ? ' (' + t('review.missing') + ')' : '');
          }).join(' · ');
          var emptyOpen = day.open && day.perMember.every(function (m) { return m.missing; });
          var row = h('button', { type: 'button', class: 'secondary slice-row', onclick: function () { env.go('today', { date: day.date }); } },
            h('strong', { text: day.open ? t('review.todayOpen', { date: F.dayShort(day.date) }) : F.dayShort(day.date) }),
            emptyOpen ? null : h('span', { text: t('review.dayDelta', { d: F.delta(day.progressDelta), unit: g.unit }) }), h('span', { class: 'hint', text: parts }));
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

    var pages = 1; // сколько страниц уже показано: свежая первая страница не затирает подгруженные
    function drawItems(data, cursor) {
      more.textContent = '';
      if (!data.items.length && !cursor) list.appendChild(h('p', { class: 'hint', text: t('review.historyEmpty') }));
      data.items.forEach(function (it) {
        list.appendChild(h('button', { type: 'button', class: 'secondary history-row', onclick: function () { env.go('card', { goalId: it.goalId }); } },
          h('strong', { text: it.title }),
          h('span', { class: 'hint', text: F.period(it.startDate, it.endDate) }),
          h('span', { text: t('review.histLine', { target: F.num(it.targetValue), unit: it.unit, final: F.num(it.finalValue), p: it.percent }) }),
          h('span', { class: 'badge ' + (it.outcome === 'success' ? 'ok' : ''), text: outcomeText(env, it.outcome) }),
          it.reflectionPreview ? h('span', { class: 'hint', text: it.reflectionPreview }) : null));
      });
      if (data.nextCursor) more.appendChild(env.U.button(t('review.more'), function () { load(data.nextCursor); }, { secondary: true }));
    }
    function drawError(res, cursor) {
      more.textContent = '';
      list.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) }));
      more.appendChild(env.U.button(t('common.retry'), function () { load(cursor); }));
    }

    function load(cursor) {
      if (cursor) { // следующие страницы — обычный запрос, в кэш не идут
        var p = { limit: 20, cursor: cursor };
        if (env.noGoal()) p.status = 'completed';
        return env.call('history.list', p).then(function (res) {
          if (!res.ok) return drawError(res, cursor);
          pages++;
          drawItems(res.data, cursor);
        });
      }
      // первая страница: сохранённое сразу, свежее подменяет его тихо
      var r = env.read(env.readSpec.historyList());
      var shownJson = null;
      if (r.cached) { drawItems(r.cached.data, null); shownJson = JSON.stringify(r.cached.data); r.shown(); }
      return r.fresh.then(function (res) {
        if (r.cached) {
          if (!res.ok || pages > 1 || JSON.stringify(res.data) === shownJson) return; // свежих нет, либо уже подгружены другие страницы, либо то же самое
          list.textContent = '';
        }
        if (!res.ok) return drawError(res, null);
        drawItems(res.data, null);
      });
    }
    load();
    return box;
  };

  // Итог периода (карточка S-31 и экран итога S-33): результат, достигнуто, план/факт, серия
  function resultSection(env, g, r) {
    var h = env.h;
    var t = env.t;
    return h('section', { class: 'card' }, h('h3', { text: t('review.result') }),
      h('p', { class: 'big', text: outcomeText(env, r.outcome) }),
      h('p', { text: t('review.final', { v: env.F.num(r.finalValue), unit: g.unit }) + ' · ' + r.percent + ' %' }),
      h('p', { text: t('review.planFactPct', { p: r.planFactPercent }) }),
      h('p', { text: t('review.bestStreak', { n: r.bestStreak }) }));
  }

  // ---------- S-31 Карточка цели ----------
  screens.card = function (env, params) {
    var h = env.h;
    var t = env.t;
    var F = env.F;
    var ro = env.readOnly();
    // Завершённая цель не меняется: из кэша — сразу и без запроса (обновляется после сохранения рефлексии); идущая цели — обычный запрос
    var r = env.read(env.readSpec.card(params.goalId));
    function build(res) {
      var box = h('div');
      if (!res.ok) { box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); return box; }
      var d = res.data;
      var g = d.goal;
      box.appendChild(h('h2', { text: g.title }));
      box.appendChild(h('p', { class: 'hint', text: F.period(g.startDate, g.endDate) + ' · ' + t('review.target', { v: F.num(g.targetValue), unit: g.unit }) }));
      if (d.result) {
        box.appendChild(resultSection(env, g, d.result));
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
    }
    if (r.cached) {
      var el = build({ ok: true, data: r.cached.data });
      var shownJson = JSON.stringify(r.cached.data);
      r.shown();
      if (r.fresh) r.fresh.then(function (res) { // свежее подменяет тихо, только если отличается; ошибка — остаётся сохранённое
        if (res.ok && JSON.stringify(res.data) !== shownJson) { el.textContent = ''; el.appendChild(build(res)); }
      });
      return el;
    }
    return r.fresh.then(build);
  };

  // Три поля рефлексии (S-32 и блок на S-33); mine — моя запись из history.get или undefined
  function reflectionFields(env, mine) {
    var fields = {};
    var els = [['worked', 'reflection.worked'], ['mistakes', 'reflection.mistakes'], ['different', 'reflection.different']].map(function (k) {
      var ta = env.h('textarea', { 'aria-label': env.t(k[1]), maxlength: '1000' });
      ta.value = mine && mine[k[0]] ? mine[k[0]] : '';
      fields[k[0]] = ta;
      return env.U.field(env.t(k[1]), ta);
    });
    return {
      els: els,
      values: function () { return { worked: fields.worked.value, mistakes: fields.mistakes.value, different: fields.different.value }; },
      isEmpty: function () { return !(fields.worked.value.trim() || fields.mistakes.value.trim() || fields.different.value.trim()); }
    };
  }

  function myReflection(env, d) {
    var me = env.myMember();
    return (d.reflections || []).filter(function (r) { return me && r.authorMemberId === me.id; })[0];
  }

  // ---------- S-32 Рефлексия (правка из карточки S-31) ----------
  screens.reflection = function (env, params) {
    var h = env.h;
    var t = env.t;
    var goalId = params.goalId;
    var box = h('div');
    var err = h('p', { class: 'error', hidden: true });

    var rd = env.read(env.readSpec.card(goalId)); // запись самой рефлексии берём из кэша карточки, если она там есть
    function build(res) {
      var form = reflectionFields(env, res.ok ? myReflection(env, res.data) : null);
      box.appendChild(h('h2', { text: t('reflection.title') }));
      if (res.ok) box.appendChild(h('p', { class: 'hint', text: res.data.goal.title }));
      form.els.forEach(function (el) { box.appendChild(el); });
      box.appendChild(err);
      var save = env.U.button(t('reflection.save'), function () {
        save.disabled = true;
        err.hidden = true;
        env.call('reflection.save', Object.assign({ goalId: goalId }, form.values())).then(function (r) {
          if (r.ok) return env.back();
          save.disabled = false;
          err.textContent = env.S.errorText(r.error); err.hidden = false;
        });
      });
      box.appendChild(h('div', { class: 'actions' }, save, env.U.button(t('common.cancel'), function () { env.back(); }, { secondary: true })));
      return box;
    }
    if (rd.cached) { var el = build({ ok: true, data: rd.cached.data }); rd.shown(); return el; }
    return rd.fresh.then(build);
  };

  // ---------- S-33 Итог цели (screens.md §3.7) ----------
  // После goal.complete данные приходят в params.summary ({ goal, result, repeat }), без запроса; при перезапуске (prompts.reflectionGoalId) — из history.get.
  screens.summary = function (env, params) {
    var h = env.h;
    var t = env.t;
    var U = env.U;
    var goalId = params.reflectionGoalId;
    var source = params.summary ? Promise.resolve({ ok: true, data: params.summary }) : env.call('history.get', { goalId: goalId });

    return source.then(function (res) {
      var box = h('div');
      if (!res.ok) {
        box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) }));
        box.appendChild(U.button(t('common.retry'), function () { env.reboot(); }));
        return box;
      }
      var d = res.data;
      var g = d.goal;
      var form = reflectionFields(env, myReflection(env, d));
      var state = 'open'; // рефлексия: open → saved | skipped
      var reflectionBox = h('section', { class: 'card' });
      var err = h('p', { class: 'error', hidden: true });

      // Уходя с экрана, рефлексию закрываем в фоне: введённое сохраняем, пустое пропускаем (иначе сервер покажет её снова)
      function flush() {
        if (state !== 'open') return;
        state = 'skipped';
        if (form.isEmpty()) env.dismissReflection(goalId || g.id);
        else env.call('reflection.save', Object.assign({ goalId: goalId || g.id }, form.values()), { reason: 'background' }).then(function () { /* ответ не нужен */ });
      }
      function leave(repeat) {
        flush();
        env.closeSummary(); // «Нет активной цели» (S-41); мастер открывается поверх с кнопкой «Назад» на S-41
        if (repeat !== undefined) env.go('wizard', repeat ? { repeat: repeat } : {});
      }

      function drawReflection() {
        reflectionBox.textContent = '';
        if (state === 'skipped') { reflectionBox.hidden = true; return; }
        reflectionBox.appendChild(h('h3', { text: t('reflection.title') }));
        if (state === 'saved') { reflectionBox.appendChild(h('p', { text: t('summary.saved') })); return; }
        form.els.forEach(function (el) { reflectionBox.appendChild(el); });
        reflectionBox.appendChild(err);
        var save = U.button(t('reflection.save'), function () {
          save.disabled = true;
          err.hidden = true;
          env.call('reflection.save', Object.assign({ goalId: goalId || g.id }, form.values())).then(function (r) {
            if (r.ok) { state = 'saved'; drawReflection(); return; }
            save.disabled = false;
            err.textContent = env.S.errorText(r.error); err.hidden = false;
          });
        });
        // «Пропустить»: экран закрывается сразу, запрос в фоне, ошибку сети не показываем
        reflectionBox.appendChild(h('div', { class: 'actions' }, save, U.button(t('reflection.skip'), function () {
          state = 'skipped';
          env.dismissReflection(goalId || g.id);
          drawReflection();
        }, { secondary: true })));
      }

      box.appendChild(h('h2', { text: t('summary.title') }));
      box.appendChild(h('p', { class: 'hint', text: g.title + ' · ' + env.F.period(g.startDate, g.endDate) }));
      if (d.result) box.appendChild(resultSection(env, g, d.result));
      drawReflection();
      box.appendChild(reflectionBox);

      // Новую цель создаёт владелец; если цель уже есть (рефлексия старой цели вернулась при перезапуске), кнопок «новая цель» нет
      var actions = h('div', { class: 'stack' });
      if (env.isOwner() && !env.boot().activeGoal) {
        actions.appendChild(U.button(t('summary.newGoal'), function () { leave(null); }));
        if (d.repeat) actions.appendChild(U.button(t('summary.repeat'), function () { leave(d.repeat); }, { secondary: true }));
      } else if (!env.isOwner()) {
        actions.appendChild(h('p', { class: 'hint', text: t('noGoal.ownerOnly') }));
      }
      actions.appendChild(U.button(t('common.close'), function () { leave(); }, { secondary: true }));
      box.appendChild(actions);
      return box;
    });
  };
})(globalThis);

;
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
    var touched = false; // человек уже вводит новую цель: свежие данные форму не перезаписывают
    var shownJson = null;
    function draw(data) {
      box.textContent = '';
      var g = data.goal;
      var preview = h('div', { class: 'card', hidden: true });
      var err = h('p', { class: 'error', hidden: true });
      var target = U.numberInput(g.targetValue, check, { negative: true, aria: t('raise.newTarget') });
      var end = h('input', { type: 'date', value: g.endDate, min: env.D.addDays(env.todayStr(), 1), 'aria-label': t('raise.newEnd') });
      end.addEventListener('change', check);
      var apply = U.button(t('raise.apply'), doApply, { disabled: true });
      var current = null;

      function check() {
        touched = true;
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
    }

    // Сохранённые данные цели показываем сразу, свежие подменяют их тихо (но не поверх начатого ввода)
    var rd = env.read(env.readSpec.goal(params.goalId));
    if (rd.cached) { draw(rd.cached.data); shownJson = JSON.stringify(rd.cached.data); rd.shown(); }
    var fresh = rd.fresh.then(function (res) {
      if (!res.ok) {
        if (rd.cached) return box;
        box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) }));
        return box;
      }
      if (rd.cached && (touched || JSON.stringify(res.data) === shownJson)) return box;
      draw(res.data);
      return box;
    });
    return rd.cached ? box : fresh;
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
            env.completeGoal(goal.id).then(function (r) { if (!r.ok) env.fail(r); });
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

;
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

  // «Тема» (контракт 10): Авто / Светлая / Тёмная, только на устройстве, запросов к API нет
  function themeSection(env) {
    var h = env.h;
    var current = env.theme.get();
    var seg = h('div', { class: 'seg', role: 'group', 'aria-label': env.t('settings.theme') });
    var PREFS = root.GT.theme.PREFS;
    PREFS.forEach(function (pref) {
      var btn = h('button', { type: 'button', class: pref === current ? 'on' : 'secondary', text: env.t('theme.' + pref), 'aria-pressed': String(pref === current),
        onclick: function () {
          env.theme.set(pref);
          Array.prototype.forEach.call(seg.children, function (c, i) {
            var on = PREFS[i] === pref;
            c.className = on ? 'on' : 'secondary';
            c.setAttribute('aria-pressed', String(on));
          });
        } });
      seg.appendChild(btn);
    });
    return h('section', { class: 'card' }, h('h3', { text: env.t('settings.theme') }), seg);
  }

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
    box.appendChild(themeSection(env));
    if (b.mode === 'whitelist') { // только в режиме беты
      box.appendChild(h('section', { class: 'card' },
        h('p', { class: 'hint', text: t('settings.betaVersion', { v: env.cfg.APP_VERSION || '0', env: b.env }) }),
        env.U.button(t('settings.copyReport'), function () { copyReport(env); }, { secondary: true }),
        env.U.button(t('settings.report'), function () { env.openTg(SUPPORT_URL); }, { secondary: true })));
    }
    box.appendChild(diagnostics(env));
    return box;
  };

  // ---------- Диагностика: последние запросы и время ответа сервера (для разработчика) ----------
  function reportText(env) {
    var t = env.t;
    function ageText(ms) {
      if (ms == null) return '—';
      var s = Math.round(ms / 1000);
      return s < 90 ? t('diag.ageSec', { n: s }) : s < 5400 ? t('diag.ageMin', { n: Math.round(s / 60) }) : t('diag.ageHour', { n: Math.round(s / 3600) });
    }
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
    var mk = d.marks();
    if (mk.scripts || mk.firstScreen) {
      lines.push(t('diag.marks', { scripts: mk.scripts ? mk.scripts.ms : '—', first: mk.firstScreen ? mk.firstScreen.ms : '—', what: mk.firstScreen ? mk.firstScreen.note : '—' }));
    }
    if (!sm.total) lines.push(t('diag.noCalls'));
    if (sm.cold) lines.push(t('diag.cold', { method: sm.cold.method, ms: sm.cold.ms, result: sm.cold.code }));
    if (sm.warm) lines.push(t('diag.warm', { n: sm.warm.n, avg: sm.warm.avg, median: sm.warm.median, min: sm.warm.min, max: sm.warm.max, p90: sm.warm.p90 }));
    if (sm.total) lines.push(t('diag.failures', { n: sm.failures, total: sm.total }));
    if (sm.perMethod.length) lines.push(t('diag.perMethod', { list: sm.perMethod.map(function (m) { return m.method + ' ' + m.avg + ' (' + m.n + ')'; }).join('; ') }));
    var list = d.list();
    if (list.length) {
      lines.push(t('diag.last', { n: list.length }));
      list.forEach(function (r) {
        var withServer = r.attempts.some(function (a) { return a.serverMs != null; });
        var att = r.attempts.length > 1 || r.code !== 'ok' || withServer
          ? t('diag.attempts', { list: r.attempts.map(function (a) { return a.ms + ' ' + a.result + (a.serverMs != null ? t('diag.serverMs', { n: a.serverMs }) : ''); }).join(', ') }) : '';
        var cm = r.cached ? t('diag.cachedMark', { shown: r.cached.shownMs != null ? r.cached.shownMs : '—', age: ageText(r.cached.ageMs) }) : '';
        lines.push(t('diag.line', { time: clock(r.startedAt), method: r.method, reason: r.reason ? t('diag.reasons.' + r.reason) : '—', since: r.sinceOpen != null ? r.sinceOpen : '—',
          ms: r.ms, code: r.code, id: r.requestId, attempts: att + cm }));
      });
    }
    var shown = d.cacheList();
    if (shown.length) {
      lines.push(t('diag.cacheHeader'));
      shown.forEach(function (c) {
        lines.push(t('diag.cacheLine', { time: clock(c.at), method: c.method, shown: c.shownMs, age: ageText(c.ageMs), refresh: t(c.refreshed ? 'diag.cacheRefresh' : 'diag.cacheNoRefresh') }));
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

  // «Скопировать отчёт» в одно нажатие, без раскрытия блока «Диагностика»; от активной цели не зависит (запросов к API нет)
  function copyReport(env) {
    var area = env.h('textarea', { readonly: true, 'aria-hidden': 'true', tabindex: '-1', style: 'position:fixed;top:0;left:0;opacity:0;width:1px;height:1px' });
    area.value = reportText(env);
    document.body.appendChild(area);
    copyText(area).then(function (ok) { area.remove(); env.toast(env.t(ok ? 'diag.copied' : 'diag.copyFail'), ok ? '' : 'error'); });
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
    var box = h('div');
    var dirty = false; // человек уже правит форму: свежие данные её не перезаписывают
    var shownJson = null;
    function draw(data) {
      box.textContent = '';
      var g = data.goal;
      var title = h('input', { type: 'text', value: g.title, disabled: !owner, 'aria-label': t('wizard.fTitle') });
      var unit = h('input', { type: 'text', value: g.unit, disabled: !owner, 'aria-label': t('wizard.fUnit') });
      var end = h('input', { type: 'date', value: g.endDate, disabled: !owner, min: env.todayStr(), 'aria-label': t('wizard.fEnd') });
      [title, unit, end].forEach(function (el) { el.addEventListener('input', function () { dirty = true; }); el.addEventListener('change', function () { dirty = true; }); });
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
            dirty = false;
            env.boot().activeGoal.title = r.data.goal.title;
            env.toast(t('settings.saved'));
          });
        });
        box.appendChild(save);
        box.appendChild(h('div', { class: 'stack' },
          U.button(t('reached.raise'), function () { env.go('raiseBar', { goalId: g.id }); }, { secondary: true }),
          U.button(t('goalSettings.complete'), function () {
            U.confirmDialog(t('reached.confirm'), t('reached.finish'), true).then(function (ok) {
              if (ok) env.completeGoal(g.id).then(function (r) { if (!r.ok) env.fail(r); });
            });
          }, { danger: true })));
      }
    }

    // Сохранённое показываем сразу; свежее подменяет его тихо, но не поверх начатой правки
    var rd = env.read(env.readSpec.goal(params.goalId));
    if (rd.cached) { draw(rd.cached.data); shownJson = JSON.stringify(rd.cached.data); rd.shown(); }
    var fresh = rd.fresh.then(function (res) {
      if (!res.ok) {
        if (rd.cached) return box; // свежих нет: остаётся сохранённое
        box.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) }));
        return box;
      }
      if (rd.cached && (dirty || JSON.stringify(res.data) === shownJson)) return box;
      draw(res.data);
      return box;
    });
    return rd.cached ? box : fresh;
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
      var rd = env.read(env.readSpec.goal(params.goalId)); // сохранённый список сразу, свежий подменяет его тихо
      var shownJson = null;
      if (rd.cached) { data = rd.cached.data; drawList(); shownJson = JSON.stringify(data); rd.shown(); }
      return rd.fresh.then(function (res) {
        if (!res.ok) {
          if (rd.cached) return; // свежих нет: остаётся сохранённое
          list.textContent = ''; list.appendChild(h('p', { class: 'error', text: env.S.errorText(res.error) })); return;
        }
        if (JSON.stringify(res.data) === shownJson) return;
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

;
// Оболочка: запуск, навигация (вкладки и подэкраны), общий env для экранов. Сами экраны — js/screens/*.js.
(function () {
  'use strict';

  var GT = window.GT;
  var S = GT.strings;
  var t = S.t;
  var U = GT.ui;
  var h = U.h;
  var cfg = window.GT_CONFIG || {};
  var query = new URLSearchParams(location.search);
  var mode = GT.mode.resolveMode(cfg, query.get('mode')); // в beta всегда real (ALLOW_MOCK:false)
  var root = document.getElementById('app');

  GT.diag = GT.diagLogic.createDiag(); // журнал запросов для блока «Диагностика»
  var tg = null;          // Telegram.WebApp (real) или null
  var flow = null;
  var desc = null;        // последний descriptor потока запуска
  var nav = { tab: 'today', stack: [], first: true }; // stack — подэкраны внутри вкладки
  var helpOpen = false;
  var viewToken = 0;
  var shell = null;
  var staleState = null;  // null | 'loading' (показан кэш, bootstrap идёт) | 'failed' (кэш показан, связи нет)
  var lastBoot = null;    // последний свежий ответ app.bootstrap (из него и из сохранений строится кэш «Сегодня»)
  var uid = 'anon';       // ключ кэша: Telegram ID (в mock — сценарий)

  // Метки старта для «Диагностики»: мс от открытия страницы (performance.now отсчитывается от начала навигации)
  function sinceOpen() { return typeof performance !== 'undefined' && performance.now ? performance.now() : 0; }
  GT.diag.mark('scripts', sinceOpen());

  // Тема: data-theme на <html>, цвета шапки и панели Telegram; «Авто» следует за Telegram (themeChanged)
  var theme = GT.theme.createTheme({
    getStorage: function () { return window.localStorage; },
    getTg: function () { return tg; },
    isDark: function () { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); },
    root: document.documentElement
  });
  // Заставка с логотипом видна, пока идёт загрузка; с первым настоящим экраном (в том числе из кэша) её не остаётся
  function hideSplash() { var s = document.getElementById('splash'); if (s) s.remove(); }

  var TABS = ['today', 'dashboard', 'history', 'settings'];
  var SVG_NS = 'http://www.w3.org/2000/svg';

  // Хранилища в localStorage (чтение и запись в try/catch внутри createStore): черновики дней и кэш последнего «Сегодня»
  function getStorage() { return window.localStorage; }
  var draftStore = GT.todayLogic.createStore(getStorage, 'gt:draft:v1:');
  var cacheStore = GT.todayLogic.createStore(getStorage, 'gt:today:v1:');

  // ---------- env: всё, что нужно экранам ----------
  function boot() { return desc && desc.boot ? desc.boot : flow.state.boot; }
  // Кэш чтений вкладок (gt:data:v2): область — окружение, кабинет и участник; чужой кабинет и другой участник кэша не видят
  var dataCache = GT.dataCache.createDataCache({
    getStorage: getStorage,
    scope: function () {
      var b = desc && desc.boot ? desc.boot : (flow && flow.state.boot);
      if (!b || !b.cabinet || !b.me) return null;
      return [b.env || cfg.EXPECTED_ENV, b.cabinet.id, b.me.memberId].join(':');
    }
  });
  // Чтения вкладок поверх кэша и фоновая загрузка (логика и тесты — data-cache.js); очередь записи факта создаётся ниже, поэтому обращение отложенное
  var tabData = GT.dataCache.createTabData({
    cache: dataCache,
    call: function (m, p, o2) { return env.call(m, p, o2); },
    writes: { outstanding: function () { return writeQueue.outstanding(); }, idle: function () { return writeQueue.idle(); } },
    boot: function () { return boot(); },
    noGoal: function () { return env.noGoal(); },
    clock: sinceOpen,
    onShown: function (r) { GT.diag.cacheShown(r); }
  });
  var tabSpec = tabData.spec;
  var presetsPromise = null;
  var TAB_READS = /^(dashboard\.get|history\.list|history\.get)$/;
  var env = {
    h: h, t: t, S: S, U: U, F: GT.format, D: GT.dates, cfg: cfg, mode: mode, diag: GT.diag,
    get tg() { return tg; },
    theme: theme,
    // opts.reason — причина запроса для «Диагностики»: start | action (по умолчанию) | tab (дашборд, история) | background
    call: function (method, params, opts) {
      var o = Object.assign({ reason: TAB_READS.test(method) ? 'tab' : 'action' }, opts);
      dataCache.beforeWrite(method, params);
      return flow.call(method, params, o).then(function (res) {
        dataCache.afterWrite(method, params, res);
        if (res.ok && (method === 'goal.complete' || method === 'goal.create')) forgetGoal(); // цель сменилась: черновики прежней цели не нужны
        if (res.ok && method === 'reflection.save' && params && params.goalId) env.prefetch(tabSpec.card(params.goalId)); // карточка обновится в фоне, пока человек возвращается
        return res;
      });
    },
    // Чтение для вкладки с кэшем: env.read(env.readSpec.dashboard(…)) → { cached, fresh, shown() }; описание — createTabData в data-cache.js
    read: function (spec) { return tabData.read(spec); },
    prefetch: function (spec) { return tabData.prefetch(spec); },
    readSpec: tabSpec,
    // presets.list не меняется за сеанс: один запрос на сеанс, неудача в кэш не попадает
    presets: function (background) {
      if (!presetsPromise) {
        presetsPromise = env.call('presets.list', {}, background ? { reason: 'background' } : undefined).then(function (res) { if (!res.ok) presetsPromise = null; return res; });
      }
      return presetsPromise;
    },
    staleState: function () { return staleState; },
    hasMainButton: function () { return !!(tg && tg.MainButton); },
    // Свой шаг «назад» внутри экрана (шаг мастера): fn — обработчик, false — BackButton скрыт, без аргумента — по умолчанию (подэкран → назад)
    setBack: function (fn) { screenBack = fn === undefined || fn === null ? undefined : fn; syncBack(); },
    retryBoot: function () { staleState = 'loading'; if (todayCtrl) todayCtrl.setStale(true); flow.retry(); },
    boot: boot,
    // Свою запись в кабинете узнаём по me.memberId из app.bootstrap, а не по роли.
    myMember: function () {
      var b = boot();
      if (!b.me || !b.cabinet) return null;
      return (b.cabinet.members || []).filter(function (m) { return m.id === b.me.memberId; })[0] || null;
    },
    isOwner: function () { return boot().role === 'owner'; },
    readOnly: function () { return !!(desc && desc.readOnly); },
    period: function () { return desc && desc.period ? desc.period : null; }, // 'before' | 'after': сегодня вне периода активной цели
    todayStr: function () { var b = boot(); return GT.dates.todayIn(b.cabinet ? b.cabinet.timezone : 'Europe/Moscow', Date.now()); },
    go: function (name, params) { nav.stack.push({ name: name, params: params || {} }); showCurrent(); },
    back: function () { nav.stack.pop(); showCurrent(); },
    tab: function (name) { nav.tab = name; nav.stack = []; renderChrome(); showCurrent(); },
    reboot: function (keepTab) { nav.keepTab = !!keepTab; return flow.retry(); },
    noGoal: function () { return !!(desc && desc.noGoal); }, // S-41: активной цели нет, архивные есть (или участник ждёт владельца)
    completeGoal: completeGoal, closeSummary: closeSummary, goalCreated: goalCreated, dismissReflection: dismissReflection,
    toast: U.toast,
    fail: function (res) { U.toast(S.errorText(res.error), 'error'); },
    openLink: function (url) { if (tg && tg.openLink) tg.openLink(new URL(url, location.href).href); else window.open(url, '_blank', 'noopener'); },
    openTg: function (url) { if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, '_blank', 'noopener'); },
    schedule: function (fn, ms) { return setTimeout(fn, ms); },
    cancel: function (hnd) { clearTimeout(hnd); },
    flow: function () { return flow; },
    loading: function () { onDescriptor({ screen: 'loading' }); },
    skipEmail: function () { onDescriptor(Object.assign({}, desc, { screen: 'today' })); }
  };

  // ---------- ввод факта: один контроллер и одна очередь записи на сессию ----------
  // Нажатия на «Сегодня» меняют только экран (черновик в localStorage); на сервер день уходит одним day.save по кнопке «Сохранить»
  // (Telegram MainButton). Сервер не хранит журнал повторов для day.save, day.completeAll, day.finish, поэтому запросы записи идут
  // строго по одному через общую очередь, а контроллер «Сегодня» переживает смену вкладок (иначе у нового экрана была бы своя очередь).
  var writeQueue = GT.todayLogic.createWriteQueue();
  var todayCtrl = null;
  // Смена цели (goal.complete, goal.create) или ответ goal_archived / goal_not_found: черновики и кэш «Сегодня» прежней цели удаляются без отправки
  function forgetGoal() {
    draftStore.clear();
    cacheStore.remove(uid);
    lastBoot = null;
    if (todayCtrl) todayCtrl.forget();
  }
  var leaveHooks = [];
  env.todayController = function () {
    if (!todayCtrl) {
      todayCtrl = GT.todayLogic.createToday({
        call: function (m, p, o2) { return env.call(m, p, o2); }, queue: writeQueue, schedule: env.schedule, cancel: env.cancel,
        drafts: draftStore, scope: function () { var b = boot(); return b && b.cabinet ? b.cabinet.id : ''; },
        onStatus: syncTelegramButtons, onServer: saveCache,
        onGoalGone: function () { cacheStore.remove(uid); lastBoot = null; U.toast(t('today.goalGone'), 'error'); env.reboot(); },
        myMemberId: function () { var m = env.myMember(); return m && m.id; }
      });
    }
    return todayCtrl;
  };
  env.onLeave = function (fn) { leaveHooks.push(fn); };
  function runLeaveHooks() {
    var hooks = leaveHooks;
    leaveHooks = [];
    hooks.forEach(function (fn) { try { fn(); } catch (e) { /* уход с экрана не должен ломаться */ } });
  }

  // Кнопка Telegram «Сохранить» видна только при несохранённом; пока есть несохранённое, закрытие приложения просит подтверждение.
  var lastButtons = '';
  function syncTelegramButtons() {
    if (!tg || !todayCtrl) return;
    var u = todayCtrl.ui();
    var show = GT.chrome.mainButtonVisible(desc, nav, helpOpen, u.show); // «Сохранить» только на экране «Сегодня»
    var scheme = theme.resolved();
    var sig = [show, u.loading, u.confirmClose, scheme].join();
    if (sig === lastButtons) return;
    lastButtons = sig;
    try {
      var mb = tg.MainButton;
      if (mb) {
        if (show) {
          var c = GT.theme.TG_COLORS[scheme];
          mb.setParams({ text: t('today.save'), color: c.btn, text_color: c.ink }); // цвет акцента темы
          mb.setText(t('today.save'));
          mb.show();
          if (u.loading) mb.showProgress(false); else mb.hideProgress();
        } else { mb.hideProgress(); mb.hide(); }
      }
      if (u.confirmClose) tg.enableClosingConfirmation(); else tg.disableClosingConfirmation();
    } catch (e) { /* старый клиент Telegram без этих методов: остаётся кнопка на странице */ }
  }

  // ---------- «Назад»: BackButton Telegram, вне Telegram — кнопка «←» в шапке ----------
  var screenBack;         // выбор экрана: undefined (по умолчанию) | false (скрыть) | fn (свой шаг назад); сбрасывается при смене экрана
  var backEl = null;      // кнопка «←» в шапке (когда BackButton Telegram недоступен)
  function goBack() {
    if (!GT.chrome.backVisible(desc, nav, helpOpen, screenBack)) return;
    if (helpOpen) { helpOpen = false; renderChrome(); showCurrent(); return; }
    if (typeof screenBack === 'function') return screenBack();
    env.back();
  }
  function syncBack() {
    var show = GT.chrome.backVisible(desc, nav, helpOpen, screenBack);
    if (backEl) backEl.hidden = !show;
    if (!tg || !tg.BackButton) return;
    try { if (show) tg.BackButton.show(); else tg.BackButton.hide(); } catch (e) { /* старый клиент Telegram: остаётся «←» в шапке */ }
  }

  // Экранная клавиатура: окно ниже самой большой высоты и в фокусе поле ввода → меню скрыто (body.kbd)
  var baseHeight = 0;
  function syncKeyboard() {
    var el = document.activeElement;
    var editing = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    var vv = window.visualViewport;
    var height = vv ? vv.height : window.innerHeight;
    if (height > baseHeight) baseHeight = height;
    document.body.classList.toggle('kbd', GT.chrome.keyboardOpen(baseHeight, height, editing));
  }

  // Кэш последнего «Сегодня» (ключ — пользователь): при открытии показывается сразу, пока идёт app.bootstrap.
  // Обновляется свежим bootstrap и каждым подтверждённым сохранением (значения сервера, не черновика).
  function saveCache(view) {
    if (!lastBoot || !lastBoot.today || view.date !== lastBoot.today.date || view.goal.id !== lastBoot.today.goal.id) return;
    lastBoot.today = view;
    cacheStore.put(uid, { boot: lastBoot, at: Date.now() });
  }
  function readCache(start) {
    var c = cacheStore.get(uid);
    var b = c && c.boot;
    if (!b || !b.today || !b.cabinet || !GT.router.checkEnv(b.env, cfg.EXPECTED_ENV)) return null;
    if (b.today.date !== GT.dates.todayIn(b.cabinet.timezone, Date.now())) return null; // кэш другого дня не показываем
    var d = GT.router.decideScreen(b, start);
    if (d.screen !== 'today') return null;
    d.boot = b;
    d.cached = true;
    return d;
  }

  // ---------- смена цели без app.bootstrap (changelog (8), (9)) ----------
  // Экраны строятся из ответов goal.complete и goal.create: лишний app.bootstrap стоит ~3 с на телефоне.
  function showDescriptor(b) { // экран по правилам запуска для переданного состояния
    var d = GT.router.decideScreen(b, { type: 'none' });
    d.boot = b;
    onDescriptor(d);
  }

  // goal.complete → S-33 «Итог цели»: цели больше нет (hasArchivedGoals = true), итог и repeat берём из ответа
  function completeGoal(goalId) {
    return env.call('goal.complete', { goalId: goalId }).then(function (res) {
      if (!res.ok) return res;
      var b = GT.router.bootAfterComplete(boot(), res.data.goal.id);
      nav.stack = [];
      onDescriptor({ screen: 'summary', boot: b, readOnly: false, reflectionGoalId: res.data.goal.id, summary: { goal: res.data.goal, result: res.data.result, repeat: res.data.repeat } });
      return res;
    });
  }

  // Закрыть S-33: рефлексия больше не показывается; дальше «Нет активной цели» (S-41) или «Сегодня», если цель уже есть
  function closeSummary() { showDescriptor(GT.router.bootAfterSummary(boot())); }

  // «Пропустить» рефлексию: экран уже закрыт, запрос уходит в фоне; ошибку сети не показываем (сервер покажет рефлексию снова при следующем bootstrap)
  function dismissReflection(goalId) {
    env.call('reflection.dismiss', { goalId: goalId }, { reason: 'background' }).then(function () { /* ответ не нужен */ }, function () { /* то же */ });
  }

  // goal.create → «Сегодня» или «Цель начнётся» из ответа (todayPlan = null — старт позже)
  function goalCreated(data, sent) { showDescriptor(GT.router.bootAfterCreate(boot(), data, sent)); }

  // ---------- оболочка ----------
  function titleText() {
    var b = desc && desc.boot;
    return b && b.activeGoal ? b.activeGoal.title : t('app.name');
  }

  function renderChrome() {
    var d = desc || { screen: 'loading' };
    var menu = GT.chrome.menuVisible(d, nav, helpOpen);
    root.textContent = '';
    // «←» в шапке только вне Telegram (или в клиенте без BackButton); показ — syncBack
    backEl = tg && tg.BackButton ? null : h('button', { type: 'button', class: 'secondary back', 'aria-label': t('common.back'), text: '←', hidden: true, onclick: goBack });
    var header = h('header', null,
      backEl,
      h('h1', { text: titleText() }),
      d.screen === 'loading' ? null :
        h('button', { type: 'button', class: 'secondary', 'aria-label': t('common.help'), text: 'i', onclick: function () { helpOpen = !helpOpen; renderChrome(); showCurrent(); } }));
    root.appendChild(header);
    if (d.readOnly) root.appendChild(h('div', { class: 'banner', text: t('common.readOnlyBanner') }));
    var main = h('main', { id: 'view' });
    root.appendChild(main);
    root.classList.toggle('has-menu', menu);
    if (menu) {
      var nav_ = h('nav', { class: 'tabs', 'aria-label': t('tabs.label') });
      TABS.forEach(function (k) {
        var icon = document.createElementNS(SVG_NS, 'svg');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('aria-hidden', 'true');
        GT.chrome.TAB_ICONS[k].forEach(function (p) {
          var el = document.createElementNS(SVG_NS, p[0]);
          Object.keys(p[1]).forEach(function (a) { el.setAttribute(a, p[1][a]); });
          icon.appendChild(el);
        });
        var b = h('button', { type: 'button', onclick: function () { env.tab(k); } }, icon, h('span', { text: t('tabs.' + k) }));
        if (k === nav.tab) b.setAttribute('aria-current', 'page');
        nav_.appendChild(b);
      });
      root.appendChild(nav_);
    }
    var b2 = d.boot;
    if (b2) root.appendChild(h('footer', { class: 'service', text: [t('service.env', { env: b2.env }), t('service.mode', { mode: b2.mode }), t('service.api', { v: b2.apiVersion })].join(' · ') }));
    shell = { main: main };
  }

  function setView(el) { if (shell) { shell.main.textContent = ''; shell.main.appendChild(el); } }

  function showScreen(name, params) {
    runLeaveHooks();
    screenBack = undefined; // свой шаг «назад» принадлежит прежнему экрану
    var token = ++viewToken;
    var fn = GT.screens[name];
    if (!fn) return setView(h('div', null, h('p', { text: t('fatal.generic.text') })));
    setView(h('div', { class: 'center' }, U.spinner()));
    var started = Date.now();
    Promise.resolve().then(function () { return fn(env, params || {}); }).then(function (el) {
      if (token === viewToken && el) setView(el);
    }).catch(function (e) {
      if (token !== viewToken) return;
      if (window.console) console.error(e);
      setView(h('div', null, h('h2', { text: t('fatal.generic.title') }), h('p', { text: t('fatal.generic.text') }),
        U.button(t('common.retry'), function () { showScreen(name, params); })));
    });
    return started;
  }

  function showCurrent() {
    if (desc && desc.screen !== 'loading') hideSplash();
    var r = showCurrentInner();
    syncTelegramButtons(); // кнопки Telegram зависят от экрана: после любой смены экрана пересчитываем
    syncBack();
    return r;
  }

  function showCurrentInner() {
    renderChrome();
    if (helpOpen) {
      return setView(h('div', null, h('h2', { text: t('help.title') }), h('p', { text: t('help.text') }),
        U.button(t('common.close'), function () { helpOpen = false; renderChrome(); showCurrent(); })));
    }
    var d = desc || { screen: 'loading' };
    if (d.screen === 'today') {
      var top = nav.stack[nav.stack.length - 1];
      if (top) return showScreen(top.name, top.params);
      var params = {};
      if (nav.tab === 'today' && nav.first && d.factMode) params.factMode = true;
      if (nav.tab === 'today') nav.first = false;
      return showScreen(nav.tab, params);
    }
    var map = { loading: 'loading', consent: 'consent', noAccess: 'noAccess', activate: 'activate', invite: 'invite', wizard: 'wizard', goalReached: 'goalReached',
      summary: 'summary', email: 'email', offline: 'offline', wrongEnv: 'wrongEnv', authExpired: 'fatal', authInvalid: 'fatal', update: 'fatal',
      noApiUrl: 'fatal', error: 'fatal' };
    return showScreen(map[d.screen] || 'fatal', d);
  }

  function onDescriptor(d) {
    document.body.classList.remove('slow');
    if (desc && desc.cached) {
      // Показан кэш «Сегодня», пока шёл app.bootstrap.
      if (d.screen === 'offline') { // связи нет: остаёмся на кэше с пометкой и «Повторить»
        staleState = 'failed';
        if (todayCtrl) todayCtrl.setStale(true);
        return;
      }
      staleState = null;
      if (d.screen === 'today' && !!d.readOnly === !!desc.readOnly && !helpOpen) { // тот же экран: подменяем данные, не перерисовывая страницу
        desc = d;
        lastBoot = d.boot;
        env.todayController().setStale(false);
        env.todayController().adoptBoot(d.boot.today);
        dataCache.purge();
        env.schedule(tabData.startBackground, 0);
        return;
      }
      if (todayCtrl) todayCtrl.setStale(false);
    }
    desc = d;
    helpOpen = false;
    if (d.boot) {
      if (d.screen === 'today' && d.boot.today) { lastBoot = d.boot; cacheStore.put(uid, { boot: d.boot, at: Date.now() }); } // кэш для следующего открытия
      else cacheStore.remove(uid);
    }
    if (d.screen === 'today') {
      if (!nav.keepTab) { nav.tab = 'today'; }
      nav.keepTab = false;
      nav.stack = [];
      // первый день «Сегодня» приходит в app.bootstrap: принимаем без запроса
      var ctrl = env.todayController();
      if (d.boot && d.boot.today) ctrl.adoptBoot(d.boot.today); else ctrl.adoptBoot(null);
    }
    // Активной цели нет: заготовки для мастера грузим в фоне сразу, чтобы мастер открывался без ожидания (кэш на сеанс)
    var bt = d.boot;
    if (bt && !bt.activeGoal && bt.access === 'active' && bt.role === 'owner' && !(bt.consent && bt.consent.required)) env.presets(true);
    if (d.screen !== 'loading') GT.diag.mark('firstScreen', sinceOpen(), d.screen);
    showCurrent();
    syncTelegramButtons();
    if (d.boot) dataCache.purge(); // записи чужого кабинета и участника не остаются
    if (d.screen === 'today' && !d.cached) env.schedule(tabData.startBackground, 0);
  }

  // ---------- запуск ----------
  var flowStarted = false;
  function startFlow() {
    if (flowStarted) return; // onload и onerror скрипта Telegram не должны запускать открытие дважды
    flowStarted = true;
    var fetchFn;
    var getInitData;
    var startParam;
    if (mode === 'mock') {
      var store = null;
      try { store = window.localStorage; } catch (e) { /* запрещено — работаем без сохранения */ }
      fetchFn = GT.mock.createMock({
        scenario: query.get('scenario') || 'new', as: query.get('as') || 'owner', env: cfg.EXPECTED_ENV,
        storage: store, reset: query.get('reset') === '1', latencyMs: 250
      }).fetch;
      getInitData = function () { return 'mock-init-data'; };
      startParam = query.get('startapp') || '';
    } else {
      if (!cfg.API_URL) return onDescriptor({ screen: 'noApiUrl' });
      fetchFn = window.fetch.bind(window);
      getInitData = function () { return tg && tg.initData ? tg.initData : ''; };
      startParam = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) || '';
      if (!getInitData()) return onDescriptor({ screen: 'authInvalid' }); // страница открыта не из Telegram
    }
    var client = GT.api.createClient({
      apiUrl: cfg.API_URL, fetch: fetchFn, getInitData: getInitData, onCall: function (r) { GT.diag.record(r); },
      onSlow: function () { document.body.classList.add('slow'); }
    });
    var tz;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { tz = undefined; }
    flow = GT.flow.createFlow({ api: client, expectedEnv: cfg.EXPECTED_ENV, startParam: startParam, tz: tz, onScreen: onDescriptor });
    uid = mode === 'mock' ? 'mock:' + (query.get('scenario') || 'new') + ':' + (query.get('as') || 'owner')
      : String(tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : 'anon');
    var cached = readCache(GT.router.parseStartParam(startParam));
    if (cached) { // последний «Сегодня» сразу, с пометкой «обновляем»; настоящие данные заменят его ответом bootstrap
      staleState = 'loading';
      lastBoot = cached.boot;
      desc = cached;
      var ctrl = env.todayController();
      ctrl.adoptBoot(cached.boot.today);
      ctrl.setStale(true);
      GT.diag.mark('firstScreen', sinceOpen(), 'cache');
      showCurrent();
      syncTelegramButtons();
    } else {
      onDescriptor({ screen: 'loading' });
    }
    flow.run();
  }

  if (mode === 'real') {
    // telegram-web-app.js подключён в <head> обычным тегом (index.html), к моменту выполнения этого скрипта он уже загружен
    tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
    if (tg) {
      try { tg.ready(); tg.expand(); } catch (e) { /* не критично */ }
      try { tg.MainButton.onClick(function () { if (todayCtrl) todayCtrl.press(); }); } catch (e) { /* без кнопки Telegram «Сохранить» рисуется на странице */ }
      try { tg.BackButton.onClick(goBack); } catch (e) { /* без BackButton «←» рисуется в шапке */ }
    }
  }
  // Клавиатура: размер окна и фокус поля (focusin/focusout) → меню скрыто; поворот экрана сбрасывает базовую высоту
  window.addEventListener('resize', syncKeyboard);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', syncKeyboard);
  window.addEventListener('orientationchange', function () { baseHeight = 0; syncKeyboard(); });
  document.addEventListener('focusin', syncKeyboard);
  document.addEventListener('focusout', function () { setTimeout(syncKeyboard, 0); });
  theme.init();
  onDescriptor({ screen: 'loading' });
  startFlow();

  GT.env = env; // для отладки в консоли
})();
