
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
  return (
    <>
      <BasicRecipeFields form={form} categories={categories} />
      
      <RecipeImageField form={form} />

      {isAdmin && (
        <AdminRecipeFields form={form} />
      )}

      <PublicToggleField form={form} />
    </>
  );
};

export default RecipeFormFields;
