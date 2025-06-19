
-- Phase 1: Critical RLS Policy Implementation (Updated to handle existing policies)

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Users can view public recipes or their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Anyone can view public recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can view their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can create their own recipes" ON public.recipes;

-- Create comprehensive RLS policies for the recipes table
CREATE POLICY "Users can view public recipes or their own recipes" 
  ON public.recipes 
  FOR SELECT 
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes" 
  ON public.recipes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" 
  ON public.recipes 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" 
  ON public.recipes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on recipes table if not already enabled
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing favorites policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can update their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

-- Secure favorites table with proper RLS policies
CREATE POLICY "Users can view their own favorites" 
  ON public.favorites 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
  ON public.favorites 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites" 
  ON public.favorites 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
  ON public.favorites 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on favorites table
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing recipe_ingredients policies if they exist
DROP POLICY IF EXISTS "Users can view ingredients for accessible recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can insert ingredients for their own recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can update ingredients for their own recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can delete ingredients for their own recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Anyone can view ingredients for public recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can view ingredients for their own recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can manage ingredients for their own recipes" ON public.recipe_ingredients;

-- Secure recipe_ingredients table - users can only access ingredients for recipes they own or public recipes
CREATE POLICY "Users can view ingredients for accessible recipes" 
  ON public.recipe_ingredients 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND (recipes.is_public = true OR recipes.user_id = auth.uid())
    )
  );

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

CREATE POLICY "Users can update ingredients for their own recipes" 
  ON public.recipe_ingredients 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients for their own recipes" 
  ON public.recipe_ingredients 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- Enable RLS on recipe_ingredients table
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Drop existing menu_items policies if they exist
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated users can manage menu items" ON public.menu_items;

-- Secure menu_items table - make it publicly readable for all users
CREATE POLICY "Anyone can view menu items" 
  ON public.menu_items 
  FOR SELECT 
  USING (true);

-- Only authenticated users can modify menu items (admin functionality)
CREATE POLICY "Authenticated users can manage menu items" 
  ON public.menu_items 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable RLS on menu_items table
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create a user roles system for proper authorization (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'user');
    END IF;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing user_roles policies if they exist
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Users can view their own role
CREATE POLICY "Users can view their own role" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create a security definer function to check user roles safely
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid;
$$;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Trigger to create default user role when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
