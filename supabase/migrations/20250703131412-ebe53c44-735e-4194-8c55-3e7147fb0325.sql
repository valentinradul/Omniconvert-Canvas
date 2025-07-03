-- Add department_id column to categories table to link categories with departments
ALTER TABLE public.categories 
ADD COLUMN department_id TEXT;

-- Add index for better performance when filtering by department
CREATE INDEX idx_categories_department_id ON public.categories(department_id);

-- Add index for better performance when filtering by company and department
CREATE INDEX idx_categories_company_department ON public.categories(company_id, department_id);