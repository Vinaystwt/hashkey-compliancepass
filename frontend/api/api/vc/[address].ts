// @ts-nocheck
import { exportVc, sendJson } from "../../_lib/runtime.js";

export default async function handler(req: any, res: any) {
  try {
    const walletAddress = req.query.address as string | undefined;

    if (!walletAddress) {
      sendJson(res, 400, { error: "Address is required" });
      return;
    }

    const payload = await exportVc(walletAddress);
    sendJson(res, 200, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "VC export failed";
    sendJson(res, 500, { error: "VC export failed", details: message });
  }
}
