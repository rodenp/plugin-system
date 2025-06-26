import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@store';
import { pluginRegistry } from '@store/plugin-registry';
import type { SkoolPlugin } from '@store/types';

// Import plugins
import { communityPlugin } from '@plugin-community';
import { classroomPlugin } from '@plugin-classroom';
import { calendarPlugin } from '@plugin-calendar';
import { membersPlugin } from '@plugin-members';
import { merchandisePlugin } from '@plugin-merchandise';
import { aboutPlugin } from '@plugin-about';
import { courseBuilderPlugin } from '@plugin-course';
import { defaultTheme } from '@plugin-shared/default-theme';

// Custom theme with green buttons
const customTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    secondary: '#22c55e', // Change from blue to green
    accent: '#16a34a', // Darker green for accents
  }
};

// Demo Component
const SkoolPluginsDemoContent: React.FC = () => {
  const [availablePlugins, setAvailablePlugins] = useState<SkoolPlugin[]>([]);
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  const [installedPlugins, setInstalledPlugins] = useState<SkoolPlugin[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');

  console.warn('💥 SkoolPluginsDemoContent is rendering! customTheme:', customTheme.colors.secondary);

  // Mock user and community data
  const mockUser = {
    id: 'user-1',
    email: 'demo@example.com',
    profile: {
      displayName: 'John Doe',
      bio: 'Fitness enthusiast and community creator',
      avatar: null,
      timezone: 'America/New_York',
      location: 'New York, USA'
    },
    role: 'creator' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCommunity = {
    id: 'community-1',
    name: '🏋️ Fitness Masters',
    slug: 'fitness-masters',
    description: 'Get fit together! Join our community for workouts, nutrition tips, and motivation.',
    ownerId: 'user-1',
    moderators: [],
    access: 'free' as const,
    settings: {
      approval: 'instant' as const,
      visibility: 'public' as const,
      inviteOnly: false,
      features: {
        courses: true,
        events: true,
        messaging: true,
        leaderboard: true,
        badges: true,
        merch: true
      },
      gamification: {
        pointsPerLike: 1,
        pointsPerPost: 5,
        pointsPerComment: 2,
        enableLevels: true,
        customBadges: []
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true
      }
    },
    stats: {
      memberCount: 1250,
      postCount: 3420,
      courseCount: 12,
      eventCount: 8,
      revenue: 45000
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    theme: customTheme,
    testProperty: 'TEST_VALUE',
    debugTheme: '#22c55e'
  };

  // Use useEffect to debug when components are rendered
  useEffect(() => {
    if (installedPlugins.length > 0) {
      console.error('🔴 PERSISTENT DEBUG: mockCommunity theme when rendering:', mockCommunity.theme?.colors?.secondary);
      console.error('🔴 PERSISTENT DEBUG: mockCommunity keys when rendering:', Object.keys(mockCommunity));
      console.error('🔴 PERSISTENT DEBUG: customTheme:', customTheme.colors.secondary);
    }
  }, [installedPlugins, activeTab]);

  useEffect(() => {
    // Register all plugins
    console.log('🔄 Registering plugins...');
    
    // Debug: Check if courseBuilderPlugin is imported correctly
    console.log('📦 courseBuilderPlugin:', courseBuilderPlugin);
    console.log('📦 courseBuilderPlugin ID:', courseBuilderPlugin?.id);
    console.log('📦 courseBuilderPlugin type:', typeof courseBuilderPlugin);
    
    if (!courseBuilderPlugin) {
      console.error('❌ courseBuilderPlugin is undefined!');
    } else if (!courseBuilderPlugin.id) {
      console.error('❌ courseBuilderPlugin has no ID!');
    }
    
    // Register plugins one by one with error handling
    try {
      pluginRegistry.register(courseBuilderPlugin);
      console.log('✅ courseBuilderPlugin registered');
    } catch (e) {
      console.error('❌ Failed to register courseBuilderPlugin:', e);
    }
    
    pluginRegistry.register(courseBuilderPlugin);
    pluginRegistry.register(communityPlugin);
    pluginRegistry.register(classroomPlugin);
    pluginRegistry.register(calendarPlugin);
    pluginRegistry.register(membersPlugin);
    pluginRegistry.register(merchandisePlugin);
    pluginRegistry.register(aboutPlugin);
    
    // Get available plugins
    const plugins = pluginRegistry.getAllPlugins();
    setAvailablePlugins(plugins);
    console.log('👍 Available plugins:', plugins.map(p => p.name));
    console.log('📋 Plugin IDs:', plugins.map(p => p.id));
    
    // Specifically check if course-builder is registered
    const cb = pluginRegistry.getPlugin('course-builder');
    console.log('🔍 course-builder in registry:', cb ? 'YES' : 'NO');
  }, []);

  const handlePluginToggle = (pluginId: string) => {
    setSelectedPlugins(prev => {
      if (prev.includes(pluginId)) {
        return prev.filter(id => id !== pluginId);
      } else {
        return [...prev, pluginId];
      }
    });
  };

  const handleInstallPlugins = () => {
    try {
      console.log('🔧 Installing plugins:', selectedPlugins);
      
      // Debug: Check if plugins are registered
      console.log('📋 All registered plugins:', pluginRegistry.getAllPlugins().map(p => `${p.id} (${p.name})`));
      
      // Check if course-builder is in selected plugins or required as dependency
      const classroomSelected = selectedPlugins.includes('classroom');
      const courseBuilderSelected = selectedPlugins.includes('course-builder');
      
      if (classroomSelected && !courseBuilderSelected) {
        console.log('⚠️ Classroom plugin requires course-builder, checking if it\'s registered...');
        const courseBuilder = pluginRegistry.getPlugin('course-builder');
        console.log('🔍 Looking for course-builder, found:', courseBuilder);
        console.log('🔍 All plugins in registry at install time:', pluginRegistry.getAllPlugins().map(p => ({ id: p.id, name: p.name })));
        if (!courseBuilder) {
          console.error('❌ Course-builder plugin not found in registry!');
          console.error('   Available plugins:', pluginRegistry.getAllPlugins().map(p => p.id));
          alert('Error: Course Builder plugin must be registered before installing Classroom plugin.');
          return;
        }
      }
      
      pluginRegistry.installMany(selectedPlugins);
      const installed = pluginRegistry.getInstalledPlugins();
      setInstalledPlugins(installed);
      if (installed.length > 0 && !activeTab) {
        setActiveTab(installed[0].id);
      }
      console.log('✅ Plugins installed successfully:', installed.map(p => p.name));
    } catch (error) {
      console.error('❌ Plugin installation failed:', error);
      alert(`Plugin installation failed: ${(error as Error).message}`);
    }
  };

  const ActivePluginComponent = activeTab ? 
    pluginRegistry.getThemedPlugin(activeTab)?.component : 
    null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Skool Plugins Demo
          </h1>
          <p className="text-gray-600">
            Choose which plugins to install and experience the modular architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Plugin Selection Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Available Plugins</h2>
              
              <div className="space-y-3 mb-6">
                {availablePlugins.map((plugin) => {
                  const isSelected = selectedPlugins.includes(plugin.id);
                  const isInstalled = pluginRegistry.isInstalled(plugin.id);
                  
                  return (
                    <label 
                      key={plugin.id} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } ${
                        isInstalled ? 'opacity-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePluginToggle(plugin.id)}
                        disabled={isInstalled}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{plugin.icon}</span>
                          <span className="font-medium text-sm">{plugin.name}</span>
                        </div>
                        {plugin.dependencies && (
                          <div className="text-xs text-gray-500 mt-1">
                            Requires: {plugin.dependencies.join(', ')}
                          </div>
                        )}
                        {isInstalled && (
                          <div className="text-xs text-green-600 mt-1">
                            ✓ Installed
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              
              <button
                onClick={handleInstallPlugins}
                disabled={selectedPlugins.length === 0}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Install Selected ({selectedPlugins.length})
              </button>
              
              {installedPlugins.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">Installed Plugins</h3>
                  <div className="text-xs text-gray-500">
                    {installedPlugins.map(p => p.name).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {installedPlugins.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🔌</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Plugins Installed
                </h3>
                <p className="text-gray-600">
                  Select and install plugins from the sidebar to get started.
                </p>
              </div>
            ) : (
              <>
                {/* Plugin Tabs */}
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                      {installedPlugins.map((plugin) => (
                        <button
                          key={plugin.id}
                          onClick={() => setActiveTab(plugin.id)}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === plugin.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="mr-2">{plugin.icon}</span>
                          {plugin.name}
                        </button>
                      ))}
                    </nav>
                  </div>
                  
                  {/* Plugin Content */}
                  <div className="min-h-[500px]">
                    {ActivePluginComponent && (
                      <ActivePluginComponent
                        currentUser={mockUser}
                        communityId={mockCommunity.id}
                        community={mockCommunity}
                        userRole="owner"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Demo Component with Redux Provider
export const SkoolPluginsDemo: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <SkoolPluginsDemoContent />
      </PersistGate>
    </Provider>
  );
};

export default SkoolPluginsDemo;