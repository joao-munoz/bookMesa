import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Loader2, TrendingUp, CalendarDays, MapPin, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../lib/api";
import { ptBR } from "date-fns/locale";

interface UsageReport {
  total: number;
  deskUsage: { label: string; count: number }[];
  byDate: { date: string; _count: number }[];
}

interface PeakTime {
  date: string;
  count: number;
}

export default function Reports() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(today, "yyyy-MM"));
  const [viewDate, setViewDate] = useState<string | null>(null);

  const monthStart = startOfMonth(new Date(selectedMonth + "-01T12:00:00"));
  const monthEnd = endOfMonth(monthStart);
  const startStr = format(monthStart, "yyyy-MM-dd");
  const endStr = format(monthEnd, "yyyy-MM-dd");

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["report-usage", startStr, endStr],
    queryFn: () =>
      api
        .get<UsageReport>("/reports/usage", { params: { start: startStr, end: endStr } })
        .then((r) => r.data),
  });

  const { data: peakTimes } = useQuery({
    queryKey: ["report-peak"],
    queryFn: () => api.get<PeakTime[]>("/reports/peak-times").then((r) => r.data),
  });

  const { data: dayReservations } = useQuery({
    queryKey: ["report-day", viewDate],
    queryFn: () =>
      api.get("/reservations", { params: { date: viewDate } }).then((r) => r.data),
    enabled: !!viewDate,
  });

  const prevMonth = () => {
    const d = new Date(monthStart);
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(format(d, "yyyy-MM"));
  };

  const nextMonth = () => {
    const d = new Date(monthStart);
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(format(d, "yyyy-MM"));
  };

  if (usageLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary">relatorios</h1>
          <p className="text-sm text-muted mt-1">visao geral de uso do escritorio</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-sm hover:bg-[#F5F4F0] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <select
            value={String(monthStart.getMonth())}
            onChange={(e) => {
              const d = new Date(monthStart);
              d.setMonth(Number(e.target.value));
              setSelectedMonth(format(d, "yyyy-MM"));
            }}
            className="h-8 px-2 rounded-md border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50 capitalize"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {format(new Date(2000, i), "MMMM", { locale: ptBR })}
              </option>
            ))}
          </select>
          <select
            value={String(monthStart.getFullYear())}
            onChange={(e) => {
              const d = new Date(monthStart);
              d.setFullYear(Number(e.target.value));
              setSelectedMonth(format(d, "yyyy-MM"));
            }}
            className="h-8 px-2 rounded-md border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = today.getFullYear() - 2 + i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border text-sm hover:bg-[#F5F4F0] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center">
              <CalendarDays size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-2xl font-serif font-medium">{usage?.total || 0}</p>
              <p className="text-xs text-muted">reservas no mes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center">
              <MapPin size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-2xl font-serif font-medium">{usage?.deskUsage.length || 0}</p>
              <p className="text-xs text-muted">mesas utilizadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="border border-border">
          <CardHeader>
            <h2 className="font-display font-semibold">mesas mais usadas</h2>
          </CardHeader>
          <CardContent>
            {usage?.deskUsage.length === 0 ? (
              <p className="text-sm text-muted">nenhum dado disponivel</p>
            ) : (
              <div className="space-y-2">
                {usage?.deskUsage.slice(0, 5).map((d) => (
                  <div key={d.label} className="flex items-center justify-between">
                    <span className="text-sm">{d.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-[#F5F4F0] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{
                            width: `${Math.min(
                              100,
                              (d.count / Math.max(...usage.deskUsage.map((x) => x.count))) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted w-6 text-right">{d.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <h2 className="font-display font-semibold">picos de reserva (top 10 dias)</h2>
        </CardHeader>
        <CardContent>
          {!peakTimes || peakTimes.length === 0 ? (
            <p className="text-sm text-muted">nenhum dado disponivel</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {peakTimes.map((p) => (
                <div key={p.date} className="p-3 rounded-md bg-[#F5F4F0] text-center">
                  <p className="text-xs text-muted">
                    {new Date(p.date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-lg font-serif font-medium text-primary">{p.count}</p>
                  <p className="text-xs text-muted">reservas</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewDate(p.date)}
                    className="mt-1 text-xs"
                  >
                    <Eye size={12} className="mr-1" /> ver mapa
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {viewDate && (
        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="font-display font-semibold">
              mapa em {new Date(viewDate + "T12:00:00").toLocaleDateString("pt-BR")}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setViewDate(null)}>
              fechar
            </Button>
          </CardHeader>
          <CardContent>
            {dayReservations?.length === 0 ? (
              <p className="text-sm text-muted">nenhuma reserva neste dia</p>
            ) : (
              <div className="text-sm space-y-1">
                {dayReservations?.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-2 p-2 rounded-md bg-[#F5F4F0]">
                    <MapPin size={14} className="text-muted" />
                    <span className="font-medium">{r.desk?.label}</span>
                    <span className="text-muted">—</span>
                    <span>{r.user?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
