// Storage Plugin Example - Using Unified Storage Plugin
// This component has ALL the same features and UI as NoStoragePluginExample.tsx
// but uses the unified StoragePlugin for all storage operations
import React from 'react';
import { createRoot } from 'react-dom/client';
import { pluginRegistry } from './store/plugin-registry';
import { defaultTheme } from './plugins/shared/default-theme';
import { newEventBus, EVENTS } from './core/new-event-bus';
import { ToastProvider, useToast } from './components/ToastProvider';
import { EventsModal } from './components/EventsModal';

// Import Storage Plugin
import { StoragePlugin, StorageConfig, DataCategory } from './plugins/storage/StoragePlugin';

// Import new plugins 
import { messagingPlugin } from './plugins/messaging';
import { communitySidebarPlugin } from './plugins/community-sidebar';
import { communityPlugin } from './plugins/community';
import { classroomPlugin } from './plugins/classroom';
import { courseBuilderPlugin } from './plugins/course-builder';
import { aboutPlugin } from './plugins/about';
import { membersPlugin } from './plugins/members';
import { merchandisePlugin } from './plugins/merchandise';
import { calendarPlugin } from './plugins/calendar';
import { leaderboardPlugin } from './plugins/leaderboard';
import { communityMyProfilePlugin } from './plugins/community-my-profile';
import { certificatesPlugin } from './plugins/certificates/plugin';
import { analyticsPlugin } from './plugins/analytics/plugin';
import { userManagementPlugin } from './plugins/user-management/plugin';
import { stripePlugin } from './plugins/stripe/new-plugin';
import { assessmentPlugin } from './plugins/assessment/plugin';
import { courseDataPlugin } from './plugins/course-data/plugin';
import { externalServicesPlugin } from './plugins/external-services/plugin';
import { featureFlagsPlugin } from './plugins/feature-flags/plugin';
import { authPlugin } from './plugins/auth/new-plugin';
import { coursePublishingPlugin } from './plugins/course-publishing/plugin';
import './index.css';

console.log('🔍 Imports loaded:', { messagingPlugin, communitySidebarPlugin, communityPlugin, classroomPlugin, courseBuilderPlugin, aboutPlugin, membersPlugin, merchandisePlugin, calendarPlugin, leaderboardPlugin, communityMyProfilePlugin });

// Create global storage instance
let storagePlugin: StoragePlugin;

// Inner component that uses toast
const DemoContent: React.FC<{
  storageBackend: 'localStorage' | 'indexedDB';
  setStorageBackend: (backend: 'localStorage' | 'indexedDB') => void;
}> = ({ storageBackend: parentStorageBackend, setStorageBackend: setParentStorageBackend }) => {
  console.log('🚀 StorageExample component rendering...');
  
  const [installedPlugins, setInstalledPlugins] = React.useState<Array<{id: string, name: string}>>([]);
  const [activeTab, setActiveTab] = React.useState<string>('');
  const [showEventsModal, setShowEventsModal] = React.useState(false);
  const [recentEvents, setRecentEvents] = React.useState<Array<{event: string, data: any, timestamp: Date, pluginId?: string}>>([]);
  const { showSuccess, showInfo, showWarning } = useToast();
  
  // GDPR Enhancement State
  const [gdprEnabled, setGdprEnabled] = React.useState(true);
  const [encryptionEnabled, setEncryptionEnabled] = React.useState(true);
  const [auditEnabled, setAuditEnabled] = React.useState(true);
  const [dataRetentionDays, setDataRetentionDays] = React.useState(365);
  const [gdprOperations, setGdprOperations] = React.useState<Array<{operation: string, timestamp: Date, details: string, userId?: string}>>([]);
  const [userConsents, setUserConsents] = React.useState<Record<string, {purpose: string, granted: boolean, timestamp: Date}>>({});
  const [dataInventory, setDataInventory] = React.useState<Array<{type: string, count: number, encrypted: boolean, lastAccessed: Date}>>([]);
  const [showDataItemsModal, setShowDataItemsModal] = React.useState(false);

  // Initialize Storage Plugin
  React.useEffect(() => {
    const config: StorageConfig = {
      gdpr: gdprEnabled ? {
        encryption: encryptionEnabled,
        audit: auditEnabled,
        retention: `P${dataRetentionDays}D`
      } : false,
      storageProvider: parentStorageBackend,
      stateManager: 'simple' // Use simple state manager for demo
    };

    storagePlugin = new StoragePlugin(config);
    storagePlugin.initialize().then(() => {
      console.log('Storage Plugin initialized:', storagePlugin.getStats());
      logGDPROperation('Storage Plugin Initialized', `Mode: ${gdprEnabled ? 'GDPR' : 'Simple'}, Backend: ${parentStorageBackend}`);
    });
  }, [gdprEnabled, encryptionEnabled, auditEnabled, dataRetentionDays, parentStorageBackend]);
  
  // Sample posts for community plugin (existing mock data) - with fixed dates in the past
  const samplePosts = [
    { 
      id: '1', 
      author: 'Sarah Johnson', 
      authorId: 'user_sarah_johnson',
      time: '2h', 
      createdAt: '2024-12-28T14:30:00.000Z', // December 28, 2024, 2:30 PM UTC
      postDate: '2024-12-28T14:30:00.000Z',
      content: 'Just completed my first 10K run! ![GIF](https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif) The training program in this community has been amazing. Thank you everyone for the support! 🏃‍♀️', 
      likes: 24, 
      comments: 8,
      isPinned: false,
      level: 6,
      lastCommentAt: '2024-12-28T15:45:00.000Z',
      commenters: [
        { initials: 'MJ', avatarUrl: null, userId: 'user_mj', commentDate: '2024-12-28T15:45:00.000Z' },
        { initials: 'EC', avatarUrl: null, userId: 'user_ec', commentDate: '2024-12-28T15:30:00.000Z' },
        { initials: 'RS', avatarUrl: null, userId: 'user_rs', commentDate: '2024-12-28T15:15:00.000Z' },
        { initials: 'AH', avatarUrl: null, userId: 'user_ah', commentDate: '2024-12-28T15:00:00.000Z' },
        { initials: 'TB', avatarUrl: null, userId: 'user_tb', commentDate: '2024-12-28T14:45:00.000Z' }
      ]
    },
    { 
      id: '2', 
      author: 'Mike Chen', 
      authorId: 'user_mike_chen',
      time: '5h', 
      createdAt: '2024-12-28T11:30:00.000Z', // December 28, 2024, 11:30 AM UTC
      postDate: '2024-12-28T11:30:00.000Z',
      content: 'Who else is doing the December Challenge? Only 3 days left! ![GIF](https://media.giphy.com/media/3o7btNRptqBgLSKR2w/giphy.gif) Let\'s finish strong! 💪', 
      likes: 42, 
      comments: 16,
      isPinned: true,
      level: 8,
      lastCommentAt: '2024-12-28T16:00:00.000Z',
      commenters: [
        { initials: 'AL', avatarUrl: null, userId: 'user_al', commentDate: '2024-12-28T16:00:00.000Z' },
        { initials: 'KP', avatarUrl: null, userId: 'user_kp', commentDate: '2024-12-28T15:30:00.000Z' },
        { initials: 'JD', avatarUrl: null, userId: 'user_jd', commentDate: '2024-12-28T15:00:00.000Z' },
        { initials: 'NM', avatarUrl: null, userId: 'user_nm', commentDate: '2024-12-28T14:30:00.000Z' },
        { initials: 'RW', avatarUrl: null, userId: 'user_rw', commentDate: '2024-12-28T14:00:00.000Z' }
      ]
    },
    { 
      id: '3', 
      author: 'Jessica Lee', 
      authorId: 'user_jessica_lee',
      time: '1d', 
      createdAt: '2024-12-27T16:30:00.000Z', // December 27, 2024, 4:30 PM UTC
      postDate: '2024-12-27T16:30:00.000Z',
      content: 'Just published my new nutrition guide for runners! Check it out and let me know what you think. Always open to feedback from this amazing community 📝', 
      likes: 67, 
      comments: 23,
      isPinned: false,
      level: 10,
      lastCommentAt: '2024-12-28T14:00:00.000Z',
      commenters: [
        { initials: 'TH', avatarUrl: null, userId: 'user_th', commentDate: '2024-12-28T14:00:00.000Z' },
        { initials: 'GB', avatarUrl: null, userId: 'user_gb', commentDate: '2024-12-28T12:00:00.000Z' },
        { initials: 'PL', avatarUrl: null, userId: 'user_pl', commentDate: '2024-12-28T10:00:00.000Z' },
        { initials: 'DK', avatarUrl: null, userId: 'user_dk', commentDate: '2024-12-28T08:00:00.000Z' },
        { initials: 'VM', avatarUrl: null, userId: 'user_vm', commentDate: '2024-12-28T06:00:00.000Z' }
      ]
    }
  ];

  // Sample storage data matching original app
  const sampleStorageData = [
    { 
      id: 'user_001', 
      table: 'users',
      data: { 
        name: 'John Doe', 
        email: 'john@example.com', 
        role: 'admin',
        joinedDate: '2024-01-15',
        lastActive: '2024-12-28'
      },
      gdprMetadata: {
        consentDate: '2024-01-15',
        purposes: ['necessary', 'analytics', 'marketing'],
        retentionPeriod: '2 years'
      }
    },
    { 
      id: 'post_001', 
      table: 'posts',
      data: { 
        title: 'Welcome to the Community!', 
        content: 'This is our first post...', 
        author: 'admin',
        createdAt: '2024-01-20',
        likes: 45,
        comments: 12
      },
      gdprMetadata: {
        dataCategory: 'user-generated-content',
        encrypted: false,
        retentionPeriod: '1 year'
      }
    },
    { 
      id: 'course_001', 
      table: 'courses',
      data: { 
        title: 'Introduction to React', 
        instructor: 'Jane Smith',
        enrollments: 234,
        rating: 4.8,
        price: 49.99
      },
      gdprMetadata: {
        dataCategory: 'educational-content',
        encrypted: false,
        publicData: true
      }
    }
  ];

  // Log GDPR operations
  const logGDPROperation = (operation: string, details: string, userId?: string) => {
    const op = { operation, timestamp: new Date(), details, userId };
    setGdprOperations(prev => [...prev, op]);
    console.log(`📊 GDPR: ${operation}`, { details, userId });
  };

  // Storage helpers using StoragePlugin
  const getStorageItem = async (key: string): Promise<any> => {
    try {
      const [table, id] = key.split(':');
      const data = await storagePlugin.get(table, id);
      if (data) {
        logGDPROperation('Data Retrieved', `Key: ${key}, Using: StoragePlugin`);
        updateDataInventory();
      }
      return data;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  };

  const setStorageItem = async (key: string, value: any): Promise<void> => {
    try {
      const [table, id] = key.split(':');
      await storagePlugin.set(table, id, value);
      logGDPROperation('Data Stored', `Key: ${key}, Using: StoragePlugin`);
      updateDataInventory();
    } catch (error) {
      console.error('Storage set error:', error);
    }
  };

  const removeStorageItem = async (key: string): Promise<void> => {
    try {
      const [table, id] = key.split(':');
      await storagePlugin.delete(table, id);
      logGDPROperation('Data Removed', `Key: ${key}, Using: StoragePlugin`);
      updateDataInventory();
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  };

  const clearTableStorage = async (table: string): Promise<void> => {
    try {
      await storagePlugin.clear(table);
      logGDPROperation('Table Cleared', `Table: ${table}, Using: StoragePlugin`);
      updateDataInventory();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  };

  // Data inventory update
  const updateDataInventory = async () => {
    const inventory = [];
    const tables = ['users', 'posts', 'courses', 'comments'];
    
    for (const table of tables) {
      try {
        const items = await storagePlugin.query(table);
        if (items.length > 0) {
          // Check if any items have encryption metadata
          const hasEncrypted = items.some((item: any) => item._gdpr?.encrypted);
          
          inventory.push({
            type: table,
            count: items.length,
            encrypted: hasEncrypted,
            lastAccessed: new Date()
          });
        }
      } catch (error) {
        console.error(`Error reading ${table}:`, error);
      }
    }
    
    setDataInventory(inventory);
  };

  // Initialize consent state
  React.useEffect(() => {
    if (storagePlugin) {
      const defaultConsents = {
        necessary: { purpose: 'Essential cookies', granted: true, timestamp: new Date() },
        analytics: { purpose: 'Analytics & Performance', granted: false, timestamp: new Date() },
        marketing: { purpose: 'Marketing & Advertising', granted: false, timestamp: new Date() }
      };
      setUserConsents(defaultConsents);
    }
  }, []);

  // Create sample data with GDPR metadata
  const initializeSampleData = async () => {
    for (const sample of sampleStorageData) {
      await setStorageItem(`${sample.table}:${sample.id}`, {
        ...sample.data,
        _metadata: sample.gdprMetadata
      });
    }
    showSuccess('Sample data initialized with GDPR metadata');
    updateDataInventory();
  };

  // Export user data (GDPR compliance)
  const exportUserData = async (userId: string = 'user_001') => {
    try {
      const exportData = await storagePlugin.exportUserData(userId);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${userId}-${new Date().toISOString()}.json`;
      a.click();
      logGDPROperation('Data Export', `User data exported for: ${userId}`, userId);
      showSuccess('User data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showWarning('Failed to export user data');
    }
  };

  // Delete user data (GDPR compliance)
  const deleteUserData = async (userId: string = 'user_001') => {
    try {
      const result = await storagePlugin.deleteUserData(userId);
      logGDPROperation('Data Deletion', `User data deleted for: ${userId}`, userId);
      showSuccess(`User data deleted: ${result.deletedItems.length} items removed`);
      updateDataInventory();
    } catch (error) {
      console.error('Delete error:', error);
      showWarning('Failed to delete user data');
    }
  };

  // Import data
  const importData = async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      let importCount = 0;
      
      if (data.data) {
        for (const [table, items] of Object.entries(data.data)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item.id) {
                await setStorageItem(`${table}:${item.id}`, item);
                importCount++;
              }
            }
          }
        }
      }
      
      showSuccess(`Imported ${importCount} items successfully`);
      updateDataInventory();
    } catch (error) {
      console.error('Import error:', error);
      showWarning('Failed to import data');
    }
  };

  // Plugin lifecycle handlers with storage integration
  const handlePluginInstall = async (plugin: any) => {
    console.log('📦 Plugin installing:', plugin.id);
    
    // Save to storage
    await setStorageItem(`plugins:${plugin.id}`, {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      installedAt: new Date().toISOString(),
      active: true
    });
    
    setInstalledPlugins(prev => [...prev, {id: plugin.id, name: plugin.name}]);
    showSuccess(`Plugin "${plugin.name}" installed successfully!`);
  };

  const handlePluginUninstall = async (pluginId: string) => {
    console.log('🗑️ Plugin uninstalling:', pluginId);
    
    // Remove from storage
    await removeStorageItem(`plugins:${pluginId}`);
    
    setInstalledPlugins(prev => prev.filter(p => p.id !== pluginId));
    if (activeTab === pluginId) {
      setActiveTab('');
    }
    showInfo(`Plugin uninstalled`);
  };

  const handlePluginActivate = (pluginId: string) => {
    console.log('✅ Plugin activated:', pluginId);
    setActiveTab(pluginId);
    showInfo(`Plugin activated: ${pluginId}`);
  };

  const handlePluginDeactivate = (pluginId: string) => {
    console.log('❌ Plugin deactivated:', pluginId);
    if (activeTab === pluginId) {
      setActiveTab('');
    }
    showInfo(`Plugin deactivated: ${pluginId}`);
  };

  // Setup event listeners
  React.useEffect(() => {
    console.log('🎯 Setting up event listeners...');
    
    // Event handlers
    const eventHandler = (data: any) => {
      const event = {
        event: data.type || 'unknown',
        data,
        timestamp: new Date(),
        pluginId: data.pluginId
      };
      setRecentEvents(prev => [event, ...prev].slice(0, 50));
    };

    // Subscribe to all events
    const unsubscribers = [
      newEventBus.on(EVENTS.PLUGIN_INSTALL, (data) => handlePluginInstall(data)),
      newEventBus.on(EVENTS.PLUGIN_UNINSTALL, (data) => handlePluginUninstall(data.pluginId)),
      newEventBus.on(EVENTS.PLUGIN_ACTIVATE, (data) => handlePluginActivate(data.pluginId)),
      newEventBus.on(EVENTS.PLUGIN_DEACTIVATE, (data) => handlePluginDeactivate(data.pluginId)),
      newEventBus.on(EVENTS.MESSAGING_MESSAGE_SENT, eventHandler),
      newEventBus.on(EVENTS.COMMUNITY_POST_CREATED, eventHandler),
      newEventBus.on(EVENTS.COMMUNITY_POST_LIKED, eventHandler),
      newEventBus.on(EVENTS.COURSE_MODULE_COMPLETED, eventHandler),
      newEventBus.on(EVENTS.CERTIFICATE_GENERATED, eventHandler),
      newEventBus.on(EVENTS.USER_PROFILE_UPDATED, eventHandler),
      newEventBus.on(EVENTS.PAYMENT_PROCESSED, eventHandler),
      newEventBus.on(EVENTS.AUTH_USER_LOGGED_IN, eventHandler),
      newEventBus.on(EVENTS.AUTH_USER_LOGGED_OUT, eventHandler)
    ];

    return () => {
      console.log('🧹 Cleaning up event listeners...');
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Initialize plugins after storage is ready
  React.useEffect(() => {
    if (!storagePlugin) return;

    const initializePlugins = async () => {
      console.log('🔌 Initializing plugins...');
      
      // Define plugins to auto-install
      const plugins = [
        messagingPlugin,
        communitySidebarPlugin,
        communityPlugin,
        classroomPlugin,
        courseBuilderPlugin,
        aboutPlugin,
        membersPlugin,
        merchandisePlugin,
        calendarPlugin,
        leaderboardPlugin,
        communityMyProfilePlugin,
        certificatesPlugin,
        analyticsPlugin,
        userManagementPlugin,
        stripePlugin,
        assessmentPlugin,
        courseDataPlugin,
        externalServicesPlugin,
        featureFlagsPlugin,
        authPlugin,
        coursePublishingPlugin
      ];

      // Check which plugins are already installed from storage
      const storedPlugins = await storagePlugin.query('plugins');
      const installedIds = new Set(storedPlugins.map((p: any) => p.id));

      // Install plugins that aren't already installed
      for (const plugin of plugins) {
        if (plugin && !installedIds.has(plugin.id)) {
          pluginRegistry.register(plugin);
          await handlePluginInstall(plugin);
        } else if (plugin && installedIds.has(plugin.id)) {
          // Plugin already installed, just update UI
          setInstalledPlugins(prev => [...prev, {id: plugin.id, name: plugin.name}]);
        }
      }

      // Initialize sample data
      await initializeSampleData();
      
      // Update data inventory
      updateDataInventory();
    };

    const timer = setTimeout(initializePlugins, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Plugin System Demo with Unified Storage Plugin
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowEventsModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Events ({recentEvents.length})
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Backend:</span>
                <select
                  value={parentStorageBackend}
                  onChange={(e) => setParentStorageBackend(e.target.value as 'localStorage' | 'indexedDB')}
                  className="px-3 py-1 border rounded-md"
                >
                  <option value="localStorage">localStorage</option>
                  <option value="indexedDB">IndexedDB</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* GDPR Controls Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">GDPR Compliance Controls (via Storage Plugin)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">GDPR Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gdprEnabled}
                  onChange={(e) => setGdprEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Encryption</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={encryptionEnabled}
                  onChange={(e) => setEncryptionEnabled(e.target.checked)}
                  disabled={!gdprEnabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Audit Logging</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={auditEnabled}
                  onChange={(e) => setAuditEnabled(e.target.checked)}
                  disabled={!gdprEnabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 disabled:opacity-50"></div>
              </label>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium mb-1">Data Retention</label>
              <select 
                value={dataRetentionDays} 
                onChange={(e) => setDataRetentionDays(Number(e.target.value))}
                disabled={!gdprEnabled}
                className="w-full px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              >
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
                <option value={730}>2 years</option>
                <option value={2555}>7 years</option>
              </select>
            </div>
          </div>

          {/* User Consent Management */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">User Consent Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(userConsents).map(([key, consent]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{consent.purpose}</p>
                    <p className="text-xs text-gray-500">
                      {consent.granted ? 'Granted' : 'Denied'} • {consent.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.granted}
                      onChange={(e) => {
                        setUserConsents(prev => ({
                          ...prev,
                          [key]: { ...consent, granted: e.target.checked, timestamp: new Date() }
                        }));
                        logGDPROperation('Consent Updated', `${consent.purpose}: ${e.target.checked ? 'Granted' : 'Denied'}`);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* GDPR Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => exportUserData()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Export User Data
            </button>
            <button
              onClick={() => deleteUserData()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete User Data
            </button>
            <button
              onClick={() => setShowDataItemsModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Data Inventory
            </button>
            <label className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer text-center">
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const jsonData = event.target?.result as string;
                      importData(jsonData);
                    };
                    reader.readAsText(file);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Data Inventory Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {dataInventory.map((item) => (
              <div key={item.type} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium capitalize">{item.type}</h4>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs text-gray-500">
                  {item.encrypted ? '🔐 Encrypted' : '📂 Plain'}
                </p>
                <p className="text-xs text-gray-400">
                  Last: {item.lastAccessed.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>

          {/* Recent GDPR Operations */}
          <div>
            <h3 className="text-lg font-medium mb-3">Recent GDPR Operations</h3>
            <div className="max-h-40 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Operation</th>
                    <th className="px-4 py-2 text-left">Details</th>
                    <th className="px-4 py-2 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {gdprOperations.slice(-10).reverse().map((op, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{op.operation}</td>
                      <td className="px-4 py-2 text-gray-600">{op.details}</td>
                      <td className="px-4 py-2 text-gray-500">{op.timestamp.toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Plugin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {installedPlugins.map(plugin => (
            <div key={plugin.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">{plugin.name}</h3>
              <p className="text-gray-600 mb-4">Plugin ID: {plugin.id}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab(plugin.id)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === plugin.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {activeTab === plugin.id ? 'Active' : 'Activate'}
                </button>
                <button
                  onClick={() => pluginRegistry.unregister(plugin.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Uninstall
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Active Plugin Content */}
        {activeTab && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Active Plugin: {activeTab}</h2>
            <div id={`plugin-${activeTab}`} className="plugin-content">
              {/* Plugin will render its content here */}
              <p className="text-gray-600">Plugin content will be rendered here...</p>
            </div>
          </div>
        )}
      </main>

      {/* Events Modal */}
      {showEventsModal && (
        <EventsModal 
          events={recentEvents} 
          onClose={() => setShowEventsModal(false)} 
        />
      )}

      {/* Data Inventory Modal */}
      {showDataItemsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Data Inventory Details</h2>
            <div className="space-y-4">
              {dataInventory.map((inventory) => (
                <div key={inventory.type} className="border rounded-lg p-4">
                  <h3 className="font-semibold capitalize mb-2">{inventory.type}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Total Items: {inventory.count}</div>
                    <div>Encrypted: {inventory.encrypted ? 'Yes' : 'No'}</div>
                    <div>Last Accessed: {inventory.lastAccessed.toLocaleString()}</div>
                    <div>Storage: {parentStorageBackend}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <div className="text-sm text-gray-600">
                Storage Mode: {storagePlugin?.getStats().mode || 'Unknown'}
              </div>
              <button
                onClick={() => setShowDataItemsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App wrapper with ToastProvider
const StorageExample: React.FC<{
  storageBackend: 'localStorage' | 'indexedDB';
  setStorageBackend: (backend: 'localStorage' | 'indexedDB') => void;
}> = ({ storageBackend, setStorageBackend }) => {
  return (
    <ToastProvider>
      <DemoContent 
        storageBackend={storageBackend} 
        setStorageBackend={setStorageBackend} 
      />
    </ToastProvider>
  );
};

export default StorageExample;