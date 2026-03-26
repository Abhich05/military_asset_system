const { query } = require('../config/db');

async function getBases(req, res, next) {
  try {
    const { rows } = query('SELECT * FROM bases ORDER BY name ASC');
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
}

async function getEquipmentTypes(req, res, next) {
  try {
    const { rows } = query('SELECT * FROM equipment_types ORDER BY category, name ASC');
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
}

async function getAssets(req, res, next) {
  try {
    const { base_id, equipment_type_id, category } = req.query;
    const conditions = [];
    const params = [];
    if (base_id) { conditions.push('a.base_id = ?'); params.push(Number(base_id)); }
    if (equipment_type_id) { conditions.push('a.equipment_type_id = ?'); params.push(Number(equipment_type_id)); }
    if (category) { conditions.push('et.category = ?'); params.push(category); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = query(`
      SELECT
        a.id, a.quantity,
        b.id AS base_id, b.name AS base_name, b.security_level,
        et.id AS equipment_type_id, et.name AS equipment_type_name,
        et.category, et.sku, et.unit
      FROM assets a
      JOIN bases b ON b.id = a.base_id
      JOIN equipment_types et ON et.id = a.equipment_type_id
      ${where}
      ORDER BY b.name, et.category, et.name
    `, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
}

async function getDashboardSummary(req, res, next) {
  try {
    const { base_id, category, date_from, date_to } = req.query;
    const baseFilter = base_id ? `AND base_id = ${Number(base_id)}` : '';
    const assetConditions = [];
    const assetParams = [];
    if (base_id) { assetConditions.push('a.base_id = ?'); assetParams.push(Number(base_id)); }
    if (category) { assetConditions.push('et.category = ?'); assetParams.push(category); }
    const assetWhere = assetConditions.length ? `WHERE ${assetConditions.join(' AND ')}` : '';

    const dateFilter = (col) => {
      const c = [];
      if (date_from) c.push(`${col} >= '${date_from}'`);
      if (date_to)   c.push(`${col} <= '${date_to}'`);
      return c.length ? `AND ${c.join(' AND ')}` : '';
    };

    const { rows: assets } = query(`
      SELECT b.id AS base_id, b.name AS base_name,
        et.id AS equipment_type_id, et.name AS equipment_type_name, et.category,
        a.quantity AS opening_balance
      FROM assets a
      JOIN bases b ON b.id = a.base_id
      JOIN equipment_types et ON et.id = a.equipment_type_id
      ${assetWhere}
      ORDER BY b.name, et.category, et.name
    `, assetParams);

    const { rows: purchases } = query(`
      SELECT base_id, equipment_type_id, SUM(quantity) AS total_qty, SUM(quantity * unit_cost) AS total_value
      FROM purchases WHERE 1=1 ${baseFilter} ${dateFilter('purchase_date')}
      GROUP BY base_id, equipment_type_id
    `);

    const { rows: expenditures } = query(`
      SELECT base_id, equipment_type_id, SUM(quantity) AS total_qty
      FROM expenditures WHERE 1=1 ${baseFilter} ${dateFilter('expenditure_date')}
      GROUP BY base_id, equipment_type_id
    `);

    const fromBaseFilter = base_id ? `AND from_base_id = ${Number(base_id)}` : '';
    const toBaseFilter   = base_id ? `AND to_base_id = ${Number(base_id)}`   : '';

    const { rows: transfersOut } = query(`
      SELECT from_base_id AS base_id, equipment_type_id, SUM(quantity) AS total_qty
      FROM transfers WHERE status = 'Completed' ${fromBaseFilter} ${dateFilter('transfer_date')}
      GROUP BY from_base_id, equipment_type_id
    `);

    const { rows: transfersIn } = query(`
      SELECT to_base_id AS base_id, equipment_type_id, SUM(quantity) AS total_qty
      FROM transfers WHERE status = 'Completed' ${toBaseFilter} ${dateFilter('transfer_date')}
      GROUP BY to_base_id, equipment_type_id
    `);

    const { rows: statsRows } = query(`
      SELECT
        (SELECT COUNT(*) FROM bases) AS total_bases,
        (SELECT COALESCE(SUM(quantity),0) FROM assets ${base_id ? `WHERE base_id = ${Number(base_id)}` : ''}) AS total_assets,
        (SELECT COUNT(DISTINCT equipment_type_id) FROM assets) AS equipment_types,
        (SELECT COUNT(*) FROM transfers WHERE status = 'Pending') AS pending_transfers
    `);

    res.json({
      ok: true,
      data: {
        stats: statsRows[0],
        assets,
        movements: { purchases, expenditures, transfersOut, transfersIn }
      }
    });
  } catch (err) { next(err); }
}

module.exports = { getBases, getEquipmentTypes, getAssets, getDashboardSummary };
