// @ts-nocheck
import { readJsonBody, sendJson, updateRiskScore } from "../_lib/runtime.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const walletAddress = body.walletAddress as string | undefined;
    const score = body.score as number | undefined;

    if (!walletAddress || score === undefined || score < 0 || score > 100) {
      sendJson(res, 400, { error: "walletAddress and score 0-100 are required" });
      return;
    }

    const payload = await updateRiskScore(walletAddress, score);
    sendJson(res, 200, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Risk score update failed";
    sendJson(res, 500, { error: "Risk score update failed", details: message });
  }
}
