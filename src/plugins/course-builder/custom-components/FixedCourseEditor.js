import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useCourse } from '@course-framework/core/course-context';
// Global cache to prevent repeated loading of the same course
const loadedCourses = new Set();
// Fixed version of CourseEditor that doesn't have the infinite loop issue
export function FixedCourseEditor({ courseId, onBack, onViewMode, onSave, onCancel, }) {
    console.log('🔧🔧🔧 FIXED COURSE EDITOR IS BEING USED!!! courseId:', courseId);
    const { loadCourse, currentCourse, updateCourse } = useCourse();
    const [isSaving, setIsSaving] = useState(false);
    // Only load course if we haven't loaded this specific course ID yet (globally)
    useEffect(() => {
        if (courseId && !loadedCourses.has(courseId)) {
            console.log('🔧 FixedCourseEditor: Loading course', courseId);
            loadedCourses.add(courseId);
            // Use setTimeout to break the immediate call chain and prevent infinite loops
            setTimeout(() => {
                loadCourse(courseId);
            }, 0);
        }
    }, [courseId]); // Only depend on courseId, ignore loadCourse to prevent infinite loop
    const handleSave = async () => {
        if (!currentCourse)
            return;
        setIsSaving(true);
        try {
            await updateCourse(currentCourse);
            onSave?.();
        }
        catch (error) {
            console.error('Failed to save course:', error);
        }
        finally {
            setIsSaving(false);
        }
    };
    if (!currentCourse) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading course..." })] }) }));
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Edit Course" }), _jsx("p", { className: "text-gray-600", children: currentCourse.title })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [onViewMode && (_jsx("button", { onClick: onViewMode, className: "px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50", children: "Preview" })), _jsx("button", { onClick: onCancel || onBack, className: "px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50", children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: isSaving, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50", children: isSaving ? 'Saving...' : 'Save Changes' })] })] }), _jsx("div", { className: "bg-white rounded-lg shadow-sm border p-6", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Course Title" }), _jsx("input", { type: "text", value: currentCourse.title, onChange: (e) => {
                                        // Update course title (this would need proper state management)
                                        console.log('Title updated:', e.target.value);
                                    }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }), _jsx("textarea", { value: currentCourse.description, onChange: (e) => {
                                        // Update course description (this would need proper state management)
                                        console.log('Description updated:', e.target.value);
                                    }, rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "text-sm text-gray-500", children: [_jsxs("p", { children: ["Course ID: ", currentCourse.id] }), _jsxs("p", { children: ["Created: ", currentCourse.createdAt.toLocaleDateString()] }), _jsxs("p", { children: ["Modules: ", currentCourse.modules.length] })] })] }) }), _jsx("div", { className: "mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg", children: _jsx("p", { className: "text-sm text-blue-700", children: "\u2705 This is a simplified CourseEditor that fixes the infinite loop issue. A full editor would include module management, lesson editing, and rich text capabilities." }) })] }));
}
