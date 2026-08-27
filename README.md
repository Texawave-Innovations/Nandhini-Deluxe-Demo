# Nandhini Deluxe HRMS & ERP Platform (Phase 1 Demo)

![Nandhini HRMS Enterprise Header](https://img.shields.io/badge/Nandhini_ERP-HRMS_Phase_1-0F5B55?style=for-the-badge)
![Next.js 14](https://img.shields.io/badge/Next.js-14.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=for-the-badge&logo=firebase)

A production-quality **Human Resource Management System (HRMS)** built specifically for **Nandhini Deluxe Group** (operating across Restaurants, Hotels & Banquets, Central Kitchens, and Corporate HQ in Bengaluru). Designed as **Phase 1 of a future ERP platform** ready for clean integration with Payroll, Finance, Procurement, Inventory, Asset Management, and Operations.

---

## 📌 Product Architecture Overview

```text
SHARED ERP CORE MASTERS (Organization, Business Units, Locations, Departments, Roles, Audit Logs)
                                   │
                                   ▼
                             ROSTER ENGINE
                                   │
                                   ▼
                           ATTENDANCE ENGINE
                                   │
                                   ▼
                            APPROVAL ENGINE
                                   │
                                   ▼
                           PAYROLL & REPORTING
```

---

## ✨ Key Features & Domain Modules

### 1. 🏢 Shared ERP Core & Interactive Masters (`/organization/*`)
- **Business Units**: Multi-entity setup (Restaurants, Hotels & Banquets, Central Kitchen, Corporate HQ) with full **Create, View, Edit, and Delete (CRUD)** capabilities.
- **Locations & Geofence**: Branch and operational unit master with GPS address tags.
- **Departments & Functional Divisions**: Department mapping across Kitchen, Service, Finance, HR, Fleet Logistics.
- **Roles & Designations**: Designation master for manpower planning and banquet staffing.
- **Visual Org Hierarchy**: Interactive reporting tree diagram (`/hr/org-chart`).
- **System Audit Trail**: Real-time logging of all create, update, delete, transfer, and approval actions (`/audit`).

### 2. 👥 Employee Management & Transfer Timeline (`/employees`)
- **Employee Directory**: Searchable headcount directory with full CRUD.
- **Effective-Dated Assignment Transfer History**: Timeline tracking location, department, and role changes over time without overwriting historic data.

### 3. ⏰ Shift Master & Monthly Roster Grid Engine (`/shifts/*`, `/roster/*`)
- **Shift Master**: Configure cross-midnight shifts, grace periods, meal breaks, and OT rules.
- **Monthly Roster Grid**: 31-day interactive grid with shift badges (`M1`, `E1`, `N1`, `OFF`, `LV`), click-to-reassign modal, bulk weekly template generator, and publish locking.
- **Manpower Planning**: Required vs scheduled headcount variance tracker (`/roster/manpower-planning`).

### 4. 📸 Attendance Engine & Biometric / Camera Simulators (`/attendance/*`)
- **Biometric Terminal Simulator**: Top bar hardware punch simulator.
- **ESS Web Check-in**: Live camera photo capture with facial verification preview (`/employee/web-checkin`).
- **Attendance Register**: Calculates First IN, Last OUT, worked hours, late minutes, OT hours, missing punches, and regularization statuses.

### 5. 📱 Employee Self-Service (ESS) Portal (`/employee/*`)
- Web check-in with camera photo verification.
- Payslip viewing & simulated PDF downloads.
- Reimbursement expense claims with receipt tags.
- Daily work logs & task tracker.
- HR Helpdesk ticket submission & tracking.
- Resignation notice & offboarding clearance request.
- Self-onboarding wizard.

### 6. 💼 Administrative HR Workspace (`/hr/*`)
- **Statutory Compliance**: PF (12%) and ESI (0.75%) contribution audit dashboards.
- **Salary Advances & Loans**: Loan sanctioning with monthly EMI recovery tracking.
- **Bonus Schemes**: Statutory annual & festival bonus manager.
- **ATS Recruitment Pipeline**: Candidate tracking & Offer Letter builder.
- **Banquet & Event Staffing**: Event setup, role requirements, and conflict-free roster assignment (`/banquet/events`).
- **Full Month Present (FMP)**: FMP incentive eligibility auditor.

---

## 🎨 Nandhini Deluxe Brand Palette & UI System

| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **`--brand-primary`** | `#0F5B55` | Deep Teal (Primary functional color, buttons, active items, sidebars) |
| **`--brand-primary-dark`** | `#08463F` | Darker Deep Teal (Hover states & dark headers) |
| **`--brand-accent`** | `#C59A45` | Warm Gold (Sparse accent for `Publish Roster` & badges) |
| **`--background`** | `#F8F5EE` | Warm Ivory / Off-White main background |
| **`--surface`** | `#FFFFFF` | White card & table surfaces |
| **`--border`** | `#E5E2DB` | Muted neutral card border |
| **Typography** | **Inter** | Primary font for all sidebars, tables, rosters, and forms |

---

## 📁 Directory Structure

```text
NANDHINI DELUXE HRMS/
├── prisma/
│   └── schema.prisma              # PostgreSQL Prisma Schema Configuration
├── public/
├── src/
│   ├── app/                       # Next.js 14 App Router Pages
│   │   ├── attendance/            # Attendance register & regularization
│   │   ├── audit/                 # System audit trail logs
│   │   ├── banquet/               # Banquet event staffing
│   │   ├── dashboard/             # HR Console Executive Dashboard
│   │   ├── employee/              # Employee Self-Service (ESS) Portal
│   │   ├── employees/             # Employee Directory & Transfer History
│   │   ├── hr/                    # Admin HR (PF, ESI, Loans, ATS, Tickets, Exit)
│   │   ├── leave/                 # Leave balances & holiday calendar
│   │   ├── organization/          # Business Units, Locations, Depts, Roles
│   │   ├── overtime/              # Overtime calculation & approvals
│   │   ├── reports/               # Payroll-ready attendance summary & CSV
│   │   ├── roster/                # Monthly grid & manpower planning
│   │   ├── shift-swap/            # Peer-to-peer shift swap engine
│   │   ├── shifts/                # Shift master & rules
│   │   └── workflows/             # Pending approval inbox
│   ├── components/
│   │   └── layout/                # Two-Tier Foldable Sidebar, Header, Shells
│   ├── mock-data/                 # Realistic seed data (~35 employees across branches)
│   ├── services/                  # Firebase Realtime DB Service Operations
│   ├── store/                     # Central Zustand store with auto Firebase sync
│   └── types/                     # TypeScript interfaces for HRMS & ERP Core
├── .env.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nandhini-deluxe/hrms-erp.git
   cd "NANDHINI DELUXE HRMS"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://your-app-default-rtdb.firebaseio.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Open in Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Database Integration

### Real-Time Firebase Storage
All application data (Business Units, Locations, Departments, Roles, Employees, Rosters, Attendance Punches, Loans, HR Tickets, Audit Logs) automatically persists in real-time under your Firebase Realtime Database path (`hr/*`).

### PostgreSQL Prisma Schema
If deploying to a PostgreSQL database:
```bash
npx prisma db push
npx prisma studio
```

---

## 📜 License
Privately owned by **Nandhini Deluxe Group**. All rights reserved.

