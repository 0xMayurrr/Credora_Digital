const crypto = require('crypto');
const CertificateLifecycle = require('../models/CertificateLifecycle');
const ipfsService = require('../services/ipfsService');

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

        res.status(201).json({ success: true, data: cert });
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
