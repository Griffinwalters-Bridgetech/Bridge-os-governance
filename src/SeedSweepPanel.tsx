import React, { useMemo } from "react";
import {
  SeedSweepPhaseState,
  SeedSweepTrigger,
  computeSeedSweepStoplight,
  createDefaultSeedSweepState,
  nextPhase,
  validatePhaseGates
} from "./seedsweep-phase-machine";

type Actor = "HUMAN" | "ASSISTANT";

export type SeedSweepPanelProps = {
  actor: Actor;
  state: SeedSweepPhaseState;
  onChange: (next: SeedSweepPhaseState) => void;
  onComplete?: (finalState: SeedSweepPhaseState) => void;
};

function nowIso() {
  return new Date().toISOString();
}

function ensureMin1(arr: string[]): string[] {
  const cleaned = arr.map(s => s.trim()).filter(Boolean);
  return cleaned.length ? cleaned : [""];
}

export function SeedSweepPanel(props: SeedSweepPanelProps) {
  const { actor, state, onChange, onComplete } = props;

  const stoplight = useMemo(() => computeSeedSweepStoplight(state), [state]);
  const gateErrors = useMemo(() => validatePhaseGates(state, actor), [state, actor]);

  function set<K extends keyof SeedSweepPhaseState>(key: K, value: SeedSweepPhaseState[K]) {
    onChange({ ...state, [key]: value });
  }

  function confirmPhase(phase: "STOP" | "WITNESS" | "SWEEP" | "SEED" | "STABILIZE") {
    if (actor !== "HUMAN") return;
    const patchAt = nowIso();
    if (phase === "STOP") set("stop", { ...state.stop, confirmedByHuman: true, confirmedAt: patchAt });
    if (phase === "WITNESS") set("witness", { ...state.witness, confirmedByHuman: true, confirmedAt: patchAt });
    if (phase === "SWEEP") set("sweep", { ...state.sweep, confirmedByHuman: true, confirmedAt: patchAt });
    if (phase === "SEED") set("seed", { ...state.seed, confirmedByHuman: true, confirmedAt: patchAt });
    if (phase === "STABILIZE") set("stabilize", { ...state.stabilize, confirmedByHuman: true, confirmedAt: patchAt });
  }

  function advancePhase() {
    const current = state.phase;
    const errs = validatePhaseGates(state, actor);
    const blocking = errs.filter(e => e.phase === current);
    if (blocking.length) return;

    if (current === "STABILIZE") {
      const finalState: SeedSweepPhaseState = {
        ...state,
        phase: "COMPLETE",
        completedAt: nowIso(),
        stoplight: "GREEN"
      };
      onChange(finalState);
      onComplete?.(finalState);
      return;
    }

    const next = nextPhase(current);
    onChange({ ...state, phase: next, stoplight });
  }

  function reset(trigger: SeedSweepTrigger) {
    onChange(createDefaultSeedSweepState(trigger));
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700 }}>SeedSweep</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Phase: <b>{state.phase}</b> | Stoplight: <b>{stoplight}</b> | Trigger: <b>{state.trigger}</b>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => reset("HUMAN_REQUEST")}>Reset (Human)</button>
          <button onClick={() => reset("PRE_SESSION_PREFLIGHT")}>Reset (Preflight)</button>
        </div>
      </div>

      <hr />

      {/* STOP */}
      <section>
        <h4>STOP</h4>
        <label>
          <input
            type="checkbox"
            checked={state.stop.pause_acknowledged}
            onChange={e => set("stop", { ...state.stop, pause_acknowledged: e.target.checked })}
          />
          {" "}Pause acknowledged
        </label>
        <div style={{ marginTop: 8 }}>
          <input
            style={{ width: "100%" }}
            value={state.stop.objective}
            onChange={e => set("stop", { ...state.stop, objective: e.target.value })}
            placeholder="Objective (one sentence)"
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12 }}>.03 Holding Space (STOP)</div>
          <textarea
            style={{ width: "100%", minHeight: 50 }}
            value={ensureMin1(state.stop.phase_003.holding_space_003).join("\n")}
            onChange={e => set("stop", { ...state.stop, phase_003: { holding_space_003: ensureMin1(e.target.value.split("\n")) } })}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button disabled={actor !== "HUMAN"} onClick={() => confirmPhase("STOP")}>HUMAN Confirm STOP</button>
          <span style={{ marginLeft: 8, fontSize: 12 }}>
            {state.stop.confirmedByHuman ? `Confirmed ${state.stop.confirmedAt}` : "Not confirmed"}
          </span>
        </div>
      </section>

      <hr />

      {/* WITNESS */}
      <section>
        <h4>WITNESS</h4>
        <div style={{ fontSize: 12 }}>Observations (one per line)</div>
        <textarea
          style={{ width: "100%", minHeight: 60 }}
          value={state.witness.observations.join("\n")}
          onChange={e => set("witness", { ...state.witness, observations: e.target.value.split("\n").filter(Boolean) })}
        />
        <div style={{ marginTop: 8, fontSize: 12 }}>Contradictions (optional)</div>
        <textarea
          style={{ width: "100%", minHeight: 40 }}
          value={state.witness.contradictions.join("\n")}
          onChange={e => set("witness", { ...state.witness, contradictions: e.target.value.split("\n").filter(Boolean) })}
        />
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12 }}>.03 Holding Space (WITNESS)</div>
          <textarea
            style={{ width: "100%", minHeight: 50 }}
            value={ensureMin1(state.witness.phase_003.holding_space_003).join("\n")}
            onChange={e => set("witness", { ...state.witness, phase_003: { holding_space_003: ensureMin1(e.target.value.split("\n")) } })}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button disabled={actor !== "HUMAN"} onClick={() => confirmPhase("WITNESS")}>HUMAN Confirm WITNESS</button>
          <span style={{ marginLeft: 8, fontSize: 12 }}>
            {state.witness.confirmedByHuman ? `Confirmed ${state.witness.confirmedAt}` : "Not confirmed"}
          </span>
        </div>
      </section>

      <hr />

      {/* SWEEP */}
      <section>
        <h4>SWEEP</h4>
        <div style={{ fontSize: 12 }}>Debris items</div>
        {state.sweep.debris.map((d, idx) => (
          <div key={idx} style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              style={{ flex: 1 }}
              value={d.item}
              onChange={e => {
                const next = [...state.sweep.debris];
                next[idx] = { ...d, item: e.target.value };
                set("sweep", { ...state.sweep, debris: next });
              }}
              placeholder="Debris item"
            />
            <select
              value={d.action}
              onChange={e => {
                const next = [...state.sweep.debris];
                next[idx] = { ...d, action: e.target.value as any };
                set("sweep", { ...state.sweep, debris: next });
              }}
            >
              <option value="REMOVE">REMOVE</option>
              <option value="PARK">PARK</option>
              <option value="KEEP">KEEP</option>
            </select>
            <button onClick={() => {
              const next = state.sweep.debris.filter((_, i) => i !== idx);
              set("sweep", { ...state.sweep, debris: next.length ? next : [{ item: "", action: "REMOVE" }] });
            }}>X</button>
          </div>
        ))}
        <button style={{ marginTop: 8 }} onClick={() => set("sweep", { ...state.sweep, debris: [...state.sweep.debris, { item: "", action: "REMOVE" }] })}>
          + Add debris
        </button>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12 }}>.03 Holding Space (SWEEP)</div>
          <textarea
            style={{ width: "100%", minHeight: 50 }}
            value={ensureMin1(state.sweep.phase_003.holding_space_003).join("\n")}
            onChange={e => set("sweep", { ...state.sweep, phase_003: { holding_space_003: ensureMin1(e.target.value.split("\n")) } })}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button disabled={actor !== "HUMAN"} onClick={() => confirmPhase("SWEEP")}>HUMAN Confirm SWEEP</button>
          <span style={{ marginLeft: 8, fontSize: 12 }}>
            {state.sweep.confirmedByHuman ? `Confirmed ${state.sweep.confirmedAt}` : "Not confirmed"}
          </span>
        </div>
      </section>

      <hr />

      {/* SEED */}
      <section>
        <h4>SEED</h4>
        <div style={{ fontSize: 12 }}>Candidates (one per line)</div>
        <textarea
          style={{ width: "100%", minHeight: 50 }}
          value={state.seed.candidates.join("\n")}
          onChange={e => set("seed", { ...state.seed, candidates: e.target.value.split("\n").filter(Boolean) })}
        />
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1 }}
            value={state.seed.selected}
            onChange={e => set("seed", { ...state.seed, selected: e.target.value })}
            placeholder="Selected seed"
          />
          <input
            style={{ flex: 1 }}
            value={state.seed.success_condition}
            onChange={e => set("seed", { ...state.seed, success_condition: e.target.value })}
            placeholder="Success condition"
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12 }}>.03 Holding Space (SEED)</div>
          <textarea
            style={{ width: "100%", minHeight: 50 }}
            value={ensureMin1(state.seed.phase_003.holding_space_003).join("\n")}
            onChange={e => set("seed", { ...state.seed, phase_003: { holding_space_003: ensureMin1(e.target.value.split("\n")) } })}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button disabled={actor !== "HUMAN"} onClick={() => confirmPhase("SEED")}>HUMAN Confirm SEED</button>
          <span style={{ marginLeft: 8, fontSize: 12 }}>
            {state.seed.confirmedByHuman ? `Confirmed ${state.seed.confirmedAt}` : "Not confirmed"}
          </span>
        </div>
      </section>

      <hr />

      {/* STABILIZE */}
      <section>
        <h4>STABILIZE</h4>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ flex: 2 }}
            value={state.stabilize.next_action}
            onChange={e => set("stabilize", { ...state.stabilize, next_action: e.target.value })}
            placeholder="Next action"
          />
          <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              type="checkbox"
              checked={state.stabilize.reversible}
              onChange={e => set("stabilize", { ...state.stabilize, reversible: e.target.checked })}
            />
            Reversible
          </label>
        </div>
        <div style={{ marginTop: 8, fontSize: 12 }}>Watch-for signals (one per line)</div>
        <textarea
          style={{ width: "100%", minHeight: 50 }}
          value={state.stabilize.watch_for.join("\n")}
          onChange={e => set("stabilize", { ...state.stabilize, watch_for: e.target.value.split("\n").filter(Boolean) })}
        />
        <div style={{ marginTop: 8 }}>
          <input
            value={state.stabilize.recheck_at ?? ""}
            onChange={e => set("stabilize", { ...state.stabilize, recheck_at: e.target.value })}
            placeholder="Recheck at (optional)"
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12 }}>.03 Holding Space (STABILIZE)</div>
          <textarea
            style={{ width: "100%", minHeight: 50 }}
            value={ensureMin1(state.stabilize.phase_003.holding_space_003).join("\n")}
            onChange={e => set("stabilize", { ...state.stabilize, phase_003: { holding_space_003: ensureMin1(e.target.value.split("\n")) } })}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button disabled={actor !== "HUMAN"} onClick={() => confirmPhase("STABILIZE")}>HUMAN Confirm STABILIZE</button>
          <span style={{ marginLeft: 8, fontSize: 12 }}>
            {state.stabilize.confirmedByHuman ? `Confirmed ${state.stabilize.confirmedAt}` : "Not confirmed"}
          </span>
        </div>
      </section>

      <hr />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: gateErrors.length ? "#b00" : "#060" }}>
          {gateErrors.length ? `${gateErrors.length} gate issue(s)` : "No blocking issues"}
        </div>
        <button onClick={advancePhase}>Advance Phase</button>
      </div>

      {gateErrors.length > 0 && (
        <div style={{ marginTop: 10, padding: 10, background: "#fff6f6", border: "1px solid #f2c2c2", borderRadius: 6 }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {gateErrors.map((e, idx) => <li key={idx}><b>{e.phase}</b>: {e.message}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
