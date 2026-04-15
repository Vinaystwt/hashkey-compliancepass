const { randomBytes } = require("node:crypto");
const { Contract, JsonRpcProvider, Wallet, formatEther, parseEther } = require("ethers");
const deployedAddresses = require("../deployed-addresses.json");
const complianceSBTArtifact = require("../../contracts/artifacts/contracts/ComplianceSBT.sol/ComplianceSBT.json");
const riskOracleArtifact = require("../../contracts/artifacts/contracts/AIRiskOracle.sol/AIRiskOracle.json");
const mockBondArtifact = require("../../contracts/artifacts/contracts/demo/MockGovernmentBondFund.sol/MockGovernmentBondFund.json");
const mockStablecoinArtifact = require("../../contracts/artifacts/contracts/demo/MockStablecoinMint.sol/MockStablecoinMint.json");
const mockCreditArtifact = require("../../contracts/artifacts/contracts/demo/MockCreditFacility.sol/MockCreditFacility.json");

const rpcUrl = process.env.HASHKEY_RPC_URL || "https://testnet.hsk.xyz";
const oracleBaseUrl = process.env.ORACLE_API_URL || "https://frontend-one-tau-78.vercel.app";
const rawPrivateKey = process.env.TESTNET_PRIVATE_KEY || process.env.PRIVATE_KEY;

if (!rawPrivateKey) {
  throw new Error("TESTNET_PRIVATE_KEY or PRIVATE_KEY is required");
}

const privateKey = rawPrivateKey.startsWith("0x") ? rawPrivateKey : `0x${rawPrivateKey}`;
const provider = new JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKey, provider);

const complianceSBT = new Contract(
  deployedAddresses.complianceSBT,
  complianceSBTArtifact.abi,
  provider
);
const riskOracle = new Contract(
  deployedAddresses.aiRiskOracle,
  riskOracleArtifact.abi,
  provider
);
const mockBond = new Contract(
  deployedAddresses.mockGovernmentBondFund,
  mockBondArtifact.abi,
  wallet
);
const mockStablecoin = new Contract(
  deployedAddresses.mockStablecoinMint,
  mockStablecoinArtifact.abi,
  wallet
);
const mockCredit = new Contract(
  deployedAddresses.mockCreditFacility,
  mockCreditArtifact.abi,
  wallet
);

async function request(path, init) {
  const response = await fetch(`${oracleBaseUrl}${path}`, init);
  const text = await response.text();

  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
  }

  return payload;
}

async function readWalletState(address) {
  const [tokenId, bitmask, tier, riskScore, balance] = await Promise.all([
    complianceSBT.addressToTokenId(address),
    complianceSBT.bitmaskOf(address),
    complianceSBT.getTier(address),
    riskOracle.getRiskScore(address),
    provider.getBalance(address),
  ]);

  return {
    tokenId: Number(tokenId),
    bitmask: Number(bitmask),
    tier: Number(tier),
    riskScore: Number(riskScore),
    balanceWei: balance.toString(),
    balanceHsk: formatEther(balance),
  };
}

function randomCommitment() {
  return BigInt(`0x${randomBytes(31).toString("hex")}`).toString();
}

async function main() {
  const address = wallet.address;
  const startingState = await readWalletState(address);

  const [health, initialAnalytics, attesters, vc] = await Promise.all([
    request("/api/health"),
    request("/api/analytics"),
    request("/api/attesters"),
    request(`/api/vc/${address}`),
  ]);

  const riskWrite = await request("/api/risk-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: address, score: 25 }),
  });

  const verifyProbe = await request("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commitment: randomCommitment(), credentialType: 1 }),
  });

  const bondTx = await mockBond.deposit({ value: parseEther("0.1") });
  await bondTx.wait();

  const stablecoinTx = await mockStablecoin.mintStablecoin(1000n);
  await stablecoinTx.wait();

  const creditTx = await mockCredit.applyForCredit(5000n);
  await creditTx.wait();

  const [bondDeposit, stablecoinMinted, creditLimit, finalAnalytics, endingState] = await Promise.all([
    mockBond.deposits(address),
    mockStablecoin.mintedAmount(address),
    mockCredit.creditLimit(address),
    request("/api/analytics"),
    readWalletState(address),
  ]);

  console.log(
    JSON.stringify(
      {
        address,
        health,
        startingState,
        endingState,
        verifyProbe,
        riskWrite,
        vcSummary: {
          id: vc.id,
          tier: vc.credentialSubject?.tier,
          riskScore: vc.credentialSubject?.riskScore,
          credentialTypes: vc.credentialSubject?.credentialTypes,
        },
        attestersCount: attesters.attesters.length,
        analyticsBefore: initialAnalytics,
        analyticsAfter: finalAnalytics,
        demo: {
          txHashes: {
            bond: bondTx.hash,
            stablecoin: stablecoinTx.hash,
            credit: creditTx.hash,
          },
          state: {
            bondDepositWei: bondDeposit.toString(),
            bondDepositHsk: formatEther(bondDeposit),
            stablecoinMinted: stablecoinMinted.toString(),
            creditLimit: creditLimit.toString(),
          },
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
