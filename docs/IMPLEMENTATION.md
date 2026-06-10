# CryoChain — Implementation Documentation

**Blockchain-Backed Cold Chain Supply Chain Management System**

---

## 1. Project Overview

CryoChain is a full-stack, production-grade supply chain management platform that combines Ethereum smart contracts with an off-chain Node.js/MongoDB backend and a React frontend. It is designed to track pharmaceutical and perishable product batches from manufacturer to retailer, enforcing cryptographic ownership guarantees, tamper-evident monitoring logs, and public product authenticity verification.

### Core Design Philosophy

The system adopts a **hybrid on-chain/off-chain architecture**:

| Data Type | Where Stored | Why |
|---|---|---|
| Stakeholder roles | Blockchain (RoleManager.sol) | Immutable, trustless |
| Product integrity hash | Blockchain (ProductBatch.sol) | Tamper-proof anchor |
| Monitoring integrity hash | Blockchain (ColdChainMonitor.sol) | Audit trail |
| Full product metadata | MongoDB | Fast queries, flexible schema |
| Temperature logs | MongoDB (hash anchored on-chain) | Cost-efficient |
| Transfer history | MongoDB | Rich search capability |

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        FRONTEND                          │
│         React 19 + Vite + Tailwind CSS + ethers.js v6   │
│         MetaMask ← wallet-based authentication           │
└──────────────┬────────────────────────┬──────────────────┘
               │ REST API calls          │ Direct contract calls
               ▼                        ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│        BACKEND          │   │    BLOCKCHAIN (Anvil)    │
│   Node.js + Express 5   │   │                          │
│   MongoDB + Mongoose    │   │   RoleManager.sol        │
│   SHA-256 hashing       │   │   ProductBatch.sol       │
│   ethers.js v6          │   │   ColdChainMonitor.sol   │
└─────────────────────────┘   └──────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Smart Contracts | Solidity + Foundry | `^0.8.20` |
| Local Blockchain | Anvil (Foundry) | latest |
| Frontend | React + Vite | `19.x` / `8.x` |
| Styling | Tailwind CSS | `v4` |
| Blockchain Client | ethers.js | `v6` |
| Backend | Node.js + Express | `18+` / `5.x` |
| Database | MongoDB + Mongoose | `9.x` |
| Wallet | MetaMask | latest |

---

## 4. Smart Contract Layer

### 4.1 Contract Dependency Graph

```
RoleManager.sol
      ↑
ProductBatch.sol ──────────┐
      ↑                    ↓
ColdChainMonitor.sol ──────┘
```

Deployment must follow this exact order: `RoleManager` → `ProductBatch` → `ColdChainMonitor`.

---

### 4.2 RoleManager.sol

**File:** `blockchain/src/access/RoleManager.sol`  
**Purpose:** Assigns and enforces stakeholder roles at the wallet level.

#### Role Enumeration

```solidity
enum Role {
    NONE,         // 0 — unregistered wallet
    MANUFACTURER, // 1
    SUPPLIER,     // 2
    WAREHOUSE,    // 3
    RETAILER      // 4
}
```

#### Stakeholder Struct

```solidity
struct Stakeholder {
    string name;
    Role   role;
    bool   exists;
}

mapping(address => Stakeholder) public stakeholders;
```

#### Key Functions

| Function | Access | Description |
|---|---|---|
| `createStakeholder(address, string, Role)` | Admin only | Registers a wallet with a role |
| `getRole(address)` | Public | Returns the role of any wallet |
| `getStakeholderCount()` | Public | Returns number of registered stakeholders |
| `getAllStakeholders()` | Public | Returns array of all registered wallet addresses |

#### Access Control

```solidity
modifier onlyAdmin() {
    require(msg.sender == admin, "Not Admin");
    _;
}

modifier stakeholderNotExists(address _wallet) {
    require(!stakeholders[_wallet].exists, "Stakeholder already exists");
    _;
}
```

#### Event Emitted

```solidity
event StakeholderCreated(
    address indexed stakeholder,
    string name,
    Role role
);
```

---

### 4.3 ProductBatch.sol

**File:** `blockchain/src/products/ProductBatch.sol`  
**Purpose:** Stores SHA-256 product hashes on-chain and enforces chain-of-custody ownership transfers.

#### Product Struct

```solidity
struct Product {
    bytes32 productHash;   // SHA256 of MongoDB metadata
    address creator;       // manufacturer wallet
    uint256 timestamp;     // block time of creation
    string  batchId;       // human-readable batch identifier
    address currentOwner;  // current custodian
    bool    exists;
}
```

#### Enforced Transfer Rules

The `_isValidTransfer()` internal function enforces the following custody path:

```
MANUFACTURER → SUPPLIER   ✅ allowed
SUPPLIER     → WAREHOUSE  ✅ allowed
WAREHOUSE    → RETAILER   ✅ allowed
Any other sequence        ❌ reverts with "Invalid transfer path"
```

#### Implementation

```solidity
function _isValidTransfer(
    RoleManager.Role from,
    RoleManager.Role to
) internal pure returns (bool) {
    if (from == RoleManager.Role.MANUFACTURER && to == RoleManager.Role.SUPPLIER)  return true;
    if (from == RoleManager.Role.SUPPLIER     && to == RoleManager.Role.WAREHOUSE) return true;
    if (from == RoleManager.Role.WAREHOUSE    && to == RoleManager.Role.RETAILER)  return true;
    return false;
}
```

#### Key Functions

| Function | Access | Description |
|---|---|---|
| `createProduct(bytes32, string)` | MANUFACTURER only | Registers a product hash + batch ID on-chain |
| `transferProduct(bytes32, address)` | Current owner only | Transfers custody following supply chain rules |
| `getProduct(bytes32)` | Public | Fetches product struct by hash |
| `getProductByBatchId(string)` | Public | Fetches product struct by batch ID string |
| `getManufacturerProducts(address)` | Public | Returns all hashes created by a manufacturer |

#### Events

```solidity
event ProductCreated(
    bytes32 indexed productHash,
    address indexed creator,
    string  batchId,
    uint256 timestamp
);

event OwnershipTransferred(
    bytes32 indexed productHash,
    address indexed from,
    address indexed to,
    uint256 timestamp
);
```

---

### 4.4 ColdChainMonitor.sol

**File:** `blockchain/src/tracking/ColdChainMonitor.sol`  
**Purpose:** Records cumulative integrity hashes of monitoring logs on-chain, creating a tamper-evident audit trail without storing raw log data.

#### State Variables

```solidity
// productHash → latest cumulative integrity hash
mapping(bytes32 => bytes32) public latestIntegrityHash;

// productHash → total number of logs recorded
mapping(bytes32 => uint256) public logCount;
```

#### Core Function

```solidity
function recordCondition(
    bytes32 _productHash,
    bytes32 _integrityHash
) external onlyStakeholderOrAdmin {
    require(_productHash    != bytes32(0), "Invalid product hash");
    require(_integrityHash  != bytes32(0), "Invalid integrity hash");

    latestIntegrityHash[_productHash] = _integrityHash;
    logCount[_productHash]++;

    emit ConditionLogged(_productHash, _integrityHash, msg.sender, block.timestamp);
}
```

**Design Note:** Each call overwrites the previous hash. The new hash is generated from _all_ cumulative MongoDB logs, so a single on-chain value always represents the state of the entire log history.

---

### 4.5 Deployment Script

**File:** `blockchain/script/Deploy.s.sol`

The `DeployScript` deploys all three contracts in dependency order and prints addresses for `.env` configuration:

```solidity
RoleManager roleManager = new RoleManager();
ProductBatch productBatch = new ProductBatch(address(roleManager));
ColdChainMonitor coldChainMonitor = new ColdChainMonitor(
    address(roleManager),
    address(productBatch)
);
```

**Run:**
```bash
cd blockchain
forge build
forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545
```

---

## 5. Backend Layer

### 5.1 Server Bootstrap

**File:** `backend/src/server.js`

Express 5 server with CORS enabled. All routes are mounted under `/api/`:

```javascript
app.use("/api/stakeholders", stakeholderRoutes);
app.use("/api/products",     productRoutes);
app.use("/api/transfers",    transferRoutes);
app.use("/api/monitoring",   monitoringRoutes);
app.use("/api/verify",       verificationRoutes);
app.use("/api/search",       searchRoutes);
```

---

### 5.2 Data Models (MongoDB Schemas)

#### Stakeholder

```javascript
{
  walletAddress: String,   // unique, lowercase
  name:          String,
  role:          String,   // "MANUFACTURER" | "SUPPLIER" | "WAREHOUSE" | "RETAILER"
  organization:  String,
  email:         String,
  phone:         String,
  isActive:      Boolean,
  txHash:        String    // blockchain tx that created the on-chain role
}
```

#### Product

```javascript
{
  batchId:            String,   // unique identifier
  productName:        String,
  origin:             String,
  expiryDate:         Date,
  manufacturingDate:  Date,
  minTemperature:     Number,   // °C lower bound
  maxTemperature:     Number,   // °C upper bound
  description:        String,
  creatorWallet:      String,
  blockchainHash:     String,   // "0x" + 64-char SHA-256 hex
  status:             String,   // "CREATED" | "WITH_SUPPLIER" | "WITH_WAREHOUSE" | "WITH_RETAILER" | "SOLD"
  currentOwnerWallet: String,
  creationTxHash:     String
}
```

#### MonitoringLog

```javascript
{
  batchId:              String,
  productHash:          String,   // 0x bytes32
  temperature:          Number,   // °C
  location:             String,
  sealStatus:           String,   // "INTACT" | "BROKEN" | "UNKNOWN"
  notes:                String,
  loggedByWallet:       String,
  loggedByRole:         String,
  isSafe:               Boolean,
  alertType:            String,   // "TEMP_HIGH" | "TEMP_LOW" | "SEAL_BROKEN" | null
  integrityHashOnChain: String,   // hash sent to ColdChainMonitor
  blockchainTxHash:     String    // tx that recorded the integrity hash
}
```

---

### 5.3 Hash Utility

**File:** `backend/src/utils/hashUtil.js`

The deterministic hashing pipeline ensures identical inputs always produce identical outputs, regardless of key insertion order:

```javascript
// Sorts keys before serialising — order-independent
export const generateHash = (data) => {
  const sorted = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(sorted).digest("hex");
};

// Converts 64-char hex to Solidity-compatible bytes32
export const toBytes32 = (hexHash) => "0x" + hexHash;
```

#### Product Hash Normalisation

The following fields and normalisation rules are used consistently in both `productController.js` and `verificationService.js`:

```javascript
const hashData = {
  batchId,
  productName,
  origin,
  expiryDate:        new Date(expiryDate).toISOString(),   // must be ISO string
  manufacturingDate: new Date(manufacturingDate).toISOString(),
  minTemperature:    Number(minTemperature),                 // must be Number
  maxTemperature:    Number(maxTemperature),
};
const blockchainHash = toBytes32(generateHash(hashData));
```

> **Critical:** Any deviation in field normalisation between creation and verification will cause hash mismatch and a false `TAMPERED` result.

---

### 5.4 Product Creation Flow (Two-Phase)

To prevent hash mismatch between the blockchain transaction and the MongoDB record, product creation uses a two-phase approach:

**Phase A — `POST /api/products/prepare-hash`**

Computes and returns `blockchainHash` without writing to the database. The frontend uses this hash to submit the `ProductBatch.createProduct()` blockchain transaction.

**Phase B — `POST /api/products/create`**

Called after the blockchain transaction is confirmed. Saves the full product metadata to MongoDB along with the `creationTxHash`.

```
Frontend
  │
  ├─ POST /api/products/prepare-hash  ──→  blockchainHash returned
  │
  ├─ MetaMask: ProductBatch.createProduct(hash, batchId)  ──→  txHash
  │
  └─ POST /api/products/create (with txHash)  ──→  saved to MongoDB
```

---

### 5.5 Monitoring Log Flow

**File:** `backend/src/controllers/monitoringController.js`

Each call to `POST /api/monitoring/log` performs the following sequence:

1. Validate required fields
2. Fetch product from MongoDB to retrieve temperature range
3. Compare submitted temperature against `minTemperature`/`maxTemperature`
4. Set `isSafe` and `alertType` accordingly
5. Save log entry to MongoDB
6. Regenerate a **cumulative** integrity hash from **all logs** for this product:

```javascript
const allLogs = await MonitoringLog.find({ batchId }).sort({ createdAt: 1 });
const integrityHash = toBytes32(generateHash({
  logs: allLogs.map(l => ({ t: l.temperature, loc: l.location, ts: l.createdAt }))
}));
```

7. Call `ColdChainMonitor.recordCondition()` via backend wallet signer
8. Update the log document with the returned `blockchainTxHash`

---

### 5.6 Verification Service

**File:** `backend/src/services/verificationService.js`

The `verifyProduct(batchId)` function implements a two-check verification:

**Check 1 — Data integrity:**
Regenerates the SHA-256 hash from MongoDB fields using the exact same normalisation as creation. Compares against the stored `blockchainHash`.

**Check 2 — Monitoring integrity:**
Fetches `latestIntegrityHash` from `ColdChainMonitor.sol` on-chain. Returns it alongside the verification result for the frontend to display.

```javascript
const isAuthentic = recomputedHash.toLowerCase() === storedHash.toLowerCase();
```

---

### 5.7 Blockchain Service

**File:** `backend/src/services/blockchainService.js`

Provides `ethers.js v6` contract instances:

| Export | Contract | Access Type |
|---|---|---|
| `getRoleManagerContract()` | RoleManager | Read-only (Provider) |
| `getProductBatchContract()` | ProductBatch | Read-only (Provider) |
| `getColdChainMonitorContract()` | ColdChainMonitor | Read-write (Signer) |

Only `ColdChainMonitor` requires a signer because the backend wallet (`PRIVATE_KEY` in `.env`) signs all monitoring hash writes autonomously.

---

### 5.8 REST API Reference

#### Stakeholders

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/stakeholders` | Register a new stakeholder |
| `GET` | `/api/stakeholders` | List all stakeholders |
| `GET` | `/api/stakeholders/:wallet` | Get by wallet address |

#### Products

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/products/prepare-hash` | Compute hash (no DB write) |
| `POST` | `/api/products/create` | Save product to MongoDB |
| `GET` | `/api/products/:batchId` | Get by batch ID |
| `GET` | `/api/products/manufacturer/:wallet` | Get by creator wallet |
| `GET` | `/api/products/owner/:wallet` | Get by current owner wallet |

#### Transfers

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/transfers/record` | Record custody transfer |
| `GET` | `/api/transfers/:batchId` | Get full transfer history |

#### Monitoring

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/monitoring/log` | Submit a condition log |
| `GET` | `/api/monitoring/:batchId` | Get all logs |
| `GET` | `/api/monitoring/alerts/:batchId` | Get breach-only logs |

#### Verification & Search

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/verify/:batchId` | Verify authenticity |
| `GET` | `/api/search?query=` | Full-text search |
| `GET` | `/api/search/product/:batchId` | Full consumer detail view |

---

## 6. Frontend Layer

### 6.1 Technology

Built with **React 19**, **Vite 8**, **Tailwind CSS v4**, **ethers.js v6**, and **React Router v7**.

### 6.2 Route Map

| Route | Page | Wallet Required |
|---|---|---|
| `/` | LandingPage | No |
| `/search` | CustomerSearch | No |
| `/admin` | AdminDashboard | Yes (Admin only) |
| `/manufacturer` | ManufacturerDashboard | Yes (MANUFACTURER) |
| `/supplier` | SupplierDashboard | Yes (SUPPLIER) |
| `/warehouse` | WarehouseDashboard | Yes (WAREHOUSE) |
| `/retailer` | RetailerDashboard | Yes (RETAILER) |

### 6.3 Wallet Context

`WalletContext.jsx` manages MetaMask connection state globally. Each role dashboard checks the connected wallet's role via `RoleManager.getRole()` on contract before rendering protected content.

### 6.4 Contract Interaction Pattern

All stakeholder dashboards follow this pattern for write operations:

1. Call `POST /api/products/prepare-hash` to get `blockchainHash`
2. Use ethers.js to submit the transaction via MetaMask
3. `await tx.wait()` to get the confirmed `txHash`
4. Call the appropriate backend REST endpoint with the `txHash` to sync MongoDB

---

## 7. Environment Configuration

### `backend/.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/coldchain
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

ROLE_MANAGER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
PRODUCT_BATCH_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
COLD_CHAIN_MONITOR_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### `client/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_ROLE_MANAGER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_PRODUCT_BATCH_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_COLD_CHAIN_MONITOR_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

---

## 8. Local Development Setup

```bash
# 1. Terminal 1 — MongoDB
mongod

# 2. Terminal 2 — Anvil local EVM node
anvil

# 3. Terminal 3 — Deploy contracts
cd blockchain
forge build
forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545

# 4. Fill both .env files with printed contract addresses

# 5. Terminal 4 — Backend
cd backend && npm install && npm run dev

# 6. Terminal 5 — Frontend
cd client && npm install && npm run dev
# Opens at http://localhost:5173
```

---

## 9. Known Limitations

| Area | Limitation |
|---|---|
| Contracts | No upgrade proxy pattern; redeployment required for any change |
| Contracts | Single admin key — no multi-sig governance |
| Backend | REST API has no authentication or rate limiting |
| Backend | No MongoDB ↔ blockchain reconciliation on write failure |
| Frontend | Wallet state not persisted across page refresh |
| Frontend | Role access is UI-only; server-side verification absent |
| Testing | No backend API tests or E2E browser tests |
| CI/CD | No automated pipeline configured |

---

*CryoChain — Implementation Documentation · v1.0*
