
import { ExpenseCategory } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type CategoryItemProps = {
  category: ExpenseCategory;
  onEdit: (category: ExpenseCategory) => void;
  onDelete: (id: string) => void;
};

export function CategoryItem({ category, onEdit, onDelete }: CategoryItemProps) {
  return (
    <div className="p-2 rounded border">
      <ScrollArea className="w-full">
        <div className="flex items-center justify-between min-w-max">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span>{category.name}</span>
          </div>
          <div className="flex gap-1 !opacity-100 pl-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(category)}
              className="h-8 w-8"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(category.id)}
              className="h-8 w-8 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
