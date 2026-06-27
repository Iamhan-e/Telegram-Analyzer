"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { useToast } from "@/components/ui/Toast";
import { ChannelCard } from "@/components/channels/ChannelCard";
import { AddChannelModal } from "@/components/channels/AddChannelModal";
import { createClient } from "@/lib/supabase";
import type { ChannelCardData } from "@/components/channels/ChannelCard";

// ── Channel card skeleton (matches real card dimensions) ────────────────────

function ChannelCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-card border border-border bg-surface">
      <Skeleton width={40} height={40} borderRadius="50%" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton width="60%" height="14px" />
        <Skeleton width="40%" height="10px" />
        <div className="flex gap-3">
          <Skeleton width="60px" height="10px" />
          <Skeleton width="50px" height="10px" />
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [channels, setChannels] = useState<ChannelCardData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const toast = useToast();

  const fetchChannels = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/channels`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (res.status === 404) {
        // Endpoint not built yet — show empty state
        setChannels([]);
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch channels");

      const data = await res.json();
      setChannels(data.channels ?? data);
    } catch (err) {
      if (err instanceof Error && err.message !== "Failed to fetch channels") {
        setError(err.message);
      }
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-mono text-[15px] text-text">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ChannelCardSkeleton />
          <ChannelCardSkeleton />
          <ChannelCardSkeleton />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div>
        <h1 className="font-mono text-[15px] text-text mb-6">Dashboard</h1>
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 w-10 h-10 rounded-full bg-red-dim border border-red/30 flex items-center justify-center">
            <span className="font-mono text-[16px] text-red">!</span>
          </div>
          <h3 className="font-mono text-[13px] text-text2 mb-2">
            Failed to load channels
          </h3>
          <p className="font-sans text-[12px] text-text3 max-w-sm mb-4">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchChannels}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  const hasChannels = channels && channels.length > 0;

  if (!hasChannels) {
    return (
      <div>
        <h1 className="font-mono text-[15px] text-text mb-6">Dashboard</h1>

        <EmptyState
          icon={
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
              <line x1="12" y1="7" x2="12" y2="13" />
            </svg>
          }
          title="No channels tracked yet"
          description="Paste a Telegram link to start scraping messages and media."
          action={
            <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
              Add your first channel
            </Button>
          }
        />

        <AddChannelModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onChannelAdded={fetchChannels}
        />
      </div>
    );
  }

  // ── Populated state ───────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono text-[15px] text-text">Dashboard</h1>
          <MonoLabel className="mt-0.5">{channels.length} channel{channels.length !== 1 ? "s" : ""} tracked</MonoLabel>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
          + Add channel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {channels.map((ch) => (
          <ChannelCard key={ch.id} channel={ch} />
        ))}
      </div>

      <AddChannelModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onChannelAdded={fetchChannels}
      />
    </div>
  );
}