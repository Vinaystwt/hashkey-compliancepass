// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../ComplianceGated.sol";

contract MockCreditFacility is ComplianceGated {
    mapping(address => uint256) public creditLimit;
    uint256 public totalCreditsApproved;
    uint256 public riskScoreAccumulator;
    uint256 public applicants;

    event CreditApproved(address indexed borrower, uint256 limit, uint8 riskScore);

    constructor(address _complianceSBT, address _riskOracle) ComplianceGated(_complianceSBT, _riskOracle) {}

    function applyForCredit(uint256 amount) external onlyTierAndRisk(2, 50) {
        require(amount > 0, "Amount must be > 0");
        if (creditLimit[msg.sender] == 0) {
            unchecked {
                ++applicants;
            }
        }
        uint8 score = riskOracle.getRiskScore(msg.sender);
        creditLimit[msg.sender] = amount;
        totalCreditsApproved += amount;
        riskScoreAccumulator += score;
        emit CreditApproved(msg.sender, amount, score);
    }

    function getFacilityInfo() external view returns (uint256 totalApproved, uint256 averageRiskScore, uint8 requiredTier, uint8 maxRisk) {
        uint256 avg = applicants == 0 ? 0 : riskScoreAccumulator / applicants;
        return (totalCreditsApproved, avg, 2, 50);
    }
}
