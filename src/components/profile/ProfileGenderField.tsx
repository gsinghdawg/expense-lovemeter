
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Control } from "react-hook-form";
import { ProfileFormValues } from "@/schemas/profileSchema";

interface ProfileGenderFieldProps {
  control: Control<ProfileFormValues>;
}

export const ProfileGenderField = ({ control }: ProfileGenderFieldProps) => {
  return (
    <FormField
      control={control}
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
  );
};
