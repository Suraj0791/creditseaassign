# Loan Management System (LMS)

A production-ready, full-stack Loan Management System featuring a multi-step **Borrower Portal** (onboarding, Business Rule Engine validation, document upload, loan term configuration) and an **Operations Dashboard** with Role-Based Access Control (Sales, Sanction, Disbursement, Collection).

---

## Architecture & System Design Decisions

### 1. MongoDB Collections & Relationships

The system is designed around 3 normalized, indexed collections with foreign key references:

```
┌────────────────┐          ┌──────────────────────┐          ┌────────────────┐
│     Users      │ 1 ──── 1 │   LoanApplications   │ 1 ──── N │    Payments    │
│                │          │                      │          │                │
│  _id           │          │  _id                 │          │  _id           │
│  name          │          │  userId (Ref: User)  │◄─────────┼──loanAppId     │
│  email (unique)│          │  status (Indexed)    │          │  utr (unique)  │
│  role          │          │  ...loan data        │          │  recordedBy    │
└────────────────┘          └──────────────────────┘          └────────────────┘
        ▲                                                             │
        └─────────────────────────────────────────────────────────────┘
                                  Ref: User
```

#### Collections Specification

| Collection | Key Fields & Types | Indexes & Constraints | Purpose |
|---|---|---|---|
| **`users`** | `name` (String), `email` (String, unique, lowercase), `password` (String, bcrypt hashed, `select: false`), `role` (Enum: `borrower`, `admin`, `sales`, `sanction`, `disbursement`, `collection`) | `email: 1` (unique) | Authentication, authorization, and audit identity |
| **`loanapplications`** | `userId` (ObjectId -> User), `fullName` (String), `pan` (String, uppercase), `dob` (String, YYYY-MM-DD), `monthlySalary` (Number), `employmentMode` (Enum), `salarySlipUrl` (String), `loanAmount` (Number), `tenure` (Number, days), `interestRate` (Number, default 12), `totalRepayment` (Number), `status` (Enum), `rejectionReason` (String), `disbursedAt` (Date), `totalPaid` (Number, default 0), `closedAt` (Date) | `userId: 1`, `status: 1` | Full borrower onboarding and loan lifecycle state machine |
| **`payments`** | `loanApplicationId` (ObjectId -> LoanApplication), `utrNumber` (String, unique), `amount` (Number), `date` (Date), `recordedBy` (ObjectId -> User) | `utrNumber: 1` (unique), `loanApplicationId: 1` | Ledger of repayment transactions recorded by Collection team |

---

### 2. Loan Status Finite State Machine (FSM)

Transitions are strictly controlled by role and pre-conditions. Unauthorized role attempts or invalid state jumps return 400 / 403:

```
                ┌──────────────┐
                │   PENDING    │  Created on passing BRE check
                └──────┬───────┘
                       │ (Borrower uploads salary slip & submits loan config)
                       ▼
                ┌──────────────┐
       ┌────────┤   APPLIED    ├────────┐
       │        └──────────────┘        │
       │ (Sanction / Admin rejects)     │ (Sanction / Admin approves)
       ▼                                ▼
┌──────────────┐                 ┌──────────────┐
│   REJECTED   │                 │  SANCTIONED  │
│  (Terminal)  │                 └──────┬───────┘
└──────────────┘                        │ (Disbursement / Admin marks funds disbursed)
                                        ▼
                                 ┌──────────────┐
                                 │  DISBURSED   │
                                 └──────┬───────┘
                                        │ (Collection / Admin records payments until totalPaid >= totalRepayment)
                                        ▼
                                 ┌──────────────┐
                                 │    CLOSED    │  (Terminal)
                                 └──────────────┘
```

| Transition | From State | To State | Triggered By | Preconditions & Validation |
|---|---|---|---|---|
| **Initiate** | *None* | `PENDING` | **Borrower** | Meets BRE (Age 23–50, Salary ≥ ₹25K, valid PAN, employed) |
| **Apply** | `PENDING` | `APPLIED` | **Borrower** | Salary slip uploaded; valid loanAmount (₹50k-5L) & tenure (30-365d) |
| **Sanction** | `APPLIED` | `SANCTIONED` | **Sanction Officer** or **Admin** | Application in `APPLIED` status |
| **Reject** | `APPLIED` | `REJECTED` | **Sanction Officer** or **Admin** | Rejection reason provided |
| **Disburse** | `SANCTIONED` | `DISBURSED` | **Disbursement Officer** or **Admin** | Application in `SANCTIONED` status; stamps `disbursedAt` |
| **Collect** | `DISBURSED` | `DISBURSED` / `CLOSED` | **Collection Officer** or **Admin** | Valid amount, unique UTR; if `totalPaid >= totalRepayment` marks `CLOSED` |

---

### 3. Authentication & RBAC Architecture

- **Stateless JWT**: Tokens signed with `JWT_SECRET`, expiring in 7 days.
- **`authenticate` Middleware**:
  - Validates `Authorization: Bearer <token>`
  - Decodes payload and fetches user without exposing hashed password (`password: { select: false }`)
  - Attaches typed `req.user` to Express Request context.
- **`authorize(...roles)` Middleware**:
  - Higher-order route guard validating `roles.includes(req.user.role)`
  - Returns `403 Forbidden` if role is unauthorized.
- **Client-Side RBAC (`useRoleGuard`)**:
  - Enforces route-level access control on each dashboard module.
  - Automatically redirects unauthorized users to their designated module.
  - Operations sidebar dynamically filters navigation items by user role.

---

### 4. REST API Reference

#### Auth Endpoints (`/api/auth`)
| Method | Endpoint | Access | Body / Params | Responses |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `{ name, email, password }` | `201 Created` (token, user), `400 Bad Request`, `409 Conflict` |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | `200 OK` (token, user), `400 Bad Request`, `401 Unauthorized` |
| `GET` | `/api/auth/me` | Authenticated | *None* | `200 OK` (user profile), `401 Unauthorized` |

#### Borrower Endpoints (`/api/borrower`)
| Method | Endpoint | Access | Description | Responses |
|---|---|---|---|---|
| `POST` | `/api/borrower/check-eligibility` | Borrower | Runs BRE on `{ fullName, pan, dob, monthlySalary, employmentMode }` | `200 OK` (`eligible: boolean, errors: []`), `400` |
| `POST` | `/api/borrower/upload-slip` | Borrower | Multi-part file upload (`salarySlip`, PDF/PNG/JPG max 5MB) | `200 OK` (`url: string`), `400 Bad Request` |
| `POST` | `/api/borrower/apply` | Borrower | Finalizes loan `{ loanAmount, tenure }` | `200 OK` (application), `400 Bad Request` |
| `GET` | `/api/borrower/my-application` | Borrower | Retrieves current user's active loan application | `200 OK` (application), `401 Unauthorized` |

#### Operations Dashboard Endpoints (`/api/ops`)
| Method | Endpoint | Authorized Roles | Description | Responses |
|---|---|---|---|---|
| `GET` | `/api/ops/sales` | `admin`, `sales` | Lists registered borrowers without an active loan application | `200 OK` (`leads: []`), `401`, `403` |
| `GET` | `/api/ops/sanction` | `admin`, `sanction` | Lists applications awaiting review (`status: applied`) | `200 OK` (`applications: []`), `401`, `403` |
| `PATCH` | `/api/ops/sanction/:id/approve` | `admin`, `sanction` | Approves application (`applied` -> `sanctioned`) | `200 OK`, `400`, `401`, `403`, `404` |
| `PATCH` | `/api/ops/sanction/:id/reject` | `admin`, `sanction` | Rejects application (`applied` -> `rejected`) with `{ reason }` | `200 OK`, `400`, `401`, `403`, `404` |
| `GET` | `/api/ops/disbursement` | `admin`, `disbursement` | Lists approved loans awaiting payout (`status: sanctioned`) | `200 OK` (`applications: []`), `401`, `403` |
| `PATCH` | `/api/ops/disbursement/:id/disburse` | `admin`, `disbursement` | Disburses loan funds (`sanctioned` -> `disbursed`) | `200 OK`, `400`, `401`, `403`, `404` |
| `GET` | `/api/ops/collection` | `admin`, `collection` | Lists active disbursed loans with repayment progress | `200 OK` (`applications: []`), `401`, `403` |
| `POST` | `/api/ops/collection/:id/payment` | `admin`, `collection` | Records repayment transaction `{ utrNumber, amount, date }` | `201 Created`, `400`, `404`, `409 Conflict` |
| `GET` | `/api/ops/collection/:id/payments` | `admin`, `collection` | Fetches payment transaction history for a loan | `200 OK` (`payments: []`), `401`, `403` |

---

### 5. Project Folder Structure

```
creditseaassign/
├── client/                     # Next.js 14/15 Frontend (App Router, Tailwind CSS)
│   ├── app/
│   │   ├── login/              # Borrower & Staff authentication
│   │   ├── register/           # Borrower self-registration
│   │   ├── apply/              # Multi-step loan application wizard
│   │   └── dashboard/          # RBAC-gated Operations dashboard
│   │       ├── sales/          # Leads pipeline
│   │       ├── sanction/       # Approval / Rejection queue
│   │       ├── disbursement/   # Payout execution queue
│   │       ├── collection/     # Repayment ledger & balance tracking
│   │       ├── layout.tsx      # Role-filtered responsive sidebar
│   │       └── page.tsx        # Automatic role-based module router
│   ├── components/
│   │   └── DobDatePicker.tsx   # Custom date of birth picker (Year/Month jump, age indicator)
│   └── lib/
│       ├── api.ts              # Typed fetch wrapper with error handling
│       ├── auth.tsx            # Context provider with persistent auth state
│       └── useRoleGuard.ts     # Client-side route protection hook
│
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts           # MongoDB connection handler
│   │   │   └── env.ts          # Strongly typed environment configuration
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts     # Register, Login, GetMe
│   │   │   ├── borrower.controller.ts # BRE check, file upload, loan apply
│   │   │   └── ops.controller.ts      # Sales, Sanction, Disburse, Collect
│   │   ├── middleware/
│   │   │   ├── authenticate.ts        # JWT token verification & user context
│   │   │   └── authorize.ts           # Role-Based Access Control (RBAC)
│   │   ├── models/
│   │   │   ├── User.ts                # User schema & role enum
│   │   │   ├── LoanApplication.ts     # Loan application schema & lifecycle status
│   │   │   └── Payment.ts             # Payment ledger schema & UTR uniqueness
│   │   ├── routes/
│   │   │   ├── auth.routes.ts         # /api/auth
│   │   │   ├── borrower.routes.ts     # /api/borrower (with multer upload)
│   │   │   └── ops.routes.ts          # /api/ops
│   │   ├── services/
│   │   │   └── bre.service.ts         # Business Rule Engine & interest formulas
│   │   ├── seed.ts                    # Test accounts generator for all 6 roles
│   │   └── index.ts                   # Express server bootstrap & middleware wiring
│   ├── .env.example
│   └── tsconfig.json
│
├── README.md                   # System documentation & setup guide
└── .gitignore
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local instance or MongoDB Atlas cluster)

### 1. Server Setup
```bash
cd server
cp .env.example .env
# Configure MONGODB_URI and JWT_SECRET in server/.env
npm install
npm run seed      # Populates test users for each role
npm run dev       # Starts API server on http://localhost:5000
```

### 2. Client Setup
```bash
cd client
cp .env.example .env.local
npm install
npm run dev       # Starts frontend on http://localhost:3000
```

---

## Test Credentials

| Role | Email | Password | Accessible Dashboard Module |
|---|---|---|---|
| **Admin** | `admin@lms.dev` | `Admin@123` | All modules (Sales, Sanction, Disbursement, Collection) |
| **Sales** | `sales@lms.dev` | `Sales@123` | Sales (/dashboard/sales) |
| **Sanction** | `sanction@lms.dev` | `Sanction@123` | Sanction (/dashboard/sanction) |
| **Disbursement** | `disburse@lms.dev` | `Disburse@123` | Disbursement (/dashboard/disbursement) |
| **Collection** | `collect@lms.dev` | `Collect@123` | Collection (/dashboard/collection) |
| **Borrower** | `borrower@lms.dev` | `Borrower@123` | Borrower Portal (/apply) |

---

## Business Rule Engine (BRE) Rules

- **Age Requirement**: Applicant age must be between **23 and 50 years** (calculated from DOB).
- **Minimum Salary**: Monthly salary must be at least **₹25,000**.
- **PAN Verification**: Must match standard Indian PAN pattern: `[A-Z]{5}[0-9]{4}[A-Z]{1}`.
- **Employment Status**: Unemployed applicants are automatically disqualified.

## Interest & Repayment Calculation

Uses Simple Interest (SI) at 12% per annum:
$$\text{Interest} = \frac{\text{Principal} \times 12 \times \text{Tenure (days)}}{365 \times 100}$$
$$\text{Total Repayment} = \text{Principal} + \text{Interest}$$
