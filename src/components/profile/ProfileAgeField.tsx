
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { ProfileFormValues } from "@/schemas/profileSchema";

interface ProfileAgeFieldProps {
  control: Control<ProfileFormValues>;
  isLoading: boolean;
}

export const ProfileAgeField = ({ control, isLoading }: ProfileAgeFieldProps) => {
  return (
    <FormField
      control={control}
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
  );
};
