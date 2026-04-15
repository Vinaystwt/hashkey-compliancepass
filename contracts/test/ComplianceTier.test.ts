import { expect } from "chai";
import { ethers } from "hardhat";

describe("ComplianceTier", function () {
  it("computes the upgraded progressive compliance tiers", async function () {
    const Harness = await ethers.getContractFactory("ComplianceTierHarness");
    const harness = await Harness.deploy();

    expect(await harness.computeTier(0b00000000)).to.equal(0);
    expect(await harness.computeTier(0b00000001)).to.equal(1);
    expect(await harness.computeTier(0b00000010)).to.equal(1);
    expect(await harness.computeTier(0b00001010)).to.equal(2);
    expect(await harness.computeTier(0b00010100)).to.equal(3);
  });
});
