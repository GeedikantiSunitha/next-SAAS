/**
 * Security Incident Service
 *
 * GDPR breach notification system (Article 33 & 34)
 * - Report and track security incidents
 * - Notify affected users
 * - Report to ICO within 72 hours
 */

import { PrismaClient, IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';
import { sendEmail } from './emailService';
import logger from '../utils/logger';

// Allow prisma to be injected for testing
let prismaInstance: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export function setPrismaInstance(instance: PrismaClient): void {
  prismaInstance = instance;
}

interface ReportIncidentData {
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  affectedDataTypes: string[];
  affectedUserCount: number;
  detectedAt: Date;
  reportedBy?: string;
}

interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  requiresICONotification: boolean;
  reasoning?: string;
}

/**
 * Report a new security incident
 */
export async function reportIncident(data: ReportIncidentData) {
  const prisma = getPrisma();

  // Assess risk level and determine if ICO notification is required
  const riskAssessment = assessRisk({
    type: data.type,
    severity: data.severity,
    affectedDataTypes: data.affectedDataTypes,
    affectedUserCount: data.affectedUserCount,
  });

  // Create incident record
  const incident = await prisma.securityIncident.create({
    data: {
      type: data.type,
      severity: data.severity,
      title: data.title,
      description: data.description,
      affectedDataTypes: data.affectedDataTypes,
      affectedUserCount: data.affectedUserCount,
      detectedAt: data.detectedAt,
      reportedBy: data.reportedBy,
      riskLevel: riskAssessment.level,
      riskAssessment: riskAssessment.reasoning,
      icoNotificationRequired: riskAssessment.requiresICONotification,
      status: IncidentStatus.REPORTED,
    },
  });

  // Send alert to admins
  await alertAdmins(incident);

  logger.info('Security incident reported', {
    incidentId: incident.id,
    type: incident.type,
    severity: incident.severity,
    icoNotificationRequired: incident.icoNotificationRequired,
  });

  return incident;
}

/**
 * Update incident status and details
 */
export async function updateIncidentStatus(
  incidentId: string,
  updates: {
    status?: IncidentStatus;
    containedAt?: Date;
    resolvedAt?: Date;
    remediationSteps?: string;
    lessonsLearned?: string;
  }
) {
  const prisma = getPrisma();

  const incident = await prisma.securityIncident.update({
    where: { id: incidentId },
    data: updates,
  });

  logger.info('Security incident status updated', {
    incidentId,
    status: incident.status,
  });

  return incident;
}

/**
 * Notify affected users about the breach
 */
export async function notifyAffectedUsers(incidentId: string, userIds: string[]) {
  const prisma = getPrisma();

  // Get incident details
  const incident = await prisma.securityIncident.findUnique({
    where: { id: incidentId },
  });

  if (!incident) {
    throw new Error('Incident not found');
  }

  // Get affected users
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });

  const notifications = [];
  const failures = [];
  let notificationsSent = 0;

  // Send notification to each user
  for (const user of users) {
    try {
      await sendEmail({
        to: user.email,
        subject: `Security Incident Notification: ${incident.title}`,
        html: `
          <h1>Security Incident Notification</h1>
          <p>Dear ${user.name || 'User'},</p>
          <p>We are writing to inform you about a security incident that may have affected your data.</p>
          <h2>${incident.title}</h2>
          <p>${incident.description}</p>
          <p><strong>Affected Data Types:</strong> ${incident.affectedDataTypes.join(', ')}</p>
          <p><strong>Detected At:</strong> ${incident.detectedAt.toISOString()}</p>
          <p>We take your privacy and security seriously. If you have any questions or concerns, please contact us at ${process.env.SUPPORT_EMAIL || 'support@example.com'}.</p>
        `,
      });

      notifications.push({
        incidentId,
        userId: user.id,
        email: user.email,
        subject: `Security Incident Notification: ${incident.title}`,
        deliveryStatus: 'sent',
      });

      notificationsSent++;
    } catch (error: any) {
      logger.error('Failed to send breach notification', {
        userId: user.id,
        email: user.email,
        error: error.message,
      });

      failures.push({
        userId: user.id,
        email: user.email,
        error: error.message,
      });
    }
  }

  // Record notifications in database
  if (notifications.length > 0) {
    await prisma.breachNotification.createMany({
      data: notifications,
    });
  }

  // Update incident with notification timestamp
  await prisma.securityIncident.update({
    where: { id: incidentId },
    data: { usersNotifiedAt: new Date() },
  });

  logger.info('Breach notifications sent', {
    incidentId,
    notificationsSent,
    failures: failures.length,
  });

  return {
    notificationsSent,
    failures: failures.length > 0 ? failures : undefined,
  };
}

/**
 * Report incident to ICO (Information Commissioner's Office)
 */
export async function reportToICO(incidentId: string, icoReferenceNumber: string) {
  const prisma = getPrisma();

  const incident = await prisma.securityIncident.update({
    where: { id: incidentId },
    data: {
      icoNotifiedAt: new Date(),
      icoReferenceNumber,
    },
  });

  logger.info('Incident reported to ICO', {
    incidentId,
    icoReferenceNumber,
  });

  return incident;
}

/**
 * Calculate 72-hour deadline for ICO notification
 */
export function get72HourDeadline(detectedAt: Date): Date {
  const deadline = new Date(detectedAt);
  deadline.setHours(deadline.getHours() + 72);
  return deadline;
}

/**
 * Assess risk level of incident
 */
export function assessRisk(incident: {
  type: IncidentType;
  severity: IncidentSeverity;
  affectedDataTypes: string[];
  affectedUserCount: number;
}): RiskAssessment {
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let requiresICONotification = false;
  const reasons: string[] = [];

  // Severity-based assessment
  if (incident.severity === IncidentSeverity.CRITICAL) {
    level = 'critical';
    requiresICONotification = true;
    reasons.push('Critical severity incident');
  } else if (incident.severity === IncidentSeverity.HIGH) {
    level = 'high';
    requiresICONotification = true;
    reasons.push('High severity incident');
  } else if (incident.severity === IncidentSeverity.MEDIUM) {
    level = 'medium';
    reasons.push('Medium severity incident');
  }

  // Data type sensitivity
  const sensitiveDataTypes = [
    'password',
    'payment_info',
    'credit_card',
    'ssn',
    'national_id',
    'health_info',
    'biometric',
  ];

  const hasSensitiveData = incident.affectedDataTypes.some((type) =>
    sensitiveDataTypes.some((sensitive) => type.toLowerCase().includes(sensitive))
  );

  if (hasSensitiveData) {
    if (level === 'medium') level = 'high';
    if (level === 'low') level = 'medium';
    requiresICONotification = true;
    reasons.push('Sensitive personal data affected');
  }

  // Scale of impact
  if (incident.affectedUserCount > 1000) {
    if (level === 'medium') level = 'high';
    requiresICONotification = true;
    reasons.push(`Large number of affected users (${incident.affectedUserCount})`);
  } else if (incident.affectedUserCount > 100) {
    if (level === 'low') level = 'medium';
    reasons.push(`Significant number of affected users (${incident.affectedUserCount})`);
  }

  // Incident type considerations
  if (incident.type === IncidentType.DATA_BREACH) {
    requiresICONotification = true;
    reasons.push('Data breach requires notification');
  } else if (incident.type === IncidentType.DATA_LOSS) {
    requiresICONotification = true;
    reasons.push('Data loss requires notification');
  } else if (incident.type === IncidentType.DDOS && incident.affectedUserCount === 0) {
    requiresICONotification = false;
    reasons.push('DDoS without data exposure');
  }

  return {
    level,
    requiresICONotification,
    reasoning: reasons.join('; '),
  };
}

/**
 * Send alert to admin users
 */
async function alertAdmins(incident: any) {
  const prisma = getPrisma();

  // Get all admin users
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      isActive: true,
    },
    select: { id: true, email: true, name: true },
  });

  // Send alert to each admin
  for (const admin of admins) {
    try {
      await sendEmail({
        to: admin.email,
        subject: `🚨 Security Incident Alert: ${incident.title}`,
        html: `
          <h1>🚨 Security Incident Alert</h1>
          <p>Dear ${admin.name || 'Admin'},</p>
          <p>A security incident has been reported and requires immediate attention.</p>
          <h2>${incident.title}</h2>
          <p><strong>Incident ID:</strong> ${incident.id}</p>
          <p><strong>Type:</strong> ${incident.type}</p>
          <p><strong>Severity:</strong> ${incident.severity}</p>
          <p><strong>Description:</strong> ${incident.description}</p>
          <p><strong>Affected Users:</strong> ${incident.affectedUserCount}</p>
          <p><strong>Detected At:</strong> ${incident.detectedAt.toISOString()}</p>
          <p><strong>ICO Notification Deadline:</strong> ${get72HourDeadline(incident.detectedAt).toISOString()}</p>
          <p><a href="${process.env.FRONTEND_URL}/admin/security-incidents/${incident.id}">View in Dashboard</a></p>
        `,
      });
    } catch (error: any) {
      logger.error('Failed to send admin alert', {
        adminId: admin.id,
        error: error.message,
      });
    }
  }

  // Update incident with admin notification timestamp
  await prisma.securityIncident.update({
    where: { id: incident.id },
    data: { adminNotifiedAt: new Date() },
  });
}
