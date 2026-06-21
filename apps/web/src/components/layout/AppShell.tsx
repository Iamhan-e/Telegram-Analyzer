"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

// ── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface AppShellProps {
  children: React.ReactNode;
  /** Optional topbar content: channel title, metadata, action buttons */
  topbar?: React.ReactNode;
  /** Show the terminal footer (only on channel detail pages) */
  showTerminalFooter?: boolean;
  /** Monitoring status text for the terminal footer */
  monitoringStatus?: string;
  /** Interval between polls in seconds (for countdown) */
  pollingIntervalSec?: number;
  /** Last sync timestamp (ISO string) */
  lastSyncAt?: string | null;
}

// ── Navigation items ───────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "◧" },
  { href: "/dashboard/channels", label: "Channels", icon: "◫" },
  { href: "/dashboard/messages", label: "Messages", icon: "◩" },
  { href: "/dashboard/media", label: "Media", icon: "◨" },
  { href: "/dashboard/exports", label: "Exports", icon: "◪" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "◭" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
];

// ── Terminal footer ────────────────────────────────────────────────────────

function TerminalFooter({
  status = "Idle",
  intervalSec = 60,
  lastSyncAt,
}: {
  status?: string;
  intervalSec?: number;
  lastSyncAt?: string | null;
}) {
  const [countdown, setCountdown] = useState(intervalSec);

  useEffect(() => {
    setCountdown(intervalSec);
  }, [lastSyncAt, intervalSec]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return intervalSec;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [intervalSec]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="h-8 flex items-center gap-2 px-3 bg-surface border-t border-border font-mono text-[10px] text-text3 shrink-0">
      <span className="text-accent">▶</span>
      <span>{status}</span>
      <span className="ml-auto">
        next sync in {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
      <span className="inline-block w-[6px] h-[13px] bg-accent animate-blink" />
    </div>
  );
}

// ── Live dot ────────────────────────────────────────────────────────────────

function LiveDot({ active }: { active?: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
        active
          ? "bg-green animate-pulse"
          : "bg-text3"
      }`}
    />
  );
}

// ── AppShell ────────────────────────────────────────────────────────────────

export default function AppShell({
  children,
  topbar,
  showTerminalFooter = false,
  monitoringStatus = "Idle",
  pollingIntervalSec = 60,
  lastSyncAt,
}: AppShellProps) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch user session on mount
  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!cancelled && session?.user?.email) {
          setUserEmail(session.user.email);
        }
      } catch {
        // Not signed in — middleware handles redirect
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
          SIDEBAR — 220px fixed
          ═══════════════════════════════════════════════════════════════════ */}
      <aside className="w-[220px] flex-shrink-0 bg-surface border-r border-border flex flex-col">
        {/* Logo area — 56px */}
        <div className="h-14 flex items-center gap-2.5 px-3 border-b border-border">
          <div className="w-7 h-7 rounded-chip bg-accent-dim border border-accent flex items-center justify-center font-mono text-[15px] text-accent font-medium">
            tg
          </div>
          <span className="font-mono text-[13px] text-text font-medium">
            tg[scan]
          </span>
        </div>

        {/* Channel list placeholder — will be populated when channels exist */}
        <div className="px-3 py-2 border-b border-border">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text3 mb-1">
            Channels
          </p>
          <p className="font-sans text-[11px] text-text3 italic">
            No channels yet
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 h-8 px-3 rounded-btn font-mono text-[11px] transition-colors ${
                  active
                    ? "bg-accent-dim text-accent border-l-[2px] border-accent"
                    : "text-text2 hover:bg-surface2 hover:text-text border-l-[2px] border-transparent"
                }`}
              >
                <span className="text-[10px] w-4 text-center shrink-0">
                  {item.icon}
                </span>
                {item.label}
                {item.label === "Alerts" && (
                  <span className="ml-auto font-mono text-[9px] text-text3 bg-surface2 px-1.5 rounded-chip">
                    SOON
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-2.5 border-t border-border flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-[26px] h-[26px] rounded-full bg-accent-dim border border-accent/30 flex items-center justify-center font-mono text-[11px] text-accent shrink-0">
            {userEmail ? userEmail.charAt(0).toUpperCase() : "?"}
          </div>
          {/* Email + tier */}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] text-text truncate">
              {userEmail || "Loading…"}
            </p>
            <p className="font-mono text-[9px] text-text3">
              ● free
            </p>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN AREA
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — 48px */}
        {topbar && (
          <div className="h-12 flex items-center gap-3 px-4 bg-surface border-b border-border shrink-0">
            {topbar}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Terminal footer — 32px, shown only on channel detail pages */}
        {showTerminalFooter && (
          <TerminalFooter
            status={monitoringStatus}
            intervalSec={pollingIntervalSec}
            lastSyncAt={lastSyncAt}
          />
        )}
      </div>
    </div>
  );
}

export { LiveDot, TerminalFooter };
export type { AppShellProps, NavItem };
