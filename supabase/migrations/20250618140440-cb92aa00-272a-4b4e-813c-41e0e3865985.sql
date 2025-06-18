
-- Check if other policies exist and create only missing ones

-- Create policy to allow users to create their own recipes (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' 
        AND policyname = 'Users can create their own recipes'
    ) THEN
        CREATE POLICY "Users can create their own recipes" 
          ON public.recipes 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Create policy to allow users to update their own recipes (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' 
        AND policyname = 'Users can update their own recipes'
    ) THEN
        CREATE POLICY "Users can update their own recipes" 
          ON public.recipes 
          FOR UPDATE 
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create policy to allow users to delete their own recipes (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' 
        AND policyname = 'Users can delete their own recipes'
    ) THEN
        CREATE POLICY "Users can delete their own recipes" 
          ON public.recipes 
          FOR DELETE 
          USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create policy to allow viewing public recipes (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'recipes' 
        AND policyname = 'Anyone can view public recipes'
    ) THEN
        CREATE POLICY "Anyone can view public recipes" 
          ON public.recipes 
          FOR SELECT 
          USING (is_public = true);
    END IF;
END $$;
