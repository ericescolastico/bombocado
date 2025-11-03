export class AuditLogResponseDto {
  id: string;
  event: string;
  entity?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, any>;
  createdAt: Date;
}

export class AuditLogListResponseDto {
  data: AuditLogResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

