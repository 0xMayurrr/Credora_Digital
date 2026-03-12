const chaincodeService = require('../services/chaincodeService');
const Credential = require('../models/Credential');

// @desc    Update and retrieve Dev Rep Score (Fabric-based)
// @route   POST /devrep/update
// @access  Private
exports.updateDevRepScore = async (req, res, next) => {
    try {
        const { githubRepos } = req.body;
        const userWallet = req.user.walletAddress.toLowerCase();

        // Count user badges/credentials
        const badgesCount = await Credential.countDocuments({
            recipientWallet: userWallet,
            revoked: false
        });

        const reposCount = parseInt(githubRepos) || 0;
        const multiplier = 10;
        const calculatedScore = (reposCount + badgesCount) * multiplier;

        // Store in MongoDB (Fabric chaincode can also store if needed)
        // For now, we'll just calculate and return
        // In production, you could call chaincodeService to store on Fabric

        res.status(200).json({
            success: true,
            message: 'Dev Rep Score calculated successfully',
            score: calculatedScore,
            details: {
                repos: reposCount,
                badges: badgesCount,
                multiplier: multiplier
            }
        });

    } catch (error) {
        console.error('Update Dev Rep Score Error:', error);
        next(error);
    }
};

// @desc    Get Dev Rep Score
// @route   GET /devrep/:walletAddress
// @access  Public
exports.getDevRepScore = async (req, res, next) => {
    try {
        const walletAddress = req.params.walletAddress.toLowerCase();
        
        // Calculate from MongoDB credentials
        const badgesCount = await Credential.countDocuments({
            recipientWallet: walletAddress,
            revoked: false
        });

        // Default repos to 0 if not stored
        const score = badgesCount * 10;

        res.status(200).json({
            success: true,
            score: score,
            badges: badgesCount
        });

    } catch (error) {
        console.error('Get Dev Rep Score Error:', error);
        next(error);
    }
};
