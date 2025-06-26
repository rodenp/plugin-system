import type { Course, LessonTemplate } from '../../types/core';
import { BaseStorageAdapter } from './base-adapter';

export interface PostgresConfig {
  connectionString: string;
  tablePrefix?: string;
}

export class PostgresAdapter extends BaseStorageAdapter {
  private config: PostgresConfig;
  private db: any; // Would be your DB client (pg, Prisma, etc.)

  constructor(config: PostgresConfig) {
    super();
    this.config = {
      tablePrefix: 'course_framework_',
      ...config
    };
  }

  async initialize(dbClient: any): Promise<void> {
    this.db = dbClient;
    await this.ensureTables();
  }

  async getCourses(): Promise<Course[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const query = `
        SELECT c.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', m.id,
                     'title', m.title,
                     'description', m.description,
                     'order', m.order,
                     'createdAt', m.created_at,
                     'updatedAt', m.updated_at,
                     'lessons', m.lessons
                   )
                   ORDER BY m.order
                 ) FILTER (WHERE m.id IS NOT NULL),
                 '[]'::json
               ) as modules
        FROM ${this.config.tablePrefix}courses c
        LEFT JOIN ${this.config.tablePrefix}modules m ON c.id = m.course_id
        GROUP BY c.id
        ORDER BY c.updated_at DESC
      `;

      const result = await this.db.query(query);
      return result.rows.map(this.deserializeCourse);
    } catch (error) {
      console.error('Error loading courses from PostgreSQL:', error);
      throw new Error('Failed to load courses');
    }
  }

  async getCourse(id: string): Promise<Course | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const query = `
        SELECT c.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', m.id,
                     'title', m.title,
                     'description', m.description,
                     'order', m.order,
                     'createdAt', m.created_at,
                     'updatedAt', m.updated_at,
                     'lessons', m.lessons
                   )
                   ORDER BY m.order
                 ) FILTER (WHERE m.id IS NOT NULL),
                 '[]'::json
               ) as modules
        FROM ${this.config.tablePrefix}courses c
        LEFT JOIN ${this.config.tablePrefix}modules m ON c.id = m.course_id
        WHERE c.id = $1
        GROUP BY c.id
      `;

      const result = await this.db.query(query, [id]);
      return result.rows.length > 0 ? this.deserializeCourse(result.rows[0]) : null;
    } catch (error) {
      console.error('Error loading course from PostgreSQL:', error);
      throw new Error('Failed to load course');
    }
  }

  async saveCourse(course: Course): Promise<Course> {
    if (!this.db) throw new Error('Database not initialized');
    
    this.validateCourse(course);

    try {
      await this.db.query('BEGIN');

      // Upsert course
      const courseQuery = `
        INSERT INTO ${this.config.tablePrefix}courses (
          id, title, description, cover_image, tags, is_published, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          title = $2, description = $3, cover_image = $4, tags = $5, 
          is_published = $6, updated_at = $8
      `;

      await this.db.query(courseQuery, [
        course.id,
        course.title,
        course.description,
        course.coverImage,
        JSON.stringify(course.tags),
        course.isPublished,
        course.createdAt,
        course.updatedAt
      ]);

      // Delete existing modules
      await this.db.query(
        `DELETE FROM ${this.config.tablePrefix}modules WHERE course_id = $1`,
        [course.id]
      );

      // Insert modules
      for (const module of course.modules) {
        const moduleQuery = `
          INSERT INTO ${this.config.tablePrefix}modules (
            id, course_id, title, description, lessons, "order", created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        await this.db.query(moduleQuery, [
          module.id,
          course.id,
          module.title,
          module.description,
          JSON.stringify(module.lessons),
          module.order,
          module.createdAt,
          module.updatedAt
        ]);
      }

      await this.db.query('COMMIT');
      return course;
    } catch (error) {
      await this.db.query('ROLLBACK');
      console.error('Error saving course to PostgreSQL:', error);
      throw new Error('Failed to save course');
    }
  }

  async deleteCourse(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.query('BEGIN');
      
      // Delete modules first (foreign key constraint)
      await this.db.query(
        `DELETE FROM ${this.config.tablePrefix}modules WHERE course_id = $1`,
        [id]
      );
      
      // Delete course
      await this.db.query(
        `DELETE FROM ${this.config.tablePrefix}courses WHERE id = $1`,
        [id]
      );
      
      await this.db.query('COMMIT');
    } catch (error) {
      await this.db.query('ROLLBACK');
      console.error('Error deleting course from PostgreSQL:', error);
      throw new Error('Failed to delete course');
    }
  }

  async getLessonTemplates(): Promise<LessonTemplate[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const query = `
        SELECT * FROM ${this.config.tablePrefix}lesson_templates
        ORDER BY category, title
      `;

      const result = await this.db.query(query);
      return result.rows.map((row: Record<string, any>) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        content: JSON.parse(row.content),
        duration: row.duration,
        category: row.category
      }));
    } catch (error) {
      console.error('Error loading lesson templates from PostgreSQL:', error);
      throw new Error('Failed to load lesson templates');
    }
  }

  async saveLessonTemplate(template: LessonTemplate): Promise<LessonTemplate> {
    if (!this.db) throw new Error('Database not initialized');
    
    this.validateLessonTemplate(template);

    try {
      const query = `
        INSERT INTO ${this.config.tablePrefix}lesson_templates (
          id, title, description, content, duration, category
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          title = $2, description = $3, content = $4, duration = $5, category = $6
      `;

      await this.db.query(query, [
        template.id,
        template.title,
        template.description,
        JSON.stringify(template.content),
        template.duration,
        template.category
      ]);

      return template;
    } catch (error) {
      console.error('Error saving lesson template to PostgreSQL:', error);
      throw new Error('Failed to save lesson template');
    }
  }

  private async ensureTables(): Promise<void> {
    const createCoursesTable = `
      CREATE TABLE IF NOT EXISTS ${this.config.tablePrefix}courses (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        cover_image TEXT,
        tags JSONB DEFAULT '[]',
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `;

    const createModulesTable = `
      CREATE TABLE IF NOT EXISTS ${this.config.tablePrefix}modules (
        id VARCHAR(255) PRIMARY KEY,
        course_id VARCHAR(255) NOT NULL REFERENCES ${this.config.tablePrefix}courses(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        lessons JSONB DEFAULT '[]',
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `;

    const createLessonTemplatesTable = `
      CREATE TABLE IF NOT EXISTS ${this.config.tablePrefix}lesson_templates (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        content JSONB NOT NULL,
        duration INTEGER NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'general'
      )
    `;

    try {
      await this.db.query(createCoursesTable);
      await this.db.query(createModulesTable);
      await this.db.query(createLessonTemplatesTable);

      // Create indexes
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_courses_updated_at 
        ON ${this.config.tablePrefix}courses(updated_at DESC)
      `);
      
      await this.db.query(`
        CREATE INDEX IF NOT EXISTS idx_modules_course_order 
        ON ${this.config.tablePrefix}modules(course_id, "order")
      `);
    } catch (error) {
      console.error('Error creating tables:', error);
      throw new Error('Failed to initialize database tables');
    }
  }

  private deserializeCourse(row: Record<string, any>): Course {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      coverImage: row.cover_image,
      tags: JSON.parse(row.tags || '[]'),
      isPublished: row.is_published,
      modules: row.modules || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// Export factory function for easier setup
export function createPostgresAdapter(config: PostgresConfig) {
  return new PostgresAdapter(config);
}

// Example usage with different DB clients:
/*
// With node-postgres (pg)
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = createPostgresAdapter({ connectionString: process.env.DATABASE_URL });
await adapter.initialize(pool);

// With Prisma
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const adapter = createPostgresAdapter({ connectionString: process.env.DATABASE_URL });
await adapter.initialize(prisma);
*/