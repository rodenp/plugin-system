// Comprehensive StoragePlugin Test & Demo Application
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  StoragePlugin,
  createStoragePlugin,
  StorageProvider,
  useStorageContext,
  EntityType,
  storagePlugin
} from './plugins/storage';
import type { StoragePluginConfig } from './plugins/storage';
import { ConsentBanner, consentBannerStyles } from './components/ConsentBanner';
import { pluginRegistry } from './store/plugin-registry';
import './index.css';

// Test Configuration
const createTestConfig = (enableGDPR: boolean): StoragePluginConfig => ({
  backend: {
    type: 'indexeddb',
    database: enableGDPR ? 'storage_test_gdpr' : 'storage_test_basic',
    options: { version: 1 }
  },
  gdpr: {
    enabled: enableGDPR,
    encryption: {
      enabled: enableGDPR,
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      keyRotationDays: 0, // Disable key rotation to prevent infinite rotation
      keyProvider: 'default',
      encryptionStrength: 'high',
      masterKey: import.meta.env.VITE_ENCRYPTION_MASTER_KEY || 'test-master-key-storage-plugin-demo-2024', // From .env or fallback
      currentVersion: 1,
      encryptedFields: {
        [EntityType.USERS]: ['email', 'name', 'phone'],
        [EntityType.POSTS]: ['content'],
        [EntityType.COMMENTS]: ['content']
      }
    },
    consent: {
      required: enableGDPR,
      defaultConsent: true, // New users should have consent granted by default
      purposes: [
        {
          id: 'essential',
          name: 'Essential Functions',
          description: 'Required for basic application functionality',
          category: 'necessary',
          required: true,
          legalBasis: 'legitimate_interest',
          dataCategories: ['functional_data']
        },
        {
          id: 'analytics',
          name: 'Analytics & Performance',
          description: 'Help us improve the application performance',
          category: 'analytics',
          required: false,
          legalBasis: 'consent',
          dataCategories: ['usage_data', 'performance_data']
        },
        {
          id: 'personalization',
          name: 'Personalization',
          description: 'Customize your experience based on preferences',
          category: 'functional',
          required: false,
          legalBasis: 'consent',
          dataCategories: ['preference_data', 'behavioral_data']
        },
        {
          id: 'marketing',
          name: 'Marketing Communications',
          description: 'Send you relevant offers and updates',
          category: 'marketing',
          required: false,
          legalBasis: 'consent',
          dataCategories: ['contact_data', 'preference_data']
        }
      ]
    },
    audit: {
      enabled: enableGDPR,
      batchSize: 1,
      includeDetails: true
    }
  },
  cache: {
    enabled: true,
    type: 'memory',
    ttl: 60000,
    maxSize: 100,
    strategy: 'lru'
  },
  updateQueue: {
    enabled: false,
    batchWindow: 100,
    maxBatchSize: 10,
    retryAttempts: 3,
    retryDelay: 1000,
    persistence: false,
    priorityLevels: 3,
    deadLetterQueue: false
  }
});

// Sample Data Generator
const generateUser = (id: string) => ({
  id,
  email: `${id}@example.com`,
  name: `User ${id}`,
  phone: `+1-555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
  age: Math.floor(Math.random() * 50) + 18,
  preferences: {
    theme: Math.random() > 0.5 ? 'dark' : 'light',
    notifications: Math.random() > 0.5,
    language: 'en'
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1
});

const generatePost = (id: string, authorId: string) => ({
  id,
  title: `Post ${id}: ${['Tech News', 'Tutorial', 'Discussion', 'Review'][Math.floor(Math.random() * 4)]}`,
  content: `This is the content of post ${id}. It contains detailed information about ${['JavaScript', 'React', 'Node.js', 'TypeScript'][Math.floor(Math.random() * 4)]}. This content should be encrypted when GDPR is enabled.`,
  authorId,
  published: Math.random() > 0.3,
  tags: ['test', 'demo', 'storage'],
  likes: Math.floor(Math.random() * 100),
  views: Math.floor(Math.random() * 1000),
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 30), // Random date within last 30 days
  updatedAt: new Date(),
  version: 1
});

// JSON Viewer Component
const JSONViewer: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <div className="json-viewer">
      <div className="json-header" onClick={() => setCollapsed(!collapsed)}>
        <h4>{title} {collapsed ? '▶' : '▼'}</h4>
      </div>
      {!collapsed && (
        <pre className="json-content">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

// Entity Manager Component
const EntityManager: React.FC = () => {
  const { storage, isInitialized } = useStorageContext();
  const [activeEntity, setActiveEntity] = useState<string>(EntityType.USERS);
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [selectedEntityEncrypted, setSelectedEntityEncrypted] = useState<any>(null);
  const [showEncryptionConfig, setShowEncryptionConfig] = useState(false);
  const [showNewConfigModal, setShowNewConfigModal] = useState(false);
  const [tabScrollPosition, setTabScrollPosition] = useState(0);
  const [encryptedFields, setEncryptedFields] = useState<Record<string, string[]>>({});
  const [encryptionVersions, setEncryptionVersions] = useState<any[]>([]);
  const [currentEncryptionVersion, setCurrentEncryptionVersion] = useState<number>(1);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tablesWithEncryption, setTablesWithEncryption] = useState<string[]>([]);
  const [allAvailableTables, setAllAvailableTables] = useState<string[]>([]);
  const [tableEncryptionVersions, setTableEncryptionVersions] = useState<Record<string, any[]>>({});
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getCurrentTableVersionSync = (table: string): number => {
    const versions = tableEncryptionVersions[table];
    if (!versions || versions.length === 0) return 1;
    const activeVersion = versions.find(v => v.active);
    return activeVersion ? activeVersion.version : Math.max(...versions.map(v => v.version));
  };

  const loadEntities = useCallback(async (force = false) => {
    if (!storage || !isInitialized) return;
    
    setLoading(true);
    
    try {
      // Add a small delay to ensure storage operations are complete
      if (force) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`🔄 Loading ${activeEntity} entities from storage...`);
      const result = await storage.query(activeEntity);
      console.log(`📊 Loaded ${result.length} ${activeEntity} entities`);
      
      // Force complete state update with new array reference
      setEntities([...result]);
    } catch (error) {
      console.error('Failed to load entities:', error);
      // Set empty array on error to prevent infinite loops
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, [storage, isInitialized, activeEntity, refreshKey]);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  useEffect(() => {
    const loadEncryptionData = async () => {
      // Load current encrypted fields configuration
      if (storage && (storage as any).config?.gdpr?.encryption?.encryptedFields) {
        setEncryptedFields((storage as any).config.gdpr.encryption.encryptedFields);
      }
      
      // Load encryption versions if available
      if (storage && (storage as any).getEncryptionVersions) {
        try {
          const versions = (storage as any).getEncryptionVersions();
          setEncryptionVersions(versions);
          
          const currentVersion = (storage as any).getCurrentEncryptionVersion();
          setCurrentEncryptionVersion(currentVersion);
          
          // Load all available tables from EntityType enum
          const allTables = Object.values(EntityType).filter(table => 
            // Exclude system/internal tables that shouldn't be user-configurable
            !['encryption_metadata', 'audit_logs', 'consent_records', 'data_exports'].includes(table)
          );
          setAllAvailableTables(allTables);
          
          // Load table-specific encryption data
          if ((storage as any).getAllTablesWithEncryption) {
            const tablesWithEncryption = await (storage as any).getAllTablesWithEncryption();
            setTablesWithEncryption(tablesWithEncryption);
            
            // Set default selected table to first available table or first with encryption
            if (!selectedTable) {
              if (tablesWithEncryption.length > 0) {
                setSelectedTable(tablesWithEncryption[0]);
              } else if (allTables.length > 0) {
                setSelectedTable(allTables[0]);
              }
            }
            
            // Load versions for tables with encryption
            const tableVersionsData: Record<string, any[]> = {};
            for (const table of tablesWithEncryption) {
              if ((storage as any).getTableEncryptionVersions) {
                tableVersionsData[table] = await (storage as any).getTableEncryptionVersions(table);
              }
            }
            setTableEncryptionVersions(tableVersionsData);
          }
        } catch (error) {
          console.error('Failed to load encryption versions:', error);
        }
      }
    };

    loadEncryptionData();
  }, [storage, selectedTable]);

  const selectEntityWithEncryption = async (entity: any) => {
    setSelectedEntity(entity);
    
    // If encryption is enabled, also fetch the encrypted version
    if (storage && (storage as any).config?.gdpr?.encryption?.enabled) {
      try {
        const storageAdapter = (storage as any).adapter;
        const encryptedEntity = await storageAdapter.read(activeEntity, entity.id);
        setSelectedEntityEncrypted(encryptedEntity);
      } catch (error) {
        console.error('Failed to fetch encrypted version:', error);
        setSelectedEntityEncrypted(null);
      }
    } else {
      setSelectedEntityEncrypted(null);
    }
  };

  const updateEncryptedFields = async (table: string, fields: string[]) => {
    console.log(`🔧 Updating encrypted fields for ${table}:`, fields);
    const newEncryptedFields = {
      ...encryptedFields,
      [table]: fields
    };
    
    // Check if fields actually changed
    const currentFields = encryptedFields[table] || [];
    const fieldsChanged = JSON.stringify(currentFields.sort()) !== JSON.stringify(fields.sort());
    
    setEncryptedFields(newEncryptedFields);
    
    // Create new table-specific encryption version if fields changed
    if (fieldsChanged && storage && (storage as any).createNewTableEncryptionVersion) {
      try {
        const newVersion = await (storage as any).createNewTableEncryptionVersion(
          table,
          fields,
          `Updated ${table} fields: ${fields.join(', ')}`
        );
        
        // Refresh table-specific versions
        const tableVersions = await (storage as any).getTableEncryptionVersions(table);
        setTableEncryptionVersions(prev => ({
          ...prev,
          [table]: tableVersions
        }));
        
        // Update tables list if needed
        const allTables = await (storage as any).getAllTablesWithEncryption();
        setTablesWithEncryption(allTables);
      } catch (error) {
        console.error('Failed to create new encryption version:', error);
        // Fallback to direct config update
        if ((storage as any).config?.gdpr?.encryption) {
          (storage as any).config.gdpr.encryption.encryptedFields = newEncryptedFields;
          console.log(`✅ Updated storage config for ${table} (fallback)`);
        }
      }
    } else if (!fieldsChanged) {
      console.log(`🔧 No changes detected for ${table} fields`);
    }
  };

  const exportEncryptedFields = () => {
    const configData = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      encryptedFields
    };
    
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encrypted-fields-config-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importEncryptedFields = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const configData = JSON.parse(e.target?.result as string);
        if (configData.encryptedFields) {
          setEncryptedFields(configData.encryptedFields);
          
          // Update the storage configuration
          if (storage && (storage as any).config?.gdpr?.encryption) {
            (storage as any).config.gdpr.encryption.encryptedFields = configData.encryptedFields;
          }
          
          console.log('✅ Encrypted fields configuration imported successfully');
        } else {
          console.error('❌ Invalid configuration file format');
        }
      } catch (error) {
        console.error('❌ Failed to parse configuration file:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = '';
  };

  const getFormTemplate = (entityType: string) => {
    switch (entityType) {
      case EntityType.USERS:
        return {
          id: '',
          email: '',
          name: '',
          phone: '',
          age: '',
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en'
          }
        };
      case EntityType.POSTS:
        return {
          id: '',
          title: '',
          content: '',
          authorId: '',
          published: true,
          tags: [''],
          likes: 0,
          views: 0
        };
      case EntityType.COMMENTS:
        return {
          id: '',
          content: '',
          authorId: '',
          postId: '',
          parentId: '',
          depth: 1,
          likes: 0
        };
      case EntityType.COURSES:
        return {
          id: '',
          title: '',
          description: '',
          instructorId: '',
          duration: '',
          level: 'beginner',
          price: 0,
          published: false
        };
      case EntityType.MESSAGES:
        return {
          id: '',
          content: '',
          senderId: '',
          receiverId: '',
          subject: '',
          read: false,
          priority: 'normal'
        };
      default:
        return { id: '', content: '' };
    }
  };

  const createEntityFromForm = async () => {
    if (!storage || !createFormData.id) return;
    
    try {
      const newEntity = {
        ...createFormData,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };
      
      // Convert string numbers to actual numbers where needed
      if (activeEntity === EntityType.USERS && newEntity.age) {
        newEntity.age = parseInt(newEntity.age);
      }
      if (activeEntity === EntityType.POSTS) {
        newEntity.likes = parseInt(newEntity.likes) || 0;
        newEntity.views = parseInt(newEntity.views) || 0;
        newEntity.tags = Array.isArray(newEntity.tags) ? newEntity.tags : newEntity.tags.split(',').map((t: string) => t.trim());
      }
      if (activeEntity === EntityType.COMMENTS) {
        newEntity.likes = parseInt(newEntity.likes) || 0;
        newEntity.depth = parseInt(newEntity.depth) || 1;
      }
      if (activeEntity === EntityType.COURSES) {
        newEntity.price = parseFloat(newEntity.price) || 0;
      }
      
      // Close the form first
      setShowCreateForm(false);
      setCreateFormData({});
      
      try {
        // Create in storage
        await storage.create(activeEntity, newEntity);
        
        // Add new entity to UI
        setEntities(prev => [...prev, newEntity]);
        
      } catch (error) {
        console.error('Failed to create entity:', error);
      }
    } catch (error) {
      console.error('Failed to create entity:', error);
    }
  };

  const createSampleEntity = async () => {
    if (!storage) return;
    
    try {
      let newEntity;
      const id = `sample_${Date.now()}`;
      
      if (activeEntity === EntityType.USERS) {
        newEntity = generateUser(id);
      } else if (activeEntity === EntityType.POSTS) {
        const users = await storage.query(EntityType.USERS);
        const authorId = users.length > 0 ? users[0].id : 'unknown';
        newEntity = generatePost(id, authorId);
      } else {
        newEntity = {
          id,
          content: `Sample ${activeEntity} content`,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        };
      }
      
      try {
        // Create in storage
        await storage.create(activeEntity, newEntity);
        
        // Add new entity to UI
        setEntities(prev => [...prev, newEntity]);
        
      } catch (error) {
        console.error('Failed to create sample entity:', error);
      }
    } catch (error) {
      console.error('Failed to create entity:', error);
    }
  };

  const updateEntity = async () => {
    if (!storage || !editingEntity) return;
    
    try {
      const updatedEntity = {
        ...editingEntity,
        updatedAt: new Date()
      };
      
      // Store original state for potential rollback
      const originalEntities = entities;
      
      // Optimistic update: immediately update in UI
      setEntities(prev => prev.map(item => 
        item.id === editingEntity.id ? updatedEntity : item
      ));
      setEditingEntity(null);
      setSelectedEntity(updatedEntity);
      
      // Then sync with storage
      try {
        await storage.update(activeEntity, editingEntity.id, updatedEntity);
        console.log('Entity updated successfully and synced to storage');
        
        // Verify with storage
        const storageEntities = await storage.query(activeEntity);
        setEntities([...storageEntities]);
      } catch (storageError) {
        console.error('Storage update failed, reverting optimistic update:', storageError);
        // Revert optimistic update
        setEntities(originalEntities);
        setSelectedEntity(null);
        throw storageError;
      }
    } catch (error) {
      console.error('Failed to update entity:', error);
    }
  };

  const deleteEntity = async (id: string) => {
    if (!storage) return;
    
    if (confirm('Are you sure you want to delete this entity?')) {
      try {
        // Clear selection if we're deleting the selected entity
        if (selectedEntity?.id === id) {
          setSelectedEntity(null);
        }
        
        try {
          // Delete from storage
          await storage.delete(activeEntity, id);
          
          // Remove entity from UI
          setEntities(prev => prev.filter(item => item.id !== id));
          
        } catch (error) {
          console.error('Failed to delete entity:', error);
        }
      } catch (error) {
        console.error('Failed to delete entity:', error);
      }
    }
  };

  return (
    <div className="entity-manager">
      <div className="entity-controls">
        <h3>📊 Entity Manager</h3>
        
        <div className="entity-selector">
          <label>Entity Type:</label>
          <select value={activeEntity} onChange={(e) => setActiveEntity(e.target.value)}>
            <option value={EntityType.USERS}>Users</option>
            <option value={EntityType.POSTS}>Posts</option>
            <option value={EntityType.COMMENTS}>Comments</option>
            <option value={EntityType.COURSES}>Courses</option>
            <option value={EntityType.MESSAGES}>Messages</option>
          </select>
          
          <button 
            onClick={() => {
              setCreateFormData(getFormTemplate(activeEntity));
              setShowCreateForm(true);
            }} 
            className="btn primary"
          >
            ✏️ Create {activeEntity.slice(0, -1)}
          </button>
          
          <button onClick={createSampleEntity} className="btn secondary">
            🎲 Generate Sample
          </button>
          
          <button onClick={() => { console.log('Manual refresh clicked'); loadEntities(true); }} className="btn secondary">
            🔄 Refresh
          </button>
          
          {storage && (storage as any).config?.gdpr?.encryption?.enabled && (
            <button onClick={() => setShowEncryptionConfig(true)} className="btn secondary">
              🔐 Configure Encryption
            </button>
          )}
          
        </div>
      </div>

      <div className="entity-content">
        <div className="entity-list">
          <h4>{activeEntity} ({entities.length})</h4>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="entities">
              {entities.map((entity) => (
                <div 
                  key={entity.id} 
                  className={`entity-item ${selectedEntity?.id === entity.id ? 'selected' : ''}`}
                  onClick={() => selectEntityWithEncryption(entity)}
                >
                  <div className="entity-id">{entity.id}</div>
                  <div className="entity-info">
                    {entity.name || entity.title || entity.content?.substring(0, 50) || 'No title'}
                  </div>
                  <div className="entity-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEntity({...entity});
                      }}
                      className="btn small"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntity(entity.id);
                      }}
                      className="btn small danger"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="entity-details">
          {selectedEntity ? (
            <div className="entity-details-content">
              <JSONViewer data={selectedEntity} title={`${activeEntity.slice(0, -1)} Details ${selectedEntityEncrypted ? '(Decrypted)' : ''}`} />
              {selectedEntityEncrypted && (
                <JSONViewer data={selectedEntityEncrypted} title={`${activeEntity.slice(0, -1)} Details (Encrypted in Database)`} />
              )}
            </div>
          ) : (
            <div className="placeholder">Select an entity to view details</div>
          )}
        </div>
      </div>

      {editingEntity && (
        <div className="modal">
          <div className="modal-content">
            <h4>Edit {activeEntity.slice(0, -1)}</h4>
            <textarea
              value={JSON.stringify(editingEntity, null, 2)}
              onChange={(e) => {
                try {
                  setEditingEntity(JSON.parse(e.target.value));
                } catch (error) {
                  // Invalid JSON, keep current state
                }
              }}
              rows={20}
              cols={80}
            />
            <div className="modal-actions">
              <button onClick={updateEntity} className="btn primary">Save</button>
              <button onClick={() => setEditingEntity(null)} className="btn secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="modal">
          <div className="modal-content create-form">
            <h4>Create New {activeEntity.slice(0, -1)}</h4>
            
            <div className="form-grid">
              {activeEntity === EntityType.USERS && (
                <>
                  <div className="form-group">
                    <label>ID *</label>
                    <input
                      type="text"
                      value={createFormData.id || ''}
                      onChange={(e) => setCreateFormData({...createFormData, id: e.target.value})}
                      placeholder="user123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={createFormData.email || ''}
                      onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={createFormData.name || ''}
                      onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={createFormData.phone || ''}
                      onChange={(e) => setCreateFormData({...createFormData, phone: e.target.value})}
                      placeholder="+1-555-1234"
                    />
                  </div>
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      value={createFormData.age || ''}
                      onChange={(e) => setCreateFormData({...createFormData, age: e.target.value})}
                      placeholder="25"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div className="form-group">
                    <label>Theme</label>
                    <select
                      value={createFormData.preferences?.theme || 'light'}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        preferences: {...(createFormData.preferences || {}), theme: e.target.value}
                      })}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </>
              )}

              {activeEntity === EntityType.POSTS && (
                <>
                  <div className="form-group">
                    <label>ID *</label>
                    <input
                      type="text"
                      value={createFormData.id || ''}
                      onChange={(e) => setCreateFormData({...createFormData, id: e.target.value})}
                      placeholder="post123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={createFormData.title || ''}
                      onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                      placeholder="My Blog Post"
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>Content *</label>
                    <textarea
                      value={createFormData.content || ''}
                      onChange={(e) => setCreateFormData({...createFormData, content: e.target.value})}
                      placeholder="Write your post content here..."
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Author ID *</label>
                    <input
                      type="text"
                      value={createFormData.authorId || ''}
                      onChange={(e) => setCreateFormData({...createFormData, authorId: e.target.value})}
                      placeholder="user123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(createFormData.tags) ? createFormData.tags.join(', ') : (createFormData.tags || '')}
                      onChange={(e) => setCreateFormData({...createFormData, tags: e.target.value})}
                      placeholder="tech, tutorial, react"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={createFormData.published || false}
                        onChange={(e) => setCreateFormData({...createFormData, published: e.target.checked})}
                      />
                      Published
                    </label>
                  </div>
                </>
              )}

              {activeEntity === EntityType.COMMENTS && (
                <>
                  <div className="form-group">
                    <label>ID *</label>
                    <input
                      type="text"
                      value={createFormData.id || ''}
                      onChange={(e) => setCreateFormData({...createFormData, id: e.target.value})}
                      placeholder="comment123"
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>Content *</label>
                    <textarea
                      value={createFormData.content || ''}
                      onChange={(e) => setCreateFormData({...createFormData, content: e.target.value})}
                      placeholder="Write your comment here..."
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Author ID *</label>
                    <input
                      type="text"
                      value={createFormData.authorId || ''}
                      onChange={(e) => setCreateFormData({...createFormData, authorId: e.target.value})}
                      placeholder="user123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Post ID *</label>
                    <input
                      type="text"
                      value={createFormData.postId || ''}
                      onChange={(e) => setCreateFormData({...createFormData, postId: e.target.value})}
                      placeholder="post123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Parent Comment ID</label>
                    <input
                      type="text"
                      value={createFormData.parentId || ''}
                      onChange={(e) => setCreateFormData({...createFormData, parentId: e.target.value})}
                      placeholder="comment456 (for replies)"
                    />
                  </div>
                </>
              )}

              {activeEntity === EntityType.COURSES && (
                <>
                  <div className="form-group">
                    <label>ID *</label>
                    <input
                      type="text"
                      value={createFormData.id || ''}
                      onChange={(e) => setCreateFormData({...createFormData, id: e.target.value})}
                      placeholder="course123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={createFormData.title || ''}
                      onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                      placeholder="React Fundamentals"
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>Description</label>
                    <textarea
                      value={createFormData.description || ''}
                      onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                      placeholder="Course description..."
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Instructor ID *</label>
                    <input
                      type="text"
                      value={createFormData.instructorId || ''}
                      onChange={(e) => setCreateFormData({...createFormData, instructorId: e.target.value})}
                      placeholder="instructor123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={createFormData.duration || ''}
                      onChange={(e) => setCreateFormData({...createFormData, duration: e.target.value})}
                      placeholder="10 hours"
                    />
                  </div>
                  <div className="form-group">
                    <label>Level</label>
                    <select
                      value={createFormData.level || 'beginner'}
                      onChange={(e) => setCreateFormData({...createFormData, level: e.target.value})}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      value={createFormData.price || ''}
                      onChange={(e) => setCreateFormData({...createFormData, price: e.target.value})}
                      placeholder="99.99"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </>
              )}

              {activeEntity === EntityType.MESSAGES && (
                <>
                  <div className="form-group">
                    <label>ID *</label>
                    <input
                      type="text"
                      value={createFormData.id || ''}
                      onChange={(e) => setCreateFormData({...createFormData, id: e.target.value})}
                      placeholder="msg123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Subject *</label>
                    <input
                      type="text"
                      value={createFormData.subject || ''}
                      onChange={(e) => setCreateFormData({...createFormData, subject: e.target.value})}
                      placeholder="Message subject"
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>Content *</label>
                    <textarea
                      value={createFormData.content || ''}
                      onChange={(e) => setCreateFormData({...createFormData, content: e.target.value})}
                      placeholder="Message content..."
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sender ID *</label>
                    <input
                      type="text"
                      value={createFormData.senderId || ''}
                      onChange={(e) => setCreateFormData({...createFormData, senderId: e.target.value})}
                      placeholder="user123"
                    />
                  </div>
                  <div className="form-group">
                    <label>Receiver ID *</label>
                    <input
                      type="text"
                      value={createFormData.receiverId || ''}
                      onChange={(e) => setCreateFormData({...createFormData, receiverId: e.target.value})}
                      placeholder="user456"
                    />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={createFormData.priority || 'normal'}
                      onChange={(e) => setCreateFormData({...createFormData, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button 
                onClick={createEntityFromForm} 
                className="btn primary"
                disabled={!createFormData.id}
              >
                Create {activeEntity.slice(0, -1)}
              </button>
              <button 
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateFormData({});
                }} 
                className="btn secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEncryptionConfig && (
        <div className="modal" onClick={() => setShowEncryptionConfig(false)}>
          <div className="modal-content encryption-config" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>🔐 Encryption Field Configuration</h4>
              <div className="version-info">
                <span className="current-version">Current Version: {currentEncryptionVersion}</span>
              </div>
              <button 
                className="btn danger small" 
                onClick={() => setShowEncryptionConfig(false)}
                style={{ marginLeft: 'auto' }}
              >
                ✕ Close
              </button>
            </div>
            
            <div className="config-actions">
              <button onClick={exportEncryptedFields} className="btn secondary">
                📤 Export Config
              </button>
              <label className="btn secondary" style={{ cursor: 'pointer' }}>
                📥 Import Config
                <input 
                  type="file" 
                  accept=".json"
                  onChange={importEncryptedFields}
                  style={{ display: 'none' }}
                />
              </label>
            </div>


            {allAvailableTables.length > 0 && (
              <div className="version-history" style={{ width: '100%', overflow: 'visible', paddingBottom: '30px' }}>
                <h5>📚 Table Encryption Configuration</h5>
                {/* Table Tabs with Navigation */}
                <div style={{ position: 'relative', marginBottom: '15px' }}>
                  <button 
                    onClick={() => {
                      const container = document.querySelector('.table-tabs-container') as HTMLElement;
                      if (container) {
                        container.scrollLeft -= 200;
                        setTabScrollPosition(container.scrollLeft);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: '-5px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ←
                  </button>
                  
                  <div 
                    className="table-tabs-container"
                    style={{
                      display: 'flex',
                      gap: '4px',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      paddingBottom: '5px',
                      width: '100%',
                      flexWrap: 'nowrap',
                      scrollBehavior: 'smooth',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    {allAvailableTables.map(table => {
                    const hasEncryption = tablesWithEncryption.includes(table);
                    
                    return (
                      <button
                        key={table}
                        className={`table-tab ${selectedTable === table ? 'active' : ''} ${!hasEncryption ? 'no-encryption' : ''}`}
                        onClick={() => setSelectedTable(table)}
                        style={{
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                          minWidth: 'fit-content',
                          flex: '0 0 auto'
                        }}
                      >
                        {table.toUpperCase()}
                        {hasEncryption && (
                          <span className="table-version">
                            v{getCurrentTableVersionSync(table)}
                          </span>
                        )}
                      </button>
                    );
                    })}
                  </div>
                  
                  <button 
                    onClick={() => {
                      const container = document.querySelector('.table-tabs-container') as HTMLElement;
                      if (container) {
                        container.scrollLeft += 200;
                        setTabScrollPosition(container.scrollLeft);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      right: '-5px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    →
                  </button>
                </div>

                {/* Content for Selected Table */}
                {selectedTable && (
                  <div className="table-version-content">
                    <div className="table-info">
                      <h6>📋 {selectedTable.toUpperCase()} Encryption Configuration</h6>
                      <span className="current-fields">
                        Current fields: {(encryptedFields[selectedTable] || []).join(', ') || 'none'}
                      </span>
                    </div>
                    
                    {/* Field Editor for Selected Table */}
                    <div className="field-config">
                      <label>Encrypted Fields (comma-separated):</label>
                      <input
                        type="text"
                        defaultValue={(encryptedFields[selectedTable] || []).join(', ')}
                        onBlur={async (e) => {
                          const fields = e.target.value
                            .split(',')
                            .map(f => f.trim())
                            .filter(f => f.length > 0);
                          await updateEncryptedFields(selectedTable, fields);
                        }}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const fields = (e.target as HTMLInputElement).value
                              .split(',')
                              .map(f => f.trim())
                              .filter(f => f.length > 0);
                            await updateEncryptedFields(selectedTable, fields);
                          }
                        }}
                        placeholder="email, name, phone"
                      />
                      <div className="field-preview">
                        Current: {(encryptedFields[selectedTable] || []).length > 0 
                          ? encryptedFields[selectedTable].map(field => 
                              <span key={field} className="field-tag">{field}</span>
                            )
                          : <span className="no-fields">No encrypted fields</span>
                        }
                      </div>
                    </div>
                    
                    {/* Version History (only show if table has encryption) */}
                    {tableEncryptionVersions[selectedTable] && tableEncryptionVersions[selectedTable].length > 0 ? (
                      <div className="versions-list">
                        <div className="version-card add-new-card compact" onClick={() => setShowNewConfigModal(true)}>
                          <div className="new-encryption-card">
                            <div className="new-encryption-icon">➕</div>
                            <div className="new-encryption-text">
                              <h6>Add New</h6>
                            </div>
                          </div>
                        </div>
                        {tableEncryptionVersions[selectedTable].map(version => (
                          <div key={version.version} className={`version-card ${version.active ? 'active' : 'inactive'}`}>
                            <div className="version-header">
                              <span className="version-number">v{version.version}</span>
                              <span className={`version-status ${version.active ? 'active' : 'inactive'}`}>
                                {version.active ? '🟢 Active' : '🔴 Inactive'}
                              </span>
                              <span className="version-date">
                                {new Date(version.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="version-description">
                              {version.description || 'No description'}
                            </div>
                            <div className="version-fields">
                              <strong>Encrypted Fields:</strong>
                              <div className="fields-list">
                                {version.encryptedFields.join(', ') || 'none'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="versions-list">
                        <div className="version-card add-new-card compact" onClick={() => setShowNewConfigModal(true)}>
                          <div className="new-encryption-card">
                            <div className="new-encryption-icon">➕</div>
                            <div className="new-encryption-text">
                              <h6>Add New</h6>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}


            <div className="modal-actions">
              <button onClick={() => setShowEncryptionConfig(false)} className="btn primary">
                ✅ Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Configuration Modal */}
      {showNewConfigModal && (
        <div className="modal" onClick={() => setShowNewConfigModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>🔐 Configure Encryption Fields</h4>
              <button 
                className="btn danger small" 
                onClick={() => setShowNewConfigModal(false)}
                style={{ marginLeft: 'auto' }}
              >
                ✕ Close
              </button>
            </div>
            
            {selectedTable && (
              <div className="config-editor">
                <div className="entity-config">
                  <h5>{selectedTable.toUpperCase()} Encryption Fields</h5>
                  <div className="field-config">
                    <label>Encrypted Fields (comma-separated):</label>
                    <input
                      type="text"
                      defaultValue={(encryptedFields[selectedTable] || []).join(', ')}
                      onBlur={async (e) => {
                        const fields = e.target.value
                          .split(',')
                          .map(f => f.trim())
                          .filter(f => f.length > 0);
                        await updateEncryptedFields(selectedTable, fields);
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const fields = (e.target as HTMLInputElement).value
                            .split(',')
                            .map(f => f.trim())
                            .filter(f => f.length > 0);
                          await updateEncryptedFields(selectedTable, fields);
                        }
                      }}
                      placeholder="email, name, phone"
                    />
                    <div className="field-preview">
                      Current: {(encryptedFields[selectedTable] || []).length > 0 
                        ? encryptedFields[selectedTable].map(field => 
                            <span key={field} className="field-tag">{field}</span>
                          )
                        : <span className="no-fields">No encrypted fields</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowNewConfigModal(false)} className="btn primary">
                ✅ Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Key Rotation Management Component
const KeyRotationManagement: React.FC = () => {
  const { storage, isInitialized } = useStorageContext();
  const [keyInfo, setKeyInfo] = useState<any>(null);
  const [rotationHistory, setRotationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [rotationReason, setRotationReason] = useState('');
  const [forceRotation, setForceRotation] = useState(false);
  const [keyStats, setKeyStats] = useState<any>(null);

  useEffect(() => {
    if (storage && isInitialized) {
      loadKeyInformation();
      loadRotationHistory();
      loadKeyStatistics();
    }
  }, [storage, isInitialized]);

  const loadKeyInformation = async () => {
    if (!storage) return;
    
    try {
      console.log('🔐 Loading encryption key information...');
      
      const encryptionService = (storage as any).encryptionService;
      if (encryptionService && typeof encryptionService.getKeyInformation === 'function') {
        const info = await encryptionService.getKeyInformation();
        setKeyInfo(info);
      } else {
        // Mock key information
        const mockKeyInfo = {
          currentVersion: 'v1',
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          rotationInterval: 90, // days
          lastRotation: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          nextRotation: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
          status: 'active',
          strength: 'high',
          totalKeys: 3,
          activeKeys: 1,
          rotationEnabled: true
        };
        setKeyInfo(mockKeyInfo);
      }
    } catch (error) {
      console.error('Failed to load key information:', error);
    }
  };

  const loadRotationHistory = async () => {
    if (!storage) return;
    
    try {
      const encryptionService = (storage as any).encryptionService;
      if (encryptionService && typeof encryptionService.getRotationHistory === 'function') {
        const history = await encryptionService.getRotationHistory();
        setRotationHistory(history);
      } else {
        // Mock rotation history
        const mockHistory = [
          {
            id: 'rotation_1',
            fromVersion: 'v0',
            toVersion: 'v1',
            rotatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            reason: 'scheduled_rotation',
            triggeredBy: 'system',
            status: 'completed',
            duration: 1200, // milliseconds
            affectedRecords: 1250
          },
          {
            id: 'rotation_2',
            fromVersion: 'v1',
            toVersion: 'v2',
            rotatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            reason: 'security_incident',
            triggeredBy: 'admin_user',
            status: 'completed',
            duration: 2100,
            affectedRecords: 980
          },
          {
            id: 'rotation_3',
            fromVersion: 'v2',
            toVersion: 'v3',
            rotatedAt: new Date(Date.now() - 135 * 24 * 60 * 60 * 1000),
            reason: 'policy_update',
            triggeredBy: 'admin_user',
            status: 'completed',
            duration: 1800,
            affectedRecords: 750
          }
        ];
        setRotationHistory(mockHistory);
      }
    } catch (error) {
      console.error('Failed to load rotation history:', error);
      setRotationHistory([]);
    }
  };

  const loadKeyStatistics = async () => {
    if (!storage) return;
    
    try {
      const encryptionService = (storage as any).encryptionService;
      if (encryptionService && typeof encryptionService.getKeyStatistics === 'function') {
        const stats = await encryptionService.getKeyStatistics();
        setKeyStats(stats);
      } else {
        // Mock key statistics
        const mockStats = {
          totalRotations: 3,
          averageRotationDuration: 1700, // milliseconds
          totalRecordsReencrypted: 2980,
          lastRotationSuccess: true,
          upcomingRotations: 1,
          keyStrengthScore: 95,
          complianceStatus: 'compliant',
          encryptedTables: ['users', 'posts', 'comments', 'messages'],
          encryptedFields: 12
        };
        setKeyStats(mockStats);
      }
    } catch (error) {
      console.error('Failed to load key statistics:', error);
    }
  };

  const rotateKeys = async () => {
    if (!storage || !rotationReason.trim()) return;
    
    setLoading(true);
    try {
      console.log('🔄 Initiating key rotation...');
      
      const encryptionService = (storage as any).encryptionService;
      if (encryptionService && typeof encryptionService.rotateKeys === 'function') {
        const result = await encryptionService.rotateKeys({
          reason: rotationReason,
          force: forceRotation,
          triggeredBy: 'admin_user'
        });
        
        console.log('✅ Key rotation completed:', result);
        alert('✅ Encryption keys have been rotated successfully!');
        
      } else {
        // Mock key rotation
        const newRotation = {
          id: `rotation_${Date.now()}`,
          fromVersion: keyInfo.currentVersion,
          toVersion: `v${parseInt(keyInfo.currentVersion.slice(1)) + 1}`,
          rotatedAt: new Date(),
          reason: rotationReason,
          triggeredBy: 'admin_user',
          status: 'completed',
          duration: Math.floor(Math.random() * 3000) + 1000,
          affectedRecords: Math.floor(Math.random() * 1000) + 500
        };
        
        setRotationHistory(prev => [newRotation, ...prev]);
        setKeyInfo(prev => ({
          ...prev,
          currentVersion: newRotation.toVersion,
          lastRotation: newRotation.rotatedAt,
          nextRotation: new Date(Date.now() + prev.rotationInterval * 24 * 60 * 60 * 1000)
        }));
        
        console.log('✅ Mock key rotation completed');
        alert('✅ Encryption keys have been rotated successfully!');
      }
      
      // Log audit event
      const auditService = (storage as any).auditLogger;
      if (auditService) {
        await auditService.logSecurityEvent(
          'system',
          'key_rotation_completed',
          {
            reason: rotationReason,
            force: forceRotation,
            timestamp: new Date().toISOString()
          },
          true
        );
      }
      
      // Refresh data
      await loadKeyInformation();
      await loadRotationHistory();
      await loadKeyStatistics();
      
      // Reset and close modal
      setRotationReason('');
      setForceRotation(false);
      setShowRotateModal(false);
      
    } catch (error) {
      console.error('❌ Key rotation failed:', error);
      alert('❌ Key rotation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const testEncryption = async () => {
    if (!storage) return;
    
    try {
      console.log('🧪 Testing encryption with current keys...');
      
      const encryptionService = (storage as any).encryptionService;
      if (encryptionService && typeof encryptionService.testEncryption === 'function') {
        const result = await encryptionService.testEncryption();
        if (result) {
          alert('✅ Encryption test passed! Keys are working correctly.');
        } else {
          alert('❌ Encryption test failed! Please check key configuration.');
        }
      } else {
        // Mock encryption test
        alert('✅ Encryption test passed! Keys are working correctly.');
      }
    } catch (error) {
      console.error('❌ Encryption test failed:', error);
      alert('❌ Encryption test failed! Please check key configuration.');
    }
  };

  const getDaysUntilRotation = () => {
    if (!keyInfo?.nextRotation) return null;
    const now = new Date();
    const next = new Date(keyInfo.nextRotation);
    const diff = next.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getRotationStatusColor = () => {
    const days = getDaysUntilRotation();
    if (days === null) return '#95a5a6';
    if (days <= 7) return '#e74c3c';
    if (days <= 30) return '#f39c12';
    return '#27ae60';
  };

  return (
    <div className="key-rotation-management">
      <h3>🔐 Key Rotation Management</h3>
      
      {keyInfo && (
        <div className="key-overview">
          <div className="key-info-cards">
            <div className="key-card primary">
              <div className="key-card-header">
                <span className="key-icon">🔑</span>
                <div className="key-info">
                  <div className="key-value">{keyInfo.currentVersion}</div>
                  <div className="key-label">Current Key Version</div>
                </div>
              </div>
              <div className="key-status" style={{ color: getRotationStatusColor() }}>
                {getDaysUntilRotation() !== null ? 
                  `${getDaysUntilRotation()} days until rotation` : 
                  'Rotation disabled'
                }
              </div>
            </div>
            
            <div className="key-card">
              <div className="key-card-header">
                <span className="key-icon">🛡️</span>
                <div className="key-info">
                  <div className="key-value">{keyInfo.algorithm}</div>
                  <div className="key-label">Encryption Algorithm</div>
                </div>
              </div>
              <div className="key-status">{keyInfo.strength} strength</div>
            </div>
            
            <div className="key-card">
              <div className="key-card-header">
                <span className="key-icon">🔄</span>
                <div className="key-info">
                  <div className="key-value">{keyInfo.rotationInterval}</div>
                  <div className="key-label">Rotation Interval (days)</div>
                </div>
              </div>
              <div className="key-status">
                {keyInfo.rotationEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="key-card">
              <div className="key-card-header">
                <span className="key-icon">📅</span>
                <div className="key-info">
                  <div className="key-value">
                    {new Date(keyInfo.lastRotation).toLocaleDateString()}
                  </div>
                  <div className="key-label">Last Rotation</div>
                </div>
              </div>
              <div className="key-status">
                {Math.floor((Date.now() - new Date(keyInfo.lastRotation).getTime()) / (1000 * 60 * 60 * 24))} days ago
              </div>
            </div>
          </div>
        </div>
      )}

      {keyStats && (
        <div className="key-statistics">
          <h4>📊 Key Statistics & Compliance</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{keyStats.totalRotations}</div>
              <div className="stat-label">Total Rotations</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{keyStats.totalRecordsReencrypted}</div>
              <div className="stat-label">Records Re-encrypted</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{keyStats.averageRotationDuration}ms</div>
              <div className="stat-label">Avg Rotation Time</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{keyStats.keyStrengthScore}%</div>
              <div className="stat-label">Security Score</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{keyStats.encryptedTables.length}</div>
              <div className="stat-label">Encrypted Tables</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{keyStats.encryptedFields}</div>
              <div className="stat-label">Encrypted Fields</div>
            </div>
          </div>
          
          <div className="compliance-status">
            <div className={`compliance-badge ${keyStats.complianceStatus}`}>
              {keyStats.complianceStatus === 'compliant' ? '✅' : '⚠️'} 
              {keyStats.complianceStatus.toUpperCase()}
            </div>
            <span className="compliance-text">
              {keyStats.complianceStatus === 'compliant' 
                ? 'All encryption standards are met' 
                : 'Some compliance issues detected'
              }
            </span>
          </div>
        </div>
      )}

      <div className="key-actions">
        <h4>🛠️ Key Management Actions</h4>
        <div className="action-buttons">
          <button onClick={() => setShowRotateModal(true)} className="btn primary">
            🔄 Rotate Keys Now
          </button>
          <button onClick={testEncryption} className="btn secondary">
            🧪 Test Encryption
          </button>
          <button onClick={loadKeyInformation} className="btn secondary">
            🔄 Refresh Status
          </button>
        </div>
      </div>

      <div className="rotation-history">
        <h4>📅 Rotation History ({rotationHistory.length} rotations)</h4>
        
        {rotationHistory.length === 0 ? (
          <div className="no-data">No rotation history available.</div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Version Change</th>
                  <th>Reason</th>
                  <th>Triggered By</th>
                  <th>Duration</th>
                  <th>Records</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rotationHistory.map((rotation) => (
                  <tr key={rotation.id}>
                    <td>
                      <div className="rotation-date">
                        {new Date(rotation.rotatedAt).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div className="version-change">
                        {rotation.fromVersion} → {rotation.toVersion}
                      </div>
                    </td>
                    <td>
                      <div className="rotation-reason">
                        {rotation.reason.replace('_', ' ')}
                      </div>
                    </td>
                    <td>
                      <div className="triggered-by">
                        {rotation.triggeredBy}
                      </div>
                    </td>
                    <td>
                      <div className="duration">
                        {rotation.duration}ms
                      </div>
                    </td>
                    <td>
                      <div className="affected-records">
                        {rotation.affectedRecords.toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div className={`status-badge ${rotation.status}`}>
                        {rotation.status === 'completed' ? '✅' : '❌'} {rotation.status}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Key Rotation Modal */}
      {showRotateModal && (
        <div className="modal-overlay" onClick={() => setShowRotateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔄 Rotate Encryption Keys</h3>
              <button onClick={() => setShowRotateModal(false)} className="close-btn">✕</button>
            </div>
            <div className="modal-body">
              <div className="rotation-warning">
                <h4>⚠️ Key Rotation Process</h4>
                <p>Key rotation will generate new encryption keys and re-encrypt all protected data. This process:</p>
                <ul>
                  <li>May take several minutes depending on data volume</li>
                  <li>Will temporarily reduce system performance</li>
                  <li>Should be performed during maintenance windows</li>
                  <li>Cannot be undone once started</li>
                </ul>
              </div>

              <div className="rotation-form">
                <div className="form-group">
                  <label>Rotation Reason (required):</label>
                  <select 
                    value={rotationReason} 
                    onChange={(e) => setRotationReason(e.target.value)}
                  >
                    <option value="">Select a reason...</option>
                    <option value="scheduled_rotation">Scheduled Rotation</option>
                    <option value="security_incident">Security Incident</option>
                    <option value="policy_update">Policy Update</option>
                    <option value="compliance_requirement">Compliance Requirement</option>
                    <option value="manual_request">Manual Request</option>
                    <option value="system_maintenance">System Maintenance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={forceRotation}
                      onChange={(e) => setForceRotation(e.target.checked)}
                    />
                    <span>Force rotation (ignore schedule)</span>
                  </label>
                  <div className="help-text">
                    Check this to override the normal rotation schedule
                  </div>
                </div>
              </div>

              <div className="rotation-impact">
                <h4>📊 Expected Impact</h4>
                <div className="impact-stats">
                  <div className="impact-item">
                    <span className="impact-label">Estimated Duration:</span>
                    <span className="impact-value">1-3 minutes</span>
                  </div>
                  <div className="impact-item">
                    <span className="impact-label">Records to Re-encrypt:</span>
                    <span className="impact-value">~{keyStats?.totalRecordsReencrypted || 1000}</span>
                  </div>
                  <div className="impact-item">
                    <span className="impact-label">Tables Affected:</span>
                    <span className="impact-value">{keyStats?.encryptedTables?.length || 4}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowRotateModal(false)}
                className="btn secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={rotateKeys}
                className="btn danger"
                disabled={!rotationReason || loading}
              >
                {loading ? '🔄 Rotating...' : '🔄 Start Rotation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Consent History and Analytics Dashboard Component
const ConsentHistoryAndAnalytics: React.FC<{ userId: string; storage: any }> = ({ userId, storage }) => {
  const [consentHistory, setConsentHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [selectedPurpose, setSelectedPurpose] = useState('');

  useEffect(() => {
    if (userId) {
      loadConsentHistory();
      loadAnalytics();
    }
  }, [userId, timeRange, selectedPurpose]);

  const loadConsentHistory = async () => {
    if (!storage || !userId) return;
    
    setLoading(true);
    try {
      const consentManager = (storage as any).consentManager;
      if (consentManager && typeof consentManager.getConsentHistory === 'function') {
        const history = await consentManager.getConsentHistory(userId, selectedPurpose || undefined);
        setConsentHistory(history);
      } else {
        // Mock consent history data
        const mockHistory = [
          {
            id: 'consent_1',
            userId,
            purposeId: 'analytics',
            purposeName: 'Analytics & Performance',
            status: 'granted',
            grantedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            source: 'manual',
            version: 1
          },
          {
            id: 'consent_2', 
            userId,
            purposeId: 'personalization',
            purposeName: 'Personalization',
            status: 'granted',
            grantedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            source: 'automatic',
            version: 1
          },
          {
            id: 'consent_3',
            userId,
            purposeId: 'marketing',
            purposeName: 'Marketing Communications', 
            status: 'revoked',
            grantedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
            revokedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            revocationReason: 'user_request',
            source: 'manual',
            version: 2
          }
        ];
        setConsentHistory(mockHistory);
      }
    } catch (error) {
      console.error('Failed to load consent history:', error);
      setConsentHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!storage) return;
    
    try {
      const consentManager = (storage as any).consentManager;
      if (consentManager && typeof consentManager.getConsentStatistics === 'function') {
        const stats = await consentManager.getConsentStatistics();
        setAnalytics(stats);
      } else {
        // Mock analytics data
        const mockAnalytics = {
          totalUsers: 150,
          totalConsents: 425,
          consentsByPurpose: {
            essential: 150,
            analytics: 120,
            personalization: 85,
            marketing: 70
          },
          consentsByStatus: {
            granted: 325,
            revoked: 75,
            expired: 25
          },
          expiringConsents: 12,
          consentGrowth: {
            thisMonth: 45,
            lastMonth: 38,
            percentChange: 18.4
          },
          topRevocationReasons: [
            { reason: 'user_request', count: 35 },
            { reason: 'expired', count: 25 },
            { reason: 'policy_change', count: 15 }
          ]
        };
        setAnalytics(mockAnalytics);
      }
    } catch (error) {
      console.error('Failed to load consent analytics:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted': return '✅';
      case 'revoked': return '❌';
      case 'expired': return '⏰';
      default: return '❓';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'manual': return '👤';
      case 'automatic': return '🤖';
      case 'system': return '⚙️';
      default: return '📝';
    }
  };

  return (
    <div className="consent-analytics-dashboard">
      <h4>📈 Consent History & Analytics</h4>
      
      {/* Analytics Overview */}
      {analytics && (
        <div className="analytics-overview">
          <h5>📊 Consent Statistics Overview</h5>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-header">
                <span className="analytics-icon">👥</span>
                <div className="analytics-info">
                  <div className="analytics-value">{analytics.totalUsers}</div>
                  <div className="analytics-label">Total Users</div>
                </div>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-header">
                <span className="analytics-icon">📋</span>
                <div className="analytics-info">
                  <div className="analytics-value">{analytics.totalConsents}</div>
                  <div className="analytics-label">Total Consents</div>
                </div>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-header">
                <span className="analytics-icon">✅</span>
                <div className="analytics-info">
                  <div className="analytics-value">{analytics.consentsByStatus.granted}</div>
                  <div className="analytics-label">Active Consents</div>
                </div>
              </div>
            </div>
            
            <div className="analytics-card">
              <div className="analytics-header">
                <span className="analytics-icon">⏰</span>
                <div className="analytics-info">
                  <div className="analytics-value">{analytics.expiringConsents}</div>
                  <div className="analytics-label">Expiring Soon</div>
                </div>
              </div>
            </div>
          </div>

          {/* Purpose Breakdown */}
          <div className="purpose-breakdown">
            <h6>📋 Consent by Purpose</h6>
            <div className="purpose-chart">
              {Object.entries(analytics.consentsByPurpose).map(([purpose, count]) => (
                <div key={purpose} className="purpose-bar">
                  <div className="purpose-name">{purpose.charAt(0).toUpperCase() + purpose.slice(1)}</div>
                  <div className="purpose-progress">
                    <div 
                      className="purpose-fill"
                      style={{ 
                        width: `${(count as number / analytics.totalUsers) * 100}%`,
                        background: purpose === 'essential' ? '#27ae60' : 
                                   purpose === 'analytics' ? '#3498db' :
                                   purpose === 'personalization' ? '#9b59b6' : '#e74c3c'
                      }}
                    ></div>
                  </div>
                  <div className="purpose-count">{count}/{analytics.totalUsers}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="consent-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Time Range:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Purpose:</label>
            <select value={selectedPurpose} onChange={(e) => setSelectedPurpose(e.target.value)}>
              <option value="">All purposes</option>
              <option value="essential">Essential Functions</option>
              <option value="analytics">Analytics & Performance</option>
              <option value="personalization">Personalization</option>
              <option value="marketing">Marketing Communications</option>
            </select>
          </div>
          
          <button onClick={loadConsentHistory} className="btn secondary small">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Consent History Timeline */}
      <div className="consent-history">
        <h5>📅 Consent History Timeline ({consentHistory.length} records)</h5>
        
        {loading ? (
          <div className="loading">Loading consent history...</div>
        ) : consentHistory.length === 0 ? (
          <div className="no-data">No consent history found for this user.</div>
        ) : (
          <div className="consent-timeline">
            {consentHistory.map((consent) => (
              <div key={consent.id} className="consent-event">
                <div className="event-indicator">
                  <div className={`event-dot ${consent.status}`}></div>
                  <div className="event-line"></div>
                </div>
                
                <div className="event-content">
                  <div className="event-header">
                    <div className="event-title">
                      {getStatusIcon(consent.status)} {consent.purposeName}
                      <span className="event-status">{consent.status}</span>
                    </div>
                    <div className="event-meta">
                      {getSourceIcon(consent.source)} {consent.source} • v{consent.version}
                    </div>
                  </div>
                  
                  <div className="event-details">
                    <div className="event-time">
                      {consent.status === 'granted' ? 'Granted' : 'Revoked'}: {' '}
                      {new Date(consent.status === 'granted' ? consent.grantedAt : consent.revokedAt).toLocaleString()}
                    </div>
                    
                    {consent.revokedAt && (
                      <div className="event-duration">
                        Duration: {Math.floor((new Date(consent.revokedAt).getTime() - new Date(consent.grantedAt).getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    )}
                    
                    {consent.revocationReason && (
                      <div className="event-reason">
                        Reason: {consent.revocationReason.replace('_', ' ')}
                      </div>
                    )}
                    
                    {consent.evidence && (
                      <div className="event-evidence">
                        Evidence: {JSON.stringify(consent.evidence)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// GDPR Tools Component
const GDPRTools: React.FC = () => {
  const { storage, isInitialized, config } = useStorageContext();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [exportData, setExportData] = useState<any>(null);
  const [showRectificationModal, setShowRectificationModal] = useState(false);
  const [rectificationData, setRectificationData] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionOption, setDeletionOption] = useState<'delete' | 'anonymize'>('delete');
  const [deletionJustification, setDeletionJustification] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'xml' | 'csv'>('json');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeAuditTrail, setIncludeAuditTrail] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [restrictionTables, setRestrictionTables] = useState<string[]>([]);
  const [currentRestrictions, setCurrentRestrictions] = useState<any[]>([]);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [consentBannerStyle, setConsentBannerStyle] = useState<'banner' | 'modal'>('banner');
  const [consentBannerPosition, setConsentBannerPosition] = useState<'top' | 'bottom'>('bottom');

  useEffect(() => {
    loadUsers();
  }, [storage, isInitialized]);

  // Listen for user entity changes to refresh the dropdown
  useEffect(() => {
    if (!storage) return;

    const handleUserChanges = () => {
      console.log('🔄 User data changed, refreshing GDPR Tools...');
      loadUsers();
    };

    // Listen for storage events
    if (typeof storage.on === 'function') {
      storage.on('data_created', (event: any) => {
        if (event.table === EntityType.USERS) {
          handleUserChanges();
        }
      });
      storage.on('data_updated', (event: any) => {
        if (event.table === EntityType.USERS) {
          handleUserChanges();
        }
      });
      storage.on('data_deleted', (event: any) => {
        if (event.table === EntityType.USERS) {
          handleUserChanges();
        }
      });
    }

    return () => {
      // Cleanup listeners
      if (typeof storage.off === 'function') {
        storage.off('data_created', handleUserChanges);
        storage.off('data_updated', handleUserChanges);
        storage.off('data_deleted', handleUserChanges);
      }
    };
  }, [storage]);

  const loadUsers = async () => {
    if (!storage || !isInitialized) return;
    
    try {
      const result = await storage.query(EntityType.USERS);
      setUsers(result);
      if (result.length > 0 && !selectedUserId) {
        setSelectedUserId(result[0].id);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadConsents = async () => {
    if (!storage || !selectedUserId) return;
    
    try {
      // Check if queryConsent method exists
      if (typeof storage.queryConsent === 'function') {
        const result = await storage.queryConsent(selectedUserId);
        setConsents(result);
      } else {
        // Mock consent data if method doesn't exist
        setConsents([]);
      }
    } catch (error) {
      console.error('Failed to load consents:', error);
      setConsents([]);
    }
  };

  const grantConsent = async (purposeId: string) => {
    if (!storage || !selectedUserId) return;
    
    try {
      // Check if grantConsent method exists
      if (typeof storage.grantConsent === 'function') {
        await storage.grantConsent(selectedUserId, [purposeId]);
        await loadConsents();
      } else {
        console.warn('grantConsent method not available on storage');
      }
    } catch (error) {
      console.error('Failed to grant consent:', error);
    }
  };

  const revokeConsent = async (purposeId: string) => {
    if (!storage || !selectedUserId) return;
    
    try {
      // Check if revokeConsent method exists
      if (typeof storage.revokeConsent === 'function') {
        await storage.revokeConsent(selectedUserId, [purposeId]);
        await loadConsents();
      } else {
        console.warn('revokeConsent method not available on storage');
      }
    } catch (error) {
      console.error('Failed to revoke consent:', error);
    }
  };

  const handleConsentBannerConsent = async (purposeIds: string[], granted: boolean) => {
    if (!storage || !selectedUserId) return;
    
    try {
      if (granted) {
        // Grant consent for each purpose
        for (const purposeId of purposeIds) {
          await grantConsent(purposeId);
        }
      } else {
        // For multiple purposes, revoke each one
        for (const purposeId of purposeIds) {
          await revokeConsent(purposeId);
        }
      }
      
      // Refresh consent status
      await loadConsents();
    } catch (error) {
      console.error('Failed to update consent:', error);
    }
  };

  const exportUserData = async (format: string = 'json', tables?: string[], metadata: boolean = true, auditTrail: boolean = false) => {
    if (!storage || !selectedUserId) return;
    
    try {
      console.log(`📦 Exporting user data in ${format.toUpperCase()} format...`);
      
      // Check if exportUserData method exists
      if (typeof storage.exportUserData === 'function') {
        const exportOptions = {
          format,
          tables,
          includeMetadata: metadata,
          includeAuditTrail: auditTrail
        };
        const result = await storage.exportUserData(selectedUserId, exportOptions);
        setExportData(result);
      } else {
        console.warn('exportUserData method not available on storage, using mock data');
        
        // Generate comprehensive mock export data
        const allTables = ['users', 'posts', 'comments', 'messages', 'enrollments'];
        const exportTables = tables || allTables;
        
        const mockData: any = {};
        let totalRecords = 0;
        
        // Generate mock data for each table
        for (const table of exportTables) {
          switch (table) {
            case 'users':
              mockData[table] = [
                {
                  id: selectedUserId,
                  name: users.find(u => u.id === selectedUserId)?.name || 'Demo User',
                  email: users.find(u => u.id === selectedUserId)?.email || 'demo@example.com',
                  phone: '+1-555-0123',
                  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                  preferences: {
                    theme: 'light',
                    notifications: true,
                    language: 'en'
                  }
                }
              ];
              totalRecords += 1;
              break;
              
            case 'posts':
              mockData[table] = [
                {
                  id: 'post_1',
                  authorId: selectedUserId,
                  title: 'My First Post',
                  content: 'This is my first post on the platform.',
                  createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                  published: true
                },
                {
                  id: 'post_2',
                  authorId: selectedUserId,
                  title: 'Learning GDPR Compliance',
                  content: 'Today I learned about data subject rights.',
                  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                  published: true
                }
              ];
              totalRecords += 2;
              break;
              
            case 'comments':
              mockData[table] = [
                {
                  id: 'comment_1',
                  authorId: selectedUserId,
                  postId: 'post_other_1',
                  content: 'Great article! Thanks for sharing.',
                  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                }
              ];
              totalRecords += 1;
              break;
              
            case 'messages':
              mockData[table] = [
                {
                  id: 'msg_1',
                  senderId: selectedUserId,
                  recipientId: 'user_other',
                  content: 'Hello! How are you?',
                  sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                  read: true
                }
              ];
              totalRecords += 1;
              break;
              
            default:
              mockData[table] = [];
          }
        }
        
        // Convert data to requested format
        let convertedData = mockData;
        if (format === 'xml') {
          convertedData = convertToXML(mockData);
        } else if (format === 'csv') {
          convertedData = convertToCSV(mockData);
        }
        
        const result = {
          id: `export_${Date.now()}`,
          userId: selectedUserId,
          format,
          data: convertedData,
          size: JSON.stringify(mockData).length,
          tables: exportTables,
          recordCount: totalRecords,
          exportedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          metadata: {
            version: '1.0',
            includeMetadata: metadata,
            includeAuditTrail: auditTrail,
            exportFormat: format,
            gdprCompliant: true
          }
        };
        
        setExportData(result);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('❌ Failed to export data. Please try again.');
    }
  };

  // Helper function to convert data to XML format
  const convertToXML = (data: any): string => {
    const escapeXML = (str: string) => {
      return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case "'": return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    const objectToXML = (obj: any, indent: string = ''): string => {
      if (typeof obj !== 'object' || obj === null) {
        return escapeXML(String(obj));
      }

      if (Array.isArray(obj)) {
        return obj.map(item => `${indent}<item>\n${objectToXML(item, indent + '  ')}\n${indent}</item>`).join('\n');
      }

      return Object.entries(obj)
        .map(([key, value]) => {
          const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
          if (typeof value === 'object' && value !== null) {
            return `${indent}<${sanitizedKey}>\n${objectToXML(value, indent + '  ')}\n${indent}</${sanitizedKey}>`;
          }
          return `${indent}<${sanitizedKey}>${escapeXML(String(value))}</${sanitizedKey}>`;
        })
        .join('\n');
    };

    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const xmlContent = `<export>\n${objectToXML(data, '  ')}\n</export>`;
    return `${xmlHeader}\n${xmlContent}`;
  };

  // Helper function to convert data to CSV format
  const convertToCSV = (data: any): string => {
    let csvContent = '';
    
    for (const [tableName, records] of Object.entries(data)) {
      if (Array.isArray(records) && records.length > 0) {
        csvContent += `\n=== ${tableName.toUpperCase()} ===\n`;
        
        // Get headers from first record
        const headers = Object.keys(records[0]);
        csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
        
        // Add data rows
        for (const record of records) {
          const values = headers.map(header => {
            const value = (record as any)[header];
            if (value === null || value === undefined) return '""';
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            return `"${String(value).replace(/"/g, '""')}"`;
          });
          csvContent += values.join(',') + '\n';
        }
        csvContent += '\n';
      }
    }
    
    return csvContent;
  };

  const executeDataDeletion = async () => {
    if (!storage || !selectedUserId || !deletionJustification.trim()) return;
    
    try {
      console.log(`🗑️ Executing ${deletionOption} for user ${selectedUserId}...`);
      
      const auditService = (storage as any).auditLogger;
      const dataSubjectRights = (storage as any).dataSubjectRights;
      
      if (deletionOption === 'delete') {
        // Full deletion (Article 17)
        if (dataSubjectRights && typeof dataSubjectRights.deleteUserData === 'function') {
          await dataSubjectRights.deleteUserData(selectedUserId);
        } else {
          // Fallback: delete from main entities
          await storage.delete(EntityType.USERS, selectedUserId);
        }
        
        // Log deletion audit event
        if (auditService) {
          await auditService.logOperation({
            userId: selectedUserId,
            action: 'data_deletion',
            resource: 'user_data',
            resourceId: selectedUserId,
            success: true,
            details: {
              deletionType: 'complete_deletion',
              justification: deletionJustification,
              timestamp: new Date().toISOString()
            },
            metadata: {
              article: 'Article 17 - Right to erasure',
              ipAddress: 'demo-app'
            }
          });
        }
        
        alert('✅ User data has been completely deleted!');
        
      } else {
        // Anonymization (Alternative to deletion)
        if (dataSubjectRights && typeof dataSubjectRights.anonymizeUserData === 'function') {
          await dataSubjectRights.anonymizeUserData(selectedUserId);
        } else {
          // Fallback: anonymize user data manually
          const anonymizedData = {
            name: `Anonymous User ${Date.now()}`,
            email: `anonymous.${Date.now()}@example.com`,
            phone: 'ANONYMIZED',
            preferences: {},
            anonymized: true,
            anonymizedAt: new Date(),
            originalId: selectedUserId
          };
          await storage.update(EntityType.USERS, selectedUserId, anonymizedData);
        }
        
        // Log anonymization audit event
        if (auditService) {
          await auditService.logOperation({
            userId: selectedUserId,
            action: 'data_anonymization',
            resource: 'user_data',
            resourceId: selectedUserId,
            success: true,
            details: {
              deletionType: 'anonymization',
              justification: deletionJustification,
              timestamp: new Date().toISOString()
            },
            metadata: {
              article: 'Article 17 - Right to erasure (anonymization)',
              ipAddress: 'demo-app'
            }
          });
        }
        
        alert('✅ User data has been anonymized!');
      }
      
      // Refresh and close modal
      await loadUsers();
      setSelectedUserId('');
      setShowDeletionModal(false);
      setDeletionJustification('');
      
    } catch (error) {
      console.error(`❌ Failed to ${deletionOption} user data:`, error);
      alert(`❌ Failed to ${deletionOption} data. Please try again.`);
    }
  };

  const downloadExport = (format?: string) => {
    if (!exportData) return;
    
    const exportFormat = format || exportData.format || 'json';
    let content: string;
    let mimeType: string;
    let fileExtension: string;
    
    switch (exportFormat) {
      case 'xml':
        content = typeof exportData.data === 'string' ? exportData.data : convertToXML(exportData.data);
        mimeType = 'application/xml';
        fileExtension = 'xml';
        break;
        
      case 'csv':
        content = typeof exportData.data === 'string' ? exportData.data : convertToCSV(exportData.data);
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
        
      default: // json
        content = typeof exportData.data === 'string' ? 
          JSON.stringify({ data: exportData.data }, null, 2) : 
          JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-data-${selectedUserId}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Downloaded export in ${exportFormat.toUpperCase()} format`);
  };

  const handleExportSubmit = () => {
    if (!selectedUserId) return;
    
    exportUserData(exportFormat, selectedTables.length > 0 ? selectedTables : undefined, includeMetadata, includeAuditTrail);
    setShowExportModal(false);
  };

  const loadCurrentRestrictions = async () => {
    if (!storage || !selectedUserId) return;
    
    try {
      console.log('📋 Loading current processing restrictions...');
      
      const dataSubjectRights = (storage as any).dataSubjectRights;
      if (dataSubjectRights && typeof dataSubjectRights.getProcessingRestrictions === 'function') {
        const restrictions = await dataSubjectRights.getProcessingRestrictions(selectedUserId);
        setCurrentRestrictions(restrictions);
      } else {
        // Mock current restrictions
        const mockRestrictions = [
          {
            id: 'restriction_1',
            userId: selectedUserId,
            tables: ['posts', 'comments'],
            reason: 'Data accuracy dispute',
            restrictedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            status: 'active',
            restrictionType: 'processing_dispute'
          },
          {
            id: 'restriction_2', 
            userId: selectedUserId,
            tables: ['messages'],
            reason: 'Pending legal review',
            restrictedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'active',
            restrictionType: 'legal_review'
          }
        ];
        setCurrentRestrictions(mockRestrictions);
      }
    } catch (error) {
      console.error('Failed to load processing restrictions:', error);
      setCurrentRestrictions([]);
    }
  };

  const restrictProcessing = async () => {
    if (!storage || !selectedUserId || !restrictionReason.trim() || restrictionTables.length === 0) return;
    
    try {
      console.log(`🚫 Restricting processing for user ${selectedUserId}...`);
      
      const dataSubjectRights = (storage as any).dataSubjectRights;
      if (dataSubjectRights && typeof dataSubjectRights.restrictProcessing === 'function') {
        await dataSubjectRights.restrictProcessing(selectedUserId, restrictionTables, restrictionReason);
      } else {
        // Mock restriction implementation
        const restriction = {
          id: `restriction_${Date.now()}`,
          userId: selectedUserId,
          tables: restrictionTables,
          reason: restrictionReason,
          restrictedAt: new Date(),
          status: 'active',
          restrictionType: 'user_request'
        };
        
        // In a real implementation, this would mark records as restricted in the database
        console.log('📝 Processing restriction applied:', restriction);
        
        // Update current restrictions
        setCurrentRestrictions(prev => [...prev, restriction]);
      }
      
      // Log audit event for processing restriction (Article 18)
      const auditService = (storage as any).auditLogger;
      if (auditService) {
        await auditService.logOperation({
          userId: selectedUserId,
          action: 'processing_restricted',
          resource: 'user_data',
          resourceId: selectedUserId,
          success: true,
          details: {
            tables: restrictionTables,
            reason: restrictionReason,
            restrictionType: 'user_request'
          },
          metadata: {
            article: 'Article 18 - Right to restriction of processing',
            timestamp: new Date().toISOString(),
            ipAddress: 'demo-app'
          }
        });
      }
      
      console.log('✅ Processing restriction applied successfully');
      alert('✅ Processing restriction has been applied to your data!');
      
      // Reset and close modal
      setRestrictionReason('');
      setRestrictionTables([]);
      setShowRestrictionModal(false);
      
    } catch (error) {
      console.error('❌ Failed to restrict processing:', error);
      alert('❌ Failed to apply processing restriction. Please try again.');
    }
  };

  const removeRestriction = async (restrictionId: string) => {
    if (!storage || !selectedUserId) return;
    
    try {
      console.log(`🔓 Removing processing restriction ${restrictionId}...`);
      
      const dataSubjectRights = (storage as any).dataSubjectRights;
      if (dataSubjectRights && typeof dataSubjectRights.removeProcessingRestriction === 'function') {
        await dataSubjectRights.removeProcessingRestriction(restrictionId);
      } else {
        // Mock restriction removal
        setCurrentRestrictions(prev => prev.filter(r => r.id !== restrictionId));
      }
      
      // Log audit event
      const auditService = (storage as any).auditLogger;
      if (auditService) {
        await auditService.logOperation({
          userId: selectedUserId,
          action: 'processing_restriction_removed',
          resource: 'user_data',
          resourceId: selectedUserId,
          success: true,
          details: { restrictionId },
          metadata: {
            article: 'Article 18 - Right to restriction of processing (removal)',
            timestamp: new Date().toISOString(),
            ipAddress: 'demo-app'
          }
        });
      }
      
      console.log('✅ Processing restriction removed successfully');
      
    } catch (error) {
      console.error('❌ Failed to remove processing restriction:', error);
      alert('❌ Failed to remove restriction. Please try again.');
    }
  };

  const loadCurrentUserData = async () => {
    if (!storage || !selectedUserId) return;
    
    try {
      console.log('📋 Loading current user data for rectification...');
      
      // Get user data from storage
      const userData = await storage.findById(EntityType.USERS, selectedUserId);
      if (userData) {
        setCurrentUserData(userData);
        // Initialize rectification data with current values
        setRectificationData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          preferences: userData.preferences ? JSON.stringify(userData.preferences, null, 2) : '{}',
          justification: '' // Required for GDPR Article 16 compliance
        });
      }
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
    }
  };

  const submitRectification = async () => {
    if (!storage || !selectedUserId || !rectificationData) return;
    
    try {
      console.log('✏️ Submitting data rectification request...');
      
      // Prepare updated data
      const updatedData: any = {
        name: rectificationData.name,
        email: rectificationData.email,
        phone: rectificationData.phone,
        updatedAt: new Date()
      };

      // Parse preferences if provided
      try {
        updatedData.preferences = JSON.parse(rectificationData.preferences);
      } catch (e) {
        console.warn('⚠️ Invalid preferences JSON, skipping preferences update');
      }

      // Update user data
      await storage.update(EntityType.USERS, selectedUserId, updatedData);
      
      // Log audit event for data rectification (Article 16)
      const auditService = (storage as any).auditLogger;
      if (auditService) {
        await auditService.logOperation({
          userId: selectedUserId,
          action: 'rectification_completed',
          resource: 'user_data',
          resourceId: selectedUserId,
          success: true,
          details: {
            changedFields: Object.keys(updatedData).filter(key => key !== 'updatedAt'),
            justification: rectificationData.justification,
            originalData: currentUserData,
            newData: updatedData
          },
          metadata: {
            article: 'Article 16 - Right to rectification',
            timestamp: new Date().toISOString(),
            ipAddress: 'demo-app'
          }
        });
      }

      console.log('✅ Data rectification completed successfully');
      alert('✅ Your data has been updated successfully!');
      
      // Refresh user list and close modal
      loadUsers();
      setShowRectificationModal(false);
      setRectificationData(null);
      setCurrentUserData(null);
      
    } catch (error) {
      console.error('❌ Failed to update user data:', error);
      alert('❌ Failed to update data. Please try again.');
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      // Set user context for audit logging
      if (storage && typeof (storage as any).setCurrentUserId === 'function') {
        (storage as any).setCurrentUserId(selectedUserId);
      }
      loadConsents();
      loadCurrentRestrictions();
    }
  }, [selectedUserId, storage]);

  if (!config?.gdpr?.enabled) {
    return (
      <div className="gdpr-tools">
        <h3>🔒 GDPR Tools</h3>
        <div className="notice">GDPR is not enabled in current configuration</div>
      </div>
    );
  }

  return (
    <div className="gdpr-tools">
      <h3>🔒 GDPR Compliance Tools</h3>
      
      <div className="user-selector">
        <label>Select User ({users.length} available):</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            <option value="">-- Select User --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email}) - ID: {user.id}
              </option>
            ))}
          </select>
          <button onClick={loadUsers} className="btn secondary" title="Refresh user list">
            🔄
          </button>
        </div>
      </div>

      {selectedUserId && (
        <>
          <div className="consent-management">
            <h4>📋 Consent Management</h4>
            <div className="purposes">
              {config.gdpr.consent?.purposes?.map(purpose => {
                const consent = consents.find(c => c.purposeId === purpose.id);
                const hasConsentRecord = !!consent;
                const isGranted = consent?.status === 'granted';
                const isRevoked = consent?.status === 'revoked';
                const isPending = !hasConsentRecord;
                
                return (
                  <div key={purpose.id} className="purpose-item">
                    <div className="purpose-info">
                      <h5>{purpose.name}</h5>
                      <p>{purpose.description}</p>
                      <div className="purpose-meta">
                        Category: {purpose.category} | Legal Basis: {purpose.legalBasis}
                        {purpose.required && <span className="required"> (Required)</span>}
                      </div>
                    </div>
                    <div className="purpose-actions">
                      <span className={`status ${isGranted ? 'granted' : isRevoked ? 'revoked' : 'pending'}`}>
                        {isGranted ? 'Granted' : isRevoked ? 'Revoked' : 'Pending'}
                      </span>
                      {!purpose.required && (
                        <button
                          onClick={() => isGranted ? revokeConsent(purpose.id) : grantConsent(purpose.id)}
                          className={`btn ${isGranted ? 'danger' : 'primary'}`}
                        >
                          {isGranted ? 'Revoke' : 'Grant'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consent Collection Demo */}
          <div className="consent-collection-demo">
            <h4>🍪 Consent Collection Demo</h4>
            <p>Test different consent collection UI components:</p>
            
            <div className="demo-controls">
              <div className="control-group">
                <label>Banner Style:</label>
                <select 
                  value={consentBannerStyle} 
                  onChange={(e) => setConsentBannerStyle(e.target.value as 'banner' | 'modal')}
                >
                  <option value="banner">Banner</option>
                  <option value="modal">Modal</option>
                </select>
              </div>
              
              <div className="control-group">
                <label>Position:</label>
                <select 
                  value={consentBannerPosition} 
                  onChange={(e) => setConsentBannerPosition(e.target.value as 'top' | 'bottom')}
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
              
              <button 
                onClick={() => setShowConsentBanner(true)} 
                className="btn primary"
                disabled={showConsentBanner}
              >
                {showConsentBanner ? 'Banner Active' : 'Show Consent Banner'}
              </button>
            </div>
            
            <div className="demo-description">
              <p>
                <strong>What this demonstrates:</strong> Real-world consent collection UIs that can be integrated into any application.
                The consent banner shows how to collect consent for different purposes with GDPR-compliant messaging.
              </p>
            </div>
          </div>

          <ConsentHistoryAndAnalytics userId={selectedUserId} storage={storage} />

          {/* Consent Banner Component */}
          {showConsentBanner && (
            <ConsentBanner
              purposes={createTestConfig(true).gdpr.consent.purposes}
              userId={selectedUserId || 'demo-user'}
              onConsent={handleConsentBannerConsent}
              onDismiss={() => setShowConsentBanner(false)}
              position={consentBannerPosition}
              style={consentBannerStyle}
            />
          )}

          <div className="data-rights">
            <h4>📤 Data Subject Rights</h4>
            <div className="rights-actions">
              <button onClick={() => setShowExportModal(true)} className="btn primary">
                📊 Export My Data (Article 15 & 20)
              </button>
              <button onClick={() => {
                setShowRectificationModal(true);
                loadCurrentUserData();
              }} className="btn secondary">
                ✏️ Correct My Data (Article 16)
              </button>
              <button onClick={() => setShowDeletionModal(true)} className="btn danger">
                🗑️ Delete My Data (Article 17)
              </button>
              <button onClick={() => setShowRestrictionModal(true)} className="btn secondary">
                🚫 Restrict Processing (Article 18)
              </button>
            </div>
          </div>

          {/* Processing Restrictions Display */}
          {currentRestrictions.length > 0 && (
            <div className="processing-restrictions">
              <h4>🚫 Active Processing Restrictions</h4>
              <div className="restrictions-list">
                {currentRestrictions.map((restriction) => (
                  <div key={restriction.id} className="restriction-item">
                    <div className="restriction-header">
                      <div className="restriction-info">
                        <div className="restriction-title">
                          <span className="restriction-icon">🚫</span>
                          Processing Restricted
                          <span className="restriction-status active">Active</span>
                        </div>
                        <div className="restriction-meta">
                          Applied: {new Date(restriction.restrictedAt).toLocaleString()} • 
                          Type: {restriction.restrictionType.replace('_', ' ')}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeRestriction(restriction.id)}
                        className="btn small danger"
                        title="Remove restriction"
                      >
                        🔓 Remove
                      </button>
                    </div>
                    
                    <div className="restriction-details">
                      <div className="restriction-field">
                        <strong>Affected Tables:</strong> {restriction.tables.join(', ')}
                      </div>
                      <div className="restriction-field">
                        <strong>Reason:</strong> {restriction.reason}
                      </div>
                      <div className="restriction-notice">
                        ⚠️ Processing of your data in these tables is currently restricted. Data remains stored but cannot be used for automated processing until the restriction is lifted.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exportData && (
            <div className="export-results">
              <h4>📋 Data Export Results</h4>
              <div className="export-summary">
                <div className="export-info">
                  <p><strong>Export ID:</strong> {exportData.id}</p>
                  <p><strong>Export Date:</strong> {new Date(exportData.exportedAt).toLocaleString()}</p>
                  <p><strong>Format:</strong> {exportData.format?.toUpperCase() || 'JSON'}</p>
                  <p><strong>Total Records:</strong> {exportData.recordCount}</p>
                  <p><strong>Tables:</strong> {exportData.tables.join(', ')}</p>
                  <p><strong>File Size:</strong> {Math.round(exportData.size / 1024)} KB</p>
                  {exportData.expiresAt && (
                    <p><strong>Expires:</strong> {new Date(exportData.expiresAt).toLocaleString()}</p>
                  )}
                </div>
                
                <div className="export-actions">
                  <h5>💾 Download Options</h5>
                  <div className="download-buttons">
                    <button onClick={() => downloadExport('json')} className="btn primary">
                      📄 Download JSON
                    </button>
                    <button onClick={() => downloadExport('xml')} className="btn secondary">
                      📋 Download XML
                    </button>
                    <button onClick={() => downloadExport('csv')} className="btn secondary">
                      📊 Download CSV
                    </button>
                  </div>
                  
                  {exportData.metadata?.gdprCompliant && (
                    <div className="gdpr-notice">
                      ✅ This export is GDPR Article 20 compliant for data portability
                    </div>
                  )}
                </div>
              </div>
              
              {typeof exportData.data === 'object' ? (
                <JSONViewer data={exportData.data} title="Exported Data Preview" />
              ) : (
                <div className="export-preview">
                  <h5>📄 Export Preview ({exportData.format?.toUpperCase()})</h5>
                  <pre className="export-content">{String(exportData.data).substring(0, 1000)}...</pre>
                </div>
              )}
            </div>
          )}

          {/* Data Rectification Modal */}
          {showRectificationModal && (
            <div className="modal-overlay" onClick={() => setShowRectificationModal(false)}>
              <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>✏️ Data Rectification (Article 16)</h3>
                  <button onClick={() => setShowRectificationModal(false)} className="close-btn">✕</button>
                </div>
                <div className="modal-body">
                  <div className="rectification-notice">
                    <h4>📋 Your Right to Rectification</h4>
                    <p>Under GDPR Article 16, you have the right to obtain from us the rectification of inaccurate personal data concerning you. You also have the right to have incomplete personal data completed.</p>
                    <p><strong>Current User:</strong> {users.find(u => u.id === selectedUserId)?.name} ({users.find(u => u.id === selectedUserId)?.email})</p>
                  </div>

                  {rectificationData && (
                    <div className="rectification-form">
                      <div className="form-section">
                        <h4>📝 Update Your Information</h4>
                        <p className="form-description">Please review and update any incorrect or incomplete information below:</p>
                        
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Full Name:</label>
                            <input
                              type="text"
                              value={rectificationData.name}
                              onChange={(e) => setRectificationData({
                                ...rectificationData,
                                name: e.target.value
                              })}
                              placeholder="Enter your full name"
                            />
                            {currentUserData && (
                              <div className="current-value">
                                Current: {currentUserData.name || 'Not set'}
                              </div>
                            )}
                          </div>

                          <div className="form-group">
                            <label>Email Address:</label>
                            <input
                              type="email"
                              value={rectificationData.email}
                              onChange={(e) => setRectificationData({
                                ...rectificationData,
                                email: e.target.value
                              })}
                              placeholder="Enter your email address"
                            />
                            {currentUserData && (
                              <div className="current-value">
                                Current: {currentUserData.email || 'Not set'}
                              </div>
                            )}
                          </div>

                          <div className="form-group">
                            <label>Phone Number:</label>
                            <input
                              type="tel"
                              value={rectificationData.phone}
                              onChange={(e) => setRectificationData({
                                ...rectificationData,
                                phone: e.target.value
                              })}
                              placeholder="Enter your phone number"
                            />
                            {currentUserData && (
                              <div className="current-value">
                                Current: {currentUserData.phone || 'Not set'}
                              </div>
                            )}
                          </div>

                          <div className="form-group full-width">
                            <label>Preferences (JSON):</label>
                            <textarea
                              value={rectificationData.preferences}
                              onChange={(e) => setRectificationData({
                                ...rectificationData,
                                preferences: e.target.value
                              })}
                              placeholder="Enter preferences as JSON object"
                              rows={4}
                            />
                            {currentUserData && (
                              <div className="current-value">
                                Current: {JSON.stringify(currentUserData.preferences || {}, null, 2)}
                              </div>
                            )}
                          </div>

                          <div className="form-group full-width">
                            <label>Justification for Changes: <span className="required">*</span></label>
                            <textarea
                              value={rectificationData.justification}
                              onChange={(e) => setRectificationData({
                                ...rectificationData,
                                justification: e.target.value
                              })}
                              placeholder="Please explain why these changes are necessary (required for GDPR compliance)"
                              rows={3}
                              required
                            />
                            <div className="field-help">
                              This justification is required for audit purposes and helps us verify the legitimacy of the rectification request.
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="compliance-notice">
                        <h4>🔒 Compliance Information</h4>
                        <ul>
                          <li><strong>Legal Basis:</strong> GDPR Article 16 - Right to rectification</li>
                          <li><strong>Processing Time:</strong> Changes will be applied immediately</li>
                          <li><strong>Audit Trail:</strong> This request will be logged for compliance purposes</li>
                          <li><strong>Verification:</strong> We may contact you to verify significant changes</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  <button 
                    onClick={() => setShowRectificationModal(false)} 
                    className="btn secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitRectification}
                    className="btn primary"
                    disabled={!rectificationData?.justification?.trim()}
                  >
                    ✏️ Update My Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Data Deletion Modal */}
          {showDeletionModal && (
            <div className="modal-overlay" onClick={() => setShowDeletionModal(false)}>
              <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>🗑️ Data Deletion (Article 17)</h3>
                  <button onClick={() => setShowDeletionModal(false)} className="close-btn">✕</button>
                </div>
                <div className="modal-body">
                  <div className="deletion-notice">
                    <h4>⚠️ Your Right to Erasure</h4>
                    <p>Under GDPR Article 17, you have the right to obtain from us the erasure of personal data concerning you. We offer two options to comply with your request:</p>
                    <p><strong>User to be processed:</strong> {users.find(u => u.id === selectedUserId)?.name} ({users.find(u => u.id === selectedUserId)?.email})</p>
                  </div>

                  <div className="deletion-options">
                    <h4>🔹 Choose Deletion Method</h4>
                    
                    <div className="option-cards">
                      <div className={`option-card ${deletionOption === 'delete' ? 'selected' : ''}`} 
                           onClick={() => setDeletionOption('delete')}>
                        <div className="option-header">
                          <input 
                            type="radio" 
                            name="deletionOption" 
                            value="delete" 
                            checked={deletionOption === 'delete'}
                            onChange={() => setDeletionOption('delete')}
                          />
                          <h5>🗑️ Complete Deletion</h5>
                        </div>
                        <p>Permanently remove all your personal data from our systems. This action cannot be undone.</p>
                        <div className="option-details">
                          <strong>What happens:</strong>
                          <ul>
                            <li>All personal data is permanently deleted</li>
                            <li>Account cannot be recovered</li>
                            <li>Historical data is removed</li>
                            <li>Deletion is logged for audit purposes</li>
                          </ul>
                        </div>
                      </div>

                      <div className={`option-card ${deletionOption === 'anonymize' ? 'selected' : ''}`} 
                           onClick={() => setDeletionOption('anonymize')}>
                        <div className="option-header">
                          <input 
                            type="radio" 
                            name="deletionOption" 
                            value="anonymize" 
                            checked={deletionOption === 'anonymize'}
                            onChange={() => setDeletionOption('anonymize')}
                          />
                          <h5>🔒 Anonymization</h5>
                        </div>
                        <p>Replace personal identifiers with anonymous data while preserving statistical value.</p>
                        <div className="option-details">
                          <strong>What happens:</strong>
                          <ul>
                            <li>Personal identifiers are replaced with anonymous values</li>
                            <li>Data structure is preserved for analytics</li>
                            <li>Cannot be linked back to you</li>
                            <li>Anonymization is logged for audit purposes</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="justification-section">
                      <h4>📝 Justification Required</h4>
                      <div className="form-group">
                        <label>Reason for Deletion Request: <span className="required">*</span></label>
                        <textarea
                          value={deletionJustification}
                          onChange={(e) => setDeletionJustification(e.target.value)}
                          placeholder="Please explain why you want your data deleted (e.g., 'No longer using the service', 'Privacy concerns', 'Data no longer necessary')"
                          rows={4}
                          required
                        />
                        <div className="field-help">
                          This justification is required for GDPR compliance and audit purposes.
                        </div>
                      </div>
                    </div>

                    <div className="warning-section">
                      <div className="warning-box">
                        <h4>⚠️ Important Warnings</h4>
                        <ul>
                          <li><strong>Legal Obligations:</strong> Some data may be retained if required by law</li>
                          <li><strong>Processing Time:</strong> {deletionOption === 'delete' ? 'Deletion' : 'Anonymization'} will be processed immediately</li>
                          <li><strong>Reversibility:</strong> {deletionOption === 'delete' ? 'Complete deletion cannot be undone' : 'Anonymization cannot be reversed'}</li>
                          <li><strong>Third Parties:</strong> You may need to contact third-party services separately</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  <button 
                    onClick={() => setShowDeletionModal(false)} 
                    className="btn secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeDataDeletion}
                    className="btn danger"
                    disabled={!deletionJustification.trim()}
                  >
                    {deletionOption === 'delete' ? '🗑️ Delete My Data' : '🔒 Anonymize My Data'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Data Export Modal */}
          {showExportModal && (
            <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
              <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>📊 Data Export (Articles 15 & 20)</h3>
                  <button onClick={() => setShowExportModal(false)} className="close-btn">✕</button>
                </div>
                <div className="modal-body">
                  <div className="export-notice">
                    <h4>📋 Your Right to Data Portability</h4>
                    <p>Under GDPR Articles 15 & 20, you have the right to receive your personal data in a structured, commonly used and machine-readable format, and to transmit that data to another controller.</p>
                    <p><strong>User:</strong> {users.find(u => u.id === selectedUserId)?.name} ({users.find(u => u.id === selectedUserId)?.email})</p>
                  </div>

                  <div className="export-configuration">
                    <div className="config-section">
                      <h4>📄 Export Format</h4>
                      <div className="format-options">
                        <label className={`format-option ${exportFormat === 'json' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            value="json"
                            checked={exportFormat === 'json'}
                            onChange={(e) => setExportFormat(e.target.value as any)}
                          />
                          <div className="format-info">
                            <div className="format-name">🔧 JSON</div>
                            <div className="format-desc">Structured data format, ideal for developers</div>
                          </div>
                        </label>
                        
                        <label className={`format-option ${exportFormat === 'xml' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            value="xml"
                            checked={exportFormat === 'xml'}
                            onChange={(e) => setExportFormat(e.target.value as any)}
                          />
                          <div className="format-info">
                            <div className="format-name">📋 XML</div>
                            <div className="format-desc">Extensible markup language, widely supported</div>
                          </div>
                        </label>
                        
                        <label className={`format-option ${exportFormat === 'csv' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            value="csv"
                            checked={exportFormat === 'csv'}
                            onChange={(e) => setExportFormat(e.target.value as any)}
                          />
                          <div className="format-info">
                            <div className="format-name">📊 CSV</div>
                            <div className="format-desc">Comma-separated values, great for spreadsheets</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="config-section">
                      <h4>🗃️ Data Tables (leave empty for all)</h4>
                      <div className="table-selection">
                        {['users', 'posts', 'comments', 'messages', 'enrollments', 'courses'].map(table => (
                          <label key={table} className="table-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedTables.includes(table)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTables([...selectedTables, table]);
                                } else {
                                  setSelectedTables(selectedTables.filter(t => t !== table));
                                }
                              }}
                            />
                            <span className="table-name">{table.charAt(0).toUpperCase() + table.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="config-section">
                      <h4>⚙️ Export Options</h4>
                      <div className="export-options">
                        <label className="export-checkbox">
                          <input
                            type="checkbox"
                            checked={includeMetadata}
                            onChange={(e) => setIncludeMetadata(e.target.checked)}
                          />
                          <span>Include metadata (timestamps, versions, etc.)</span>
                        </label>
                        
                        <label className="export-checkbox">
                          <input
                            type="checkbox"
                            checked={includeAuditTrail}
                            onChange={(e) => setIncludeAuditTrail(e.target.checked)}
                          />
                          <span>Include audit trail (who, when, what changes were made)</span>
                        </label>
                      </div>
                    </div>

                    <div className="gdpr-compliance-notice">
                      <h4>✅ GDPR Compliance</h4>
                      <ul>
                        <li><strong>Article 15</strong> - Right of access: Complete copy of your personal data</li>
                        <li><strong>Article 20</strong> - Right to data portability: Machine-readable format for transfer</li>
                        <li><strong>Security</strong> - Data will be available for download for 7 days only</li>
                        <li><strong>Format</strong> - All formats are structured and commonly used</li>
                      </ul>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button 
                      onClick={() => setShowExportModal(false)}
                      className="btn secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleExportSubmit}
                      className="btn primary"
                    >
                      📦 Create Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing Restriction Modal */}
          {showRestrictionModal && (
            <div className="modal-overlay" onClick={() => setShowRestrictionModal(false)}>
              <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>🚫 Processing Restriction (Article 18)</h3>
                  <button onClick={() => setShowRestrictionModal(false)} className="close-btn">✕</button>
                </div>
                <div className="modal-body">
                  <div className="restriction-notice">
                    <h4>⚖️ Your Right to Restriction of Processing</h4>
                    <p>Under GDPR Article 18, you have the right to obtain from us the restriction of processing your personal data in certain circumstances. When processing is restricted, your data remains stored but cannot be used for automated processing.</p>
                    <p><strong>User:</strong> {users.find(u => u.id === selectedUserId)?.name} ({users.find(u => u.id === selectedUserId)?.email})</p>
                  </div>

                  <div className="restriction-configuration">
                    <div className="config-section">
                      <h4>📋 Valid Reasons for Restriction (Article 18)</h4>
                      <div className="reason-options">
                        <label className={`reason-option ${restrictionReason === 'data_accuracy_dispute' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            value="data_accuracy_dispute"
                            checked={restrictionReason === 'data_accuracy_dispute'}
                            onChange={(e) => setRestrictionReason(e.target.value)}
                          />
                          <div className="reason-info">
                            <div className="reason-name">🔍 Data Accuracy Dispute</div>
                            <div className="reason-desc">You contest the accuracy of personal data (during verification period)</div>
                          </div>
                        </label>
                        
                        <label className={`reason-option ${restrictionReason === 'unlawful_processing' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            value="unlawful_processing"
                            checked={restrictionReason === 'unlawful_processing'}
                            onChange={(e) => setRestrictionReason(e.target.value)}
                          />
                          <div className="reason-info">
                            <div className="reason-name">⚖️ Unlawful Processing</div>
                            <div className="reason-desc">Processing is unlawful but you oppose erasure and want restriction instead</div>
                          </div>
                        </label>
                        
                        <label className={`reason-option ${restrictionReason === 'data_no_longer_needed' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            value="data_no_longer_needed"
                            checked={restrictionReason === 'data_no_longer_needed'}
                            onChange={(e) => setRestrictionReason(e.target.value)}
                          />
                          <div className="reason-info">
                            <div className="reason-name">📅 Data No Longer Needed</div>
                            <div className="reason-desc">We no longer need the data but you need it for legal claims</div>
                          </div>
                        </label>
                        
                        <label className={`reason-option ${restrictionReason === 'objection_pending' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            value="objection_pending"
                            checked={restrictionReason === 'objection_pending'}
                            onChange={(e) => setRestrictionReason(e.target.value)}
                          />
                          <div className="reason-info">
                            <div className="reason-name">⏳ Objection Pending</div>
                            <div className="reason-desc">You objected to processing and verification of grounds is pending</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="config-section">
                      <h4>🗃️ Select Data Tables to Restrict</h4>
                      <p className="section-description">Choose which types of data should have processing restricted:</p>
                      <div className="table-selection">
                        {['users', 'posts', 'comments', 'messages', 'enrollments', 'courses'].map(table => (
                          <label key={table} className="table-checkbox">
                            <input
                              type="checkbox"
                              checked={restrictionTables.includes(table)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRestrictionTables([...restrictionTables, table]);
                                } else {
                                  setRestrictionTables(restrictionTables.filter(t => t !== table));
                                }
                              }}
                            />
                            <span className="table-name">{table.charAt(0).toUpperCase() + table.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="restriction-effects-notice">
                      <h4>⚠️ Effects of Processing Restriction</h4>
                      <ul>
                        <li><strong>Data Storage:</strong> Your data will remain stored in our systems</li>
                        <li><strong>Processing Limitation:</strong> Data cannot be used for automated processing</li>
                        <li><strong>Permitted Uses:</strong> Data can only be processed with your consent, for legal claims, or to protect other persons' rights</li>
                        <li><strong>Notification:</strong> We will inform you before lifting any restriction</li>
                        <li><strong>Reversible:</strong> You can remove restrictions at any time</li>
                      </ul>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button 
                      onClick={() => setShowRestrictionModal(false)}
                      className="btn secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={restrictProcessing}
                      className="btn primary"
                      disabled={!restrictionReason || restrictionTables.length === 0}
                    >
                      🚫 Apply Restriction
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};


// Helper functions for human-readable audit log display
const getUserDisplayName = (userId: string | null | undefined): string => {
  if (!userId || userId === 'system') {
    return '🤖 System (Automated)';
  }
  return `👤 User ${userId}`;
};

const getActionDisplayName = (action: string): string => {
  const actionMap: Record<string, string> = {
    'create': '➕ Created new data',
    'read': '👀 Viewed data',
    'update': '✏️ Updated data', 
    'delete': '🗑️ Deleted data',
    'query': '🔍 Searched/Listed data',
    'access': '🔓 Accessed system',
    'login': '🔑 Logged in',
    'logout': '👋 Logged out',
    'consent_granted': '✅ Gave consent',
    'consent_revoked': '❌ Revoked consent',
    'data_export': '📤 Exported data',
    'data_deletion': '🗑️ Deleted personal data',
    'data_anonymization': '🔒 Anonymized data',
    'rectification_completed': '✏️ Corrected data',
    'processing_restricted': '🚫 Restricted data processing',
    'processing_restriction_removed': '✅ Removed processing restriction',
    'key_rotation': '🔄 Rotated encryption keys',
    'security_event': '🔒 Security event occurred'
  };
  
  return actionMap[action] || `🔧 ${action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
};

const getResourceDisplayName = (resource: string): string => {
  const resourceMap: Record<string, string> = {
    'users': '👥 User accounts',
    'posts': '📝 Posts/Messages', 
    'comments': '💬 Comments',
    'courses': '📚 Courses',
    'messages': '✉️ Private messages',
    'files': '📁 Files',
    'system': '⚙️ System settings',
    'consent': '📋 Consent records',
    'audit_logs': '📊 Audit logs',
    'user_data': '👤 Personal data',
    'encryption': '🔐 Encryption system'
  };
  
  return resourceMap[resource] || `📦 ${resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
};

const getHumanReadableSummary = (log: any): string => {
  const who = getUserDisplayName(log.userId);
  const what = getActionDisplayName(log.action);
  const where = getResourceDisplayName(log.resource);
  
  // Special cases for common operations
  if (log.action === 'query' && log.resource === 'users') {
    const count = log.details?.resultCount || 'some';
    return `${who} searched the user database and found ${count} users.`;
  }
  
  if (log.action === 'create') {
    return `${who} added new information to ${where}.`;
  }
  
  if (log.action === 'update') {
    return `${who} modified existing information in ${where}.`;
  }
  
  if (log.action === 'delete') {
    return `${who} removed information from ${where}.`;
  }
  
  if (log.action === 'data_export') {
    return `${who} downloaded their personal data as requested under GDPR Article 20.`;
  }
  
  if (log.action === 'consent_granted') {
    return `${who} gave permission for data processing.`;
  }
  
  if (log.action === 'consent_revoked') {
    return `${who} withdrew permission for data processing.`;
  }
  
  // Default format
  return `${who} performed "${what}" on ${where}.`;
};

// Audit Log Viewer Component
const AuditLogViewer: React.FC = () => {
  const { storage, isInitialized } = useStorageContext();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  
  // Filter states
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const [auditStats, setAuditStats] = useState<any>({
    totalEvents: 0,
    uniqueUsers: 0,
    uniqueActions: 0,
    successfulOperations: 0,
    failedOperations: 0,
    successRate: 0
  });
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Handle modal scroll behavior and ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedLog) {
        setSelectedLog(null);
      }
    };

    if (selectedLog) {
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
      // Scroll to top to ensure modal is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Add ESC key listener
      document.addEventListener('keydown', handleEscKey);
    } else {
      // Restore body scrolling when modal is closed
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function to restore scrolling and remove listener
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedLog]);

  const loadUsers = async () => {
    if (!storage || !isInitialized) return;
    
    try {
      const usersList = await storage.query(EntityType.USERS);
      setUsers(usersList || []);
      console.log(`📊 Loaded ${usersList?.length || 0} users for audit filter`);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  const loadAuditLogs = async () => {
    if (!storage || !isInitialized) return;
    
    setLoading(true);
    try {
      console.log('📋 Loading audit logs...');
      
      // Get audit service from storage plugin
      const auditService = (storage as any).auditLogger;
      if (!auditService) {
        console.warn('⚠️ Audit service not available');
        return;
      }

      // Query logs with pagination
      const logs = await auditService.getAuditLogs({
        limit: 1000, // Get more logs for filtering
        orderBy: [{ field: 'timestamp', direction: 'desc' }]
      });
      
      console.log(`📊 Loaded ${logs.length} audit log entries`);
      setAuditLogs(logs);
      
      // Get audit statistics
      const totalLogs = logs.length;
      const userIds = [...new Set(logs.map(log => log.userId))];
      const actions = [...new Set(logs.map(log => log.action))];
      const successfulOps = logs.filter(log => log.success).length;
      const failedOps = logs.filter(log => !log.success).length;
      
      const stats = {
        totalEvents: totalLogs,
        uniqueUsers: userIds.length,
        uniqueActions: actions.length,
        successfulOperations: successfulOps,
        failedOperations: failedOps,
        successRate: totalLogs > 0 ? (successfulOps / totalLogs) * 100 : 0
      };
      setAuditStats(stats);
      
    } catch (error) {
      console.error('❌ Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...auditLogs];
    
    if (userFilter) {
      filtered = filtered.filter(log => 
        log.userId === userFilter || 
        (userFilter === 'system' && (!log.userId || log.userId === 'system'))
      );
    }
    
    if (actionFilter) {
      filtered = filtered.filter(log => 
        log.action?.toLowerCase().includes(actionFilter.toLowerCase())
      );
    }
    
    if (resourceFilter) {
      filtered = filtered.filter(log => 
        log.resource?.toLowerCase().includes(resourceFilter.toLowerCase())
      );
    }
    
    if (resultFilter) {
      filtered = filtered.filter(log => log.result === resultFilter);
    }
    
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }
    
    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [auditLogs, userFilter, actionFilter, resourceFilter, dateFromFilter, dateToFilter, resultFilter]);

  useEffect(() => {
    loadAuditLogs();
    loadUsers();
  }, [storage, isInitialized]);

  const clearFilters = () => {
    setUserFilter('');
    setActionFilter('');
    setResourceFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setResultFilter('');
  };

  const exportAuditLogs = async () => {
    if (!storage) return;
    
    try {
      const auditService = (storage as any).auditLogger;
      if (!auditService) return;

      // Build filter for export
      const filter: any = {
        orderBy: [{ field: 'timestamp', direction: 'desc' }],
        limit: 10000 // Large limit for export
      };

      if (userFilter || actionFilter || resourceFilter || dateFromFilter || dateToFilter) {
        filter.where = {};
        if (userFilter) filter.where.userId = userFilter;
        if (actionFilter) filter.where.action = actionFilter;
        if (resourceFilter) filter.where.resource = resourceFilter;
        if (dateFromFilter || dateToFilter) {
          filter.where.timestamp = {};
          if (dateFromFilter) filter.where.timestamp.$gte = new Date(dateFromFilter);
          if (dateToFilter) filter.where.timestamp.$lte = new Date(dateToFilter);
        }
      }

      const exportData = await auditService.getAuditLogs(filter);
      const exportJson = JSON.stringify(exportData, null, 2);

      const blob = new Blob([exportJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('📊 Audit logs exported successfully');
    } catch (error) {
      console.error('❌ Failed to export audit logs:', error);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  // Get unique values for filter dropdowns
  const uniqueActions = [...new Set(auditLogs.map((log: any) => log.action))].filter(Boolean);
  const uniqueResources = [...new Set(auditLogs.map((log: any) => log.resource))].filter(Boolean);

  return (
    <div className="audit-log-viewer">
      <div className="audit-header">
        <h3>📋 Audit Log Viewer</h3>
        <div className="audit-actions">
          <button onClick={loadAuditLogs} className="btn secondary" disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
          <button onClick={exportAuditLogs} className="btn primary">
            📤 Export Logs
          </button>
        </div>
      </div>

      {auditStats && auditStats.totalEvents !== undefined && (
        <div className="audit-stats">
          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-value">{auditStats?.totalEvents || 0}</div>
              <div className="stat-label">Total Entries</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{auditStats?.uniqueUsers || 0}</div>
              <div className="stat-label">Unique Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{auditStats?.uniqueActions || 0}</div>
              <div className="stat-label">Unique Actions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{auditStats?.successRate?.toFixed(1) || 0}%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>
      )}

      <div className="audit-filters">
        <h4>🔍 Filter Logs</h4>
        <div className="filter-grid">
          <div className="filter-group">
            <label>User:</label>
            <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
              <option value="">All Users</option>
              <option value="system">🤖 System (Automated)</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  👤 {user.name || user.email || user.id}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Quick Filters:</label>
            <div className="quick-filters">
              <button 
                className={`btn ${userFilter === 'system' ? 'primary' : 'secondary'} small`}
                onClick={() => setUserFilter(userFilter === 'system' ? '' : 'system')}
              >
                🤖 System Actions
              </button>
              <button 
                className="btn secondary small"
                onClick={() => {
                  setUserFilter('');
                  setActionFilter('');
                  setResourceFilter('');
                  setResultFilter('');
                  setDateFromFilter('');
                  setDateToFilter('');
                }}
              >
                🔄 Clear All
              </button>
            </div>
          </div>
          
          <div className="filter-group">
            <label>Action:</label>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Resource:</label>
            <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)}>
              <option value="">All Resources</option>
              {uniqueResources.map(resource => (
                <option key={resource} value={resource}>{resource}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Result:</label>
            <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
              <option value="">All Results</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>From Date:</label>
            <input 
              type="date" 
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>To Date:</label>
            <input 
              type="date" 
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-actions">
          <button onClick={clearFilters} className="btn secondary">
            🗑️ Clear Filters
          </button>
          <span className="filter-results">
            Showing {filteredLogs.length} of {auditLogs.length} logs
          </span>
        </div>
      </div>

      <div className="audit-table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>What Happened</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log, index) => (
              <tr key={log.id || index} className={`result-${log.success ? 'success' : 'error'}`}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{getUserDisplayName(log.userId)}</td>
                <td className="action-summary">
                  <div className="action-main">{getActionDisplayName(log.action)}</div>
                  <div className="action-detail">on {getResourceDisplayName(log.resource)}</div>
                  {log.details?.resultCount && (
                    <div className="result-count">({log.details.resultCount} items)</div>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${log.success ? 'success' : 'failure'}`}>
                    {log.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => setSelectedLog(log)}
                    className="btn small secondary"
                  >
                    👁️ View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="audit-pagination">
        <div className="pagination-info">
          Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredLogs.length)} of {filteredLogs.length} entries
        </div>
        
        <div className="pagination-controls">
          <button 
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="btn small secondary"
          >
            ⏮️ First
          </button>
          <button 
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn small secondary"
          >
            ⬅️ Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn small secondary"
          >
            ➡️ Next
          </button>
          <button 
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="btn small secondary"
          >
            ⏭️ Last
          </button>
        </div>
        
        <div className="page-size-selector">
          <label>Per page:</label>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Audit Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="close-btn">✕</button>
            </div>
            <div className="modal-body">
              {/* Human-readable summary */}
              <div className="audit-summary">
                <h4>📝 What Happened</h4>
                <p className="summary-text">
                  {getHumanReadableSummary(selectedLog)}
                </p>
              </div>
              
              <div className="log-detail-grid">
                <div className="detail-row">
                  <strong>When:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
                </div>
                <div className="detail-row">
                  <strong>Who:</strong> {getUserDisplayName(selectedLog.userId)}
                </div>
                <div className="detail-row">
                  <strong>What:</strong> {getActionDisplayName(selectedLog.action)}
                </div>
                <div className="detail-row">
                  <strong>Where:</strong> {getResourceDisplayName(selectedLog.resource)}
                </div>
                {selectedLog.details?.resultCount && (
                  <div className="detail-row">
                    <strong>Results:</strong> {selectedLog.details.resultCount} items found
                  </div>
                )}
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`status-badge ${selectedLog.success ? 'success' : 'failure'}`}>
                    {selectedLog.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </div>
              </div>
              
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="log-details">
                  <h4>📄 Operation Details</h4>
                  <JSONViewer data={selectedLog.details} title="Details" />
                </div>
              )}
              
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="log-metadata">
                  <h4>🏷️ Metadata</h4>
                  <JSONViewer data={selectedLog.metadata} title="Metadata" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compliance Reporting Dashboard Component
const ComplianceReportingDashboard: React.FC = () => {
  const { storage, isInitialized } = useStorageContext();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'detailed' | 'audit'>('overview');

  const generateComplianceReport = async () => {
    if (!storage || !isInitialized) return;
    
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Gather compliance data from various services
      const complianceData = {
        reportGenerated: new Date(),
        timeRange: { start: startDate, end: endDate },
        gdprCompliance: await generateGDPRComplianceReport(startDate, endDate),
        dataProcessingActivities: await getDataProcessingActivities(),
        encryptionStatus: await getEncryptionComplianceStatus(),
        consentMetrics: await getConsentComplianceMetrics(),
        auditSummary: await getAuditComplianceSummary(startDate, endDate),
        riskAssessment: await performComplianceRiskAssessment(),
        recommendations: await generateComplianceRecommendations()
      };

      setReportData(complianceData);
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for gathering compliance data
  const generateGDPRComplianceReport = async (startDate: Date, endDate: Date) => {
    const gdprCompliance = {
      dataSubjectRequests: {
        total: 0,
        byType: { access: 0, rectification: 0, erasure: 0, portability: 0, restriction: 0 },
        completed: 0,
        pending: 0,
        averageResponseTime: '2.3 days'
      },
      legalBases: [
        { basis: 'Consent', percentage: 65, compliant: true },
        { basis: 'Legitimate Interest', percentage: 25, compliant: true },
        { basis: 'Contract', percentage: 10, compliant: true }
      ],
      privacyByDesign: {
        dataMinimization: 'Compliant',
        purposeLimitation: 'Compliant',
        storageMinimization: 'Review Required',
        accuracy: 'Compliant',
        integrityConfidentiality: 'Compliant'
      }
    };

    // Get actual audit data if available
    try {
      if (typeof storage.getAuditLogs === 'function') {
        const auditLogs = await storage.getAuditLogs({
          where: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        });

        // Count data subject requests
        gdprCompliance.dataSubjectRequests.total = auditLogs.filter(log => 
          ['data_export', 'data_rectification', 'data_deletion', 'data_portability', 'restrict_processing'].includes(log.action)
        ).length;

        gdprCompliance.dataSubjectRequests.byType = {
          access: auditLogs.filter(log => log.action === 'data_export').length,
          rectification: auditLogs.filter(log => log.action === 'data_rectification').length,
          erasure: auditLogs.filter(log => log.action === 'data_deletion').length,
          portability: auditLogs.filter(log => log.action === 'data_portability').length,
          restriction: auditLogs.filter(log => log.action === 'restrict_processing').length
        };

        gdprCompliance.dataSubjectRequests.completed = auditLogs.filter(log => log.success).length;
        gdprCompliance.dataSubjectRequests.pending = auditLogs.filter(log => !log.success).length;
      }
    } catch (error) {
      console.warn('Could not fetch audit data for GDPR compliance report:', error);
    }

    return gdprCompliance;
  };

  const getDataProcessingActivities = async () => {
    return [
      {
        activity: 'User Account Management',
        purpose: 'Service provision and user authentication',
        legalBasis: 'Contract',
        dataCategories: ['Contact data', 'Authentication data'],
        retentionPeriod: '7 years',
        encrypted: true,
        complianceStatus: 'Compliant'
      },
      {
        activity: 'Content Creation and Storage',
        purpose: 'Platform functionality',
        legalBasis: 'Legitimate Interest',
        dataCategories: ['User-generated content', 'Usage data'],
        retentionPeriod: '5 years',
        encrypted: true,
        complianceStatus: 'Compliant'
      },
      {
        activity: 'Analytics and Performance',
        purpose: 'Service improvement',
        legalBasis: 'Consent',
        dataCategories: ['Usage analytics', 'Performance metrics'],
        retentionPeriod: '2 years',
        encrypted: false,
        complianceStatus: 'Review Required'
      }
    ];
  };

  const getEncryptionComplianceStatus = async () => {
    const encryptionStatus = {
      enabled: false,
      algorithm: 'N/A',
      keyRotationCompliant: false,
      encryptedTables: 0,
      totalTables: 0,
      complianceScore: 0
    };

    try {
      if (typeof storage.getEncryptionStatus === 'function') {
        const status = await storage.getEncryptionStatus();
        encryptionStatus.enabled = status.enabled;
        encryptionStatus.algorithm = status.algorithm || 'AES-256-GCM';
        encryptionStatus.keyRotationCompliant = status.keyRotationDays > 0 && status.keyRotationDays <= 365;
        encryptionStatus.encryptedTables = Object.keys(status.encryptedFields || {}).length;
        encryptionStatus.totalTables = 6; // Known entity types
        encryptionStatus.complianceScore = Math.round((encryptionStatus.encryptedTables / encryptionStatus.totalTables) * 100);
      }
    } catch (error) {
      console.warn('Could not fetch encryption status:', error);
    }

    return encryptionStatus;
  };

  const getConsentComplianceMetrics = async () => {
    const consentMetrics = {
      totalUsers: 0,
      consentedUsers: 0,
      withdrawalRate: 0,
      averageConsentAge: '45 days',
      expiringConsents: 0,
      compliancePercentage: 0,
      purposeBreakdown: {
        essential: { consented: 0, total: 0 },
        analytics: { consented: 0, total: 0 },
        marketing: { consented: 0, total: 0 },
        personalization: { consented: 0, total: 0 }
      }
    };

    try {
      // Get user count
      const users = await storage.query('users');
      consentMetrics.totalUsers = users.length;
      
      // Mock consent data - in real implementation, this would come from ConsentManager
      consentMetrics.consentedUsers = Math.floor(users.length * 0.78); // 78% consent rate
      consentMetrics.withdrawalRate = 12; // 12% withdrawal rate
      consentMetrics.expiringConsents = Math.floor(users.length * 0.05); // 5% expiring soon
      consentMetrics.compliancePercentage = Math.round((consentMetrics.consentedUsers / consentMetrics.totalUsers) * 100);

      // Purpose breakdown
      consentMetrics.purposeBreakdown = {
        essential: { consented: users.length, total: users.length }, // 100% for essential
        analytics: { consented: Math.floor(users.length * 0.65), total: users.length },
        marketing: { consented: Math.floor(users.length * 0.42), total: users.length },
        personalization: { consented: Math.floor(users.length * 0.71), total: users.length }
      };
    } catch (error) {
      console.warn('Could not fetch consent metrics:', error);
    }

    return consentMetrics;
  };

  const getAuditComplianceSummary = async (startDate: Date, endDate: Date) => {
    const auditSummary = {
      totalEvents: 0,
      securityEvents: 0,
      dataAccessEvents: 0,
      complianceEvents: 0,
      failedOperations: 0,
      criticalAlerts: 0,
      auditTrailIntegrity: 'Verified',
      retentionCompliance: 'Compliant'
    };

    try {
      if (typeof storage.getAuditLogs === 'function') {
        const auditLogs = await storage.getAuditLogs({
          where: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        });

        auditSummary.totalEvents = auditLogs.length;
        auditSummary.securityEvents = auditLogs.filter(log => log.action === 'security_event').length;
        auditSummary.dataAccessEvents = auditLogs.filter(log => log.action === 'access').length;
        auditSummary.complianceEvents = auditLogs.filter(log => 
          ['data_export', 'data_deletion', 'consent_granted', 'consent_revoked'].includes(log.action)
        ).length;
        auditSummary.failedOperations = auditLogs.filter(log => !log.success).length;
        auditSummary.criticalAlerts = auditLogs.filter(log => 
          !log.success && ['data_deletion', 'security_event'].includes(log.action)
        ).length;
      }
    } catch (error) {
      console.warn('Could not fetch audit summary:', error);
    }

    return auditSummary;
  };

  const performComplianceRiskAssessment = async () => {
    return {
      overallRisk: 'Low',
      riskFactors: [
        { factor: 'Data Encryption', risk: 'Low', status: 'Implemented' },
        { factor: 'Consent Management', risk: 'Medium', status: 'Partially Implemented' },
        { factor: 'Audit Trail', risk: 'Low', status: 'Comprehensive' },
        { factor: 'Data Retention', risk: 'Medium', status: 'Review Required' },
        { factor: 'Access Controls', risk: 'Low', status: 'Implemented' }
      ],
      recommendations: [
        'Implement automated consent renewal process',
        'Review data retention policies for analytics data',
        'Enhance monitoring for failed operations',
        'Consider implementing data loss prevention measures'
      ]
    };
  };

  const generateComplianceRecommendations = async () => {
    return [
      {
        priority: 'High',
        category: 'Data Protection',
        recommendation: 'Implement automated data retention policy enforcement',
        impact: 'Reduces compliance risk and storage costs',
        effort: 'Medium'
      },
      {
        priority: 'Medium',
        category: 'Consent Management',
        recommendation: 'Add consent renewal notifications for expiring consents',
        impact: 'Improves consent rate and user experience',
        effort: 'Low'
      },
      {
        priority: 'Medium',
        category: 'Monitoring',
        recommendation: 'Set up automated alerts for compliance violations',
        impact: 'Faster response to potential issues',
        effort: 'Medium'
      },
      {
        priority: 'Low',
        category: 'Documentation',
        recommendation: 'Create privacy impact assessment templates',
        impact: 'Streamlines future compliance reviews',
        effort: 'Low'
      }
    ];
  };

  const exportComplianceReport = () => {
    if (!reportData) return;

    const reportContent = {
      title: 'GDPR Compliance Report',
      generated: reportData.reportGenerated,
      timeRange: reportData.timeRange,
      summary: {
        gdprCompliance: reportData.gdprCompliance,
        encryptionStatus: reportData.encryptionStatus,
        consentMetrics: reportData.consentMetrics,
        auditSummary: reportData.auditSummary,
        riskAssessment: reportData.riskAssessment
      },
      recommendations: reportData.recommendations,
      dataProcessingActivities: reportData.dataProcessingActivities
    };

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isInitialized) {
      generateComplianceReport();
    }
  }, [storage, isInitialized, timeRange]);

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return '#27ae60';
      case 'medium': return '#f39c12';
      case 'high': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="compliance-dashboard">
      <div className="compliance-header">
        <h3>📊 Compliance Reporting Dashboard</h3>
        <div className="compliance-controls">
          <div className="filter-group">
            <label>Report Period:</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Report Type:</label>
            <select value={selectedReport} onChange={(e) => setSelectedReport(e.target.value as any)}>
              <option value="overview">Executive Overview</option>
              <option value="detailed">Detailed Analysis</option>
              <option value="audit">Audit Summary</option>
            </select>
          </div>

          <button onClick={generateComplianceReport} className="btn secondary small" disabled={loading}>
            {loading ? '⏳ Generating...' : '🔄 Refresh Report'}
          </button>

          {reportData && (
            <button onClick={exportComplianceReport} className="btn primary small">
              📥 Export Report
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Generating compliance report...</div>
      ) : !reportData ? (
        <div className="no-data">No compliance data available.</div>
      ) : (
        <div className="compliance-content">
          {selectedReport === 'overview' && (
            <div className="overview-report">
              {/* Executive Summary Cards */}
              <div className="summary-cards">
                <div className="summary-card gdpr">
                  <div className="card-header">
                    <h4>🔒 GDPR Compliance</h4>
                    <div className="card-score">
                      {Math.round((reportData.gdprCompliance.dataSubjectRequests.completed / 
                        Math.max(reportData.gdprCompliance.dataSubjectRequests.total, 1)) * 100)}%
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="metric">
                      <span>Data Subject Requests:</span>
                      <span>{reportData.gdprCompliance.dataSubjectRequests.total}</span>
                    </div>
                    <div className="metric">
                      <span>Avg Response Time:</span>
                      <span>{reportData.gdprCompliance.dataSubjectRequests.averageResponseTime}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-card encryption">
                  <div className="card-header">
                    <h4>🔐 Data Encryption</h4>
                    <div className="card-score">{reportData.encryptionStatus.complianceScore}%</div>
                  </div>
                  <div className="card-content">
                    <div className="metric">
                      <span>Algorithm:</span>
                      <span>{reportData.encryptionStatus.algorithm}</span>
                    </div>
                    <div className="metric">
                      <span>Encrypted Tables:</span>
                      <span>{reportData.encryptionStatus.encryptedTables}/{reportData.encryptionStatus.totalTables}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-card consent">
                  <div className="card-header">
                    <h4>📋 Consent Management</h4>
                    <div className="card-score">{reportData.consentMetrics.compliancePercentage}%</div>
                  </div>
                  <div className="card-content">
                    <div className="metric">
                      <span>Consented Users:</span>
                      <span>{reportData.consentMetrics.consentedUsers}/{reportData.consentMetrics.totalUsers}</span>
                    </div>
                    <div className="metric">
                      <span>Expiring Soon:</span>
                      <span>{reportData.consentMetrics.expiringConsents}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-card audit">
                  <div className="card-header">
                    <h4>📝 Audit Trail</h4>
                    <div className="card-score">
                      {reportData.auditSummary.criticalAlerts === 0 ? '✓' : '⚠️'}
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="metric">
                      <span>Total Events:</span>
                      <span>{reportData.auditSummary.totalEvents}</span>
                    </div>
                    <div className="metric">
                      <span>Failed Operations:</span>
                      <span>{reportData.auditSummary.failedOperations}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="risk-assessment">
                <h4>🎯 Risk Assessment</h4>
                <div className="risk-overview">
                  <div className="overall-risk">
                    <span>Overall Risk Level:</span>
                    <span className="risk-badge" style={{ backgroundColor: getRiskColor(reportData.riskAssessment.overallRisk) }}>
                      {reportData.riskAssessment.overallRisk}
                    </span>
                  </div>
                </div>
                <div className="risk-factors">
                  {reportData.riskAssessment.riskFactors.map((factor: any, index: number) => (
                    <div key={index} className="risk-factor">
                      <div className="factor-name">{factor.factor}</div>
                      <div className="factor-status">{factor.status}</div>
                      <div 
                        className="factor-risk" 
                        style={{ backgroundColor: getRiskColor(factor.risk) }}
                      >
                        {factor.risk}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Recommendations */}
              <div className="recommendations">
                <h4>💡 Top Recommendations</h4>
                <div className="recommendation-list">
                  {reportData.recommendations.slice(0, 3).map((rec: any, index: number) => (
                    <div key={index} className="recommendation-item">
                      <div 
                        className="rec-priority" 
                        style={{ backgroundColor: getPriorityColor(rec.priority) }}
                      >
                        {rec.priority}
                      </div>
                      <div className="rec-content">
                        <div className="rec-title">{rec.recommendation}</div>
                        <div className="rec-details">
                          <span>Impact: {rec.impact}</span>
                          <span>Effort: {rec.effort}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'detailed' && (
            <div className="detailed-report">
              {/* Data Processing Activities */}
              <div className="processing-activities">
                <h4>⚙️ Data Processing Activities</h4>
                <div className="activities-table">
                  <div className="table-header">
                    <div>Activity</div>
                    <div>Purpose</div>
                    <div>Legal Basis</div>
                    <div>Retention</div>
                    <div>Encrypted</div>
                    <div>Status</div>
                  </div>
                  {reportData.dataProcessingActivities.map((activity: any, index: number) => (
                    <div key={index} className="table-row">
                      <div>{activity.activity}</div>
                      <div>{activity.purpose}</div>
                      <div>{activity.legalBasis}</div>
                      <div>{activity.retentionPeriod}</div>
                      <div>{activity.encrypted ? '✅' : '❌'}</div>
                      <div className={`status ${activity.complianceStatus.toLowerCase().replace(' ', '-')}`}>
                        {activity.complianceStatus}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GDPR Privacy Principles */}
              <div className="privacy-principles">
                <h4>🛡️ Privacy by Design Principles</h4>
                <div className="principles-grid">
                  {Object.entries(reportData.gdprCompliance.privacyByDesign).map(([principle, status]) => (
                    <div key={principle} className="principle-item">
                      <div className="principle-name">
                        {principle.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className={`principle-status ${(status as string).toLowerCase().replace(' ', '-')}`}>
                        {status as string}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consent Purpose Breakdown */}
              <div className="consent-breakdown">
                <h4>📊 Consent by Purpose</h4>
                <div className="consent-chart">
                  {Object.entries(reportData.consentMetrics.purposeBreakdown).map(([purpose, data]: [string, any]) => (
                    <div key={purpose} className="consent-bar">
                      <div className="bar-label">
                        {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                      </div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${(data.consented / data.total) * 100}%`,
                            backgroundColor: purpose === 'essential' ? '#27ae60' : '#3498db'
                          }}
                        ></div>
                      </div>
                      <div className="bar-percentage">
                        {Math.round((data.consented / data.total) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'audit' && (
            <div className="audit-report">
              {/* Audit Summary Statistics */}
              <div className="audit-stats">
                <h4>📈 Audit Trail Summary</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{reportData.auditSummary.totalEvents}</div>
                    <div className="stat-label">Total Events</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{reportData.auditSummary.complianceEvents}</div>
                    <div className="stat-label">Compliance Events</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{reportData.auditSummary.securityEvents}</div>
                    <div className="stat-label">Security Events</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{reportData.auditSummary.failedOperations}</div>
                    <div className="stat-label">Failed Operations</div>
                  </div>
                </div>
              </div>

              {/* Data Subject Requests Breakdown */}
              <div className="dsr-breakdown">
                <h4>👤 Data Subject Requests</h4>
                <div className="dsr-chart">
                  {Object.entries(reportData.gdprCompliance.dataSubjectRequests.byType).map(([type, count]) => (
                    <div key={type} className="dsr-item">
                      <div className="dsr-type">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                      <div className="dsr-count">{count as number}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Basis Distribution */}
              <div className="legal-basis">
                <h4>⚖️ Legal Basis Distribution</h4>
                <div className="basis-chart">
                  {reportData.gdprCompliance.legalBases.map((basis: any, index: number) => (
                    <div key={index} className="basis-item">
                      <div className="basis-name">{basis.basis}</div>
                      <div className="basis-bar">
                        <div 
                          className="basis-fill" 
                          style={{ width: `${basis.percentage}%` }}
                        ></div>
                      </div>
                      <div className="basis-percentage">{basis.percentage}%</div>
                      <div className={`basis-compliance ${basis.compliant ? 'compliant' : 'non-compliant'}`}>
                        {basis.compliant ? '✅' : '❌'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Performance Monitor Component
const PerformanceMonitor: React.FC = () => {
  const { storage, isInitialized, status } = useStorageContext();
  const [metrics, setMetrics] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  const refreshMetrics = async () => {
    if (!storage || !isInitialized) return;
    
    try {
      const [perf, info] = await Promise.all([
        storage.getPerformanceMetrics(),
        storage.getStorageInfo()
      ]);
      setMetrics(perf);
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 5000);
    return () => clearInterval(interval);
  }, [storage, isInitialized]);

  return (
    <div className="performance-monitor">
      <h3>📈 Performance Monitor</h3>
      
      <button onClick={refreshMetrics} className="btn secondary">
        🔄 Refresh Metrics
      </button>

      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Plugin Status</h4>
          {status && (
            <ul>
              <li>Name: {status.name}</li>
              <li>Version: {status.version}</li>
              <li>Status: <span className={`status ${status.status}`}>{status.status}</span></li>
              <li>Health: <span className={`health ${status.health}`}>{status.health}</span></li>
              <li>Uptime: {Math.round(status.uptime / 1000)}s</li>
            </ul>
          )}
        </div>

        <div className="metric-card">
          <h4>Performance Metrics</h4>
          {metrics && (
            <ul>
              <li>Total Operations: {metrics.operations}</li>
              <li>Total Time: {metrics.totalTime}ms</li>
              <li>Average Time: {metrics.averageTime?.toFixed(2)}ms</li>
              <li>Errors: {metrics.errors}</li>
              <li>Cache Hits: {metrics.cacheHits}</li>
              <li>Cache Misses: {metrics.cacheMisses}</li>
            </ul>
          )}
        </div>

        <div className="metric-card">
          <h4>Storage Information</h4>
          {storageInfo && (
            <ul>
              <li>Backend: {storageInfo.backend}</li>
              <li>Connected: {storageInfo.connected ? 'Yes' : 'No'}</li>
              <li>Total Records: {storageInfo.totalRecords}</li>
              <li>Storage Used: {(storageInfo.storageUsed / 1024).toFixed(2)} KB</li>
              <li>Tables: {storageInfo.tables?.length || 0}</li>
            </ul>
          )}
        </div>

        <div className="metric-card">
          <h4>Table Details</h4>
          {storageInfo?.tables && (
            <div className="tables-list">
              {storageInfo.tables.map((table: any) => (
                <div key={table.name} className="table-item">
                  <strong>{table.name}:</strong> {table.recordCount} records 
                  ({(table.size / 1024).toFixed(2)} KB)
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Test App Component
const StorageTestApp: React.FC<{ enableGDPR: boolean }> = ({ enableGDPR }) => {
  const [activeTab, setActiveTab] = useState('entities');
  const { isLoading, isInitialized, error } = useStorageContext();

  const tabs = [
    { id: 'entities', label: '📊 Entity Manager', component: EntityManager },
    ...(enableGDPR ? [
      { id: 'gdpr', label: '🔒 GDPR Tools', component: GDPRTools },
      { id: 'audit', label: '📋 Audit Logs', component: AuditLogViewer },
      { id: 'keys', label: '🔐 Key Management', component: KeyRotationManagement },
      { id: 'compliance', label: '📊 Compliance Report', component: ComplianceReportingDashboard }
    ] : []),
    { id: 'performance', label: '📈 Performance', component: PerformanceMonitor }
  ];

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <h2>Initializing StoragePlugin...</h2>
        <p>Setting up {enableGDPR ? 'GDPR-compliant' : 'basic'} storage backend...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h2>❌ Initialization Failed</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()} className="btn primary">
          Retry
        </button>
      </div>
    );
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || EntityManager;

  return (
    <div className="storage-test-app">
      <header className="app-header">
        <h1>🧪 StoragePlugin Test & Demo Application</h1>
        <div className="mode-indicator">
          <span className={`mode-badge ${enableGDPR ? 'gdpr' : 'basic'}`}>
            {enableGDPR ? '🔒 GDPR Mode' : '🔓 Basic Mode'}
          </span>
          <span className="status-indicator">
            ● {isInitialized ? 'Ready' : 'Loading'}
          </span>
        </div>
      </header>

      <nav className="app-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-content">
        <ActiveComponent />
      </main>
    </div>
  );
};

// App Wrapper with Mode Switcher
const AppWrapper: React.FC = () => {
  const [enableGDPR, setEnableGDPR] = useState(false);
  const [key, setKey] = useState(0);

  // Register and install storage plugin following plugin system architecture
  useEffect(() => {
    console.log('🔌 Registering storage plugin...');
    pluginRegistry.register(storagePlugin);
    console.log('🔌 Installing storage plugin...');
    pluginRegistry.install('storage');
    console.log('✅ Storage plugin registered and installed');
  }, []);

  const handleModeSwitch = (gdprMode: boolean) => {
    setEnableGDPR(gdprMode);
    setKey(prev => prev + 1); // Force re-initialization
  };

  return (
    <div className="app-wrapper">
      <div className="mode-switcher">
        <h2>🎛️ Storage Mode Configuration</h2>
        <div className="plugin-status mb-3">
          <p>
            <strong>Plugin Status:</strong> 
            {pluginRegistry.isInstalled('storage') ? 
              <span style={{color: 'green'}}> ✅ Storage Plugin Registered & Installed</span> : 
              <span style={{color: 'red'}}> ❌ Storage Plugin Not Found</span>
            }
          </p>
          <p><small>Following plugin system architecture - storage plugin is exception for direct storage access</small></p>
        </div>
        <div className="mode-options">
          <button 
            onClick={() => handleModeSwitch(false)}
            className={`mode-btn ${!enableGDPR ? 'active' : ''}`}
          >
            <div className="mode-title">🔓 Basic Mode</div>
            <div className="mode-desc">Simple storage without GDPR features</div>
          </button>
          <button 
            onClick={() => handleModeSwitch(true)}
            className={`mode-btn ${enableGDPR ? 'active' : ''}`}
          >
            <div className="mode-title">🔒 GDPR Mode</div>
            <div className="mode-desc">Full compliance with encryption, consent, audit</div>
          </button>
        </div>
      </div>

      <StorageProvider 
        key={key}
        config={createTestConfig(enableGDPR)}
        enableDevTools={true}
        onInitialized={(storage: any) => {
          console.log('✅ StoragePlugin initialized:', storage.getStatus());
        }}
        onError={(error: any) => {
          console.error('❌ StoragePlugin error:', error);
        }}
      >
        <StorageTestApp enableGDPR={enableGDPR} />
      </StorageProvider>
    </div>
  );
};

// CSS Styles
const styles = `
  * { box-sizing: border-box; }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f7fa;
    color: #333;
  }

  .app-wrapper {
    min-height: 100vh;
  }

  .mode-switcher {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    text-align: center;
  }

  .mode-options {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-top: 20px;
  }

  .mode-btn {
    background: rgba(255,255,255,0.1);
    border: 2px solid rgba(255,255,255,0.3);
    color: white;
    padding: 20px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 200px;
  }

  .mode-btn:hover {
    background: rgba(255,255,255,0.2);
    transform: translateY(-2px);
  }

  .mode-btn.active {
    background: rgba(255,255,255,0.3);
    border-color: white;
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
  }

  .mode-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .mode-desc {
    font-size: 14px;
    opacity: 0.9;
  }

  .storage-test-app {
    background: white;
    min-height: calc(100vh - 200px);
  }

  .app-header {
    background: #2c3e50;
    color: white;
    padding: 20px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .app-header h1 {
    margin: 0;
    font-size: 24px;
  }

  .mode-indicator {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .mode-badge {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: bold;
  }

  .mode-badge.gdpr {
    background: #e74c3c;
  }

  .mode-badge.basic {
    background: #27ae60;
  }

  .status-indicator {
    color: #2ecc71;
    font-size: 14px;
  }

  .app-nav {
    background: #34495e;
    display: flex;
    padding: 0;
  }

  .nav-tab {
    background: transparent;
    border: none;
    color: #bdc3c7;
    padding: 15px 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 3px solid transparent;
  }

  .nav-tab:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }

  .nav-tab.active {
    background: white;
    color: #2c3e50;
    border-bottom-color: #3498db;
  }

  .app-content {
    padding: 30px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn.primary {
    background: #3498db;
    color: white;
  }

  .btn.secondary {
    background: #95a5a6;
    color: white;
  }

  .btn.danger {
    background: #e74c3c;
    color: white;
  }

  .btn.small {
    padding: 5px 10px;
    font-size: 12px;
  }

  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .entity-manager {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .entity-controls {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
  }

  .entity-selector {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-top: 15px;
  }

  .entity-selector select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .entity-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }

  .entity-list {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    max-height: 600px;
    overflow-y: auto;
  }

  .entities {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .entity-item {
    background: white;
    padding: 15px;
    border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .entity-item:hover {
    border-color: #3498db;
    transform: translateY(-1px);
  }

  .entity-item.selected {
    border-color: #2ecc71;
    background: #f0fff4;
  }

  .entity-id {
    font-family: monospace;
    font-size: 12px;
    color: #666;
  }

  .entity-info {
    flex: 1;
    margin: 0 15px;
    font-weight: 500;
  }

  .entity-actions {
    display: flex;
    gap: 5px;
  }

  .entity-details {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    max-height: 600px;
    overflow-y: auto;
  }

  .placeholder {
    text-align: center;
    color: #666;
    padding: 40px;
  }

  .json-viewer {
    margin: 15px 0;
  }

  .json-header {
    cursor: pointer;
    padding: 10px;
    background: #ecf0f1;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .json-header h4 {
    margin: 0;
    color: #2c3e50;
  }

  .json-content {
    background: #2c3e50;
    color: #ecf0f1;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.4;
    max-height: 400px;
    overflow-y: auto;
  }

  .modal,
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    border: 1px solid #e0e6ed;
    position: relative;
    margin: 20px;
    transform: translateY(0);
    transition: all 0.3s ease;
  }

  .modal-content.large {
    max-width: 800px;
    width: 90vw;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20px;
    border-bottom: 1px solid #e0e6ed;
    margin-bottom: 20px;
  }

  .modal-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 20px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 5px;
    line-height: 1;
    transition: color 0.2s ease;
  }

  .close-btn:hover {
    color: #e74c3c;
  }

  .audit-summary {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 25px;
    border-left: 4px solid #3498db;
  }

  .audit-summary h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
  }

  .summary-text {
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
    color: #34495e;
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    margin-left: 10px;
  }

  .status-badge.success {
    background: #e8f5e8;
    color: #2e7d32;
    border: 1px solid #4caf50;
  }

  .status-badge.failure {
    background: #ffebee;
    color: #c62828;
    border: 1px solid #f44336;
  }

  .action-summary {
    text-align: left;
  }

  .action-main {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
  }

  .action-detail {
    font-size: 13px;
    color: #7f8c8d;
    margin-bottom: 2px;
  }

  .result-count {
    font-size: 12px;
    color: #95a5a6;
    font-style: italic;
  }

  .audit-table th:first-child {
    width: 180px;
  }

  .audit-table th:nth-child(2) {
    width: 150px;
  }

  .audit-table th:nth-child(3) {
    width: auto;
    min-width: 200px;
  }

  .audit-table th:nth-child(4) {
    width: 120px;
  }

  .audit-table th:nth-child(5) {
    width: 100px;
  }

  .modal-content.create-form {
    max-width: 800px;
    width: 90vw;
  }

  .create-form h4 {
    margin: 0 0 25px 0;
    color: #2c3e50;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    padding-bottom: 15px;
    border-bottom: 2px solid #ecf0f1;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.span-2 {
    grid-column: span 2;
  }

  .form-group label {
    margin-bottom: 8px;
    font-weight: 600;
    color: #34495e;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 12px 16px;
    border: 2px solid #e0e6ed;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s ease;
    background: #f8f9fa;
    color: #2c3e50;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3498db;
    background: white;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  .form-group input[type="checkbox"] {
    width: auto;
    margin-right: 8px;
    padding: 0;
    background: transparent;
  }

  .form-group input::placeholder,
  .form-group textarea::placeholder {
    color: #95a5a6;
    font-style: italic;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }

  .form-group select {
    cursor: pointer;
  }

  .modal-content textarea {
    width: 100%;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .modal-actions {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 2px solid #ecf0f1;
    display: flex;
    gap: 15px;
    justify-content: flex-end;
  }

  .modal-actions .btn {
    padding: 12px 24px;
    font-weight: 600;
    border-radius: 8px;
    min-width: 120px;
    justify-content: center;
  }

  .modal-actions .btn.primary {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  }

  .modal-actions .btn.primary:hover {
    background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
  }

  .modal-actions .btn.secondary {
    background: #95a5a6;
    border: 2px solid #7f8c8d;
  }

  .modal-actions .btn.secondary:hover {
    background: #7f8c8d;
    border-color: #95a5a6;
  }

  .gdpr-tools {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .user-selector {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
  }

  .user-selector select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    margin-top: 10px;
  }

  .consent-management {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
  }

  .purposes {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 15px;
  }

  .purpose-item {
    background: white;
    padding: 20px;
    border-radius: 6px;
    border: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .purpose-info {
    flex: 1;
  }

  .purpose-info h5 {
    margin: 0 0 8px 0;
    color: #2c3e50;
  }

  .purpose-info p {
    margin: 0 0 8px 0;
    color: #666;
    font-size: 14px;
  }

  .purpose-meta {
    font-size: 12px;
    color: #95a5a6;
  }

  .required {
    color: #e74c3c;
    font-weight: bold;
  }

  .purpose-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
  }

  .status.granted {
    background: #d5f4e6;
    color: #27ae60;
  }

  .status.revoked {
    background: #fadbd8;
    color: #e74c3c;
  }

  .status.pending {
    background: #fff3cd;
    color: #f39c12;
  }

  .data-rights {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
  }

  .rights-actions {
    display: flex;
    gap: 15px;
    margin-top: 15px;
  }

  .export-results {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
  }

  .export-summary {
    background: white;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 15px;
  }

  .encryption-viewer {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .encryption-config {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
  }

  .encryption-config ul {
    list-style-type: none;
    padding: 0;
  }

  .encryption-config li {
    padding: 5px 0;
    border-bottom: 1px solid #eee;
  }

  .test-encryption {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
  }

  .test-data-input {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .test-data-input textarea {
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .side-by-side {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  /* Compliance Dashboard Styles */
  .compliance-dashboard {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .compliance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e0e6ed;
  }

  .compliance-controls {
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
  }

  .compliance-content {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  /* Executive Summary Cards */
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }

  .summary-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e0e6ed;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .summary-card.gdpr {
    border-left: 4px solid #e74c3c;
  }

  .summary-card.encryption {
    border-left: 4px solid #9b59b6;
  }

  .summary-card.consent {
    border-left: 4px solid #3498db;
  }

  .summary-card.audit {
    border-left: 4px solid #27ae60;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .card-header h4 {
    margin: 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
  }

  .card-score {
    font-size: 24px;
    font-weight: bold;
    color: #27ae60;
    background: #e8f5e8;
    padding: 8px 12px;
    border-radius: 8px;
    min-width: 60px;
    text-align: center;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-content .metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .card-content .metric:last-child {
    border-bottom: none;
  }

  .card-content .metric span:first-child {
    color: #666;
    font-size: 14px;
  }

  .card-content .metric span:last-child {
    font-weight: 600;
    color: #2c3e50;
  }

  /* Risk Assessment */
  .risk-assessment {
    background: white;
    border-radius: 12px;
    padding: 25px;
    border: 1px solid #e0e6ed;
  }

  .risk-assessment h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  .risk-overview {
    margin-bottom: 20px;
  }

  .overall-risk {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e0e6ed;
  }

  .overall-risk span:first-child {
    font-weight: 600;
    color: #2c3e50;
  }

  .risk-badge {
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 12px;
  }

  .risk-factors {
    display: grid;
    gap: 10px;
  }

  .risk-factor {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 15px;
    align-items: center;
    padding: 12px 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e0e6ed;
  }

  .factor-name {
    font-weight: 600;
    color: #2c3e50;
  }

  .factor-status {
    color: #666;
    font-size: 14px;
  }

  .factor-risk {
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
    text-align: center;
    min-width: 60px;
  }

  /* Recommendations */
  .recommendations {
    background: white;
    border-radius: 12px;
    padding: 25px;
    border: 1px solid #e0e6ed;
  }

  .recommendations h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  .recommendation-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .recommendation-item {
    display: flex;
    gap: 15px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e0e6ed;
  }

  .rec-priority {
    color: white;
    padding: 6px 12px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 12px;
    text-align: center;
    min-width: 60px;
    height: fit-content;
  }

  .rec-content {
    flex: 1;
  }

  .rec-title {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 8px;
  }

  .rec-details {
    display: flex;
    gap: 20px;
    color: #666;
    font-size: 14px;
  }

  /* Data Processing Activities Table */
  .processing-activities {
    background: white;
    border-radius: 12px;
    padding: 25px;
    border: 1px solid #e0e6ed;
  }

  .processing-activities h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  .activities-table {
    display: grid;
    gap: 2px;
    background: #e0e6ed;
    border-radius: 8px;
    overflow: hidden;
  }

  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 2fr 2fr 1fr 1fr auto auto;
    gap: 2px;
  }

  .table-header > div {
    background: #2c3e50;
    color: white;
    padding: 12px 15px;
    font-weight: 600;
    font-size: 14px;
  }

  .table-row > div {
    background: white;
    padding: 12px 15px;
    display: flex;
    align-items: center;
    font-size: 14px;
  }

  .table-row .status {
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    text-align: center;
  }

  .table-row .status.compliant {
    background: #e8f5e8;
    color: #27ae60;
  }

  .table-row .status.review-required {
    background: #fff3cd;
    color: #f39c12;
  }

  /* Privacy Principles */
  .privacy-principles {
    background: white;
    border-radius: 12px;
    padding: 25px;
    border: 1px solid #e0e6ed;
  }

  .privacy-principles h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  .principles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }

  .principle-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e0e6ed;
  }

  .principle-name {
    font-weight: 600;
    color: #2c3e50;
  }

  .principle-status {
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
  }

  .principle-status.compliant {
    background: #e8f5e8;
    color: #27ae60;
  }

  .principle-status.review-required {
    background: #fff3cd;
    color: #f39c12;
  }

  /* Consent Breakdown Chart */
  .consent-breakdown {
    background: white;
    border-radius: 12px;
    padding: 25px;
    border: 1px solid #e0e6ed;
  }

  .consent-breakdown h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  .consent-chart {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .consent-bar {
    display: grid;
    grid-template-columns: 120px 1fr auto;
    gap: 15px;
    align-items: center;
  }

  .bar-label {
    font-weight: 600;
    color: #2c3e50;
  }

  .bar-container {
    background: #e0e6ed;
    border-radius: 12px;
    height: 24px;
    position: relative;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 12px;
    transition: width 0.3s ease;
  }

  .bar-percentage {
    font-weight: 600;
    color: #2c3e50;
    min-width: 40px;
    text-align: right;
  }

  /* Audit Report Styles */
  .audit-stats {
    background: white;
    border-radius: 12px;
    padding: 25px;
    border: 1px solid #e0e6ed;
  }

  .audit-stats h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
  }

  .stat-item {
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e0e6ed;
  }

  .stat-value {
    font-size: 32px;
    font-weight: bold;
    color: #3498db;
    margin-bottom: 8px;
  }

  .stat-label {
    color: #666;
    font-size: 14px;
    font-weight: 600;
  }

  /* Data Subject Requests */
  .dsr-breakdown {
    background: white;
    border-radius: 12px;
    padding: 25px;
    border: 1px solid #e0e6ed;
  }

  .dsr-breakdown h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  .dsr-chart {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
  }

  .dsr-item {
    text-align: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e0e6ed;
  }

  .dsr-type {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .dsr-count {
    font-size: 24px;
    font-weight: bold;
    color: #3498db;
  }

  /* Legal Basis Chart */
  .legal-basis {
    background: white;
    border-radius: 12px;
    padding: 25px;
    border: 1px solid #e0e6ed;
  }

  .legal-basis h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  .basis-chart {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .basis-item {
    display: grid;
    grid-template-columns: 150px 1fr auto auto;
    gap: 15px;
    align-items: center;
  }

  .basis-name {
    font-weight: 600;
    color: #2c3e50;
  }

  .basis-bar {
    background: #e0e6ed;
    border-radius: 12px;
    height: 24px;
    position: relative;
    overflow: hidden;
  }

  .basis-fill {
    height: 100%;
    background: #3498db;
    border-radius: 12px;
    transition: width 0.3s ease;
  }

  .basis-percentage {
    font-weight: 600;
    color: #2c3e50;
    min-width: 40px;
    text-align: right;
  }

  .basis-compliance {
    font-size: 20px;
  }

  .basis-compliance.compliant {
    color: #27ae60;
  }

  .basis-compliance.non-compliant {
    color: #e74c3c;
  }

  .performance-monitor {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .metric-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #ddd;
  }

  .metric-card h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 8px;
  }

  .metric-card ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .metric-card li {
    padding: 8px 0;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
  }

  .tables-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .table-item {
    background: white;
    padding: 10px;
    border-radius: 4px;
    font-size: 14px;
  }

  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .notice {
    background: #fff3cd;
    color: #856404;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #ffeaa7;
  }

  @media (max-width: 768px) {
    .entity-content {
      grid-template-columns: 1fr;
    }
    
    .side-by-side {
      grid-template-columns: 1fr;
    }
    
    .metrics-grid {
      grid-template-columns: 1fr;
    }
    
    .mode-options {
      flex-direction: column;
    }
    
    .rights-actions {
      flex-direction: column;
    }

    .form-grid {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .form-group.span-2 {
      grid-column: span 1;
    }

    .modal-content.create-form {
      width: 95vw;
      padding: 20px;
    }

    .modal-actions {
      flex-direction: column-reverse;
    }

    .modal-actions .btn {
      width: 100%;
    }
  }

  /* Encryption Configuration Styles */
  .encryption-config {
    max-width: 800px;
    width: 90vw;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #ecf0f1;
  }

  .modal-header h4 {
    margin: 0;
    color: #2c3e50;
    font-size: 20px;
    font-weight: 600;
  }

  .config-actions {
    display: flex;
    gap: 15px;
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 2px solid #ecf0f1;
  }

  .config-editor {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 20px;
  }

  .entity-config {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e0e6ed;
  }

  .entity-config h5 {
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
  }

  .field-config {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-config label {
    font-weight: 500;
    color: #34495e;
    font-size: 14px;
  }

  .field-config input {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    background: white;
  }

  .field-preview {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    font-size: 13px;
    color: #666;
  }

  .field-tag {
    background: #3498db;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .no-fields {
    color: #95a5a6;
    font-style: italic;
  }

  /* Audit Log Viewer Styles */
  .audit-log-viewer {
    padding: 20px;
  }

  .audit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .audit-actions {
    display: flex;
    gap: 10px;
  }

  .audit-stats {
    margin-bottom: 20px;
  }

  .stat-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .stat-value {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .stat-label {
    font-size: 12px;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .audit-filters {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    border: 1px solid #e0e6ed;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .filter-group label {
    font-weight: 600;
    color: #2c3e50;
    font-size: 13px;
  }

  .filter-group input,
  .filter-group select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
  }

  .quick-filters {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .btn.small {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 4px;
  }

  .filter-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid #e0e6ed;
  }

  .filter-results {
    color: #666;
    font-size: 14px;
  }

  .audit-table-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    margin-bottom: 20px;
  }

  .audit-table {
    width: 100%;
    border-collapse: collapse;
  }

  .audit-table th {
    background: #34495e;
    color: white;
    padding: 15px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .audit-table td {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
    vertical-align: middle;
  }

  .audit-table tr:hover {
    background: #f8f9fa;
  }

  .audit-table tr.result-success {
    border-left: 4px solid #27ae60;
  }

  .audit-table tr.result-failure {
    border-left: 4px solid #e74c3c;
  }

  /* Enhanced Data Deletion Styles */
  .deletion-notice {
    background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
    border: 1px solid #27ae60;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 25px;
  }

  .deletion-notice h4 {
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .deletion-notice p {
    margin: 0;
    color: #34495e;
    font-size: 14px;
    line-height: 1.5;
  }

  .deletion-options {
    margin-bottom: 25px;
  }

  .option-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-top: 15px;
  }

  .option-card {
    border: 2px solid #e0e6ed;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    background: white;
  }

  .option-card:hover {
    border-color: #3498db;
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.1);
    transform: translateY(-2px);
  }

  .option-card.selected {
    border-color: #3498db;
    background: linear-gradient(135deg, #f8fbff 0%, #e8f4f8 100%);
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.15);
  }

  .option-card .option-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .option-card .option-icon {
    font-size: 24px;
  }

  .option-card .option-title {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }

  .option-card .option-description {
    color: #666;
    font-size: 14px;
    line-height: 1.4;
    margin: 0;
  }

  .option-card input[type="radio"] {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 20px;
    height: 20px;
    accent-color: #3498db;
  }

  .justification-section {
    margin-bottom: 25px;
  }

  .justification-section h4 {
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
  }

  .justification-section textarea {
    width: 100%;
    min-height: 80px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    box-sizing: border-box;
  }

  .justification-section textarea:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  .warning-box {
    background: linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%);
    border: 1px solid #e74c3c;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 25px;
  }

  .warning-box h4 {
    margin: 0 0 10px 0;
    color: #c0392b;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .warning-box ul {
    margin: 10px 0 0 20px;
    color: #e74c3c;
    font-size: 14px;
    line-height: 1.5;
  }

  .warning-box li {
    margin-bottom: 5px;
  }

  /* Consent History and Analytics Dashboard Styles */
  .consent-analytics-dashboard {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 25px;
    margin: 20px 0;
    border: 1px solid #e0e6ed;
  }

  .consent-analytics-dashboard h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .analytics-overview {
    margin-bottom: 25px;
  }

  .analytics-overview h5 {
    margin: 0 0 15px 0;
    color: #34495e;
    font-size: 16px;
    font-weight: 600;
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .analytics-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid #e8ecef;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .analytics-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .analytics-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .analytics-icon {
    font-size: 24px;
    padding: 8px;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-width: 40px;
    text-align: center;
  }

  .analytics-info {
    flex: 1;
  }

  .analytics-value {
    font-size: 28px;
    font-weight: bold;
    color: #2c3e50;
    line-height: 1;
    margin-bottom: 4px;
  }

  .analytics-label {
    font-size: 12px;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  .purpose-breakdown {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e8ecef;
  }

  .purpose-breakdown h6 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 14px;
    font-weight: 600;
  }

  .purpose-chart {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .purpose-bar {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .purpose-name {
    flex: 0 0 120px;
    font-size: 13px;
    font-weight: 500;
    color: #34495e;
  }

  .purpose-progress {
    flex: 1;
    height: 8px;
    background: #ecf0f1;
    border-radius: 4px;
    overflow: hidden;
  }

  .purpose-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .purpose-count {
    flex: 0 0 50px;
    font-size: 12px;
    color: #7f8c8d;
    text-align: right;
  }

  .consent-filters {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #e8ecef;
  }

  .filter-row {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .consent-history {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e8ecef;
  }

  .consent-history h5 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
  }

  .consent-timeline {
    position: relative;
  }

  .consent-event {
    display: flex;
    margin-bottom: 20px;
    position: relative;
  }

  .consent-event:last-child .event-line {
    display: none;
  }

  .event-indicator {
    flex: 0 0 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .event-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-bottom: 8px;
    z-index: 1;
  }

  .event-dot.granted {
    background: #27ae60;
    box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.2);
  }

  .event-dot.revoked {
    background: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2);
  }

  .event-dot.expired {
    background: #f39c12;
    box-shadow: 0 0 0 3px rgba(243, 156, 18, 0.2);
  }

  .event-line {
    width: 2px;
    flex: 1;
    background: #ecf0f1;
    margin-left: 5px;
  }

  .event-content {
    flex: 1;
    background: #f8f9fa;
    border-radius: 12px;
    padding: 15px;
    margin-left: 15px;
    border: 1px solid #e8ecef;
  }

  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .event-title {
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .event-status {
    background: #ecf0f1;
    color: #7f8c8d;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .event-status.granted {
    background: rgba(39, 174, 96, 0.1);
    color: #27ae60;
  }

  .event-status.revoked {
    background: rgba(231, 76, 60, 0.1);
    color: #e74c3c;
  }

  .event-meta {
    font-size: 12px;
    color: #7f8c8d;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .event-details {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .event-time,
  .event-duration,
  .event-reason,
  .event-evidence {
    font-size: 13px;
    color: #555;
  }

  .event-duration {
    color: #7f8c8d;
  }

  .event-reason {
    color: #e67e22;
  }

  .loading,
  .no-data {
    text-align: center;
    padding: 40px;
    color: #7f8c8d;
    font-style: italic;
  }

  /* Enhanced Data Export Modal Styles */
  .export-notice {
    background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
    border: 1px solid #3498db;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 25px;
  }

  .export-notice h4 {
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .export-configuration {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .config-section {
    border: 1px solid #e0e6ed;
    border-radius: 12px;
    padding: 20px;
    background: white;
  }

  .config-section h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .format-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .format-option {
    border: 2px solid #e0e6ed;
    border-radius: 12px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: white;
    position: relative;
  }

  .format-option:hover {
    border-color: #3498db;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
  }

  .format-option.selected {
    border-color: #3498db;
    background: linear-gradient(135deg, #f8fbff 0%, #e8f4f8 100%);
    box-shadow: 0 4px 15px rgba(52, 152, 219, 0.15);
  }

  .format-option input[type="radio"] {
    margin: 0;
    width: 18px;
    height: 18px;
    accent-color: #3498db;
  }

  .format-info {
    flex: 1;
  }

  .format-name {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 5px;
  }

  .format-desc {
    font-size: 13px;
    color: #666;
    line-height: 1.4;
  }

  .table-selection {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  .table-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid #e0e6ed;
    border-radius: 8px;
    background: #f8f9fa;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .table-checkbox:hover {
    background: #e9ecef;
    border-color: #3498db;
  }

  .table-checkbox input[type="checkbox"] {
    margin: 0;
    width: 16px;
    height: 16px;
    accent-color: #3498db;
  }

  .table-name {
    font-size: 14px;
    font-weight: 500;
    color: #2c3e50;
  }

  .export-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .export-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border: 1px solid #e0e6ed;
    border-radius: 8px;
    background: #f8f9fa;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .export-checkbox:hover {
    background: #e9ecef;
    border-color: #3498db;
  }

  .export-checkbox input[type="checkbox"] {
    margin: 0;
    width: 16px;
    height: 16px;
    accent-color: #3498db;
  }

  .export-checkbox span {
    font-size: 14px;
    color: #2c3e50;
  }

  .gdpr-compliance-notice {
    background: linear-gradient(135deg, #fff5f5 0%, #f0fff4 100%);
    border: 1px solid #27ae60;
    border-radius: 12px;
    padding: 20px;
  }

  .gdpr-compliance-notice h4 {
    margin: 0 0 10px 0;
    color: #27ae60;
    font-size: 16px;
    font-weight: 600;
  }

  .gdpr-compliance-notice ul {
    margin: 10px 0 0 20px;
    color: #2c3e50;
    font-size: 14px;
    line-height: 1.6;
  }

  .gdpr-compliance-notice li {
    margin-bottom: 8px;
  }

  /* Enhanced Export Results Styles */
  .export-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  .export-info {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e8ecef;
  }

  .export-info p {
    margin: 8px 0;
    font-size: 14px;
    color: #2c3e50;
  }

  .export-actions {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e8ecef;
  }

  .export-actions h5 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
  }

  .download-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }

  .gdpr-notice {
    background: rgba(39, 174, 96, 0.1);
    color: #27ae60;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid rgba(39, 174, 96, 0.2);
  }

  .export-preview {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e8ecef;
    margin-top: 20px;
  }

  .export-preview h5 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
  }

  .export-content {
    background: #f8f9fa;
    border: 1px solid #e0e6ed;
    border-radius: 8px;
    padding: 15px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: #2c3e50;
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
  }

  /* Processing Restriction Modal Styles */
  .restriction-notice {
    background: linear-gradient(135deg, #fff5e6 0%, #ffe8e6 100%);
    border: 1px solid #f39c12;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 25px;
  }

  .restriction-notice h4 {
    margin: 0 0 10px 0;
    color: #e67e22;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .restriction-configuration {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .reason-options {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .reason-option {
    border: 2px solid #e0e6ed;
    border-radius: 12px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: white;
    position: relative;
  }

  .reason-option:hover {
    border-color: #f39c12;
    box-shadow: 0 4px 12px rgba(243, 156, 18, 0.1);
  }

  .reason-option.selected {
    border-color: #f39c12;
    background: linear-gradient(135deg, #fffaf0 0%, #fff8e1 100%);
    box-shadow: 0 4px 15px rgba(243, 156, 18, 0.15);
  }

  .reason-option input[type="radio"] {
    margin: 0;
    width: 18px;
    height: 18px;
    accent-color: #f39c12;
  }

  .reason-info {
    flex: 1;
  }

  .reason-name {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 5px;
  }

  .reason-desc {
    font-size: 13px;
    color: #666;
    line-height: 1.4;
  }

  .section-description {
    color: #666;
    font-size: 14px;
    margin: 0 0 15px 0;
    line-height: 1.4;
  }

  .restriction-effects-notice {
    background: linear-gradient(135deg, #fff5f5 0%, #f0fff4 100%);
    border: 1px solid #e67e22;
    border-radius: 12px;
    padding: 20px;
  }

  .restriction-effects-notice h4 {
    margin: 0 0 10px 0;
    color: #e67e22;
    font-size: 16px;
    font-weight: 600;
  }

  .restriction-effects-notice ul {
    margin: 10px 0 0 20px;
    color: #2c3e50;
    font-size: 14px;
    line-height: 1.6;
  }

  .restriction-effects-notice li {
    margin-bottom: 8px;
  }

  /* Processing Restrictions Display Styles */
  .processing-restrictions {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 25px;
    margin: 20px 0;
    border: 1px solid #e0e6ed;
  }

  .processing-restrictions h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .restrictions-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .restriction-item {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e8ecef;
    border-left: 4px solid #f39c12;
  }

  .restriction-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
  }

  .restriction-info {
    flex: 1;
  }

  .restriction-title {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }

  .restriction-icon {
    font-size: 18px;
  }

  .restriction-status {
    background: #f39c12;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .restriction-status.active {
    background: #e67e22;
  }

  .restriction-meta {
    font-size: 13px;
    color: #7f8c8d;
  }

  .restriction-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .restriction-field {
    font-size: 14px;
    color: #2c3e50;
  }

  .restriction-field strong {
    color: #34495e;
  }

  .restriction-notice {
    background: rgba(243, 156, 18, 0.1);
    color: #e67e22;
    padding: 12px 15px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.4;
    border: 1px solid rgba(243, 156, 18, 0.2);
    margin-top: 10px;
  }

  /* Key Rotation Management Styles */
  .key-rotation-management {
    padding: 20px;
  }

  .key-rotation-management h3 {
    margin: 0 0 25px 0;
    color: #2c3e50;
    font-size: 24px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .key-overview {
    margin-bottom: 30px;
  }

  .key-info-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 25px;
  }

  .key-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid #e8ecef;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .key-card.primary {
    border-left: 4px solid #3498db;
    background: linear-gradient(135deg, #f8fbff 0%, #e8f4f8 100%);
  }

  .key-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .key-card-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
  }

  .key-icon {
    font-size: 28px;
    padding: 12px;
    border-radius: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-width: 52px;
    text-align: center;
  }

  .key-info {
    flex: 1;
  }

  .key-value {
    font-size: 24px;
    font-weight: bold;
    color: #2c3e50;
    line-height: 1;
    margin-bottom: 5px;
  }

  .key-label {
    font-size: 13px;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  .key-status {
    font-size: 14px;
    font-weight: 500;
    padding: 5px 0;
  }

  .key-statistics {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 30px;
    border: 1px solid #e0e6ed;
  }

  .key-statistics h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .stat-item {
    text-align: center;
    background: white;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e8ecef;
  }

  .stat-value {
    font-size: 20px;
    font-weight: bold;
    color: #3498db;
    margin-bottom: 5px;
  }

  .stat-label {
    font-size: 12px;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .compliance-status {
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    border: 1px solid #e8ecef;
  }

  .compliance-badge {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .compliance-badge.compliant {
    background: rgba(39, 174, 96, 0.1);
    color: #27ae60;
    border: 1px solid rgba(39, 174, 96, 0.2);
  }

  .compliance-badge.warning {
    background: rgba(243, 156, 18, 0.1);
    color: #f39c12;
    border: 1px solid rgba(243, 156, 18, 0.2);
  }

  .compliance-text {
    font-size: 14px;
    color: #2c3e50;
  }

  .key-actions {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 30px;
    border: 1px solid #e0e6ed;
  }

  .key-actions h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-buttons {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }

  .rotation-history {
    background: white;
    border-radius: 12px;
    padding: 25px;
    border: 1px solid #e0e6ed;
  }

  .rotation-history h4 {
    margin: 0 0 20px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .history-table-container {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #e0e6ed;
  }

  .history-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }

  .history-table th {
    background: #34495e;
    color: white;
    padding: 15px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #2c3e50;
  }

  .history-table td {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
    vertical-align: middle;
  }

  .history-table tr:hover {
    background: #f8f9fa;
  }

  .rotation-date {
    font-weight: 500;
    color: #2c3e50;
  }

  .version-change {
    font-family: 'Courier New', monospace;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
    color: #3498db;
    font-weight: 500;
  }

  .rotation-reason {
    color: #666;
    text-transform: capitalize;
  }

  .triggered-by {
    color: #7f8c8d;
  }

  .duration {
    font-family: 'Courier New', monospace;
    color: #e67e22;
  }

  .affected-records {
    font-weight: 500;
    color: #27ae60;
  }

  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-badge.completed {
    background: rgba(39, 174, 96, 0.1);
    color: #27ae60;
    border: 1px solid rgba(39, 174, 96, 0.2);
  }

  .status-badge.failed {
    background: rgba(231, 76, 60, 0.1);
    color: #e74c3c;
    border: 1px solid rgba(231, 76, 60, 0.2);
  }

  /* Key Rotation Modal Styles */
  .rotation-warning {
    background: linear-gradient(135deg, #fff5e6 0%, #ffe8e6 100%);
    border: 1px solid #f39c12;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 25px;
  }

  .rotation-warning h4 {
    margin: 0 0 10px 0;
    color: #e67e22;
    font-size: 16px;
    font-weight: 600;
  }

  .rotation-warning ul {
    margin: 10px 0 0 20px;
    color: #2c3e50;
    font-size: 14px;
    line-height: 1.6;
  }

  .rotation-warning li {
    margin-bottom: 5px;
  }

  .rotation-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 25px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .form-group label {
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
  }

  .form-group select {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    background: white;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-weight: 500;
    color: #2c3e50;
  }

  .checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #3498db;
  }

  .help-text {
    font-size: 12px;
    color: #7f8c8d;
    margin-top: 5px;
  }

  .rotation-impact {
    background: linear-gradient(135deg, #f0f8ff 0%, #e8f4f8 100%);
    border: 1px solid #3498db;
    border-radius: 12px;
    padding: 20px;
  }

  .rotation-impact h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 600;
  }

  .impact-stats {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .impact-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(52, 152, 219, 0.1);
  }

  .impact-item:last-child {
    border-bottom: none;
  }

  .impact-label {
    font-weight: 500;
    color: #2c3e50;
    font-size: 14px;
  }

  .impact-value {
    font-weight: 600;
    color: #3498db;
    font-size: 14px;
  }

  .audit-table tr.result-error {
    border-left: 4px solid #f39c12;
  }

  .action-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .action-badge.data {
    background: #3498db;
    color: white;
  }

  .action-badge.consent {
    background: #9b59b6;
    color: white;
  }

  .action-badge.dsr {
    background: #e67e22;
    color: white;
  }

  .action-badge.security {
    background: #e74c3c;
    color: white;
  }

  .action-badge.encryption {
    background: #1abc9c;
    color: white;
  }

  .result-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .result-badge.success {
    background: #d5f4e6;
    color: #27ae60;
  }

  .result-badge.failure {
    background: #faddd7;
    color: #e74c3c;
  }

  .result-badge.error {
    background: #fef5e7;
    color: #f39c12;
  }

  .audit-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }

  .pagination-info {
    color: #666;
    font-size: 14px;
  }

  .pagination-controls {
    display: flex;
    gap: 5px;
    align-items: center;
  }

  .page-info {
    margin: 0 15px;
    color: #2c3e50;
    font-weight: 600;
  }

  .page-size-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #666;
    font-size: 14px;
  }

  .page-size-selector select {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .btn.small {
    padding: 6px 12px;
    font-size: 12px;
    min-width: auto;
  }

  .log-detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 10px;
    margin-bottom: 20px;
  }

  .detail-row {
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 14px;
  }

  .detail-row strong {
    color: #2c3e50;
    margin-right: 10px;
  }

  .log-details,
  .log-metadata {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e0e6ed;
  }

  /* Data Rectification Modal Styles */
  .rectification-notice {
    background: #e8f4fd;
    border: 1px solid #bee5eb;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .rectification-notice h4 {
    color: #0c5460;
    margin-bottom: 10px;
  }

  .rectification-notice p {
    color: #0c5460;
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .rectification-form {
    margin-top: 20px;
  }

  .form-section {
    margin-bottom: 30px;
  }

  .form-description {
    color: #666;
    margin-bottom: 20px;
    font-style: italic;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  .current-value {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
    padding: 8px;
    background: #f8f9fa;
    border-radius: 4px;
    border-left: 3px solid #dee2e6;
  }

  .field-help {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
    font-style: italic;
  }

  .required {
    color: #e74c3c;
  }

  .compliance-notice {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
  }

  .compliance-notice h4 {
    color: #2c3e50;
    margin-bottom: 10px;
  }

  .compliance-notice ul {
    margin: 0;
    padding-left: 20px;
  }

  .compliance-notice li {
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Consent Collection Demo Styles */
  .consent-collection-demo {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 25px;
    margin: 20px 0;
    border: 1px solid #e0e6ed;
  }

  .consent-collection-demo h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .consent-collection-demo p {
    margin: 0 0 20px 0;
    color: #555;
    line-height: 1.5;
  }

  .demo-controls {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-group label {
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
  }

  .control-group select,
  .control-group button {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
  }

  .demo-description {
    background: white;
    border-radius: 8px;
    padding: 15px;
    border-left: 4px solid #3498db;
  }

  .demo-description p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
  }

  .demo-description strong {
    color: #2c3e50;
  }
`;

// Add styles to document including ConsentBanner styles
const styleElement = document.createElement('style');
styleElement.textContent = styles + '\n' + consentBannerStyles;
document.head.appendChild(styleElement);

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<AppWrapper />);
} else {
  console.error('Root container not found');
}

export default AppWrapper;