import type { BookingStatus } from "./bookings";
import type { PaymentKind, PaymentMethod } from "./payments";

// Hand-written row types. Once the schema settles, replace with
// `npx supabase gen types typescript --local > src/lib/database.types.ts`.

export type Business = {
  id: string;
  name: string;
  towns: string[];
  phone: string | null;
  whatsapp: string | null;
  quote_validity_days: number;
  request_expiry_hours: number;
  payment_terms: string | null;
  terms: string | null;
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
  photo_path: string | null;
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
  delivery_fee: number;
  setup_fee: number;
  discount: number;
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

export type Quote = {
  id: string;
  reference: string;
  public_token: string;
  business_id: string;
  customer_name: string;
  customer_phone: string | null;
  start_date: string;
  end_date: string;
  delivery_fee: number;
  setup_fee: number;
  discount: number;
  deposit_amount: number;
  notes: string | null;
  status: "OPEN" | "ACCEPTED" | "CANCELLED";
  expires_at: string;
  booking_id: string | null;
  created_at: string;
};

/** What get_public_quote() returns for the customer's quote page. */
export type PublicQuote = {
  reference: string;
  status: "OPEN" | "ACCEPTED" | "CANCELLED" | "EXPIRED";
  customer_name: string;
  customer_phone: string | null;
  start_date: string;
  end_date: string;
  days: number;
  delivery_fee: number;
  setup_fee: number;
  discount: number;
  deposit_amount: number;
  total: number;
  notes: string | null;
  expires_at: string;
  business: {
    name: string;
    towns: string[];
    phone: string | null;
    whatsapp: string | null;
    payment_terms: string | null;
    terms: string | null;
  };
  items: { name: string; quantity: number; daily_price: number; photo_path: string | null }[];
};

/** What get_public_booking() returns for the customer's booking page. */
export type PublicBooking = {
  reference: string;
  status: BookingStatus;
  customer_name: string;
  start_date: string;
  end_date: string;
  days: number;
  delivery_fee: number;
  setup_fee: number;
  discount: number;
  deposit_amount: number;
  business: PublicQuote["business"];
  items: { name: string; quantity: number; daily_price: number }[];
  balance: { amount_due: number; amount_paid: number; outstanding: number; deposit_held: number };
  payments: {
    id: string;
    kind: PaymentKind;
    amount: number;
    method: PaymentMethod | null;
    paid_on: string;
    note: string | null;
    customer_confirmed_at: string | null;
  }[];
};
