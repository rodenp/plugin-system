import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Search, Filter, Upload, BookOpen, Download, BarChart3, CreditCard } from 'lucide-react';
import { CreateCourseForm } from './CreateCourseForm';
import { CourseCard } from './CourseCard';
import { useCourse } from '@/core/course-context';
export function CourseList({ onViewCourse, onEditCourse, onSettingsCourse, onShowExtensions, onShowPlanPricing }) {
    const { courses, loading, importCourse, deleteCourse, exportCourse } = useCourse();
    // Get user information from global plugin config
    const userInfo = window.__courseFrameworkUser;
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [importData, setImportData] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState(null);
    const [isExportingAll, setIsExportingAll] = useState(false);
    // Filter and search courses
    const filteredCourses = useMemo(() => {
        let filtered = courses;
        // Filter by type
        if (filterType === 'templates') {
            filtered = filtered.filter(course => course.isTemplate);
        }
        else if (filterType === 'courses') {
            filtered = filtered.filter(course => !course.isTemplate);
        }
        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(course => course.title.toLowerCase().includes(term) ||
                course.description.toLowerCase().includes(term) ||
                course.tags?.some(tag => tag.toLowerCase().includes(term)));
        }
        return filtered;
    }, [courses, searchTerm, filterType]);
    const handleImportCourse = async () => {
        if (!importData.trim())
            return;
        try {
            setIsImporting(true);
            setImportError(null);
            // Validate JSON first
            try {
                JSON.parse(importData);
            }
            catch (parseError) {
                throw new Error('Invalid JSON format. Please check your course data.');
            }
            await importCourse(importData);
            setImportData('');
            setShowImportDialog(false);
        }
        catch (error) {
            console.error('Failed to import course:', error);
            setImportError(error instanceof Error ? error.message : 'Failed to import course');
        }
        finally {
            setIsImporting(false);
        }
    };
    const handleFileImport = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setImportError(null);
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                setImportData(content);
            };
            reader.onerror = () => {
                setImportError('Failed to read file. Please try again.');
            };
            reader.readAsText(file);
        }
    };
    const handleDeleteCourse = async (courseId) => {
        try {
            await deleteCourse(courseId);
        }
        catch (error) {
            console.error('Failed to delete course:', error);
        }
    };
    const handleExportAll = async () => {
        try {
            setIsExportingAll(true);
            // Export all courses (excluding templates)
            const coursesToExport = courses.filter(c => !c.isTemplate);
            const exportPromises = coursesToExport.map(course => exportCourse(course.id));
            const exportedData = await Promise.all(exportPromises);
            // Combine all courses into one export
            const combinedExport = {
                exportVersion: '1.0',
                exportDate: new Date().toISOString(),
                courses: exportedData.map(data => JSON.parse(data)),
                totalCourses: coursesToExport.length
            };
            // Create and trigger download
            const blob = new Blob([JSON.stringify(combinedExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `all_courses_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Failed to export all courses:', error);
        }
        finally {
            setIsExportingAll(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 mx-auto", style: { borderColor: 'var(--course-builder-accent, #8b5cf6)' } }), _jsx("p", { className: "mt-2", style: { color: 'var(--course-builder-text-secondary)' }, children: "Loading..." })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Courses" }), _jsxs("p", { className: "mt-1", style: { color: 'var(--course-builder-text-secondary)' }, children: [courses.filter(c => !c.isTemplate).length, " courses \u2022 ", ' ', courses.filter(c => c.isTemplate).length, " templates"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [onShowExtensions && (_jsxs(Button, { variant: "outline", size: "sm", onClick: onShowExtensions, children: [_jsx(BarChart3, { className: "h-4 w-4 mr-2" }), "Extensions"] })), onShowPlanPricing && (_jsxs(Button, { variant: "outline", size: "sm", onClick: onShowPlanPricing, children: [_jsx(CreditCard, { className: "h-4 w-4 mr-2" }), "Plan Pricing"] })), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleExportAll, disabled: isExportingAll || courses.filter(c => !c.isTemplate).length === 0, children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), isExportingAll ? 'Exporting...' : `Export All (${courses.filter(c => !c.isTemplate).length})`] }), _jsxs(Dialog, { open: showImportDialog, onOpenChange: setShowImportDialog, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Import"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Import Course" }), _jsx(DialogDescription, { children: "Import a course from JSON data or upload a file" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Upload JSON file" }), _jsx(Input, { type: "file", accept: ".json", onChange: handleFileImport })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Or paste JSON data" }), _jsx("textarea", { value: importData, onChange: (e) => {
                                                                    setImportData(e.target.value);
                                                                    setImportError(null);
                                                                }, placeholder: "Paste course JSON data here...", className: "w-full h-32 p-3 border rounded-md resize-none", style: { borderColor: 'var(--course-builder-border)' } }), importError && (_jsx("div", { className: "mt-2 p-2 border rounded text-sm", style: {
                                                                    backgroundColor: 'var(--course-builder-error, #ef4444)11',
                                                                    borderColor: 'var(--course-builder-error, #ef4444)33',
                                                                    color: 'var(--course-builder-error, #ef4444)'
                                                                }, children: importError }))] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowImportDialog(false), children: "Cancel" }), _jsx(Button, { onClick: handleImportCourse, disabled: !importData.trim() || isImporting, children: isImporting ? 'Importing...' : 'Import' })] })] })] })] }), _jsxs(Dialog, { open: showCreateDialog, onOpenChange: setShowCreateDialog, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Create Course"] }) }), _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create Course" }), _jsx(DialogDescription, { children: "Create a new course or template" })] }), _jsx(CreateCourseForm, { onSuccess: () => setShowCreateDialog(false), onCancel: () => setShowCreateDialog(false) })] })] })] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4", style: { color: 'var(--course-builder-text-muted)' } }), _jsx(Input, { placeholder: "Search courses...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "h-4 w-4", style: { color: 'var(--course-builder-text-muted)' } }), _jsxs("select", { value: filterType, onChange: (e) => setFilterType(e.target.value), className: "border rounded-md px-3 py-2 text-sm", style: { borderColor: 'var(--course-builder-border)' }, children: [_jsx("option", { value: "all", children: "All" }), _jsx("option", { value: "courses", children: "Courses" }), _jsx("option", { value: "templates", children: "Templates" })] })] })] }), filteredCourses.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(BookOpen, { className: "h-12 w-12 mx-auto mb-4", style: { color: 'var(--course-builder-text-muted)' } }), _jsx("h3", { className: "text-lg font-semibold mb-2", children: searchTerm || filterType !== 'all' ? 'No courses found' : 'No courses yet' }), _jsx("p", { className: "mb-4", style: { color: 'var(--course-builder-text-secondary)' }, children: searchTerm || filterType !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Create your first course to get started' }), !searchTerm && filterType === 'all' && (_jsxs(Button, { onClick: () => setShowCreateDialog(true), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Create Course"] }))] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6", children: filteredCourses.map((course) => (_jsx(CourseCard, { course: course, onView: onViewCourse, onEdit: onEditCourse, onSettings: onSettingsCourse, userPlan: userInfo?.plan }, course.id))) }))] }));
}
