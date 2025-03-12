
import { ExpenseCategory } from "@/types/expense";
import { defaultCategories } from "@/data/categories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Check if all default categories are present
export const areAllDefaultCategoriesPresent = (userCategories: any[]) => {
  const categoryNames = userCategories.map(c => c.name.toLowerCase());
  const defaultNames = defaultCategories.map(c => c.name.toLowerCase());
  
  return defaultNames.every(name => categoryNames.includes(name));
};

// Initialize default categories for new users
export const initializeDefaultCategories = async (userId: string) => {
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

// Helper function to get category by ID
export const getCategoryById = (categories: ExpenseCategory[], id: string) => {
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
