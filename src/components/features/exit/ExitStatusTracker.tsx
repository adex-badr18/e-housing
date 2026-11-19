'use client';

// =============================================================================
// ExitStatusTracker — Backward compatibility wrapper
// =============================================================================
// @deprecated Use ExitNoticeReadOnlyView directly.
// Retained to prevent breaking existing imports across historical pages.
// =============================================================================

export {
  ExitNoticeReadOnlyView as ExitStatusTracker,
  type ExitNoticeReadOnlyViewProps as ExitStatusTrackerProps,
} from './ExitNoticeReadOnlyView';
