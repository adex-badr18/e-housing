'use client';

// =============================================================================
// QuitRequestsPanel — Re-exports / renders WithdrawalRequestsTable
// =============================================================================

import { WithdrawalRequestsTable } from './WithdrawalRequestsTable';
import type { EnrichedQuitRequest } from '@/lib/mock-api/endpoints/applications';

export interface QuitRequestsPanelProps {
  requests: EnrichedQuitRequest[];
  hideIfEmpty?: boolean;
}

export function QuitRequestsPanel({ requests, hideIfEmpty = true }: QuitRequestsPanelProps) {
  return <WithdrawalRequestsTable requests={requests} hideIfEmpty={hideIfEmpty} />;
}

export { WithdrawalRequestsTable };
