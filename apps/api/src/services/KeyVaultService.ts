import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { prisma } from "../lib/prisma";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT = "telegram-analyzer";
const KEY_LENGTH = 32;

function deriveKey(): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret || secret === "...") {
    throw new Error(
      "KEY_ENCRYPTION_SECRET is not configured. Generate a 32-byte random hex string and set it in .env."
    );
  }
  return scryptSync(secret, SALT, KEY_LENGTH);
}

/**
 * Encrypt a plaintext string with AES-256-GCM.
 * Returns colon-delimited string: base64(iv):base64(authTag):base64(ciphertext)
 */
export function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a ciphertext produced by encrypt().
 * Throws if the ciphertext has been tampered with or the key is wrong.
 */
export function decrypt(ciphertext: string): string {
  const key = deriveKey();

  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format: expected iv:authTag:ciphertext");
  }

  const iv = Buffer.from(parts[0], "base64");
  const authTag = Buffer.from(parts[1], "base64");
  const encrypted = Buffer.from(parts[2], "base64");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid ciphertext: incorrect IV length");
  }
  if (authTag.length !== 16) {
    throw new Error("Invalid ciphertext: incorrect auth tag length");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // SECURITY: never log this value
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  // SECURITY: never log this value
  return decrypted.toString("utf8");
}

/**
 * Fetch and decrypt a user's Telegram session string.
 * Only call this at job runtime — never expose the result to the frontend.
 */
export async function getDecryptedSession(userId: string): Promise<string> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { userId },
    select: { encryptedSession: true, isConnected: true, authError: true },
  });

  if (!apiKey) {
    throw new Error("No API key configured for this user");
  }

  if (!apiKey.encryptedSession) {
    throw new Error("No encrypted session found for this user");
  }

  // SECURITY: never log this value
  const sessionString = decrypt(apiKey.encryptedSession);

  // SECURITY: never log this value
  return sessionString;
}