# FRONTEND_PLAN.md
## Staff Housing Allocation & Management System (OAU) — Frontend Implementation Plan

---

# 1. PROJECT OVERVIEW (FRONTEND SCOPE)

This document defines the modular frontend implementation plan for the Staff Housing Allocation & Management System.

The frontend will:
- Provide role-based dashboards and workflows
- Integrate with a centralized mock API
- Simulate backend logic including:
  - Application review workflow
  - Allocation lifecycle
  - Occupancy tracking
  - Exit inspection workflow
- Be built incrementally in independent batches

---

# 2. HIGH-LEVEL MODULE BREAKDOWN

## 2.1 Core Modules

### 1. Authentication & Access Control
- Login (Google OAuth + Credentials)
- Role detection & routing
- Session handling

---

### 2. Dashboard (Role-Based)
- Staff Dashboard
- Housing Secretary Dashboard
- Estate Officer Dashboard
- Electrical Officer Dashboard
- DVC Admin Dashboard
- Super Admin Dashboard

---

### 3. Staff Profile Management
- Profile form (React Hook Form + Zod)
- Employment details
- Family data (spouse, children)

---

### 4. Housing Application Module
- Submit application
- Select housing preferences
- Track application status

---

### 5. Application Review Module
- Housing Secretary review (scoring)
- Estate Officer validation
- DVC Admin final decision

---

### 6. Housing & Unit Management
- Housing Types
- Housing Units
- BQ management

---

### 7. BQ Occupant Management
- Add / edit / remove occupants
- Assign to BQ sub-units

---

### 8. Allocation & Occupancy Module
- Allocation acceptance/rejection
- Occupancy tracking
- Unit/BQ status

---

### 9. Complaint Module
- Submit complaint
- Track status
- Admin resolution

---

### 10. Housing Exit (Inspection Workflow)
- Submit exit request
- Track inspection statuses
- Clearance certificate UI

---

### 11. Admin & User Management
- Create users
- Assign roles
- Activate/deactivate accounts

---

### 12. Audit Logs (Read-only)
- View system activities
- Filter logs

---

# 3. BATCH-BY-BATCH IMPLEMENTATION PLAN

---

## Batch 1: Core Foundation

### Scope:
- Project setup
- Layout system
- Authentication UI
- Role-based routing

### Deliverables:
- `/auth/login`
- Layout (sidebar + header)
- Role guard system

---

## Batch 2: Dashboard & Profile

### Scope:
- Role dashboards
- Profile management

### Deliverables:
- `/dashboard`
- `/profile`
- Dashboard widgets (stats, quick actions)

---

## Batch 3: Housing Applications (Staff)

### Scope:
- Application submission
- Status tracking

### Deliverables:
- `/applications/new`
- `/applications/history`
- Status timeline component

---

## Batch 4: Application Review (Management)

### Scope:
- Multi-stage review UI

### Deliverables:
- `/applications/review`
- Scoring interface (Housing Secretary)
- Review panels per role

---

## Batch 5: Housing & BQ Management

### Scope:
- Housing types
- Housing units
- BQ sub-units

### Deliverables:
- `/housing/types`
- `/housing/units`
- `/housing/bq`

---

## Batch 6: Allocation & Occupancy

### Scope:
- Allocation flow
- Occupancy lifecycle

### Deliverables:
- `/allocations`
- `/occupancy`

---

## Batch 7: Complaint System

### Scope:
- Complaint submission & resolution

### Deliverables:
- `/complaints`

---

## Batch 8: Housing Exit Workflow

### Scope:
- Inspection-based exit process

### Deliverables:
- `/exit/apply`
- `/exit/status`
- Clearance certificate UI

---

## Batch 9: Admin & Audit

### Scope:
- User management
- Audit logs

### Deliverables:
- `/admin/users`
- `/admin/audit`

---

# 4. MOCK API DESIGN (CRITICAL)

---

## 4.1 Structure

/lib/mock-api/
index.ts
db.ts
auth.ts
applications.ts
housing.ts
occupancy.ts
exit.ts
complaints.ts