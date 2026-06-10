// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RoleManager} from "../access/RoleManager.sol";
import {ProductBatch} from "../products/ProductBatch.sol";

/**
 * @title ColdChainMonitor
 * @dev Records integrity hashes after each monitoring log.
 *      Full logs (temperature, location, seal) live in MongoDB.
 *      Blockchain stores the latest integrity hash per product,
 *      creating a tamper-evident audit trail.
 */
contract ColdChainMonitor {

    // ── State ──────────────────────────────────────────────────────────────

    RoleManager  public roleManager;
    ProductBatch public productBatch;

    // productHash → latest integrity hash (SHA256 of all MongoDB logs)
    mapping(bytes32 => bytes32) public latestIntegrityHash;

    // productHash → number of condition logs recorded
    mapping(bytes32 => uint256) public logCount;

    // ── Events ─────────────────────────────────────────────────────────────

    event ConditionLogged(
        bytes32 indexed productHash,
        bytes32         integrityHash,
        address indexed loggedBy,
        uint256         timestamp
    );

    // ── Modifiers ──────────────────────────────────────────────────────────

    /// @dev Any registered stakeholder OR the RoleManager admin can log conditions
    modifier onlyStakeholderOrAdmin() {
        require(
            roleManager.getRole(msg.sender) != RoleManager.Role.NONE ||
            msg.sender == roleManager.admin(),
            "Not authorized to record conditions"
        );
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────

    constructor(address _roleManager, address _productBatch) {
        roleManager  = RoleManager(_roleManager);
        productBatch = ProductBatch(_productBatch);
    }

    // ── Functions ──────────────────────────────────────────────────────────

    /**
     * @notice Record a new integrity hash after a monitoring log is saved.
     * @param _productHash    The product's blockchain hash
     * @param _integrityHash  SHA256 of all cumulative MongoDB logs for this product
     */
    function recordCondition(
        bytes32 _productHash,
        bytes32 _integrityHash
    ) external onlyStakeholderOrAdmin {
        require(_productHash != bytes32(0), "Invalid product hash");
        require(_integrityHash != bytes32(0), "Invalid integrity hash");

        latestIntegrityHash[_productHash] = _integrityHash;
        logCount[_productHash]++;

        emit ConditionLogged(
            _productHash,
            _integrityHash,
            msg.sender,
            block.timestamp
        );
    }

    /// @notice Get the latest integrity hash for a product
    function getLatestHash(bytes32 _productHash)
        external
        view
        returns (bytes32)
    {
        return latestIntegrityHash[_productHash];
    }

    /// @notice Get the number of logs recorded for a product
    function getLogCount(bytes32 _productHash)
        external
        view
        returns (uint256)
    {
        return logCount[_productHash];
    }
}
