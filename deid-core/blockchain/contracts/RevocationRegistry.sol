// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoleManager.sol";

/**
 * @title RevocationRegistry
 * @dev On-chain revocation registry. Only ADMINs can revoke.
 *      Stores full reason + revoker + timestamp for audit trails.
 */
contract RevocationRegistry {
    RoleManager public roleManager;

    struct RevocationRecord {
        string reason;
        address revokedBy;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => RevocationRecord) public revocations;

    event CertificateRevoked(bytes32 indexed docHash, string reason, address indexed revokedBy, uint256 timestamp);

    constructor(address _roleManager) {
        roleManager = RoleManager(_roleManager);
    }

    modifier onlyAdmin() {
        require(
            roleManager.hasRole(roleManager.ADMIN_ROLE(), msg.sender),
            "RevocationRegistry: Must be ADMIN"
        );
        _;
    }

    /**
     * @dev Revoke a certificate by its docHash.
     * @param docHash  The document hash (bytes32 from keccak256 or sha256)
     * @param reason   Human-readable reason for revocation
     */
    function revoke(bytes32 docHash, string memory reason) external onlyAdmin {
        require(!revocations[docHash].exists, "RevocationRegistry: Already revoked");
        revocations[docHash] = RevocationRecord({
            reason: reason,
            revokedBy: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        emit CertificateRevoked(docHash, reason, msg.sender, block.timestamp);
    }

    /**
     * @dev Check if a credential is revoked.
     */
    function isRevoked(bytes32 docHash) external view returns (bool) {
        return revocations[docHash].exists;
    }

    /**
     * @dev Get full revocation details. Used by frontend useRevocation hook.
     */
    function getRevocationDetails(bytes32 docHash) external view returns (
        string memory reason,
        address revokedBy,
        uint256 timestamp
    ) {
        RevocationRecord memory r = revocations[docHash];
        require(r.exists, "RevocationRegistry: Not revoked");
        return (r.reason, r.revokedBy, r.timestamp);
    }
}
