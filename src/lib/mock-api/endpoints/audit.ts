// =============================================================================
// Mock API — Audit Log Endpoint
// =============================================================================

import { mockDB, AuditLog } from '../db';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

export async function getAllAuditLogs(): Promise<AuditLog[]> {
  await delay(300);
  return [...mockDB.auditLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAuditLogsByEntity(
  entityType: string,
  entityId: string
): Promise<AuditLog[]> {
  await delay(200);
  return mockDB.auditLogs
    .filter(l => l.entityType === entityType && l.entityId === entityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAuditLogsByActor(actorId: string): Promise<AuditLog[]> {
  await delay(200);
  return mockDB.auditLogs
    .filter(l => l.actorId === actorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function writeAuditEntry(
  entry: Omit<AuditLog, 'id' | 'createdAt'>
): Promise<AuditLog> {
  await delay(100);
  return mockDB.writeAuditLog(entry);
}
