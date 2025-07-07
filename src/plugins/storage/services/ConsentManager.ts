// Consent Manager - GDPR consent tracking and management
import {
  ConsentConfig,
  ConsentRecord,
  ConsentPurpose,
  ConsentError,
  StorageBackend,
  QueryFilter
} from '../types';

export class ConsentManager {
  private config: ConsentConfig;
  private adapter?: StorageBackend;
  private consentCache: Map<string, Map<string, ConsentRecord>> = new Map();
  private isInitialized = false;

  constructor(config: ConsentConfig) {
    this.config = this.validateConfig(config);
  }

  async initialize(adapter?: StorageBackend): Promise<void> {
    if (this.isInitialized) {
      console.warn('ConsentManager already initialized');
      return;
    }

    try {
      console.log('📋 Initializing ConsentManager...');
      
      this.adapter = adapter;
      
      // Load existing consent records into cache
      if (this.adapter) {
        await this.loadConsentRecords();
      }
      
      // Set up consent expiration checking
      this.setupExpirationChecking();
      
      this.isInitialized = true;
      console.log('✅ ConsentManager initialized');
      
    } catch (error) {
      throw new ConsentError(
        `Failed to initialize ConsentManager: ${(error as Error).message}`,
        'INITIALIZATION_ERROR',
        { config: this.sanitizeConfig() }
      );
    }
  }

  async destroy(): Promise<void> {
    if (!this.isInitialized) return;
    
    try {
      console.log('📋 Destroying ConsentManager...');
      
      // Clear cache
      this.consentCache.clear();
      
      this.isInitialized = false;
      console.log('✅ ConsentManager destroyed');
      
    } catch (error) {
      console.error('❌ ConsentManager destruction failed:', error);
      throw new ConsentError(
        `Failed to destroy ConsentManager: ${(error as Error).message}`,
        'DESTRUCTION_ERROR'
      );
    }
  }

  // Core consent operations
  async grantConsent(userId: string, purposes: string[], options?: {
    source?: string;
    evidence?: any;
    expiresAt?: Date;
    metadata?: any;
  }): Promise<void> {
    this.validateInitialized();

    for (const purposeId of purposes) {
      const purpose = this.getPurpose(purposeId);
      if (!purpose) {
        throw new ConsentError(
          `Unknown consent purpose: ${purposeId}`,
          'UNKNOWN_PURPOSE',
          { purposeId, availablePurposes: this.config.purposes.map(p => p.id) }
        );
      }

      const consentRecord: ConsentRecord = {
        id: this.generateConsentId(),
        userId,
        purposeId,
        purposeName: purpose.name,
        status: 'granted',
        grantedAt: new Date(),
        source: options?.source || 'manual',
        evidence: options?.evidence,
        expiresAt: options?.expiresAt || this.calculateExpirationDate(purpose),
        metadata: options?.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      // Store consent record
      await this.storeConsentRecord(consentRecord);
      
      // Update cache
      this.updateConsentCache(userId, consentRecord);

      console.log(`✅ Consent granted: User ${userId} -> Purpose ${purposeId}`);
    }
  }

  async revokeConsent(userId: string, purposes: string[], options?: {
    reason?: string;
    source?: string;
    metadata?: any;
  }): Promise<void> {
    this.validateInitialized();

    for (const purposeId of purposes) {
      const existingConsent = await this.getLatestConsentRecord(userId, purposeId);
      
      if (!existingConsent || existingConsent.status !== 'granted') {
        console.warn(`No active consent found for user ${userId} and purpose ${purposeId}`);
        continue;
      }

      const revokedRecord: ConsentRecord = {
        ...existingConsent,
        id: this.generateConsentId(),
        status: 'revoked',
        revokedAt: new Date(),
        revocationReason: options?.reason,
        source: options?.source || 'manual',
        metadata: { ...existingConsent.metadata, ...options?.metadata },
        updatedAt: new Date(),
        version: existingConsent.version + 1
      };

      // Store revocation record
      await this.storeConsentRecord(revokedRecord);
      
      // Update cache
      this.updateConsentCache(userId, revokedRecord);

      console.log(`🚫 Consent revoked: User ${userId} -> Purpose ${purposeId}`);
    }
  }

  async checkConsent(userId: string, purposeId: string): Promise<boolean> {
    this.validateInitialized();

    const consentRecord = await this.getLatestConsentRecord(userId, purposeId);
    
    if (!consentRecord) {
      // Return default consent status when no record exists
      return this.config.defaultConsent || false;
    }

    // Check if consent is granted and not expired
    if (consentRecord.status !== 'granted') {
      return false;
    }

    if (consentRecord.expiresAt && consentRecord.expiresAt < new Date()) {
      // Consent has expired - automatically revoke it
      await this.revokeConsent(userId, [purposeId], {
        reason: 'expired',
        source: 'automatic'
      });
      return false;
    }

    return true;
  }

  async getConsentStatus(userId: string, purposeId?: string): Promise<ConsentRecord[]> {
    this.validateInitialized();

    if (purposeId) {
      const record = await this.getLatestConsentRecord(userId, purposeId);
      return record ? [record] : [];
    }

    // Get all consent records for user
    const userConsents = this.consentCache.get(userId);
    if (!userConsents) {
      return [];
    }

    return Array.from(userConsents.values());
  }

  async getConsentHistory(userId: string, purposeId: string): Promise<ConsentRecord[]> {
    this.validateInitialized();

    if (!this.adapter) {
      throw new ConsentError('Storage adapter not available', 'ADAPTER_ERROR');
    }

    const filter: QueryFilter<ConsentRecord> = {
      where: {
        userId,
        purposeId
      },
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    };

    return await this.adapter.query<ConsentRecord>('consent_records', filter);
  }

  // Bulk operations
  async bulkGrantConsent(users: Array<{
    userId: string;
    purposes: string[];
    options?: any;
  }>): Promise<void> {
    this.validateInitialized();

    for (const user of users) {
      await this.grantConsent(user.userId, user.purposes, user.options);
    }
  }

  async bulkRevokeConsent(users: Array<{
    userId: string;
    purposes: string[];
    options?: any;
  }>): Promise<void> {
    this.validateInitialized();

    for (const user of users) {
      await this.revokeConsent(user.userId, user.purposes, user.options);
    }
  }

  // User data export for GDPR
  async exportUserConsents(userId: string): Promise<{
    userId: string;
    consents: ConsentRecord[];
    exportedAt: Date;
  }> {
    this.validateInitialized();

    const consents = await this.getConsentStatus(userId);
    
    return {
      userId,
      consents,
      exportedAt: new Date()
    };
  }

  // User data deletion for GDPR
  async deleteUserConsents(userId: string): Promise<void> {
    this.validateInitialized();

    if (!this.adapter) {
      throw new ConsentError('Storage adapter not available', 'ADAPTER_ERROR');
    }

    // Get all consent records for user
    const filter: QueryFilter<ConsentRecord> = {
      where: { userId }
    };

    const userConsents = await this.adapter.query<ConsentRecord>('consent_records', filter);

    // Delete all records
    for (const consent of userConsents) {
      await this.adapter.delete('consent_records', consent.id);
    }

    // Clear from cache
    this.consentCache.delete(userId);

    console.log(`🗑️ Deleted all consent records for user ${userId}`);
  }

  // Consent analytics and reporting
  async getConsentStatistics(): Promise<{
    totalUsers: number;
    totalConsents: number;
    consentsByPurpose: Record<string, number>;
    consentsByStatus: Record<string, number>;
    expiringConsents: number;
  }> {
    this.validateInitialized();

    if (!this.adapter) {
      throw new ConsentError('Storage adapter not available', 'ADAPTER_ERROR');
    }

    const allConsents = await this.adapter.query<ConsentRecord>('consent_records');
    const uniqueUsers = new Set(allConsents.map(c => c.userId));
    
    const consentsByPurpose: Record<string, number> = {};
    const consentsByStatus: Record<string, number> = {};
    let expiringConsents = 0;
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    for (const consent of allConsents) {
      // Count by purpose
      consentsByPurpose[consent.purposeId] = (consentsByPurpose[consent.purposeId] || 0) + 1;
      
      // Count by status
      consentsByStatus[consent.status] = (consentsByStatus[consent.status] || 0) + 1;
      
      // Count expiring consents
      if (consent.expiresAt && consent.expiresAt <= oneWeekFromNow && consent.status === 'granted') {
        expiringConsents++;
      }
    }

    return {
      totalUsers: uniqueUsers.size,
      totalConsents: allConsents.length,
      consentsByPurpose,
      consentsByStatus,
      expiringConsents
    };
  }

  async getExpiringConsents(daysAhead = 30): Promise<ConsentRecord[]> {
    this.validateInitialized();

    if (!this.adapter) {
      throw new ConsentError('Storage adapter not available', 'ADAPTER_ERROR');
    }

    const expirationDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    
    const filter: QueryFilter<ConsentRecord> = {
      where: {
        status: 'granted',
        expiresAt: { $lte: expirationDate }
      },
      orderBy: [{ field: 'expiresAt', direction: 'asc' }]
    };

    return await this.adapter.query<ConsentRecord>('consent_records', filter);
  }

  // Private implementation methods
  private async loadConsentRecords(): Promise<void> {
    if (!this.adapter) return;

    try {
      const allConsents = await this.adapter.query<ConsentRecord>('consent_records');
      
      // Group by user and purpose, keeping only latest
      const latestConsents: Record<string, Record<string, ConsentRecord>> = {};
      
      for (const consent of allConsents) {
        if (!latestConsents[consent.userId]) {
          latestConsents[consent.userId] = {};
        }
        
        const existing = latestConsents[consent.userId][consent.purposeId];
        if (!existing || consent.createdAt > existing.createdAt) {
          latestConsents[consent.userId][consent.purposeId] = consent;
        }
      }
      
      // Load into cache
      for (const [userId, purposes] of Object.entries(latestConsents)) {
        const userCache = new Map<string, ConsentRecord>();
        for (const [purposeId, consent] of Object.entries(purposes)) {
          userCache.set(purposeId, consent);
        }
        this.consentCache.set(userId, userCache);
      }
      
      console.log(`📋 Loaded ${allConsents.length} consent records for ${Object.keys(latestConsents).length} users`);
      
    } catch (error) {
      console.error('Failed to load consent records:', error);
      // Continue without cache - will work from storage
    }
  }

  private async storeConsentRecord(record: ConsentRecord): Promise<void> {
    if (!this.adapter) {
      throw new ConsentError('Storage adapter not available', 'ADAPTER_ERROR');
    }

    await this.adapter.create('consent_records', record);
  }

  private async getLatestConsentRecord(userId: string, purposeId: string): Promise<ConsentRecord | null> {
    // Check cache first
    const userCache = this.consentCache.get(userId);
    if (userCache?.has(purposeId)) {
      return userCache.get(purposeId)!;
    }

    // Fall back to storage
    if (!this.adapter) {
      return null;
    }

    const filter: QueryFilter<ConsentRecord> = {
      where: { userId, purposeId },
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 1
    };

    const results = await this.adapter.query<ConsentRecord>('consent_records', filter);
    return results.length > 0 ? results[0] : null;
  }

  private updateConsentCache(userId: string, record: ConsentRecord): void {
    if (!this.consentCache.has(userId)) {
      this.consentCache.set(userId, new Map());
    }
    
    const userCache = this.consentCache.get(userId)!;
    userCache.set(record.purposeId, record);
  }

  private getPurpose(purposeId: string): ConsentPurpose | undefined {
    return this.config.purposes.find(p => p.id === purposeId);
  }

  private calculateExpirationDate(purpose: ConsentPurpose): Date | undefined {
    if (!purpose.retention?.maxDuration) {
      return undefined;
    }

    const now = new Date();
    const duration = purpose.retention.maxDuration;
    
    // Parse duration (e.g., '1 year', '6 months', '30 days')
    const match = duration.match(/(\d+)\s*(year|month|day)s?/);
    if (!match) {
      console.warn(`Invalid duration format: ${duration}`);
      return undefined;
    }

    const amount = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'year':
        return new Date(now.getFullYear() + amount, now.getMonth(), now.getDate());
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() + amount, now.getDate());
      case 'day':
        return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
      default:
        return undefined;
    }
  }

  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private expirationCheckInterval?: NodeJS.Timeout;

  private setupExpirationChecking(): void {
    // Wait for adapter to be ready before starting expiration checks
    // Check for expired consents every hour, but wait 30 seconds for initial startup
    setTimeout(() => {
      this.expirationCheckInterval = setInterval(async () => {
        try {
          await this.checkExpiredConsents();
        } catch (error) {
          // Only log actual errors, not connection timing issues
          if (!(error as Error).message.includes('not connected')) {
            console.error('Error checking expired consents:', error);
          }
        }
      }, 60 * 60 * 1000); // Check every hour
      
      // Also run an initial check after startup delay
      this.checkExpiredConsents().catch(error => {
        // Silently handle all connection-related errors
        const errorMessage = (error as Error).message;
        if (!errorMessage.includes('not connected') && !errorMessage.includes('Storage adapter')) {
          console.error('Initial expired consent check failed:', error);
        }
      });
    }, 30000); // Wait 30 seconds for adapter to be ready
  }

  private async checkExpiredConsents(): Promise<void> {
    if (!this.adapter) {
      return; // Silent skip when no adapter
    }
    
    // Check if adapter is connected before attempting to query
    try {
      if (!(this.adapter as any).connected) {
        return; // Silent skip when not connected
      }
    } catch (error) {
      return; // Silent skip when connection status unknown
    }

    try {
      const now = new Date();
      const filter: QueryFilter<ConsentRecord> = {
        where: {
          status: 'granted',
          expiresAt: { $lt: now }
        }
      };

      const expiredConsents = await this.adapter.query<ConsentRecord>('consent_records', filter);
      
      for (const consent of expiredConsents) {
        await this.revokeConsent(consent.userId, [consent.purposeId], {
          reason: 'expired',
          source: 'automatic'
        });
      }

      if (expiredConsents.length > 0) {
        console.log(`⏰ Automatically revoked ${expiredConsents.length} expired consents`);
      }
    } catch (error) {
      // Only log non-connection errors to avoid spam
      const errorMessage = (error as Error).message;
      if (!errorMessage.includes('not connected') && !errorMessage.includes('Storage adapter')) {
        console.log('⏸️ Failed to check expired consents:', errorMessage);
      }
    }
  }

  private validateConfig(config: ConsentConfig): ConsentConfig {
    if (!config) {
      throw new ConsentError('Consent configuration is required', 'CONFIG_ERROR');
    }

    if (!config.purposes || config.purposes.length === 0) {
      throw new ConsentError('At least one consent purpose must be defined', 'CONFIG_ERROR');
    }

    // Validate purpose definitions
    for (const purpose of config.purposes) {
      if (!purpose.id || !purpose.name) {
        throw new ConsentError(
          'Consent purpose must have id and name',
          'CONFIG_ERROR',
          { purpose }
        );
      }
    }

    return {
      ...config,
      defaultRetention: config.defaultRetention || '1 year',
      auditEnabled: config.auditEnabled !== false
    };
  }

  private sanitizeConfig(): any {
    return {
      purposes: this.config.purposes.map(p => ({ id: p.id, name: p.name })),
      defaultRetention: this.config.defaultRetention,
      auditEnabled: this.config.auditEnabled
    };
  }

  private validateInitialized(): void {
    if (!this.isInitialized) {
      throw new ConsentError('ConsentManager not initialized', 'NOT_INITIALIZED');
    }
  }

  // Public API
  isEnabled(): boolean {
    return this.config.purposes.length > 0;
  }

  getConfiguration(): Partial<ConsentConfig> {
    return {
      purposes: this.config.purposes.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        required: p.required
      })),
      defaultRetention: this.config.defaultRetention,
      auditEnabled: this.config.auditEnabled
    };
  }

  getPurposes(): ConsentPurpose[] {
    return this.config.purposes;
  }

  async validateConsents(userId: string, requiredPurposes: string[]): Promise<{
    valid: boolean;
    missing: string[];
    expired: string[];
  }> {
    const missing: string[] = [];
    const expired: string[] = [];

    for (const purposeId of requiredPurposes) {
      const hasConsent = await this.checkConsent(userId, purposeId);
      if (!hasConsent) {
        const record = await this.getLatestConsentRecord(userId, purposeId);
        if (!record) {
          missing.push(purposeId);
        } else if (record.expiresAt && record.expiresAt < new Date()) {
          expired.push(purposeId);
        } else {
          missing.push(purposeId);
        }
      }
    }

    return {
      valid: missing.length === 0 && expired.length === 0,
      missing,
      expired
    };
  }

  /**
   * Manually trigger expiration checking (useful for testing or immediate checks)
   */
  async checkForExpiredConsents(): Promise<void> {
    await this.checkExpiredConsents();
  }

  /**
   * Check if expiration monitoring is active
   */
  isExpirationMonitoringActive(): boolean {
    return !!this.expirationCheckInterval;
  }

  cleanup(): void {
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
      this.expirationCheckInterval = undefined;
      console.log('🧹 ConsentManager cleanup: Cleared expiration check interval');
    }
  }
}