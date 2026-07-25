declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "CUSTOMER" | "BARBER" | "ADMIN";
      };
    }
  }
}

export {};