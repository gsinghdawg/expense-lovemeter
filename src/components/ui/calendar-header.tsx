
import * as React from "react";
import { CaptionProps, useNavigation } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CalendarHeaderProps extends CaptionProps {
  fromYear?: number;
  toYear?: number;
}

export function CalendarHeader({ 
  displayMonth, 
  fromYear = 1900, 
  toYear = new Date().getFullYear() 
}: CalendarHeaderProps) {
  const currentYear = displayMonth.getFullYear();
  const currentMonth = displayMonth.getMonth();
  const years = Array.from(
    { length: toYear - fromYear + 1 }, 
    (_, i) => fromYear + i
  );

  // Get the navigate function from react-day-picker's hook
  const { goToMonth } = useNavigation();

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const handleYearChange = (year: string) => {
    const newMonth = new Date(displayMonth);
    newMonth.setFullYear(parseInt(year));
    goToMonth(newMonth);
  };

  const handleMonthChange = (month: string) => {
    const monthIndex = months.findIndex(m => m === month);
    if (monthIndex !== -1) {
      const newMonth = new Date(displayMonth);
      newMonth.setMonth(monthIndex);
      goToMonth(newMonth);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <Select
        value={months[currentMonth]}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="h-7 w-[100px] text-xs border-none font-medium">
          <SelectValue placeholder={months[currentMonth]} />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month} value={month} className="text-xs">
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={currentYear.toString()}
        onValueChange={handleYearChange}
      >
        <SelectTrigger className="h-7 w-[70px] text-xs border-none font-medium">
          <SelectValue placeholder={currentYear.toString()} />
        </SelectTrigger>
        <SelectContent className="max-h-[200px] overflow-y-auto">
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()} className="text-xs">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
