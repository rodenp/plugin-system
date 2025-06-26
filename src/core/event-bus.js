class CourseFrameworkEventBus {
    listeners = new Map();
    emit(event) {
        const handlers = this.listeners.get(event.type);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(event);
                }
                catch (error) {
                    console.error(`Error in event handler for ${event.type}:`, error);
                }
            });
        }
    }
    on(eventType, handler) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(handler);
    }
    off(eventType, handler) {
        const handlers = this.listeners.get(eventType);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.listeners.delete(eventType);
            }
        }
    }
    // Helper methods for common events
    emitCourseCreated(course) {
        this.emit({
            type: 'course:created',
            payload: { course },
            timestamp: new Date()
        });
    }
    emitCourseUpdated(course) {
        this.emit({
            type: 'course:updated',
            payload: { course },
            timestamp: new Date()
        });
    }
    emitCourseDeleted(courseId) {
        this.emit({
            type: 'course:deleted',
            payload: { courseId },
            timestamp: new Date()
        });
    }
    emitLessonCompleted(courseId, lessonId) {
        this.emit({
            type: 'lesson:completed',
            payload: { courseId, lessonId },
            timestamp: new Date()
        });
    }
}
export const eventBus = new CourseFrameworkEventBus();
