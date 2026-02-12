# ⏳ HOLD — Pending Life Manager

> **"HOLD remembers what the world owes you — and makes sure it doesn’t forget."**

HOLD is a Zero-Knowledge tracking and escalation engine for "in-between" life events. Whether it's an insurance refund, a government permit, or an HR request, HOLD makes waiting visible and provides the leverage you need to get things resolved.

---

## 🔒 Zero Knowledge Security
HOLD is built with a **Privacy-First, Zero-Knowledge** architecture. Your data is your own.
- **Client-Side Everything**: Encryption, decryption, and signature verification happen entirely in your browser.
- **Server Blindness**: The server (Firebase) never sees your plain-text data, metadata, or passwords.
- **Maximum Entropy**: PBKDF2-SHA256 key derivation with **600,000 iterations**.
- **Tamper Proof**: Every record is signed (HMAC-SHA256) to detect server-side data modification.

## 🚀 Key Features

### 1. Zero-Knowledge Dashboard
- **Smart Tracking**: Encrypted titles, notes, and statuses.
- **Color-Coded Urgency**: Visual indicators move from Green to Red as industry benchmarks are exceeded.
- **Risk Scoring**: AI-driven delay risk assessment based on category and history.

### 2. Smart Follow-Up Engine
- **Tone-Aware Messages**: One-tap generation of Polite, Firm, or Escalation emails.
- **Dynamic Context**: Templates automatically adapt to the industry (Finance, Healthcare, etc.).
- **Privacy-First**: Messages are generated client-side; the server never sees your communications.

### 3. Leverage Engine
- **Industry Benchmarks**: Real-time comparison against typical wait times and legal deadlines.
- **Regulatory Awareness**: Built-in knowledge of FCBA, HIPAA, FERPA, and more.
- **Escalation Casework**: Specific paths to ombudsmen, regulators (CFPB), and managers.

### 4. Privacy Integrations
- **Magic Email Fill**: Paste confirmation emails to auto-detect counterparty, dates, and category using local regex.
- **Encrypted Evidence Locker**: Securely attach PDFs and screenshots. Files are encrypted *before* upload.
- **Calendar & PDF Export**: Professional case history export (.ics, .pdf) generated entirely client-side.
- **Vault Portability**: Export/Import your entire encrypted vault as JSON.

### 5. Scale & Leverage
- **Anonymous Benchmarking**: Optionally share your (anonymous) wait times to help others without revealing PII.
- **Recurring Holds**: Automatically track repeating promises (Monthly, Quarterly, Yearly).

---

## 🛠 Tech Stack
- **Frontend**: React (Vite) + TypeScript
- **Styling**: Vanilla CSS (Modern Aesthetics)
- **Security**: Web Crypto API (AES-GCM, PBKDF2, HMAC)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Icons**: Lucide React

---

## 💻 Getting Started

1. **Clone & Install**:
   ```bash
   git clone https://github.com/USER/hold.git
   npm install
   ```
2. **Setup Firebase**:
   Copy `.env.example` to `.env` and provide your Firebase config.
3. **Run**:
   ```bash
   npm run dev
   ```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` and `SECURITY.md` for more information.
