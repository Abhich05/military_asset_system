const { query, queryOne, transaction } = require('../config/db');

async function getTransfers(req, res, next) {
  try {
    const { base_id, equipment_type_id, status, date_from, date_to } = req.query;
    const conditions = [];
    const params = [];
    if (base_id) {
      conditions.push('(t.from_base_id = ? OR t.to_base_id = ?)');
      params.push(Number(base_id), Number(base_id));
    }
    if (equipment_type_id) { conditions.push('t.equipment_type_id = ?'); params.push(Number(equipment_type_id)); }
    if (status)   { conditions.push('t.status = ?'); params.push(status); }
    if (date_from){ conditions.push("t.transfer_date >= ?"); params.push(date_from); }
    if (date_to)  { conditions.push("t.transfer_date <= ?"); params.push(date_to); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = query(`
      SELECT
        t.id, t.quantity, t.notes, t.transfer_date, t.status, t.created_at,
        bf.id AS from_base_id, bf.name AS from_base_name, bf.security_level AS from_security_level,
        bt.id AS to_base_id, bt.name AS to_base_name, bt.security_level AS to_security_level,
        et.id AS equipment_type_id, et.name AS equipment_type_name, et.category, et.unit,
        u.username AS created_by
      FROM transfers t
      JOIN bases bf ON bf.id = t.from_base_id
      JOIN bases bt ON bt.id = t.to_base_id
      JOIN equipment_types et ON et.id = t.equipment_type_id
      LEFT JOIN users u ON u.id = t.created_by
      ${where}
      ORDER BY t.transfer_date DESC, t.id DESC
    `, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
}

async function createTransfer(req, res, next) {
  try {
    const { from_base_id, to_base_id, equipment_type_id, quantity, notes, transfer_date } = req.body;
    if (!from_base_id || !to_base_id || !equipment_type_id || !quantity)
      return res.status(400).json({ ok: false, error: 'from_base_id, to_base_id, equipment_type_id, and quantity are required.' });
    if (Number(from_base_id) === Number(to_base_id))
      return res.status(400).json({ ok: false, error: 'Source and destination bases must be different.' });
    if (Number(quantity) <= 0)
      return res.status(400).json({ ok: false, error: 'Quantity must be greater than 0.' });

    // Check source stock BEFORE transaction
    const sourceAsset = queryOne('SELECT quantity FROM assets WHERE base_id = ? AND equipment_type_id = ?', [Number(from_base_id), Number(equipment_type_id)]);
    if (!sourceAsset || sourceAsset.quantity < Number(quantity)) {
      return res.status(422).json({
        ok: false,
        error: `Insufficient stock. Available: ${sourceAsset?.quantity || 0}, Requested: ${quantity}`
      });
    }

    const id = transaction((db) => {
      db.run(
        'INSERT INTO transfers (from_base_id, to_base_id, equipment_type_id, quantity, notes, transfer_date, status, created_by) VALUES (?,?,?,?,?,?,?,?)',
        [Number(from_base_id), Number(to_base_id), Number(equipment_type_id), Number(quantity), notes || '', transfer_date || new Date().toISOString().slice(0, 10), 'Completed', req.user?.id || null]
      );
      const [[lastId]] = db.exec('SELECT last_insert_rowid()')[0]?.values || [[0]];

      // Deduct from source
      db.run('UPDATE assets SET quantity = quantity - ? WHERE base_id = ? AND equipment_type_id = ?', [Number(quantity), Number(from_base_id), Number(equipment_type_id)]);

      // Add to destination (upsert)
      const dest = db.exec(`SELECT quantity FROM assets WHERE base_id = ${Number(to_base_id)} AND equipment_type_id = ${Number(equipment_type_id)}`);
      if (dest.length && dest[0].values.length) {
        db.run('UPDATE assets SET quantity = quantity + ? WHERE base_id = ? AND equipment_type_id = ?', [Number(quantity), Number(to_base_id), Number(equipment_type_id)]);
      } else {
        db.run('INSERT INTO assets (base_id, equipment_type_id, quantity) VALUES (?,?,?)', [Number(to_base_id), Number(equipment_type_id), Number(quantity)]);
      }
      return lastId;
    });

    res.status(201).json({ ok: true, id, message: 'Transfer completed successfully.' });
  } catch (err) { next(err); }
}

module.exports = { getTransfers, createTransfer };
