// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "./RoleManager.sol";
import "./RevocationRegistry.sol";

/**
 * @title CertificateLifecycle
 * @dev Tracks the entire lifecycle of a certificate, including multisig approvals
 */
contract CertificateLifecycle is Pausable {
    enum DocState { DRAFT, UNDER_REVIEW, APPROVED, SIGNED, ISSUED, REVOKED }

    struct Certificate {
        bytes32 docHash;          // IPFS hash of document
        DocState state;           // current state
        address issuedTo;         // citizen's wallet / DID
        address createdBy;        // officer who drafted
        address[] approvers;      // all who approved
        uint256[] stateTimestamps; // timestamp of every state change
        string metadataURI;       // IPFS URI of full document metadata
        bool isRevoked;
    }

    struct ApprovalConfig {
        uint256 requiredApprovals;    // e.g., 2 out of 3 must approve
        address[] designatedApprovers;
        uint256 approvalCount;
    }

    RoleManager public roleManager;
    RevocationRegistry public revocationRegistry;

    mapping(bytes32 => Certificate) public certificates;
    mapping(bytes32 => ApprovalConfig) public certificateApprovals;
    
    // Mapping to track if an address has approved a specific docHash
    mapping(bytes32 => mapping(address => bool)) public hasApproved;

    event CertificateStateChanged(bytes32 indexed docHash, DocState newState, address changedBy, uint256 timestamp);

    constructor(address _roleManager, address _revocationRegistry) {
        roleManager = RoleManager(_roleManager);
        revocationRegistry = RevocationRegistry(_revocationRegistry);
    }

    modifier onlyOfficer() {
        require(
            roleManager.hasRole(roleManager.ISSUER_OFFICER_ROLE(), msg.sender),
            "CertificateLifecycle: Must be ISSUER_OFFICER"
        );
        _;
    }

    modifier onlyApprover() {
        require(
            roleManager.hasRole(roleManager.APPROVER_ROLE(), msg.sender),
            "CertificateLifecycle: Must be APPROVER"
        );
        _;
    }

    modifier checkRevocation(bytes32 docHash) {
        if (revocationRegistry.isRevoked(docHash)) {
            Certificate storage cert = certificates[docHash];
            if (!cert.isRevoked) {
                cert.isRevoked = true;
                cert.state = DocState.REVOKED;
                cert.stateTimestamps.push(block.timestamp);
                emit CertificateStateChanged(docHash, DocState.REVOKED, msg.sender, block.timestamp);
            }
        }
        require(!certificates[docHash].isRevoked, "CertificateLifecycle: Certificate is revoked");
        _;
    }

    /**
     * @dev Create a new DRAFT certificate
     */
    function createDraft(
        bytes32 docHash,
        address issuedTo,
        string calldata metadataURI,
        uint256 requiredApprovals,
        address[] calldata designatedApprovers
    ) external onlyOfficer whenNotPaused {
        require(certificates[docHash].stateTimestamps.length == 0, "CertificateLifecycle: Certificate already exists");
        
        Certificate storage cert = certificates[docHash];
        cert.docHash = docHash;
        cert.state = DocState.DRAFT;
        cert.issuedTo = issuedTo;
        cert.createdBy = msg.sender;
        cert.metadataURI = metadataURI;
        cert.isRevoked = false;
        cert.stateTimestamps.push(block.timestamp);

        ApprovalConfig storage config = certificateApprovals[docHash];
        config.requiredApprovals = requiredApprovals;
        config.designatedApprovers = designatedApprovers;
        
        emit CertificateStateChanged(docHash, DocState.DRAFT, msg.sender, block.timestamp);
    }

    /**
     * @dev Submit DRAFT for review
     */
    function submitForReview(bytes32 docHash) external onlyOfficer whenNotPaused checkRevocation(docHash) {
        Certificate storage cert = certificates[docHash];
        require(cert.createdBy == msg.sender, "CertificateLifecycle: Only creator can submit");
        require(cert.state == DocState.DRAFT, "CertificateLifecycle: Must be in DRAFT state");
        
        cert.state = DocState.UNDER_REVIEW;
        cert.stateTimestamps.push(block.timestamp);

        emit CertificateStateChanged(docHash, DocState.UNDER_REVIEW, msg.sender, block.timestamp);
    }

    /**
     * @dev Approve a certificate
     */
    function approveCertificate(bytes32 docHash) external onlyApprover whenNotPaused checkRevocation(docHash) {
        Certificate storage cert = certificates[docHash];
        require(cert.state == DocState.UNDER_REVIEW, "CertificateLifecycle: Must be UNDER_REVIEW");
        
        ApprovalConfig storage config = certificateApprovals[docHash];
        
        bool isDesignated = false;
        for (uint i = 0; i < config.designatedApprovers.length; i++) {
            if (config.designatedApprovers[i] == msg.sender) {
                isDesignated = true;
                break;
            }
        }
        require(isDesignated, "CertificateLifecycle: Not a designated approver");
        require(!hasApproved[docHash][msg.sender], "CertificateLifecycle: Already approved");

        hasApproved[docHash][msg.sender] = true;
        config.approvalCount++;
        cert.approvers.push(msg.sender);

        if (config.approvalCount >= config.requiredApprovals) {
            cert.state = DocState.APPROVED;
            cert.stateTimestamps.push(block.timestamp);
            emit CertificateStateChanged(docHash, DocState.APPROVED, msg.sender, block.timestamp);
        }
    }

    /**
     * @dev Sign the approved certificate
     */
    function signCertificate(bytes32 docHash) external onlyApprover whenNotPaused checkRevocation(docHash) {
        Certificate storage cert = certificates[docHash];
        require(cert.state == DocState.APPROVED, "CertificateLifecycle: Must be APPROVED");
        
        cert.state = DocState.SIGNED;
        cert.stateTimestamps.push(block.timestamp);

        emit CertificateStateChanged(docHash, DocState.SIGNED, msg.sender, block.timestamp);
    }

    /**
     * @dev Issue the signed certificate
     */
    function issueCertificate(bytes32 docHash) external onlyOfficer whenNotPaused checkRevocation(docHash) {
        Certificate storage cert = certificates[docHash];
        require(cert.state == DocState.SIGNED, "CertificateLifecycle: Must be SIGNED");
        
        cert.state = DocState.ISSUED;
        cert.stateTimestamps.push(block.timestamp);

        emit CertificateStateChanged(docHash, DocState.ISSUED, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Manually Sync Revocation status from the external registry (since it can happen asynchronously)
     */
    function syncRevocation(bytes32 docHash) external {
        if (revocationRegistry.isRevoked(docHash)) {
            Certificate storage cert = certificates[docHash];
            require(cert.stateTimestamps.length > 0, "Lifecycle: Certificate does not exist");
            if (!cert.isRevoked) {
                cert.isRevoked = true;
                cert.state = DocState.REVOKED;
                cert.stateTimestamps.push(block.timestamp);
                emit CertificateStateChanged(docHash, DocState.REVOKED, msg.sender, block.timestamp);
            }
        }
    }

    /**
     * @dev Get certificate basic info
     */
    function getCertificate(bytes32 docHash) external view returns (Certificate memory) {
        return certificates[docHash];
    }
}
