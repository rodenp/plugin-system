// Integration Tests for StoragePlugin
// This file tests the complete integration of all StoragePlugin components

import { StoragePlugin, createStoragePlugin, createStoragePluginWithPreset } from '../index';
import { EntityType, StoragePluginConfig } from '../types';

// Mock console to reduce noise in tests
const originalConsole = console;
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      generateKey: jest.fn().mockResolvedValue({}),
      importKey: jest.fn().mockResolvedValue({}),
      deriveKey: jest.fn().mockResolvedValue({}),
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

// Mock TextEncoder/TextDecoder
Object.defineProperty(global, 'TextEncoder', {
  value: class {
    encode(str: string) {
      return new Uint8Array(Buffer.from(str, 'utf8'));
    }
  }
});

Object.defineProperty(global, 'TextDecoder', {
  value: class {
    decode(bytes: any) {
      return Buffer.from(bytes).toString('utf8');
    }
  }
});

describe('StoragePlugin Integration Tests', () => {
  let storage: StoragePlugin;
  
  const testConfig: StoragePluginConfig = {
    backend: {
      type: 'memory',
      database: 'test_db'
    },
    gdpr: {
      enabled: true,
      encryption: {
        enabled: false, // Disabled for simpler testing
        algorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2'
      },
      consent: {
        required: false,
        purposes: [
          {
            id: 'test_purpose',
            name: 'Test Purpose',
            description: 'Testing',
            category: 'necessary',
            required: false
          }
        ]
      },
      audit: {
        enabled: true,
        retentionPeriod: '1 day',
        batchSize: 1
      }
    }
  };

  beforeEach(async () => {
    storage = createStoragePlugin(testConfig);
    await storage.initialize();
  });

  afterEach(async () => {
    if (storage) {
      await storage.destroy();
    }
  });

  describe('Plugin Lifecycle', () => {
    test('should initialize successfully', () => {
      expect(storage).toBeDefined();
      expect(storage.name).toBe('StoragePlugin');
      expect(storage.version).toBe('2.0.0');
    });

    test('should report correct status', () => {
      const status = storage.getStatus();
      expect(status.name).toBe('StoragePlugin');
      expect(status.status).toBe('active');
      expect(status.health).toBe('healthy');
    });

    test('should report capabilities', () => {
      const capabilities = storage.getCapabilities();
      expect(capabilities).toContain('storage');
      expect(capabilities).toContain('crud_operations');
      expect(capabilities).toContain('gdpr_compliance');
    });
  });

  describe('CRUD Operations', () => {
    const testUser = {
      id: 'user_1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    test('should create entity', async () => {
      const created = await storage.create(EntityType.USERS, testUser);
      expect(created).toMatchObject(testUser);
      expect(created.id).toBe(testUser.id);
    });

    test('should read entity', async () => {
      await storage.create(EntityType.USERS, testUser);
      const read = await storage.read(EntityType.USERS, testUser.id);
      expect(read).toMatchObject(testUser);
    });

    test('should update entity', async () => {
      await storage.create(EntityType.USERS, testUser);
      const updated = await storage.update(EntityType.USERS, testUser.id, {
        name: 'Updated User'
      });
      expect(updated.name).toBe('Updated User');
      expect(updated.id).toBe(testUser.id);
    });

    test('should delete entity', async () => {
      await storage.create(EntityType.USERS, testUser);
      await storage.delete(EntityType.USERS, testUser.id);
      const deleted = await storage.read(EntityType.USERS, testUser.id);
      expect(deleted).toBeNull();
    });

    test('should query entities', async () => {
      await storage.create(EntityType.USERS, testUser);
      await storage.create(EntityType.USERS, {
        ...testUser,
        id: 'user_2',
        email: 'test2@example.com'
      });
      
      const results = await storage.query(EntityType.USERS);
      expect(results).toHaveLength(2);
    });

    test('should count entities', async () => {
      await storage.create(EntityType.USERS, testUser);
      const count = await storage.count(EntityType.USERS);
      expect(count).toBe(1);
    });

    test('should clear table', async () => {
      await storage.create(EntityType.USERS, testUser);
      await storage.clear(EntityType.USERS);
      const count = await storage.count(EntityType.USERS);
      expect(count).toBe(0);
    });
  });

  describe('Batch Operations', () => {
    test('should create many entities', async () => {
      const users = [
        { id: 'user_1', email: 'user1@example.com', name: 'User 1', createdAt: new Date(), updatedAt: new Date(), version: 1 },
        { id: 'user_2', email: 'user2@example.com', name: 'User 2', createdAt: new Date(), updatedAt: new Date(), version: 1 }
      ];
      
      const created = await storage.createMany(EntityType.USERS, users);
      expect(created).toHaveLength(2);
      expect(created[0].id).toBe('user_1');
      expect(created[1].id).toBe('user_2');
    });
  });

  describe('Storage Information', () => {
    test('should get storage info', async () => {
      const info = await storage.getStorageInfo();
      expect(info).toHaveProperty('backend');
      expect(info).toHaveProperty('connected');
      expect(info).toHaveProperty('tables');
    });

    test('should get performance metrics', async () => {
      // Perform some operations to generate metrics
      await storage.create(EntityType.USERS, {
        id: 'test_user',
        email: 'test@example.com',
        name: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      });
      
      const metrics = await storage.getPerformanceMetrics();
      expect(metrics).toHaveProperty('operations');
      expect(metrics.operations).toBeGreaterThan(0);
    });
  });

  describe('GDPR Operations', () => {
    const userId = 'gdpr_test_user';
    
    beforeEach(async () => {
      // Create test data
      await storage.create(EntityType.USERS, {
        id: userId,
        email: 'gdpr@example.com',
        name: 'GDPR Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      });
    });

    test('should export user data', async () => {
      const exportResult = await storage.exportUserData(userId);
      expect(exportResult).toHaveProperty('userId', userId);
      expect(exportResult).toHaveProperty('data');
      expect(exportResult).toHaveProperty('exportedAt');
    });

    test('should delete user data', async () => {
      const deleteResult = await storage.deleteUserData(userId);
      expect(deleteResult).toHaveProperty('userId', userId);
      expect(deleteResult).toHaveProperty('deletedAt');
      
      // Verify user is deleted
      const user = await storage.read(EntityType.USERS, userId);
      expect(user).toBeNull();
    });

    test('should manage consent', async () => {
      await storage.grantConsent(userId, ['test_purpose']);
      const hasConsent = await storage.checkConsent(userId, 'test_purpose');
      expect(hasConsent).toBe(true);
      
      await storage.revokeConsent(userId, ['test_purpose']);
      const hasConsentAfterRevoke = await storage.checkConsent(userId, 'test_purpose');
      expect(hasConsentAfterRevoke).toBe(false);
    });
  });

  describe('Event System', () => {
    test('should emit events for data operations', async () => {
      const events: any[] = [];
      
      storage.on('data_created', (event) => {
        events.push({ type: 'created', ...event });
      });
      
      storage.on('data_updated', (event) => {
        events.push({ type: 'updated', ...event });
      });
      
      storage.on('data_deleted', (event) => {
        events.push({ type: 'deleted', ...event });
      });
      
      const testUser = {
        id: 'event_test_user',
        email: 'event@example.com',
        name: 'Event Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };
      
      // Create
      await storage.create(EntityType.USERS, testUser);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('created');
      
      // Update
      await storage.update(EntityType.USERS, testUser.id, { name: 'Updated' });
      expect(events).toHaveLength(2);
      expect(events[1].type).toBe('updated');
      
      // Delete
      await storage.delete(EntityType.USERS, testUser.id);
      expect(events).toHaveLength(3);
      expect(events[2].type).toBe('deleted');
    });
  });

  describe('Configuration Presets', () => {
    test('should create development preset', async () => {
      const devStorage = createStoragePluginWithPreset('development');
      await devStorage.initialize();
      
      const config = devStorage.getConfiguration();
      expect(config.backend?.type).toBe('memory');
      
      await devStorage.destroy();
    });

    test('should create testing preset', async () => {
      const testStorage = createStoragePluginWithPreset('testing');
      await testStorage.initialize();
      
      const config = testStorage.getConfiguration();
      expect(config.backend?.type).toBe('memory');
      
      await testStorage.destroy();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid operations gracefully', async () => {
      // Try to read non-existent entity
      const result = await storage.read(EntityType.USERS, 'non_existent');
      expect(result).toBeNull();
      
      // Try to update non-existent entity
      await expect(
        storage.update(EntityType.USERS, 'non_existent', { name: 'Updated' })
      ).rejects.toThrow();
      
      // Try to delete non-existent entity
      await expect(
        storage.delete(EntityType.USERS, 'non_existent')
      ).rejects.toThrow();
    });
  });
});

describe('Storage Plugin Utilities', () => {
  test('should validate storage configuration', () => {
    const { validateStorageConfig } = require('../index');
    
    // Valid config
    const validConfig = {
      backend: { type: 'memory', database: 'test' },
      gdpr: { enabled: true }
    };
    const validErrors = validateStorageConfig(validConfig);
    expect(validErrors).toHaveLength(0);
    
    // Invalid config
    const invalidConfig = {};
    const invalidErrors = validateStorageConfig(invalidConfig);
    expect(invalidErrors.length).toBeGreaterThan(0);
  });

  test('should provide recommended configuration', () => {
    const { getRecommendedConfig } = require('../index');
    
    const config = getRecommendedConfig({
      environment: 'browser',
      dataSize: 'medium',
      compliance: 'gdpr',
      performance: 'optimized'
    });
    
    expect(config.backend?.type).toBe('indexeddb');
    expect(config.gdpr?.enabled).toBe(true);
  });
});

// Test cleanup
afterAll(() => {
  // Clean up any global state
  delete (global as any).crypto;
  delete (global as any).TextEncoder;
  delete (global as any).TextDecoder;
});