// Phase 1 Verification Tests - Core Architecture Foundation
// Tests basic functionality without state manager and with simple state manager

import { GDPRStorage } from './GDPRStorage';
import { StateManagerFactory } from './StateManagerFactory';
import { GDPRStorageConfig } from './types';

// Test configurations
const basicGdprConfig = {
  encryption: {
    algorithm: 'AES-256-GCM' as const,
    keyDerivation: 'PBKDF2' as const,
    enabled: false // Phase 1: encryption disabled
  },
  audit: {
    enabled: true,
    logLevel: 'standard' as const,
    retentionDays: 90,
    exportFormat: 'json' as const
  },
  retention: {
    defaultPolicy: 'P2Y',
    gracePeriod: 30,
    automaticCleanup: false,
    policies: {}
  },
  consent: {
    required: false, // Phase 1: consent disabled
    defaultConsent: true,
    purposes: [],
    expiryDays: 365
  },
  dataElements: {
    autoRegister: true,
    validation: false, // Phase 1: validation disabled
    inferSensitivity: false
  }
};

const testDatabaseConfig = {
  type: 'memory' as const,
  options: {}
};

const testCacheConfig = {
  enabled: true,
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  strategy: 'lru' as const
};

// Verification functions
export async function verifyPhase1(): Promise<boolean> {
  console.log('🚀 Starting Phase 1 Verification Tests...');
  
  try {
    // Test 1: Basic functionality without state manager
    console.log('\n📋 Test 1: Basic GDPR Storage without state manager');
    const test1Result = await testBasicFunctionalityWithoutStateManager();
    console.log(test1Result ? '✅ PASSED' : '❌ FAILED');
    
    // Test 2: Basic functionality with simple state manager
    console.log('\n📋 Test 2: Basic GDPR Storage with simple state manager');
    const test2Result = await testBasicFunctionalityWithSimpleStateManager();
    console.log(test2Result ? '✅ PASSED' : '❌ FAILED');
    
    // Test 3: Update queue functionality
    console.log('\n📋 Test 3: Update queue batching');
    const test3Result = await testUpdateQueueBatching();
    console.log(test3Result ? '✅ PASSED' : '❌ FAILED');
    
    // Test 4: Performance and stats
    console.log('\n📋 Test 4: Performance tracking and stats');
    const test4Result = await testPerformanceTracking();
    console.log(test4Result ? '✅ PASSED' : '❌ FAILED');
    
    // Test 5: Error handling
    console.log('\n📋 Test 5: Error handling');
    const test5Result = await testErrorHandling();
    console.log(test5Result ? '✅ PASSED' : '❌ FAILED');
    
    const allPassed = test1Result && test2Result && test3Result && test4Result && test5Result;
    
    console.log('\n🎯 Phase 1 Verification Results:');
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Phase 1 verification failed with error:', error);
    return false;
  }
}

async function testBasicFunctionalityWithoutStateManager(): Promise<boolean> {
  try {
    const config: GDPRStorageConfig = {
      // No state manager specified
      gdpr: basicGdprConfig,
      database: testDatabaseConfig,
      cache: testCacheConfig
    };
    
    const storage = new GDPRStorage(config);
    await storage.initialize();
    
    // Test basic entity operations
    await storage.setEntity('users', 'test1', { name: 'Test User', email: 'test@example.com' });
    const user = await storage.getEntity('users', 'test1');
    
    if (!user || user.name !== 'Test User') {
      console.error('Basic entity operations failed');
      return false;
    }
    
    // Test stats
    const stats = storage.getStats();
    if (stats.mode !== 'simple_cache') {
      console.error('Expected simple_cache mode');
      return false;
    }
    
    // Test removal
    await storage.removeEntity('users', 'test1');
    const removedUser = await storage.getEntity('users', 'test1');
    
    if (removedUser !== null) {
      console.error('Entity removal failed');
      return false;
    }
    
    await storage.destroy();
    console.log('  ✓ Basic operations work without state manager');
    return true;
    
  } catch (error) {
    console.error('  ❌ Test failed:', error);
    return false;
  }
}

async function testBasicFunctionalityWithSimpleStateManager(): Promise<boolean> {
  try {
    const config: GDPRStorageConfig = {
      stateManager: { type: 'simple' },
      gdpr: basicGdprConfig,
      database: testDatabaseConfig,
      cache: testCacheConfig
    };
    
    const storage = new GDPRStorage(config);
    await storage.initialize();
    
    // Test basic entity operations
    await storage.setEntity('users', 'test2', { name: 'Test User 2', email: 'test2@example.com' });
    const user = await storage.getEntity('users', 'test2');
    
    if (!user || user.name !== 'Test User 2') {
      console.error('Basic entity operations with state manager failed');
      return false;
    }
    
    // Test stats
    const stats = storage.getStats();
    if (stats.mode !== 'state_manager') {
      console.error('Expected state_manager mode');
      return false;
    }
    
    // Test batch operations
    await storage.batchUpdate([
      { table: 'users', id: 'batch1', data: { name: 'Batch User 1' } },
      { table: 'users', id: 'batch2', data: { name: 'Batch User 2' } }
    ]);
    
    const batchUser1 = await storage.getEntity('users', 'batch1');
    const batchUser2 = await storage.getEntity('users', 'batch2');
    
    if (!batchUser1 || !batchUser2) {
      console.error('Batch operations failed');
      return false;
    }
    
    // Test queries
    const allUsers = await storage.getEntitiesWhere('users', () => true);
    if (allUsers.length < 3) { // test2, batch1, batch2
      console.error('Query operations failed');
      return false;
    }
    
    await storage.destroy();
    console.log('  ✓ Basic operations work with simple state manager');
    return true;
    
  } catch (error) {
    console.error('  ❌ Test failed:', error);
    return false;
  }
}

async function testUpdateQueueBatching(): Promise<boolean> {
  try {
    const config: GDPRStorageConfig = {
      stateManager: { type: 'simple' },
      gdpr: basicGdprConfig,
      database: testDatabaseConfig,
      cache: testCacheConfig,
      updateQueue: {
        batchWindow: 50, // 50ms for faster testing
        maxBatchSize: 10,
        retryAttempts: 2,
        retryDelay: 100
      }
    };
    
    const storage = new GDPRStorage(config);
    await storage.initialize();
    
    // Test rapid updates (should be batched)
    await storage.setEntity('users', 'queue_test', { name: 'Initial' });
    await storage.setEntity('users', 'queue_test', { name: 'Update 1', count: 1 });
    await storage.setEntity('users', 'queue_test', { name: 'Update 2', count: 2 });
    await storage.setEntity('users', 'queue_test', { name: 'Final', count: 3 });
    
    // Wait for batch processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalUser = await storage.getEntity('users', 'queue_test');
    if (!finalUser || finalUser.name !== 'Final' || finalUser.count !== 3) {
      console.error('Update queue batching failed');
      return false;
    }
    
    // Test queue stats
    const stats = storage.getStats();
    if (!stats.updateQueue) {
      console.error('Update queue stats not available');
      return false;
    }
    
    await storage.destroy();
    console.log('  ✓ Update queue batching works correctly');
    return true;
    
  } catch (error) {
    console.error('  ❌ Test failed:', error);
    return false;
  }
}

async function testPerformanceTracking(): Promise<boolean> {
  try {
    const config: GDPRStorageConfig = {
      stateManager: { type: 'simple' },
      gdpr: basicGdprConfig,
      database: testDatabaseConfig,
      cache: testCacheConfig
    };
    
    const storage = new GDPRStorage(config);
    await storage.initialize();
    
    // Generate some activity for performance tracking
    for (let i = 0; i < 10; i++) {
      await storage.setEntity('users', `perf_${i}`, { 
        name: `Performance User ${i}`,
        index: i 
      });
    }
    
    // Test cache hits
    for (let i = 0; i < 5; i++) {
      await storage.getEntity('users', `perf_${i}`);
    }
    
    // Get performance metrics
    const metrics = storage.getPerformanceMetrics();
    if (!metrics || !metrics.cacheStats) {
      console.error('Performance metrics not available');
      return false;
    }
    
    if (metrics.cacheStats.totalRequests === 0) {
      console.error('Performance tracking not working');
      return false;
    }
    
    // Test state manager stats
    const stats = storage.getStats();
    if (!stats.stateManagerStats || stats.stateManagerStats.totalEntities === 0) {
      console.error('State manager stats not available');
      return false;
    }
    
    await storage.destroy();
    console.log('  ✓ Performance tracking works correctly');
    return true;
    
  } catch (error) {
    console.error('  ❌ Test failed:', error);
    return false;
  }
}

async function testErrorHandling(): Promise<boolean> {
  try {
    // Test initialization error handling
    try {
      const storage = new GDPRStorage({} as any); // Invalid config
      console.error('Should have thrown error for invalid config');
      return false;
    } catch (error) {
      // Expected error
    }
    
    // Test operations on uninitialized storage
    const config: GDPRStorageConfig = {
      stateManager: { type: 'simple' },
      gdpr: basicGdprConfig,
      database: testDatabaseConfig,
      cache: testCacheConfig
    };
    
    const storage = new GDPRStorage(config);
    
    try {
      await storage.getEntity('users', 'test');
      console.error('Should have thrown error for uninitialized storage');
      return false;
    } catch (error) {
      // Expected error
    }
    
    // Test state manager factory errors
    try {
      StateManagerFactory.create({ type: 'invalid' as any });
      console.error('Should have thrown error for invalid state manager type');
      return false;
    } catch (error) {
      // Expected error
    }
    
    console.log('  ✓ Error handling works correctly');
    return true;
    
  } catch (error) {
    console.error('  ❌ Test failed:', error);
    return false;
  }
}

// Export individual test functions for debugging
export {
  testBasicFunctionalityWithoutStateManager,
  testBasicFunctionalityWithSimpleStateManager,
  testUpdateQueueBatching,
  testPerformanceTracking,
  testErrorHandling
};

// Test configuration exports
export {
  basicGdprConfig,
  testDatabaseConfig,
  testCacheConfig
};

// Utility function to run specific test
export async function runSingleTest(testName: string): Promise<boolean> {
  console.log(`🧪 Running single test: ${testName}`);
  
  switch (testName) {
    case 'basic-without-state-manager':
      return await testBasicFunctionalityWithoutStateManager();
    case 'basic-with-simple-state-manager':
      return await testBasicFunctionalityWithSimpleStateManager();
    case 'update-queue-batching':
      return await testUpdateQueueBatching();
    case 'performance-tracking':
      return await testPerformanceTracking();
    case 'error-handling':
      return await testErrorHandling();
    default:
      console.error(`Unknown test: ${testName}`);
      return false;
  }
}

// Demo function to show the system in action
export async function demonstratePhase1(): Promise<void> {
  console.log('🎯 Phase 1 Demo: GDPR Storage in Action');
  
  const config: GDPRStorageConfig = {
    stateManager: { type: 'simple', options: { persistence: false } },
    gdpr: basicGdprConfig,
    database: testDatabaseConfig,
    cache: testCacheConfig,
    updateQueue: { batchWindow: 100, maxBatchSize: 5, retryAttempts: 3, retryDelay: 1000 }
  };
  
  const storage = new GDPRStorage(config);
  await storage.initialize();
  
  console.log('\n📝 Creating test data...');
  
  // Create users
  await storage.setEntity('users', 'user1', {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin'
  });
  
  await storage.setEntity('users', 'user2', {
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'user'
  });
  
  // Create comments
  await storage.setEntity('comments', 'comment1', {
    content: 'This is a great feature!',
    authorId: 'user1',
    targetId: 'feature1'
  });
  
  await storage.setEntity('comments', 'comment2', {
    content: 'I agree with Alice',
    authorId: 'user2',
    targetId: 'feature1'
  });
  
  console.log('✅ Test data created');
  
  console.log('\n📊 Current Stats:');
  const stats = storage.getStats();
  console.log(JSON.stringify(stats, null, 2));
  
  console.log('\n🔄 Testing rapid updates (will be batched):');
  await storage.setEntity('users', 'user1', { name: 'Alice Johnson', lastActive: Date.now() });
  await storage.setEntity('users', 'user1', { name: 'Alice Johnson', status: 'online' });
  await storage.setEntity('users', 'user1', { name: 'Alice Johnson-Updated', status: 'online' });
  
  // Wait for batching
  await new Promise(resolve => setTimeout(resolve, 150));
  
  console.log('\n👤 Final user state:');
  const finalUser = await storage.getEntity('users', 'user1');
  console.log(JSON.stringify(finalUser, null, 2));
  
  console.log('\n📈 Performance Metrics:');
  const metrics = storage.getPerformanceMetrics();
  console.log(JSON.stringify(metrics, null, 2));
  
  console.log('\n🧹 Cleaning up...');
  await storage.destroy();
  
  console.log('✅ Demo completed successfully!');
}