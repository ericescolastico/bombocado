export interface AuditEvent {
  userId: string;
  event: string;
  entity?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, any>;
}

