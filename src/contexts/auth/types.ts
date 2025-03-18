
import { Session, User } from "@supabase/supabase-js";

export interface ProfileData {
  id: string;
  name?: string;
  email: string;
  age?: number;
  date_of_birth?: string;
  country?: string;
}

export interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  profileData: ProfileData | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
