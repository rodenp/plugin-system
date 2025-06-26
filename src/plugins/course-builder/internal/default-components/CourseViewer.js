import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle, Circle, Clock, BookOpen, Play } from 'lucide-react';
import { defaultTheme } from '@/core/theme/default-theme';
import { newEventBus, EVENTS } from '@/core/new-event-bus';
import './course-viewer.css';
export function CourseViewer({ courseId, onBack, onEdit, theme, course, onUpdateCourse }) {
    const appliedTheme = theme ?? defaultTheme;
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [, setCurrentLessonIndex] = useState(0);
    if (!course) {
        return (_jsx("div", { style: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { className: "animate-spin", style: {
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: 'transparent',
                            borderBottomColor: appliedTheme.colors.secondary || '#3b82f6',
                            margin: '0 auto 1rem',
                        } }), _jsx("p", { style: { color: appliedTheme.colors.textSecondary }, children: "Loading course..." })] }) }));
    }
    const calculateProgress = () => {
        if (!course?.modules)
            return 0;
        const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
        const completedLessons = course.modules.reduce((total, module) => total + module.lessons.filter(lesson => lesson.isCompleted).length, 0);
        return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    };
    const toggleLessonComplete = async (moduleId, lessonId) => {
        const updatedCourse = { ...course };
        const moduleIndex = updatedCourse.modules.findIndex(m => m.id === moduleId);
        const lessonIndex = updatedCourse.modules[moduleIndex].lessons.findIndex(l => l.id === lessonId);
        if (moduleIndex === -1 || lessonIndex === -1)
            return;
        const lesson = updatedCourse.modules[moduleIndex].lessons[lessonIndex];
        const wasCompleted = lesson.isCompleted;
        updatedCourse.modules[moduleIndex].lessons[lessonIndex].isCompleted = !wasCompleted;
        updatedCourse.progress = calculateProgress();
        await onUpdateCourse(courseId, updatedCourse);
        // Emit lesson completion event if lesson was just completed
        if (!wasCompleted) {
            newEventBus.emit(EVENTS.LESSON_COMPLETED, {
                courseId,
                courseTitle: course.title,
                moduleId,
                lessonId,
                lessonTitle: lesson.title,
                lessonDuration: lesson.duration
            }, 'course-viewer');
        }
    };
    const selectLesson = (lesson, moduleIndex, lessonIndex) => {
        setSelectedLesson(lesson);
        setCurrentModuleIndex(moduleIndex);
        setCurrentLessonIndex(lessonIndex);
    };
    const getCurrentLesson = () => {
        if (selectedLesson)
            return selectedLesson;
        if (!course || !course.modules || course.modules.length === 0)
            return null;
        return course.modules[0]?.lessons[0] || null;
    };
    const renderContent = (content) => {
        switch (content.type) {
            case 'text':
                if (content.content.type === 'text') {
                    return (_jsx("div", { style: {
                            fontSize: '1rem',
                            lineHeight: '1.75',
                            color: appliedTheme.colors.textPrimary,
                            maxWidth: 'none'
                        }, dangerouslySetInnerHTML: { __html: content.content.content } }));
                }
                break;
            case 'image':
                return (_jsxs("div", { style: { margin: '1rem 0' }, children: [_jsx("img", { src: content.content.url, alt: content.content.title || 'Course image', style: {
                                width: '100%',
                                borderRadius: '0.5rem',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                            } }), content.content.caption && (_jsx("p", { style: { fontSize: '0.875rem', color: appliedTheme.colors.textSecondary, marginTop: '0.5rem' }, children: content.content.caption }))] }));
            case 'video':
                return (_jsxs("div", { style: { margin: '1rem 0' }, children: [_jsx("video", { controls: true, style: {
                                width: '100%',
                                borderRadius: '0.5rem',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                            }, src: content.content.url }), content.content.caption && (_jsx("p", { style: { fontSize: '0.875rem', color: appliedTheme.colors.textSecondary, marginTop: '0.5rem' }, children: content.content.caption }))] }));
            case 'audio':
                return (_jsxs("div", { style: { margin: '1rem 0' }, children: [_jsx("audio", { controls: true, style: { width: '100%' }, src: content.content.url }), content.content.caption && (_jsx("p", { style: { fontSize: '0.875rem', color: appliedTheme.colors.textSecondary, marginTop: '0.5rem' }, children: content.content.caption }))] }));
            default:
                return _jsx("div", { children: "Unsupported content type" });
        }
    };
    const currentLesson = getCurrentLesson();
    const progress = calculateProgress();
    return (_jsxs("div", { style: { minHeight: '100vh', backgroundColor: appliedTheme.colors.backgroundAlt }, children: [_jsx("div", { style: { backgroundColor: appliedTheme.colors.surface, borderBottom: `1px solid ${appliedTheme.borders.borderColor}` }, children: _jsxs("div", { style: { maxWidth: '80rem', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between' }, children: [_jsx(Button, { variant: "ghost", onClick: onBack, theme: appliedTheme, children: "\u2190 Back to Courses" }), _jsx(Badge, { variant: "secondary", theme: appliedTheme, children: "Student View" })] }) }), _jsxs("div", { style: { maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem', display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }, children: [_jsx("style", { children: `@media (min-width: 1024px) { .course-viewer-grid { grid-template-columns: 1fr 3fr; } }` }), _jsxs("div", { className: "course-viewer-grid", style: { display: 'grid', gap: '2rem' }, children: [_jsx("div", { children: _jsxs(Card, { theme: appliedTheme, children: [_jsxs(CardHeader, { theme: appliedTheme, children: [_jsx(CardTitle, { theme: appliedTheme, children: course.title }), _jsxs("div", { style: { marginTop: '0.5rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }, children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [progress, "%"] })] }), _jsx(Progress, { value: progress, theme: appliedTheme })] })] }), _jsx(CardContent, { theme: appliedTheme, children: course.modules.map((module, moduleIndex) => (_jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsxs("h4", { style: { fontWeight: '500', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }, children: [_jsx(BookOpen, { style: { width: '1rem', height: '1rem' } }), " ", module.title] }), _jsx("div", { style: { marginLeft: '1.5rem' }, children: module.lessons.map((lesson, lessonIndex) => (_jsx("div", { onClick: () => selectLesson(lesson, moduleIndex, lessonIndex), style: {
                                                                padding: '0.5rem',
                                                                borderRadius: '0.375rem',
                                                                backgroundColor: selectedLesson?.id === lesson.id
                                                                    ? appliedTheme.colors.backgroundAlt
                                                                    : 'transparent',
                                                                borderLeft: selectedLesson?.id === lesson.id
                                                                    ? `3px solid ${appliedTheme.colors.secondary}`
                                                                    : 'none',
                                                                cursor: 'pointer',
                                                                marginBottom: '0.25rem'
                                                            }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); toggleLessonComplete(module.id, lesson.id); }, style: { background: 'none', border: 'none', padding: 0, cursor: 'pointer' }, children: lesson.isCompleted
                                                                            ? _jsx(CheckCircle, { style: { width: '1rem', height: '1rem', color: appliedTheme.colors.success || '#22c55e' } })
                                                                            : _jsx(Circle, { style: { width: '1rem', height: '1rem', color: appliedTheme.colors.textSecondary } }) }), _jsx("span", { children: lesson.title }), lesson.duration && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', fontSize: '0.75rem', gap: '0.25rem', color: appliedTheme.colors.textSecondary }, children: [_jsx(Clock, { style: { width: '0.75rem', height: '0.75rem' } }), " ", lesson.duration, "m"] }))] }) }, lesson.id))) })] }, module.id))) })] }) }), _jsx("div", { style: { flex: 1 }, children: currentLesson ? (_jsxs(Card, { theme: appliedTheme, children: [_jsxs(CardHeader, { theme: appliedTheme, style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx(CardTitle, { theme: appliedTheme, children: currentLesson.title }), _jsx("p", { style: { color: appliedTheme.colors.textSecondary, marginTop: '0.25rem' }, children: currentLesson.description })] }), _jsx(Button, { variant: currentLesson.isCompleted ? "default" : "outline", onClick: () => toggleLessonComplete(course.modules[currentModuleIndex].id, currentLesson.id), theme: appliedTheme, children: currentLesson.isCompleted ? 'Completed' : 'Mark Complete' })] }), _jsx(CardContent, { theme: appliedTheme, children: _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' }, children: currentLesson.content
                                                    .sort((a, b) => a.order - b.order)
                                                    .map(content => _jsx("div", { children: renderContent(content) }, content.id)) }) })] })) : (_jsx(Card, { theme: appliedTheme, children: _jsx(CardContent, { theme: appliedTheme, style: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx(Play, { style: { width: '3rem', height: '3rem', margin: '0 auto 1rem', color: appliedTheme.colors.textSecondary } }), _jsx("h3", { style: { fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }, children: "Start Learning" }), _jsx("p", { style: { color: appliedTheme.colors.textSecondary }, children: "Select a lesson from the sidebar to begin" })] }) }) })) })] })] })] }));
}
