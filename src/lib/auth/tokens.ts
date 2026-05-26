import { sha256 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase, encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

export function generateSessionId(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return encodeHexLowerCase(sha256(new TextEncoder().encode(ip))).slice(0, 32);
}
