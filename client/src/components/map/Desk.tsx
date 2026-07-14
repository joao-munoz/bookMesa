import type { Desk as DeskType } from "../../hooks/useDesks";
import { cn } from "../../lib/utils";

interface DeskProps {
  desk: DeskType;
  status: "free" | "mine" | "occupied" | "inactive";
  reservationStatus?: "pending" | "checked_in" | "missed" | "cancelled" | "completed";
  isSelected: boolean;
  userName?: string;
  onClick: () => void;
  isDesktop?: boolean;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

const circleStyles: Record<string, { fill: string; stroke: string }> = {
  free: { fill: "#FFFFFF", stroke: "#D0D0D0" },
  mine: { fill: "#E8F5E9", stroke: "#2D8659" },
  occupied: { fill: "#FDECEA", stroke: "#B85450" },
  inactive: { fill: "#F5F4F0", stroke: "#D0D0D0" },
};

const boothCircle: Record<string, { fill: string; stroke: string }> = {
  free: { fill: "#E8F0FE", stroke: "#4A6FA5" },
  mine: { fill: "#E8F5E9", stroke: "#2D8659" },
  occupied: { fill: "#FDECEA", stroke: "#B85450" },
  inactive: { fill: "#F5F4F0", stroke: "#D0D0D0" },
};

function PersonIcon({ x, y, color, r = 9 }: { x: number; y: number; color: string; r?: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy="0" r={r} fill={color} />
      <circle cx="0" cy={-(r * 0.35)} r={r * 0.35} fill="#FFFFFF" />
      <path d={`M${-r * 0.5},${r * 0.35} C${-r * 0.5},${r * 0.05} ${r * 0.5},${r * 0.05} ${r * 0.5},${r * 0.35} L${r * 0.5},${r * 0.65} L${-r * 0.5},${r * 0.65}Z`} fill="#FFFFFF" />
    </g>
  );
}

export function DeskSVG({ desk, status, reservationStatus, isSelected, userName, onClick, isDesktop, isDragging, onMouseDown, onTouchStart }: DeskProps) {
  const isBooth = desk.label.startsWith("bv");
  const cx = desk.x + desk.width / 2;
  const cy = desk.y + desk.height / 2;
  const style = isBooth ? boothCircle[status] : circleStyles[status];
  const rCircle = isDesktop ? 14 : 11;
  const label = isBooth ? `aquario ${desk.label}` : `mesa ${desk.label}`;

  return (
    <g
      onClick={status !== "inactive" ? onClick : undefined}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      className={cn(
        "transition-all duration-200",
        status !== "inactive" && !onMouseDown && "cursor-pointer",
        isDragging && "opacity-70",
        onMouseDown && "cursor-grab active:cursor-grabbing",
      )}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <title>
        {label}
        {status === "occupied" && userName ? ` - ${userName}` : ""}
        {status === "mine" ? " - sua reserva" : ""}
        {status === "free" ? ` - ${isBooth ? "apenas sócios" : "livre"}` : ""}
        {status === "inactive" ? " - inativa" : ""}
        {reservationStatus === "checked_in" ? " (check-in realizado)" : ""}
        {reservationStatus === "missed" ? " (perdido)" : ""}
      </title>

      <circle cx={cx + 2} cy={cy + 2} r={rCircle} fill="rgba(0,0,0,0.08)" />

      <circle
        cx={cx} cy={cy} r={rCircle}
        fill={style.fill}
        stroke={isSelected ? "#C9A84C" : isDragging ? "#E14029" : style.stroke}
        strokeWidth={isSelected || isDragging ? 2.5 : 1.5}
        className={cn("transition-all duration-200", status !== "inactive" && "hover:brightness-95", isSelected && "drop-shadow-md")}
      />

      {reservationStatus === "checked_in" && (
        <g transform={`translate(${cx + rCircle - 8}, ${cy - rCircle + 2})`}>
          <circle cx="0" cy="0" r="8" fill="#2D8659" />
          <polyline points="-4,0 -1,3 4,-2" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {reservationStatus === "missed" && (
        <g transform={`translate(${cx + rCircle - 8}, ${cy - rCircle + 2})`}>
          <circle cx="0" cy="0" r="8" fill="#B85450" />
          <line x1="-3" y1="-3" x2="3" y2="3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="-3" x2="-3" y2="3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {(status === "mine" || status === "occupied") && (
        <PersonIcon
          x={cx} y={cy}
          color={status === "mine" ? "#2D8659" : "#B85450"}
          r={Math.max(6, rCircle - 4)}
        />
      )}
    </g>
  );
}
