// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library ComplianceTier {
    uint8 internal constant AGE_18 = 0;
    uint8 internal constant JURISDICTION = 1;
    uint8 internal constant ACCREDITED = 2;
    uint8 internal constant KYC_L1 = 3;
    uint8 internal constant KYC_L2 = 4;

    function computeTier(uint8 bitmask) internal pure returns (uint8) {
        bool hasAge = _hasBit(bitmask, AGE_18);
        bool hasJurisdiction = _hasBit(bitmask, JURISDICTION);
        bool hasAccredited = _hasBit(bitmask, ACCREDITED);
        bool hasKycL1 = _hasBit(bitmask, KYC_L1);
        bool hasKycL2 = _hasBit(bitmask, KYC_L2);

        if (hasAccredited && hasKycL2) {
            return 3;
        }

        if (hasJurisdiction && (hasKycL1 || hasKycL2)) {
            return 2;
        }

        if (hasAge || hasJurisdiction) {
            return 1;
        }

        return 0;
    }

    function meetsMinTier(uint8 bitmask, uint8 minTier) internal pure returns (bool) {
        return computeTier(bitmask) >= minTier;
    }

    function _hasBit(uint8 bitmask, uint8 bit) private pure returns (bool) {
        return (bitmask & (1 << bit)) != 0;
    }
}
