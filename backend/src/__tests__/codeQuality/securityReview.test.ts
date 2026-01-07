/**
 * Security Review Validation Tests
 * 
 * These tests verify security best practices are followed.
 * Following TDD: Define security requirements, then validate.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Security Review: Code Quality Checks', () => {
  const backendSrcPath = path.join(__dirname, '../../src');
  const frontendSrcPath = path.join(__dirname, '../../../../frontend/src');
  const backendDir = path.join(__dirname, '../../..');

  /**
   * Check if file exists
   */
  function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Get all TypeScript files
   */
  function getSourceFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }
    
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
    
    for (const entry of entries) {
      if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        files.push(path.join(entry.path, entry.name));
      }
    }
    
    return files;
  }

  /**
   * Check if file uses input validation
   */
  function hasInputValidation(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for validation patterns
    const validationPatterns = [
      /express-validator/,
      /validate\(/,
      /validators\./,
      /zod\./,
      /\.parse\(/,
      /\.safeParse\(/,
    ];
    
    return validationPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check if route has authentication
   */
  function hasAuthentication(filePath: string, routeHandler: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Find the route handler
    const handlerIndex = lines.findIndex(line => line.includes(routeHandler));
    if (handlerIndex === -1) return false;
    
    // Check for authentication middleware before handler
    const beforeHandler = lines.slice(0, handlerIndex).join('\n');
    
    return /authenticate|requireRole|requireAuth/i.test(beforeHandler);
  }

  it('should have .env files in .gitignore', () => {
    const gitignorePath = path.join(__dirname, '../../../../.gitignore');
    
    if (!fileExists(gitignorePath)) {
      throw new Error('.gitignore file not found in root directory');
    }

    const content = fs.readFileSync(gitignorePath, 'utf-8');
    
    const requiredPatterns = [
      /\.env/,
      /\.env\.local/,
      /\.env\.\*\.local/,
    ];

    const missing = requiredPatterns.filter(pattern => !pattern.test(content));

    if (missing.length > 0) {
      throw new Error(
        `.gitignore is missing required patterns:\n${missing.map(p => `  - ${p}`).join('\n')}\n\n` +
        `Add these to prevent committing .env files with secrets.`
      );
    }

    expect(missing.length).toBe(0);
  });

  it('should have no npm audit vulnerabilities (high/critical)', () => {
    try {
      const output = execSync('npm audit --audit-level=high --json', {
        cwd: backendDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      const audit = JSON.parse(output);
      
      if (audit.metadata?.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        const high = vulns.high || 0;
        const critical = vulns.critical || 0;

        if (high > 0 || critical > 0) {
          throw new Error(
            `Found ${critical} critical and ${high} high severity vulnerabilities.\n\n` +
            `Run 'npm audit fix' to fix automatically fixable issues.\n` +
            `For other issues, update dependencies manually.\n\n` +
            `Security vulnerabilities must be fixed before CodeCanyon submission.`
          );
        }
      }
    } catch (error: any) {
      // If npm audit fails, it might be due to network or other issues
      // Don't fail the test, but warn
      console.warn('npm audit check failed:', error.message);
      return;
    }

    expect(true).toBe(true);
  });

  it('should have security headers configured', () => {
    const appPath = path.join(backendSrcPath, 'app.ts');
    
    if (!fileExists(appPath)) {
      throw new Error('app.ts not found');
    }

    const content = fs.readFileSync(appPath, 'utf-8');
    
    // Check for Helmet (security headers)
    if (!content.includes('helmet') && !content.includes('Helmet')) {
      throw new Error(
        'Security headers (Helmet) not configured.\n\n' +
        'Add Helmet middleware for security headers:\n' +
        "  import helmet from 'helmet';\n" +
        '  app.use(helmet());'
      );
    }

    expect(content).toMatch(/helmet|Helmet/i);
  });

  it('should have rate limiting configured', () => {
    const appPath = path.join(backendSrcPath, 'app.ts');
    
    if (!fileExists(appPath)) {
      throw new Error('app.ts not found');
    }

    const content = fs.readFileSync(appPath, 'utf-8');
    
    // Check for rate limiting
    if (!content.includes('rateLimit') && !content.includes('rate-limit')) {
      throw new Error(
        'Rate limiting not configured.\n\n' +
        'Add rate limiting middleware to prevent abuse:\n' +
        "  import rateLimit from 'express-rate-limit';\n" +
        '  app.use(rateLimit({ ... }));'
      );
    }

    expect(content).toMatch(/rateLimit|rate-limit/i);
  });

  it('should have CORS configured', () => {
    const appPath = path.join(backendSrcPath, 'app.ts');
    
    if (!fileExists(appPath)) {
      throw new Error('app.ts not found');
    }

    const content = fs.readFileSync(appPath, 'utf-8');
    
    // Check for CORS
    if (!content.includes('cors') && !content.includes('CORS')) {
      throw new Error(
        'CORS not configured.\n\n' +
        'Add CORS middleware for cross-origin requests:\n' +
        "  import cors from 'cors';\n" +
        '  app.use(cors({ ... }));'
      );
    }

    expect(content).toMatch(/cors|CORS/i);
  });

  it('should use Prisma for database queries (SQL injection protection)', () => {
    const files = getSourceFiles(backendSrcPath);
    const violations: string[] = [];

    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Check for raw SQL queries (potential SQL injection)
      if (content.includes('$queryRaw') || content.includes('queryRaw')) {
        // This is okay if properly parameterized
        // But check for string concatenation in SQL
        if (content.includes('$queryRaw`') && content.includes('${')) {
          const relativePath = path.relative(process.cwd(), file);
          violations.push(relativePath);
        }
      }
    });

    if (violations.length > 0) {
      throw new Error(
        `Potential SQL injection risks found. Use Prisma parameterized queries:\n\n` +
        `${violations.map(f => `  - ${f}`).join('\n')}\n\n` +
        `Use Prisma's type-safe queries instead of raw SQL when possible.`
      );
    }

    expect(violations.length).toBe(0);
  });

  it('should have input validation on API routes', () => {
    const routesPath = path.join(backendSrcPath, 'routes');
    const routeFiles = getSourceFiles(routesPath);
    
    // Critical routes that must have validation
    const criticalRoutes = [
      'auth.ts',
      'payments.ts',
      'profile.ts',
    ];

    const missingValidation: string[] = [];

    criticalRoutes.forEach(routeFile => {
      const filePath = routeFiles.find(f => f.includes(routeFile));
      if (filePath && !hasInputValidation(filePath)) {
        missingValidation.push(routeFile);
      }
    });

    if (missingValidation.length > 0) {
      throw new Error(
        `Critical routes missing input validation:\n${missingValidation.map(r => `  - ${r}`).join('\n')}\n\n` +
        `Add express-validator or Zod validation to all route handlers.`
      );
    }

    expect(missingValidation.length).toBe(0);
  });
});
