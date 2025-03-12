
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '@/providers/SupabaseProvider';

export function useRequireAuth(redirectTo = '/signup') {
  const { user, isLoading } = useSupabase();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(redirectTo);
    }
  }, [user, isLoading, navigate, redirectTo]);

  return { user, isLoading };
}
