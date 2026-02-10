import express from "express";
import { EvaluateRequestSchema } from "./schemas.js";
import { adaptAndEvaluate } from "./adapter.js";

export function buildServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "bridge-os-api", version: "0.1.0" });
  });

  app.post("/v1/evaluate", (req, res) => {
    const parsed = EvaluateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        allowed: false,
        decision: "blocked",
        errors: parsed.error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`
        ),
      });
      return;
    }

    try {
      const out = adaptAndEvaluate(parsed.data);
      res.status(200).json(out);
    } catch (err) {
      console.error("evaluate failed:", err);
      res.status(500).json({
        allowed: false,
        decision: "blocked",
        message: "Internal error",
      });
    }
  });

  return app;
}
