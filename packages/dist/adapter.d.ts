import { type Decision } from "@bridge/engine";
import type { ApiActor, ApiSession, EvaluateRequest } from "./schemas.js";
/**
 * Phase 1 adapter layer: HTTP <-> Engine.
 * - Keeps engine pure (no HTTP / IO knowledge)
 * - Keeps API schema free to evolve toward OpenAPI without touching engine
 */
export interface ApiEvaluateResponse {
    allowed: boolean;
    decision: Decision;
    stoplight_state: string;
    invariants_triggered: string[];
    rules_applied: string[];
    message?: string;
    session: ApiSession;
    audit: {
        timestamp: string;
        session_id: string;
        actor: ApiActor;
        input_hash: string;
        output_hash: string;
        engine_version: string;
        schema_version: string;
        reflection_hash: string;
    };
}
/**
 * Core adapter: maps API request -> engine types, calls engine, maps back.
 */
export declare function adaptAndEvaluate(req: EvaluateRequest): ApiEvaluateResponse;
//# sourceMappingURL=adapter.d.ts.map