import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./context/AuthContext";
import { Layout } from "./components/layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyReservations from "./pages/MyReservations";
import Lockers from "./pages/Lockers";
import Rooms from "./pages/Rooms";
import DeskManagement from "./pages/admin/DeskManagement";
import EditMap from "./pages/admin/EditMap";
import UserManagement from "./pages/admin/UserManagement";
import AllReservations from "./pages/admin/AllReservations";
import RoomManagement from "./pages/admin/RoomManagement";
import Reports from "./pages/admin/Reports";
import ReservationLog from "./pages/admin/ReservationLog";
import Settings from "./pages/admin/Settings";
import api from "./lib/api";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ThemeLoader({ children }: { children: React.ReactNode }) {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Record<string, string>>("/settings").then((r) => r.data),
    staleTime: 60000,
  });

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      const colorKeys = ["primary", "primary-light", "accent", "accent-light", "success", "danger", "info", "bg-page"];
      for (const key of colorKeys) {
        if (settings[key]) {
          root.style.setProperty(`--color-${key}`, settings[key]);
        }
      }
      if (settings.appName) {
        document.title = settings.appName;
      }
      const favicon = settings.faviconUrl || "/favicon.jpg";
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") || document.createElement("link");
      link.rel = "icon";
      link.href = favicon;
      document.head.appendChild(link);
    }
  }, [settings]);

  return <>{children}</>;
}

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <img src="/simoes_logo.png" alt="Carregando" className="h-20 animate-pulse" />
      </div>
    );
  }

  return (
    <ThemeLoader>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/lockers" element={<Lockers />} />
          <Route path="/salas" element={<Rooms />} />
          <Route path="/minhas-reservas" element={<MyReservations />} />

          <Route path="/admin/mesas" element={<AdminRoute><DeskManagement /></AdminRoute>} />
          <Route path="/admin/mapa-editor" element={<AdminRoute><EditMap /></AdminRoute>} />
          <Route path="/admin/salas" element={<AdminRoute><RoomManagement /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="/admin/reservas" element={<AdminRoute><AllReservations /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/admin/log" element={<AdminRoute><ReservationLog /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeLoader>
  );
}
