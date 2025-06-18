
-- Create enum for recipe categories
CREATE TYPE recipe_category AS ENUM (
  'Pink Drinks',
  'Blue Drinks', 
  'Green Teas',
  'Foam Experts',
  'Budget Babe Brews',
  'Viral Today'
);

-- Create enum for menu item types
CREATE TYPE menu_item_type AS ENUM (
  'syrup',
  'milk',
  'base',
  'topping',
  'add_on'
);

-- Create table for menu items (syrups, milks, add-ons, etc.)
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type menu_item_type NOT NULL,
  price DECIMAL(5,2) DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for recipes
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category recipe_category NOT NULL,
  image_url TEXT,
  base_price DECIMAL(5,2) DEFAULT 0.00,
  instructions TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  prep_time_minutes INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  saves_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for recipe ingredients (linking recipes to menu items)
CREATE TABLE public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE NOT NULL,
  quantity TEXT, -- e.g., "2 pumps", "1 shot", "splash"
  is_optional BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS policies for menu_items (readable by everyone, only admins can modify)
CREATE POLICY "Anyone can view menu items" ON public.menu_items
  FOR SELECT USING (true);

-- RLS policies for recipes
CREATE POLICY "Anyone can view public recipes" ON public.recipes
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own recipes" ON public.recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for recipe_ingredients
CREATE POLICY "Anyone can view ingredients for public recipes" ON public.recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.is_public = true
    )
  );

CREATE POLICY "Users can view ingredients for their own recipes" ON public.recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage ingredients for their own recipes" ON public.recipe_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- Insert some default menu items
INSERT INTO public.menu_items (name, type, price, description) VALUES
-- Syrups
('Vanilla Syrup', 'syrup', 0.65, 'Classic vanilla flavoring'),
('Caramel Syrup', 'syrup', 0.65, 'Rich caramel sweetness'),
('Hazelnut Syrup', 'syrup', 0.65, 'Nutty hazelnut flavor'),
('Brown Sugar Syrup', 'syrup', 0.75, 'Brown sugar sweetness'),
('Toffee Nut Syrup', 'syrup', 0.65, 'Buttery toffee and nut'),
('Cinnamon Dolce Syrup', 'syrup', 0.65, 'Sweet cinnamon spice'),
('Peppermint Syrup', 'syrup', 0.65, 'Cool peppermint flavor'),
('Raspberry Syrup', 'syrup', 0.65, 'Fruity raspberry burst'),
-- Milks
('Whole Milk', 'milk', 0.00, 'Standard dairy milk'),
('2% Milk', 'milk', 0.00, 'Reduced fat milk'),
('Nonfat Milk', 'milk', 0.00, 'Fat-free dairy milk'),
('Oat Milk', 'milk', 0.65, 'Creamy plant-based oat milk'),
('Almond Milk', 'milk', 0.65, 'Light plant-based almond milk'),
('Coconut Milk', 'milk', 0.65, 'Rich coconut milk'),
('Soy Milk', 'milk', 0.65, 'Classic plant-based soy milk'),
-- Bases
('Espresso', 'base', 0.00, 'Double shot of espresso'),
('Cold Brew', 'base', 0.00, 'Smooth cold brew coffee'),
('Decaf Espresso', 'base', 0.00, 'Caffeine-free espresso'),
('Green Tea', 'base', 0.00, 'Matcha green tea base'),
('Black Tea', 'base', 0.00, 'Classic black tea'),
('White Tea', 'base', 0.00, 'Delicate white tea'),
-- Toppings
('Whipped Cream', 'topping', 0.50, 'Light and fluffy whipped cream'),
('Cold Foam', 'topping', 0.50, 'Creamy cold milk foam'),
('Vanilla Sweet Cream Cold Foam', 'topping', 0.65, 'Sweetened vanilla cold foam'),
('Caramel Drizzle', 'topping', 0.50, 'Rich caramel sauce drizzle'),
('Chocolate Drizzle', 'topping', 0.50, 'Decadent chocolate sauce'),
-- Add-ons
('Extra Shot', 'add_on', 0.75, 'Additional espresso shot'),
('Decaf Shot', 'add_on', 0.75, 'Caffeine-free espresso shot'),
('Extra Hot', 'add_on', 0.00, 'Served extra hot'),
('Extra Ice', 'add_on', 0.00, 'Extra ice cubes'),
('Light Ice', 'add_on', 0.00, 'Less ice'),
('No Ice', 'add_on', 0.00, 'No ice added');
