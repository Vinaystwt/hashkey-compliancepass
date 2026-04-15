// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../ComplianceTier.sol";

contract ComplianceTierHarness {
    function computeTier(uint8 bitmask) external pure returns (uint8) {
        return ComplianceTier.computeTier(bitmask);
    }

    function meetsMinTier(uint8 bitmask, uint8 minTier) external pure returns (bool) {
        return ComplianceTier.meetsMinTier(bitmask, minTier);
    }
}
