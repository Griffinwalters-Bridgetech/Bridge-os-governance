import crypto from "node:crypto";

export function sha256Json(value: unknown): string {
  const json = JSON.stringify(value);
  return crypto.createHash("sha256").update(json).digest("hex");
}

export function sha256String(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function nowIsoUtc(): string {
  return new Date().toISOString();
}
