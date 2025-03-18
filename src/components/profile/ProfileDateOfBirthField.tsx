
import { Cake } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { ProfileFormValues } from "@/schemas/profileSchema";

interface ProfileDateOfBirthFieldProps {
  control: Control<ProfileFormValues>;
  isLoading: boolean;
}

export const ProfileDateOfBirthField = ({ control, isLoading }: ProfileDateOfBirthFieldProps) => {
  return (
    <FormField
      control={control}
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
  );
};
