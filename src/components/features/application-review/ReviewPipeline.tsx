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
import { StageStepper }       from './StageStepper';
import { CompletedStageCard } from './CompletedStageCard';
import { HousingSecretaryPanel } from './HousingSecretaryPanel';
import { EstateOfficerPanel }    from './EstateOfficerPanel';
import { DVCAdminPanel }         from './DVCAdminPanel';
import { Lock, Eye, Clock } from 'lucide-react';

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

  // SUPER_ADMIN: read-only view of everything
  const isSuperAdmin = sessionRole === 'SUPER_ADMIN';

  // Is it this role's turn?
  // Estate Officer also gets a turn when the application is QUEUED (for re-activation)
  const isMyTurn = !isSuperAdmin && (
    (expectedStage === currentStage && !isRejected && !isApproved && !isQueued) ||
    (isQueued && sessionRole === 'ESTATE_OFFICER')
  );
  // Role has already acted (completed stage)
  const hasActed = expectedStage != null && isStageCompleted(expectedStage, currentStage) && !isQueued;
  // Role is waiting (stage not yet reached)
  const isWaiting = !isSuperAdmin && expectedStage != null && !isMyTurn && !hasActed && !isRejected && !isQueued;

  return (
    <div className="space-y-8">
      {/* Stage stepper */}
      <div className="px-4 py-6 rounded-2xl border bg-card shadow-sm">
        <StageStepper currentStage={isApproved || isCompleted ? 'COMPLETED' : currentStage} />
      </div>

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

      {/* Active review panel — only shown when it's this role's turn */}
      {isMyTurn && (
        <div className="rounded-2xl border-2 border-primary/20 bg-card shadow-md overflow-hidden">
          <div className={`px-5 py-3.5 flex items-center gap-2 ${isQueued ? 'bg-amber-500' : 'bg-primary'} text-white`}>
            <span className="text-sm font-semibold">
              {currentStage === 'HOUSING' && '📋 Stage 1 — Verification & Scoring'}
              {currentStage === 'ESTATE'  && !isQueued && '🏗️ Stage 2 — Physical Inspection & Unit Allocation'}
              {isQueued                   && '⏳ Stage 2 — Re-activate from Queue'}
              {currentStage === 'DVC'     && '👑 Stage 3 — Final Decision'}
            </span>
          </div>
          <div className="p-6">
            {currentStage === 'HOUSING' && (
              <HousingSecretaryPanel
                application={application}
                applicantUser={applicantUser}
                applicantProfile={applicantProfile}
              />
            )}
            {(currentStage === 'ESTATE' || isQueued) && sessionRole === 'ESTATE_OFFICER' && (
              <EstateOfficerPanel
                application={application}
                pointsBreakdown={application.pointsBreakdown ?? null}
              />
            )}
            {currentStage === 'DVC' && (
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
      {hasActed && !isRejected && !isApproved && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          <span>✓</span>
          <p>You have already completed your review for this application. It has moved to the next stage.</p>
        </div>
      )}
    </div>
  );
}
