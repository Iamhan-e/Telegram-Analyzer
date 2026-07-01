"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ChannelCard } from "@/components/channels/ChannelCard";
import { AddChannelModal } from "@/components/channels/AddChannelModal";
import { createClient } from "@/lib/supabase";
import type { ChannelCardData } from "@/components/channels/ChannelCard";

function deriveStatus(ch: ChannelCardData): ChannelCardData["status"] {
  if (!ch.isMonitoring) return "paused";
  if (!ch.lastScrapedAt) return "scraping";
  return "active";
}

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

async function fetchChannels(): Promise<ChannelCardData[]> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/channels`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );

  if (res.status === 404) return [];
  if (!res.ok) throw new Error("Failed to fetch channels");

  const data = await res.json();
  const channels: ChannelCardData[] = (data.channels ?? data).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    title: c.title as string,
    username: (c.username as string) ?? null,
    memberCount: (c.member_count as number) ?? null,
    totalMessages: (c.total_messages as number) ?? 0,
    unreadCount: (c.unread_count as number) ?? 0,
    isMonitoring: (c.is_monitoring as boolean) ?? false,
    lastScrapedAt: (c.last_scraped_at as string) ?? null,
  }));
  return channels;
}

export default function ChannelsPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    data: channels,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["channels"],
    queryFn: fetchChannels,
    refetchInterval: (query) => {
      const list = query.state.data;
      if (!list || list.length === 0) return false;
      const hasScraping = list.some((ch) => deriveStatus(ch) === "scraping");
      return hasScraping ? 10_000 : false;
    },
  });

  const handleToggle = async (channelId: string, newValue: boolean) => {
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
          body: JSON.stringify({ is_monitoring: newValue }),
        }
      );

      if (!res.ok) throw new Error("Failed to update channel");
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success(newValue ? "Monitoring resumed" : "Monitoring paused");
    } catch {
      toast.error("Failed to update channel");
    }
  };

  const handleDelete = async (channelId: string) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/channels/${channelId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to delete channel");
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast.success("Channel removed");
    } catch {
      toast.error("Failed to delete channel");
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-mono text-[15px] text-text">Channels</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ChannelCardSkeleton />
          <ChannelCardSkeleton />
          <ChannelCardSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="font-mono text-[15px] text-text mb-6">Channels</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 w-10 h-10 rounded-full bg-red-dim border border-red/30 flex items-center justify-center">
            <span className="font-mono text-[16px] text-red">!</span>
          </div>
          <h3 className="font-mono text-[13px] text-text2 mb-2">Failed to load channels</h3>
          <p className="font-sans text-[12px] text-text3 mb-3">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["channels"] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const hasChannels = channels && channels.length > 0;

  if (!hasChannels) {
    return (
      <div>
        <h1 className="font-mono text-[15px] text-text mb-6">Channels</h1>
        <EmptyState
          icon={<span className="font-mono text-[48px] text-text3 opacity-20">◫</span>}
          title="No channels tracked"
          description="Add a Telegram channel to start monitoring messages and media."
          action={
            <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
              Add your first channel
            </Button>
          }
        />
        <AddChannelModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onChannelAdded={() => queryClient.invalidateQueries({ queryKey: ["channels"] })}
        />
      </div>
    );
  }

  const channelsWithStatus = channels.map((ch) => ({
    ...ch,
    status: deriveStatus(ch),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-mono text-[15px] text-text">Channels</h1>
          <MonoLabel className="mt-0.5">
            {channels.length} channel{channels.length !== 1 ? "s" : ""} tracked
          </MonoLabel>
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
          + Add channel
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {channelsWithStatus.map((ch) => (
          <ChannelCard
            key={ch.id}
            channel={ch}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </div>
      <AddChannelModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onChannelAdded={() => queryClient.invalidateQueries({ queryKey: ["channels"] })}
      />
    </div>
  );
}
