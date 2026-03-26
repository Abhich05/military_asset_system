const aiService = require('../services/ai.service');

function parseIntParam(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

async function forecast(req, res, next) {
  try {
    const baseId = parseIntParam(req.query.baseId, 1);
    const equipmentTypeId = parseIntParam(req.query.equipmentTypeId, 1);
    const period = Math.max(1, parseIntParam(req.query.period, 30));
    const historyDays = Math.max(7, parseIntParam(req.query.historyDays, 60));

    const result = await aiService.forecastDemand({
      baseId,
      equipmentTypeId,
      periodDays: period,
      historyDays
    });

    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function alerts(req, res, next) {
  try {
    const baseId = parseIntParam(req.query.baseId, 1);
    const days = Math.max(7, parseIntParam(req.query.days, 30));

    const result = await aiService.generateAlerts({
      baseId,
      days
    });

    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function recommendPurchase(req, res, next) {
  try {
    const baseId = parseIntParam(req.query.baseId, 1);
    const equipmentTypeId = parseIntParam(req.query.equipmentTypeId, 1);
    const period = Math.max(1, parseIntParam(req.query.period, 30));

    const result = await aiService.recommendPurchase({
      baseId,
      equipmentTypeId,
      periodDays: period
    });

    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  forecast,
  alerts,
  recommendPurchase
};

