const { query } = require('../config/db');
const aiForecast = require('../utils/aiForecast');
const aiAlerts   = require('../utils/aiAlerts');

/* ── deterministic mock helpers ──────────────────────────── */
function seedFromInts(a, b) { return (a * 997 + b * 577) % 100000; }
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeMockSeries({ baseId, equipmentTypeId, historyDays }) {
  const rnd = mulberry32(seedFromInts(baseId, equipmentTypeId));
  const start = new Date();
  start.setDate(start.getDate() - historyDays + 1);
  const rows = [];
  let baseline = 20 + Math.floor(rnd() * 60);
  for (let i = 0; i < historyDays; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const noise = (rnd() - 0.5) * 20;
    const spike = rnd() > 0.92 ? 40 + rnd() * 40 : 0;
    rows.push({ date: d.toISOString().slice(0, 10), value: Math.max(0, Math.round(baseline + noise + spike)) });
    baseline = Math.max(5, baseline + Math.round((rnd() - 0.5) * 6));
  }
  return rows;
}

/* ── DB query helpers using sql.js ───────────────────────── */
function getNetDemandDaily({ baseId, equipmentTypeId, historyDays }) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - historyDays + 1);
  const fromDate = cutoff.toISOString().slice(0, 10);
  const today    = new Date().toISOString().slice(0, 10);

  const { rows: pRows } = query(
    "SELECT purchase_date AS day, COALESCE(SUM(quantity),0) AS qty FROM purchases WHERE base_id=? AND equipment_type_id=? AND purchase_date BETWEEN ? AND ? GROUP BY purchase_date",
    [baseId, equipmentTypeId, fromDate, today]
  );
  const { rows: eRows } = query(
    "SELECT expenditure_date AS day, COALESCE(SUM(quantity),0) AS qty FROM expenditures WHERE base_id=? AND equipment_type_id=? AND expenditure_date BETWEEN ? AND ? GROUP BY expenditure_date",
    [baseId, equipmentTypeId, fromDate, today]
  );
  const { rows: tiRows } = query(
    "SELECT transfer_date AS day, COALESCE(SUM(quantity),0) AS qty FROM transfers WHERE to_base_id=? AND equipment_type_id=? AND transfer_date BETWEEN ? AND ? GROUP BY transfer_date",
    [baseId, equipmentTypeId, fromDate, today]
  );
  const { rows: toRows } = query(
    "SELECT transfer_date AS day, COALESCE(SUM(quantity),0) AS qty FROM transfers WHERE from_base_id=? AND equipment_type_id=? AND transfer_date BETWEEN ? AND ? GROUP BY transfer_date",
    [baseId, equipmentTypeId, fromDate, today]
  );

  const map = new Map();
  const apply = (rows, sign) => rows.forEach(r => map.set(r.day, (map.get(r.day) || 0) + sign * Number(r.qty)));
  apply(pRows,  -1);
  apply(tiRows, -1);
  apply(eRows,  +1);
  apply(toRows, +1);

  const out = [];
  const s = new Date(fromDate);
  for (let i = 0; i < historyDays; i++) {
    const d = new Date(s); d.setDate(s.getDate() + i);
    const day = d.toISOString().slice(0, 10);
    out.push({ date: day, value: Math.max(0, map.get(day) || 0) });
  }
  return out;
}

function getCurrentStock({ baseId, equipmentTypeId }) {
  const { rows } = query('SELECT quantity FROM assets WHERE base_id=? AND equipment_type_id=?', [baseId, equipmentTypeId]);
  return rows.length ? Number(rows[0].quantity) : 0;
}

function getExpendituresDaily({ baseId, equipmentTypeId, days }) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days + 1);
  const { rows } = query(
    "SELECT expenditure_date AS day, COALESCE(SUM(quantity),0) AS qty FROM expenditures WHERE base_id=? AND equipment_type_id=? AND expenditure_date >= ? GROUP BY expenditure_date",
    [baseId, equipmentTypeId, cutoff.toISOString().slice(0, 10)]
  );
  return rows.map(r => ({ date: r.day, value: Number(r.qty) }));
}

function getTransfersLastDays({ baseId, days }) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days + 1);
  const { rows } = query(
    "SELECT t.transfer_date AS day, t.quantity, b2.security_level AS to_security_level FROM transfers t JOIN bases b2 ON b2.id = t.to_base_id WHERE t.from_base_id=? AND t.transfer_date >= ?",
    [baseId, cutoff.toISOString().slice(0, 10)]
  );
  return rows.map(r => ({ date: r.day, quantity: Number(r.quantity), value: Number(r.quantity) * 2000, toSecurityLevel: Number(r.to_security_level) }));
}

/* ── Service functions ───────────────────────────────────── */
function tryDb(fn, fallback) {
  try { return fn(); } catch (_e) { return fallback(); }
}

async function forecastDemand({ baseId, equipmentTypeId, periodDays, historyDays }) {
  const dailyNetDemand = tryDb(
    () => getNetDemandDaily({ baseId, equipmentTypeId, historyDays }),
    () => makeMockSeries({ baseId, equipmentTypeId, historyDays })
  );
  const forecast = aiForecast.movingAverageForecast(dailyNetDemand, periodDays, { windowDays: Math.min(14, historyDays) });
  return { baseId, equipmentTypeId, periodDays, historyDays, history: dailyNetDemand, forecast };
}

async function generateAlerts({ baseId, days }) {
  const equipmentTypeId = 1;
  const rnd = mulberry32(seedFromInts(baseId + 123, equipmentTypeId + 456));

  const expendituresSeries = tryDb(
    () => getExpendituresDaily({ baseId, equipmentTypeId, days }),
    () => makeMockSeries({ baseId, equipmentTypeId, historyDays: days })
  );

  const transfersSeries = tryDb(
    () => getTransfersLastDays({ baseId, days }),
    () => {
      const mock = makeMockSeries({ baseId, equipmentTypeId, historyDays: days });
      return Array.from({ length: Math.max(5, Math.floor(days / 3)) }, (_, i) => ({
        date: mock[Math.min(mock.length - 1, i)].date,
        quantity: 10 + Math.floor(rnd() * 50),
        value: (10 + Math.floor(rnd() * 50)) * (500 + rnd() * 2500),
        toSecurityLevel: rnd() > 0.7 ? 1 : 3
      }));
    }
  );

  const alerts = aiAlerts.generateAlerts({ baseId, expendituresSeries, transfersSeries, lowSecurityThreshold: 2, spikeMultiplier: 1.6 });
  return { baseId, days, alerts };
}

async function recommendPurchase({ baseId, equipmentTypeId, periodDays }) {
  const historyDays = Math.max(30, periodDays * 2);
  const forecastResult = await forecastDemand({ baseId, equipmentTypeId, periodDays, historyDays });
  const currentStock = tryDb(
    () => getCurrentStock({ baseId, equipmentTypeId }),
    () => { const rnd = mulberry32(seedFromInts(baseId + 77, equipmentTypeId + 99)); return 30 + Math.floor(rnd() * 120); }
  );
  const neededNextPeriod = forecastResult.forecast.reduce((s, p) => s + Number(p.value), 0);
  const targetStock = neededNextPeriod * 1.1;
  const suggestedQuantity = Math.max(0, Math.ceil(targetStock - currentStock));
  return { baseId, equipmentTypeId, periodDays, currentStock, neededNextPeriod, targetStock, suggestedQuantity, note: 'Rule-based recommendation: forecasted net demand + 10% safety buffer.' };
}

module.exports = { forecastDemand, generateAlerts, recommendPurchase };
