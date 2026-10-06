import type { BookingStatus } from "./bookings";

// Hand-written row types. Once the schema settles, replace with
// `npx supabase gen types typescript --local > src/lib/database.types.ts`.

export type Business = {
  id: string;
  name: string;
  towns: string[];
  phone: string | null;
  whatsapp: string | null;
};

export type Item = {
  id: string;
  business_id: string;
  name: string;
  category: string;
  description: string | null;
  quantity_owned: number;
  units_out_of_service: number;
  daily_price: number;
  deposit: number;
  replacement_value: number | null;
  turnaround_days: number;
  low_stock_threshold: number;
  archived: boolean;
};

export type Category = { slug: string; name: string };

export type Booking = {
  id: string;
  reference: string;
  business_id: string;
  customer_id: string;
  source: "direct" | "marketplace";
  status: BookingStatus;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  notes: string | null;
  request_expires_at: string | null;
  created_at: string;
};

export type AvailabilityRow = {
  item_id: string;
  day: string;
  in_service: number;
  booked: number;
  available: number;
};
