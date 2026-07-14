import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useRooms, useRoomReservations, useCreateRoomReservation, useDeleteRoomReservation, useCheckinRoomReservation, useCheckoutRoomReservation } from "../hooks/useRooms";
import { useAuth } from "../context/AuthContext";
import { DatePicker } from "../components/ui/DatePicker";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Badge } from "../components/ui/badge";
import { Loader2, CalendarDays, Clock, CheckCircle, AlertTriangle, Plus } from "lucide-react";
import { cn } from "../lib/utils";

const today = format(new Date(), "yyyy-MM-dd");
const HOURS = Array.from({ length: 17 }, (_, i) => String(i + 6).padStart(2, "0") + ":00");

const statusBadge = (status: string) => {
  switch (status) {
    case "checked_in": return <Badge variant="info">check-in</Badge>;
    case "missed": return <Badge variant="danger">perdido</Badge>;
    case "pending": return <Badge variant="warning">pendente</Badge>;
    case "completed": return <Badge variant="completed">concluído</Badge>;
    default: return null;
  }
};

function isWithinCheckinWindow(startTime: string, date: string): boolean {
  if (date !== today) return false;
  const now = new Date();
  const [h, m] = startTime.split(":").map(Number);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const diff = (now.getTime() - start.getTime()) / 60000;
  return diff >= -30 && diff <= 30;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const MIN_HOUR = 6 * 60;
const MAX_HOUR = 22 * 60;

export default function Rooms() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "manage">("create");
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);
  const [confirmCheckout, setConfirmCheckout] = useState<number | null>(null);

  const { data: rooms } = useRooms();
  const { data: reservations, isLoading } = useRoomReservations({ date: selectedDate });
  const createReservation = useCreateRoomReservation();
  const deleteReservation = useDeleteRoomReservation();
  const checkinReservation = useCheckinRoomReservation();
  const checkoutReservation = useCheckoutRoomReservation();

  const activeRooms = useMemo(() => (rooms || []).filter((r) => r.isActive), [rooms]);

  const reservationsByRoom = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const res of reservations || []) {
      if (res.status === "cancelled") continue;
      const list = map.get(res.roomId) || [];
      list.push(res);
      map.set(res.roomId, list);
    }
    return map;
  }, [reservations]);

  const handleOpenCreate = () => {
    const firstActive = activeRooms[0];
    if (!firstActive) return;
    setSelectedRoomId(firstActive.id);
    setStartTime("09:00");
    setEndTime("10:00");
    setErrorMsg(null);
    setModalMode("create");
    setSelectedReservation(null);
    setShowModal(true);
  };

  const handleReservationClick = (res: any) => {
    setSelectedReservation(res);
    setSelectedRoomId(res.roomId);
    setErrorMsg(null);
    setModalMode("manage");
    setStartTime(res.startTime);
    setEndTime(res.endTime);
    setShowModal(true);
  };

  const handleReserve = async () => {
    if (!selectedRoomId) return;
    if (startTime >= endTime) {
      setErrorMsg("Horário de início deve ser anterior ao horário de fim");
      return;
    }
    try {
      await createReservation.mutateAsync({ roomId: selectedRoomId, date: selectedDate, startTime, endTime });
      setShowModal(false);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "erro ao reservar");
    }
  };

  const handleCancel = async () => {
    if (!selectedReservation) return;
    try {
      await deleteReservation.mutateAsync(selectedReservation.id);
      setShowModal(false);
      setSelectedReservation(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "erro ao cancelar");
    }
  };

  const handleCheckin = async () => {
    if (!selectedReservation) return;
    try {
      await checkinReservation.mutateAsync(selectedReservation.id);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "erro ao fazer check-in");
    }
  };

  const selectedRoom = useMemo(() => {
    if (modalMode === "create") return rooms?.find((r) => r.id === selectedRoomId);
    return rooms?.find((r) => r.id === selectedReservation?.roomId);
  }, [modalMode, selectedRoomId, selectedReservation, rooms]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 sm:p-5 gap-3 sm:gap-4">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 font-display text-primary">salas de reunião</h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">{activeRooms.length} sala(s) disponível(is)</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today)} className="text-xs shrink-0">hoje</Button>
        </div>
      </div>

      {activeRooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted">Nenhuma sala ativa.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
          {/* Header row with room names */}
          <div className="flex sticky top-0 bg-[#F5F4F0] z-20 pb-2">
            <div className="w-14 shrink-0" />
            {activeRooms.map((room) => (
              <div key={room.id} className="flex-1 text-center font-display text-sm text-primary font-medium">
                {room.name}
              </div>
            ))}
          </div>

          {/* Scrollable timeline area */}
          <div className="relative" style={{ minHeight: "600px" }}>
            {/* Hour grid lines */}
            {HOURS.map((hour) => {
              const top = ((timeToMinutes(hour) - MIN_HOUR) / (MAX_HOUR - MIN_HOUR)) * 100;
              return (
                <div
                  key={hour}
                  className="absolute left-0 right-0 flex items-start"
                  style={{ top: `${top}%`, height: `${100 / HOURS.length}%` }}
                >
                  <span className="text-xs text-muted w-14 shrink-0 pt-1 text-right pr-3 font-medium">{hour}</span>
                  <div className="flex-1 border-t border-border/50 h-full" />
                </div>
              );
            })}

            {/* Reservation blocks per room */}
            {activeRooms.map((room, roomIdx) => {
              const roomReservations = reservationsByRoom.get(room.id) || [];
              return (
                <div key={room.id} className={cn("absolute top-0 bottom-0", roomIdx > 0 && "border-l border-border/30")} style={{ left: `calc(3.5rem + ${roomIdx} * (100% - 3.5rem) / ${activeRooms.length})`, width: `calc((100% - 3.5rem) / ${activeRooms.length})` }}>
                  {roomReservations.map((res: any) => {
                    const startM = Math.max(timeToMinutes(res.startTime), MIN_HOUR);
                    const endM = Math.min(timeToMinutes(res.endTime), MAX_HOUR);
                    if (startM >= endM) return null;
                    const top = ((startM - MIN_HOUR) / (MAX_HOUR - MIN_HOUR)) * 100;
                    const height = ((endM - startM) / (MAX_HOUR - MIN_HOUR)) * 100;
                    const isMine = res.userId === (user?.id);
                    const canCheckin = isMine && res.status === "pending" && isWithinCheckinWindow(res.startTime, res.date);

                    return (
                      <div
                        key={res.id}
                        className={cn(
                          "absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer transition-all hover:shadow-md border z-10 overflow-hidden",
                          isMine
                            ? "bg-[#E8F5E9] border-[#2D8659]/30 text-[#2D8659]"
                            : "bg-[#FDECEA] border-[#B85450]/30 text-[#B85450]"
                        )}
                        style={{ top: `${top}%`, height: `${Math.max(height, 2)}%` }}
                        onClick={() => handleReservationClick(res)}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-medium leading-tight">
                          {res.status === "checked_in" && <CheckCircle size={10} className="shrink-0" />}
                          <span className="truncate">{res.user?.name || "Desconhecido"}</span>
                          <span className="text-muted/60 shrink-0">{res.startTime?.slice(0, 5)}</span>
                          {canCheckin && (
                            <span className="text-[9px] bg-[#2D8659]/10 text-[#2D8659] px-1 rounded-full shrink-0">check-in</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAB */}
      {activeRooms.length > 0 && (
        <button
          onClick={handleOpenCreate}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow-lg hover:bg-accent/90 transition-colors flex items-center justify-center z-30"
          title="Reservar sala"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedReservation(null); setErrorMsg(null); }}
        title={modalMode === "create" ? "Reservar sala" : (selectedReservation?.user?.name || "Reserva")}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <CalendarDays size={16} />
            <span>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          </div>

          {modalMode === "manage" && selectedReservation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-muted" />
                <span>{selectedReservation.startTime?.slice(0, 5)} – {selectedReservation.endTime?.slice(0, 5)}</span>
              </div>
              {selectedRoom && <p className="text-sm text-muted">Sala: {selectedRoom.name}</p>}
              {statusBadge(selectedReservation.status)}
            </div>
          )}

          {modalMode === "create" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">sala</label>
                <select
                  value={selectedRoomId ?? ""}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {activeRooms.map((room) => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
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
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-[#FDECEA] border border-[#B85450]/20 text-sm text-danger">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowModal(false); setSelectedReservation(null); setErrorMsg(null); }}>
              {modalMode === "manage" ? "fechar" : "cancelar"}
            </Button>

            {modalMode === "create" && (
              <Button variant="primary" onClick={handleReserve} disabled={createReservation.isPending}>
                {createReservation.isPending ? "reservando..." : "confirmar reserva"}
              </Button>
            )}

            {modalMode === "manage" && selectedReservation?.userId === (user?.id) && (
              <>
                {selectedReservation?.status === "pending" && isWithinCheckinWindow(selectedReservation.startTime, selectedReservation.date) && (
                  <Button variant="primary" onClick={handleCheckin} disabled={checkinReservation.isPending}>
                    {checkinReservation.isPending ? "check-in..." : "fazer check-in"}
                  </Button>
                )}
                {selectedReservation?.status === "checked_in" && (
                  <Button variant="primary" onClick={() => setConfirmCheckout(selectedReservation.id)} disabled={checkoutReservation.isPending}>
                    {checkoutReservation.isPending ? "check-out..." : "fazer check-out"}
                  </Button>
                )}
                <Button variant="danger" onClick={() => { setConfirmCancel(selectedReservation.id); }} disabled={deleteReservation.isPending}>
                  cancelar reserva
                </Button>
              </>
            )}

            {modalMode === "manage" && selectedReservation?.userId !== (user?.id) && (
              <span className="text-xs text-muted self-center">reservado por {selectedReservation?.user?.name}</span>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => {
          if (confirmCancel) {
            deleteReservation.mutate(confirmCancel);
            setConfirmCancel(null);
            setShowModal(false);
            setSelectedReservation(null);
          }
        }}
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
