"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Route-level error boundary — catches errors in any page below this level.
 * Preserves the layout shell (sidebar, topbar) on recoverable errors.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-10 h-10 rounded-full bg-red-dim border border-red/30 flex items-center justify-center mb-4">
        <span className="font-mono text-[16px] text-red">!</span>
      </div>
      <h2 className="font-mono text-[13px] text-text2 mb-2">
        Failed to load this page
      </h2>
      <p className="font-sans text-[12px] text-text3 max-w-sm mb-6">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button variant="primary" size="sm" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
