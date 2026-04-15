import { Contract, JsonRpcProvider } from "ethers";
import deployedAddresses from "./deployed-addresses.json";
import complianceSBTArtifact from "../contracts/artifacts/contracts/ComplianceSBT.sol/ComplianceSBT.json";
import aiRiskOracleArtifact from "../contracts/artifacts/contracts/AIRiskOracle.sol/AIRiskOracle.json";

export type DeployedAddresses = typeof deployedAddresses;

export type ComplianceReport = {
  walletAddress: string;
  bitmask: number;
  tier: number;
  riskScore: number;
  expiresIn: number | null;
};

export class ComplianceAgent {
  private provider: JsonRpcProvider;
  private sbt: Contract;
  private riskOracle: Contract;

  constructor(private rpcUrl: string, private addresses: DeployedAddresses = deployedAddresses) {
    this.provider = new JsonRpcProvider(rpcUrl);
    this.sbt = new Contract(addresses.complianceSBT, complianceSBTArtifact.abi, this.provider);
    this.riskOracle = new Contract(addresses.aiRiskOracle, aiRiskOracleArtifact.abi, this.provider);
  }

  async canParticipate(walletAddress: string, protocolAddress: string): Promise<{
    allowed: boolean;
    tier: number;
    riskScore: number;
    missingTier: number | null;
    expiresIn: number | null;
    reason: string;
    protocolAddress: string;
  }> {
    const [tier, riskScore, expiresIn] = await Promise.all([
      this.sbt.getTier(walletAddress).then(Number),
      this.riskOracle.getRiskScore(walletAddress).then(Number),
      this.getEarliestExpiryDelta(walletAddress),
    ]);

    const allowed = tier >= 2 && riskScore <= 50;
    return {
      allowed,
      tier,
      riskScore,
      missingTier: allowed ? null : Math.max(2 - tier, 0),
      expiresIn,
      reason: allowed ? "Eligible for standard compliant access" : "Tier or risk requirements not met",
      protocolAddress,
    };
  }

  async getProtocolRequirements(protocolAddress: string): Promise<{
    minTier: number;
    maxRiskScore: number;
    requiredCredentials: number[];
  }> {
    const lowered = protocolAddress.toLowerCase();
    if (lowered === this.addresses.mockGovernmentBondFund.toLowerCase()) {
      return { minTier: 3, maxRiskScore: 100, requiredCredentials: [2, 4] };
    }
    if (lowered === this.addresses.mockStablecoinMint.toLowerCase()) {
      return { minTier: 2, maxRiskScore: 100, requiredCredentials: [1, 3] };
    }
    if (lowered === this.addresses.mockCreditFacility.toLowerCase()) {
      return { minTier: 2, maxRiskScore: 50, requiredCredentials: [1, 3] };
    }
    return { minTier: 0, maxRiskScore: 100, requiredCredentials: [] };
  }

  async triggerReverification(walletAddress: string): Promise<void> {
    const response = await fetch("http://localhost:3001/api/renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    });

    if (!response.ok) {
      throw new Error(`Reverification failed with status ${response.status}`);
    }
  }

  async getComplianceReport(walletAddress: string): Promise<ComplianceReport> {
    const [bitmask, tier, riskScore, expiresIn] = await Promise.all([
      this.sbt.bitmaskOf(walletAddress).then(Number),
      this.sbt.getTier(walletAddress).then(Number),
      this.riskOracle.getRiskScore(walletAddress).then(Number),
      this.getEarliestExpiryDelta(walletAddress),
    ]);

    return {
      walletAddress,
      bitmask,
      tier,
      riskScore,
      expiresIn,
    };
  }

  private async getEarliestExpiryDelta(walletAddress: string): Promise<number | null> {
    const expiries = await Promise.all(
      [0, 1, 2, 3, 4].map((bit) => this.sbt.credentialExpiresAt(walletAddress, bit).then((value: bigint) => Number(value)))
    );
    const active = expiries.filter((value) => value > 0);
    if (active.length === 0) {
      return null;
    }
    const earliest = Math.min(...active);
    return Math.max(earliest - Math.floor(Date.now() / 1000), 0);
  }
}
