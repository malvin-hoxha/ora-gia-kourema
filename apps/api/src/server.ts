import type { Server } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

let server: Server | undefined;
let prismaConnected = false;
let shutdownPromise: Promise<void> | undefined;

function listenForRequests() {
  return new Promise<void>((resolve, reject) => {
    const listeningServer = app.listen(env.PORT);
    server = listeningServer;

    const handleListening = () => {
      listeningServer.off("error", handleError);
      resolve();
    };

    const handleError = (error: Error) => {
      listeningServer.off("listening", handleListening);
      reject(error);
    };

    listeningServer.once("listening", handleListening);
    listeningServer.once("error", handleError);
  });
}

async function startServer() {
  try {
    await prisma.$connect();
    prismaConnected = true;

    await listenForRequests();

    console.log(`API running at http://localhost:${env.PORT}`);
  } catch (error) {
    console.error("Failed to start the server:", error);
    await shutdown("Startup failure", 1);
  }
}

function closeHttpServer() {
  const activeServer = server;
  server = undefined;

  if (!activeServer?.listening) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    activeServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function shutdown(reason: string, requestedExitCode = 0) {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shutdownPromise = (async () => {
    console.log(`${reason}. Closing server...`);

    let exitCode = requestedExitCode;

    try {
      await closeHttpServer();
    } catch (error) {
      exitCode = 1;
      console.error("Failed to close the HTTP server:", error);
    }

    if (prismaConnected) {
      try {
        await prisma.$disconnect();
        prismaConnected = false;
      } catch (error) {
        exitCode = 1;
        console.error("Failed to disconnect Prisma:", error);
      }
    }

    process.exit(exitCode);
  })();

  return shutdownPromise;
}

process.on("SIGINT", () => {
  void shutdown("SIGINT received");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM received");
});

void startServer();
