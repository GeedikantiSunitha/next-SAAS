/**
 * Admin Audit Log Service
 * 
 * Provides audit log viewing and filtering for admin dashboard
 */

import { prisma } from '../config/database';

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters: AuditLogFilters, adminUserId: string) => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 100);
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = { contains: filters.action, mode: 'insensitive' };
  }

  if (filters.resource) {
    where.resource = filters.resource;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  // Get logs and total count
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Log audit trail
  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'AUDIT_LOGS_VIEWED',
      resource: 'audit_logs',
      details: { filters },
    },
  });

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Export audit logs
 */
export const exportAuditLogs = async (filters: AuditLogFilters, format: 'csv' | 'json') => {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
  if (filters.resource) where.resource = filters.resource;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (format === 'csv') {
    const csv = [
      ['Date', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address', 'User Agent'].join(','),
      ...logs.map((log) =>
        [
          log.createdAt.toISOString(),
          log.user?.email || 'N/A',
          log.action,
          log.resource,
          log.resourceId || '',
          log.ipAddress || '',
          log.userAgent || '',
        ].join(',')
      ),
    ].join('\n');

    return csv;
  } else {
    return JSON.stringify(logs, null, 2);
  }
};

