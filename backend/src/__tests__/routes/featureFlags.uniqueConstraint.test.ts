/**
 * Feature Flags Unique Constraint Tests (TDD)
 * 
 * Focused unit tests to verify unique constraint handling for feature flags
 * Following TDD approach: write test → fix → verify
 */

import { prisma } from '../../config/database';

jest.setTimeout(10000);

describe('Feature Flags Unique Constraint Handling', () => {
  const testKeys = {
    registration: 'registration',
    oauth: 'oauth',
    testFlag: 'test_flag',
  };

  beforeEach(async () => {
    // Clean up feature flags before each test
    await prisma.featureFlag.deleteMany({});
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.featureFlag.deleteMany({});
  });

  it('should detect unique constraint violation when creating duplicate keys', async () => {
    // Create first flag
    await prisma.featureFlag.create({
      data: {
        key: testKeys.registration,
        enabled: true,
        description: 'First flag',
      },
    });

    // Try to create duplicate - should fail
    await expect(
      prisma.featureFlag.create({
        data: {
          key: testKeys.registration, // Same key
          enabled: false,
          description: 'Duplicate flag',
        },
      })
    ).rejects.toThrow(/Unique constraint failed|unique constraint|duplicate/i);
  });

  it('should successfully create flags with unique keys', async () => {
    // Create flags with different keys - should succeed
    const flag1 = await prisma.featureFlag.create({
      data: {
        key: testKeys.registration,
        enabled: true,
        description: 'Registration flag',
      },
    });

    const flag2 = await prisma.featureFlag.create({
      data: {
        key: testKeys.oauth,
        enabled: false,
        description: 'OAuth flag',
      },
    });

    expect(flag1.key).toBe(testKeys.registration);
    expect(flag2.key).toBe(testKeys.oauth);
  });

  it('should verify createMany fails when keys already exist', async () => {
    // Create initial flag
    await prisma.featureFlag.create({
      data: {
        key: testKeys.registration,
        enabled: true,
      },
    });

    // Try createMany with duplicate key - should fail
    await expect(
      prisma.featureFlag.createMany({
        data: [
          { key: testKeys.registration, enabled: false }, // Duplicate
          { key: testKeys.oauth, enabled: true }, // New
        ],
      })
    ).rejects.toThrow(/Unique constraint failed|unique constraint/i);
  });

  it('should verify upsert works when key already exists', async () => {
    // Create initial flag
    await prisma.featureFlag.create({
      data: {
        key: testKeys.registration,
        enabled: true,
        description: 'Original',
      },
    });

    // Use upsert to update existing flag
    const updated = await prisma.featureFlag.upsert({
      where: { key: testKeys.registration },
      update: { enabled: false, description: 'Updated' },
      create: {
        key: testKeys.registration,
        enabled: false,
        description: 'Updated',
      },
    });

    expect(updated.key).toBe(testKeys.registration);
    expect(updated.enabled).toBe(false);
    expect(updated.description).toBe('Updated');
  });

  it('should verify upsert creates when key does not exist', async () => {
    // Use upsert on non-existent key - should create
    const created = await prisma.featureFlag.upsert({
      where: { key: testKeys.registration },
      update: { enabled: false },
      create: {
        key: testKeys.registration,
        enabled: true,
        description: 'Created via upsert',
      },
    });

    expect(created.key).toBe(testKeys.registration);
    expect(created.enabled).toBe(true);
    expect(created.description).toBe('Created via upsert');
  });

  it('should verify deletion before creation prevents constraint violations', async () => {
    // Create flag
    await prisma.featureFlag.create({
      data: {
        key: testKeys.registration,
        enabled: true,
      },
    });

    // Delete it
    await prisma.featureFlag.deleteMany({
      where: { key: testKeys.registration },
    });

    // Now create again with same key - should succeed
    const recreated = await prisma.featureFlag.create({
      data: {
        key: testKeys.registration,
        enabled: false,
        description: 'Recreated',
      },
    });

    expect(recreated.key).toBe(testKeys.registration);
    expect(recreated.enabled).toBe(false);
  });

  it('should verify cleaning all flags allows recreate with same keys', async () => {
    // Create flags
    await prisma.featureFlag.createMany({
      data: [
        { key: testKeys.registration, enabled: true },
        { key: testKeys.oauth, enabled: false },
      ],
    });

    // Clean all
    await prisma.featureFlag.deleteMany({});

    // Recreate with same keys - should succeed
    await expect(
      prisma.featureFlag.createMany({
        data: [
          { key: testKeys.registration, enabled: false },
          { key: testKeys.oauth, enabled: true },
        ],
      })
    ).resolves.toBeDefined();
  });
});

describe('Feature Flags Test Setup Pattern', () => {
  it('should verify test can handle flags from seed script', async () => {
    // Simulate seed script creating flags
    await prisma.featureFlag.createMany({
      data: [
        { key: 'registration', enabled: true, description: 'From seed' },
        { key: 'oauth', enabled: false, description: 'From seed' },
      ],
      skipDuplicates: true, // Skip if exists
    });

    // Test should be able to upsert/update existing flags
    await prisma.featureFlag.upsert({
      where: { key: 'registration' },
      update: { enabled: false },
      create: { key: 'registration', enabled: false },
    });

    const flag = await prisma.featureFlag.findUnique({
      where: { key: 'registration' },
    });

    expect(flag).toBeDefined();
    expect(flag!.enabled).toBe(false); // Updated
  });

  it('should verify test cleanup prevents interference between tests', async () => {
    const testKey = `test-unique-${Date.now()}`;

    // First test creates flag
    await prisma.featureFlag.create({
      data: { key: testKey, enabled: true },
    });

    // Cleanup (simulating afterEach)
    await prisma.featureFlag.deleteMany({ where: { key: testKey } });

    // Next test can create same key again
    const recreated = await prisma.featureFlag.create({
      data: { key: testKey, enabled: false },
    });

    expect(recreated.enabled).toBe(false);
  });
});
