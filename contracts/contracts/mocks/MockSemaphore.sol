// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract MockSemaphore is ISemaphore {
    uint256 public override groupCounter;

    mapping(uint256 => address) public admins;
    mapping(uint256 => mapping(uint256 => bool)) public members;
    mapping(uint256 => mapping(uint256 => bool)) public usedNullifiers;

    function createGroup() external override returns (uint256 groupId) {
        groupId = groupCounter++;
        admins[groupId] = msg.sender;
    }

    function createGroup(address admin) external override returns (uint256 groupId) {
        groupId = groupCounter++;
        admins[groupId] = admin;
    }

    function createGroup(address admin, uint256) external override returns (uint256 groupId) {
        groupId = groupCounter++;
        admins[groupId] = admin;
    }

    function updateGroupAdmin(uint256 groupId, address newAdmin) external override {
        admins[groupId] = newAdmin;
    }

    function acceptGroupAdmin(uint256) external pure override {}

    function updateGroupMerkleTreeDuration(uint256, uint256) external pure override {}

    function addMember(uint256 groupId, uint256 identityCommitment) external override {
        members[groupId][identityCommitment] = true;
    }

    function addMembers(uint256 groupId, uint256[] calldata identityCommitments) external override {
        for (uint256 i = 0; i < identityCommitments.length; i++) {
            members[groupId][identityCommitments[i]] = true;
        }
    }

    function updateMember(uint256 groupId, uint256 oldIdentityCommitment, uint256 newIdentityCommitment, uint256[] calldata)
        external
        override
    {
        members[groupId][oldIdentityCommitment] = false;
        members[groupId][newIdentityCommitment] = true;
    }

    function removeMember(uint256 groupId, uint256 identityCommitment, uint256[] calldata) external override {
        members[groupId][identityCommitment] = false;
    }

    function validateProof(uint256 groupId, SemaphoreProof calldata proof) external override {
        if (usedNullifiers[groupId][proof.nullifier]) {
            revert Semaphore__YouAreUsingTheSameNullifierTwice();
        }
        usedNullifiers[groupId][proof.nullifier] = true;
        emit ProofValidated(
            groupId,
            proof.merkleTreeDepth,
            proof.merkleTreeRoot,
            proof.nullifier,
            proof.message,
            proof.scope,
            proof.points
        );
    }

    function verifyProof(uint256, SemaphoreProof calldata) external pure override returns (bool) {
        return true;
    }
}
