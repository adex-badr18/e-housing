# DATA MODEL

## Staff Housing Allocation & Management System (OAU)

---

## 1. USER

Represents all system users.

### Fields:

- id
- email (unique, institutional for staff)
- password (nullable for Google OAuth users)
- role (SUPER_ADMIN | HOUSING_SECRETARY | ESTATE_OFFICER | ELECTRICAL_OFFICER | DVC_ADMIN | STAFF)
- firstName
- lastName
- phoneNumber
- isActive
- mustChangePassword (boolean)
- createdAt
- updatedAt

---

## 2. STAFF PROFILE

Additional data for staff users.

### Fields:

- id
- userId (FK → User)
- staffId
- middleName (nullable)
- gender (MALE | FEMALE)
- department
- faculty
- rank
- salaryGradeLevel
- employmentDate
- maritalStatus ("SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED")
- numberOfDependents
- currentHousingStatus (HAS_ALLOCATION | NO_ALLOCATION) -> strictly system managed
- createdAt
- updatedAt

---

## 3. HOUSING TYPE

Predefined and standardized housing categories.

### Fields:

- id
- name
- category (SENIOR | JUNIOR)
- buildingType (BUNGALOW | STOREY)
- numberOfBedrooms
- numberOfBathrooms
- numberOfToilets
- hasStudyRoom (boolean)
- hasParking (boolean)
- hasBQ (boolean)
- numberOfBQ (integer)
- hasCourtyard (boolean)
- allocationPoints
- annualRent
- isActive
- createdAt
- updatedAt

---

## 4. HOUSING UNIT

Represents individual houses.

### Fields:

- id
- name / code
- housingTypeId (FK → HousingType)
- status (VACANT | OCCUPIED | UNDER_MAINTENANCE)
- createdAt
- updatedAt

---

## 5. BQ (BOYS QUARTERS)

Sub-units under a housing unit.

### Fields:

- id
- housingUnitId (FK → HousingUnit)
- name / label (e.g., BQ1, BQ2)
- status (VACANT | OCCUPIED)
- createdAt
- updatedAt

---

## 6. OCCUPANCY

Tracks main housing occupancy.

### Fields:

- id
- userId (FK → User)
- housingUnitId (FK → HousingUnit)
- checkInDate
- checkOutDate (nullable)
- status (ACTIVE | EXITED)
- createdAt
- updatedAt

---

## 7. BQ OCCUPANT

Tracks occupants of BQs.

> ⚠️ NOTE: This is **NOT request-based**. Managed directly by main occupant.

### Fields:

- id
- bqId (FK → BQ)
- mainOccupantId (FK → User)
- fullName
- phoneNumber
- email (optional)
- relationship (e.g., Domestic Staff)
- createdAt
- updatedAt

---

## 8. HOUSING APPLICATION

Staff housing request.

### Fields:

- id
- userId (FK → User)
- preferredHousingTypeIds (array)
- status (PENDING | UNDER_REVIEW | APPROVED | REJECTED)
- currentStage (HOUSING | ESTATE | DVC | COMPLETED)
- submittedAt
- updatedAt

---

## 9. APPLICATION REVIEW

Tracks multi-stage application workflow.

### Fields:

- id
- applicationId (FK → HousingApplication)
- reviewerId (FK → User)
- reviewerRole
- stage (HOUSING | ESTATE | DVC)
- score (nullable)
- decision (APPROVED | REJECTED | FORWARDED)
- comments
- reviewedAt

---

## 10. ALLOCATION

Assignment of housing unit to staff.

### Fields:

- id
- applicationId (FK → HousingApplication)
- userId (FK → User)
- housingUnitId (FK → HousingUnit)
- status (PENDING | ACCEPTED | REJECTED | EXPIRED)
- allocatedAt
- respondedAt (nullable)

---

## 11. TENANCY AGREEMENT

Digital tenancy document.

### Fields:

- id
- occupancyId (FK → Occupancy)
- documentUrl
- signed (boolean)
- createdAt

---

## 12. COMPLAINT

Submitted by staff.

### Fields:

- id
- userId (FK → User)
- title
- description
- status (OPEN | IN_PROGRESS | RESOLVED)
- createdAt
- updatedAt

---

## 13. AUDIT LOG

Tracks all system activities.

### Fields:

- id
- userId (FK → User)
- action
- entityType
- entityId
- status (SUCCESS | FAILURE)
- metadata (JSON)
- createdAt

---

## 14. HOUSING EXIT REQUEST

Represents the **inspection-based exit workflow**.

---

### Core Fields:

- id
- userId (FK → User)
- housingUnitId (FK → HousingUnit)

---

### Exit Reason:

- reason (RETIREMENT | DEATH | RESIGNATION | RELOCATION | OTHER)
- customReason (nullable)

---

### Inspection Workflow (CORE)

Each stage is **independent and retryable**:

#### Housing Inspection

- housingInspectionStatus (PENDING | PASSED | FAILED)
- housingInspectedBy (FK → User, nullable)
- housingInspectionDate (nullable)

---

#### Electrical Inspection

- electricalInspectionStatus (PENDING | PASSED | FAILED)
- electricalInspectedBy (FK → User, nullable)
- electricalInspectionDate (nullable)

---

#### Estate Inspection

- estateInspectionStatus (PENDING | PASSED | FAILED)
- estateInspectedBy (FK → User, nullable)
- estateInspectionDate (nullable)

---

### Completion

- isCleared (boolean)
- clearedAt (nullable)
- clearanceCertificateUrl (nullable)

---

### Tracking

- submittedAt
- updatedAt

---

## 🔁 WORKFLOW RULES (IMPORTANT)

---

### Exit Workflow Logic

1. Housing inspection must be PASSED before Electrical is accessible
2. Electrical must be PASSED before Estate is accessible
3. Estate must be PASSED before clearance

---

### Completion Rule

```text
IF:
Housing = PASSED
AND Electrical = PASSED
AND Estate = PASSED

THEN:
isCleared = true
clearedAt = timestamp
generate clearance certificate
```

### System Actions on Clearance

- Mark Occupancy → EXITED
- Mark Housing Unit → VACANT
- Remove ALL BQ occupants
- Send email with clearance certificate
- Enable download from portal

## 15. 🔗 RELATIONSHIPS SUMMARY

- User → StaffProfile (1:1)
- User → Applications (1:N)
- User → Occupancy (1:N)
- User → ExitRequests (1:N)
- HousingType → HousingUnits (1:N)
- HousingUnit → BQs (1:N)
- HousingUnit → Occupancy (1:N)
- BQ → BQOccupants (1:N)
- Application → Reviews (1:N)
- Application → Allocation (1:1)

## 16. DESIGN PRINCIPLES

- BQ is a sub-entity, not independent housing
- Exit is inspection-driven, not approval-driven
- Workflows are state-based
- System is audit-friendly
- Data model is Prisma-ready
