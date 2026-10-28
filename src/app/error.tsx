"use client"; // Error pages must be Client Components.

import { useEffect } from "react";
import { Button } from "@/components/button";
import { ErrorScreen } from "@/components/error-screen";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Shows in the browser console; the server side is under Logs in Vercel.
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      title="Something went wrong"
      message="This page didn't load. It's not something you did. Try again, or go back to the home page."
      whatsAppMessage={`Hi RentLoop, a page didn't load for me.${error.digest ? ` Error code: ${error.digest}` : ""}`}
    >
      <Button wrap onClick={() => retry()}>
        Try again
      </Button>
    </ErrorScreen>
  );
}
