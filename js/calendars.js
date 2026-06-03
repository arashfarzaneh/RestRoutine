window.SleepApp = window.SleepApp || {};

(function () {
  var LIST = ['gregorian', 'shamsi', 'hijri'];

  var GREG_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var SHAMSI_MONTHS = [
    'Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar',
    'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'
  ];

  var HIJRI_MONTHS = [
    'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ];

  var GREG_DOWS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var SHAMSI_DOWS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  function monthNames(cal) {
    if (cal === 'gregorian') return GREG_MONTHS;
    if (cal === 'shamsi') return SHAMSI_MONTHS;
    return HIJRI_MONTHS;
  }

  function dows(cal) {
    return cal === 'shamsi' ? SHAMSI_DOWS : GREG_DOWS;
  }

  /* ---- Gregorian <-> JDN ---- */
  function gregToJDN(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var yy = y + 4800 - a;
    var mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  function jdnToGreg(jdn) {
    var a = jdn + 32044;
    var b = Math.floor((4 * a + 3) / 146097);
    var c = a - Math.floor(146097 * b / 4);
    var d = Math.floor((4 * c + 3) / 1461);
    var e = c - Math.floor(1461 * d / 4);
    var mm = Math.floor((5 * e + 2) / 153);
    var day = e - Math.floor((153 * mm + 2) / 5) + 1;
    var month = mm + 3 - 12 * Math.floor(mm / 10);
    var year = 100 * b + d - 4800 + Math.floor(mm / 10);
    return { year: year, month: month, day: day };
  }

  /* ---- Shamsi <-> JDN (via jalaali) ---- */
  function shamsiToJDN(y, m, d) {
    var g = jalaali.toGregorian(y, m, d);
    return gregToJDN(g.gy, g.gm, g.gd);
  }

  function jdnToShamsi(jdn) {
    var g = jdnToGreg(jdn);
    var j = jalaali.toJalaali(g.year, g.month, g.day);
    return { year: j.jy, month: j.jm, day: j.jd };
  }

  /* ---- Hijri (tabular) ---- */
  var HIJRI_EPOCH = 1948440;

  function hijriMonthLength(y, m) {
    if (m <= 11) return m % 2 === 1 ? 30 : 29;
    var leap = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    return leap.indexOf(y % 30) !== -1 ? 30 : 29;
  }

  function hijriYearLength(y) {
    var leap = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    return leap.indexOf(y % 30) !== -1 ? 355 : 354;
  }

  function hijriToJDN(y, m, d) {
    var days = d - 1;
    for (var mi = 1; mi < m; mi++) days += hijriMonthLength(y, mi);
    for (var yi = 1; yi < y; yi++) days += hijriYearLength(yi);
    return HIJRI_EPOCH + days;
  }

  function jdnToHijri(jdn) {
    var days = jdn - HIJRI_EPOCH;
    var year = Math.floor(days / 354.367) + 1;
    var yDays = 0;
    for (var yi = 1; yi < year; yi++) yDays += hijriYearLength(yi);
    while (yDays > days) { year--; yDays -= hijriYearLength(year); }
    while (yDays + hijriYearLength(year) <= days) { yDays += hijriYearLength(year); year++; }
    var remaining = days - yDays;
    var month = 1;
    while (month <= 12) {
      var dim = hijriMonthLength(year, month);
      if (remaining < dim) break;
      remaining -= dim;
      month++;
    }
    return { year: year, month: month, day: remaining + 1 };
  }

  /* ---- Unified via JDN ---- */
  function toJDN(y, m, d, cal) {
    if (cal === 'gregorian') return gregToJDN(y, m, d);
    if (cal === 'shamsi') return shamsiToJDN(y, m, d);
    return hijriToJDN(y, m, d);
  }

  function fromJDN(jdn, cal) {
    if (cal === 'gregorian') return jdnToGreg(jdn);
    if (cal === 'shamsi') return jdnToShamsi(jdn);
    return jdnToHijri(jdn);
  }

  function convert(year, month, day, fromCal, toCal) {
    if (fromCal === toCal) return { year: year, month: month, day: day };
    var jdn = toJDN(year, month, day, fromCal);
    return fromJDN(jdn, toCal);
  }

  function monthLength(year, month, cal) {
    if (cal === 'gregorian') return new Date(year, month, 0).getDate();
    if (cal === 'shamsi') return jalaali.jalaaliMonthLength(year, month);
    return hijriMonthLength(year, month);
  }

  function dayOfWeek(year, month, day, cal) {
    var g;
    if (cal === 'gregorian') {
      g = { year: year, month: month, day: day };
    } else {
      g = jdnToGreg(toJDN(year, month, day, cal));
    }
    var date = new Date(g.year, g.month - 1, g.day);
    var dow = date.getDay();
    if (cal === 'shamsi') return (dow + 1) % 7;
    return dow;
  }

  /* ---- Today in a given calendar ---- */
  function todayIn(cal) {
    var now = new Date();
    return fromJDN(gregToJDN(now.getFullYear(), now.getMonth() + 1, now.getDate()), cal);
  }

  /* ---- Add days to a date string (YYYY-MM-DD in any calendar) ---- */
  function addDays(dateStr, days, cal) {
    var parts = dateStr.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);
    var jdn = toJDN(year, month, day, cal || 'shamsi');
    var res = fromJDN(jdn + days, cal || 'shamsi');
    return res.year + '-' + String(res.month).padStart(2, '0') + '-' + String(res.day).padStart(2, '0');
  }

  SleepApp.Calendars = {
    list: LIST,
    monthNames: monthNames,
    dows: dows,
    convert: convert,
    monthLength: monthLength,
    dayOfWeek: dayOfWeek,
    todayIn: todayIn,
    addDays: addDays,
    toJDN: toJDN,
    fromJDN: fromJDN
  };
})();
