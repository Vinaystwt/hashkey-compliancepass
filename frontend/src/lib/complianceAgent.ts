import { fetchCredentialExport } from "@/lib/oracle";
import { getWalletCompliance, protocolAddressForKey } from "@/lib/onchain";

const protocolRequirements = {
  [protocolAddressForKey("bond").toLowerCase()]: {
    minTier: 3,
    maxRiskScore: 100,
    requiredCredentials: [2, 4],
  },
  [protocolAddressForKey("stablecoin").toLowerCase()]: {
    minTier: 2,
    maxRiskScore: 100,
    requiredCredentials: [1, 3],
  },
  [protocolAddressForKey("credit").toLowerCase()]: {
    minTier: 2,
    maxRiskScore: 50,
    requiredCredentials: [1, 3],
  },
} as const;

export async function getProtocolRequirements(protocolAddress: string) {
  return protocolRequirements[protocolAddress.toLowerCase() as keyof typeof protocolRequirements] ?? {
    minTier: 0,
    maxRiskScore: 100,
    requiredCredentials: [],
  };
}

export async function canParticipate(walletAddress: string, protocolAddress: string) {
  const [wallet, requirements] = await Promise.all([
    getWalletCompliance(walletAddress),
    getProtocolRequirements(protocolAddress),
  ]);

  const allowed = wallet.tier >= requirements.minTier && wallet.riskScore <= requirements.maxRiskScore;

  return {
    allowed,
    tier: wallet.tier,
    riskScore: wallet.riskScore,
    missingTier: allowed ? null : Math.max(requirements.minTier - wallet.tier, 0),
    expiresIn: null,
    reason: allowed
      ? "Eligibility confirmed for this protocol."
      : wallet.tier < requirements.minTier
        ? `Requires Tier ${requirements.minTier}; connected wallet is Tier ${wallet.tier}.`
        : `Requires risk score ≤ ${requirements.maxRiskScore}; connected wallet is ${wallet.riskScore}.`,
  };
}

export async function getComplianceReport(walletAddress: string) {
  return getWalletCompliance(walletAddress);
}

export async function exportCredential(address: string) {
  return fetchCredentialExport(address);
}
