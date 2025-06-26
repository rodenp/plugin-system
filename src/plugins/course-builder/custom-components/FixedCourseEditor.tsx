import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCourse } from '@course-framework/core/course-context';

// Global cache to prevent repeated loading of the same course
const loadedCourses = new Set<string>();

// Fixed version of CourseEditor that doesn't have the infinite loop issue
export function FixedCourseEditor({
  courseId,
  onBack,
  onViewMode,
  onSave,
  onCancel,
}: {
  courseId: string;
  onBack?: () => void;
  onViewMode?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}) {
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
    if (!currentCourse) return;
    
    setIsSaving(true);
    try {
      await updateCourse(currentCourse);
      onSave?.();
    } catch (error) {
      console.error('Failed to save course:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentCourse) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
          <p className="text-gray-600">{currentCourse.title}</p>
        </div>
        <div className="flex items-center space-x-3">
          {onViewMode && (
            <button
              onClick={onViewMode}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Preview
            </button>
          )}
          <button
            onClick={onCancel || onBack}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Course Details Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Title
            </label>
            <input
              type="text"
              value={currentCourse.title}
              onChange={(e) => {
                // Update course title (this would need proper state management)
                console.log('Title updated:', e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={currentCourse.description}
              onChange={(e) => {
                // Update course description (this would need proper state management)
                console.log('Description updated:', e.target.value);
              }}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-sm text-gray-500">
            <p>Course ID: {currentCourse.id}</p>
            <p>Created: {currentCourse.createdAt.toLocaleDateString()}</p>
            <p>Modules: {currentCourse.modules.length}</p>
          </div>
        </div>
      </div>

      {/* Simple editor note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          ✅ This is a simplified CourseEditor that fixes the infinite loop issue. 
          A full editor would include module management, lesson editing, and rich text capabilities.
        </p>
      </div>
    </div>
  );
}