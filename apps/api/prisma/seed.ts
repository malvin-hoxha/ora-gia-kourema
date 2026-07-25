import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const servicesData = [
  {
    name: "Classic Haircut",
    description: "Κούρεμα προσαρμοσμένο στο προσωπικό σου στυλ.",
    durationMinutes: 30,
    price: 15,
    active: true,
  },
  {
    name: "Haircut & Beard",
    description: "Ολοκληρωμένη περιποίηση για μαλλιά και γένια.",
    durationMinutes: 45,
    price: 22,
    active: true,
  },
  {
    name: "Beard Trim",
    description: "Σχηματισμός και περιποίηση γενειάδας.",
    durationMinutes: 20,
    price: 10,
    active: true,
  },
];

const barbersData = [
  {
    name: "Alex",
    bio: "Ειδικεύεται στα σύγχρονα fades και στα κλασικά ανδρικά κουρέματα.",
    imageUrl: null,
    serviceNames: [
      "Classic Haircut",
      "Haircut & Beard",
      "Beard Trim",
    ],
  },
  {
    name: "Nikos",
    bio: "Με έμφαση στη λεπτομέρεια, στα γένια και στο παραδοσιακό styling.",
    imageUrl: null,
    serviceNames: [
      "Classic Haircut",
      "Haircut & Beard",
      "Beard Trim",
    ],
  },
  {
    name: "Mario",
    bio: "Συνδυάζει μοντέρνες τεχνικές με καθαρές και διαχρονικές γραμμές.",
    imageUrl: null,
    serviceNames: [
      "Classic Haircut",
      "Haircut & Beard",
    ],
  },
];

const defaultWorkingHours = [
  {
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "18:00",
    active: true,
  },
  {
    dayOfWeek: 2,
    startTime: "09:00",
    endTime: "18:00",
    active: true,
  },
  {
    dayOfWeek: 3,
    startTime: "09:00",
    endTime: "18:00",
    active: true,
  },
  {
    dayOfWeek: 4,
    startTime: "09:00",
    endTime: "20:00",
    active: true,
  },
  {
    dayOfWeek: 5,
    startTime: "09:00",
    endTime: "20:00",
    active: true,
  },
  {
    dayOfWeek: 6,
    startTime: "09:00",
    endTime: "17:00",
    active: true,
  },
];

async function seedServices() {
  for (const service of servicesData) {
    await prisma.service.upsert({
      where: {
        name: service.name,
      },
      update: service,
      create: service,
    });
  }
}

async function seedBarbers() {
  const services = await prisma.service.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const serviceIdByName = new Map(
    services.map((service) => [service.name, service.id]),
  );

  for (const barberData of barbersData) {
    const barber = await prisma.barber.upsert({
      where: {
        name: barberData.name,
      },
      update: {
        bio: barberData.bio,
        imageUrl: barberData.imageUrl,
        active: true,
      },
      create: {
        name: barberData.name,
        bio: barberData.bio,
        imageUrl: barberData.imageUrl,
        active: true,
      },
    });

    await prisma.$transaction([
      prisma.barberService.deleteMany({
        where: {
          barberId: barber.id,
        },
      }),

      prisma.workingHours.deleteMany({
        where: {
          barberId: barber.id,
        },
      }),
    ]);

    const barberServices = barberData.serviceNames.map((serviceName) => {
      const serviceId = serviceIdByName.get(serviceName);

      if (!serviceId) {
        throw new Error(`Service "${serviceName}" was not found`);
      }

      return {
        barberId: barber.id,
        serviceId,
      };
    });

    await prisma.barberService.createMany({
      data: barberServices,
    });

    await prisma.workingHours.createMany({
      data: defaultWorkingHours.map((workingHours) => ({
        barberId: barber.id,
        ...workingHours,
      })),
    });
  }
}

async function seedDemoCustomer() {
  await prisma.user.upsert({
    where: {
      email: "customer@oragiakourema.local",
    },
    update: {
      name: "Demo Customer",
      phone: "6900000000",
      role: "CUSTOMER",
    },
    create: {
      name: "Demo Customer",
      email: "customer@oragiakourema.local",
      phone: "6900000000",
      role: "CUSTOMER",
      passwordHash: null,
    },
  });
}

async function main() {
  await seedServices();
  await seedBarbers();
  await seedDemoCustomer();
  
  console.log("Database seeded successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed the database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });