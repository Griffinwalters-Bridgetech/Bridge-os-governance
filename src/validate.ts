import { z } from "zod";
import { SessionSchema, HoldingSpace003Schema } from "./session";
import { ArtifactSchema } from "./artifacts";
import type { EvalError } from "./types";

function zodToErrors(prefix: string, e: z.ZodError): EvalError[] {
  return e.issues.map((iss) => ({
    code: "SCHEMA_INVALID",
    message: `${prefix}: ${iss.message}`,
    path: iss.path.join(".")
  }));
}

export function validateSession(session: unknown): EvalError[] {
  const res = SessionSchema.safeParse(session);
  if (!res.success) return zodToErrors("Session", res.error);

  const hs = HoldingSpace003Schema.safeParse((res.data as any).holding_space_003);
  if (!hs.success) return zodToErrors("Session.holding_space_003", hs.error);

  return [];
}

export function validateArtifacts(artifacts: unknown): EvalError[] {
  if (!Array.isArray(artifacts)) {
    return [{ code: "ARTIFACTS_NOT_ARRAY", message: "Artifacts must be an array." }];
  }

  const errors: EvalError[] = [];
  for (const a of artifacts) {
    const res = ArtifactSchema.safeParse(a);
    if (!res.success) errors.push(...zodToErrors("Artifact", res.error));
  }
  return errors;
}
