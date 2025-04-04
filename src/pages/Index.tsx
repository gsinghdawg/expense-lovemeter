
import { useState } from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseSummary } from "@/components/ExpenseSummary";
import { CategoryManager } from "@/components/CategoryManager";
import { BudgetForm } from "@/components/BudgetForm";
import { CategoryBudgetForm } from "@/components/CategoryBudgetForm";
import { CategoryBudgetChart } from "@/components/charts/CategoryBudgetChart";
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
    categoryBudgets,
    isLoading,
    isAllocating,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    updateBudgetGoal,
    resetBudgetGoal,
    updateCategoryBudget,
    deleteCategoryBudget,
    bulkUpdateCategoryBudgets,
    getCategoryBudgetsForMonth,
    getCurrentMonthTotal,
    getBudgetForMonth,
    calculateAverageMonthlyExpense,
    getTotalSavings,
  } = useExpenses();

  const [activeTab, setActiveTab] = useState("dashboard");
  const { signOut, user } = useAuth();

  // State for category budget allocation month/year
  const [categoryBudgetMonth, setCategoryBudgetMonth] = useState<number>(new Date().getMonth());
  const [categoryBudgetYear, setCategoryBudgetYear] = useState<number>(new Date().getFullYear());

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Get current month and year for category budgets
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Get category budgets for the selected month and year
  const selectedMonthCategoryBudgets = getCategoryBudgetsForMonth(categoryBudgetMonth, categoryBudgetYear);

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
                  onResetBudget={resetBudgetGoal}
                />
                
                {/* Category Budget Form with month/year selection */}
                <CategoryBudgetForm
                  categories={categories}
                  monthlyBudget={getBudgetForMonth(categoryBudgetMonth, categoryBudgetYear)}
                  month={categoryBudgetMonth}
                  year={categoryBudgetYear}
                  existingCategoryBudgets={selectedMonthCategoryBudgets}
                  onSaveBudgets={(budgets) => bulkUpdateCategoryBudgets(budgets, getBudgetForMonth(categoryBudgetMonth, categoryBudgetYear))}
                  isLoading={isAllocating}
                  getBudgetForMonth={getBudgetForMonth}
                  setFormMonth={setCategoryBudgetMonth}
                  setFormYear={setCategoryBudgetYear}
                />
                
                {/* Category Budget Chart */}
                {selectedMonthCategoryBudgets.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Category Budget Usage</h3>
                    <CategoryBudgetChart
                      categoryBudgets={selectedMonthCategoryBudgets}
                      categories={categories}
                      expenses={expenses}
                      month={categoryBudgetMonth}
                      year={categoryBudgetYear}
                      getCategoryById={getCategoryById}
                    />
                  </div>
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
