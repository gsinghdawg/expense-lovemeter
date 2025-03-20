
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { safeTable, PaymentApiKey } from '@/integrations/supabase/custom-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Spinner } from '@/components/ui/spinner';

const apiKeySchema = z.object({
  provider: z.string().min(1, 'Provider name is required'),
  api_key: z.string().min(1, 'API key is required'),
  description: z.string().optional(),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

export function ApiKeyManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<PaymentApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      provider: '',
      api_key: '',
      description: '',
    },
  });

  // Fetch user's API keys
  const fetchApiKeys = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(safeTable('payment_api_keys'))
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching API keys:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your API keys. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      setApiKeys(data as PaymentApiKey[] || []);
    } catch (err) {
      console.error('Unexpected error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load API keys on component mount
  useEffect(() => {
    fetchApiKeys();
  }, [user]); 

  // Add new API key
  const onSubmit = async (values: ApiKeyFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from(safeTable('payment_api_keys'))
        .insert({
          user_id: user.id,
          provider: values.provider,
          api_key: values.api_key,
          description: values.description || null,
        });
      
      if (error) {
        console.error('Error adding API key:', error);
        toast({
          title: 'Error',
          description: 'Failed to add API key. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'API key added successfully!',
      });
      
      // Reset form and refresh API keys
      form.reset();
      fetchApiKeys();
    } catch (err) {
      console.error('Unexpected error adding API key:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete API key
  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from(safeTable('payment_api_keys'))
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting API key:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete API key. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Success',
        description: 'API key deleted successfully.',
      });
      
      // Refresh API keys
      fetchApiKeys();
    } catch (err) {
      console.error('Unexpected error deleting API key:', err);
    }
  };

  // Toggle API key visibility
  const toggleShowKey = (id: string) => {
    setShowKey(showKey === id ? null : id);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment API Keys</CardTitle>
          <CardDescription>
            Add and manage API keys for your payment providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Stripe, PayPal" {...field} />
                    </FormControl>
                    <FormDescription>
                      Name of the payment provider for this API key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your API key" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your API key will be securely stored
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add some notes about this API key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Add API Key
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage your saved payment API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <Spinner className="h-8 w-8" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              You haven't added any API keys yet
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{key.provider}</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleShowKey(key.id)}
                      >
                        {showKey === key.id ? "Hide" : "Show"}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this API key for {key.provider}?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteApiKey(key.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground">
                      {showKey === key.id ? (
                        <code className="bg-muted p-1 rounded">{key.api_key}</code>
                      ) : (
                        <code className="bg-muted p-1 rounded">•••••••••••••••••••••••••</code>
                      )}
                    </p>
                  </div>
                  
                  {key.description && (
                    <p className="text-sm text-muted-foreground mt-2">{key.description}</p>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Added on {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
