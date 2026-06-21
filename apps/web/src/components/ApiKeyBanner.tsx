"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

/**
 * Persistent banner shown at the top of the dashboard when the user
 * hasn't connected their Telegram API key yet.
 *
 * Data comes from GET /api/keys — but since that endpoint doesn't exist yet
 * (TASK-010), we stub the check with a local state default of "not connected".
 * The real API call is wired in but will 404 gracefully until the endpoint
 * is built.
 */
export function ApiKeyBanner() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkKeyStatus() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          // Not authenticated — middleware will redirect, nothing to check
          return;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/keys`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );

        if (!res.ok) {
          // Endpoint not built yet (TASK-010) — default to "no key" state
          if (!cancelled) setHasKey(false);
          return;
        }

        const data = await res.json();
        if (!cancelled) setHasKey(data.has_key);
      } catch {
        // API not reachable — default to "no key" state
        if (!cancelled) setHasKey(false);
      }
    }

    checkKeyStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  // null = still checking, false = no key, true = has key — only show banner when we know key is missing
  if (hasKey === null || hasKey === true) return null;

  return (
    <div className="bg-yellow/10 border border-yellow/30 rounded-panel px-4 py-2.5 flex items-center justify-between gap-4">
      <p className="font-mono text-[11px] text-yellow">
        Connect your Telegram API key to get started.
      </p>
      <Link
        href="/dashboard/settings"
        className="font-mono text-[11px] text-yellow hover:underline whitespace-nowrap shrink-0"
      >
        Open settings →
      </Link>
    </div>
  );
}

export type { };
