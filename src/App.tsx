import React, { useMemo, useState } from "react";
import type { Actor, Action, EvalResult } from "./types";
import type { Session } from "./session";
import type { Artifact } from "./artifacts";
import { evaluate } from "./evaluate";
import { makeExampleArtifacts, makeExampleSession } from "./example-data";
import { COMPILER_REGISTRY } from "./registry";
import { PortabilityPanel } from "./PortabilityPanel";
import { SeedSweepPanel } from "./seedsweep/SeedSweepPanel";
import {
  SeedSweepPhaseState,
  createDefaultSeedSweepState,
  computeSeedSweepStoplight
} from "./seedsweep/seedsweep-phase-machine";
import {
  SeedSweepArtifact,
  createSeedSweepArtifact,
  updateSeedSweepArtifactFromState
} from "./seedsweep/seedsweep-artifact-adapter";

function nowIso() {
  return new Date().toISOString();
}

export default function App() {
  const [actor, setActor] = useState<Actor>("ASSISTANT");

  const [session, setSession] = useState<Session>(() => makeExampleSession(nowIso()));
  const [artifacts, setArtifacts] = useState<Artifact[]>(() => makeExampleArtifacts());

  const [log, setLog] = useState<Array<{ ts: string; action: Action; result: EvalResult }>>([]);

  const [seedSweepState, setSeedSweepState] = useState<SeedSweepPhaseState>(() =>
    createDefaultSeedSweepState("PRE_SESSION_PREFLIGHT")
  );
  const [seedSweepArtifact, setSeedSweepArtifact] = useState<SeedSweepArtifact>(() =>
    createSeedSweepArtifact(seedSweepState)
  );

  const errorsSummary = useMemo(() => {
    const res = evaluate(session, artifacts, { type: "SESSION_START_COMPILATION" }, "ASSISTANT");
    const schemaErrors = res.errors.filter((e) => e.code === "SCHEMA_INVALID" || e.code.endsWith("_NOT_ARRAY"));
    return schemaErrors;
  }, [session, artifacts]);

  function dispatch(action: Action) {
    const res = evaluate(session, artifacts, action, actor);
    setLog((prev) => [{ ts: nowIso(), action, result: res }, ...prev].slice(0, 50));
    if (res.allowed) {
      setSession(res.newSession as Session);
      setArtifacts(res.newArtifacts as Artifact[]);
    }
  }

  function handleSeedSweepChange(next: SeedSweepPhaseState) {
    setSeedSweepState(next);
    const stoplight = computeSeedSweepStoplight(next);
    setSeedSweepArtifact((prev) => updateSeedSweepArtifactFromState(prev, next, stoplight));
  }

  function handleSeedSweepComplete(finalState: SeedSweepPhaseState) {
    const stoplight = computeSeedSweepStoplight(finalState);
    setSeedSweepArtifact((prev) => ({
      ...updateSeedSweepArtifactFromState(prev, finalState, stoplight),
      status: "IN_REVIEW"
    }));
  }

  function approveSeedSweepArtifact() {
    if (actor !== "HUMAN") return;
    if (seedSweepArtifact.stoplight !== "GREEN") return;
    setSeedSweepArtifact((prev) => ({
      ...prev,
      status: "APPROVED",
      approvals: { approvedByHuman: true, approvedAt: nowIso() }
    }));
  }

  const coreIds = ["INGESTION", "SEMANTIC", "EXECUTION", "GOVERNANCE"];

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Bridge OS — Governance Compiler</h1>

      <div style={{ marginBottom: 16, padding: 12, background: "#f8f8f8", borderRadius: 8 }}>
        <b>Actor</b>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button onClick={() => setActor("ASSISTANT")} disabled={actor === "ASSISTANT"}>ASSISTANT</button>
          <button onClick={() => setActor("HUMAN")} disabled={actor === "HUMAN"}>HUMAN</button>
        </div>
        <div style={{ fontSize: 12, marginTop: 4, color: "#666" }}>
          Current: <b>{actor}</b> — Human gates require HUMAN actor.
        </div>
      </div>

      <section style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, minWidth: 340, flex: 1 }}>
          <h2 style={{ marginTop: 0 }}>Session</h2>
          <div><b>ID:</b> {session.id}</div>
          <div><b>State:</b> {session.state}</div>
          <div><b>Stoplight:</b> {session.stoplight}</div>
          <div style={{ marginTop: 8 }}>
            <label>
              <b>Title</b><br />
              <input style={{ width: "100%" }} value={session.title}
                onChange={(e) => setSession({ ...session, title: e.target.value, updatedAt: nowIso() })} />
            </label>
          </div>
          <div style={{ marginTop: 8 }}>
            <label>
              <b>Intent</b><br />
              <textarea style={{ width: "100%" }} rows={3} value={session.intent}
                onChange={(e) => setSession({ ...session, intent: e.target.value, updatedAt: nowIso() })} />
            </label>
          </div>

          <div style={{ marginTop: 8 }}>
            <b>.03 holding_space_003 (required)</b>
            {session.holding_space_003.map((line, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input style={{ flex: 1 }} value={line}
                  onChange={(e) => {
                    const next = [...session.holding_space_003];
                    next[idx] = e.target.value;
                    setSession({ ...session, holding_space_003: next, updatedAt: nowIso() });
                  }} />
                <button onClick={() => {
                  const next = session.holding_space_003.filter((_, i) => i !== idx);
                  setSession({ ...session, holding_space_003: next, updatedAt: nowIso() });
                }}>Remove</button>
              </div>
            ))}
            <button style={{ marginTop: 8 }}
              onClick={() => setSession({ ...session, holding_space_003: [...session.holding_space_003, "New .03 note"], updatedAt: nowIso() })}>
              Add .03 line
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <b>Human signoff</b>
            <div>Signed: {String(session.human_signoff.signed)}</div>
            {session.human_signoff.signedBy && <div>By: {session.human_signoff.signedBy}</div>}
            {session.human_signoff.signedAt && <div>At: {session.human_signoff.signedAt}</div>}
          </div>

          <div style={{ marginTop: 12 }}>
            <b>Governance actions</b>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <button onClick={() => dispatch({ type: "SESSION_START_COMPILATION" })}>Start Compilation</button>
              <button onClick={() => dispatch({ type: "SESSION_TRIGGER_SEEDSWEEP", reason: "Manual trigger from UI" })}>Trigger SeedSweep</button>
              <button onClick={() => dispatch({ type: "SESSION_RESUME_AFTER_SEEDSWEEP" })}>Resume After SeedSweep</button>
              <button onClick={() => dispatch({ type: "SESSION_REQUEST_FINALIZE" })}>Request Finalize</button>
              <button onClick={() => dispatch({ type: "SESSION_SIGNOFF", signerName: "Kemi", signerRole: "Compliance" })}>Human Signoff</button>
              <button onClick={() => dispatch({ type: "SESSION_FINALIZE" })}>Finalize</button>
            </div>
          </div>

          {errorsSummary.length > 0 && (
            <div style={{ marginTop: 12, border: "1px solid #f0c", padding: 8, borderRadius: 6 }}>
              <b>Schema health warnings</b>
              <ul>{errorsSummary.map((e, i) => <li key={i}>{e.message} {e.path ? <code>({e.path})</code> : null}</li>)}</ul>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 340 }}>
          <SeedSweepPanel actor={actor} state={seedSweepState} onChange={handleSeedSweepChange} onComplete={handleSeedSweepComplete} />

          <div style={{ marginTop: 12, border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 700 }}>SeedSweep Artifact</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Status: <b>{seedSweepArtifact.status}</b> | Stoplight: <b>{seedSweepArtifact.stoplight}</b>
            </div>
            <div style={{ marginTop: 8 }}>
              <button onClick={approveSeedSweepArtifact} disabled={actor !== "HUMAN" || seedSweepArtifact.stoplight !== "GREEN"}>
                Approve SeedSweep (HUMAN only, GREEN required)
              </button>
            </div>
            {seedSweepArtifact.approvals.approvedByHuman && (
              <div style={{ fontSize: 12, color: "#060", marginTop: 4 }}>Approved at: {seedSweepArtifact.approvals.approvedAt}</div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <PortabilityPanel appName="Bridge OS Governance" build="v0.1.0"
              getData={() => ({ session, artifacts, seedSweepState, seedSweepArtifact })}
              setData={(data) => {
                if (data.session) setSession(data.session);
                if (data.artifacts) setArtifacts(data.artifacts);
                if (data.seedSweepState) setSeedSweepState(data.seedSweepState);
                if (data.seedSweepArtifact) setSeedSweepArtifact(data.seedSweepArtifact);
              }} />
          </div>
        </div>
      </section>

      <h2>Artifacts</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 12 }}>
        {artifacts.map((a) => (
          <div key={a.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{a.compiler}</div>
                <div style={{ fontSize: 12, color: "#444" }}>{a.id}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12 }}>
                <div>Status: <b>{a.status}</b></div>
                <div>Stoplight: <b>{a.stoplight}</b></div>
              </div>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => dispatch({ type: "ARTIFACT_SET_STATUS", artifactId: a.id, status: "IN_REVIEW" })}>In Review</button>
              <button onClick={() => dispatch({ type: "ARTIFACT_SET_STATUS", artifactId: a.id, status: "APPROVED" })}>Approve</button>
              <button onClick={() => dispatch({ type: "ARTIFACT_SET_STATUS", artifactId: a.id, status: "REJECTED" })}>Reject</button>
              <button onClick={() => dispatch({ type: "ARTIFACT_SET_STOPLIGHT", artifactId: a.id, stoplight: "GREEN" })}>Green</button>
              <button onClick={() => dispatch({ type: "ARTIFACT_SET_STOPLIGHT", artifactId: a.id, stoplight: "YELLOW" })}>Yellow</button>
              <button onClick={() => dispatch({ type: "ARTIFACT_SET_STOPLIGHT", artifactId: a.id, stoplight: "RED" })}>Red</button>
            </div>
            <div style={{ marginTop: 10 }}>
              <b>.03 holding_space_003 (required)</b>
              <ul>{a.holding_space_003.map((line, i) => <li key={i}>{line}</li>)}</ul>
              <div style={{ fontSize: 12, color: "#555" }}>Approvals: approvedByHuman={String(a.approvals.approvedByHuman)}</div>
            </div>
            {coreIds.includes(a.compiler) && <div style={{ marginTop: 8, fontSize: 12, color: "#333" }}>Core artifact: required for finalization.</div>}
          </div>
        ))}
      </div>

      <h2>Registry</h2>
      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <ul>{COMPILER_REGISTRY.map((c) => <li key={c.id}><b>{c.id}</b> — {c.mode} — {c.description}</li>)}</ul>
      </div>

      <h2>Log</h2>
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        {log.length === 0 ? (
          <div style={{ color: "#666" }}>No actions yet. Try approving as ASSISTANT (should fail), then switch to HUMAN (should succeed).</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {log.map((entry, idx) => (
              <div key={idx} style={{ borderTop: idx === 0 ? "none" : "1px solid #eee", paddingTop: idx === 0 ? 0 : 10 }}>
                <div style={{ fontSize: 12, color: "#555" }}>{entry.ts}</div>
                <div><b>Action:</b> <code>{JSON.stringify(entry.action)}</code></div>
                <div><b>Allowed:</b> {String(entry.result.allowed)}</div>
                {entry.result.errors.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <b>Errors</b>
                    <ul>{entry.result.errors.map((e, i) => <li key={i}><code>{e.code}</code>: {e.message} {e.path ? <code>({e.path})</code> : null}</li>)}</ul>
                  </div>
                )}
                {entry.result.side_effects.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <b>Side effects</b>
                    <ul>{entry.result.side_effects.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: "#555" }}>
        Notes: This demo is intentionally local-only. The architecture is deterministic: same inputs → same outputs. Human gates cannot be bypassed by ASSISTANT.
      </div>
    </div>
  );
}
