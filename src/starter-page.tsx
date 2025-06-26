import React from 'react';
import { createRoot } from 'react-dom/client';

// Demo option interface
interface DemoOption {
  id: string;
  title: string;
  description: string;
  features: string[];
  status: 'ready' | 'in-progress' | 'planned';
  path: string;
  screenshot?: string;
  category: 'course-builder' | 'community-platform' | 'ui-tests' | 'architecture';
}

// Available demos
const demoOptions: DemoOption[] = [
  // Course Builder Demos
  {
    id: 'course-builder-original',
    title: 'Original Course Builder',
    description: 'The standalone course builder with full management features',
    features: [
      'Complete course CRUD operations',
      'Import/Export functionality',
      'Search and filtering',
      'Template management',
      'Progress tracking',
      'Responsive grid layout'
    ],
    status: 'ready',
    path: '/course-builder-demo',
    category: 'course-builder'
  },
  {
    id: 'course-builder-simple',
    title: 'Simplified Course Builder',
    description: 'Basic course builder without advanced features',
    features: [
      'Create and edit courses',
      'Simple grid layout',
      'Basic progress tracking',
      'Minimal UI'
    ],
    status: 'ready',
    path: '/simple-course-builder',
    category: 'course-builder'
  },

  // Community Platform Demos
  {
    id: 'skool-clone-full',
    title: 'Complete Skool Clone',
    description: 'Full community platform with all Skool features',
    features: [
      'Community Dashboard',
      'Classroom with courses',
      'Member management',
      'Calendar integration',
      'Merch store',
      'Multi-tenant architecture'
    ],
    status: 'in-progress',
    path: '/skool-clone-demo',
    category: 'community-platform'
  },
  {
    id: 'community-dashboard',
    title: 'Community Dashboard',
    description: 'Unified dashboard with tabbed interface',
    features: [
      'Community feed',
      'Classroom tab',
      'Members list',
      'Calendar view',
      'About section',
      'Plugin-based architecture'
    ],
    status: 'ready',
    path: '/community-dashboard-demo',
    category: 'community-platform'
  },
  {
    id: 'classroom-plugin',
    title: 'Classroom Plugin (Skool Style)',
    description: 'Standalone classroom page with Skool-style layout',
    features: [
      'Single-column course layout',
      'Hover menu interactions',
      'Context dropdown actions',
      'Modal editing',
      'Progress visualization',
      'Course builder integration'
    ],
    status: 'ready',
    path: '/classroom-demo',
    category: 'community-platform'
  },

  // UI Architecture Tests
  {
    id: 'ui-separation',
    title: 'UI Separation Demo',
    description: 'Test different UI implementations with same data',
    features: [
      'Pluggable UI system',
      'Runtime UI switching',
      'Full Management UI',
      'Skool-style UI',
      'Default Grid UI',
      'Configuration-driven'
    ],
    status: 'ready',
    path: '/ui-separation-demo',
    category: 'ui-tests'
  },
  {
    id: 'presentation-modes',
    title: 'Presentation Modes',
    description: 'Compare course builder vs presentation layer',
    features: [
      'Default vs Skool vs Management modes',
      'Plugin architecture demo',
      'UI component separation',
      'Configuration examples'
    ],
    status: 'ready',
    path: '/presentation-modes-demo',
    category: 'ui-tests'
  },

  // Architecture Demos
  {
    id: 'plugin-architecture',
    title: 'Plugin Architecture Demo',
    description: 'Framework-agnostic plugin system demonstration',
    features: [
      'Plugin registration',
      'Component isolation',
      'Event communication',
      'React & Next.js compatibility',
      'Multi-tenant support'
    ],
    status: 'ready',
    path: '/plugin-demo',
    category: 'architecture'
  },
  {
    id: 'framework-compatibility',
    title: 'Framework Compatibility',
    description: 'Test plugin system across different React frameworks',
    features: [
      'Vite + React demo',
      'Next.js integration',
      'Plugin hot-swapping',
      'SSR compatibility'
    ],
    status: 'planned',
    path: '/framework-test',
    category: 'architecture'
  }
];

// Category labels
const categoryLabels = {
  'course-builder': '📚 Course Builder',
  'community-platform': '🏘️ Community Platform',
  'ui-tests': '🎨 UI Architecture',
  'architecture': '🔧 System Architecture'
};

// Status badges
const StatusBadge: React.FC<{ status: DemoOption['status'] }> = ({ status }) => {
  const styles = {
    ready: 'bg-green-100 text-green-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    planned: 'bg-gray-100 text-gray-800'
  };

  const labels = {
    ready: '✅ Ready',
    'in-progress': '🚧 In Progress',
    planned: '📋 Planned'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

// Demo card component
const DemoCard: React.FC<{ demo: DemoOption }> = ({ demo }) => {
  const handleLaunch = () => {
    if (demo.status === 'ready') {
      // In a real app, this would navigate to the demo
      window.open(`${window.location.origin}${demo.path}`, '_blank');
    } else {
      alert(`${demo.title} is ${demo.status === 'in-progress' ? 'still in development' : 'planned for future release'}`);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{demo.title}</h3>
          <StatusBadge status={demo.status} />
        </div>
        <p className="text-gray-600 text-sm mb-4">{demo.description}</p>
      </div>

      {/* Features */}
      <div className="px-6 pb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Features:</h4>
        <ul className="space-y-1">
          {demo.features.slice(0, 4).map((feature, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start">
              <span className="text-green-500 mr-2 mt-0.5">•</span>
              {feature}
            </li>
          ))}
          {demo.features.length > 4 && (
            <li className="text-sm text-gray-500 italic">
              +{demo.features.length - 4} more features...
            </li>
          )}
        </ul>
      </div>

      {/* Action */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
        <button
          onClick={handleLaunch}
          disabled={demo.status === 'planned'}
          className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            demo.status === 'ready'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : demo.status === 'in-progress'
              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {demo.status === 'ready' ? 'Launch Demo' : 
           demo.status === 'in-progress' ? 'Preview (Beta)' : 
           'Coming Soon'}
        </button>
      </div>
    </div>
  );
};

// Main starter page component
const StarterPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Filter demos
  const filteredDemos = React.useMemo(() => {
    let filtered = demoOptions;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(demo => demo.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(demo =>
        demo.title.toLowerCase().includes(term) ||
        demo.description.toLowerCase().includes(term) ||
        demo.features.some(feature => feature.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [selectedCategory, searchTerm]);

  // Group demos by category
  const demosByCategory = React.useMemo(() => {
    const groups: Record<string, DemoOption[]> = {};
    
    filteredDemos.forEach(demo => {
      if (!groups[demo.category]) {
        groups[demo.category] = [];
      }
      groups[demo.category].push(demo);
    });

    return groups;
  }, [filteredDemos]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Course Framework Demo Center
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore different implementations of our course builder and community platform. 
              Test original components, Skool clone features, and architectural demonstrations.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {demoOptions.filter(d => d.status === 'ready').length}
              </div>
              <div className="text-sm text-green-800">Ready Demos</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {demoOptions.filter(d => d.status === 'in-progress').length}
              </div>
              <div className="text-sm text-yellow-800">In Progress</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(categoryLabels).length}
              </div>
              <div className="text-sm text-blue-800">Categories</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {demoOptions.reduce((acc, demo) => acc + demo.features.length, 0)}
              </div>
              <div className="text-sm text-purple-800">Total Features</div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search demos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
            </div>
            
            <div className="sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-3 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {selectedCategory === 'all' ? (
          // Show by category
          Object.entries(demosByCategory).map(([category, demos]) => (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demos.map(demo => (
                  <DemoCard key={demo.id} demo={demo} />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Show filtered results
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {searchTerm ? `Search Results (${filteredDemos.length})` : categoryLabels[selectedCategory as keyof typeof categoryLabels]}
            </h2>
            {filteredDemos.length === 0 ? (
              <div className="text-center py-12">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No demos found</h3>
                <p className="text-gray-600">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDemos.map(demo => (
                  <DemoCard key={demo.id} demo={demo} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">🏗️ Architecture</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Framework-agnostic plugin system</li>
                <li>• Pluggable UI architecture</li>
                <li>• Multi-tenant support</li>
                <li>• Component isolation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">🚀 Technologies</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• React 18 + TypeScript</li>
                <li>• Vite build system</li>
                <li>• IndexedDB storage</li>
                <li>• TailwindCSS styling</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">📋 Project Status</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Day 1-5: Core & UI ✅</li>
                <li>• Day 6-7: Billing 🚧</li>
                <li>• Week 2: Polish & Deploy 📋</li>
                <li>• Timeline: 2-4 weeks</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            Course Framework Demo Center • Built with Plugin Architecture • 
            <span className="font-medium">Ready for Production Testing</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Export component
export { StarterPage };

// Main entry point
export function StarterPageApp() {
  return <StarterPage />;
}

// Mount if this is the main entry
if (typeof document !== 'undefined') {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<StarterPageApp />);
  }
}