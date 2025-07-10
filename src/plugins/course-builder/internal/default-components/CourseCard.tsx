import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Eye, Edit, Trash2, Copy, MoreVertical, Settings, FileText, Download, Lock, CheckCircle, Clock, Cog, BookOpen } from 'lucide-react';
import type { Course } from '@/types/core';
import { CourseDetails } from './CourseDetails';

interface CourseCardProps {
  course: Course;
  onView: (courseId: string) => void;
  onEdit: (courseId: string) => void;
  onSettings?: (courseId: string) => void;
  onDetails?: (courseId: string) => void;
  onDelete?: (courseId: string) => Promise<void>;
  onClone?: (courseId: string) => Promise<void>;
  onSaveAsTemplate?: (courseId: string, name: string, description: string) => Promise<void>;
  onExport?: (courseId: string) => Promise<string>;
  userPlan?: any; // Current user subscription plan object
}

export function CourseCard({ 
  course, 
  onView, 
  onEdit, 
  onSettings, 
  onDetails, 
  onDelete,
  onClone,
  onSaveAsTemplate,
  onExport,
  userPlan = null 
}: CourseCardProps) {
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(course.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete course:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClone = async () => {
    if (!onClone) return;
    try {
      setIsCloning(true);
      await onClone(course.id);
    } catch (error) {
      console.error('Failed to clone course:', error);
    } finally {
      setIsCloning(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!onSaveAsTemplate) return;
    try {
      setIsSavingTemplate(true);
      await onSaveAsTemplate(course.id, templateName, templateDescription);
      setShowTemplateDialog(false);
    } catch (error) {
      console.error('Failed to save as template:', error);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleExport = async () => {
    if (!onExport) return;
    try {
      setIsExporting(true);
      await onExport(course.id);
    } catch (error) {
      console.error('Failed to export course:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCourseDetailsUpdate = (updatedCourse: Course) => {
    // The course will be updated through the context
    // This callback can be used for additional actions if needed
    // Note: Analytics tracking would be added here when analytics plugin is implemented
    console.log('Course updated from card:', {
      courseId: updatedCourse.id,
      accessLevel: updatedCourse.accessLevel,
      isPaid: updatedCourse.isPaid
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressColor = (progress = 0) => {
    if (progress >= 90) return 'var(--course-builder-success, #22c55e)';
    if (progress >= 70) return 'var(--course-builder-info, #2563eb)';
    if (progress >= 50) return 'var(--course-builder-warning, #f59e0b)';
    return 'var(--course-builder-text-muted)';
  };

  const getAccessStatusBadge = () => {
    if (!course.isPaid || course.accessLevel === 'free') {
      return (
        <Badge 
          variant="secondary" 
          className="text-white"
          style={{ backgroundColor: 'var(--course-builder-success, #22c55e)' }}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Free
        </Badge>
      );
    }

    return (
      <Badge 
        className="text-white"
        style={{ backgroundColor: 'var(--course-builder-info, #2563eb)' }}
      >
        <Lock className="h-3 w-3 mr-1" />
        Paid
      </Badge>
    );
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
      return (
        <Button onClick={() => onView(course.id)} className="flex-1">
          <Eye className="h-4 w-4 mr-2" />
          View Course
        </Button>
      );
    } else {
      return (
        <Button variant="outline" className="flex-1" disabled>
          <Lock className="h-4 w-4 mr-2" />
          Upgrade to Access
        </Button>
      );
    }
  };

  // Calculate total duration
  const totalDuration = course.modules.reduce(
    (total, module) => total + module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0), 
    0
  );

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden" style={{ backgroundColor: 'var(--course-builder-bg-surface)', borderColor: 'var(--course-builder-border)', border: '1px solid' }}>
      <div className="relative">
        <div className="h-48 overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #f0f9ff, #faf5ff)' }}>
          {course.coverImage ? (
            <img
              src={course.coverImage}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-16 w-16" style={{ color: 'var(--course-builder-text-muted)' }} />
            </div>
          )}
        </div>

        {/* Access Level Badge */}
        <div className="absolute top-3 left-3">
          {getAccessStatusBadge()}
        </div>

        {/* Template Badge */}
        {course.isTemplate && (
          <div className="absolute bottom-3 left-3">
            <Badge 
              variant="outline" 
              className="text-white border-2"
              style={{ 
                backgroundColor: 'var(--course-builder-accent, #8b5cf6)',
                borderColor: 'var(--course-builder-accent, #8b5cf6)'
              }}
            >
              Template
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <CardTitle className="text-xl font-semibold mb-2 line-clamp-2" style={{ color: 'var(--course-builder-text-primary)' }}>
              {course.title}
            </CardTitle>
            <CardDescription className="text-sm line-clamp-3" style={{ color: 'var(--course-builder-text-secondary)' }}>
              {course.description}
            </CardDescription>
          </div>

          {/* Actions Menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showActionsMenu && (
              <div className="absolute right-0 top-8 rounded-md shadow-lg z-10 min-w-40" style={{ backgroundColor: 'var(--course-builder-bg-surface)', borderColor: 'var(--course-builder-border)', border: '1px solid' }}>
                <div className="py-1">
                  <button
                    onClick={() => {
                      onEdit(course.id);
                      setShowActionsMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Content
                  </button>

                  {onDetails && (
                    <button
                      onClick={() => {
                        onDetails(course.id);
                        setShowActionsMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <Settings className="h-4 w-4" />
                      Course Details
                    </button>
                  )}

                  {onSettings && (
                    <button
                      onClick={() => {
                        onSettings(course.id);
                        setShowActionsMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <Settings className="h-4 w-4" />
                      Advanced Settings
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleClone();
                      setShowActionsMenu(false);
                    }}
                    disabled={isCloning}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 disabled:opacity-50 hover:opacity-80 transition-opacity"
                  >
                    <Copy className="h-4 w-4" />
                    {isCloning ? 'Cloning...' : 'Clone Course'}
                  </button>

                  <button
                    onClick={() => {
                      setShowTemplateDialog(true);
                      setShowActionsMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <FileText className="h-4 w-4" />
                    Save as Template
                  </button>

                  <button
                    onClick={() => {
                      handleExport();
                      setShowActionsMenu(false);
                    }}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 disabled:opacity-50 hover:opacity-80 transition-opacity"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Exporting...' : 'Export Course'}
                  </button>

                  <div className="border-t my-1" style={{ borderColor: 'var(--course-builder-border)' }} />

                  <button
                    onClick={() => {
                      setShowDeleteDialog(true);
                      setShowActionsMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--course-builder-error, #ef4444)' }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Course
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 space-y-3">
        {/* Course Statistics */}
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--course-builder-bg-muted)' }}>
          <div className="flex items-center justify-between text-sm" style={{ color: 'var(--course-builder-text-secondary)' }}>
            <div className="flex items-center gap-4">
              <span className="font-medium">{course.modules.length} modules</span>
              <span style={{ color: 'var(--course-builder-text-muted)' }}>•</span>
              <span className="font-medium">
                {course.modules.reduce((total, module) => total + module.lessons.length, 0)} lessons
              </span>
              {totalDuration > 0 && (
                <>
                  <span style={{ color: 'var(--course-builder-text-muted)' }}>•</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3" />
                    {totalDuration}m
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {course.progress !== undefined && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium" style={{ color: 'var(--course-builder-text-secondary)' }}>Progress</span>
              <span className="font-semibold" style={{ color: 'var(--course-builder-text-primary)' }}>{course.progress}%</span>
            </div>
            <div className="w-full rounded-full h-2.5" style={{ backgroundColor: 'var(--course-builder-bg-muted)' }}>
              <div
                className="h-2.5 rounded-full transition-all duration-300"
                style={{ 
                  width: `${course.progress}%`,
                  backgroundColor: getProgressColor(course.progress)
                }}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {course.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-2 py-1">
                {tag}
              </Badge>
            ))}
            {course.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                +{course.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Primary Action Button */}
          {getActionButton()}

          <Button 
            variant="outline" 
            onClick={() => onEdit(course.id)} 
            title="Edit Course Content"
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setShowCourseDetails(true)}
            title="Course Details & Settings"
          >
            <Cog className="h-4 w-4" />
          </Button>

          {onSettings && (
            <Button 
              variant="outline" 
              onClick={() => onSettings(course.id)} 
              title="Advanced Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{course.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Save Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Create a reusable template from "{course.title}" that can be used to create new courses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe what this template is for"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
              disabled={isSavingTemplate}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={isSavingTemplate || !templateName.trim()}
            >
              {isSavingTemplate ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Details Modal */}
      <CourseDetails
        course={course}
        isOpen={showCourseDetails}
        onClose={() => setShowCourseDetails(false)}
        onSave={handleCourseDetailsUpdate}
      />
    </Card>
  );
}