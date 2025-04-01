
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { PlusCircle } from "lucide-react";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Initialize with existing category budgets
  useEffect(() => {
    const initialBudgets: Record<string, number> = {};
    let allocatedTotal = 0;
    
    existingCategoryBudgets.forEach(budget => {
      initialBudgets[budget.categoryId] = budget.amount;
      allocatedTotal += budget.amount;
    });
    
    setCategoryBudgets(initialBudgets);
    setTotalAllocated(allocatedTotal);
  }, [existingCategoryBudgets]);

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

    const budgetsToSave: Omit<CategoryBudget, 'id'>[] = Object.entries(categoryBudgets).map(([categoryId, amount]) => ({
      categoryId,
      amount,
      month,
      year
    }));

    const success = await onSaveBudgets(budgetsToSave);
    
    if (success) {
      setDialogOpen(false);
    }
  };

  const handleAddCategory = () => {
    if (!selectedCategory) return;
    
    // Only add if category doesn't already exist in budgets
    if (categoryBudgets[selectedCategory] === undefined) {
      setCategoryBudgets(prev => ({
        ...prev,
        [selectedCategory]: 0
      }));
    }
    
    setSelectedCategory(null);
  };

  const handleRemoveCategory = (categoryId: string) => {
    setCategoryBudgets(prev => {
      const newBudgets = { ...prev };
      delete newBudgets[categoryId];
      
      // Recalculate total
      const newTotal = Object.values(newBudgets).reduce((sum, val) => sum + val, 0);
      setTotalAllocated(newTotal);
      
      return newBudgets;
    });
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

  // Get categories that haven't been allocated yet
  const unallocatedCategories = categories.filter(
    category => categoryBudgets[category.id] === undefined
  );

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
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Category Budget Allocation</CardTitle>
            <CardDescription>
              Distribute your budget across expense categories
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Manage Categories</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Allocate Budget for {monthNames[month]} {year}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">
                    Total: ${totalAllocated.toFixed(2)} / ${monthlyBudget.toFixed(2)}
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
                
                {/* Add new category selector */}
                {unallocatedCategories.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {unallocatedCategories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={handleAddCategory}
                      disabled={!selectedCategory}
                    >
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </div>
                )}
                
                {/* Category budget sliders */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {Object.entries(categoryBudgets).map(([categoryId, amount]) => {
                    const category = categories.find(c => c.id === categoryId);
                    if (!category) return null;
                    
                    return (
                      <div key={categoryId} className="space-y-2">
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
                              ${amount.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({monthlyBudget > 0 ? ((amount / monthlyBudget) * 100).toFixed(1) : 0}%)
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => handleRemoveCategory(categoryId)}
                            >
                              <span className="sr-only">Remove</span>
                              <span aria-hidden="true">&times;</span>
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[amount]}
                            max={monthlyBudget}
                            step={1}
                            onValueChange={(values) => handleBudgetChange(categoryId, values[0])}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={amount}
                            onChange={(e) => handleBudgetChange(categoryId, parseFloat(e.target.value) || 0)}
                            className="w-20"
                            min={0}
                            step={1}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveBudgets} 
                  disabled={Math.abs(getRemainingBudget()) > 0.01 || isLoading}
                >
                  {isLoading ? "Saving..." : "Save Allocation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {existingCategoryBudgets.length > 0 ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm mb-2">
              <span>Total allocated: ${totalAllocated.toFixed(2)} / ${monthlyBudget?.toFixed(2) || "0.00"}</span>
              <span className={totalAllocated === monthlyBudget ? "text-green-500" : "text-yellow-500"}>
                {totalAllocated === monthlyBudget ? "Budget fully allocated" : "Budget not fully allocated"}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(categoryBudgets).map(([categoryId, amount]) => {
                const category = categories.find(c => c.id === categoryId);
                if (!category) return null;
                
                return (
                  <div key={categoryId} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="truncate flex-1">{category.name}</span>
                    <span className="font-medium">${amount.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ({monthlyBudget > 0 ? ((amount / monthlyBudget) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-muted-foreground text-sm">No category budgets set</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
