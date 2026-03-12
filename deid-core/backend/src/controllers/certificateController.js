const crypto = require('crypto');
const CertificateLifecycle = require('../models/CertificateLifecycle');
const ipfsService = require('../services/ipfsService');
const chaincodeService = require('../services/chaincodeService');
const aiService = require('../services/aiService');
const oracleService = require('../services/oracleService');

exports.createDraft = async (req, res, next) => {
    try {
        const { title, description, issuedToWallet, requiredApprovals, designatedApprovers } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a document file' });
        }

        const ipfsCID = await ipfsService.uploadToIPFS(req.file.buffer, req.file.originalname, req.file.mimetype);
        const metadataURI = `ipfs://${ipfsCID}`;

        const docHashContent = `${req.user.walletAddress}-${issuedToWallet}-${ipfsCID}-${Date.now()}`;
        const docHash = '0x' + crypto.createHash('sha256').update(docHashContent).digest('hex');

        let approvers = [];
        try { approvers = JSON.parse(designatedApprovers); } catch (e) { }

        const cert = await CertificateLifecycle.create({
            docHash,
            title,
            description,
            state: 'DRAFT',
            issuedToWallet: issuedToWallet.toLowerCase(),
            createdByWallet: req.user.walletAddress.toLowerCase(),
            requiredApprovals: Number(requiredApprovals) || 1,
            designatedApprovers: approvers.map(a => a.toLowerCase()),
            metadataURI,
            ipfsCID,
            stateTimestamps: [{
                state: 'DRAFT',
                timestamp: new Date(),
                changedBy: req.user.walletAddress.toLowerCase()
            }]
        });

        // ── 1. AI Fraud Analysis (New Requirement) ───────────────────────────
        const fraudAnalysis = await aiService.analyzeCredential({
            issuerOrg: req.user.role === 'ISSUER_OFFICER' ? 'GovernmentMSP' : 'UniversityMSP',
            certType: title.toUpperCase().includes('DEGREE') ? 'DEGREE' : 'BONAFIDE',
            recipientId: issuedToWallet,
            organizationName: req.user.organizationName || 'Credora Authorized Issuer'
        });

        // ── 2. Blockchain Write (Fabric Chaincode) ──────────────────────────
        // This makes the draft tamper-evident on the ledger
        try {
            await chaincodeService.createCertificateDraft(req.user.role, {
                certId: docHash,
                recipientId: issuedToWallet,
                certType: 'OFFICIAL_DOCUMENT',
                ipfsDocURI: metadataURI,
                metadata: {
                    title,
                    fraudRisk: fraudAnalysis.riskScore,
                    recommendation: fraudAnalysis.recommendation
                }
            });
        } catch (fabricErr) {
            console.error('Fabric Chaincode Error:', fabricErr.message);
            // In dev: continue. In production: we might rollback DB if blockchain fails
        }

        res.status(201).json({
            success: true,
            data: cert,
            fraudAnalysis: {
                riskScore: fraudAnalysis.riskScore,
                recommendation: fraudAnalysis.recommendation,
                flags: fraudAnalysis.flags
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getCertificates = async (req, res, next) => {
    try {
        const role = req.user.role;
        let query = {};

        if (role === 'user' || role === 'CITIZEN') {
            query.issuedToWallet = req.user.walletAddress.toLowerCase();
            query.state = 'ISSUED';
        } else if (role === 'issuer' || role === 'ISSUER_OFFICER') {
            query.createdByWallet = req.user.walletAddress.toLowerCase();
        } else if (role === 'APPROVER') {
            query.designatedApprovers = req.user.walletAddress.toLowerCase();
            query.state = { $in: ['UNDER_REVIEW', 'APPROVED'] };
        } else if (role === 'ADMIN') {
            // ADMIN sees all to monitor or revoke
        }

        const certs = await CertificateLifecycle.find(query).sort('-createdAt');
        res.status(200).json({ success: true, count: certs.length, data: certs });
    } catch (error) {
        next(error);
    }
};

exports.getCertificateById = async (req, res, next) => {
    try {
        const cert = await CertificateLifecycle.findOne({ docHash: req.params.hash });
        if (!cert) return res.status(404).json({ success: false, error: 'Not found' });
        res.status(200).json({ success: true, data: cert });
    } catch (error) {
        next(error);
    }
};

exports.updateState = async (req, res, next) => {
    try {
        const { newState } = req.body;
        const cert = await CertificateLifecycle.findOne({ docHash: req.params.hash });
        if (!cert) return res.status(404).json({ success: false, error: 'Not found' });

        const alreadyHas = cert.stateTimestamps.find(s => s.state === newState && s.changedBy.toLowerCase() === req.user.walletAddress.toLowerCase());

        if (!alreadyHas) {
            // ── 1. Blockchain State Transition ──────────────────────────────
            try {
                if (newState === 'UNDER_REVIEW') {
                    await chaincodeService.submitForReview(req.user.role, cert.docHash, 'Submitted via Portal');
                } else if (newState === 'APPROVED') {
                    await chaincodeService.approveCertificate(req.user.role, cert.docHash, 'Approved via Portal');
                } else if (newState === 'SIGNED') {
                    // In production: pass real cryptographic signature
                    await chaincodeService.signCertificate(req.user.role, cert.docHash, 'sig_' + cert.docHash, 'Signed via Portal');
                } else if (newState === 'ISSUED') {
                    await chaincodeService.issueCertificate(req.user.role, cert.docHash, 'Final Issuance');
                } else if (newState === 'REVOKED') {
                    await chaincodeService.revokeCertificateLC(req.user.role, cert.docHash, 'Administrative Revocation');
                }
            } catch (fabricErr) {
                return res.status(500).json({ success: false, error: `Fabric Error: ${fabricErr.message}` });
            }

            // ── 2. Update Local Cache (MongoDB) ─────────────────────────────
            cert.state = newState;
            cert.stateTimestamps.push({
                state: newState,
                timestamp: new Date(),
                changedBy: req.user.walletAddress.toLowerCase()
            });

            if (newState === 'APPROVED') {
                if (!cert.approvers.includes(req.user.walletAddress.toLowerCase())) {
                    cert.approvers.push(req.user.walletAddress.toLowerCase());
                }
            }

            await cert.save();
        }
        res.status(200).json({ success: true, data: cert });
    } catch (err) {
        next(err);
    }
};
