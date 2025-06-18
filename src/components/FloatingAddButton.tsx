
import React from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const FloatingAddButton: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
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
    
    if (!isAdmin) {
      toast({
        title: "Admin access required",
        description: "Only administrators can add new recipes",
        variant: "destructive",
      });
      return;
    }
  };

  // Don't show the button if loading or if user is not an admin
  if (loading || !user || !isAdmin) {
    return null;
  }

  return (
    <Link 
      to="/recipes"
      className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 animate-float z-50"
    >
      <Plus size={24} className="font-bold" />
    </Link>
  );
};

export default FloatingAddButton;
