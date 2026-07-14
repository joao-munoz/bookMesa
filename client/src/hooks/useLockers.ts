import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export interface Locker {
  id: number;
  label: string;
  isActive: boolean;
}

export interface LockerReservation {
  id: number;
  userId: number;
  lockerId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "checked_in" | "missed" | "cancelled" | "completed";
  checkedInAt?: string;
  checkedOutAt?: string;
  locker: Locker;
  user?: { id: number; name: string; email: string };
}

export function useLockers() {
  return useQuery({
    queryKey: ["lockers"],
    queryFn: () => api.get<Locker[]>("/lockers").then((r) => r.data),
  });
}

export function useLockerReservations(date?: string) {
  return useQuery({
    queryKey: ["locker-reservations", date],
    queryFn: () =>
      api
        .get<LockerReservation[]>("/lockers/reservations", { params: { date } })
        .then((r) => r.data),
    enabled: !!date,
  });
}

export function useMyLockerReservations() {
  return useQuery({
    queryKey: ["my-locker-reservations"],
    queryFn: () =>
      api.get<LockerReservation[]>("/lockers/my-reservations").then((r) => r.data),
  });
}

export function useCreateLockerReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { lockerId: number; date: string; startTime: string; endTime: string }) =>
      api.post("/lockers/reservations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locker-reservations"] });
      qc.invalidateQueries({ queryKey: ["my-locker-reservations"] });
    },
  });
}

export function useCheckinLockerReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/lockers/reservations/${id}/checkin`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locker-reservations"] });
      qc.invalidateQueries({ queryKey: ["my-locker-reservations"] });
    },
  });
}

export function useCheckoutLockerReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/lockers/reservations/${id}/checkout`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locker-reservations"] });
      qc.invalidateQueries({ queryKey: ["my-locker-reservations"] });
    },
  });
}

export function useDeleteLockerReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/lockers/reservations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locker-reservations"] });
      qc.invalidateQueries({ queryKey: ["my-locker-reservations"] });
    },
  });
}

export function useUpdateLocker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api.put(`/lockers/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lockers"] }),
  });
}
