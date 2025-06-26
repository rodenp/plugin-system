import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
// Available demos
const demoOptions = [
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
const StatusBadge = ({ status }) => {
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
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`, children: labels[status] }));
};
// Demo card component
const DemoCard = ({ demo }) => {
    const handleLaunch = () => {
        if (demo.status === 'ready') {
            // In a real app, this would navigate to the demo
            window.open(`${window.location.origin}${demo.path}`, '_blank');
        }
        else {
            alert(`${demo.title} is ${demo.status === 'in-progress' ? 'still in development' : 'planned for future release'}`);
        }
    };
    return (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "p-6 pb-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: demo.title }), _jsx(StatusBadge, { status: demo.status })] }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: demo.description })] }), _jsxs("div", { className: "px-6 pb-4", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Features:" }), _jsxs("ul", { className: "space-y-1", children: [demo.features.slice(0, 4).map((feature, index) => (_jsxs("li", { className: "text-sm text-gray-600 flex items-start", children: [_jsx("span", { className: "text-green-500 mr-2 mt-0.5", children: "\u2022" }), feature] }, index))), demo.features.length > 4 && (_jsxs("li", { className: "text-sm text-gray-500 italic", children: ["+", demo.features.length - 4, " more features..."] }))] })] }), _jsx("div", { className: "px-6 py-4 bg-gray-50 rounded-b-lg", children: _jsx("button", { onClick: handleLaunch, disabled: demo.status === 'planned', className: `w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${demo.status === 'ready'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : demo.status === 'in-progress'
                            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`, children: demo.status === 'ready' ? 'Launch Demo' :
                        demo.status === 'in-progress' ? 'Preview (Beta)' :
                            'Coming Soon' }) })] }));
};
// Main starter page component
const StarterPage = () => {
    const [selectedCategory, setSelectedCategory] = React.useState('all');
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
            filtered = filtered.filter(demo => demo.title.toLowerCase().includes(term) ||
                demo.description.toLowerCase().includes(term) ||
                demo.features.some(feature => feature.toLowerCase().includes(term)));
        }
        return filtered;
    }, [selectedCategory, searchTerm]);
    // Group demos by category
    const demosByCategory = React.useMemo(() => {
        const groups = {};
        filteredDemos.forEach(demo => {
            if (!groups[demo.category]) {
                groups[demo.category] = [];
            }
            groups[demo.category].push(demo);
        });
        return groups;
    }, [filteredDemos]);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white border-b border-gray-200", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6 py-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Course Framework Demo Center" }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Explore different implementations of our course builder and community platform. Test original components, Skool clone features, and architectural demonstrations." })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8", children: [_jsxs("div", { className: "bg-green-50 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: demoOptions.filter(d => d.status === 'ready').length }), _jsx("div", { className: "text-sm text-green-800", children: "Ready Demos" })] }), _jsxs("div", { className: "bg-yellow-50 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-yellow-600", children: demoOptions.filter(d => d.status === 'in-progress').length }), _jsx("div", { className: "text-sm text-yellow-800", children: "In Progress" })] }), _jsxs("div", { className: "bg-blue-50 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: Object.keys(categoryLabels).length }), _jsx("div", { className: "text-sm text-blue-800", children: "Categories" })] }), _jsxs("div", { className: "bg-purple-50 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: demoOptions.reduce((acc, demo) => acc + demo.features.length, 0) }), _jsx("div", { className: "text-sm text-purple-800", children: "Total Features" })] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx("svg", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }), _jsx("input", { type: "text", placeholder: "Search demos...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" })] }) }), _jsx("div", { className: "sm:w-64", children: _jsxs("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "w-full py-3 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "all", children: "All Categories" }), Object.entries(categoryLabels).map(([key, label]) => (_jsx("option", { value: key, children: label }, key)))] }) })] })] }) }), _jsx("div", { className: "max-w-7xl mx-auto px-6 py-8", children: selectedCategory === 'all' ? (
                // Show by category
                Object.entries(demosByCategory).map(([category, demos]) => (_jsxs("div", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold text-gray-900 mb-6", children: categoryLabels[category] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: demos.map(demo => (_jsx(DemoCard, { demo: demo }, demo.id))) })] }, category)))) : (
                // Show filtered results
                _jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-semibold text-gray-900 mb-6", children: searchTerm ? `Search Results (${filteredDemos.length})` : categoryLabels[selectedCategory] }), filteredDemos.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("svg", { className: "h-12 w-12 text-gray-400 mx-auto mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No demos found" }), _jsx("p", { className: "text-gray-600", children: "Try adjusting your search or filter" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredDemos.map(demo => (_jsx(DemoCard, { demo: demo }, demo.id))) }))] })) }), _jsx("footer", { className: "bg-white border-t border-gray-200 mt-16", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6 py-12", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "\uD83C\uDFD7\uFE0F Architecture" }), _jsxs("ul", { className: "space-y-2 text-sm text-gray-600", children: [_jsx("li", { children: "\u2022 Framework-agnostic plugin system" }), _jsx("li", { children: "\u2022 Pluggable UI architecture" }), _jsx("li", { children: "\u2022 Multi-tenant support" }), _jsx("li", { children: "\u2022 Component isolation" })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "\uD83D\uDE80 Technologies" }), _jsxs("ul", { className: "space-y-2 text-sm text-gray-600", children: [_jsx("li", { children: "\u2022 React 18 + TypeScript" }), _jsx("li", { children: "\u2022 Vite build system" }), _jsx("li", { children: "\u2022 IndexedDB storage" }), _jsx("li", { children: "\u2022 TailwindCSS styling" })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-4", children: "\uD83D\uDCCB Project Status" }), _jsxs("ul", { className: "space-y-2 text-sm text-gray-600", children: [_jsx("li", { children: "\u2022 Day 1-5: Core & UI \u2705" }), _jsx("li", { children: "\u2022 Day 6-7: Billing \uD83D\uDEA7" }), _jsx("li", { children: "\u2022 Week 2: Polish & Deploy \uD83D\uDCCB" }), _jsx("li", { children: "\u2022 Timeline: 2-4 weeks" })] })] })] }), _jsxs("div", { className: "mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500", children: ["Course Framework Demo Center \u2022 Built with Plugin Architecture \u2022", _jsx("span", { className: "font-medium", children: "Ready for Production Testing" })] })] }) })] }));
};
// Export component
export { StarterPage };
// Main entry point
export function StarterPageApp() {
    return _jsx(StarterPage, {});
}
// Mount if this is the main entry
if (typeof document !== 'undefined') {
    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        root.render(_jsx(StarterPageApp, {}));
    }
}
