-- Update HubSpot metrics to have proper integration_type set
UPDATE reporting_metrics 
SET integration_type = 'hubspot'
WHERE source ILIKE '%hubspot%' 
  AND (integration_type IS NULL OR integration_type = '');