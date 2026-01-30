# App: HOLD — Pending Life Manager

## Core Concept
Track, manage, and apply pressure to **pending life events** where the user is waiting on another party (company, institution, person).  
The app acts as an external memory + escalation engine for “in-between” states.

---

## Core Features (MVP)

### 1. Pending Item Creation
- Title (e.g. “Insurance Refund – Claim #4832”)
- Category:
  - Finance
  - Healthcare
  - Government
  - Work / Freelance
  - Education
  - Personal
- Counterparty (company, agency, person)
- Start date
- Expected resolution window (e.g. 7–14 days)
- Status:
  - Pending
  - Overdue
  - Escalated
  - Resolved

---

### 2. Timeline-Based Tracking
- Visual timeline per item:
  - Day 0: Submitted
  - Day N: Expected response
  - Day N+X: Overdue
- Color-coded urgency (green → yellow → red)
- Global “What’s Blocking Me” dashboard

---

### 3. Smart Follow-Up Engine
- Auto-generated follow-up messages:
  - Polite
  - Firm
  - Escalation
- Channels:
  - Email (copy-paste or auto-send)
  - Call script
  - Support portal notes
- Follow-ups triggered by **time**, not reminders

---

### 4. Evidence & Context Storage
- Attach:
  - PDFs
  - screenshots
  - reference numbers
  - emails
- Each item becomes a single source of truth
- Prevents re-submission and lost context

---

### 5. Overdue Detection
- Flags when:
  - Industry norms exceeded
  - Promised deadlines missed
- Changes status automatically
- Surfaces overdue items first

---

### 6. Resolution Logging
- Mark item as resolved
- Log:
  - resolution date
  - outcome
  - time waited
- Generates personal “waiting cost” insights

---

## Phase 1 Implementation (MVP — 4–6 Weeks)

### Tech Stack
- Frontend: React Native (iOS first)
- Backend: Firebase / Supabase
- Auth: Email + OAuth
- Notifications: Push + email
- Storage: Cloud file storage

### Scope
- Manual item entry
- Manual follow-ups (copy/paste)
- Basic notifications
- Local-only escalation logic
- No integrations

### Goal
Prove:
- Users actively log pending items
- Users return to check status
- Users resolve items faster

---

## Phase 2 Implementation (Smart Layer)

### Added Features
- Escalation timing presets by category
- Follow-up templates by industry
- “Overdue Risk” scoring
- Weekly summary digest

### Light Automation
- Email draft autofill
- Follow-up scheduling suggestions
- One-tap “Send Follow-Up”

### Goal
Reduce user effort and increase perceived leverage.

---

## Phase 3 Implementation (Leverage Engine)

### Advanced Features
- Industry benchmarks:
  - refunds
  - claims
  - applications
- Legal / regulatory deadline awareness
- Escalation path suggestions:
  - supervisor
  - ombudsman
  - regulatory body

### Premium Tier
- Unlimited holds
- Advanced escalation templates
- Deadline intelligence
- Exportable history (PDF)

---

## Phase 4 Implementation (Integrations)

### Integrations
- Gmail / Outlook (read-only)
- Calendar sync
- Document auto-detection
- Support ticket portals (where possible)

### Automation
- Auto-create HOLDs from emails
- Auto-update status from replies
- Smart resolution detection

---

## Phase 5 Implementation (B2B & Network Effects)

### B2B Offering
- Companies use HOLD to:
  - track outbound promises
  - reduce inbound “any update?” emails
- White-label dashboards

### Network Effects
- Shared verification of timelines
- Anonymous resolution benchmarks
- Crowd-sourced delay data

---

## Key Design Principles
- User never feels nagged
- System applies pressure outward
- Waiting is made visible
- Control is restored without confrontation

---

## Success Metrics
- Time-to-resolution reduction
- Follow-up response rate
- Daily active pending items
- User-reported stress reduction

---

## Non-Goals
- No task management
- No messaging platform
- No social feed
- No calendar replacement

---

## One-Sentence Value Proposition
**“HOLD remembers what the world owes you — and makes sure it doesn’t forget.”**
