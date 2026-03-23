const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

const listenToEvents = require('./listeners/contractEvents');

// Connect to database
connectDB();

const app = express();

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

// CORS — allowlist only (never wildcard in production)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, Postman in dev)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
}));

app.use(express.json());

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Auth routes: stricter — 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many auth requests. Try again in 15 minutes.' },
});

// General API: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please slow down.' },
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, require('./routes/authRoutes'));
app.use('/api/credentials',  apiLimiter,  require('./routes/credentialRoutes'));
app.use('/api/verify',       apiLimiter,  require('./routes/verifyRoutes'));
app.use('/api/shares',       apiLimiter,  require('./routes/shareRoutes'));
app.use('/api/devrep',       apiLimiter,  require('./routes/devRepRoutes'));
app.use('/api/certificates', apiLimiter,  require('./routes/certificates'));
app.use('/api/ai',           apiLimiter,  require('./routes/aiRoutes'));

// ZK Semaphore verification routes (nullifier check, group fetch, proof verify)
try {
    app.use('/api/zk', apiLimiter, require('./routes/zkRoutes'));
} catch (e) {
    console.warn('[server] /api/zk routes not loaded (zkRoutes.js missing):', e.message);
}

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Credora API',
        blockchain: process.env.BLOCKCHAIN_TYPE || 'fabric',
        version:    '2.0.0',
    });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🔒 CORS allowed origins: ${allowedOrigins.join(', ')}`);

    if (process.env.BLOCKCHAIN_TYPE !== 'fabric') {
        listenToEvents();
    } else {
        console.log('⛓  Hyperledger Fabric mode — Ethereum event listeners skipped.');
    }
});
