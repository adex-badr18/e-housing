// =============================================================================
// ReviewPipeline — Top-level orchestrator for the review screen
// =============================================================================
// Server-safe. Decides which panels to show based on role × stage,
// renders the StageStepper, completed stage cards, and the active panel.
// =============================================================================

import type {
  HousingApplication,
  ApplicationReview,
  ApplicationStage,
  Role,
  User,
  StaffProfile,
} from '@/lib/mock-api/db';
import { mockDB } from '@/lib/mock-api/db';
import { StageStepper }       from './StageStepper';
import { CompletedStageCard } from './CompletedStageCard';
import { HousingSecretaryPanel } from './HousingSecretaryPanel';
import { EstateOfficerPanel }    from './EstateOfficerPanel';
import { DVCAdminPanel }         from './DVCAdminPanel';
import { AdminTerminateButton }  from './AdminTerminateButton';
import { QuitRequestButton }     from './QuitRequestButton';
import { ApplicationDetailsCard } from './ApplicationDetailsCard';
import { Lock, Eye, Clock, AlertTriangle, XCircle, FileX2 } from 'lucide-react';
import { WithdrawalActionButtons } from './WithdrawalActionButtons';
import { QuitRequestHistorySection } from './QuitRequestHistorySection';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STAGE_ORDER: ApplicationStage[] = ['HOUSING', 'ESTATE', 'DVC', 'COMPLETED'];

function isStageCompleted(
  stageKey: Exclude<ApplicationStage, 'COMPLETED'>,
  currentStage: ApplicationStage
): boolean {
  return STAGE_ORDER.indexOf(currentStage) > STAGE_ORDER.indexOf(stageKey);
}

function isTerminal(stage: ApplicationStage): boolean {
  return stage === 'COMPLETED';
}

// ---------------------------------------------------------------------------
// Role → Stage mapping
// ---------------------------------------------------------------------------

const ROLE_STAGE_MAP: Partial<Record<Role, Exclude<ApplicationStage, 'COMPLETED'>>> = {
  HOUSING_SECRETARY: 'HOUSING',
  ESTATE_OFFICER:    'ESTATE',
  DVC_ADMIN:         'DVC',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReviewPipelineProps {
  application: HousingApplication;
  reviews: ApplicationReview[];
  applicantUser: User | null;
  applicantProfile: StaffProfile | null;
  sessionRole: Role;
  /** Map of userId → displayName for reviewer attribution */
  reviewerNames: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewPipeline({
  application,
  reviews,
  applicantUser,
  applicantProfile,
  sessionRole,
  reviewerNames,
}: ReviewPipelineProps) {
  const { currentStage, status } = application;
  const expectedStage = ROLE_STAGE_MAP[sessionRole];

  // Resolve housing type and allocated unit data for the details card
  const preferredTypes = application.preferredHousingTypeIds
    .map(id => mockDB.housingTypes.find(ht => ht.id === id))
    .filter((ht): ht is NonNullable<typeof ht> => ht != null);

  // Only show the final allocated unit once the DVC has approved the application
  const allocatedUnit = application.status === 'APPROVED' && application.allocatedUnitId
    ? mockDB.housingUnits.find(u => u.id === application.allocatedUnitId) ?? null
    : null;

  const secretarySuggestedUnit = application.secretarySuggestedUnitId
    ? mockDB.housingUnits.find(u => u.id === application.secretarySuggestedUnitId) ?? null
    : null;
  const secretarySuggestedType = secretarySuggestedUnit
    ? mockDB.housingTypes.find(ht => ht.id === secretarySuggestedUnit.housingTypeId) ?? null
    : null;

  const estateSuggestedUnit = application.estateSuggestedUnitId
    ? mockDB.housingUnits.find(u => u.id === application.estateSuggestedUnitId) ?? null
    : null;
  const estateSuggestedType = estateSuggestedUnit
    ? mockDB.housingTypes.find(ht => ht.id === estateSuggestedUnit.housingTypeId) ?? null
    : null;

  // ── Build completed-stage review list ──
  const completedReviews = (
    ['HOUSING', 'ESTATE', 'DVC'] as Exclude<ApplicationStage, 'COMPLETED'>[]
  )
    .filter(s => isStageCompleted(s, currentStage) || (status === 'REJECTED' && reviews.some(r => r.stage === s)))
    .map(s => reviews.find(r => r.stage === s))
    .filter(Boolean) as ApplicationReview[];

  // ── Determine access state ──
  const isRejected  = status === 'REJECTED';
  const isApproved  = status === 'APPROVED';
  const isCompleted = isTerminal(currentStage);
  const isQueued    = status === 'QUEUED';
  const isQuitRequested = status === 'QUIT_REQUESTED';
  const isWithdrawn = status === 'WITHDRAWN';
  const isTerminated = status === 'TERMINATED';
  const isTerminalStatus = isRejected || isApproved || isWithdrawn || isTerminated;
  const isSuperAdmin = sessionRole === 'SUPER_ADMIN';
  const isReturned = status === 'RETURNED';

  // Look up the active pending quit request for this application
  const pendingQuitRequest = mockDB.quitRequests.find(
    q => q.entityId === application.id && q.entityType === 'HousingApplication' && q.status === 'PENDING'
  ) ?? null;

  // All quit requests for this application (for history section), newest first
  const allQuitRequests = mockDB.quitRequests
    .filter(q => q.entityId === application.id && q.entityType === 'HousingApplication')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(q => ({
      ...q,
      // Resolve reviewer name — shown to management roles only
      reviewerName: q.reviewedById ? (() => {
        const u = mockDB.findUserById(q.reviewedById!);
        return u ? `${u.firstName} ${u.lastName}` : null;
      })() : null,
    }));

  // Management roles that can approve/reject withdrawal requests inline
  const isManagementRole = ['HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN', 'SUPER_ADMIN'].includes(sessionRole);

  // Is it this role's turn?
  // - Housing Secretary: active at HOUSING and ESTATE stages (extended edit window)
  // - Estate Officer & Housing Secretary also get a turn when application is RETURNED by DVC
  const isHousingSecretaryActive =
    sessionRole === 'HOUSING_SECRETARY' &&
    (currentStage === 'HOUSING' || currentStage === 'ESTATE') &&
    !isTerminalStatus && !isQueued && !isQuitRequested;

  const isMyTurn = !isSuperAdmin && (
    isHousingSecretaryActive ||
    (expectedStage === currentStage && sessionRole !== 'HOUSING_SECRETARY' && !isTerminalStatus && !isQueued && !isQuitRequested) ||
    (isQueued && sessionRole === 'ESTATE_OFFICER') ||
    (isReturned && (sessionRole === 'HOUSING_SECRETARY' || sessionRole === 'ESTATE_OFFICER'))
  );

  // Role has already acted (completed stage):
  // - Housing Secretary: only "done" once at DVC or COMPLETED (extended edit window)
  // - Other roles: done once their stage is surpassed
  const hasActed = (() => {
    if (expectedStage == null) return false;
    if (isQueued || isReturned) return false;
    if (sessionRole === 'HOUSING_SECRETARY') {
      // HS is locked out only at DVC or COMPLETED
      return currentStage === 'DVC' || currentStage === 'COMPLETED';
    }
    return isStageCompleted(expectedStage, currentStage);
  })();

  // Role is waiting (stage not yet reached)
  const isWaiting = !isSuperAdmin && expectedStage != null && !isMyTurn && !hasActed && !isTerminalStatus && !isQueued && !isQuitRequested && !isReturned;

  const canAdminTerminate = !isTerminalStatus && ['HOUSING_SECRETARY', 'ESTATE_OFFICER', 'DVC_ADMIN', 'SUPER_ADMIN'].includes(sessionRole);

  return (
    <div className="space-y-8">
      {/* Stage stepper */}
      <div className="px-4 py-6 rounded-2xl border bg-card shadow-sm">
        <StageStepper currentStage={isApproved || isCompleted ? 'COMPLETED' : currentStage} />
      </div>

      {/* Full application details */}
      <ApplicationDetailsCard
        application={application}
        applicantUser={applicantUser}
        applicantProfile={applicantProfile}
        preferredTypes={preferredTypes}
        allocatedUnit={allocatedUnit}
        secretarySuggestedUnit={secretarySuggestedUnit}
        secretarySuggestedType={secretarySuggestedType ?? undefined}
        estateSuggestedUnit={estateSuggestedUnit}
        estateSuggestedType={estateSuggestedType ?? undefined}
      />

      {/* Terminal state banners */}
      {isRejected && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
          <span className="text-lg">✗</span>
          <div>
            <p className="font-semibold text-sm">Application Rejected</p>
            <p className="text-xs mt-0.5">
              This application was rejected at the <strong>{currentStage}</strong> stage and is no longer active.
            </p>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
          <span className="text-lg">✓</span>
          <div>
            <p className="font-semibold text-sm">Application Approved</p>
            <p className="text-xs mt-0.5">DVC Admin has granted final approval. A housing unit allocation can now be assigned.</p>
          </div>
        </div>
      )}

      {isWithdrawn && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800">
          <FileX2 className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Application Withdrawn</p>
            <p className="text-xs mt-0.5">The applicant withdrew this application. It is no longer active.</p>
          </div>
        </div>
      )}

      {isTerminated && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-100 border border-red-300 text-red-900">
          <XCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Application Terminated</p>
            <p className="text-xs mt-0.5">This application was administratively terminated and is no longer active.</p>
          </div>
        </div>
      )}

      {isQuitRequested && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Withdrawal Requested</p>
              <p className="text-xs mt-0.5">
                The applicant has requested to withdraw this application. Pending review.
              </p>
            </div>
          </div>
          {isManagementRole && pendingQuitRequest && (
            <div className="mt-3 ml-8">
              <p className="text-xs text-orange-700 mb-1">
                <span className="font-semibold">Reason: </span>{pendingQuitRequest.reason}
              </p>
              <WithdrawalActionButtons quitRequestId={pendingQuitRequest.id} />
            </div>
          )}
        </div>
      )}

      {/* Queued banner — visible to all roles */}
      {isQueued && !isMyTurn && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <Clock className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Application Queued</p>
            <p className="text-xs mt-0.5">
              The Estate Officer placed this application in a waiting queue — no suitable unit was
              available at review time. It will be re-activated when a vacancy arises.
            </p>
          </div>
        </div>
      )}

      {/* Waiting banner (role's stage not yet unlocked) */}
      {isWaiting && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <Lock className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Not Your Stage Yet</p>
            <p className="text-xs mt-0.5">
              This application is currently at the <strong>{currentStage}</strong> stage. Your review will unlock once
              the preceding stage clears.
            </p>
          </div>
        </div>
      )}

      {/* Super Admin read-only notice */}
      {isSuperAdmin && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-primary">
          <Eye className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Super Admin — read-only view of the full review trail</p>
        </div>
      )}

      {/* Completed stage cards */}
      {completedReviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
            Completed Reviews
          </h3>
          {completedReviews.map(review => (
            <CompletedStageCard
              key={review.id}
              review={review}
              reviewerName={reviewerNames[review.reviewerId] ?? review.reviewerId}
            />
          ))}
        </div>
      )}

      {/* Active review panel — shown when it's this role's turn */}
      {isMyTurn && (
        <div className="rounded-2xl border-2 border-primary/20 bg-card shadow-md overflow-hidden">
          <div className={`px-5 py-3.5 flex items-center gap-2 ${isQueued || isReturned ? 'bg-amber-500' : 'bg-primary'} text-white`}>
            <span className="text-sm font-semibold">
              {/* Housing Secretary at HOUSING stage (initial review) */}
              {sessionRole === 'HOUSING_SECRETARY' && currentStage === 'HOUSING' && !isReturned && '📋 Stage 1 — Verification & Scoring'}
              {/* Housing Secretary at ESTATE stage (extended edit window) */}
              {sessionRole === 'HOUSING_SECRETARY' && currentStage === 'ESTATE' && !isReturned && '📋 Stage 1 — Verification & Scoring (Application with Estate Officer)'}
              {/* Estate Officer at ESTATE stage */}
              {sessionRole !== 'HOUSING_SECRETARY' && currentStage === 'ESTATE' && !isQueued && !isReturned && '🏗️ Stage 2 — Physical Inspection & Unit Allocation'}
              {isQueued                   && '⏳ Stage 2 — Re-activate from Queue'}
              {isReturned                 && '↩ Review & Modify Returned Application'}
              {currentStage === 'DVC'     && !isReturned && '👑 Stage 3 — Final Decision'}
            </span>
          </div>
          <div className="p-6">
            {(currentStage === 'HOUSING' || currentStage === 'ESTATE' || isReturned) && sessionRole === 'HOUSING_SECRETARY' && (
              <HousingSecretaryPanel
                application={application}
                applicantUser={applicantUser}
                applicantProfile={applicantProfile}
              />
            )}
            {(currentStage === 'ESTATE' || isQueued || isReturned) && sessionRole === 'ESTATE_OFFICER' && (
              <EstateOfficerPanel
                application={application}
                pointsBreakdown={application.pointsBreakdown ?? null}
              />
            )}
            {currentStage === 'DVC' && !isReturned && sessionRole === 'DVC_ADMIN' && (
              <DVCAdminPanel
                application={application}
                reviews={reviews}
                applicantUser={applicantUser}
                applicantProfile={applicantProfile}
                reviewerNames={reviewerNames}
              />
            )}
          </div>
        </div>
      )}

      {/* Already reviewed by this role */}
      {hasActed && !isTerminalStatus && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          <span>✓</span>
          <p>You have already completed your review for this application. It has moved to the next stage.</p>
        </div>
      )}

      {/* Staff withdrawal action panel */}
      {sessionRole === 'STAFF' && !isTerminalStatus && (
        <div className="pt-6 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-sm">Withdraw Application</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isQuitRequested
                ? 'Your withdrawal request is pending management review.'
                : 'You may request to withdraw this housing application at any time prior to approval.'}
            </p>
          </div>
          <QuitRequestButton
            entityId={application.id}
            entityType="HousingApplication"
            hasPendingRequest={isQuitRequested}
          />
        </div>
      )}
      
      {/* Admin termination controls */}
      {canAdminTerminate && (
        <div className="pt-6 border-t flex justify-end">
          <AdminTerminateButton entityId={application.id} entityType="HousingApplication" />
        </div>
      )}

      {/* Withdrawal request history — visible to all roles */}
      {allQuitRequests.length > 0 && (
        <QuitRequestHistorySection
          requests={allQuitRequests}
          isManagement={isManagementRole}
        />
      )}
    </div>
  );
}
