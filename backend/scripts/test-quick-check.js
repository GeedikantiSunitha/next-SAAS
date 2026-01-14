#!/usr/bin/env node

/**
 * Quick test checker - runs tests in small batches to identify issues
 * Uses Jest's built-in timeout and runs tests in groups
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, '..', 'test-results-quick.txt');
const BATCH_SIZE = 5; // Run 5 tests at a time

// Get all test files
console.log('Getting list of all test files...');
let testFiles = [];
try {
  const listOutput = execSync('npm test -- --listTests', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
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

console.log(`Found ${testFiles.length} test files\n`);

const results = [];
results.push('Quick Test Check Results');
results.push(`Generated: ${new Date().toISOString()}`);
results.push(`Total test files: ${testFiles.length}`);
results.push('========================================');
results.push('');

let passed = 0;
let failed = 0;
let totalTests = 0;
let totalPassedTests = 0;
let totalFailedTests = 0;

// Function to run a batch of tests
function runBatch(batchFiles, batchNum) {
  console.log(`\nBatch ${batchNum}: Running ${batchFiles.length} tests...`);
  results.push(`\nBatch ${batchNum}: ${batchFiles.join(', ')}`);
  
  try {
    const startTime = Date.now();
    const output = execSync(
      `npm test -- ${batchFiles.join(' ')} --testTimeout=30000 --maxWorkers=1`,
      {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000, // 60 second timeout for the batch
      }
    );
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    // Parse results
    const testSuitesMatch = output.match(/Test Suites:.*?(\d+) passed.*?(\d+) failed/);
    const testCountMatch = output.match(/Tests:\s+(\d+) passed.*?(\d+) failed/);
    
    if (testSuitesMatch) {
      const suitesPassed = parseInt(testSuitesMatch[1]);
      const suitesFailed = parseInt(testSuitesMatch[2]);
      
      if (testCountMatch) {
        const testsPassed = parseInt(testCountMatch[1]);
        const testsFailed = parseInt(testCountMatch[2]);
        
        totalPassedTests += testsPassed;
        totalFailedTests += testsFailed;
      }
      
      passed += suitesPassed;
      failed += suitesFailed;
      totalTests += suitesPassed + suitesFailed;
      
      console.log(`✅ Batch ${batchNum} completed (${duration}s): ${suitesPassed} passed, ${suitesFailed} failed`);
      results.push(`✅ Batch ${batchNum} completed (${duration}s): ${suitesPassed} passed, ${suitesFailed} failed`);
    } else {
      console.log(`⚠️  Batch ${batchNum} completed (${duration}s): Could not parse results`);
      results.push(`⚠️  Batch ${batchNum} completed (${duration}s): Could not parse results`);
    }
    
    // Show failures if any
    if (output.includes('FAIL') || output.includes('✕')) {
      const failures = output.match(/(FAIL|✕).*?\n.*?\n/g);
      if (failures) {
        console.log('   Failures found:');
        failures.slice(0, 3).forEach(fail => {
          console.log(`     ${fail.trim().substring(0, 100)}...`);
        });
      }
    }
    
  } catch (error) {
    const duration = Math.floor((Date.now() - Date.now()) / 1000);
    console.log(`❌ Batch ${batchNum} failed or timed out`);
    results.push(`❌ Batch ${batchNum} failed or timed out: ${error.message}`);
    failed += batchFiles.length;
    totalTests += batchFiles.length;
  }
}

// Run tests in batches
console.log('Starting batch execution...\n');

for (let i = 0; i < testFiles.length; i += BATCH_SIZE) {
  const batch = testFiles.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  runBatch(batch, batchNum);
  
  // Small delay between batches
  if (i + BATCH_SIZE < testFiles.length) {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Summary
console.log('\n========================================');
console.log('SUMMARY');
console.log('========================================');
console.log(`Total Test Files: ${totalTests}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('');
console.log(`Total Individual Tests: ${totalPassedTests + totalFailedTests}`);
console.log(`  ✅ Passed: ${totalPassedTests}`);
console.log(`  ❌ Failed: ${totalFailedTests}`);

results.push('\n========================================');
results.push('SUMMARY');
results.push('========================================');
results.push(`Total Test Files: ${totalTests}`);
results.push(`✅ Passed: ${passed}`);
results.push(`❌ Failed: ${failed}`);
results.push('');
results.push(`Total Individual Tests: ${totalPassedTests + totalFailedTests}`);
results.push(`  ✅ Passed: ${totalPassedTests}`);
results.push(`  ❌ Failed: ${totalFailedTests}`);

fs.writeFileSync(RESULTS_FILE, results.join('\n'));
console.log(`\nResults saved to: ${RESULTS_FILE}`);
