const crypto = require('crypto');
const Credential = require('../models/Credential');
const User = require('../models/User');
const Issuer = require('../models/Issuer');
const ipfsService = require('../services/ipfsService');
const chaincodeService = require('../services/chaincodeService');
const aiService = require('../services/aiService');
const oracleService = require('../services/oracleService');

// @desc    Issue a new credential
// @route   POST /credentials/issue
// @access  Private (Issuer Only)
exports.issueCredential = async (req, res, next) => {
    try {
        const { title, description, category, expiryDate } = req.body;
        let recipientWallet = req.body.recipientWallet;

        if (!recipientWallet) {
            return res.status(400).json({ success: false, error: 'Recipient wallet or DID is required' });
        }

        // Normalize DID to wallet address if necessary
        if (recipientWallet.toLowerCase().startsWith('did:ethr:')) {
            const parts = recipientWallet.split(':');
            recipientWallet = parts[parts.length - 1]; // get the last part which is the hex address
        }

        // Validate wallet format
        if (!/^0x[a-fA-F0-9]{40}$/.test(recipientWallet)) {
            return res.status(400).json({ success: false, error: 'Invalid recipient wallet address format' });
        }

        // Verify role (Fabric specific)
        const callerRole = req.user.role || 'ISSUER_OFFICER';
        if (!['issuer', 'ISSUER_OFFICER', 'ADMIN', 'UNIVERSITY'].includes(callerRole)) {
            return res.status(403).json({ success: false, error: 'Only authorized issuers can issue credentials' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a document file' });
        }

        // 1. Upload to IPFS
        const ipfsCID = await ipfsService.uploadToIPFS(req.file.buffer, req.file.originalname, req.file.mimetype);
        const ipfsMetadataURI = `ipfs://${ipfsCID}`;

        // 2. Generate Hash & ZK Commitment Stub
        const hashContent = `${req.user.walletAddress}-${recipientWallet}-${ipfsCID}-${Date.now()}`;
        const credentialHash = '0x' + crypto.createHash('sha256').update(hashContent).digest('hex');

        // Poseidon-friendly hash for ZK system (Phase 5)
        const zkCommitment = '0x' + crypto.createHash('sha256').update(credentialHash + 'salt').digest('hex');

        // 3. Optional: find recipient user id if registered
        const recipientUser = await User.findOne({ walletAddress: recipientWallet.toLowerCase() });
        const recipientId = recipientUser ? recipientUser._id : null;

        // 4. Issue On-Chain (Fabric)
        let fabricRes;
        try {
            fabricRes = await chaincodeService.issueCredential(callerRole, {
                credentialId: credentialHash,
                subjectId: recipientWallet.toLowerCase(),
                credentialType: category || 'GeneralCredential',
                ipfsMetadataURI,
                expiryDate: expiryDate || ''
            }, zkCommitment);
        } catch (fabricErr) {
            console.error('Fabric Issuance Error:', fabricErr.message);
            return res.status(500).json({ success: false, error: `Fabric Error: ${fabricErr.message}` });
        }

        // 5. Save to MongoDB
        const credential = await Credential.create({
            issuerId: req.user._id,
            recipientWallet: recipientWallet.toLowerCase(),
            recipientId: recipientId,
            title,
            description,
            category: category || 'other',
            ipfsCID,
            credentialHash,
            blockchainTxHash: fabricRes.proof?.proofValue || 'FABRIC_TX',
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            zkCommitment
        });

        res.status(201).json({ success: true, data: credential, fabricProof: fabricRes.proof });
    } catch (error) {
        console.error('Issue Credential Error:', error);
        next(error);
    }
};

// @desc    Revoke a credential
// @route   PUT /credentials/revoke/:id
// @access  Private (Issuer Only)
exports.revokeCredential = async (req, res, next) => {
    try {
        const credential = await Credential.findById(req.params.id);

        if (!credential) {
            return res.status(404).json({ success: false, error: 'Credential not found' });
        }

        // Must be the issuer
        if (credential.issuerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized to revoke this credential' });
        }

        // Revoke On-Chain (Fabric)
        try {
            await chaincodeService.revokeCredential(
                req.user.role,
                credential.credentialHash,
                'Revoked by issuer via portal'
            );
        } catch (fabricErr) {
            return res.status(500).json({ success: false, error: `Fabric Error: ${fabricErr.message}` });
        }

        // Update DB
        credential.revoked = true;
        await credential.save();

        res.status(200).json({
            success: true,
            data: credential
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's credentials (recipient view)
// @route   GET /credentials
// @access  Private
exports.getMyCredentials = async (req, res, next) => {
    try {
        const credentials = await Credential.find({
            recipientWallet: req.user.walletAddress.toLowerCase(),
            revoked: false
        }).populate({
            path: 'issuerId',
            select: 'name organizationName walletAddress'
        });

        res.status(200).json({
            success: true,
            count: credentials.length,
            data: credentials
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get credentials issued by the user (issuer view)
// @route   GET /credentials/issued
// @access  Private (Issuer Only)
exports.getIssuedCredentials = async (req, res, next) => {
    try {
        if (req.user.role !== 'issuer') {
            return res.status(403).json({ success: false, error: 'Only issuers can view issued credentials' });
        }

        const credentials = await Credential.find({
            issuerId: req.user._id
        }).populate({
            path: 'recipientId',
            select: 'name email'
        }).sort('-issuedAt');

        res.status(200).json({
            success: true,
            count: credentials.length,
            data: credentials
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a single credential by ID
// @route   GET /credentials/:id
// @access  Private
exports.getCredentialById = async (req, res, next) => {
    try {
        const credential = await Credential.findById(req.params.id)
            .populate('issuerId', 'name organizationName walletAddress')
            .populate('recipientId', 'name email');

        if (!credential) {
            return res.status(404).json({ success: false, error: 'Credential not found' });
        }

        // Safeguard for deleted users (null references in DB)
        const issuerId = credential.issuerId ? (credential.issuerId._id || credential.issuerId).toString() : null;
        const recipientWallet = credential.recipientWallet ? credential.recipientWallet.toLowerCase() : null;
        const userWallet = req.user.walletAddress ? req.user.walletAddress.toLowerCase() : null;

        // Must be the issuer or the recipient to view this detailed data
        if (
            issuerId !== req.user._id.toString() &&
            recipientWallet !== userWallet
        ) {
            return res.status(403).json({ success: false, error: 'Not authorized to access this credential' });
        }

        res.status(200).json({
            success: true,
            data: credential
        });
    } catch (error) {
        next(error);
    }
};
