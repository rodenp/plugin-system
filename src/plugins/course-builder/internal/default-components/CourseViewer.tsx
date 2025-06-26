import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle, Circle, Clock, BookOpen, Play } from 'lucide-react';
import type { Lesson, ContentBlock, Course } from '@/types/core';
import { defaultTheme } from '@/core/theme/default-theme';
import { newEventBus, EVENTS } from '@/core/new-event-bus';
import './course-viewer.css';

interface CourseViewerProps {
  courseId: string;
  onBack?: () => void;
  onEdit?: () => void;
  theme?: typeof defaultTheme;
  course: Course | null;
  onUpdateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
}

export function CourseViewer({ courseId, onBack, onEdit, theme, course, onUpdateCourse }: CourseViewerProps) {
  const appliedTheme = theme ?? defaultTheme;

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [, setCurrentLessonIndex] = useState(0);

  if (!course) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin"
               style={{ 
                 width: '2rem',
                 height: '2rem',
                 borderRadius: '50%',
                 borderWidth: '2px',
                 borderStyle: 'solid',
                 borderColor: 'transparent',
                 borderBottomColor: appliedTheme.colors.secondary || '#3b82f6',
                 margin: '0 auto 1rem',
               }} />
          <p style={{ color: appliedTheme.colors.textSecondary }}>Loading course...</p>
        </div>
      </div>
    );
  }

  const calculateProgress = () => {
    if (!course?.modules) return 0;
    const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
    const completedLessons = course.modules.reduce(
      (total, module) => total + module.lessons.filter(lesson => lesson.isCompleted).length,
      0
    );
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  const toggleLessonComplete = async (moduleId: string, lessonId: string) => {
    const updatedCourse = { ...course };
    const moduleIndex = updatedCourse.modules.findIndex(m => m.id === moduleId);
    const lessonIndex = updatedCourse.modules[moduleIndex].lessons.findIndex(l => l.id === lessonId);
    if (moduleIndex === -1 || lessonIndex === -1) return;

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

  const selectLesson = (lesson: Lesson, moduleIndex: number, lessonIndex: number) => {
    setSelectedLesson(lesson);
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
  };

  const getCurrentLesson = () => {
    if (selectedLesson) return selectedLesson;
    if (!course || !course.modules || course.modules.length === 0) return null;
    return course.modules[0]?.lessons[0] || null;
  };

  const renderContent = (content: ContentBlock) => {
    switch (content.type) {
      case 'text':
        if (content.content.type === 'text') {
          return (
            <div style={{ 
              fontSize: '1rem', 
              lineHeight: '1.75', 
              color: appliedTheme.colors.textPrimary,
              maxWidth: 'none' 
            }} dangerouslySetInnerHTML={{ __html: content.content.content }} />
          );
        }
        break;
      case 'image':
        return (
          <div style={{ margin: '1rem 0' }}>
            <img 
              src={content.content.url} 
              alt={content.content.title || 'Course image'}
              style={{ 
                width: '100%', 
                borderRadius: '0.5rem', 
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' 
              }} 
            />
            {content.content.caption && (
              <p style={{ fontSize: '0.875rem', color: appliedTheme.colors.textSecondary, marginTop: '0.5rem' }}>
                {content.content.caption}
              </p>
            )}
          </div>
        );
      case 'video':
        return (
          <div style={{ margin: '1rem 0' }}>
            <video 
              controls 
              style={{ 
                width: '100%', 
                borderRadius: '0.5rem', 
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' 
              }} 
              src={content.content.url} 
            />
            {content.content.caption && (
              <p style={{ fontSize: '0.875rem', color: appliedTheme.colors.textSecondary, marginTop: '0.5rem' }}>
                {content.content.caption}
              </p>
            )}
          </div>
        );
      case 'audio':
        return (
          <div style={{ margin: '1rem 0' }}>
            <audio controls style={{ width: '100%' }} src={content.content.url} />
            {content.content.caption && (
              <p style={{ fontSize: '0.875rem', color: appliedTheme.colors.textSecondary, marginTop: '0.5rem' }}>
                {content.content.caption}
              </p>
            )}
          </div>
        );
      default:
        return <div>Unsupported content type</div>;
    }
  };

  const currentLesson = getCurrentLesson();
  const progress = calculateProgress();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: appliedTheme.colors.backgroundAlt }}>
      <div style={{ backgroundColor: appliedTheme.colors.surface, borderBottom: `1px solid ${appliedTheme.borders.borderColor}` }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="ghost" onClick={onBack} theme={appliedTheme}>← Back to Courses</Button>
          <Badge variant="secondary" theme={appliedTheme}>Student View</Badge>
        </div>
      </div>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem', display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <style>{`@media (min-width: 1024px) { .course-viewer-grid { grid-template-columns: 1fr 3fr; } }`}</style>
        <div className="course-viewer-grid" style={{ display: 'grid', gap: '2rem' }}>
        {/* Sidebar */}
        <div>
          <Card theme={appliedTheme}>
            <CardHeader theme={appliedTheme}>
              <CardTitle theme={appliedTheme}>{course.title}</CardTitle>
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} theme={appliedTheme} />
              </div>
            </CardHeader>
            <CardContent theme={appliedTheme}>
              {course.modules.map((module, moduleIndex) => (
                <div key={module.id} style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: '500', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <BookOpen style={{ width: '1rem', height: '1rem' }} /> {module.title}
                  </h4>
                  <div style={{ marginLeft: '1.5rem' }}>
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        onClick={() => selectLesson(lesson, moduleIndex, lessonIndex)}
                        style={{
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
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleLessonComplete(module.id, lesson.id); }}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          >
                            {lesson.isCompleted
                              ? <CheckCircle style={{ width: '1rem', height: '1rem', color: appliedTheme.colors.success || '#22c55e' }} />
                              : <Circle style={{ width: '1rem', height: '1rem', color: appliedTheme.colors.textSecondary }} />}
                          </button>
                          <span>{lesson.title}</span>
                          {lesson.duration && (
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', gap: '0.25rem', color: appliedTheme.colors.textSecondary }}>
                              <Clock style={{ width: '0.75rem', height: '0.75rem' }} /> {lesson.duration}m
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div style={{ flex: 1 }}>
          {currentLesson ? (
            <Card theme={appliedTheme}>
              <CardHeader theme={appliedTheme} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <CardTitle theme={appliedTheme}>{currentLesson.title}</CardTitle>
                  <p style={{ color: appliedTheme.colors.textSecondary, marginTop: '0.25rem' }}>{currentLesson.description}</p>
                </div>
                <Button
                  variant={currentLesson.isCompleted ? "default" : "outline"}
                  onClick={() => toggleLessonComplete(
                    course.modules[currentModuleIndex].id,
                    currentLesson.id
                  )}
                  theme={appliedTheme}
                >
                  {currentLesson.isCompleted ? 'Completed' : 'Mark Complete'}
                </Button>
              </CardHeader>
              <CardContent theme={appliedTheme}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {currentLesson.content
                    .sort((a, b) => a.order - b.order)
                    .map(content => <div key={content.id}>{renderContent(content)}</div>)}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card theme={appliedTheme}>
              <CardContent theme={appliedTheme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <Play style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', color: appliedTheme.colors.textSecondary }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>Start Learning</h3>
                  <p style={{ color: appliedTheme.colors.textSecondary }}>Select a lesson from the sidebar to begin</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}