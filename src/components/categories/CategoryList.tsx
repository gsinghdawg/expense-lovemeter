
import { ExpenseCategory } from "@/types/expense";
import { CategoryItem } from "./CategoryItem";

type CategoryListProps = {
  categories: ExpenseCategory[];
  onEdit: (category: ExpenseCategory) => void;
  onDelete: (id: string) => void;
};

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No categories yet. Add your first category to start tracking expenses.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <CategoryItem 
          key={category.id} 
          category={category} 
          onEdit={onEdit} 
          onDelete={onDelete} 
        />
      ))}
    </div>
  );
}
