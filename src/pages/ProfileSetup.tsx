
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { profileSchema, ProfileFormValues } from "@/schemas/profileSchema";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileNameField } from "@/components/profile/ProfileNameField";
import { ProfileGenderField } from "@/components/profile/ProfileGenderField";
import { ProfileAgeField } from "@/components/profile/ProfileAgeField";
import { ProfileDateOfBirthField } from "@/components/profile/ProfileDateOfBirthField";
import { saveProfile } from "@/utils/profileUtils";

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
      await saveProfile(user.id, values);
      
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
        <ProfileHeader />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ProfileNameField control={form.control} isLoading={isLoading} />
            <ProfileGenderField control={form.control} />
            <ProfileAgeField control={form.control} isLoading={isLoading} />
            <ProfileDateOfBirthField control={form.control} isLoading={isLoading} />
            
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
