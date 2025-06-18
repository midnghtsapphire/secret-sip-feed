
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useRecipes } from '@/hooks/useRecipes';
import { useMenuItems } from '@/hooks/useMenuItems';
import RecipeForm from '@/components/RecipeForm';
import MenuItemForm from '@/components/MenuItemForm';
import RecipePrivacyToggle from '@/components/RecipePrivacyToggle';
import Header from '@/components/Header';

const RecipeManager: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { recipes, isLoading, createRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { createMenuItem, groupedMenuItems } = useMenuItems();
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showMenuItemForm, setShowMenuItemForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign in required</h2>
            <p className="text-gray-600">Please sign in to access the recipe manager.</p>
          </div>
        </div>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin access required</h2>
            <p className="text-gray-600">Only administrators can manage recipes and menu items.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateRecipe = (data: any) => {
    createRecipe.mutate(data, {
      onSuccess: () => setShowRecipeForm(false)
    });
  };

  const handleUpdateRecipe = (data: any) => {
    updateRecipe.mutate({ id: editingRecipe.id, ...data }, {
      onSuccess: () => setEditingRecipe(null)
    });
  };

  const handleDeleteRecipe = (id: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      deleteRecipe.mutate(id);
    }
  };

  const handlePrivacyToggle = (recipeId: string, isPublic: boolean) => {
    updateRecipe.mutate({ id: recipeId, is_public: isPublic });
  };

  const handleCreateMenuItem = (data: any) => {
    createMenuItem.mutate(data, {
      onSuccess: () => setShowMenuItemForm(false)
    });
  };

  if (showRecipeForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
        <RecipeForm 
          onSubmit={handleCreateRecipe}
          onCancel={() => setShowRecipeForm(false)}
        />
      </div>
    );
  }

  if (editingRecipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
        <RecipeForm 
          onSubmit={handleUpdateRecipe}
          onCancel={() => setEditingRecipe(null)}
          initialData={editingRecipe}
        />
      </div>
    );
  }

  if (showMenuItemForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
        <MenuItemForm 
          onSubmit={handleCreateMenuItem}
          onCancel={() => setShowMenuItemForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Recipe Manager</h1>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <Button 
              onClick={() => setShowRecipeForm(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600"
            >
              <Plus size={20} className="mr-2" />
              New Recipe
            </Button>
            
            <Button 
              onClick={() => setShowMenuItemForm(true)}
              variant="outline"
              className="border-pink-300 text-pink-600 hover:bg-pink-50"
            >
              <Settings size={20} className="mr-2" />
              Add Menu Item
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Recipes */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Recipes</h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
              </div>
            ) : recipes && recipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="bg-white rounded-lg shadow-md p-4">
                    {recipe.image_url && (
                      <img 
                        src={recipe.image_url} 
                        alt={recipe.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    <h3 className="font-bold text-gray-800 mb-2">{recipe.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{recipe.description}</p>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                        {recipe.category}
                      </span>
                      
                      <RecipePrivacyToggle
                        isPublic={recipe.is_public || false}
                        onToggle={(isPublic) => handlePrivacyToggle(recipe.id, isPublic)}
                        recipeId={recipe.id}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        ${recipe.base_price?.toFixed(2) || '0.00'}
                      </span>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingRecipe(recipe)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No recipes yet. Create your first recipe!</p>
                <Button 
                  onClick={() => setShowRecipeForm(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600"
                >
                  <Plus size={20} className="mr-2" />
                  Create Recipe
                </Button>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Menu Items</h2>
            
            {groupedMenuItems && Object.entries(groupedMenuItems).map(([type, items]) => (
              <div key={type} className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2 capitalize">
                  {type.replace('_', ' ')}s
                </h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          ${item.price?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecipeManager;
