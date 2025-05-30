
import { useState } from "react";
import { ExpenseCategory } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { CategoryForm } from "./categories/CategoryForm";
import { CategoryList } from "./categories/CategoryList";
import { CategoryDeleteConfirmation } from "./categories/CategoryDeleteConfirmation";

type CategoryManagerProps = {
  categories: ExpenseCategory[];
  onAddCategory: (category: Omit<ExpenseCategory, "id">) => ExpenseCategory;
  onUpdateCategory: (category: ExpenseCategory) => void;
  onDeleteCategory: (id: string) => boolean;
};

export function CategoryManager({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleOpenDialog = (category?: ExpenseCategory) => {
    setEditingCategory(category || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleOpenDeleteConfirm = (id: string) => {
    setCategoryToDelete(id);
  };
  
  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete);
      // Close the confirmation dialog immediately
      setCategoryToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setCategoryToDelete(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Expense Categories</CardTitle>
        <Button size="sm" onClick={() => handleOpenDialog()} className="h-8">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        <CategoryList 
          categories={categories} 
          onEdit={handleOpenDialog} 
          onDelete={handleOpenDeleteConfirm} 
        />
      </CardContent>

      <CategoryForm 
        categories={categories}
        editingCategory={editingCategory}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onAddCategory={onAddCategory}
        onUpdateCategory={onUpdateCategory}
      />

      <CategoryDeleteConfirmation 
        isOpen={!!categoryToDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
}
