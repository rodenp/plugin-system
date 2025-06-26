import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Eye, Edit, Trash2, Copy, MoreVertical, Settings, FileText, Download, Lock, CheckCircle, Clock, Cog, BookOpen } from 'lucide-react';
import { useCourse } from '@/core/course-context';
import { CourseDetails } from './CourseDetails';
export function CourseCard({ course, onView, onEdit, onSettings, onDetails, userPlan = null }) {
    const { deleteCourse, cloneCourse, saveAsTemplate, exportCourse } = useCourse();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    const [showCourseDetails, setShowCourseDetails] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [templateName, setTemplateName] = useState(`${course.title} Template`);
    const [templateDescription, setTemplateDescription] = useState(`Template based on ${course.title}`);
    const menuRef = useRef(null);
    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowActionsMenu(false);
            }
        };
        if (showActionsMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showActionsMenu]);
    // Check if user has access to this course
    const hasAccess = () => {
        // Free courses are always accessible
        if (!course.isPaid || course.accessLevel === 'free') {
            return true;
        }
        // No subscription = no access to paid courses
        if (!userPlan) {
            return false;
        }
        // Check if user's plan meets the requirement
        const planHierarchy = ['basic', 'pro', 'enterprise'];
        const userPlanId = userPlan.id || userPlan; // Handle both plan object and string
        const userPlanLevel = planHierarchy.indexOf(userPlanId);
        const requiredPlanLevel = planHierarchy.indexOf(course.requiredPlan || 'basic');
        return userPlanLevel >= requiredPlanLevel;
    };
    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteCourse(course.id);
            setShowDeleteDialog(false);
        }
        catch (error) {
            console.error('Failed to delete course:', error);
        }
        finally {
            setIsDeleting(false);
        }
    };
    const handleClone = async () => {
        try {
            setIsCloning(true);
            await cloneCourse(course.id);
        }
        catch (error) {
            console.error('Failed to clone course:', error);
        }
        finally {
            setIsCloning(false);
        }
    };
    const handleSaveAsTemplate = async () => {
        try {
            setIsSavingTemplate(true);
            await saveAsTemplate(course.id, templateName, templateDescription);
            setShowTemplateDialog(false);
        }
        catch (error) {
            console.error('Failed to save as template:', error);
        }
        finally {
            setIsSavingTemplate(false);
        }
    };
    const handleExport = async () => {
        try {
            setIsExporting(true);
            await exportCourse(course.id);
        }
        catch (error) {
            console.error('Failed to export course:', error);
        }
        finally {
            setIsExporting(false);
        }
    };
    const handleCourseDetailsUpdate = (updatedCourse) => {
        // The course will be updated through the context
        // This callback can be used for additional actions if needed
        // Note: Analytics tracking would be added here when analytics plugin is implemented
        console.log('Course updated from card:', {
            courseId: updatedCourse.id,
            accessLevel: updatedCourse.accessLevel,
            isPaid: updatedCourse.isPaid
        });
    };
    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    const getProgressColor = (progress = 0) => {
        if (progress >= 90)
            return 'var(--course-builder-success, #22c55e)';
        if (progress >= 70)
            return 'var(--course-builder-info, #2563eb)';
        if (progress >= 50)
            return 'var(--course-builder-warning, #f59e0b)';
        return 'var(--course-builder-text-muted)';
    };
    const getAccessStatusBadge = () => {
        if (!course.isPaid || course.accessLevel === 'free') {
            return (_jsxs(Badge, { variant: "secondary", className: "text-white", style: { backgroundColor: 'var(--course-builder-success, #22c55e)' }, children: [_jsx(CheckCircle, { className: "h-3 w-3 mr-1" }), "Free"] }));
        }
        return (_jsxs(Badge, { className: "text-white", style: { backgroundColor: 'var(--course-builder-info, #2563eb)' }, children: [_jsx(Lock, { className: "h-3 w-3 mr-1" }), "Paid"] }));
    };
    const getPlanRequirementText = () => {
        if (!course.isPaid || course.accessLevel === 'free') {
            return 'Free for everyone';
        }
        const planName = course.requiredPlan ?
            course.requiredPlan.charAt(0).toUpperCase() + course.requiredPlan.slice(1) :
            'Pro';
        return `Requires ${planName} plan`;
    };
    const getActionButton = () => {
        const userHasAccess = hasAccess();
        if (userHasAccess) {
            return (_jsxs(Button, { onClick: () => onView(course.id), className: "flex-1", children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), "View Course"] }));
        }
        else {
            return (_jsxs(Button, { variant: "outline", className: "flex-1", disabled: true, children: [_jsx(Lock, { className: "h-4 w-4 mr-2" }), "Upgrade to Access"] }));
        }
    };
    // Calculate total duration
    const totalDuration = course.modules.reduce((total, module) => total + module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0), 0);
    return (_jsxs(Card, { className: "group hover:shadow-xl transition-all duration-300 overflow-hidden", style: { backgroundColor: 'var(--course-builder-bg-surface)', borderColor: 'var(--course-builder-border)', border: '1px solid' }, children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "h-48 overflow-hidden", style: { background: 'linear-gradient(to bottom right, #f0f9ff, #faf5ff)' }, children: course.coverImage ? (_jsx("img", { src: course.coverImage, alt: course.title, className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(BookOpen, { className: "h-16 w-16", style: { color: 'var(--course-builder-text-muted)' } }) })) }), _jsx("div", { className: "absolute top-3 left-3", children: getAccessStatusBadge() }), course.isTemplate && (_jsx("div", { className: "absolute bottom-3 left-3", children: _jsx(Badge, { variant: "outline", className: "text-white border-2", style: {
                                backgroundColor: 'var(--course-builder-accent, #8b5cf6)',
                                borderColor: 'var(--course-builder-accent, #8b5cf6)'
                            }, children: "Template" }) }))] }), _jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 pr-2", children: [_jsx(CardTitle, { className: "text-xl font-semibold mb-2 line-clamp-2", style: { color: 'var(--course-builder-text-primary)' }, children: course.title }), _jsx(CardDescription, { className: "text-sm line-clamp-3", style: { color: 'var(--course-builder-text-secondary)' }, children: course.description })] }), _jsxs("div", { className: "relative", ref: menuRef, children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => setShowActionsMenu(!showActionsMenu), className: "opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(MoreVertical, { className: "h-4 w-4" }) }), showActionsMenu && (_jsx("div", { className: "absolute right-0 top-8 rounded-md shadow-lg z-10 min-w-40", style: { backgroundColor: 'var(--course-builder-bg-surface)', borderColor: 'var(--course-builder-border)', border: '1px solid' }, children: _jsxs("div", { className: "py-1", children: [_jsxs("button", { onClick: () => {
                                                    onEdit(course.id);
                                                    setShowActionsMenu(false);
                                                }, className: "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80 transition-opacity", children: [_jsx(Edit, { className: "h-4 w-4" }), "Edit Content"] }), onDetails && (_jsxs("button", { onClick: () => {
                                                    onDetails(course.id);
                                                    setShowActionsMenu(false);
                                                }, className: "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80 transition-opacity", children: [_jsx(Settings, { className: "h-4 w-4" }), "Course Details"] })), onSettings && (_jsxs("button", { onClick: () => {
                                                    onSettings(course.id);
                                                    setShowActionsMenu(false);
                                                }, className: "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80 transition-opacity", children: [_jsx(Settings, { className: "h-4 w-4" }), "Advanced Settings"] })), _jsxs("button", { onClick: () => {
                                                    handleClone();
                                                    setShowActionsMenu(false);
                                                }, disabled: isCloning, className: "w-full px-3 py-2 text-left text-sm flex items-center gap-2 disabled:opacity-50 hover:opacity-80 transition-opacity", children: [_jsx(Copy, { className: "h-4 w-4" }), isCloning ? 'Cloning...' : 'Clone Course'] }), _jsxs("button", { onClick: () => {
                                                    setShowTemplateDialog(true);
                                                    setShowActionsMenu(false);
                                                }, className: "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80 transition-opacity", children: [_jsx(FileText, { className: "h-4 w-4" }), "Save as Template"] }), _jsxs("button", { onClick: () => {
                                                    handleExport();
                                                    setShowActionsMenu(false);
                                                }, disabled: isExporting, className: "w-full px-3 py-2 text-left text-sm flex items-center gap-2 disabled:opacity-50 hover:opacity-80 transition-opacity", children: [_jsx(Download, { className: "h-4 w-4" }), isExporting ? 'Exporting...' : 'Export Course'] }), _jsx("div", { className: "border-t my-1", style: { borderColor: 'var(--course-builder-border)' } }), _jsxs("button", { onClick: () => {
                                                    setShowDeleteDialog(true);
                                                    setShowActionsMenu(false);
                                                }, className: "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80 transition-opacity", style: { color: 'var(--course-builder-error, #ef4444)' }, children: [_jsx(Trash2, { className: "h-4 w-4" }), "Delete Course"] })] }) }))] })] }) }), _jsxs(CardContent, { className: "pt-0 pb-4 space-y-3", children: [_jsx("div", { className: "rounded-lg p-3", style: { backgroundColor: 'var(--course-builder-bg-muted)' }, children: _jsx("div", { className: "flex items-center justify-between text-sm", style: { color: 'var(--course-builder-text-secondary)' }, children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "font-medium", children: [course.modules.length, " modules"] }), _jsx("span", { style: { color: 'var(--course-builder-text-muted)' }, children: "\u2022" }), _jsxs("span", { className: "font-medium", children: [course.modules.reduce((total, module) => total + module.lessons.length, 0), " lessons"] }), totalDuration > 0 && (_jsxs(_Fragment, { children: [_jsx("span", { style: { color: 'var(--course-builder-text-muted)' }, children: "\u2022" }), _jsxs("span", { className: "flex items-center gap-1 font-medium", children: [_jsx(Clock, { className: "h-3 w-3" }), totalDuration, "m"] })] }))] }) }) }), course.progress !== undefined && (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between text-sm mb-2", children: [_jsx("span", { className: "font-medium", style: { color: 'var(--course-builder-text-secondary)' }, children: "Progress" }), _jsxs("span", { className: "font-semibold", style: { color: 'var(--course-builder-text-primary)' }, children: [course.progress, "%"] })] }), _jsx("div", { className: "w-full rounded-full h-2.5", style: { backgroundColor: 'var(--course-builder-bg-muted)' }, children: _jsx("div", { className: "h-2.5 rounded-full transition-all duration-300", style: {
                                        width: `${course.progress}%`,
                                        backgroundColor: getProgressColor(course.progress)
                                    } }) })] })), course.tags && course.tags.length > 0 && (_jsxs("div", { className: "flex flex-wrap gap-1.5", children: [course.tags.slice(0, 3).map((tag) => (_jsx(Badge, { variant: "outline", className: "text-xs px-2 py-1", children: tag }, tag))), course.tags.length > 3 && (_jsxs(Badge, { variant: "outline", className: "text-xs px-2 py-1", children: ["+", course.tags.length - 3, " more"] }))] })), _jsxs("div", { className: "flex gap-2", children: [getActionButton(), _jsx(Button, { variant: "outline", onClick: () => onEdit(course.id), title: "Edit Course Content", children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", onClick: () => setShowCourseDetails(true), title: "Course Details & Settings", children: _jsx(Cog, { className: "h-4 w-4" }) }), onSettings && (_jsx(Button, { variant: "outline", onClick: () => onSettings(course.id), title: "Advanced Settings", children: _jsx(Settings, { className: "h-4 w-4" }) }))] })] }), _jsx(Dialog, { open: showDeleteDialog, onOpenChange: setShowDeleteDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Delete Course" }), _jsxs(DialogDescription, { children: ["Are you sure you want to delete \"", course.title, "\"? This action cannot be undone."] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowDeleteDialog(false), disabled: isDeleting, children: "Cancel" }), _jsx(Button, { variant: "destructive", onClick: handleDelete, disabled: isDeleting, children: isDeleting ? 'Deleting...' : 'Delete' })] })] }) }), _jsx(Dialog, { open: showTemplateDialog, onOpenChange: setShowTemplateDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Save as Template" }), _jsxs(DialogDescription, { children: ["Create a reusable template from \"", course.title, "\" that can be used to create new courses."] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Template Name" }), _jsx(Input, { value: templateName, onChange: (e) => setTemplateName(e.target.value), placeholder: "Enter template name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Description" }), _jsx(Textarea, { value: templateDescription, onChange: (e) => setTemplateDescription(e.target.value), placeholder: "Describe what this template is for", rows: 3 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowTemplateDialog(false), disabled: isSavingTemplate, children: "Cancel" }), _jsx(Button, { onClick: handleSaveAsTemplate, disabled: isSavingTemplate || !templateName.trim(), children: isSavingTemplate ? 'Saving...' : 'Save Template' })] })] }) }), _jsx(CourseDetails, { course: course, isOpen: showCourseDetails, onClose: () => setShowCourseDetails(false), onSave: handleCourseDetailsUpdate })] }));
}
