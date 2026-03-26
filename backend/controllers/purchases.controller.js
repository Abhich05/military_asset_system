const { query, queryOne, transaction } = require('../config/db');

async function getPurchases(req, res, next) {
  try {
    const { base_id, equipment_type_id, date_from, date_to } = req.query;
    const conditions = [];
    const params = [];
    if (base_id) { conditions.push('p.base_id = ?'); params.push(Number(base_id)); }
    if (equipment_type_id) { conditions.push('p.equipment_type_id = ?'); params.push(Number(equipment_type_id)); }
    if (date_from) { conditions.push("p.purchase_date >= ?"); params.push(date_from); }
    if (date_to)   { conditions.push("p.purchase_date <= ?"); params.push(date_to); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = query(`
      SELECT
        p.id, p.quantity, p.unit_cost, p.vendor, p.notes, p.purchase_date,
        p.created_at, (p.quantity * p.unit_cost) AS total_value,
        b.id AS base_id, b.name AS base_name,
        et.id AS equipment_type_id, et.name AS equipment_type_name, et.category, et.unit,
        u.username AS created_by
      FROM purchases p
      JOIN bases b ON b.id = p.base_id
      JOIN equipment_types et ON et.id = p.equipment_type_id
      LEFT JOIN users u ON u.id = p.created_by
      ${where}
      ORDER BY p.purchase_date DESC, p.id DESC
    `, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
}

async function createPurchase(req, res, next) {
  try {
    const { base_id, equipment_type_id, quantity, unit_cost, vendor, notes, purchase_date } = req.body;
    if (!base_id || !equipment_type_id || !quantity)
      return res.status(400).json({ ok: false, error: 'base_id, equipment_type_id, and quantity are required.' });
    if (Number(quantity) <= 0)
      return res.status(400).json({ ok: false, error: 'Quantity must be greater than 0.' });

    const id = transaction((db) => {
      db.run(
        'INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, vendor, notes, purchase_date, created_by) VALUES (?,?,?,?,?,?,?,?)',
        [Number(base_id), Number(equipment_type_id), Number(quantity), Number(unit_cost) || 0, vendor || '', notes || '', purchase_date || new Date().toISOString().slice(0, 10), req.user?.id || null]
      );
      const { rows: [[lastId]] } = { rows: db.exec('SELECT last_insert_rowid()')[0]?.values || [[0]] };

      // Upsert asset balance
      const existing = db.exec(`SELECT quantity FROM assets WHERE base_id = ${Number(base_id)} AND equipment_type_id = ${Number(equipment_type_id)}`);
      if (existing.length && existing[0].values.length) {
        db.run('UPDATE assets SET quantity = quantity + ? WHERE base_id = ? AND equipment_type_id = ?', [Number(quantity), Number(base_id), Number(equipment_type_id)]);
      } else {
        db.run('INSERT INTO assets (base_id, equipment_type_id, quantity) VALUES (?,?,?)', [Number(base_id), Number(equipment_type_id), Number(quantity)]);
      }
      return lastId;
    });

    res.status(201).json({ ok: true, id, message: 'Purchase recorded successfully.' });
  } catch (err) { next(err); }
}

async function deletePurchase(req, res, next) {
  try {
    const purchase = queryOne('SELECT * FROM purchases WHERE id = ?', [Number(req.params.id)]);
    if (!purchase) return res.status(404).json({ ok: false, error: 'Purchase not found.' });

    transaction((db) => {
      db.run('DELETE FROM purchases WHERE id = ?', [Number(req.params.id)]);
      db.run('UPDATE assets SET quantity = MAX(0, quantity - ?) WHERE base_id = ? AND equipment_type_id = ?',
        [purchase.quantity, purchase.base_id, purchase.equipment_type_id]);
    });
    res.json({ ok: true, message: 'Purchase deleted and asset balance reversed.' });
  } catch (err) { next(err); }
}

module.exports = { getPurchases, createPurchase, deletePurchase };
