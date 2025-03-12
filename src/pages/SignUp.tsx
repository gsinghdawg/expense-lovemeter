import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sparkles, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/providers/SupabaseProvider";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form validation schema for signup
const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

// Form validation schema for login
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

const SignUp = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("signup");
  const [authError, setAuthError] = useState<string | null>(null);
  const { signUp, signIn } = useSupabase();

  const signupForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSignUp(values: SignUpFormValues) {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { success, error } = await signUp(values.email, values.password, { name: values.name });
      
      if (success) {
        toast({
          title: "Account created!",
          description: "You've successfully signed up for LadyLedger.",
        });
        
        navigate("/dashboard");
      } else {
        setAuthError(error || "An error occurred during sign up.");
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function onLogin(values: LoginFormValues) {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { success, error } = await signIn(values.email, values.password);
      
      if (success) {
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in to LadyLedger.",
        });
        
        navigate("/dashboard");
      } else {
        setAuthError(error || "Invalid email or password.");
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
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
            <h2 className="text-muted-foreground text-sm italic mb-6">Your Finance Companion</h2>
          </div>
        </div>

        {authError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>

          <TabsContent value="signup">
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(onSignUp)} className="space-y-6">
                <FormField
                  control={signupForm.control}
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
                  control={signupForm.control}
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
                  control={signupForm.control}
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
                  control={signupForm.control}
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
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                <FormField
                  control={loginForm.control}
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
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="flex items-center relative">
                          <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter your password"
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
                  {isLoading ? "Logging In..." : "Login"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {activeTab === "signup" ? (
            <>
              Already have an account?{" "}
              <button 
                className="text-primary hover:underline font-medium"
                onClick={() => setActiveTab("login")}
              >
                Login here
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button 
                className="text-primary hover:underline font-medium"
                onClick={() => setActiveTab("signup")}
              >
                Create one now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUp;
