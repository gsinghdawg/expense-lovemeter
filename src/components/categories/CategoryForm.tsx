
import { useState } from "react";
import { ExpenseCategory } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogContent, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const categorySchema = z.object({
  name: z.string().min(1, { message: "Category name is required" }).max(50, { message: "Category name is too long" }),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, { message: "Must be a valid hex color code" }),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

type CategoryFormProps = {
  categories: ExpenseCategory[];
  editingCategory: ExpenseCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (category: Omit<ExpenseCategory, "id">) => ExpenseCategory;
  onUpdateCategory: (category: ExpenseCategory) => void;
};

export function CategoryForm({
  categories,
  editingCategory,
  isOpen,
  onClose,
  onAddCategory,
  onUpdateCategory,
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: editingCategory ? editingCategory.name : "",
      color: editingCategory ? editingCategory.color : "#000000",
    },
  });
  
  // Reset form when editing category changes
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: editingCategory ? editingCategory.name : "",
        color: editingCategory ? editingCategory.color : "#000000",
      });
    }
  }, [editingCategory, isOpen, form]);
  
  const handleSubmit = (data: CategoryFormValues) => {
    try {
      // Check if category name already exists (only for new categories or if name was changed)
      const nameExists = categories.some(c => 
        c.name.toLowerCase() === data.name.toLowerCase() && 
        (!editingCategory || c.id !== editingCategory.id)
      );
      
      if (nameExists) {
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
      } else {
        // The data from the form is already validated by Zod, so name and color are guaranteed to be defined
        const categoryToAdd: Omit<ExpenseCategory, "id"> = {
          name: data.name,
          color: data.color
        };
        
        onAddCategory(categoryToAdd);
      }
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem saving the category",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                    <Input placeholder="e.g., Dating Apps, Subscription" {...field} />
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
              <Button type="button" variant="outline" onClick={onClose}>
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
  );
}
