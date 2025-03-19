
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session } | undefined>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          const name = session.user.user_metadata.name;
          
          if (name) {
            updateUserProfile(session.user.id, { name });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
          toast({
            title: "Email not confirmed",
            description: "Please check your email for a confirmation link or click resend confirmation.",
            variant: "destructive"
          });
          throw error;
        }
        throw error;
      }
      
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to LadyLedger."
      });
      
      return data;
    } catch (error: any) {
      console.error("Login error:", error);
      
      if (error.message !== "Email not confirmed" && error.code !== "email_not_confirmed") {
        toast({
          title: "Login failed",
          description: error.message || "There was an error logging in",
          variant: "destructive"
        });
      }
      
      throw error;
    }
  };

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

  const signOut = async () => {
    try {
      // Important: We don't clear user data immediately to allow other components 
      // to save any pending changes before the session is actually removed
      
      try {
        await supabase.auth.signOut();
      } catch (error: any) {
        console.warn("Error during Supabase sign out:", error);
      }
      
      // Now we can safely clear the user and session state
      setUser(null);
      setSession(null);
      
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

  const resendConfirmationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Confirmation email sent",
        description: "Please check your email for the confirmation link."
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend confirmation",
        description: error.message || "There was an error sending the confirmation email",
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
    resetPassword,
    resendConfirmationEmail
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
