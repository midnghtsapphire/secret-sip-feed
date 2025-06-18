
import React from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const FloatingAddButton: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add new recipes",
        variant: "destructive",
      });
      return;
    }
    
    // Future: Open add recipe modal
    toast({
      title: "Coming soon!",
      description: "Recipe creation feature is being developed.",
    });
  };

  return (
    <button 
      onClick={handleClick}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 animate-float z-50"
    >
      <Plus size={24} className="font-bold" />
    </button>
  );
};

export default FloatingAddButton;
