# Loan Management System

A full-stack loan management application with a **Borrower Portal** for loan applications and an **Operations Dashboard** for internal executive workflows.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose
- **Auth**: JWT with bcrypt

## Project Structure

```
├── client/          # Next.js frontend
│   ├── app/
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   ├── apply/           # Borrower loan application (multi-step)
│   │   └── dashboard/       # Operations dashboard
│   │       ├── sales/       # Leads tracking
│   │       ├── sanction/    # Loan approval/rejection
│   │       ├── disbursement/# Fund disbursement
│   │       └── collection/  # Payment recording
│   └── lib/
│       ├── api.ts           # API client
│       └── auth.tsx         # Auth context provider
│
├── server/          # Express backend
│   └── src/
│       ├── config/          # DB connection, env config
│       ├── controllers/     # Route handlers
│       ├── middleware/       # JWT auth, RBAC
│       ├── models/          # Mongoose schemas
│       ├── routes/          # API routes
│       ├── services/        # BRE, loan calculations
│       ├── seed.ts          # Database seeder
│       └── index.ts         # Entry point
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Clone the repository

```bash
git clone https://github.com/Suraj0791/creditseaassign.git
cd creditseaassign
```

### 2. Server setup

```bash
cd server
cp .env.example .env    # Edit .env if needed (MongoDB URI, JWT secret)
npm install
npm run seed            # Seeds test accounts
npm run dev             # Starts on http://localhost:5000
```

### 3. Client setup

```bash
cd client
cp .env.example .env.local
npm install
npm run dev             # Starts on http://localhost:3000
```

## Test Credentials

| Role          | Email                | Password      |
|---------------|----------------------|---------------|
| Admin         | admin@lms.dev        | Admin@123     |
| Sales         | sales@lms.dev        | Sales@123     |
| Sanction      | sanction@lms.dev     | Sanction@123  |
| Disbursement  | disburse@lms.dev     | Disburse@123  |
| Collection    | collect@lms.dev      | Collect@123   |
| Borrower      | borrower@lms.dev     | Borrower@123  |

> Admin can access all dashboard modules. Other roles only see their assigned module.

## API Routes

### Auth
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| POST   | `/api/auth/register`  | Register new user   |
| POST   | `/api/auth/login`     | Login               |
| GET    | `/api/auth/me`        | Get current user    |

### Borrower
| Method | Endpoint                          | Description                |
|--------|-----------------------------------|----------------------------|
| POST   | `/api/borrower/check-eligibility` | Run BRE eligibility check  |
| POST   | `/api/borrower/upload-slip`       | Upload salary slip         |
| POST   | `/api/borrower/apply`             | Submit loan application    |
| GET    | `/api/borrower/my-application`    | Get own loan application   |

### Operations (require role-based access)
| Method | Endpoint                             | Role                  | Description              |
|--------|--------------------------------------|-----------------------|--------------------------|
| GET    | `/api/ops/sales`                     | admin, sales          | Get leads                |
| GET    | `/api/ops/sanction`                  | admin, sanction       | Get pending applications |
| PATCH  | `/api/ops/sanction/:id/approve`      | admin, sanction       | Approve loan             |
| PATCH  | `/api/ops/sanction/:id/reject`       | admin, sanction       | Reject loan              |
| GET    | `/api/ops/disbursement`              | admin, disbursement   | Get sanctioned loans     |
| PATCH  | `/api/ops/disbursement/:id/disburse` | admin, disbursement   | Mark as disbursed        |
| GET    | `/api/ops/collection`                | admin, collection     | Get disbursed loans      |
| POST   | `/api/ops/collection/:id/payment`    | admin, collection     | Record payment           |
| GET    | `/api/ops/collection/:id/payments`   | admin, collection     | Get payment history      |

## Borrower Flow

1. Register / Login as borrower
2. Fill personal details (name, PAN, DOB, salary, employment)
3. BRE checks eligibility (age 23-50, salary ≥ 25K, valid PAN, not unemployed)
4. Upload salary slip (PDF/JPG/PNG, max 5MB)
5. Configure loan (amount 50K-5L, tenure 30-365 days)
6. Review live interest calculation (SI @ 12% p.a.) and submit

## Loan Status Flow

```
pending → applied → sanctioned → disbursed → closed
                  ↘ rejected
```

## BRE Rules

- Age must be between 23 and 50 (calculated from DOB)
- Monthly salary must be ≥ ₹25,000
- Valid PAN format: `ABCDE1234F`
- Employment mode cannot be "Unemployed"

## Interest Calculation

Simple Interest formula:
```
SI = (Principal × Rate × Tenure) / (365 × 100)
Rate = 12% per annum
Total Repayment = Principal + SI
```
