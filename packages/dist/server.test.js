import { describe, it, expect, beforeAll } from "vitest";
import { buildServer } from "./server.js";
import http from "node:http";
// Helper to make requests against the Express app
async function inject(app, method, url, body) {
    return new Promise((resolve, reject) => {
        const server = app.listen(0, () => {
            const addr = server.address();
            if (!addr || typeof addr === "string") {
                server.close();
                return reject(new Error("Could not get server address"));
            }
            const port = addr.port;
            const options = {
                hostname: "127.0.0.1",
                port,
                path: url,
                method,
                headers: { "Content-Type": "application/json" },
            };
            const req = http.request(options, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    server.close();
                    try {
                        resolve({
                            statusCode: res.statusCode ?? 500,
                            body: JSON.parse(data),
                        });
                    }
                    catch {
                        resolve({ statusCode: res.statusCode ?? 500, body: data });
                    }
                });
            });
            req.on("error", (err) => {
                server.close();
                reject(err);
            });
            if (body) {
                req.write(JSON.stringify(body));
            }
            req.end();
        });
    });
}
describe("Bridge OS API", () => {
    let app;
    beforeAll(() => {
        app = buildServer();
    });
    describe("GET /health", () => {
        it("returns ok", async () => {
            const res = await inject(app, "GET", "/health");
            expect(res.statusCode).toBe(200);
            expect(res.body.ok).toBe(true);
        });
    });
    describe("POST /v1/evaluate", () => {
        it("returns 200 with valid payload and .03 reflection", async () => {
            const res = await inject(app, "POST", "/v1/evaluate", {
                session: { id: "s_001", reflection: ["I am present."], state: {} },
                actor: { type: "HUMAN", id: "griffin" },
                artifacts: [],
                proposed_action: { type: "noop" },
            });
            expect(res.statusCode).toBe(200);
            expect(typeof res.body.allowed).toBe("boolean");
            expect(res.body.decision).toBeDefined();
            expect(res.body.stoplight_state).toBeDefined();
            expect(res.body.session.id).toBe("s_001");
            expect(res.body.session.reflection).toEqual(["I am present."]);
            expect(res.body.audit.input_hash).toBeTruthy();
            expect(res.body.audit.output_hash).toBeTruthy();
            expect(res.body.audit.session_id).toBe("s_001");
            expect(res.body.audit.actor.id).toBe("griffin");
            expect(res.body.audit.reflection_hash).toBeTruthy();
        });
        it("rejects empty reflection array (400)", async () => {
            const res = await inject(app, "POST", "/v1/evaluate", {
                session: { id: "s_001", reflection: [], state: {} },
                actor: { type: "HUMAN", id: "griffin" },
                artifacts: [],
                proposed_action: { type: "noop" },
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.allowed).toBe(false);
            expect(res.body.decision).toBe("blocked");
        });
        it("rejects missing reflection field (400)", async () => {
            const res = await inject(app, "POST", "/v1/evaluate", {
                session: { id: "s_001", state: {} },
                actor: { type: "HUMAN", id: "griffin" },
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.allowed).toBe(false);
        });
        it("rejects empty string in reflection (400)", async () => {
            const res = await inject(app, "POST", "/v1/evaluate", {
                session: { id: "s_001", reflection: [""], state: {} },
                actor: { type: "HUMAN", id: "griffin" },
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.allowed).toBe(false);
        });
        it("rejects missing session entirely (400)", async () => {
            const res = await inject(app, "POST", "/v1/evaluate", {
                actor: { type: "HUMAN", id: "griffin" },
            });
            expect(res.statusCode).toBe(400);
        });
        it("rejects missing actor (400)", async () => {
            const res = await inject(app, "POST", "/v1/evaluate", {
                session: { id: "s_001", reflection: ["present"], state: {} },
            });
            expect(res.statusCode).toBe(400);
        });
    });
});
//# sourceMappingURL=server.test.js.map