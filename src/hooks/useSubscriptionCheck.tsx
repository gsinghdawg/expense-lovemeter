
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Paths that should be excluded from subscription checking
const EXCLUDED_PATHS = ['/', '/home', '/pricing', '/signup'];

export const useSubscriptionCheck = () => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true); // Always return true to bypass subscription check
  const [subscriptionChecked, setSubscriptionChecked] = useState(true); // Always return true
  const location = useLocation();

  // Check if current path should be excluded from checking
  const isExcludedPath = EXCLUDED_PATHS.includes(location.pathname);

  // Set subscription status immediately 
  useEffect(() => {
    setHasActiveSubscription(true);
    setSubscriptionChecked(true);
  }, [user]);

  return {
    hasActiveSubscription,
    subscriptionChecked,
    isExcludedPath
  };
};
