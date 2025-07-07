// Data Subject Rights - GDPR data rights implementation
import {
  StorageBackend,
  QueryFilter,
  StorageEntity,
  ConsentError,
  StorageError,
  DataExportOptions,
  DataDeletionOptions,
  DataPortabilityRequest,
  DataRectificationRequest,
  DataExportResult,
  DataDeletionResult
} from '../types';
import { EncryptionService } from './EncryptionService';
import { ConsentManager } from './ConsentManager';
import { AuditLogger } from './AuditLogger';

export class DataSubjectRights {
  private encryptionService?: EncryptionService;
  private consentManager?: ConsentManager;
  private auditLogger?: AuditLogger;
  private adapter: StorageBackend;
  private isInitialized = false;

  constructor(dependencies: {
    encryptionService?: EncryptionService;
    consentManager?: ConsentManager;
    auditLogger?: AuditLogger;
    adapter: StorageBackend;
  }) {
    this.encryptionService = dependencies.encryptionService;
    this.consentManager = dependencies.consentManager;
    this.auditLogger = dependencies.auditLogger;
    this.adapter = dependencies.adapter;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('DataSubjectRights already initialized');
      return;
    }

    try {
      console.log('⚖️ Initializing DataSubjectRights...');
      
      // Validate dependencies
      if (!this.adapter) {
        throw new Error('Storage adapter is required');
      }
      
      this.isInitialized = true;
      console.log('✅ DataSubjectRights initialized');
      
    } catch (error) {
      throw new StorageError(
        `Failed to initialize DataSubjectRights: ${(error as Error).message}`,
        'INITIALIZATION_ERROR'
      );
    }
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      console.log('⚖️ Destroying DataSubjectRights...');
      
      this.isInitialized = false;
      console.log('✅ DataSubjectRights destroyed');
      
    } catch (error) {
      console.error('❌ DataSubjectRights destruction failed:', error);
      throw new StorageError(
        `Failed to destroy DataSubjectRights: ${(error as Error).message}`,
        'DESTRUCTION_ERROR'
      );
    }
  }

  // Article 15 - Right of Access
  async exportUserData(userId: string, options: DataExportOptions = {}): Promise<DataExportResult> {
    this.validateInitialized();

    try {
      console.log(`📦 Starting data export for user ${userId}`);
      
      // Check consent if consent manager is available
      if (this.consentManager) {
        const hasConsent = await this.consentManager.checkConsent(userId, 'data_export');
        if (!hasConsent) {
          throw new ConsentError(
            'User has not consented to data export',
            'CONSENT_REQUIRED',
            { userId, purpose: 'data_export' }
          );
        }
      }

      const exportData: any = {
        userId,
        exportedAt: new Date(),
        exportVersion: '1.0',
        format: options.format || 'json',
        includeMetadata: options.includeMetadata !== false,
        data: {}
      };

      // Get all tables to export
      const tablesToExport = options.tables || await this.getAllUserTables();
      
      for (const table of tablesToExport) {
        const userData = await this.getUserDataFromTable(userId, table, options);
        if (userData.length > 0) {
          exportData.data[table] = userData;
        }
      }

      // Include consent records if available
      if (this.consentManager) {
        const consentData = await this.consentManager.exportUserConsents(userId);
        exportData.data.consents = consentData;
      }

      // Include audit trail if available and requested
      if (this.auditLogger && options.includeAuditTrail) {
        const auditData = await this.auditLogger.exportUserAuditData(userId);
        exportData.data.auditTrail = auditData;
      }

      // Log the export
      if (this.auditLogger) {
        await this.auditLogger.logDataExport(
          userId,
          'gdpr_export',
          Object.keys(exportData.data),
          { format: options.format, includeAuditTrail: options.includeAuditTrail }
        );
      }

      const result: DataExportResult = {
        id: this.generateExportId(),
        userId,
        data: exportData,
        format: options.format || 'json',
        size: JSON.stringify(exportData).length,
        tables: Object.keys(exportData.data),
        recordCount: this.countRecords(exportData.data),
        exportedAt: new Date(),
        expiresAt: options.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        metadata: {
          version: '1.0',
          includeMetadata: options.includeMetadata !== false,
          includeAuditTrail: options.includeAuditTrail || false
        }
      };

      console.log(`✅ Data export completed for user ${userId}: ${result.recordCount} records from ${result.tables.length} tables`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Data export failed for user ${userId}:`, error);
      
      if (this.auditLogger) {
        await this.auditLogger.logError(userId, 'data_export', 'system', error as Error);
      }
      
      throw error;
    }
  }

  // Article 17 - Right to Erasure ("Right to be Forgotten")
  async deleteUserData(userId: string, options: DataDeletionOptions = {}): Promise<DataDeletionResult> {
    this.validateInitialized();

    try {
      console.log(`🗑️ Starting data deletion for user ${userId}`);
      
      // Check consent if consent manager is available
      if (this.consentManager && !options.force) {
        const hasConsent = await this.consentManager.checkConsent(userId, 'data_deletion');
        if (!hasConsent) {
          throw new ConsentError(
            'User has not consented to data deletion',
            'CONSENT_REQUIRED',
            { userId, purpose: 'data_deletion' }
          );
        }
      }

      const deletionResult: DataDeletionResult = {
        id: this.generateDeletionId(),
        userId,
        deletedAt: new Date(),
        tables: [],
        recordCount: 0,
        anonymizedCount: 0,
        retainedCount: 0,
        deletionReason: options.reason || 'user_request',
        metadata: {
          version: '1.0',
          force: options.force || false,
          preserveAuditTrail: options.preserveAuditTrail !== false
        }
      };

      // Get all tables to process
      const tablesToProcess = options.tables || await this.getAllUserTables();
      
      for (const table of tablesToProcess) {
        const tableResult = await this.deleteUserDataFromTable(userId, table, options);
        
        if (tableResult.deletedCount > 0 || tableResult.anonymizedCount > 0) {
          deletionResult.tables.push(table);
          deletionResult.recordCount += tableResult.deletedCount;
          deletionResult.anonymizedCount += tableResult.anonymizedCount;
          deletionResult.retainedCount += tableResult.retainedCount;
        }
      }

      // Handle consent records
      if (this.consentManager && !options.preserveConsents) {
        await this.consentManager.deleteUserConsents(userId);
      }

      // Handle audit trail
      if (this.auditLogger && !options.preserveAuditTrail) {
        await this.auditLogger.deleteUserAuditData(userId);
      } else if (this.auditLogger) {
        // Log the deletion
        await this.auditLogger.logDataDeletion(
          userId,
          'all',
          deletionResult.tables,
          options.reason
        );
      }

      console.log(`✅ Data deletion completed for user ${userId}: ${deletionResult.recordCount} records deleted, ${deletionResult.anonymizedCount} anonymized`);
      
      return deletionResult;
      
    } catch (error) {
      console.error(`❌ Data deletion failed for user ${userId}:`, error);
      
      if (this.auditLogger) {
        await this.auditLogger.logError(userId, 'data_deletion', 'system', error as Error);
      }
      
      throw error;
    }
  }

  // Article 20 - Right to Data Portability
  async createPortabilityRequest(userId: string, request: DataPortabilityRequest): Promise<DataExportResult> {
    this.validateInitialized();

    console.log(`🚀 Creating portability request for user ${userId}`);
    
    // Data portability is essentially a specialized export
    const exportOptions: DataExportOptions = {
      format: request.format || 'json',
      tables: request.tables,
      includeMetadata: true,
      includeAuditTrail: false, // Portability typically doesn't include audit data
      expiresAt: request.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    const result = await this.exportUserData(userId, exportOptions);
    
    // Transform for portability (machine-readable format)
    if (request.format === 'xml' || request.format === 'csv') {
      result.data = await this.transformForPortability(result.data, request.format);
    }

    if (this.auditLogger) {
      await this.auditLogger.logOperation({
        userId,
        action: 'data_portability',
        resource: 'system',
        details: {
          format: request.format,
          tables: request.tables,
          recordCount: result.recordCount
        },
        success: true
      });
    }

    return result;
  }

  // Article 16 - Right to Rectification
  async rectifyUserData(userId: string, request: DataRectificationRequest): Promise<{
    updated: boolean;
    recordsUpdated: number;
    errors: Array<{ table: string; error: string }>;
  }> {
    this.validateInitialized();

    console.log(`✏️ Starting data rectification for user ${userId}`);
    
    const result = {
      updated: false,
      recordsUpdated: 0,
      errors: [] as Array<{ table: string; error: string }>
    };

    for (const update of request.updates) {
      try {
        // Get current record
        const currentRecord = await this.adapter.read(update.table, update.recordId);
        if (!currentRecord) {
          result.errors.push({
            table: update.table,
            error: `Record not found: ${update.recordId}`
          });
          continue;
        }

        // Verify user ownership
        if (!this.isUserRecord(currentRecord, userId)) {
          result.errors.push({
            table: update.table,
            error: `User does not own record: ${update.recordId}`
          });
          continue;
        }

        // Apply updates
        const updatedRecord = await this.adapter.update(
          update.table,
          update.recordId,
          update.data
        );

        result.recordsUpdated++;
        result.updated = true;

        // Log the rectification
        if (this.auditLogger) {
          await this.auditLogger.logOperation({
            userId,
            action: 'data_rectification',
            resource: update.table,
            resourceId: update.recordId,
            details: {
              updatedFields: Object.keys(update.data),
              reason: request.reason
            },
            success: true
          });
        }

      } catch (error) {
        result.errors.push({
          table: update.table,
          error: (error as Error).message
        });
      }
    }

    console.log(`✅ Data rectification completed for user ${userId}: ${result.recordsUpdated} records updated`);
    
    return result;
  }

  // Article 18 - Right to Restriction of Processing
  async restrictProcessing(userId: string, tables: string[], reason: string): Promise<void> {
    this.validateInitialized();

    console.log(`🚫 Restricting processing for user ${userId} on tables: ${tables.join(', ')}`);
    
    // This would typically involve marking records as "restricted"
    // Implementation depends on business logic
    
    for (const table of tables) {
      const userRecords = await this.getUserDataFromTable(userId, table);
      
      for (const record of userRecords) {
        await this.adapter.update(table, record.id, {
          processingRestricted: true,
          restrictionReason: reason,
          restrictedAt: new Date()
        });
      }
    }

    if (this.auditLogger) {
      await this.auditLogger.logOperation({
        userId,
        action: 'restrict_processing',
        resource: 'system',
        details: {
          tables,
          reason
        },
        success: true
      });
    }
  }

  // Data anonymization (alternative to deletion for retained data)
  async anonymizeUserData(userId: string, tables: string[]): Promise<{
    anonymizedCount: number;
    tables: string[];
  }> {
    this.validateInitialized();

    console.log(`🎭 Anonymizing data for user ${userId}`);
    
    let anonymizedCount = 0;
    const processedTables: string[] = [];

    for (const table of tables) {
      const userRecords = await this.getUserDataFromTable(userId, table);
      
      for (const record of userRecords) {
        const anonymizedRecord = this.anonymizeRecord(record, userId);
        await this.adapter.update(table, record.id, anonymizedRecord);
        anonymizedCount++;
      }
      
      if (userRecords.length > 0) {
        processedTables.push(table);
      }
    }

    if (this.auditLogger) {
      await this.auditLogger.logOperation({
        userId,
        action: 'data_anonymization',
        resource: 'system',
        details: {
          tables: processedTables,
          recordCount: anonymizedCount
        },
        success: true
      });
    }

    return {
      anonymizedCount,
      tables: processedTables
    };
  }

  // Private helper methods
  private async getAllUserTables(): Promise<string[]> {
    // Get all available tables from adapter
    if (typeof this.adapter.getTableNames === 'function') {
      return await this.adapter.getTableNames();
    }
    
    // Fallback to common tables
    return [
      'users', 'posts', 'comments', 'courses', 'enrollments',
      'messages', 'consent_records', 'audit_logs'
    ];
  }

  private async getUserDataFromTable(userId: string, table: string, options: DataExportOptions = {}): Promise<StorageEntity[]> {
    try {
      const filter: QueryFilter<StorageEntity> = {
        where: this.buildUserFilter(userId, table),
        orderBy: [{ field: 'createdAt', direction: 'desc' }]
      };

      if (options.limit) {
        filter.limit = options.limit;
      }

      let records = await this.adapter.query(table, filter);

      // Decrypt records if encryption service is available
      if (this.encryptionService && this.encryptionService.isEnabled()) {
        records = await Promise.all(
          records.map(record => 
            this.encryptionService!.processEntityFromStorage(table, record)
          )
        );
      }

      return records;
      
    } catch (error) {
      console.warn(`Could not retrieve data from table ${table}:`, error);
      return [];
    }
  }

  private async deleteUserDataFromTable(
    userId: string, 
    table: string, 
    options: DataDeletionOptions
  ): Promise<{
    deletedCount: number;
    anonymizedCount: number;
    retainedCount: number;
  }> {
    const result = {
      deletedCount: 0,
      anonymizedCount: 0,
      retainedCount: 0
    };

    try {
      const userRecords = await this.getUserDataFromTable(userId, table);
      
      for (const record of userRecords) {
        if (this.shouldRetainRecord(record, table, options)) {
          result.retainedCount++;
        } else if (this.shouldAnonymizeRecord(record, table, options)) {
          const anonymizedRecord = this.anonymizeRecord(record, userId);
          await this.adapter.update(table, record.id, anonymizedRecord);
          result.anonymizedCount++;
        } else {
          await this.adapter.delete(table, record.id);
          result.deletedCount++;
        }
      }
      
    } catch (error) {
      console.warn(`Could not delete data from table ${table}:`, error);
    }

    return result;
  }

  private buildUserFilter(userId: string, table: string): any {
    // Common user identification patterns
    const userFields = ['userId', 'authorId', 'senderId', 'recipientId', 'instructorId'];
    
    // Try to find the appropriate user field for this table
    if (table === 'users') {
      return { id: userId };
    }
    
    // Build OR condition for multiple possible user fields
    const conditions = userFields.map(field => ({ [field]: userId }));
    
    return { or: conditions };
  }

  private isUserRecord(record: StorageEntity, userId: string): boolean {
    const userFields = ['userId', 'authorId', 'senderId', 'recipientId', 'instructorId', 'id'];
    
    return userFields.some(field => (record as any)[field] === userId);
  }

  private shouldRetainRecord(record: StorageEntity, table: string, options: DataDeletionOptions): boolean {
    // Business logic for determining if a record should be retained
    // e.g., for legal compliance, financial records, etc.
    
    if (options.retainAuditTrail && table === 'audit_logs') {
      return true;
    }
    
    if (options.retainFinancial && this.isFinancialRecord(record, table)) {
      return true;
    }
    
    return false;
  }

  private shouldAnonymizeRecord(record: StorageEntity, table: string, options: DataDeletionOptions): boolean {
    // Business logic for determining if a record should be anonymized instead of deleted
    
    if (options.anonymizeInsteadOfDelete) {
      return true;
    }
    
    // Anonymize statistical or research data
    if (this.isStatisticalRecord(record, table)) {
      return true;
    }
    
    return false;
  }

  private isFinancialRecord(record: StorageEntity, table: string): boolean {
    const financialTables = ['transactions', 'payments', 'invoices', 'billing'];
    return financialTables.includes(table);
  }

  private isStatisticalRecord(record: StorageEntity, table: string): boolean {
    const statisticalTables = ['analytics', 'metrics', 'usage_stats'];
    return statisticalTables.includes(table);
  }

  private anonymizeRecord(record: StorageEntity, userId: string): Partial<StorageEntity> {
    const anonymized: any = { ...record };
    
    // Remove or anonymize personally identifiable information
    const piiFields = [
      'email', 'name', 'firstName', 'lastName', 'phone', 'address',
      'ipAddress', 'userAgent', 'location'
    ];
    
    for (const field of piiFields) {
      if (anonymized[field]) {
        anonymized[field] = this.generateAnonymizedValue(field);
      }
    }
    
    // Update user references
    const userFields = ['userId', 'authorId', 'senderId', 'recipientId'];
    for (const field of userFields) {
      if (anonymized[field] === userId) {
        anonymized[field] = this.generateAnonymizedUserId();
      }
    }
    
    // Mark as anonymized
    anonymized.anonymized = true;
    anonymized.anonymizedAt = new Date();
    anonymized.originalUserId = this.hashUserId(userId);
    
    return anonymized;
  }

  private generateAnonymizedValue(field: string): string {
    const patterns: Record<string, string> = {
      email: 'anonymized@example.com',
      name: 'Anonymous User',
      firstName: 'Anonymous',
      lastName: 'User',
      phone: '+1-XXX-XXX-XXXX',
      address: 'Address Redacted',
      ipAddress: '0.0.0.0',
      userAgent: 'User Agent Redacted'
    };
    
    return patterns[field] || '[REDACTED]';
  }

  private generateAnonymizedUserId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private hashUserId(userId: string): string {
    // Simple hash for correlation (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }

  private countRecords(data: any): number {
    let count = 0;
    for (const table of Object.values(data)) {
      if (Array.isArray(table)) {
        count += table.length;
      }
    }
    return count;
  }

  private async transformForPortability(data: any, format: string): Promise<any> {
    // Transform data for different portability formats
    switch (format) {
      case 'xml':
        return this.convertToXML(data);
      case 'csv':
        return this.convertToCSV(data);
      default:
        return data;
    }
  }

  private convertToXML(data: any): string {
    // Simple XML conversion (would use a proper library in production)
    return `<export>${JSON.stringify(data)}</export>`;
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion for tabular data
    let csv = '';
    for (const [tableName, records] of Object.entries(data)) {
      if (Array.isArray(records) && records.length > 0) {
        csv += `\n\n--- ${tableName} ---\n`;
        const headers = Object.keys(records[0]);
        csv += headers.join(',') + '\n';
        
        for (const record of records) {
          const values = headers.map(h => (record as any)[h] || '');
          csv += values.join(',') + '\n';
        }
      }
    }
    return csv;
  }

  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeletionId(): string {
    return `deletion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateInitialized(): void {
    if (!this.isInitialized) {
      throw new StorageError('DataSubjectRights not initialized', 'NOT_INITIALIZED');
    }
  }

  // Public API
  isAvailable(): boolean {
    return this.isInitialized && !!this.adapter;
  }

  // Article 21 - Right to Object
  async objectToProcessing(userId: string, purpose: string, reason: string, metadata?: any): Promise<void> {
    this.validateInitialized();

    console.log(`⛔ Processing objection from user ${userId} for purpose ${purpose}`);
    
    // Log the objection
    if (this.auditLogger) {
      await this.auditLogger.logProcessingObjection(userId, purpose, reason, metadata);
    }
    
    // In a real implementation, this would:
    // 1. Stop processing for the specified purpose
    // 2. Update consent/processing records
    // 3. Notify relevant systems
    
    console.log(`✅ Processing objection recorded for user ${userId}`);
  }

  // Article 22 - Automated Decision-Making
  async logAutomatedDecision(userId: string, algorithm: string, decision: any, confidence?: number, metadata?: any): Promise<void> {
    this.validateInitialized();

    console.log(`🤖 Automated decision for user ${userId} using ${algorithm}`);
    
    if (this.auditLogger) {
      await this.auditLogger.logAutomatedDecision(userId, algorithm, decision, confidence, metadata);
    }
  }

  getCapabilities(): string[] {
    const capabilities = [
      'data_export',
      'data_deletion',
      'data_portability',
      'data_rectification',
      'processing_restriction',
      'processing_objection', // Article 21
      'automated_decision_tracking', // Article 22
      'data_anonymization'
    ];
    
    if (this.encryptionService) {
      capabilities.push('encrypted_export');
    }
    
    if (this.auditLogger) {
      capabilities.push('audit_trail_export');
    }
    
    return capabilities;
  }
}