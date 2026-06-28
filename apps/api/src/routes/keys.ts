import { Router, Request, Response } from "express";
import { encrypt } from "../services/KeyVaultService";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * POST /api/keys — save or update the user's Telegram credentials.
 * The session_string is encrypted at rest and never returned to the client.
 */
router.post("/api/keys", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { telegram_api_id, telegram_api_hash, session_string } = req.body;

  if (!telegram_api_id || !telegram_api_hash || !session_string) {
    res.status(400).json({
      error: "Missing required fields: telegram_api_id, telegram_api_hash, session_string",
    });
    return;
  }

  // SECURITY: never log session_string
  const encryptedSession = encrypt(session_string);

  const apiKey = await prisma.apiKey.upsert({
    where: { userId },
    create: {
      userId,
      telegramApiId: telegram_api_id,
      telegramApiHash: telegram_api_hash,
      encryptedSession,
      isConnected: false,
    },
    update: {
      telegramApiId: telegram_api_id,
      telegramApiHash: telegram_api_hash,
      encryptedSession,
      isConnected: false,
      authError: null,
      authErrorAt: null,
    },
    select: {
      id: true,
      telegramApiId: true,
      isConnected: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    id: apiKey.id,
    telegram_api_id: apiKey.telegramApiId,
    is_connected: apiKey.isConnected,
    created_at: apiKey.createdAt,
  });
});

/**
 * GET /api/keys — return key status only. Never expose the hash or session string.
 */
router.get("/api/keys", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const apiKey = await prisma.apiKey.findUnique({
    where: { userId },
    select: {
      isConnected: true,
      authError: true,
      lastUsedAt: true,
    },
  });

  if (!apiKey) {
    res.status(200).json({
      has_key: false,
      is_connected: false,
      auth_error: null,
      last_used_at: null,
    });
    return;
  }

  res.status(200).json({
    has_key: true,
    is_connected: apiKey.isConnected,
    auth_error: apiKey.authError,
    last_used_at: apiKey.lastUsedAt,
  });
});

/**
 * DELETE /api/keys — delete the api_keys row and pause all monitoring.
 */
router.delete("/api/keys", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  await prisma.apiKey.deleteMany({
    where: { userId },
  });

  await prisma.trackedChannel.updateMany({
    where: { userId, isMonitoring: true },
    data: { isMonitoring: false, monitoringPausedReason: "api_key_removed" },
  });

  res.status(200).json({ ok: true });
});

export default router;
