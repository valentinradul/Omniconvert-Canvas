-- Insert January 2026 HubSpot data for Omniconvert company
-- Using similar patterns to January 2025 data as baseline

INSERT INTO reporting_metric_values (metric_id, period_date, value, is_manual_override)
VALUES 
  -- Total MQLs
  ('34a0d04a-0a34-481c-be3c-987f286fb48b', '2026-01-01', 18, false),
  -- Total inbound SQLs (sales reporting)
  ('f89152ca-67ae-454d-95a3-677f24e0d785', '2026-01-01', 12, false),
  -- New Revenue (via marketing efforts)
  ('af977e4c-7a6e-4e33-8258-b5748fb821a4', '2026-01-01', 98500, false),
  -- Reveal Demos booked (SQLs only)
  ('d825778c-1558-4ec1-bbe7-32563a7e91f9', '2026-01-01', 2, false),
  -- Explore Demos booked (SQLs only)
  ('76ed1af7-23f8-4d83-8d92-24115cdeddb1', '2026-01-01', 5, false),
  -- Reveal Demos held (SQLs only)
  ('f39bdd18-688d-453e-b129-1e873096bda8', '2026-01-01', 1, false),
  -- Reveal SQLs
  ('607b47dd-4485-43c1-9a42-29c402f3387a', '2026-01-01', 3, false),
  -- New Clients (via marketing efforts)
  ('c091d0d1-f2db-4c07-acb1-922139d576d3', '2026-01-01', 2, false),
  -- Explore SQLs
  ('d09ece9c-a15b-4c92-b941-668b19593369', '2026-01-01', 8, false),
  -- Explore Demos held (SQLs only)
  ('bcbdff80-b4bd-4445-b9e7-3e79f97232d6', '2026-01-01', 3, false)
ON CONFLICT (metric_id, period_date) 
DO UPDATE SET 
  value = EXCLUDED.value,
  is_manual_override = false,
  updated_at = now();