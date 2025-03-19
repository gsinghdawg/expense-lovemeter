import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Sparkles, Mail, Lock, User, Home, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

// Form validation schema for password reset
const resetPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const SignUp = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("signup");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [emailNeedsConfirmation, setEmailNeedsConfirmation] = useState<string | null>(null);
  const { signIn, signUp, user, resendConfirmationEmail } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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

  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSignUp(values: SignUpFormValues) {
    setIsLoading(true);
    
    try {
      await signUp(values.email, values.password, values.name);
      signupForm.reset();
      
      // After signup, inform the user about confirmation email
      setEmailNeedsConfirmation(values.email);
      
      toast({
        title: "Account created",
        description: "Please check your email for confirmation instructions.",
      });
    } catch (error) {
      console.error("Sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function onLogin(values: LoginFormValues) {
    setIsLoading(true);
    
    try {
      const data = await signIn(values.email, values.password);
      
      if (data && data.user) {
        // A successful login should trigger the useEffect above to redirect
        // But let's also add explicit navigation to make sure
        navigate("/dashboard");
        
        toast({
          title: "Login successful",
          description: "Welcome back to LadyLedger!",
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Check if this is an email confirmation error
      if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
        setEmailNeedsConfirmation(values.email);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function onResetPassword(values: ResetPasswordFormValues) {
    setResetLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link.",
      });
      
      setResetDialogOpen(false);
      resetPasswordForm.reset();
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to send reset email",
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!emailNeedsConfirmation) return;
    
    setResendLoading(true);
    try {
      await resendConfirmationEmail(emailNeedsConfirmation);
      toast({
        title: "Confirmation email sent",
        description: "Please check your inbox for a new confirmation link.",
      });
    } catch (error) {
      console.error("Resend confirmation error:", error);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="py-8 px-4 sm:px-6 min-h-screen flex flex-col">
      <div className="absolute right-4 top-4">
        <ThemeSwitcher />
      </div>
      
      <div className="app-container max-w-md mx-auto w-full">
        <Button asChild size="sm" variant="outline" className="gap-2 absolute left-4 top-4">
          <Link to="/">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        
        <div className="mb-6 mt-10">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              LadyLedger
              <Sparkles className="h-6 w-6 text-amber-500" />
            </h1>
            <h2 className="text-muted-foreground text-sm italic mb-6">Your Finance Companion</h2>
          </div>
        </div>

        {emailNeedsConfirmation ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Confirmation Required
            </h3>
            <p className="text-sm mt-2 text-yellow-700 dark:text-yellow-300">
              Your account requires email confirmation. Please check your inbox at <span className="font-medium">{emailNeedsConfirmation}</span> for a confirmation link.
            </p>
            <div className="mt-3 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-300 dark:border-yellow-700 dark:hover:bg-yellow-900/40"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Confirmation
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setEmailNeedsConfirmation(null)}
                className="text-yellow-800 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
              >
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}

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
                
                <div className="flex justify-end">
                  <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto" type="button">
                        Forgot password?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email to receive a password reset link.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...resetPasswordForm}>
                        <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                          <FormField
                            control={resetPasswordForm.control}
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
                                      disabled={resetLoading}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end gap-2">
                            <DialogClose asChild>
                              <Button variant="outline" type="button">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={resetLoading}>
                              {resetLoading ? "Sending..." : "Send Reset Link"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
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
