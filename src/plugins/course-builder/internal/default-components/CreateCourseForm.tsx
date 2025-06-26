import type React from 'react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import type { Course } from '@/types/core';
import { Upload, X } from 'lucide-react';
import { defaultTheme } from '@/core/theme/default-theme';

interface CreateCourseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  onCreateCourse: (course: Omit<Course, 'id' | 'createdAt'>) => Promise<void>;
  theme?: typeof defaultTheme;
}

export function CreateCourseForm({ onSuccess, onCancel, onCreateCourse, theme }: CreateCourseFormProps) {
  const appliedTheme = theme ?? defaultTheme;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    tags: [] as string[],
    isTemplate: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For framework, we'll use a data URL for simplicity
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      handleInputChange('coverImage', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        coverImage: formData.coverImage || undefined,
        modules: [],
        progress: 0,
        isTemplate: formData.isTemplate,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      await onCreateCourse(courseData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Course Title */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '0.75rem',
          color: '#1f2937'
        }}>
          Course Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter course title"
          required
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            backgroundColor: '#f9fafb',
            outline: 'none',
            transition: 'border-color 0.2s, background-color 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.backgroundColor = '#ffffff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.backgroundColor = '#f9fafb';
          }}
        />
      </div>

      {/* Course Description */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '0.75rem',
          color: '#1f2937'
        }}>
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe what students will learn in this course"
          rows={5}
          required
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            backgroundColor: '#f9fafb',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: '1.5',
            transition: 'border-color 0.2s, background-color 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.backgroundColor = '#ffffff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.backgroundColor = '#f9fafb';
          }}
        />
      </div>

      {/* Cover Image */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '0.75rem',
          color: '#1f2937'
        }}>
          Cover Image
        </label>

        {/* URL Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="url"
            value={formData.coverImage}
            onChange={(e) => handleInputChange('coverImage', e.target.value)}
            placeholder="Enter image URL or upload a file"
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              backgroundColor: '#f9fafb',
              outline: 'none',
              transition: 'border-color 0.2s, background-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.backgroundColor = '#ffffff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.backgroundColor = '#f9fafb';
            }}
          />

          {/* File Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ 
              fontSize: '1rem',
              color: '#6b7280'
            }}>or</span>
            <label style={{ cursor: 'pointer' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.625rem 1rem',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Upload Image
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* Image Preview */}
        {formData.coverImage && (
          <div style={{ marginTop: '1rem' }}>
            <img
              src={formData.coverImage}
              alt="Cover preview"
              style={{
                width: '100%',
                height: '10rem',
                objectFit: 'cover',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db'
              }}
            />
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '1rem',
          fontWeight: '600',
          marginBottom: '0.75rem',
          color: '#1f2937'
        }}>
          Tags
        </label>

        {/* Tag Input */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              backgroundColor: '#f9fafb',
              outline: 'none',
              transition: 'border-color 0.2s, background-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.backgroundColor = '#ffffff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.backgroundColor = '#f9fafb';
            }}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
            style={{
              padding: '0.875rem 1.25rem',
              backgroundColor: !tagInput.trim() ? '#f3f4f6' : '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: !tagInput.trim() ? '#9ca3af' : '#374151',
              cursor: !tagInput.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (tagInput.trim()) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (tagInput.trim()) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
          >
            Add
          </button>
        </div>

        {/* Tags Display */}
        {formData.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {formData.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontSize: '0.875rem',
                  borderRadius: '9999px'
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    borderRadius: '9999px',
                    padding: '0.125rem',
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <X style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Template Checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <input
          type="checkbox"
          id="isTemplate"
          checked={formData.isTemplate}
          onChange={(e) => handleInputChange('isTemplate', e.target.checked)}
          style={{ 
            width: '1.125rem',
            height: '1.125rem',
            borderRadius: '0.25rem',
            border: '1px solid #d1d5db',
            cursor: 'pointer'
          }}
        />
        <label htmlFor="isTemplate" style={{
          fontSize: '1rem',
          fontWeight: '500',
          color: '#1f2937',
          cursor: 'pointer'
        }}>
          Save as template
        </label>
        <span style={{ 
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          (Templates can be reused to create new courses)
        </span>
      </div>

      {/* Form Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '0.75rem', 
        paddingTop: '2rem', 
        marginTop: '1rem'
      }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            color: '#374151',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: isSubmitting ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: (isSubmitting || !formData.title.trim() || !formData.description.trim()) ? '#9ca3af' : '#6b7280',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            color: 'white',
            cursor: (isSubmitting || !formData.title.trim() || !formData.description.trim()) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting && formData.title.trim() && formData.description.trim()) {
              e.currentTarget.style.backgroundColor = '#4b5563';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting && formData.title.trim() && formData.description.trim()) {
              e.currentTarget.style.backgroundColor = '#6b7280';
            }
          }}
        >
          {isSubmitting ? 'Creating...' : 'Create Course'}
        </button>
      </div>
    </form>
  );
}