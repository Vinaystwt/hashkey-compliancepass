// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AIRiskOracle.sol";
import "./interfaces/IComplianceSBT.sol";

abstract contract ComplianceGated {
    IComplianceSBT public immutable complianceSBT;
    AIRiskOracle public immutable riskOracle;

    error NotCompliant(address user, uint8 credentialTypeBit);
    error TierTooLow(address user, uint8 actualTier, uint8 requiredTier);
    error RiskScoreTooHigh(address user, uint8 actualRisk, uint8 maxRisk);

    event RollbackAwareComplianceCheck(
        address indexed user,
        address indexed protocol,
        uint8 requiredTier,
        uint8 riskScore,
        bytes32 context
    );

    constructor(address _complianceSBT, address _riskOracle) {
        complianceSBT = IComplianceSBT(_complianceSBT);
        riskOracle = AIRiskOracle(_riskOracle);
    }

    modifier onlyCompliant(uint8 credTypeBit) {
        if (!complianceSBT.hasCredential(msg.sender, credTypeBit)) {
            revert NotCompliant(msg.sender, credTypeBit);
        }
        _;
    }

    modifier onlyTier(uint8 minTier) {
        uint8 actualTier = complianceSBT.getTier(msg.sender);
        if (actualTier < minTier) {
            revert TierTooLow(msg.sender, actualTier, minTier);
        }
        _;
    }

    modifier onlyUnderRisk(uint8 maxScore) {
        uint8 score = riskOracle.getRiskScore(msg.sender);
        if (score > maxScore) {
            revert RiskScoreTooHigh(msg.sender, score, maxScore);
        }
        _;
    }

    modifier onlyTierAndRisk(uint8 minTier, uint8 maxRisk) {
        uint8 actualTier = complianceSBT.getTier(msg.sender);
        if (actualTier < minTier) {
            revert TierTooLow(msg.sender, actualTier, minTier);
        }
        uint8 score = riskOracle.getRiskScore(msg.sender);
        if (score > maxRisk) {
            revert RiskScoreTooHigh(msg.sender, score, maxRisk);
        }
        _;
    }

    modifier onlyCompliantWithRollback(uint8 minTier, uint8 maxRisk, bytes32 context) {
        uint8 actualTier = complianceSBT.getTier(msg.sender);
        if (actualTier < minTier) {
            revert TierTooLow(msg.sender, actualTier, minTier);
        }
        uint8 score = riskOracle.getRiskScore(msg.sender);
        if (score > maxRisk) {
            revert RiskScoreTooHigh(msg.sender, score, maxRisk);
        }
        emit RollbackAwareComplianceCheck(msg.sender, address(this), minTier, score, context);
        _;
    }

    function isCompliant(address user, uint8 credTypeBit) public view returns (bool) {
        return complianceSBT.hasCredential(user, credTypeBit);
    }
}
