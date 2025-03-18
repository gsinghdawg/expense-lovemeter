
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  id: string;
  name?: string;
  email: string;
  age?: number;
  date_of_birth?: string;
  country?: string;
}

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  profileData: ProfileData | null;
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
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  // Get user profile data
  const fetchProfileData = async (userId: string) => {
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfileData(session.user.id).then(data => {
          setProfileData(data);
        });
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
          
          // Fetch profile data
          const profileData = await fetchProfileData(session.user.id);
          setProfileData(profileData);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

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
      setProfileData(null);

      // Then attempt to sign out from Supabase
      try {
        await supabase.auth.signOut();
      } catch (error: any) {
        // Log the error but don't throw it - we've already updated the UI state
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

  const value = {
    user,
    session,
    isLoading,
    profileData,
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
