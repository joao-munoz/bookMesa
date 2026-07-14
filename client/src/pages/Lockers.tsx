import { useState } from "react";
import { format } from "date-fns";
import { useLockers, useLockerReservations, useMyLockerReservations, useCreateLockerReservation, useDeleteLockerReservation, useCheckinLockerReservation, useCheckoutLockerReservation } from "../hooks/useLockers";
import { useAuth } from "../context/AuthContext";
import { DatePicker } from "../components/ui/DatePicker";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Badge } from "../components/ui/badge";
import { Loader2, Luggage, CheckCircle, CalendarDays, Trash2, AlertTriangle } from "lucide-react";

export default function Lockers() {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedLocker, setSelectedLocker] = useState<{ id: number; label: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);

  const { data: lockers, isLoading } = useLockers();
  const { data: reservations } = useLockerReservations(selectedDate);
  const { data: myReservations } = useMyLockerReservations();
  const createReservation = useCreateLockerReservation();
  const deleteReservation = useDeleteLockerReservation();
  const checkinReservation = useCheckinLockerReservation();
  const checkoutReservation = useCheckoutLockerReservation();
  const [confirmCheckout, setConfirmCheckout] = useState<number | null>(null);

  const lockerReservationMap = new Map((reservations || []).map((r) => [r.lockerId, r]));

  const handleReserve = async () => {
    if (!selectedLocker) return;
    if (startTime >= endTime) {
      setErrorMsg("Horário de início deve ser anterior ao horário de fim");
      return;
    }
    try {
      await createReservation.mutateAsync({ lockerId: selectedLocker.id, date: selectedDate, startTime, endTime });
      setShowConfirm(false);
      setSelectedLocker(null);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "erro ao reservar");
    }
  };

  const handleCancel = async (reservationId: number) => {
    try {
      await deleteReservation.mutateAsync(reservationId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "erro ao cancelar");
    }
    setConfirmCancel(null);
  };

  const handleCheckin = async (reservationId: number) => {
    try {
      await checkinReservation.mutateAsync(reservationId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "erro ao fazer check-in");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "checked_in": return <Badge variant="info">check-in realizado</Badge>;
      case "missed": return <Badge variant="danger">perdido</Badge>;
      case "pending": return <Badge variant="warning">pendente</Badge>;
      case "completed": return <Badge variant="completed">concluído</Badge>;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col p-3 sm:p-5 gap-3 sm:gap-4">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-display text-primary">lockers</h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">reserve um locker por horário</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)} className="text-xs shrink-0">hoje</Button>
        </div>
      </div>

      <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-white border border-[#D0D0D0]" /> disponivel
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#E8F5E9] border border-[#2D8659]" /> seu locker
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#FDECEA] border border-[#B85450]" /> ocupado
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {lockers?.map((locker) => {
          const res = lockerReservationMap.get(locker.id);
          const isMine = res?.userId === user?.id;
          const isOccupied = !!res && !isMine;
          const status = isMine ? "mine" : isOccupied ? "occupied" : "free";
          const userName = isMine ? "você" : res?.user?.name;
          const canCheckin = res?.status === "pending" && res?.date === today;

          return (
            <Card
              key={locker.id}
              className={`
                cursor-pointer hover:shadow-md transition-all border-2
                ${status === "free" ? "border-[#D0D0D0] bg-white" : ""}
                ${status === "mine" ? "border-success bg-[#E8F5E9]" : ""}
                ${status === "occupied" ? "border-danger bg-[#FDECEA]" : ""}
                ${!locker.isActive ? "opacity-40 pointer-events-none" : ""}
              `}
              onClick={() => {
                if (!locker.isActive) return;
                if (status === "free") {
                  setErrorMsg(null);
                  setStartTime("08:00");
                  setEndTime("18:00");
                  setSelectedLocker(locker);
                  setShowConfirm(true);
                }
              }}
            >
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <Luggage size={28} className={status === "mine" ? "text-success" : status === "occupied" ? "text-danger" : "text-muted"} />
                <span className="font-semibold text-sm">{locker.label}</span>
                {status === "occupied" && userName && (
                  <span className="text-xs text-danger truncate max-w-full">{userName}</span>
                )}
                {status === "mine" && res && (
                  <div className="flex flex-col items-center gap-1">
                    {statusBadge(res.status)}
                    <span className="text-xs text-muted">{res.startTime?.slice(0, 5)}–{res.endTime?.slice(0, 5)}</span>
                    {canCheckin && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs mt-1"
                        onClick={(e) => { e.stopPropagation(); handleCheckin(res.id); }}
                        disabled={checkinReservation.isPending}
                      >
                        <CheckCircle size={12} className="mr-1" /> check-in
                      </Button>
                    )}
                    {res.status === "checked_in" && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs mt-1"
                        onClick={(e) => { e.stopPropagation(); setConfirmCheckout(res.id); }}
                        disabled={checkoutReservation.isPending}
                      >
                        <CheckCircle size={12} className="mr-1" /> check-out
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger p-0 h-auto text-xs mt-1"
                      onClick={(e) => { e.stopPropagation(); setConfirmCancel(res.id); }}
                    >
                      <Trash2 size={12} className="mr-1" /> cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        open={showConfirm}
        onClose={() => { setShowConfirm(false); setSelectedLocker(null); setErrorMsg(null); }}
        title={`Reservar ${selectedLocker?.label}`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <CalendarDays size={16} />
            <span>{new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] mb-1">início</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] mb-1">fim</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-[#FDECEA] border border-[#B85450]/20 text-sm text-danger">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-sm">Deseja reservar o locker <strong>{selectedLocker?.label}</strong> para este horário?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowConfirm(false); setSelectedLocker(null); setErrorMsg(null); }}>cancelar</Button>
            <Button variant="primary" onClick={handleReserve} disabled={createReservation.isPending}>
              {createReservation.isPending ? "reservando..." : "confirmar"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => confirmCancel && handleCancel(confirmCancel)}
        title="Cancelar reserva"
        message="Tem certeza que deseja cancelar esta reserva?"
        confirmText="cancelar reserva"
        variant="danger"
        loading={deleteReservation.isPending}
      />

      <ConfirmModal
        open={!!confirmCheckout}
        onClose={() => setConfirmCheckout(null)}
        onConfirm={() => {
          if (confirmCheckout) {
            checkoutReservation.mutate(confirmCheckout);
            setConfirmCheckout(null);
          }
        }}
        title="Fazer check-out"
        message="Tem certeza que deseja fazer check-out?"
        confirmText="fazer check-out"
        variant="primary"
        loading={checkoutReservation.isPending}
      />
    </div>
  );
}
