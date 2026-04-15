// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "./AttesterRegistry.sol";
import "./ComplianceSBT.sol";

contract CompliancePass is Ownable, ReentrancyGuard {
    enum CredentialType {
        AGE_18_PLUS,
        PERMITTED_JURISDICTION,
        ACCREDITED_INVESTOR,
        KYC_LEVEL_1,
        KYC_LEVEL_2
    }

    uint8 public constant NUM_CREDENTIAL_TYPES = 5;

    ISemaphore public immutable semaphore;
    ComplianceSBT public immutable sbt;
    AttesterRegistry public immutable attesterRegistry;

    mapping(CredentialType => uint256) public credentialGroupId;
    uint256 public totalProofsVerified;
    address public defaultAttester;

    event CredentialMinted(
        address indexed recipient,
        CredentialType indexed credType,
        uint256 tokenId,
        uint256 nullifier,
        address attester
    );
    event CredentialRenewed(
        address indexed recipient,
        CredentialType indexed credType,
        uint64 newExpiresAt,
        address attester
    );
    event MemberAdded(CredentialType indexed credType, uint256 identityCommitment);
    event GroupCreated(CredentialType indexed credType, uint256 groupId);
    event DefaultAttesterUpdated(address indexed attester);

    error InvalidProofMessage();
    error CredentialAlreadyExists();
    error CredentialNotIssued();
    error InvalidCredentialType();
    error AttesterNotApproved();

    constructor(address _semaphore, address _sbt, address _attesterRegistry) Ownable(msg.sender) {
        semaphore = ISemaphore(_semaphore);
        sbt = ComplianceSBT(_sbt);
        attesterRegistry = AttesterRegistry(_attesterRegistry);
        defaultAttester = msg.sender;

        for (uint8 i = 0; i < NUM_CREDENTIAL_TYPES; i++) {
            uint256 groupId = semaphore.createGroup(address(this));
            credentialGroupId[CredentialType(i)] = groupId;
            emit GroupCreated(CredentialType(i), groupId);
        }
    }

    function setDefaultAttester(address attester) external onlyOwner {
        defaultAttester = attester;
        emit DefaultAttesterUpdated(attester);
    }

    function addMember(CredentialType credType, uint256 identityCommitment) external onlyOwner {
        _ensureValidCredentialType(credType);
        semaphore.addMember(credentialGroupId[credType], identityCommitment);
        emit MemberAdded(credType, identityCommitment);
    }

    function addMembers(CredentialType credType, uint256[] calldata commitments) external onlyOwner {
        _ensureValidCredentialType(credType);
        semaphore.addMembers(credentialGroupId[credType], commitments);
        for (uint256 i = 0; i < commitments.length; i++) {
            emit MemberAdded(credType, commitments[i]);
        }
    }

    function mintCredential(CredentialType credType, ISemaphore.SemaphoreProof calldata proof) external nonReentrant {
        _ensureValidCredentialType(credType);
        if (proof.message != uint256(uint160(msg.sender))) revert InvalidProofMessage();
        if (sbt.hasCredential(msg.sender, uint8(credType))) revert CredentialAlreadyExists();

        address attester = defaultAttester;
        if (!attesterRegistry.isApproved(attester)) revert AttesterNotApproved();

        semaphore.validateProof(credentialGroupId[credType], proof);

        uint256 tokenId = sbt.mint(msg.sender, uint8(credType), attester);
        attesterRegistry.incrementIssued(attester);
        unchecked {
            ++totalProofsVerified;
        }

        emit CredentialMinted(msg.sender, credType, tokenId, proof.nullifier, attester);
    }

    function renewCredential(CredentialType credType, ISemaphore.SemaphoreProof calldata proof) external nonReentrant {
        _ensureValidCredentialType(credType);
        if (proof.message != uint256(uint160(msg.sender))) revert InvalidProofMessage();
        if (sbt.bitmaskOf(msg.sender) & (1 << uint8(credType)) == 0) revert CredentialNotIssued();

        address attester = defaultAttester;
        if (!attesterRegistry.isApproved(attester)) revert AttesterNotApproved();

        semaphore.validateProof(credentialGroupId[credType], proof);
        sbt.mint(msg.sender, uint8(credType), attester);
        attesterRegistry.incrementIssued(attester);
        unchecked {
            ++totalProofsVerified;
        }

        emit CredentialRenewed(
            msg.sender,
            credType,
            sbt.credentialExpiresAt(msg.sender, uint8(credType)),
            attester
        );
    }

    function hasCredential(address user, CredentialType credType) external view returns (bool) {
        return sbt.hasCredential(user, uint8(credType));
    }

    function getGroupId(CredentialType credType) external view returns (uint256) {
        return credentialGroupId[credType];
    }

    function _ensureValidCredentialType(CredentialType credType) private pure {
        if (uint8(credType) >= NUM_CREDENTIAL_TYPES) revert InvalidCredentialType();
    }
}
