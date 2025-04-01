
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseSummary } from "@/components/ExpenseSummary";
import { CategoryManager } from "@/components/CategoryManager";
import { BudgetForm } from "@/components/BudgetForm";
import { CategoryBudgetForm } from "@/components/budget/CategoryBudgetForm";
import { RecentTransactions } from "@/components/RecentTransactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { defaultCategories } from "@/data/categories";

const Index = () => {
  const {
    expenses,
    categories,
    budgetGoal,
    budgetGoalsData,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    updateBudgetGoal,
    getCurrentMonthTotal,
    getCurrentMonthExpenses,
    getBudgetForMonth,
    calculateAverageMonthlyExpense,
    getTotalSavings,
    // Category budget properties and methods
    categoryBudgets,
    setCategoryBudget,
    deleteCategoryBudget,
    totalCategoryBudget,
  } = useExpenses();

  const [activeTab, setActiveTab] = useState("dashboard");
  const { signOut, user } = useAuth();

  // Calculate expenses by category for the current month
  const currentMonthExpensesByCategory = useMemo(() => {
    const currentMonthExpenses = getCurrentMonthExpenses();
    const expensesByCategory: Record<string, number> = {};
    
    currentMonthExpenses.forEach(expense => {
      const categoryId = expense.categoryId;
      expensesByCategory[categoryId] = (expensesByCategory[categoryId] || 0) + expense.amount;
    });
    
    return expensesByCategory;
  }, [expenses, getCurrentMonthExpenses]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6">
      <div className="app-container">
        <div className="flex flex-col items-center mb-8 relative">
          <div className="absolute right-0 top-0">
            <ThemeSwitcher />
          </div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            DatingLedger
            <Sparkles className="h-6 w-6 text-amber-500" />
          </h1>
          <h2 className="text-muted-foreground text-sm italic mb-2">Your Finance Companion</h2>
          
          <div className="mt-2 flex items-center">
            {user && (
              <div className="text-sm text-muted-foreground mr-3">
                Logged in as: {user.email}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8 w-full max-w-md mx-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <ExpenseForm
                  categories={categories}
                  onSubmit={addExpense}
                />
                <BudgetForm 
                  currentBudget={budgetGoal}
                  budgetGoalsData={budgetGoalsData}
                  onUpdateBudget={updateBudgetGoal}
                />
                {budgetGoal.amount !== null && (
                  <CategoryBudgetForm
                    categories={categories}
                    categoryBudgets={categoryBudgets}
                    setCategoryBudget={setCategoryBudget}
                    deleteCategoryBudget={deleteCategoryBudget}
                    budgetGoal={budgetGoal}
                    currentMonthExpensesByCategory={currentMonthExpensesByCategory}
                    totalCategoryBudget={totalCategoryBudget}
                  />
                )}
                <RecentTransactions
                  expenses={expenses}
                  categories={categories}
                  getCategoryById={getCategoryById}
                  onEditExpense={updateExpense}
                  onDeleteExpense={deleteExpense}
                  limit={3}
                />
              </div>
              <ExpenseSummary
                expenses={expenses}
                categories={categories}
                getCategoryById={getCategoryById}
                budgetGoal={budgetGoal}
                currentMonthTotal={getCurrentMonthTotal()}
                getBudgetForMonth={getBudgetForMonth}
                calculateAverageMonthlyExpense={calculateAverageMonthlyExpense}
                totalSavings={getTotalSavings()}
              />
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseList
              expenses={expenses}
              categories={categories}
              getCategoryById={getCategoryById}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManager
              categories={categories}
              onAddCategory={addCategory}
              onUpdateCategory={updateCategory}
              onDeleteCategory={deleteCategory}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
