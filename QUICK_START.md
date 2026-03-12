# 🚀 QUICK START GUIDE - BLOCKCHAIN INDIA CHALLENGE

## ⚡ FASTEST WAY TO RUN (3 STEPS)

### STEP 1: Start Fabric Network
```bash
# Double-click this file:
START_FABRIC.bat

# OR run in terminal:
cd fabric-network
docker-compose up -d
```

### STEP 2: Start Backend
```bash
cd deid-core\backend
npm install
npm run dev
```

### STEP 3: Start Frontend
```bash
cd veripass-wallet
npm install
npm run dev
```

**Open Browser:** http://localhost:5173

---

## 📋 PREREQUISITES (Install These First)

1. **Docker Desktop** - https://www.docker.com/products/docker-desktop/
   - Must be running before starting Fabric
   - Enable WSL 2 backend (Windows)

2. **Node.js v18+** - https://nodejs.org/
   - Check: `node --version`

3. **Git** - https://git-scm.com/

---

## 🎯 DETAILED STARTUP INSTRUCTIONS

### Option A: Using Batch Script (EASIEST)

1. **Start Fabric Network**
   ```bash
   # Just double-click:
   START_FABRIC.bat
   ```

2. **Start Backend** (New terminal)
   ```bash
   cd deid-core\backend
   npm install
   npm run dev
   ```
   ✅ Backend running on: http://localhost:5000

3. **Start Frontend** (New terminal)
   ```bash
   cd veripass-wallet
   npm install
   npm run dev
   ```
   ✅ Frontend running on: http://localhost:5173

---

### Option B: Manual Docker Commands

1. **Start Fabric Network**
   ```bash
   cd fabric-network
   docker-compose up -d
   
   # Wait 15 seconds for initialization
   timeout /t 15
   
   # Check status
   docker ps
   ```

2. **Verify Containers Running**
   You should see:
   - orderer.credora.com
   - peer0.government.credora.com
   - peer0.university.credora.com
   - peer0.verifier.credora.com
   - couchdb.government
   - couchdb.university
   - couchdb.verifier
   - ca.government.credora.com
   - ca.university.credora.com
   - ca.verifier.credora.com
   - cli

3. **Start Backend & Frontend** (same as Option A)

---

## 🔧 TROUBLESHOOTING

### Problem: "Docker is not running"
**Solution:**
1. Open Docker Desktop
2. Wait for it to fully start (whale icon in system tray)
3. Run `docker info` to verify
4. Try again

### Problem: "Port already in use"
**Solution:**
```bash
# Stop all containers
docker-compose down

# Check what's using the port
netstat -ano | findstr :7051
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# Kill the process or change ports
```

### Problem: "npm install fails"
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
rmdir /s /q node_modules
npm install
```

### Problem: "Containers keep restarting"
**Solution:**
```bash
# Check logs
docker logs peer0.government.credora.com
docker logs orderer.credora.com

# Restart Docker Desktop
# Then run: docker-compose up -d
```

### Problem: "Backend can't connect to Fabric"
**Solution:**
1. Check if all containers are running: `docker ps`
2. Verify network exists: `docker network ls | findstr credora`
3. Check backend .env file has correct settings
4. Restart backend: `npm run dev`

---

## 🌐 ACCESS POINTS

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Main application |
| **Backend API** | http://localhost:5000/api | REST API |
| **CouchDB (Govt)** | http://localhost:5984/_utils | Database UI |
| **CouchDB (Uni)** | http://localhost:6984/_utils | Database UI |
| **CouchDB (Verifier)** | http://localhost:7984/_utils | Database UI |

**CouchDB Credentials:** admin / adminpw

---

## 📊 VERIFY EVERYTHING IS WORKING

### 1. Check Fabric Network
```bash
docker ps
# Should show 11 containers running
```

### 2. Check Backend
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok"}
```

### 3. Check Frontend
Open browser: http://localhost:5173
- Should see Credora login page
- No console errors

---

## 🛑 STOP EVERYTHING

### Stop Fabric Network
```bash
cd fabric-network
docker-compose down
```

### Stop Backend
Press `Ctrl+C` in backend terminal

### Stop Frontend
Press `Ctrl+C` in frontend terminal

---

## 🔄 RESTART FROM SCRATCH

If something goes wrong, full reset:

```bash
# 1. Stop everything
cd fabric-network
docker-compose down -v

# 2. Remove all containers
docker rm -f $(docker ps -aq)

# 3. Start fresh
docker-compose up -d

# 4. Restart backend & frontend
```

---

## 📦 WHAT EACH SERVICE DOES

### Fabric Network (11 Containers)
- **1 Orderer** - Transaction ordering (RAFT consensus)
- **3 Peers** - One per organization (Govt, Uni, Verifier)
- **3 CouchDB** - State database for each peer
- **3 CAs** - Certificate authorities for each org
- **1 CLI** - Admin commands

### Backend (Node.js)
- REST API for frontend
- Connects to Fabric via Gateway SDK
- Handles authentication (JWT)
- AI fraud detection
- Oracle integration (UGC/DigiLocker)

### Frontend (React)
- User interface
- MetaMask authentication
- Credential management
- Certificate lifecycle
- Verification portal

---

## 🎯 FOR BLOCKCHAIN INDIA CHALLENGE DEMO

### Demo Flow:

1. **Start Everything** (3 terminals)
   ```bash
   # Terminal 1: Fabric
   START_FABRIC.bat
   
   # Terminal 2: Backend
   cd deid-core\backend && npm run dev
   
   # Terminal 3: Frontend
   cd veripass-wallet && npm run dev
   ```

2. **Open Browser**
   - Go to: http://localhost:5173
   - Connect MetaMask
   - Sign up as Government Officer

3. **Issue Credential**
   - Upload document
   - Fill details
   - Submit to Fabric

4. **Show Verification**
   - Copy credential hash
   - Verify on blockchain
   - Show immutability

5. **Show AI Fraud Detection**
   - Issue suspicious credential
   - Show AI risk score
   - Demonstrate prevention

---

## 📝 IMPORTANT NOTES

1. **Docker must be running** before starting Fabric
2. **Wait 15 seconds** after starting Fabric before starting backend
3. **Backend must be running** before frontend can work
4. **MetaMask required** for authentication
5. **All 11 containers** must be running for full functionality

---

## 🆘 NEED HELP?

### Check Logs:
```bash
# Fabric containers
docker logs peer0.government.credora.com
docker logs orderer.credora.com

# Backend
# Check terminal where npm run dev is running

# Frontend
# Check browser console (F12)
```

### Common Issues:
- ❌ Port conflicts → Change ports in docker-compose.yaml
- ❌ Docker not running → Start Docker Desktop
- ❌ npm errors → Delete node_modules, run npm install
- ❌ Containers restarting → Check Docker logs

---

## ✅ SUCCESS CHECKLIST

Before demo:
- [ ] Docker Desktop running
- [ ] All 11 Fabric containers running (`docker ps`)
- [ ] Backend running (http://localhost:5000/api/health)
- [ ] Frontend running (http://localhost:5173)
- [ ] MetaMask installed and connected
- [ ] Test credential issuance works
- [ ] Test verification works

---

## 🏆 YOU'RE READY FOR BLOCKCHAIN INDIA CHALLENGE!

**Your Credora project is now running on Hyperledger Fabric!**

Good luck with your submission! 🚀🇮🇳
