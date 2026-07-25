export type Service = {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
};

export const services: Service[] = [
  {
    id: 1,
    name: "Classic Haircut",
    description: "Κούρεμα προσαρμοσμένο στο προσωπικό σου στυλ.",
    duration: 30,
    price: 15,
  },
  {
    id: 2,
    name: "Haircut & Beard",
    description: "Ολοκληρωμένη περιποίηση για μαλλιά και γένια.",
    duration: 45,
    price: 22,
  },
  {
    id: 3,
    name: "Beard Trim",
    description: "Σχηματισμός και περιποίηση γενειάδας.",
    duration: 20,
    price: 10,
  },
];