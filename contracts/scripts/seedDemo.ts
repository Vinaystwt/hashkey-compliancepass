import { ethers } from "hardhat";

type Addresses = {
  compliancePass: string;
  attesterRegistry: string;
  aiRiskOracle: string;
};

async function main() {
  const addresses = require("../deployed-addresses.json") as Addresses;
  const [admin] = await ethers.getSigners();
  const demoWallet = process.env.DEMO_WALLET_ADDRESS;

  if (!demoWallet) {
    throw new Error("DEMO_WALLET_ADDRESS is required");
  }

  const compliancePass = await ethers.getContractAt("CompliancePass", addresses.compliancePass, admin);
  const attesterRegistry = await ethers.getContractAt("AttesterRegistry", addresses.attesterRegistry, admin);
  const aiRiskOracle = await ethers.getContractAt("AIRiskOracle", addresses.aiRiskOracle, admin);

  const stake = await attesterRegistry.stake(admin.address);
  if (stake === 0n) {
    await (await attesterRegistry.register("HashKey Exchange (Demo)", { value: ethers.parseEther("0.01") })).wait();
  }

  if (!(await attesterRegistry.isApproved(admin.address))) {
    await (await attesterRegistry.approveAttester(admin.address)).wait();
  }

  const demoSeed = `HashKey CompliancePass Identity v1 — 133 — ${demoWallet.toLowerCase()}`;
  const commitment = BigInt(ethers.keccak256(ethers.toUtf8Bytes(demoSeed))) >> 8n;

  await (await compliancePass.addMember(2, commitment)).wait();
  await (await compliancePass.addMembers(2, buildFakeCommitments(10))).wait();
  await (await aiRiskOracle.setAgent(admin.address, true)).wait();
  await (await aiRiskOracle.updateRiskScore(demoWallet, 25)).wait();

  console.log("Demo seeded for wallet:", demoWallet);
  console.log("Commitment:", commitment.toString());
}

function buildFakeCommitments(count: number): bigint[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = `hashkey-compliancepass-demo-${i}`;
    return BigInt(ethers.keccak256(ethers.toUtf8Bytes(seed))) >> 8n;
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
