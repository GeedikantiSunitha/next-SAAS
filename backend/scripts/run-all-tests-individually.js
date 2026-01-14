#!/usr/bin/env node

/**
 * Script to run all tests individually with 30-second timeout
 * Identifies which tests are passing, failing, or timing out
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TIMEOUT_SECONDS = 30;
const RESULTS_FILE = path.join(__dirname, '..', 'test-results-individual.txt');

// Counters
let passed = 0;
let failed = 0;
let timeout = 0;
let totalTests = 0;
let totalPassedTests = 0;
let totalFailedTests = 0;

// Get all test files
console.log('Getting list of all test files...');
let testFiles = [];
try {
  const listOutput = execSync('npm test -- --listTests', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
  });
  
  testFiles = listOutput
    .split('\n')
    .filter(line => line.trim() && (line.includes('.test.ts') || line.includes('.spec.ts')))
    .filter(line => !line.includes('template'))
    .map(line => line.trim());
} catch (error) {
  console.error('Error getting test files:', error.message);
  process.exit(1);
}

console.log(`Found ${testFiles.length} test files to run\n`);

// Clear and initialize results file
const results = [];
results.push('Test Execution Results - Individual Tests');
results.push(`Generated: ${new Date().toISOString()}`);
results.push(`Timeout per test: ${TIMEOUT_SECONDS}s`);
results.push('========================================');
results.push('');

// Function to run a single test with timeout
function runTest(testFile) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timestamp = new Date().toTimeString().split(' ')[0];
    
    console.log(`[${timestamp}] Testing: ${testFile}`);
    results.push(`[${timestamp}] Testing: ${testFile}`);
    
    const npmTest = spawn('npm', ['test', testFile], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
    
    let output = '';
    let errorOutput = '';
    
    npmTest.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    npmTest.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      npmTest.kill('SIGTERM');
      setTimeout(() => {
        if (!npmTest.killed) {
          npmTest.kill('SIGKILL');
        }
      }, 1000);
      
      const duration = Math.floor((Date.now() - startTime) / 1000);
      console.log(`⏱️  TIMEOUT (>${TIMEOUT_SECONDS}s): ${testFile} (${duration}s)`);
      results.push(`⏱️  TIMEOUT (>${TIMEOUT_SECONDS}s): ${testFile} (${duration}s)`);
      results.push('');
      
      timeout++;
      totalTests++;
      resolve({ status: 'timeout', duration });
    }, TIMEOUT_SECONDS * 1000);
    
    npmTest.on('close', (code) => {
      clearTimeout(timeoutId);
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const fullOutput = output + errorOutput;
      
      // Extract test results
      const testSuitesMatch = fullOutput.match(/Test Suites:.*\d+ (passed|failed)/);
      const testCountMatch = fullOutput.match(/Tests:\s+(\d+) passed.*?(\d+) failed?/);
      
      const testSuites = testSuitesMatch ? testSuitesMatch[0] : '';
      const passedCount = testCountMatch ? parseInt(testCountMatch[1]) : 0;
      const failedCount = testCountMatch ? parseInt(testCountMatch[2]) : 0;
      
      if (testSuites.includes('passed') && !testSuites.includes('failed')) {
        console.log(`✅ PASSED (${duration}s): ${testFile}`);
        console.log(`   ${testSuites}`);
        if (testCountMatch) console.log(`   Tests: ${testCountMatch[0]}`);
        
        results.push(`✅ PASSED (${duration}s): ${testFile}`);
        results.push(`   ${testSuites}`);
        if (testCountMatch) results.push(`   Tests: ${testCountMatch[0]}`);
        results.push('');
        
        passed++;
        totalPassedTests += passedCount;
        totalTests++;
        resolve({ status: 'passed', duration, passedCount });
      } else if (testSuites.includes('failed') || code !== 0) {
        console.log(`❌ FAILED (${duration}s): ${testFile}`);
        console.log(`   ${testSuites || 'Exit code: ' + code}`);
        if (testCountMatch) console.log(`   Tests: ${testCountMatch[0]}`);
        
        // Extract failure details
        const failures = fullOutput.match(/(FAIL|✕|●).*?\n/g);
        if (failures && failures.length > 0) {
          console.log('   Failures:');
          failures.slice(0, 5).forEach(fail => {
            console.log(`     ${fail.trim()}`);
          });
        }
        
        results.push(`❌ FAILED (${duration}s): ${testFile}`);
        results.push(`   ${testSuites || 'Exit code: ' + code}`);
        if (testCountMatch) results.push(`   Tests: ${testCountMatch[0]}`);
        
        if (failures && failures.length > 0) {
          results.push('   Failures:');
          failures.slice(0, 5).forEach(fail => {
            results.push(`     ${fail.trim()}`);
          });
        }
        results.push('');
        
        failed++;
        totalFailedTests += failedCount;
        totalTests++;
        resolve({ status: 'failed', duration, failedCount });
      } else {
        console.log(`⚠️  UNKNOWN (${duration}s): ${testFile}`);
        console.log(`   Exit code: ${code}`);
        console.log(`   Last output: ${fullOutput.split('\n').slice(-3).join('\n')}`);
        
        results.push(`⚠️  UNKNOWN (${duration}s): ${testFile}`);
        results.push(`   Exit code: ${code}`);
        results.push('');
        
        totalTests++;
        resolve({ status: 'unknown', duration });
      }
    });
    
    npmTest.on('error', (error) => {
      clearTimeout(timeoutId);
      const duration = Math.floor((Date.now() - startTime) / 1000);
      console.log(`⚠️  ERROR (${duration}s): ${testFile} - ${error.message}`);
      results.push(`⚠️  ERROR (${duration}s): ${testFile} - ${error.message}`);
      results.push('');
      
      totalTests++;
      resolve({ status: 'error', duration, error: error.message });
    });
  });
}

// Run all tests sequentially
async function runAllTests() {
  console.log('Starting individual test execution...\n');
  
  for (let i = 0; i < testFiles.length; i++) {
    const testFile = testFiles[i];
    await runTest(testFile);
    
    // Small delay between tests
    if (i < testFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('');
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total Test Files: ${totalTests}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Timeout: ${timeout}`);
  console.log('');
  console.log('Total Individual Tests:');
  console.log(`  ✅ Passed: ${totalPassedTests}`);
  console.log(`  ❌ Failed: ${totalFailedTests}`);
  
  results.push('');
  results.push('========================================');
  results.push('SUMMARY');
  results.push('========================================');
  results.push(`Total Test Files: ${totalTests}`);
  results.push(`✅ Passed: ${passed}`);
  results.push(`❌ Failed: ${failed}`);
  results.push(`⏱️  Timeout: ${timeout}`);
  results.push('');
  results.push('Total Individual Tests:');
  results.push(`  ✅ Passed: ${totalPassedTests}`);
  results.push(`  ❌ Failed: ${totalFailedTests}`);
  results.push('');
  results.push(`Results saved to: ${RESULTS_FILE}`);
  
  // Write results to file
  fs.writeFileSync(RESULTS_FILE, results.join('\n'));
  
  console.log('');
  console.log(`Results saved to: ${RESULTS_FILE}`);
}

// Run the script
runAllTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
