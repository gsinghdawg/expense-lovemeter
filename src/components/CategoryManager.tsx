
import { useState } from "react";
import { ExpenseCategory } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogHeader, DialogTitle, DialogContent, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const categorySchema = z.object({
  name: z.string().min(1, { message: "Category name is required" }).max(50, { message: "Category name is too long" }),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, { message: "Must be a valid hex color code" }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

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

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      color: "#000000",
    },
  });
  
  const handleOpenDialog = (category?: ExpenseCategory) => {
    setEditingCategory(category || null);
    form.reset(
      category 
        ? { name: category.name, color: category.color }
        : { name: "", color: "#000000" }
    );
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (data: CategoryFormValues) => {
    try {
      // Check if category name already exists (only for new categories)
      if (!editingCategory && categories.some(c => c.name.toLowerCase() === data.name.toLowerCase())) {
        form.setError("name", {
          type: "manual",
          message: "Category with this name already exists"
        });
        return;
      }

      if (editingCategory) {
        onUpdateCategory({
          ...editingCategory,
          ...data,
        });
        toast({
          title: "Category updated",
          description: `${data.name} category has been updated`,
        });
      } else {
        const newCategory = onAddCategory(data);
        toast({
          title: "Category added",
          description: `${data.name} category has been created`,
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem saving the category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = (id: string) => {
    const success = onDeleteCategory(id);
    if (!success) {
      toast({
        title: "Category is in use",
        description: "Cannot delete a category that is being used by expenses",
        variant: "destructive",
      });
    }
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
        {categories.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No categories yet. Add your first category to start tracking expenses.
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 rounded border"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(category)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dating, Gifts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: field.value }}
                        />
                        <Input type="color" {...field} className="w-20" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCategory ? "Update" : "Add"} Category
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
