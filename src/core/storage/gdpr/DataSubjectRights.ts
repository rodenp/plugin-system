// GDPR Data Subject Rights Service - Export, deletion, and rectification capabilities
// Implements GDPR Articles 15, 16, and 17 (Right to access, rectification, and erasure)

import { AuditLogger } from './AuditLogger';
import { ConsentManager } from './ConsentManager';
import { DataExportRequest, DataDeletionRequest, DataRectificationRequest, DataSubjectRightsError } from './types';

export interface DataExportResult {
  requestId: string;
  userId: string;
  exportDate: string;
  format: 'json' | 'csv';
  data: {
    personalData: Record<string, any>;
    consentHistory: any[];
    auditTrail: any[];
    metadata: {
      totalRecords: number;
      tablesIncluded: string[];
      exportedBy: string;
      processingTime: number;
    };
  };
}

export interface DataDeletionResult {
  requestId: string;
  userId: string;
  deletionDate: string;
  summary: {
    tablesProcessed: number;
    recordsDeleted: number;
    filesDeleted: number;
    backupsHandled: number;
    anonymizedRecords: number;
  };
  certificate: string;
}

export interface DataRectificationResult {
  requestId: string;
  userId: string;
  rectificationDate: string;
  changes: {
    table: string;
    field: string;
    oldValue: any;
    newValue: any;
    verified: boolean;
  }[];
  summary: {
    fieldsUpdated: number;
    tablesAffected: number;
    validationErrors: string[];
  };
}

export class DataSubjectRights {
  private auditLogger: AuditLogger;
  private consentManager: ConsentManager;
  private storageInstance: any; // Will be injected with the actual storage instance

  constructor(auditLogger: AuditLogger, consentManager: ConsentManager) {
    this.auditLogger = auditLogger;
    this.consentManager = consentManager;
  }

  /**
   * Set the storage instance for data operations
   */
  setStorageInstance(storageInstance: any): void {
    this.storageInstance = storageInstance;
  }

  /**
   * Process data export request (GDPR Article 15 - Right to access)
   */
  async processDataExportRequest(request: DataExportRequest): Promise<DataExportResult> {
    const requestId = this.generateRequestId('export');
    const startTime = Date.now();

    try {
      // Log the export request
      await this.auditLogger.logDataSubjectRights(
        request.userId,
        'export_request',
        { requestId, format: request.format },
        { requestedBy: request.requestedBy }
      );

      // Collect personal data from all relevant tables
      const personalData = await this.collectUserPersonalData(request.userId, request.includeTables);

      // Get consent history
      const consentHistory = await this.consentManager.exportConsentHistory(request.userId);

      // Get audit trail
      const auditTrail = await this.auditLogger.getUserAuditTrail(request.userId, 365); // Last year

      const processingTime = Date.now() - startTime;

      const exportResult: DataExportResult = {
        requestId,
        userId: request.userId,
        exportDate: new Date().toISOString(),
        format: request.format,
        data: {
          personalData,
          consentHistory: [consentHistory],
          auditTrail,
          metadata: {
            totalRecords: Object.keys(personalData).reduce((sum, table) => 
              sum + (Array.isArray(personalData[table]) ? personalData[table].length : 1), 0),
            tablesIncluded: Object.keys(personalData),
            exportedBy: request.requestedBy || 'user',
            processingTime
          }
        }
      };

      // Log successful export
      await this.auditLogger.logDataSubjectRights(
        request.userId,
        'export_completed',
        { 
          requestId, 
          recordCount: exportResult.data.metadata.totalRecords,
          processingTime 
        }
      );

      console.log(`📤 Data export completed for user ${request.userId}: ${exportResult.data.metadata.totalRecords} records`);

      return exportResult;

    } catch (error) {
      await this.auditLogger.logEvent({
        userId: request.userId,
        action: 'dsr_export_failed',
        resource: 'data_subject_rights',
        resourceId: request.userId,
        result: 'failure',
        details: { error: error.message, requestId }
      });

      throw new DataSubjectRightsError(`Data export failed: ${error.message}`);
    }
  }

  /**
   * Process data deletion request (GDPR Article 17 - Right to erasure)
   */
  async processDataDeletionRequest(request: DataDeletionRequest): Promise<DataDeletionResult> {
    const requestId = this.generateRequestId('deletion');

    try {
      // Log the deletion request
      await this.auditLogger.logDataSubjectRights(
        request.userId,
        'deletion_request',
        { requestId, reason: request.reason },
        { requestedBy: request.requestedBy }
      );

      const summary = {
        tablesProcessed: 0,
        recordsDeleted: 0,
        filesDeleted: 0,
        backupsHandled: 0,
        anonymizedRecords: 0
      };

      // Delete or anonymize personal data based on request
      if (request.hardDelete) {
        // Complete deletion
        summary.recordsDeleted = await this.hardDeleteUserData(request.userId, request.includeTables);
      } else {
        // Anonymization (keeps data for analytics but removes PII)
        summary.anonymizedRecords = await this.anonymizeUserData(request.userId, request.includeTables);
      }

      // Handle consent records
      const consentRecordsDeleted = await this.consentManager.deleteUserConsents(request.userId);
      summary.recordsDeleted += consentRecordsDeleted;

      // Handle audit logs
      if (request.hardDelete) {
        const auditRecordsDeleted = await this.auditLogger.deleteUserLogs(request.userId);
        summary.recordsDeleted += auditRecordsDeleted;
      } else {
        const auditRecordsAnonymized = await this.auditLogger.anonymizeUserLogs(request.userId);
        summary.anonymizedRecords += auditRecordsAnonymized;
      }

      // Generate deletion certificate
      const certificate = this.generateDeletionCertificate(requestId, request.userId, summary);

      const deletionResult: DataDeletionResult = {
        requestId,
        userId: request.userId,
        deletionDate: new Date().toISOString(),
        summary,
        certificate
      };

      // Log successful deletion
      await this.auditLogger.logDataSubjectRights(
        'system',
        'deletion_completed',
        { 
          requestId, 
          originalUserId: request.userId,
          recordsDeleted: summary.recordsDeleted,
          recordsAnonymized: summary.anonymizedRecords 
        }
      );

      console.log(`🗑️ Data deletion completed for user ${request.userId}: ${summary.recordsDeleted} deleted, ${summary.anonymizedRecords} anonymized`);

      return deletionResult;

    } catch (error) {
      await this.auditLogger.logEvent({
        userId: request.userId,
        action: 'dsr_deletion_failed',
        resource: 'data_subject_rights',
        resourceId: request.userId,
        result: 'failure',
        details: { error: error.message, requestId }
      });

      throw new DataSubjectRightsError(`Data deletion failed: ${error.message}`);
    }
  }

  /**
   * Process data rectification request (GDPR Article 16 - Right to rectification)
   */
  async processDataRectificationRequest(request: DataRectificationRequest): Promise<DataRectificationResult> {
    const requestId = this.generateRequestId('rectification');

    try {
      // Log the rectification request
      await this.auditLogger.logDataSubjectRights(
        request.userId,
        'rectification_request',
        { requestId, fieldsToUpdate: Object.keys(request.updates) },
        { requestedBy: request.requestedBy }
      );

      const changes: DataRectificationResult['changes'] = [];
      const validationErrors: string[] = [];
      const tablesAffected = new Set<string>();

      // Process each requested update
      for (const [table, updates] of Object.entries(request.updates)) {
        for (const [field, newValue] of Object.entries(updates)) {
          try {
            // Get current value
            const currentRecord = await this.storageInstance?.getEntity(table, request.userId);
            const oldValue = currentRecord?.[field];

            // Validate the new value
            const validationResult = await this.validateFieldUpdate(table, field, newValue, request.userId);
            
            if (!validationResult.valid) {
              validationErrors.push(`${table}.${field}: ${validationResult.error}`);
              continue;
            }

            // Update the field
            if (currentRecord) {
              currentRecord[field] = newValue;
              await this.storageInstance?.setEntity(table, request.userId, currentRecord);

              changes.push({
                table,
                field,
                oldValue,
                newValue,
                verified: true
              });

              tablesAffected.add(table);

              // Log the field update
              await this.auditLogger.logDataModification(
                request.userId,
                table,
                request.userId,
                'update',
                { [field]: { from: oldValue, to: newValue } },
                { rectificationRequestId: requestId }
              );
            }

          } catch (error) {
            validationErrors.push(`${table}.${field}: ${error.message}`);
          }
        }
      }

      const rectificationResult: DataRectificationResult = {
        requestId,
        userId: request.userId,
        rectificationDate: new Date().toISOString(),
        changes,
        summary: {
          fieldsUpdated: changes.length,
          tablesAffected: tablesAffected.size,
          validationErrors
        }
      };

      // Log successful rectification
      await this.auditLogger.logDataSubjectRights(
        request.userId,
        'rectification_completed',
        { 
          requestId, 
          fieldsUpdated: changes.length,
          tablesAffected: tablesAffected.size,
          validationErrors: validationErrors.length
        }
      );

      console.log(`✏️ Data rectification completed for user ${request.userId}: ${changes.length} fields updated`);

      return rectificationResult;

    } catch (error) {
      await this.auditLogger.logEvent({
        userId: request.userId,
        action: 'dsr_rectification_failed',
        resource: 'data_subject_rights',
        resourceId: request.userId,
        result: 'failure',
        details: { error: error.message, requestId }
      });

      throw new DataSubjectRightsError(`Data rectification failed: ${error.message}`);
    }
  }

  /**
   * Get status of a data subject rights request
   */
  async getRequestStatus(requestId: string): Promise<{
    requestId: string;
    type: 'export' | 'deletion' | 'rectification';
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
    details?: any;
  }> {
    // This would typically query a database of requests
    // For now, we'll return a placeholder
    return {
      requestId,
      type: 'export',
      status: 'completed',
      createdAt: new Date(),
      completedAt: new Date()
    };
  }

  /**
   * Collect all personal data for a user across tables
   */
  private async collectUserPersonalData(userId: string, includeTables?: string[]): Promise<Record<string, any>> {
    const personalData: Record<string, any> = {};

    // Default tables to include if not specified
    const defaultTables = ['users', 'posts', 'comments', 'courses', 'enrollments', 'progress'];
    const tablesToScan = includeTables || defaultTables;

    for (const table of tablesToScan) {
      try {
        // Try to get user-specific data
        const userData = await this.storageInstance?.getEntity(table, userId);
        if (userData) {
          personalData[table] = userData;
        }

        // Also search for related data (e.g., posts by user, comments by user)
        const relatedData = await this.storageInstance?.getEntitiesWhere(table, (entity: any) => 
          entity.userId === userId || 
          entity.authorId === userId || 
          entity.createdBy === userId ||
          entity.ownerId === userId
        );

        if (relatedData && relatedData.length > 0) {
          personalData[`${table}_related`] = relatedData;
        }

      } catch (error) {
        console.warn(`Could not collect data from table ${table}:`, error.message);
      }
    }

    return personalData;
  }

  /**
   * Hard delete user data across all tables
   */
  private async hardDeleteUserData(userId: string, includeTables?: string[]): Promise<number> {
    let deletedCount = 0;
    const defaultTables = ['users', 'posts', 'comments', 'courses', 'enrollments', 'progress'];
    const tablesToClean = includeTables || defaultTables;

    for (const table of tablesToClean) {
      try {
        // Delete primary record
        const primaryRecord = await this.storageInstance?.getEntity(table, userId);
        if (primaryRecord) {
          await this.storageInstance?.removeEntity(table, userId);
          deletedCount++;
        }

        // Delete related records
        const relatedRecords = await this.storageInstance?.getEntitiesWhere(table, (entity: any) => 
          entity.userId === userId || 
          entity.authorId === userId || 
          entity.createdBy === userId ||
          entity.ownerId === userId
        );

        if (relatedRecords) {
          for (const record of relatedRecords) {
            await this.storageInstance?.removeEntity(table, record.id);
            deletedCount++;
          }
        }

      } catch (error) {
        console.warn(`Could not delete data from table ${table}:`, error.message);
      }
    }

    return deletedCount;
  }

  /**
   * Anonymize user data (replace PII with anonymous values)
   */
  private async anonymizeUserData(userId: string, includeTables?: string[]): Promise<number> {
    let anonymizedCount = 0;
    const anonymousId = `anonymous_${Date.now()}`;
    const defaultTables = ['users', 'posts', 'comments', 'courses', 'enrollments', 'progress'];
    const tablesToAnonymize = includeTables || defaultTables;

    for (const table of tablesToAnonymize) {
      try {
        // Anonymize primary record
        const primaryRecord = await this.storageInstance?.getEntity(table, userId);
        if (primaryRecord) {
          const anonymizedRecord = this.anonymizeRecord(primaryRecord);
          await this.storageInstance?.setEntity(table, userId, anonymizedRecord);
          anonymizedCount++;
        }

        // Anonymize related records
        const relatedRecords = await this.storageInstance?.getEntitiesWhere(table, (entity: any) => 
          entity.userId === userId || 
          entity.authorId === userId || 
          entity.createdBy === userId ||
          entity.ownerId === userId
        );

        if (relatedRecords) {
          for (const record of relatedRecords) {
            const anonymizedRecord = this.anonymizeRecord(record);
            // Update user references
            if (anonymizedRecord.userId === userId) anonymizedRecord.userId = anonymousId;
            if (anonymizedRecord.authorId === userId) anonymizedRecord.authorId = anonymousId;
            if (anonymizedRecord.createdBy === userId) anonymizedRecord.createdBy = anonymousId;
            if (anonymizedRecord.ownerId === userId) anonymizedRecord.ownerId = anonymousId;
            
            await this.storageInstance?.setEntity(table, record.id, anonymizedRecord);
            anonymizedCount++;
          }
        }

      } catch (error) {
        console.warn(`Could not anonymize data from table ${table}:`, error.message);
      }
    }

    return anonymizedCount;
  }

  /**
   * Anonymize a single record by removing PII
   */
  private anonymizeRecord(record: any): any {
    const anonymized = { ...record };
    
    // Fields to anonymize
    const piiFields = ['name', 'email', 'phone', 'address', 'firstName', 'lastName', 'username'];
    
    for (const field of piiFields) {
      if (anonymized[field]) {
        anonymized[field] = '[ANONYMIZED]';
      }
    }

    // Add anonymization metadata
    anonymized._anonymized = {
      date: new Date().toISOString(),
      reason: 'gdpr_erasure'
    };

    return anonymized;
  }

  /**
   * Validate field update for rectification
   */
  private async validateFieldUpdate(table: string, field: string, value: any, userId: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    // Basic validation rules
    if (field === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, error: 'Invalid email format' };
      }
    }

    if (field === 'phone' && value) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(value)) {
        return { valid: false, error: 'Invalid phone format' };
      }
    }

    // Check for empty required fields
    const requiredFields = ['name', 'email'];
    if (requiredFields.includes(field) && (!value || value.trim() === '')) {
      return { valid: false, error: 'Field cannot be empty' };
    }

    return { valid: true };
  }

  /**
   * Generate deletion certificate for compliance
   */
  private generateDeletionCertificate(requestId: string, userId: string, summary: any): string {
    const certificate = {
      certificateId: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId,
      userId,
      deletionDate: new Date().toISOString(),
      summary,
      compliance: {
        gdprArticle: 'Article 17 - Right to erasure',
        processor: 'GDPR Storage System',
        method: summary.recordsDeleted > 0 ? 'hard_delete' : 'anonymization',
        verification: 'automated'
      },
      signature: this.generateSignature(requestId, userId, summary)
    };

    return JSON.stringify(certificate, null, 2);
  }

  /**
   * Generate signature for certificate
   */
  private generateSignature(requestId: string, userId: string, summary: any): string {
    const data = `${requestId}:${userId}:${JSON.stringify(summary)}`;
    // In production, this would be a proper cryptographic signature
    return Buffer.from(data).toString('base64');
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(type: string): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}