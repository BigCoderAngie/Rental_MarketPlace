import type { Metadata } from "next";
import { ErrorScreen } from "@/components/error-screen";

export const metadata: Metadata = { title: "Page not found | RentLoop" };

export default function NotFound() {
  return (
    <ErrorScreen
      title="We couldn't find that page"
      message="The link may be old or typed wrong, or the listing was taken down."
      whatsAppMessage="Hi RentLoop, a link I opened says the page can't be found."
    />
  );
}
