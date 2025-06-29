import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];

export const useRecipes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching recipes:', error);
        throw error;
      }
      
      console.log('Fetched recipes with images:', data.map(r => ({ 
        id: r.id, 
        name: r.name, 
        images: r.images, 
        image_url: r.image_url 
      })));
      
      return data as Recipe[];
    },
  });

  const createRecipe = useMutation({
    mutationFn: async (recipe: Omit<RecipeInsert, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      console.log('Creating recipe with data:', recipe);

      const { data, error } = await supabase
        .from('recipes')
        .insert({ ...recipe, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({
        title: "Recipe created!",
        description: "Your recipe has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating recipe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRecipe = useMutation({
    mutationFn: async ({ id, ...updates }: RecipeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({
        title: "Recipe updated!",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating recipe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast({
        title: "Recipe deleted",
        description: "The recipe has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting recipe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    recipes,
    isLoading,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  };
};
