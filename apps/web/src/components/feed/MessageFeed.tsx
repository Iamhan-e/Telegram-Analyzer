"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";

// ── Types ───────────────────────────────────────────────────────────────────

export interface MessageData {
  id: string;
  telegramMessageId: number;
  senderName?: string | null;
  senderUsername?: string | null;
  text?: string | null;
  viewCount: number;
  forwardCount: number;
  replyCount: number;
  hasMedia: boolean;
  mediaType?: string | null;
  reactions?: Array<{ emoji: string; count: number }> | null;
  createdAt: string;
  telegramDate: string;
  isNew?: boolean;
}

interface MessageCardProps {
  message: MessageData;
  highlightKeywords?: string[];
}

interface MessageFeedProps {
  messages: MessageData[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  newMessageCount?: number;
  onNewMessagesClick?: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const MEDIA_CHIP_COLORS: Record<string, BadgeVariant> = {
  photo: "accent",
  video: "yellow",
  document: "muted",
  audio: "green",
  voice: "green",
  sticker: "muted",
  animation: "yellow",
};

// ── MessageCard ─────────────────────────────────────────────────────────────

function MessageCard({ message, highlightKeywords }: MessageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    id,
    telegramMessageId,
    senderName,
    text,
    viewCount,
    forwardCount,
    hasMedia,
    mediaType,
    reactions,
    createdAt,
    telegramDate,
    isNew,
  } = message;

  const isLongText = text && text.length > 300;
  const displayText = isLongText && !isExpanded ? text?.slice(0, 300) + "…" : text;

  return (
    <div
      className={cn(
        "p-3 rounded-card border transition-colors",
        isNew
          ? "border-l-[2px] border-l-accent border-border bg-surface"
          : "border-border bg-surface hover:bg-surface2"
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {senderName && (
            <span className="font-mono text-[11px] text-accent truncate">
              {senderName}
            </span>
          )}
          <span className="font-mono text-[10px] text-text3 bg-surface2 px-1.5 rounded-chip shrink-0">
            #{telegramMessageId}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasMedia && mediaType && (
            <Badge variant={MEDIA_CHIP_COLORS[mediaType] || "muted"}>
              {mediaType}
            </Badge>
          )}
          <span className="font-mono text-[10px] text-text3">
            {formatDate(telegramDate)} {formatTime(telegramDate)}
          </span>
        </div>
      </div>

      {/* Body */}
      {text && (
        <div className="font-sans text-[13px] text-text leading-relaxed whitespace-pre-wrap break-words">
          {highlightKeywords ? (
            <HighlightText text={displayText ?? ""} keywords={highlightKeywords} />
          ) : (
            displayText
          )}
          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-1 font-mono text-[11px] text-accent hover:underline"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-2 font-mono text-[10px] text-text3">
        {viewCount > 0 && <span>{formatCount(viewCount)} views</span>}
        {forwardCount > 0 && <span>{formatCount(forwardCount)} forwards</span>}
        {reactions && reactions.length > 0 && (
          <span className="flex items-center gap-1">
            {reactions.map((r) => (
              <span
                key={r.emoji}
                className="inline-flex items-center gap-0.5 bg-surface2 px-1 rounded-chip"
              >
                {r.emoji} {r.count}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Highlight text helper ───────────────────────────────────────────────────

function HighlightText({ text, keywords }: { text: string; keywords: string[] }) {
  if (!keywords.length) return <>{text}</>;

  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark
            key={i}
            className="bg-accent-dim text-accent font-mono text-[11px] px-0.5 rounded-chip"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ── Skeleton message card ───────────────────────────────────────────────────

function MessageCardSkeleton() {
  return (
    <div className="p-3 rounded-card border border-border bg-surface">
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
      <div className="flex gap-3 mt-3">
        <div className="w-16 h-3 bg-surface2 rounded animate-shimmer" />
        <div className="w-12 h-3 bg-surface2 rounded animate-shimmer" />
      </div>
    </div>
  );
}

// ── MessageFeed ─────────────────────────────────────────────────────────────

export function MessageFeed({
  messages,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  newMessageCount = 0,
  onNewMessagesClick,
}: MessageFeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver on sentinel for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const handleSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node || !hasMore || isLoadingMore) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
            onLoadMore();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  // ── Loading state (first load) ──────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <MessageCardSkeleton />
        <MessageCardSkeleton />
        <MessageCardSkeleton />
        <MessageCardSkeleton />
        <MessageCardSkeleton />
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <span className="font-mono text-[48px] text-text3 opacity-20 mb-4">—</span>
        <h3 className="font-mono text-[13px] text-text2 mb-2">No messages yet</h3>
        <p className="font-sans text-[12px] text-text3 max-w-sm">
          This channel has no messages in the selected range.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* New messages banner */}
      {newMessageCount > 0 && (
        <button
          onClick={onNewMessagesClick}
          className="bg-accent-dim border border-accent/30 rounded-card px-3 py-2 font-mono text-[11px] text-accent hover:bg-accent-dim/80 transition-colors text-left"
        >
          ↑ {newMessageCount} new message{newMessageCount !== 1 ? "s" : ""} — click
          to load
        </button>
      )}

      {/* Messages */}
      {messages.map((msg) => (
        <MessageCard key={msg.id} message={msg} />
      ))}

      {/* Sentinel for infinite scroll */}
      <div ref={handleSentinelRef} className="h-px" />

      {/* Loading more */}
      {isLoadingMore && (
        <div className="flex flex-col gap-3">
          <MessageCardSkeleton />
          <MessageCardSkeleton />
          <MessageCardSkeleton />
        </div>
      )}

      {/* All loaded */}
      {!hasMore && messages.length > 0 && (
        <p className="text-center font-mono text-[10px] text-text3 py-4">
          All messages loaded
        </p>
      )}
    </div>
  );
}

// Re-export for convenience
export { MessageCardSkeleton };
export type { MessageCardProps, MessageFeedProps };