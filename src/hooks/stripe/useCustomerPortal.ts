
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';

export const useCustomerPortal = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You need to be logged in to access billing",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { user_id: user.id },
      });

      if (error) {
        throw error;
      }

      // Redirect to the Stripe customer portal URL
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Error opening billing portal",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    openCustomerPortal,
    isLoading,
  };
};

export default useCustomerPortal;
