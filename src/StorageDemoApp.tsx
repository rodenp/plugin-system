// Main Storage Demo App - Switch Between Storage Approaches
// This app lets you compare the original direct storage vs unified storage plugin
import React from 'react';
import { createRoot } from 'react-dom/client';
import NoStoragePluginExample from './NoStoragePluginExample';
import StorageExample from './StorageExample';
import './index.css';

type StorageApproach = 'original' | 'plugin';

const StorageDemoApp: React.FC = () => {
  const [activeApproach, setActiveApproach] = React.useState<StorageApproach>('plugin');
  const [storageBackend, setStorageBackend] = React.useState<'localStorage' | 'indexedDB'>('localStorage');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with approach switcher */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Storage Architecture Demo
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Compare direct storage operations vs unified storage plugin
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Storage Backend Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Backend:</span>
                <select
                  value={storageBackend}
                  onChange={(e) => setStorageBackend(e.target.value as 'localStorage' | 'indexedDB')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="localStorage">localStorage</option>
                  <option value="indexedDB">IndexedDB</option>
                </select>
              </div>

              {/* Approach Switcher */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveApproach('original')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeApproach === 'original'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📁 Original (Direct Storage)
                </button>
                <button
                  onClick={() => setActiveApproach('plugin')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeApproach === 'plugin'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🔌 Plugin (Unified Storage)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approach Information Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {activeApproach === 'original' ? (
            <div className="flex items-start gap-4">
              <div className="text-4xl">📁</div>
              <div>
                <h2 className="text-xl font-semibold text-blue-600 mb-2">
                  Original Direct Storage Approach
                </h2>
                <p className="text-gray-700 mb-3">
                  This is the current implementation from plugin-system-enhanced.tsx. 
                  It uses direct localStorage/IndexedDB operations with full GDPR services.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">✅ Advantages:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Direct control over storage operations</li>
                      <li>• Full GDPR compliance with existing services</li>
                      <li>• All features working and tested</li>
                      <li>• Clear separation of concerns</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">⚠️ Considerations:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Code scattered across components</li>
                      <li>• Multiple storage patterns to maintain</li>
                      <li>• Harder to switch storage backends</li>
                      <li>• GDPR logic mixed with business logic</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔌</div>
              <div>
                <h2 className="text-xl font-semibold text-green-600 mb-2">
                  Unified Storage Plugin Approach
                </h2>
                <p className="text-gray-700 mb-3">
                  This uses the new StoragePlugin that consolidates all storage operations 
                  through a single API with conditional GDPR behavior.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">✅ Advantages:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Single storage API for all operations</li>
                      <li>• Easy backend switching (localStorage ↔ IndexedDB)</li>
                      <li>• Consistent GDPR handling across app</li>
                      <li>• Extensible for new storage providers</li>
                      <li>• Default sensitive data registry</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">🎯 Benefits:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Centralized storage configuration</li>
                      <li>• Automatic encryption of sensitive fields</li>
                      <li>• Built-in audit logging and compliance</li>
                      <li>• Performance optimization options</li>
                      <li>• Plugin architecture for extensibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render Active Component */}
      <div className="transition-opacity duration-300">
        {activeApproach === 'original' ? (
          <NoStoragePluginExample 
            storageBackend={storageBackend}
            setStorageBackend={setStorageBackend}
          />
        ) : (
          <StorageExample 
            storageBackend={storageBackend}
            setStorageBackend={setStorageBackend}
          />
        )}
      </div>
    </div>
  );
};

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<StorageDemoApp />);
}

export default StorageDemoApp;