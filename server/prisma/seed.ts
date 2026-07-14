import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@escritorio.com" },
    update: { passwordHash: hash },
    create: {
      name: "Administrador",
      email: "admin@escritorio.com",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  const users = await Promise.all(
    ["Ana Oliveira", "Bruno Santos", "Carla Lima", "Daniel Costa"].map(
      (name) =>
        prisma.user.upsert({
          where: { email: `${name.toLowerCase().split(" ")[0]}@escritorio.com` },
          update: { passwordHash: hash },
          create: {
            name,
            email: `${name.toLowerCase().split(" ")[0]}@escritorio.com`,
            passwordHash: hash,
            role: "USER",
          },
        })
    )
  );

  const items: { label: string; x: number; y: number; width: number; height: number; rotation: number; isActive: boolean }[] = [];

  const MARGIN = 30, TOP_Y = 45, DESK_W = 105, DESK_H = 60, ITEM_GAP = 15, COL_GAP = 20, GROUP_GAP = 35, AQUA_W = 140;
  const AQUA_H = Math.floor((3 * DESK_H + ITEM_GAP) / 2);

  const dRow = [0, 1, 2].map((i) => TOP_Y + i * (DESK_H + ITEM_GAP));
  const aRow = [0, 1].map((i) => TOP_Y + i * (AQUA_H + ITEM_GAP));

  const aqX = [MARGIN, MARGIN + AQUA_W + COL_GAP, MARGIN + 2 * (AQUA_W + COL_GAP)];

  // Baias de vidro
  const aqTop = ["bv2", "bv4", "bv6"];
  const aqBot = ["bv1", "bv3", "bv5"];
  for (let i = 0; i < 3; i++) {
    items.push({ label: aqTop[i], x: aqX[i], y: aRow[0], width: AQUA_W, height: AQUA_H, rotation: 0, isActive: true });
    items.push({ label: aqBot[i], x: aqX[i], y: aRow[1], width: AQUA_W, height: AQUA_H, rotation: 0, isActive: true });
  }

  // Groups — left column then right column
  let x = aqX[2] + AQUA_W + GROUP_GAP;
  const groups = [
    { cols: [x, x + DESK_W + COL_GAP], prefix: "1" },
    { cols: [x + DESK_W + COL_GAP + DESK_W + GROUP_GAP, x + DESK_W + COL_GAP + DESK_W + GROUP_GAP + DESK_W + COL_GAP], prefix: "2" },
  ];
  // Calculate properly
  const g1 = [x, x + DESK_W + COL_GAP];
  x = g1[1] + DESK_W + GROUP_GAP;
  const g2 = [x, x + DESK_W + COL_GAP];
  x = g2[1] + DESK_W + GROUP_GAP;
  const g3 = [x, x + DESK_W + COL_GAP];

  const leftLetters = ["c", "b", "a"];
  const rightLetters = ["d", "e", "f"];

  for (const [cols, prefix] of [[g1, "1"], [g2, "2"], [g3, "3"]] as const) {
    for (let row = 0; row < 3; row++) {
      items.push({ label: `${prefix}${leftLetters[row]}`, x: cols[0], y: dRow[row], width: DESK_W, height: DESK_H, rotation: 0, isActive: true });
      items.push({ label: `${prefix}${rightLetters[row]}`, x: cols[1], y: dRow[row], width: DESK_W, height: DESK_H, rotation: 0, isActive: true });
    }
  }

  // remove desks that no longer match the new layout
  await prisma.reservationLog.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.desk.deleteMany();

  for (const item of items) {
    await prisma.desk.create({ data: item });
  }

  const defaults: Record<string, string> = {
    logoUrl: "/simoes_logo.png",
    faviconUrl: "/favicon.jpg",
    appName: "easyDesky",
    primary: "#354337",
    "primary-light": "#354337",
    accent: "#E14029",
    "accent-light": "#F5F8F5",
    success: "#2D8659",
    danger: "#B85450",
    info: "#2B6A8F",
    "bg-page": "#F5F8F5",
  };

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  const allLabels = items.map((i) => i.label).join(", ");

  // Lockers
  await prisma.lockerReservation.deleteMany();
  await prisma.locker.deleteMany();
  for (let i = 1; i <= 20; i++) {
    await prisma.locker.create({ data: { label: `L${i.toString().padStart(2, "0")}`, isActive: true } });
  }

  // Rooms
  await prisma.roomReservation.deleteMany();
  await prisma.room.deleteMany();
  await prisma.room.createMany({
    data: [
      { name: "Sala 1" },
      { name: "Sala 2" },
      { name: "Sala 3" },
    ],
  });

  console.log("Seed completo!");
  console.log(`  Admin: admin@escritorio.com / 123456`);
  console.log(`  Users: ana@escritorio.com, bruno@escritorio.com, carla@escritorio.com, daniel@escritorio.com / 123456`);
  console.log(`  Itens: ${allLabels}`);
  console.log(`  Lockers: 20 (L01-L20)`);
  console.log(`  Rooms: 3 salas de reunião`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
