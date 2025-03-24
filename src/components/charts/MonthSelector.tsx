
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type MonthSelectorProps = {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
};

export function MonthSelector({ 
  value, 
  onChange,
  minDate,
  maxDate
}: MonthSelectorProps) {
  const [open, setOpen] = useState(false);

  // Create a calendar that only shows months (not days)
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal"
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 opacity-50" />
            <span>{format(value, "MMMM yyyy")}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          initialFocus
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          ISOWeek
          className={cn("p-3 pointer-events-auto")}
          // Make the calendar show only months, not days
          captionLayout="dropdown-buttons"
          fromYear={2020}
          toYear={2030}
          showOutsideDays={false}
        />
      </PopoverContent>
    </Popover>
  );
}
