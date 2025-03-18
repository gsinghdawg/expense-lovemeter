import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, User, Calendar, Cake } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Form validation schema for profile setup
const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  age: z.coerce.number()
    .positive({ message: "Age must be positive" })
    .lt(120, { message: "Age must be less than 120" }),
  dateOfBirth: z.string()
    .refine((val) => /^\d{2}\/\d{2}\/\d{4}$/.test(val), {
      message: "Date of birth must be in MM/DD/YYYY format",
    }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileSetup = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("ProfileSetup - Current user:", user?.id);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.user_metadata?.name || "",
      gender: "prefer_not_to_say",
      age: undefined,
      dateOfBirth: "",
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    console.log("ProfileSetup - Form submitted:", values);
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete your profile",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const [month, day, year] = values.dateOfBirth.split('/').map(Number);
      const dateOfBirth = new Date(year, month - 1, day);
      
      console.log("Updating profile with:", {
        name: values.name,
        age: values.age,
        date_of_birth: dateOfBirth.toISOString(),
        onboarding_completed: true,
      });
      
      const { error, data } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          age: values.age,
          date_of_birth: dateOfBirth.toISOString(),
          onboarding_completed: true,
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      console.log("Profile update response:", data);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been completed successfully."
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="py-8 px-4 sm:px-6 min-h-screen flex flex-col">
      <div className="absolute right-4 top-4">
        <ThemeSwitcher />
      </div>
      
      <div className="app-container max-w-md mx-auto w-full">
        <div className="mb-6 mt-10">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              LadyLedger
              <Sparkles className="h-6 w-6 text-amber-500" />
            </h1>
            <h2 className="text-muted-foreground text-sm italic mb-2">Your Finance Companion</h2>
            <h3 className="text-xl font-semibold mb-6">Complete Your Profile</h3>
          </div>
        </div>

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
                        placeholder="Enter your name"
                        className="pl-10"
                        {...field}
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <label htmlFor="male" className="cursor-pointer">Male</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <label htmlFor="female" className="cursor-pointer">Female</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <label htmlFor="other" className="cursor-pointer">Other</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="prefer_not_to_say" id="prefer_not_to_say" />
                        <label htmlFor="prefer_not_to_say" className="cursor-pointer">Prefer not to say</label>
                      </div>
                    </RadioGroup>
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
                      <Input
                        placeholder="Enter your age"
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : Number(value));
                        }}
                        value={field.value || ""}
                        disabled={isLoading}
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
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <div className="flex items-center relative">
                      <Cake className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="MM/DD/YYYY"
                        className="pl-10"
                        {...field}
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Complete Profile"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProfileSetup;
