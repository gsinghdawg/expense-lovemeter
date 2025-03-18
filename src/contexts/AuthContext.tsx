
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthContextProps } from "@/types/auth";
import { useAuthOperations } from "@/hooks/useAuthOperations";
import { updateUserProfile } from "@/utils/authUtils";

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();
  
  const {
    isLoading,
    setIsLoading,
    handleAuthStateRouting,
    signIn,
    signUp,
    signOut,
    resetPassword
  } = useAuthOperations();

  useEffect(() => {
    console.log("AuthContext useEffect running");
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        handleAuthStateRouting(session.user, location.pathname);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
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
          await handleAuthStateRouting(session.user, location.pathname);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [location.pathname]);

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
