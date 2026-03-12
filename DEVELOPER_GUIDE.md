# 🚀 Credora Developer Quick Reference

## Architecture Overview

**Credora now runs 100% on Hyperledger Fabric (no Solidity)**

```
Frontend (React) → REST API → Backend (Node.js) → Fabric Gateway SDK → Fabric Network
```

---

## 🔑 Key Changes

### ❌ What's REMOVED:
- All Solidity contracts (`deid-core/blockchain/`)
- Solidity ABIs (`veripass-wallet/src/abis/`)
- Direct blockchain calls via ethers.js
- `blockchainService.js`

### ✅ What's ACTIVE:
- Hyperledger Fabric network (3 orgs)
- 4 Fabric chaincodes
- REST API for all operations
- MetaMask for authentication only

---

## 📁 Project Structure

```
University Deid/
├── fabric-network/              # Fabric Docker network (3 orgs)
│   ├── docker-compose.yaml
│   └── organizations/
├── chaincode/                   # 4 Fabric chaincodes
│   ├── certificate-lifecycle/
│   ├── credential-registry/
│   ├── revocation-registry/
│   └── identity-management/
├── deid-core/
│   └── backend/                 # Node.js REST API
│       └── src/
│           ├── services/
│           │   ├── fabricGateway.js      # Fabric SDK
│           │   ├── chaincodeService.js   # Chaincode wrapper
│           │   ├── aiService.js          # AI fraud detection
│           │   └── oracleService.js      # UGC/DigiLocker
│           └── controllers/
│               ├── credentialController.js
│               └── certificateController.js
└── veripass-wallet/             # React frontend
    └── src/
        ├── hooks/               # REST API hooks
        ├── lib/
        │   ├── api.ts          # All REST endpoints
        │   └── blockchain.ts   # MetaMask auth only
        └── config/
            └── contracts.ts    # Fabric config

```

---

## 🔧 How to Use

### Issue a Credential (Frontend)

```typescript
import { api } from '@/lib/api';

const token = localStorage.getItem("deid_token");
const formData = new FormData();
formData.append("recipientWallet", "0x123...");
formData.append("title", "Degree Certificate");
formData.append("document", file);

const result = await api.credentials.issue(formData, token);
```

### Certificate Lifecycle (Frontend)

```typescript
import { api } from '@/lib/api';

const token = localStorage.getItem("deid_token");

// Create draft
await api.certificates.create(formData, token);

// Update state
await api.certificates.updateState(docHash, 'UNDER_REVIEW', token);
await api.certificates.updateState(docHash, 'APPROVED', token);
await api.certificates.updateState(docHash, 'ISSUED', token);
```

### Verify Credential (Frontend)

```typescript
import { api } from '@/lib/api';

const result = await api.verify.verifyCredentialObj(credentialHash);
console.log(result.isValid);
```

### MetaMask Authentication (Frontend)

```typescript
import { blockchain } from '@/lib/blockchain';

// Connect wallet
const { address, signer } = await blockchain.connectWallet();

// Sign message for authentication
const signature = await blockchain.signMessage("Login to Credora");
```

---

## 🌐 REST API Endpoints

### Authentication
- `POST /api/auth/nonce` - Get nonce for wallet
- `POST /api/auth/verify` - Verify signature
- `GET /api/auth/me` - Get current user

### Credentials
- `POST /api/credentials/issue` - Issue credential
- `GET /api/credentials` - Get my credentials
- `GET /api/credentials/:id` - Get credential by ID
- `PUT /api/credentials/revoke/:id` - Revoke credential

### Certificates
- `POST /api/certificates/create` - Create draft
- `GET /api/certificates` - Get all certificates
- `GET /api/certificates/:hash` - Get by hash
- `PUT /api/certificates/:hash/state` - Update state

### Verification
- `GET /api/verify/:hash` - Verify credential

---

## 🏗️ Fabric Network

### Organizations
1. **GovernmentMSP** - Government issuers (port 7051)
2. **UniversityMSP** - University issuers (port 9051)
3. **VerifierMSP** - Third-party verifiers (port 11051)

### Chaincodes
1. **certificate-lifecycle-cc** - Document state machine
2. **credential-registry-cc** - W3C credentials + ZK
3. **revocation-registry-cc** - Revocation with appeals
4. **identity-management-cc** - DID management

### Start Network
```bash
cd fabric-network
docker-compose up -d
```

---

## 🎯 Role-Based Access

| Role | Can Do |
|------|--------|
| **CITIZEN** | View own credentials |
| **ISSUER_OFFICER** | Issue credentials, create drafts |
| **APPROVER** | Approve certificates |
| **ADMIN** | Revoke, manage all |

---

## 🔐 Authentication Flow

1. User connects MetaMask
2. Frontend requests nonce from backend
3. User signs nonce with MetaMask
4. Backend verifies signature
5. Backend returns JWT token
6. Frontend stores token in localStorage
7. All API calls include token in Authorization header

---

## 🧪 Testing

```bash
# Start Fabric network
cd fabric-network
docker-compose up -d

# Start backend
cd deid-core/backend
npm install
npm run dev

# Start frontend
cd veripass-wallet
npm install
npm run dev
```

Visit: `http://localhost:5173`

---

## 📦 Dependencies

### Backend
- `@hyperledger/fabric-gateway` - Fabric SDK
- `@grpc/grpc-js` - gRPC client
- `express` - REST API
- `mongoose` - MongoDB
- `jsonwebtoken` - JWT auth

### Frontend
- `ethers` - MetaMask integration
- `react` - UI framework
- `vite` - Build tool

---

## 🐛 Common Issues

### "Fabric network not running"
```bash
cd fabric-network
docker-compose up -d
```

### "No auth token"
- User needs to login with MetaMask first
- Check localStorage for "deid_token"

### "Failed to connect to peer"
- Check Docker containers are running
- Verify ports 7051, 9051, 11051 are open

---

## 📚 Learn More

- [Hyperledger Fabric Docs](https://hyperledger-fabric.readthedocs.io/)
- [Fabric Gateway SDK](https://hyperledger.github.io/fabric-gateway/)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)

---

**Last Updated:** Migration to Fabric complete
**Architecture:** Hyperledger Fabric (3 orgs, 4 chaincodes)
