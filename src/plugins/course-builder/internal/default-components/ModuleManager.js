import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Video, FileText, Image as ImageIcon, Headphones, ChevronDown, ChevronRight, Clock, GripVertical, Copy } from 'lucide-react';
import { useCourse } from '@/core/course-context';
export function ModuleManager({ course, onCourseUpdate }) {
    const { updateCourse } = useCourse();
    const [expandedModules, setExpandedModules] = useState(new Set());
    const [showModuleDialog, setShowModuleDialog] = useState(false);
    const [showLessonDialog, setShowLessonDialog] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [editingLesson, setEditingLesson] = useState({ moduleId: '', lesson: null });
    const [moduleFormData, setModuleFormData] = useState({ title: '', description: '' });
    const [lessonFormData, setLessonFormData] = useState({
        title: '',
        description: '',
        duration: 0,
        type: 'video'
    });
    const [isSaving, setIsSaving] = useState(false);
    const toggleModuleExpansion = (moduleId) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        }
        else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };
    const handleAddModule = () => {
        setEditingModule(null);
        setModuleFormData({ title: '', description: '' });
        setShowModuleDialog(true);
    };
    const handleEditModule = (module) => {
        setEditingModule(module);
        setModuleFormData({ title: module.title, description: module.description });
        setShowModuleDialog(true);
    };
    const handleAddLesson = (moduleId) => {
        setEditingLesson({ moduleId, lesson: null });
        setLessonFormData({ title: '', description: '', duration: 0, type: 'video' });
        setShowLessonDialog(true);
    };
    const handleEditLesson = (moduleId, lesson) => {
        setEditingLesson({ moduleId, lesson });
        setLessonFormData({
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            type: lesson.content[0]?.type === 'video' ? 'video' : 'text'
        });
        setShowLessonDialog(true);
    };
    const saveModule = async () => {
        if (!moduleFormData.title.trim())
            return;
        try {
            setIsSaving(true);
            const updatedCourse = { ...course };
            if (editingModule) {
                // Edit existing module
                const moduleIndex = updatedCourse.modules.findIndex(m => m.id === editingModule.id);
                if (moduleIndex !== -1) {
                    updatedCourse.modules[moduleIndex] = {
                        ...editingModule,
                        title: moduleFormData.title,
                        description: moduleFormData.description,
                        updatedAt: new Date()
                    };
                }
            }
            else {
                // Add new module
                const newModule = {
                    id: `module-${Date.now()}`,
                    title: moduleFormData.title,
                    description: moduleFormData.description,
                    lessons: [],
                    order: updatedCourse.modules.length,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                updatedCourse.modules.push(newModule);
            }
            updatedCourse.updatedAt = new Date();
            await updateCourse(updatedCourse);
            onCourseUpdate?.(updatedCourse);
            setShowModuleDialog(false);
        }
        catch (error) {
            console.error('Failed to save module:', error);
        }
        finally {
            setIsSaving(false);
        }
    };
    const saveLesson = async () => {
        if (!lessonFormData.title.trim() || !editingLesson.moduleId)
            return;
        try {
            setIsSaving(true);
            const updatedCourse = { ...course };
            const moduleIndex = updatedCourse.modules.findIndex(m => m.id === editingLesson.moduleId);
            if (moduleIndex === -1)
                return;
            const module = updatedCourse.modules[moduleIndex];
            if (editingLesson.lesson) {
                // Edit existing lesson
                const lessonIndex = module.lessons.findIndex(l => l.id === editingLesson.lesson.id);
                if (lessonIndex !== -1) {
                    module.lessons[lessonIndex] = {
                        ...editingLesson.lesson,
                        title: lessonFormData.title,
                        description: lessonFormData.description,
                        duration: lessonFormData.duration,
                        updatedAt: new Date()
                    };
                }
            }
            else {
                // Add new lesson
                const defaultContent = [{
                        id: `content-${Date.now()}`,
                        type: lessonFormData.type,
                        content: lessonFormData.type === 'video'
                            ? { type: 'video', url: '', title: lessonFormData.title }
                            : { type: 'text', content: '' },
                        order: 0
                    }];
                const newLesson = {
                    id: `lesson-${Date.now()}`,
                    title: lessonFormData.title,
                    description: lessonFormData.description,
                    content: defaultContent,
                    duration: lessonFormData.duration,
                    order: module.lessons.length,
                    isCompleted: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                module.lessons.push(newLesson);
            }
            module.updatedAt = new Date();
            updatedCourse.updatedAt = new Date();
            await updateCourse(updatedCourse);
            onCourseUpdate?.(updatedCourse);
            setShowLessonDialog(false);
        }
        catch (error) {
            console.error('Failed to save lesson:', error);
        }
        finally {
            setIsSaving(false);
        }
    };
    const deleteModule = async (moduleId) => {
        if (!confirm('Are you sure you want to delete this module and all its lessons?'))
            return;
        try {
            const updatedCourse = {
                ...course,
                modules: course.modules.filter(m => m.id !== moduleId),
                updatedAt: new Date()
            };
            await updateCourse(updatedCourse);
            onCourseUpdate?.(updatedCourse);
        }
        catch (error) {
            console.error('Failed to delete module:', error);
        }
    };
    const deleteLesson = async (moduleId, lessonId) => {
        if (!confirm('Are you sure you want to delete this lesson?'))
            return;
        try {
            const updatedCourse = { ...course };
            const moduleIndex = updatedCourse.modules.findIndex(m => m.id === moduleId);
            if (moduleIndex !== -1) {
                updatedCourse.modules[moduleIndex].lessons =
                    updatedCourse.modules[moduleIndex].lessons.filter(l => l.id !== lessonId);
                updatedCourse.modules[moduleIndex].updatedAt = new Date();
                updatedCourse.updatedAt = new Date();
                await updateCourse(updatedCourse);
                onCourseUpdate?.(updatedCourse);
            }
        }
        catch (error) {
            console.error('Failed to delete lesson:', error);
        }
    };
    const duplicateModule = async (module) => {
        try {
            const duplicatedModule = {
                ...module,
                id: `module-${Date.now()}`,
                title: `${module.title} (Copy)`,
                order: course.modules.length,
                lessons: module.lessons.map(lesson => ({
                    ...lesson,
                    id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    order: lesson.order,
                    createdAt: new Date(),
                    updatedAt: new Date()
                })),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const updatedCourse = {
                ...course,
                modules: [...course.modules, duplicatedModule],
                updatedAt: new Date()
            };
            await updateCourse(updatedCourse);
            onCourseUpdate?.(updatedCourse);
        }
        catch (error) {
            console.error('Failed to duplicate module:', error);
        }
    };
    const getLessonIcon = (lesson) => {
        const contentType = lesson.content[0]?.type;
        switch (contentType) {
            case 'video':
                return _jsx(Video, { className: "h-4 w-4" });
            case 'audio':
                return _jsx(Headphones, { className: "h-4 w-4" });
            case 'image':
                return _jsx(ImageIcon, { className: "h-4 w-4" });
            default:
                return _jsx(FileText, { className: "h-4 w-4" });
        }
    };
    const formatDuration = (minutes) => {
        if (minutes < 60)
            return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };
    const calculateModuleDuration = (module) => {
        return module.lessons.reduce((total, lesson) => total + lesson.duration, 0);
    };
    const calculateTotalDuration = () => {
        return course.modules.reduce((total, module) => total + calculateModuleDuration(module), 0);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold", style: { color: 'var(--course-builder-text-primary)' }, children: "Course Content" }), _jsxs("p", { className: "text-sm", style: { color: 'var(--course-builder-text-secondary)' }, children: [course.modules.length, " modules \u2022 ", course.modules.reduce((total, m) => total + m.lessons.length, 0), " lessons \u2022 ", formatDuration(calculateTotalDuration())] })] }), _jsxs(Button, { onClick: handleAddModule, children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Module"] })] }), _jsx("div", { className: "space-y-4", children: course.modules.length === 0 ? (_jsx(Card, { className: "border-dashed", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(FileText, { className: "h-12 w-12 text-gray-400 mb-4" }), _jsx("h3", { className: "text-lg font-medium mb-2", style: { color: 'var(--course-builder-text-primary)' }, children: "No modules yet" }), _jsx("p", { className: "text-center mb-4", style: { color: 'var(--course-builder-text-secondary)' }, children: "Start building your course by adding modules and lessons" }), _jsxs(Button, { onClick: handleAddModule, children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Your First Module"] })] }) })) : (course.modules.map((module, moduleIndex) => {
                    const isExpanded = expandedModules.has(module.id);
                    const moduleDuration = calculateModuleDuration(module);
                    return (_jsxs(Card, { className: "overflow-hidden", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3 flex-1", children: [_jsx("button", { onClick: () => toggleModuleExpansion(module.id), className: "p-1 hover:bg-gray-100 rounded", children: isExpanded ? (_jsx(ChevronDown, { className: "h-4 w-4" })) : (_jsx(ChevronRight, { className: "h-4 w-4" })) }), _jsx(GripVertical, { className: "h-4 w-4", style: { color: 'var(--course-builder-text-muted)' } }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Badge, { variant: "outline", className: "text-xs", children: ["Module ", moduleIndex + 1] }), _jsx(CardTitle, { className: "text-lg", children: module.title })] }), _jsx(CardDescription, { className: "mt-1", children: module.description }), _jsxs("div", { className: "flex items-center gap-4 mt-2 text-sm", style: { color: 'var(--course-builder-text-secondary)' }, children: [_jsxs("span", { children: [module.lessons.length, " lessons"] }), moduleDuration > 0 && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "h-3 w-3" }), formatDuration(moduleDuration)] }))] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleAddLesson(module.id), children: _jsx(Plus, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => duplicateModule(module), children: _jsx(Copy, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleEditModule(module), children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => deleteModule(module.id), className: "hover:opacity-80", style: { color: 'var(--course-builder-error, #ef4444)' }, children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }) }), isExpanded && (_jsx(CardContent, { className: "pt-0", children: _jsx("div", { className: "space-y-2 pl-6", children: module.lessons.length === 0 ? (_jsxs("div", { className: "text-center py-8", style: { color: 'var(--course-builder-text-muted)' }, children: [_jsx(FileText, { className: "h-8 w-8 mx-auto mb-2", style: { color: 'var(--course-builder-text-muted)' } }), _jsx("p", { className: "text-sm", children: "No lessons in this module" }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleAddLesson(module.id), className: "mt-2", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Lesson"] })] })) : (module.lessons.map((lesson, lessonIndex) => (_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg transition-colors hover:opacity-80", style: { backgroundColor: 'var(--course-builder-bg-muted)' }, children: [_jsxs("div", { className: "flex items-center gap-3 flex-1", children: [_jsx(GripVertical, { className: "h-4 w-4", style: { color: 'var(--course-builder-text-muted)' } }), getLessonIcon(lesson), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium", children: lesson.title }), lesson.duration > 0 && (_jsx(Badge, { variant: "outline", className: "text-xs", children: formatDuration(lesson.duration) }))] }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--course-builder-text-secondary)' }, children: lesson.description })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleEditLesson(module.id, lesson), children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => deleteLesson(module.id, lesson.id), className: "hover:opacity-80", style: { color: 'var(--course-builder-error, #ef4444)' }, children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }, lesson.id)))) }) }))] }, module.id));
                })) }), _jsx(Dialog, { open: showModuleDialog, onOpenChange: setShowModuleDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingModule ? 'Edit Module' : 'Add New Module' }), _jsx(DialogDescription, { children: editingModule ? 'Update module information' : 'Create a new module for organizing lessons' })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Module Title *" }), _jsx(Input, { value: moduleFormData.title, onChange: (e) => setModuleFormData(prev => ({ ...prev, title: e.target.value })), placeholder: "Enter module title" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Description" }), _jsx(Textarea, { value: moduleFormData.description, onChange: (e) => setModuleFormData(prev => ({ ...prev, description: e.target.value })), placeholder: "Describe what this module covers", rows: 3 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowModuleDialog(false), disabled: isSaving, children: "Cancel" }), _jsx(Button, { onClick: saveModule, disabled: isSaving || !moduleFormData.title.trim(), children: isSaving ? 'Saving...' : editingModule ? 'Update Module' : 'Add Module' })] })] }) }), _jsx(Dialog, { open: showLessonDialog, onOpenChange: setShowLessonDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingLesson.lesson ? 'Edit Lesson' : 'Add New Lesson' }), _jsx(DialogDescription, { children: editingLesson.lesson ? 'Update lesson information' : 'Create a new lesson in this module' })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Lesson Title *" }), _jsx(Input, { value: lessonFormData.title, onChange: (e) => setLessonFormData(prev => ({ ...prev, title: e.target.value })), placeholder: "Enter lesson title" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Description" }), _jsx(Textarea, { value: lessonFormData.description, onChange: (e) => setLessonFormData(prev => ({ ...prev, description: e.target.value })), placeholder: "Describe what this lesson teaches", rows: 3 })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Content Type" }), _jsxs("select", { value: lessonFormData.type, onChange: (e) => setLessonFormData(prev => ({
                                                        ...prev,
                                                        type: e.target.value
                                                    })), className: "w-full p-2 border rounded-md", style: { borderColor: 'var(--course-builder-border)' }, children: [_jsx("option", { value: "video", children: "Video" }), _jsx("option", { value: "text", children: "Text/Article" }), _jsx("option", { value: "audio", children: "Audio" }), _jsx("option", { value: "interactive", children: "Interactive" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Duration (minutes)" }), _jsx(Input, { type: "number", value: lessonFormData.duration, onChange: (e) => setLessonFormData(prev => ({
                                                        ...prev,
                                                        duration: parseInt(e.target.value) || 0
                                                    })), placeholder: "0", min: "0" })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowLessonDialog(false), disabled: isSaving, children: "Cancel" }), _jsx(Button, { onClick: saveLesson, disabled: isSaving || !lessonFormData.title.trim(), children: isSaving ? 'Saving...' : editingLesson.lesson ? 'Update Lesson' : 'Add Lesson' })] })] }) })] }));
}
