-- Military Asset Management System (starter schema)
-- This schema is designed to support the AI-style forecast/alerts endpoints.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'BaseCommander', 'LogisticsOfficer'))
);

CREATE TABLE IF NOT EXISTS bases (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  security_level INT NOT NULL DEFAULT 1 CHECK (security_level >= 0)
);

CREATE TABLE IF NOT EXISTS equipment_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  base_id INT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  equipment_type_id INT NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  UNIQUE (base_id, equipment_type_id)
);

-- Incoming procurement
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  base_id INT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  equipment_type_id INT NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity >= 0),
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Consumption / expenditure
CREATE TABLE IF NOT EXISTS expenditures (
  id SERIAL PRIMARY KEY,
  base_id INT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  equipment_type_id INT NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity >= 0),
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  expenditure_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Relocation between bases
CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  from_base_id INT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  to_base_id INT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  equipment_type_id INT NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity >= 0),
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Optional assignment tracking (kept for completeness)
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  asset_id INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  assigned_to TEXT NOT NULL,
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE
);

-- Audit log for write operations
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  actor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

