
import { useState } from "react";
import { Link } from "react-router-dom";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseSummary } from "@/components/ExpenseSummary";
import { CategoryManager } from "@/components/CategoryManager";
import { BudgetForm } from "@/components/BudgetForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";

const Index = () => {
  const {
    expenses,
    categories,
    budgetGoal,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    updateBudgetGoal,
    getCurrentMonthTotal,
    getBudgetForMonth,
  } = useExpenses();

  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="py-8 px-4 sm:px-6">
      <div className="app-container">
        <div className="flex flex-col items-center mb-8 relative">
          <div className="absolute right-0 top-0">
            <ThemeSwitcher />
          </div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            LadyLedger
            <Sparkles className="h-6 w-6 text-amber-500" />
          </h1>
          <h2 className="text-muted-foreground text-sm italic mb-2">Your Finance Companion</h2>
          
          <div className="mt-2">
            <Link to="/signup">
              <Button variant="outline" size="sm">
                Create Account
              </Button>
            </Link>
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
                  onUpdateBudget={updateBudgetGoal}
                />
              </div>
              <ExpenseSummary
                expenses={expenses}
                categories={categories}
                getCategoryById={getCategoryById}
                budgetGoal={budgetGoal}
                currentMonthTotal={getCurrentMonthTotal()}
                getBudgetForMonth={getBudgetForMonth}
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
