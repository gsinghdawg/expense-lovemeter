
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// This hook has been simplified to just check if the user is authenticated
export const usePaymentStatusCheck = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      console.log("User not authenticated");
      return;
    }

    console.log("User authenticated:", user.id);
    
  }, [user]);

  return { isAuthenticated: !!user };
};
