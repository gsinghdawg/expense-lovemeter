
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user has completed onboarding and redirect accordingly
  const checkProfileCompletion = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error checking profile completion:", error);
        return false;
      }

      return data?.onboarding_completed || false;
    } catch (error) {
      console.error("Failed to check profile completion:", error);
      return false;
    }
  };

  // Handle routing based on auth state and profile completion
  const handleAuthStateRouting = async (newUser: User | null) => {
    if (!newUser) {
      // If not on signup page and not logged in, redirect to signup
      if (location.pathname !== '/signup' && location.pathname !== '/home') {
        navigate('/signup');
      }
      return;
    }

    // If we're already on the login or signup page, check profile completion
    if (location.pathname === '/signup' || location.pathname === '/home') {
      const isProfileComplete = await checkProfileCompletion(newUser.id);
      
      if (!isProfileComplete) {
        navigate('/profile-setup');
      } else {
        navigate('/dashboard');
      }
    }
  };

  // Update user profile in Supabase
  const updateUserProfile = async (userId: string, userData: { name?: string }) => {
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        handleAuthStateRouting(session.user);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        // When user signs in or token is refreshed, update their profile data
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          // Get user metadata
          const name = session.user.user_metadata.name;
          
          // Update profile if we have user metadata
          if (name) {
            await updateUserProfile(session.user.id, { name });
          }
          
          // Handle routing based on new auth state
          await handleAuthStateRouting(session.user);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

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
      // First update the local state to ensure UI updates immediately
      setUser(null);
      setSession(null);

      // Then attempt to sign out from Supabase
      try {
        await supabase.auth.signOut();
      } catch (error: any) {
        // Log the error but don't throw it - we've already updated the UI state
        console.warn("Error during Supabase sign out:", error);
        // We don't throw the error here since we've already cleared the local state
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

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
