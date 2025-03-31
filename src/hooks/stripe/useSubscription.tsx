
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

// Simple mock implementation
export function useSubscription() {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      setIsLoading(true);
      try {
        // This is just a mock implementation
        // In a real implementation, this would fetch the actual subscription data
        setSubscription({
          status: "active",
          current_period_end: new Date().getTime() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
          plan: {
            name: "Pro Plan",
            amount: 1999, // $19.99
            interval: "month",
          },
        });
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast({
          title: "Error",
          description: "Failed to fetch subscription data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  return {
    subscription,
    isLoading,
  };
}
