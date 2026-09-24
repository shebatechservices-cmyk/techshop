# ⚡ Sheba Technology ERP & POS Management System

An enterprise-grade, high-performance Point of Sale (POS) and Enterprise Resource Planning (ERP) platform developed for **Sheba Technology and Networking**. Engineered for retail, wholesale, technology hardware, repair workflows, double-entry accounting, and multi-branch management.

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Modules & Features](#-key-modules--features)
3. [Tech Stack](#-tech-stack)
4. [Local Setup Instructions](#-local-setup-instructions)
5. [Environment Variables](#-environment-variables)
6. [Vendor App Licensing Integration Guide](#-vendor-app-licensing-integration-guide)
7. [License](#-license)

---

## 🌟 Project Overview

Sheba Technology ERP delivers a secure, unified business operating system combining:
- **Point of Sale (POS)** with barcode scanning, serialized inventory tracking, multi-tender payments, thermal receipt printing, and exchange flows.
- **Supply Chain & Purchases** with purchase orders, quotation-to-order conversions, dynamic margin calculation, and supplier ledgers.
- **Double-Entry Financial Accounting** featuring cash flow tracking, ledger audit trails, shift-based cash drawer closing, and expense voucher management.
- **Hardware Warranty & RMA Tracking** with serial number swaps, claim status tracking, and vendor replacement records.
- **SOC & Role-Based Access Control (RBAC)** with IP whitelisting, multi-device session concurrency limits, and granular staff permission matrix.
- **E-Commerce & Digital Storefront** integration for omnichannel parcel tracking, digital orders, and automated SMS dispatch.

---

## 🛠️ Key Modules & Features

| Module | Description |
| :--- | :--- |
| **Sales & POS** | Instant invoice creation, multi-payment tenders (Cash, Card, MFS, Credit), warranty slip generation, invoice sharing via SMS/WhatsApp. |
| **Inventory & Stock** | Multi-warehouse routing, serialized item management, low-stock alerts, automated valuation, and barcode label printing. |
| **Purchases** | Supplier requisition, bulk purchase orders, barcode scanning auto-cataloging, supplier debt ledger reconciliation. |
| **Accounts & Expenses** | Day-close EOD register balancing, cash/bank wallets, multi-currency tender configuration, categorized expense tracking. |
| **Projects & Repairs** | Technical ticket lifecycle, technician response tracking, progress notes, and service invoice generation. |
| **Security & SOC** | Active device session kill-switch, login anomaly detection, IP filtering, and developer console maintenance tools. |

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS, React Router v6, Lucide Icons, Headless UI.
- **Backend API**: Node.js, Express.js, PostgreSQL (`pg` pool & Prisma ORM), JWT Authentication.
- **Licensing & Security**: Hardware fingerprinting, HMAC-SHA256 signature cache, automated heartbeat synchronization, Remote Kill-Switch barrier.

---

## 🚀 Local Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <YOUR_REPOSITORY_URL>
cd sheba-technology
```

### 2. Install Dependencies
Install both backend and frontend dependencies:
```bash
# Install backend packages
npm install

# Install frontend packages
npm install --prefix frontend
```

### 3. Setup PostgreSQL Database
1. Create a PostgreSQL database (e.g. `sheba_pos_db`).
2. Run database migrations or push schema:
```bash
npx prisma db push
```

### 4. Configure Environment Files
Copy the sample environment variables:
```bash
# Backend Environment (.env in root)
cp .env.example .env

# Frontend Environment (frontend/.env)
cp frontend/.env.example frontend/.env
```
*(Update database credentials, JWT secrets, and Vendor Licensing URLs as specified below).*

### 5. Start Development Servers
Start both backend API and frontend Vite server:
```bash
# Start backend server (default: port 5000)
npm run dev

# In a separate terminal, start frontend (default: port 5173)
npm run dev --prefix frontend
```

---

## 🔐 Environment Variables

### Backend Configuration (`.env` in root)
```env
# Application Server
PORT=5000
NODE_ENV=development

# Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/sheba_pos_db?schema=public"

# Authentication Security
JWT_SECRET="your-super-secure-jwt-secret-key-2026"
SESSION_SECRET="your-session-secret-key"

# Vendor App Licensing & Central Controller
VENDOR_API_URL="http://localhost:3001"
CLIENT_APP_ID="CLIENT-SHEBA-TECH-8801"
LICENSE_CACHE_SECRET="SHEBA-VENDOR-LIC-SECRET-KEY-2026"
```

### Frontend Configuration (`frontend/.env`)
```env
# Backend API Base URL
VITE_API_URL="http://localhost:5000/api"

# Vendor Licensing & Central Management App
VITE_VENDOR_API_URL="http://localhost:3001"
VITE_APP_KEY="SHEBA-ERP-POS-CLIENT-KEY-2026"
```

---

## 🛡️ Vendor App Licensing Integration Guide

This ERP software incorporates a multi-tier **Vendor Controller Licensing Architecture** designed to verify subscription authenticity, maintain hardware binding, and provide remote maintenance capabilities.

```
┌─────────────────────────┐          Heartbeat / Status Check           ┌─────────────────────────────┐
│    Sheba ERP Client     │ ──────────────────────────────────────────> │   Central Vendor Controller  │
│  (useVendorLicense.js)  │ <────────────────────────────────────────── │     (Vendor Admin Portal)   │
└─────────────────────────┘          Encrypted License Payload          └─────────────────────────────┘
             │
             ▼
    [ Status Validation ]
    ├── Status = 'active'     ──> Render Main Application Routes
    └── Status = 'expired'    ──> Trigger Fullscreen LicenseLockScreen (Route Access Terminated)
        Status = 'suspended'
```

### How the Licensing System Operates:

1. **Client Startup Handshake**:
   - On application startup, [`useVendorLicense.js`](frontend/src/hooks/useVendorLicense.js) queries `/api/license/status`.
   - The backend validates the encrypted local cache signature (`vendor_license_cache`) and performs a hardware fingerprint check (`hostname`, `platform`, `network MAC`).
2. **Remote Heartbeat Sync**:
   - The ERP backend regularly executes background heartbeats to the `VENDOR_API_URL`.
   - If a license is expired, suspended, or remotely revoked from the Vendor App, the backend updates the local cache state with an HMAC cryptographic signature.
3. **UI Enforcement (`LicenseLockScreen`)**:
   - In [`src/App.jsx`](frontend/src/App.jsx), if `!isLicenseValid` or `licenseDetails.is_blocked === true`, route rendering is blocked immediately.
   - The user is presented with the barrier screen displaying:
     - License status (`Expired`, `Suspended`, or `Hardware Mismatch`).
     - Days remaining / Expiration timestamp.
     - Direct **License Key / Redemption Code** activation form to renew and unlock the system in real time.
4. **Offline Resilience & Grace Period**:
   - If the vendor licensing server is unreachable due to internet outage, the software evaluates the local cryptographically signed cache and permits operation for a pre-configured offline grace duration.

---

## 📜 License

Copyright (c) 2026 Sheba Technology and Networking. All Rights Reserved. This is proprietary software. Unauthorized copying, modification, or distribution is strictly prohibited.
