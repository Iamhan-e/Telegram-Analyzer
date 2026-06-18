import { Router, Request, Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * Verify that the incoming request was sent by Supabase Auth.
 * Supabase signs webhooks with HMAC-SHA256 using your JWT secret.
 * The signature is in the `x-supabase-webhook-signature` header.
 */
function verifyWebhookSignature(req: Request): boolean {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;

  // In development with no secret configured, skip verification.
  // In production this must always be set.
  if (!secret || secret === "...") {
    console.warn("SUPABASE_WEBHOOK_SECRET not configured — skipping webhook signature check");
    return true;
  }

  const signature = req.headers["x-supabase-webhook-signature"];
  if (!signature || typeof signature !== "string") {
    return false;
  }

  const payload = JSON.stringify(req.body);
  const hmac = createHmac("sha256", secret);
  const computed = hmac.update(payload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(computed, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

/**
 * POST /auth/provision
 *
 * Called by Supabase Auth webhook when a new user signs up.
 * Creates the internal user record, subscription, and storage quota.
 *
 * Body: { auth_id: string, email: string }
 * Headers: x-supabase-webhook-signature: <HMAC-SHA256>
 */
router.post("/auth/provision", async (req: Request, res: Response) => {
  if (!verifyWebhookSignature(req)) {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  const { auth_id, email } = req.body;

  if (!auth_id || !email) {
    res.status(400).json({ error: "Missing required fields: auth_id, email" });
    return;
  }

  try {
    // Check if user already exists (idempotency — safe to retry)
    const existing = await prisma.user.findUnique({
      where: { authId: auth_id },
    });

    if (existing) {
      res.status(200).json({ ok: true, message: "User already provisioned" });
      return;
    }

    // Create user + subscription + storage_usage in a transaction
    const user = await prisma.user.create({
      data: {
        authId: auth_id,
        email,
        subscription: {
          create: {
            tier: "free",
            status: "active",
            maxChannels: 3,
            pollingIntervalMins: 60,
            maxStorageBytes: 524288000, // 500 MB
            historyDays: 30,
          },
        },
        storageUsage: {
          create: {
            usedBytes: 0,
            fileCount: 0,
          },
        },
      },
    });

    console.log(`Provisioned new user: ${user.id} (auth: ${auth_id})`);

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Failed to provision user:", error);
    res.status(500).json({ error: "Failed to provision user" });
  }
});

export default router;
