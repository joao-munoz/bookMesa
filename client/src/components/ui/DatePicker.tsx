import { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: Date;
}

export function DatePicker({ value, onChange, minDate }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(value + "T12:00:00");
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      const d = new Date(value + "T12:00:00");
      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [open, value]);

  const selectedDate = new Date(value + "T12:00:00");
  const today = new Date();

  const days: Date[] = [];
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const canSelect = (day: Date) => {
    if (minDate && day < minDate) return false;
    if (day.getDay() === 0 || day.getDay() === 6) return false;
    return true;
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-10 px-3 rounded-md border border-border bg-surface text-sm hover:border-accent transition-colors"
      >
        <CalendarDays size={16} className="text-accent" />
        <span className="font-medium min-w-[130px] text-left">
          {format(selectedDate, "EEE, dd/MM", { locale: ptBR })}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 z-50 bg-surface rounded-lg border border-border shadow-lg p-3 w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              className="p-1 hover:bg-[#F5F4F0] rounded transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium">
              {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              className="p-1 hover:bg-[#F5F4F0] rounded transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="text-xs text-muted font-medium py-1">{day}</div>
            ))}
            {days.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const inMonth = isSameMonth(day, viewMonth);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const selectable = inMonth && canSelect(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={!selectable}
                  onClick={() => {
                    if (selectable) {
                      onChange(format(day, "yyyy-MM-dd"));
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    "w-9 h-9 rounded-md text-sm transition-all",
                    !inMonth && "text-muted/30",
                    isWeekend && "text-muted/40",
                    isSelected && "bg-accent text-primary font-medium",
                    !isSelected && selectable && "hover:bg-[#F5F4F0]",
                    !selectable && "cursor-not-allowed"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
