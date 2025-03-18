
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProfileForm } from "@/components/profile/ProfileForm";

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if onboarding is already completed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error checking onboarding status:", error);
        return;
      }

      if (data?.onboarding_completed) {
        navigate("/dashboard");
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background py-8 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to LadyLedger!</h1>
          <p className="mt-2 text-muted-foreground">
            Please tell us a bit about yourself to get started.
          </p>
        </div>

        <div className="bg-card p-6 rounded-lg shadow-md border">
          <ProfileForm />
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
