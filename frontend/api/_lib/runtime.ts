// @ts-nocheck
import { createPublicClient, createWalletClient, http, parseAbiItem } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import deployedAddresses from "../../src/lib/deployedAddresses.json" with { type: "json" };
import compliancePassArtifact from "../../src/lib/abis/CompliancePass.json" with { type: "json" };
import complianceSBTArtifact from "../../src/lib/abis/ComplianceSBT.json" with { type: "json" };
import aiRiskOracleArtifact from "../../src/lib/abis/AIRiskOracle.json" with { type: "json" };

const rpcUrl = process.env.HASHKEY_RPC_URL || "https://testnet.hsk.xyz";
const adminPrivateKey = normalizePrivateKey(process.env.ADMIN_PRIVATE_KEY);
const signingPrivateKey = normalizePrivateKey(process.env.ORACLE_SIGNING_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY);
const eventLookbackBlocks = BigInt(process.env.EVENT_LOOKBACK_BLOCKS || "500000");

if (!adminPrivateKey) {
  throw new Error("ADMIN_PRIVATE_KEY is required");
}

if (!signingPrivateKey) {
  throw new Error("ORACLE_SIGNING_PRIVATE_KEY or ADMIN_PRIVATE_KEY is required");
}

const chain =
  deployedAddresses.chainId === 133
    ? {
        id: 133,
        name: "HashKey Chain Testnet",
        nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      }
    : {
        id: 31337,
        name: "Local Sandbox",
        nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      };

const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

const adminAccount = privateKeyToAccount(adminPrivateKey);
const signingAccount = privateKeyToAccount(signingPrivateKey);

const walletClient = createWalletClient({
  account: adminAccount,
  chain,
  transport: http(rpcUrl),
});

const memberAddedEvent = parseAbiItem(
  "event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)"
);
const membersAddedEvent = parseAbiItem(
  "event MembersAdded(uint256 indexed groupId, uint256 startIndex, uint256[] identityCommitments, uint256 merkleTreeRoot)"
);
const attesterRegisteredEvent = parseAbiItem(
  "event AttesterRegistered(address indexed attester, string name, uint256 stakeAmount)"
);
const riskScoreUpdatedEvent = parseAbiItem(
  "event RiskScoreUpdated(address indexed wallet, uint8 score, address indexed agent)"
);
const credentialRevokedEvent = parseAbiItem(
  "event CredentialRevoked(address indexed user, uint8 indexed credentialTypeBit, uint8 reason)"
);
const attesterRegistryAbi = [
  {
    inputs: [{ internalType: "address", name: "attester", type: "address" }],
    name: "getAttesterInfo",
    outputs: [
      { internalType: "bool", name: "approved", type: "bool" },
      { internalType: "uint256", name: "staked", type: "uint256" },
      { internalType: "uint256", name: "issued", type: "uint256" },
      { internalType: "string", name: "name", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export async function getRecentFromBlock() {
  const latest = await publicClient.getBlockNumber();
  return latest > eventLookbackBlocks ? latest - eventLookbackBlocks : 0n;
}

export async function readHealth() {
  const [blockNumber, chainId] = await Promise.all([
    publicClient.getBlockNumber(),
    publicClient.getChainId(),
  ]);

  return {
    ok: true,
    blockNumber: Number(blockNumber),
    chainId,
  };
}

export async function verifyCommitment(commitment: string, credentialType: number) {
  const hash = await walletClient.writeContract({
    address: deployedAddresses.compliancePass as `0x${string}`,
    abi: compliancePassArtifact.abi,
    functionName: "addMember",
    args: [credentialType, BigInt(commitment)],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return { success: true, txHash: hash };
}

export async function updateRiskScore(walletAddress: string, score: number) {
  const hash = await walletClient.writeContract({
    address: deployedAddresses.aiRiskOracle as `0x${string}`,
    abi: aiRiskOracleArtifact.abi,
    functionName: "updateRiskScore",
    args: [walletAddress as `0x${string}`, score],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return { success: true, txHash: hash };
}

export async function exportVc(walletAddress: string) {
  const [tokenId, bitmask, tier, riskScore] = await Promise.all([
    publicClient.readContract({
      address: deployedAddresses.complianceSBT as `0x${string}`,
      abi: complianceSBTArtifact.abi,
      functionName: "addressToTokenId",
      args: [walletAddress as `0x${string}`],
    }),
    publicClient.readContract({
      address: deployedAddresses.complianceSBT as `0x${string}`,
      abi: complianceSBTArtifact.abi,
      functionName: "bitmaskOf",
      args: [walletAddress as `0x${string}`],
    }),
    publicClient.readContract({
      address: deployedAddresses.complianceSBT as `0x${string}`,
      abi: complianceSBTArtifact.abi,
      functionName: "getTier",
      args: [walletAddress as `0x${string}`],
    }),
    publicClient.readContract({
      address: deployedAddresses.aiRiskOracle as `0x${string}`,
      abi: aiRiskOracleArtifact.abi,
      functionName: "getRiskScore",
      args: [walletAddress as `0x${string}`],
    }),
  ]);

  const credentialTypes: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    if ((Number(bitmask) & (1 << i)) !== 0) {
      credentialTypes.push(`HashKeyComplianceCredential:${i}`);
    }
  }

  const payload = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    id: `urn:uuid:${tokenId.toString()}`,
    type: ["VerifiableCredential", "CompliancePassCredential"],
    issuer: {
      id: "did:hsk:compliancepass:v1",
    },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `did:hsk:${walletAddress.toLowerCase()}`,
      walletAddress,
      tokenId: tokenId.toString(),
      tier: Number(tier),
      riskScore: Number(riskScore),
      credentialTypes,
    },
  };

  const signature = await signingAccount.signMessage({
    message: JSON.stringify(payload),
  });

  return {
    ...payload,
    proof: {
      type: "EcdsaSecp256k1Signature2019",
      signature,
    },
  };
}

export async function loadAttesters() {
  const fromBlock = await getRecentFromBlock();
  const logs = await publicClient.getLogs({
    address: deployedAddresses.attesterRegistry as `0x${string}`,
    event: attesterRegisteredEvent,
    fromBlock,
  });

  const attesters = await Promise.all(
    logs.map(async (log) => {
      const result = await publicClient.readContract({
        address: deployedAddresses.attesterRegistry as `0x${string}`,
        abi: attesterRegistryAbi,
        functionName: "getAttesterInfo",
        args: [log.args.attester!],
      });

      const [approved, staked, issued, name] = result as readonly [boolean, bigint, bigint, string];
      return {
        attester: log.args.attester!,
        approved,
        stake: staked.toString(),
        credentialsIssued: issued.toString(),
        name,
      };
    })
  );

  return { attesters };
}

export async function loadAnalytics() {
  const fromBlock = await getRecentFromBlock();
  const [totalCredentials, credentialsByType, riskLogs, revocationLogs] = await Promise.all([
    publicClient.readContract({
      address: deployedAddresses.complianceSBT as `0x${string}`,
      abi: complianceSBTArtifact.abi,
      functionName: "totalMinted",
    }),
    Promise.all(
      [0, 1, 2, 3, 4].map(async (bit) => ({
        bit,
        count: (
          await publicClient.readContract({
            address: deployedAddresses.complianceSBT as `0x${string}`,
            abi: complianceSBTArtifact.abi,
            functionName: "credentialTypeCount",
            args: [bit],
          })
        ).toString(),
      }))
    ),
    publicClient.getLogs({
      address: deployedAddresses.aiRiskOracle as `0x${string}`,
      event: riskScoreUpdatedEvent,
      fromBlock,
    }),
    publicClient.getLogs({
      address: deployedAddresses.revocationRegistry as `0x${string}`,
      event: credentialRevokedEvent,
      fromBlock,
    }),
  ]);

  return {
    totalCredentials: totalCredentials.toString(),
    credentialsByType,
    activeProtocols: 3,
    riskDistribution: riskLogs.map((log) => Number(log.args.score)),
    revocationStats: revocationLogs.map((log) => ({
      user: log.args.user!,
      credentialTypeBit: Number(log.args.credentialTypeBit),
      reason: Number(log.args.reason),
    })),
  };
}

export function sendJson(res: any, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

export async function readJsonBody(req: any) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export function normalizePrivateKey(value?: string) {
  if (!value) {
    return undefined;
  }
  return value.startsWith("0x") ? value : `0x${value}`;
}

export { deployedAddresses, membersAddedEvent, memberAddedEvent, publicClient };
