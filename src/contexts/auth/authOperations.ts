
import { supabase } from "@/integrations/supabase/client";
import { fetchProfileData, updateUserProfile } from "./profileUtils";

// Sign in with email and password
export const signInWithEmailPassword = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    throw error;
  }
};

// Sign up with email and password
export const signUpWithEmailPassword = async (email: string, password: string, name: string) => {
  const { error, data } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        name
      }
    }
  });
  
  if (error) {
    throw error;
  }
  
  // If signup was successful, create/update profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: email,
        name: name
      });
      
    if (profileError) {
      console.error("Error creating profile during signup:", profileError);
    }
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.warn("Error during Supabase sign out:", error);
    throw error;
  }
};

// Reset password
export const resetUserPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/dashboard`,
  });
  
  if (error) {
    throw error;
  }
};
