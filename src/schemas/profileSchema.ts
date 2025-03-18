
import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  age: z.coerce.number()
    .positive({ message: "Age must be positive" })
    .lt(120, { message: "Age must be less than 120" }),
  dateOfBirth: z.string()
    .refine((val) => /^\d{2}\/\d{2}\/\d{4}$/.test(val), {
      message: "Date of birth must be in MM/DD/YYYY format",
    }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
