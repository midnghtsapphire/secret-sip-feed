
-- Create a table for storing user favorites
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  drink_id TEXT NOT NULL,
  drink_name TEXT NOT NULL,
  drink_image_url TEXT,
  drink_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for favorites table
CREATE POLICY "Users can view their own favorites" 
  ON public.favorites 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" 
  ON public.favorites 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
  ON public.favorites 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_drink_id ON public.favorites(user_id, drink_id);
