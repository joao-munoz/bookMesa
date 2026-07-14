import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Loader2, ScrollText, User, MapPin } from "lucide-react";
import api from "../../lib/api";

export default function ReservationLog() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["reservation-log"],
    queryFn: () => api.get<any[]>("/reservations/log?limit=200").then((r) => r.data),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-display text-primary">Log de Reservas</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Histórico de todas as reservas e cancelamentos
        </p>
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {(!logs || logs.length === 0) ? (
              <div className="py-12 text-center">
                <ScrollText size={40} className="mx-auto text-muted/50 mb-3" />
                <p className="text-muted">Nenhum registro encontrado.</p>
              </div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 hover:bg-[#F5F4F0]/50 transition-colors">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                    log.action === "CREATED" ? "bg-success/10" : "bg-danger/10"
                  }`}>
                    {log.action === "CREATED" ? (
                      <MapPin size={16} className="text-success" />
                    ) : (
                      <MapPin size={16} className="text-danger" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{log.user?.name}</span>
                      <Badge variant={log.action === "CREATED" ? "success" : "danger"}>
                        {log.action === "CREATED" ? "Reservou" : "Cancelou"}
                      </Badge>
                      <span className="text-sm text-muted">
                        Mesa {log.desk?.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {log.date} — {format(new Date(log.createdAt), "HH:mm:ss")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
