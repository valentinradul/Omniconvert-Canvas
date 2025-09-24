-- Add cost and revenue fields to experiments table
ALTER TABLE experiments 
ADD COLUMN total_cost DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN total_revenue DECIMAL(10,2) DEFAULT NULL;