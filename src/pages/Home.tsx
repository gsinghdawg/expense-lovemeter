
import { Link } from "react-router-dom";
import { Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <ThemeSwitcher />
        {!user && (
          <Button asChild size="sm" className="gap-2">
            <Link to="/signup">
              <LogIn className="h-4 w-4" />
              Sign In / Register
            </Link>
          </Button>
        )}
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-amber-500" />
            LadyLedger
            <Sparkles className="h-10 w-10 text-amber-500" />
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground italic">
            Your Finance Companion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="gradient-card">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Track Expenses</h3>
              <p className="text-muted-foreground">
                Easily log and categorize your daily expenses to stay on top of your spending.
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Set Budgets</h3>
              <p className="text-muted-foreground">
                Create custom budget goals to help manage your finances and save more.
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">View Insights</h3>
              <p className="text-muted-foreground">
                Get visual summaries of your spending habits and financial progress.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="px-8">
            <Link to="/signup">Get Started</Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
