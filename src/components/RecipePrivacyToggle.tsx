
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const { toast } = useToast();

  const handleToggle = (checked: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to change recipe privacy",
        variant: "destructive",
      });
      return;
    }

    if (!isAdmin) {
      toast({
        title: "Admin access required",
        description: "Only administrators can change recipe privacy settings",
        variant: "destructive",
      });
      return;
    }

    onToggle(checked);
  };

  // Only show toggle for admins
  if (loading || !user || !isAdmin) {
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${
        isPublic ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
      }`}>
        {isPublic ? 'Public' : 'Private'}
      </span>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-xs">
      <span className={isPublic ? 'text-green-600' : 'text-red-600'}>
        {isPublic ? 'Public' : 'Private'}
      </span>
      <Switch
        checked={isPublic}
        onCheckedChange={handleToggle}
        className="scale-75"
        aria-label={`Toggle recipe privacy - currently ${isPublic ? 'public' : 'private'}`}
      />
    </div>
  );
};

export default RecipePrivacyToggle;
