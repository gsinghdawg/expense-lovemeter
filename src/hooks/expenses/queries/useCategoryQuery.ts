
import { ExpenseCategory } from "@/types/expense";
import { defaultCategories } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { areAllDefaultCategoriesPresent, initializeDefaultCategories } from "../utils/categoryUtils";

export function useCategoryQuery(userId: string | undefined) {
  // Fetch categories from Supabase
  return useQuery({
    queryKey: ['categories', userId],
    queryFn: async () => {
      if (!userId) return defaultCategories; // Return defaults if no user
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error loading categories",
          description: error.message,
          variant: "destructive",
        });
        return defaultCategories; // Return defaults on error
      }

      // Check if we have all default categories
      if (data.length === 0 || !areAllDefaultCategoriesPresent(data)) {
        console.log("Initializing or ensuring all default categories are present");
        await initializeDefaultCategories(userId);
        
        // Fetch again to get the updated list
        const { data: refreshedData, error: refreshError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId);
          
        if (refreshError) {
          console.error("Error refreshing categories:", refreshError);
          return defaultCategories;
        }
        
        return refreshedData.map(category => ({
          id: category.id,
          name: category.name,
          color: category.color,
        }));
      }
      
      return data.map(category => ({
        id: category.id,
        name: category.name,
        color: category.color,
      }));
    },
    enabled: true, // Always enable to ensure defaults are available
  });
}
