import { apiRequest } from "./api-client";

export type BarberService = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

export type Barber = {
  id: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  services: BarberService[];
};

type BarbersResponse = {
  data: Barber[];
};

export async function getBarbers() {
  const response =
    await apiRequest<BarbersResponse>("/barbers");

  return response.data;
}