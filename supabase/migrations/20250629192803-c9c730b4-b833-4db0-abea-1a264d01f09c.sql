
-- First, let's check if the recipes table exists and what columns it has
-- Then create the category column and enum properly

DO $$
BEGIN
    -- Create the enum first
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recipe_category') THEN
        CREATE TYPE recipe_category AS ENUM (
            'Pretty n Pink',
            'Mad Matchas', 
            'Blues Clues',
            'Foam Frenzy',
            'Mocha Magic',
            'Budget Babe Brews'
        );
    END IF;
    
    -- Add the category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'recipes' AND column_name = 'category') THEN
        ALTER TABLE recipes ADD COLUMN category recipe_category NOT NULL DEFAULT 'Pretty n Pink'::recipe_category;
    END IF;
END $$;
