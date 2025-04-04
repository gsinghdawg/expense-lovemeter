
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BudgetGoal } from "@/types/expense";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface BudgetFormProps {
  currentBudget: BudgetGoal;
  budgetGoalsData?: any[];
  onUpdateBudget: (budget: BudgetGoal) => void;
  onResetBudget?: (month: number, year: number) => void;
}

export function BudgetForm({ 
  currentBudget, 
  budgetGoalsData = [],
  onUpdateBudget,
  onResetBudget 
}: BudgetFormProps) {
  const [amount, setAmount] = useState<number | null>(currentBudget.amount);
  const [month, setMonth] = useState<number>(currentBudget.month);
  const [year, setYear] = useState<number>(currentBudget.year);
  const [activeTab, setActiveTab] = useState("current");
  const [resetMonth, setResetMonth] = useState<number | null>(null);
  const [resetYear, setResetYear] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  
  // When month/year changes, update the amount if a budget exists
  useMemo(() => {
    const existingBudget = budgetGoalsData.find(
      budget => budget.month === month && budget.year === year
    );
    
    if (existingBudget) {
      setAmount(existingBudget.amount);
    } else {
      setAmount(null);
    }
  }, [month, year, budgetGoalsData]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount === null || isNaN(Number(amount))) {
      return;
    }
    
    onUpdateBudget({
      amount,
      month,
      year
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value === '' ? null : parseFloat(value));
  };

  const handleMonthChange = (value: string) => {
    setMonth(parseInt(value));
  };

  const handleYearChange = (value: string) => {
    setYear(parseInt(value));
  };

  const handleResetClick = (month: number, year: number) => {
    setResetMonth(month);
    setResetYear(year);
    setDialogOpen(true);
  };

  const handleResetConfirm = () => {
    if (resetMonth !== null && resetYear !== null && onResetBudget) {
      onResetBudget(resetMonth, resetYear);
      setDialogOpen(false);
    }
  };

  // Group budget goals by year for the overview
  const budgetsByYear = useMemo(() => {
    const grouped: Record<number, Array<{month: number, amount: number | null}>> = {};
    
    if (budgetGoalsData && budgetGoalsData.length > 0) {
      budgetGoalsData.forEach(budget => {
        if (!grouped[budget.year]) {
          grouped[budget.year] = [];
        }
        
        grouped[budget.year].push({
          month: budget.month,
          amount: budget.amount
        });
      });
    }
    
    return grouped;
  }, [budgetGoalsData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Budget Goals</CardTitle>
        <CardDescription>Set individual budget goals for each month</CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mx-4">
          <TabsTrigger value="current">Set Budget</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current">
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="budget-month">
                      Month
                    </label>
                    <Select value={month.toString()} onValueChange={handleMonthChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((monthName, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {monthName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="budget-year">
                      Year
                    </label>
                    <Select value={year.toString()} onValueChange={handleYearChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((yearValue) => (
                          <SelectItem key={yearValue} value={yearValue.toString()}>
                            {yearValue}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="budget-amount">
                    Budget Amount for {months[month]} {year}
                  </label>
                  <Input
                    id="budget-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount === null ? '' : amount}
                    onChange={handleInputChange}
                    placeholder="Enter monthly budget"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={amount === null}>
                {amount === null ? "Set Budget" : "Update Budget"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
        
        <TabsContent value="overview">
          <CardContent>
            <div className="space-y-4">
              {Object.keys(budgetsByYear).length > 0 ? (
                Object.entries(budgetsByYear)
                  .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
                  .map(([year, budgets]) => (
                    <div key={year} className="space-y-2">
                      <h3 className="font-medium">{year}</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {months.map((monthName, monthIndex) => {
                          const monthBudget = budgets.find(b => b.month === monthIndex);
                          const hasValue = !!monthBudget;
                          
                          return (
                            <div 
                              key={monthIndex} 
                              className="p-2 border rounded text-center relative"
                              onClick={() => {
                                setYear(Number(year));
                                setMonth(monthIndex);
                                setActiveTab("current");
                              }}
                            >
                              <div className="text-xs font-medium">{monthName}</div>
                              <div className={`text-sm ${hasValue ? 'font-medium' : 'text-muted-foreground'}`}>
                                {monthBudget 
                                  ? `$${monthBudget.amount?.toFixed(2)}` 
                                  : 'Not set'}
                              </div>
                              
                              {hasValue && onResetBudget && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-0 right-0 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResetClick(monthIndex, parseInt(year));
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No budget goals set yet. Use the "Set Budget" tab to add monthly budgets.
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Budget Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the monthly budget goal for {resetMonth !== null && months[resetMonth]} {resetYear}?
              This will remove the budget goal entirely.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetConfirm} className="bg-destructive text-destructive-foreground">
              Reset Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
