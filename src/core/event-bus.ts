import type { EventBus, CourseEvent } from '../types/core';

class CourseFrameworkEventBus implements EventBus {
  private listeners: Map<string, Set<(event: CourseEvent) => void>> = new Map();

  emit(event: CourseEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }
  }

  on(eventType: string, handler: (event: CourseEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);
  }

  off(eventType: string, handler: (event: CourseEvent) => void): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  // Helper methods for common events
  emitCourseCreated(course: any): void {
    this.emit({
      type: 'course:created',
      payload: { course },
      timestamp: new Date()
    });
  }

  emitCourseUpdated(course: any): void {
    this.emit({
      type: 'course:updated',
      payload: { course },
      timestamp: new Date()
    });
  }

  emitCourseDeleted(courseId: string): void {
    this.emit({
      type: 'course:deleted',
      payload: { courseId },
      timestamp: new Date()
    });
  }

  emitLessonCompleted(courseId: string, lessonId: string): void {
    this.emit({
      type: 'lesson:completed',
      payload: { courseId, lessonId },
      timestamp: new Date()
    });
  }
}

export const eventBus = new CourseFrameworkEventBus();