export const BUSINESS_TYPES = [
  { label: "Salon", value: "salon" },
  { label: "Spa", value: "spa" },
  { label: "Gym", value: "gym" },
  { label: "Cafe", value: "cafe" },
  { label: "Clinic", value: "clinic" },
  { label: "Car Wash", value: "car_wash" },
  { label: "Other", value: "other" },
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

export const TEMPLATES: Record<
  BusinessType,
  {
    services: { name: string; price: number }[];
    products: { name: string; price: number }[];
  }
> = {
  salon: {
    services: [
      { name: "Men's Haircut", price: 30000 },
      { name: "Women's Haircut", price: 60000 },
      { name: "Hair Color", price: 150000 },
    ],
    products: [
      { name: "Premium Shampoo", price: 80000 },
      { name: "Hair Serum", price: 50000 },
    ],
  },
  spa: {
    services: [
      { name: "Full Body Massage", price: 200000 },
      { name: "Facial", price: 120000 },
    ],
    products: [
      { name: "Essential Oil", price: 60000 },
      { name: "Body Scrub", price: 75000 },
    ],
  },
  gym: {
    services: [
      { name: "Monthly Membership", price: 200000 },
      { name: "Personal Training", price: 100000 },
    ],
    products: [
      { name: "Protein Powder", price: 300000 },
      { name: "Energy Bar", price: 15000 },
    ],
  },
  cafe: {
    services: [
      { name: "Latte", price: 20000 },
      { name: "Cappuccino", price: 20000 },
    ],
    products: [
      { name: "Coffee Beans 250g", price: 45000 },
      { name: "Ceramic Mug", price: 30000 },
    ],
  },
  clinic: {
    services: [
      { name: "Consultation", price: 50000 },
      { name: "Follow-up", price: 30000 },
    ],
    products: [{ name: "Vitamin Supplements", price: 60000 }],
  },
  car_wash: {
    services: [
      { name: "Basic Wash", price: 30000 },
      { name: "Premium Detailing", price: 150000 },
    ],
    products: [
      { name: "Car Wax", price: 50000 },
      { name: "Microfiber Towel", price: 15000 },
    ],
  },
  other: {
    services: [{ name: "Standard Service", price: 50000 }],
    products: [{ name: "Standard Product", price: 50000 }],
  },
};
