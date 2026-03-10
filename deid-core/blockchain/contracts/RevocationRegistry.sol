// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";

/**
 * @title RevocationRegistry
 * @dev Manages revocation of certificates by ADMINs
 */
contract RevocationRegistry {
    RoleManager public roleManager;

    mapping(bytes32 => bool) public revokedCertificates;
    mapping(bytes32 => string) public revocationReason;
    mapping(bytes32 => uint256) public revocationTimestamp;

    event CertificateRevoked(bytes32 indexed docHash, string reason, uint256 timestamp);

    constructor(address _roleManager) {
        roleManager = RoleManager(_roleManager);
    }

    modifier onlyAdmin() {
        require(roleManager.hasRole(msg.sender, RoleManager.Role.ADMIN), "RevocationRegistry: Must be ADMIN");
        _;
    }

    /**
     * @dev Revoke a certificate, marking it invalid and storing the reason
     * @param docHash The IPFS hash of the document
     * @param reason The reason for revocation
     */
    function revokeCertificate(bytes32 docHash, string memory reason) external onlyAdmin {
        revokedCertificates[docHash] = true;
        revocationReason[docHash] = reason;
        revocationTimestamp[docHash] = block.timestamp;
        
        emit CertificateRevoked(docHash, reason, block.timestamp);
    }

    /**
     * @dev Checks if a certificate is revoked
     * @param docHash The hash of the certificate
     * @return true if revoked, false otherwise
     */
    function isRevoked(bytes32 docHash) external view returns (bool) {
        return revokedCertificates[docHash];
    }
}
