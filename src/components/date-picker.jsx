"use client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function DatePicker({ date, onSelect, disabled = false, className }) {
  // Format date to YYYY-MM-DD for input element
  const formatDateForInput = (date) => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  // Handle date change from input
  const handleDateChange = (e) => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    onSelect(newDate);
  };

  return (
    <div className={cn("relative", className)}>
      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="date"
        value={formatDateForInput(date)}
        onChange={handleDateChange}
        disabled={disabled}
        className={cn("pl-10", !date && "text-muted-foreground")}
      />
    </div>
  );
}
