/**
 * Data Retention Policies Configuration
 *
 * GDPR-compliant data retention policies for NextSaaS
 * Defines retention periods, actions, and legal requirements for different data types
 */

export enum RetentionAction {
  ANONYMIZE = 'ANONYMIZE',       // Replace PII with anonymized data
  HARD_DELETE = 'HARD_DELETE',   // Permanently delete from database
  ARCHIVE = 'ARCHIVE',            // Mark as archived (keep for legal/audit)
  DELETE = 'DELETE',              // Soft or hard delete based on context
  RETAIN = 'RETAIN',              // Keep indefinitely (legal requirement)
}

export interface RetentionPolicy {
  retentionPeriodDays: number | null; // null = indefinite
  action: RetentionAction;
  description: string;
  legalRequirement?: boolean;
  regulationReference?: string;
}

export interface DataRetentionPolicies {
  inactiveUsers: RetentionPolicy;
  deletedUsers: RetentionPolicy;
  auditLogs: RetentionPolicy;
  securityLogs: RetentionPolicy;
  expiredSessions: RetentionPolicy;
  readNotifications: RetentionPolicy;
  unreadNotifications: RetentionPolicy;
  paymentRecords: RetentionPolicy;
  exportRequests: RetentionPolicy;
  deletionRequests: RetentionPolicy;
  consentRecords: RetentionPolicy;
}

/**
 * Data Retention Policies
 * Based on GDPR, UK DPA 2018, and industry best practices
 */
export const dataRetentionPolicies: DataRetentionPolicies = {
  // Inactive users (no login for 3 years) - anonymize
  inactiveUsers: {
    retentionPeriodDays: 1095, // 3 years
    action: RetentionAction.ANONYMIZE,
    description: 'Users who are inactive and have not logged in for 3+ years will be anonymized unless on legal hold',
    legalRequirement: false,
    regulationReference: 'GDPR Art. 5(1)(e) - Storage limitation',
  },

  // Deleted users (marked for deletion) - hard delete after 30 days
  deletedUsers: {
    retentionPeriodDays: 30,
    action: RetentionAction.HARD_DELETE,
    description: 'Users who are deleted and requested deletion will be permanently removed after 30 days grace period',
    legalRequirement: true,
    regulationReference: 'GDPR Art. 17 - Right to erasure',
  },

  // Audit logs - archive after 7 years
  auditLogs: {
    retentionPeriodDays: 2555, // 7 years
    action: RetentionAction.ARCHIVE,
    description: 'Audit logs must be retained for 7 years for legal and compliance purposes',
    legalRequirement: true,
    regulationReference: 'UK Financial Services Regulations, SOC 2',
  },

  // Security logs - archive after 10 years
  securityLogs: {
    retentionPeriodDays: 3650, // 10 years
    action: RetentionAction.ARCHIVE,
    description: 'Security logs must be retained for 10 years for incident investigation and legal purposes',
    legalRequirement: true,
    regulationReference: 'UK Cyber Security Regulations, ISO 27001',
  },

  // Expired sessions - delete after 90 days
  expiredSessions: {
    retentionPeriodDays: 90,
    action: RetentionAction.DELETE,
    description: 'Expired sessions will be deleted 90 days after expiration to minimize data footprint',
    legalRequirement: false,
  },

  // Read notifications - delete after 1 year
  readNotifications: {
    retentionPeriodDays: 365, // 1 year
    action: RetentionAction.DELETE,
    description: 'Read notifications will be deleted after 1 year',
    legalRequirement: false,
  },

  // Unread notifications - delete after 2 years
  unreadNotifications: {
    retentionPeriodDays: 730, // 2 years
    action: RetentionAction.DELETE,
    description: 'Unread notifications will be deleted after 2 years',
    legalRequirement: false,
  },

  // Payment records - archive after 7 years
  paymentRecords: {
    retentionPeriodDays: 2555, // 7 years
    action: RetentionAction.ARCHIVE,
    description: 'Payment records must be retained for 7 years for tax and accounting purposes',
    legalRequirement: true,
    regulationReference: 'UK Tax Law, HMRC requirements',
  },

  // GDPR export requests - delete after 30 days
  exportRequests: {
    retentionPeriodDays: 30,
    action: RetentionAction.DELETE,
    description: 'Data export requests and generated files will be deleted after 30 days',
    legalRequirement: false,
    regulationReference: 'GDPR Art. 20 - Right to data portability',
  },

  // GDPR deletion requests - archive for 7 years
  deletionRequests: {
    retentionPeriodDays: 2555, // 7 years
    action: RetentionAction.ARCHIVE,
    description: 'Deletion request records must be retained for 7 years as proof of compliance',
    legalRequirement: true,
    regulationReference: 'GDPR Art. 17 - Right to erasure (compliance proof)',
  },

  // Consent records - retain indefinitely
  consentRecords: {
    retentionPeriodDays: null, // indefinite
    action: RetentionAction.RETAIN,
    description: 'Consent records must be retained indefinitely as proof of legal basis for processing',
    legalRequirement: true,
    regulationReference: 'GDPR Art. 7 - Conditions for consent (proof requirement)',
  },
};

/**
 * Get retention policy by name
 */
export function getRetentionPolicy(policyName: keyof DataRetentionPolicies): RetentionPolicy {
  const policy = dataRetentionPolicies[policyName];
  if (!policy) {
    throw new Error(`Retention policy not found: ${policyName}`);
  }
  return policy;
}

/**
 * Check if a policy is legally required
 */
export function isPolicyLegallyRequired(policyName: keyof DataRetentionPolicies): boolean {
  const policy = getRetentionPolicy(policyName);
  return policy.legalRequirement || false;
}

/**
 * Calculate expiry date based on start date and retention period
 * Returns null for indefinite retention (null period)
 */
export function calculateExpiryDate(startDate: Date, retentionPeriodDays: number | null): Date | null {
  if (retentionPeriodDays === null) {
    return null; // Indefinite retention
  }

  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + retentionPeriodDays);
  return expiryDate;
}

/**
 * Get all policies that are legally required
 */
export function getLegallyRequiredPolicies(): Array<{
  name: keyof DataRetentionPolicies;
  policy: RetentionPolicy;
}> {
  return Object.entries(dataRetentionPolicies)
    .filter(([_, policy]) => policy.legalRequirement)
    .map(([name, policy]) => ({
      name: name as keyof DataRetentionPolicies,
      policy,
    }));
}

/**
 * Validate retention policy configuration
 * Throws if configuration is invalid
 */
export function validateRetentionPolicies(): void {
  const requiredPolicies: Array<keyof DataRetentionPolicies> = [
    'inactiveUsers',
    'deletedUsers',
    'auditLogs',
    'securityLogs',
    'expiredSessions',
    'readNotifications',
    'unreadNotifications',
    'paymentRecords',
    'exportRequests',
    'deletionRequests',
    'consentRecords',
  ];

  requiredPolicies.forEach((policyName) => {
    const policy = dataRetentionPolicies[policyName];
    if (!policy) {
      throw new Error(`Missing required retention policy: ${policyName}`);
    }

    if (!policy.action || !Object.values(RetentionAction).includes(policy.action)) {
      throw new Error(`Invalid action for retention policy: ${policyName}`);
    }

    if (!policy.description) {
      throw new Error(`Missing description for retention policy: ${policyName}`);
    }
  });
}

// Validate configuration on module load
validateRetentionPolicies();
