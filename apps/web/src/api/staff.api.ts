import { apiRequest } from "./api-client";
import type {
  AppointmentStatus,
} from "./appointments.api";

export type StaffAppointmentStatus =
  AppointmentStatus;

export type StaffAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  localStartsAt: string;
  localEndsAt: string;
  status: StaffAppointmentStatus;
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

  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };

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

export type StaffAppointmentsFilters = {
  date?: string;
  status?: StaffAppointmentStatus | "";
};

export type UpdateAppointmentStatus =
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

type StaffAppointmentsResponse = {
  data: {
    appointments: StaffAppointment[];

    filters: {
      date: string | null;
      status: StaffAppointmentStatus | null;
    };
  };
};

type UpdateAppointmentStatusResponse = {
  message: string;
  data: StaffAppointment;
};

export async function getStaffAppointments(
  filters: StaffAppointmentsFilters,
) {
  const searchParams = new URLSearchParams();

  if (filters.date) {
    searchParams.set("date", filters.date);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  const queryString = searchParams.toString();

  const path = queryString
    ? `/staff/appointments?${queryString}`
    : "/staff/appointments";

  const response =
    await apiRequest<StaffAppointmentsResponse>(
      path,
    );

  return response.data;
}

export async function updateStaffAppointmentStatus(
  input: {
    appointmentId: string;
    status: UpdateAppointmentStatus;
  },
) {
  const response =
    await apiRequest<UpdateAppointmentStatusResponse>(
      `/staff/appointments/${input.appointmentId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: input.status,
        }),
      },
    );

  return response.data;
}

export type WorkingDay = {
  dayOfWeek: number;
  active: boolean;
  startTime: string | null;
  endTime: string | null;
};

type WorkingHoursResponse = {
  data: {
    workingHours: WorkingDay[];
  };
};

type UpdateWorkingHoursResponse = {
  message: string;
  data: {
    workingHours: WorkingDay[];
  };
};

export async function getStaffWorkingHours() {
  const response =
    await apiRequest<WorkingHoursResponse>(
      "/staff/working-hours",
    );

  return response.data.workingHours;
}

export async function updateStaffWorkingHours(
  workingHours: WorkingDay[],
) {
  const response =
    await apiRequest<UpdateWorkingHoursResponse>(
      "/staff/working-hours",
      {
        method: "PUT",
        body: JSON.stringify({
          workingHours,
        }),
      },
    );

  return response.data.workingHours;
}

export type TimeOffInput = {
  date: string;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

export type StaffTimeOff = {
  id: string;
  startsAt: string;
  endsAt: string;
  localStartsAt: string;
  localEndsAt: string;
  reason: string | null;
  timeZone: string;
  createdAt?: string;
};

export type TimeOffConflictAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  localStartsAt: string;
  localEndsAt: string;
  status: "PENDING" | "CONFIRMED";

  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };

  service: {
    id: string;
    name: string;
    durationMinutes: number;
  };
};

export type TimeOffPreview = {
  proposedTimeOff: {
    date: string;
    allDay: boolean;
    startsAt: string;
    endsAt: string;
    localStartsAt: string;
    localEndsAt: string;
    timeZone: string;
    reason: string | null;
  };

  conflictingTimeOff: {
    id: string;
    startsAt: string;
    endsAt: string;
    localStartsAt: string;
    localEndsAt: string;
    reason: string | null;
  } | null;

  conflictingAppointments:
    TimeOffConflictAppointment[];

  conflictingAppointmentsCount: number;
  canCreate: boolean;
};

type TimeOffPreviewResponse = {
  data: TimeOffPreview;
};

type CreateTimeOffResponse = {
  message: string;

  data: {
    timeOff: StaffTimeOff;

    cancelledAppointments:
      TimeOffConflictAppointment[];

    cancelledAppointmentsCount: number;
  };
};

type StaffTimeOffResponse = {
  data: {
    timeOff: StaffTimeOff[];
  };
};

type DeleteTimeOffResponse = {
  message: string;

  data: {
    id: string;
  };
};

export async function previewStaffTimeOff(
  input: TimeOffInput,
) {
  const response =
    await apiRequest<TimeOffPreviewResponse>(
      "/staff/time-off/preview",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

  return response.data;
}

export async function createStaffTimeOff(
  input: TimeOffInput,
) {
  const response =
    await apiRequest<CreateTimeOffResponse>(
      "/staff/time-off",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

  return response.data;
}

export async function getStaffTimeOff() {
  const response =
    await apiRequest<StaffTimeOffResponse>(
      "/staff/time-off",
    );

  return response.data.timeOff;
}

export async function deleteStaffTimeOff(
  timeOffId: string,
) {
  const response =
    await apiRequest<DeleteTimeOffResponse>(
      `/staff/time-off/${timeOffId}`,
      {
        method: "DELETE",
      },
    );

  return response.data;
}