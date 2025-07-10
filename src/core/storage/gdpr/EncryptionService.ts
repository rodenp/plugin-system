// GDPR Encryption Service - Field-level AES-256-GCM encryption
// Provides transparent encryption/decryption for sensitive data fields

import { EncryptionConfig, EncryptedData, EncryptionError } from './types';

export interface EncryptionResult {
  algorithm: string;
  iv: string;
  ciphertext: string;
  tag?: string;
  keyId: string;
}

export class EncryptionService {
  private config: EncryptionConfig;
  private masterKey?: CryptoKey;
  private keyCache = new Map<string, CryptoKey>();

  constructor(config: EncryptionConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('🔓 Encryption disabled in configuration');
      return;
    }

    try {
      // Generate or derive master key
      this.masterKey = await this.generateMasterKey();
      console.log('🔒 Encryption service initialized with AES-256-GCM');
    } catch (error) {
      throw new EncryptionError(`Failed to initialize encryption: ${error.message}`);
    }
  }

  /**
   * Encrypt a field value
   */
  async encryptField(fieldName: string, value: any): Promise<string> {
    if (!this.config.enabled || value === null || value === undefined) {
      return value;
    }

    try {
      const plaintext = typeof value === 'string' ? value : JSON.stringify(value);
      const result = await this.encrypt(plaintext, fieldName);
      return JSON.stringify(result);
    } catch (error) {
      throw new EncryptionError(`Failed to encrypt field ${fieldName}: ${error.message}`);
    }
  }

  /**
   * Decrypt a field value
   */
  async decryptField(fieldName: string, encryptedValue: string): Promise<any> {
    if (!this.config.enabled || !encryptedValue) {
      return encryptedValue;
    }

    try {
      const encryptedData: EncryptionResult = JSON.parse(encryptedValue);
      const decrypted = await this.decrypt(encryptedData, fieldName);
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      throw new EncryptionError(`Failed to decrypt field ${fieldName}: ${error.message}`);
    }
  }

  /**
   * Encrypt an entire entity with field-level encryption
   */
  async encryptEntity(table: string, entity: any, encryptedFields: string[]): Promise<any> {
    if (!this.config.enabled || !encryptedFields.length) {
      return entity;
    }

    const encrypted = { ...entity };
    
    for (const field of encryptedFields) {
      if (entity[field] !== undefined) {
        encrypted[field] = await this.encryptField(`${table}.${field}`, entity[field]);
      }
    }

    // Add encryption metadata
    encrypted._encryption = {
      version: 1,
      algorithm: this.config.algorithm,
      encryptedFields: encryptedFields.filter(field => entity[field] !== undefined),
      timestamp: new Date().toISOString()
    };

    return encrypted;
  }

  /**
   * Decrypt an entire entity
   */
  async decryptEntity(table: string, entity: any): Promise<any> {
    if (!this.config.enabled || !entity._encryption?.encryptedFields?.length) {
      return entity;
    }

    const decrypted = { ...entity };
    
    for (const field of entity._encryption.encryptedFields) {
      if (entity[field] !== undefined) {
        decrypted[field] = await this.decryptField(`${table}.${field}`, entity[field]);
      }
    }

    // Remove encryption metadata from user-facing data
    delete decrypted._encryption;

    return decrypted;
  }

  /**
   * Check if a field should be encrypted based on configuration
   */
  shouldEncryptField(table: string, field: string): boolean {
    if (!this.config.enabled) return false;
    
    // Add logic here to check data element registry for encryption requirements
    // For now, return true for fields that commonly contain PII
    const sensitiveFields = ['email', 'name', 'phone', 'address', 'ssn', 'password', 'preferences'];
    return sensitiveFields.some(sensitive => field.toLowerCase().includes(sensitive));
  }

  /**
   * Generate encryption key for specific context
   */
  async deriveKey(context: string): Promise<CryptoKey> {
    if (this.keyCache.has(context)) {
      return this.keyCache.get(context)!;
    }

    if (!this.masterKey) {
      throw new EncryptionError('Master key not initialized');
    }

    try {
      // Derive key using PBKDF2 with context as salt
      const encoder = new TextEncoder();
      const salt = encoder.encode(context.padEnd(16, '0').slice(0, 16));

      const derivedKeyMaterial = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        this.masterKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      this.keyCache.set(context, derivedKeyMaterial);
      return derivedKeyMaterial;
    } catch (error) {
      throw new EncryptionError(`Failed to derive key for context ${context}: ${error.message}`);
    }
  }

  /**
   * Rotate encryption keys (for future implementation)
   */
  async rotateKeys(): Promise<void> {
    console.log('🔄 Key rotation not yet implemented');
    // TODO: Implement key rotation
  }

  /**
   * Get encryption statistics
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      algorithm: this.config.algorithm,
      keyDerivation: this.config.keyDerivation,
      cachedKeys: this.keyCache.size,
      initialized: !!this.masterKey
    };
  }

  // Private methods

  private async generateMasterKey(): Promise<CryptoKey> {
    // Generate a random master key for this session
    // In production, this would be derived from a secure source
    const keyMaterial = crypto.getRandomValues(new Uint8Array(32));
    return await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
  }

  private async encrypt(plaintext: string, context: string): Promise<EncryptionResult> {
    const key = await this.deriveKey(context);
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    return {
      algorithm: 'AES-256-GCM',
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      ciphertext: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join(''),
      keyId: context
    };
  }

  private async decrypt(encryptedData: EncryptionResult, context: string): Promise<string> {
    const key = await this.deriveKey(context);

    // Convert hex strings back to Uint8Array
    const iv = new Uint8Array(encryptedData.iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(encryptedData.ciphertext.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}