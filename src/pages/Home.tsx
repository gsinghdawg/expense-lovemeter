
import { Link } from "react-router-dom";
import { Sparkles, LogIn, LogOut, PieChart, LineChart, BarChart3, Quote, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Home = () => {
  const { user, signOut } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!user);

  useEffect(() => {
    setIsLoggedIn(!!user);
    console.log("Home component: Auth state changed", { user, isLoggedIn: !!user });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    console.log("Sign out clicked, current user state:", user);
  };

  const testimonials = [
    {
      name: "Sarah Johnson",
      avatar: "/lovable-uploads/aee62957-15f2-456e-a356-50b3dab78200.png",
      testimonial: "DatingLedger helped me track my dating expenses and stay on budget! The categories feature lets me see how much I spend on dining out vs. activities. I've saved over $200 a month while still enjoying quality time with my partner."
    },
    {
      name: "Michael Chen",
      avatar: "",
      testimonial: "As someone who loves planning special dates, DatingLedger's budget goals feature has been a game-changer. I can save for anniversary gifts while keeping our regular date nights affordable. The expense tracking made me realize where we could cut costs without sacrificing romance!"
    },
    {
      name: "Jessica Taylor",
      avatar: "",
      testimonial: "My partner and I use DatingLedger to manage our shared dating expenses. The visual charts help us see our spending patterns and have better conversations about money. We've cut our entertainment costs by 30% while actually enjoying more meaningful experiences together."
    },
    {
      name: "David Wilson",
      avatar: "",
      testimonial: "DatingLedger transformed how my girlfriend and I handle our date nights. The monthly spending reports showed we were spending too much on expensive restaurants. Now we cook together at home twice a week and put that money toward weekend getaways instead!"
    },
    {
      name: "Emily Rodriguez",
      avatar: "",
      testimonial: "I was always the 'spender' in our relationship until I started using DatingLedger. The visual breakdown of my expenses made me realize how little moments add up. We've managed to pay off date-related debt and start saving for our engagement trip!"
    },
    {
      name: "Ryan Park",
      avatar: "",
      testimonial: "The custom categories feature is perfect! I created a 'Surprise Gifts' category that my partner can't see, and a 'Shared Activities' one we both contribute to. DatingLedger has made money conversations so much easier in our relationship."
    },
    {
      name: "Alicia Washington",
      avatar: "",
      testimonial: "After three years of dating and overspending, DatingLedger helped us create a realistic dating budget. Now we alternate between budget-friendly dates and occasional splurges. The monthly reports keep us accountable without feeling restricted."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <ThemeSwitcher />
        {!isLoggedIn ? (
          <Button asChild size="sm" className="gap-2">
            <Link to="/signup">
              <LogIn className="h-4 w-4" />
              Sign In / Register
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="destructive" className="gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        )}
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-amber-500" />
            DatingLedger
            <Sparkles className="h-10 w-10 text-amber-500" />
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground italic">
            Your Finance Companion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
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
          
          <Card className="gradient-card">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">AI Integration</h3>
              <p className="text-muted-foreground">
                Ask AI for advice on your spending habits and how you can save money.
              </p>
            </CardContent>
          </Card>
        </div>

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
                    alt="DatingLedger Expense Form" 
                    className="w-full h-auto"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="my-16">
          <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-8">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-semibold mb-4">Smart Budget Management</h3>
              <p className="text-lg mb-4">
                Set monthly budgets and track your transactions in real-time to stay in control of your finances.
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Create personalized monthly budget goals</li>
                <li>Track all your expenses in one place</li>
                <li>See your spending history at a glance</li>
                <li>Edit or delete transactions easily</li>
              </ul>
              <Button asChild size="lg" className="w-full md:w-auto">
                <Link to="/signup">Start Budgeting Today</Link>
              </Button>
            </div>
            <div className="md:w-1/2 mt-8 md:mt-0">
              <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
                <CardContent className="p-0">
                  <img 
                    src="/lovable-uploads/878930f3-7082-458d-b475-6c2ab13cc869.png" 
                    alt="DatingLedger Budget Management" 
                    className="w-full h-auto"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="my-16">
          <h2 className="text-3xl font-bold text-center mb-8">Effortless Organization</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-semibold mb-4">Complete Expense Management</h3>
              <p className="text-lg mb-4">
                Keep track of all your expenses and organize them with custom categories that make sense for your lifestyle.
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Create and manage custom expense categories</li>
                <li>View transactions organized by date</li>
                <li>Search and filter expenses with ease</li>
                <li>Edit or delete entries with a single click</li>
              </ul>
              <Button asChild size="lg" className="w-full md:w-auto">
                <Link to="/signup">Get Organized Now</Link>
              </Button>
            </div>
            <div className="md:w-1/2 mt-8 md:mt-0">
              <div className="grid grid-cols-1 gap-4">
                <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
                  <CardContent className="p-0">
                    <img 
                      src="/lovable-uploads/737fe8a2-bd29-4a7b-88f8-77d5b1f3f1c6.png" 
                      alt="DatingLedger Transaction List" 
                      className="w-full h-auto"
                    />
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
                  <CardContent className="p-0">
                    <img 
                      src="/lovable-uploads/74e39270-ab94-4e49-8f56-90d509d7aaad.png" 
                      alt="DatingLedger Category Management" 
                      className="w-full h-auto"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="my-16">
          <h2 className="text-3xl font-bold text-center mb-8">Powerful Analytics & Insights</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2">
              <h3 className="text-2xl font-semibold mb-4">Visualize Your Financial Health</h3>
              <p className="text-lg mb-4">
                Get comprehensive insights into your spending habits with beautiful charts and detailed analytics.
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Track budget progress with intuitive visualizations</li>
                <li>Analyze spending patterns across categories</li>
                <li>View monthly spending history and trends</li>
                <li>Identify top spending categories at a glance</li>
              </ul>
              <Button asChild size="lg" className="w-full md:w-auto">
                <Link to="/signup">Start Analyzing Today</Link>
              </Button>
            </div>
            <div className="md:w-1/2 mt-8 md:mt-0">
              <div className="grid grid-cols-1 gap-4">
                <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
                  <CardContent className="p-0">
                    <img 
                      src="/lovable-uploads/ef82ae7e-b4c0-43c2-8b60-2bbaec961f1c.png" 
                      alt="DatingLedger Expense Summary and Category Breakdown" 
                      className="w-full h-auto"
                    />
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
                  <CardContent className="p-0">
                    <img 
                      src="/lovable-uploads/b271dcf0-1c77-4093-bd2a-3e88e1f7a618.png" 
                      alt="DatingLedger Monthly Spending History" 
                      className="w-full h-auto"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="my-20">
          <h2 className="text-3xl font-bold text-center mb-2">What Our Users Say</h2>
          <p className="text-muted-foreground text-center mb-10">Join thousands of happy users managing their dating finances with DatingLedger</p>
          
          <Carousel className="mx-auto max-w-3xl">
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index}>
                  <Card className="border-2 border-primary/10 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <Quote className="h-8 w-8 text-primary/60 mb-4" />
                      <p className="text-lg italic mb-6">{testimonial.testimonial}</p>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          {testimonial.avatar ? (
                            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                          ) : (
                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="text-left">
                          <p className="font-semibold">{testimonial.name}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 lg:-left-12" />
            <CarouselNext className="right-0 lg:-right-12" />
          </Carousel>
        </div>

        <div className="mt-16 mb-8 text-center">
          <Card className="p-8 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 border-2 border-primary/20">
            <CardContent className="p-0">
              <h3 className="text-2xl font-bold mb-4">Ready to Take Control of Your Dating Finances?</h3>
              <p className="text-lg mb-6 max-w-2xl mx-auto">
                Join thousands of users who have transformed their dating habits with DatingLedger. 
                Start your journey to affordable and meaningful relationships today!
              </p>
              <Button asChild size="lg" className="px-8">
                <Link to="/signup">Sign Up for Free</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Home;
