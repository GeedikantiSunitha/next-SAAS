/**
 * Security Code Quality Tests
 * 
 * These tests verify that the codebase doesn't contain hardcoded secrets,
 * API keys, or other sensitive information that should be in environment variables.
 * 
 * Following TDD: Write tests first, then fix any issues found.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Security: Hardcoded Secrets Detection', () => {
  const backendSrcPath = path.join(__dirname, '../../src');
  const frontendSrcPath = path.join(__dirname, '../../../frontend/src');

  /**
   * Patterns that indicate hardcoded secrets
   */
  const secretPatterns = [
    // Stripe keys
    /pk_live_[a-zA-Z0-9]{50,}/,
    /sk_live_[a-zA-Z0-9]{50,}/,
    /pk_test_[a-zA-Z0-9]{50,}/,
    /sk_test_[a-zA-Z0-9]{50,}/,
    // Resend API keys
    /re_[a-zA-Z0-9]{20,}/,
    // Razorpay keys
    /rzp_live_[a-zA-Z0-9]{20,}/,
    /rzp_test_[a-zA-Z0-9]{20,}/,
    // Webhook secrets
    /whsec_[a-zA-Z0-9]{20,}/,
    // Generic API keys (be careful with this one)
    /api[_-]?key['":\s]*=['"][a-zA-Z0-9]{20,}['"]/i,
    // JWT secrets (should be in env vars)
    /jwt[_-]?secret['":\s]*=['"][a-zA-Z0-9]{32,}['"]/i,
  ];

  /**
   * Files to exclude from secret scanning
   */
  const excludePatterns = [
    /\.test\.ts$/,
    /\.test\.tsx$/,
    /\.spec\.ts$/,
    /\.spec\.tsx$/,
    /node_modules/,
    /\.d\.ts$/,
    /\.map$/,
  ];

  /**
   * Get all source files to check
   */
  function getSourceFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }
    
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = path.join(entry.path, entry.name);
        const relativePath = path.relative(process.cwd(), filePath);
        
        // Skip excluded files
        if (excludePatterns.some(pattern => pattern.test(relativePath))) {
          continue;
        }
        
        // Only check TypeScript/JavaScript files
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          files.push(filePath);
        }
      }
    }
    
    return files;
  }

  /**
   * Check a file for hardcoded secrets
   */
  function checkFileForSecrets(filePath: string): Array<{ line: number; pattern: string; match: string }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const issues: Array<{ line: number; pattern: string; match: string }> = [];

    lines.forEach((line, index) => {
      secretPatterns.forEach((pattern, patternIndex) => {
        const matches = line.match(pattern);
        if (matches) {
          // Skip if it's in a comment explaining what NOT to do
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
            // Check if it's a warning/example comment
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('example') || 
                lowerLine.includes('dont') || 
                lowerLine.includes("don't") ||
                lowerLine.includes('warning') ||
                lowerLine.includes('remove')) {
              return; // Skip example/warning comments
            }
          }
          
          // Skip if it's in a test file (tests may have example keys)
          if (filePath.includes('.test.') || filePath.includes('.spec.')) {
            return;
          }

          issues.push({
            line: index + 1,
            pattern: `Pattern ${patternIndex + 1}`,
            match: matches[0].substring(0, 50) + '...', // Truncate for security
          });
        }
      });
    });

    return issues;
  }

  it('should not contain hardcoded Stripe keys in backend source files', () => {
    const files = getSourceFiles(backendSrcPath);
    const allIssues: Array<{ file: string; issues: Array<{ line: number; pattern: string; match: string }> }> = [];

    files.forEach(file => {
      const issues = checkFileForSecrets(file);
      if (issues.length > 0) {
        allIssues.push({ file, issues });
      }
    });

    if (allIssues.length > 0) {
      const errorMessage = allIssues
        .map(({ file, issues }) => {
          const relativePath = path.relative(process.cwd(), file);
          return `\n${relativePath}:\n${issues.map(i => `  Line ${i.line}: ${i.pattern} - ${i.match}`).join('\n')}`;
        })
        .join('\n');
      
      throw new Error(`Found hardcoded secrets in backend:\n${errorMessage}`);
    }

    expect(allIssues.length).toBe(0);
  });

  it('should not contain hardcoded API keys in frontend source files', () => {
    const files = getSourceFiles(frontendSrcPath);
    const allIssues: Array<{ file: string; issues: Array<{ line: number; pattern: string; match: string }> }> = [];

    files.forEach(file => {
      const issues = checkFileForSecrets(file);
      if (issues.length > 0) {
        allIssues.push({ file, issues });
      }
    });

    if (allIssues.length > 0) {
      const errorMessage = allIssues
        .map(({ file, issues }) => {
          const relativePath = path.relative(process.cwd(), file);
          return `\n${relativePath}:\n${issues.map(i => `  Line ${i.line}: ${i.pattern} - ${i.match}`).join('\n')}`;
        })
        .join('\n');
      
      throw new Error(`Found hardcoded secrets in frontend:\n${errorMessage}`);
    }

    expect(allIssues.length).toBe(0);
  });

  it('should use environment variables for Stripe keys instead of hardcoded values', () => {
    const files = getSourceFiles(backendSrcPath).concat(getSourceFiles(frontendSrcPath));
    const stripeKeyPattern = /(pk_live_|sk_live_|pk_test_|sk_test_)[a-zA-Z0-9]{50,}/;
    
    const violations: string[] = [];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Skip comments and test files
        if (line.trim().startsWith('//') || 
            line.trim().startsWith('*') || 
            file.includes('.test.') ||
            file.includes('.spec.')) {
          return;
        }
        
        if (stripeKeyPattern.test(line) && !line.includes('process.env') && !line.includes('import.meta.env')) {
          const relativePath = path.relative(process.cwd(), file);
          violations.push(`${relativePath}:${index + 1}`);
        }
      });
    });

    if (violations.length > 0) {
      throw new Error(
        `Found hardcoded Stripe keys. Use environment variables instead:\n${violations.join('\n')}`
      );
    }

    expect(violations.length).toBe(0);
  });
});
