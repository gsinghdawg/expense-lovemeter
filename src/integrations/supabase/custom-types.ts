
import { Database } from './types';

// Define the actual structure of user_click_counts table
export interface UserClickCount {
  id: string;
  user_id: string;
  click_count: number;
  updated_at: string;
}

// Define the actual structure of subscriptions table
export interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_id: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  created_at: string;
}

// Define the actual structure of payment_history table
export interface PaymentHistory {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  description?: string;
  created_at: string;
}

// Define the actual structure of payment_api_keys table
export interface PaymentApiKey {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  description?: string;
  key_type?: 'secret' | 'publishable' | 'webhook';
  created_at: string;
}

// Custom extension of the Database type to include our custom tables
export type CustomDatabase = Database & {
  public: {
    Tables: {
      user_click_counts: {
        Row: UserClickCount;
        Insert: Partial<UserClickCount>;
        Update: Partial<UserClickCount>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription>;
        Update: Partial<Subscription>;
      };
      payment_history: {
        Row: PaymentHistory;
        Insert: Partial<PaymentHistory>;
        Update: Partial<PaymentHistory>;
      };
      payment_api_keys: {
        Row: PaymentApiKey;
        Insert: Partial<PaymentApiKey>;
        Update: Partial<PaymentApiKey>;
      };
    } & Database['public']['Tables'];
  };
};

// Create a type-safe function to access tables that might not be in the auto-generated types
export function safeTable<T extends string>(tableName: T): T {
  return tableName;
}
