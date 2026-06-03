window.SleepApp = window.SleepApp || {};

(function () {
  var HOURS = [];
  for (var h = 19; h <= 23; h++) HOURS.push(h);
  for (var h = 0; h <= 15; h++) HOURS.push(h);

  var PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

  function formatPersianNumber(n) {
    return String(n).split('').map(function (c) {
      return PERSIAN_DIGITS[parseInt(c, 10)] || c;
    }).join('');
  }

  function formatShamsiDate(jy, jm, jd) {
    return formatPersianNumber(jy) + '/' +
      formatPersianNumber(String(jm).padStart(2, '0')) + '/' +
      formatPersianNumber(String(jd).padStart(2, '0'));
  }

  function getDayOfWeek(jy, jm, jd) {
    var g = jalaali.toGregorian(jy, jm, jd);
    var date = new Date(g.gy, g.gm - 1, g.gd);
    return (date.getDay() + 1) % 7;
  }

  function formatDate(dateStr, calendar) {
    var parts = dateStr.split('-');
    var date = SleepApp.Calendars.convert(
      parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10),
      'shamsi', calendar
    );
    return String(date.year) + '/' + String(date.month).padStart(2, '0') + '/' + String(date.day).padStart(2, '0');
  }

  function getDayOfWeekName(dateStr, calendar) {
    var parts = dateStr.split('-');
    var g = jalaali.toGregorian(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10));
    var date = new Date(g.gy, g.gm - 1, g.gd);
    var names = SleepApp.Calendars.dows(calendar);
    if (calendar === 'shamsi') return names[(date.getDay() + 1) % 7];
    return names[date.getDay()];
  }

  function hourToOffset(h) {
    if (h >= 19) return (h - 19) / 20 * 100;
    return (h + 5) / 20 * 100;
  }

  function timeToPct(timeStr) {
    var parts = timeStr.split(':');
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var offset;
    if (h >= 19) offset = (h - 19) * 60 + m;
    else offset = (h + 5) * 60 + m;
    return offset / 12;
  }

  function renderEntryCard(entry) {
    var card = document.createElement('div');
    card.className = 'entry-card';
    card.dataset.id = entry.id;

    var calendar = SleepApp.Storage.getSettings().calendar;

    var header = document.createElement('div');
    header.className = 'entry-header';

    var dateEl = document.createElement('span');
    dateEl.className = 'entry-date';
    dateEl.textContent = formatDate(entry.date, calendar) + ' - ' + getDayOfWeekName(entry.date, calendar);

    var metaEl = document.createElement('span');
    metaEl.className = 'entry-meta';

    var moodInfo = entry.mood ? getMoodInfo(entry.mood) : null;
    if (moodInfo && moodInfo.emoji) {
      var moodEl = document.createElement('span');
      moodEl.className = 'entry-mood-tag';
      moodEl.textContent = moodInfo.emoji;
      moodEl.title = moodInfo.label;
    }

    var durSpan = document.createElement('span');
    durSpan.textContent = entry.duration.toFixed(1) + 'h';

    var dot = document.createElement('span');
    dot.className = 'quality-dot';
    dot.style.backgroundColor = entry.color;

    var scoreEl = document.createElement('span');
    scoreEl.className = 'entry-score';
    scoreEl.textContent = entry.score;
    scoreEl.style.color = entry.color;

    var menuBtn = document.createElement('button');
    menuBtn.className = 'menu-btn';
    menuBtn.textContent = '⋮';
    menuBtn.dataset.id = entry.id;

    var dropdown = document.createElement('div');
    dropdown.className = 'menu-dropdown';
    dropdown.dataset.id = entry.id;

    var editItem = document.createElement('button');
    editItem.className = 'menu-dropdown-item';
    editItem.textContent = 'Edit';
    editItem.dataset.action = 'edit';
    editItem.dataset.id = entry.id;

    var delItem = document.createElement('button');
    delItem.className = 'menu-dropdown-item danger';
    delItem.textContent = 'Delete';
    delItem.dataset.action = 'delete';
    delItem.dataset.id = entry.id;

    dropdown.appendChild(editItem);
    dropdown.appendChild(delItem);

    if (moodEl) metaEl.appendChild(moodEl);
    metaEl.appendChild(durSpan);
    metaEl.appendChild(dot);
    header.appendChild(dateEl);
    header.appendChild(metaEl);
    header.appendChild(scoreEl);
    header.appendChild(menuBtn);
    header.appendChild(dropdown);
    card.appendChild(header);

    if (entry.notes) {
      var notesEl = document.createElement('div');
      notesEl.className = 'entry-notes';
      notesEl.textContent = entry.notes;
      card.appendChild(notesEl);
    }

    if (entry.routines) {
      var routinesEl = document.createElement('div');
      routinesEl.className = 'entry-routines';
      var routineKeys = Object.keys(entry.routines);
      var allRoutines = SleepApp.Storage.getAllRoutines();
      var routineMap = {};
      allRoutines.forEach(function (r) { routineMap[r.id] = r; });
      for (var ri = 0; ri < routineKeys.length; ri++) {
        var rid = routineKeys[ri];
        var rval = entry.routines[rid];
        var rInfo = routineMap[rid];
        if (rInfo) {
          var tag = document.createElement('span');
          tag.className = 'entry-routine-tag ' + (ROUTINE_CLASSES[String(rval)] || '');
          tag.textContent = rInfo.name + ' ' + (ROUTINE_LABELS[String(rval)] || rval);
          routinesEl.appendChild(tag);
        }
      }
      if (routinesEl.children.length > 0) {
        card.appendChild(routinesEl);
      }
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'timeline-track-wrapper';

    var track = document.createElement('div');
    track.className = 'timeline-track';

    var block = document.createElement('div');
    block.className = 'sleep-block';
    var left = timeToPct(entry.sleepStart);
    var right = timeToPct(entry.sleepEnd);
    block.style.left = Math.max(0, Math.min(100, left)) + '%';
    block.style.width = Math.max(2, Math.min(100 - Math.max(0, left), right - left)) + '%';
    block.style.backgroundColor = entry.color;
    block.title = entry.sleepStart + ' → ' + entry.sleepEnd + ' (' + entry.duration.toFixed(1) + 'h)';
    track.appendChild(block);
    wrapper.appendChild(track);

    var labels = document.createElement('div');
    labels.className = 'timeline-labels';
    HOURS.forEach(function (h, i) {
      var label = document.createElement('span');
      label.className = 'timeline-label';
      if (i % 2 === 0) label.classList.add('major');
      label.style.left = hourToOffset(h) + '%';
      label.textContent = h === 0 ? 24 : h;
      labels.appendChild(label);
    });
    wrapper.appendChild(labels);

    card.appendChild(wrapper);
    return card;
  }

  var MOODS = [
    { value: '', label: 'None', emoji: '' },
    { value: 'awesome', label: 'Awesome', emoji: '😄' },
    { value: 'fine', label: 'Fine', emoji: '🙂' },
    { value: 'energetic', label: 'Energetic', emoji: '🔥' },
    { value: 'calm', label: 'Calm', emoji: '😌' },
    { value: 'tired', label: 'Tired', emoji: '😴' },
    { value: 'sad', label: 'Sad', emoji: '😢' },
    { value: 'stressed', label: 'Stressed', emoji: '😰' },
    { value: 'sick', label: 'Sick', emoji: '🤒' }
  ];

  function getMoodInfo(value) {
    for (var i = 0; i < MOODS.length; i++) {
      if (MOODS[i].value === value) return MOODS[i];
    }
    return null;
  }

  var ROUTINE_LABELS = {
    '0': '✕',
    '50': '~',
    '100': '✓'
  };

  var ROUTINE_CLASSES = {
    '0': 'not-done',
    '50': 'partial',
    '100': 'done'
  };

  SleepApp.Timeline = {
    renderEntryCard: renderEntryCard,
    formatShamsiDate: formatShamsiDate,
    formatPersianNumber: formatPersianNumber,
    getDayOfWeek: getDayOfWeek,
    HOURS: HOURS,
    formatDate: formatDate,
    getDayOfWeekName: getDayOfWeekName,
    MOODS: MOODS,
    getMoodInfo: getMoodInfo,
    ROUTINE_LABELS: ROUTINE_LABELS,
    ROUTINE_CLASSES: ROUTINE_CLASSES
  };
})();
