"use client"; // Error pages must be Client Components.

import { Inter } from "next/font/google";
import { useEffect } from "react";
import { Button } from "@/components/button";
import { ErrorScreen } from "@/components/error-screen";
import "./globals.css";

// Shown when the root layout itself breaks, so it brings its own html, body,
// styles and font (the same Inter as src/app/layout.tsx).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background">
        <title>Something went wrong | RentLoop</title>
        <main>
          <ErrorScreen
            title="Something went wrong"
            message="RentLoop didn't load. It's not something you did. Try again in a moment."
            whatsAppMessage={`Hi RentLoop, the site didn't load for me.${error.digest ? ` Error code: ${error.digest}` : ""}`}
          >
            <Button wrap onClick={() => retry()}>
              Try again
            </Button>
          </ErrorScreen>
        </main>
      </body>
    </html>
  );
}
