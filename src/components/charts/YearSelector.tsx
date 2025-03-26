
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type YearSelectorProps = {
  value: number;
  onChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
  className?: string;
};

export function YearSelector({ 
  value, 
  onChange, 
  minYear, 
  maxYear,
  className
}: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const effectiveMinYear = minYear || currentYear - 5;
  const effectiveMaxYear = maxYear || currentYear;

  const handlePrevious = () => {
    if (value > effectiveMinYear) {
      onChange(value - 1);
    }
  };

  const handleNext = () => {
    if (value < effectiveMaxYear) {
      onChange(value + 1);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className || ''}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={value <= effectiveMinYear}
        className="h-8 w-8"
        aria-label="Previous year"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous year</span>
      </Button>
      <span className="text-sm font-medium">{value}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={value >= effectiveMaxYear}
        className="h-8 w-8"
        aria-label="Next year"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next year</span>
      </Button>
    </div>
  );
}
