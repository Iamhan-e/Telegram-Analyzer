"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { MessageFeed } from "@/components/feed/MessageFeed";
import { ChannelAnalyticsPanel } from "@/components/channels/ChannelAnalyticsPanel";
import { createClient } from "@/lib/supabase";
import type { MessageData } from "@/components/feed/MessageFeed";
import type {
  ChannelStats,
  PostsPerDay,
  MediaThumbnail,
  AlertRuleSummary,
  StorageUsage,
} from "@/components/channels/ChannelAnalyticsPanel";

// ── Types ───────────────────────────────────────────────────────────────────

interface ChannelDetail {
  id: string;
  title: string;
  username?: string | null;
  description?: string | null;
  memberCount?: number | null;
  totalMessages: number;
  mediaCount: number;
  isMonitoring: boolean;
  lastScrapedAt?: string | null;
  status?: "scraping" | "active" | "paused" | "error";
}

type MessageFilter = "all" | "text" | "media" | "forwarded";

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

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── ChannelDetailSkeleton ───────────────────────────────────────────────────

function ChannelDetailSkeleton() {
  return (
    <div className="flex flex-1">
      <div className="flex-1 p-4 space-y-3">
        <MessageFeedSkeleton />
      </div>
      <div className="w-[320px] shrink-0 bg-surface border-l border-border p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Skeleton height="56px" />
            <Skeleton height="56px" />
            <Skeleton height="56px" />
            <Skeleton height="56px" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageFeedSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-3 rounded-card border border-border bg-surface">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-24 h-3 bg-surface2 rounded animate-shimmer" />
              <div className="w-10 h-3 bg-surface2 rounded animate-shimmer" />
            </div>
            <div className="w-16 h-3 bg-surface2 rounded animate-shimmer" />
          </div>
          <div className="space-y-2">
            <div className="w-full h-3 bg-surface2 rounded animate-shimmer" />
            <div className="w-3/4 h-3 bg-surface2 rounded animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Filter bar ──────────────────────────────────────────────────────────────

function FilterBar({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  activeFilter,
  onFilterChange,
  onClear,
  hasFilters,
}: {
  fromDate: string;
  toDate: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  activeFilter: MessageFilter;
  onFilterChange: (f: MessageFilter) => void;
  onClear: () => void;
  hasFilters: boolean;
}) {
  const filters: { key: MessageFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "text", label: "Text" },
    { key: "media", label: "Media" },
    { key: "forwarded", label: "Forwarded" },
  ];

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-surface border-b border-border">
      {/* Date inputs */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-surface2 border border-border text-text2 font-mono text-[10px] px-2 py-1 rounded-chip outline-none focus:border-accent"
        />
        <span className="text-text3 font-mono text-[10px]">to</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-surface2 border border-border text-text2 font-mono text-[10px] px-2 py-1 rounded-chip outline-none focus:border-accent"
        />
      </div>

      {/* Filter tags */}
      <div className="flex items-center gap-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`font-mono text-[11px] px-2.5 py-1 rounded-btn border transition-colors ${
              activeFilter === f.key
                ? "bg-accent-dim text-accent border-accent/30"
                : "text-text2 border-border2 hover:border-text2 hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={onClear}
          className="font-mono text-[10px] text-text2 hover:text-text ml-auto"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ChannelDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const channelId = params.id;

  // Channel state
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [channelLoading, setChannelLoading] = useState(true);
  const [channelError, setChannelError] = useState<string | null>(null);

  // Messages state
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesLoadingMore, setMessagesLoadingMore] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filter, setFilter] = useState<MessageFilter>("all");

  // Analytics
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [postsPerDay, setPostsPerDay] = useState<PostsPerDay[]>([]);
  const [recentMedia, setRecentMedia] = useState<MediaThumbnail[]>([]);
  const [alertRules] = useState<AlertRuleSummary[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);

  // Countdown state for terminal footer
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const hasFilters = fromDate !== "" || toDate !== "" || filter !== "all";

  // ── Fetch channel ───────────────────────────────────────────────────────

  const fetchChannel = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/channels/${channelId}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      if (res.status === 404) {
        setChannelError("not_found");
        return;
      }
      if (!res.ok) throw new Error("Failed to load channel");

      const data = await res.json();
      const ch = data.channel ?? data;
      setChannel(ch);
      setLastSyncAt(ch.lastScrapedAt ?? null);
    } catch (err) {
      setChannelError(err instanceof Error ? err.message : "Failed to load channel");
    } finally {
      setChannelLoading(false);
    }
  }, [channelId]);

  // ── Fetch messages ──────────────────────────────────────────────────────

  const fetchMessages = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", "50");
        if (fromDate) params.set("from", new Date(fromDate).toISOString());
        if (toDate) params.set("to", new Date(toDate).toISOString());
        if (filter === "media") params.set("hasMedia", "true");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/channels/${channelId}/messages?${params}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );

        if (!res.ok) throw new Error("Failed to load messages");

        const data = await res.json();
        const msgs: MessageData[] = data.messages ?? [];

        if (append) {
          setMessages((prev) => [...prev, ...msgs]);
        } else {
          setMessages(msgs);
        }
        setHasMore(data.hasMore ?? msgs.length >= 50);

        // Set stats from response if available
        if (data.stats) setStats(data.stats);
        if (data.postsPerDay) setPostsPerDay(data.postsPerDay);
        if (data.recentMedia) setRecentMedia(data.recentMedia);
        if (data.storageUsage) setStorageUsage(data.storageUsage);
      } catch (err) {
        if (!append) setMessages([]);
        toast.error("Failed to load messages");
      } finally {
        setMessagesLoading(false);
        setMessagesLoadingMore(false);
      }
    },
    [channelId, fromDate, toDate, filter, toast]
  );

  // ── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchChannel();
  }, [fetchChannel]);

  useEffect(() => {
    setMessagesLoading(true);
    setMessages([]);
    setPage(1);
    fetchMessages(1, false);
  }, [fetchMessages]);

  // ── Infinite scroll ─────────────────────────────────────────────────────

  const handleLoadMore = useCallback(() => {
    if (messagesLoadingMore || !hasMore) return;
    setMessagesLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage, true);
  }, [messagesLoadingMore, hasMore, page, fetchMessages]);

  // ── Clear all read ──────────────────────────────────────────────────────

  useEffect(() => {
    const clear = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/channels/${channelId}/read`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
      } catch {
        // Not critical — unread count clear is best-effort
      }
    };
    clear();
  }, [channelId]);

  // ── Handle toggle monitoring ────────────────────────────────────────────

  const handleToggleMonitoring = async () => {
    if (!channel) return;
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/channels/${channelId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ is_monitoring: !channel.isMonitoring }),
        }
      );

      if (!res.ok) throw new Error();

      setChannel({
        ...channel,
        isMonitoring: !channel.isMonitoring,
        status: channel.isMonitoring ? "paused" : "active",
      });
      toast.success(channel.isMonitoring ? "Monitoring paused" : "Monitoring resumed");
    } catch {
      toast.error("Failed to update monitoring status");
    }
  };

  // ── 404 state ───────────────────────────────────────────────────────────

  if (channelError === "not_found") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4 w-10 h-10 rounded-full bg-yellow/10 border border-yellow/30 flex items-center justify-center">
          <span className="font-mono text-[16px] text-yellow">?</span>
        </div>
        <h3 className="font-mono text-[13px] text-text2 mb-2">Channel not found</h3>
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────

  if (channelLoading) {
    return <ChannelDetailSkeleton />;
  }

  // ── Error state ─────────────────────────────────────────────────────────

  if (channelError || !channel) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-4 w-10 h-10 rounded-full bg-red-dim border border-red/30 flex items-center justify-center">
          <span className="font-mono text-[16px] text-red">!</span>
        </div>
        <h3 className="font-mono text-[13px] text-text2 mb-2">Failed to load channel</h3>
        <Button variant="ghost" size="sm" onClick={fetchChannel}>
          Retry
        </Button>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const displayStatus = channel.status ?? (channel.isMonitoring ? "active" : "paused");

  return (
    <div className="flex flex-col h-full">
      {/* Topbar content — injected into AppShell */}
      {/* Note: in this standalone page, we render our own topbar-like header */}

      {/* Filter bar */}
      <FilterBar
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
        activeFilter={filter}
        onFilterChange={setFilter}
        onClear={() => { setFromDate(""); setToDate(""); setFilter("all"); }}
        hasFilters={hasFilters}
      />

      {/* Main content: feed + analytics */}
      <div className="flex flex-1 overflow-hidden">
        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-4">
          <MessageFeed
            messages={messages}
            isLoading={messagesLoading}
            isLoadingMore={messagesLoadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            newMessageCount={0}
            onNewMessagesClick={() => {
              setMessagesLoading(true);
              setMessages([]);
              setPage(1);
              fetchMessages(1, false);
            }}
          />
        </div>

        {/* Analytics panel */}
        <ChannelAnalyticsPanel
          stats={stats}
          postsPerDay={postsPerDay}
          recentMedia={recentMedia}
          alertRules={alertRules}
          storageUsage={storageUsage}
          channelId={channelId}
          isLoading={false}
        />
      </div>
    </div>
  );
}