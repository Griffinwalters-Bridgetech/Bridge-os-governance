import { z } from "zod";
/**
 * Phase 1 Zod schemas — HTTP boundary validation.
 * These MUST converge with OpenAPI before production (flagged for Niall).
 */
export const ActorSchema = z.object({
    type: z.enum(["HUMAN", "ASSISTANT"]),
    id: z.string().min(1).optional(),
});
export const SessionSchema = z.object({
    id: z.string().min(1),
    // .03 holding space — required, non-empty, each string non-empty
    reflection: z.array(z.string().min(1)).min(1),
    state: z.record(z.unknown()).default({}),
});
export const EvaluateRequestSchema = z.object({
    session: SessionSchema,
    actor: ActorSchema,
    artifacts: z.array(z.unknown()).optional(),
    proposed_action: z.unknown().optional(),
});
//# sourceMappingURL=schemas.js.map