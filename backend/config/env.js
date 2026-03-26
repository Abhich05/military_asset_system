require('dotenv').config();
const path = require('path');

const env = {
  PORT: Number(process.env.PORT || 3001),
  SQLITE_PATH: process.env.SQLITE_PATH || path.join(__dirname, '../../data/military.db'),
  JWT_SECRET: process.env.JWT_SECRET || 'mil-asset-jwt-secret-2024',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

module.exports = env;
