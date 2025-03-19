
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Define the schema for API keys
const apiKeySchema = z.object({
  stripePublishableKey: z.string().min(10, {
    message: "Stripe Publishable Key must be at least 10 characters."
  }),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

const APIKeyForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentKeys, setCurrentKeys] = useState({
    stripePublishableKey: ''
  });

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      stripePublishableKey: '',
    },
  });

  // Load current keys from localStorage if they exist
  useEffect(() => {
    const storedStripeKey = localStorage.getItem('STRIPE_PUBLISHABLE_KEY');
    if (storedStripeKey) {
      setCurrentKeys({ stripePublishableKey: storedStripeKey });
      form.setValue('stripePublishableKey', storedStripeKey);
    } else {
      // If no stored key, use the default from the client
      import('@/integrations/supabase/client').then(({ STRIPE_PUBLISHABLE_KEY }) => {
        setCurrentKeys({ stripePublishableKey: STRIPE_PUBLISHABLE_KEY || '' });
        form.setValue('stripePublishableKey', STRIPE_PUBLISHABLE_KEY || '');
      });
    }
  }, [form]);

  const onSubmit = async (data: ApiKeyFormValues) => {
    setIsLoading(true);
    try {
      // Store the API keys in localStorage
      localStorage.setItem('STRIPE_PUBLISHABLE_KEY', data.stripePublishableKey);
      
      toast({
        title: "API Keys Updated",
        description: "Your API keys have been updated successfully. You may need to refresh the page for changes to take effect.",
        variant: "default",
      });
      
      // Update the current keys state
      setCurrentKeys({
        stripePublishableKey: data.stripePublishableKey
      });
      
      // Optionally, we could also update these keys in the Supabase edge function secrets
      // But that would require admin privileges, so we're just using localStorage for now
      
    } catch (error) {
      console.error("Error updating API keys:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>API Key Configuration</CardTitle>
        <CardDescription>
          Update your API keys for external services. These keys are stored locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="stripePublishableKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stripe Publishable Key</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="pk_live_..." 
                      {...field} 
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormDescription>
                    The publishable key for your Stripe account. Starts with 'pk_live_' or 'pk_test_'.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between items-center pt-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Current Key: <span className="font-mono">
                    {currentKeys.stripePublishableKey 
                      ? `${currentKeys.stripePublishableKey.substring(0, 8)}...` 
                      : 'Not set'}
                  </span>
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="ml-auto"
              >
                {isLoading ? "Updating..." : "Update API Keys"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-start border-t px-6 pt-4">
        <p className="text-sm text-muted-foreground">
          Note: For security reasons, API keys are stored in your local browser storage. You'll need to re-enter them if you clear your browser data or use a different device.
        </p>
      </CardFooter>
    </Card>
  );
};

export default APIKeyForm;
