// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RoleManager
 * @dev Manages Role-Based Access Control for Credora using OpenZeppelin AccessControl.
 *      This is the source-of-truth for all roles — never the database.
 */
contract RoleManager is AccessControl {
    bytes32 public constant ADMIN_ROLE           = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_OFFICER_ROLE  = keccak256("ISSUER_OFFICER_ROLE");
    bytes32 public constant APPROVER_ROLE        = keccak256("APPROVER_ROLE");
    bytes32 public constant CITIZEN_ROLE         = keccak256("CITIZEN_ROLE");

    // Enum for easy integer comparison (used by frontend hooks + upgrade script)
    enum Role { CITIZEN, ISSUER_OFFICER, APPROVER, ADMIN }

    event RoleAssigned(address indexed user, bytes32 role, address indexed assignedBy);

    constructor() {
        // Deployer gets the top-level admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Assign a role using enum index. Only ADMIN can call this.
     *      0 = CITIZEN, 1 = ISSUER_OFFICER, 2 = APPROVER, 3 = ADMIN
     */
    function assignRole(address user, Role newRole) external onlyRole(ADMIN_ROLE) {
        // Revoke all existing roles first
        _revokeRole(CITIZEN_ROLE, user);
        _revokeRole(ISSUER_OFFICER_ROLE, user);
        _revokeRole(APPROVER_ROLE, user);
        _revokeRole(ADMIN_ROLE, user);

        if (newRole == Role.CITIZEN)          _grantRole(CITIZEN_ROLE, user);
        else if (newRole == Role.ISSUER_OFFICER) _grantRole(ISSUER_OFFICER_ROLE, user);
        else if (newRole == Role.APPROVER)    _grantRole(APPROVER_ROLE, user);
        else if (newRole == Role.ADMIN)       { _grantRole(ADMIN_ROLE, user); _grantRole(DEFAULT_ADMIN_ROLE, user); }

        emit RoleAssigned(user, _roleToBytes32(newRole), msg.sender);
    }

    /**
     * @dev Get role as integer enum. Used by frontend useRole hook.
     */
    function getRole(address user) external view returns (Role) {
        if (hasRole(ADMIN_ROLE, user))           return Role.ADMIN;
        if (hasRole(APPROVER_ROLE, user))        return Role.APPROVER;
        if (hasRole(ISSUER_OFFICER_ROLE, user))  return Role.ISSUER_OFFICER;
        return Role.CITIZEN;
    }

    /**
     * @dev Utility: check if an address has a specific bytes32 role.
     *      Directly wraps AccessControl hasRole.
     */
    function checkRole(address user, bytes32 role) external view returns (bool) {
        return hasRole(role, user);
    }

    function _roleToBytes32(Role r) internal pure returns (bytes32) {
        if (r == Role.ADMIN)           return keccak256("ADMIN_ROLE");
        if (r == Role.APPROVER)        return keccak256("APPROVER_ROLE");
        if (r == Role.ISSUER_OFFICER)  return keccak256("ISSUER_OFFICER_ROLE");
        return keccak256("CITIZEN_ROLE");
    }
}
