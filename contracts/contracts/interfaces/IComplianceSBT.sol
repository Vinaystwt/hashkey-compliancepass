// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IComplianceSBT {
    struct CredentialData {
        uint8 bitmask;
        uint64 issuedAt;
        uint64 expiresAt;
    }

    function hasCredential(address user, uint8 credTypeBit) external view returns (bool);
    function hasCredentialNotRevoked(address user, uint8 credTypeBit) external view returns (bool);
    function riskScore(address user) external view returns (uint8);
    function getTier(address user) external view returns (uint8);
    function credentialExpiresAt(address user, uint8 credTypeBit) external view returns (uint64);
    function credentialAttester(address user, uint8 credTypeBit) external view returns (address);
    function bitmaskOf(address user) external view returns (uint8);
    function activeBitmaskOf(address user) external view returns (uint8);
    function credentialData(uint256 tokenId) external view returns (CredentialData memory);
    function addressToTokenId(address user) external view returns (uint256);
    function credentialTypeCount(uint8 bit) external view returns (uint256);
    function totalMinted() external view returns (uint256);
    function mint(address to, uint8 credTypeBit, address attester) external returns (uint256);
}
