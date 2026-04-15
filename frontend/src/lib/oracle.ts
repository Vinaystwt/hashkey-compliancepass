import { appConfig } from "@/lib/config";

export type AnalyticsResponse = {
  totalCredentials: string;
  credentialsByType: Array<{ bit: number; count: string }>;
  activeProtocols: number;
  riskDistribution: number[];
  revocationStats: Array<{ user: string; credentialTypeBit: number; reason: number }>;
};

export type AttestersResponse = {
  attesters: Array<{
    attester: string;
    approved: boolean;
    stake: string;
    credentialsIssued: string;
    name: string;
  }>;
};

export type HealthResponse = {
  ok: boolean;
  blockNumber: number;
  chainId: number;
};

const REQUEST_TIMEOUT_MS = 4500;
const WRITE_REQUEST_TIMEOUT_MS = 30000;

async function request<T>(path: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${appConfig.oracleApiUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      if (timeoutMs > REQUEST_TIMEOUT_MS) {
        throw new Error("The testnet oracle transaction is taking longer than expected. Wait a few seconds and try again.");
      }
      throw new Error("The oracle did not respond in time. Start the local oracle or switch to the testnet deployment.");
    }
    throw new Error("The oracle is unreachable. Start the local oracle or switch to an environment with a live backend.");
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed for ${path}`);
  }
  return response.json() as Promise<T>;
}

export function fetchHealth() {
  return request<HealthResponse>(appConfig.oracleApiUrl ? "/health" : "/api/health");
}

export function fetchAnalytics() {
  return request<AnalyticsResponse>("/api/analytics");
}

export function fetchAttesters() {
  return request<AttestersResponse>("/api/attesters");
}

export function postRiskScore(walletAddress: string, score: number) {
  return request<{ success: boolean; txHash: string }>("/api/risk-score", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ walletAddress, score }),
  }, WRITE_REQUEST_TIMEOUT_MS);
}

export function postVerify(commitment: string, credentialType: number) {
  return request<{ success: boolean; txHash: string }>("/api/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ commitment, credentialType }),
  }, WRITE_REQUEST_TIMEOUT_MS);
}

export function fetchCredentialExport(address: string) {
  return request<Record<string, unknown>>(`/api/vc/${address}`);
}
