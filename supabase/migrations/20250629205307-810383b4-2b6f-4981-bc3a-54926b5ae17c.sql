
-- Phase 1: Critical RLS Policy and Schema Fixes

-- 1. Make recipes.user_id NOT NULL (with safe migration for existing data)
-- First, update any existing recipes that might have NULL user_id (shouldn't happen with current RLS, but being safe)
UPDATE public.recipes 
SET user_id = auth.uid() 
WHERE user_id IS NULL;

-- Then make the column NOT NULL
ALTER TABLE public.recipes 
ALTER COLUMN user_id SET NOT NULL;

-- 2. Drop and recreate favorites policies with proper WITH CHECK clauses
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can update their own favorites" ON public.favorites;

CREATE POLICY "Users can insert their own favorites" 
  ON public.favorites 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites" 
  ON public.favorites 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Fix recipe_ingredients INSERT policy to include proper authorization
DROP POLICY IF EXISTS "Users can insert ingredients for their own recipes" ON public.recipe_ingredients;

CREATE POLICY "Users can insert ingredients for their own recipes" 
  ON public.recipe_ingredients 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- 4. Add audit logging table for admin operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs - only admins can view
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  USING (public.is_admin(auth.uid()));

-- 5. Create audit trigger function for recipes table
CREATE OR REPLACE FUNCTION public.audit_recipe_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to recipes table
CREATE TRIGGER audit_recipes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.audit_recipe_changes();
