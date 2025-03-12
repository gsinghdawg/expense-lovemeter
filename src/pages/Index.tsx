import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

function Index() {
  const { user, isLoading } = useRequireAuth();
  const { signOut } = useSupabase();
  
  // If loading or redirecting, show a spinner or loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // The rest of your component code...
  
  // Add a sign out button somewhere in your return statement
  const handleSignOut = () => {
    signOut();
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">LadyLedger Dashboard</h1>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </header>
      
      {/* Rest of your dashboard UI */}
      
    </div>
  );
}

export default Index;
