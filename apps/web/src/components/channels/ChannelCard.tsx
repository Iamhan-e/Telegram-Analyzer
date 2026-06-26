"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ChannelCardData {
  id: string;
  title: string;
  username?: string | null;
  photoUrl?: string | null;
  memberCount?: number | null;
  totalMessages: number;
  unreadCount: number;
  isMonitoring: boolean;
  lastScrapedAt?: string | null;
  /** "scraping" | "active" | "paused" | "error" */
  status?: "scraping" | "active" | "paused" | "error";
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Status dot ──────────────────────────────────────────────────────────────

function StatusDot({
  status,
}: {
  status: ChannelCardData["status"];
}) {
  const color = {
    active: "bg-green animate-pulse",
    scraping: "bg-yellow animate-pulse",
    paused: "bg-text3",
    error: "bg-red",
  }[status ?? "paused"];

  return <span className={cn("inline-block w-2 h-2 rounded-full shrink-0", color)} />;
}

// ── ChannelCard ─────────────────────────────────────────────────────────────

interface ChannelCardProps {
  channel: ChannelCardData;
  className?: string;
}

export function ChannelCard({ channel, className }: ChannelCardProps) {
  const {
    id,
    title,
    username,
    photoUrl,
    memberCount,
    totalMessages,
    unreadCount,
    isMonitoring,
    lastScrapedAt,
    status,
  } = channel;

  const displayStatus: ChannelCardData["status"] = status ?? (isMonitoring ? "active" : "paused");

  return (
    <Link
      href={`/dashboard/channels/${id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-card border border-border bg-surface transition-colors",
        "hover:bg-surface2 hover:border-accent/30",
        className
      )}
    >
      {/* Photo / avatar — 40px circle */}
      <div className="w-10 h-10 rounded-full bg-accent-dim border border-accent/30 flex items-center justify-center shrink-0 overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="font-mono text-[13px] text-accent">
            {initials(title)}
          </span>
        )}
      </div>

      {/* Metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-sans text-[13px] font-medium text-text truncate">
            {title}
          </h3>
          <StatusDot status={displayStatus} />
        </div>

        {username && (
          <p className="font-mono text-[11px] text-text3 truncate">
            @{username}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-text3">
          {memberCount != null && <span>{formatCount(memberCount)} members</span>}
          <span>{formatCount(totalMessages)} msgs</span>
          {lastScrapedAt && <span>synced {timeAgo(lastScrapedAt)}</span>}
        </div>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-[20px] bg-accent-dim border border-accent/30 font-mono text-[10px] text-accent shrink-0">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

export type { ChannelCardProps };