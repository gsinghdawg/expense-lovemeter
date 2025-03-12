
import { Expense, ExpenseCategory } from "@/types/expense";
import { format } from "date-fns";
import { Edit2, Trash2, DollarSign } from "lucide-react";
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
    <Card className="mb-3 gradient-card rounded-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-start gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mt-1" 
              style={{ backgroundColor: category.color + "33" }} // Adding transparency
            >
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center" 
                style={{ backgroundColor: category.color }}
              >
                <DollarSign className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-medium">{expense.description}</h3>
              <p className="text-sm text-muted-foreground">
                {format(expense.date, "PPP")} • {category.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-lg">${expense.amount.toFixed(2)}</p>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEdit(expense)}
                className="h-8 w-8 hover:bg-gray-100"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete(expense.id)}
                className="h-8 w-8 text-destructive hover:bg-red-50"
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
