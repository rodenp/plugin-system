import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@store';
import { pluginRegistry } from '@store/plugin-registry';
import type { SkoolPlugin } from '@store/types';
import { CourseProvider } from '@core/course-context';

// Import plugins
import { communityPlugin } from '@/plugins/community';
import { classroomPlugin } from '@/plugins/classroom';
import { calendarPlugin } from '@/plugins/calendar';
import { membersPlugin } from '@/plugins/members';
import { merchandisePlugin } from '@/plugins/merchandise';
import { aboutPlugin } from '@/plugins/about';
import { courseBuilderPlugin } from '@/plugins/course-builder';
import { defaultTheme } from '@/plugins/shared/default-theme';

// Demo option for our specific implementations
interface SkoolDemoOption {
  id: string;
  title: string;
  description: string;
  features: string[];
  path: string;
  category: 'original' | 'skool-clone' | 'plugin-system';
  useCase: string;
}

// All demo options
const skoolDemoOptions: SkoolDemoOption[] = [
  {
    id: 'original-course-builder',
    title: 'Original Course Builder',
    description: 'Administrative course management system',
    features: ['Search & filtering', 'Import/Export', 'Templates', 'Admin tools'],
    path: '/course-builder.html',
    category: 'original',
    useCase: 'For course administrators and educational platforms'
  },

  {
    id: 'plugin-system',
    title: '🎉 New Plugin System',
    description: 'Modular plugin architecture with dynamic installation',
    features: ['Plugin Registry', 'Redux Store', 'Dynamic Loading', 'IndexedDB'],
    path: '/plugin-demo.html',
    category: 'plugin-system',
    useCase: 'For developers building extensible platforms'
  },
];

// Demo card component
const SkoolDemoCard: React.FC<{ demo: SkoolDemoOption }> = ({ demo }) => {
  const handleLaunch = () => {
    // Navigate in the same window
    window.location.href = demo.path;
  };

  const categoryColors = {
    original: 'bg-blue-50 border-blue-200 text-blue-800',
    'skool-clone': 'bg-purple-50 border-purple-200 text-purple-800',
    'plugin-system': 'bg-green-50 border-green-200 text-green-800'
  };

  const categoryLabels = {
    original: '📚 Original',
    'skool-clone': '🏘️ Skool Clone',
    'plugin-system': '🔌 Plugin System'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{demo.title}</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[demo.category]}`}>
            {categoryLabels[demo.category]}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4">{demo.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {demo.features.map((feature, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
              {feature}
            </span>
          ))}
        </div>
        
        <button
          onClick={handleLaunch}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 transition-colors"
        >
          Launch →
        </button>
      </div>
    </div>
  );
};

// Special Plugin System Card with embedded checkboxes
const PluginSystemCard: React.FC = () => {
  const [availablePlugins, setAvailablePlugins] = React.useState<SkoolPlugin[]>([]);
  const [selectedPlugins, setSelectedPlugins] = React.useState<string[]>([]);
  const [showDemo, setShowDemo] = React.useState(false);
  const [installedPlugins, setInstalledPlugins] = React.useState<SkoolPlugin[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>('');

  // Custom theme with green buttons
  const customTheme = {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      secondary: '#22c55e', // Change from blue to green
      accent: '#16a34a', // Darker green for accents
    }
  };

  // Sample posts for community plugin
const samplePosts = [
  { 
    id: '1', 
    author: 'Sarah Johnson', 
    time: '2h', 
    content: 'Just completed my first 10K run! The training program in this community has been amazing. Thank you everyone for the support! 🏃‍♀️', 
    likes: 24, 
    comments: 8, 
    isPinned: false,
    level: 6,
    commenters: [
      { initials: 'MJ', avatarUrl: null },
      { initials: 'EC', avatarUrl: null },
      { initials: 'RS', avatarUrl: null },
      { initials: 'AH', avatarUrl: null },
      { initials: 'TB', avatarUrl: null }
    ],
    newCommentTimeAgo: '23m ago'
  },
  { 
    id: '2', 
    author: 'Mike Chen', 
    time: '4h', 
    content: 'New workout video is up! Today we\'re focusing on core strength and stability. Perfect for beginners and advanced athletes alike.', 
    likes: 18, 
    comments: 12, 
    isPinned: true,
    level: 3,
    commenters: [
      { initials: 'LS', avatarUrl: null },
      { initials: 'AK', avatarUrl: null },
      { initials: 'JD', avatarUrl: null }
    ],
    newCommentTimeAgo: '2h ago'
  },
  { 
    id: '3', 
    author: 'Emily Davis', 
    time: '6h', 
    content: 'Question for the group: What\'s your favorite pre-workout snack? Looking for some healthy options that give good energy.', 
    likes: 12, 
    comments: 15, 
    isPinned: false,
    level: 9,
    commenters: [
      { initials: 'JW', avatarUrl: null },
      { initials: 'BA', avatarUrl: null },
      { initials: 'SC', avatarUrl: null },
      { initials: 'LM', avatarUrl: null },
      { initials: 'HK', avatarUrl: null }
    ],
    newCommentTimeAgo: '15m ago'
  }
];

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
    theme: customTheme
  } as any;

  React.useEffect(() => {
    // Register all plugins
    pluginRegistry.register(courseBuilderPlugin);
    pluginRegistry.register(communityPlugin);
    pluginRegistry.register(classroomPlugin);
    pluginRegistry.register(calendarPlugin);
    pluginRegistry.register(membersPlugin);
    pluginRegistry.register(merchandisePlugin);
    pluginRegistry.register(aboutPlugin);
    
    // Get available plugins (exclude course-builder as it's not shown as a tab)
    const plugins = pluginRegistry.getAllPlugins().filter(p => p.id !== 'course-builder');
    setAvailablePlugins(plugins);
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
      pluginRegistry.installMany(selectedPlugins);
      const installed = pluginRegistry.getInstalledPlugins().filter(p => p.id !== 'course-builder');
      setInstalledPlugins(installed);
      if (installed.length > 0 && !activeTab) {
        setActiveTab(installed[0].id);
      }
      setShowDemo(true);
    } catch (error) {
      alert(`Plugin installation failed: ${(error as Error).message}`);
    }
  };

  const handleBackToSelection = () => {
    // Reset all plugin state
    setShowDemo(false);
    setSelectedPlugins([]);
    setInstalledPlugins([]);
    setActiveTab('');
    
    // Uninstall all plugins from registry
    const allInstalled = pluginRegistry.getInstalledPlugins();
    allInstalled.forEach(plugin => {
      pluginRegistry.uninstall(plugin.id);
    });
  };

  if (showDemo) {
    const ActivePluginComponent = activeTab ? 
      pluginRegistry.getThemedPlugin(activeTab)?.component : 
      null;

    return (
      <Provider store={store}>
        <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <div className="min-h-screen bg-gray-100">
              {/* Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">🎉 Plugin System Demo</h1>
                    <p className="text-gray-600">Installed: {installedPlugins.map(p => p.name).join(', ')}</p>
                  </div>
                  <button
                    onClick={handleBackToSelection}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  >
                    ← Back to Demo Selection
                  </button>
                </div>
              </div>

              {/* Plugin Tabs */}
              <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto">
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
                        {plugin.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
              
              {/* Plugin Content */}
              <div className="max-w-7xl mx-auto">
                {ActivePluginComponent && (
                  <CourseProvider>
                    <ActivePluginComponent
                      currentUser={mockUser}
                      communityId={mockCommunity.id}
                      community={mockCommunity}
                      userRole="owner"
                      posts={activeTab === 'community' ? samplePosts : undefined}
                    />
                  </CourseProvider>
                )}
              </div>
            </div>
          </div>
        </PersistGate>
      </Provider>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">🎉 New Plugin System</h3>
          <span className="px-2 py-1 rounded text-xs font-medium bg-green-50 border-green-200 text-green-800">
            🔌 Plugin System
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4">Modular plugin architecture with dynamic installation</p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {['Plugin Registry', 'Redux Store', 'Dynamic Loading', 'IndexedDB'].map((feature, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
              {feature}
            </span>
          ))}
        </div>

        {/* Plugin Selection Grid */}
        <div className="mb-4">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Select Plugins to Install:</h4>
          <div className="grid grid-cols-2 gap-2">
            {availablePlugins.map((plugin) => {
              const isSelected = selectedPlugins.includes(plugin.id);
              
              return (
                <label 
                  key={plugin.id} 
                  className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handlePluginToggle(plugin.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-xs font-medium">{plugin.name}</span>
                </label>
              );
            })}
          </div>
        </div>
        
        <button
          onClick={handleInstallPlugins}
          disabled={selectedPlugins.length === 0}
          className="w-full bg-green-600 text-white py-2 px-4 rounded font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Launch with Selected Plugins ({selectedPlugins.length})
        </button>
      </div>
    </div>
  );
};

// Main starter page component
const SkoolCloneStarter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Filter demos
  const filteredDemos = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return skoolDemoOptions;
    }
    return skoolDemoOptions.filter(demo => demo.category === selectedCategory);
  }, [selectedCategory]);

  // Group demos by category for display
  const originalDemos = skoolDemoOptions.filter(d => d.category === 'original');
  const skoolCloneDemos = skoolDemoOptions.filter(d => d.category === 'skool-clone');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Choose Your Demo
            </h1>
            <p className="text-gray-600">
              Test the original course builder vs the Skool clone
            </p>
          </div>
        </div>
      </div>

      {/* Demo Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skoolDemoOptions.map(demo => {
            // Use special plugin system card for the plugin demo
            if (demo.id === 'plugin-system') {
              return <PluginSystemCard key={demo.id} />;
            }
            return <SkoolDemoCard key={demo.id} demo={demo} />;
          })}
        </div>
      </div>

    </div>
  );
};

// Export component
export { SkoolCloneStarter };

// Main entry point
export function SkoolCloneStarterApp() {
  return <SkoolCloneStarter />;
}

// Mount if this is the main entry
if (typeof document !== 'undefined') {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<SkoolCloneStarterApp />);
  }
}