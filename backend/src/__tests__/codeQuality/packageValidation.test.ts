/**
 * Package Validation Tests
 * 
 * These tests verify that the package structure is correct for CodeCanyon.
 * Following TDD: Define package requirements, then validate.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Code Quality: Package Validation', () => {
  const rootDir = path.join(__dirname, '../../../../..');
  const distDir = path.join(rootDir, 'dist');

  /**
   * Check if file exists
   */
  function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  /**
   * Check if directory exists
   */
  function dirExists(dirPath: string): boolean {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  }

  /**
   * Get file size in MB
   */
  function getFileSizeMB(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
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
      const docPath = path.join(rootDir, doc);
      if (!fileExists(docPath)) {
        missing.push(doc);
      }
    });

    if (missing.length > 0) {
      throw new Error(
        `Missing required documentation files:\n${missing.map(d => `  - ${d}`).join('\n')}\n\n` +
        'These files are required for CodeCanyon submission.'
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
    
    const requiredPatterns = [
      /node_modules/,
      /\.env$/,
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
