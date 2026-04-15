// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RevocationRegistry is Ownable {
    error InvalidReason();

    mapping(address => mapping(uint8 => bool)) public revoked;
    mapping(address => mapping(uint8 => uint8)) public revocationReason;

    event CredentialRevoked(address indexed user, uint8 indexed credTypeBit, uint8 reason);
    event CredentialRestored(address indexed user, uint8 indexed credTypeBit);

    constructor() Ownable(msg.sender) {}

    function revoke(address user, uint8 credTypeBit, uint8 reason) external onlyOwner {
        if (reason > 2) revert InvalidReason();
        revoked[user][credTypeBit] = true;
        revocationReason[user][credTypeBit] = reason;
        emit CredentialRevoked(user, credTypeBit, reason);
    }

    function restore(address user, uint8 credTypeBit) external onlyOwner {
        revoked[user][credTypeBit] = false;
        revocationReason[user][credTypeBit] = 0;
        emit CredentialRestored(user, credTypeBit);
    }

    function isRevoked(address user, uint8 credTypeBit) external view returns (bool) {
        return revoked[user][credTypeBit];
    }
}
