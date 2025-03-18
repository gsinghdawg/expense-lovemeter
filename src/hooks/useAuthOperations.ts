
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkProfileCompletion, updateUserProfile } from "@/utils/authUtils";

export const useAuthOperations = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle routing based on auth state and profile completion
  const handleAuthStateRouting = async (newUser: User | null, currentPath: string) => {
    if (!newUser) {
      // If not on signup page and not logged in, redirect to signup
      if (currentPath !== '/signup' && currentPath !== '/home') {
        navigate('/signup');
      }
      return;
    }

    console.log("Handling auth state routing for user:", newUser.id);
    
    // If we're already on the login or signup page, check profile completion
    if (currentPath === '/signup' || currentPath === '/home') {
      const isProfileComplete = await checkProfileCompletion(newUser.id);
      
      if (!isProfileComplete) {
        console.log("Profile not complete, navigating to /profile-setup");
        navigate('/profile-setup');
      } else {
        console.log("Profile already complete, navigating to /dashboard");
        navigate('/dashboard');
      }
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to LadyLedger."
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "There was an error logging in",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
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
      
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your registration."
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "There was an error creating your account",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Then attempt to sign out from Supabase
      try {
        await supabase.auth.signOut();
      } catch (error: any) {
        // Log the error but don't throw it
        console.warn("Error during Supabase sign out:", error);
      }
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out."
      });
      
      // Redirect to homepage after signing out
      navigate('/home');
    } catch (error: any) {
      console.error("Error during sign out:", error);
      toast({
        title: "Error signing out",
        description: error.message || "There was an error signing out",
        variant: "destructive"
      });
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link."
      });
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "There was an error sending the reset email",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    isLoading,
    setIsLoading,
    handleAuthStateRouting,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile
  };
};
