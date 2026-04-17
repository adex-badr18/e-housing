# SYSTEM ARCHITECTURE
## Staff Housing Allocation & Management System (OAU)

---

## 1. OVERVIEW

This is a full-stack web application built using Next.js (App Router) with a monolithic architecture.

The system manages:
- Staff housing allocation
- Main house and Boys Quarters (BQ) occupancy
- Institutional identity enforcement via official email

---

## 2. TECH STACK

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI
- React Hook Form
- Zod

### Backend
- Next.js API Routes (Route Handlers)
- Prisma ORM

### Database
- PostgreSQL

---

## 3. KEY ARCHITECTURAL DECISIONS

### 3.1 Housing Structure Model

A **Housing Unit** can contain:
- Main House (primary unit)
- 0, 1, or multiple Boys Quarters (BQ)

Each BQ:
- Is treated as a **sub-unit**
- Has its own occupancy record tracking

---

### 3.2 Identity Enforcement

- Only users with **institutional email addresses** can:
  - Register
  - Apply for housing

- Email domain validation must be enforced:
  Example: `@oauife.edu.ng`

---

### 3.3 Occupancy Model

- A housing unit can have multiple occupants
- Each occupant can have zero, one, or multiple BQs which are considered as sub-units of the main house
- Each BQ can have its own occupant which can be added, updated or removed by the main occupant

---

## 3.4 Housing Classification System (NEW)

The system must support **predefined housing types** as provided by the university.

Each housing type includes:
- Point value (used for allocation scoring)
- Structural features:
  - Number of bedrooms
  - Bathrooms
  - Toilets
  - Study room
- Amenities:
  - Garage / Car park
  - Boys Quarters availability
  - Courtyard
- Building type:
  - Bungalow or Storey

These must NOT be free-text fields — they must be **standardized and preloaded into the system**.

---

## 3.5 Staff Category Segmentation (NEW)

The system must distinguish between:

- Senior Staff Housing
- Junior Staff Housing

This affects:
- Eligibility
- Allocation priority
- Available housing types

---


## 4. PROJECT STRUCTURE

/app
  /api
  /auth
  /dashboard
  /housing
  /applications
  /allocations
  /occupancy
  /admin

/components
  /ui
  /forms
  /features

/lib
  /db.ts
  /auth.ts
  /permissions.ts
  /validators.ts
  /email.ts   → institutional email validation

/prisma
  schema.prisma

---

## 5. CORE MODULES (UPDATED)

### 5.1 Authentication & Identity Verification
- Login / Logout
- Enforce institutional email domain
- Role-based access control

---

## 5.2 Housing & BQ Management

Enhancements:
- Housing units must reference a **Housing Type**
- Housing types determine:
  - Features (beds, baths, BQ availability)
  - Allocation points

---

## 5.3 Allocation System

Allocation must consider:

- Staff category (Senior / Junior)
- Housing type points
- Family size (from application form)
- Staff rank and salary grade

Allocation must follow a **three-stage approval workflow**:

### Stage 1: Housing Office Review
- Housing Secretary reviews application first
- Assigns:
  - Initial score (points) using the housing type points and other factors on the submitted application 
  - Updates the status of the first review stage
- Determines preliminary eligibility

---

### Stage 2: Estate Office Review
- Estate Officer reviews application that has been reviewed by the Housing Office
- Verifies:
  - Property availability
  - Physical housing considerations
- Adds remarks or validation
- Updates the status of the second review stage

---

### Stage 3: DVC Admin Approval (FINAL)

- Reviews applications that has been reviewed by the Estate Office
- Has authority to either Approve or Reject the application
- Final decision determines allocation eligibility

---

## 5.4 Application Workflow Engine (NEW)

The system must enforce:

- Sequential review flow:
  1. Housing Unit → 2. Estate Unit → 3. DVC Admin

- Each stage must:
  - Be completed before the next begins
  - Be logged with timestamp and reviewer

- Final application status depends ONLY on DVC Admin decision
- The application status is updated as the application moves through the stages
- Applicant receives an email notification after the final decision. 
- If the application is approved, the email will include their tenancy agreement document attached
- They can also print the document from their portal, sign and submit it to the housing office

---

### 5.5 Occupancy Management (ENHANCED)

Tracks:
- Main house occupant (staff)
- BQ occupants (staff/non-staff individuals)


### 5.6 BQ Occupant Management (NEW)
- The main house occupants can add/update/remove BQ occupants
- Capture:
  - Name
  - Phone Number
  - Email Address
  - Relationship / role (e.g., domestic staff)
- Link to specific BQ unit

---

### 5.7 Application System
- Only institutional emails allowed
- Submit housing requests
- Track status

---

### 5.8 Tenancy & Compliance
- Enforce housing rules
- Track violations

---

### 5.8 Clearance System
- Ensure:
  - Main house cleared
  - BQs inspected
  - All occupants vacated

---

### 5.9 Notification System
- Event-driven notifications

---

## 5.10 System Configuration (NEW)

Admin should be able to:
- Add new housing types
- Edit existing housing types
- Delete existing housing types
- View total housing inventory:
  - Total units
  - Distribution by type
- View:
  - Senior vs Junior housing statistics
  - Generate a report of all housing units & BQs
  - Generate a report of all allocations
- Configure:
  - Allocation scoring rules (future phase)

---

## 6. VALIDATION RULES (UPDATED)

- Staff category must match eligible housing types
- Housing type must exist in predefined dataset

### Institutional Email Validation
- Must match pattern:
  `*@oauife.edu.ng`
- Reject all non-institutional emails

---

## 7. DATA FLOW

Frontend → API → Service Layer → Prisma → PostgreSQL

---

## 8. AGENT RULES (FOR ANTIGRAVITY)

- Do NOT change schema relationships
- Treat BQ as sub-entity of housing unit
- Enforce email domain strictly
- Use Prisma relations properly