
import React from 'react';
import BasicRecipeFields from './BasicRecipeFields';
import AdminRecipeFields from './AdminRecipeFields';
import RecipeImageField from './RecipeImageField';
import PublicToggleField from './PublicToggleField';
import { UseFormReturn } from 'react-hook-form';

interface RecipeFormFieldsProps {
  form: UseFormReturn<any>;
  categories: string[];
  isAdmin: boolean;
}

const RecipeFormFields: React.FC<RecipeFormFieldsProps> = ({ form, categories, isAdmin }) => {
  // Provide default categories if none are passed
  const validCategories = categories.length > 0 ? categories : [
    'Pink Drinks',
    'Blue Drinks', 
    'Green Teas',
    'Foam Experts',
    'Budget Babe Brews',
    'Viral Today',
    'Caramel Dreams',
    'Merry Mocha',
    'Expresso'
  ];

  return (
    <>
      <BasicRecipeFields form={form} categories={validCategories} />
      
      <RecipeImageField form={form} />

      {isAdmin && (
        <AdminRecipeFields form={form} />
      )}

      <PublicToggleField form={form} />
    </>
  );
};

export default RecipeFormFields;
