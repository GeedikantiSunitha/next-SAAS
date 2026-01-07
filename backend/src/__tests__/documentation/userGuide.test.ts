/**
 * User Guide Documentation Tests
 * 
 * These tests verify that USER_GUIDE.md exists and contains all required sections
 * for CodeCanyon submission. Following TDD: Define requirements first, then implement.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Documentation: USER_GUIDE.md', () => {
  const userGuidePath = path.join(__dirname, '../../../..', 'USER_GUIDE.md');
  const docsPath = path.join(__dirname, '../../../..', 'docs', 'USER_GUIDE.md');

  /**
   * Required sections that must be in the user guide
   */
  const requiredSections = [
    'Getting Started',
    'Authentication',
    'User Management',
    'Profile Management',
    'Admin Features',
    'Payments',
    'Notifications',
    'Settings',
    'Troubleshooting',
  ];

  /**
   * Required subsections for Authentication
   */
  const authSubsections = [
    'Registration',
    'Login',
    'OAuth Login',
    'Multi-Factor Authentication',
    'Password Reset',
  ];

  /**
   * Required subsections for Admin Features
   */
  const adminSubsections = [
    'Dashboard',
    'User Management',
    'Audit Logs',
    'Feature Flags',
    'Payment Management',
  ];

  /**
   * Check if file exists
   */
  function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Read file content
   */
  function readFile(filePath: string): string {
    if (!fileExists(filePath)) {
      return '';
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Check if section exists in content
   */
  function hasSection(content: string, section: string): boolean {
    // Check for markdown headers (## or ###)
    const patterns = [
      new RegExp(`^##+\\s+${section}`, 'm'),
      new RegExp(`^##+\\s+.*${section}`, 'm'),
      new RegExp(`#+\\s+${section}`, 'i'),
    ];
    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if content has minimum length (indicates substantial content)
   */
  function hasSubstantialContent(content: string, minLength: number = 5000): boolean {
    return content.length >= minLength;
  }

  it('should exist in root directory or docs directory', () => {
    const existsInRoot = fileExists(userGuidePath);
    const existsInDocs = fileExists(docsPath);
    
    expect(existsInRoot || existsInDocs).toBe(true);
  });

  it('should contain all required main sections', () => {
    const content = readFile(userGuidePath) || readFile(docsPath);
    
    if (content.length === 0) {
      throw new Error('USER_GUIDE.md not found. Create it in root or docs/ directory.');
    }

    const missingSections: string[] = [];
    
    requiredSections.forEach(section => {
      if (!hasSection(content, section)) {
        missingSections.push(section);
      }
    });

    if (missingSections.length > 0) {
      throw new Error(
        `USER_GUIDE.md is missing required sections:\n${missingSections.map(s => `  - ${s}`).join('\n')}`
      );
    }

    expect(missingSections.length).toBe(0);
  });

  it('should contain Authentication subsections', () => {
    const content = readFile(userGuidePath) || readFile(docsPath);
    
    if (content.length === 0) {
      throw new Error('USER_GUIDE.md not found');
    }

    const missingSubsections: string[] = [];
    
    authSubsections.forEach(subsection => {
      if (!hasSection(content, subsection)) {
        missingSubsections.push(subsection);
      }
    });

    if (missingSubsections.length > 0) {
      throw new Error(
        `USER_GUIDE.md Authentication section is missing:\n${missingSubsections.map(s => `  - ${s}`).join('\n')}`
      );
    }

    expect(missingSubsections.length).toBe(0);
  });

  it('should contain Admin Features subsections', () => {
    const content = readFile(userGuidePath) || readFile(docsPath);
    
    if (content.length === 0) {
      throw new Error('USER_GUIDE.md not found');
    }

    const missingSubsections: string[] = [];
    
    adminSubsections.forEach(subsection => {
      if (!hasSection(content, subsection)) {
        missingSubsections.push(subsection);
      }
    });

    if (missingSubsections.length > 0) {
      throw new Error(
        `USER_GUIDE.md Admin Features section is missing:\n${missingSubsections.map(s => `  - ${s}`).join('\n')}`
      );
    }

    expect(missingSubsections.length).toBe(0);
  });

  it('should have substantial content (minimum 5000 characters)', () => {
    const content = readFile(userGuidePath) || readFile(docsPath);
    
    if (content.length === 0) {
      throw new Error('USER_GUIDE.md not found');
    }

    if (!hasSubstantialContent(content, 5000)) {
      throw new Error(
        `USER_GUIDE.md is too short (${content.length} chars). Minimum 5000 characters required. ` +
        `Add more detailed instructions and examples.`
      );
    }

    expect(content.length).toBeGreaterThanOrEqual(5000);
  });

  it('should contain step-by-step instructions', () => {
    const content = readFile(userGuidePath) || readFile(docsPath);
    
    if (content.length === 0) {
      throw new Error('USER_GUIDE.md not found');
    }

    // Check for numbered lists or step indicators
    const stepPatterns = [
      /step\s+\d+/i,
      /\d+\.\s+[A-Z]/,
      /^1\./m,
      /step\s+[0-9]+/i,
    ];

    const hasSteps = stepPatterns.some(pattern => pattern.test(content));

    if (!hasSteps) {
      throw new Error(
        'USER_GUIDE.md should contain step-by-step instructions. ' +
        'Add numbered lists or "Step 1", "Step 2" format.'
      );
    }

    expect(hasSteps).toBe(true);
  });

  it('should contain code examples or screenshots placeholders', () => {
    const content = readFile(userGuidePath) || readFile(docsPath);
    
    if (content.length === 0) {
      throw new Error('USER_GUIDE.md not found');
    }

    // Check for code blocks, screenshots, or examples
    const examplePatterns = [
      /```/,
      /screenshot/i,
      /example/i,
      /image/i,
      /\[.*\]\(.*\)/, // Markdown links/images
    ];

    const hasExamples = examplePatterns.some(pattern => pattern.test(content));

    if (!hasExamples) {
      throw new Error(
        'USER_GUIDE.md should contain code examples, screenshots, or image placeholders. ' +
        'Add code blocks (```) or screenshot references.'
      );
    }

    expect(hasExamples).toBe(true);
  });
});
