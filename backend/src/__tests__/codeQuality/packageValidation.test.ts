/**
 * Package Validation Tests
 * 
 * These tests verify that the package structure is correct for CodeCanyon.
 * Following TDD: Define package requirements, then validate.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Code Quality: Package Validation', () => {
  // From backend/src/__tests__/codeQuality: 4 levels up = project root (codeQuality -> __tests__ -> src -> backend -> root)
  const rootDir = path.join(__dirname, '../../../../');

  /**
   * Check if file exists
   */
  function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  it('should have .codecanyonignore file', () => {
    const ignoreFile = path.join(rootDir, '.codecanyonignore');
    const exists = fileExists(ignoreFile);

    if (!exists) {
      throw new Error(
        '.codecanyonignore file not found.\n' +
        'Create this file to exclude unnecessary files from package.'
      );
    }

    expect(exists).toBe(true);
  });

  it('should have package script in scripts directory', () => {
    const packageScript = path.join(rootDir, 'scripts', 'package-for-codecanyon.sh');
    const exists = fileExists(packageScript);

    if (!exists) {
      throw new Error(
        'package-for-codecanyon.sh script not found.\n' +
        'This script automates package creation for CodeCanyon.'
      );
    }

    expect(exists).toBe(true);
  });

  it('should have clean-build script in scripts directory', () => {
    const cleanScript = path.join(rootDir, 'scripts', 'clean-build.sh');
    const exists = fileExists(cleanScript);

    if (!exists) {
      throw new Error(
        'clean-build.sh script not found.\n' +
        'This script cleans build artifacts before packaging.'
      );
    }

    expect(exists).toBe(true);
  });

  it('should have .env.example files (not .env)', () => {
    const backendEnvExample = path.join(rootDir, 'backend', '.env.example');
    const frontendEnvExample = path.join(rootDir, 'frontend', '.env.example');
    const backendEnv = path.join(rootDir, 'backend', '.env');
    const frontendEnv = path.join(rootDir, 'frontend', '.env');

    // Check .env.example exists
    if (!fileExists(backendEnvExample)) {
      throw new Error('backend/.env.example not found');
    }

    if (!fileExists(frontendEnvExample)) {
      throw new Error('frontend/.env.example not found');
    }

    // Check .env doesn't exist (or is gitignored)
    if (fileExists(backendEnv) || fileExists(frontendEnv)) {
      console.warn('⚠️  .env files found. Ensure they are in .gitignore and excluded from package.');
    }

    expect(fileExists(backendEnvExample)).toBe(true);
    expect(fileExists(frontendEnvExample)).toBe(true);
  });

  it('should have required documentation files', () => {
    const requiredDocs = [
      'LICENSE',
      'README.md',
      'INSTALLATION.md',
      'CHANGELOG.md',
      'USER_GUIDE.md',
      'FAQ.md',
      'DEMO_CREDENTIALS.md',
    ];

    const missing: string[] = [];

    requiredDocs.forEach(doc => {
      const atRoot = path.join(rootDir, doc);
      const inDocs = path.join(rootDir, 'docs', doc);
      if (!fileExists(atRoot) && !fileExists(inDocs)) {
        missing.push(doc);
      }
    });

    if (missing.length > 0) {
      throw new Error(
        `Missing required documentation files:\n${missing.map(d => `  - ${d}`).join('\n')}\n\n` +
        'These files are required for CodeCanyon submission. They may be at project root or in docs/.'
      );
    }

    expect(missing.length).toBe(0);
  });

  it('should have .gitignore configured correctly', () => {
    const gitignorePath = path.join(rootDir, '.gitignore');
    
    if (!fileExists(gitignorePath)) {
      throw new Error('.gitignore file not found');
    }

    const content = fs.readFileSync(gitignorePath, 'utf-8');
    
    // Check for required patterns (more flexible matching)
    // Patterns should match even if they're part of a line (not requiring exact line matches)
    const requiredPatterns = [
      /node_modules/,
      /\.env/,  // Changed from /\.env$/ to match .env, .env.local, etc.
      /dist/,
      /build/,
      /logs/,
      /coverage/,
    ];

    const missing = requiredPatterns.filter(pattern => !pattern.test(content));

    if (missing.length > 0) {
      throw new Error(
        '.gitignore is missing required patterns.\n' +
        'Ensure node_modules, .env, dist, build, logs, and coverage are ignored.'
      );
    }

    expect(missing.length).toBe(0);
  });
});
