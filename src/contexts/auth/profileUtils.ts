
import { supabase } from "@/integrations/supabase/client";
import { ProfileData } from "./types";

// Update user profile in Supabase
export const updateUserProfile = async (userId: string, userData: { name?: string }) => {
  try {
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

// Get user profile data
export const fetchProfileData = async (userId: string): Promise<ProfileData | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching profile data:", error);
      return null;
    }
    
    return data as ProfileData;
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    return null;
  }
};
