// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AttesterRegistry is Ownable {
    uint256 public constant MINIMUM_STAKE = 0.01 ether;

    error StakeTooLow();
    error AlreadyRegistered();
    error NotCompliancePass();

    mapping(address => bool) public isApproved;
    mapping(address => uint256) public stake;
    mapping(address => uint256) public credentialsIssued;
    mapping(address => string) public attesterName;

    address public compliancePass;

    event AttesterRegistered(address indexed attester, string name, uint256 stakeAmount);
    event AttesterApproved(address indexed attester);
    event CompliancePassSet(address indexed compliancePass);
    event CredentialsIssuedIncremented(address indexed attester, uint256 totalIssued);

    constructor() Ownable(msg.sender) {}

    function register(string calldata name) external payable {
        if (bytes(attesterName[msg.sender]).length != 0) revert AlreadyRegistered();
        if (msg.value < MINIMUM_STAKE) revert StakeTooLow();

        stake[msg.sender] = msg.value;
        attesterName[msg.sender] = name;

        emit AttesterRegistered(msg.sender, name, msg.value);
    }

    function approveAttester(address attester) external onlyOwner {
        isApproved[attester] = true;
        emit AttesterApproved(attester);
    }

    function setCompliancePass(address _compliancePass) external onlyOwner {
        compliancePass = _compliancePass;
        emit CompliancePassSet(_compliancePass);
    }

    function incrementIssued(address attester) external {
        if (msg.sender != compliancePass) revert NotCompliancePass();
        unchecked {
            ++credentialsIssued[attester];
        }
        emit CredentialsIssuedIncremented(attester, credentialsIssued[attester]);
    }

    function getAttesterInfo(
        address attester
    ) external view returns (bool approved, uint256 staked, uint256 issued, string memory name) {
        return (isApproved[attester], stake[attester], credentialsIssued[attester], attesterName[attester]);
    }
}
