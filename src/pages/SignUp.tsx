
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sparkles, Mail, Lock, User, ArrowLeft } from "lucide-react";
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

// Form validation schema
const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: SignUpFormValues) {
    setIsLoading(true);
    
    // Simulating API call
    setTimeout(() => {
      console.log("Sign up values:", values);
      setIsLoading(false);
      
      toast({
        title: "Account created!",
        description: "You've successfully signed up for LadyLedger.",
      });
      
      // Redirect to dashboard page after successful signup
      navigate("/dashboard");
    }, 1500);
  }

  return (
    <div className="py-8 px-4 sm:px-6 min-h-screen flex flex-col">
      <div className="app-container max-w-md mx-auto w-full">
        <div className="absolute right-4 top-4">
          <ThemeSwitcher />
        </div>
        
        <div className="mb-6">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              LadyLedger
              <Sparkles className="h-6 w-6 text-amber-500" />
            </h1>
            <h2 className="text-muted-foreground text-sm italic mb-6">Create Your Account</h2>
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="flex items-center relative">
                      <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter your email"
                        type="email"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="flex items-center relative">
                      <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Create a password"
                        type="password"
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
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="flex items-center relative">
                      <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Confirm your password"
                        type="password"
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
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
            
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account?</span>{" "}
              <Link to="/dashboard" className="text-primary hover:underline">
                Go to Dashboard
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SignUp;
