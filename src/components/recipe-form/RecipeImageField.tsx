
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import ImageUpload from './ImageUpload';
import { UseFormReturn } from 'react-hook-form';

interface RecipeImageFieldProps {
  form: UseFormReturn<any>;
}

const RecipeImageField: React.FC<RecipeImageFieldProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="images"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Recipe Images</FormLabel>
          <FormControl>
            <ImageUpload
              images={field.value || []}
              onImagesChange={field.onChange}
              maxImages={5}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default RecipeImageField;
