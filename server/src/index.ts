import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import authRoutes from "./routes/auth.routes";
import deskRoutes from "./routes/desk.routes";
import reservationRoutes from "./routes/reservation.routes";
import reportRoutes from "./routes/report.routes";
import userRoutes from "./routes/user.routes";
import settingRoutes from "./routes/setting.routes";
import lockerRoutes from "./routes/locker.routes";
import roomRoutes from "./routes/room.routes";

const app = express();
const PORT = process.env.PORT || 3002;

// CORS: em producao mesmo dominio, em dev aceita localhost
const isProd = process.env.NODE_ENV === "production";
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: isProd ? false : [/^http:\/\/localhost:/],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/desks", deskRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/lockers", lockerRoutes);
app.use("/api/rooms", roomRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Em producao: servir o frontend buildado
if (isProd) {
  const clientDist = path.join(__dirname, "../../client/dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} [${isProd ? "production" : "development"}]`);
});

// Auto-release job — runs every 5 minutes
const AUTO_RELEASE_INTERVAL = 5 * 60 * 1000;
setInterval(async () => {
  try {
    const base = `http://localhost:${PORT}/api`;
    await fetch(`${base}/reservations/auto-release`, { method: "POST", headers: { "Content-Type": "application/json" } });
    await fetch(`${base}/lockers/reservations/auto-release`, { method: "POST", headers: { "Content-Type": "application/json" } });
    await fetch(`${base}/rooms/reservations/auto-release`, { method: "POST", headers: { "Content-Type": "application/json" } });
  } catch {
    // silent
  }
}, AUTO_RELEASE_INTERVAL);
