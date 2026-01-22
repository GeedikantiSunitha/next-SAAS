/**
 * Privacy Center Service
 * Aggregates privacy-related data from multiple sources
 */

import { prisma } from '../config/database';
import { ConsentType, PrivacyPreferences } from '@prisma/client';

// Simple in-memory cache (in production, use Redis)
const cacheStore = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cache = {
  get(key: string) {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      cacheStore.delete(key);
      return null;
    }
    return entry.data;
  },
  set(key: string, value: any, ttl: number = CACHE_TTL) {
    cacheStore.set(key, {
      data: value,
      expiry: Date.now() + ttl,
    });
  },
  delete(key: string) {
    return cacheStore.delete(key);
  },
  clear() {
    cacheStore.clear();
  },
  has(key: string) {
    const entry = cacheStore.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiry) {
      cacheStore.delete(key);
      return false;
    }
    return true;
  },
};

interface PrivacyOverview {
  user: {
    id: string;
    email: string;
    createdAt: Date;
    dataRetentionDays: number;
  };
  dataCategories: Array<{
    category: string;
    description: string;
    count: number;
    lastUpdated: Date;
  }>;
  consents: Array<{
    type: ConsentType;
    granted: boolean;
    version: string;
    grantedAt?: Date | null;
    expiresAt?: Date | null;
  }>;
  privacyPreferences: Partial<PrivacyPreferences>;
  dataRequests: {
    exports: Array<any>;
    deletions: Array<any>;
  };
  cookiePreferences: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  };
  connectedAccounts: Array<{
    provider: string;
    connectedAt: Date;
  }>;
  recentAccess: Array<{
    accessedBy: string;
    accessType: string;
    dataCategory: string;
    purpose: string;
    timestamp: Date;
  }>;
  metrics: {
    totalDataPoints: number;
    activeConsents: number;
    pendingRequests: number;
    daysUntilDeletion?: number | null;
  };
}

export async function getPrivacyOverview(userId: string): Promise<PrivacyOverview> {
  // Check cache first
  const cacheKey = `privacy:overview:${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Fetch or create privacy preferences
  let preferences = await prisma.privacyPreferences.findUnique({
    where: { userId },
  });

  if (!preferences) {
    preferences = await prisma.privacyPreferences.create({
      data: { userId },
    });
  }

  // Fetch consents
  const consents = await prisma.consentRecord.findMany({
    where: { userId },
    include: { consentVersion: true },
  });

  // Fetch data export requests
  const exports = await prisma.dataExportRequest.findMany({
    where: { userId },
    orderBy: { requestedAt: 'desc' },
    take: 5,
  });

  // Fetch data deletion requests
  const deletions = await prisma.dataDeletionRequest.findMany({
    where: { userId },
    orderBy: { requestedAt: 'desc' },
    take: 5,
  });

  // Cookie consent - in production, this would come from a real model
  // For now, using default values
  const cookieConsent = null;

  // Fetch recent access logs
  const accessLogs = await prisma.dataAccessLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 10,
  });

  // Get data categories with counts
  const dataCategories = await getDataCategories(userId);

  // Calculate metrics
  const activeConsents = consents.filter((c: any) => c.granted).length;
  const pendingExports = exports.filter(e => e.status === 'PENDING').length;
  const pendingDeletions = deletions.filter(d => d.status === 'PENDING').length;
  const pendingRequests = pendingExports + pendingDeletions;

  const scheduledDeletion = deletions.find(d => d.status === 'PENDING');
  const daysUntilDeletion = scheduledDeletion?.scheduledFor
    ? Math.ceil((scheduledDeletion.scheduledFor.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const overview: PrivacyOverview = {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      dataRetentionDays: 365, // Default retention period
    },
    dataCategories: dataCategories.map(cat => ({
      ...cat,
      lastUpdated: new Date(), // In production, track actual update times
    })),
    consents: consents.map((c: any) => ({
      type: c.consentType,
      granted: c.granted,
      version: c.consentVersion?.version || c.version || 'unknown',
      grantedAt: c.grantedAt,
      expiresAt: c.expiresAt,
    })),
    privacyPreferences: {
      emailMarketing: preferences.emailMarketing,
      smsMarketing: preferences.smsMarketing,
      pushNotifications: preferences.pushNotifications,
      shareWithPartners: preferences.shareWithPartners,
      profileVisibility: preferences.profileVisibility,
    },
    dataRequests: {
      exports: exports.map(e => ({
        id: e.id,
        status: e.status,
        requestedAt: e.requestedAt,
        completedAt: e.completedAt,
        downloadUrl: e.status === 'COMPLETED' ? `/api/gdpr/export/download/${e.id}` : null,
      })),
      deletions: deletions.map(d => ({
        id: d.id,
        status: d.status,
        requestedAt: d.requestedAt,
        scheduledFor: d.scheduledFor,
      })),
    },
    cookiePreferences: cookieConsent || {
      essential: true,
      analytics: false,
      marketing: false,
      functional: true,
    },
    connectedAccounts: [], // Would fetch from OAuth table in production
    recentAccess: accessLogs.map(log => ({
      accessedBy: log.accessedBy,
      accessType: log.accessType,
      dataCategory: log.dataCategory,
      purpose: log.purpose,
      timestamp: log.timestamp,
    })),
    metrics: {
      totalDataPoints: dataCategories.reduce((sum, cat) => sum + cat.count, 0),
      activeConsents,
      pendingRequests,
      daysUntilDeletion,
    },
  };

  // Cache the result
  cache.set(cacheKey, overview);

  return overview;
}

export async function getDataCategories(userId: string) {
  // In production, these counts would come from actual data queries
  const [profileCount, ordersCount, usageCount, preferencesCount] = await Promise.all([
    prisma.user.count({ where: { id: userId } }),
    prisma.user.count({ where: { id: userId } }), // Would be orders count
    prisma.user.count({ where: { id: userId } }), // Would be usage count
    prisma.privacyPreferences.count({ where: { userId } }),
  ]);

  return [
    {
      category: 'PROFILE',
      description: 'Personal profile information',
      fields: ['name', 'email', 'phone', 'address', 'date_of_birth'],
      purpose: 'Account management and communication',
      retention: '365 days after account closure',
      count: profileCount * 15, // Mock multiplier for demo
    },
    {
      category: 'ORDERS',
      description: 'Order history and transactions',
      fields: ['order_id', 'products', 'amounts', 'payment_methods'],
      purpose: 'Order processing and customer service',
      retention: '7 years for tax purposes',
      count: ordersCount * 23, // Mock multiplier for demo
    },
    {
      category: 'USAGE',
      description: 'Application usage data',
      fields: ['login_times', 'feature_usage', 'preferences', 'device_info'],
      purpose: 'Product improvement and personalization',
      retention: '180 days',
      count: usageCount * 125, // Mock multiplier for demo
    },
    {
      category: 'PREFERENCES',
      description: 'User preferences and settings',
      fields: ['language', 'theme', 'notifications', 'privacy_settings'],
      purpose: 'Personalization and user experience',
      retention: 'Until changed or account deleted',
      count: preferencesCount * 82, // Mock multiplier for demo
    },
  ];
}

interface AccessLogFilters {
  page?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
  accessType?: string;
}

export async function getDataAccessLog(userId: string, filters: AccessLogFilters = {}) {
  const {
    page = 1,
    pageSize = 10,
    startDate,
    endDate,
    accessType
  } = filters;

  const where: any = { userId };

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  if (accessType) {
    where.accessType = accessType;
  }

  const [entries, total] = await Promise.all([
    prisma.dataAccessLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dataAccessLog.count({ where }),
  ]);

  return {
    entries,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getPrivacyMetrics(userId: string) {
  // Get data counts
  const dataCategories = await getDataCategories(userId);
  const totalDataPoints = dataCategories.reduce((sum, cat) => sum + cat.count, 0);

  // Get consent metrics
  const consents = await prisma.consentRecord.findMany({
    where: { userId },
  });

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const consentMetrics = {
    total: consents.length,
    granted: consents.filter((c: any) => c.granted).length,
    revoked: consents.filter((c: any) => !c.granted).length,
    expiringSoon: consents.filter((c: any) =>
      c.expiresAt && c.expiresAt <= thirtyDaysFromNow && c.expiresAt > now
    ).length,
  };

  // Get request metrics
  const [exports, deletions] = await Promise.all([
    prisma.dataExportRequest.findMany({ where: { userId } }),
    prisma.dataDeletionRequest.findMany({ where: { userId } }),
  ]);

  const requestMetrics = {
    totalExports: exports.length,
    totalDeletions: deletions.length,
    pendingExports: exports.filter(e => e.status === 'PENDING').length,
    pendingDeletions: deletions.filter(d => d.status === 'PENDING').length,
  };

  // Get privacy preferences
  const preferences = await prisma.privacyPreferences.findUnique({
    where: { userId },
  });

  // Calculate retention info
  const pendingDeletion = deletions.find(d => d.status === 'PENDING');
  const daysUntilDeletion = pendingDeletion?.scheduledFor
    ? Math.ceil((pendingDeletion.scheduledFor.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    dataCollection: {
      totalDataPoints,
      byCategory: dataCategories.reduce((acc, cat) => {
        acc[cat.category] = cat.count;
        return acc;
      }, {} as Record<string, number>),
      lastUpdated: new Date(),
    },
    consents: consentMetrics,
    requests: requestMetrics,
    privacy: {
      profileVisibility: preferences?.profileVisibility || 'PRIVATE',
      dataSharing: preferences?.shareWithPartners || false,
      marketingOptOut: !preferences?.emailMarketing,
    },
    retention: {
      daysUntilDeletion,
      scheduledDeletionDate: pendingDeletion?.scheduledFor || null,
      dataRetentionPeriod: 365,
    },
  };
}

interface UpdateOptions {
  logChange?: boolean;
}

export async function updatePrivacyPreferences(
  userId: string,
  updates: Partial<PrivacyPreferences>,
  options: UpdateOptions = {}
) {
  // Validate profile visibility if provided
  if (updates.profileVisibility) {
    const validVisibilities = ['PRIVATE', 'FRIENDS', 'PUBLIC'];
    if (!validVisibilities.includes(updates.profileVisibility)) {
      throw new Error('Invalid profile visibility value');
    }
  }

  // Get current preferences for comparison (if logging)
  let oldPreferences;
  if (options.logChange) {
    oldPreferences = await prisma.privacyPreferences.findUnique({
      where: { userId },
    });
  }

  // Update preferences
  const updated = await prisma.privacyPreferences.upsert({
    where: { userId },
    update: updates,
    create: {
      userId,
      ...updates,
    },
  });

  // Log the change if requested
  if (options.logChange) {
    const changes: string[] = [];
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = oldPreferences?.[key as keyof PrivacyPreferences];
      if (oldValue !== value) {
        changes.push(`${key}: ${oldValue} → ${value}`);
      }
    }

    if (changes.length > 0) {
      await prisma.dataAccessLog.create({
        data: {
          userId,
          accessedBy: userId, // User updating their own preferences
          accessType: 'UPDATE',
          dataCategory: 'PREFERENCES',
          purpose: `Privacy preference update: ${changes.join(', ')}`,
        },
      });
    }
  }

  // Clear cache
  clearUserCache(userId);

  return updated;
}

export async function clearUserCache(userId: string): Promise<boolean> {
  const keys = [
    `privacy:overview:${userId}`,
    `privacy:metrics:${userId}`,
    `privacy:categories:${userId}`,
  ];

  keys.forEach(key => cache.delete(key));
  return true;
}

// Export cache for testing
export { cache };