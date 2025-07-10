import type { StorageAdapter, Course, LessonTemplate } from '../../types/core';

export class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'course-framework';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor(dbName?: string) {
    if (dbName) {
      this.dbName = dbName;
      console.log('🗄️ IndexedDBAdapter initialized with custom database name:', dbName);
    } else {
      console.log('🗄️ IndexedDBAdapter using default database name:', this.dbName);
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    console.log('🗄️ Opening IndexedDB database:', this.dbName, 'version:', this.version);
    return new Promise((resolve, reject) => {
      // First, try to open without specifying version to get the current version
      const versionRequest = indexedDB.open(this.dbName);
      
      versionRequest.onsuccess = () => {
        const currentDB = versionRequest.result;
        const currentVersion = currentDB.version;
        currentDB.close();
        
        // Use the higher of current version or our default version
        const targetVersion = Math.max(currentVersion, this.version);
        console.log('🗄️ Using database version:', targetVersion, '(current:', currentVersion, ', default:', this.version, ')');
        
        // Now open with the correct version
        const request = indexedDB.open(this.dbName, targetVersion);
        this.version = targetVersion;
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          // Handle upgrade logic here if needed
          console.log('🗄️ Database upgrade needed for StoragePlugin');
        };
      };
      
      versionRequest.onerror = () => {
        // Database doesn't exist, create new with default version
        console.log('🗄️ Creating new database:', this.dbName);
        const newRequest = indexedDB.open(this.dbName, this.version);
        
        newRequest.onerror = () => reject(newRequest.error);
        newRequest.onsuccess = () => {
          this.db = newRequest.result;
          resolve(this.db);
        };
        
        newRequest.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

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

          // Create posts object store for StoragePlugin
          if (!db.objectStoreNames.contains('posts')) {
            const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
            postsStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Create other object stores for StoragePlugin as needed
          const storeNames = ['members', 'products', 'events', 'comments'];
          storeNames.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          });
        };
      };
    });
  }

  async getCourses(): Promise<Course[]> {
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
    } catch (error) {
      console.error('Failed to get courses from IndexedDB:', error);
      return [];
    }
  }

  async getCourse(id: string): Promise<Course | null> {
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
          } else {
            console.log('IndexedDB: Course not found with id:', id);
            resolve(null);
          }
        };
        request.onerror = () => {
          console.error('IndexedDB: Error getting course:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Failed to get course from IndexedDB:', error);
      return null;
    }
  }

  async saveCourse(course: Course): Promise<Course> {
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
    } catch (error) {
      console.error('Failed to save course to IndexedDB:', error);
      throw error;
    }
  }

  async deleteCourse(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['courses'], 'readwrite');
      const store = transaction.objectStore('courses');

      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to delete course from IndexedDB:', error);
      throw error;
    }
  }

  async getLessonTemplates(): Promise<LessonTemplate[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['lessonTemplates'], 'readonly');
      const store = transaction.objectStore('lessonTemplates');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get lesson templates from IndexedDB:', error);
      return [];
    }
  }

  async saveLessonTemplate(template: LessonTemplate): Promise<LessonTemplate> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['lessonTemplates'], 'readwrite');
      const store = transaction.objectStore('lessonTemplates');

      return new Promise((resolve, reject) => {
        const request = store.put(template);
        request.onsuccess = () => resolve(template);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to save lesson template to IndexedDB:', error);
      throw error;
    }
  }

  async deleteLessonTemplate(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['lessonTemplates'], 'readwrite');
      const store = transaction.objectStore('lessonTemplates');

      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to delete lesson template from IndexedDB:', error);
      throw error;
    }
  }

  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Ensure table exists, upgrade database if needed
  private async ensureTableExists(tableName: string): Promise<IDBDatabase> {
    const currentDB = await this.openDB();
    
    // Check if table exists
    if (currentDB.objectStoreNames.contains(tableName)) {
      return currentDB;
    }
    
    // Need to upgrade database to add new table
    console.log('🗄️ Table', tableName, 'does not exist, creating it in database:', this.dbName);
    currentDB.close();
    this.db = null; // Reset cached connection
    
    // Increment version to trigger upgrade
    this.version++;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('🗄️ Failed to upgrade database:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('🗄️ Database upgraded successfully with table:', tableName);
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🗄️ Upgrade needed, creating object store:', tableName);
        
        // Recreate all existing stores and the new one
        const existingStores = Array.from(db.objectStoreNames);
        console.log('🗄️ Existing stores:', existingStores);
        
        // Create the new table
        if (!db.objectStoreNames.contains(tableName)) {
          db.createObjectStore(tableName, { keyPath: 'id' });
          console.log('🗄️ Successfully created object store:', tableName);
        }
      };
    });
  }

  // Generic set method for StoragePlugin compatibility
  async set(table: string, id: string, data: any): Promise<void> {
    console.log('🗄️ IndexedDBAdapter.set called:', table, id, 'database:', this.dbName);
    try {
      const db = await this.ensureTableExists(table);
      
      // Create transaction for the table
      const transaction = db.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      
      return new Promise<void>((resolve, reject) => {
        const request = store.put({ id, ...data });
        request.onsuccess = () => {
          console.log('🗄️ Successfully stored data in:', table, 'id:', id);
          resolve();
        };
        request.onerror = () => {
          console.error('🗄️ Error storing data:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('🗄️ Failed to set data in IndexedDB:', error);
      throw error;
    }
  }

  // Generic get method for StoragePlugin compatibility
  async get(table: string, id: string): Promise<any | null> {
    console.log('🗄️ IndexedDBAdapter.get called:', table, id);
    try {
      const db = await this.ensureTableExists(table);
      const transaction = db.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            const { id: resultId, ...data } = result;
            resolve(data);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get data from IndexedDB:', error);
      return null;
    }
  }

  // Generic getAll method for StoragePlugin compatibility
  async getAll(table: string): Promise<any[]> {
    console.log('🗄️ IndexedDBAdapter.getAll called:', table, 'database:', this.dbName);
    try {
      const db = await this.ensureTableExists(table);
      const transaction = db.transaction([table], 'readonly');
      const store = transaction.objectStore(table);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const results = request.result || [];
          console.log(`🗄️ IndexedDBAdapter.getAll found ${results.length} items in table '${table}'`);
          // Return the full items including IDs
          resolve(results);
        };
        request.onerror = () => {
          console.error('🗄️ Error getting all data from table', table, ':', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('🗄️ Failed to get all data from IndexedDB table', table, ':', error);
      return [];
    }
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

  // Generic clear method for StoragePlugin compatibility
  async clear(table: string): Promise<void> {
    console.log('🗄️ IndexedDBAdapter.clear called:', table, 'database:', this.dbName);
    try {
      const db = await this.ensureTableExists(table);
      const transaction = db.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      
      return new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => {
          console.log('🗄️ Successfully cleared table:', table);
          resolve();
        };
        request.onerror = () => {
          console.error('🗄️ Error clearing table:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('🗄️ Failed to clear table in IndexedDB:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['courses', 'lessonTemplates'], 'readwrite');
      
      const coursesStore = transaction.objectStore('courses');
      const templatesStore = transaction.objectStore('lessonTemplates');
      
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = coursesStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = templatesStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      ]);
      
      console.log('IndexedDB data cleared successfully');
    } catch (error) {
      console.error('Failed to clear IndexedDB data:', error);
      throw error;
    }
  }
}