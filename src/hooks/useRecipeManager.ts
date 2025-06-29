
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useRecipes } from '@/hooks/useRecipes';
import { useToast } from '@/hooks/use-toast';

export const useRecipeManager = () => {
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { recipes, isLoading, createRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { toast } = useToast();

  const handleCreateRecipe = async (recipeData: any) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create recipes",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRecipe.mutateAsync(recipeData);
      setShowRecipeForm(false);
    } catch (error) {
      console.error('Failed to create recipe:', error);
      toast({
        title: "Error creating recipe",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRecipe = async (recipeData: any) => {
    if (!user || !editingRecipe) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update recipes",
        variant: "destructive",
      });
      return;
    }

    if (editingRecipe.user_id !== user.id && !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "You can only edit your own recipes",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateRecipe.mutateAsync({ id: editingRecipe.id, ...recipeData });
      setEditingRecipe(null);
    } catch (error) {
      console.error('Failed to update recipe:', error);
      toast({
        title: "Error updating recipe",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecipe = async (id: string, recipeUserId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete recipes",
        variant: "destructive",
      });
      return;
    }

    if (recipeUserId !== user.id && !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "You can only delete your own recipes",
        variant: "destructive",
      });
      return;
    }

    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipe.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete recipe:', error);
        toast({
          title: "Error deleting recipe",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditRecipe = (recipe: any) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to edit recipes",
        variant: "destructive",
      });
      return;
    }

    if (recipe.user_id !== user.id && !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "You can only edit your own recipes",
        variant: "destructive",
      });
      return;
    }

    setEditingRecipe(recipe);
  };

  const handleTogglePrivacy = (id: string, isPublic: boolean) => {
    updateRecipe.mutate({ id, is_public: isPublic });
  };

  const getVisibleRecipes = () => {
    return recipes?.filter(recipe => 
      isAdmin || recipe.user_id === user?.id
    ) || [];
  };

  return {
    showRecipeForm,
    setShowRecipeForm,
    editingRecipe,
    setEditingRecipe,
    user,
    isAdmin,
    adminLoading,
    recipes,
    isLoading,
    handleCreateRecipe,
    handleUpdateRecipe,
    handleDeleteRecipe,
    handleEditRecipe,
    handleTogglePrivacy,
    getVisibleRecipes,
  };
};
