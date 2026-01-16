-- Update Total MQLs to correct value for January 2026
UPDATE reporting_metric_values 
SET value = 33, updated_at = now()
WHERE metric_id = '34a0d04a-0a34-481c-be3c-987f286fb48b' 
AND period_date = '2026-01-01';