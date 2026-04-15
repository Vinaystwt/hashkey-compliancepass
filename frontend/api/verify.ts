// @ts-nocheck
import { readJsonBody, sendJson, verifyCommitment } from "./_lib/runtime.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const commitment = body.commitment as string | undefined;
    const credentialType = body.credentialType as number | undefined;

    if (!commitment || credentialType === undefined) {
      sendJson(res, 400, { error: "Missing commitment or credentialType" });
      return;
    }

    const payload = await verifyCommitment(commitment, credentialType);
    sendJson(res, 200, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Oracle verification failed";
    sendJson(res, 500, { error: "Oracle verification failed", details: message });
  }
}
