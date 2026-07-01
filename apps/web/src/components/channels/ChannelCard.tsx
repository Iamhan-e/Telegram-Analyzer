"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Confirm } from "@/components/ui/Confirm";

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

function StatusDot({ status }: { status: ChannelCardData["status"] }) {
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
  onToggle: (channelId: string, newValue: boolean) => void;
  onDelete: (channelId: string) => void;
}

export function ChannelCard({ channel, className, onToggle, onDelete }: ChannelCardProps) {
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

  const [confirmOpen, setConfirmOpen] = useState(false);
  const displayStatus: ChannelCardData["status"] = status ?? (isMonitoring ? "active" : "paused");

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(id, !isMonitoring);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    onDelete(id);
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-card border border-border bg-surface transition-colors",
          "hover:bg-surface2 hover:border-accent/30",
          className
        )}
      >
        {/* Clickable main area — navigates to channel detail */}
        <Link
          href={`/dashboard/channels/${id}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          {/* Photo / avatar */}
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

        {/* Actions — outside the link */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Pause/resume toggle */}
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              "h-7 px-2 rounded-btn border font-mono text-[10px] font-medium transition-all",
              isMonitoring
                ? "border-green/30 bg-green-dim text-green hover:bg-green-dim/70"
                : "border-border2 bg-transparent text-text3 hover:border-text2 hover:text-text"
            )}
          >
            {isMonitoring ? "Active" : "Paused"}
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={handleDeleteClick}
            className="h-7 w-7 rounded-btn border border-transparent flex items-center justify-center text-text3 hover:text-red hover:border-red/30 hover:bg-red-dim transition-all"
            title="Remove channel"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 3h8M4.5 3V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V3m-3 2.5v3m2-3v3M3 3l.5 6.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5L9 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <Confirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Remove ${title}`}
        body={`This will stop monitoring and remove "${title}" from your tracked channels. Messages already scraped will be kept.`}
        confirmString="remove"
        variant="danger"
      />
    </>
  );
}

export type { ChannelCardProps };
