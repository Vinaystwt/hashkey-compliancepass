// @ts-nocheck
import { loadAnalytics, sendJson } from "./_lib/runtime.js";

export default async function handler(_req: any, res: any) {
  try {
    const payload = await loadAnalytics();
    sendJson(res, 200, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load analytics";
    sendJson(res, 500, { error: "Failed to load analytics", details: message });
  }
}
