// Update Queue - Batched update system for performance optimization
import {
  UpdateQueueConfig,
  StorageEntity,
  StorageBackend,
  StorageError,
  QueuedOperation,
  BatchResult,
  UpdateQueueStats
} from './types';

export class UpdateQueue {
  private config: UpdateQueueConfig;
  private adapter: StorageBackend;
  private queue: Map<string, QueuedOperation> = new Map();
  private batchTimer?: NodeJS.Timeout;
  private entityTimers: Map<string, NodeJS.Timeout> = new Map(); // Per-entity timers
  private isInitialized = false;
  private isProcessing = false;
  private stats: UpdateQueueStats = {
    totalOperations: 0,
    batchesProcessed: 0,
    averageBatchSize: 0,
    averageProcessingTime: 0,
    errorCount: 0,
    currentQueueSize: 0
  };
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: UpdateQueueConfig, adapter: StorageBackend) {
    this.config = this.validateConfig(config);
    this.adapter = adapter;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('UpdateQueue already initialized');
      return;
    }

    try {
      console.log('📋 Initializing UpdateQueue...');
      
      // Set up error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('✅ UpdateQueue initialized with per-entity timer management');
      
    } catch (error) {
      throw new StorageError(
        `Failed to initialize UpdateQueue: ${(error as Error).message}`,
        'INITIALIZATION_ERROR',
        { config: this.sanitizeConfig() }
      );
    }
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      console.log('📋 Destroying UpdateQueue...');
      
      // Process remaining queue items
      if (this.queue.size > 0) {
        console.log(`Processing ${this.queue.size} remaining queue items...`);
        await this.processBatch();
      }
      
      // Clear global batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = undefined;
      }
      
      // Clear all entity timers
      for (const timer of Array.from(this.entityTimers.values())) {
        clearTimeout(timer);
      }
      this.entityTimers.clear();
      
      // Clear state
      this.queue.clear();
      this.eventListeners.clear();
      
      this.isInitialized = false;
      console.log('✅ UpdateQueue destroyed');
      
    } catch (error) {
      console.error('❌ UpdateQueue destruction failed:', error);
      throw new StorageError(
        `Failed to destroy UpdateQueue: ${(error as Error).message}`,
        'DESTRUCTION_ERROR'
      );
    }
  }

  // Core queue operations
  async enqueueCreate<T extends StorageEntity>(table: string, data: T): Promise<T> {
    this.validateInitialized();
    
    const operation: QueuedOperation = {
      id: this.generateOperationId(),
      type: 'create',
      table,
      data,
      timestamp: new Date(),
      priority: this.calculatePriority('create', table),
      retryCount: 0,
      maxRetries: this.config.retryAttempts
    };

    return this.enqueueOperation(operation);
  }

  async enqueueUpdate<T extends StorageEntity>(table: string, id: string, data: Partial<T>): Promise<T> {
    this.validateInitialized();
    
    const operation: QueuedOperation = {
      id: this.generateOperationId(),
      type: 'update',
      table,
      entityId: id,
      data,
      timestamp: new Date(),
      priority: this.calculatePriority('update', table),
      retryCount: 0,
      maxRetries: this.config.retryAttempts
    };

    return this.enqueueOperation(operation);
  }

  async enqueueDelete(table: string, id: string): Promise<void> {
    this.validateInitialized();
    
    const operation: QueuedOperation = {
      id: this.generateOperationId(),
      type: 'delete',
      table,
      entityId: id,
      timestamp: new Date(),
      priority: this.calculatePriority('delete', table),
      retryCount: 0,
      maxRetries: this.config.retryAttempts
    };

    await this.enqueueOperation(operation);
  }

  private async enqueueOperation<T extends StorageEntity>(operation: QueuedOperation): Promise<T> {
    // Check queue size limits
    if (this.queue.size >= this.config.maxQueueSize) {
      if (this.config.overflowStrategy === 'reject') {
        throw new StorageError(
          'Update queue is full',
          'QUEUE_FULL',
          { queueSize: this.queue.size, maxSize: this.config.maxQueueSize }
        );
      } else if (this.config.overflowStrategy === 'drop_oldest') {
        this.dropOldestOperation();
      }
    }

    // Handle operation merging for updates to same entity
    if (operation.type === 'update' && operation.entityId) {
      const existingKey = `${operation.table}:${operation.entityId}`;
      const existing = this.queue.get(existingKey);
      
      if (existing && existing.type === 'update') {
        // Merge update operations
        existing.data = { ...existing.data, ...operation.data };
        existing.timestamp = operation.timestamp;
        existing.priority = Math.max(existing.priority, operation.priority);
        
        // Reset per-entity timer for this specific entity
        this.resetEntityTimer(existingKey);
        
        this.emit('operation_merged', { existing, merged: operation });
        return this.createPromiseForOperation(existing);
      }
    }

    // Add to queue
    const queueKey = operation.entityId 
      ? `${operation.table}:${operation.entityId}`
      : operation.id;
    
    this.queue.set(queueKey, operation);
    this.stats.currentQueueSize = this.queue.size;
    this.stats.totalOperations++;

    this.emit('operation_queued', operation);

    // Set up per-entity timer for batching (key feature: timer reset mechanism)
    this.resetEntityTimer(queueKey);

    // Trigger immediate processing if batch is full
    if (this.queue.size >= this.config.maxBatchSize) {
      setImmediate(() => this.processBatch());
    }

    return this.createPromiseForOperation(operation);
  }

  // Batch processing
  private async processBatch(): Promise<BatchResult> {
    if (this.isProcessing || this.queue.size === 0) {
      return { processed: 0, errors: [], duration: 0 };
    }

    this.isProcessing = true;
    const startTime = Date.now();
    
    try {
      // Get operations to process (up to batch size)
      const operations = this.selectOperationsForBatch();
      
      if (operations.length === 0) {
        return { processed: 0, errors: [], duration: 0 };
      }

      console.log(`📋 Processing batch of ${operations.length} operations`);
      
      // Group operations by type and table for optimization
      const groupedOps = this.groupOperations(operations);
      
      const results: any[] = [];
      const errors: Array<{ operation: QueuedOperation; error: Error }> = [];

      // Process each group
      for (const [groupKey, ops] of Array.from(groupedOps)) {
        try {
          const groupResults = await this.processOperationGroup(groupKey, ops);
          results.push(...groupResults);
          
          // Remove successful operations from queue
          for (const op of ops) {
            const queueKey = op.entityId ? `${op.table}:${op.entityId}` : op.id;
            this.queue.delete(queueKey);
            this.resolveOperation(op, groupResults.find(r => r.operationId === op.id));
          }
          
        } catch (error) {
          // Handle group errors
          for (const op of ops) {
            errors.push({ operation: op, error: error as Error });
            await this.handleOperationError(op, error as Error);
          }
        }
      }

      const duration = Date.now() - startTime;
      
      // Update statistics
      this.updateStats(operations.length, duration, errors.length);
      
      this.emit('batch_processed', {
        processed: operations.length,
        errors: errors.length,
        duration
      });

      return {
        processed: operations.length,
        errors,
        duration
      };
      
    } catch (error) {
      console.error('Batch processing failed:', error);
      this.stats.errorCount++;
      
      throw new StorageError(
        `Batch processing failed: ${(error as Error).message}`,
        'BATCH_ERROR'
      );
      
    } finally {
      this.isProcessing = false;
      this.stats.currentQueueSize = this.queue.size;
      
      // Schedule next batch if queue is not empty
      if (this.queue.size > 0) {
        this.setupBatchTimer();
      }
    }
  }

  private selectOperationsForBatch(): QueuedOperation[] {
    const operations = Array.from(this.queue.values());
    
    // Sort by priority (highest first) then by timestamp (oldest first)
    operations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    return operations.slice(0, this.config.maxBatchSize);
  }

  private groupOperations(operations: QueuedOperation[]): Map<string, QueuedOperation[]> {
    const groups = new Map<string, QueuedOperation[]>();
    
    for (const op of operations) {
      const groupKey = `${op.type}:${op.table}`;
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      
      groups.get(groupKey)!.push(op);
    }
    
    return groups;
  }

  private async processOperationGroup(groupKey: string, operations: QueuedOperation[]): Promise<any[]> {
    const [type, table] = groupKey.split(':');
    const results: any[] = [];

    switch (type) {
      case 'create':
        if (typeof this.adapter.createMany === 'function') {
          // Use batch create if available
          const entities = operations.map(op => op.data);
          const created = await this.adapter.createMany(table, entities);
          
          for (let i = 0; i < created.length; i++) {
            results.push({
              operationId: operations[i].id,
              result: created[i]
            });
          }
        } else {
          // Fall back to individual creates
          for (const op of operations) {
            const result = await this.adapter.create(table, op.data);
            results.push({
              operationId: op.id,
              result
            });
          }
        }
        break;

      case 'update':
        if (typeof this.adapter.updateMany === 'function') {
          // Use batch update if available
          const updates = operations.map(op => ({
            id: op.entityId!,
            data: op.data
          }));
          const updated = await this.adapter.updateMany(table, updates);
          
          for (let i = 0; i < updated.length; i++) {
            results.push({
              operationId: operations[i].id,
              result: updated[i]
            });
          }
        } else {
          // Fall back to individual updates
          for (const op of operations) {
            const result = await this.adapter.update(table, op.entityId!, op.data);
            results.push({
              operationId: op.id,
              result
            });
          }
        }
        break;

      case 'delete':
        if (typeof this.adapter.deleteMany === 'function') {
          // Use batch delete if available
          const ids = operations.map(op => op.entityId!);
          await this.adapter.deleteMany(table, ids);
          
          for (const op of operations) {
            results.push({
              operationId: op.id,
              result: null
            });
          }
        } else {
          // Fall back to individual deletes
          for (const op of operations) {
            await this.adapter.delete(table, op.entityId!);
            results.push({
              operationId: op.id,
              result: null
            });
          }
        }
        break;

      default:
        throw new Error(`Unknown operation type: ${type}`);
    }

    return results;
  }

  // Error handling and retry logic
  private async handleOperationError(operation: QueuedOperation, error: Error): Promise<void> {
    operation.retryCount++;
    operation.lastError = error;

    if (operation.retryCount < operation.maxRetries) {
      // Calculate retry delay with exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, operation.retryCount - 1);
      
      console.warn(`Retrying operation ${operation.id} in ${delay}ms (attempt ${operation.retryCount}/${operation.maxRetries})`);
      
      setTimeout(() => {
        // Re-queue the operation
        const queueKey = operation.entityId ? `${operation.table}:${operation.entityId}` : operation.id;
        this.queue.set(queueKey, operation);
      }, delay);
      
    } else {
      // Max retries exceeded - move to dead letter queue or reject
      console.error(`Operation ${operation.id} failed after ${operation.maxRetries} attempts:`, error);
      
      if (this.config.deadLetterQueue) {
        await this.moveToDeadLetterQueue(operation, error);
      } else {
        this.rejectOperation(operation, error);
      }
      
      // Remove from main queue
      const queueKey = operation.entityId ? `${operation.table}:${operation.entityId}` : operation.id;
      this.queue.delete(queueKey);
    }

    this.emit('operation_error', { operation, error });
  }

  private async moveToDeadLetterQueue(operation: QueuedOperation, error: Error): Promise<void> {
    // Implementation would depend on dead letter queue strategy
    console.log(`Moving operation ${operation.id} to dead letter queue:`, error.message);
    
    this.emit('operation_dead_lettered', { operation, error });
  }

  // Promise management for queued operations
  private operationPromises = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  private createPromiseForOperation<T>(operation: QueuedOperation): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.operationPromises.set(operation.id, { resolve, reject });
    });
  }

  private resolveOperation(operation: QueuedOperation, result: any): void {
    const promise = this.operationPromises.get(operation.id);
    if (promise) {
      promise.resolve(result?.result || result);
      this.operationPromises.delete(operation.id);
    }
  }

  private rejectOperation(operation: QueuedOperation, error: Error): void {
    const promise = this.operationPromises.get(operation.id);
    if (promise) {
      promise.reject(error);
      this.operationPromises.delete(operation.id);
    }
  }

  // Utility methods
  private setupBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    this.batchTimer = setTimeout(() => {
      this.processBatch().catch(error => {
        console.error('Scheduled batch processing failed:', error);
      });
    }, this.config.batchWindow);
  }

  private resetEntityTimer(entityKey: string): void {
    // Clear existing timer for this entity
    const existingTimer = this.entityTimers.get(entityKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer for this specific entity (timer reset mechanism)
    const timer = setTimeout(() => {
      this.processEntityBatch(entityKey);
    }, this.config.batchWindow);

    this.entityTimers.set(entityKey, timer);
  }

  private async processEntityBatch(entityKey: string): Promise<void> {
    // Clean up the timer
    this.entityTimers.delete(entityKey);

    // Process only this specific entity
    const operation = this.queue.get(entityKey);
    if (!operation) {
      return;
    }

    try {
      // Create a mini-batch with just this entity
      const groupKey = `${operation.type}:${operation.table}`;
      const results = await this.processOperationGroup(groupKey, [operation]);
      
      // Remove from queue and resolve
      this.queue.delete(entityKey);
      this.stats.currentQueueSize = this.queue.size;
      
      this.resolveOperation(operation, results.find(r => r.operationId === operation.id));
      
      this.emit('entity_batch_processed', {
        entityKey,
        operation: operation.type,
        processed: 1
      });

    } catch (error) {
      await this.handleOperationError(operation, error as Error);
    }
  }

  private setupErrorHandling(): void {
    // Set up error recovery mechanisms
    if (this.config.persistence) {
      // Implement queue persistence for crash recovery
      this.setupQueuePersistence();
    }
  }

  private setupQueuePersistence(): void {
    // Save queue state periodically
    setInterval(() => {
      if (this.queue.size > 0) {
        this.persistQueueState();
      }
    }, 30000); // Every 30 seconds
  }

  private async persistQueueState(): Promise<void> {
    try {
      // Implementation would save queue to storage
      console.debug('Persisting queue state...');
    } catch (error) {
      console.warn('Failed to persist queue state:', error);
    }
  }

  private dropOldestOperation(): void {
    const operations = Array.from(this.queue.entries());
    operations.sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (operations.length > 0) {
      const [key, operation] = operations[0];
      this.queue.delete(key);
      
      this.rejectOperation(operation, new StorageError(
        'Operation dropped due to queue overflow',
        'QUEUE_OVERFLOW'
      ));
      
      console.warn(`Dropped oldest operation: ${operation.id}`);
    }
  }

  private calculatePriority(type: string, table: string): number {
    // Base priorities
    const typePriorities = {
      delete: 100,  // Highest priority
      update: 50,   // Medium priority
      create: 25    // Lower priority
    };
    
    // Table-specific adjustments
    const tablePriorities = {
      users: 10,         // User operations are high priority
      audit_logs: 5,     // Audit logs are important
      consent_records: 8 // Consent is high priority
    };
    
    return (typePriorities[type as keyof typeof typePriorities] || 25) + 
           (tablePriorities[table as keyof typeof tablePriorities] || 0);
  }

  private updateStats(processed: number, duration: number, errors: number): void {
    this.stats.batchesProcessed++;
    this.stats.averageBatchSize = 
      (this.stats.averageBatchSize * (this.stats.batchesProcessed - 1) + processed) / 
      this.stats.batchesProcessed;
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.batchesProcessed - 1) + duration) / 
      this.stats.batchesProcessed;
    this.stats.errorCount += errors;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateConfig(config: UpdateQueueConfig): UpdateQueueConfig {
    if (!config) {
      throw new StorageError('UpdateQueue configuration is required', 'CONFIG_ERROR');
    }

    return {
      enabled: config.enabled !== false,
      batchWindow: config.batchWindow || 100,
      maxBatchSize: config.maxBatchSize || 50,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      maxQueueSize: config.maxQueueSize || 10000,
      priorityLevels: config.priorityLevels || 3,
      deadLetterQueue: config.deadLetterQueue || false,
      persistence: config.persistence || false,
      overflowStrategy: config.overflowStrategy || 'reject',
      ...config
    };
  }

  private sanitizeConfig(): any {
    return {
      enabled: this.config.enabled,
      batchWindow: this.config.batchWindow,
      maxBatchSize: this.config.maxBatchSize,
      maxQueueSize: this.config.maxQueueSize
    };
  }

  private validateInitialized(): void {
    if (!this.isInitialized) {
      throw new StorageError('UpdateQueue not initialized', 'NOT_INITIALIZED');
    }
  }

  // Event system
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in update queue event listener for ${event}:`, error);
        }
      });
    }
  }

  // Public API
  isEnabled(): boolean {
    return this.config.enabled && this.isInitialized;
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  getStats(): UpdateQueueStats {
    return { ...this.stats };
  }

  getConfiguration(): Partial<UpdateQueueConfig> {
    return {
      enabled: this.config.enabled,
      batchWindow: this.config.batchWindow,
      maxBatchSize: this.config.maxBatchSize,
      maxQueueSize: this.config.maxQueueSize,
      retryAttempts: this.config.retryAttempts
    };
  }

  async forceFlush(): Promise<BatchResult> {
    return await this.processBatch();
  }

  clearQueue(): void {
    // Reject all pending operations
    for (const operation of Array.from(this.queue.values())) {
      this.rejectOperation(operation, new StorageError(
        'Queue cleared',
        'QUEUE_CLEARED'
      ));
    }
    
    // Clear all entity timers
    for (const timer of Array.from(this.entityTimers.values())) {
      clearTimeout(timer);
    }
    this.entityTimers.clear();
    
    this.queue.clear();
    this.stats.currentQueueSize = 0;
    
    console.log('🧹 Update queue cleared');
  }
}