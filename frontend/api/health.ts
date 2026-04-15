// @ts-nocheck
import { readHealth, sendJson } from "./_lib/runtime.js";

export default async function handler(_req: any, res: any) {
  try {
    const payload = await readHealth();
    sendJson(res, 200, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health check failed";
    sendJson(res, 500, { error: "Health check failed", details: message });
  }
}
