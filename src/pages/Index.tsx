
import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseSummary } from "@/components/ExpenseSummary";
import { CategoryManager } from "@/components/CategoryManager";
import { BudgetForm } from "@/components/BudgetForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  } = useExpenses();

  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Personal Expense Tracker</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
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
  );
};

export default Index;
