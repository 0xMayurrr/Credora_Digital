const mongoose = require('mongoose');

const CertificateLifecycleSchema = new mongoose.Schema({
    docHash: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    state: {
        type: String,
        enum: ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'SIGNED', 'ISSUED', 'REVOKED'],
        default: 'DRAFT'
    },
    issuedToWallet: {
        type: String,
        required: true
    },
    createdByWallet: {
        type: String,
        required: true
    },
    requiredApprovals: {
        type: Number,
        default: 1
    },
    designatedApprovers: [{
        type: String
    }],
    approvers: [{
        type: String
    }],
    stateTimestamps: [{
        state: String,
        timestamp: Date,
        changedBy: String
    }],
    metadataURI: {
        type: String
    },
    ipfsCID: {
        type: String
    },
    isRevoked: {
        type: Boolean,
        default: false
    },
    revocationReason: String
}, { timestamps: true });

module.exports = mongoose.model('CertificateLifecycle', CertificateLifecycleSchema);
