
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";

// Form validation schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().min(1, { message: "Please enter a valid age." }),
  dob: z.string().refine(
    (value) => {
      // Validate MM/DD/YYYY format
      return /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(value);
    }, 
    { message: "Please enter a valid date in MM/DD/YYYY format." }
  ),
  country: z.string().min(2, { message: "Country must be at least 2 characters." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileSetup = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      age: undefined,
      dob: "",
      country: "",
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile.",
        variant: "destructive"
      });
      navigate("/signup");
      return;
    }

    setIsLoading(true);
    
    try {
      // Parse the date string to a Date object
      const [month, day, year] = values.dob.split('/').map(Number);
      const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          age: values.age,
          date_of_birth: dateObj.toISOString(),
          country: values.country,
          onboarding_completed: true
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="py-8 px-4 sm:px-6 min-h-screen flex flex-col items-center justify-center">
      <div className="absolute right-4 top-4">
        <ThemeSwitcher />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <Sparkles className="h-6 w-6 text-amber-500" />
          </div>
          <CardDescription>
            Please provide some additional information to help us personalize your experience.
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
                      <Input 
                        placeholder="Enter your name"
                        {...field}
                        disabled={isLoading}
                      />
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
                      <Input
                        placeholder="Enter your age"
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                          field.onChange(value);
                        }}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="MM/DD/YYYY"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your country"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
