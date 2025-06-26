import type { Course, LessonTemplate } from '../../types/core';
import { BaseStorageAdapter } from './base-adapter';

export class LocalStorageAdapter extends BaseStorageAdapter {
  private readonly COURSES_KEY = 'course-framework:courses';
  private readonly TEMPLATES_KEY = 'course-framework:templates';

  async getCourses(): Promise<Course[]> {
    try {
      const data = localStorage.getItem(this.COURSES_KEY);
      if (!data) return [];
      
      const courses = JSON.parse(data);
      return courses.map(this.deserializeCourse);
    } catch (error) {
      console.error('Error loading courses from localStorage:', error);
      return [];
    }
  }

  async getCourse(id: string): Promise<Course | null> {
    const courses = await this.getCourses();
    return courses.find(course => course.id === id) || null;
  }

  async saveCourse(course: Course): Promise<Course> {
    this.validateCourse(course);
    
    const courses = await this.getCourses();
    const existingIndex = courses.findIndex(c => c.id === course.id);
    
    const updatedCourse = {
      ...course,
      updatedAt: new Date()
    };

    if (existingIndex >= 0) {
      courses[existingIndex] = updatedCourse;
    } else {
      courses.push(updatedCourse);
    }

    localStorage.setItem(this.COURSES_KEY, JSON.stringify(courses.map(this.serializeCourse)));
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    const courses = await this.getCourses();
    const filteredCourses = courses.filter(course => course.id !== id);
    localStorage.setItem(this.COURSES_KEY, JSON.stringify(filteredCourses.map(this.serializeCourse)));
  }

  async getLessonTemplates(): Promise<LessonTemplate[]> {
    try {
      const data = localStorage.getItem(this.TEMPLATES_KEY);
      if (!data) return [];
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading lesson templates from localStorage:', error);
      return [];
    }
  }

  async saveLessonTemplate(template: LessonTemplate): Promise<LessonTemplate> {
    this.validateLessonTemplate(template);
    
    const templates = await this.getLessonTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }

    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
    return template;
  }

  private serializeCourse(course: Course): any {
    return {
      ...course,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      modules: course.modules.map(module => ({
        ...module,
        createdAt: module.createdAt.toISOString(),
        updatedAt: module.updatedAt.toISOString(),
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          createdAt: lesson.createdAt.toISOString(),
          updatedAt: lesson.updatedAt.toISOString()
        }))
      }))
    };
  }

  private deserializeCourse(data: any): Course {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      modules: data.modules.map((module: any) => ({
        ...module,
        createdAt: new Date(module.createdAt),
        updatedAt: new Date(module.updatedAt),
        lessons: module.lessons.map((lesson: any) => ({
          ...lesson,
          createdAt: new Date(lesson.createdAt),
          updatedAt: new Date(lesson.updatedAt)
        }))
      }))
    };
  }
}