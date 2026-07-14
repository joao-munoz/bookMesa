import { useMemo } from "react";
import { useMyReservations, useCheckinReservation } from "../../hooks/useReservations";
import { useMyLockerReservations, useCheckinLockerReservation } from "../../hooks/useLockers";
import { useMyRoomReservations, useCheckinRoomReservation } from "../../hooks/useRooms";
import { Button } from "../ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

const today = format(new Date(), "yyyy-MM-dd");

function isWithinOneHour(startTime: string, date: string): boolean {
  if (date !== today) return false;
  const now = new Date();
  const [h, m] = startTime.split(":").map(Number);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const diff = (now.getTime() - start.getTime()) / 60000;
  return diff >= -60 && diff <= 60;
}

interface CheckinItem {
  id: number;
  type: "desk" | "locker" | "room";
  label: string;
}

export function CheckinBar() {
  const { data: deskReservations } = useMyReservations();
  const { data: lockerReservations } = useMyLockerReservations();
  const { data: roomReservations } = useMyRoomReservations();

  const checkinDesk = useCheckinReservation();
  const checkinLocker = useCheckinLockerReservation();
  const checkinRoom = useCheckinRoomReservation();

  const pendingList = useMemo(() => {
    const items: CheckinItem[] = [];

    for (const r of deskReservations || []) {
      if (r.status === "pending" && isWithinOneHour(r.startTime, r.date)) {
        items.push({ id: r.id, type: "desk", label: `Mesa ${r.desk?.label}` });
      }
    }
    for (const r of lockerReservations || []) {
      if (r.status === "pending" && isWithinOneHour(r.startTime, r.date)) {
        items.push({ id: r.id, type: "locker", label: `${r.locker?.label}` });
      }
    }
    for (const r of roomReservations || []) {
      if (r.status === "pending" && isWithinOneHour(r.startTime, r.date)) {
        items.push({ id: r.id, type: "room", label: `Sala ${r.room?.name}` });
      }
    }

    return items;
  }, [deskReservations, lockerReservations, roomReservations]);

  if (pendingList.length === 0) return null;

  const isPending = checkinDesk.isPending || checkinLocker.isPending || checkinRoom.isPending;

  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2 bg-accent/10 border-b border-accent/20 text-sm">
      {pendingList.map((item) => (
        <Button
          key={`${item.type}-${item.id}`}
          variant="primary"
          size="sm"
          onClick={() => {
            if (item.type === "desk") checkinDesk.mutate(item.id);
            else if (item.type === "locker") checkinLocker.mutate(item.id);
            else checkinRoom.mutate(item.id);
          }}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 size={14} className="mr-1 animate-spin" />
          ) : (
            <CheckCircle size={14} className="mr-1" />
          )}
          check-in {item.label}
        </Button>
      ))}
    </div>
  );
}
