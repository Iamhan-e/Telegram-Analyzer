import { encrypt, decrypt } from "../src/services/KeyVaultService";

// The encrypt/decrypt functions read KEY_ENCRYPTION_SECRET from process.env
const TEST_SECRET = "a".repeat(64); // 32-byte hex string equivalent

beforeEach(() => {
  process.env.KEY_ENCRYPTION_SECRET = TEST_SECRET;
});

afterEach(() => {
  delete process.env.KEY_ENCRYPTION_SECRET;
});

describe("KeyVaultService", () => {
  describe("encrypt / decrypt roundtrip", () => {
    it("roundtrips a plain ASCII string", () => {
      const plaintext = "hello world";
      const ciphertext = encrypt(plaintext);
      expect(ciphertext).not.toBe(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it("roundtrips an empty string", () => {
      const plaintext = "";
      const ciphertext = encrypt(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it("roundtrips a string with Unicode characters", () => {
      const plaintext = "héllo wörld 你好 🚀";
      const ciphertext = encrypt(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it("roundtrips a very long string", () => {
      const plaintext = "x".repeat(10_000);
      const ciphertext = encrypt(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it("roundtrips a string with special characters (newlines, tabs, quotes)", () => {
      const plaintext = 'line1\nline2\t"quoted"\n\'single\'';
      const ciphertext = encrypt(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it("roundtrips a typical Telethon session string pattern", () => {
      // Telethon session strings are base64-encoded and quite long
      const plaintext =
        "1BQANOTEuMTA4LjU2LjE3MAG7OoBLrNuIz8P0RqrlL9vS1kzB/fVbIqP5XeH3tJPi" +
        "kLmNqOrPsRtUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUv" +
        "WxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQr==";
      const ciphertext = encrypt(plaintext);
      expect(decrypt(ciphertext)).toBe(plaintext);
    });

    it("produces different ciphertexts for the same plaintext (random IV)", () => {
      const plaintext = "deterministic?";
      const c1 = encrypt(plaintext);
      const c2 = encrypt(plaintext);
      expect(c1).not.toBe(c2);
      // Both should decrypt back correctly
      expect(decrypt(c1)).toBe(plaintext);
      expect(decrypt(c2)).toBe(plaintext);
    });
  });

  describe("decrypt with wrong key", () => {
    it("throws when KEY_ENCRYPTION_SECRET differs from encryption time", () => {
      const plaintext = "secret message";
      const ciphertext = encrypt(plaintext);

      // Change the secret
      process.env.KEY_ENCRYPTION_SECRET = "b".repeat(64);

      expect(() => decrypt(ciphertext)).toThrow();
    });

    it("throws when KEY_ENCRYPTION_SECRET is not set", () => {
      delete process.env.KEY_ENCRYPTION_SECRET;

      expect(() => encrypt("test")).toThrow(
        "KEY_ENCRYPTION_SECRET is not configured"
      );
      expect(() => decrypt("iv:tag:cipher")).toThrow(
        "KEY_ENCRYPTION_SECRET is not configured"
      );
    });

    it("throws when KEY_ENCRYPTION_SECRET is the placeholder value", () => {
      process.env.KEY_ENCRYPTION_SECRET = "...";

      expect(() => encrypt("test")).toThrow(
        "KEY_ENCRYPTION_SECRET is not configured"
      );
    });
  });

  describe("decrypt with tampered ciphertext", () => {
    it("throws when the ciphertext format is invalid (not 3 parts)", () => {
      expect(() => decrypt("just_one_part")).toThrow("Invalid ciphertext format");
      expect(() => decrypt("one:two")).toThrow("Invalid ciphertext format");
      expect(() => decrypt("one:two:three:four")).toThrow(
        "Invalid ciphertext format"
      );
    });

    it("throws when the IV has been altered", () => {
      const ciphertext = encrypt("hello");
      const parts = ciphertext.split(":");
      // Flip a bit in the IV
      const ivBytes = Buffer.from(parts[0], "base64");
      ivBytes[0] ^= 0x01;
      parts[0] = ivBytes.toString("base64");

      expect(() => decrypt(parts.join(":"))).toThrow();
    });

    it("throws when the auth tag has been altered", () => {
      const ciphertext = encrypt("hello");
      const parts = ciphertext.split(":");
      // Flip a bit in the auth tag
      const tagBytes = Buffer.from(parts[1], "base64");
      tagBytes[0] ^= 0x01;
      parts[1] = tagBytes.toString("base64");

      expect(() => decrypt(parts.join(":"))).toThrow();
    });

    it("throws when the ciphertext body has been altered", () => {
      const ciphertext = encrypt("hello");
      const parts = ciphertext.split(":");
      // Flip a bit in the ciphertext
      const bodyBytes = Buffer.from(parts[2], "base64");
      bodyBytes[0] ^= 0x01;
      parts[2] = bodyBytes.toString("base64");

      expect(() => decrypt(parts.join(":"))).toThrow();
    });

    it("throws when IV has wrong length", () => {
      const ciphertext = Buffer.from("short").toString("base64") + ":tag:cipher";
      expect(() => decrypt(ciphertext)).toThrow("incorrect IV length");
    });

    it("throws when auth tag has wrong length", () => {
      const iv = Buffer.from("1234567890123456").toString("base64"); // 16 bytes
      const shortTag = Buffer.from("short").toString("base64");
      expect(() => decrypt(`${iv}:${shortTag}:cipher`)).toThrow(
        "incorrect auth tag length"
      );
    });
  });
});