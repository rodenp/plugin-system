export class BaseStorageAdapter {
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    validateCourse(course) {
        if (!course.id)
            throw new Error('Course must have an id');
        if (!course.title)
            throw new Error('Course must have a title');
        if (!Array.isArray(course.modules))
            throw new Error('Course must have modules array');
    }
    validateLessonTemplate(template) {
        if (!template.id)
            throw new Error('Lesson template must have an id');
        if (!template.title)
            throw new Error('Lesson template must have a title');
        if (!Array.isArray(template.content))
            throw new Error('Lesson template must have content array');
    }
}
