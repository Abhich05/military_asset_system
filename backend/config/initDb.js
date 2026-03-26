const { getDb, query } = require('./db');
const bcrypt = require('bcryptjs');

async function initDb() {
  const db = await getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Admin', 'BaseCommander', 'LogisticsOfficer')),
      base_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      security_level INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS equipment_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      sku TEXT,
      unit TEXT NOT NULL DEFAULT 'unit',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      base_id INTEGER NOT NULL,
      equipment_type_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      UNIQUE (base_id, equipment_type_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      base_id INTEGER NOT NULL,
      equipment_type_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      vendor TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      purchase_date TEXT NOT NULL DEFAULT (date('now')),
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expenditures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      base_id INTEGER NOT NULL,
      equipment_type_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      authorized_by TEXT NOT NULL DEFAULT '',
      expenditure_date TEXT NOT NULL DEFAULT (date('now')),
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_base_id INTEGER NOT NULL,
      to_base_id INTEGER NOT NULL,
      equipment_type_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      transfer_date TEXT NOT NULL DEFAULT (date('now')),
      status TEXT NOT NULL DEFAULT 'Completed',
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      assigned_to TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 1,
      assignment_date TEXT NOT NULL DEFAULT (date('now')),
      due_date TEXT,
      returned_date TEXT,
      notes TEXT NOT NULL DEFAULT '',
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      metadata TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Seed if empty
  const { rows: cnt } = query('SELECT COUNT(*) AS cnt FROM bases');
  if (!cnt[0] || cnt[0].cnt === 0) {
    seedData(db);
  }

  console.log('[DB] SQLite initialized.');
}

function seedData(db) {
  console.log('[DB] Seeding initial data...');
  const bases = [
    [1, 'Base Alpha', 'Northern Command Zone', 3],
    [2, 'Base Bravo', 'Eastern Sector', 2],
    [3, 'Base Charlie', 'Southern Outpost', 1],
    [4, 'Fort Delta', 'Western Border', 3],
    [5, 'Camp Echo', 'Central Reserve', 2],
  ];
  bases.forEach(([id, name, loc, sec]) =>
    db.run('INSERT OR IGNORE INTO bases (id, name, location, security_level) VALUES (?, ?, ?, ?)', [id, name, loc, sec])
  );

  const eqs = [
    [1, 'M4 Carbine', 'Weapons', 'WPN-M4-001', 'unit'],
    [2, 'Tactical Vest', 'Protective Gear', 'PRT-TV-010', 'unit'],
    [3, '5.56mm Ammo (100rds)', 'Ammunition', 'AMO-556-100', 'box'],
    [4, 'Night Vision Goggles', 'Optics', 'OPT-NVG-022', 'unit'],
    [5, 'Humvee M1151', 'Vehicles', 'VEH-HMV-115', 'vehicle'],
    [6, 'Field Ration (MRE)', 'Supplies', 'SUP-MRE-001', 'pack'],
    [7, 'M9 Pistol', 'Weapons', 'WPN-M9-002', 'unit'],
    [8, 'Body Armor Plate', 'Protective Gear', 'PRT-BAP-003', 'unit'],
  ];
  eqs.forEach(([id, name, cat, sku, unit]) =>
    db.run('INSERT OR IGNORE INTO equipment_types (id, name, category, sku, unit) VALUES (?, ?, ?, ?, ?)', [id, name, cat, sku, unit])
  );

  const assets = [
    [1, 1, 120], [1, 2, 80], [1, 3, 500], [1, 4, 25], [1, 5, 15], [1, 6, 300],
    [2, 1, 60],  [2, 2, 45], [2, 3, 200], [2, 7, 40], [2, 8, 90],
    [3, 1, 35],  [3, 3, 150],[3, 6, 180],
    [4, 1, 95],  [4, 2, 60], [4, 4, 18],  [4, 5, 8],  [4, 7, 55],
    [5, 1, 45],  [5, 6, 240],[5, 8, 120],
  ];
  assets.forEach(([bid, eid, qty]) =>
    db.run('INSERT OR IGNORE INTO assets (base_id, equipment_type_id, quantity) VALUES (?, ?, ?)', [bid, eid, qty])
  );

  // Users
  const pw = bcrypt.hashSync('password123', 10);
  const adminPw = bcrypt.hashSync('admin@2024', 10);
  [
    ['admin', adminPw, 'Admin', null],
    ['cmdr_alpha', pw, 'BaseCommander', 1],
    ['cmdr_bravo', pw, 'BaseCommander', 2],
    ['logistics_01', pw, 'LogisticsOfficer', 1],
    ['logistics_02', pw, 'LogisticsOfficer', 2],
  ].forEach(([u, p, r, b]) =>
    db.run('INSERT OR IGNORE INTO users (username, password_hash, role, base_id) VALUES (?, ?, ?, ?)', [u, p, r, b])
  );

  // 30 days of history
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    db.run('INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, vendor, purchase_date) VALUES (?,?,?,?,?,?)', [1, 1, 20 + (i % 7) * 3, 2500, 'DefenseCorp', ds]);
    db.run('INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, vendor, purchase_date) VALUES (?,?,?,?,?,?)', [2, 3, 50 + (i % 5) * 10, 120, 'AmmoSupply Inc', ds]);
    db.run('INSERT INTO expenditures (base_id, equipment_type_id, quantity, reason, expenditure_date) VALUES (?,?,?,?,?)', [1, 1, 8 + (i % 5) * 2, 'Training exercise', ds]);
    db.run('INSERT INTO expenditures (base_id, equipment_type_id, quantity, reason, expenditure_date) VALUES (?,?,?,?,?)', [1, 3, 30 + (i % 4) * 10, 'Live fire exercise', ds]);
    if (i % 4 === 0) db.run('INSERT INTO transfers (from_base_id, to_base_id, equipment_type_id, quantity, transfer_date) VALUES (?,?,?,?,?)', [1, 2, 1, 10 + (i % 3) * 5, ds]);
    if (i % 6 === 0) db.run('INSERT INTO transfers (from_base_id, to_base_id, equipment_type_id, quantity, transfer_date) VALUES (?,?,?,?,?)', [2, 3, 3, 25, ds]);
  }

  console.log('[DB] Seed complete.');
}

module.exports = { initDb };
