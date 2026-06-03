window.SleepApp = window.SleepApp || {};

(function () {
  var editingId = null;

  function getCalendar() {
    return SleepApp.Storage.getSettings().calendar;
  }

  function getMonthNames() {
    return SleepApp.Calendars.monthNames(getCalendar());
  }

  function getNextDayAfterLastEntry() {
    var entries = SleepApp.Storage.getAll();
    if (entries.length === 0) {
      var today = SleepApp.Calendars.todayIn('shamsi');
      return today.year + '-' + String(today.month).padStart(2, '0') + '-' + String(today.day).padStart(2, '0');
    }
    var latest = entries[0];
    for (var i = 1; i < entries.length; i++) {
      if (entries[i].date > latest.date) latest = entries[i];
    }
    return SleepApp.Calendars.addDays(latest.date, 1);
  }

  function populateDateSelects(jy, jm, jd) {
    var calendar = getCalendar();
    var months = getMonthNames();

    if (calendar !== 'shamsi') {
      var d = SleepApp.Calendars.convert(jy, jm, jd, 'shamsi', calendar);
      jy = d.year;
      jm = d.month;
      jd = d.day;
    }

    var yearSel = document.getElementById('entryYear');
    var monthSel = document.getElementById('entryMonth');
    var daySel = document.getElementById('entryDay');

    yearSel.innerHTML = '';
    for (var y = jy - 2; y <= jy + 1; y++) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === jy) opt.selected = true;
      yearSel.appendChild(opt);
    }

    monthSel.innerHTML = '';
    for (var m = 1; m <= 12; m++) {
      var opt = document.createElement('option');
      opt.value = m;
      opt.textContent = months[m - 1];
      if (m === jm) opt.selected = true;
      monthSel.appendChild(opt);
    }

    updateDays();
    daySel.value = jd;
  }

  function updateDays() {
    var yearSel = document.getElementById('entryYear');
    var monthSel = document.getElementById('entryMonth');
    var daySel = document.getElementById('entryDay');
    var y = parseInt(yearSel.value, 10);
    var m = parseInt(monthSel.value, 10);
    var maxDays = SleepApp.Calendars.monthLength(y, m, getCalendar());
    var currentDay = parseInt(daySel.value, 10);

    daySel.innerHTML = '';
    for (var d = 1; d <= maxDays; d++) {
      var opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      if (d === currentDay) opt.selected = true;
      daySel.appendChild(opt);
    }
    if (!daySel.value) daySel.value = daySel.options[0] ? daySel.options[0].value : 1;
  }

  function renderMoodPicker(selectedMood) {
    var container = document.getElementById('moodPicker');
    container.innerHTML = '';
    var MOODS = SleepApp.Timeline.MOODS;
    for (var i = 0; i < MOODS.length; i++) {
      var opt = document.createElement('span');
      opt.className = 'mood-option' + (MOODS[i].value === selectedMood ? ' selected' : '');
      opt.dataset.value = MOODS[i].value;
      if (MOODS[i].emoji) {
        var emojiSpan = document.createElement('span');
        emojiSpan.className = 'mood-emoji';
        emojiSpan.textContent = MOODS[i].emoji;
        opt.appendChild(emojiSpan);
      }
      opt.appendChild(document.createTextNode(MOODS[i].label));
      opt.addEventListener('click', function () {
        var prev = container.querySelector('.selected');
        if (prev) prev.classList.remove('selected');
        this.classList.add('selected');
      });
      container.appendChild(opt);
    }
  }

  function renderRoutines(routineValues) {
    var container = document.getElementById('routinesContainer');
    container.innerHTML = '';
    var routines = SleepApp.Storage.getAllRoutines();
    if (routines.length === 0) {
      container.innerHTML = '<div style="font-size:13px;color:var(--text-secondary);padding:4px 0;">No routines yet.</div>';
      return;
    }
    routineValues = routineValues || {};
    for (var i = 0; i < routines.length; i++) {
      var r = routines[i];
      var val = routineValues[r.id] || 0;
      var item = document.createElement('div');
      item.className = 'routine-item';
      item.dataset.id = r.id;

      var nameSpan = document.createElement('span');
      nameSpan.className = 'routine-name';
      nameSpan.textContent = r.name;
      item.appendChild(nameSpan);

      var valuesDiv = document.createElement('div');
      valuesDiv.className = 'routine-values';

      var options = [0, 50, 100];
      for (var oi = 0; oi < options.length; oi++) {
        var v = options[oi];
        var btn = document.createElement('span');
        btn.className = 'routine-value' + (val === v ? ' selected' : '');
        btn.dataset.value = v;
        btn.textContent = SleepApp.Timeline.ROUTINE_LABELS[String(v)];
        btn.addEventListener('click', function () {
          var parent = this.parentNode.parentNode;
          var siblings = parent.querySelectorAll('.routine-value');
          for (var si = 0; si < siblings.length; si++) {
            siblings[si].classList.remove('selected');
          }
          this.classList.add('selected');
        });
        valuesDiv.appendChild(btn);
      }

      item.appendChild(valuesDiv);

      var removeBtn = document.createElement('button');
      removeBtn.className = 'routine-remove';
      removeBtn.textContent = '✕';
      removeBtn.title = 'Remove routine';
      removeBtn.addEventListener('click', function () {
        var rid = this.parentNode.dataset.id;
        if (confirm('Delete this routine? It will be removed from all entries.')) {
          SleepApp.Storage.removeRoutine(rid);
          var curValues = getRoutineValuesFromUI();
          renderRoutines(curValues);
        }
      });
      item.appendChild(removeBtn);

      container.appendChild(item);
    }
  }

  function getRoutineValuesFromUI() {
    var items = document.querySelectorAll('#routinesContainer .routine-item');
    var values = {};
    for (var i = 0; i < items.length; i++) {
      var id = items[i].dataset.id;
      var selected = items[i].querySelector('.routine-value.selected');
      values[id] = selected ? parseInt(selected.dataset.value, 10) : 0;
    }
    return values;
  }

  function collectFormData() {
    var moodEl = document.querySelector('#moodPicker .selected');
    var mood = moodEl ? moodEl.dataset.value : '';
    var year = parseInt(document.getElementById('entryYear').value, 10);
    var month = parseInt(document.getElementById('entryMonth').value, 10);
    var day = parseInt(document.getElementById('entryDay').value, 10);

    if (getCalendar() !== 'shamsi') {
      var d = SleepApp.Calendars.convert(year, month, day, getCalendar(), 'shamsi');
      year = d.year;
      month = d.month;
      day = d.day;
    }

    return {
      date: year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0'),
      sleepStart: document.getElementById('entrySleepStart').value,
      sleepEnd: document.getElementById('entrySleepEnd').value,
      notes: document.getElementById('entryNotes').value.trim(),
      mood: mood,
      routines: getRoutineValuesFromUI()
    };
  }

  function validateTimes() {
    var start = document.getElementById('entrySleepStart').value;
    var end = document.getElementById('entrySleepEnd').value;
    var errorEl = document.getElementById('timeError');
    if (!start || !end) return true;
    var dur = SleepApp.Scoring.calcDuration(start, end);
    if (dur <= 0.5 || dur >= 20) {
      errorEl.classList.remove('hidden');
      return false;
    }
    errorEl.classList.add('hidden');
    return true;
  }

  function updatePreview() {
    var data = collectFormData();
    if (!data.sleepStart || !data.sleepEnd) return;
    var valid = validateTimes();
    var preview = document.getElementById('qualityPreview');
    if (!valid) {
      preview.classList.add('hidden');
      return;
    }
    var quality = SleepApp.Scoring.calculate(data.sleepStart, data.sleepEnd);
    var bar = document.getElementById('qualityBar');
    var label = document.getElementById('qualityScore');
    preview.classList.remove('hidden');
    bar.style.backgroundColor = quality.color;
    bar.style.width = quality.score + '%';
    label.textContent = quality.score + ' (' + quality.duration.toFixed(1) + 'h)';
    label.style.color = quality.color;
  }

  function updateDateLabel() {
    var label = document.getElementById('dateLabel');
    var names = { gregorian: 'Gregorian', shamsi: 'Shamsi', hijri: 'Hijri' };
    label.textContent = 'Date (' + (names[getCalendar()] || getCalendar()) + ')';
  }

  function openAdd(initialDate) {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'New Entry';
    document.getElementById('entryForm').reset();
    document.getElementById('qualityPreview').classList.add('hidden');
    document.getElementById('timeError').classList.add('hidden');
    updateDateLabel();

    if (!initialDate) {
      initialDate = getNextDayAfterLastEntry();
    }

    var parts = initialDate.split('-');
    populateDateSelects(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10),
      parseInt(parts[2], 10)
    );
    renderMoodPicker('');
    renderRoutines({});
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.add('visible');
    updatePreview();
  }

  function openEdit(entry) {
    editingId = entry.id;
    document.getElementById('modalTitle').textContent = 'Edit Entry';
    document.getElementById('entryForm').reset();
    document.getElementById('qualityPreview').classList.add('hidden');
    document.getElementById('timeError').classList.add('hidden');
    updateDateLabel();

    var parts = entry.date.split('-');
    populateDateSelects(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10),
      parseInt(parts[2], 10)
    );
    document.getElementById('entrySleepStart').value = entry.sleepStart;
    document.getElementById('entrySleepEnd').value = entry.sleepEnd;
    document.getElementById('entryNotes').value = entry.notes || '';
    renderMoodPicker(entry.mood || '');
    renderRoutines(entry.routines || {});
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.add('visible');
    updatePreview();
  }

  function showDetail(entry) {
    hideDetail();
    document.getElementById('entryForm').classList.add('hidden');
    document.getElementById('modalTitle').classList.add('hidden');
    document.getElementById('detailTitle').textContent = 'Entry Details';
    var cal = getCalendar();
    var dateStr = SleepApp.Timeline.formatDate(entry.date, cal) + ' - ' + SleepApp.Timeline.getDayOfWeekName(entry.date, cal);
    var moodInfo = entry.mood ? SleepApp.Timeline.getMoodInfo(entry.mood) : null;
    var routines = SleepApp.Storage.getAllRoutines();
    var routineHtml = '';
    if (entry.routines) {
      for (var rid in entry.routines) {
        if (entry.routines.hasOwnProperty(rid)) {
          var r = null;
          for (var i = 0; i < routines.length; i++) {
            if (routines[i].id === rid) { r = routines[i]; break; }
          }
          var rname = r ? r.name : rid;
          var rval = entry.routines[rid];
          var rlabel = SleepApp.Timeline.ROUTINE_LABELS[String(rval)] || rval;
          routineHtml += '<div class="detail-routine"><span class="detail-routine-name">' + rname + '</span> <span class="detail-routine-val">' + rlabel + '</span></div>';
        }
      }
    }

    document.getElementById('detailBody').innerHTML =
      '<div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">' + dateStr + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Sleep</span><span class="detail-value">' + entry.sleepStart + ' → ' + entry.sleepEnd + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Duration</span><span class="detail-value">' + entry.duration.toFixed(1) + 'h</span></div>' +
      '<div class="detail-row"><span class="detail-label">Score</span><span class="detail-value" style="color:' + entry.color + ';font-weight:700">' + entry.score + '</span></div>' +
      (moodInfo ? '<div class="detail-row"><span class="detail-label">Mood</span><span class="detail-value">' + (moodInfo.emoji || '') + ' ' + moodInfo.label + '</span></div>' : '') +
      (routineHtml ? '<div class="detail-row"><span class="detail-label">Routines</span><span class="detail-value">' + routineHtml + '</span></div>' : '') +
      (entry.notes ? '<div class="detail-row detail-notes-row"><span class="detail-label">Notes</span><span class="detail-value">' + entry.notes + '</span></div>' : '');
    document.getElementById('detailTitle').dataset.id = entry.id;
    document.getElementById('entryDetail').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.add('visible');
  }

  function hideDetail() {
    document.getElementById('entryDetail').classList.add('hidden');
    document.getElementById('entryForm').classList.remove('hidden');
    document.getElementById('modalTitle').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('visible');
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('timeError').classList.add('hidden');
    hideDetail();
    editingId = null;
  }

  function saveEntry(e) {
    e.preventDefault();
    var data = collectFormData();
    if (!data.sleepStart || !data.sleepEnd) {
      alert('Please fill in sleep and wake times.');
      return;
    }

    if (!validateTimes()) return;

    if (!editingId) {
      var existing = SleepApp.Storage.getByDate(data.date);
      if (existing) {
        if (!confirm('An entry already exists for this date. Update it instead?')) return;
        editingId = existing.id;
      }
    }

    var quality = SleepApp.Scoring.calculate(data.sleepStart, data.sleepEnd);

    if (editingId) {
      SleepApp.Storage.update(editingId, Object.assign({}, data, quality));
    } else {
      SleepApp.Storage.add(Object.assign({}, data, quality));
    }

    closeModal();
    SleepApp.App.renderMainView();
  }

  function init() {
    document.getElementById('entryMonth').addEventListener('change', updateDays);
    document.getElementById('entryYear').addEventListener('change', updateDays);
    document.getElementById('entrySleepStart').addEventListener('input', updatePreview);
    document.getElementById('entrySleepEnd').addEventListener('input', updatePreview);
    document.getElementById('entryForm').addEventListener('submit', saveEntry);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
    document.getElementById('addRoutineBtn').addEventListener('click', function () {
      var name = prompt('Enter routine name:');
      if (name && name.trim()) {
        SleepApp.Storage.addRoutine(name.trim());
        var curValues = getRoutineValuesFromUI();
        renderRoutines(curValues);
      }
    });
    document.getElementById('detailEditBtn').addEventListener('click', function () {
      var id = document.getElementById('detailTitle').dataset.id;
      var entry = SleepApp.Storage.getAll().find(function (e) { return e.id === id; });
      if (entry) {
        hideDetail();
        openEdit(entry);
      }
    });
    document.getElementById('detailDeleteBtn').addEventListener('click', function () {
      var id = document.getElementById('detailTitle').dataset.id;
      if (confirm('Delete this entry?')) {
        SleepApp.Storage.remove(id);
        closeModal();
        SleepApp.App.renderMainView();
      }
    });
    document.getElementById('detailCloseBtn').addEventListener('click', closeModal);
  }

  SleepApp.Modal = {
    openAdd: openAdd,
    openEdit: openEdit,
    showDetail: showDetail,
    close: closeModal,
    init: init
  };
})();
