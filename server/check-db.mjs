import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const u = await p.user.findMany();
  console.log(JSON.stringify(u, null, 2));
} catch (e) {
  console.error(e);
} finally {
  await p.$disconnect();
}
