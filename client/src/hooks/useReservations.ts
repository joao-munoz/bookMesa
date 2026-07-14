import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { Desk } from "./useDesks";

export interface Reservation {
  id: number;
  userId: number;
  deskId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "checked_in" | "missed" | "cancelled" | "completed";
  checkedInAt?: string;
  checkedOutAt?: string;
  user?: { id: number; name: string; email: string };
  desk?: Desk;
}

export function useReservations(params?: { date?: string; deskId?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.date) searchParams.set("date", params.date);
  if (params?.deskId) searchParams.set("deskId", String(params.deskId));

  return useQuery({
    queryKey: ["reservations", params],
    queryFn: () =>
      api.get<Reservation[]>(`/reservations?${searchParams.toString()}`).then((r) => r.data),
  });
}

export function useMyReservations() {
  return useQuery({
    queryKey: ["my-reservations"],
    queryFn: () => api.get<Reservation[]>("/reservations/me").then((r) => r.data),
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { deskId: number; date: string; startTime: string; endTime: string; userId?: number }) =>
      api.post("/reservations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["my-reservations"] });
    },
  });
}

export function useCheckinReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/reservations/${id}/checkin`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["my-reservations"] });
    },
  });
}

export function useCheckoutReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/reservations/${id}/checkout`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["my-reservations"] });
    },
  });
}

export function useDeleteReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/reservations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["my-reservations"] });
    },
  });
}
