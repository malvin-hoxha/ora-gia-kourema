import { apiRequest } from "./api-client";

export type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
};

type ServicesResponse = {
  data: Service[];
};

export async function getServices() {
  const response =
    await apiRequest<ServicesResponse>("/services");

  return response.data;
}