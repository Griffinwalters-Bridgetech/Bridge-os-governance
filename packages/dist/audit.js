import crypto from "node:crypto";
export function sha256Json(value) {
    const json = JSON.stringify(value);
    return crypto.createHash("sha256").update(json).digest("hex");
}
export function sha256String(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}
export function nowIsoUtc() {
    return new Date().toISOString();
}
//# sourceMappingURL=audit.js.map