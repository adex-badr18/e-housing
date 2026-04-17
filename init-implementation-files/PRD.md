# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Staff Housing Allocation & Management System
### Obafemi Awolowo University (OAU)

---

## 1. INTRODUCTION

The Staff Housing Allocation & Management System is a centralized web-based platform designed to digitize and automate the management of staff housing within Obafemi Awolowo University (OAU).

The system will:
- Replace manual housing records
- Automate allocation and tenancy processes
- Enforce institutional housing policies
- Provide transparency and real-time tracking

The system must also support **hierarchical housing structures**, where:
- A main housing unit may contain one or more **Boys Quarters (BQ)**
- Each BQ can have its own occupant and lifecycle

---

# 1.1 Objectives

The system aims to:

- Digitize all housing and tenancy records
- Automate housing allocation workflows
- Enforce institutional housing policies and approval workflows
- Track occupancy at both:
  - Main housing unit level
  - Boys Quarters (BQ) level
- Ensure only verified institutional staff can access the system
- Improve reporting, transparency, and operational efficiency
- Provide self-service capabilities for staff
- Ensure accountability through audit logging

### 1.2 Purpose

This system is designed to digitize and streamline the process of:

- Staff housing application
- Housing allocation
- Occupancy management
- Boys Quarters (BQ) management
- Institutional approval workflows

---

## 2. USER TYPES

### 2.1 Staff (Applicants)
- Academic and non-academic staff
- Apply for housing
- Manage personal housing-related activities

---

### 2.2 Management Users

#### SUPER ADMIN
- Full system control
- Creates and manages all management users

#### HOUSING SECRETARY
- Reviews applications (Stage 1)
- Scores applications
- Manages all housing types, housing units, occupants, and BQs
- Reviews exit/vacation applications (Stage 1)
- Generates reports on housing allocation and occupancy

#### ESTATE OFFICER
- Reviews scored applications (Stage 2)
- Validates housing conditions
- Reviews exit/vacation applications (Stage 3)
- Manages all housing types, housing units, occupants, and BQs
- Generates reports on housing allocation and occupancy

#### ELECTRICAL OFFICER
- Reviews exit/vacation applications (Stage 2)

#### DVC ADMIN
- Final approval authority (Stage 3)
- Generates reports on housing allocation and occupancy

---

## 3. CORE FEATURES

---

## 3.1 Authentication & Access Control

### Staff Authentication
- Login via **Google OAuth only**
- Must use institutional email (e.g., *@oauife.edu.ng)

---

### Management User Authentication
- Accounts created by SUPER ADMIN
- Login via email & password or Google OAuth

---

### Password Rules (Management Users)
- System generates default password
- Must change password on first login
- Can reset password via email

---

## 3.2 Staff Capabilities

---

### Profile Management
Staff can:
- Complete and update personal and employment details

---

### Housing Application

Staff can:
- Submit housing application
- Apply for change of accommodation, selecting their preferred housing types

---

### Application Tracking

Staff can:
- View application status
- Track review progress:
  - Housing Unit stage
  - Estate Unit stage
  - DVC Admin decision

---

### BQ (Boys Quarters) Management

If allocated a house with BQ:

Staff can:
- View BQ details
- Add/update BQ occupant information

---

### Complaint System

Staff can:
- Submit complaints related to:
  - Housing condition
  - Facilities
  - Allocation issues

- Track complaint status

---

## 3.3 Management User Capabilities

All management users can:

- Manage and review applications
- View all house occupants
- Track application progress

---

### SUPER ADMIN
- Create and manage management users
- Create and manage housing types
- Full system access

---

### HOUSING SECRETARY
- View all new applications
- Review and score applications (Stage 1)

---

### ESTATE OFFICER
- View only scored applications
- Review scored applications (Stage 2)

---

### DVC ADMIN
- View only applications that have been scored by the Housing Secretary and reviewed by the Estate Officer
- Final approval authority

---

## 3.4 Housing Management

---

### Housing Types

Each housing type includes:

- Classification (Senior / Junior)
- Structural features:
  - Bedrooms
  - Bathrooms
  - Toilets
  - Study room
- Amenities:
  - Parking
  - Boys Quarters (BQ)
  - Courtyard
- Building type (Bungalow / Storey)
- Allocation points
- Annual rent

---

### Housing Units

- Each unit belongs to a housing type
- Can contain one or more BQs (if applicable)

---

## 3.5 Application Review Workflow

---

### Multi-Stage Review Process

#### Stage 1: Housing Unit
- Housing Secretary reviews application
- Assigns score (points)

---

#### Stage 2: Estate Unit
- Verifies housing-related conditions

---

#### Stage 3: DVC Admin
- Final approval or rejection

---

### Rules

- Reviews must follow strict order
- No stage can be skipped
- Only DVC Admin can finalize decision
- The staff receives an e-mail notification after the final decision

---

## 3.6 Occupancy Management

System tracks:

- Main house occupant (staff)
- BQ occupants

---

## 3.7 Tenancy Management

- Digital tenancy agreement
- Rent defined annually per housing type

---

## 3.8 Complaint Management

- Staff submits complaints
- Management reviews and resolves
- Management can send an e-mail notification to the staff

---

## 3.9 Audit Logging

System logs all actions:

- User creation
- Login activities
- Application reviews
- BQ requests
- Data updates

Each log includes:
- User
- Action performed
- Timestamp
- Status (success/failure)

---

## 3.10 Housing Exit (Vacation) Feature (FINAL)

---

### Overview

The system must support a structured **inspection-based housing exit process**. This process ensures that all required inspections are completed and passed before a staff member can vacate a house.

---

### Workflow

#### Step 1: Exit Application Submission
- Staff submits an exit application
- Provides:
  - Reason for exit: Retirement, Death, Resignation, Relocation to a personal residence, Other valid reasons (custom)
  - Additional notes (optional)

---

#### Step 2: Housing Unit Inspection
- Housing Office receives application
- Conducts inspection (rent, water, property condition)

**Outcome:**
- PASS → proceeds to next stage  
- FAIL → remains pending until re-inspected and passed  

---

#### Step 3: Electrical/Power Unit Inspection
- This department only sees applications after Housing Unit PASS
- Electrical Unit inspects Electrical fittings and power infrastructure

**Outcome:**
- PASS → proceeds to next stage  
- FAIL → must be corrected and re-inspected  

---

#### Step 4: Estate Office Inspection
- This office only sees applications that has passed both Housing and Electrical inspections
- Estate Officer conducts final inspection

**Outcome:**
- PASS → eligible for clearance certificate  
- FAIL → must be corrected and re-inspected  

---

### Final Outcome

Once ALL inspections are PASSED:

- System will:
  - Send an e-mail notification to the staff with clearance certificate attached
  - Mark occupancy as EXITED
  - Mark housing unit as VACANT
  - Remove all BQ occupants
- Staff can also:
  - Print their **Clearance Certificate** from their portal.

---

### Key Characteristics

- No rejection state — only PASS / FAIL per inspection
- Failed inspections can be reattempted
- Workflow is **state-driven, not approval-driven**
- PENDING state shows that the current stage is yet to be inspected

---

### Staff Capabilities

- Submit exit application  
- Track inspection statuses (Housing, Electrical, Estate)  
- Receives e-mail notification with clearance certificate attached after full completion
- Clearance certificate can also be printed from their portal. 

---

### Constraint

Exit is ONLY complete when:
- Housing inspection = PASSED  
- Electrical inspection = PASSED  
- Estate inspection = PASSED  

---

## 4. BUSINESS RULES

- Only institutional email allowed for staff
- Staff cannot bypass approval workflows
- Housing allocation must follow scoring and approval process
- Only authorized roles can perform review actions

---

## 5. NON-FUNCTIONAL REQUIREMENTS

### Security
- Secure authentication
- Role-based access control
- Data validation

---

### Performance
- Fast page load times
- Efficient database queries

---

### Usability
- Simple and intuitive interface
- E-mail notifications for all important actions
- Clear workflow visibility

---

### Scalability
- Support large number of users and housing records

---

## 6. SUCCESS METRICS

- Reduced application processing time
- Increased transparency in allocation
- Accurate housing occupancy records
- Improved staff satisfaction

---

## 7. FUTURE ENHANCEMENTS

- Automated allocation suggestions
- AI-based allocation scoring



















# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Staff Housing Allocation & Management System (OAU)

---

# 1. Project Overview

The Staff Housing Allocation & Management System is a centralized web-based platform designed to digitize and automate the management of staff housing within Obafemi Awolowo University (OAU).

The system will:
- Replace manual housing records
- Automate allocation and tenancy processes
- Enforce institutional housing policies
- Provide transparency and real-time tracking

The system must also support **hierarchical housing structures**, where:
- A main housing unit may contain one or more **Boys Quarters (BQ)**
- Each BQ can have its own occupant and lifecycle

---

# 2. Objectives

The system aims to:

- Digitize all housing and tenancy records
- Automate housing allocation workflows
- Enforce institutional housing policies
- Track occupancy at both:
  - Main housing unit level
  - Boys Quarters (BQ) level
- Ensure only verified institutional staff can access the system
- Improve reporting, transparency, and operational efficiency

---

# 3. Key Stakeholders

| Stakeholder | Role |
|------------|------|
| Housing Department | Manages housing allocation and policies |
| University Staff | Apply for and occupy housing |
| INTECU | Develops and maintains the system |
| University Management | Uses reports for decision-making |

---

# 4. System Users & Roles

## 4.1 Admin
- Manages system configuration
- Creates and manages users
- Assigns roles and permissions

## 4.2 Housing Secretary
- Reviews applications
- Allocates housing units
- Manages occupancy and clearance

## 4.3 Staff (Occupant)
- Applies for housing
- Accepts or rejects allocations
- Occupies housing or BQs
- Updates profile and downloads documents

---

# 5. Core Features

## 5.1 Authentication & Institutional Access Control

- The system must require all users to register using their **official institutional email address** (e.g., `@oauife.edu.ng`)
- The system must automatically reject any registration attempt using non-institutional email addresses
- Each email must be unique and tied to a single staff profile
- The system should support login, logout, and secure session handling
- Role-based access control must restrict users to only actions permitted by their role

---

## 5.2 Housing Management (Including Boys Quarters)

- The system must allow administrators to create and manage **main housing units**
- Each housing unit may have **one or more Boys Quarters (BQ)** attached to it
- Each BQ must be treated as an independent sub-unit with:
  - Its own occupancy status
  - Its own lifecycle (vacant or occupied)
- The system must allow the secretary to:
  - Add BQs under a housing unit
  - Update the status of both the main unit and BQs
- The system must clearly display the relationship between a main house and its BQs

---

## 5.3 Housing Application System

- Staff must be able to submit housing applications through the portal
- Each application must include:
  - Applicant details
  - Submission timestamp
- Housing secretary must be able to:
  - Review applications
  - Approve or reject applications
- The system must provide real-time status updates such as:
  - Pending
  - Approved
  - Rejected

---

## 5.4 Allocation Management System

- Housing secretary must be able to allocate **main housing units only** (not BQs) to staff
- The system must generate a digital allocation record for each assignment
- Staff must be able to:
  - Accept the allocation
  - Reject the allocation
- The system must:
  - Track acceptance status
  - Enforce deadlines for acceptance
  - Automatically flag or revoke allocations if no response is received within a defined period

---

## 5.5 Occupancy Management (Main Units & BQs)

- The system must track occupancy separately for:
  - Main housing units
  - Boys Quarters (BQ)
- Each occupancy record must include:
  - Occupant (staff)
  - Unit type (Main or BQ)
  - Check-in date
  - Check-out date
  - Current status
- The system must ensure:
  - A unit (house or BQ) cannot have more than one active occupant at a time
- The system must support:
  - Independent check-in and check-out processes for both main units and BQs

---

## 5.6 Tenancy Management & Policy Enforcement

- The system must digitize tenancy agreements and link them to occupants
- The system must enforce key policies such as:
  - Occupancy tied to employment status
  - Prohibition of subletting
  - Proper use of housing units
- The system must track violations and allow the secretary to record incidents

---

## 5.7 Rent Management

- The system must store rent details for each housing unit
- Rent must:
  - Begin from the check-in date
  - Be tracked per occupant
- The system must:
  - Record payment status
  - Apply penalty rent (e.g., 5× rate) for overstaying after retirement

---

## 5.8 Clearance & Exit Management

- The system must allow occupants to submit notice before vacating
- Housing secretarys must:
  - Schedule inspections
  - Record inspection results
- The system must:
  - Issue clearance certificates
  - Mark units (and BQs) as vacant after clearance

---

## 5.9 Document Management System

- The system must allow storage and retrieval of:
  - Allocation letters
  - Tenancy agreements
  - Clearance certificates
- Users must be able to securely download their documents

---

## 5.10 Notification System

- The system must send notifications for key events such as:
  - Application submission
  - Allocation decisions
  - Acceptance deadlines
  - Rent updates
  - Exit reminders
- Notifications should be available:
  - In-app
  - Via email (optional phase)

---

## 5.11 Search, Filter & Reporting

- The system must allow searching and filtering by:
  - Staff
  - Housing units
  - BQs
  - Occupancy status
- Reports must include:
  - Occupancy rates
  - Vacant units and BQs
  - Allocation trends
  - Policy violations

---

# 6. Functional Workflows

## 6.1 Housing Application Workflow

1. A staff member logs into the system using their institutional email.
2. The staff submits a housing application through the portal.
3. The system records the application with a timestamp and marks it as “Pending”.
4. A housing secretary reviews the application details.
5. The secretary either approves or rejects the application.
6. The system updates the application status and notifies the staff.

---

## 6.2 Allocation Workflow

1. A housing officer selects an approved applicant.
2. The officer assigns a main housing unit to the applicant.
3. The system generates a digital allocation record.
4. The staff receives a notification of the allocation.
5. The staff logs in and either:
   - Accepts the allocation, or
   - Rejects the allocation
6. If accepted:
   - The system proceeds to occupancy preparation
7. If no response is received within the deadline:
   - The system flags or revokes the allocation

---

## 6.3 Occupancy Workflow (Main Unit & BQ)

1. After accepting allocation, the staff proceeds to check-in.
2. The system records the check-in date for the main unit.
3. If the housing unit has BQs:
   - Each BQ can be assigned to an occupant separately
4. Each occupancy (main or BQ) is tracked independently.
5. The system ensures that:
   - No unit or BQ is double-occupied
6. During occupancy:
   - Status is marked as “Active”

---

## 6.4 Exit & Clearance Workflow

1. The occupant submits a notice of intention to vacate.
2. The system schedules an inspection.
3. A housing officer inspects the unit (or BQ).
4. The officer records the inspection result.
5. If conditions are met:
   - A clearance certificate is issued
6. The system updates:
   - Occupancy status → “Exited”
   - Unit/BQ status → “Vacant”

---

## 6.5 Retirement & Overstay Workflow

1. The system identifies when a staff member retires.
2. A 3-month countdown begins for vacating the property.
3. The system sends periodic reminders.
4. If the occupant remains after 3 months:
   - Penalty rent (5× rate) is applied
5. Continued occupancy is flagged for enforcement action

---

# 7. Non-Functional Requirements

## Performance
- Fast response times
- Real-time updates

## Security
- Institutional email enforcement
- Secure authentication
- Role-based access control

## Reliability
- High system uptime
- Regular data backups

## Scalability
- Ability to handle increasing users and housing data

## Usability
- Clean and intuitive interface
- Mobile-friendly design

---

# 8. Success Metrics

- 100% digital housing records
- Reduced allocation processing time
- Accurate occupancy tracking (including BQs)
- High user adoption rate
- Effective enforcement of housing policies

---

# 9. Conclusion

This system will transform housing management at OAU into a structured, transparent, and policy-driven digital platform.

By supporting:
- Hierarchical housing (main units + BQs)
- Independent occupancy tracking
- Institutional access control

the platform ensures both **operational efficiency** and **strict compliance with university housing regulations**.