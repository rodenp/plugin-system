import type React from 'react';
import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Search, Filter, Upload, BookOpen, Download, FileText, BarChart3, Trophy, CreditCard } from 'lucide-react';
import { CreateCourseForm } from './CreateCourseForm';
import { CourseCard } from './CourseCard';
import { useCourse } from '@/core/course-context';
import type { Course } from '@/types/core';

interface CourseListProps {
  onViewCourse: (courseId: string) => void;
  onEditCourse: (courseId: string) => void;
  onSettingsCourse?: (courseId: string) => void;
  onShowExtensions?: () => void;
  onShowPlanPricing?: () => void;
}


export function CourseList({ onViewCourse, onEditCourse, onSettingsCourse, onShowExtensions, onShowPlanPricing }: CourseListProps) {
  const { courses, loading, importCourse, deleteCourse, exportCourse } = useCourse();
  
  // Get user information from global plugin config
  const userInfo = (window as any).__courseFrameworkUser;
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'courses' | 'templates'>('all');
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);

  // Filter and search courses
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Filter by type
    if (filterType === 'templates') {
      filtered = filtered.filter(course => course.isTemplate);
    } else if (filterType === 'courses') {
      filtered = filtered.filter(course => !course.isTemplate);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [courses, searchTerm, filterType]);

  const handleImportCourse = async () => {
    if (!importData.trim()) return;

    try {
      setIsImporting(true);
      setImportError(null);

      // Validate JSON first
      try {
        JSON.parse(importData);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please check your course data.');
      }

      await importCourse(importData);
      setImportData('');
      setShowImportDialog(false);
    } catch (error) {
      console.error('Failed to import course:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import course');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.onerror = () => {
        setImportError('Failed to read file. Please try again.');
      };
      reader.readAsText(file);
    }
  };


  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
    } catch (error) {
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

    } catch (error) {
      console.error('Failed to export all courses:', error);
    } finally {
      setIsExportingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--course-builder-accent, #8b5cf6)' }} />
          <p className="mt-2" style={{ color: 'var(--course-builder-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="mt-1" style={{ color: 'var(--course-builder-text-secondary)' }}>
            {courses.filter(c => !c.isTemplate).length} courses • {' '}
            {courses.filter(c => c.isTemplate).length} templates
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Extensions Button */}
          {onShowExtensions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowExtensions}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Extensions
            </Button>
          )}

          {/* Plan Pricing Button */}
          {onShowPlanPricing && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowPlanPricing}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Plan Pricing
            </Button>
          )}

          {/* Export All Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            disabled={isExportingAll || courses.filter(c => !c.isTemplate).length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExportingAll ? 'Exporting...' : `Export All (${courses.filter(c => !c.isTemplate).length})`}
          </Button>

          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Course</DialogTitle>
                <DialogDescription>
                  Import a course from JSON data or upload a file
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Upload JSON file</label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Or paste JSON data</label>
                  <textarea
                    value={importData}
                    onChange={(e) => {
                      setImportData(e.target.value);
                      setImportError(null);
                    }}
                    placeholder="Paste course JSON data here..."
                    className="w-full h-32 p-3 border rounded-md resize-none" style={{ borderColor: 'var(--course-builder-border)' }}
                  />
                  {importError && (
                    <div 
                      className="mt-2 p-2 border rounded text-sm"
                      style={{ 
                        backgroundColor: 'var(--course-builder-error, #ef4444)11',
                        borderColor: 'var(--course-builder-error, #ef4444)33',
                        color: 'var(--course-builder-error, #ef4444)'
                      }}
                    >
                      {importError}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportCourse}
                    disabled={!importData.trim() || isImporting}
                  >
                    {isImporting ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Course</DialogTitle>
                <DialogDescription>
                  Create a new course or template
                </DialogDescription>
              </DialogHeader>
              <CreateCourseForm
                onSuccess={() => setShowCreateDialog(false)}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--course-builder-text-muted)' }} />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: 'var(--course-builder-text-muted)' }} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="border rounded-md px-3 py-2 text-sm" style={{ borderColor: 'var(--course-builder-border)' }}
          >
            <option value="all">All</option>
            <option value="courses">Courses</option>
            <option value="templates">Templates</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--course-builder-text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || filterType !== 'all' ? 'No courses found' : 'No courses yet'}
          </h3>
          <p className="mb-4" style={{ color: 'var(--course-builder-text-secondary)' }}>
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first course to get started'}
          </p>
          {!searchTerm && filterType === 'all' && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onView={onViewCourse}
              onEdit={onEditCourse}
              onSettings={onSettingsCourse}
              userPlan={userInfo?.plan}
            />
          ))}
        </div>
      )}
    </div>
  );
}