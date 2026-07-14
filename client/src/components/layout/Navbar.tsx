import { LogOut, User, Settings, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

interface NavbarProps {
  onMenuToggle: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Record<string, string>>("/settings").then((r) => r.data),
    staleTime: 60000,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const appName = settings?.appName || "easyDesky";
  const logoUrl = settings?.logoUrl || "/simoes_logo.png";

  return (
    <header className="h-16 bg-primary border-b border-primary-light flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="sm:hidden text-white/60 hover:text-accent transition-colors"
        >
          <Menu size={22} />
        </button>
        <img src={logoUrl} alt={appName} className="h-10 w-auto object-contain" />
      </div>

      {user && (
        <div className="flex items-center gap-3 sm:gap-4">
          {user.role === "ADMIN" && (
            <button
              onClick={() => navigate("/admin/settings")}
              className="flex items-center gap-1.5 text-sm font-display text-white/70 hover:text-accent transition-colors"
              title="Personalizar"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">admin</span>
            </button>
          )}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
              <User size={14} className="text-accent" />
            </div>
            <span className="text-white/80 hidden sm:inline">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-danger transition-colors"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </header>
  );
}
