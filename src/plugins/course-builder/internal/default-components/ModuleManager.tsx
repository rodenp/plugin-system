import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Move, 
  Video, 
  FileText, 
  Image as ImageIcon,
  Headphones,
  ChevronDown,
  ChevronRight,
  Clock,
  GripVertical,
  Settings,
  Copy
} from 'lucide-react';
import type { Course, Module, Lesson, ContentBlock } from '@/types/core';
import { useCourse } from '@/core/course-context';

interface ModuleManagerProps {
  course: Course;
  onCourseUpdate?: (updatedCourse: Course) => void;
}

interface ModuleFormData {
  title: string;
  description: string;
}

interface LessonFormData {
  title: string;
  description: string;
  duration: number;
  type: 'video' | 'text' | 'audio' | 'interactive';
}

export function ModuleManager({ course, onCourseUpdate }: ModuleManagerProps) {
  const { updateCourse } = useCourse();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Lesson | null }>({ moduleId: '', lesson: null });
  const [moduleFormData, setModuleFormData] = useState<ModuleFormData>({ title: '', description: '' });
  const [lessonFormData, setLessonFormData] = useState<LessonFormData>({ 
    title: '', 
    description: '', 
    duration: 0, 
    type: 'video' 
  });
  const [isSaving, setIsSaving] = useState(false);

  const toggleModuleExpansion = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleAddModule = () => {
    setEditingModule(null);
    setModuleFormData({ title: '', description: '' });
    setShowModuleDialog(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleFormData({ title: module.title, description: module.description });
    setShowModuleDialog(true);
  };

  const handleAddLesson = (moduleId: string) => {
    setEditingLesson({ moduleId, lesson: null });
    setLessonFormData({ title: '', description: '', duration: 0, type: 'video' });
    setShowLessonDialog(true);
  };

  const handleEditLesson = (moduleId: string, lesson: Lesson) => {
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
    if (!moduleFormData.title.trim()) return;

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
      } else {
        // Add new module
        const newModule: Module = {
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
    } catch (error) {
      console.error('Failed to save module:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveLesson = async () => {
    if (!lessonFormData.title.trim() || !editingLesson.moduleId) return;

    try {
      setIsSaving(true);
      
      const updatedCourse = { ...course };
      const moduleIndex = updatedCourse.modules.findIndex(m => m.id === editingLesson.moduleId);
      
      if (moduleIndex === -1) return;

      const module = updatedCourse.modules[moduleIndex];
      
      if (editingLesson.lesson) {
        // Edit existing lesson
        const lessonIndex = module.lessons.findIndex(l => l.id === editingLesson.lesson!.id);
        if (lessonIndex !== -1) {
          module.lessons[lessonIndex] = {
            ...editingLesson.lesson,
            title: lessonFormData.title,
            description: lessonFormData.description,
            duration: lessonFormData.duration,
            updatedAt: new Date()
          };
        }
      } else {
        // Add new lesson
        const defaultContent: ContentBlock[] = [{
          id: `content-${Date.now()}`,
          type: lessonFormData.type,
          content: lessonFormData.type === 'video' 
            ? { type: 'video', url: '', title: lessonFormData.title }
            : { type: 'text', content: '' },
          order: 0
        }];

        const newLesson: Lesson = {
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
    } catch (error) {
      console.error('Failed to save lesson:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module and all its lessons?')) return;

    try {
      const updatedCourse = {
        ...course,
        modules: course.modules.filter(m => m.id !== moduleId),
        updatedAt: new Date()
      };
      
      await updateCourse(updatedCourse);
      onCourseUpdate?.(updatedCourse);
    } catch (error) {
      console.error('Failed to delete module:', error);
    }
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

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
    } catch (error) {
      console.error('Failed to delete lesson:', error);
    }
  };

  const duplicateModule = async (module: Module) => {
    try {
      const duplicatedModule: Module = {
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
    } catch (error) {
      console.error('Failed to duplicate module:', error);
    }
  };

  const getLessonIcon = (lesson: Lesson) => {
    const contentType = lesson.content[0]?.type;
    switch (contentType) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Headphones className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateModuleDuration = (module: Module) => {
    return module.lessons.reduce((total, lesson) => total + lesson.duration, 0);
  };

  const calculateTotalDuration = () => {
    return course.modules.reduce((total, module) => total + calculateModuleDuration(module), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--course-builder-text-primary)' }}>Course Content</h2>
          <p className="text-sm" style={{ color: 'var(--course-builder-text-secondary)' }}>
            {course.modules.length} modules • {course.modules.reduce((total, m) => total + m.lessons.length, 0)} lessons • {formatDuration(calculateTotalDuration())}
          </p>
        </div>
        <Button onClick={handleAddModule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {course.modules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--course-builder-text-primary)' }}>No modules yet</h3>
              <p className="text-center mb-4" style={{ color: 'var(--course-builder-text-secondary)' }}>
                Start building your course by adding modules and lessons
              </p>
              <Button onClick={handleAddModule}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Module
              </Button>
            </CardContent>
          </Card>
        ) : (
          course.modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.has(module.id);
            const moduleDuration = calculateModuleDuration(module);

            return (
              <Card key={module.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleModuleExpansion(module.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      <GripVertical className="h-4 w-4" style={{ color: 'var(--course-builder-text-muted)' }} />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Module {moduleIndex + 1}
                          </Badge>
                          <CardTitle className="text-lg">{module.title}</CardTitle>
                        </div>
                        <CardDescription className="mt-1">
                          {module.description}
                        </CardDescription>
                        <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: 'var(--course-builder-text-secondary)' }}>
                          <span>{module.lessons.length} lessons</span>
                          {moduleDuration > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(moduleDuration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddLesson(module.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateModule(module)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditModule(module)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteModule(module.id)}
                        className="hover:opacity-80"
                        style={{ color: 'var(--course-builder-error, #ef4444)' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2 pl-6">
                      {module.lessons.length === 0 ? (
                        <div className="text-center py-8" style={{ color: 'var(--course-builder-text-muted)' }}>
                          <FileText className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--course-builder-text-muted)' }} />
                          <p className="text-sm">No lessons in this module</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddLesson(module.id)}
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Lesson
                          </Button>
                        </div>
                      ) : (
                        module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-3 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: 'var(--course-builder-bg-muted)' }}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <GripVertical className="h-4 w-4" style={{ color: 'var(--course-builder-text-muted)' }} />
                              {getLessonIcon(lesson)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{lesson.title}</span>
                                  {lesson.duration > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {formatDuration(lesson.duration)}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs mt-1" style={{ color: 'var(--course-builder-text-secondary)' }}>
                                  {lesson.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditLesson(module.id, lesson)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteLesson(module.id, lesson.id)}
                                className="hover:opacity-80"
                        style={{ color: 'var(--course-builder-error, #ef4444)' }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Edit Module' : 'Add New Module'}
            </DialogTitle>
            <DialogDescription>
              {editingModule ? 'Update module information' : 'Create a new module for organizing lessons'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Module Title *</label>
              <Input
                value={moduleFormData.title}
                onChange={(e) => setModuleFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter module title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={moduleFormData.description}
                onChange={(e) => setModuleFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this module covers"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={saveModule} disabled={isSaving || !moduleFormData.title.trim()}>
              {isSaving ? 'Saving...' : editingModule ? 'Update Module' : 'Add Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLesson.lesson ? 'Edit Lesson' : 'Add New Lesson'}
            </DialogTitle>
            <DialogDescription>
              {editingLesson.lesson ? 'Update lesson information' : 'Create a new lesson in this module'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lesson Title *</label>
              <Input
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter lesson title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={lessonFormData.description}
                onChange={(e) => setLessonFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this lesson teaches"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Content Type</label>
                <select
                  value={lessonFormData.type}
                  onChange={(e) => setLessonFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'video' | 'text' | 'audio' | 'interactive'
                  }))}
                  className="w-full p-2 border rounded-md" style={{ borderColor: 'var(--course-builder-border)' }}
                >
                  <option value="video">Video</option>
                  <option value="text">Text/Article</option>
                  <option value="audio">Audio</option>
                  <option value="interactive">Interactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <Input
                  type="number"
                  value={lessonFormData.duration}
                  onChange={(e) => setLessonFormData(prev => ({ 
                    ...prev, 
                    duration: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={saveLesson} disabled={isSaving || !lessonFormData.title.trim()}>
              {isSaving ? 'Saving...' : editingLesson.lesson ? 'Update Lesson' : 'Add Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}