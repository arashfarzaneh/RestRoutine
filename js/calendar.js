window.SleepApp = window.SleepApp || {};

(function () {
  var currentYear;
  var currentMonth;

  function getCalendar() {
    return SleepApp.Storage.getSettings().calendar;
  }

  function getDows() {
    return SleepApp.Calendars.dows(getCalendar());
  }

  function getMonthNames() {
    return SleepApp.Calendars.monthNames(getCalendar());
  }

  function daysInMonth(year, month) {
    return SleepApp.Calendars.monthLength(year, month, getCalendar());
  }

  function firstDow(year, month) {
    return SleepApp.Calendars.dayOfWeek(year, month, 1, getCalendar());
  }

  function dateToShamsiStr(year, month, day) {
    var cal = getCalendar();
    if (cal === 'shamsi') {
      return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    }
    var d = SleepApp.Calendars.convert(year, month, day, cal, 'shamsi');
    return d.year + '-' + String(d.month).padStart(2, '0') + '-' + String(d.day).padStart(2, '0');
  }

  function init() {
    var today = SleepApp.Calendars.todayIn(getCalendar());
    currentYear = today.year;
    currentMonth = today.month;
    document.getElementById('prevMonthBtn').addEventListener('click', prevMonth);
    document.getElementById('nextMonthBtn').addEventListener('click', nextMonth);
    document.getElementById('backFromCalendarBtn').addEventListener('click', function () {
      SleepApp.App.showMain();
    });
    document.getElementById('calViewCalendarToggle').addEventListener('change', function () {
      var settings = SleepApp.Storage.getSettings();
      settings.calendar = this.value;
      SleepApp.Storage.saveSettings(settings);
      init();
      render();
    });
  }

  function show() {
    document.getElementById('calViewCalendarToggle').value = getCalendar();
    render();
    document.getElementById('mainView').classList.add('hidden');
    document.getElementById('calendarView').classList.remove('hidden');
  }

  function hide() {
    document.getElementById('calendarView').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');
  }

  function prevMonth() {
    if (currentMonth === 1) {
      currentMonth = 12;
      currentYear--;
    } else {
      currentMonth--;
    }
    render();
  }

  function nextMonth() {
    if (currentMonth === 12) {
      currentMonth = 1;
      currentYear++;
    } else {
      currentMonth++;
    }
    render();
  }

  function render() {
    var months = getMonthNames();
    var dows = getDows();
    var calendar = getCalendar();

    document.getElementById('calendarTitle').textContent =
      months[currentMonth - 1] + ' ' + currentYear;

    var grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    var headerRow = document.createElement('div');
    headerRow.className = 'calendar-row calendar-header';
    dows.forEach(function (d) {
      var cell = document.createElement('div');
      cell.className = 'calendar-cell calendar-day-header';
      cell.textContent = d;
      headerRow.appendChild(cell);
    });
    grid.appendChild(headerRow);

    var firstDowIdx = firstDow(currentYear, currentMonth);
    var daysInMonthCount = daysInMonth(currentYear, currentMonth);
    var entries = SleepApp.Storage.getAll();

    var entryMap = {};
    entries.forEach(function (e) {
      entryMap[e.date] = e;
    });

    var row = document.createElement('div');
    row.className = 'calendar-row';

    for (var i = 0; i < firstDowIdx; i++) {
      var empty = document.createElement('div');
      empty.className = 'calendar-cell calendar-empty';
      row.appendChild(empty);
    }

    for (var d = 1; d <= daysInMonthCount; d++) {
      var shamsiDateStr = dateToShamsiStr(currentYear, currentMonth, d);
      var entry = entryMap[shamsiDateStr];
      var cell = document.createElement('div');
      cell.className = 'calendar-cell';

      var numSpan = document.createElement('span');
      numSpan.className = 'cal-day-num';
      numSpan.textContent = d;
      cell.appendChild(numSpan);

      if (entry) {
        cell.style.backgroundColor = entry.color;
        cell.style.color = '#fff';
        cell.title = entry.score + ' (' + entry.duration.toFixed(1) + 'h)';
        var timeSpan = document.createElement('span');
        timeSpan.className = 'cal-sleep-time';
        timeSpan.textContent = entry.sleepStart + '-' + entry.sleepEnd;
        cell.appendChild(timeSpan);
      }

      cell.dataset.date = shamsiDateStr;
      cell.addEventListener('click', onDateClick);
      row.appendChild(cell);

      if ((firstDowIdx + d) % 7 === 0 && d < daysInMonthCount) {
        grid.appendChild(row);
        row = document.createElement('div');
        row.className = 'calendar-row';
      }
    }

    var totalCells = firstDowIdx + daysInMonthCount;
    var remaining = (7 - totalCells % 7) % 7;
    for (var i = 0; i < remaining; i++) {
      var empty = document.createElement('div');
      empty.className = 'calendar-cell calendar-empty';
      row.appendChild(empty);
    }
    grid.appendChild(row);

    document.getElementById('calendarEntryDetail').innerHTML = '';
  }

  function onDateClick() {
    var dateStr = this.dataset.date;
    var entry = SleepApp.Storage.getByDate(dateStr);
    showEntryDetail(dateStr, entry);
  }

  function showEntryDetail(dateStr, entry) {
    var detail = document.getElementById('calendarEntryDetail');
    if (!entry) {
      detail.innerHTML = '<p class="detail-empty">No entry for this date.</p>';
      return;
    }

    var calendar = getCalendar();
    var dateFormatted = SleepApp.Timeline.formatDate(dateStr, calendar);

    detail.innerHTML =
      '<div class="detail-entry" style="border-left:4px solid ' + entry.color + '">' +
      '<div class="detail-header">' + dateFormatted + '</div>' +
      '<div class="detail-info">Sleep: ' + entry.sleepStart + ' - ' + entry.sleepEnd + '</div>' +
      '<div class="detail-info">Duration: ' + entry.duration.toFixed(1) + 'h</div>' +
      '<div class="detail-info">Score: <span style="color:' + entry.color + ';font-weight:700">' + entry.score + '</span></div>' +
      (entry.notes ? '<div class="detail-notes">' + entry.notes + '</div>' : '') +
      '<button class="edit-from-calendar" data-id="' + entry.id + '">Edit</button>' +
      '<button class="delete-from-calendar" data-id="' + entry.id + '">Delete</button>' +
      '</div>';

    detail.querySelector('.edit-from-calendar').addEventListener('click', function () {
      SleepApp.Modal.openEdit(entry);
    });

    detail.querySelector('.delete-from-calendar').addEventListener('click', function () {
      if (confirm('Delete this entry?')) {
        SleepApp.Storage.remove(entry.id);
        render();
        SleepApp.App.renderMainView();
      }
    });
  }

  SleepApp.Calendar = {
    init: init,
    show: show,
    hide: hide,
    render: render
  };
})();
