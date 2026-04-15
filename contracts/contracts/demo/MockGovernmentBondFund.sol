// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../ComplianceGated.sol";

contract MockGovernmentBondFund is ComplianceGated {
    string public constant ASSET_NAME = "HK Tokenized Government Bond Fund";
    uint256 public constant MOCK_APY_BPS = 450;

    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;
    uint256 public totalInvestors;

    event Deposited(address indexed investor, uint256 amount, uint256 totalDeposits);
    event Withdrawn(address indexed investor, uint256 amount);

    constructor(address _complianceSBT, address _riskOracle) ComplianceGated(_complianceSBT, _riskOracle) {}

    function deposit() external payable onlyTier(3) {
        require(msg.value > 0, "Must deposit > 0");
        if (deposits[msg.sender] == 0) {
            unchecked {
                ++totalInvestors;
            }
        }
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value, totalDeposits);
    }

    function withdraw() external {
        uint256 amount = deposits[msg.sender];
        require(amount > 0, "No deposit to withdraw");
        deposits[msg.sender] = 0;
        totalDeposits -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getPoolInfo() external view returns (string memory assetName, uint256 apy, uint256 tvl, uint256 investors, uint8 requiredTier) {
        return (ASSET_NAME, MOCK_APY_BPS, totalDeposits, totalInvestors, 3);
    }
}
