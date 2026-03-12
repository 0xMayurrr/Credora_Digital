const express = require('express');
const router = express.Router();
const AIFraudDetectionService = require('../services/aiService');
const FraudLog = require('../models/FraudLog');
const { protect } = require('../middleware/auth');

// ── POST /api/ai/analyze ───────────────────────────────────
// Analyze a single credential for fraud BEFORE issuing
// Called by credential issuance flow or directly by officers
router.post('/analyze', protect, async (req, res) => {
  try {
    const credentialData = req.body;

    if (!credentialData.issuerName && !credentialData.organizationName && !credentialData.issuerOrg) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: issuerName (or organizationName or issuerOrg)'
      });
    }

    // Run AI analysis
    const analysis = await AIFraudDetectionService.analyzeCredential(credentialData);

    // Log to MongoDB for tracking + surge detection
    try {
      await FraudLog.create({
        credentialId:    credentialData.credentialId || null,
        credentialHash:  credentialData.credentialHash || null,
        issuerName:      credentialData.issuerName || credentialData.organizationName || credentialData.issuerOrg,
        credentialType:  credentialData.credentialType || credentialData.category || null,
        recipientWallet: credentialData.recipientWallet || null,
        fraudScore:      analysis.fraudScore,
        riskLevel:       analysis.riskLevel,
        recommendation:  analysis.recommendation,
        action:          analysis.action,
        signals:         analysis.signals,
        modelVersion:    analysis.modelVersion,
      });
    } catch (logErr) {
      console.warn('FraudLog save warning:', logErr.message);
      // Don't fail the request if logging fails
    }

    // If CRITICAL risk, block immediately
    if (analysis.riskLevel === 'CRITICAL') {
      return res.status(403).json({
        success: false,
        blocked: true,
        analysis,
        message: 'Credential blocked by AI fraud detection — CRITICAL risk level',
      });
    }

    res.json({
      success: true,
      blocked: false,
      analysis,
    });
  } catch (err) {
    console.error('AI analysis error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/ai/analyze/batch ─────────────────────────────
// Analyze multiple credentials at once
router.post('/analyze/batch', protect, async (req, res) => {
  try {
    const { credentials } = req.body;
    if (!Array.isArray(credentials) || credentials.length === 0) {
      return res.status(400).json({ success: false, error: 'credentials array is required' });
    }

    if (credentials.length > 100) {
      return res.status(400).json({ success: false, error: 'Maximum 100 credentials per batch' });
    }

    const result = await AIFraudDetectionService.analyzeBatch(credentials);

    // Log all results
    try {
      const logEntries = result.results.map(r => ({
        credentialId:   r.credentialId,
        issuerName:     credentials.find(c => c.credentialId === r.credentialId)?.issuerName || 'batch',
        credentialType: credentials.find(c => c.credentialId === r.credentialId)?.credentialType || 'unknown',
        fraudScore:     r.analysis.fraudScore,
        riskLevel:      r.analysis.riskLevel,
        recommendation: r.analysis.recommendation,
        action:         r.analysis.action,
        signals:        r.analysis.signals,
      }));
      await FraudLog.insertMany(logEntries, { ordered: false });
    } catch (logErr) {
      console.warn('Batch FraudLog save warning:', logErr.message);
    }

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/ai/stats ──────────────────────────────────────
// Fraud detection dashboard stats
router.get('/stats', protect, async (req, res) => {
  try {
    const stats = await AIFraudDetectionService.getFraudStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/ai/logs ───────────────────────────────────────
// Recent fraud analysis logs (for admin dashboard)
router.get('/logs', protect, async (req, res) => {
  try {
    const { limit = 20, riskLevel, recommendation, issuerName } = req.query;
    const filter = {};
    if (riskLevel) filter.riskLevel = riskLevel;
    if (recommendation) filter.recommendation = recommendation;
    if (issuerName) filter.issuerName = { $regex: issuerName, $options: 'i' };

    const logs = await FraudLog.find(filter)
      .sort({ analyzedAt: -1 })
      .limit(Math.min(parseInt(limit), 100))
      .select('-__v');

    const total = await FraudLog.countDocuments(filter);

    res.json({ success: true, logs, showing: logs.length, total });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/ai/report ─────────────────────────────────────
// Generate a fraud report for a date range
router.get('/report', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate query params required (YYYY-MM-DD)'
      });
    }

    const report = await AIFraudDetectionService.generateFraudReport(startDate, endDate);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/ai/systemic/:orgId ────────────────────────────
// Detect systemic fraud patterns for a specific org
router.get('/systemic/:orgId', protect, async (req, res) => {
  try {
    const { orgId } = req.params;
    const { days = 30 } = req.query;
    const report = await AIFraudDetectionService.detectSystemicFraud(orgId, parseInt(days));
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/ai/logs/:id/override ───────────────────────
// Human officer overrides AI decision
router.patch('/logs/:id/override', protect, async (req, res) => {
  try {
    const { reason, decision } = req.body;

    if (!reason || !decision) {
      return res.status(400).json({
        success: false,
        error: 'reason and decision are required'
      });
    }

    if (!['APPROVE', 'REVIEW', 'REJECT'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'decision must be APPROVE, REVIEW, or REJECT'
      });
    }

    const log = await FraudLog.findByIdAndUpdate(
      req.params.id,
      {
        humanOverride: true,
        humanOverrideReason: reason,
        recommendation: decision,
        overriddenBy: req.user?.walletAddress || req.user?.name || 'unknown',
      },
      { new: true }
    );

    if (!log) return res.status(404).json({ success: false, error: 'Log not found' });
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
