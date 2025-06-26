export class IndexedDBAdapter {
    dbName = 'course-framework';
    version = 1;
    db = null;
    async openDB() {
        if (this.db)
            return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create courses object store
                if (!db.objectStoreNames.contains('courses')) {
                    const coursesStore = db.createObjectStore('courses', { keyPath: 'id' });
                    coursesStore.createIndex('title', 'title', { unique: false });
                    coursesStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                // Create lesson templates object store
                if (!db.objectStoreNames.contains('lessonTemplates')) {
                    const templatesStore = db.createObjectStore('lessonTemplates', { keyPath: 'id' });
                    templatesStore.createIndex('name', 'name', { unique: false });
                }
            };
        });
    }
    async getCourses() {
        try {
            console.log('IndexedDB: Getting courses...');
            const db = await this.openDB();
            console.log('IndexedDB: Database opened');
            const transaction = db.transaction(['courses'], 'readonly');
            const store = transaction.objectStore('courses');
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    const courses = request.result || [];
                    console.log('IndexedDB: Found courses:', courses.length);
                    resolve(courses.map(course => this.deserializeCourse(course)));
                };
                request.onerror = () => {
                    console.error('IndexedDB: Error getting courses:', request.error);
                    reject(request.error);
                };
            });
        }
        catch (error) {
            console.error('Failed to get courses from IndexedDB:', error);
            return [];
        }
    }
    async getCourse(id) {
        try {
            console.log('IndexedDB: Getting course with id:', id);
            const db = await this.openDB();
            const transaction = db.transaction(['courses'], 'readonly');
            const store = transaction.objectStore('courses');
            return new Promise((resolve, reject) => {
                const request = store.get(id);
                request.onsuccess = () => {
                    const course = request.result;
                    if (course) {
                        console.log('IndexedDB: Found course:', course.title);
                        resolve(this.deserializeCourse(course));
                    }
                    else {
                        console.log('IndexedDB: Course not found with id:', id);
                        resolve(null);
                    }
                };
                request.onerror = () => {
                    console.error('IndexedDB: Error getting course:', request.error);
                    reject(request.error);
                };
            });
        }
        catch (error) {
            console.error('Failed to get course from IndexedDB:', error);
            return null;
        }
    }
    async saveCourse(course) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['courses'], 'readwrite');
            const store = transaction.objectStore('courses');
            const serializedCourse = this.serializeCourse(course);
            return new Promise((resolve, reject) => {
                const request = store.put(serializedCourse);
                request.onsuccess = () => resolve(course);
                request.onerror = () => reject(request.error);
            });
        }
        catch (error) {
            console.error('Failed to save course to IndexedDB:', error);
            throw error;
        }
    }
    async deleteCourse(id) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['courses'], 'readwrite');
            const store = transaction.objectStore('courses');
            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        catch (error) {
            console.error('Failed to delete course from IndexedDB:', error);
            throw error;
        }
    }
    async getLessonTemplates() {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['lessonTemplates'], 'readonly');
            const store = transaction.objectStore('lessonTemplates');
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        }
        catch (error) {
            console.error('Failed to get lesson templates from IndexedDB:', error);
            return [];
        }
    }
    async saveLessonTemplate(template) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['lessonTemplates'], 'readwrite');
            const store = transaction.objectStore('lessonTemplates');
            return new Promise((resolve, reject) => {
                const request = store.put(template);
                request.onsuccess = () => resolve(template);
                request.onerror = () => reject(request.error);
            });
        }
        catch (error) {
            console.error('Failed to save lesson template to IndexedDB:', error);
            throw error;
        }
    }
    async deleteLessonTemplate(id) {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['lessonTemplates'], 'readwrite');
            const store = transaction.objectStore('lessonTemplates');
            return new Promise((resolve, reject) => {
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        catch (error) {
            console.error('Failed to delete lesson template from IndexedDB:', error);
            throw error;
        }
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    serializeCourse(course) {
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
    deserializeCourse(data) {
        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            modules: data.modules.map((module) => ({
                ...module,
                createdAt: new Date(module.createdAt),
                updatedAt: new Date(module.updatedAt),
                lessons: module.lessons.map((lesson) => ({
                    ...lesson,
                    createdAt: new Date(lesson.createdAt),
                    updatedAt: new Date(lesson.updatedAt)
                }))
            }))
        };
    }
    async clearAllData() {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(['courses', 'lessonTemplates'], 'readwrite');
            const coursesStore = transaction.objectStore('courses');
            const templatesStore = transaction.objectStore('lessonTemplates');
            await Promise.all([
                new Promise((resolve, reject) => {
                    const request = coursesStore.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                }),
                new Promise((resolve, reject) => {
                    const request = templatesStore.clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                })
            ]);
            console.log('IndexedDB data cleared successfully');
        }
        catch (error) {
            console.error('Failed to clear IndexedDB data:', error);
            throw error;
        }
    }
}
