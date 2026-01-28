# Bridge OS

Governance middleware that enforces human authority over AI decisions.

---

## What This Is

Bridge OS is a deterministic policy engine. It ensures that certain actions — approving work, signing off, finalizing decisions — can only be performed by humans.

This is not behavioral. The system does not "choose" to stop. The system **cannot proceed** without human authority at designated gates.

---

## How It Works

All governance flows through one function:

```typescript
evaluate(session, artifacts, action, actor) → { allowed, errors, newSession, newArtifacts }
```

If the action is allowed, the state updates.  
If the action is blocked, the function returns an error code and the state does not change.

Same inputs always produce same outputs. No AI judgment. Just rules.

---

## The Gates

**Human-Only Actions**  
Approving artifacts, signing off sessions, and finalizing decisions require a human actor. If an assistant attempts these actions, the system returns `HUMAN_GATE_REQUIRED`.

**SeedSweep Preflight**  
Before compilation can begin, a SeedSweep artifact must be approved and set to GREEN by a human.

**Stoplight Binding**  
The session stoplight reflects the worst stoplight among its artifacts. RED blocks finalization.

---

## Run the Demo

```bash
# Install dependencies
npm install

# Run the governance demo
npx tsx demo/run.ts
```

The demo executes 16 steps testing every gate. If all steps pass, you'll see:

```
✅ DEMO COMPLETED SUCCESSFULLY

Final state: FINALIZED
Final stoplight: GREEN
```

Output files are written to `demo/output/`:
- `transcript.jsonl` — full audit log
- `timeline.md` — human-readable summary

---

## Project Structure

```
bridge-os-governance/
├── src/
│   ├── evaluate.ts       # Core governance function
│   ├── session.ts        # Session schema
│   ├── artifacts.ts      # Artifact schemas
│   ├── policy.ts         # Gate logic
│   ├── stoplight.ts      # Stoplight binding
│   └── ...
├── demo/
│   ├── run.ts            # Test harness
│   ├── fixtures/         # Test data
│   └── output/           # Generated results
└── README.md
```

---

## License

Proprietary. All rights reserved.
© 2026 Griffin Walters. Rights to be assigned to Bridge Technologies LLC upon formation.

---

## Contact

For inquiries: griffinwalters.pinnacle@gmail.com
