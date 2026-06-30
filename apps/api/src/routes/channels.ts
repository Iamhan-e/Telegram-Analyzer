import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getDecryptedSession } from "../services/KeyVaultService";
import { getFullScrapeQueue } from "../lib/queue";

const router = Router();

/**
 * POST /api/channels — add a channel to track.
 * Resolves the channel via the Python scraper, stores it, and enqueues a full scrape.
 */
router.post("/api/channels", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { channel_input } = req.body;

  if (!channel_input || typeof channel_input !== "string") {
    res.status(400).json({ error: "channel_input is required" });
    return;
  }

  // 1. Ensure user has an API key
  const apiKey = await prisma.apiKey.findUnique({ where: { userId } });
  if (!apiKey) {
    res.status(400).json({ error: "No Telegram API key configured. Add your key in Settings first." });
    return;
  }

  // 2. Check channel limit against subscription
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const maxChannels = subscription?.maxChannels ?? 3;
  const channelCount = await prisma.trackedChannel.count({
    where: { userId, deletedAt: null },
  });

  if (channelCount >= maxChannels) {
    res.status(402).json({
      error: "channel_limit_reached",
      message: `You've reached your plan limit of ${maxChannels} channels. Upgrade to add more.`,
      upgrade_url: "/dashboard/billing",
    });
    return;
  }

  // 3. Get decrypted session string
  let sessionString: string;
  try {
    sessionString = await getDecryptedSession(userId);
  } catch {
    res.status(400).json({ error: "No valid Telegram session found. Reconnect your API key in Settings." });
    return;
  }

  // 4. Call Python scraper to resolve the channel
  const scraperUrl = process.env.SCRAPER_INTERNAL_URL || "http://localhost:8000";
  const scraperSecret = process.env.SCRAPER_INTERNAL_SECRET || "...";

  let resolved: {
    telegram_channel_id: number;
    title: string;
    description?: string | null;
    member_count?: number | null;
    is_broadcast: boolean;
    is_private: boolean;
    username?: string | null;
  };

  try {
    const resolveResp = await fetch(`${scraperUrl}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": scraperSecret,
      },
      body: JSON.stringify({ session_string: sessionString, channel_input }),
    });

    if (!resolveResp.ok) {
      const err = await resolveResp.json();
      const detail = err.detail || "resolve_failed";
      if (resolveResp.status === 403) {
        res.status(403).json({ error: "access_denied", message: "This channel is private or you don't have access." });
      } else {
        res.status(400).json({ error: detail, message: `Could not resolve channel: ${channel_input}` });
      }
      return;
    }

    resolved = await resolveResp.json();
  } catch {
    res.status(502).json({ error: "scraper_unavailable", message: "The channel resolver service is unavailable." });
    return;
  }

  // 5. Create or restore channel (duplicate check by userId + telegramChannelId)
  const channel = await prisma.trackedChannel.upsert({
    where: {
      userId_telegramChannelId: {
        userId,
        telegramChannelId: resolved.telegram_channel_id,
      },
    },
    create: {
      userId,
      telegramChannelId: resolved.telegram_channel_id,
      username: resolved.username,
      title: resolved.title,
      description: resolved.description,
      memberCount: resolved.member_count,
      isBroadcast: resolved.is_broadcast,
      isPrivate: resolved.is_private,
      isMonitoring: true,
    },
    update: {
      deletedAt: null,
      title: resolved.title,
      description: resolved.description,
      memberCount: resolved.member_count,
      username: resolved.username,
      isBroadcast: resolved.is_broadcast,
      isPrivate: resolved.is_private,
      isMonitoring: true,
      monitoringPausedReason: null,
    },
  });

  // 6. Create a job record
  const job = await prisma.job.create({
    data: {
      userId,
      channelId: channel.id,
      type: "full_scrape",
      status: "pending",
    },
  });

  // 7. Enqueue BullMQ job (worker will pick this up in TASK-016)
  try {
    const queue = getFullScrapeQueue();
    await queue.add(
      "full_scrape",
      {
        jobId: job.id,
        userId,
        channelId: channel.id,
        telegramChannelId: resolved.telegram_channel_id,
      },
      { jobId: job.id }
    );
  } catch {
    // Redis not available — job remains pending in DB and will be picked up later
    console.warn("BullMQ enqueue failed (Redis down). Job saved as pending in DB.");
  }

  res.status(200).json({
    id: channel.id,
    title: channel.title,
    username: channel.username,
    telegram_channel_id: Number(channel.telegramChannelId),
    member_count: channel.memberCount,
    is_broadcast: channel.isBroadcast,
    is_private: channel.isPrivate,
    is_monitoring: channel.isMonitoring,
    total_messages: channel.totalMessages,
    unread_count: channel.unreadCount,
    created_at: channel.createdAt,
    job: {
      id: job.id,
      status: job.status,
    },
  });
});

/**
 * GET /api/channels — list all tracked channels for the user (exclude soft-deleted).
 */
router.get("/api/channels", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const channels = await prisma.trackedChannel.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      telegramChannelId: true,
      username: true,
      title: true,
      description: true,
      memberCount: true,
      isBroadcast: true,
      isPrivate: true,
      isMonitoring: true,
      totalMessages: true,
      unreadCount: true,
      lastScrapedAt: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    channels: channels.map((c) => ({
      id: c.id,
      title: c.title,
      username: c.username,
      telegram_channel_id: Number(c.telegramChannelId),
      member_count: c.memberCount,
      is_broadcast: c.isBroadcast,
      is_private: c.isPrivate,
      is_monitoring: c.isMonitoring,
      total_messages: c.totalMessages,
      unread_count: c.unreadCount,
      last_scraped_at: c.lastScrapedAt,
      created_at: c.createdAt,
    })),
  });
});

/**
 * GET /api/channels/:id — single channel detail.
 */
router.get("/api/channels/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const channel = await prisma.trackedChannel.findFirst({
    where: { id, userId, deletedAt: null },
    select: {
      id: true,
      telegramChannelId: true,
      username: true,
      title: true,
      description: true,
      memberCount: true,
      photoUrl: true,
      isBroadcast: true,
      isPrivate: true,
      firstScrapedAt: true,
      lastScrapedAt: true,
      lastMessageId: true,
      totalMessages: true,
      unreadCount: true,
      isMonitoring: true,
      monitoringPausedReason: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!channel) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.status(200).json({
    id: channel.id,
    title: channel.title,
    username: channel.username,
    telegram_channel_id: Number(channel.telegramChannelId),
    member_count: channel.memberCount,
    photo_url: channel.photoUrl,
    is_broadcast: channel.isBroadcast,
    is_private: channel.isPrivate,
    is_monitoring: channel.isMonitoring,
    monitoring_paused_reason: channel.monitoringPausedReason,
    total_messages: channel.totalMessages,
    unread_count: channel.unreadCount,
    first_scraped_at: channel.firstScrapedAt,
    last_scraped_at: channel.lastScrapedAt,
    last_message_id: channel.lastMessageId ? Number(channel.lastMessageId) : null,
    created_at: channel.createdAt,
    updated_at: channel.updatedAt,
  });
});

/**
 * PATCH /api/channels/:id — toggle is_monitoring (pause/resume).
 */
router.patch("/api/channels/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { is_monitoring } = req.body;

  if (typeof is_monitoring !== "boolean") {
    res.status(400).json({ error: "is_monitoring (boolean) is required" });
    return;
  }

  const channel = await prisma.trackedChannel.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!channel) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const updated = await prisma.trackedChannel.update({
    where: { id },
    data: {
      isMonitoring: is_monitoring,
      monitoringPausedReason: is_monitoring ? null : "user_paused",
    },
    select: {
      id: true,
      title: true,
      isMonitoring: true,
      monitoringPausedReason: true,
    },
  });

  res.status(200).json({
    id: updated.id,
    title: updated.title,
    is_monitoring: updated.isMonitoring,
    monitoring_paused_reason: updated.monitoringPausedReason,
  });
});

/**
 * DELETE /api/channels/:id — soft delete (sets deleted_at) and pauses monitoring.
 */
router.delete("/api/channels/:id", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const channel = await prisma.trackedChannel.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!channel) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  await prisma.trackedChannel.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isMonitoring: false,
      monitoringPausedReason: "channel_deleted",
    },
  });

  res.status(200).json({ ok: true });
});

export default router;
