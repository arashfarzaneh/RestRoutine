window.SleepApp = window.SleepApp || {};

(function () {
  function toOffset(timeStr) {
    var parts = timeStr.split(':');
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (h >= 19) return (h - 19) * 60 + m;
    return (h + 5) * 60 + m;
  }

  function calcDuration(start, end) {
    var parts1 = start.split(':');
    var parts2 = end.split(':');
    var sMin = parseInt(parts1[0], 10) * 60 + parseInt(parts1[1], 10);
    var eMin = parseInt(parts2[0], 10) * 60 + parseInt(parts2[1], 10);
    if (eMin <= sMin) eMin += 24 * 60;
    return (eMin - sMin) / 60;
  }

  function calculate(start, end) {
    var duration = calcDuration(start, end);
    var durationScore = Math.max(0, 100 - Math.abs(duration - 8) * 12.5);
    var timingScore = calcTiming(start, end);
    var finalScore = Math.round(durationScore * 0.7 + timingScore * 0.3);
    finalScore = Math.max(0, Math.min(100, finalScore));
    var color = scoreToColor(finalScore);
    return { score: finalScore, color: color, duration: Math.round(duration * 10) / 10 };
  }

  function calcTiming(start, end) {
    var startOff = toOffset(start);
    var endOff = toOffset(end);

    var startScore;
    if (startOff >= 60 && startOff <= 150) {
      startScore = 100;
    } else if (startOff < 60) {
      startScore = Math.max(0, 100 - (60 - startOff) / 60 * 100);
    } else {
      startScore = Math.max(0, 100 - (startOff - 150) / 270 * 100);
    }

    var endScore;
    if (endOff >= 600 && endOff <= 720) {
      endScore = 100;
    } else if (endOff < 600) {
      endScore = Math.max(0, 100 - (600 - endOff) / 120 * 100);
    } else {
      endScore = Math.max(0, 100 - (endOff - 720) / 300 * 100);
    }

    return (startScore + endScore) / 2;
  }

  function scoreToColor(score) {
    var t = score / 100;
    var hue;
    if (t < 0.4) {
      hue = (t / 0.4) * 30;
    } else if (t < 0.7) {
      hue = 30 + ((t - 0.4) / 0.3) * 30;
    } else {
      hue = 60 + ((t - 0.7) / 0.3) * 60;
    }
    return 'hsl(' + Math.round(hue) + ', 75%, 45%)';
  }

  SleepApp.Scoring = {
    calculate: calculate,
    calcDuration: calcDuration,
    scoreToColor: scoreToColor
  };
})();
