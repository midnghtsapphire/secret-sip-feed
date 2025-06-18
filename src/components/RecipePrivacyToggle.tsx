
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useAdmin } from '@/hooks/useAdmin';

interface RecipePrivacyToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  recipeId: string;
}

const RecipePrivacyToggle: React.FC<RecipePrivacyToggleProps> = ({ 
  isPublic, 
  onToggle, 
  recipeId 
}) => {
  const { isAdmin } = useAdmin();

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-xs">
      <span className={isPublic ? 'text-green-600' : 'text-red-600'}>
        {isPublic ? 'Public' : 'Private'}
      </span>
      <Switch
        checked={isPublic}
        onCheckedChange={onToggle}
        className="scale-75"
      />
    </div>
  );
};

export default RecipePrivacyToggle;
