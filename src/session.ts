import { z } from "zod";
import type { SessionState, Stoplight } from "./types";

export const HoldingSpace003Schema = z.array(z.string().min(1)).min(1);

export const HumanSignoffSchema = z.object({
  signed: z.boolean(),
  signedBy: z.string().min(1).optional(),
  signedRole: z.string().min(1).optional(),
  signedAt: z.string().min(1).optional()
});

export const SessionSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),

  state: z.enum([
    "DRAFT",
    "IN_COMPILATION",
    "SEEDSWEEP_IN_PROGRESS",
    "AWAITING_HUMAN_SIGNOFF",
    "FINALIZED"
  ]),

  stoplight: z.enum(["GREEN", "YELLOW", "RED"]),

  title: z.string().min(1),
  intent: z.string().min(1),

  holding_space_003: HoldingSpace003Schema,

  human_signoff: HumanSignoffSchema,

  activeSeedSweepArtifactId: z.string().min(1).optional()
});

export type Session = z.infer<typeof SessionSchema> & {
  state: SessionState;
  stoplight: Stoplight;
};
