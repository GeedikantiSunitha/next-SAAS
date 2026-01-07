/**
 * Code Quality: Console Logs Detection
 * 
 * These tests verify that production code doesn't contain console.log statements.
 * Console logs should be replaced with proper logging (Winston for backend).
 * 
 * Following TDD: Write tests first, then fix any issues found.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Code Quality: Console Logs Detection', () => {
  const backendSrcPath = path.join(__dirname, '../../src');
  const frontendSrcPath = path.join(__dirname, '../../../frontend/src');

  /**
   * Console methods that should not be in production code
   */
  const consoleMethods = [
    'console.log',
    'console.debug',
    'console.info', // Use logger instead
    'console.warn', // Use logger instead
    'console.error', // Use logger instead (or proper error handling)
    'console.trace',
    'console.dir',
    'console.table',
  ];

  /**
   * Files to exclude from console log scanning
   */
  const excludePatterns = [
    /\.test\.ts$/,
    /\.test\.tsx$/,
    /\.spec\.ts$/,
    /\.spec\.tsx$/,
    /node_modules/,
    /\.d\.ts$/,
    /\.map$/,
    /logger\.ts$/, // Logger files can have console as fallback
    /config\.ts$/, // Config files might have console for startup
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
   * Check a file for console statements
   */
  function checkFileForConsoleLogs(filePath: string): Array<{ line: number; method: string; code: string }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const issues: Array<{ line: number; method: string; code: string }> = [];

    lines.forEach((line, index) => {
      consoleMethods.forEach(method => {
        // Check if line contains console method
        const regex = new RegExp(`\\b${method.replace('.', '\\.')}\\s*\\(`, 'g');
        
        if (regex.test(line)) {
          // Skip if it's commented out
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
            return;
          }
          
          // Skip if it's in a string (like documentation)
          if (line.includes('`') && line.indexOf('`') < line.indexOf(method)) {
            return;
          }

          // Skip test files
          if (filePath.includes('.test.') || filePath.includes('.spec.')) {
            return;
          }

          // Allow console.error in error handlers if it's the only option
          // But prefer logger
          if (method === 'console.error' && line.includes('catch') && line.includes('error')) {
            // This is acceptable but should be logged
            return;
          }

          issues.push({
            line: index + 1,
            method,
            code: line.trim().substring(0, 80), // Truncate long lines
          });
        }
      });
    });

    return issues;
  }

  it('should not contain console.log statements in backend source files', () => {
    const files = getSourceFiles(backendSrcPath);
    const allIssues: Array<{ file: string; issues: Array<{ line: number; method: string; code: string }> }> = [];

    files.forEach(file => {
      const issues = checkFileForConsoleLogs(file);
      if (issues.length > 0) {
        allIssues.push({ file, issues });
      }
    });

    if (allIssues.length > 0) {
      const errorMessage = allIssues
        .map(({ file, issues }) => {
          const relativePath = path.relative(process.cwd(), file);
          return `\n${relativePath}:\n${issues.map(i => `  Line ${i.line}: ${i.method} - ${i.code}`).join('\n')}`;
        })
        .join('\n');
      
      throw new Error(
        `Found console statements in backend. Use logger instead:\n${errorMessage}\n\n` +
        `Replace with: import logger from '../utils/logger';\n` +
        `Then use: logger.info(), logger.error(), etc.`
      );
    }

    expect(allIssues.length).toBe(0);
  });

  it('should not contain console.log statements in frontend source files', () => {
    const files = getSourceFiles(frontendSrcPath);
    const allIssues: Array<{ file: string; issues: Array<{ line: number; method: string; code: string }> }> = [];

    files.forEach(file => {
      const issues = checkFileForConsoleLogs(file);
      if (issues.length > 0) {
        allIssues.push({ file, issues });
      }
    });

    if (allIssues.length > 0) {
      const errorMessage = allIssues
        .map(({ file, issues }) => {
          const relativePath = path.relative(process.cwd(), file);
          return `\n${relativePath}:\n${issues.map(i => `  Line ${i.line}: ${i.method} - ${i.code}`).join('\n')}`;
        })
        .join('\n');
      
      throw new Error(
        `Found console statements in frontend:\n${errorMessage}\n\n` +
        `For production code, consider using a logging service or removing debug logs.`
      );
    }

    expect(allIssues.length).toBe(0);
  });

  it('should use proper logging instead of console methods in backend', () => {
    const files = getSourceFiles(backendSrcPath);
    const hasLoggerImport = (content: string) => {
      return /import.*logger|from.*logger|require.*logger/i.test(content);
    };

    const violations: Array<{ file: string; line: number; method: string }> = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      // Skip if file doesn't use logger (might be a config file)
      const usesLogger = hasLoggerImport(content);
      
      lines.forEach((line, index) => {
        // Check for console methods (except in test files or comments)
        if (line.includes('console.') && 
            !line.trim().startsWith('//') && 
            !file.includes('.test.') &&
            !file.includes('.spec.')) {
          
          // If file uses logger, console should not be used
          if (usesLogger && /console\.(log|info|warn|error|debug)/.test(line)) {
            const relativePath = path.relative(process.cwd(), file);
            const method = line.match(/console\.(\w+)/)?.[1] || 'unknown';
            violations.push({ file: relativePath, line: index + 1, method });
          }
        }
      });
    });

    if (violations.length > 0) {
      const errorMessage = violations
        .map(({ file, line, method }) => `  ${file}:${line} - console.${method}`)
        .join('\n');
      
      throw new Error(
        `Files using logger should not also use console methods:\n${errorMessage}\n\n` +
        `Replace console methods with logger methods.`
      );
    }

    expect(violations.length).toBe(0);
  });
});
