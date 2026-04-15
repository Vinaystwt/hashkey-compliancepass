// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../ComplianceGated.sol";

contract MockStablecoinMint is ComplianceGated {
    mapping(address => uint256) public mintedAmount;
    uint256 public totalMinted;
    uint256 public uniqueMinters;

    event StablecoinMinted(address indexed minter, uint256 amount);

    constructor(address _complianceSBT, address _riskOracle) ComplianceGated(_complianceSBT, _riskOracle) {}

    function mintStablecoin(uint256 amount) external onlyTier(2) {
        require(amount > 0, "Amount must be > 0");
        if (mintedAmount[msg.sender] == 0) {
            unchecked {
                ++uniqueMinters;
            }
        }
        mintedAmount[msg.sender] += amount;
        totalMinted += amount;
        emit StablecoinMinted(msg.sender, amount);
    }

    function getMintInfo() external view returns (uint256 totalMintedSupply, uint256 minters, uint8 requiredTier) {
        return (totalMinted, uniqueMinters, 2);
    }
}
