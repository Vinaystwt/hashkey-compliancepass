// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AIRiskOracle is Ownable {
    error NotAuthorizedAgent();
    error InvalidRiskScore();

    mapping(address => uint8) private _riskScore;
    mapping(address => uint256) public lastUpdated;
    mapping(address => bool) public authorizedAgent;

    event RiskScoreUpdated(address indexed wallet, uint8 score, address indexed agent);
    event AgentAuthorizationUpdated(address indexed agent, bool authorized);

    constructor() Ownable(msg.sender) {}

    modifier onlyAgent() {
        if (!authorizedAgent[msg.sender]) revert NotAuthorizedAgent();
        _;
    }

    function updateRiskScore(address wallet, uint8 score) external onlyAgent {
        if (score > 100) revert InvalidRiskScore();
        _riskScore[wallet] = score;
        lastUpdated[wallet] = block.timestamp;
        emit RiskScoreUpdated(wallet, score, msg.sender);
    }

    function setAgent(address agent, bool authorized) external onlyOwner {
        authorizedAgent[agent] = authorized;
        emit AgentAuthorizationUpdated(agent, authorized);
    }

    function getRiskScore(address wallet) external view returns (uint8) {
        uint8 score = _riskScore[wallet];
        return lastUpdated[wallet] == 0 ? 50 : score;
    }
}
