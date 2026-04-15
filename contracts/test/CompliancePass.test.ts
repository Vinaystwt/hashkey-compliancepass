import { expect } from "chai";
import { ethers } from "hardhat";

describe("CompliancePass", function () {
  async function deployFixture() {
    const [owner, user, unapproved] = await ethers.getSigners();

    const MockSemaphore = await ethers.getContractFactory("MockSemaphore");
    const semaphore = await MockSemaphore.deploy();

    const RevocationRegistry = await ethers.getContractFactory("RevocationRegistry");
    const revocationRegistry = await RevocationRegistry.deploy();

    const AIRiskOracle = await ethers.getContractFactory("AIRiskOracle");
    const riskOracle = await AIRiskOracle.deploy();

    const AttesterRegistry = await ethers.getContractFactory("AttesterRegistry");
    const attesterRegistry = await AttesterRegistry.deploy();

    const ComplianceSBT = await ethers.getContractFactory("ComplianceSBT");
    const sbt = await ComplianceSBT.deploy(
      await revocationRegistry.getAddress(),
      await riskOracle.getAddress()
    );

    const CompliancePass = await ethers.getContractFactory("CompliancePass");
    const compliancePass = await CompliancePass.deploy(
      await semaphore.getAddress(),
      await sbt.getAddress(),
      await attesterRegistry.getAddress()
    );

    await sbt.setMinter(await compliancePass.getAddress());
    await attesterRegistry.setCompliancePass(await compliancePass.getAddress());
    await attesterRegistry.connect(owner).register("HashKey Exchange", { value: ethers.parseEther("0.01") });
    await attesterRegistry.approveAttester(owner.address);

    return {
      owner,
      user,
      unapproved,
      semaphore,
      revocationRegistry,
      riskOracle,
      attesterRegistry,
      sbt,
      compliancePass,
    };
  }

  function proofFor(address: string, nullifier: bigint, scope: bigint) {
    return {
      merkleTreeDepth: 20,
      merkleTreeRoot: 123n,
      nullifier,
      message: BigInt(address),
      scope,
      points: [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n],
    };
  }

  it("mints a credential with a valid proof", async function () {
    const { user, compliancePass, sbt } = await deployFixture();
    const groupId = await compliancePass.getGroupId(2);
    const proof = proofFor(user.address, 111n, groupId);

    await expect(compliancePass.connect(user).mintCredential(2, proof))
      .to.emit(compliancePass, "CredentialMinted");

    expect(await sbt.hasCredential(user.address, 2)).to.equal(true);
  });

  it("rejects proofs with the wrong message", async function () {
    const { user, compliancePass } = await deployFixture();
    const groupId = await compliancePass.getGroupId(2);
    const proof = {
      ...proofFor(user.address, 111n, groupId),
      message: 999n,
    };

    await expect(
      compliancePass.connect(user).mintCredential(2, proof)
    ).to.be.revertedWithCustomError(compliancePass, "InvalidProofMessage");
  });

  it("rejects double minting the same active credential", async function () {
    const { user, compliancePass } = await deployFixture();
    const groupId = await compliancePass.getGroupId(2);

    await compliancePass.connect(user).mintCredential(2, proofFor(user.address, 111n, groupId));

    await expect(
      compliancePass.connect(user).mintCredential(2, proofFor(user.address, 112n, groupId))
    ).to.be.revertedWithCustomError(compliancePass, "CredentialAlreadyExists");
  });

  it("renews an existing credential and extends expiry", async function () {
    const { owner, user, compliancePass, sbt } = await deployFixture();
    const groupId = await compliancePass.getGroupId(2);

    await sbt.connect(owner).setExpiryConfig(2, 5);
    await compliancePass.connect(user).mintCredential(2, proofFor(user.address, 111n, groupId));
    const initialExpiry = await sbt.credentialExpiresAt(user.address, 2);

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      compliancePass.connect(user).renewCredential(2, proofFor(user.address, 222n, groupId))
    ).to.emit(compliancePass, "CredentialRenewed");

    const renewedExpiry = await sbt.credentialExpiresAt(user.address, 2);
    expect(renewedExpiry).to.be.greaterThan(initialExpiry);
  });

  it("blocks issuance when the selected attester is not approved", async function () {
    const { user, unapproved, compliancePass } = await deployFixture();
    await compliancePass.setDefaultAttester(unapproved.address);
    const groupId = await compliancePass.getGroupId(2);

    await expect(
      compliancePass.connect(user).mintCredential(2, proofFor(user.address, 111n, groupId))
    ).to.be.revertedWithCustomError(compliancePass, "AttesterNotApproved");
  });
});
