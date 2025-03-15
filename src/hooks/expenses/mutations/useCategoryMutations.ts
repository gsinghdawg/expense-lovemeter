
import { ExpenseCategory } from "@/types/expense";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCategoryMutations(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: Omit<ExpenseCategory, "id">) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          color: category.color,
          icon: 'default',
          user_id: userId,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        color: data.color,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding category",
        description: error.message || "Failed to add category",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: ExpenseCategory) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          color: category.color,
        })
        .eq('id', category.id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating category",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string): Promise<string> => {
      if (!userId) throw new Error("User not authenticated");
      
      // Check if the category is being used by any expenses
      const { data: expensesUsingCategory, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('category_id', id)
        .eq('user_id', userId);
      
      if (checkError) throw checkError;
      
      if (expensesUsingCategory && expensesUsingCategory.length > 0) {
        throw new Error("Category is in use by some expenses");
      }
      
      // Delete the category if it's not being used
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return id;
    },
    onSuccess: (deletedId) => {
      // Update the cache by removing the deleted category
      queryClient.setQueryData(['categories', userId], (oldData: ExpenseCategory[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(category => category.id !== deletedId);
      });
      
      // Then invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
      
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error in deleteCategoryMutation:", error);
      toast({
        title: "Error deleting category",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  return {
    addCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation
  };
}
