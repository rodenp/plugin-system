import { useState } from 'react';
import { CourseProvider } from '../../../core/course-context';
import { CourseList, CourseEditor, CourseViewer } from './index';

type View = 'list' | 'editor' | 'viewer';

export function CourseFrameworkDemo() {
  const [view, setView] = useState<View>('list');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  return (
    <CourseProvider>
      <div className="min-h-screen bg-gray-50">
        {view === 'list' && (
          <div className="container mx-auto py-8">
            <CourseList
              onViewCourse={(id) => {
                setSelectedCourseId(id);
                setView('viewer');
              }}
              onEditCourse={(id) => {
                setSelectedCourseId(id);
                setView('editor');
              }}
            />
          </div>
        )}
        
        {view === 'editor' && selectedCourseId && (
          <CourseEditor
            courseId={selectedCourseId}
            onBack={() => {
              setView('list');
              setSelectedCourseId(null);
            }}
            onViewMode={() => setView('viewer')}
          />
        )}
        
        {view === 'viewer' && selectedCourseId && (
          <CourseViewer
            courseId={selectedCourseId}
            onBack={() => {
              setView('list');
              setSelectedCourseId(null);
            }}
          />
        )}
      </div>
    </CourseProvider>
  );
}

export default CourseFrameworkDemo;