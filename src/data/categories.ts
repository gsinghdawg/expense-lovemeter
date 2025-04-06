
import { ExpenseCategory } from "@/types/expense";

export const defaultCategories: ExpenseCategory[] = [
  { id: "subscriptions", name: "Subscriptions", color: "#5C8DFF" },
  { id: "shopping", name: "Shopping", color: "#5CFFC7" },
  { id: "entertainment", name: "Entertainment", color: "#D45CFF" },
  { id: "transportation", name: "Transportation", color: "#5CFFFF" },
  { id: "food-drinks", name: "Food & Drinks", color: "#FF9F5C" },
  { id: "dating-apps", name: "Dating Apps", color: "#FF5C8D" },
  { id: "travelling", name: "Travelling", color: "#8A2BE2" },
  { id: "gifts", name: "Gifts", color: "#FF5C5C" },
  { id: "personal-care", name: "Personal Care", color: "#FFA07A" },
  { id: "other", name: "Other", color: "#999999" }, // Keeping the fallback category
];
