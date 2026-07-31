import { apiRequest } from "./api-client";

export type AdminOverview = {
  customersCount: number;
  barbersCount: number;
  activeBarbersCount: number;
  inactiveBarbersCount: number;
  servicesCount: number;

  appointments: {
    today: number;
    pending: number;
    confirmed: number;
  };

  todayRevenue: number;
  date: string;
  timeZone: string;
};

type AdminOverviewResponse = {
  data: AdminOverview;
};

export type AdminAppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type AdminAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  localStartsAt: string;
  localEndsAt: string;

  status: AdminAppointmentStatus;
  notes: string | null;
  createdAt: string;

  cancelledAt: string | null;
  localCancelledAt: string | null;

  cancelledBy:
    | "CUSTOMER"
    | "BARBER"
    | "ADMIN"
    | "SYSTEM"
    | null;

  cancellationReason: string | null;

  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };

  barber: {
    id: string;
    name: string;
    active: boolean;
  };

  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  };

  timeZone: string;
};

export type AdminAppointmentFilters = {
  date?: string;
  status?: AdminAppointmentStatus | "";
  barberId?: string;
};

export type AdminAppointmentsData = {
  appointments: AdminAppointment[];
  count: number;

  filters: {
    date: string | null;
    status: AdminAppointmentStatus | null;
    barberId: string | null;
  };
};

type AdminAppointmentsResponse = {
  data: AdminAppointmentsData;
};

export async function getAdminOverview() {
  const response =
    await apiRequest<AdminOverviewResponse>(
      "/admin/overview",
    );

  return response.data;
}

export async function getAdminAppointments(
  filters: AdminAppointmentFilters = {},
) {
  const searchParams = new URLSearchParams();

  if (filters.date) {
    searchParams.set(
      "date",
      filters.date,
    );
  }

  if (filters.status) {
    searchParams.set(
      "status",
      filters.status,
    );
  }

  if (filters.barberId) {
    searchParams.set(
      "barberId",
      filters.barberId,
    );
  }

  const queryString =
    searchParams.toString();

  const response =
    await apiRequest<AdminAppointmentsResponse>(
      `/admin/appointments${
        queryString
          ? `?${queryString}`
          : ""
      }`,
    );

  return response.data;
}

export type UpdateAdminAppointmentStatus =
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type UpdateAdminAppointmentStatusInput = {
  appointmentId: string;
  status: UpdateAdminAppointmentStatus;
};

type UpdateAdminAppointmentStatusResponse = {
  message: string;

  data: {
    appointment: AdminAppointment;
  };
};

export async function updateAdminAppointmentStatus(
  input: UpdateAdminAppointmentStatusInput,
) {
  const response =
    await apiRequest<UpdateAdminAppointmentStatusResponse>(
      `/admin/appointments/${input.appointmentId}/status`,
      {
        method: "PATCH",

        body: JSON.stringify({
          status: input.status,
        }),
      },
    );

  return response.data.appointment;
}