
import React from 'react';
import Header from '@/components/Header';
import RecipeForm from '@/components/RecipeForm';
import RecipeManagerContent from '@/components/recipe-manager/RecipeManagerContent';
import LoadingState from '@/components/recipe-manager/LoadingState';
import AuthRequiredState from '@/components/recipe-manager/AuthRequiredState';
import { useRecipeManager } from '@/hooks/useRecipeManager';

const RecipeManager = () => {
  const {
    showRecipeForm,
    setShowRecipeForm,
    editingRecipe,
    setEditingRecipe,
    user,
    isAdmin,
    adminLoading,
    isLoading,
    handleCreateRecipe,
    handleUpdateRecipe,
    handleDeleteRecipe,
    handleEditRecipe,
    handleTogglePrivacy,
    getVisibleRecipes,
  } = useRecipeManager();

  if (!user) {
    return <AuthRequiredState />;
  }

  if (adminLoading) {
    return <LoadingState />;
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

  const visibleRecipes = getVisibleRecipes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Header />
      
      <RecipeManagerContent
        isAdmin={isAdmin}
        currentUserId={user.id}
        isLoading={isLoading}
        recipes={visibleRecipes}
        onAddRecipe={() => setShowRecipeForm(true)}
        onEditRecipe={handleEditRecipe}
        onDeleteRecipe={handleDeleteRecipe}
        onTogglePrivacy={handleTogglePrivacy}
      />
    </div>
  );
};

export default RecipeManager;
