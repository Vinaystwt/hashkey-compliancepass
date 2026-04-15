import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;

  console.log("Deploying with:", deployerAddress);
  console.log(
    "Balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployerAddress)),
    "HSK"
  );

  const SemaphoreVerifier = await ethers.getContractFactory(
    "SemaphoreVerifier"
  );
  const verifier = await SemaphoreVerifier.deploy();
  await verifier.waitForDeployment();

  const PoseidonT3 = await ethers.getContractFactory(
    "poseidon-solidity/PoseidonT3.sol:PoseidonT3"
  );
  const poseidonT3 = await PoseidonT3.deploy();
  await poseidonT3.waitForDeployment();

  const Semaphore = await ethers.getContractFactory(
    "Semaphore",
    {
      libraries: {
        PoseidonT3: await poseidonT3.getAddress(),
      },
    }
  );
  const semaphore = await Semaphore.deploy(await verifier.getAddress());
  await semaphore.waitForDeployment();

  const RevocationRegistry = await ethers.getContractFactory("RevocationRegistry");
  const revocationRegistry = await RevocationRegistry.deploy();
  await revocationRegistry.waitForDeployment();

  const AttesterRegistry = await ethers.getContractFactory("AttesterRegistry");
  const attesterRegistry = await AttesterRegistry.deploy();
  await attesterRegistry.waitForDeployment();

  const AIRiskOracle = await ethers.getContractFactory("AIRiskOracle");
  const aiRiskOracle = await AIRiskOracle.deploy();
  await aiRiskOracle.waitForDeployment();

  const ComplianceSBT = await ethers.getContractFactory("ComplianceSBT");
  const complianceSBT = await ComplianceSBT.deploy(
    await revocationRegistry.getAddress(),
    await aiRiskOracle.getAddress()
  );
  await complianceSBT.waitForDeployment();

  const CompliancePass = await ethers.getContractFactory("CompliancePass");
  const compliancePass = await CompliancePass.deploy(
    await semaphore.getAddress(),
    await complianceSBT.getAddress(),
    await attesterRegistry.getAddress()
  );
  await compliancePass.waitForDeployment();

  await (await complianceSBT.setMinter(await compliancePass.getAddress())).wait();
  await (await attesterRegistry.setCompliancePass(await compliancePass.getAddress())).wait();
  await (await aiRiskOracle.setAgent(deployerAddress, true)).wait();

  const stakeTx = await attesterRegistry.register("HashKey Exchange (Demo)", {
    value: ethers.parseEther("0.01"),
  });
  await stakeTx.wait();
  await (await attesterRegistry.approveAttester(deployerAddress)).wait();

  const MockGovernmentBondFund = await ethers.getContractFactory("MockGovernmentBondFund");
  const mockGovernmentBondFund = await MockGovernmentBondFund.deploy(
    await complianceSBT.getAddress(),
    await aiRiskOracle.getAddress()
  );
  await mockGovernmentBondFund.waitForDeployment();

  const MockStablecoinMint = await ethers.getContractFactory("MockStablecoinMint");
  const mockStablecoinMint = await MockStablecoinMint.deploy(
    await complianceSBT.getAddress(),
    await aiRiskOracle.getAddress()
  );
  await mockStablecoinMint.waitForDeployment();

  const MockCreditFacility = await ethers.getContractFactory("MockCreditFacility");
  const mockCreditFacility = await MockCreditFacility.deploy(
    await complianceSBT.getAddress(),
    await aiRiskOracle.getAddress()
  );
  await mockCreditFacility.waitForDeployment();

  const demoWallet = process.env.DEMO_WALLET_ADDRESS;
  if (demoWallet && demoWallet !== ethers.ZeroAddress) {
    await (await aiRiskOracle.updateRiskScore(demoWallet, 30)).wait();
  }

  const addresses = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployerAddress,
    semaphoreVerifier: await verifier.getAddress(),
    poseidonT3: await poseidonT3.getAddress(),
    semaphore: await semaphore.getAddress(),
    revocationRegistry: await revocationRegistry.getAddress(),
    attesterRegistry: await attesterRegistry.getAddress(),
    aiRiskOracle: await aiRiskOracle.getAddress(),
    complianceSBT: await complianceSBT.getAddress(),
    compliancePass: await compliancePass.getAddress(),
    mockGovernmentBondFund: await mockGovernmentBondFund.getAddress(),
    mockStablecoinMint: await mockStablecoinMint.getAddress(),
    mockCreditFacility: await mockCreditFacility.getAddress(),
  };

  const targets = [
    path.resolve(__dirname, "..", "deployed-addresses.json"),
    path.resolve(__dirname, "..", "..", "oracle", "deployed-addresses.json"),
    path.resolve(__dirname, "..", "..", "sdk", "deployed-addresses.json"),
    path.resolve(__dirname, "..", "..", "frontend", "src", "lib", "deployedAddresses.json"),
  ];

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(addresses, null, 2));
  }

  console.log("\nDeployment complete:");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
