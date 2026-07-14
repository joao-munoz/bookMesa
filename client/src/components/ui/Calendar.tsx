import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface CalendarProps {
  highlightedDates: Date[];
  onDateClick: (date: Date) => void;
}

export function Calendar({ highlightedDates, onDateClick }: CalendarProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewMonth]);

  const highlightSet = useMemo(() => {
    const s = new Set<string>();
    for (const d of highlightedDates) {
      s.add(format(d, "yyyy-MM-dd"));
    }
    return s;
  }, [highlightedDates]);

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className="p-1 hover:bg-[#F5F4F0] rounded transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium capitalize">
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
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
          <div key={day} className="text-xs text-muted font-medium py-1">{day}</div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const isHighlighted = highlightSet.has(key);
          const inMonth = isSameMonth(day, viewMonth);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => inMonth && onDateClick(day)}
              className={cn(
                "w-9 h-9 rounded-md text-sm transition-all relative",
                !inMonth && "text-muted/30 pointer-events-none",
                isHighlighted && "bg-success/15 text-success font-medium border border-success",
                !isHighlighted && inMonth && "hover:bg-[#F5F4F0]",
              )}
            >
              {format(day, "d")}
              {isHighlighted && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-success" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
