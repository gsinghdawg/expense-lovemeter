
import { supabase, saveClickCountBeforeUnload } from '@/integrations/supabase/client';

// Export the existing saveClickCountBeforeUnload function from client.ts
export { saveClickCountBeforeUnload };

// Persist click count to Supabase database
export const saveClickCount = async (count: number, userId: string) => {
  if (count === 0) return;
  
  try {
    console.log('Saving click count to DB:', count);
    const { error } = await supabase
      .from('user_click_counts')
      .upsert(
        { user_id: userId, click_count: count, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    
    if (error) {
      console.error('Error saving click count:', error);
      // Try again after a short delay if there was an error
      setTimeout(() => {
        saveClickCount(count, userId);
      }, 1000);
    } else {
      console.log('Successfully saved click count to DB');
    }
  } catch (error) {
    console.error('Error updating click count:', error);
  }
};
