import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { prisma } from "../lib/prisma";

/**
 * Express middleware that validates a Supabase-issued JWT from the
 * Authorization header, then looks up the corresponding row in our
 * `users` table and attaches it to `req.user`.
 *
 * Exempt routes: /health, /auth/*
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip auth for exempt paths
  if (req.path === "/health" || req.path.startsWith("/auth")) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    // Validate JWT with Supabase — throws if expired/invalid
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id: authId, email } = data.user;

    if (!email) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Look up our internal user record by auth_id
    const dbUser = await prisma.user.findUnique({
      where: { authId },
      select: { id: true, authId: true, email: true },
    });

    if (!dbUser) {
      // User is authenticated with Supabase but not yet provisioned
      // in our DB. This can happen briefly during signup before the
      // provisioning webhook fires.
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = {
      id: dbUser.id,
      authId: dbUser.authId,
      email: dbUser.email,
    };

    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
