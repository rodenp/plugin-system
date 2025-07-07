// Audit Logger - Comprehensive audit trail for GDPR compliance
import {
  AuditConfig,
  AuditLog,
  AuditEvent,
  StorageBackend,
  QueryFilter,
  StorageError
} from '../types';

export class AuditLogger {
  private config: AuditConfig;
  private adapter?: StorageBackend;
  private auditQueue: AuditLog[] = [];
  private isInitialized = false;
  private flushTimer?: NodeJS.Timeout;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: AuditConfig) {
    this.config = this.validateConfig(config);
  }

  async initialize(adapter?: StorageBackend): Promise<void> {
    if (this.isInitialized) {
      console.warn('AuditLogger already initialized');
      return;
    }

    try {
      console.log('📝 Initializing AuditLogger...');
      
      this.adapter = adapter;
      
      // Set up batch flushing if enabled
      if (this.config.batchSize && this.config.batchSize > 1) {
        this.setupBatchFlushing();
      }
      
      // Set up retention cleanup
      this.setupRetentionCleanup();
      
      this.isInitialized = true;
      console.log('✅ AuditLogger initialized');
      
    } catch (error) {
      throw new StorageError(
        `Failed to initialize AuditLogger: ${(error as Error).message}`,
        'INITIALIZATION_ERROR',
        { config: this.sanitizeConfig() }
      );
    }
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      console.log('📝 Destroying AuditLogger...');
      
      // Flush any pending audit logs
      if (this.auditQueue.length > 0) {
        await this.flushQueue();
      }
      
      // Clear timers
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = undefined;
      }
      
      // Clear state
      this.auditQueue = [];
      this.eventListeners.clear();
      
      this.isInitialized = false;
      console.log('✅ AuditLogger destroyed');
      
    } catch (error) {
      console.error('❌ AuditLogger destruction failed:', error);
      throw new StorageError(
        `Failed to destroy AuditLogger: ${(error as Error).message}`,
        'DESTRUCTION_ERROR'
      );
    }
  }

  // Public API
  isReady(): boolean {
    return this.isInitialized && this.config.enabled && !!this.adapter;
  }

  // Core audit logging operations
  async logOperation(event: Omit<AuditEvent, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      const auditLog: AuditLog = {
        id: this.generateAuditId(),
        timestamp: new Date(),
        sessionId: this.getCurrentSessionId(),
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        details: event.details,
        success: event.success,
        errorMessage: event.errorMessage,
        ipAddress: event.ipAddress || this.getClientIP(),
        userAgent: event.userAgent || this.getUserAgent(),
        // Enhanced GDPR metadata
        legalBasis: event.legalBasis,
        processingPurpose: event.processingPurpose,
        dataCategories: event.dataCategories,
        retentionPeriod: event.retentionPeriod,
        recipients: event.recipients,
        geolocation: event.geolocation || this.getGeolocation(),
        metadata: {
          ...event.metadata,
          auditVersion: '1.0',
          source: 'StoragePlugin'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      // Add to queue for batch processing or log immediately
      if (this.config.batchSize && this.config.batchSize > 1) {
        this.auditQueue.push(auditLog);
        
        // Force flush if queue is full
        if (this.auditQueue.length >= this.config.batchSize) {
          await this.flushQueue();
        }
      } else {
        await this.storeAuditLog(auditLog);
      }

      // Emit audit event
      this.emit('audit_logged', auditLog);

    } catch (error) {
      console.error('Failed to log audit event:', error);
      
      // Emit error event
      this.emit('audit_error', {
        event,
        error: (error as Error).message
      });
      
      // Don't throw - audit failures shouldn't break main operations
    }
  }

  async logAccess(userId: string, resource: string, resourceId?: string, metadata?: any): Promise<void> {
    await this.logOperation({
      userId,
      action: 'access',
      resource,
      resourceId,
      success: true,
      metadata
    });
  }

  async logDataExport(userId: string, exportType: string, resourceIds: string[], metadata?: any): Promise<void> {
    await this.logOperation({
      userId,
      action: 'data_export',
      resource: 'system',
      details: {
        exportType,
        resourceIds,
        recordCount: resourceIds.length
      },
      success: true,
      metadata
    });
  }

  async logDataDeletion(userId: string, resource: string, resourceIds: string[], reason?: string): Promise<void> {
    await this.logOperation({
      userId,
      action: 'data_deletion',
      resource,
      details: {
        resourceIds,
        recordCount: resourceIds.length,
        reason
      },
      success: true
    });
  }

  async logConsentChange(userId: string, purposeId: string, action: 'granted' | 'revoked', metadata?: any): Promise<void> {
    await this.logOperation({
      userId,
      action: `consent_${action}`,
      resource: 'consent',
      resourceId: purposeId,
      success: true,
      metadata
    });
  }

  async logSecurityEvent(userId: string, eventType: string, details: any, success: boolean = true): Promise<void> {
    await this.logOperation({
      userId,
      action: 'security_event',
      resource: 'security',
      details: {
        eventType,
        ...details
      },
      success
    });
  }

  async logError(userId: string, action: string, resource: string, error: Error, metadata?: any): Promise<void> {
    await this.logOperation({
      userId,
      action,
      resource,
      success: false,
      errorMessage: error.message,
      details: {
        errorType: error.constructor.name,
        stack: error.stack
      },
      metadata
    });
  }

  // GDPR-specific audit logging methods

  async logProcessingObjection(userId: string, purpose: string, reason: string, metadata?: any): Promise<void> {
    await this.logOperation({
      userId,
      action: 'processing_objection',
      resource: 'consent',
      details: { purpose, reason },
      success: true,
      legalBasis: 'legitimate_interest',
      processingPurpose: 'data_subject_rights',
      dataCategories: ['consent_data'],
      metadata
    });
  }

  async logAutomatedDecision(userId: string, algorithm: string, decision: any, confidence?: number, metadata?: any): Promise<void> {
    await this.logOperation({
      userId,
      action: 'automated_decision',
      resource: 'ai_system',
      details: { algorithm, decision, confidence },
      success: true,
      legalBasis: 'legitimate_interest',
      processingPurpose: 'automated_decision_making',
      dataCategories: ['profiling_data', 'behavioral'],
      metadata
    });
  }

  async logDataBreach(affectedUsers: string[], breachType: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: any): Promise<void> {
    await this.logOperation({
      userId: 'system',
      action: 'data_breach_detected',
      resource: 'security',
      details: { 
        affectedUserCount: affectedUsers.length,
        breachType, 
        severity,
        affectedUsers: affectedUsers.slice(0, 10) // Log first 10 for privacy
      },
      success: false,
      legalBasis: 'legal_obligation',
      processingPurpose: 'security_incident_response',
      dataCategories: ['personal_data'],
      metadata
    });
  }

  async logDataTransfer(userId: string, recipient: string, purpose: string, legalBasis: string, dataCategories: string[], metadata?: any): Promise<void> {
    await this.logOperation({
      userId,
      action: 'data_transfer_initiated',
      resource: 'data_transfer',
      details: { recipient, purpose },
      success: true,
      legalBasis: legalBasis as any,
      processingPurpose: purpose,
      dataCategories: dataCategories as any,
      recipients: [recipient],
      metadata
    });
  }

  async logRetentionPolicyApplication(userId: string, table: string, retentionPeriod: string, recordsAffected: number, metadata?: any): Promise<void> {
    await this.logOperation({
      userId,
      action: 'retention_policy_applied',
      resource: table,
      details: { retentionPeriod, recordsAffected },
      success: true,
      legalBasis: 'legal_obligation',
      processingPurpose: 'data_retention_compliance',
      dataCategories: ['personal_data'],
      retentionPeriod,
      metadata
    });
  }

  async logProfilingActivity(userId: string, profileType: string, dataPoints: string[], purpose: string, metadata?: any): Promise<void> {
    await this.logOperation({
      userId,
      action: 'profiling_activity',
      resource: 'profiling_system',
      details: { profileType, dataPoints, purpose },
      success: true,
      legalBasis: 'consent',
      processingPurpose: purpose,
      dataCategories: ['profiling_data', 'behavioral'],
      metadata
    });
  }

  // Query and reporting operations
  async getAuditLogs(filter?: QueryFilter<AuditLog>): Promise<AuditLog[]> {
    this.validateInitialized();

    if (!this.adapter) {
      throw new StorageError('Storage adapter not available', 'ADAPTER_ERROR');
    }

    return await this.adapter.query<AuditLog>('audit_logs', filter);
  }

  async getUserAuditTrail(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    actions?: string[];
    resources?: string[];
    limit?: number;
  }): Promise<AuditLog[]> {
    this.validateInitialized();

    const filter: QueryFilter<AuditLog> = {
      where: {
        userId
      },
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: options?.limit || 1000
    };

    // Add date filters
    if (options?.startDate || options?.endDate) {
      (filter.where as any).timestamp = {};
      if (options.startDate) {
        (filter.where as any).timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        (filter.where as any).timestamp.$lte = options.endDate;
      }
    }

    // Add action filters
    if (options?.actions && options.actions.length > 0) {
      (filter.where as any).action = { $in: options.actions };
    }

    // Add resource filters
    if (options?.resources && options.resources.length > 0) {
      (filter.where as any).resource = { $in: options.resources };
    }

    return await this.getAuditLogs(filter);
  }

  async getResourceAuditTrail(resource: string, resourceId?: string, options?: {
    startDate?: Date;
    endDate?: Date;
    actions?: string[];
    limit?: number;
  }): Promise<AuditLog[]> {
    this.validateInitialized();

    const filter: QueryFilter<AuditLog> = {
      where: {
        resource
      },
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: options?.limit || 1000
    };

    if (resourceId) {
      (filter.where as any).resourceId = resourceId;
    }

    // Add date filters
    if (options?.startDate || options?.endDate) {
      (filter.where as any).timestamp = {};
      if (options.startDate) {
        (filter.where as any).timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        (filter.where as any).timestamp.$lte = options.endDate;
      }
    }

    // Add action filters
    if (options?.actions && options.actions.length > 0) {
      (filter.where as any).action = { $in: options.actions };
    }

    return await this.getAuditLogs(filter);
  }

  async generateAuditReport(options: {
    startDate: Date;
    endDate: Date;
    userId?: string;
    resources?: string[];
    actions?: string[];
    includeDetails?: boolean;
  }): Promise<{
    summary: {
      totalEvents: number;
      uniqueUsers: number;
      successfulOperations: number;
      failedOperations: number;
      topActions: Array<{ action: string; count: number }>;
      topResources: Array<{ resource: string; count: number }>;
    };
    events?: AuditLog[];
  }> {
    this.validateInitialized();

    const filter: QueryFilter<AuditLog> = {
      where: {
        timestamp: {
          $gte: options.startDate,
          $lte: options.endDate
        }
      },
      orderBy: [{ field: 'timestamp', direction: 'desc' }]
    };

    if (options.userId) {
      (filter.where as any).userId = options.userId;
    }

    if (options.resources && options.resources.length > 0) {
      (filter.where as any).resource = { $in: options.resources };
    }

    if (options.actions && options.actions.length > 0) {
      (filter.where as any).action = { $in: options.actions };
    }

    const events = await this.getAuditLogs(filter);

    // Generate summary statistics
    const uniqueUsers = new Set(events.map(e => e.userId));
    const successfulOperations = events.filter(e => e.success).length;
    const failedOperations = events.filter(e => !e.success).length;

    // Count actions
    const actionCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};

    for (const event of events) {
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
      resourceCounts[event.resource] = (resourceCounts[event.resource] || 0) + 1;
    }

    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    const topResources = Object.entries(resourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, count }));

    return {
      summary: {
        totalEvents: events.length,
        uniqueUsers: uniqueUsers.size,
        successfulOperations,
        failedOperations,
        topActions,
        topResources
      },
      events: options.includeDetails ? events : undefined
    };
  }

  // Compliance and data management
  async exportUserAuditData(userId: string): Promise<{
    userId: string;
    auditLogs: AuditLog[];
    exportedAt: Date;
    summary: {
      totalEvents: number;
      dateRange: { start: Date; end: Date };
      actions: string[];
      resources: string[];
    };
  }> {
    const auditLogs = await this.getUserAuditTrail(userId);
    
    const actions = [...new Set(auditLogs.map(log => log.action))];
    const resources = [...new Set(auditLogs.map(log => log.resource))];
    
    const dates = auditLogs.map(log => log.timestamp).sort();
    const dateRange = dates.length > 0 
      ? { start: dates[0], end: dates[dates.length - 1] }
      : { start: new Date(), end: new Date() };

    return {
      userId,
      auditLogs,
      exportedAt: new Date(),
      summary: {
        totalEvents: auditLogs.length,
        dateRange,
        actions,
        resources
      }
    };
  }

  async deleteUserAuditData(userId: string): Promise<void> {
    this.validateInitialized();

    if (!this.adapter) {
      throw new StorageError('Storage adapter not available', 'ADAPTER_ERROR');
    }

    const filter: QueryFilter<AuditLog> = {
      where: { userId }
    };

    const userAuditLogs = await this.adapter.query<AuditLog>('audit_logs', filter);

    for (const log of userAuditLogs) {
      await this.adapter.delete('audit_logs', log.id);
    }

    console.log(`🗑️ Deleted ${userAuditLogs.length} audit logs for user ${userId}`);
  }

  async cleanupOldAuditLogs(): Promise<number> {
    this.validateInitialized();

    if (!this.adapter || !this.config.retentionPeriod) {
      return 0;
    }

    const cutoffDate = this.calculateRetentionCutoff();
    
    const filter: QueryFilter<AuditLog> = {
      where: {
        timestamp: { $lt: cutoffDate }
      }
    };

    const oldLogs = await this.adapter.query<AuditLog>('audit_logs', filter);
    
    for (const log of oldLogs) {
      await this.adapter.delete('audit_logs', log.id);
    }

    console.log(`🧹 Cleaned up ${oldLogs.length} old audit logs (older than ${cutoffDate.toISOString()})`);
    
    return oldLogs.length;
  }

  // Private implementation methods
  private async storeAuditLog(auditLog: AuditLog): Promise<void> {
    if (!this.adapter) {
      // Queue the log for later when adapter becomes available
      console.warn('⚠️ Storage adapter not available, queueing audit log');
      this.auditQueue.push(auditLog);
      return;
    }

    await this.adapter.create('audit_logs', auditLog);
  }

  private async flushQueue(): Promise<void> {
    if (this.auditQueue.length === 0 || !this.adapter) {
      return;
    }

    const logsToFlush = [...this.auditQueue];
    this.auditQueue = [];

    try {
      // Batch create if adapter supports it
      if (typeof this.adapter.createMany === 'function') {
        await this.adapter.createMany('audit_logs', logsToFlush);
      } else {
        // Fall back to individual creates
        for (const log of logsToFlush) {
          await this.storeAuditLog(log);
        }
      }

      console.log(`📝 Flushed ${logsToFlush.length} audit logs`);
    } catch (error) {
      console.error('Failed to flush audit queue:', error);
      
      // Put logs back in queue to retry
      this.auditQueue.unshift(...logsToFlush);
      throw error;
    }
  }

  private setupBatchFlushing(): void {
    if (!this.config.flushInterval) {
      this.config.flushInterval = 30000; // Default 30 seconds
    }

    this.flushTimer = setInterval(async () => {
      try {
        await this.flushQueue();
      } catch (error) {
        console.error('Error flushing audit queue:', error);
      }
    }, this.config.flushInterval);
  }

  private setupRetentionCleanup(): void {
    if (!this.config.retentionPeriod) {
      return;
    }

    // Run cleanup daily
    setInterval(async () => {
      try {
        await this.cleanupOldAuditLogs();
      } catch (error) {
        console.error('Error during audit log cleanup:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  private calculateRetentionCutoff(): Date {
    if (!this.config.retentionPeriod) {
      throw new Error('Retention period not configured');
    }

    const now = new Date();
    const retention = this.config.retentionPeriod;
    
    // Parse retention period (e.g., '1 year', '6 months', '30 days')
    const match = retention.match(/(\d+)\s*(year|month|day)s?/);
    if (!match) {
      throw new Error(`Invalid retention period format: ${retention}`);
    }

    const amount = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'year':
        return new Date(now.getFullYear() - amount, now.getMonth(), now.getDate());
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - amount, now.getDate());
      case 'day':
        return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
      default:
        throw new Error(`Unsupported retention unit: ${unit}`);
    }
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentSessionId(): string {
    // In a real implementation, this would get the current session ID
    return `session_${Date.now()}`;
  }

  private getClientIP(): string {
    // In a real implementation, this would get the client IP address
    return 'unknown';
  }

  private getUserAgent(): string {
    // In a real implementation, this would get the user agent
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }

  private validateConfig(config: AuditConfig): AuditConfig {
    if (!config) {
      throw new StorageError('Audit configuration is required', 'CONFIG_ERROR');
    }

    return {
      enabled: config.enabled !== false,
      retentionPeriod: config.retentionPeriod || '1 year',
      batchSize: config.batchSize || 1,
      flushInterval: config.flushInterval || 30000,
      includeDetails: config.includeDetails !== false,
      ...config
    };
  }

  private sanitizeConfig(): any {
    return {
      enabled: this.config.enabled,
      retentionPeriod: this.config.retentionPeriod,
      batchSize: this.config.batchSize,
      includeDetails: this.config.includeDetails
    };
  }

  private validateInitialized(): void {
    if (!this.isInitialized) {
      throw new StorageError('AuditLogger not initialized', 'NOT_INITIALIZED');
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
          console.error(`Error in audit event listener for ${event}:`, error);
        }
      });
    }
  }

  // Public API
  isEnabled(): boolean {
    return this.config.enabled;
  }

  getConfiguration(): Partial<AuditConfig> {
    return {
      enabled: this.config.enabled,
      retentionPeriod: this.config.retentionPeriod,
      batchSize: this.config.batchSize,
      includeDetails: this.config.includeDetails
    };
  }

  getQueueSize(): number {
    return this.auditQueue.length;
  }

  async forceFlush(): Promise<void> {
    await this.flushQueue();
  }

  // Enhanced helper methods for GDPR compliance
  private getGeolocation(): string | undefined {
    // In a real implementation, this would get user's location with consent
    // For now, return undefined to avoid privacy issues
    return undefined;
  }
}