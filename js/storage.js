window.SleepApp = window.SleepApp || {};

(function () {
  var STORAGE_KEY = 'sleep_tracking_entries';

  function getAll() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function add(entry) {
    var entries = getAll();
    entry.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    entry.createdAt = Date.now();
    entries.unshift(entry);
    saveAll(entries);
    return entry;
  }

  function update(id, updates) {
    var entries = getAll();
    var idx = entries.findIndex(function (e) { return e.id === id; });
    if (idx !== -1) {
      entries[idx] = Object.assign({}, entries[idx], updates);
      saveAll(entries);
    }
  }

  function remove(id) {
    var entries = getAll().filter(function (e) { return e.id !== id; });
    saveAll(entries);
  }

  function getByDate(dateStr) {
    return getAll().find(function (e) { return e.date === dateStr; });
  }

  var ROUTINES_KEY = 'sleep_tracking_routines';

  function getAllRoutines() {
    try {
      var data = localStorage.getItem(ROUTINES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAllRoutines(routines) {
    localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  }

  function addRoutine(name) {
    var routines = getAllRoutines();
    var routine = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: name,
      createdAt: Date.now()
    };
    routines.push(routine);
    saveAllRoutines(routines);
    return routine;
  }

  function removeRoutine(id) {
    var routines = getAllRoutines().filter(function (r) { return r.id !== id; });
    saveAllRoutines(routines);
  }

  function exportAll() {
    return {
      entries: getAll(),
      routines: getAllRoutines()
    };
  }

  function importAll(data) {
    if (data.entries) saveAll(data.entries);
    if (data.routines) saveAllRoutines(data.routines);
  }

  var SETTINGS_KEY = 'sleep_tracking_settings';

  function getSettings() {
    try {
      var data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : { calendar: 'gregorian' };
    } catch (e) {
      return { calendar: 'shamsi' };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ROUTINES_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  }

  SleepApp.Storage = {
    getAll: getAll,
    add: add,
    update: update,
    remove: remove,
    getByDate: getByDate,
    getAllRoutines: getAllRoutines,
    addRoutine: addRoutine,
    removeRoutine: removeRoutine,
    exportAll: exportAll,
    importAll: importAll,
    clearAll: clearAll,
    getSettings: getSettings,
    saveSettings: saveSettings
  };
})();
