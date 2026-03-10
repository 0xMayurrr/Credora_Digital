// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./RoleManager.sol";

/**
 * @title CredentialRegistry
 * @dev Issues, verifies, and revokes credentials.
 *      Uses EIP-712 typed data signing so the ISSUER must sign each credential —
 *      the server wallet CANNOT issue on someone else's behalf.
 */
contract CredentialRegistry is EIP712 {
    RoleManager public roleManager;

    bytes32 public constant CREDENTIAL_TYPEHASH = keccak256(
        "Credential(address subject,string credentialType,string metadataURI,uint256 expirationDate)"
    );

    struct Credential {
        address issuer;
        address subject;
        string credentialType;
        string metadataURI;     // ipfs://CID of document metadata
        uint256 issuedAt;
        uint256 expirationDate; // 0 = no expiry
        bool revoked;
    }

    // credentialId => Credential
    mapping(bytes32 => Credential) public credentials;
    // subject => list of credentialIds
    mapping(address => bytes32[]) public credentialsBySubject;
    // issuer => list of credentialIds
    mapping(address => bytes32[]) public credentialsByIssuer;
    // Dev Rep Scores (kept here for backward compat with CredentialRegistry usage)
    mapping(address => uint256) public devRepScores;

    event CredentialIssued(
        bytes32 indexed credentialId,
        address indexed issuer,
        address indexed subject,
        string credentialType
    );
    event CredentialRevoked(bytes32 indexed credentialId, address indexed issuer);
    event IssuerAuthorized(address indexed issuer);
    event RepScoreUpdated(address indexed user, uint256 newScore);

    constructor(address _roleManager)
        EIP712("CredoraRegistry", "1")
    {
        roleManager = RoleManager(_roleManager);
    }

    modifier onlyAuthorizedIssuer() {
        require(
            roleManager.hasRole(roleManager.ISSUER_OFFICER_ROLE(), msg.sender),
            "CredentialRegistry: Must be ISSUER_OFFICER"
        );
        _;
    }

    /**
     * @dev Issue a credential with EIP-712 signature verification.
     *      The issuer must sign the credential data from their own wallet (MetaMask).
     *      The server cannot issue on behalf of anyone.
     *
     * @param subject          Wallet of the credential recipient
     * @param credentialType   e.g. "UniversityDegree", "BootcampCert"
     * @param metadataURI      IPFS URI of document metadata JSON
     * @param expirationDate   Unix timestamp, 0 = never expires
     * @param signature        EIP-712 signature from the issuer's wallet
     */
    function issueCredential(
        address subject,
        string calldata credentialType,
        string calldata metadataURI,
        uint256 expirationDate,
        bytes calldata signature
    ) external onlyAuthorizedIssuer returns (bytes32 credentialId) {
        // Verify the issuer actually signed this data from their own MetaMask
        require(
            _verifyIssuerSignature(subject, credentialType, metadataURI, expirationDate, signature),
            "CredentialRegistry: Invalid issuer signature"
        );

        // Unique ID from all credential fields
        credentialId = keccak256(
            abi.encodePacked(msg.sender, subject, credentialType, metadataURI, block.timestamp)
        );
        require(credentials[credentialId].issuedAt == 0, "CredentialRegistry: Already exists");

        credentials[credentialId] = Credential({
            issuer: msg.sender,
            subject: subject,
            credentialType: credentialType,
            metadataURI: metadataURI,
            issuedAt: block.timestamp,
            expirationDate: expirationDate,
            revoked: false
        });

        credentialsBySubject[subject].push(credentialId);
        credentialsByIssuer[msg.sender].push(credentialId);

        emit CredentialIssued(credentialId, msg.sender, subject, credentialType);
    }

    /**
     * @dev Revoke a credential. Only the original issuer can revoke.
     */
    function revokeCredential(bytes32 credentialId) external {
        Credential storage cred = credentials[credentialId];
        require(cred.issuedAt != 0, "CredentialRegistry: Does not exist");
        require(cred.issuer == msg.sender, "CredentialRegistry: Only issuer can revoke");
        require(!cred.revoked, "CredentialRegistry: Already revoked");
        cred.revoked = true;
        emit CredentialRevoked(credentialId, msg.sender);
    }

    /**
     * @dev Verify a credential directly on-chain.
     */
    function verifyCredential(bytes32 credentialId) external view returns (
        bool isValid,
        bool isExpired,
        bool isRevoked,
        address issuer,
        address subject,
        string memory credentialType,
        uint256 issuedAt
    ) {
        Credential memory cred = credentials[credentialId];
        bool expired = cred.expirationDate != 0 && block.timestamp > cred.expirationDate;
        return (
            cred.issuedAt != 0 && !cred.revoked && !expired,
            expired,
            cred.revoked,
            cred.issuer,
            cred.subject,
            cred.credentialType,
            cred.issuedAt
        );
    }

    /**
     * @dev Get all credential IDs for a given subject (wallet).
     */
    function getCredentialsBySubject(address subject) external view returns (bytes32[] memory) {
        return credentialsBySubject[subject];
    }

    /**
     * @dev Get a single credential struct.
     */
    function getCredential(bytes32 credentialId) external view returns (Credential memory) {
        return credentials[credentialId];
    }

    /**
     * @dev Legacy: check if issuer is authorized by checking if they have ISSUER_OFFICER_ROLE.
     */
    function checkIssuer(address issuer) external view returns (bool) {
        return roleManager.hasRole(roleManager.ISSUER_OFFICER_ROLE(), issuer);
    }

    /**
     * @dev Update Dev Rep Score — called by server wallet after computing score from GitHub.
     */
    function updateRepScore(address user, uint256 repos, uint256 badges, uint256 multiplier)
        external
    {
        require(
            roleManager.hasRole(roleManager.ISSUER_OFFICER_ROLE(), msg.sender) ||
            roleManager.hasRole(roleManager.ADMIN_ROLE(), msg.sender),
            "CredentialRegistry: Not authorized to update rep score"
        );
        uint256 score = (repos + badges) * multiplier;
        devRepScores[user] = score;
        emit RepScoreUpdated(user, score);
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _verifyIssuerSignature(
        address subject,
        string calldata credentialType,
        string calldata metadataURI,
        uint256 expirationDate,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes32 structHash = keccak256(abi.encode(
            CREDENTIAL_TYPEHASH,
            subject,
            keccak256(bytes(credentialType)),
            keccak256(bytes(metadataURI)),
            expirationDate
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        return recovered == msg.sender;
    }
}
