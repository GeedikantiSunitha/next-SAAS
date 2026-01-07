/**
 * FAQ Documentation Tests
 * 
 * These tests verify that FAQ.md exists and contains required questions
 * for CodeCanyon submission. Following TDD: Define requirements first, then implement.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Documentation: FAQ.md', () => {
  const faqPath = path.join(__dirname, '../../../..', 'FAQ.md');
  const docsFaqPath = path.join(__dirname, '../../../..', 'docs', 'FAQ.md');

  /**
   * Required FAQ categories
   */
  const requiredCategories = [
    'Installation',
    'Configuration',
    'Features',
    'Troubleshooting',
    'Support',
  ];

  /**
   * Minimum number of questions required
   */
  const minQuestions = 10;

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
   * Count FAQ questions (Q: or ## or ### followed by question)
   */
  function countQuestions(content: string): number {
    const patterns = [
      /^Q:\s+/m,
      /^##+\s+.*\?/m,
      /^\*\*Q:\*\*/m,
      /^###\s+.*\?/m,
    ];
    
    let count = 0;
    patterns.forEach(pattern => {
      const matches = content.match(new RegExp(pattern.source, 'gm'));
      if (matches) {
        count += matches.length;
      }
    });
    
    return count;
  }

  /**
   * Check if category exists
   */
  function hasCategory(content: string, category: string): boolean {
    const patterns = [
      new RegExp(`^##+\\s+${category}`, 'm'),
      new RegExp(`^##+\\s+.*${category}`, 'm'),
      new RegExp(`#+\\s+${category}`, 'i'),
    ];
    return patterns.some(pattern => pattern.test(content));
  }

  it('should exist in root directory or docs directory', () => {
    const existsInRoot = fileExists(faqPath);
    const existsInDocs = fileExists(docsFaqPath);
    
    expect(existsInRoot || existsInDocs).toBe(true);
  });

  it('should contain at least 10 questions', () => {
    const content = readFile(faqPath) || readFile(docsFaqPath);
    
    if (content.length === 0) {
      throw new Error('FAQ.md not found. Create it in root or docs/ directory.');
    }

    const questionCount = countQuestions(content);

    if (questionCount < minQuestions) {
      throw new Error(
        `FAQ.md contains only ${questionCount} questions. Minimum ${minQuestions} questions required.`
      );
    }

    expect(questionCount).toBeGreaterThanOrEqual(minQuestions);
  });

  it('should contain required categories', () => {
    const content = readFile(faqPath) || readFile(docsFaqPath);
    
    if (content.length === 0) {
      throw new Error('FAQ.md not found');
    }

    const missingCategories: string[] = [];
    
    requiredCategories.forEach(category => {
      if (!hasCategory(content, category)) {
        missingCategories.push(category);
      }
    });

    if (missingCategories.length > 0) {
      throw new Error(
        `FAQ.md is missing required categories:\n${missingCategories.map(c => `  - ${c}`).join('\n')}`
      );
    }

    expect(missingCategories.length).toBe(0);
  });

  it('should have substantial content (minimum 3000 characters)', () => {
    const content = readFile(faqPath) || readFile(docsFaqPath);
    
    if (content.length === 0) {
      throw new Error('FAQ.md not found');
    }

    if (content.length < 3000) {
      throw new Error(
        `FAQ.md is too short (${content.length} chars). Minimum 3000 characters required. ` +
        `Add more detailed answers.`
      );
    }

    expect(content.length).toBeGreaterThanOrEqual(3000);
  });

  it('should contain links to relevant documentation', () => {
    const content = readFile(faqPath) || readFile(docsFaqPath);
    
    if (content.length === 0) {
      throw new Error('FAQ.md not found');
    }

    // Check for markdown links
    const hasLinks = /\[.*\]\(.*\)/.test(content);

    if (!hasLinks) {
      throw new Error(
        'FAQ.md should contain links to relevant documentation. ' +
        'Add markdown links like [Installation Guide](INSTALLATION.md)'
      );
    }

    expect(hasLinks).toBe(true);
  });
});
