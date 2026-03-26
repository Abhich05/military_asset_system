function movingAverageForecast(history, periodDays, { windowDays } = {}) {
  const historyValues = Array.isArray(history) ? history.map(r => Number(r.value)) : [];
  const w = Math.max(1, Math.min(windowDays || 14, historyValues.length));

  // Average of the last w days as "expected net demand".
  const slice = historyValues.slice(historyValues.length - w);
  const avg = slice.reduce((s, v) => s + v, 0) / Math.max(1, slice.length);

  const lastDate = history.length ? history[history.length - 1].date : new Date().toISOString().slice(0, 10);
  const start = new Date(lastDate);

  const forecast = [];
  for (let i = 1; i <= periodDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    // Keep it intentionally simple: a moving average trend plus mild rounding.
    const value = Math.max(0, Math.round(avg));
    forecast.push({ date: d.toISOString().slice(0, 10), value });
  }

  return forecast;
}

module.exports = {
  movingAverageForecast
};

