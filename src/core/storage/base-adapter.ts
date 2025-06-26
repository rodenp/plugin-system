import type { StorageAdapter, Course, LessonTemplate } from '../../types/core';

export abstract class BaseStorageAdapter implements StorageAdapter {
  abstract getCourses(): Promise<Course[]>;
  abstract getCourse(id: string): Promise<Course | null>;
  abstract saveCourse(course: Course): Promise<Course>;
  abstract deleteCourse(id: string): Promise<void>;
  abstract getLessonTemplates(): Promise<LessonTemplate[]>;
  abstract saveLessonTemplate(template: LessonTemplate): Promise<LessonTemplate>;

  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected validateCourse(course: Course): void {
    if (!course.id) throw new Error('Course must have an id');
    if (!course.title) throw new Error('Course must have a title');
    if (!Array.isArray(course.modules)) throw new Error('Course must have modules array');
  }

  protected validateLessonTemplate(template: LessonTemplate): void {
    if (!template.id) throw new Error('Lesson template must have an id');
    if (!template.title) throw new Error('Lesson template must have a title');
    if (!Array.isArray(template.content)) throw new Error('Lesson template must have content array');
  }
}