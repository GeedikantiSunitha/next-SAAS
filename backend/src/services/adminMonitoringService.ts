/**
 * Admin Monitoring Service
 * 
 * Provides system monitoring data for admin dashboard
 */

import { prisma } from '../config/database';
import { register } from '../middleware/metrics';
import promClient from 'prom-client';

/**
 * Get system metrics
 */
export const getSystemMetrics = async () => {
  // Get Prometheus metrics
  const metrics = await register.getMetricsAsJSON();

  // Extract key metrics
  const httpRequestTotal = metrics.find((m: any) => m.name === 'http_requests_total');
  const httpRequestErrors = metrics.find((m: any) => m.name === 'http_request_errors_total');
  const httpRequestDuration = metrics.find((m: any) => m.name === 'http_request_duration_seconds');

  // Calculate totals
  let totalRequests = 0;
  let totalErrors = 0;
  let avgLatency = 0;

  if (httpRequestTotal) {
    totalRequests = httpRequestTotal.values?.reduce((sum: number, v: any) => sum + v.value, 0) || 0;
  }

  if (httpRequestErrors) {
    totalErrors = httpRequestErrors.values?.reduce((sum: number, v: any) => sum + v.value, 0) || 0;
  }

  if (httpRequestDuration) {
    const durations = httpRequestDuration.values?.map((v: any) => v.value) || [];
    avgLatency = durations.length > 0
      ? durations.reduce((sum: number, v: number) => sum + v, 0) / durations.length
      : 0;
  }

  // Get database stats
  const userCount = await prisma.user.count();
  const activeSessions = await prisma.session.count({
    where: {
      expiresAt: { gt: new Date() },
    },
  });

  return {
    requests: {
      total: totalRequests,
      errors: totalErrors,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      avgLatency: avgLatency * 1000, // Convert to ms
    },
    database: {
      totalUsers: userCount,
      activeSessions,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get database metrics
 */
export const getDatabaseMetrics = async () => {
  const [
    userCount,
    activeSessions,
    auditLogCount,
    notificationCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.session.count({
      where: { expiresAt: { gt: new Date() } },
    }),
    prisma.auditLog.count(),
    prisma.notification.count({
      where: { read: false },
    }),
  ]);

  return {
    users: {
      total: userCount,
      active: await prisma.user.count({ where: { isActive: true } }),
      inactive: await prisma.user.count({ where: { isActive: false } }),
    },
    sessions: {
      active: activeSessions,
      total: await prisma.session.count(),
    },
    auditLogs: {
      total: auditLogCount,
      last24h: await prisma.auditLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    },
    notifications: {
      unread: notificationCount,
      total: await prisma.notification.count(),
    },
  };
};

/**
 * Get API usage metrics
 */
export const getApiMetrics = async () => {
  const metrics = await register.getMetricsAsJSON();
  const httpRequestTotal = metrics.find((m: any) => m.name === 'http_requests_total');

  // Group by route
  const routeStats: Record<string, { count: number; errors: number }> = {};

  if (httpRequestTotal?.values) {
    httpRequestTotal.values.forEach((v: any) => {
      const route = v.labels?.route || 'unknown';
      const statusCode = parseInt(v.labels?.status_code || '200');
      const isError = statusCode >= 400;

      if (!routeStats[route]) {
        routeStats[route] = { count: 0, errors: 0 };
      }

      routeStats[route].count += v.value;
      if (isError) {
        routeStats[route].errors += v.value;
      }
    });
  }

  // Get top routes
  const topRoutes = Object.entries(routeStats)
    .map(([route, stats]) => ({
      route,
      requests: stats.count,
      errors: stats.errors,
      errorRate: stats.count > 0 ? (stats.errors / stats.count) * 100 : 0,
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  return {
    topRoutes,
    totalRoutes: Object.keys(routeStats).length,
  };
};

/**
 * Get recent errors
 */
export const getRecentErrors = async (limit: number = 50) => {
  const errors = await prisma.auditLog.findMany({
    where: {
      action: {
        in: ['LOGIN_FAILED', 'UNAUTHORIZED_ACCESS', 'VALIDATION_ERROR', 'ERROR'],
      },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      action: true,
      resource: true,
      resourceId: true,
      userId: true,
      ipAddress: true,
      userAgent: true,
      details: true,
      createdAt: true,
    },
  });

  return { errors };
};

