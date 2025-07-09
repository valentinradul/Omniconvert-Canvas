
-- Add super admin policies for experiments table
CREATE POLICY "Super admins can manage all experiments" 
  ON public.experiments 
  FOR ALL 
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));
