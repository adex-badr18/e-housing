# Frontend Implementation Plan: Staff Housing Allocation & Management System

## 1. High-Level Module Breakdown
This breakdown organizes the frontend features into independent, logical blocks based on the PRD, ARCHITECTURE, and DATA_MODEL documents.

- **Module 1: Authentication & Identity**
  - Google OAuth strict enforcement (`@oauife.edu.ng`)
  - Role-based redirect and session management
  - First-time password reset for Management users
- **Module 2: Dashboard & Navigation**
  - Role-specific sidebar layouts
  - Metric cards (Allocations, Vacancies, Inspections)
- **Module 3: Staff Profile & Preferences**
  - Personal Information, Categories (Senior/Junior), Preferences
- **Module 4: Housing & Inventory Config (Super Admin / Housing Sec)**
  - Housing Types setup (Features, Points, Rent)
  - Housing Units and BQ generation
- **Module 5: Application & Review Engine**
  - Staff: Application wizard
  - Housing Sec: Stage 1 (Eligibility & Scoring)
  - Estate Officer: Stage 2 (Property verification)
  - DVC Admin: Stage 3 (Final Approval)
- **Module 6: Allocation & Occupancy Management**
  - Acceptance/Rejection workflows for staff
  - Tenancy agreements tracking
  - BQ Occupant self-service for staff
- **Module 7: Exit & Clearance Workflow**
  - Exit request -> Housing Inspection -> Electrical Inspection -> Estate Inspection -> Clearance Generation
- **Module 8: Administration & Auditing**
  - Read-only audit logs, user management, and violation tracking

---

## 2. Batched Implementation Plan
The goal is to build incrementally with each batch delivering testable UI components backed by the mock API.

- **Batch 1: Core Architecture, UI Framework, and Authentication**
  - Initialize Next.js App Router, Shadcn/UI, NextAuth.
  - Create standard layouts (Sidebar, Header, Breadcrumbs).
  - Setup `/lib/mock-api` singleton state.
  - Implement login pages and role-based redirect logic.

- **Batch 2: Staff Profile & Dashboards Layout**
  - Implement role-specific dashboards with static widget structures.
  - Build the comprehensive Staff Profile form utilizing `react-hook-form` + Zod.

- **Batch 3: System Configuration & Housing Inventory**
  - UI for managing `HousingType` and `HousingUnit`.
  - Nested UI for viewing `Boys Quarters` under a main house.

- **Batch 4: Application Workflow (The Engine)**
  - Application form for Staff.
  - Multi-tab DataTables for Reviewers separating `Pending`, `Scored (Stage 1)`, `Verified (Stage 2)`.
  - Action modals for scoring, adding remarks, and finalizing approval.

- **Batch 5: Occupancy & BQ Occupant Management**
  - Allocation acceptance logic for staff.
  - Dynamic page for Main Occupants to add their BQ residents (Form + List).
  - Secretary and Estate Officer views for active tenancies and occupants.

- **Batch 6: Housing Exit / Vacation Workflow (The Inspection Pipeline)**
  - Exit application submission UI.
  - Department-specific queues (Housing, Electrical, Estate) showing only eligible items.
  - "PASS/FAIL" toggle modals for inspectors.
  - Clearance certificate auto-generation UI.

- **Batch 7: Auditing, Complaints, and Violations**
  - Read-only data tables for Audit Logs.
  - Simple ticketing system for complaints.
  - Violation reporting and tracking by management.

---

## 3. Mock API Design

The mock API will act as a strict stateful Backend-For-Frontend (BFF) simulator, preserving state across Next.js reloads to assist UI testing without a real backend.

### Structure
```text
/lib/mock-api/
  db.ts             // In-memory data store using `globalThis` singleton
  index.ts          // Central mock request dispatcher (`apiHandler`)
  endpoints/
    auth.ts
    applications.ts // Handles stage transitions & scoring
    housing.ts      // Housing types, units, availability validation
    exits.ts        // Enforces strict PASS/FAIL state sequence
    bq.ts           // Sub-unit resident management
```

### Sample Functions & Logic

**Workflow Simulation (Applications)**
```typescript
export async function simulateApplicationReview(appId: string, role: string, payload: any) {
  const app = mockDB.applications.find(a => a.id === appId);
  
  // Stage 1
  if (role === 'HOUSING_SECRETARY' && app.reviewStage === 'PENDING') {
    app.points = payload.points;
    app.reviewStage = 'STAGE_1_COMPLETED';
    
  // Stage 2
  } else if (role === 'ESTATE_OFFICER' && app.reviewStage === 'STAGE_1_COMPLETED') {
    app.estateRemarks = payload.remarks;
    app.reviewStage = 'STAGE_2_COMPLETED';
    
  // Stage 3
  } else if (role === 'DVC_ADMIN' && app.reviewStage === 'STAGE_2_COMPLETED') {
    app.status = payload.status; // 'APPROVED' or 'REJECTED'
  }
  return app;
}
```

**State Consistency (Exit Workflow)**
```typescript
export async function simulateExitInspection(exitId: string, role: string, outcome: 'PASS' | 'FAIL') {
  const exitReq = mockDB.exits.find(e => e.id === exitId);
  
  if (role === 'HOUSING_SECRETARY') exitReq.housingStatus = outcome;
  if (role === 'ELECTRICAL_OFFICER' && exitReq.housingStatus === 'PASS') exitReq.electricalStatus = outcome;
  if (role === 'ESTATE_OFFICER' && exitReq.electricalStatus === 'PASS') exitReq.estateStatus = outcome;

  // Global state effect mutation constraint
  if (exitReq.housingStatus === 'PASS' && exitReq.electricalStatus === 'PASS' && exitReq.estateStatus === 'PASS') {
    exitReq.inspectionStatus = 'PASSED';
    exitReq.cleared = true;
    
    const occupancy = mockDB.occupancies.find(o => o.housingUnitId === exitReq.housingUnitId);
    occupancy.status = 'EXITED';
    
    const unit = mockDB.housingUnits.find(u => u.id === occupancy.housingUnitId);
    unit.status = 'VACANT';
    
    // Clear BQ occupants
    mockDB.bqOccupants = mockDB.bqOccupants.filter(bq => bq.parentHousingUnitId !== exitReq.housingUnitId);
  }
  
  return exitReq;
}
```

---

## 4. Suggested Folder Structure

```text
/app
  /(auth)
    /login/page.tsx
  /(dashboard)
    layout.tsx               // Shared Sidebar & Header
    /staff                   // Staff views
      /profile               
      /applications          
      /my-housing            
      /exit                  
    /management              // Shared reviewer views
      /applications          
      /inspections           
    /admin                   // Super admin / Secretary views
      /users                 
      /housing-types         
      /inventory             
      /audit                 
/components
  /ui                        // Shadcn UI primitives
  /forms                     // Reusable form fields
  /shared                    // Common components
    DataTable.tsx
    StatusBadge.tsx
    ProgressStepper.tsx
  /features                  // Domain specific components
    /applications
      ReviewModal.tsx
      ApplicationTimeline.tsx
    /housing
      BQOccupantList.tsx
/lib
  /mock-api                  // Mock database and controllers
  /validations               // Zod schemas shared across client/server
```

---

## 5. Key Reusable Components

1. **`DataTable`**: Generic table component with pagination, server-side filtering simulation, and custom cells.
2. **`StatusBadge`**: A pure component that maps enums (`PENDING`, `APPROVED`, `PASS`, `FAIL`) to standardized colors across all modules.
3. **`ProgressStepper / Timeline`**: Visual indicator to show the current stage of a housing application or exit inspection.
4. **`FormWrapper` & `SmartInput`**: Boilerplate reducers utilizing `react-hook-form` + `zod` for standardized error handling and consistent layouts.
5. **`ActionModal`**: Generic dialog for confirming actions with necessary text inputs (e.g., providing reasons for rejection/failure, scoring).

---

## 6. Notes on Workflow Handling

### A. Application Workflow
- **Strict Queuing**: Applications MUST NOT appear in the Estate Officer's dashboard until the `Housing Secretary` has scored it. Similarly for the DVC Admin.
- **Form State Aggregation**: The DVC Admin receives a read-only consolidation of Stage 1 (Score) and Stage 2 (Validations/Remarks) alongside the original application data before making their final decision.

### B. Boys Quarters (BQ) Handling
- **Relationship Integrity**: BQs are always treated as sub-entities. The primary staff allocation targets the main housing unit.
- **Occupant Lifecycle**: `BQOccupant` strictly tracks non-staff proxy data. Once the main housing unit occupancy shifts to `EXITED`, the frontend mock API must cascade and clean out active BQ occupants immediately.

### C. Exit & Clearance (Inspection Workflow)
- **No Rejections, Only Re-attempts**: The Exit workflow strictly uses `PENDING`, `PASS`, and `FAIL`. A `FAIL` status keeps the application queued in that department's dashboard until they fix it.
- **Sequential Unblocking Queries**:
  - Expected Electrical UI GET Route: `fetchExits({ housingStatus: 'PASS', electricalStatus: { not: 'PASS' } })`
  - Expected Estate UI GET Route: `fetchExits({ electricalStatus: 'PASS', estateStatus: { not: 'PASS' } })`
- **Global Data Hook**: The moment Estate registers `PASS` as the final inspection, the mock API state must immediately mark the House as `VACANT`, Occupancy as `EXITED`, issue a clearance doc ID, and drop BQ records. The Staff dashboard must automatically react on re-mount to show the active clearance certificate download.
