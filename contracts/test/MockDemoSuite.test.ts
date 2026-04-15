import { expect } from "chai";
import { ethers } from "hardhat";

describe("Mock demo suite", function () {
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();

    const RevocationRegistry = await ethers.getContractFactory("RevocationRegistry");
    const revocationRegistry = await RevocationRegistry.deploy();

    const AIRiskOracle = await ethers.getContractFactory("AIRiskOracle");
    const riskOracle = await AIRiskOracle.deploy();
    await riskOracle.setAgent(owner.address, true);

    const ComplianceSBT = await ethers.getContractFactory("ComplianceSBT");
    const sbt = await ComplianceSBT.deploy(
      await revocationRegistry.getAddress(),
      await riskOracle.getAddress()
    );
    await sbt.setMinter(owner.address);

    const BondFund = await ethers.getContractFactory("MockGovernmentBondFund");
    const bondFund = await BondFund.deploy(await sbt.getAddress(), await riskOracle.getAddress());

    const StablecoinMint = await ethers.getContractFactory("MockStablecoinMint");
    const stablecoinMint = await StablecoinMint.deploy(await sbt.getAddress(), await riskOracle.getAddress());

    const CreditFacility = await ethers.getContractFactory("MockCreditFacility");
    const creditFacility = await CreditFacility.deploy(await sbt.getAddress(), await riskOracle.getAddress());

    return { owner, user, riskOracle, sbt, bondFund, stablecoinMint, creditFacility };
  }

  it("blocks access without the required credentials", async function () {
    const { user, bondFund, stablecoinMint, creditFacility } = await deployFixture();

    await expect(
      bondFund.connect(user).deposit({ value: ethers.parseEther("1") })
    ).to.be.revertedWithCustomError(bondFund, "TierTooLow");

    await expect(
      stablecoinMint.connect(user).mintStablecoin(1000)
    ).to.be.revertedWithCustomError(stablecoinMint, "TierTooLow");

    await expect(
      creditFacility.connect(user).applyForCredit(1000)
    ).to.be.revertedWithCustomError(creditFacility, "TierTooLow");
  });

  it("allows the bond fund with a tier 3 credential set", async function () {
    const { owner, user, sbt, bondFund } = await deployFixture();

    await sbt.connect(owner).mint(user.address, 2, owner.address);
    await sbt.connect(owner).mint(user.address, 4, owner.address);

    await expect(
      bondFund.connect(user).deposit({ value: ethers.parseEther("1") })
    ).to.emit(bondFund, "Deposited");
  });

  it("blocks credit when the risk score is too high even with the right tier", async function () {
    const { owner, user, sbt, riskOracle, creditFacility } = await deployFixture();

    await sbt.connect(owner).mint(user.address, 1, owner.address);
    await sbt.connect(owner).mint(user.address, 3, owner.address);
    await riskOracle.connect(owner).updateRiskScore(user.address, 75);

    await expect(
      creditFacility.connect(user).applyForCredit(1000)
    ).to.be.revertedWithCustomError(creditFacility, "RiskScoreTooHigh");
  });
});
