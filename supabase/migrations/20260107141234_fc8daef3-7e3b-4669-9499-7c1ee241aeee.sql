-- Marketing Performance Data Ingestion for Omniconvert
-- Company ID: dff411eb-ae53-4724-8456-5db4fff10441
-- Category ID: 11111111-1111-1111-1111-111111111111

-- Insert all 36 KPI metrics (using gen_random_uuid())
INSERT INTO public.reporting_metrics (id, name, company_id, category_id, source, sort_order, is_calculated, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Total Traffic (Users)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Analytics', 1, false, now(), now()),
  (gen_random_uuid(), 'Pricing (Users)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Analytics', 2, false, now(), now()),
  (gen_random_uuid(), 'Book-a-demo', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Analytics', 3, false, now(), now()),
  (gen_random_uuid(), 'Book-a-call', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Analytics', 4, false, now(), now()),
  (gen_random_uuid(), 'Pricing + Book a demo (Users)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Analytics', 5, false, now(), now()),
  (gen_random_uuid(), 'Pricing Explore', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Analytics', 6, false, now(), now()),
  (gen_random_uuid(), 'Pricing Reveal', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Analytics', 7, false, now(), now()),
  (gen_random_uuid(), 'Pricing Pulse', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Analytics', 8, false, now(), now()),
  (gen_random_uuid(), 'Reveal SQLs', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 9, false, now(), now()),
  (gen_random_uuid(), 'Explore SQLs', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 10, false, now(), now()),
  (gen_random_uuid(), 'Pulse SQLs', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 11, false, now(), now()),
  (gen_random_uuid(), 'CRO Benchmark New Users', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Redash', 12, false, now(), now()),
  (gen_random_uuid(), 'Explore Demos Held (SQLs only)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 13, false, now(), now()),
  (gen_random_uuid(), 'Total MQLs', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 14, false, now(), now()),
  (gen_random_uuid(), 'Total Inbound SQLs', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 15, false, now(), now()),
  (gen_random_uuid(), 'Conversion Rate (SQLs/Pricing+Demo)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Calculated', 16, true, now(), now()),
  (gen_random_uuid(), 'New Clients (via marketing)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 17, false, now(), now()),
  (gen_random_uuid(), 'New Revenue (via marketing)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 18, false, now(), now()),
  (gen_random_uuid(), 'Close Rate (Clients/SQL)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Calculated', 19, true, now(), now()),
  (gen_random_uuid(), 'Reveal Installs', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Partners Shopify', 20, false, now(), now()),
  (gen_random_uuid(), 'Explore Installs', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Intercom', 21, false, now(), now()),
  (gen_random_uuid(), 'Reveal Demos Booked (SQLs only)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 22, false, now(), now()),
  (gen_random_uuid(), 'Explore Demos Booked (SQLs only)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 23, false, now(), now()),
  (gen_random_uuid(), 'Reveal Demos Held (SQLs only)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Hubspot', 24, false, now(), now()),
  (gen_random_uuid(), 'Students', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Thinkific + Udemy', 25, false, now(), now()),
  (gen_random_uuid(), 'Revenue per Customer', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Calculated', 26, true, now(), now()),
  (gen_random_uuid(), 'Budget Mkt Spent - Total', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Craft', 27, false, now(), now()),
  (gen_random_uuid(), 'CPL (SQL)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Calculated', 28, true, now(), now()),
  (gen_random_uuid(), 'Customer Acquisition Cost (CAC)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Calculated', 29, true, now(), now()),
  (gen_random_uuid(), 'Share of Voice (vs Competitors)', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Brand24', 30, false, now(), now()),
  (gen_random_uuid(), 'Total Impressions', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Search Console', 31, false, now(), now()),
  (gen_random_uuid(), 'Total Google Clicks', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Search Console', 32, false, now(), now()),
  (gen_random_uuid(), 'Branded Impressions', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Search Console', 33, false, now(), now()),
  (gen_random_uuid(), 'Branded Clicks', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Google Search Console', 34, false, now(), now()),
  (gen_random_uuid(), 'ROI', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Calculated', 35, true, now(), now()),
  (gen_random_uuid(), 'Rolling Average ROI', 'dff411eb-ae53-4724-8456-5db4fff10441', '11111111-1111-1111-1111-111111111111', 'Calculated', 36, true, now(), now());