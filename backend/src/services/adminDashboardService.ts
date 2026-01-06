/**
 * Admin Dashboard Service
 * 
 * Provides dashboard statistics for admin panel
 */

import { prisma } from '../config/database';
import logger from '../utils/logger';
import axios from 'axios';
import config from '../config';

export interface DashboardStats {
  totalUsers: number;
  activeSessions: number;
  recentActivity: Array<{
    id: string;
    userId: string | null;
    action: string;
    resource: string | null;
    resourceId: string | null;
    createdAt: Date;
    details?: any;
  }>;
  systemHealth: {
    status: string;
    timestamp: string;
    database: string;
    uptime?: number;
    email?: {
      configured: boolean;
      fromEmail: string;
    };
    memory?: {
      used: number;
      total: number;
    };
  };
}

/**
 * Get dashboard statistics
 * 
 * Returns:
 * - Total users count
 * - Active sessions count
 * - Recent activity (last 10 audit log entries)
 * - System health status
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get active sessions count (where expiresAt > now)
    const activeSessions = await prisma.session.count({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Get recent activity (last 10 audit log entries, ordered by createdAt desc)
    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        action: true,
        resource: true,
        resourceId: true,
        createdAt: true,
        details: true,
      },
    });

    // Get system health from health check endpoint
    let systemHealth: DashboardStats['systemHealth'];
    try {
      const healthUrl = `${config.frontendUrl.replace(':3000', ':3001')}/api/health`;
      const response = await axios.get(healthUrl, { timeout: 5000 });
      systemHealth = {
        status: response.data.status || 'unknown',
        timestamp: response.data.timestamp || new Date().toISOString(),
        database: response.data.database || 'unknown',
        uptime: response.data.uptime,
        email: response.data.email,
        memory: response.data.memory,
      };
    } catch (error: any) {
      // If health check fails, provide basic health info
      logger.warn('Failed to fetch system health', { error: error.message });
      
      // Check database connection directly
      let dbStatus = 'unknown';
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'healthy';
      } catch (dbError) {
        dbStatus = 'unhealthy';
      }

      systemHealth = {
        status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: dbStatus,
      };
    }

    return {
      totalUsers,
      activeSessions,
      recentActivity,
      systemHealth,
    };
  } catch (error: any) {
    logger.error('Error fetching dashboard stats', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};
