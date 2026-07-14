import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export interface Room {
  id: number;
  name: string;
  isActive: boolean;
}

export interface RoomReservation {
  id: number;
  roomId: number;
  userId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "checked_in" | "missed" | "cancelled" | "completed";
  checkedInAt?: string;
  checkedOutAt?: string;
  room: Room;
  user?: { id: number; name: string; email: string };
}

// ---- Rooms ----

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => api.get<Room[]>("/rooms").then((r) => r.data),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) => api.post("/rooms", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; isActive?: boolean }) =>
      api.put(`/rooms/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/rooms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

// ---- Reservations ----

export function useRoomReservations(params?: { date?: string; roomId?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.date) searchParams.set("date", params.date);
  if (params?.roomId) searchParams.set("roomId", String(params.roomId));

  return useQuery({
    queryKey: ["room-reservations", params],
    queryFn: () =>
      api.get<RoomReservation[]>(`/rooms/reservations?${searchParams.toString()}`).then((r) => r.data),
  });
}

export function useMyRoomReservations() {
  return useQuery({
    queryKey: ["my-room-reservations"],
    queryFn: () => api.get<RoomReservation[]>("/rooms/my-reservations").then((r) => r.data),
  });
}

export function useCreateRoomReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { roomId: number; date: string; startTime: string; endTime: string }) =>
      api.post("/rooms/reservations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["room-reservations"] });
      qc.invalidateQueries({ queryKey: ["my-room-reservations"] });
    },
  });
}

export function useCheckinRoomReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/rooms/reservations/${id}/checkin`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["room-reservations"] });
      qc.invalidateQueries({ queryKey: ["my-room-reservations"] });
    },
  });
}

export function useCheckoutRoomReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/rooms/reservations/${id}/checkout`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["room-reservations"] });
      qc.invalidateQueries({ queryKey: ["my-room-reservations"] });
    },
  });
}

export function useDeleteRoomReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/rooms/reservations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["room-reservations"] });
      qc.invalidateQueries({ queryKey: ["my-room-reservations"] });
    },
  });
}
