window.SleepApp = window.SleepApp || {};

(function () {
  var EXPAND_COUNT = 6;
  var expanded = false;

  function seedSampleEntries() {
    var samples = [
      { date: '', sleepStart: '22:30', sleepEnd: '06:00', mood: 'energetic', notes: '' },
      { date: '', sleepStart: '03:00', sleepEnd: '07:00', mood: 'tired', notes: '' },
      { date: '', sleepStart: '23:30', sleepEnd: '07:30', mood: 'calm', notes: '' },
      { date: '', sleepStart: '02:00', sleepEnd: '11:00', mood: 'sad', notes: '' },
      { date: '', sleepStart: '23:00', sleepEnd: '07:00', mood: 'awesome', notes: '📝 Sample entry — start tracking by tapping + below' }
    ];
    var today = SleepApp.Calendars.todayIn('shamsi');
    for (var i = 0; i < samples.length; i++) {
      var d = SleepApp.Calendars.addDays(
        today.year + '-' + String(today.month).padStart(2, '0') + '-' + String(today.day).padStart(2, '0'),
        i - samples.length + 1,
        'shamsi'
      );
      samples[i].date = d;
      var quality = SleepApp.Scoring.calculate(samples[i].sleepStart, samples[i].sleepEnd);
      samples[i].duration = quality.duration;
      samples[i].score = quality.score;
      samples[i].color = quality.color;
      SleepApp.Storage.add(samples[i]);
    }
  }

  function init() {
    SleepApp.Modal.init();
    SleepApp.Calendar.init();

    if (SleepApp.Storage.getAll().length === 0) {
      seedSampleEntries();
    }

    document.getElementById('fab').addEventListener('click', function () {
      SleepApp.Modal.openAdd();
    });
    document.getElementById('addEntryHeaderBtn').addEventListener('click', function () {
      SleepApp.Modal.openAdd();
    });
    document.getElementById('homeBtn').addEventListener('click', function () {
      SleepApp.App.showMain();
    });
    document.getElementById('showCalendarBtn').addEventListener('click', function () {
      SleepApp.Calendar.show();
    });
    document.getElementById('expandBtn').addEventListener('click', function () {
      expanded = !expanded;
      updateExpandState();
    });
    document.getElementById('exportBtn').addEventListener('click', doExport);
    document.getElementById('importBtn').addEventListener('click', function () {
      document.getElementById('importFileInput').click();
    });
    document.getElementById('importFileInput').addEventListener('change', doImport);
    document.getElementById('restartBtn').addEventListener('click', doRestart);
    document.getElementById('settingsBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      var menu = document.getElementById('settingsMenu');
      menu.classList.toggle('hidden');
    });
    document.getElementById('darkModeToggle').addEventListener('change', function () {
      var settings = SleepApp.Storage.getSettings();
      settings.darkMode = this.checked;
      SleepApp.Storage.saveSettings(settings);
      applyTheme(settings.darkMode);
    });

    document.getElementById('calendarToggle').addEventListener('change', function () {
      var settings = SleepApp.Storage.getSettings();
      settings.calendar = this.value;
      SleepApp.Storage.saveSettings(settings);
      updateCalendarToggleUI();
      var calViewSel = document.getElementById('calViewCalendarToggle');
      if (calViewSel) calViewSel.value = this.value;
      SleepApp.Calendar.init();
      var calendarView = document.getElementById('calendarView');
      if (!calendarView.classList.contains('hidden')) {
        SleepApp.Calendar.render();
      }
      SleepApp.App.renderMainView();
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.menu-btn') && !e.target.closest('.menu-dropdown')) {
        document.querySelectorAll('.menu-dropdown.visible').forEach(function (d) {
          d.classList.remove('visible');
        });
      }
      if (!e.target.closest('#settingsBtn') && !e.target.closest('#settingsMenu')) {
        document.getElementById('settingsMenu').classList.add('hidden');
      }
    });

    document.getElementById('entriesList').addEventListener('click', function (e) {
      var menuBtn = e.target.closest('.menu-btn');
      if (menuBtn) {
        e.stopPropagation();
        var dropdown = menuBtn.parentNode.querySelector('.menu-dropdown');
        var isVisible = dropdown.classList.contains('visible');
        document.querySelectorAll('.menu-dropdown.visible').forEach(function (d) {
          d.classList.remove('visible');
        });
        if (!isVisible) {
          dropdown.classList.add('visible');
        }
        return;
      }

      var dropdownItem = e.target.closest('.menu-dropdown-item');
      if (dropdownItem) {
        e.stopPropagation();
        var id = dropdownItem.dataset.id;
        var action = dropdownItem.dataset.action;
        var entry = SleepApp.Storage.getAll().find(function (e) { return e.id === id; });
        if (!entry) return;

        dropdownItem.closest('.menu-dropdown').classList.remove('visible');

        if (action === 'edit') {
          SleepApp.Modal.openEdit(entry);
        } else if (action === 'delete') {
          if (confirm('Delete this entry?')) {
            SleepApp.Storage.remove(id);
            renderMainView();
          }
        }
        return;
      }

      var card = e.target.closest('.entry-card');
      if (card && !e.target.closest('.menu-dropdown') && !e.target.closest('.menu-btn')) {
        var id = card.dataset.id;
        var found = SleepApp.Storage.getAll().find(function (e) { return e.id === id; });
        if (found) SleepApp.Modal.showDetail(found);
      }
    });

    applyTheme(SleepApp.Storage.getSettings().darkMode);
    document.getElementById('darkModeToggle').checked = !!SleepApp.Storage.getSettings().darkMode;
    updateCalendarToggleUI();
    renderMainView();
  }

  function applyTheme(dark) {
    document.documentElement.classList.toggle('dark', !!dark);
  }

  function updateCalendarToggleUI() {
    var sel = document.getElementById('calendarToggle');
    sel.value = SleepApp.Storage.getSettings().calendar;
  }

  function renderMainView() {
    var entries = SleepApp.Storage.getAll();
    var list = document.getElementById('entriesList');
    var empty = document.getElementById('emptyState');
    var expandBtn = document.getElementById('expandBtn');
    list.innerHTML = '';

    if (entries.length === 0) {
      empty.classList.remove('hidden');
      expandBtn.classList.add('hidden');
      renderStats([]);
      return;
    }
    empty.classList.add('hidden');

    entries.forEach(function (entry) {
      var card = SleepApp.Timeline.renderEntryCard(entry);
      list.appendChild(card);
    });

    if (entries.length > EXPAND_COUNT) {
      expandBtn.classList.remove('hidden');
      expandBtn.textContent = expanded
        ? 'Show Less'
        : 'Show All (' + entries.length + ' entries)';
      updateExpandState();
    } else {
      expandBtn.classList.add('hidden');
      expanded = false;
    }

    renderStats(entries);
  }

  function updateExpandState() {
    var cards = document.querySelectorAll('#entriesList .entry-card');
    var expandBtn = document.getElementById('expandBtn');
    for (var i = 0; i < cards.length; i++) {
      if (i >= EXPAND_COUNT) {
        cards[i].classList.toggle('entry-hidden', !expanded);
      }
    }
    var entries = SleepApp.Storage.getAll();
    expandBtn.textContent = expanded
      ? 'Show Less'
      : 'Show All (' + entries.length + ' entries)';
  }

  function renderStats(entries) {
    var bar = document.getElementById('statsBar');
    if (entries.length === 0) {
      bar.innerHTML = '';
      return;
    }

    var sorted = entries.slice().sort(function (a, b) { return a.date > b.date ? -1 : a.date < b.date ? 1 : 0; });
    var last10 = sorted.slice(0, 10);
    var avg = Math.round(last10.reduce(function (s, e) { return s + e.score; }, 0) / last10.length);
    var avgColor = SleepApp.Scoring.scoreToColor(avg);
    var good = 0, meh = 0, bad = 0;
    last10.forEach(function (e) {
      if (e.score >= 70) good++;
      else if (e.score >= 40) meh++;
      else bad++;
    });

    bar.innerHTML =
      '<span class="stat-item">past 10 days avg: <span class="stat-value" style="color:' + avgColor + '">' + avg + '</span></span>' +
      '<span class="stat-item stat-good">😊 ' + good + ' good</span>' +
      '<span class="stat-item stat-meh">😐 ' + meh + ' meh</span>' +
      '<span class="stat-item stat-bad">😞 ' + bad + ' bad</span>';
  }

  function doExport() {
    var data = SleepApp.Storage.exportAll();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'sleep-tracker-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function doImport(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var data = JSON.parse(ev.target.result);
        SleepApp.Storage.importAll(data);
        renderMainView();
        alert('Data imported successfully.');
      } catch (err) {
        alert('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function doRestart() {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      if (confirm('Really? All entries and routines will be permanently deleted.')) {
        SleepApp.Storage.clearAll();
        renderMainView();
      }
    }
  }

  function showMain() {
    document.getElementById('calendarView').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');
    renderMainView();
  }

  document.addEventListener('DOMContentLoaded', init);

  SleepApp.App = {
    renderMainView: renderMainView,
    showMain: showMain,
    updateCalendarToggleUI: updateCalendarToggleUI
  };
})();
