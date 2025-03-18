
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, User, Calendar, Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const onboardingSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.string()
    .refine((val) => !isNaN(parseInt(val)), { message: "Age must be a number." })
    .refine((val) => parseInt(val) > 0 && parseInt(val) < 120, { message: "Age must be between 1 and 119." }),
  dateOfBirth: z.date({
    required_error: "Date of birth is required.",
  }),
  country: z.string().min(2, { message: "Country must be at least 2 characters." }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const UserOnboarding = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If user is not logged in, redirect to sign up
  useEffect(() => {
    if (!user) {
      navigate("/signup");
    }
  }, [user, navigate]);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: user?.user_metadata?.name || "",
      age: "",
      country: "",
    },
  });

  async function onSubmit(values: OnboardingFormValues) {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculate age from date of birth (in case the manually entered age is different)
      const today = new Date();
      const birthDate = new Date(values.dateOfBirth);
      const calculatedAge = today.getFullYear() - birthDate.getFullYear();
      
      // Update user profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          age: parseInt(values.age),
          date_of_birth: values.dateOfBirth.toISOString(),
          country: values.country,
          onboarding_completed: true
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Profile updated",
        description: "Thank you for providing your information!",
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to update your profile",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Please provide the following information to personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="flex items-center relative">
                        <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter your full name"
                          className="pl-10"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <div className="flex items-center relative">
                        <Calendar className="absolute left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter your age"
                          type="number"
                          className="pl-10"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country of Origin</FormLabel>
                    <FormControl>
                      <div className="flex items-center relative">
                        <Flag className="absolute left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter your country"
                          className="pl-10"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Complete Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOnboarding;
