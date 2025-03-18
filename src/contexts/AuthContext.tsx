import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

interface UserProfile {
  id: string;
  name: string | null;
  age: number | null;
  date_of_birth: string | null;
  country: string | null;
  onboarding_completed: boolean;
}

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userProfile: UserProfile | null;
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user ID:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      console.log("Profile data retrieved:", data);
      return data as UserProfile;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  };

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

  const handleAuthStateRouting = async (currentUser: User | null) => {
    if (!currentUser) {
      if (location.pathname !== "/home" && 
          location.pathname !== "/signup" &&
          !location.pathname.startsWith("/home")) {
        console.log("No user found, redirecting to /home");
        navigate("/home");
      }
      return;
    }

    const profile = await fetchUserProfile(currentUser.id);
    setUserProfile(profile);
    
    if (profile) {
      console.log("Profile onboarding status:", profile.onboarding_completed);
      
      if (profile.onboarding_completed === false) {
        console.log("Profile not complete, redirecting to /profile-setup");
        navigate("/profile-setup");
      } 
      else if (profile.onboarding_completed === true && 
              (location.pathname === "/signup" || 
               location.pathname === "/home" || 
               location.pathname === "/profile-setup")) {
        console.log("Profile complete, redirecting to /dashboard");
        navigate("/dashboard");
      }
    } else {
      console.log("No profile found for authenticated user, redirecting to profile setup");
      navigate("/profile-setup");
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session check:", session ? "Session found" : "No session");
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await handleAuthStateRouting(session.user);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          const name = session.user.user_metadata.name;
          
          if (name) {
            updateUserProfile(session.user.id, { name });
          }
          
          await handleAuthStateRouting(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      }
    );

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to LadyLedger."
      });
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Login failed",
        description: error.message || "There was an error logging in",
        variant: "destructive"
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
      toast({
        title: "Registration failed",
        description: error.message || "There was an error creating your account",
        variant: "destructive"
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      setUser(null);
      setSession(null);
      setUserProfile(null);

      try {
        await supabase.auth.signOut();
      } catch (error: any) {
        console.warn("Error during Supabase sign out:", error);
      }
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out."
      });
      
      navigate('/home');
    } catch (error: any) {
      console.error("Error during sign out:", error);
      toast({
        title: "Error signing out",
        description: error.message || "There was an error signing out",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    userProfile,
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
