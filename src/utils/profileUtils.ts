
import { supabase } from "@/integrations/supabase/client";
import { ProfileFormValues } from "@/schemas/profileSchema";

export const saveProfile = async (userId: string, values: ProfileFormValues) => {
  const [month, day, year] = values.dateOfBirth.split('/').map(Number);
  const dateOfBirth = new Date(year, month - 1, day);
  
  console.log("Updating profile with:", {
    name: values.name,
    age: values.age,
    date_of_birth: dateOfBirth.toISOString(),
    onboarding_completed: true,
    gender: values.gender
  });
  
  const { error, data } = await supabase
    .from('profiles')
    .update({
      name: values.name,
      age: values.age,
      date_of_birth: dateOfBirth.toISOString(),
      onboarding_completed: true,
      gender: values.gender
    })
    .eq('id', userId);
  
  if (error) {
    throw error;
  }
  
  console.log("Profile update response:", data);
  return data;
};
