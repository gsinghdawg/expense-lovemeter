
import { Expense, ExpenseCategory } from "@/types/expense";
import { format } from "date-fns";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ExpenseItemProps = {
  expense: Expense;
  category: ExpenseCategory;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
};

export function ExpenseItem({ expense, category, onEdit, onDelete }: ExpenseItemProps) {
  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: category.color }}
              />
              <h3 className="font-medium">{expense.description}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(expense.date, "PPP")} • {category.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-medium">${expense.amount.toFixed(2)}</p>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEdit(expense)}
                className="h-8 w-8"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete(expense.id)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
