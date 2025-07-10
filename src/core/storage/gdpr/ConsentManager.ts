// GDPR Consent Manager - Purpose-based consent tracking with audit trail
// Manages user consent for different data processing purposes

import { ConsentConfig, ConsentRecord, ConsentPurpose, ConsentError } from './types';

export interface ConsentStatus {
  purpose: string;
  granted: boolean;
  timestamp: Date;
  expiresAt?: Date;
  source: 'explicit' | 'implicit' | 'legitimate_interest';
  metadata?: Record<string, any>;
}

export interface ConsentSummary {
  userId: string;
  totalPurposes: number;
  grantedPurposes: number;
  expiredConsents: number;
  lastUpdate: Date;
  purposes: ConsentStatus[];
}

export class ConsentManager {
  private config: ConsentConfig;
  private consentStore = new Map<string, Map<string, ConsentRecord>>();
  private purposeDefinitions = new Map<string, ConsentPurpose>();

  constructor(config: ConsentConfig) {
    this.config = config;
    this.initializePurposes();
  }

  /**
   * Initialize predefined consent purposes
   */
  private initializePurposes(): void {
    const defaultPurposes: ConsentPurpose[] = [
      {
        id: 'analytics',
        name: 'Analytics and Performance',
        description: 'Collect usage data to improve our services',
        category: 'analytics',
        required: false,
        legalBasis: 'consent',
        retentionPeriod: 'P2Y'
      },
      {
        id: 'marketing',
        name: 'Marketing Communications',
        description: 'Send promotional emails and personalized offers',
        category: 'marketing',
        required: false,
        legalBasis: 'consent',
        retentionPeriod: 'P3Y'
      },
      {
        id: 'essential',
        name: 'Essential Service Operation',
        description: 'Necessary for basic service functionality',
        category: 'functional',
        required: true,
        legalBasis: 'legitimate_interest',
        retentionPeriod: 'P7Y'
      },
      {
        id: 'personalization',
        name: 'Content Personalization',
        description: 'Customize content based on your preferences',
        category: 'personalization',
        required: false,
        legalBasis: 'consent',
        retentionPeriod: 'P1Y'
      }
    ];

    // Add configured purposes
    [...defaultPurposes, ...this.config.purposes].forEach(purpose => {
      this.purposeDefinitions.set(purpose.id, purpose);
    });

    console.log(`📋 Initialized ${this.purposeDefinitions.size} consent purposes`);
  }

  /**
   * Record user consent for a specific purpose
   */
  async recordConsent(
    userId: string,
    purposeId: string,
    granted: boolean,
    options: {
      source?: 'explicit' | 'implicit' | 'legitimate_interest';
      metadata?: Record<string, any>;
      expiryDays?: number;
    } = {}
  ): Promise<ConsentRecord> {
    const purpose = this.purposeDefinitions.get(purposeId);
    if (!purpose) {
      throw new ConsentError(`Unknown consent purpose: ${purposeId}`);
    }

    // Calculate expiry date
    const expiryDays = options.expiryDays || this.config.expiryDays;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const consentRecord: ConsentRecord = {
      id: this.generateConsentId(),
      userId,
      purposeId,
      granted,
      timestamp: new Date(),
      expiresAt: purpose.required ? undefined : expiresAt,
      source: options.source || 'explicit',
      ipAddress: options.metadata?.ipAddress || 'unknown',
      userAgent: options.metadata?.userAgent || 'unknown',
      version: 1,
      metadata: options.metadata || {}
    };

    // Store consent record
    if (!this.consentStore.has(userId)) {
      this.consentStore.set(userId, new Map());
    }
    this.consentStore.get(userId)!.set(purposeId, consentRecord);

    console.log(`📝 Recorded consent: ${userId} -> ${purposeId} = ${granted ? 'GRANTED' : 'DENIED'}`);

    return consentRecord;
  }

  /**
   * Check if user has granted consent for a purpose
   */
  async checkConsent(userId: string, purposeId: string): Promise<boolean> {
    if (!this.config.required) {
      return this.config.defaultConsent;
    }

    const purpose = this.purposeDefinitions.get(purposeId);
    if (!purpose) {
      throw new ConsentError(`Unknown consent purpose: ${purposeId}`);
    }

    // Required purposes are always considered granted
    if (purpose.required) {
      return true;
    }

    const userConsents = this.consentStore.get(userId);
    if (!userConsents) {
      return this.config.defaultConsent;
    }

    const consentRecord = userConsents.get(purposeId);
    if (!consentRecord) {
      return this.config.defaultConsent;
    }

    // Check if consent has expired
    if (consentRecord.expiresAt && consentRecord.expiresAt < new Date()) {
      console.log(`⏰ Consent expired for ${userId} -> ${purposeId}`);
      return false;
    }

    return consentRecord.granted;
  }

  /**
   * Get all consent records for a user
   */
  async getUserConsents(userId: string): Promise<ConsentSummary> {
    const userConsents = this.consentStore.get(userId) || new Map();
    const now = new Date();
    
    const purposes: ConsentStatus[] = Array.from(this.purposeDefinitions.values()).map(purpose => {
      const record = userConsents.get(purpose.id);
      
      return {
        purpose: purpose.id,
        granted: record ? record.granted : (purpose.required || this.config.defaultConsent),
        timestamp: record ? record.timestamp : now,
        expiresAt: record?.expiresAt,
        source: record ? record.source : (purpose.required ? 'legitimate_interest' : 'implicit'),
        metadata: {
          name: purpose.name,
          description: purpose.description,
          category: purpose.category,
          required: purpose.required,
          legalBasis: purpose.legalBasis
        }
      };
    });

    const grantedPurposes = purposes.filter(p => p.granted).length;
    const expiredConsents = purposes.filter(p => 
      p.expiresAt && p.expiresAt < now
    ).length;

    const lastUpdate = purposes.reduce((latest, p) => 
      p.timestamp > latest ? p.timestamp : latest, 
      new Date(0)
    );

    return {
      userId,
      totalPurposes: purposes.length,
      grantedPurposes,
      expiredConsents,
      lastUpdate,
      purposes
    };
  }

  /**
   * Withdraw consent for a specific purpose
   */
  async withdrawConsent(userId: string, purposeId: string): Promise<boolean> {
    const purpose = this.purposeDefinitions.get(purposeId);
    if (!purpose) {
      throw new ConsentError(`Unknown consent purpose: ${purposeId}`);
    }

    if (purpose.required) {
      throw new ConsentError(`Cannot withdraw consent for required purpose: ${purposeId}`);
    }

    await this.recordConsent(userId, purposeId, false, {
      source: 'explicit',
      metadata: { action: 'withdrawal' }
    });

    console.log(`🚫 Consent withdrawn: ${userId} -> ${purposeId}`);
    return true;
  }

  /**
   * Refresh expired consents by requesting new consent
   */
  async refreshExpiredConsents(userId: string): Promise<string[]> {
    const userConsents = this.consentStore.get(userId);
    if (!userConsents) return [];

    const now = new Date();
    const expiredPurposes: string[] = [];

    for (const [purposeId, record] of userConsents.entries()) {
      if (record.expiresAt && record.expiresAt < now && record.granted) {
        expiredPurposes.push(purposeId);
      }
    }

    console.log(`⚠️ Found ${expiredPurposes.length} expired consents for user ${userId}`);
    return expiredPurposes;
  }

  /**
   * Export user consent history for GDPR compliance
   */
  async exportConsentHistory(userId: string): Promise<{
    user: string;
    exportDate: string;
    consentHistory: ConsentRecord[];
    currentStatus: ConsentSummary;
  }> {
    const userConsents = this.consentStore.get(userId) || new Map();
    const consentHistory = Array.from(userConsents.values());
    const currentStatus = await this.getUserConsents(userId);

    return {
      user: userId,
      exportDate: new Date().toISOString(),
      consentHistory,
      currentStatus
    };
  }

  /**
   * Delete all consent records for a user (for GDPR erasure)
   */
  async deleteUserConsents(userId: string): Promise<number> {
    const userConsents = this.consentStore.get(userId);
    if (!userConsents) return 0;

    const recordCount = userConsents.size;
    this.consentStore.delete(userId);

    console.log(`🗑️ Deleted ${recordCount} consent records for user ${userId}`);
    return recordCount;
  }

  /**
   * Get consent statistics for analytics
   */
  getConsentStats(): {
    totalUsers: number;
    totalRecords: number;
    purposeStats: Record<string, { granted: number; denied: number; expired: number }>;
    complianceRate: number;
  } {
    const stats = {
      totalUsers: this.consentStore.size,
      totalRecords: 0,
      purposeStats: {} as Record<string, { granted: number; denied: number; expired: number }>,
      complianceRate: 0
    };

    const now = new Date();
    let totalCompliantUsers = 0;

    // Initialize purpose stats
    for (const purposeId of this.purposeDefinitions.keys()) {
      stats.purposeStats[purposeId] = { granted: 0, denied: 0, expired: 0 };
    }

    // Calculate statistics
    for (const [userId, userConsents] of this.consentStore.entries()) {
      stats.totalRecords += userConsents.size;
      
      let userCompliant = true;
      for (const [purposeId, record] of userConsents.entries()) {
        const purpose = this.purposeDefinitions.get(purposeId);
        if (!purpose) continue;

        if (record.expiresAt && record.expiresAt < now) {
          stats.purposeStats[purposeId].expired++;
          if (!purpose.required) userCompliant = false;
        } else if (record.granted) {
          stats.purposeStats[purposeId].granted++;
        } else {
          stats.purposeStats[purposeId].denied++;
          if (!purpose.required) userCompliant = false;
        }
      }
      
      if (userCompliant) totalCompliantUsers++;
    }

    stats.complianceRate = stats.totalUsers > 0 ? 
      (totalCompliantUsers / stats.totalUsers) * 100 : 100;

    return stats;
  }

  /**
   * Add a new consent purpose definition
   */
  addPurpose(purpose: ConsentPurpose): void {
    this.purposeDefinitions.set(purpose.id, purpose);
    console.log(`📋 Added new consent purpose: ${purpose.id}`);
  }

  /**
   * Get all available consent purposes
   */
  getPurposes(): ConsentPurpose[] {
    return Array.from(this.purposeDefinitions.values());
  }

  /**
   * Clean up expired consent records
   */
  async cleanupExpiredConsents(): Promise<number> {
    let cleanedCount = 0;
    const now = new Date();

    for (const [userId, userConsents] of this.consentStore.entries()) {
      const toDelete: string[] = [];
      
      for (const [purposeId, record] of userConsents.entries()) {
        if (record.expiresAt && record.expiresAt < now) {
          toDelete.push(purposeId);
        }
      }
      
      toDelete.forEach(purposeId => {
        userConsents.delete(purposeId);
        cleanedCount++;
      });
      
      if (userConsents.size === 0) {
        this.consentStore.delete(userId);
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired consent records`);
    }

    return cleanedCount;
  }

  /**
   * Validate consent configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.expiryDays <= 0) {
      errors.push('Consent expiry days must be positive');
    }

    if (this.config.purposes.length === 0 && this.config.required) {
      errors.push('At least one purpose must be defined when consent is required');
    }

    // Check for duplicate purpose IDs
    const purposeIds = new Set();
    for (const purpose of this.config.purposes) {
      if (purposeIds.has(purpose.id)) {
        errors.push(`Duplicate purpose ID: ${purpose.id}`);
      }
      purposeIds.add(purpose.id);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}