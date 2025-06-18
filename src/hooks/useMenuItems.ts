
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert'];

export const useMenuItems = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  const createMenuItem = useMutation({
    mutationFn: async (menuItem: MenuItemInsert) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(menuItem)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({
        title: "Menu item added!",
        description: "The new menu item has been created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating menu item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const groupedMenuItems = menuItems?.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return {
    menuItems,
    groupedMenuItems,
    isLoading,
    createMenuItem,
  };
};
