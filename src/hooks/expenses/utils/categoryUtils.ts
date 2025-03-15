
import { supabase } from "@/integrations/supabase/client";
import { defaultCategories } from "@/data/categories";
import { ExpenseCategory } from "@/types/expense";

// Check if all default categories are present in the user's categories
export function areAllDefaultCategoriesPresent(userCategories: any[]): boolean {
  // Extract names of all user categories
  const userCategoryNames = userCategories.map(cat => cat.name.trim().toLowerCase());
  
  // Check if all default category names are present in user categories
  return defaultCategories.every(defaultCat => 
    userCategoryNames.includes(defaultCat.name.trim().toLowerCase())
  );
}

// Initialize default categories for a new user
export async function initializeDefaultCategories(userId: string): Promise<void> {
  console.log("Initializing default categories for user:", userId);
  
  try {
    // Get existing categories first
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('name')
      .eq('user_id', userId);
      
    if (fetchError) {
      console.error("Error fetching existing categories:", fetchError);
      return;
    }
    
    // Extract names of existing categories (case insensitive)
    const existingCategoryNames = (existingCategories || [])
      .map(cat => cat.name.trim().toLowerCase());
    
    // Filter default categories to only those that don't already exist
    const categoriesToAdd = defaultCategories.filter(defaultCat => 
      !existingCategoryNames.includes(defaultCat.name.trim().toLowerCase())
    );
    
    if (categoriesToAdd.length === 0) {
      console.log("All default categories already exist for user");
      return;
    }
    
    // Prepare categories for insertion
    const categoriesToInsert = categoriesToAdd.map(cat => ({
      name: cat.name,
      color: cat.color,
      icon: 'default',
      user_id: userId
    }));
    
    // Insert missing default categories
    const { error: insertError } = await supabase
      .from('categories')
      .insert(categoriesToInsert);
      
    if (insertError) {
      console.error("Error inserting default categories:", insertError);
    } else {
      console.log(`Successfully added ${categoriesToAdd.length} default categories`);
    }
  } catch (error) {
    console.error("Error in initializeDefaultCategories:", error);
  }
}

// Helper to get a category by ID from a list of categories
export function getCategoryById(categories: ExpenseCategory[], id: string): ExpenseCategory | undefined {
  return categories.find(category => category.id === id);
}
