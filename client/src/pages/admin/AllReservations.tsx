import { useState } from "react";
import { useReservations, useDeleteReservation, useCheckoutReservation } from "../../hooks/useReservations";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Loader2, Trash2, CalendarDays, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const statusLabel: Record<string, { label: string; variant: "warning" | "info" | "danger" | "default" | "completed" }> = {
  pending: { label: "pendente", variant: "warning" },
  checked_in: { label: "check-in", variant: "info" },
  missed: { label: "perdido", variant: "danger" },
  cancelled: { label: "cancelado", variant: "default" },
  completed: { label: "concluído", variant: "completed" },
};

export default function AllReservations() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const { data: reservations, isLoading } = useReservations({ date });
  const deleteReservation = useDeleteReservation();
  const checkoutReservation = useCheckoutReservation();
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [confirmCheckout, setConfirmCheckout] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-primary">Todas Reservas</h1>
          <p className="text-sm text-muted mt-1">{reservations?.length || 0} reserva(s) para esta data</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-accent" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-sm"
          />
        </div>
      </div>

      {(!reservations || reservations.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays size={40} className="mx-auto text-muted/50 mb-3" />
            <p className="text-muted">Nenhuma reserva para esta data.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted">Mesa</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Horário</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Usuário</th>
                  <th className="text-left px-4 py-3 font-medium text-muted">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted hidden sm:table-cell">Email</th>
                  <th className="text-right px-4 py-3 font-medium text-muted">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reservations?.map((res) => {
                  const st = statusLabel[res.status] || statusLabel.pending;
                  return (
                    <tr key={res.id} className="border-b border-border last:border-0 hover:bg-[#F5F4F0]/50">
                      <td className="px-4 py-3 font-medium">Mesa {res.desk?.label}</td>
                      <td className="px-4 py-3 text-muted">{res.startTime?.slice(0, 5)}–{res.endTime?.slice(0, 5)}</td>
                      <td className="px-4 py-3">{res.user?.name}</td>
                      <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="px-4 py-3 text-muted hidden sm:table-cell">{res.user?.email}</td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-1">
                        {res.status === "checked_in" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmCheckout(res.id)}
                            className="text-success hover:text-success/80"
                          >
                            <CheckCircle size={14} className="mr-1" /> check-out
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(res.id)}
                          className="text-muted hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            deleteReservation.mutate(confirmDelete);
            setConfirmDelete(null);
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
        message="Tem certeza que deseja fazer check-out desta reserva?"
        confirmText="fazer check-out"
        variant="primary"
        loading={checkoutReservation.isPending}
      />
    </div>
  );
}
