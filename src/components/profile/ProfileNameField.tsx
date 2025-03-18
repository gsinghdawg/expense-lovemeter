
import { User } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { ProfileFormValues } from "@/schemas/profileSchema";

interface ProfileNameFieldProps {
  control: Control<ProfileFormValues>;
  isLoading: boolean;
}

export const ProfileNameField = ({ control, isLoading }: ProfileNameFieldProps) => {
  return (
    <FormField
      control={control}
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
  );
};
