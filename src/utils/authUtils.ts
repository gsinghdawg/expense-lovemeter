
import { supabase } from "@/integrations/supabase/client";

// Check if user has completed onboarding and redirect accordingly
export const checkProfileCompletion = async (userId: string) => {
  try {
    console.log("Checking profile completion in AuthUtils for user:", userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error checking profile completion:", error);
      return false;
    }

    console.log("Profile completion data:", data);
    return data?.onboarding_completed || false;
  } catch (error) {
    console.error("Failed to check profile completion:", error);
    return false;
  }
};

// Update user profile in Supabase
export const updateUserProfile = async (userId: string, userData: { name?: string }) => {
  try {
    console.log("Updating user profile:", userId, userData);
    const { error } = await supabase
      .from('profiles')
      .update(userData)
      .eq('id', userId);
    
    if (error) {
      console.error("Error updating profile:", error);
    }
  } catch (error) {
    console.error("Failed to update profile:", error);
  }
};
