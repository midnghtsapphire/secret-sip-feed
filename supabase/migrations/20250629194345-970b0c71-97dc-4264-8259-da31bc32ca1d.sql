
-- Add images column to recipes table to support multiple images
ALTER TABLE public.recipes 
ADD COLUMN images text[] DEFAULT '{}';

-- Update existing recipes to populate images array from image_url
UPDATE public.recipes 
SET images = CASE 
  WHEN image_url IS NOT NULL AND image_url != '' THEN ARRAY[image_url]
  ELSE '{}'::text[]
END;
