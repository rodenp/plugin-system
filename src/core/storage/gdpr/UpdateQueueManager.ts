// Update Queue Manager - Phase 1: Core Architecture Foundation
// Handles batched updates with 100ms window and timer reset mechanism

import {
  StateManager,
  EntityUpdate,
  EntityRemoval,
  UpdateQueueConfig,
  GDPRStorageError
} from './types';

interface QueueEntry {
  table: string;
  id: string;
  changes: Record<string, any>;
  metadata: {
    userId?: string;
    startTime: number;
    updateCount: number;
    lastUpdate: number;
  };
  timerId: NodeJS.Timeout | null;
}

interface QueueStats {
  pendingUpdates: number;
  totalProcessed: number;
  averageBatchSize: number;
  averageProcessingTime: number;
  successRate: number;
  errors: number;
}

export class UpdateQueueManager {
  private pendingUpdates = new Map<string, QueueEntry>();
  private stateManager?: StateManager;
  private config: UpdateQueueConfig;
  private stats: QueueStats = {
    pendingUpdates: 0,
    totalProcessed: 0,
    averageBatchSize: 0,
    averageProcessingTime: 0,
    successRate: 1.0,
    errors: 0
  };
  private processingTimes: number[] = [];
  private batchSizes: number[] = [];

  constructor(
    stateManager?: StateManager,
    config?: UpdateQueueConfig
  ) {
    this.stateManager = stateManager;
    this.config = {
      batchWindow: 100, // 100ms default
      maxBatchSize: 50,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
    
    console.log(
      `UpdateQueueManager initialized ${stateManager ? 'WITH' : 'WITHOUT'} state manager`,
      { config: this.config }
    );
  }

  async initialize(): Promise<void> {
    console.log('UpdateQueueManager: Initialization complete');
  }

  queueUpdate(table: string, id: string, data: any, options: any = {}): void {
    const key = `${table}:${id}`;
    
    try {
      console.log(`🔄 [UpdateQueue] Queueing update for ${key}...`);
      
      // Initialize or get existing queue entry
      if (!this.pendingUpdates.has(key)) {
        console.log(`📝 [UpdateQueue] Creating new queue entry for ${key}`);
        const entry: QueueEntry = {
          table,
          id,
          changes: {},
          metadata: {
            userId: options.userId,
            startTime: Date.now(),
            updateCount: 0,
            lastUpdate: Date.now()
          },
          timerId: null
        };
        this.pendingUpdates.set(key, entry);
      } else {
        console.log(`📋 [UpdateQueue] Found existing queue entry for ${key}, merging changes...`);
      }
      
      const updateEntry = this.pendingUpdates.get(key)!;
      const oldChanges = Object.keys(updateEntry.changes);
      
      // Merge changes
      updateEntry.changes = { ...updateEntry.changes, ...data };
      updateEntry.metadata.updateCount++;
      updateEntry.metadata.lastUpdate = Date.now();
      
      const newChanges = Object.keys(updateEntry.changes);
      console.log(`🔀 [UpdateQueue] Merged changes for ${key}:`, {
        oldFields: oldChanges,
        newFields: Object.keys(data),
        allFields: newChanges,
        updateCount: updateEntry.metadata.updateCount
      });
      
      // Reset timer (key feature: timer reset mechanism)
      if (updateEntry.timerId) {
        console.log(`⏰ [UpdateQueue] Clearing existing timer for ${key} (timer reset mechanism)`);
        clearTimeout(updateEntry.timerId);
      }
      
      console.log(`⏱️  [UpdateQueue] Setting ${this.config.batchWindow}ms timer for ${key}...`);
      updateEntry.timerId = setTimeout(() => {
        console.log(`🚀 [UpdateQueue] Timer expired! Executing batched update for ${key}`);
        this.executeUpdate(key);
      }, this.config.batchWindow);
      
      // Update state manager immediately (if available) for UI responsiveness
      if (this.stateManager) {
        console.log(`💾 [UpdateQueue] Updating state manager immediately for UI responsiveness`);
        this.stateManager.setEntity(table, id, { 
          ...data, 
          _lastUpdated: Date.now(),
          _queued: true 
        });
      } else {
        console.log(`⚠️  [UpdateQueue] No state manager available - UI will wait for batch completion`);
      }
      
      // Update stats
      this.stats.pendingUpdates = this.pendingUpdates.size;
      
      console.log(`📊 [UpdateQueue] Queue status:`, {
        hasStateManager: !!this.stateManager,
        pendingChanges: Object.keys(updateEntry.changes),
        updateCount: updateEntry.metadata.updateCount,
        queueSize: this.pendingUpdates.size,
        batchWindow: this.config.batchWindow + 'ms'
      });
      
    } catch (error) {
      console.error(`Failed to queue update for ${key}:`, error);
      throw new GDPRStorageError(
        `Failed to queue update for ${table}:${id}`,
        'QUEUE_UPDATE_ERROR',
        error
      );
    }
  }

  queueDeletion(table: string, id: string, options: any = {}): void {
    const key = `${table}:${id}`;
    
    try {
      // For deletions, we execute immediately (no batching needed)
      this.executeDeletion(table, id, options);
      
      // Remove any pending updates for this entity
      if (this.pendingUpdates.has(key)) {
        const entry = this.pendingUpdates.get(key)!;
        if (entry.timerId) {
          clearTimeout(entry.timerId);
        }
        this.pendingUpdates.delete(key);
      }
      
      console.log(`Queued deletion for ${key}`);
      
    } catch (error) {
      console.error(`Failed to queue deletion for ${key}:`, error);
      throw new GDPRStorageError(
        `Failed to queue deletion for ${table}:${id}`,
        'QUEUE_DELETION_ERROR',
        error
      );
    }
  }

  batchUpdate(updates: EntityUpdate[]): void {
    try {
      // Group updates by entity for efficient batching
      const updatesByEntity = new Map<string, any>();
      
      updates.forEach(({ table, id, data, metadata }) => {
        const key = `${table}:${id}`;
        if (!updatesByEntity.has(key)) {
          updatesByEntity.set(key, { table, id, data: {}, metadata });
        }
        const existing = updatesByEntity.get(key);
        existing.data = { ...existing.data, ...data };
      });
      
      // Queue each grouped update
      updatesByEntity.forEach(({ table, id, data, metadata }) => {
        this.queueUpdate(table, id, data, metadata);
      });
      
      console.log(`Batch queued ${updates.length} updates (${updatesByEntity.size} unique entities)`);
      
    } catch (error) {
      console.error('Failed to batch update:', error);
      throw new GDPRStorageError(
        'Failed to batch update entities',
        'BATCH_UPDATE_ERROR',
        error
      );
    }
  }

  async executeUpdate(key: string, attempt: number = 1): Promise<void> {
    const updateEntry = this.pendingUpdates.get(key);
    if (!updateEntry) {
      console.warn(`⚠️  [UpdateQueue] Update entry not found for key: ${key}`);
      return;
    }
    
    const startTime = Date.now();
    const queuedDuration = startTime - updateEntry.metadata.startTime;
    
    console.log(`🎯 [UpdateQueue] EXECUTING batched update for ${key} (attempt ${attempt})`);
    console.log(`📋 [UpdateQueue] Update details:`, {
      hasStateManager: !!this.stateManager,
      fields: Object.keys(updateEntry.changes),
      updateCount: updateEntry.metadata.updateCount,
      queuedFor: queuedDuration + 'ms',
      batchWindow: this.config.batchWindow + 'ms'
    });
    
    try {
      console.log(`💾 [UpdateQueue] Starting database update simulation...`);
      // Phase 1: Placeholder for database update (will implement in Phase 4)
      await this.executeDatabaseUpdate(updateEntry);
      
      console.log(`🔄 [UpdateQueue] Database update completed, updating state manager...`);
      // Update state manager if available (ensure consistency)
      if (this.stateManager) {
        this.stateManager.setEntity(
          updateEntry.table,
          updateEntry.id,
          { 
            ...updateEntry.changes, 
            _lastUpdated: Date.now(),
            _queued: false 
          }
        );
        console.log(`💾 [UpdateQueue] State manager updated - entity marked as no longer queued`);
      } else {
        console.log(`⚠️  [UpdateQueue] No state manager to update`);
      }
      
      // Record successful update
      const processingTime = Date.now() - startTime;
      this.recordSuccess(processingTime, Object.keys(updateEntry.changes).length);
      
      console.log(`✅ [UpdateQueue] Update COMPLETED for ${key}!`, {
        processingTime: processingTime + 'ms',
        totalTime: (startTime + processingTime - updateEntry.metadata.startTime) + 'ms',
        fieldsUpdated: Object.keys(updateEntry.changes).length,
        batchSize: Object.keys(updateEntry.changes).length
      });
      
    } catch (error) {
      console.error(`❌ Update failed for ${key} (attempt ${attempt}):`, error);
      this.stats.errors++;
      
      // Retry logic
      if (attempt < this.config.retryAttempts) {
        console.log(`Retrying update for ${key} in ${this.config.retryDelay}ms`);
        setTimeout(() => {
          this.executeUpdate(key, attempt + 1);
        }, this.config.retryDelay * attempt); // Exponential backoff
        return;
      }
      
      // Max retries exceeded - handle failure
      await this.handleUpdateFailure(key, updateEntry, error);
      
    } finally {
      // Clean up queue entry
      this.pendingUpdates.delete(key);
      this.stats.pendingUpdates = this.pendingUpdates.size;
    }
  }

  private async executeDeletion(table: string, id: string, options: any): Promise<void> {
    try {
      // Phase 1: Placeholder for database deletion (will implement in Phase 4)
      console.log(`Executing deletion for ${table}:${id} (placeholder)`);
      
      // Remove from state manager if available
      if (this.stateManager) {
        this.stateManager.removeEntity(table, id);
      }
      
      console.log(`✅ Deletion completed for ${table}:${id}`);
      
    } catch (error) {
      console.error(`❌ Deletion failed for ${table}:${id}:`, error);
      throw error;
    }
  }

  private async executeDatabaseUpdate(entry: QueueEntry): Promise<void> {
    // Phase 1: Placeholder implementation
    // This will be replaced with actual database operations in Phase 4
    
    return new Promise((resolve, reject) => {
      // Simulate database operation
      setTimeout(() => {
        // Simulate occasional failures for testing
        if (Math.random() < 0.05) { // 5% failure rate
          reject(new Error('Simulated database error'));
        } else {
          console.log(`Database update simulated for ${entry.table}:${entry.id}`, {
            changes: Object.keys(entry.changes),
            updateCount: entry.metadata.updateCount
          });
          resolve();
        }
      }, Math.random() * 10); // Simulate 0-10ms database latency
    });
  }

  private async handleUpdateFailure(key: string, entry: QueueEntry, error: any): Promise<void> {
    console.error(`Final update failure for ${key}:`, error);
    
    // If we have a state manager, we might need to rollback
    if (this.stateManager) {
      try {
        // Phase 1: Placeholder - would reload from database to fix inconsistency
        console.log(`Would rollback state for ${key} (placeholder)`);
        
        // For now, just remove the entity to indicate failure
        this.stateManager.setEntity(entry.table, entry.id, { 
          _error: 'Update failed after retries',
          _failed: true,
          _lastError: error.message 
        });
        
      } catch (rollbackError) {
        console.error('Failed to rollback state:', rollbackError);
      }
    }
    
    // Could implement dead letter queue here for failed updates
    console.log(`Update ${key} moved to failed state`);
  }

  private recordSuccess(processingTime: number, batchSize: number): void {
    this.stats.totalProcessed++;
    
    // Track processing times (keep last 100)
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }
    
    // Track batch sizes (keep last 100)
    this.batchSizes.push(batchSize);
    if (this.batchSizes.length > 100) {
      this.batchSizes.shift();
    }
    
    // Update averages
    this.stats.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
    
    this.stats.averageBatchSize = 
      this.batchSizes.reduce((sum, size) => sum + size, 0) / this.batchSizes.length;
    
    // Update success rate
    this.stats.successRate = this.stats.totalProcessed / (this.stats.totalProcessed + this.stats.errors);
  }

  getStats(): QueueStats & { hasStateManager: boolean; config: UpdateQueueConfig } {
    return {
      ...this.stats,
      pendingUpdates: this.pendingUpdates.size,
      hasStateManager: !!this.stateManager,
      config: this.config
    };
  }

  getQueueStatus(): Array<{ key: string; queuedFor: number; updateCount: number }> {
    const now = Date.now();
    return Array.from(this.pendingUpdates.entries()).map(([key, entry]) => ({
      key,
      queuedFor: now - entry.metadata.startTime,
      updateCount: entry.metadata.updateCount
    }));
  }

  // Force flush all pending updates (useful for testing or shutdown)
  async flushAll(): Promise<void> {
    console.log(`Flushing ${this.pendingUpdates.size} pending updates`);
    
    const promises = Array.from(this.pendingUpdates.keys()).map(key => {
      const entry = this.pendingUpdates.get(key);
      if (entry?.timerId) {
        clearTimeout(entry.timerId);
      }
      return this.executeUpdate(key);
    });
    
    await Promise.allSettled(promises);
    console.log('All pending updates flushed');
  }

  clear(): void {
    // Clear all pending timers
    this.pendingUpdates.forEach(entry => {
      if (entry.timerId) {
        clearTimeout(entry.timerId);
      }
    });
    
    this.pendingUpdates.clear();
    this.stats.pendingUpdates = 0;
    
    console.log('UpdateQueueManager cleared');
  }

  async destroy(): Promise<void> {
    console.log('UpdateQueueManager: Destroying...');
    
    // Flush any pending updates before destroying
    try {
      await this.flushAll();
    } catch (error) {
      console.error('Error flushing updates during destroy:', error);
    }
    
    this.clear();
    console.log('UpdateQueueManager destroyed');
  }

  // Get performance insights
  getPerformanceInsights(): {
    avgProcessingTime: number;
    p95ProcessingTime: number;
    avgBatchSize: number;
    successRate: number;
    currentQueueLength: number;
    recommendations: string[];
  } {
    const sortedTimes = [...this.processingTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95Time = sortedTimes[p95Index] || 0;
    
    const recommendations: string[] = [];
    
    if (this.stats.averageProcessingTime > 100) {
      recommendations.push('Consider optimizing database operations - average processing time is high');
    }
    
    if (this.stats.successRate < 0.95) {
      recommendations.push('Success rate is below 95% - check database connectivity and error logs');
    }
    
    if (this.pendingUpdates.size > 20) {
      recommendations.push('Queue length is high - consider reducing batch window or scaling database');
    }
    
    if (this.stats.averageBatchSize < 2) {
      recommendations.push('Low batch efficiency - consider increasing batch window');
    }
    
    return {
      avgProcessingTime: this.stats.averageProcessingTime,
      p95ProcessingTime: p95Time,
      avgBatchSize: this.stats.averageBatchSize,
      successRate: this.stats.successRate,
      currentQueueLength: this.pendingUpdates.size,
      recommendations
    };
  }
}