const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../config/db');
const env = require('../config/env');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Username and password are required.' });
    }
    const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ ok: false, error: 'Invalid credentials.' });

    const payload = { id: user.id, username: user.username, role: user.role, base_id: user.base_id };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ ok: true, token, user: payload });
  } catch (err) { next(err); }
}

async function me(req, res, next) {
  try {
    const user = queryOne('SELECT id, username, role, base_id, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });
    res.json({ ok: true, user });
  } catch (err) { next(err); }
}

async function getUsers(req, res, next) {
  try {
    const { rows } = query('SELECT id, username, role, base_id, created_at FROM users ORDER BY id ASC');
    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const { username, password, role, base_id } = req.body;
    if (!username || !password || !role)
      return res.status(400).json({ ok: false, error: 'username, password, and role are required.' });
    const validRoles = ['Admin', 'BaseCommander', 'LogisticsOfficer'];
    if (!validRoles.includes(role))
      return res.status(400).json({ ok: false, error: `Role must be one of: ${validRoles.join(', ')}` });

    const hash = bcrypt.hashSync(password, 10);
    const { lastInsertRowid } = query(
      'INSERT INTO users (username, password_hash, role, base_id) VALUES (?, ?, ?, ?)',
      [username, hash, role, base_id || null]
    );
    res.status(201).json({ ok: true, id: lastInsertRowid, message: 'User created.' });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ ok: false, error: 'Username already exists.' });
    next(err);
  }
}

module.exports = { login, me, getUsers, createUser };
