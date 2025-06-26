# Course Framework Components

This directory contains the main consumer-facing components for the course framework.

## Components

### CourseEditor
The main course editing interface that provides:
- Rich text editor with formatting toolbar
- Drag & drop content blocks (text, image, video, audio)
- Module and lesson management
- Lesson library with templates
- Real-time preview mode

### CourseViewer
The student-facing course viewing interface that provides:
- Clean lesson content rendering
- Progress tracking
- Lesson completion marking
- Module navigation

### CourseList
Course management dashboard that provides:
- Course cards with statistics
- Search and filtering
- Import/export functionality
- Create new courses

### CreateCourseForm
Form component for creating new courses with:
- Title and description fields
- Cover image upload/URL
- Tag management
- Template option

## Usage

```tsx
import { CourseProvider } from '@/core/course-context';
import { CourseList, CourseEditor, CourseViewer } from '@/components';

function App() {
  const [view, setView] = useState('list');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  return (
    <CourseProvider>
      {view === 'list' && (
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
      )}
      
      {view === 'editor' && selectedCourseId && (
        <CourseEditor
          courseId={selectedCourseId}
          onBack={() => setView('list')}
          onViewMode={() => setView('viewer')}
        />
      )}
      
      {view === 'viewer' && selectedCourseId && (
        <CourseViewer
          courseId={selectedCourseId}
          onBack={() => setView('list')}
        />
      )}
    </CourseProvider>
  );
}
```

## Dependencies

These components rely on:
- `@/core/course-context` - Course state management
- `@/types/core` - Type definitions
- `@/components/ui/*` - UI components
- `lucide-react` - Icons

## Features Removed

The following features from the original components have been removed to focus on core functionality:
- Billing and stripe integration
- Analytics tracking
- Translation/i18n system
- External service dependencies
- User authentication
- Leaderboards and certificates

These can be added back through the plugin system or custom implementations.