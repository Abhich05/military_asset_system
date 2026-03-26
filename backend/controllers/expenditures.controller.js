const { query, queryOne, transaction } = require('../config/db');

async function getExpenditures(req, res, next) {
  try {
    const { base_id, equipment_type_id, date_from, date_to } = req.query;
    const conditions = [];
    const params = [];
    if (base_id) { conditions.push('e.base_id = ?'); params.push(Number(base_id)); }
    if (equipment_type_id) { conditions.push('e.equipment_type_id = ?'); params.push(Number(equipment_type_id)); }
    if (date_from) { conditions.push("e.expenditure_date >= ?"); params.push(date_from); }
    if (date_to)   { conditions.push("e.expenditure_date <= ?"); params.push(date_to); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = query(`
      SELECT e.id, e.quantity, e.reason, e.authorized_by, e.expenditure_date, e.created_at,
        b.id AS base_id, b.name AS base_name,
        et.id AS equipment_type_id, et.name AS equipment_type_name, et.category, et.unit,
        u.username AS created_by
      FROM expenditures e
      JOIN bases b ON b.id = e.base_id
      JOIN equipment_types et ON et.id = e.equipment_type_id
      LEFT JOIN users u ON u.id = e.created_by
      ${where}
      ORDER BY e.expenditure_date DESC, e.id DESC
    `, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
}

async function createExpenditure(req, res, next) {
  try {
    const { base_id, equipment_type_id, quantity, reason, authorized_by, expenditure_date } = req.body;
    if (!base_id || !equipment_type_id || !quantity)
      return res.status(400).json({ ok: false, error: 'base_id, equipment_type_id, and quantity are required.' });
    if (Number(quantity) <= 0)
      return res.status(400).json({ ok: false, error: 'Quantity must be greater than 0.' });

    const asset = queryOne('SELECT quantity FROM assets WHERE base_id = ? AND equipment_type_id = ?', [Number(base_id), Number(equipment_type_id)]);
    if (!asset || asset.quantity < Number(quantity)) {
      return res.status(422).json({ ok: false, error: `Insufficient stock. Available: ${asset?.quantity || 0}, Requested: ${quantity}` });
    }

    const id = transaction((db) => {
      db.run(
        'INSERT INTO expenditures (base_id, equipment_type_id, quantity, reason, authorized_by, expenditure_date, created_by) VALUES (?,?,?,?,?,?,?)',
        [Number(base_id), Number(equipment_type_id), Number(quantity), reason || '', authorized_by || '', expenditure_date || new Date().toISOString().slice(0, 10), req.user?.id || null]
      );
      const [[lastId]] = db.exec('SELECT last_insert_rowid()')[0]?.values || [[0]];
      db.run('UPDATE assets SET quantity = quantity - ? WHERE base_id = ? AND equipment_type_id = ?', [Number(quantity), Number(base_id), Number(equipment_type_id)]);
      return lastId;
    });

    res.status(201).json({ ok: true, id, message: 'Expenditure recorded successfully.' });
  } catch (err) { next(err); }
}

async function getAssignments(req, res, next) {
  try {
    const { base_id, date_from, date_to } = req.query;
    const conditions = [];
    const params = [];
    if (base_id) { conditions.push('a.base_id = ?'); params.push(Number(base_id)); }
    if (date_from) { conditions.push("asgn.assignment_date >= ?"); params.push(date_from); }
    if (date_to)   { conditions.push("asgn.assignment_date <= ?"); params.push(date_to); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = query(`
      SELECT asgn.id, asgn.assigned_to, asgn.unit, asgn.quantity,
        asgn.assignment_date, asgn.due_date, asgn.returned_date, asgn.notes, asgn.created_at,
        b.id AS base_id, b.name AS base_name,
        et.id AS equipment_type_id, et.name AS equipment_type_name, et.category,
        u.username AS created_by
      FROM assignments asgn
      JOIN assets a ON a.id = asgn.asset_id
      JOIN bases b ON b.id = a.base_id
      JOIN equipment_types et ON et.id = a.equipment_type_id
      LEFT JOIN users u ON u.id = asgn.created_by
      ${where}
      ORDER BY asgn.assignment_date DESC
    `, params);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
}

async function createAssignment(req, res, next) {
  try {
    const { asset_id, assigned_to, unit, quantity, assignment_date, due_date, notes } = req.body;
    if (!asset_id || !assigned_to)
      return res.status(400).json({ ok: false, error: 'asset_id and assigned_to are required.' });

    const { lastInsertRowid } = query(
      'INSERT INTO assignments (asset_id, assigned_to, unit, quantity, assignment_date, due_date, notes, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [Number(asset_id), assigned_to, unit || '', Number(quantity) || 1, assignment_date || new Date().toISOString().slice(0, 10), due_date || null, notes || '', req.user?.id || null]
    );
    res.status(201).json({ ok: true, id: lastInsertRowid, message: 'Assignment created.' });
  } catch (err) { next(err); }
}

async function getAuditLog(req, res, next) {
  try {
    const { rows } = query(`
      SELECT al.id, al.action, al.entity_type, al.entity_id, al.metadata,
        al.ip_address, al.created_at, u.username AS actor
      FROM audit_log al
      LEFT JOIN users u ON u.id = al.actor_user_id
      ORDER BY al.created_at DESC
      LIMIT 200
    `);
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
}

module.exports = { getExpenditures, createExpenditure, getAssignments, createAssignment, getAuditLog };
