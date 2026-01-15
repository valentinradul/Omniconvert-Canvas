-- First, delete existing metrics for the marketing performance category to start fresh
-- We'll recreate them with the exact structure from the Excel file

-- Get the marketing-performance category ID for the Omniconvert company
DO $$
DECLARE
  omni_company_id UUID := 'dff411eb-ae53-4724-8456-5db4fff10441';
  marketing_cat_id UUID;
BEGIN
  -- Find or create the marketing-performance category
  SELECT id INTO marketing_cat_id 
  FROM reporting_categories 
  WHERE company_id = omni_company_id 
  AND slug = 'marketing-performance'
  LIMIT 1;

  -- If category doesn't exist, create it
  IF marketing_cat_id IS NULL THEN
    INSERT INTO reporting_categories (company_id, name, slug, parent_id, sort_order)
    VALUES (omni_company_id, 'Marketing Performance', 'marketing-performance', NULL, 0)
    RETURNING id INTO marketing_cat_id;
  END IF;

  -- Delete existing metrics for this category
  DELETE FROM reporting_metric_values 
  WHERE metric_id IN (
    SELECT id FROM reporting_metrics 
    WHERE company_id = omni_company_id 
    AND category_id = marketing_cat_id
  );
  
  DELETE FROM reporting_metrics 
  WHERE company_id = omni_company_id 
  AND category_id = marketing_cat_id;

  -- Insert all metrics from the Excel file in exact order
  INSERT INTO reporting_metrics (company_id, category_id, name, source, sort_order, is_calculated, created_at, updated_at)
  VALUES
    -- Website Traffic & Engagement
    (omni_company_id, marketing_cat_id, 'Total Traffic (Users)', 'Google Analytics', 1, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Pricing (users)', 'Google Analytics', 2, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Book-a-demo', 'Google Analytics', 3, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Book-a-call', 'Google Analytics', 4, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Pricing + Book a demo (Users)', 'Google Analytics', 5, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Pricing Explore', 'Google Analytics', 6, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Pricing Reveal', 'Google Analytics', 7, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Pricing Pulse', 'Google Analytics', 8, false, now(), now()),
    
    -- Lead Generation
    (omni_company_id, marketing_cat_id, 'Reveal SQLs', 'Hubspot', 9, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Explore SQLs', 'Hubspot', 10, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'CRO Benchmark new users', 'Redash', 11, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Explore Demos held (SQLs only)', 'Hubspot', 12, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Total MQLs', 'Hubspot', 13, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Total inbound SQLs (sales reporting)', 'Hubspot', 14, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Conversion rate (SQLs / Pricing + Book-a-demo)', 'Calculated', 15, true, now(), now()),
    
    -- Revenue & Clients
    (omni_company_id, marketing_cat_id, 'New Clients (via marketing efforts)', 'Hubspot', 16, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'New Revenue (via marketing efforts)', 'Hubspot', 17, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Close Rate (Clients/SQL)', 'Calculated', 18, true, now(), now()),
    
    -- Product Installs
    (omni_company_id, marketing_cat_id, 'Reveal Installs', 'Partners Shopify', 19, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Explore Installs', 'Intercom', 20, false, now(), now()),
    
    -- Demo Metrics
    (omni_company_id, marketing_cat_id, 'Reveal Demos booked (SQLs only)', 'Hubspot', 21, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Explore Demos booked (SQLs only)', 'Hubspot', 22, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Reveal Demos held (SQLs only)', 'Hubspot', 23, false, now(), now()),
    
    -- Education
    (omni_company_id, marketing_cat_id, 'Students', 'Thinkific + Udemy', 24, false, now(), now()),
    
    -- Financial Metrics
    (omni_company_id, marketing_cat_id, 'RpC (Revenue per Customer)', 'Calculated', 25, true, now(), now()),
    (omni_company_id, marketing_cat_id, 'Budget Mkt Spent - total', 'Craft', 26, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'CPL (SQL)', 'Calculated', 27, true, now(), now()),
    (omni_company_id, marketing_cat_id, 'Customer Acquisition Cost (CAC)', 'Calculated', 28, true, now(), now()),
    
    -- Search & SEO
    (omni_company_id, marketing_cat_id, 'Total impressions', 'Google Search Console', 29, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Total Google Clicks', 'Google Search Console', 30, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Branded Impressions', 'Google Search Console', 31, false, now(), now()),
    (omni_company_id, marketing_cat_id, 'Branded clicks', 'Google Search Console', 32, false, now(), now()),
    
    -- Performance
    (omni_company_id, marketing_cat_id, 'ROI', 'Calculated', 33, true, now(), now()),
    (omni_company_id, marketing_cat_id, 'Rolling average ROI', 'Calculated', 34, true, now(), now());
    
END $$;