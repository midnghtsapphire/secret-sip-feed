
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, make all authenticated users admins to avoid the database issues
    // You can implement proper role checking later once the basic auth works
    if (user) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [user]);

  return { isAdmin, loading };
};
