import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CourseProvider } from '@core/course-context';
import { CourseList } from '@plugin-course/internal/default-components/CourseList';
import { CourseEditor } from '@plugin-course/internal/default-components/CourseEditor';
import { CourseViewer } from '@plugin-course/internal/default-components/CourseViewer';
import { IndexedDBAdapter } from '@core/storage/indexeddb-adapter';
import './index.css';
// Initialize with sample data if needed
const initializeSampleData = async () => {
    try {
        const storage = new IndexedDBAdapter();
        const existingCourses = await storage.getCourses();
        if (existingCourses.length === 0) {
            const sampleCourses = [
                {
                    id: '1',
                    title: 'Introduction to React',
                    description: 'Learn the fundamentals of React including components, state, and props.',
                    modules: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isPublished: true,
                    isTemplate: false,
                    tags: ['react', 'javascript', 'frontend'],
                    coverImage: null,
                    metadata: {}
                },
                {
                    id: '2',
                    title: 'Advanced TypeScript',
                    description: 'Master TypeScript with advanced patterns and best practices.',
                    modules: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isPublished: true,
                    isTemplate: false,
                    tags: ['typescript', 'javascript'],
                    coverImage: null,
                    metadata: {}
                },
                {
                    id: '3',
                    title: 'Course Template',
                    description: 'A template for creating new courses with standard structure.',
                    modules: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isPublished: false,
                    isTemplate: true,
                    tags: ['template'],
                    coverImage: null,
                    metadata: {}
                }
            ];
            for (const course of sampleCourses) {
                await storage.saveCourse(course);
            }
            console.log('Initialized sample courses in IndexedDB');
        }
    }
    catch (error) {
        console.error('Failed to initialize sample data:', error);
    }
};
// Original course builder demo - direct component usage
function OriginalCourseBuilder() {
    const [view, setView] = React.useState('list');
    const [selectedCourseId, setSelectedCourseId] = React.useState(null);
    // Memoize the storage adapter to prevent re-creation on every render
    const storageAdapter = React.useMemo(() => new IndexedDBAdapter(), []);
    // Initialize sample data on mount
    React.useEffect(() => {
        initializeSampleData();
    }, []);
    const handleViewCourse = (courseId) => {
        setSelectedCourseId(courseId);
        setView('view');
    };
    const handleEditCourse = (courseId) => {
        setSelectedCourseId(courseId);
        setView('edit');
    };
    const handleBack = () => {
        setView('list');
        setSelectedCourseId(null);
    };
    return (_jsx(CourseProvider, { storageAdapter: storageAdapter, children: _jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("div", { className: "bg-white shadow-sm border-b", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "flex items-center justify-between h-16", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("button", { onClick: () => window.location.href = '/', className: "bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm text-gray-700 transition-colors", children: "\u2190 Back to Demo Selection" }), _jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "Original Course Builder" })] }) }) }) }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [view === 'list' && (_jsx(CourseList, { onViewCourse: handleViewCourse, onEditCourse: handleEditCourse })), view === 'edit' && selectedCourseId && (_jsxs("div", { children: [_jsx("button", { onClick: handleBack, className: "mb-4 text-blue-600 hover:text-blue-700", children: "\u2190 Back to Courses" }), _jsx(CourseEditor, { courseId: selectedCourseId, onSave: handleBack, onCancel: handleBack })] })), view === 'view' && selectedCourseId && (_jsxs("div", { children: [_jsx("button", { onClick: handleBack, className: "mb-4 text-blue-600 hover:text-blue-700", children: "\u2190 Back to Courses" }), _jsx(CourseViewer, { courseId: selectedCourseId, onEdit: () => setView('edit') })] }))] })] }) }));
}
// Mount the app
const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(_jsx(OriginalCourseBuilder, {}));
}
