import { apiRequest } from "./api-client";

export type AdminService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;

  _count: {
    barbers: number;
    appointments: number;
  };
};

export type AdminServiceInput = {
  name: string;
  description: string | null;
  price: number;
  active: boolean;
};

export type UpdateAdminServiceInput = {
  serviceId: string;
  data: Partial<AdminServiceInput>;
};

type AdminServicesResponse = {
  data: {
    services: AdminService[];
    count: number;
  };
};

type AdminServiceResponse = {
  message: string;

  data: {
    service: AdminService;
  };
};

export async function getAdminServices() {
  const response =
    await apiRequest<AdminServicesResponse>(
      "/admin/services",
    );

  return response.data;
}

export async function createAdminService(
  input: AdminServiceInput,
) {
  const response =
    await apiRequest<AdminServiceResponse>(
      "/admin/services",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

  return response.data.service;
}

export async function updateAdminService(
  input: UpdateAdminServiceInput,
) {
  const response =
    await apiRequest<AdminServiceResponse>(
      `/admin/services/${input.serviceId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input.data),
      },
    );

  return response.data.service;
}