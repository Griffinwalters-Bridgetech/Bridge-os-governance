import crypto from "node:crypto";
import { evaluate, } from "@bridge/engine";
import { ENGINE_VERSION, SCHEMA_VERSION } from "./versions.js";
function sha256Json(value) {
    const json = JSON.stringify(value);
    return crypto.createHash("sha256").update(json).digest("hex");
}
function sha256String(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}
/**
 * Core adapter: maps API request -> engine types, calls engine, maps back.
 */
export function adaptAndEvaluate(req) {
    const config = {
        engine_version: ENGINE_VERSION,
    };
    // Map API session shape -> engine session shape
    const engineSession = {
        session_id: req.session.id,
        schema_version: SCHEMA_VERSION,
        audit: [],
    };
    // Map API request -> engine input
    // .03 reflection belongs on EvaluateInput (per-call evidence), not persisted on session
    const engineInput = {
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
    const result = evaluate(config, engineSession, engineInput);
    // Derive allowed from decision (API-layer concern, not engine concern)
    const allowed = result.decision === "allowed";
    // Echo submitted reflection back to caller — do NOT persist into engine session
    const apiSessionOut = {
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
//# sourceMappingURL=adapter.js.map