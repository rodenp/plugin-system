// GDPR Audit Logger - Structured audit logging with retention policies
// Tracks all GDPR-related operations for compliance and monitoring

import { AuditConfig, AuditLogEntry, AuditEvent, AuditError } from './types';

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalEntries: number;
  entriesByAction: Record<string, number>;
  entriesByResource: Record<string, number>;
  entriesLast24h: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

export class AuditLogger {
  private config: AuditConfig;
  private auditLogs: AuditLogEntry[] = [];
  private retentionTimer?: NodeJS.Timeout;

  constructor(config: AuditConfig) {
    this.config = config;
    this.startRetentionCleanup();
  }

  /**
   * Log a GDPR-related event
   */
  async logEvent(event: AuditEvent): Promise<string> {
    if (!this.config.enabled) {
      return 'audit-disabled';
    }

    const logEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      details: event.details || {},
      result: event.result || 'success',
      ipAddress: event.ipAddress || 'unknown',
      userAgent: event.userAgent || 'unknown',
      sessionId: event.sessionId,
      metadata: {
        ...event.metadata,
        logLevel: this.config.logLevel,
        version: '1.0'
      }
    };

    // Apply log level filtering
    if (!this.shouldLog(logEntry)) {
      return logEntry.id;
    }

    this.auditLogs.push(logEntry);

    // Log to console based on configuration
    if (this.config.logLevel !== 'minimal') {
      console.log(`📋 AUDIT: ${logEntry.action} on ${logEntry.resource} by ${logEntry.userId} - ${logEntry.result}`);
    }

    // Trigger retention cleanup if needed
    await this.cleanupExpiredLogs();

    return logEntry.id;
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'read' | 'list' | 'search',
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      action: `data_${action}`,
      resource,
      resourceId,
      result: 'success',
      metadata: {
        category: 'data_access',
        ...metadata
      }
    });
  }

  /**
   * Log data modification events
   */
  async logDataModification(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'create' | 'update' | 'delete',
    changes?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      action: `data_${action}`,
      resource,
      resourceId,
      result: 'success',
      details: {
        changes: changes || {},
        timestamp: new Date().toISOString()
      },
      metadata: {
        category: 'data_modification',
        ...metadata
      }
    });
  }

  /**
   * Log consent events
   */
  async logConsentEvent(
    userId: string,
    purposeId: string,
    action: 'granted' | 'denied' | 'withdrawn' | 'expired',
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      action: `consent_${action}`,
      resource: 'consent',
      resourceId: `${userId}:${purposeId}`,
      result: 'success',
      details: {
        purpose: purposeId,
        consentAction: action
      },
      metadata: {
        category: 'consent_management',
        ...metadata
      }
    });
  }

  /**
   * Log data subject rights events
   */
  async logDataSubjectRights(
    userId: string,
    action: 'export_request' | 'export_completed' | 'deletion_request' | 'deletion_completed' | 'rectification_request' | 'rectification_completed',
    details?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      action: `dsr_${action}`,
      resource: 'data_subject_rights',
      resourceId: userId,
      result: 'success',
      details: details || {},
      metadata: {
        category: 'data_subject_rights',
        ...metadata
      }
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    userId: string,
    action: 'login' | 'logout' | 'failed_login' | 'password_change' | 'account_locked',
    ipAddress?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      action: `security_${action}`,
      resource: 'authentication',
      resourceId: userId,
      result: action.includes('failed') || action.includes('locked') ? 'failure' : 'success',
      ipAddress,
      metadata: {
        category: 'security',
        ...metadata
      }
    });
  }

  /**
   * Log encryption events
   */
  async logEncryptionEvent(
    userId: string,
    action: 'encrypt' | 'decrypt' | 'key_rotation',
    resource: string,
    fieldName?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.logEvent({
      userId,
      action: `encryption_${action}`,
      resource,
      resourceId: fieldName || resource,
      result: 'success',
      details: {
        field: fieldName,
        algorithm: 'AES-256-GCM'
      },
      metadata: {
        category: 'encryption',
        ...metadata
      }
    });
  }

  /**
   * Query audit logs
   */
  async queryLogs(query: AuditQuery = {}): Promise<AuditLogEntry[]> {
    let filteredLogs = [...this.auditLogs];

    // Apply filters
    if (query.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
    }

    if (query.action) {
      filteredLogs = filteredLogs.filter(log => log.action === query.action);
    }

    if (query.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === query.resource);
    }

    if (query.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= query.endDate!);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;

    return filteredLogs.slice(offset, offset + limit);
  }

  /**
   * Get audit trail for a specific user
   */
  async getUserAuditTrail(userId: string, days: number = 30): Promise<AuditLogEntry[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.queryLogs({
      userId,
      startDate,
      limit: 1000
    });
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(
    query: AuditQuery = {},
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const logs = await this.queryLogs(query);

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalEntries: logs.length,
      query,
      logs
    }, null, 2);
  }

  /**
   * Get audit statistics
   */
  getAuditStats(): AuditStats {
    const stats: AuditStats = {
      totalEntries: this.auditLogs.length,
      entriesByAction: {},
      entriesByResource: {},
      entriesLast24h: 0,
      oldestEntry: undefined,
      newestEntry: undefined
    };

    if (this.auditLogs.length === 0) {
      return stats;
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate statistics
    for (const log of this.auditLogs) {
      // Count by action
      stats.entriesByAction[log.action] = (stats.entriesByAction[log.action] || 0) + 1;

      // Count by resource
      stats.entriesByResource[log.resource] = (stats.entriesByResource[log.resource] || 0) + 1;

      // Count last 24h entries
      if (log.timestamp >= yesterday) {
        stats.entriesLast24h++;
      }

      // Track oldest and newest
      if (!stats.oldestEntry || log.timestamp < stats.oldestEntry) {
        stats.oldestEntry = log.timestamp;
      }
      if (!stats.newestEntry || log.timestamp > stats.newestEntry) {
        stats.newestEntry = log.timestamp;
      }
    }

    return stats;
  }

  /**
   * Delete logs for a specific user (for GDPR erasure)
   */
  async deleteUserLogs(userId: string): Promise<number> {
    const initialCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(log => log.userId !== userId);
    const deletedCount = initialCount - this.auditLogs.length;

    if (deletedCount > 0) {
      console.log(`🗑️ Deleted ${deletedCount} audit log entries for user ${userId}`);
    }

    return deletedCount;
  }

  /**
   * Anonymize logs for a specific user
   */
  async anonymizeUserLogs(userId: string): Promise<number> {
    let anonymizedCount = 0;
    const anonymousId = `anonymous_${Date.now()}`;

    for (const log of this.auditLogs) {
      if (log.userId === userId) {
        log.userId = anonymousId;
        log.metadata = { ...log.metadata, anonymized: true, originalUserId: 'redacted' };
        anonymizedCount++;
      }
    }

    if (anonymizedCount > 0) {
      console.log(`🔒 Anonymized ${anonymizedCount} audit log entries for user ${userId}`);
    }

    return anonymizedCount;
  }

  /**
   * Clean up expired audit logs based on retention policy
   */
  async cleanupExpiredLogs(): Promise<number> {
    if (this.config.retentionDays <= 0) {
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const initialCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(log => log.timestamp >= cutoffDate);
    const deletedCount = initialCount - this.auditLogs.length;

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired audit log entries`);
    }

    return deletedCount;
  }

  /**
   * Start automatic retention cleanup
   */
  private startRetentionCleanup(): void {
    if (this.config.retentionDays <= 0) {
      return;
    }

    // Run cleanup every 24 hours
    this.retentionTimer = setInterval(async () => {
      try {
        await this.cleanupExpiredLogs();
      } catch (error) {
        console.error('Error during audit log cleanup:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Stop automatic retention cleanup
   */
  destroy(): void {
    if (this.retentionTimer) {
      clearInterval(this.retentionTimer);
      this.retentionTimer = undefined;
    }
  }

  /**
   * Check if a log entry should be recorded based on log level
   */
  private shouldLog(entry: AuditLogEntry): boolean {
    switch (this.config.logLevel) {
      case 'minimal':
        // Only log critical GDPR events
        return entry.action.includes('consent_') || 
               entry.action.includes('dsr_') ||
               entry.action.includes('deletion') ||
               entry.result === 'failure';
      
      case 'standard':
        // Log most GDPR-related events
        return true;
      
      case 'detailed':
        // Log everything
        return true;
      
      default:
        return true;
    }
  }

  /**
   * Convert audit logs to CSV format
   */
  private convertToCSV(logs: AuditLogEntry[]): string {
    if (logs.length === 0) {
      return 'timestamp,userId,action,resource,resourceId,result,ipAddress\n';
    }

    const headers = 'timestamp,userId,action,resource,resourceId,result,ipAddress,details\n';
    
    const rows = logs.map(log => {
      const details = JSON.stringify(log.details).replace(/"/g, '""');
      return [
        log.timestamp.toISOString(),
        log.userId,
        log.action,
        log.resource,
        log.resourceId || '',
        log.result,
        log.ipAddress,
        `"${details}"`
      ].join(',');
    });

    return headers + rows.join('\n');
  }

  /**
   * Generate unique audit log ID
   */
  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate audit configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.retentionDays < 0) {
      errors.push('Retention days cannot be negative');
    }

    if (!['minimal', 'standard', 'detailed'].includes(this.config.logLevel)) {
      errors.push('Invalid log level');
    }

    if (!['json', 'csv'].includes(this.config.exportFormat)) {
      errors.push('Invalid export format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}