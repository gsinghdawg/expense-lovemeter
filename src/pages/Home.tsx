
import { Link } from "react-router-dom";
import { Sparkles, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const Home = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <ThemeSwitcher />
        {!user ? (
          <Button asChild size="sm" className="gap-2">
            <Link to="/signup">
              <LogIn className="h-4 w-4" />
              Sign In / Register
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="destructive" className="gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
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

        {/* App Showcase Section */}
        <div className="my-16">
          <h2 className="text-3xl font-bold text-center mb-8">See How It Works</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-semibold mb-4">Easy Expense Tracking</h3>
              <p className="text-lg mb-4">
                Adding expenses is simple and quick. Just enter the amount, description, 
                select a category, and pick a date - all in a few seconds!
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Intuitive interface designed for daily use</li>
                <li>Organize expenses with customizable categories</li>
                <li>Track spending patterns to improve your habits</li>
                <li>Stay on budget with real-time updates</li>
              </ul>
              <Button asChild size="lg" className="w-full md:w-auto">
                <Link to="/signup">Try It Now - Free!</Link>
              </Button>
            </div>
            <div className="md:w-1/2 mt-8 md:mt-0">
              <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
                <CardContent className="p-0">
                  <img 
                    src="/lovable-uploads/8e8e7db1-e8a5-4c71-bc2a-16e671f1d0f7.png" 
                    alt="LadyLedger Expense Form" 
                    className="w-full h-auto"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
