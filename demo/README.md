# Bridge PIA Locktight Demo

This demo proves that Bridge PIA enforces governance **structurally**, not behaviorally.

## What It Proves

1. **SeedSweep Preflight** — Cannot start compilation until SeedSweep is APPROVED + GREEN
2. **Human-Only Gates** — Assistant cannot approve artifacts, signoff, or finalize
3. **Stoplight Binding** — Session stoplight reflects worst artifact stoplight
4. **Finalization Choreography** — Requires all core artifacts APPROVED + human signoff

## How to Run

```bash
cd bridge-os-governance
npx ts-node demo/run.ts
```

Or if you have tsx installed:
```bash
npx tsx demo/run.ts
```

## Expected Output

If all gates hold, you'll see:

```
✅ DEMO COMPLETED SUCCESSFULLY
============================

Final state: FINALIZED
Final stoplight: GREEN

Outputs written to: demo/output/
  - transcript.jsonl (full audit log)
  - timeline.md (human-readable summary)

The governance engine is real. The gates hold.
```

If any gate fails, the demo stops immediately and tells you which step failed.

## Output Files

| File | Purpose |
|------|---------|
| `output/transcript.jsonl` | Full audit log — every step, every result |
| `output/timeline.md` | Human-readable state progression |

## The 16 Steps

| # | Action | Actor | Expected |
|---|--------|-------|----------|
| 1 | Attempt compilation before SeedSweep | HUMAN | BLOCKED |
| 2 | Assistant approves SeedSweep | ASSISTANT | BLOCKED |
| 3 | Human approves SeedSweep | HUMAN | ALLOWED |
| 4 | Attempt compilation (SeedSweep YELLOW) | HUMAN | BLOCKED |
| 5 | Human sets SeedSweep GREEN | HUMAN | ALLOWED |
| 6 | Start compilation | HUMAN | ALLOWED |
| 7 | Assistant approves Ingestion | ASSISTANT | BLOCKED |
| 8 | Human approves Ingestion | HUMAN | ALLOWED |
| 9 | Human approves Semantic | HUMAN | ALLOWED |
| 10 | Human approves Execution | HUMAN | ALLOWED |
| 11 | Human approves Governance | HUMAN | ALLOWED |
| 12 | Request finalize | HUMAN | ALLOWED |
| 13 | Assistant signoff | ASSISTANT | BLOCKED |
| 14 | Human signoff | HUMAN | ALLOWED |
| 15 | Assistant finalize | ASSISTANT | BLOCKED |
| 16 | Human finalize | HUMAN | ALLOWED |

## Why This Matters

This is not a mock. This is the actual `evaluate()` function that enforces Bridge governance.

If this demo passes:
- The .03 is not theory — it's infrastructure
- Human gates cannot be bypassed by code
- The system literally cannot proceed without human authority

**Foundation built on a rock.**

---

Bridge Technologies LLC / 99.97 Labs

Emmanuel.
