# 🎓 StellarAttend — Blockchain Attendance Tracking System

> **Decentralized, Immutable Attendance Verification on Stellar Testnet with Freighter Wallet Integration.**

[![Stellar Testnet](https://img.shields.io/badge/Network-Stellar%20Testnet-00F0FF?style=for-the-badge&logo=stellar)](https://horizon-testnet.stellar.org)
[![Freighter Wallet](https://img.shields.io/badge/Wallet-Freighter%20Supported-6366F1?style=for-the-badge)](https://freighter.app)
[![Vercel Deployment](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-10B981?style=for-the-badge&logo=vercel)](https://stellar-attendance-system.vercel.app)
[![GitHub License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 🚀 Live Demo & Repository

- 🌐 **Live Web Application**: **[https://stellar-attendance-system.vercel.app](https://stellar-attendance-system.vercel.app)**
- 🐙 **GitHub Repository**: **[https://github.com/niteshgupta143/Attendance-tracking-system](https://github.com/niteshgupta143/Attendance-tracking-system)**

---

## 📌 Project Overview

**StellarAttend** is a modern, high-performance web application that leverages the **Stellar Testnet Blockchain** to record, verify, and store student attendance records immutably. Every attendance check-in creates an on-chain transaction with custom text memo fields (containing `Session ID` and `Student ID`), ensuring transparent and tamper-proof academic record keeping.

---

## ✨ Features & Level 1 Requirement Checklist

### 1. 🔑 Wallet Setup & Network Config
- Integrates **Freighter Browser Extension Wallet** configured for **Stellar Testnet**.
- Includes a 1-click **Friendbot Faucet** tool to automatically request 10,000 Testnet XLM for funding accounts.
- Features a **1-Click Instant Testnet Key** fallback mode to allow testing on any browser without extension popups.

### 2. 🔌 Wallet Connection & Disconnect
- Real-time `requestAccess()` and `getPublicKey()` integration from `@stellar/freighter-api`.
- Truncated Public Key pill display (`GAIH...6QM`) with a 1-click copy-to-clipboard button.
- Instant wallet disconnect functionality clearing local session state.

### 3. 💰 Balance Handling
- Queries the **Stellar Horizon REST API** (`https://horizon-testnet.stellar.org/accounts/{publicKey}`).
- Real-time XLM balance display with automatic 15-second polling and manual refresh triggers.
- Unfunded account warning detection with automatic Friendbot funding prompt.

### 4. ⚡ On-Chain Transaction Flow & Verification
- On-chain student check-in form creating micro-payment transactions (`0.00001 XLM`) with structured text memos (`ATTEND:CS401:STU9812`).
- 4-stage visual execution stepper:
  1. **Building XDR**: Fetching account sequence & constructing transaction.
  2. **Signature / Key**: Signing transaction via Freighter or secret key.
  3. **Horizon Submit**: Submitting signed XDR to Stellar Horizon network.
  4. **Confirmed**: Transaction finalized on ledger.
- Displays transaction status badges, copyable **Transaction Hash**, and direct links to **Stellar Expert Testnet Explorer**.

### 5. 📊 Attendance Ledger & Export
- Local storage persistence for past attendance check-ins.
- Interactive data table showing Student Name, Roll No, Class Session, Timestamp, Fee, and Verified Hash.
- 1-click **Export to CSV** functionality for administrative reporting.

---

## 🛠️ Technology Stack

- **Frontend Core**: Semantic HTML5, Glassmorphism CSS design system, Modern ES Modules JavaScript.
- **Blockchain Core**: Stellar Horizon REST API, Stellar SDK `v10.4.0`, `@stellar/freighter-api`.
- **Deployment**: Vercel Static Hosting (`vercel.json` SPA rewrite rules).

---

## 🖥️ Local Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/niteshgupta143/Attendance-tracking-system.git
   cd Attendance-tracking-system
   ```

2. **Open in Browser**:
   - Open `index.html` directly in any web browser, or serve using VS Code Live Server or Node static server:
   ```bash
   npx serve ./
   ```

3. **Connect Wallet & Test**:
   - Click **Connect Wallet** in top navbar.
   - Choose **Freighter Browser Extension** or **1-Click Instant Testnet Connect**.
   - Click **Fund 10k XLM (Friendbot)** if your account is new.
   - Submit a test check-in!

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
