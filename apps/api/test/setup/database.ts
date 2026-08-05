import "./env.js";
import { prisma } from "../../src/lib/prisma.js";

export async function cleanupRegistrationUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return;
  }

  await prisma.session.deleteMany({
    where: { userId: user.id },
  });
  await prisma.authAccount.deleteMany({
    where: { userId: user.id },
  });
  await prisma.appointment.deleteMany({
    where: { customerId: user.id },
  });
  await prisma.user.delete({
    where: { id: user.id },
  });
}

export async function disconnectTestDatabase() {
  await prisma.$disconnect();
}

export { prisma };
