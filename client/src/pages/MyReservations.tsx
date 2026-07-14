import { useState, useMemo } from "react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useMyReservations, useDeleteReservation, useCheckinReservation, useCheckoutReservation } from "../hooks/useReservations";
import { useMyLockerReservations, useCheckinLockerReservation, useDeleteLockerReservation, useCheckoutLockerReservation } from "../hooks/useLockers";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Calendar } from "../components/ui/Calendar";
import { Loader2, CalendarDays, MapPin, Trash2, ChevronLeft, ChevronRight, CheckCircle, Luggage } from "lucide-react";
import { cn } from "../lib/utils";

const statusLabel: Record<string, { label: string; variant: "warning" | "info" | "danger" | "default" | "completed" }> = {
  pending: { label: "pendente", variant: "warning" },
  checked_in: { label: "check-in realizado", variant: "info" },
  missed: { label: "perdido", variant: "danger" },
  cancelled: { label: "cancelado", variant: "default" },
  completed: { label: "concluído", variant: "completed" },
};

const today = new Date();
const todayStr = format(today, "yyyy-MM-dd");

function isWithinCheckinWindow(startTime: string, date: string): boolean {
  if (date !== todayStr) return false;
  const now = new Date();
  const [h, m] = startTime.split(":").map(Number);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const diff = (now.getTime() - start.getTime()) / 60000;
  return diff >= -30 && diff <= 30;
}

export default function MyReservations() {
  const { data: reservations, isLoading } = useMyReservations();
  const { data: lockerReservations } = useMyLockerReservations();
  const deleteReservation = useDeleteReservation();
  const checkinReservation = useCheckinReservation();
  const checkoutReservation = useCheckoutReservation();
  const checkinLocker = useCheckinLockerReservation();
  const checkoutLocker = useCheckoutLockerReservation();
  const deleteLockerReservation = useDeleteLockerReservation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"monthly" | "weekly">("monthly");
  const [weekOffset, setWeekOffset] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; type: "desk" | "locker" } | null>(null);
  const [confirmCheckout, setConfirmCheckout] = useState<{ id: number; type: "desk" | "locker" } | null>(null);

  const goToMap = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    navigate(key === format(today, "yyyy-MM-dd") ? "/" : `/?date=${key}`);
  };

  const weekStart = startOfWeek(weekOffset === 0 ? today : addWeeks(today, weekOffset), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    let d = weekStart;
    while (d <= weekEnd) {
      days.push(d);
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return days;
  }, [weekStart, weekEnd]);

  const highlightedDates = useMemo(() => {
    if (!reservations) return [];
    return reservations.map((r) => new Date(r.date + "T12:00:00"));
  }, [reservations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  const grouped = (reservations || []).reduce<Record<string, typeof reservations>>((acc: any, r: any) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  const allReservations = [...(reservations || []), ...(lockerReservations || [])].sort(
    (a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary">minhas reservas</h1>
          <p className="text-sm text-muted mt-1">
            {allReservations.length} reserva(s) encontrada(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("monthly")}
            className={cn("px-3 py-1.5 rounded-md text-sm border transition-colors", viewMode === "monthly" ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-[#F5F4F0]")}
          >
            mensal
          </button>
          <button
            onClick={() => setViewMode("weekly")}
            className={cn("px-3 py-1.5 rounded-md text-sm border transition-colors", viewMode === "weekly" ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-[#F5F4F0]")}
          >
            semanal
          </button>
        </div>
      </div>

      {viewMode === "weekly" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 hover:bg-[#F5F4F0] rounded transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium">
              {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} — {format(weekEnd, "dd 'de' MMMM yyyy", { locale: ptBR })}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1 hover:bg-[#F5F4F0] rounded transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayRes = reservations?.filter((r) => r.date === key) || [];
              const isToday = isSameDay(day, today);
              return (
                <Card key={key} className={cn("border cursor-pointer hover:shadow-md transition-shadow", isToday && "ring-1 ring-accent", dayRes.length > 0 && "border-success")} onClick={() => goToMap(day)}>
                  <CardContent className="p-2 text-center">
                    <p className="text-xs text-muted mb-1">{format(day, "EEE", { locale: ptBR })}</p>
                    <p className={cn("text-lg font-semibold", isToday && "text-accent")}>{format(day, "d")}</p>
                    {dayRes.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {dayRes.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between gap-1 px-1 py-0.5 rounded bg-accent/5">
                            <span className="text-xs truncate">{r.desk?.label} {r.startTime?.slice(0, 5)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted/50 mt-2">—</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <Calendar
            highlightedDates={highlightedDates}
            onDateClick={goToMap}
          />
          <div className="space-y-4">
            {allReservations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarDays size={40} className="mx-auto text-muted/50 mb-3" />
                  <p className="text-muted">nenhuma reserva encontrada.</p>
                  <p className="text-sm text-muted/70 mt-1">reserve uma mesa no mapa do escritorio.</p>
                </CardContent>
              </Card>
            ) : (
              allReservations.map((res: any) => {
                const st = statusLabel[res.status] || statusLabel.pending;
                const isDesk = !!res.desk;
                const canCheckin = res.status === "pending" && isWithinCheckinWindow(res.startTime, res.date);

                return (
                  <Card key={res.id} className="border border-border">
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center">
                          {isDesk ? <MapPin size={18} className="text-accent" /> : <Luggage size={18} className="text-accent" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{isDesk ? `Mesa ${res.desk?.label}` : `Locker ${res.locker?.label}`}</p>
                          <p className="text-xs text-muted">
                            {new Date(res.date + "T12:00:00").toLocaleDateString("pt-BR")} &middot; {res.startTime?.slice(0, 5)}–{res.endTime?.slice(0, 5)}
                          </p>
                          <Badge variant={st.variant} className="mt-1">{st.label}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canCheckin && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                              try {
                                if (isDesk) {
                                  await checkinReservation.mutateAsync(res.id);
                                } else {
                                  await checkinLocker.mutateAsync(res.id);
                                }
                              } catch {}
                            }}
                            disabled={checkinReservation.isPending || checkinLocker.isPending}
                          >
                            <CheckCircle size={14} className="mr-1" /> check-in
                          </Button>
                        )}
                        {res.status === "checked_in" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setConfirmCheckout({ id: res.id, type: isDesk ? "desk" : "locker" })}
                            disabled={checkoutReservation.isPending || checkoutLocker.isPending}
                          >
                            <CheckCircle size={14} className="mr-1" /> check-out
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete({ id: res.id, type: isDesk ? "desk" : "locker" })}
                          className="text-muted hover:text-danger"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          try {
            if (confirmDelete.type === "desk") {
              await deleteReservation.mutateAsync(confirmDelete.id);
            } else {
              await deleteLockerReservation.mutateAsync(confirmDelete.id);
            }
          } catch {}
          setConfirmDelete(null);
        }}
        title="Cancelar reserva"
        message="Tem certeza que deseja cancelar esta reserva?"
        confirmText="cancelar reserva"
        variant="danger"
        loading={deleteReservation.isPending || deleteLockerReservation.isPending}
      />

      <ConfirmModal
        open={!!confirmCheckout}
        onClose={() => setConfirmCheckout(null)}
        onConfirm={async () => {
          if (!confirmCheckout) return;
          try {
            if (confirmCheckout.type === "desk") {
              await checkoutReservation.mutateAsync(confirmCheckout.id);
            } else {
              await checkoutLocker.mutateAsync(confirmCheckout.id);
            }
          } catch {}
          setConfirmCheckout(null);
        }}
        title="Fazer check-out"
        message="Tem certeza que deseja fazer check-out?"
        confirmText="fazer check-out"
        variant="primary"
        loading={checkoutReservation.isPending || checkoutLocker.isPending}
      />
    </div>
  );
}
