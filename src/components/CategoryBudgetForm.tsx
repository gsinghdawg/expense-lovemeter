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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { PlusCircle, RotateCcw } from "lucide-react";
import { YearSelector } from "./charts/YearSelector";

type CategoryBudgetFormProps = {
  categories: ExpenseCategory[];
  monthlyBudget: number | null;
  month: number;
  year: number;
  existingCategoryBudgets: CategoryBudget[];
  onSaveBudgets: (budgets: Omit<CategoryBudget, 'id'>[]) => Promise<boolean>;
  isLoading: boolean;
  getBudgetForMonth: (month: number, year: number) => number | null;
  setFormMonth: (month: number) => void;
  setFormYear: (year: number) => void;
};

export function CategoryBudgetForm({
  categories,
  monthlyBudget,
  month,
  year,
  existingCategoryBudgets,
  onSaveBudgets,
  isLoading,
  getBudgetForMonth,
  setFormMonth,
  setFormYear
}: CategoryBudgetFormProps) {
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [localMonthBudget, setLocalMonthBudget] = useState<number | null>(monthlyBudget);
  
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

  // Update the local month budget when month/year changes or when monthlyBudget changes
  useEffect(() => {
    const budget = getBudgetForMonth(month, year);
    setLocalMonthBudget(budget);
  }, [month, year, getBudgetForMonth, monthlyBudget]);

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

  // Reset all category budgets
  const handleResetAllocations = () => {
    // Reset all allocations to 0
    const resetBudgets: Record<string, number> = {};
    
    // Keep the same categories but set values to 0
    Object.keys(categoryBudgets).forEach(categoryId => {
      resetBudgets[categoryId] = 0;
    });
    
    setCategoryBudgets(resetBudgets);
    setTotalAllocated(0);
    
    const { toast } = require("@/hooks/use-toast");
    toast({
      title: "Allocations reset",
      description: "All category allocations have been reset to zero",
    });
  };

  // Save all category budgets
  const handleSaveBudgets = async () => {
    if (localMonthBudget === null) {
      const { toast } = require("@/hooks/use-toast");
      toast({
        title: "Error",
        description: `Please set a monthly budget goal for ${monthNames[month]} ${year} first`,
        variant: "destructive",
      });
      return;
    }

    if (Math.abs(totalAllocated - localMonthBudget) > 0.01) {
      const { toast } = require("@/hooks/use-toast");
      toast({
        title: "Allocation mismatch",
        description: `The total allocated amount ($${totalAllocated.toFixed(2)}) must equal the monthly budget ($${localMonthBudget.toFixed(2)})`,
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
        // Always start with 0 amount for new categories
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
    if (localMonthBudget === null) return 0;
    return localMonthBudget - totalAllocated;
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

  const handleMonthChange = (value: string) => {
    setFormMonth(parseInt(value));
  };

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
                    Total: ${totalAllocated.toFixed(2)} / ${localMonthBudget ? localMonthBudget.toFixed(2) : "0.00"}
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
                              ({localMonthBudget ? ((amount / localMonthBudget) * 100).toFixed(1) : 0}%)
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
                            max={localMonthBudget || 0}
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
              
              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={handleResetAllocations}
                  disabled={isLoading || Object.keys(categoryBudgets).length === 0}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
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
        {/* Month and year selector */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Select value={month.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((monthName, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <YearSelector
              value={year}
              onChange={setFormYear}
              minYear={new Date().getFullYear() - 2}
              maxYear={new Date().getFullYear() + 2}
              className="w-[120px]"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {localMonthBudget === null ? (
              <span className="text-yellow-500">No budget set for this month</span>
            ) : (
              <span>Budget: ${localMonthBudget.toFixed(2)}</span>
            )}
          </div>
        </div>
        
        {existingCategoryBudgets.length > 0 ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm mb-2">
              <span>Total allocated: ${totalAllocated.toFixed(2)} / ${localMonthBudget?.toFixed(2) || "0.00"}</span>
              <span className={totalAllocated === localMonthBudget ? "text-green-500" : "text-yellow-500"}>
                {localMonthBudget !== null && totalAllocated === localMonthBudget ? "Budget fully allocated" : "Budget not fully allocated"}
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
                      ({localMonthBudget ? ((amount / localMonthBudget) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-muted-foreground text-sm">
              {localMonthBudget === null 
                ? `No budget set for ${monthNames[month]} ${year}` 
                : `No category budgets set for ${monthNames[month]} ${year}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
