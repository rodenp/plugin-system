import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { CourseProvider } from '../../../core/course-context';
import { CourseList, CourseEditor, CourseViewer } from './index';
export function CourseFrameworkDemo() {
    const [view, setView] = useState('list');
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    return (_jsx(CourseProvider, { children: _jsxs("div", { className: "min-h-screen bg-gray-50", children: [view === 'list' && (_jsx("div", { className: "container mx-auto py-8", children: _jsx(CourseList, { onViewCourse: (id) => {
                            setSelectedCourseId(id);
                            setView('viewer');
                        }, onEditCourse: (id) => {
                            setSelectedCourseId(id);
                            setView('editor');
                        } }) })), view === 'editor' && selectedCourseId && (_jsx(CourseEditor, { courseId: selectedCourseId, onBack: () => {
                        setView('list');
                        setSelectedCourseId(null);
                    }, onViewMode: () => setView('viewer') })), view === 'viewer' && selectedCourseId && (_jsx(CourseViewer, { courseId: selectedCourseId, onBack: () => {
                        setView('list');
                        setSelectedCourseId(null);
                    } }))] }) }));
}
export default CourseFrameworkDemo;
