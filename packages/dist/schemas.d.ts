import { z } from "zod";
/**
 * Phase 1 Zod schemas — HTTP boundary validation.
 * These MUST converge with OpenAPI before production (flagged for Niall).
 */
export declare const ActorSchema: z.ZodObject<{
    type: z.ZodEnum<["HUMAN", "ASSISTANT"]>;
    id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "HUMAN" | "ASSISTANT";
    id?: string | undefined;
}, {
    type: "HUMAN" | "ASSISTANT";
    id?: string | undefined;
}>;
export declare const SessionSchema: z.ZodObject<{
    id: z.ZodString;
    reflection: z.ZodArray<z.ZodString, "many">;
    state: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    reflection: string[];
    state: Record<string, unknown>;
}, {
    id: string;
    reflection: string[];
    state?: Record<string, unknown> | undefined;
}>;
export declare const EvaluateRequestSchema: z.ZodObject<{
    session: z.ZodObject<{
        id: z.ZodString;
        reflection: z.ZodArray<z.ZodString, "many">;
        state: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        reflection: string[];
        state: Record<string, unknown>;
    }, {
        id: string;
        reflection: string[];
        state?: Record<string, unknown> | undefined;
    }>;
    actor: z.ZodObject<{
        type: z.ZodEnum<["HUMAN", "ASSISTANT"]>;
        id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "HUMAN" | "ASSISTANT";
        id?: string | undefined;
    }, {
        type: "HUMAN" | "ASSISTANT";
        id?: string | undefined;
    }>;
    artifacts: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    proposed_action: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    session: {
        id: string;
        reflection: string[];
        state: Record<string, unknown>;
    };
    actor: {
        type: "HUMAN" | "ASSISTANT";
        id?: string | undefined;
    };
    artifacts?: unknown[] | undefined;
    proposed_action?: unknown;
}, {
    session: {
        id: string;
        reflection: string[];
        state?: Record<string, unknown> | undefined;
    };
    actor: {
        type: "HUMAN" | "ASSISTANT";
        id?: string | undefined;
    };
    artifacts?: unknown[] | undefined;
    proposed_action?: unknown;
}>;
export type ApiActor = z.infer<typeof ActorSchema>;
export type ApiSession = z.infer<typeof SessionSchema>;
export type EvaluateRequest = z.infer<typeof EvaluateRequestSchema>;
//# sourceMappingURL=schemas.d.ts.map