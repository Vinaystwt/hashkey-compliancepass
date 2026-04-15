import { expect } from "chai";
import { ethers } from "hardhat";

describe("ComplianceSBT", function () {
  async function deployFixture() {
    const [owner, user, other] = await ethers.getSigners();

    const RevocationRegistry = await ethers.getContractFactory("RevocationRegistry");
    const revocationRegistry = await RevocationRegistry.deploy();

    const AIRiskOracle = await ethers.getContractFactory("AIRiskOracle");
    const riskOracle = await AIRiskOracle.deploy();

    const ComplianceSBT = await ethers.getContractFactory("ComplianceSBT");
    const sbt = await ComplianceSBT.deploy(
      await revocationRegistry.getAddress(),
      await riskOracle.getAddress()
    );
    await sbt.setMinter(owner.address);

    return { owner, user, other, sbt, revocationRegistry, riskOracle };
  }

  it("mints soulbound credentials and ORs bitmasks", async function () {
    const { owner, user, sbt } = await deployFixture();

    await sbt.connect(owner).mint(user.address, 2, owner.address);
    await sbt.connect(owner).mint(user.address, 0, owner.address);

    expect(await sbt.hasCredential(user.address, 2)).to.equal(true);
    expect(await sbt.hasCredential(user.address, 0)).to.equal(true);
    expect(await sbt.bitmaskOf(user.address)).to.equal(0b00000101);
    await expect(
      sbt.connect(user).transferFrom(user.address, owner.address, 1)
    ).to.be.revertedWithCustomError(sbt, "SoulboundNonTransferable");
  });

  it("marks credentials inactive after expiry", async function () {
    const { owner, user, sbt } = await deployFixture();

    await sbt.connect(owner).setExpiryConfig(2, 1);
    await sbt.connect(owner).mint(user.address, 2, owner.address);

    expect(await sbt.hasCredential(user.address, 2)).to.equal(true);
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);
    expect(await sbt.hasCredential(user.address, 2)).to.equal(false);
  });

  it("marks credentials inactive after revocation", async function () {
    const { owner, user, sbt, revocationRegistry } = await deployFixture();

    await sbt.connect(owner).mint(user.address, 2, owner.address);
    expect(await sbt.hasCredential(user.address, 2)).to.equal(true);

    await revocationRegistry.connect(owner).revoke(user.address, 2, 1);
    expect(await sbt.hasCredential(user.address, 2)).to.equal(false);
  });
});
