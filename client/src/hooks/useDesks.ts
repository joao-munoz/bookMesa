import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

export interface Desk {
  id: number;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isActive: boolean;
}

export function useDesks() {
  return useQuery({
    queryKey: ["desks"],
    queryFn: () => api.get<Desk[]>("/desks").then((r) => r.data),
  });
}

export function useUpdateDesk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Desk> & { id: number }) =>
      api.put(`/desks/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["desks"] }),
  });
}

export function useCreateDesk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Desk, "id">) => api.post("/desks", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["desks"] }),
  });
}

export function useDeleteDesk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/desks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["desks"] }),
  });
}
