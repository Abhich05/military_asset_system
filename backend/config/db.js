/**
 * SQLite via sql.js (pure JavaScript — no native compilation needed).
 * Data is persisted to disk at env.SQLITE_PATH using fs read/write.
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const env = require('./env');

let _db = null;
let _SQL = null;

async function getDb() {
  if (_db) return _db;

  _SQL = await initSqlJs();

  const dbPath = env.SQLITE_PATH;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    _db = new _SQL.Database(filebuffer);
  } else {
    _db = new _SQL.Database();
  }

  // Persist after every write
  wrapDbForPersistence(_db, dbPath);
  return _db;
}

function wrapDbForPersistence(db, dbPath) {
  const origRun = db.run.bind(db);
  db.run = function (sql, params) {
    const result = origRun(sql, params);
    const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|PRAGMA)/i.test(sql);
    if (isWrite) {
      const data = db.export();
      fs.writeFileSync(dbPath, Buffer.from(data));
    }
    return result;
  };
}

/**
 * Execute a SQL query and return {rows, rowCount, lastInsertRowid}
 */
function query(sql, params = []) {
  const db = _db;
  if (!db) throw new Error('Database not initialized. Call initDb() first.');

  const trimmed = sql.trim().toUpperCase();
  const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('WITH');

  if (isSelect) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return { rows };
  }

  // For INSERT/UPDATE/DELETE
  db.run(sql, params);

  // Get last insert rowid and changes
  const [[lastId]] = db.exec('SELECT last_insert_rowid()')[0]?.values || [[0]];
  const [[changes]] = db.exec('SELECT changes()')[0]?.values || [[0]];

  return { rows: [], rowCount: Number(changes), lastInsertRowid: Number(lastId) };
}

function queryOne(sql, params = []) {
  const { rows } = query(sql, params);
  return rows[0] || null;
}

/**
 * Run a group of statements in a transaction (sql.js is synchronous).
 */
function transaction(fn) {
  const db = _db;
  db.run('BEGIN');
  try {
    const result = fn(db);
    db.run('COMMIT');
    return result;
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

module.exports = { getDb, query, queryOne, transaction };
