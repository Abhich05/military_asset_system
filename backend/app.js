const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDb } = require('./config/initDb');

const aiRoutes           = require('./routes/ai.routes');
const authRoutes         = require('./routes/auth.routes');
const assetsRoutes       = require('./routes/assets.routes');
const purchasesRoutes    = require('./routes/purchases.routes');
const transfersRoutes    = require('./routes/transfers.routes');
const expendituresRoutes = require('./routes/expenditures.routes');

const app = express();

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health
app.get('/health', (_req, res) => res.json({ ok: true, service: 'military-asset-system', version: '2.0.0' }));

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api',           assetsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api',           expendituresRoutes);
app.use('/ai',            aiRoutes);

// 404
app.use((_req, res) => res.status(404).json({ ok: false, error: 'Endpoint not found.' }));

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status  = err.status  || 500;
  const message = err.message || 'Unexpected server error';
  console.error('[ERROR]', message);
  res.status(status).json({ ok: false, error: message });
});

// Boot — initialize DB async then export ready app
let _ready = false;
app.ready = initDb().then(() => {
  _ready = true;
  console.log('[APP] Database ready.');
}).catch(err => {
  console.error('[APP] DB init failed:', err.message);
  process.exit(1);
});

module.exports = app;
