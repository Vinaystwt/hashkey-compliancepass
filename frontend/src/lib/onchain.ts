import type { Abi } from "viem";
import { createPublicClient, http } from "viem";
import { activeChain, appConfig } from "@/lib/config";
import deployedAddresses from "@/lib/deployedAddresses.json";
import compliancePassArtifact from "@/lib/abis/CompliancePass.json";
import complianceSBTArtifact from "@/lib/abis/ComplianceSBT.json";
import riskOracleArtifact from "@/lib/abis/AIRiskOracle.json";
import mockBondArtifact from "@/lib/abis/MockGovernmentBondFund.json";
import mockStablecoinArtifact from "@/lib/abis/MockStablecoinMint.json";
import mockCreditArtifact from "@/lib/abis/MockCreditFacility.json";

export const abis = {
  compliancePass: compliancePassArtifact.abi as Abi,
  complianceSBT: complianceSBTArtifact.abi as Abi,
  riskOracle: riskOracleArtifact.abi as Abi,
  mockBond: mockBondArtifact.abi as Abi,
  mockStablecoin: mockStablecoinArtifact.abi as Abi,
  mockCredit: mockCreditArtifact.abi as Abi,
};

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(activeChain.rpcUrls.default.http[0]),
});

const READ_TIMEOUT_MS = 4500;

async function withReadTimeout<T>(promise: Promise<T>, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), READ_TIMEOUT_MS);
    }),
  ]);
}

export async function getGroupId(credentialType: number): Promise<bigint> {
  return withReadTimeout(
    publicClient.readContract({
      address: deployedAddresses.compliancePass as `0x${string}`,
      abi: abis.compliancePass,
      functionName: "getGroupId",
      args: [credentialType],
    }) as Promise<bigint>,
    "Group lookup timed out. Confirm the chain is running and the wallet is on the correct network."
  );
}

export async function getWalletCompliance(address: string) {
  const [tokenId, bitmask, tier, riskScore] = await Promise.all([
    withReadTimeout(publicClient.readContract({
      address: deployedAddresses.complianceSBT as `0x${string}`,
      abi: abis.complianceSBT,
      functionName: "addressToTokenId",
      args: [address as `0x${string}`],
    }), "Credential lookup timed out. Confirm the local chain is running."),
    withReadTimeout(publicClient.readContract({
      address: deployedAddresses.complianceSBT as `0x${string}`,
      abi: abis.complianceSBT,
      functionName: "bitmaskOf",
      args: [address as `0x${string}`],
    }), "Credential state timed out. Confirm the local chain is running."),
    withReadTimeout(publicClient.readContract({
      address: deployedAddresses.complianceSBT as `0x${string}`,
      abi: abis.complianceSBT,
      functionName: "getTier",
      args: [address as `0x${string}`],
    }), "Tier lookup timed out. Confirm the local chain is running."),
    withReadTimeout(publicClient.readContract({
      address: deployedAddresses.aiRiskOracle as `0x${string}`,
      abi: abis.riskOracle,
      functionName: "getRiskScore",
      args: [address as `0x${string}`],
    }), "Risk lookup timed out. Confirm the local chain is running."),
  ]);

  return {
    tokenId: Number(tokenId),
    bitmask: Number(bitmask),
    tier: Number(tier),
    riskScore: Number(riskScore),
  };
}

export function protocolAddressForKey(key: "bond" | "stablecoin" | "credit") {
  if (key === "bond") return deployedAddresses.mockGovernmentBondFund as `0x${string}`;
  if (key === "stablecoin") return deployedAddresses.mockStablecoinMint as `0x${string}`;
  return deployedAddresses.mockCreditFacility as `0x${string}`;
}

export const appRuntime = {
  chainName: appConfig.activeChain.name,
  chainId: appConfig.activeChain.id,
};
