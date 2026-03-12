# 🚀 CREDORA - BLOCKCHAIN INDIA CHALLENGE STARTUP GUIDE

## ⚡ SUPER QUICK START (1 CLICK!)

### Just Double-Click This File:
```
SETUP_AND_START.bat
```

This will:
- ✅ Check all prerequisites
- ✅ Start Fabric network (11 containers)
- ✅ Install all dependencies
- ✅ Create startup scripts

Then:
1. Double-click: `START_BACKEND.bat`
2. Double-click: `START_FRONTEND.bat`
3. Open: http://localhost:5173

**DONE! 🎉**

---

## 📋 BEFORE YOU START

### Required Software:

1. **Docker Desktop** ⚠️ MUST BE RUNNING
   - Download: https://www.docker.com/products/docker-desktop/
   - Start it and wait for the whale icon in system tray
   - Enable WSL 2 backend (Windows Settings)

2. **Node.js v18+**
   - Download: https://nodejs.org/
   - Check: `node --version`

3. **Git** (optional)
   - Download: https://git-scm.com/

---

## 🎯 STEP-BY-STEP INSTRUCTIONS

### Method 1: Automated (RECOMMENDED)

#### Step 1: Setup Everything
```bash
# Double-click this file:
SETUP_AND_START.bat
```

Wait for it to complete. You'll see:
- ✅ Docker check
- ✅ Node.js check
- ✅ Fabric network starting
- ✅ Dependencies installing
- ✅ Scripts created

#### Step 2: Start Backend
```bash
# Double-click:
START_BACKEND.bat

# You'll see:
# Server running on http://localhost:5000
```

#### Step 3: Start Frontend
```bash
# Double-click:
START_FRONTEND.bat

# You'll see:
# Local: http://localhost:5173
```

#### Step 4: Open Browser
```
http://localhost:5173
```

---

### Method 2: Manual (For Advanced Users)

#### Terminal 1: Fabric Network
```bash
cd fabric-network
docker-compose up -d

# Wait 20 seconds
timeout /t 20

# Check status
docker ps
```

#### Terminal 2: Backend
```bash
cd deid-core\backend
npm install
npm run dev
```

#### Terminal 3: Frontend
```bash
cd veripass-wallet
npm install
npm run dev
```

---

## 🔍 VERIFY EVERYTHING IS WORKING

### 1. Check Fabric Network
```bash
docker ps
```

You should see **11 containers** running:
- ✅ orderer.credora.com
- ✅ peer0.government.credora.com
- ✅ peer0.university.credora.com
- ✅ peer0.verifier.credora.com
- ✅ couchdb.government
- ✅ couchdb.university
- ✅ couchdb.verifier
- ✅ ca.government.credora.com
- ✅ ca.university.credora.com
- ✅ ca.verifier.credora.com
- ✅ cli

### 2. Check Backend
Open: http://localhost:5000/api/health

Should return:
```json
{"status":"ok"}
```

### 3. Check Frontend
Open: http://localhost:5173

Should see:
- ✅ Credora login page
- ✅ No console errors (F12)
- ✅ MetaMask connection button

---

## 🎬 DEMO FLOW FOR BLOCKCHAIN INDIA CHALLENGE

### Preparation (Before Demo):

1. **Start Everything**
   - Run: `SETUP_AND_START.bat`
   - Run: `START_BACKEND.bat`
   - Run: `START_FRONTEND.bat`

2. **Verify All Running**
   - Check: `docker ps` (11 containers)
   - Check: http://localhost:5000/api/health
   - Check: http://localhost:5173

3. **Prepare MetaMask**
   - Install MetaMask extension
   - Create/import wallet
   - Have it ready to connect

### Demo Script:

#### Part 1: Introduction (2 min)
```
"Credora is a privacy-first Universal Credential Wallet 
running on Hyperledger Fabric with 3 organizations:
- Government (MeitY/NIC)
- Universities
- Third-party Verifiers"
```

Show: `docker ps` (11 containers running)

#### Part 2: Issue Credential (3 min)

1. **Connect MetaMask**
   - Click "Connect Wallet"
   - Sign authentication message
   - Show DID generation

2. **Sign Up as Government Officer**
   - Role: ISSUER_OFFICER
   - Organization: Government of India

3. **Issue Degree Certificate**
   - Upload sample PDF
   - Fill recipient wallet address
   - Submit to Fabric
   - Show transaction on blockchain

4. **Show AI Fraud Detection**
   - Point out AI risk score
   - Explain fraud prevention

#### Part 3: Verification (2 min)

1. **Copy Credential Hash**
   - From issued credential

2. **Verify on Blockchain**
   - Go to Verify page
   - Paste hash
   - Show verification result
   - Explain immutability

3. **Show Revocation**
   - Demonstrate revocation capability
   - Show updated status

#### Part 4: Architecture (2 min)

Show diagram:
```
Frontend (React) 
    ↓ REST API
Backend (Node.js)
    ↓ Fabric Gateway SDK
Hyperledger Fabric Network
    ├── Government MSP
    ├── University MSP
    └── Verifier MSP
```

Explain:
- No gas fees
- Permissioned blockchain
- Enterprise-grade security
- AI fraud detection
- Oracle integration (UGC/DigiLocker)

#### Part 5: Q&A (1 min)

Common questions:
- **Q: Why Fabric over Ethereum?**
  - A: No gas fees, permissioned, enterprise-grade, privacy

- **Q: How is data stored?**
  - A: Metadata on IPFS, hash on Fabric, cache in MongoDB

- **Q: Can credentials be faked?**
  - A: No - AI fraud detection + multi-sig approval + immutable ledger

---

## 🛑 STOP EVERYTHING

### Quick Stop:
```bash
# Double-click:
STOP_FABRIC.bat
```

### Manual Stop:
```bash
# Stop Fabric
cd fabric-network
docker-compose down

# Stop Backend: Ctrl+C in terminal
# Stop Frontend: Ctrl+C in terminal
```

---

## 🔧 TROUBLESHOOTING

### Problem: "Docker is not running"
**Solution:**
1. Open Docker Desktop
2. Wait for whale icon in system tray
3. Run `docker info` to verify
4. Try again

### Problem: "Port 7051 already in use"
**Solution:**
```bash
# Stop all containers
docker-compose down

# Check what's using the port
netstat -ano | findstr :7051

# Kill the process or restart Docker
```

### Problem: "Containers keep restarting"
**Solution:**
```bash
# Check logs
docker logs peer0.government.credora.com
docker logs orderer.credora.com

# Common fix: Restart Docker Desktop
# Then: docker-compose up -d
```

### Problem: "Backend can't connect to Fabric"
**Solution:**
1. Verify all containers running: `docker ps`
2. Check network: `docker network ls | findstr credora`
3. Restart backend: `npm run dev`

### Problem: "Frontend shows connection error"
**Solution:**
1. Check backend is running: http://localhost:5000/api/health
2. Check browser console (F12) for errors
3. Clear browser cache
4. Restart frontend

### Problem: "npm install fails"
**Solution:**
```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rmdir /s /q node_modules

# Try again
npm install
```

---

## 📊 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React + Vite)                                │
│  - MetaMask authentication                              │
│  - Credential management UI                             │
│  - Verification portal                                  │
│  Port: 5173                                             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST API
                     ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (Node.js + Express)                            │
│  - REST API endpoints                                   │
│  - Fabric Gateway SDK                                   │
│  - AI fraud detection                                   │
│  - Oracle integration (UGC/DigiLocker)                  │
│  - MongoDB cache                                        │
│  Port: 5000                                             │
└────────────────────┬────────────────────────────────────┘
                     │ Fabric Gateway SDK (gRPC)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  HYPERLEDGER FABRIC NETWORK                             │
│                                                          │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Government   │ University   │  Verifier    │        │
│  │    MSP       │    MSP       │    MSP       │        │
│  │  Port: 7051  │  Port: 9051  │ Port: 11051  │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                          │
│  Orderer (RAFT): Port 7050                              │
│  CouchDB: Ports 5984, 6984, 7984                        │
│                                                          │
│  Chaincodes:                                            │
│  - certificate-lifecycle-cc                             │
│  - credential-registry-cc                               │
│  - revocation-registry-cc                               │
│  - identity-management-cc                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🌐 ACCESS POINTS

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | MetaMask |
| **Backend API** | http://localhost:5000/api | JWT Token |
| **Health Check** | http://localhost:5000/api/health | Public |
| **CouchDB (Govt)** | http://localhost:5984/_utils | admin/adminpw |
| **CouchDB (Uni)** | http://localhost:6984/_utils | admin/adminpw |
| **CouchDB (Verifier)** | http://localhost:7984/_utils | admin/adminpw |

---

## 📝 IMPORTANT NOTES

1. **Docker MUST be running** before starting Fabric
2. **Wait 20 seconds** after starting Fabric before starting backend
3. **Backend MUST be running** before frontend works
4. **MetaMask required** for authentication
5. **All 11 containers** must be running for full functionality

---

## ✅ PRE-DEMO CHECKLIST

Before your Blockchain India Challenge presentation:

- [ ] Docker Desktop installed and running
- [ ] Node.js v18+ installed
- [ ] All dependencies installed (`npm install` in both folders)
- [ ] Fabric network running (11 containers)
- [ ] Backend running (http://localhost:5000/api/health)
- [ ] Frontend running (http://localhost:5173)
- [ ] MetaMask installed and wallet created
- [ ] Test credential issuance works
- [ ] Test verification works
- [ ] Prepare sample documents for demo
- [ ] Have backup plan (screenshots/video)

---

## 🎥 DEMO TIPS

1. **Have Backup**
   - Take screenshots of working system
   - Record video demo as backup
   - Have slides ready

2. **Practice**
   - Run through demo 2-3 times
   - Time yourself (aim for 8-10 minutes)
   - Prepare for questions

3. **Highlight Unique Features**
   - AI fraud detection
   - Zero-knowledge proofs (Phase 5)
   - Multi-org consensus
   - No gas fees
   - Government integration (UGC/DigiLocker)

4. **Be Ready for Questions**
   - Why Fabric over Ethereum?
   - How is privacy maintained?
   - What about scalability?
   - Integration with existing systems?

---

## 🏆 SUCCESS INDICATORS

Your system is ready when:
- ✅ `docker ps` shows 11 containers
- ✅ http://localhost:5000/api/health returns {"status":"ok"}
- ✅ http://localhost:5173 loads without errors
- ✅ You can connect MetaMask
- ✅ You can issue a credential
- ✅ You can verify a credential
- ✅ AI fraud detection shows risk score

---

## 🆘 EMERGENCY CONTACTS

If something breaks during demo:

1. **Quick Restart**
   ```bash
   STOP_FABRIC.bat
   SETUP_AND_START.bat
   START_BACKEND.bat
   START_FRONTEND.bat
   ```

2. **Check Logs**
   ```bash
   docker logs peer0.government.credora.com
   docker logs orderer.credora.com
   ```

3. **Fallback to Slides**
   - Have architecture diagrams ready
   - Show code walkthrough
   - Explain concepts verbally

---

## 🎉 YOU'RE READY!

**Your Credora project is fully set up and ready for the Blockchain India Challenge!**

### Final Steps:
1. Run `SETUP_AND_START.bat`
2. Run `START_BACKEND.bat`
3. Run `START_FRONTEND.bat`
4. Open http://localhost:5173
5. Practice your demo
6. WIN THE CHALLENGE! 🏆🇮🇳

---

**Good luck with your submission!** 🚀

**Made with ❤️ for Blockchain India Challenge 2024**
