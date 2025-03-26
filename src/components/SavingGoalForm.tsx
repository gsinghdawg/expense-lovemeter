
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

const savingGoalSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  purpose: z.string().min(1, { message: "Purpose is required" }).max(100, { message: "Purpose must be less than 100 characters" }),
});

type SavingGoalFormValues = z.infer<typeof savingGoalSchema>;

interface SavingGoalFormProps {
  onSubmit: (values: SavingGoalFormValues) => void;
}

export function SavingGoalForm({ onSubmit }: SavingGoalFormProps) {
  const form = useForm<SavingGoalFormValues>({
    resolver: zodResolver(savingGoalSchema),
    defaultValues: {
      amount: 0,
      purpose: "",
    },
  });

  const handleSubmit = (values: SavingGoalFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Saving Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                        placeholder="200.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose</FormLabel>
                    <FormControl>
                      <Input placeholder="Birthday gift" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full">
              Add Saving Goal
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
