import { prisma } from '../config/database';
import { AccessibilityIssueType, IssueStatus, IssuePriority } from '@prisma/client';
import logger from '../utils/logger';

export interface AccessibilityPreferencesInput {
  highContrast?: boolean;
  reduceMotion?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  keyboardShortcuts?: boolean;
  screenReaderMode?: boolean;
}

export interface AccessibilityIssueInput {
  type: AccessibilityIssueType;
  description: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  priority?: IssuePriority;
}

class AccessibilityService {
  /**
   * Get user's accessibility preferences
   */
  async getPreferences(userId: string) {
    try {
      const preferences = await prisma.accessibilityPreferences.findUnique({
        where: { userId }
      });

      // Return defaults if no preferences saved
      if (!preferences) {
        return {
          highContrast: false,
          reduceMotion: false,
          fontSize: 'medium',
          keyboardShortcuts: true,
          screenReaderMode: false
        };
      }

      return {
        highContrast: preferences.highContrast,
        reduceMotion: preferences.reduceMotion,
        fontSize: preferences.fontSize,
        keyboardShortcuts: preferences.keyboardShortcuts,
        screenReaderMode: preferences.screenReaderMode
      };
    } catch (error) {
      logger.error('Error fetching accessibility preferences:', error as Error);
      throw new Error('Failed to fetch accessibility preferences');
    }
  }

  /**
   * Update user's accessibility preferences
   */
  async updatePreferences(userId: string, input: AccessibilityPreferencesInput) {
    try {
      // Validate fontSize if provided
      if (input.fontSize && !['small', 'medium', 'large'].includes(input.fontSize)) {
        throw new Error('Invalid font size. Must be small, medium, or large');
      }

      // Upsert preferences
      const preferences = await prisma.accessibilityPreferences.upsert({
        where: { userId },
        update: {
          ...(input.highContrast !== undefined && { highContrast: input.highContrast }),
          ...(input.reduceMotion !== undefined && { reduceMotion: input.reduceMotion }),
          ...(input.fontSize !== undefined && { fontSize: input.fontSize }),
          ...(input.keyboardShortcuts !== undefined && { keyboardShortcuts: input.keyboardShortcuts }),
          ...(input.screenReaderMode !== undefined && { screenReaderMode: input.screenReaderMode })
        },
        create: {
          userId,
          highContrast: input.highContrast ?? false,
          reduceMotion: input.reduceMotion ?? false,
          fontSize: input.fontSize ?? 'medium',
          keyboardShortcuts: input.keyboardShortcuts ?? true,
          screenReaderMode: input.screenReaderMode ?? false
        }
      });

      logger.info(`Accessibility preferences updated for user ${userId}`);

      return {
        highContrast: preferences.highContrast,
        reduceMotion: preferences.reduceMotion,
        fontSize: preferences.fontSize,
        keyboardShortcuts: preferences.keyboardShortcuts,
        screenReaderMode: preferences.screenReaderMode
      };
    } catch (error) {
      logger.error('Error updating accessibility preferences:', error as Error);
      throw error;
    }
  }

  /**
   * Get accessibility statement data
   */
  async getStatement() {
    return {
      conformanceLevel: 'WCAG 2.1 AA',
      lastUpdated: new Date('2026-01-25'),
      contactEmail: 'accessibility@nextsaas.com',
      technologies: ['HTML', 'CSS', 'JavaScript', 'React', 'WAI-ARIA'],
      features: [
        'Keyboard navigation support',
        'Screen reader compatibility',
        'High contrast mode',
        'Reduced motion option',
        'Adjustable font sizes',
        'Skip navigation links',
        'ARIA labels and landmarks',
        'Focus indicators',
        'Alternative text for images',
        'Proper heading structure'
      ],
      compliance: {
        'UK Equality Act 2010': true,
        'EU Web Accessibility Directive': true,
        'Section 508': true,
        'WCAG 2.1 Level AA': true
      },
      assessmentMethods: [
        'Automated testing with axe-core',
        'Manual keyboard navigation testing',
        'Screen reader testing (NVDA, JAWS, VoiceOver)',
        'Color contrast analysis',
        'WCAG 2.1 Level AA compliance audit'
      ]
    };
  }

  /**
   * Report an accessibility issue
   */
  async reportIssue(input: AccessibilityIssueInput) {
    try {
      // Validate required fields
      if (!input.description || input.description.trim().length === 0) {
        throw new Error('Description is required');
      }

      const issue = await prisma.accessibilityIssue.create({
        data: {
          type: input.type,
          description: input.description,
          url: input.url,
          userAgent: input.userAgent,
          userId: input.userId,
          priority: input.priority || IssuePriority.MEDIUM,
          status: IssueStatus.OPEN
        }
      });

      logger.info(`Accessibility issue reported: ${issue.id}`);

      // Log to audit for compliance
      if (input.userId) {
        await prisma.auditLog.create({
          data: {
            userId: input.userId,
            action: 'ACCESSIBILITY_ISSUE_REPORTED',
            details: {
              issueId: issue.id,
              type: input.type,
              url: input.url
            }
          }
        });
      }

      return {
        issueId: issue.id,
        message: 'Issue reported successfully'
      };
    } catch (error) {
      logger.error('Error reporting accessibility issue:', error as Error);
      throw error;
    }
  }

  /**
   * Get accessibility issues (admin only)
   */
  async getIssues(filters?: {
    status?: IssueStatus;
    type?: AccessibilityIssueType;
    priority?: IssuePriority;
  }) {
    try {
      const issues = await prisma.accessibilityIssue.findMany({
        where: {
          ...(filters?.status && { status: filters.status }),
          ...(filters?.type && { type: filters.type }),
          ...(filters?.priority && { priority: filters.priority })
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      return issues;
    } catch (error) {
      logger.error('Error fetching accessibility issues:', error as Error);
      throw new Error('Failed to fetch accessibility issues');
    }
  }

  /**
   * Update issue status (admin only)
   */
  async updateIssueStatus(issueId: string, status: IssueStatus) {
    try {
      const issue = await prisma.accessibilityIssue.update({
        where: { id: issueId },
        data: {
          status,
          ...(status === IssueStatus.RESOLVED && { resolvedAt: new Date() })
        }
      });

      logger.info(`Accessibility issue ${issueId} status updated to ${status}`);
      return issue;
    } catch (error) {
      logger.error('Error updating accessibility issue status:', error as Error);
      throw new Error('Failed to update issue status');
    }
  }
}

export default new AccessibilityService();