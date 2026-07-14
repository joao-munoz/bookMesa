import { Calendar, LayoutGrid, FileText, Users, ClipboardList, ScrollText, Palette, X, Luggage, DoorOpen, Move } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

const navItems = [
  { label: "mapa", path: "/", icon: LayoutGrid },
  { label: "lockers", path: "/lockers", icon: Luggage },
  { label: "sala de reunião", path: "/salas", icon: DoorOpen },
  { label: "minhas reservas", path: "/minhas-reservas", icon: Calendar },
];

const adminItems = [
  { label: "gerenciar mesas", path: "/admin/mesas", icon: ClipboardList },
  { label: "editar mapa", path: "/admin/mapa-editor", icon: Move },
  { label: "gerenciar salas", path: "/admin/salas", icon: DoorOpen },
  { label: "usuarios", path: "/admin/users", icon: Users },
  { label: "todas reservas", path: "/admin/reservas", icon: Calendar },
  { label: "log de reservas", path: "/admin/log", icon: ScrollText },
  { label: "personalizar", path: "/admin/settings", icon: Palette },
  { label: "relatorios", path: "/admin/reports", icon: FileText },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const content = (
    <nav className="flex-1 py-4 space-y-1 px-3">
      <div className="flex items-center justify-between px-3 pb-3 sm:hidden">
        <span className="text-accent font-serif text-sm font-medium">Menu</span>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X size={18} />
        </button>
      </div>
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => handleNav(item.path)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-btn font-display transition-all duration-200",
            location.pathname === item.path
              ? "bg-accent/10 text-accent"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <item.icon size={18} />
          {item.label}
        </button>
      ))}

      {user?.role === "ADMIN" && (
        <>
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-medium text-white/30 uppercase tracking-wider">Admin</p>
          </div>
          {adminItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-btn font-display transition-all duration-200",
                location.pathname === item.path
                  ? "bg-accent/10 text-accent"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </>
      )}
    </nav>
  );

  return (
    <>
      <aside className="hidden sm:flex w-56 bg-primary border-r border-primary-light flex-col shrink-0">
        {content}
      </aside>
      {open && (
        <aside className="sm:hidden fixed left-0 top-16 bottom-0 w-64 bg-primary border-r border-primary-light flex-col z-30 animate-in slide-in-from-left">
          {content}
        </aside>
      )}
    </>
  );
}
