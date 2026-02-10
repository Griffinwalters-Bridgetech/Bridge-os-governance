import crypto from "node:crypto";
import {
  evaluate,
  type EngineConfig,
  type Session as EngineSession,
  type EvaluateInput as EngineEvaluateInput,
  type EvaluateResult as EngineEvaluateResult,
  type Decision,
} from "@bridge/engine";
import { ENGINE_VERSION, SCHEMA_VERSION } from "./versions.js";
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

function sha256Json(value: unknown): string {
  const json = JSON.stringify(value);
  return crypto.createHash("sha256").update(json).digest("hex");
}

function sha256String(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Core adapter: maps API request -> engine types, calls engine, maps back.
 */
export function adaptAndEvaluate(req: EvaluateRequest): ApiEvaluateResponse {
  const config: EngineConfig = {
    engine_version: ENGINE_VERSION,
  };

  // Map API session shape -> engine session shape
  const engineSession: EngineSession = {
    session_id: req.session.id,
    schema_version: SCHEMA_VERSION,
    audit: [],
  };

  // Map API request -> engine input
  // .03 reflection belongs on EvaluateInput (per-call evidence), not persisted on session
  const engineInput: EngineEvaluateInput = {
    actor_id: req.actor.id ?? req.actor.type,
    payload: {
      artifacts: req.artifacts ?? [],
      proposed_action: req.proposed_action ?? null,
    },
    reflection: req.session.reflection,
  };

  // Compute input hash before evaluation
  const input_hash = sha256Json({
    session: req.session,
    actor: req.actor,
    artifacts: req.artifacts ?? [],
    proposed_action: req.proposed_action ?? null,
  });

  const reflection_hash = sha256String(JSON.stringify(req.session.reflection));

  // Call the pure engine. No side-effects. No IO. Deterministic.
  const result: EngineEvaluateResult = evaluate(config, engineSession, engineInput);

  // Derive allowed from decision (API-layer concern, not engine concern)
  const allowed = result.decision === "allowed";

  // Echo submitted reflection back to caller — do NOT persist into engine session
  const apiSessionOut: ApiSession = {
    id: result.session.session_id,
    reflection: req.session.reflection,
    state: req.session.state,
  };

  const responseBody = {
    allowed,
    decision: result.decision,
    stoplight_state: result.stoplight_state,
    invariants_triggered: result.invariants_triggered,
    rules_applied: result.rules_applied,
    message: result.message,
    session: apiSessionOut,
  };

  const output_hash = sha256Json(responseBody);

  return {
    ...responseBody,
    audit: {
      timestamp: new Date().toISOString(),
      session_id: result.session.session_id,
      actor: req.actor,
      input_hash,
      output_hash,
      engine_version: ENGINE_VERSION,
      schema_version: SCHEMA_VERSION,
      reflection_hash,
    },
  };
}
