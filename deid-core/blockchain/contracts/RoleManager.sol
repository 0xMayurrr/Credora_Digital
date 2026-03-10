// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RoleManager
 * @dev Manages the Role-Based Access Control System for Credora
 */
contract RoleManager {
    enum Role { CITIZEN, ISSUER_OFFICER, APPROVER, ADMIN }
    
    mapping(address => Role) public roles;

    event RoleAssigned(address indexed user, Role newRole, address indexed assignedBy);

    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "RoleManager: Unauthorized access");
        _;
    }

    constructor() {
        roles[msg.sender] = Role.ADMIN;
        emit RoleAssigned(msg.sender, Role.ADMIN, msg.sender);
    }

    /**
     * @dev Only ADMIN can assign roles to different addresses
     * @param user The address to assign the role to
     * @param newRole The role to assign
     */
    function assignRole(address user, Role newRole) external onlyRole(Role.ADMIN) {
        roles[user] = newRole;
        emit RoleAssigned(user, newRole, msg.sender);
    }
    
    /**
     * @dev Utility to check role externally
     * @param user The address to check
     * @param _role The role to verify
     */
    function hasRole(address user, Role _role) external view returns (bool) {
        return roles[user] == _role;
    }
}
