
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const stripeFormSchema = z.object({
  secretKey: z.string().min(10, {
    message: 'Secret key must be at least 10 characters.',
  }),
  publishableKey: z.string().min(10, {
    message: 'Publishable key must be at least 10 characters.',
  }),
  webhookSecret: z.string().min(10, {
    message: 'Webhook secret must be at least 10 characters.',
  }),
});

export default function StripeKeysForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof stripeFormSchema>>({
    resolver: zodResolver(stripeFormSchema),
    defaultValues: {
      secretKey: '',
      publishableKey: '',
      webhookSecret: '',
    },
  });

  async function onSubmit(values: z.infer<typeof stripeFormSchema>) {
    setIsSubmitting(true);
    try {
      // Update Secret Key
      const secretResponse = await supabase.functions.invoke('update-stripe-keys', {
        body: {
          key: 'STRIPE_SECRET_KEY',
          value: values.secretKey,
        },
      });
      
      if (secretResponse.error) throw new Error('Failed to update secret key');
      
      // Update Publishable Key
      const publishableResponse = await supabase.functions.invoke('update-stripe-keys', {
        body: {
          key: 'STRIPE_PUBLISHABLE_KEY',
          value: values.publishableKey,
        },
      });
      
      if (publishableResponse.error) throw new Error('Failed to update publishable key');
      
      // Update Webhook Secret
      const webhookResponse = await supabase.functions.invoke('update-stripe-keys', {
        body: {
          key: 'STRIPE_WEBHOOK_SECRET',
          value: values.webhookSecret,
        },
      });
      
      if (webhookResponse.error) throw new Error('Failed to update webhook secret');

      toast({
        title: 'Keys Updated',
        description: 'Your Stripe keys have been successfully updated.',
      });
      
      // Update the client-side publishable key
      window.location.reload();
    } catch (error) {
      console.error('Error updating keys:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update keys. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Update Stripe API Keys</CardTitle>
        <CardDescription>
          Enter your Stripe API keys to connect payment processing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="secretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret Key</FormLabel>
                  <FormControl>
                    <Input placeholder="sk_live_..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Your Stripe secret key starting with sk_live_ (or sk_test_ for testing)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publishableKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publishable Key</FormLabel>
                  <FormControl>
                    <Input placeholder="pk_live_..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Your Stripe publishable key starting with pk_live_ (or pk_test_ for testing)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="webhookSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Secret</FormLabel>
                  <FormControl>
                    <Input placeholder="whsec_..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Your webhook secret key starting with whsec_
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Keys'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
