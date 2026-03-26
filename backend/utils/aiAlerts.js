function computeAverage(values) {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function generateAlerts({ baseId, expendituresSeries, transfersSeries, lowSecurityThreshold, spikeMultiplier }) {
  const alerts = [];

  const expenditures = Array.isArray(expendituresSeries) ? expendituresSeries : [];
  const last = expenditures.length ? expenditures[expenditures.length - 1] : null;
  const prev = expenditures.slice(Math.max(0, expenditures.length - 14), Math.max(0, expenditures.length - 1)).map(r => Number(r.value));
  const prevAvg = computeAverage(prev);
  const lastValue = last ? Number(last.value) : 0;

  if (prevAvg > 0 && lastValue > prevAvg * spikeMultiplier) {
    alerts.push({
      type: 'EXPENDITURE_SPIKE',
      severity: 'high',
      baseId,
      date: last.date,
      message: `Unusual expenditure spike detected: ${lastValue} vs ~${Math.round(prevAvg)} (x${spikeMultiplier}).`,
      meta: { lastValue, prevAvg }
    });
  } else if (last && prevAvg === 0 && lastValue > 0) {
    alerts.push({
      type: 'EXPENDITURE_SPIKE',
      severity: 'medium',
      baseId,
      date: last.date,
      message: `Expenditure activity detected where baseline was near zero (${lastValue}).`,
      meta: { lastValue }
    });
  }

  const transfers = Array.isArray(transfersSeries) ? transfersSeries : [];

  for (const t of transfers) {
    if (Number(t.toSecurityLevel) <= Number(lowSecurityThreshold)) {
      // "High-value" in a heuristic sense: any transfer above the average of the last batch.
      // In a real system you might use percentiles from historical baselines.
      const batchAvg = computeAverage(transfers.map(x => Number(x.value)));
      const threshold = Math.max(1, batchAvg * 1.1);
      if (Number(t.value) >= threshold) {
        alerts.push({
          type: 'HIGH_VALUE_TRANSFER_TO_LOW_SECURITY',
          severity: 'high',
          baseId,
          date: t.date,
          message: `High-value transfer sent to low-security base (security<=${lowSecurityThreshold}). Value: ${Math.round(t.value)}.`,
          meta: { toSecurityLevel: t.toSecurityLevel, value: t.value, threshold }
        });
      }
    }
  }

  // Sort with newest/highest severity first for UI convenience.
  const severityRank = { high: 3, medium: 2, low: 1 };
  alerts.sort((a, b) => {
    const sr = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
    if (sr !== 0) return sr;
    return String(b.date).localeCompare(String(a.date));
  });

  return alerts;
}

module.exports = {
  generateAlerts
};

