
import React, { useState } from 'react';
import { useRecipes } from '@/hooks/useRecipes';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import RecipeForm from '@/components/RecipeForm';
import Header from '@/components/Header';
import RecipeManagerHeader from '@/components/recipe-manager/RecipeManagerHeader';
import RecipeList from '@/components/recipe-manager/RecipeList';
import EmptyRecipeState from '@/components/recipe-manager/EmptyRecipeState';
import { useToast } from '@/hooks/use-toast';

const RecipeManager = () => {
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { recipes, isLoading, createRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { toast } = useToast();

  const handleCreateRecipe = async (recipeData) => {
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

  const handleUpdateRecipe = async (recipeData) => {
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

  const handleDeleteRecipe = async (id, recipeUserId) => {
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

  const handleEditRecipe = (recipe) => {
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

  const handleTogglePrivacy = (id, isPublic) => {
    updateRecipe.mutate({ id, is_public: isPublic });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign In Required</h1>
            <p className="text-gray-600">Please sign in to manage your recipes.</p>
          </div>
        </div>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showRecipeForm || editingRecipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <RecipeForm
            onSubmit={editingRecipe ? handleUpdateRecipe : handleCreateRecipe}
            onCancel={() => {
              setShowRecipeForm(false);
              setEditingRecipe(null);
            }}
            initialData={editingRecipe}
          />
        </div>
      </div>
    );
  }

  const visibleRecipes = recipes?.filter(recipe => 
    isAdmin || recipe.user_id === user.id
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <RecipeManagerHeader onAddRecipe={() => setShowRecipeForm(true)} />

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {isAdmin ? 'All Recipes' : 'Your Recipes'}
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading recipes...</p>
            </div>
          ) : visibleRecipes.length > 0 ? (
            <RecipeList
              recipes={visibleRecipes}
              isAdmin={isAdmin}
              currentUserId={user.id}
              onEditRecipe={handleEditRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              onTogglePrivacy={handleTogglePrivacy}
            />
          ) : (
            <EmptyRecipeState onCreateRecipe={() => setShowRecipeForm(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeManager;
