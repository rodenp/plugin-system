import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { Course, LessonTemplate, ViewMode, StorageAdapter } from '../types/core';
import { IndexedDBAdapter } from './storage/indexeddb-adapter';
import { eventBus } from './event-bus';

interface CourseState {
  courses: Course[];
  lessonTemplates: LessonTemplate[];
  currentCourse: Course | null;
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
}

type CourseAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_COURSES'; payload: Course[] }
  | { type: 'SET_CURRENT_COURSE'; payload: Course | null }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'ADD_COURSE'; payload: Course }
  | { type: 'UPDATE_COURSE'; payload: Course }
  | { type: 'DELETE_COURSE'; payload: string }
  | { type: 'SET_LESSON_TEMPLATES'; payload: LessonTemplate[] };

const initialState: CourseState = {
  courses: [],
  lessonTemplates: [],
  currentCourse: null,
  viewMode: 'view',
  loading: false,
  error: null,
};

function courseReducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_COURSES':
      return { ...state, courses: action.payload };
    case 'SET_CURRENT_COURSE':
      return { ...state, currentCourse: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.payload] };
    case 'UPDATE_COURSE':
      return {
        ...state,
        courses: state.courses.map(course =>
          course.id === action.payload.id ? action.payload : course
        ),
        currentCourse: state.currentCourse?.id === action.payload.id ? action.payload : state.currentCourse,
      };
    case 'DELETE_COURSE':
      return {
        ...state,
        courses: state.courses.filter(course => course.id !== action.payload),
        currentCourse: state.currentCourse?.id === action.payload ? null : state.currentCourse,
      };
    case 'SET_LESSON_TEMPLATES':
      return { ...state, lessonTemplates: action.payload };
    default:
      return state;
  }
}

interface CourseContextType extends CourseState {
  // Course operations
  loadCourses: () => Promise<void>;
  createCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Course>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  cloneCourse: (id: string) => Promise<Course>;
  loadCourse: (id: string) => Promise<void>;
  exportCourse: (id: string) => Promise<string>;
  importCourse: (data: string) => Promise<Course>;

  // View mode
  setViewMode: (mode: ViewMode) => void;

  // Lesson Templates
  loadLessonTemplates: () => Promise<void>;
  saveLessonTemplate: (template: LessonTemplate) => Promise<void>;
  saveAsTemplate: (courseId: string, name: string, description: string) => Promise<void>;

  // Utility
  generateId: () => string;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

interface CourseProviderProps {
  children: ReactNode;
  storageAdapter?: StorageAdapter;
}

export function CourseProvider({ children, storageAdapter }: CourseProviderProps) {
  const [state, dispatch] = useReducer(courseReducer, initialState);
  const storage = useMemo(() => storageAdapter || new IndexedDBAdapter(), [storageAdapter]);
  const storageRef = useRef(storage);
  
  // Keep storage ref up to date
  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  const loadCourses = useCallback(async () => {
    try {
      console.log('CourseContext: Loading courses, setting loading=true');
      dispatch({ type: 'SET_LOADING', payload: true });
      const courses = await storage.getCourses();
      console.log('CourseContext: Got courses from storage:', courses.length);
      dispatch({ type: 'SET_COURSES', payload: courses });
    } catch (error) {
      console.error('CourseContext: Error loading courses:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load courses' });
    } finally {
      console.log('CourseContext: Setting loading=false');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [storage]);

  const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const course: Course = {
        ...courseData,
        id: storage.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedCourse = await storage.saveCourse(course);
      dispatch({ type: 'ADD_COURSE', payload: savedCourse });

      // Emit event
      eventBus.emitCourseCreated(savedCourse);

      return savedCourse;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create course' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCourse = useCallback(async (course: Course) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedCourse = { ...course, updatedAt: new Date() };
      await storage.saveCourse(updatedCourse);
      dispatch({ type: 'UPDATE_COURSE', payload: updatedCourse });

      // Emit event
      eventBus.emitCourseUpdated(updatedCourse);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update course' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [storage]);

  const deleteCourse = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await storage.deleteCourse(id);
      dispatch({ type: 'DELETE_COURSE', payload: id });

      // Emit event
      eventBus.emitCourseDeleted(id);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete course' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cloneCourse = async (id: string): Promise<Course> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const originalCourse = await storage.getCourse(id);
      if (!originalCourse) throw new Error('Course not found');

      const clonedCourse: Course = {
        ...originalCourse,
        id: storage.generateId(),
        title: `${originalCourse.title} (Copy)`,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        modules: originalCourse.modules.map(module => ({
          ...module,
          id: storage.generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lessons: module.lessons.map(lesson => ({
            ...lesson,
            id: storage.generateId(),
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            content: lesson.content.map(content => ({
              ...content,
              id: storage.generateId(),
            })),
          })),
        })),
      };

      const savedCourse = await storage.saveCourse(clonedCourse);
      dispatch({ type: 'ADD_COURSE', payload: savedCourse });

      // Emit event
      eventBus.emitCourseCreated(savedCourse);

      return savedCourse;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to clone course' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadCourse = useCallback(async (id: string) => {
    console.log('CourseContext: loadCourse called with id:', id);
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const course = await storageRef.current.getCourse(id);
      console.log('CourseContext: Found course, setting current course');
      dispatch({ type: 'SET_CURRENT_COURSE', payload: course });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load course' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []); // No dependencies - function is stable

  const setViewMode = (mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  const loadLessonTemplates = useCallback(async () => {
    try {
      const templates = await storage.getLessonTemplates();
      dispatch({ type: 'SET_LESSON_TEMPLATES', payload: templates });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load lesson templates' });
    }
  }, [storage]);

  const saveLessonTemplate = useCallback(async (template: LessonTemplate) => {
    try {
      await storage.saveLessonTemplate(template);
      await loadLessonTemplates();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save lesson template' });
    }
  }, [storage, loadLessonTemplates]);

  const saveAsTemplate = useCallback(async (courseId: string, name: string, description: string) => {
    try {
      const course = await storage.getCourse(courseId);
      if (!course) throw new Error('Course not found');
      
      // Create a template version of the course
      const templateCourse: Course = {
        ...course,
        id: storage.generateId(),
        title: name,
        description: description,
        isTemplate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        modules: course.modules.map(module => ({
          ...module,
          id: storage.generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lessons: module.lessons.map(lesson => ({
            ...lesson,
            id: storage.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            content: lesson.content.map(content => ({
              ...content,
              id: storage.generateId(),
            })),
          })),
        })),
      };

      const savedTemplate = await storage.saveCourse(templateCourse);
      dispatch({ type: 'ADD_COURSE', payload: savedTemplate });

      // Emit event
      eventBus.emitCourseCreated(savedTemplate);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save as template' });
      throw error;
    }
  }, [storage]);

  const exportCourse = async (id: string): Promise<string> => {
    try {
      const course = await storage.getCourse(id);
      if (!course) throw new Error('Course not found');
      
      return JSON.stringify({
        version: '1.0',
        course,
        exportDate: new Date().toISOString(),
      }, null, 2);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to export course' });
      throw error;
    }
  };

  const importCourse = async (data: string): Promise<Course> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const parsed = JSON.parse(data);
      const courseData = parsed.course || parsed; // Support both wrapped and unwrapped formats
      
      // Generate new IDs to avoid conflicts
      const importedCourse: Course = {
        ...courseData,
        id: storage.generateId(),
        title: `${courseData.title} (Imported)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        modules: courseData.modules?.map((module: any) => ({
          ...module,
          id: storage.generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          lessons: module.lessons?.map((lesson: any) => ({
            ...lesson,
            id: storage.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            content: lesson.content?.map((content: any) => ({
              ...content,
              id: storage.generateId(),
            })) || [],
          })) || [],
        })) || [],
      };

      const savedCourse = await storage.saveCourse(importedCourse);
      dispatch({ type: 'ADD_COURSE', payload: savedCourse });

      // Emit event
      eventBus.emitCourseCreated(savedCourse);

      return savedCourse;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to import course' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const generateId = () => storage.generateId();

  // Load initial data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const [courses, templates] = await Promise.all([
          storage.getCourses(),
          storage.getLessonTemplates(),
        ]);
        dispatch({ type: 'SET_COURSES', payload: courses });
        dispatch({ type: 'SET_LESSON_TEMPLATES', payload: templates });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeData();
  }, [storage]);

  const value: CourseContextType = {
    ...state,
    loadCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    cloneCourse,
    loadCourse,
    exportCourse,
    importCourse,
    setViewMode,
    loadLessonTemplates,
    saveLessonTemplate,
    saveAsTemplate,
    generateId,
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse(): CourseContextType {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}