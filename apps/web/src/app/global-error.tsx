"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Global error boundary — catches errors in the root layout.
 * Must be a Client Component. Resets the entire app on recovery.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-bg text-text font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="w-10 h-10 rounded-full bg-red-dim border border-red/30 flex items-center justify-center mb-4">
            <span className="font-mono text-[16px] text-red">!</span>
          </div>
          <h1 className="font-mono text-[15px] text-text mb-2">
            Something went wrong
          </h1>
          <p className="font-sans text-[12px] text-text2 max-w-sm mb-6">
            An unexpected error occurred. Try again or reload the page.
          </p>
          <Button variant="primary" size="sm" onClick={() => reset()}>
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
}
