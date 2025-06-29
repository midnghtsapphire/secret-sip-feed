
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { UseFormReturn } from 'react-hook-form';

interface PublicToggleFieldProps {
  form: UseFormReturn<any>;
}

const PublicToggleField: React.FC<PublicToggleFieldProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="is_public"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Public Recipe</FormLabel>
            <div className="text-sm text-muted-foreground">
              Make this recipe visible to all users
            </div>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default PublicToggleField;
