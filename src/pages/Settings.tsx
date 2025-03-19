
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import APIKeyForm from '@/components/settings/APIKeyForm';

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/signup', { replace: true });
    }
  }, [user, navigate]);

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-10">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2" 
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-4">Settings</h1>
          <p className="text-lg text-muted-foreground">
            Configure your application settings and API keys.
          </p>
        </div>
        
        <div className="space-y-8">
          <APIKeyForm />
        </div>
      </div>
    </div>
  );
};

export default Settings;
