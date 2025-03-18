
import { Expense, ExpenseCategory } from "@/types/expense";
import { format } from "date-fns";
import { Edit2, Trash2, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

type ExpenseItemProps = {
  expense: Expense;
  category: ExpenseCategory;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  alwaysShowActions?: boolean;
};

export function ExpenseItem({ 
  expense, 
  category, 
  onEdit, 
  onDelete, 
  alwaysShowActions = false 
}: ExpenseItemProps) {
  const expenseDate = expense.date instanceof Date ? expense.date : new Date(expense.date);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = () => {
    onDelete(expense.id);
    setShowDeleteConfirmation(false);
  };
  
  return (
    <>
      <Card className={`mb-3 gradient-card rounded-lg overflow-hidden ${alwaysShowActions ? '' : 'group'}`}>
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
                  {format(expenseDate, "PPP")} • {category.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-lg">${expense.amount.toFixed(2)}</p>
              <div className={`flex gap-1 ${alwaysShowActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
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
                  onClick={handleDeleteClick}
                  className="h-8 w-8 text-destructive hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense?
              <div className="mt-2 p-3 bg-gray-50 rounded-md dark:bg-gray-800">
                <p className="font-semibold">{expense.description}</p>
                <p className="text-sm text-muted-foreground">${expense.amount.toFixed(2)} • {format(expenseDate, "PPP")}</p>
              </div>
              <p className="mt-2 text-sm text-destructive">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
