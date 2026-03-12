const Credential = require('../models/Credential');
const User = require('../models/User');
const chaincodeService = require('../services/chaincodeService');

// @desc    Verify a credential by hash (Fabric-based)
// @route   GET /verify/:credentialHash
// @access  Public
exports.verifyCredentialObj = async (req, res, next) => {
    try {
        const { credentialHash } = req.params;

        // 1. Fetch from MongoDB first (faster)
        const credential = await Credential.findOne({ credentialHash })
            .populate('issuerId', 'name organizationName walletAddress')
            .populate('recipientId', 'name did');

        if (!credential) {
            return res.status(404).json({
                success: false,
                authenticity: 'INVALID',
                message: 'Credential not found'
            });
        }

        // 2. Verify on Fabric (optional - can be slow)
        let fabricVerification = null;
        try {
            fabricVerification = await chaincodeService.verifyCredential(credentialHash);
        } catch (fabricErr) {
            console.warn('Fabric verification failed:', fabricErr.message);
            // Continue with DB data if Fabric is unavailable
        }

        // Determine authenticity
        const isRevoked = credential.revoked || (fabricVerification && fabricVerification.isRevoked);
        const isExpired = credential.expiryDate && new Date(credential.expiryDate) < new Date();

        res.status(200).json({
            success: true,
            authenticity: isRevoked ? 'REVOKED' : (isExpired ? 'EXPIRED' : 'VALID'),
            credential: {
                hash: credential.credentialHash,
                title: credential.title,
                description: credential.description,
                category: credential.category,
                ipfsCID: credential.ipfsCID,
                issuedAt: credential.issuedAt,
                expiryDate: credential.expiryDate,
                revoked: isRevoked,
                issuer: credential.issuerId,
                recipient: {
                    wallet: credential.recipientWallet,
                    user: credential.recipientId
                }
            },
            fabricVerification: fabricVerification || { message: 'Fabric verification unavailable' }
        });

    } catch (error) {
        next(error);
    }
};
