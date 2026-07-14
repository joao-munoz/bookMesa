import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { DeskSVG } from "../../components/map/Desk";
import { useDesks, useUpdateDesk } from "../../hooks/useDesks";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Loader2, Move, Save, RotateCcw } from "lucide-react";
import api from "../../lib/api";

export default function EditMap() {
  const { data: desks, isLoading } = useDesks();
  const updateDesk = useUpdateDesk();
  const svgRef = useRef<SVGSVGElement>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Record<string, string>>("/settings").then((r: any) => r.data),
    staleTime: 300000,
  });

  const [draggingDeskId, setDraggingDeskId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Map<number, { x: number; y: number }>>(new Map());
  const isDragging = useRef(false);
  const GRID = 10;

  const autoWidth = desks ? Math.max(...desks.map((d) => d.x + d.width)) + 100 : 800;
  const autoHeight = desks ? Math.max(...desks.map((d) => d.y + d.height)) + 60 : 600;
  const svgWidth = settings?.mapWidth ? Number(settings.mapWidth) : autoWidth;
  const svgHeight = settings?.mapHeight ? Number(settings.mapHeight) : autoHeight;

  const hasChanges = pendingChanges.size > 0;
  const isSaving = updateDesk.isPending;

  const svgToViewBox = useCallback((clientX: number, clientY: number) => {
    const svgEl = svgRef.current;
    if (!svgEl) return { x: 0, y: 0 };
    const rect = svgEl.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (svgWidth / rect.width),
      y: (clientY - rect.top) * (svgHeight / rect.height),
    };
  }, [svgWidth, svgHeight]);

  const snap = (v: number) => snapToGrid ? Math.round(v / GRID) * GRID : Math.round(v);

  const startDrag = (deskId: number, clientX: number, clientY: number) => {
    const desk = desks?.find((d) => d.id === deskId);
    if (!desk) return;
    const vb = svgToViewBox(clientX, clientY);
    isDragging.current = true;
    setDraggingDeskId(deskId);
    setDragOffset({ x: vb.x - desk.x, y: vb.y - desk.y });
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDragging.current || draggingDeskId === null) return;
    const vb = svgToViewBox(clientX, clientY);
    const newX = Math.max(0, snap(vb.x - dragOffset.x));
    const newY = Math.max(0, snap(vb.y - dragOffset.y));
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(draggingDeskId, { x: newX, y: newY });
      return next;
    });
  };

  const endDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setDraggingDeskId(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    if (pendingChanges.size === 0) return;
    const entries = Array.from(pendingChanges.entries());
    await Promise.all(entries.map(([id, pos]) => updateDesk.mutateAsync({ id, x: pos.x, y: pos.y })));
    setPendingChanges(new Map());
  };

  const handleUndo = () => {
    setPendingChanges(new Map());
  };

  const getDeskPos = (desk: { id: number; x: number; y: number }) => {
    const pending = pendingChanges.get(desk.id);
    return pending ? { x: pending.x, y: pending.y } : { x: desk.x, y: desk.y };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden">
      {/* floating controls */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 flex items-center gap-2">
        <Badge variant="info" className="text-xs">{desks?.length || 0} mesas</Badge>
        <label className="flex items-center gap-1.5 text-xs text-muted bg-white/80 rounded-lg px-2 py-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
            className="rounded border-border"
          />
          snap {GRID}px
        </label>
        <span className="hidden sm:flex items-center gap-1 text-xs text-muted bg-white/80 rounded-lg px-2 py-1.5">
          <Move size={12} /> arraste para reposicionar
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchMove={(e) => { const t = e.touches[0]; if (t) moveDrag(t.clientX, t.clientY); }}
        onTouchEnd={endDrag}
        style={{ cursor: draggingDeskId ? "grabbing" : "grab", userSelect: "none", touchAction: "none" }}
      >
        <image
          href="/planta_exemplo.png"
          x={0} y={0} width={svgWidth} height={svgHeight}
          preserveAspectRatio="xMidYMid meet"
          opacity={0.3}
        />

        {snapToGrid && (
          <defs>
            <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <circle cx={GRID / 2} cy={GRID / 2} r={0.5} fill="#D0D0D0" opacity={0.3} />
            </pattern>
          </defs>
        )}
        {snapToGrid && <rect width="100%" height="100%" fill="url(#grid)" />}

        {desks?.map((desk) => {
          const pos = getDeskPos(desk);
          const dragDesk = { ...desk, x: pos.x, y: pos.y };
          return (
            <DeskSVG
              key={desk.id}
              desk={dragDesk}
              status={desk.isActive ? "free" : "inactive"}
              isSelected={false}
              onClick={() => {}}
              isDesktop={true}
              isDragging={draggingDeskId === desk.id}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag(desk.id, e.clientX, e.clientY); }}
              onTouchStart={(e) => { const t = e.touches[0]; if (t) startDrag(desk.id, t.clientX, t.clientY); }}
            />
          );
        })}
      </svg>

      {/* Floating save bar */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-xl shadow-lg border border-border px-4 py-3 z-20">
          <span className="text-sm text-muted whitespace-nowrap">{pendingChanges.size} mesa(s) alterada(s)</span>
          <Button variant="ghost" size="sm" onClick={handleUndo} disabled={isSaving} className="text-muted hover:text-danger">
            <RotateCcw size={14} className="mr-1" /> desfazer
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
            {isSaving ? "salvando..." : "confirmar"}
          </Button>
        </div>
      )}
    </div>
  );
}
