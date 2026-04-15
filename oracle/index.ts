import cors from "cors";
import dotenv from "dotenv";
import { EventLog, ethers } from "ethers";
import express from "express";
import rateLimit from "express-rate-limit";
import deployedAddresses from "./deployed-addresses.json";
import compliancePassArtifact from "../contracts/artifacts/contracts/CompliancePass.sol/CompliancePass.json";
import complianceSBTArtifact from "../contracts/artifacts/contracts/ComplianceSBT.sol/ComplianceSBT.json";
import attesterRegistryArtifact from "../contracts/artifacts/contracts/AttesterRegistry.sol/AttesterRegistry.json";
import aiRiskOracleArtifact from "../contracts/artifacts/contracts/AIRiskOracle.sol/AIRiskOracle.json";
import revocationRegistryArtifact from "../contracts/artifacts/contracts/RevocationRegistry.sol/RevocationRegistry.json";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const port = Number(process.env.PORT || 3001);
const rpcUrl = process.env.HASHKEY_RPC_URL || "http://127.0.0.1:8545";
const eventLookbackBlocks = Number(process.env.EVENT_LOOKBACK_BLOCKS || 500_000);
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
const signingPrivateKey = process.env.ORACLE_SIGNING_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY;

if (!adminPrivateKey) {
  throw new Error("ADMIN_PRIVATE_KEY is required");
}

if (!signingPrivateKey) {
  throw new Error("ORACLE_SIGNING_PRIVATE_KEY or ADMIN_PRIVATE_KEY is required");
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const adminWallet = new ethers.NonceManager(new ethers.Wallet(adminPrivateKey, provider));
const signingWallet = new ethers.Wallet(signingPrivateKey);

const compliancePass = new ethers.Contract(
  deployedAddresses.compliancePass,
  compliancePassArtifact.abi,
  adminWallet
);
const complianceSBT = new ethers.Contract(
  deployedAddresses.complianceSBT,
  complianceSBTArtifact.abi,
  provider
);
const attesterRegistry = new ethers.Contract(
  deployedAddresses.attesterRegistry,
  attesterRegistryArtifact.abi,
  provider
);
const aiRiskOracle = new ethers.Contract(
  deployedAddresses.aiRiskOracle,
  aiRiskOracleArtifact.abi,
  adminWallet
);
const revocationRegistry = new ethers.Contract(
  deployedAddresses.revocationRegistry,
  revocationRegistryArtifact.abi,
  provider
);

async function getRecentFromBlock() {
  const latest = await provider.getBlockNumber();
  return latest > eventLookbackBlocks ? latest - eventLookbackBlocks : 0;
}

app.get("/health", async (_req, res) => {
  const blockNumber = await provider.getBlockNumber();
  res.json({ ok: true, blockNumber, chainId: Number((await provider.getNetwork()).chainId) });
});

app.post("/api/verify", async (req, res) => {
  const { commitment, credentialType } = req.body as {
    commitment?: string;
    credentialType?: number;
  };

  if (!commitment || credentialType === undefined) {
    return res.status(400).json({ error: "Missing commitment or credentialType" });
  }

  try {
    const tx = await compliancePass.addMember(credentialType, BigInt(commitment));
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (error: any) {
    res.status(500).json({ error: "Oracle verification failed", details: error.shortMessage || error.message });
  }
});

app.post("/api/renew", async (req, res) => {
  const { credentialType, proof } = req.body as {
    credentialType?: number;
    proof?: {
      merkleTreeDepth: bigint;
      merkleTreeRoot: bigint;
      nullifier: bigint;
      message: bigint;
      scope: bigint;
      points: bigint[];
    };
  };

  if (credentialType === undefined || !proof) {
    return res.status(400).json({ error: "Missing credentialType or proof" });
  }

  try {
    const tx = await compliancePass.renewCredential(credentialType, proof);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (error: any) {
    res.status(500).json({ error: "Credential renewal failed", details: error.shortMessage || error.message });
  }
});

app.post("/api/risk-score", async (req, res) => {
  const { walletAddress, score } = req.body as { walletAddress?: string; score?: number };
  if (!walletAddress || score === undefined || score < 0 || score > 100) {
    return res.status(400).json({ error: "walletAddress and score 0-100 are required" });
  }

  try {
    const tx = await aiRiskOracle.updateRiskScore(walletAddress, score);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (error: any) {
    res.status(500).json({ error: "Risk score update failed", details: error.shortMessage || error.message });
  }
});

app.get("/api/vc/:address", async (req, res) => {
  const walletAddress = req.params.address;
  try {
    const tokenId = await complianceSBT.addressToTokenId(walletAddress);
    const bitmask = Number(await complianceSBT.bitmaskOf(walletAddress));
    const tier = Number(await complianceSBT.getTier(walletAddress));
    const riskScore = Number(await complianceSBT.riskScore(walletAddress));

    const credentialTypes = [];
    for (let i = 0; i < 5; i++) {
      if ((bitmask & (1 << i)) !== 0) {
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
        tier,
        riskScore,
        credentialTypes,
      },
    };

    const signature = await signingWallet.signMessage(JSON.stringify(payload));
    res.json({ ...payload, proof: { type: "EcdsaSecp256k1Signature2019", signature } });
  } catch (error: any) {
    res.status(500).json({ error: "VC export failed", details: error.shortMessage || error.message });
  }
});

app.get("/api/attesters", async (_req, res) => {
  try {
    const fromBlock = await getRecentFromBlock();
    const filter = attesterRegistry.filters.AttesterRegistered();
    const logs = await attesterRegistry.queryFilter(filter, fromBlock, "latest");
    const eventLogs = logs.filter((log): log is EventLog => "args" in log);
    const attesters = await Promise.all(
      eventLogs.map(async (log) => {
        const attester = log.args[0] as string;
        const [approved, staked, issued, name] = await attesterRegistry.getAttesterInfo(attester);
        return {
          attester,
          approved,
          stake: staked.toString(),
          credentialsIssued: issued.toString(),
          name,
        };
      })
    );
    res.json({ attesters });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load attesters", details: error.shortMessage || error.message });
  }
});

app.get("/api/analytics", async (_req, res) => {
  try {
    const fromBlock = await getRecentFromBlock();
    const totalCredentials = await complianceSBT.totalMinted();
    const credentialsByType = await Promise.all(
      [0, 1, 2, 3, 4].map(async (bit) => ({
        bit,
        count: (await complianceSBT.credentialTypeCount(bit)).toString(),
      }))
    );

    const riskLogs = await aiRiskOracle.queryFilter(aiRiskOracle.filters.RiskScoreUpdated(), fromBlock, "latest");
    const revocationLogs = await revocationRegistry.queryFilter(revocationRegistry.filters.CredentialRevoked(), fromBlock, "latest");

    const riskEventLogs = riskLogs.filter((log): log is EventLog => "args" in log);
    const revocationEventLogs = revocationLogs.filter((log): log is EventLog => "args" in log);

    const riskDistribution = riskEventLogs.map((log) => Number(log.args[1]));
    const revocationStats = revocationEventLogs.map((log) => ({
      user: log.args[0],
      credentialTypeBit: Number(log.args[1]),
      reason: Number(log.args[2]),
    }));

    res.json({
      totalCredentials: totalCredentials.toString(),
      credentialsByType,
      activeProtocols: 3,
      riskDistribution,
      revocationStats,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load analytics", details: error.shortMessage || error.message });
  }
});

app.listen(port, () => {
  console.log(`Oracle running on :${port}`);
});
