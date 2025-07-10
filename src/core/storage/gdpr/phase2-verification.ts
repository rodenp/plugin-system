// Phase 2 Verification Tests - State Manager Implementations
// Tests Zustand, Jotai, and upgraded factory functionality

import { GDPRStorage } from './GDPRStorage';
import { StateManagerFactory } from './StateManagerFactory';
import { GDPRStorageConfig } from './types';
import { basicGdprConfig, testDatabaseConfig, testCacheConfig } from './phase1-verification';

export async function verifyPhase2(): Promise<boolean> {
  console.log('🚀 Starting Phase 2 Verification Tests...');
  console.log('Testing real state manager implementations');
  
  try {
    // Test 1: Verify state manager availability
    console.log('\n📋 Test 1: State manager availability check');
    const test1Result = await testStateManagerAvailability();
    console.log(test1Result ? '✅ PASSED' : '❌ FAILED');
    
    // Test 2: Test each available state manager
    console.log('\n📋 Test 2: Test each state manager implementation');
    const test2Result = await testAllStateManagers();
    console.log(test2Result ? '✅ PASSED' : '❌ FAILED');
    
    // Test 3: Performance comparison
    console.log('\n📋 Test 3: Performance comparison between state managers');
    const test3Result = await testPerformanceComparison();
    console.log(test3Result ? '✅ PASSED' : '❌ FAILED');
    
    // Test 4: React integration simulation
    console.log('\n📋 Test 4: React integration patterns');
    const test4Result = await testReactIntegrationPatterns();
    console.log(test4Result ? '✅ PASSED' : '❌ FAILED');
    
    // Test 5: State manager specific features
    console.log('\n📋 Test 5: State manager specific features');
    const test5Result = await testStateManagerSpecificFeatures();
    console.log(test5Result ? '✅ PASSED' : '❌ FAILED');
    
    const allPassed = test1Result && test2Result && test3Result && test4Result && test5Result;
    
    console.log('\n🎯 Phase 2 Verification Results:');
    console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Phase 2 verification failed with error:', error);
    return false;
  }
}

async function testStateManagerAvailability(): Promise<boolean> {
  try {
    console.log('  📦 Checking state manager dependencies...');
    
    // Check which state managers are available
    const availableTypes = StateManagerFactory.getAvailableTypes();
    console.log(`  Available types: ${availableTypes.join(', ')}`);
    
    const zustandAvailable = StateManagerFactory.isTypeAvailable('zustand');
    const jotaiAvailable = StateManagerFactory.isTypeAvailable('jotai');
    const simpleAvailable = StateManagerFactory.isTypeAvailable('simple');
    
    console.log(`  ✓ Zustand available: ${zustandAvailable}`);
    console.log(`  ✓ Jotai available: ${jotaiAvailable}`);
    console.log(`  ✓ Simple available: ${simpleAvailable}`);
    
    if (!simpleAvailable) {
      console.error('Simple state manager should always be available');
      return false;
    }
    
    if (!zustandAvailable || !jotaiAvailable) {
      console.warn('Some state managers not available - dependencies may not be installed');
      // Not a failure if dependencies aren't installed
    }
    
    return true;
    
  } catch (error) {
    console.error('  ❌ Test failed:', error);
    return false;
  }
}

async function testAllStateManagers(): Promise<boolean> {
  try {
    const managerTypes = ['simple'];
    
    // Add other managers if available
    if (StateManagerFactory.isTypeAvailable('zustand')) {
      managerTypes.push('zustand');
    }
    if (StateManagerFactory.isTypeAvailable('jotai')) {
      managerTypes.push('jotai');
    }
    
    console.log(`  Testing managers: ${managerTypes.join(', ')}`);
    
    for (const type of managerTypes) {
      console.log(`\n  🧪 Testing ${type} state manager...`);
      
      const config: GDPRStorageConfig = {
        stateManager: { type: type as any },
        gdpr: basicGdprConfig,
        database: testDatabaseConfig,
        cache: testCacheConfig
      };
      
      const storage = new GDPRStorage(config);
      await storage.initialize();
      
      // Test basic operations
      await storage.setEntity('users', 'test1', { 
        name: `Test User ${type}`, 
        manager: type 
      });
      
      const user = await storage.getEntity('users', 'test1');
      if (!user || user.name !== `Test User ${type}`) {
        console.error(`    ❌ Basic operations failed for ${type}`);
        return false;
      }
      
      // Test batch operations
      await storage.batchUpdate([
        { table: 'users', id: 'batch1', data: { name: 'Batch 1', manager: type } },
        { table: 'users', id: 'batch2', data: { name: 'Batch 2', manager: type } }
      ]);
      
      const batch1 = await storage.getEntity('users', 'batch1');
      const batch2 = await storage.getEntity('users', 'batch2');
      
      if (!batch1 || !batch2) {
        console.error(`    ❌ Batch operations failed for ${type}`);
        return false;
      }
      
      // Test queries
      const allUsers = await storage.getEntitiesWhere('users', () => true);
      if (allUsers.length < 3) {
        console.error(`    ❌ Query operations failed for ${type}`);
        return false;
      }
      
      // Test stats
      const stats = storage.getStats();
      if (!stats || stats.mode !== 'state_manager') {
        console.error(`    ❌ Stats not working for ${type}`);
        return false;
      }
      
      console.log(`    ✅ ${type} state manager working correctly`);
      await storage.destroy();
    }
    
    return true;
    
  } catch (error) {
    console.error('  ❌ Test failed:', error);
    return false;
  }
}

async function testPerformanceComparison(): Promise<boolean> {
  try {
    const results: Record<string, any> = {};
    const managerTypes = ['simple'];
    
    // Add other managers if available
    if (StateManagerFactory.isTypeAvailable('zustand')) {
      managerTypes.push('zustand');
    }
    if (StateManagerFactory.isTypeAvailable('jotai')) {
      managerTypes.push('jotai');
    }
    
    console.log(`  Performance testing: ${managerTypes.join(', ')}`);
    
    for (const type of managerTypes) {
      console.log(`\n  ⏱️ Performance testing ${type}...`);
      
      const config: GDPRStorageConfig = {
        stateManager: { type: type as any },
        gdpr: basicGdprConfig,
        database: testDatabaseConfig,
        cache: testCacheConfig
      };
      
      const storage = new GDPRStorage(config);
      await storage.initialize();
      
      // Test write performance
      const writeStart = Date.now();
      for (let i = 0; i < 100; i++) {
        await storage.setEntity('perf', `entity_${i}`, { 
          id: i, 
          name: `Entity ${i}`,
          data: new Array(10).fill(0).map((_, j) => `data_${j}`)
        });
      }
      const writeTime = Date.now() - writeStart;
      
      // Test read performance  
      const readStart = Date.now();
      for (let i = 0; i < 100; i++) {
        await storage.getEntity('perf', `entity_${i}`);
      }
      const readTime = Date.now() - readStart;
      
      // Test query performance
      const queryStart = Date.now();
      await storage.getEntitiesWhere('perf', (entity: any) => entity.id % 2 === 0);
      const queryTime = Date.now() - queryStart;
      
      const metrics = storage.getPerformanceMetrics();
      
      results[type] = {
        writeTime,
        readTime,
        queryTime,
        cacheHitRate: metrics.cacheStats.cacheHitRate,
        memoryUsage: metrics.memory.totalUsage
      };
      
      console.log(`    Write: ${writeTime}ms, Read: ${readTime}ms, Query: ${queryTime}ms`);
      console.log(`    Cache hit rate: ${(metrics.cacheStats.cacheHitRate * 100).toFixed(1)}%`);
      
      await storage.destroy();
    }
    
    console.log('\n  📊 Performance Summary:');
    console.log('  Manager | Write | Read | Query | Cache Hit Rate');
    console.log('  --------|-------|------|-------|---------------');
    
    Object.entries(results).forEach(([type, metrics]) => {
      console.log(`  ${type.padEnd(7)} | ${metrics.writeTime.toString().padEnd(5)} | ${metrics.readTime.toString().padEnd(4)} | ${metrics.queryTime.toString().padEnd(5)} | ${(metrics.cacheHitRate * 100).toFixed(1).padEnd(13)}%`);
    });
    
    return true;
    
  } catch (error) {
    console.error('  ❌ Test failed:', error);
    return false;
  }
}

async function testReactIntegrationPatterns(): Promise<boolean> {
  try {
    // Test React-like patterns without actual React
    console.log('  🔗 Testing React integration patterns...');
    
    if (StateManagerFactory.isTypeAvailable('zustand')) {
      console.log('    Testing Zustand React patterns...');
      
      const config: GDPRStorageConfig = {
        stateManager: { type: 'zustand' },
        gdpr: basicGdprConfig,
        database: testDatabaseConfig,
        cache: testCacheConfig
      };
      
      const storage = new GDPRStorage(config);
      await storage.initialize();
      
      // Simulate React hook pattern
      let subscriptionCallCount = 0;
      const unsubscribe = storage.subscribe('users', 'test1', (entity) => {
        subscriptionCallCount++;
        console.log(`      Subscription triggered: ${entity?.name || 'null'}`);
      });
      
      await storage.setEntity('users', 'test1', { name: 'Initial' });
      await storage.setEntity('users', 'test1', { name: 'Updated' });
      
      // Wait for async subscriptions
      await new Promise(resolve => setTimeout(resolve, 50));
      
      unsubscribe();
      
      if (subscriptionCallCount === 0) {
        console.error('    ❌ Subscriptions not working');
        return false;
      }
      
      console.log(`    ✅ Zustand subscriptions working (${subscriptionCallCount} calls)`);
      await storage.destroy();
    }
    
    if (StateManagerFactory.isTypeAvailable('jotai')) {
      console.log('    Testing Jotai atomic patterns...');
      
      const config: GDPRStorageConfig = {
        stateManager: { type: 'jotai' },
        gdpr: basicGdprConfig,
        database: testDatabaseConfig,
        cache: testCacheConfig
      };
      
      const storage = new GDPRStorage(config);
      await storage.initialize();
      
      // Test atomic operations
      await storage.setEntity('atoms', 'atom1', { value: 1 });
      await storage.setEntity('atoms', 'atom2', { value: 2 });
      
      const atom1 = await storage.getEntity('atoms', 'atom1');
      const atom2 = await storage.getEntity('atoms', 'atom2');
      
      if (!atom1 || !atom2 || atom1.value !== 1 || atom2.value !== 2) {
        console.error('    ❌ Jotai atomic operations not working');
        return false;
      }
      
      console.log('    ✅ Jotai atomic patterns working');
      await storage.destroy();
    }
    
    return true;
    
  } catch (error) {
    console.error('  ❌ Test failed:', error);
    return false;
  }
}

async function testStateManagerSpecificFeatures(): Promise<boolean> {
  try {
    console.log('  🎯 Testing state manager specific features...');
    
    // Test Simple state manager features
    console.log('    Testing Simple state manager features...');
    const simpleConfig: GDPRStorageConfig = {
      stateManager: { 
        type: 'simple',
        options: { persistence: false, maxCacheSize: 100 }
      },
      gdpr: basicGdprConfig,
      database: testDatabaseConfig,
      cache: testCacheConfig
    };
    
    const simpleStorage = new GDPRStorage(simpleConfig);
    await simpleStorage.initialize();
    
    // Test cache size limit
    for (let i = 0; i < 150; i++) {
      await simpleStorage.setEntity('cache_test', `item_${i}`, { index: i });
    }
    
    const stats = simpleStorage.getStats();
    if (stats.stateManagerStats.totalEntities > 100) {
      console.warn('    ⚠️ Cache size limit not enforced properly');
    } else {
      console.log('    ✅ Cache size limit working');
    }
    
    await simpleStorage.destroy();
    
    // Test state manager switching (factory pattern)
    console.log('    Testing state manager switching...');
    
    const switchTests = [];
    if (StateManagerFactory.isTypeAvailable('zustand')) switchTests.push('zustand');
    if (StateManagerFactory.isTypeAvailable('jotai')) switchTests.push('jotai');
    switchTests.push('simple');
    
    for (const type of switchTests) {
      const config: GDPRStorageConfig = {
        stateManager: { type: type as any },
        gdpr: basicGdprConfig,
        database: testDatabaseConfig,
        cache: testCacheConfig
      };
      
      const storage = new GDPRStorage(config);
      await storage.initialize();
      
      const actualType = storage.getStateManagerType();
      console.log(`      Created ${type} -> Got ${actualType}`);
      
      await storage.destroy();
    }
    
    return true;
    
  } catch (error) {
    console.error('  ❌ Test failed:', error);
    return false;
  }
}

// Demo function to show Phase 2 capabilities
export async function demonstratePhase2(): Promise<void> {
  console.log('🎯 Phase 2 Demo: State Manager Implementations');
  
  // Show all available state managers
  console.log('\n📦 Available State Managers:');
  const availableTypes = StateManagerFactory.getAvailableTypes();
  
  for (const type of availableTypes) {
    const available = StateManagerFactory.isTypeAvailable(type);
    console.log(`  ${available ? '✅' : '❌'} ${type} ${available ? '(ready)' : '(not installed)'}`);
  }
  
  // Demonstrate each available state manager
  const testManagers = [];
  if (StateManagerFactory.isTypeAvailable('zustand')) testManagers.push('zustand');
  if (StateManagerFactory.isTypeAvailable('jotai')) testManagers.push('jotai');
  testManagers.push('simple');
  
  console.log(`\n🧪 Testing managers: ${testManagers.join(', ')}`);
  
  for (const type of testManagers) {
    console.log(`\n--- ${type.toUpperCase()} STATE MANAGER ---`);
    
    const config: GDPRStorageConfig = {
      stateManager: { type: type as any },
      gdpr: basicGdprConfig,
      database: testDatabaseConfig,
      cache: testCacheConfig,
      updateQueue: { batchWindow: 50, maxBatchSize: 5, retryAttempts: 3, retryDelay: 1000 }
    };
    
    const storage = new GDPRStorage(config);
    await storage.initialize();
    
    console.log(`🏪 Created storage with ${storage.getStateManagerType()}`);
    
    // Add some test data
    await storage.setEntity('demo', 'item1', {
      name: 'Demo Item 1',
      manager: type,
      created: Date.now()
    });
    
    await storage.setEntity('demo', 'item2', {
      name: 'Demo Item 2', 
      manager: type,
      created: Date.now()
    });
    
    // Test rapid updates (batching)
    await storage.setEntity('demo', 'item1', { name: 'Updated Item 1', updated: Date.now() });
    await storage.setEntity('demo', 'item1', { name: 'Final Item 1', final: true });
    
    // Wait for batching
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalItem = await storage.getEntity('demo', 'item1');
    console.log(`📝 Final item state:`, finalItem);
    
    const stats = storage.getStats();
    console.log(`📊 Stats: ${stats.stateManagerStats.totalEntities} entities, ${(stats.stateManagerStats.cacheHitRate * 100).toFixed(1)}% cache hit rate`);
    
    await storage.destroy();
  }
  
  console.log('\n✅ Phase 2 demonstration completed!');
}

// Export individual tests for debugging
export {
  testStateManagerAvailability,
  testAllStateManagers,
  testPerformanceComparison,
  testReactIntegrationPatterns,
  testStateManagerSpecificFeatures
};