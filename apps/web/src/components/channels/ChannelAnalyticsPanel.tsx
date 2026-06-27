"use client";

import { cn } from "@/lib/utils";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

// ── Types ───────────────────────────────────────────────────────────────────

interface ChannelStats {
  totalMessages: number;
  newToday: number;
  memberCount?: number | null;
  mediaCount: number;
}

interface PostsPerDay {
  date: string;
  count: number;
}

interface MediaThumbnail {
  id: string;
  mediaType: string;
  r2SignedUrl?: string | null;
}

interface AlertRuleSummary {
  id: string;
  name: string;
  keyword: string;
  isActive: boolean;
  totalTriggers: number;
}

interface StorageUsage {
  usedBytes: number;
  maxBytes: number;
}

interface ChannelAnalyticsPanelProps {
  stats: ChannelStats | null;
  postsPerDay: PostsPerDay[];
  recentMedia: MediaThumbnail[];
  alertRules: AlertRuleSummary[];
  storageUsage: StorageUsage | null;
  channelId: string;
  isLoading: boolean;
  className?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface2 border border-border rounded-card p-3">
      <p className="font-mono text-[18px] text-accent font-medium">{value}</p>
      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-text3 mt-0.5">
        {label}
      </p>
    </div>
  );
}

// ── PostsPerDayChart ────────────────────────────────────────────────────────

function PostsPerDayChart({ data }: { data: PostsPerDay[] }) {
  if (!data.length) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mt-4">
      <MonoLabel>Posts per day</MonoLabel>
      <div className="flex items-end gap-[3px] h-[60px] mt-2">
        {data.map((day) => {
          const height = Math.max((day.count / maxCount) * 100, 4);
          const isToday = day.date === today;
          return (
            <div
              key={day.date}
              className="flex-1 rounded-sm transition-colors"
              style={{ height: `${height}%` }}
              title={`${day.count} posts on ${day.date}`}
              role="img"
              aria-label={`${day.count} posts on ${day.date}`}
            >
              <div
                className={cn(
                  "w-full h-full rounded-sm transition-colors",
                  isToday ? "bg-accent" : "bg-accent-dim hover:bg-accent/40"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MediaThumbnail ──────────────────────────────────────────────────────────

function MediaThumbnailItem({
  media,
  channelId,
  children,
}: {
  media: MediaThumbnail;
  channelId: string;
  children?: React.ReactNode;
}) {
  const isPhoto = media.mediaType === "photo";
  const isVideo = media.mediaType === "video" || media.mediaType === "animation";

  return (
    <Link
      href={`/dashboard/channels/${channelId}/media`}
      className={cn(
        "aspect-square rounded-card border border-border bg-surface2 flex items-center justify-center overflow-hidden transition-colors hover:border-accent",
        isPhoto && media.r2SignedUrl ? "" : ""
      )}
    >
      {media.r2SignedUrl && isPhoto ? (
        <img
          src={media.r2SignedUrl}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : isVideo ? (
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[18px] text-yellow">▶</span>
          {children}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[18px] text-text3">▣</span>
        </div>
      )}
    </Link>
  );
}

// ── StorageBar ──────────────────────────────────────────────────────────────

function StorageBar({ usage }: { usage: StorageUsage }) {
  const pct = usage.maxBytes > 0 ? (usage.usedBytes / usage.maxBytes) * 100 : 0;
  const isWarning = pct >= 80 && pct < 100;
  const isFull = pct >= 100;

  return (
    <div className="mt-4">
      <MonoLabel>Storage</MonoLabel>
      <div className="flex items-center justify-between mt-1 mb-1.5">
        <span className="font-mono text-[10px] text-text3">
          {formatBytes(usage.usedBytes)} used of {formatBytes(usage.maxBytes)}
        </span>
        <span
          className={cn(
            "font-mono text-[10px]",
            isFull ? "text-red" : isWarning ? "text-yellow" : "text-text3"
          )}
        >
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1 bg-surface2 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isFull ? "bg-red" : isWarning ? "bg-yellow" : "bg-accent"
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {isFull && (
        <p className="font-mono text-[10px] text-red mt-1">
          Storage full — upgrade to continue
        </p>
      )}
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Skeleton height="56px" />
        <Skeleton height="56px" />
        <Skeleton height="56px" />
        <Skeleton height="56px" />
      </div>
      <Skeleton height="80px" />
      <div className="grid grid-cols-4 gap-2">
        <Skeleton height="60px" />
        <Skeleton height="60px" />
        <Skeleton height="60px" />
        <Skeleton height="60px" />
      </div>
      <Skeleton height="48px" />
    </div>
  );
}

// ── ChannelAnalyticsPanel ───────────────────────────────────────────────────

export function ChannelAnalyticsPanel({
  stats,
  postsPerDay,
  recentMedia,
  alertRules,
  storageUsage,
  channelId,
  isLoading,
  className,
}: ChannelAnalyticsPanelProps) {
  if (isLoading) {
    return (
      <aside className={cn("w-[320px] shrink-0 p-4 bg-surface border-l border-border overflow-y-auto", className)}>
        <PanelSkeleton />
      </aside>
    );
  }

  return (
    <aside className={cn("w-[320px] shrink-0 p-4 bg-surface border-l border-border overflow-y-auto", className)}>
      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total messages" value={formatCount(stats.totalMessages)} />
          <StatCard label="New today" value={formatCount(stats.newToday)} />
          {stats.memberCount != null && (
            <StatCard label="Members" value={formatCount(stats.memberCount)} />
          )}
          <StatCard label="Media files" value={formatCount(stats.mediaCount)} />
        </div>
      )}

      {/* Posts per day chart */}
      {postsPerDay.length > 0 && <PostsPerDayChart data={postsPerDay} />}

      {/* Recent media */}
      {recentMedia.length > 0 && (
        <div className="mt-4">
          <MonoLabel>Recent media</MonoLabel>
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {recentMedia.slice(0, 8).map((m) => (
              <MediaThumbnailItem key={m.id} media={m} channelId={channelId} />
            ))}
          </div>
          {recentMedia.length > 8 && (
            <Link
              href={`/dashboard/channels/${channelId}/media`}
              className="block text-center font-mono text-[10px] text-text2 hover:text-accent mt-1.5"
            >
              +{recentMedia.length - 8} more
            </Link>
          )}
        </div>
      )}

      {/* Alert rules */}
      <div className="mt-4">
        <MonoLabel>Alert rules</MonoLabel>
        {alertRules.length > 0 ? (
          <div className="space-y-1.5 mt-2">
            {alertRules.slice(0, 3).map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-2 p-2 bg-surface2 rounded-card border border-border"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    rule.isActive ? "bg-green" : "bg-yellow"
                  )}
                />
                <span className="font-mono text-[10px] text-text2 truncate flex-1">
                  {rule.keyword}
                </span>
                <span className="font-mono text-[9px] text-text3">
                  {rule.totalTriggers} hits
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[10px] text-text3 mt-1">No alerts configured</p>
        )}
        <button
          disabled
          className="mt-2 font-mono text-[10px] text-text3 bg-surface2 rounded-btn px-3 py-1 border border-border opacity-50 cursor-not-allowed"
          title="Coming in Phase 2"
        >
          + Add alert rule
        </button>
      </div>

      {/* Storage usage */}
      {storageUsage && <StorageBar usage={storageUsage} />}
    </aside>
  );
}

export type {
  ChannelAnalyticsPanelProps,
  ChannelStats,
  PostsPerDay,
  MediaThumbnail,
  AlertRuleSummary,
  StorageUsage,
};