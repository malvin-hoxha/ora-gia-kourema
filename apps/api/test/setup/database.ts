import "./env.js";
import argon2 from "argon2";
import { prisma } from "../../src/lib/prisma.js";

type PasswordUserInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

type TestUserRole = "CUSTOMER" | "BARBER" | "ADMIN";

export async function createPasswordUser(
  input: PasswordUserInput,
  role: TestUserRole = "CUSTOMER",
) {
  const passwordHash = await argon2.hash(
    input.password,
    { type: argon2.argon2id },
  );

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role,
    },
  });

  return {
    user,
    password: input.password,
  };
}

export async function cleanupAuthData(email: string) {
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
