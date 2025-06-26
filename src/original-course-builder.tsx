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
  } catch (error) {
    console.error('Failed to initialize sample data:', error);
  }
};

// Original course builder demo - direct component usage
function OriginalCourseBuilder() {
  const [view, setView] = React.useState<'list' | 'edit' | 'view'>('list');
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(null);
  
  // Memoize the storage adapter to prevent re-creation on every render
  const storageAdapter = React.useMemo(() => new IndexedDBAdapter(), []);

  // Initialize sample data on mount
  React.useEffect(() => {
    initializeSampleData();
  }, []);

  const handleViewCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setView('view');
  };

  const handleEditCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setView('edit');
  };

  const handleBack = () => {
    setView('list');
    setSelectedCourseId(null);
  };

  return (
    <CourseProvider storageAdapter={storageAdapter}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm text-gray-700 transition-colors"
                >
                  ← Back to Demo Selection
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  Original Course Builder
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {view === 'list' && (
            <CourseList
              onViewCourse={handleViewCourse}
              onEditCourse={handleEditCourse}
            />
          )}

          {view === 'edit' && selectedCourseId && (
            <div>
              <button
                onClick={handleBack}
                className="mb-4 text-blue-600 hover:text-blue-700"
              >
                ← Back to Courses
              </button>
              <CourseEditor
                courseId={selectedCourseId}
                onSave={handleBack}
                onCancel={handleBack}
              />
            </div>
          )}

          {view === 'view' && selectedCourseId && (
            <div>
              <button
                onClick={handleBack}
                className="mb-4 text-blue-600 hover:text-blue-700"
              >
                ← Back to Courses
              </button>
              <CourseViewer
                courseId={selectedCourseId}
                onEdit={() => setView('edit')}
              />
            </div>
          )}
        </div>
      </div>
    </CourseProvider>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<OriginalCourseBuilder />);
}