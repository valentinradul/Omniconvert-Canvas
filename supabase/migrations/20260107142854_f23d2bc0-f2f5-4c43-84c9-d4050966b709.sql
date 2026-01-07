-- Delete all OLD dummy metrics that don't match the Excel data
-- Keep only the 36 new metrics we created from the Excel file

DELETE FROM reporting_metric_values 
WHERE metric_id IN (
  SELECT id FROM reporting_metrics 
  WHERE company_id = 'dff411eb-ae53-4724-8456-5db4fff10441'
  AND name NOT IN (
    'Total Traffic (Users)', 'Pricing (Users)', 'Book-a-demo', 'Book-a-call',
    'Pricing + Book a demo (Users)', 'Pricing Explore', 'Pricing Reveal', 'Pricing Pulse',
    'Reveal SQLs', 'Explore SQLs', 'Pulse SQLs', 'CRO Benchmark New Users',
    'Explore Demos Held (SQLs only)', 'Total MQLs', 'Total Inbound SQLs',
    'Conversion Rate (SQLs/Pricing+Demo)', 'New Clients (via marketing)',
    'New Revenue (via marketing)', 'Close Rate (Clients/SQL)', 'Reveal Installs',
    'Explore Installs', 'Reveal Demos Booked (SQLs only)', 'Explore Demos Booked (SQLs only)',
    'Reveal Demos Held (SQLs only)', 'Students', 'Revenue per Customer',
    'Budget Mkt Spent - Total', 'CPL (SQL)', 'Customer Acquisition Cost (CAC)',
    'Share of Voice (vs Competitors)', 'Total Impressions', 'Total Google Clicks',
    'Branded Impressions', 'Branded Clicks', 'ROI', 'Rolling Average ROI'
  )
);

DELETE FROM reporting_metrics 
WHERE company_id = 'dff411eb-ae53-4724-8456-5db4fff10441'
AND name NOT IN (
  'Total Traffic (Users)', 'Pricing (Users)', 'Book-a-demo', 'Book-a-call',
  'Pricing + Book a demo (Users)', 'Pricing Explore', 'Pricing Reveal', 'Pricing Pulse',
  'Reveal SQLs', 'Explore SQLs', 'Pulse SQLs', 'CRO Benchmark New Users',
  'Explore Demos Held (SQLs only)', 'Total MQLs', 'Total Inbound SQLs',
  'Conversion Rate (SQLs/Pricing+Demo)', 'New Clients (via marketing)',
  'New Revenue (via marketing)', 'Close Rate (Clients/SQL)', 'Reveal Installs',
  'Explore Installs', 'Reveal Demos Booked (SQLs only)', 'Explore Demos Booked (SQLs only)',
  'Reveal Demos Held (SQLs only)', 'Students', 'Revenue per Customer',
  'Budget Mkt Spent - Total', 'CPL (SQL)', 'Customer Acquisition Cost (CAC)',
  'Share of Voice (vs Competitors)', 'Total Impressions', 'Total Google Clicks',
  'Branded Impressions', 'Branded Clicks', 'ROI', 'Rolling Average ROI'
);