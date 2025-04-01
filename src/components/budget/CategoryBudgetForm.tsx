
import { useState, useEffect } from "react";
import { CategoryBudget, ExpenseCategory, BudgetGoal } from "@/types/expense";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Trash2, PlusCircle } from "lucide-react";
import { CategoryBudgetChart } from "@/components/charts/CategoryBudgetChart";

interface CategoryBudgetFormProps {
  categories: ExpenseCategory[];
  categoryBudgets: CategoryBudget[];
  setCategoryBudget: (budget: Omit<CategoryBudget, "id">) => void;
  deleteCategoryBudget: (id: string) => void;
  budgetGoal: BudgetGoal;
  currentMonthExpensesByCategory: Record<string, number>;
  totalCategoryBudget: number;
}

export function CategoryBudgetForm({
  categories,
  categoryBudgets,
  setCategoryBudget,
  deleteCategoryBudget,
  budgetGoal,
  currentMonthExpensesByCategory,
  totalCategoryBudget
}: CategoryBudgetFormProps) {
  const [newBudgetCategory, setNewBudgetCategory] = useState<string>("");
  const [newBudgetAmount, setNewBudgetAmount] = useState<string>("");
  
  // Calculate the remaining budget that can be allocated
  const remainingBudget = budgetGoal.amount !== null 
    ? budgetGoal.amount - totalCategoryBudget
    : 0;
  
  // Get already budgeted categories
  const budgetedCategoryIds = categoryBudgets.map(budget => budget.categoryId);
  
  // Filter available categories (those not already budgeted)
  const availableCategories = categories.filter(
    category => !budgetedCategoryIds.includes(category.id)
  );

  // Handle adding a new category budget
  const handleAddCategoryBudget = () => {
    if (!newBudgetCategory) {
      toast({
        title: "Missing category",
        description: "Please select a category for the budget",
        variant: "destructive",
      });
      return;
    }
    
    if (!newBudgetAmount || parseFloat(newBudgetAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than zero",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(newBudgetAmount);
    
    // Check if adding this would exceed the total budget
    if (budgetGoal.amount !== null && totalCategoryBudget + amount > budgetGoal.amount) {
      toast({
        title: "Budget exceeded",
        description: `This would exceed your total budget by $${(totalCategoryBudget + amount - budgetGoal.amount).toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }
    
    setCategoryBudget({
      categoryId: newBudgetCategory,
      amount,
      month: budgetGoal.month,
      year: budgetGoal.year
    });
    
    // Reset form
    setNewBudgetCategory("");
    setNewBudgetAmount("");
  };

  // Handle updating an existing category budget
  const handleUpdateCategoryBudget = (budget: CategoryBudget, newAmount: string) => {
    const amount = parseFloat(newAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than zero",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate the difference between the new and old amounts
    const difference = amount - budget.amount;
    
    // Check if updating this would exceed the total budget
    if (budgetGoal.amount !== null && totalCategoryBudget + difference > budgetGoal.amount) {
      toast({
        title: "Budget exceeded",
        description: `This would exceed your total budget by $${(totalCategoryBudget + difference - budgetGoal.amount).toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }
    
    setCategoryBudget({
      categoryId: budget.categoryId,
      amount,
      month: budgetGoal.month,
      year: budgetGoal.year
    });
  };

  // Calculate the total monthly budget
  const totalMonthlyBudget = budgetGoal.amount || 0;
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Category Budget Allocation</CardTitle>
        <CardDescription>
          Distribute your {months[budgetGoal.month]} {budgetGoal.year} budget across categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget allocation progress */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <p className="text-sm font-medium">Budget Allocation</p>
            <p className="text-sm">
              ${totalCategoryBudget.toFixed(2)} / ${totalMonthlyBudget.toFixed(2)}
            </p>
          </div>
          <Progress 
            value={totalMonthlyBudget > 0 ? (totalCategoryBudget / totalMonthlyBudget) * 100 : 0} 
          />
          <p className="text-sm text-muted-foreground">
            {remainingBudget > 0 
              ? `You have $${remainingBudget.toFixed(2)} left to allocate` 
              : remainingBudget < 0 
                ? `You've over-allocated by $${Math.abs(remainingBudget).toFixed(2)}` 
                : "You've allocated your entire budget"
            }
          </p>
        </div>

        {/* Category budget visualization */}
        {categoryBudgets.length > 0 && (
          <div className="mt-4">
            <CategoryBudgetChart 
              categoryBudgets={categoryBudgets}
              categories={categories}
              currentMonthExpensesByCategory={currentMonthExpensesByCategory}
            />
          </div>
        )}

        {/* List of existing category budgets */}
        {categoryBudgets.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="text-sm font-medium">Allocated Budgets</h3>
            {categoryBudgets.map((budget) => {
              const category = categories.find(c => c.id === budget.categoryId);
              const spent = currentMonthExpensesByCategory[budget.categoryId] || 0;
              const spentPercentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
              const isOverBudget = spent > budget.amount;
              
              return (
                <div 
                  key={budget.id} 
                  className="flex flex-col space-y-2 p-3 border rounded-md"
                  style={{ borderLeftColor: category?.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category?.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteCategoryBudget(budget.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={budget.amount}
                      onChange={(e) => handleUpdateCategoryBudget(budget, e.target.value)}
                      className="max-w-[120px]"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Spent: ${spent.toFixed(2)}</span>
                      <span 
                        className={isOverBudget ? "text-red-500 font-medium" : ""}
                      >
                        {spentPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={spentPercentage} 
                      className={isOverBudget ? "bg-red-200" : ""}
                      indicatorClassName={isOverBudget ? "bg-red-500" : ""}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Form to add new category budget */}
        {availableCategories.length > 0 && remainingBudget > 0 && (
          <div className="space-y-3 mt-4 p-4 border rounded-md">
            <h3 className="text-sm font-medium">Add New Category Budget</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newBudgetCategory} 
                  onValueChange={setNewBudgetCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                      >
                        <div className="flex items-center">
                          <div 
                            className="h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="amount">Amount</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newBudgetAmount}
                    onChange={(e) => setNewBudgetAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleAddCategoryBudget}
                className="w-full"
                disabled={!newBudgetCategory || !newBudgetAmount || parseFloat(newBudgetAmount) <= 0}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Category Budget
              </Button>
            </div>
          </div>
        )}
        
        {availableCategories.length === 0 && categoryBudgets.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            All categories have been allocated a budget.
          </p>
        )}
        
        {budgetGoal.amount === null && (
          <p className="text-sm text-muted-foreground mt-2">
            Set a monthly budget goal first to allocate budgets by category.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
