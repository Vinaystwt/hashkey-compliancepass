// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./AIRiskOracle.sol";
import "./ComplianceTier.sol";
import "./RevocationRegistry.sol";
import "./interfaces/IComplianceSBT.sol";

contract ComplianceSBT is ERC721, Ownable, IComplianceSBT {
    using ComplianceTier for uint8;

    uint8 public constant NUM_CREDENTIAL_TYPES = 5;

    event Locked(uint256 indexed tokenId);
    event CredentialAdded(address indexed holder, uint8 indexed credTypeBit, uint256 indexed tokenId, address attester);
    event ExpiryConfigSet(uint8 indexed credTypeBit, uint64 durationSeconds);

    error SoulboundNonTransferable();
    error NotMinter();
    error InvalidCredentialType();

    uint256 private _tokenIdCounter;
    address public minter;
    address public revocationRegistry;
    address public riskOracle;

    mapping(uint256 => CredentialData) private _credentialData;
    mapping(address => uint256) private _addressToTokenId;
    mapping(uint8 => uint256) private _credentialTypeCount;
    uint256 private _totalMinted;

    mapping(uint256 => mapping(uint8 => uint64)) private _credentialExpiries;
    mapping(uint256 => mapping(uint8 => address)) private _credentialAttesters;
    mapping(uint8 => uint64) public credentialTypeDuration;

    constructor(address _revocationRegistry, address _riskOracle) ERC721("HashKey CompliancePass", "HKCP") Ownable(msg.sender) {
        revocationRegistry = _revocationRegistry;
        riskOracle = _riskOracle;

        credentialTypeDuration[0] = 730 days;
        credentialTypeDuration[1] = 365 days;
        credentialTypeDuration[2] = 365 days;
        credentialTypeDuration[3] = 730 days;
        credentialTypeDuration[4] = 365 days;
    }

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function setExpiryConfig(uint8 credTypeBit, uint64 durationSeconds) external onlyOwner {
        if (credTypeBit >= NUM_CREDENTIAL_TYPES) revert InvalidCredentialType();
        credentialTypeDuration[credTypeBit] = durationSeconds;
        emit ExpiryConfigSet(credTypeBit, durationSeconds);
    }

    function mint(address to, uint8 credTypeBit, address attester) external returns (uint256 tokenId) {
        if (msg.sender != minter) revert NotMinter();
        if (credTypeBit >= NUM_CREDENTIAL_TYPES) revert InvalidCredentialType();

        tokenId = _addressToTokenId[to];
        uint8 bit = uint8(1 << credTypeBit);
        uint64 expiry = uint64(block.timestamp + credentialTypeDuration[credTypeBit]);

        if (tokenId == 0) {
            unchecked {
                ++_tokenIdCounter;
            }
            tokenId = _tokenIdCounter;
            _mint(to, tokenId);
            _addressToTokenId[to] = tokenId;
            _credentialData[tokenId].issuedAt = uint64(block.timestamp);
            unchecked {
                ++_totalMinted;
            }
            emit Locked(tokenId);
        }

        if ((_credentialData[tokenId].bitmask & bit) == 0) {
            _credentialData[tokenId].bitmask |= bit;
            unchecked {
                ++_credentialTypeCount[credTypeBit];
            }
        }

        _credentialExpiries[tokenId][credTypeBit] = expiry;
        _credentialAttesters[tokenId][credTypeBit] = attester;
        _credentialData[tokenId].expiresAt = _getEarliestActiveExpiry(tokenId);

        emit CredentialAdded(to, credTypeBit, tokenId, attester);
    }

    function hasCredential(address user, uint8 credTypeBit) public view returns (bool) {
        uint256 tokenId = _addressToTokenId[user];
        if (tokenId == 0 || credTypeBit >= NUM_CREDENTIAL_TYPES) {
            return false;
        }

        uint8 bit = uint8(1 << credTypeBit);
        if ((_credentialData[tokenId].bitmask & bit) == 0) {
            return false;
        }

        uint64 expiry = _credentialExpiries[tokenId][credTypeBit];
        if (expiry != 0 && block.timestamp > expiry) {
            return false;
        }

        return !RevocationRegistry(revocationRegistry).revoked(user, credTypeBit);
    }

    function hasCredentialNotRevoked(address user, uint8 credTypeBit) external view returns (bool) {
        return hasCredential(user, credTypeBit);
    }

    function riskScore(address user) external view returns (uint8) {
        return AIRiskOracle(riskOracle).getRiskScore(user);
    }

    function getTier(address user) public view returns (uint8) {
        return activeBitmaskOf(user).computeTier();
    }

    function credentialExpiresAt(address user, uint8 credTypeBit) external view returns (uint64) {
        uint256 tokenId = _addressToTokenId[user];
        if (tokenId == 0) {
            return 0;
        }
        return _credentialExpiries[tokenId][credTypeBit];
    }

    function credentialAttester(address user, uint8 credTypeBit) external view returns (address) {
        uint256 tokenId = _addressToTokenId[user];
        if (tokenId == 0) {
            return address(0);
        }
        return _credentialAttesters[tokenId][credTypeBit];
    }

    function bitmaskOf(address user) public view returns (uint8) {
        uint256 tokenId = _addressToTokenId[user];
        if (tokenId == 0) {
            return 0;
        }
        return _credentialData[tokenId].bitmask;
    }

    function activeBitmaskOf(address user) public view returns (uint8 activeBitmask) {
        uint256 tokenId = _addressToTokenId[user];
        if (tokenId == 0) {
            return 0;
        }

        uint8 storedBitmask = _credentialData[tokenId].bitmask;
        for (uint8 i = 0; i < NUM_CREDENTIAL_TYPES; i++) {
            uint8 bit = uint8(1 << i);
            if ((storedBitmask & bit) != 0 && hasCredential(user, i)) {
                activeBitmask |= bit;
            }
        }
    }

    function credentialData(uint256 tokenId) external view returns (CredentialData memory) {
        return _credentialData[tokenId];
    }

    function addressToTokenId(address user) external view returns (uint256) {
        return _addressToTokenId[user];
    }

    function credentialTypeCount(uint8 bit) external view returns (uint256) {
        return _credentialTypeCount[bit];
    }

    function totalMinted() external view returns (uint256) {
        return _totalMinted;
    }

    function locked(uint256) external pure returns (bool) {
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721) returns (bool) {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }

    function approve(address, uint256) public pure override {
        revert SoulboundNonTransferable();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundNonTransferable();
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert SoulboundNonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    function _getEarliestActiveExpiry(uint256 tokenId) private view returns (uint64 earliest) {
        earliest = type(uint64).max;
        uint8 storedBitmask = _credentialData[tokenId].bitmask;

        for (uint8 i = 0; i < NUM_CREDENTIAL_TYPES; i++) {
            uint8 bit = uint8(1 << i);
            if ((storedBitmask & bit) == 0) {
                continue;
            }

            uint64 expiry = _credentialExpiries[tokenId][i];
            if (expiry == 0 || block.timestamp > expiry) {
                continue;
            }

            if (RevocationRegistry(revocationRegistry).revoked(ownerOf(tokenId), i)) {
                continue;
            }

            if (expiry < earliest) {
                earliest = expiry;
            }
        }

        if (earliest == type(uint64).max) {
            return 0;
        }
    }
}
