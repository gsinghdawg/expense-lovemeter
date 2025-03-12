
import { useState } from "react";
import { ExpenseCategory } from "@/types/expense";
import { defaultCategories } from "@/data/categories";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useCategories(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch categories from Supabase
  const { 
    data: categories = [], 
    isLoading: isLoadingCategories 
  } = useQuery({
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

  // Check if all default categories are present
  const areAllDefaultCategoriesPresent = (userCategories: any[]) => {
    const categoryNames = userCategories.map(c => c.name.toLowerCase());
    const defaultNames = defaultCategories.map(c => c.name.toLowerCase());
    
    return defaultNames.every(name => categoryNames.includes(name));
  };

  // Initialize default categories for new users
  const initializeDefaultCategories = async (userId: string) => {
    try {
      console.log("Starting to initialize default categories:", defaultCategories);
      
      // Get existing categories to avoid duplicates
      const { data: existingCategories, error: fetchError } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', userId);
        
      if (fetchError) {
        console.error("Error fetching existing categories:", fetchError);
        return;
      }
      
      const existingNames = new Set(existingCategories?.map(c => c.name.toLowerCase()) || []);
      
      for (const category of defaultCategories) {
        // Skip if category already exists
        if (existingNames.has(category.name.toLowerCase())) {
          console.log(`Category ${category.name} already exists, skipping`);
          continue;
        }
        
        const { error } = await supabase
          .from('categories')
          .insert({
            id: category.id,
            name: category.name,
            color: category.color,
            icon: 'default',
            user_id: userId,
          });
        
        if (error) {
          console.error(`Error creating category ${category.name}:`, error);
          toast({
            title: "Error creating category",
            description: `Failed to create ${category.name}: ${error.message}`,
            variant: "destructive",
          });
        } else {
          console.log(`Successfully created category: ${category.name} with ID: ${category.id}`);
        }
      }
      
      console.log("Default categories initialization complete");
    } catch (e) {
      console.error("Failed to initialize default categories", e);
    }
  };

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
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { data: expensesUsingCategory, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('category_id', id)
        .eq('user_id', userId);
      
      if (checkError) throw checkError;
      
      if (expensesUsingCategory && expensesUsingCategory.length > 0) {
        throw new Error("Category is in use by some expenses");
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting category",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const addCategory = (category: Omit<ExpenseCategory, "id">) => {
    addCategoryMutation.mutate(category);
    return { ...category, id: 'pending' };
  };

  const updateCategory = (category: ExpenseCategory) => {
    updateCategoryMutation.mutate(category);
  };

  const deleteCategory = (id: string) => {
    try {
      deleteCategoryMutation.mutate(id);
      return true;
    } catch (error) {
      return false;
    }
  };

  const getCategoryById = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category) return category;
    
    const defaultCategory = defaultCategories.find(c => c.id === id);
    if (defaultCategory) return defaultCategory;
    
    return defaultCategories.find(c => c.id === "other") || {
      id: "unknown",
      name: "Unknown Category",
      color: "#CCCCCC"
    };
  };

  // If categories is empty, use defaultCategories
  const finalCategories = categories.length > 0 ? categories : defaultCategories;

  return {
    categories: finalCategories,
    isLoadingCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
  };
}
