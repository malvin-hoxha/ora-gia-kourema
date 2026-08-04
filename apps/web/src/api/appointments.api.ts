import { apiRequest } from "./api-client";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type PaymentMethod =
  | "PAY_AT_STORE"
  | "STRIPE";

export type PaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "REFUNDED";

  export type PaymentResultState =
  | "PAID"
  | "PROCESSING"
  | "PENDING"
  | "EXPIRED";

export type AppointmentPaymentResult = {
  appointmentId: string;

  state: PaymentResultState;

  appointmentStatus:
    AppointmentStatus;

  paymentStatus: PaymentStatus;

  checkoutStatus:
    | "open"
    | "complete"
    | "expired";

  stripePaymentStatus:
    | "paid"
    | "unpaid"
    | "no_payment_required";

  priceAtBooking: number | null;

  localStartsAt: string | null;
  localEndsAt: string | null;
  timeZone: string;

  paidAt: string | null;
  paymentExpiresAt: string | null;

  barber: {
    id: string;
    name: string;
  };

  service: {
    id: string;
    name: string;
    durationMinutes: number;
  };
};

type AppointmentPaymentResultResponse = {
  data: AppointmentPaymentResult;
};

export type CreateAppointmentInput = {
  barberId: string;
  serviceId: string;
  startsAt: string;
  notes?: string;
  paymentMethod: PaymentMethod;
};

export type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  localStartsAt: string;
  localEndsAt: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  timeZone: string;

  cancelledAt: string | null;

  cancelledBy:
    | "CUSTOMER"
    | "BARBER"
    | "ADMIN"
    | "SYSTEM"
    | null;

  cancellationReason: string | null;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  priceAtBooking: number | null;

  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;

  paymentExpiresAt: string | null;
  paidAt: string | null;
  refundedAt: string | null;

  barber: {
    id: string;
    name: string;
    imageUrl: string | null;
  };

  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  };
};

export type CreatedAppointment = Appointment & { checkoutUrl: string | null; };

export type MyAppointments = {
  upcoming: Appointment[];
  history: Appointment[];
};

type CreateAppointmentResponse = {
  message: string;
  data: CreatedAppointment;
};

type MyAppointmentsResponse = {
  data: MyAppointments;
};

type CancelAppointmentResponse = {
  message: string;
  data: Appointment;
};



export async function createAppointment(
  input: CreateAppointmentInput,
) {
  const response =
    await apiRequest<CreateAppointmentResponse>(
      "/appointments",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

  return response.data;
}

export async function getMyAppointments() {
  const response =
    await apiRequest<MyAppointmentsResponse>(
      "/appointments/me",
    );

  return response.data;
}

export async function cancelAppointment(
  appointmentId: string,
) {
  const response =
    await apiRequest<CancelAppointmentResponse>(
      `/appointments/${appointmentId}/cancel`,
      {
        method: "PATCH",
      },
    );

  return response.data;
}

export async function getAppointmentPaymentStatus(
  sessionId: string,
) {
  const response =
    await apiRequest<AppointmentPaymentResultResponse>(
      `/appointments/payment-status?sessionId=${encodeURIComponent(
        sessionId,
      )}`,
    );

  return response.data;
}