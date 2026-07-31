import { apiRequest } from "./api-client";

export type AdminBarberService = {
  id: string;
  name: string;
  active: boolean;
  durationMinutes: number;
  price: number;
};

export type AdminBarberUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  barber: {
    id: string;
    name: string;
  } | null;
};

export type AdminBarber = {
  id: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: "BARBER";
  } | null;
  services: AdminBarberService[];
  _count: {
    appointments: number;
    timeOff: number;
    workingHours: number;
  };
};

export type AdminBarberInput = {
  name: string;
  bio: string | null;
  imageUrl: string | null;
  active: boolean;
  userId: string | null;
  serviceIds: string[];
};

export type UpdateAdminBarberInput = {
  barberId: string;
  data: Partial<AdminBarberInput>;
};

type AdminBarbersResponse = {
  data: {
    barbers: AdminBarber[];
    count: number;
  };
};

type AdminBarberUsersResponse = {
  data: {
    users: AdminBarberUser[];
  };
};

type AdminBarberResponse = {
  message: string;
  data: {
    barber: AdminBarber;
  };
};

export async function getAdminBarbers() {
  const response =
    await apiRequest<AdminBarbersResponse>(
      "/admin/barbers",
    );

  return response.data;
}

export async function getAdminBarberUsers() {
  const response =
    await apiRequest<AdminBarberUsersResponse>(
      "/admin/barber-users",
    );

  return response.data.users;
}

export async function createAdminBarber(
  input: AdminBarberInput,
) {
  const response =
    await apiRequest<AdminBarberResponse>(
      "/admin/barbers",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

  return response.data.barber;
}

export async function updateAdminBarber(
  input: UpdateAdminBarberInput,
) {
  const response =
    await apiRequest<AdminBarberResponse>(
      `/admin/barbers/${input.barberId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input.data),
      },
    );

  return response.data.barber;
}

import type {
  AdminAppointment,
} from "./admin.api";

export type AdminBarberDetailsService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
};

export type AdminBarberWorkingHour = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

export type AdminBarberTimeOff = {
  id: string;
  startsAt: string;
  endsAt: string;
  localStartsAt: string;
  localEndsAt: string;
  reason: string | null;
  timeZone: string;
};

export type AdminBarberDetails = {
  barber: {
    id: string;
    name: string;
    bio: string | null;
    imageUrl: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;

    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      role: "BARBER";
    } | null;

    services:
      AdminBarberDetailsService[];

    workingHours:
      AdminBarberWorkingHour[];
  };

  upcomingTimeOff:
    AdminBarberTimeOff[];

  activeAppointments:
    AdminAppointment[];

  counts: {
    services: number;
    workingDays: number;
    upcomingTimeOff: number;
    activeAppointments: number;
  };

  timeZone: string;
};

type AdminBarberDetailsResponse = {
  data: AdminBarberDetails;
};

export async function getAdminBarberDetails(
  barberId: string,
) {
  const response =
    await apiRequest<AdminBarberDetailsResponse>(
      `/admin/barbers/${barberId}/details`,
    );

  return response.data;
}

export type AdminWorkingHoursItem = {
  id: string;
  barberId: string;
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  active: boolean;
};

export type AdminWorkingHoursInputItem = {
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  active: boolean;
};

export type AdminBarberWorkingHoursData = {
  barber: {
    id: string;
    name: string;
  };

  workingHours: AdminWorkingHoursItem[];
};

type AdminBarberWorkingHoursResponse = {
  data: AdminBarberWorkingHoursData;
};

type UpdateAdminBarberWorkingHoursResponse = {
  message: string;
  data: AdminBarberWorkingHoursData;
};

export async function getAdminBarberWorkingHours(
  barberId: string,
) {
  const response =
    await apiRequest<AdminBarberWorkingHoursResponse>(
      `/admin/barbers/${barberId}/working-hours`,
    );

  return response.data;
}

export async function updateAdminBarberWorkingHours({
  barberId,
  workingHours,
}: {
  barberId: string;
  workingHours: AdminWorkingHoursInputItem[];
}) {
  const response =
    await apiRequest<UpdateAdminBarberWorkingHoursResponse>(
      `/admin/barbers/${barberId}/working-hours`,
      {
        method: "PUT",

        body: JSON.stringify({
          workingHours,
        }),
      },
    );

  return response.data;
}

type DeleteAdminBarberTimeOffResponse = {
  message: string;

  data: {
    timeOff: {
      id: string;
      startsAt: string;
      endsAt: string;
      reason: string | null;
    };
  };
};

export async function deleteAdminBarberTimeOff({
  barberId,
  timeOffId,
}: {
  barberId: string;
  timeOffId: string;
}) {
  const response =
    await apiRequest<DeleteAdminBarberTimeOffResponse>(
      `/admin/barbers/${barberId}/time-off/${timeOffId}`,
      {
        method: "DELETE",
      },
    );

  return response.data.timeOff;
}