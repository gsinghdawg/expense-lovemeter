
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ExpenseCategory, CategoryBudget } from "@/types/expense";
import { toast } from "@/hooks/use-toast";

type CategoryBudgetFormProps = {
  categories: ExpenseCategory[];
  monthlyBudget: number | null;
  month: number;
  year: number;
  existingCategoryBudgets: CategoryBudget[];
  onSaveBudgets: (budgets: Omit<CategoryBudget, 'id'>[]) => Promise<boolean>;
  isLoading: boolean;
};

export function CategoryBudgetForm({
  categories,
  monthlyBudget,
  month,
  year,
  existingCategoryBudgets,
  onSaveBudgets,
  isLoading
}: CategoryBudgetFormProps) {
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [autofillEnabled, setAutofillEnabled] = useState(true);
  
  // Initialize with existing category budgets or default values
  useEffect(() => {
    const initialBudgets: Record<string, number> = {};
    let allocatedTotal = 0;
    
    categories.forEach(category => {
      const existingBudget = existingCategoryBudgets.find(
        budget => budget.categoryId === category.id
      );
      
      if (existingBudget) {
        initialBudgets[category.id] = existingBudget.amount;
        allocatedTotal += existingBudget.amount;
      } else {
        initialBudgets[category.id] = 0;
      }
    });
    
    setCategoryBudgets(initialBudgets);
    setTotalAllocated(allocatedTotal);
    
    // Disable autofill if we have existing budgets
    if (existingCategoryBudgets.length > 0) {
      setAutofillEnabled(false);
    }
  }, [categories, existingCategoryBudgets]);

  // When monthly budget changes and autofill is enabled, distribute evenly
  useEffect(() => {
    if (monthlyBudget === null || !autofillEnabled) return;
    
    // Distribute budget evenly
    const evenAmount = categories.length > 0 ? monthlyBudget / categories.length : 0;
    const newBudgets: Record<string, number> = {};
    
    categories.forEach(category => {
      newBudgets[category.id] = evenAmount;
    });
    
    setCategoryBudgets(newBudgets);
    setTotalAllocated(monthlyBudget);
  }, [monthlyBudget, categories, autofillEnabled]);

  // Update a specific category budget
  const handleBudgetChange = (categoryId: string, value: number) => {
    const newValue = Math.max(0, value); // Prevent negative values
    
    setCategoryBudgets(prev => {
      const newBudgets = { ...prev, [categoryId]: newValue };
      
      // Recalculate total
      const newTotal = Object.values(newBudgets).reduce((sum, val) => sum + val, 0);
      setTotalAllocated(newTotal);
      
      return newBudgets;
    });
    
    setAutofillEnabled(false);
  };

  // Distribute remaining budget
  const handleDistributeRemaining = () => {
    if (monthlyBudget === null) return;
    
    const remaining = monthlyBudget - totalAllocated;
    if (remaining <= 0) return;
    
    // Count categories with budgets less than average
    const categoriesToDistribute = categories.filter(
      category => categoryBudgets[category.id] < monthlyBudget / categories.length
    );
    
    if (categoriesToDistribute.length === 0) return;
    
    // Distribute remaining budget evenly among filtered categories
    const distributionAmount = remaining / categoriesToDistribute.length;
    
    setCategoryBudgets(prev => {
      const newBudgets = { ...prev };
      
      categoriesToDistribute.forEach(category => {
        newBudgets[category.id] += distributionAmount;
      });
      
      return newBudgets;
    });
    
    setTotalAllocated(monthlyBudget);
  };

  // Reset all budgets to equal distribution
  const handleResetAllocation = () => {
    if (monthlyBudget === null) return;
    
    const evenAmount = categories.length > 0 ? monthlyBudget / categories.length : 0;
    const newBudgets: Record<string, number> = {};
    
    categories.forEach(category => {
      newBudgets[category.id] = evenAmount;
    });
    
    setCategoryBudgets(newBudgets);
    setTotalAllocated(monthlyBudget);
  };

  // Save all category budgets
  const handleSaveBudgets = async () => {
    if (monthlyBudget === null) {
      toast({
        title: "Error",
        description: "Please set a monthly budget goal first",
        variant: "destructive",
      });
      return;
    }

    if (Math.abs(totalAllocated - monthlyBudget) > 0.01) {
      toast({
        title: "Allocation mismatch",
        description: `The total allocated amount ($${totalAllocated.toFixed(2)}) must equal the monthly budget ($${monthlyBudget.toFixed(2)})`,
        variant: "destructive",
      });
      return;
    }

    const budgetsToSave: Omit<CategoryBudget, 'id'>[] = categories.map(category => ({
      categoryId: category.id,
      amount: categoryBudgets[category.id] || 0,
      month,
      year
    }));

    const success = await onSaveBudgets(budgetsToSave);
    
    if (success) {
      setAutofillEnabled(false);
    }
  };

  const getRemainingBudget = () => {
    if (monthlyBudget === null) return 0;
    return monthlyBudget - totalAllocated;
  };

  const getBudgetStatus = () => {
    const remaining = getRemainingBudget();
    if (remaining > 0) return "under";
    if (remaining < 0) return "over";
    return "exact";
  };

  const statusColorMap = {
    under: "text-yellow-500",
    over: "text-red-500",
    exact: "text-green-500"
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (monthlyBudget === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Budget Allocation</CardTitle>
          <CardDescription>
            Set budget limits for each expense category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please set a monthly budget goal first before allocating budget to categories.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Budget Allocation</CardTitle>
        <CardDescription>
          Distribute your budget of ${monthlyBudget.toFixed(2)} for {monthNames[month]} {year} across expense categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">
            Total allocated: ${totalAllocated.toFixed(2)} / ${monthlyBudget.toFixed(2)}
          </div>
          <div className={`text-sm font-medium ${statusColorMap[getBudgetStatus()]}`}>
            {getRemainingBudget() !== 0 && (
              getBudgetStatus() === "under" 
                ? `$${Math.abs(getRemainingBudget()).toFixed(2)} left to allocate`
                : `$${Math.abs(getRemainingBudget()).toFixed(2)} over budget`
            )}
            {getRemainingBudget() === 0 && "Budget fully allocated"}
          </div>
        </div>
        
        <div className="space-y-6">
          {categories.map(category => (
            <div key={category.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    ${categoryBudgets[category.id]?.toFixed(2) || "0.00"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({((categoryBudgets[category.id] || 0) / monthlyBudget * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[categoryBudgets[category.id] || 0]}
                  max={monthlyBudget * 1.5} // Allow slight over-allocation for flexibility
                  step={5}
                  onValueChange={(values) => handleBudgetChange(category.id, values[0])}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={categoryBudgets[category.id] || 0}
                  onChange={(e) => handleBudgetChange(category.id, parseFloat(e.target.value) || 0)}
                  className="w-20"
                  min={0}
                  step={5}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={handleResetAllocation}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={handleDistributeRemaining}
            disabled={getRemainingBudget() <= 0 || isLoading}
          >
            Distribute Remaining
          </Button>
        </div>
        <Button 
          onClick={handleSaveBudgets} 
          disabled={Math.abs(getRemainingBudget()) > 0.01 || isLoading}
        >
          {isLoading ? "Saving..." : "Save Allocation"}
        </Button>
      </CardFooter>
    </Card>
  );
}
