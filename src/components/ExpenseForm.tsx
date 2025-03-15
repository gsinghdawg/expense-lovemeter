
import React from "react";
import { useForm } from "react-hook-form";
import { ExpenseCategory } from "@/types/expense";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { defaultCategories } from "@/data/categories";

type ExpenseFormProps = {
  categories: ExpenseCategory[];
  onSubmit: (data: {
    amount: number;
    description: string;
    date: Date;
    categoryId: string;
  }) => void;
  defaultValues?: {
    amount: number;
    description: string;
    date: Date;
    categoryId: string;
  };
  submitLabel?: string;
};

export function ExpenseForm({ 
  categories, 
  onSubmit, 
  defaultValues, 
  submitLabel = "Add Expense" 
}: ExpenseFormProps) {
  // Ensure we always have a valid array of categories
  const availableCategories = categories && categories.length > 0 
    ? categories 
    : defaultCategories;
  
  // Make sure defaultValues.categoryId exists in the available categories
  // If not, set it to the first available category
  const categoryExists = availableCategories.some(
    category => category.id === (defaultValues?.categoryId || '')
  );
  
  // Ensure default values are properly set with valid categoryId
  const initialDefaultValues = {
    amount: 0,
    description: "",
    date: new Date(),
    categoryId: availableCategories[0]?.id || "other"
  };
  
  // Make sure the date is properly formatted as a Date object
  // And ensure the categoryId is valid (exists in available categories)
  const formattedDefaultValues = defaultValues ? {
    ...defaultValues,
    date: defaultValues.date instanceof Date 
      ? defaultValues.date 
      : new Date(defaultValues.date),
    categoryId: categoryExists ? defaultValues.categoryId : availableCategories[0]?.id || "other"
  } : initialDefaultValues;
  
  const form = useForm({
    defaultValues: formattedDefaultValues,
  });

  console.log("ExpenseForm defaultValues:", defaultValues);
  console.log("ExpenseForm formattedDefaultValues:", formattedDefaultValues);
  console.log("ExpenseForm availableCategories:", availableCategories);
  
  const handleSubmit = (data: {
    amount: number;
    description: string;
    date: Date;
    categoryId: string;
  }) => {
    // Ensure the date is a proper Date object
    console.log("Form submitting with date:", data.date);
    
    // Verify the category still exists, if not use the first available
    const categoryStillExists = availableCategories.some(
      category => category.id === data.categoryId
    );
    
    // Pass the data to the parent component
    onSubmit({
      ...data,
      date: data.date instanceof Date ? data.date : new Date(data.date),
      categoryId: categoryStillExists ? data.categoryId : availableCategories[0]?.id || "other"
    });
    
    // Reset the form if it's the Add Expense form
    if (submitLabel === "Add Expense") {
      form.reset({
        amount: 0,
        description: "",
        date: new Date(),
        categoryId: data.categoryId,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{submitLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Dinner date, gift, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      // Check if the selected category still exists
                      const categoryExists = availableCategories.some(
                        category => category.id === value
                      );
                      
                      // If it exists, use it; otherwise, use the first available
                      field.onChange(
                        categoryExists ? value : (availableCategories[0]?.id || "other")
                      );
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value instanceof Date ? field.value : new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value instanceof Date ? field.value : new Date(field.value)}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">{submitLabel}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
