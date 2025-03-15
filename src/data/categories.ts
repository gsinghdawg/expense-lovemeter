
import { ExpenseCategory } from "@/types/expense";

export const defaultCategories: ExpenseCategory[] = [
  {
    id: "default-food",
    name: "Food",
    color: "#FF5757"
  },
  {
    id: "default-transportation",
    name: "Transportation",
    color: "#8AA9FF"
  },
  {
    id: "default-entertainment",
    name: "Entertainment",
    color: "#53D769"
  },
  {
    id: "default-shopping",
    name: "Shopping",
    color: "#FFD653"
  },
  {
    id: "default-housing",
    name: "Housing",
    color: "#AF52DE"
  },
  {
    id: "default-utilities",
    name: "Utilities",
    color: "#5AC8FA"
  },
  {
    id: "default-subscriptions",
    name: "Subscriptions",
    color: "#FF9500"
  },
  {
    id: "default-health",
    name: "Health",
    color: "#FF2D55"
  },
  {
    id: "default-other",
    name: "Other",
    color: "#8E8E93"
  }
];

export function getCategoryById(categories: ExpenseCategory[], id: string): ExpenseCategory | undefined {
  return categories.find(category => category.id === id);
}
