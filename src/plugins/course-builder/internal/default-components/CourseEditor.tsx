import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ModuleManager } from "./ModuleManager";
import type { ContentBlock, Course, Lesson, Module } from "@/types/core";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  BookOpen,
  Check,
  Edit,
  Eye,
  FileText,
  GripVertical,
  Image,
  Italic,
  Library,
  List,
  ListOrdered,
  MoreVertical,
  Move,
  Plus,
  Save,
  Trash2,
  Type,
  Underline,
  Upload,
  Video,
  Volume2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// Import theme utilities to ensure CSS variables are set
import "../../theme-utils";
import './course-editor.css';
import { defaultTheme } from '@/core/theme/default-theme';

interface CourseEditorProps {
  courseId: string;
  onBack?: () => void;
  onViewMode?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  course: Course | null;
  onUpdateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  loadCourse?: (courseId: string) => Promise<void>;
  theme?: any;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  theme?: typeof defaultTheme;
}

// Fixed Rich Text Editor Component
function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  theme,
}: RichTextEditorProps) {
  const appliedTheme = theme ?? defaultTheme;
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isUpdatingRef = useRef(false);

  const handleCommand = (command: string, commandValue?: string) => {
    if (!editorRef.current) return;

    // Save current selection
    const selection = window.getSelection();
    let range: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0).cloneRange();
    }

    // Execute command
    document.execCommand(command, false, commandValue);

    // Update content
    const newContent = editorRef.current.innerHTML;
    onChange(newContent);

    // Restore focus
    editorRef.current.focus();

    // Restore selection if possible
    if (range && selection) {
      try {
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        // Ignore range errors
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (isUpdatingRef.current) return;

    const target = e.target as HTMLDivElement;
    const newContent = target.innerHTML;
    onChange(newContent);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  // Only update innerHTML when value changes externally (not from user input)
  useEffect(() => {
    if (editorRef.current && !isFocused) {
      isUpdatingRef.current = true;
      editorRef.current.innerHTML = value || "";
      isUpdatingRef.current = false;
    }
  }, [value, isFocused]);

  return (
    <div
      style={{
        border: `1px solid ${appliedTheme.borders.borderColor}`,
        borderRadius: '0.5rem',
        ...(isFocused ? { 
          outline: `2px solid ${appliedTheme.colors.primary || '#22c55e'}`,
          outlineOffset: '2px'
        } : {}),
        ...className
      }}
    >
      {/* Toolbar */}
      <div style={{ 
        borderBottom: `1px solid ${appliedTheme.borders.borderColor}`,
        padding: '0.75rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.25rem',
        backgroundColor: appliedTheme.colors.backgroundAlt
      }}>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("bold")}
          style={{
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Bold"
        >
          <Bold style={{ width: '1rem', height: '1rem' }} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("italic")}
          style={{
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Italic"
        >
          <Italic style={{ width: '1rem', height: '1rem' }} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("underline")}
          style={{
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Underline"
        >
          <Underline style={{ width: '1rem', height: '1rem' }} />
        </button>
        <div style={{ 
          width: '1px', 
          margin: '0 0.25rem',
          backgroundColor: appliedTheme.borders.borderColor
        }} />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("insertUnorderedList")}
          style={{
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Bullet List"
        >
          <List style={{ width: '1rem', height: '1rem' }} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("insertOrderedList")}
          style={{
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Numbered List"
        >
          <ListOrdered style={{ width: '1rem', height: '1rem' }} />
        </button>
        <div style={{ 
          width: '1px', 
          margin: '0 0.25rem',
          backgroundColor: appliedTheme.borders.borderColor
        }} />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("justifyLeft")}
          style={{
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Align Left"
        >
          <AlignLeft style={{ width: '1rem', height: '1rem' }} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("justifyCenter")}
          style={{
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Align Center"
        >
          <AlignCenter style={{ width: '1rem', height: '1rem' }} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleCommand("justifyRight")}
          style={{
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title="Align Right"
        >
          <AlignRight style={{ width: '1rem', height: '1rem' }} />
        </button>
        <div style={{ 
          width: '1px', 
          margin: '0 0.25rem',
          backgroundColor: appliedTheme.borders.borderColor
        }} />
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            handleCommand("formatBlock", e.target.value);
            e.target.value = "";
          }}
          style={{ 
            padding: '0.25rem 0.5rem',
            fontSize: '0.875rem',
            borderRadius: '0.375rem',
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            backgroundColor: appliedTheme.colors.surface,
            color: appliedTheme.colors.textPrimary
          }}
          value=""
        >
          <option value="">Format</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="p">Paragraph</option>
        </select>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
        style={{
          padding: '1rem',
          minHeight: '12.5rem',
          outline: 'none',
          wordBreak: "break-word",
          overflowWrap: "break-word",
          maxWidth: 'none',
          lineHeight: '1.75',
          color: appliedTheme.colors.textPrimary
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${appliedTheme.colors.textSecondary};
          pointer-events: none;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

// Editable text component for both lessons and modules
interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

function EditableText({
  value,
  onChange,
  className,
  placeholder = "Untitled",
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [hasChanged, setHasChanged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
    setHasChanged(false);
  }, [value]);

  const handleSave = () => {
    const newValue = editValue.trim() || placeholder;
    onChange(newValue);
    setIsEditing(false);
    setHasChanged(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setHasChanged(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value);
    setHasChanged(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    setHasChanged(newValue !== value);
  };

  const handleBlur = () => {
    if (!hasChanged) {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 flex-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-6 text-sm"
        />
        {hasChanged && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" style={{ color: 'var(--course-builder-success, #22c55e)' }} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" style={{ color: 'var(--course-builder-error, #ef4444)' }} />
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <span
      className={`flex-1 truncate cursor-pointer px-1 py-0.5 rounded ${className}`}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--course-builder-bg-muted)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      {value}
    </span>
  );
}

// Enhanced content block editor
interface ContentBlockEditorProps {
  content: ContentBlock;
  onUpdate: (content: ContentBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  theme?: typeof defaultTheme;
}

function ContentBlockEditor({
  content,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  theme,
}: ContentBlockEditorProps) {
  const appliedTheme = theme ?? defaultTheme;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a mock URL for demonstration
    const url = URL.createObjectURL(file);

    if (content.type === "image" && file.type.startsWith("image/")) {
      onUpdate({
        ...content,
        content: {
          type: "image",
          url,
          title:
            content.content.type === "image"
              ? content.content.title || file.name
              : file.name,
          caption:
            content.content.type === "image"
              ? content.content.caption || ""
              : "",
        },
      });
    } else if (content.type === "video" && file.type.startsWith("video/")) {
      onUpdate({
        ...content,
        content: {
          type: "video",
          url,
          title:
            content.content.type === "video"
              ? content.content.title || file.name
              : file.name,
          caption:
            content.content.type === "video"
              ? content.content.caption || ""
              : "",
        },
      });
    } else if (content.type === "audio" && file.type.startsWith("audio/")) {
      onUpdate({
        ...content,
        content: {
          type: "audio",
          url,
          title:
            content.content.type === "audio"
              ? content.content.title || file.name
              : file.name,
          caption:
            content.content.type === "audio"
              ? content.content.caption || ""
              : "",
        },
      });
    }
  };

  const renderEditor = () => {
    switch (content.type) {
      case "text":
        return (
          <RichTextEditor
            value={
              content.content.type === "text" ? content.content.content : ""
            }
            onChange={(newContent) =>
              onUpdate({
                ...content,
                content: { type: "text", content: newContent },
              })
            }
            placeholder="Enter your content here..."
            theme={appliedTheme}
          />
        );

      case "image":
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {content.content.type === "image" && content.content.url ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={content.content.url}
                  alt={content.content.title || ""}
                  style={{ 
                    width: '100%',
                    maxHeight: '24rem',
                    objectFit: 'cover',
                    borderRadius: '0.5rem'
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem'
                  }}
                  theme={appliedTheme}
                >
                  <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                  Change
                </Button>
              </div>
            ) : (
              <div
                style={{ 
                  borderWidth: '2px',
                  borderStyle: 'dashed',
                  borderColor: appliedTheme.borders.borderColor,
                  borderRadius: '0.5rem',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = appliedTheme.colors.textSecondary}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = appliedTheme.borders.borderColor}
                onClick={() => fileInputRef.current?.click()}
              >
                <Image style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  margin: '0 auto 1rem',
                  color: appliedTheme.colors.textSecondary
                }} />
                <p style={{ color: appliedTheme.colors.textSecondary }}>
                  Click to upload an image
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            <style>{`@media (min-width: 768px) { .image-grid { grid-template-columns: repeat(2, 1fr); } }`}</style>
            <div className="image-grid" style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1rem'
            }}>
              <Input
                placeholder="Image title (optional)"
                value={
                  content.content.type === "image"
                    ? content.content.title || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "image",
                      url:
                        content.content.type === "image"
                          ? content.content.url
                          : "",
                      title: e.target.value,
                      caption:
                        content.content.type === "image"
                          ? content.content.caption || ""
                          : "",
                    },
                  })
                }
                theme={appliedTheme}
              />
              <Input
                placeholder="Image caption (optional)"
                value={
                  content.content.type === "image"
                    ? content.content.caption || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "image",
                      url:
                        content.content.type === "image"
                          ? content.content.url
                          : "",
                      title:
                        content.content.type === "image"
                          ? content.content.title || ""
                          : "",
                      caption: e.target.value,
                    },
                  })
                }
                theme={appliedTheme}
              />
            </div>
          </div>
        );

      case "video":
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {content.content.type === "video" && content.content.url ? (
              <div style={{ position: 'relative' }}>
                <video
                  src={content.content.url}
                  controls
                  style={{ 
                    width: '100%',
                    maxHeight: '24rem',
                    borderRadius: '0.5rem'
                  }}
                >
                  <track kind="captions" label="English" srcLang="en" />
                  Your browser does not support the video tag.
                </video>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem'
                  }}
                  theme={appliedTheme}
                >
                  <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                  Change
                </Button>
              </div>
            ) : (
              <div
                style={{ 
                  borderWidth: '2px',
                  borderStyle: 'dashed',
                  borderColor: appliedTheme.borders.borderColor,
                  borderRadius: '0.5rem',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = appliedTheme.colors.textSecondary}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = appliedTheme.borders.borderColor}
                onClick={() => fileInputRef.current?.click()}
              >
                <Video style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  margin: '0 auto 1rem',
                  color: appliedTheme.colors.textSecondary
                }} />
                <p style={{ color: appliedTheme.colors.textSecondary }}>
                  Click to upload a video
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            <style>{`@media (min-width: 768px) { .video-grid { grid-template-columns: repeat(2, 1fr); } }`}</style>
            <div className="video-grid" style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1rem'
            }}>
              <Input
                placeholder="Video title (optional)"
                value={
                  content.content.type === "video"
                    ? content.content.title || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "video",
                      url:
                        content.content.type === "video"
                          ? content.content.url
                          : "",
                      title: e.target.value,
                      caption:
                        content.content.type === "video"
                          ? content.content.caption || ""
                          : "",
                    },
                  })
                }
                theme={appliedTheme}
              />
              <Input
                placeholder="Video caption (optional)"
                value={
                  content.content.type === "video"
                    ? content.content.caption || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "video",
                      url:
                        content.content.type === "video"
                          ? content.content.url
                          : "",
                      title:
                        content.content.type === "video"
                          ? content.content.title || ""
                          : "",
                      caption: e.target.value,
                    },
                  })
                }
                theme={appliedTheme}
              />
            </div>
          </div>
        );

      case "audio":
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {content.content.type === "audio" && content.content.url ? (
              <div style={{ 
                position: 'relative',
                padding: '1rem',
                borderRadius: '0.5rem',
                backgroundColor: appliedTheme.colors.backgroundAlt
              }}>
                <audio src={content.content.url} controls style={{ width: '100%' }}>
                  <track kind="captions" label="English" srcLang="en" />
                  Your browser does not support the audio tag.
                </audio>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem'
                  }}
                  theme={appliedTheme}
                >
                  <Upload style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                  Change
                </Button>
              </div>
            ) : (
              <div
                style={{ 
                  borderWidth: '2px',
                  borderStyle: 'dashed',
                  borderColor: appliedTheme.borders.borderColor,
                  borderRadius: '0.5rem',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = appliedTheme.colors.textSecondary}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = appliedTheme.borders.borderColor}
                onClick={() => fileInputRef.current?.click()}
              >
                <Volume2 style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  margin: '0 auto 1rem',
                  color: appliedTheme.colors.textSecondary
                }} />
                <p style={{ color: appliedTheme.colors.textSecondary }}>
                  Click to upload an audio file
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            <style>{`@media (min-width: 768px) { .audio-grid { grid-template-columns: repeat(2, 1fr); } }`}</style>
            <div className="audio-grid" style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1rem'
            }}>
              <Input
                placeholder="Audio title (optional)"
                value={
                  content.content.type === "audio"
                    ? content.content.title || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "audio",
                      url:
                        content.content.type === "audio"
                          ? content.content.url
                          : "",
                      title: e.target.value,
                      caption:
                        content.content.type === "audio"
                          ? content.content.caption || ""
                          : "",
                    },
                  })
                }
                theme={appliedTheme}
              />
              <Input
                placeholder="Audio caption (optional)"
                value={
                  content.content.type === "audio"
                    ? content.content.caption || ""
                    : ""
                }
                onChange={(e) =>
                  onUpdate({
                    ...content,
                    content: {
                      type: "audio",
                      url:
                        content.content.type === "audio"
                          ? content.content.url
                          : "",
                      title:
                        content.content.type === "audio"
                          ? content.content.title || ""
                          : "",
                      caption: e.target.value,
                    },
                  })
                }
                theme={appliedTheme}
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            Unsupported content type
          </div>
        );
    }
  };

  return (
    <Card theme={appliedTheme} style={{ marginBottom: '1rem' }}>
      <CardHeader theme={appliedTheme} style={{ paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GripVertical style={{ 
              width: '1rem', 
              height: '1rem', 
              cursor: 'move',
              color: appliedTheme.colors.textSecondary
            }} />
            {content.type === "text" && <Type style={{ width: '1rem', height: '1rem' }} />}
            {content.type === "image" && <Image style={{ width: '1rem', height: '1rem' }} />}
            {content.type === "video" && <Video style={{ width: '1rem', height: '1rem' }} />}
            {content.type === "audio" && <Volume2 style={{ width: '1rem', height: '1rem' }} />}
            <span style={{ 
              fontWeight: '500',
              textTransform: 'capitalize'
            }}>
              {content.type}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              style={{ 
                height: '1.5rem',
                width: '1.5rem',
                padding: 0
              }}
              theme={appliedTheme}
            >
              <ArrowUp style={{ width: '0.75rem', height: '0.75rem' }} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              style={{ 
                height: '1.5rem',
                width: '1.5rem',
                padding: 0
              }}
              theme={appliedTheme}
            >
              <ArrowDown style={{ width: '0.75rem', height: '0.75rem' }} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              style={{ 
                height: '1.5rem',
                width: '1.5rem',
                padding: 0,
                color: appliedTheme.colors.error || '#ef4444'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              theme={appliedTheme}
            >
              <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent theme={appliedTheme}>{renderEditor()}</CardContent>
    </Card>
  );
}

// Lesson Library Modal Component
interface LessonLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (lesson: Lesson, moduleIndex: number) => void;
  modules: Module[];
  theme?: typeof defaultTheme;
}

function LessonLibraryModal({
  isOpen,
  onClose,
  onSelectLesson,
  modules,
  theme,
}: LessonLibraryModalProps) {
  const appliedTheme = theme ?? defaultTheme;
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);

  // Sample lesson templates
  const lessonTemplates: Lesson[] = [
    {
      id: "template-1",
      title: "Introduction Template",
      description: "A template for course introductions",
      content: [
        {
          id: "content-1",
          type: "text",
          content: {
            type: "text",
            content:
              "<h2>Welcome!</h2><p>This is an introduction lesson template. Use this to welcome students to your course and set expectations.</p>",
          },
          order: 1,
        },
      ],
      duration: 10,
      order: 1,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-2",
      title: "Quiz Template",
      description: "A template for creating quizzes",
      content: [
        {
          id: "content-2",
          type: "text",
          content: {
            type: "text",
            content:
              "<h2>Knowledge Check</h2><p>Test your understanding with these questions:</p><ol><li>Question 1</li><li>Question 2</li><li>Question 3</li></ol>",
          },
          order: 1,
        },
      ],
      duration: 15,
      order: 2,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-3",
      title: "Summary Template",
      description: "A template for lesson summaries",
      content: [
        {
          id: "content-3",
          type: "text",
          content: {
            type: "text",
            content:
              "<h2>Key Takeaways</h2><p>Here are the main points from this lesson:</p><ul><li>Key point 1</li><li>Key point 2</li><li>Key point 3</li></ul><p><strong>Next:</strong> Continue to the next lesson.</p>",
          },
          order: 1,
        },
      ],
      duration: 5,
      order: 3,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-4",
      title: "Video Lesson Template",
      description: "A template for video-based lessons",
      content: [
        {
          id: "content-4",
          type: "text",
          content: {
            type: "text",
            content:
              "<h2>Video Lesson</h2><p>Watch the video below and take notes on the key concepts discussed.</p><p><em>Video will be embedded here</em></p><h3>Discussion Questions:</h3><ul><li>What was the main topic?</li><li>How does this relate to previous lessons?</li></ul>",
          },
          order: 1,
        },
      ],
      duration: 20,
      order: 4,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template-5",
      title: "Assignment Template",
      description: "A template for assignments and exercises",
      content: [
        {
          id: "content-5",
          type: "text",
          content: {
            type: "text",
            content:
              "<h2>Assignment</h2><h3>Objective:</h3><p>Complete the following task to practice what you've learned.</p><h3>Instructions:</h3><ol><li>Step 1</li><li>Step 2</li><li>Step 3</li></ol><h3>Deliverables:</h3><ul><li>Item 1</li><li>Item 2</li></ul><p><strong>Due Date:</strong> [Date]</p>",
          },
          order: 1,
        },
      ],
      duration: 30,
      order: 5,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const handleLibraryDragStart = (e: React.DragEvent, lesson: Lesson) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        ...lesson,
        sourceType: "library",
      }),
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleAddLesson = (lesson: Lesson) => {
    onSelectLesson(lesson, selectedModuleIndex);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        borderRadius: '0.5rem',
        maxWidth: '64rem',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        backgroundColor: appliedTheme.colors.surface,
        boxShadow: appliedTheme.elevation.shadowLarge || '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Library Content */}
        <div style={{ flex: 1, padding: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1.5rem' 
          }}>
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: appliedTheme.colors.textPrimary
              }}>
                <Library style={{ 
                  width: '1.25rem', 
                  height: '1.25rem',
                  color: appliedTheme.colors.accent || '#8b5cf6'
                }} />
                Lesson Library
              </h2>
              <p style={{ 
                fontSize: '0.875rem',
                color: appliedTheme.colors.textSecondary
              }}>
                Drag lessons to modules or click to add
              </p>
            </div>
            <Button variant="ghost" onClick={onClose} theme={appliedTheme}>
              <X style={{ width: '1rem', height: '1rem' }} />
            </Button>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxHeight: '24rem',
            overflowY: 'auto'
          }}>
            {lessonTemplates.map((lesson) => (
              <div
                key={lesson.id}
                draggable
                onDragStart={(e) => handleLibraryDragStart(e, lesson)}
                style={{ 
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  transition: 'all 0.2s',
                  cursor: 'move',
                  borderColor: appliedTheme.colors.accent + '33' || '#8b5cf633',
                  backgroundColor: appliedTheme.colors.accent + '11' || '#8b5cf611'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <GripVertical style={{ 
                    width: '1rem', 
                    height: '1rem', 
                    marginTop: '0.25rem',
                    flexShrink: 0,
                    color: appliedTheme.colors.accent + '88' || '#8b5cf688'
                  }} />
                  <div style={{
                    flex: 1,
                    minWidth: 0
                  }}>
                    <h3 style={{ 
                      fontWeight: '500',
                      color: appliedTheme.colors.accent || '#8b5cf6'
                    }}>
                      {lesson.title}
                    </h3>
                    <p style={{ 
                      fontSize: '0.875rem',
                      marginBottom: '0.5rem',
                      color: appliedTheme.colors.accent + 'aa' || '#8b5cf6aa'
                    }}>
                      {lesson.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.75rem',
                      color: appliedTheme.colors.accent + '88' || '#8b5cf688'
                    }}>
                      <span>{lesson.duration} minutes</span>
                      <span>{lesson.content.length} content blocks</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddLesson(lesson)}
                    style={{ 
                      backgroundColor: appliedTheme.colors.accent || '#8b5cf6',
                      color: 'white',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    theme={appliedTheme}
                  >
                    <Plus style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module Selector */}
        <div style={{ 
          width: '16rem',
          borderLeft: `1px solid ${appliedTheme.borders.borderColor}`,
          padding: '1rem',
          backgroundColor: appliedTheme.colors.backgroundAlt
        }}>
          <h3 style={{ 
            fontWeight: '500',
            marginBottom: '0.75rem',
            color: appliedTheme.colors.textPrimary
          }}>Add to Module:</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {modules.map((module, index) => (
              <button
                key={module.id}
                onClick={() => setSelectedModuleIndex(index)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  transition: 'all 0.2s',
                  ...(selectedModuleIndex === index ? {
                    backgroundColor: appliedTheme.colors.success + '22' || '#22c55e22',
                    borderColor: appliedTheme.colors.success + '66' || '#22c55e66',
                    color: appliedTheme.colors.success || '#22c55e'
                  } : {
                    backgroundColor: appliedTheme.colors.surface,
                    borderColor: appliedTheme.borders.borderColor,
                    color: appliedTheme.colors.textPrimary
                  })
                }}
                onMouseEnter={(e) => {
                  if (selectedModuleIndex !== index) {
                    e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedModuleIndex !== index) {
                    e.currentTarget.style.backgroundColor = appliedTheme.colors.surface;
                  }
                }}
              >
                <div style={{ 
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}>{module.title}</div>
                <div style={{ 
                  fontSize: '0.75rem',
                  color: appliedTheme.colors.textSecondary
                }}>
                  {module.lessons.length} lessons
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Drag and drop types
type DragItem = {
  type: "module" | "lesson";
  id: string;
  moduleIndex?: number;
  lessonIndex?: number;
};

export function CourseEditor({
  courseId,
  onBack,
  onViewMode,
  onSave,
  onCancel,
  course,
  onUpdateCourse,
  loadCourse,
  theme,
}: CourseEditorProps) {
  
  console.log('CourseEditor: Component rendered with:', { courseId, hasCourse: !!course });
  
  // Apply theme
  const appliedTheme = theme ?? defaultTheme;
  
  // Use the passed course as currentCourse
  const currentCourse = course;
  
  // Track function identity
  const loadCourseRef = useRef(loadCourse);
  useEffect(() => {
    if (loadCourseRef.current !== loadCourse) {
      console.log('CourseEditor: loadCourse function reference changed');
      loadCourseRef.current = loadCourse;
    }
  });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showLessonLibrary, setShowLessonLibrary] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<{
    moduleIndex?: number;
    lessonIndex?: number;
  } | null>(null);
  const hasInitializedLesson = useRef(false);

  // Helper function to update course and mark as changed
  const updateEditingCourse = (updatedCourse: Course | null) => {
    setEditingCourse(updatedCourse);
    if (updatedCourse) {
      setHasUnsavedChanges(true);
    }
  };

  useEffect(() => {
    // Only load if we don't already have this course loaded and loadCourse is available
    if (loadCourse && (!currentCourse || currentCourse.id !== courseId)) {
      console.log('CourseEditor: Loading course because current course is different');
      loadCourse(courseId);
    } else {
      console.log('CourseEditor: Skipping load - course already loaded or loadCourse not available');
    }
  }, [courseId, loadCourse, currentCourse]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedLesson intentionally excluded
  useEffect(() => {
    if (currentCourse) {
      setEditingCourse({ ...currentCourse });
      setHasUnsavedChanges(false); // Reset unsaved changes flag when loading

      // Only reset editing mode when the course actually changes (not when selectedLesson changes)
      if (!hasInitializedLesson.current) {
        setIsEditingContent(false);
      }

      // Auto-select first lesson if none is selected
      if (!selectedLesson) {
        // Find first available lesson
        for (
          let moduleIdx = 0;
          moduleIdx < currentCourse.modules.length;
          moduleIdx++
        ) {
          const module = currentCourse.modules[moduleIdx];
          if (module.lessons.length > 0) {
            setSelectedLesson(module.lessons[0]);
            setCurrentModuleIndex(moduleIdx);
            setCurrentLessonIndex(0);
            break;
          }
        }

        hasInitializedLesson.current = true;
      }
    }
    // Note: selectedLesson is intentionally not in deps to avoid re-running when lesson selection changes
  }, [currentCourse]);

  const handleSave = async () => {
    if (!editingCourse) return;
    try {
      setIsSaving(true);
      await onUpdateCourse(courseId, editingCourse);
      setHasUnsavedChanges(false); // Reset unsaved changes flag after successful save
    } catch (error) {
      console.error("Failed to save course:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectLesson = (
    lesson: Lesson,
    moduleIndex: number,
    lessonIndex: number,
  ) => {
    setSelectedLesson(lesson);
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
    setIsEditingContent(false);
  };

  const addModule = () => {
    if (!editingCourse) return;
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: "New Module",
      description: "",
      lessons: [],
      order: editingCourse.modules.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    updateEditingCourse({
      ...editingCourse,
      modules: [...editingCourse.modules, newModule],
    });
  };

  const updateModuleName = (moduleIndex: number, newName: string) => {
    if (!editingCourse) return;

    const updatedModules = [...editingCourse.modules];
    updatedModules[moduleIndex].title = newName;

    updateEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });
  };

  const deleteModule = (moduleIndex: number) => {
    if (!editingCourse) return;

    if (
      confirm(
        `Are you sure you want to delete "${editingCourse.modules[moduleIndex].title}" and all its lessons?`,
      )
    ) {
      const updatedModules = editingCourse.modules.filter(
        (_, index) => index !== moduleIndex,
      );

      // Update orders
      const reorderedModules = updatedModules.map((module, index) => ({
        ...module,
        order: index + 1,
      }));

      updateEditingCourse({
        ...editingCourse,
        modules: reorderedModules,
      });

      // Reset selection if the selected lesson was in the deleted module
      if (currentModuleIndex === moduleIndex) {
        setSelectedLesson(null);
        setCurrentModuleIndex(0);
        setCurrentLessonIndex(0);
      } else if (currentModuleIndex > moduleIndex) {
        setCurrentModuleIndex(currentModuleIndex - 1);
      }
    }
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    if (!editingCourse) return;

    const lesson = editingCourse.modules[moduleIndex].lessons[lessonIndex];
    if (confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      const updatedModules = [...editingCourse.modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        lessons: updatedModules[moduleIndex].lessons.filter(
          (_, index) => index !== lessonIndex,
        ),
      };

      // Update lesson orders
      updatedModules[moduleIndex].lessons = updatedModules[
        moduleIndex
      ].lessons.map((lesson, index) => ({
        ...lesson,
        order: index + 1,
      }));

      updateEditingCourse({
        ...editingCourse,
        modules: updatedModules,
      });

      // Reset selection if the deleted lesson was selected
      if (
        currentModuleIndex === moduleIndex &&
        currentLessonIndex === lessonIndex
      ) {
        // Try to select another lesson in the same module
        if (updatedModules[moduleIndex].lessons.length > 0) {
          const newLessonIndex = Math.min(
            lessonIndex,
            updatedModules[moduleIndex].lessons.length - 1,
          );
          setSelectedLesson(
            updatedModules[moduleIndex].lessons[newLessonIndex],
          );
          setCurrentLessonIndex(newLessonIndex);
        } else {
          // No lessons left in this module, find first lesson in any module
          let newLesson = null;
          let newModuleIndex = 0;
          let newLessonIndex = 0;

          for (let i = 0; i < updatedModules.length; i++) {
            if (updatedModules[i].lessons.length > 0) {
              newLesson = updatedModules[i].lessons[0];
              newModuleIndex = i;
              newLessonIndex = 0;
              break;
            }
          }

          setSelectedLesson(newLesson);
          setCurrentModuleIndex(newModuleIndex);
          setCurrentLessonIndex(newLessonIndex);
        }
      } else if (
        currentModuleIndex === moduleIndex &&
        currentLessonIndex > lessonIndex
      ) {
        // Adjust the current lesson index if a lesson before it was deleted
        setCurrentLessonIndex(currentLessonIndex - 1);
      }
    }
  };

  const addLesson = (moduleIndex: number, lessonData?: Lesson) => {
    if (!editingCourse) return;
    const newLesson: Lesson = lessonData
      ? {
          ...lessonData,
          id: `lesson-${Date.now()}`,
          order: editingCourse.modules[moduleIndex].lessons.length + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      : {
          id: `lesson-${Date.now()}`,
          title: "New Lesson",
          description: "",
          content: [],
          duration: 15,
          order: editingCourse.modules[moduleIndex].lessons.length + 1,
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

    const updatedModules = [...editingCourse.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: [...updatedModules[moduleIndex].lessons, newLesson],
    };

    updateEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });
  };

  const updateLessonName = (
    moduleIndex: number,
    lessonIndex: number,
    newName: string,
  ) => {
    if (!editingCourse) return;

    const updatedModules = [...editingCourse.modules];
    updatedModules[moduleIndex].lessons[lessonIndex].title = newName;

    updateEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });

    // Update selected lesson if it's the one being edited
    if (
      selectedLesson &&
      selectedLesson.id === updatedModules[moduleIndex].lessons[lessonIndex].id
    ) {
      setSelectedLesson(updatedModules[moduleIndex].lessons[lessonIndex]);
    }
  };

  const calculateProgress = () => {
    if (!editingCourse) return 0;
    const totalLessons = editingCourse.modules.reduce(
      (total, module) => total + module.lessons.length,
      0,
    );
    const completedLessons = editingCourse.modules.reduce(
      (total, module) =>
        total + module.lessons.filter((lesson) => lesson.isCompleted).length,
      0,
    );
    return totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;
  };

  const addContentBlock = (type: "text" | "image" | "video" | "audio") => {
    if (!selectedLesson || !editingCourse) return;

    const newBlock: ContentBlock = {
      id: `content-${Date.now()}`,
      type,
      content:
        type === "text"
          ? { type: "text", content: "" }
          : { type, url: "", title: "", caption: "" },
      order: selectedLesson.content.length + 1,
    };

    const updatedLesson: Lesson = {
      ...selectedLesson,
      content: [...selectedLesson.content, newBlock],
      updatedAt: new Date(),
    };

    updateLessonInCourse(updatedLesson);
  };

  const updateContentBlock = (blockId: string, updatedBlock: ContentBlock) => {
    if (!selectedLesson) return;

    const updatedLesson: Lesson = {
      ...selectedLesson,
      content: selectedLesson.content.map((block) =>
        block.id === blockId ? updatedBlock : block,
      ),
      updatedAt: new Date(),
    };

    updateLessonInCourse(updatedLesson);
  };

  const deleteContentBlock = (blockId: string) => {
    if (!selectedLesson) return;

    const updatedLesson: Lesson = {
      ...selectedLesson,
      content: selectedLesson.content.filter((block) => block.id !== blockId),
      updatedAt: new Date(),
    };

    updateLessonInCourse(updatedLesson);
  };

  const moveContentBlock = (blockId: string, direction: "up" | "down") => {
    if (!selectedLesson) return;

    const currentIndex = selectedLesson.content.findIndex(
      (block) => block.id === blockId,
    );
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= selectedLesson.content.length) return;

    const reorderedContent = [...selectedLesson.content];
    const [movedBlock] = reorderedContent.splice(currentIndex, 1);
    reorderedContent.splice(newIndex, 0, movedBlock);

    const updatedContent = reorderedContent.map((block, index) => ({
      ...block,
      order: index + 1,
    }));

    const updatedLesson: Lesson = {
      ...selectedLesson,
      content: updatedContent,
      updatedAt: new Date(),
    };

    updateLessonInCourse(updatedLesson);
  };

  // Enhanced content block drag and drop
  const handleContentBlockDragStart = (
    e: React.DragEvent,
    blockId: string,
    blockIndex: number,
  ) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: "content-block",
        blockId,
        blockIndex,
      }),
    );
    e.dataTransfer.effectAllowed = "move";
    (e.target as HTMLElement).style.opacity = "0.5";
  };

  const handleContentBlockDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
  };

  const handleContentBlockDragOver = (
    e: React.DragEvent,
    _targetIndex: number,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleContentBlockDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));

      if (dragData.type === "content-block" && selectedLesson) {
        const { blockIndex } = dragData;

        if (blockIndex === targetIndex) return;

        const reorderedContent = [...selectedLesson.content];
        const [movedBlock] = reorderedContent.splice(blockIndex, 1);
        reorderedContent.splice(targetIndex, 0, movedBlock);

        const updatedContent = reorderedContent.map((block, index) => ({
          ...block,
          order: index + 1,
        }));

        const updatedLesson: Lesson = {
          ...selectedLesson,
          content: updatedContent,
          updatedAt: new Date(),
        };

        updateLessonInCourse(updatedLesson);
      }
    } catch (error) {
      console.error("Error handling content block drop:", error);
    }
  };

  const updateLessonInCourse = (updatedLesson: Lesson) => {
    if (!editingCourse) return;

    const updatedModules = editingCourse.modules.map((module, moduleIndex) => {
      if (moduleIndex === currentModuleIndex) {
        return {
          ...module,
          lessons: module.lessons.map((lesson, lessonIndex) =>
            lessonIndex === currentLessonIndex ? updatedLesson : lesson,
          ),
          updatedAt: new Date(),
        };
      }
      return module;
    });

    const updatedCourse = {
      ...editingCourse,
      modules: updatedModules,
      updatedAt: new Date(),
    };

    updateEditingCourse(updatedCourse);
    setSelectedLesson(updatedLesson);
  };

  // Enhanced drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    type: "module" | "lesson",
    moduleIndex: number,
    lessonIndex?: number,
  ) => {
    if (!editingCourse) return;

    const dragData: DragItem = {
      type,
      id:
        type === "module"
          ? editingCourse.modules[moduleIndex].id
          : lessonIndex !== undefined
            ? editingCourse.modules[moduleIndex].lessons[lessonIndex].id
            : "",
      moduleIndex,
      lessonIndex,
    };

    setDraggedItem(dragData);
    e.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";

    // Add visual feedback
    (e.target as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (
    e: React.DragEvent,
    moduleIndex: number,
    lessonIndex?: number,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex({ moduleIndex, lessonIndex });
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetModuleIndex: number,
    targetLessonIndex?: number,
  ) => {
    e.preventDefault();
    setDragOverIndex(null);

    try {
      // First try to get data from lesson library
      const libraryData = e.dataTransfer.getData("application/json");
      if (libraryData) {
        const parsedData = JSON.parse(libraryData);
        if (parsedData.sourceType === "library") {
          addLesson(targetModuleIndex, parsedData);
          return;
        }
      }

      // Handle internal drag and drop
      const internalData = e.dataTransfer.getData("text/plain");
      if (internalData && draggedItem) {
        const dragData = JSON.parse(internalData);

        if (
          dragData.type === "lesson" &&
          draggedItem.moduleIndex !== undefined &&
          draggedItem.lessonIndex !== undefined
        ) {
          moveLesson(
            draggedItem.moduleIndex,
            draggedItem.lessonIndex,
            targetModuleIndex,
            targetLessonIndex,
          );
        } else if (
          dragData.type === "module" &&
          draggedItem.moduleIndex !== undefined
        ) {
          moveModule(draggedItem.moduleIndex, targetModuleIndex);
        }
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }

    setDraggedItem(null);
  };

  const moveLesson = (
    fromModuleIndex: number,
    fromLessonIndex: number,
    toModuleIndex: number,
    toLessonIndex?: number,
  ) => {
    if (!editingCourse) return;

    const updatedModules = [...editingCourse.modules];
    const lessonToMove =
      updatedModules[fromModuleIndex].lessons[fromLessonIndex];

    // Remove from source
    updatedModules[fromModuleIndex].lessons.splice(fromLessonIndex, 1);

    // Add to target
    const targetIndex =
      toLessonIndex !== undefined
        ? toLessonIndex
        : updatedModules[toModuleIndex].lessons.length;
    updatedModules[toModuleIndex].lessons.splice(targetIndex, 0, lessonToMove);

    // Update orders for both affected modules
    updatedModules[fromModuleIndex].lessons.forEach((lesson, index) => {
      lesson.order = index + 1;
    });
    updatedModules[toModuleIndex].lessons.forEach((lesson, index) => {
      lesson.order = index + 1;
    });

    updateEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });
  };

  const moveModule = (fromIndex: number, toIndex: number) => {
    if (!editingCourse || fromIndex === toIndex) return;

    const updatedModules = [...editingCourse.modules];
    const moduleToMove = updatedModules[fromIndex];

    // Remove from source
    updatedModules.splice(fromIndex, 1);

    // Add to target
    updatedModules.splice(toIndex, 0, moduleToMove);

    // Update orders
    updatedModules.forEach((module, index) => {
      module.order = index + 1;
    });

    updateEditingCourse({
      ...editingCourse,
      modules: updatedModules,
    });
  };

  const renderContent = (content: ContentBlock, isEditing = false) => {
    if (isEditing && content.type === "text") {
      return (
        <RichTextEditor
          value={content.content.type === "text" ? content.content.content : ""}
          onChange={(newContent) => {
            updateContentBlock(content.id, {
              ...content,
              content: { type: "text", content: newContent },
            });
          }}
          placeholder="Enter your content here..."
        />
      );
    }

    // Render content exactly like CourseViewer for view mode
    switch (content.type) {
      case "text":
        if (content.content.type === "text") {
          return (
            <div
              className="prose max-w-none"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from trusted course data
              dangerouslySetInnerHTML={{ __html: content.content.content }}
            />
          );
        }
        break;
      case "image":
        if (content.content.type === "image") {
          return (
            <div style={{ margin: '1rem 0' }}>
              <img
                src={content.content.url}
                alt={content.content.title || "Course image"}
                style={{ 
                  width: '100%',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}
              />
              {content.content.caption && (
                <p style={{ 
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                  fontStyle: 'italic',
                  color: appliedTheme.colors.textSecondary
                }}>
                  {content.content.caption}
                </p>
              )}
            </div>
          );
        }
        break;
      case "video":
        if (content.content.type === "video") {
          return (
            <div style={{ margin: '1rem 0' }}>
              <video
                controls
                style={{ 
                  width: '100%',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}
                src={content.content.url}
              >
                <track kind="captions" label="English" srcLang="en" />
                Your browser does not support the video tag.
              </video>
              {content.content.caption && (
                <p style={{ 
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                  fontStyle: 'italic',
                  color: appliedTheme.colors.textSecondary
                }}>
                  {content.content.caption}
                </p>
              )}
            </div>
          );
        }
        break;
      case "audio":
        if (content.content.type === "audio") {
          return (
            <div style={{ margin: '1rem 0' }}>
              <audio
                controls
                style={{ width: '100%' }}
                src={content.content.url}
              >
                <track kind="captions" label="English" srcLang="en" />
                Your browser does not support the audio tag.
              </audio>
              {content.content.caption && (
                <p style={{ 
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                  fontStyle: 'italic',
                  color: appliedTheme.colors.textSecondary
                }}>
                  {content.content.caption}
                </p>
              )}
            </div>
          );
        }
        break;
      default:
        return <div>Unsupported content type</div>;
    }
    return <div>Invalid content configuration</div>;
  };

  if (!editingCourse) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: appliedTheme.colors.backgroundAlt 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: 'transparent',
            borderBottomColor: appliedTheme.colors.secondary || '#3b82f6',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: appliedTheme.colors.textPrimary }}>Loading...</p>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: appliedTheme.colors.backgroundAlt }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: appliedTheme.colors.surface, 
        borderBottom: `1px solid ${appliedTheme.borders.borderColor}` 
      }}>
        <div style={{ 
          maxWidth: '80rem', 
          margin: '0 auto', 
          padding: '1rem'
        }} className="course-editor-header-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={onBack || onCancel} theme={appliedTheme}>
              <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Back to Courses
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLessonLibrary(true)}
                theme={appliedTheme}
              >
                <Library style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Lesson Library
              </Button>
              <Button variant="outline" size="sm" onClick={onViewMode} theme={appliedTheme}>
                <Eye style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                View
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} theme={appliedTheme}>
                <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Badge 
                variant="default"
                theme={appliedTheme}
              >
                Edit Mode
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '80rem', 
        margin: '0 auto', 
        padding: '2rem 1rem'
      }} className="course-editor-main-container">
        <div className="course-editor-main-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr', 
          gap: '2rem'
        }}>
          <style>{`
            @media (min-width: 640px) {
              .course-editor-header-container {
                padding: 1rem 1.5rem !important;
              }
              .course-editor-main-container {
                padding: 2rem 1.5rem !important;
              }
            }
            @media (min-width: 1024px) { 
              .course-editor-header-container {
                padding: 1rem 2rem !important;
              }
              .course-editor-main-container {
                padding: 2rem 2rem !important;
              }
              .course-editor-main-grid { 
                grid-template-columns: 1fr 2fr !important; 
              } 
            }
          `}</style>
          {/* Sidebar Navigation */}
          <div>
            <Card theme={appliedTheme}>
              <CardHeader theme={appliedTheme}>
                <CardTitle theme={appliedTheme} style={{ fontSize: '1.125rem' }}>
                  {editingCourse?.title || 'Course'}
                </CardTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '0.875rem' 
                  }}>
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} theme={appliedTheme} style={{ width: '100%' }} />
                </div>
              </CardHeader>
              <CardContent theme={appliedTheme} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Course Modules */}
                {editingCourse?.modules?.map((module, moduleIndex) => {
                  if (!module) return null;
                  return (
                  <div
                    key={module.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      ...(dragOverIndex?.moduleIndex === moduleIndex &&
                      dragOverIndex?.lessonIndex === undefined ? {
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        backgroundColor: `${appliedTheme.colors.primary || '#22c55e'}11`,
                        borderColor: `${appliedTheme.colors.primary || '#22c55e'}66`
                      } : {})
                    }}
                    onDragOver={(e) => handleDragOver(e, moduleIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, moduleIndex)}
                  >
                    <div
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        cursor: 'move' 
                      }}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, "module", moduleIndex)
                      }
                      onDragEnd={handleDragEnd}
                    >
                      <h4 style={{ 
                        fontWeight: '500', 
                        fontSize: '0.875rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem' 
                      }}>
                        <GripVertical style={{ width: '0.75rem', height: '0.75rem', color: appliedTheme.colors.textSecondary }} />
                        <BookOpen style={{ width: '1rem', height: '1rem' }} />
                        <EditableText
                          value={module.title}
                          onChange={(newName) =>
                            updateModuleName(moduleIndex, newName)
                          }
                          placeholder="Module Title"
                        />
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addLesson(moduleIndex)}
                          style={{ 
                            height: '1.5rem', 
                            width: '1.5rem', 
                            padding: 0 
                          }}
                          title="Add lesson"
                          theme={appliedTheme}
                        >
                          <Plus style={{ width: '0.75rem', height: '0.75rem' }} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteModule(moduleIndex)}
                          style={{ 
                            height: '1.5rem', 
                            width: '1.5rem', 
                            padding: 0,
                            color: appliedTheme.colors.error || '#ef4444'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          title="Delete module"
                          theme={appliedTheme}
                        >
                          <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
                        </Button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginLeft: '1.5rem' }}>
                      {module.lessons?.map((lesson, lessonIndex) => {
                        if (!lesson) return null;
                        return (
                          <div
                            key={lesson.id}
                            className="lesson-item"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s',
                              cursor: 'move',
                              ...(selectedLesson?.id === lesson.id ? {
                                backgroundColor: `${appliedTheme.colors.primary || '#22c55e'}11`,
                                borderLeft: `2px solid ${appliedTheme.colors.primary || '#22c55e'}`
                              } : {}),
                              ...(dragOverIndex?.moduleIndex === moduleIndex &&
                              dragOverIndex?.lessonIndex === lessonIndex ? {
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                backgroundColor: `${appliedTheme.colors.primary || '#22c55e'}22`,
                                borderColor: `${appliedTheme.colors.primary || '#22c55e'}66`
                              } : {})
                            }}
                            onMouseEnter={(e) => {
                              if (selectedLesson?.id !== lesson.id) {
                                e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedLesson?.id !== lesson.id) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                            draggable
                            onDragStart={(e) =>
                              handleDragStart(
                                e,
                                "lesson",
                                moduleIndex,
                                lessonIndex,
                              )
                            }
                            onDragEnd={handleDragEnd}
                            onClick={() =>
                              selectLesson(lesson, moduleIndex, lessonIndex)
                            }
                            onDragOver={(e) =>
                              handleDragOver(e, moduleIndex, lessonIndex)
                            }
                            onDragLeave={handleDragLeave}
                            onDrop={(e) =>
                              handleDrop(e, moduleIndex, lessonIndex)
                            }
                          >
                            <GripVertical 
                              style={{ 
                                width: '0.75rem', 
                                height: '0.75rem', 
                                opacity: 0,
                                color: appliedTheme.colors.textSecondary,
                                transition: 'opacity 0.2s'
                              }} 
                              className="lesson-grip"
                            />
                            <Edit 
                              style={{ 
                                width: '0.75rem', 
                                height: '0.75rem', 
                                flexShrink: 0,
                                color: appliedTheme.colors.secondary || '#2563eb'
                              }} 
                            />
                            <EditableText
                              value={lesson.title}
                              onChange={(newName) =>
                                updateLessonName(
                                  moduleIndex,
                                  lessonIndex,
                                  newName,
                                )
                              }
                              placeholder="Lesson Title"
                              style={{ flex: 1 }}
                            />
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.25rem',
                              color: appliedTheme.colors.textSecondary,
                              marginLeft: 'auto'
                            }}>
                              <FileText style={{ width: '0.75rem', height: '0.75rem' }} />
                              <span style={{ fontSize: '0.75rem' }}>
                                {lesson.content?.length || 0}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="lesson-delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteLesson(moduleIndex, lessonIndex);
                                }}
                                style={{ 
                                  height: '1rem', 
                                  width: '1rem', 
                                  padding: 0,
                                  opacity: 0,
                                  color: appliedTheme.colors.error || '#ef4444',
                                  transition: 'opacity 0.2s'
                                }}
                                title="Delete lesson"
                                theme={appliedTheme}
                              >
                                <Trash2 style={{ width: '0.5rem', height: '0.5rem' }} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  );
                })}

                {/* Add Module Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addModule}
                  style={{ width: '100%' }}
                  theme={appliedTheme}
                >
                  <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Add Module
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div>
            {selectedLesson ? (
              <Card theme={appliedTheme}>
                <CardHeader theme={appliedTheme}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <CardTitle theme={appliedTheme} style={{ fontSize: '1.25rem' }}>
                        {selectedLesson.title}
                      </CardTitle>
                      <p style={{ 
                        marginTop: '0.25rem',
                        color: appliedTheme.colors.textSecondary
                      }}>
                        {selectedLesson.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingContent(!isEditingContent)}
                        theme={appliedTheme}
                      >
                        <Edit style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                        {isEditingContent ? "View" : "Edit"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent theme={appliedTheme} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedLesson.content.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {isEditingContent
                        ? // Edit mode with full content block editors
                          selectedLesson.content
                            .sort((a, b) => a.order - b.order)
                            .map((content, index) => (
                              <div
                                key={content.id}
                                draggable
                                onDragStart={(e) =>
                                  handleContentBlockDragStart(
                                    e,
                                    content.id,
                                    index,
                                  )
                                }
                                onDragEnd={handleContentBlockDragEnd}
                                onDragOver={(e) =>
                                  handleContentBlockDragOver(e, index)
                                }
                                onDrop={(e) => handleContentBlockDrop(e, index)}
                                style={{ transition: 'opacity 0.2s' }}
                              >
                                <ContentBlockEditor
                                  content={content}
                                  onUpdate={(updatedContent) =>
                                    updateContentBlock(
                                      content.id,
                                      updatedContent,
                                    )
                                  }
                                  onDelete={() =>
                                    deleteContentBlock(content.id)
                                  }
                                  onMoveUp={() =>
                                    moveContentBlock(content.id, "up")
                                  }
                                  onMoveDown={() =>
                                    moveContentBlock(content.id, "down")
                                  }
                                  canMoveUp={index > 0}
                                  canMoveDown={
                                    index < selectedLesson.content.length - 1
                                  }
                                  theme={appliedTheme}
                                />
                              </div>
                            ))
                        : // View mode with clean rendering - only show content with actual data
                          selectedLesson.content
                            .sort((a, b) => a.order - b.order)
                            .filter((content) => {
                              // Filter out empty content blocks in view mode
                              if (content.type === 'text') {
                                return content.content.type === 'text' && content.content.content.trim() !== '';
                              }
                              // For media types, only show if URL exists
                              return content.content.type !== 'text' && content.content.url;
                            })
                            .map((content) => (
                              <div key={content.id}>
                                {renderContent(content, false)}
                              </div>
                            ))}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem 0',
                      color: appliedTheme.colors.textSecondary
                    }}>
                      <FileText style={{ 
                        width: '3rem', 
                        height: '3rem', 
                        margin: '0 auto 0.75rem',
                        color: appliedTheme.colors.textSecondary
                      }} />
                      <p>No content in this lesson yet.</p>
                      <p style={{ fontSize: '0.875rem' }}>
                        Add some content blocks to get started.
                      </p>
                    </div>
                  )}

                  {/* Add Content Controls */}
                  {isEditingContent && (
                    <div style={{ 
                      borderWidth: '2px',
                      borderStyle: 'dashed',
                      borderColor: appliedTheme.borders.borderColor,
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      marginTop: '1.5rem'
                    }}>
                      <h3 style={{ 
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        marginBottom: '0.75rem',
                        textAlign: 'center'
                      }}>
                        Add Content
                      </h3>
                      <style>{`@media (min-width: 768px) { .content-grid-md-4 { grid-template-columns: repeat(4, 1fr); } }`}</style>
                      <div className="content-grid-md-4" style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.75rem'
                      }}>
                        <Button
                          variant="outline"
                          onClick={() => addContentBlock("text")}
                          style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            height: '4rem',
                            fontSize: '0.75rem'
                          }}
                          theme={appliedTheme}
                        >
                          <Type style={{ 
                            width: '1.25rem', 
                            height: '1.25rem',
                            color: appliedTheme.colors.secondary || '#2563eb'
                          }} />
                          Text
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addContentBlock("image")}
                          style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            height: '4rem',
                            fontSize: '0.75rem'
                          }}
                          theme={appliedTheme}
                        >
                          <Image style={{ 
                            width: '1.25rem', 
                            height: '1.25rem',
                            color: appliedTheme.colors.success || '#22c55e'
                          }} />
                          Image
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addContentBlock("video")}
                          style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            height: '4rem',
                            fontSize: '0.75rem'
                          }}
                          theme={appliedTheme}
                        >
                          <Video style={{ 
                            width: '1.25rem', 
                            height: '1.25rem',
                            color: appliedTheme.colors.error || '#ef4444'
                          }} />
                          Video
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => addContentBlock("audio")}
                          style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            height: '4rem',
                            fontSize: '0.75rem'
                          }}
                          theme={appliedTheme}
                        >
                          <Volume2 style={{ 
                            width: '1.25rem', 
                            height: '1.25rem',
                            color: appliedTheme.colors.accent || '#8b5cf6'
                          }} />
                          Audio
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card theme={appliedTheme}>
                <CardContent theme={appliedTheme} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '16rem' 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <Edit style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      margin: '0 auto 1rem',
                      color: appliedTheme.colors.textSecondary
                    }} />
                    <h3 style={{ 
                      fontSize: '1.125rem',
                      fontWeight: '500',
                      marginBottom: '0.5rem'
                    }}>
                      Select a Lesson
                    </h3>
                    <p style={{ color: appliedTheme.colors.textSecondary }}>
                      Choose a lesson from the sidebar to start editing
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Library Modal */}
      {editingCourse && (
        <LessonLibraryModal
          isOpen={showLessonLibrary}
          onClose={() => setShowLessonLibrary(false)}
          onSelectLesson={(lesson, moduleIndex) => {
            addLesson(moduleIndex, lesson);
            setShowLessonLibrary(false);
          }}
          modules={editingCourse.modules || []}
          theme={appliedTheme}
        />
      )}
    </div>
  );
}