
import { z } from "zod";

// List of countries for the dropdown
export const countries = [
  "United States", "Canada", "United Kingdom", "Australia", "Germany", 
  "France", "Japan", "China", "India", "Brazil", "Mexico", "Spain", 
  "Italy", "Russia", "South Africa", "Nigeria", "Egypt", "Saudi Arabia", 
  "UAE", "Singapore", "South Korea", "New Zealand", "Ireland", "Portugal",
  "Argentina", "Chile", "Colombia", "Peru", "Venezuela", "Sweden", "Norway",
  "Finland", "Denmark", "Netherlands", "Belgium", "Switzerland", "Austria",
  "Greece", "Turkey", "Israel", "Thailand", "Vietnam", "Malaysia", "Indonesia",
  "Philippines", "Pakistan", "Bangladesh", "Kenya", "Ghana", "Morocco"
];

// Form validation schema
export const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().int().min(1, { message: "Please enter a valid age." }).max(120, { message: "Age must be less than 120." }),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    message: "Please select a gender.",
  }),
  dateOfBirth: z.date({
    required_error: "Please select a date of birth.",
  }),
  country: z.string({
    required_error: "Please select your country.",
  }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
