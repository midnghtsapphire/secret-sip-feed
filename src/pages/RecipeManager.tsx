
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRecipes } from '@/hooks/useRecipes';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import RecipeForm from '@/components/RecipeForm';
import RecipePrivacyToggle from '@/components/RecipePrivacyToggle';
import Header from '@/components/Header';
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

    // Verify user owns the recipe being edited
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

    // Verify user owns the recipe or is admin
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

    // Verify user owns the recipe
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

  // Filter recipes to show only user's own recipes (unless admin)
  const visibleRecipes = recipes?.filter(recipe => 
    isAdmin || recipe.user_id === user.id
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Recipe Manager</h1>
            <p className="text-gray-600 mt-2">Create and manage your secret Starbucks recipes</p>
          </div>
          <Button
            onClick={() => setShowRecipeForm(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600"
          >
            <Plus size={20} className="mr-2" />
            Add Recipe
          </Button>
        </div>

        {/* Recipes Section */}
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
            <div className="grid gap-4">
              {visibleRecipes.map((recipe) => (
                <Card key={recipe.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{recipe.name}</h3>
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                          {recipe.category}
                        </span>
                        {isAdmin && (
                          <RecipePrivacyToggle
                            recipeId={recipe.id}
                            isPublic={recipe.is_public}
                            onToggle={(isPublic) => updateRecipe.mutate({ id: recipe.id, is_public: isPublic })}
                          />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{recipe.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>${recipe.base_price}</span>
                        <span>{recipe.prep_time_minutes} min</span>
                        <span>Difficulty: {recipe.difficulty_level}/5</span>
                        {recipe.tags && recipe.tags.length > 0 && (
                          <div className="flex gap-1">
                            {recipe.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="bg-gray-100 px-2 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRecipe(recipe)}
                      >
                        Edit
                      </Button>
                      {(recipe.user_id === user.id || isAdmin) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRecipe(recipe.id, recipe.user_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No recipes yet</h3>
              <p className="text-gray-600 mb-4">Create your first recipe to get started!</p>
              <Button
                onClick={() => setShowRecipeForm(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600"
              >
                <Plus size={16} className="mr-2" />
                Create Recipe
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeManager;
