import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import api from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Record<string, string>>("/settings").then((r) => r.data),
    staleTime: 60000,
  });

  const logoUrl = settings?.logoUrl || "/simoes_logo.png";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background_sr.jpg')" }}
      />
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-md px-6">
        <div className="text-center mb-8">
          <img src={logoUrl} alt="logo" className="h-20 mx-auto object-contain" />
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-2">
              <h1 className="text-xl font-display text-primary font-semibold">Reserve sua mesa e locker</h1>
              <p className="text-sm text-muted mt-1">acesse sua conta para continuar</p>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#D0D0D0] bg-white text-[#2C2C2C] placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              placeholder="email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#D0D0D0] bg-white text-[#2C2C2C] placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              placeholder="senha"
              required
            />

            {error && (
              <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3 border border-danger/20">{error}</p>
            )}

            <Button type="submit" variant="primary" className="w-full h-11 text-btn rounded-xl" disabled={loading}>
              {loading ? "entrando..." : "entrar"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted mt-6">
            &copy; {new Date().getFullYear()} Simões Ribeiro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}