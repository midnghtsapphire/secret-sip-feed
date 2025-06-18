
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Favorite {
  id: string;
  drink_id: string;
  drink_name: string;
  drink_image_url: string | null;
  drink_category: string | null;
  created_at: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (drink: {
    id: string;
    name: string;
    imageUrl?: string;
    category?: string;
  }) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          drink_id: drink.id,
          drink_name: drink.name,
          drink_image_url: drink.imageUrl,
          drink_category: drink.category,
        });

      if (error) throw error;

      toast({
        title: "Added to favorites!",
        description: `${drink.name} has been saved to your favorites.`,
      });

      fetchFavorites();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add to favorites",
        variant: "destructive",
      });
    }
  };

  const removeFavorite = async (drinkId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('drink_id', drinkId);

      if (error) throw error;

      toast({
        title: "Removed from favorites",
        description: "Drink has been removed from your favorites.",
      });

      fetchFavorites();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  };

  const isFavorite = (drinkId: string) => {
    return favorites.some(fav => fav.drink_id === drinkId);
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
};
