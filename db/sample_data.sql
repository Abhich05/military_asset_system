-- Sample seed data to make AI endpoints immediately testable.
-- Adjust/extend as needed.

INSERT INTO bases (id, name, security_level) VALUES
  (1, 'Base Alpha', 3),
  (2, 'Base Bravo', 1),
  (3, 'Base Charlie', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO equipment_types (id, name, sku) VALUES
  (1, 'Rifle', 'RFL-001'),
  (2, 'Tactical Vest', 'VST-010')
ON CONFLICT (id) DO NOTHING;

INSERT INTO assets (base_id, equipment_type_id, quantity) VALUES
  (1, 1, 80),
  (1, 2, 45),
  (2, 1, 25),
  (3, 1, 60)
ON CONFLICT (base_id, equipment_type_id) DO NOTHING;

-- Create a small time-series for the last ~35 days.
-- Using a deterministic pattern keeps this file readable (not a full-featured generator).
INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, purchase_date)
SELECT
  1,
  1,
  (20 + (g.i % 7) * 3),
  2500.00,
  (CURRENT_DATE - (g.i || ' days')::interval)::date
FROM generate_series(0, 34) AS g(i);

INSERT INTO expenditures (base_id, equipment_type_id, quantity, unit_cost, expenditure_date)
SELECT
  1,
  1,
  (18 + (g.i % 5) * 4),
  1800.00,
  (CURRENT_DATE - (g.i || ' days')::interval)::date
FROM generate_series(0, 34) AS g(i);

INSERT INTO transfers (from_base_id, to_base_id, equipment_type_id, quantity, unit_cost, transfer_date)
SELECT
  1,
  CASE WHEN (g.i % 4) = 0 THEN 2 ELSE 3 END,
  1,
  (10 + (g.i % 6) * 2),
  3200.00,
  (CURRENT_DATE - (g.i || ' days')::interval)::date
FROM generate_series(0, 34) AS g(i);

