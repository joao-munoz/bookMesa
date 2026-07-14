import { useState, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DeskSVG } from "./Desk";
import { type Desk, useDesks } from "../../hooks/useDesks";
import { useReservations, useCreateReservation, useDeleteReservation, useCheckinReservation, useCheckoutReservation, type Reservation } from "../../hooks/useReservations";
import { useAuth } from "../../context/AuthContext";
import { DatePicker } from "../ui/DatePicker";
import { Modal } from "../ui/modal";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Loader2, User, CalendarDays, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import api from "../../lib/api";
import { cn } from "../../lib/utils";
import { useMediaQuery } from "../../hooks/useMediaQuery";

export function FloorPlan() {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDate = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState(urlDate || today);

  useEffect(() => {
    if (urlDate && urlDate !== selectedDate) {
      setSelectedDate(urlDate);
    }
  }, [urlDate]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date === today) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ date }, { replace: true });
    }
  };
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminUserId, setAdminUserId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmCheckout, setConfirmCheckout] = useState<number | null>(null);

  const { data: desks, isLoading: desksLoading } = useDesks();
  const { data: reservations } = useReservations({ date: selectedDate });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Record<string, string>>("/settings").then((r: any) => r.data),
    staleTime: 300000,
  });
  const createReservation = useCreateReservation();
  const deleteReservation = useDeleteReservation();
  const checkinReservation = useCheckinReservation();
  const checkoutReservation = useCheckoutReservation();

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<{ id: number; name: string }[]>("/users").then((r: any) => r.data),
    enabled: user?.role === "ADMIN",
    staleTime: 60000,
  });

  useEffect(() => {
    setSelectedDesk(null);
    setShowModal(false);
    setAdminUserId(null);
    setErrorMsg(null);
  }, [selectedDate]);

  const deskInfoMap = useMemo(() => {
    const map = new Map<number, { status: "free" | "mine" | "occupied"; userName?: string; reservation?: Reservation }>();
    if (!reservations) return map;
    for (const r of reservations) {
      if (r.deskId) {
        const isMine = r.userId === user?.id;
        map.set(r.deskId, {
          status: isMine ? "mine" : "occupied",
          userName: r.user?.name,
          reservation: r,
        });
      }
    }
    return map;
  }, [reservations, user?.id]);

  const myReservation = useMemo(() => {
    if (!reservations || !user) return null;
    return reservations.find((r) => r.userId === user.id) || null;
  }, [reservations, user?.id]);

  const myDeskLabel = myReservation?.desk?.label || null;

  const handleReserve = async () => {
    if (!selectedDesk) return;
    if (startTime >= endTime) {
      setErrorMsg("Horário de início deve ser anterior ao horário de fim");
      return;
    }
    try {
      await createReservation.mutateAsync({
        deskId: selectedDesk.id,
        date: selectedDate,
        startTime,
        endTime,
        ...(user?.role === "ADMIN" && adminUserId ? { userId: adminUserId } : {}),
      });
      setShowModal(false);
      setSelectedDesk(null);
      setAdminUserId(null);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "erro ao reservar");
    }
  };

  const handleSwap = async () => {
    if (!selectedDesk || !myReservation) return;
    if (startTime >= endTime) {
      setErrorMsg("Horário de início deve ser anterior ao horário de fim");
      return;
    }
    try {
      await deleteReservation.mutateAsync(myReservation.id);
      await createReservation.mutateAsync({
        deskId: selectedDesk.id,
        date: selectedDate,
        startTime,
        endTime,
        ...(user?.role === "ADMIN" && adminUserId ? { userId: adminUserId } : {}),
      });
      setShowModal(false);
      setSelectedDesk(null);
      setAdminUserId(null);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "erro ao trocar");
    }
  };

  const handleCancel = async () => {
    if (selectedStatus === "mine" && selectedInfo?.reservation) {
      try {
        await deleteReservation.mutateAsync(selectedInfo.reservation.id);
        setShowModal(false);
        setSelectedDesk(null);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.error || "erro ao cancelar");
      }
      return;
    }
    if (user?.role === "ADMIN" && selectedInfo?.reservation) {
      try {
        await deleteReservation.mutateAsync(selectedInfo.reservation.id);
        setShowModal(false);
        setSelectedDesk(null);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.error || "erro ao cancelar");
      }
    }
  };

  const handleCheckin = async () => {
    if (!selectedInfo?.reservation) return;
    try {
      await checkinReservation.mutateAsync(selectedInfo.reservation.id);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "erro ao fazer check-in");
    }
  };

  const isWeekend = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.getDay() === 0 || d.getDay() === 6;
  };

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isPanning, setIsPanning] = useState(false);
  const [preventClick, setPreventClick] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Reset pan when date changes
  useEffect(() => {
    setPanX(panLimitX / 2);
    setPanY(panLimitY / 2);
  }, [selectedDate]);

  const handlePanStart = (clientX: number, clientY: number) => {
    setIsPanning(true);
    dragStart.current = { x: clientX, y: clientY };
    panStart.current = { x: panX, y: panY };
    setPreventClick(false);
  };

  const handlePanMove = (clientX: number, clientY: number) => {
    if (!isPanning || !svgRef.current) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      setPreventClick(true);
    }
    const viewScale = svgWidth / svgRef.current.clientWidth;
    const newX = panStart.current.x - dx * viewScale;
    const newY = panStart.current.y - dy * viewScale;
    setPanX(Math.max(0, Math.min(panLimitX, newX)));
    setPanY(Math.max(0, Math.min(panLimitY, newY)));
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleDeskClick = (desk: Desk) => {
    if (preventClick) {
      setPreventClick(false);
      return;
    }
    if (!desk.isActive) return;
    setSelectedDesk(desk);
    setAdminUserId(null);
    setErrorMsg(null);
    setStartTime("08:00");
    setEndTime("09:00");
    setShowModal(true);
  };

  if (desksLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  const autoWidth = Math.max(...desks!.map((d) => d.x + d.width)) + 100;
  const autoHeight = Math.max(...desks!.map((d) => d.y + d.height)) + 60;
  const svgWidth = settings?.mapWidth ? Number(settings.mapWidth) : autoWidth;
  const svgHeight = settings?.mapHeight ? Number(settings.mapHeight) : autoHeight;
  const selectedInfo = selectedDesk ? deskInfoMap.get(selectedDesk.id) : undefined;
  const isBooth = selectedDesk?.label.startsWith("bv");
  const selectedStatus = selectedInfo?.status || (selectedDesk?.isActive ? "free" : "inactive");
  const isCheckinWindow = (() => {
    if (!selectedInfo?.reservation || selectedInfo.reservation.status !== "pending") return false;
    if (selectedInfo.reservation.date !== today) return false;
    const now = new Date();
    const [h, m] = selectedInfo.reservation.startTime.split(":").map(Number);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    const diff = (now.getTime() - start.getTime()) / 60000;
    return diff >= -30 && diff <= 30;
  })();

  // Mobile: zoom into the map so it fills most of the viewport
  const zoom = isDesktop ? 1 : Math.max(1, (window.innerHeight / svgHeight) * 0.85);
  const vbW = svgWidth / zoom;
  const vbH = svgHeight / zoom;
  const panLimitX = Math.max(0, svgWidth - vbW);
  const panLimitY = Math.max(0, svgHeight - vbH);
  const [panX, setPanX] = useState(isDesktop ? 0 : panLimitX / 2);
  const [panY, setPanY] = useState(isDesktop ? 0 : panLimitY / 2);

  // Reset pan when date changes
  useEffect(() => {
    if (!isDesktop) { setPanX(panLimitX / 2); setPanY(panLimitY / 2); }
  }, [selectedDate]);

  return (
      <div className="h-full relative overflow-hidden">
        {/* floating controls */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 flex items-center gap-2">
          <DatePicker value={selectedDate} onChange={handleDateChange} />
          <Button variant="ghost" size="sm" onClick={() => handleDateChange(today)} className="text-xs shrink-0">
            hoje
          </Button>
        </div>

        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-10 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted bg-white/80 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white border border-[#D0D0D0]" /> disponivel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E8F5E9] border border-[#2D8659]" /> sua reserva
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FDECEA] border border-[#B85450]" /> indisponivel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E8F0FE] border border-[#4A6FA5]" /> aquário
          </span>
          {isWeekend(selectedDate) && <Badge variant="default">final de semana</Badge>}
        </div>

        <svg
          ref={svgRef}
          viewBox={`${panX} ${panY} ${vbW} ${vbH}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={(e) => handlePanStart(e.clientX, e.clientY)}
          onPointerMove={(e) => handlePanMove(e.clientX, e.clientY)}
          onPointerUp={handlePanEnd}
          onPointerLeave={handlePanEnd}
          style={{ touchAction: isDesktop ? "auto" : "none", cursor: isPanning ? "grabbing" : isDesktop ? "default" : "grab" }}
        >
          <image
            href="/planta_exemplo.png"
            x={0} y={0} width={svgWidth} height={svgHeight}
            preserveAspectRatio="xMidYMid meet"
            opacity={0.3}
          />
          {desks?.map((desk) => {
            const info = deskInfoMap.get(desk.id);
            const status = desk.isActive ? info?.status || "free" : "inactive";
            return (
              <DeskSVG
                key={desk.id}
                desk={desk}
                status={status}
                reservationStatus={info?.reservation?.status}
                isSelected={selectedDesk?.id === desk.id}
                userName={info?.userName}
                onClick={() => handleDeskClick(desk)}
                isDesktop={isDesktop}
              />
            );
          })}
        </svg>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedDesk(null); setAdminUserId(null); setErrorMsg(null); }}
        title={isBooth ? `aquario ${selectedDesk?.label}` : `mesa ${selectedDesk?.label}`}
      >
        {selectedDesk && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted">
              <CalendarDays size={16} />
              <span>
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            </div>

            {isBooth && user?.role !== "ADMIN" && selectedStatus === "free" && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-[#FDECEA] border border-[#B85450]/20 text-sm">
                <AlertTriangle size={16} className="text-danger" />
                <span>apenas sócios podem reservar aquários</span>
              </div>
            )}

            {selectedStatus === "occupied" && selectedInfo?.userName && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-danger/5 border border-danger/10 text-sm">
                <User size={16} className="text-danger" />
                <span>
                  <strong>{selectedInfo.userName}</strong> está utilizando este espaço
                  {selectedInfo.reservation?.status === "checked_in" && (
                    <Badge variant="info" className="ml-2">check-in realizado</Badge>
                  )}
                  {user?.role === "ADMIN" && <span className="text-muted"> (admin)</span>}
                </span>
              </div>
            )}

            {selectedStatus === "mine" && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-[#E8F5E9] border border-[#2D8659]/20 text-sm text-[#2D8659]">
                <User size={16} />
                <span>
                  você reservou este espaço
                  {selectedInfo?.reservation?.status === "pending" && <Badge variant="warning" className="ml-2">pendente</Badge>}
                  {selectedInfo?.reservation?.status === "checked_in" && <Badge variant="info" className="ml-2">check-in realizado</Badge>}
                  {selectedInfo?.reservation?.status === "missed" && <Badge variant="danger" className="ml-2">perdido</Badge>}
                </span>
              </div>
            )}

            {selectedStatus === "free" && isWeekend(selectedDate) && (
              <p className="text-sm text-danger">nao e permitido reservar em finais de semana</p>
            )}

            {selectedStatus === "free" && !isWeekend(selectedDate) && myReservation && !isBooth && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-[#FBF3D5] border border-[#C9A84C]/30 text-sm">
                <RefreshCw size={16} className="text-accent mt-0.5 shrink-0" />
                <span>voce ja reservou <strong>{myDeskLabel}</strong>. deseja trocar para esta mesa?</span>
              </div>
            )}

            {selectedStatus === "free" && !isWeekend(selectedDate) && myReservation && isBooth && user?.role === "ADMIN" && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-[#FBF3D5] border border-[#C9A84C]/30 text-sm">
                <RefreshCw size={16} className="text-accent mt-0.5 shrink-0" />
                <span>voce ja reservou <strong>{myDeskLabel}</strong>. deseja trocar para este aquario?</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-[#FDECEA] border border-[#B85450]/20 text-sm text-danger">
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Time inputs for free/swap */}
            {(selectedStatus === "free" || (selectedStatus === "mine" && isCheckinWindow)) && (
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
            )}

            {/* Admin user selector */}
            {user?.role === "ADMIN" && (selectedStatus === "free" || (selectedStatus === "occupied" && !selectedInfo?.userName?.includes("admin"))) && (
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-1">reservar para</label>
                <select
                  value={adminUserId ?? ""}
                  onChange={(e) => setAdminUserId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="">selecionar usuario</option>
                  {users?.map((u: { id: number; name: string }) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowModal(false); setAdminUserId(null); setErrorMsg(null); }}>
                fechar
              </Button>

              {/* Check-in button */}
              {selectedStatus === "mine" && isCheckinWindow && (
                <Button variant="primary" onClick={handleCheckin} disabled={checkinReservation.isPending}>
                  {checkinReservation.isPending ? "check-in..." : "fazer check-in"}
                </Button>
              )}

              {/* Check-out button */}
              {selectedStatus === "mine" && selectedInfo?.reservation?.status === "checked_in" && (
                <Button variant="primary" onClick={() => setConfirmCheckout(selectedInfo?.reservation?.id!)} disabled={checkoutReservation.isPending}>
                  {checkoutReservation.isPending ? "check-out..." : "fazer check-out"}
                </Button>
              )}

              {selectedStatus === "free" && !isWeekend(selectedDate) && !myReservation && (
                isBooth ? user?.role === "ADMIN" ? (
                  <Button variant="primary" onClick={handleReserve} disabled={createReservation.isPending}>
                    {createReservation.isPending ? "reservando..." : "confirmar reserva"}
                  </Button>
                ) : null : (
                  <Button variant="primary" onClick={handleReserve} disabled={createReservation.isPending}>
                    {createReservation.isPending ? "reservando..." : "confirmar reserva"}
                  </Button>
                )
              )}

              {selectedStatus === "free" && !isWeekend(selectedDate) && myReservation && (
                isBooth ? user?.role === "ADMIN" ? (
                  <Button variant="primary" onClick={handleSwap} disabled={createReservation.isPending || deleteReservation.isPending}>
                    {createReservation.isPending || deleteReservation.isPending ? "trocando..." : "trocar para esta"}
                  </Button>
                ) : null : (
                  <Button variant="primary" onClick={handleSwap} disabled={createReservation.isPending || deleteReservation.isPending}>
                    {createReservation.isPending || deleteReservation.isPending ? "trocando..." : "trocar para esta"}
                  </Button>
                )
              )}

              {selectedStatus === "mine" && (
                <Button variant="danger" onClick={handleCancel} disabled={deleteReservation.isPending}>
                  {deleteReservation.isPending ? "cancelando..." : "cancelar reserva"}
                </Button>
              )}

              {user?.role === "ADMIN" && selectedStatus === "occupied" && selectedInfo?.reservation && (
                <Button variant="danger" onClick={handleCancel} disabled={deleteReservation.isPending}>
                  {deleteReservation.isPending ? "cancelando..." : "cancelar reserva (admin)"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

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
