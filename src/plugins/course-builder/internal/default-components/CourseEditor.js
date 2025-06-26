import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowLeft, ArrowUp, Bold, BookOpen, Check, Edit, Eye, FileText, GripVertical, Image, Italic, Library, List, ListOrdered, Plus, Save, Trash2, Type, Underline, Upload, Video, Volume2, X, } from "lucide-react";
import { useEffect, useRef, useState } from "react";
// Import theme utilities to ensure CSS variables are set
import "../../theme-utils";
import './course-editor.css';
import { defaultTheme } from '@/core/theme/default-theme';
// Fixed Rich Text Editor Component
function RichTextEditor({ value, onChange, placeholder, className, theme, }) {
    const appliedTheme = theme ?? defaultTheme;
    const editorRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const isUpdatingRef = useRef(false);
    const handleCommand = (command, commandValue) => {
        if (!editorRef.current)
            return;
        // Save current selection
        const selection = window.getSelection();
        let range = null;
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
            }
            catch (e) {
                // Ignore range errors
            }
        }
    };
    const handleInput = (e) => {
        if (isUpdatingRef.current)
            return;
        const target = e.target;
        const newContent = target.innerHTML;
        onChange(newContent);
    };
    const handlePaste = (e) => {
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
    return (_jsxs("div", { style: {
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            borderRadius: '0.5rem',
            ...(isFocused ? {
                outline: `2px solid ${appliedTheme.colors.primary || '#22c55e'}`,
                outlineOffset: '2px'
            } : {}),
            ...className
        }, children: [_jsxs("div", { style: {
                    borderBottom: `1px solid ${appliedTheme.borders.borderColor}`,
                    padding: '0.75rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.25rem',
                    backgroundColor: appliedTheme.colors.backgroundAlt
                }, children: [_jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => handleCommand("bold"), style: {
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }, onMouseEnter: (e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt, onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent', title: "Bold", children: _jsx(Bold, { style: { width: '1rem', height: '1rem' } }) }), _jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => handleCommand("italic"), style: {
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }, onMouseEnter: (e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt, onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent', title: "Italic", children: _jsx(Italic, { style: { width: '1rem', height: '1rem' } }) }), _jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => handleCommand("underline"), style: {
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }, onMouseEnter: (e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt, onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent', title: "Underline", children: _jsx(Underline, { style: { width: '1rem', height: '1rem' } }) }), _jsx("div", { style: {
                            width: '1px',
                            margin: '0 0.25rem',
                            backgroundColor: appliedTheme.borders.borderColor
                        } }), _jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => handleCommand("insertUnorderedList"), style: {
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }, onMouseEnter: (e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt, onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent', title: "Bullet List", children: _jsx(List, { style: { width: '1rem', height: '1rem' } }) }), _jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => handleCommand("insertOrderedList"), style: {
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }, onMouseEnter: (e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt, onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent', title: "Numbered List", children: _jsx(ListOrdered, { style: { width: '1rem', height: '1rem' } }) }), _jsx("div", { style: {
                            width: '1px',
                            margin: '0 0.25rem',
                            backgroundColor: appliedTheme.borders.borderColor
                        } }), _jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => handleCommand("justifyLeft"), style: {
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }, onMouseEnter: (e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt, onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent', title: "Align Left", children: _jsx(AlignLeft, { style: { width: '1rem', height: '1rem' } }) }), _jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => handleCommand("justifyCenter"), style: {
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }, onMouseEnter: (e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt, onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent', title: "Align Center", children: _jsx(AlignCenter, { style: { width: '1rem', height: '1rem' } }) }), _jsx("button", { type: "button", onMouseDown: (e) => e.preventDefault(), onClick: () => handleCommand("justifyRight"), style: {
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }, onMouseEnter: (e) => e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt, onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent', title: "Align Right", children: _jsx(AlignRight, { style: { width: '1rem', height: '1rem' } }) }), _jsx("div", { style: {
                            width: '1px',
                            margin: '0 0.25rem',
                            backgroundColor: appliedTheme.borders.borderColor
                        } }), _jsxs("select", { onMouseDown: (e) => e.preventDefault(), onChange: (e) => {
                            handleCommand("formatBlock", e.target.value);
                            e.target.value = "";
                        }, style: {
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.875rem',
                            borderRadius: '0.375rem',
                            border: `1px solid ${appliedTheme.borders.borderColor}`,
                            backgroundColor: appliedTheme.colors.surface,
                            color: appliedTheme.colors.textPrimary
                        }, value: "", children: [_jsx("option", { value: "", children: "Format" }), _jsx("option", { value: "h1", children: "Heading 1" }), _jsx("option", { value: "h2", children: "Heading 2" }), _jsx("option", { value: "h3", children: "Heading 3" }), _jsx("option", { value: "p", children: "Paragraph" })] })] }), _jsx("div", { ref: editorRef, contentEditable: true, onInput: handleInput, onFocus: () => setIsFocused(true), onBlur: () => setIsFocused(false), onPaste: handlePaste, "data-placeholder": placeholder, suppressContentEditableWarning: true, style: {
                    padding: '1rem',
                    minHeight: '12.5rem',
                    outline: 'none',
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    maxWidth: 'none',
                    lineHeight: '1.75',
                    color: appliedTheme.colors.textPrimary
                } }), _jsx("style", { children: `
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${appliedTheme.colors.textSecondary};
          pointer-events: none;
          font-style: italic;
        }
      ` })] }));
}
function EditableText({ value, onChange, className, placeholder = "Untitled", }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [hasChanged, setHasChanged] = useState(false);
    const inputRef = useRef(null);
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
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
        else if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
        }
    };
    const handleDoubleClick = () => {
        setIsEditing(true);
        setEditValue(value);
        setHasChanged(false);
    };
    const handleInputChange = (e) => {
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
        return (_jsxs("div", { className: "flex items-center gap-1 flex-1", children: [_jsx(Input, { ref: inputRef, value: editValue, onChange: handleInputChange, onKeyDown: handleKeyDown, onBlur: handleBlur, className: "h-6 text-sm" }), hasChanged && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: handleSave, className: "h-6 w-6 p-0", children: _jsx(Check, { className: "h-3 w-3", style: { color: 'var(--course-builder-success, #22c55e)' } }) }), _jsx(Button, { size: "sm", variant: "ghost", onClick: handleCancel, className: "h-6 w-6 p-0", children: _jsx(X, { className: "h-3 w-3", style: { color: 'var(--course-builder-error, #ef4444)' } }) })] }))] }));
    }
    return (_jsx("span", { className: `flex-1 truncate cursor-pointer px-1 py-0.5 rounded ${className}`, onMouseEnter: (e) => e.currentTarget.style.backgroundColor = 'var(--course-builder-bg-muted)', onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent', onDoubleClick: handleDoubleClick, title: "Double-click to edit", children: value }));
}
function ContentBlockEditor({ content, onUpdate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown, theme, }) {
    const appliedTheme = theme ?? defaultTheme;
    const fileInputRef = useRef(null);
    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        // Create a mock URL for demonstration
        const url = URL.createObjectURL(file);
        if (content.type === "image" && file.type.startsWith("image/")) {
            onUpdate({
                ...content,
                content: {
                    type: "image",
                    url,
                    title: content.content.type === "image"
                        ? content.content.title || file.name
                        : file.name,
                    caption: content.content.type === "image"
                        ? content.content.caption || ""
                        : "",
                },
            });
        }
        else if (content.type === "video" && file.type.startsWith("video/")) {
            onUpdate({
                ...content,
                content: {
                    type: "video",
                    url,
                    title: content.content.type === "video"
                        ? content.content.title || file.name
                        : file.name,
                    caption: content.content.type === "video"
                        ? content.content.caption || ""
                        : "",
                },
            });
        }
        else if (content.type === "audio" && file.type.startsWith("audio/")) {
            onUpdate({
                ...content,
                content: {
                    type: "audio",
                    url,
                    title: content.content.type === "audio"
                        ? content.content.title || file.name
                        : file.name,
                    caption: content.content.type === "audio"
                        ? content.content.caption || ""
                        : "",
                },
            });
        }
    };
    const renderEditor = () => {
        switch (content.type) {
            case "text":
                return (_jsx(RichTextEditor, { value: content.content.type === "text" ? content.content.content : "", onChange: (newContent) => onUpdate({
                        ...content,
                        content: { type: "text", content: newContent },
                    }), placeholder: "Enter your content here...", theme: appliedTheme }));
            case "image":
                return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [content.content.type === "image" && content.content.url ? (_jsxs("div", { style: { position: 'relative' }, children: [_jsx("img", { src: content.content.url, alt: content.content.title || "", style: {
                                        width: '100%',
                                        maxHeight: '24rem',
                                        objectFit: 'cover',
                                        borderRadius: '0.5rem'
                                    } }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => fileInputRef.current?.click(), style: {
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem'
                                    }, theme: appliedTheme, children: [_jsx(Upload, { style: { width: '1rem', height: '1rem', marginRight: '0.25rem' } }), "Change"] })] })) : (_jsxs("div", { style: {
                                borderWidth: '2px',
                                borderStyle: 'dashed',
                                borderColor: appliedTheme.borders.borderColor,
                                borderRadius: '0.5rem',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s'
                            }, onMouseEnter: (e) => e.currentTarget.style.borderColor = appliedTheme.colors.textSecondary, onMouseLeave: (e) => e.currentTarget.style.borderColor = appliedTheme.borders.borderColor, onClick: () => fileInputRef.current?.click(), children: [_jsx(Image, { style: {
                                        width: '3rem',
                                        height: '3rem',
                                        margin: '0 auto 1rem',
                                        color: appliedTheme.colors.textSecondary
                                    } }), _jsx("p", { style: { color: appliedTheme.colors.textSecondary }, children: "Click to upload an image" })] })), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileUpload, style: { display: 'none' } }), _jsx("style", { children: `@media (min-width: 768px) { .image-grid { grid-template-columns: repeat(2, 1fr); } }` }), _jsxs("div", { className: "image-grid", style: {
                                display: 'grid',
                                gridTemplateColumns: '1fr',
                                gap: '1rem'
                            }, children: [_jsx(Input, { placeholder: "Image title (optional)", value: content.content.type === "image"
                                        ? content.content.title || ""
                                        : "", onChange: (e) => onUpdate({
                                        ...content,
                                        content: {
                                            type: "image",
                                            url: content.content.type === "image"
                                                ? content.content.url
                                                : "",
                                            title: e.target.value,
                                            caption: content.content.type === "image"
                                                ? content.content.caption || ""
                                                : "",
                                        },
                                    }), theme: appliedTheme }), _jsx(Input, { placeholder: "Image caption (optional)", value: content.content.type === "image"
                                        ? content.content.caption || ""
                                        : "", onChange: (e) => onUpdate({
                                        ...content,
                                        content: {
                                            type: "image",
                                            url: content.content.type === "image"
                                                ? content.content.url
                                                : "",
                                            title: content.content.type === "image"
                                                ? content.content.title || ""
                                                : "",
                                            caption: e.target.value,
                                        },
                                    }), theme: appliedTheme })] })] }));
            case "video":
                return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [content.content.type === "video" && content.content.url ? (_jsxs("div", { style: { position: 'relative' }, children: [_jsxs("video", { src: content.content.url, controls: true, style: {
                                        width: '100%',
                                        maxHeight: '24rem',
                                        borderRadius: '0.5rem'
                                    }, children: [_jsx("track", { kind: "captions", label: "English", srcLang: "en" }), "Your browser does not support the video tag."] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => fileInputRef.current?.click(), style: {
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem'
                                    }, theme: appliedTheme, children: [_jsx(Upload, { style: { width: '1rem', height: '1rem', marginRight: '0.25rem' } }), "Change"] })] })) : (_jsxs("div", { style: {
                                borderWidth: '2px',
                                borderStyle: 'dashed',
                                borderColor: appliedTheme.borders.borderColor,
                                borderRadius: '0.5rem',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s'
                            }, onMouseEnter: (e) => e.currentTarget.style.borderColor = appliedTheme.colors.textSecondary, onMouseLeave: (e) => e.currentTarget.style.borderColor = appliedTheme.borders.borderColor, onClick: () => fileInputRef.current?.click(), children: [_jsx(Video, { style: {
                                        width: '3rem',
                                        height: '3rem',
                                        margin: '0 auto 1rem',
                                        color: appliedTheme.colors.textSecondary
                                    } }), _jsx("p", { style: { color: appliedTheme.colors.textSecondary }, children: "Click to upload a video" })] })), _jsx("input", { ref: fileInputRef, type: "file", accept: "video/*", onChange: handleFileUpload, style: { display: 'none' } }), _jsx("style", { children: `@media (min-width: 768px) { .video-grid { grid-template-columns: repeat(2, 1fr); } }` }), _jsxs("div", { className: "video-grid", style: {
                                display: 'grid',
                                gridTemplateColumns: '1fr',
                                gap: '1rem'
                            }, children: [_jsx(Input, { placeholder: "Video title (optional)", value: content.content.type === "video"
                                        ? content.content.title || ""
                                        : "", onChange: (e) => onUpdate({
                                        ...content,
                                        content: {
                                            type: "video",
                                            url: content.content.type === "video"
                                                ? content.content.url
                                                : "",
                                            title: e.target.value,
                                            caption: content.content.type === "video"
                                                ? content.content.caption || ""
                                                : "",
                                        },
                                    }), theme: appliedTheme }), _jsx(Input, { placeholder: "Video caption (optional)", value: content.content.type === "video"
                                        ? content.content.caption || ""
                                        : "", onChange: (e) => onUpdate({
                                        ...content,
                                        content: {
                                            type: "video",
                                            url: content.content.type === "video"
                                                ? content.content.url
                                                : "",
                                            title: content.content.type === "video"
                                                ? content.content.title || ""
                                                : "",
                                            caption: e.target.value,
                                        },
                                    }), theme: appliedTheme })] })] }));
            case "audio":
                return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [content.content.type === "audio" && content.content.url ? (_jsxs("div", { style: {
                                position: 'relative',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                backgroundColor: appliedTheme.colors.backgroundAlt
                            }, children: [_jsxs("audio", { src: content.content.url, controls: true, style: { width: '100%' }, children: [_jsx("track", { kind: "captions", label: "English", srcLang: "en" }), "Your browser does not support the audio tag."] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => fileInputRef.current?.click(), style: {
                                        position: 'absolute',
                                        top: '0.5rem',
                                        right: '0.5rem'
                                    }, theme: appliedTheme, children: [_jsx(Upload, { style: { width: '1rem', height: '1rem', marginRight: '0.25rem' } }), "Change"] })] })) : (_jsxs("div", { style: {
                                borderWidth: '2px',
                                borderStyle: 'dashed',
                                borderColor: appliedTheme.borders.borderColor,
                                borderRadius: '0.5rem',
                                padding: '2rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s'
                            }, onMouseEnter: (e) => e.currentTarget.style.borderColor = appliedTheme.colors.textSecondary, onMouseLeave: (e) => e.currentTarget.style.borderColor = appliedTheme.borders.borderColor, onClick: () => fileInputRef.current?.click(), children: [_jsx(Volume2, { style: {
                                        width: '3rem',
                                        height: '3rem',
                                        margin: '0 auto 1rem',
                                        color: appliedTheme.colors.textSecondary
                                    } }), _jsx("p", { style: { color: appliedTheme.colors.textSecondary }, children: "Click to upload an audio file" })] })), _jsx("input", { ref: fileInputRef, type: "file", accept: "audio/*", onChange: handleFileUpload, style: { display: 'none' } }), _jsx("style", { children: `@media (min-width: 768px) { .audio-grid { grid-template-columns: repeat(2, 1fr); } }` }), _jsxs("div", { className: "audio-grid", style: {
                                display: 'grid',
                                gridTemplateColumns: '1fr',
                                gap: '1rem'
                            }, children: [_jsx(Input, { placeholder: "Audio title (optional)", value: content.content.type === "audio"
                                        ? content.content.title || ""
                                        : "", onChange: (e) => onUpdate({
                                        ...content,
                                        content: {
                                            type: "audio",
                                            url: content.content.type === "audio"
                                                ? content.content.url
                                                : "",
                                            title: e.target.value,
                                            caption: content.content.type === "audio"
                                                ? content.content.caption || ""
                                                : "",
                                        },
                                    }), theme: appliedTheme }), _jsx(Input, { placeholder: "Audio caption (optional)", value: content.content.type === "audio"
                                        ? content.content.caption || ""
                                        : "", onChange: (e) => onUpdate({
                                        ...content,
                                        content: {
                                            type: "audio",
                                            url: content.content.type === "audio"
                                                ? content.content.url
                                                : "",
                                            title: content.content.type === "audio"
                                                ? content.content.title || ""
                                                : "",
                                            caption: e.target.value,
                                        },
                                    }), theme: appliedTheme })] })] }));
            default:
                return (_jsx("div", { children: "Unsupported content type" }));
        }
    };
    return (_jsxs(Card, { theme: appliedTheme, style: { marginBottom: '1rem' }, children: [_jsx(CardHeader, { theme: appliedTheme, style: { paddingBottom: '0.75rem' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsx(GripVertical, { style: {
                                        width: '1rem',
                                        height: '1rem',
                                        cursor: 'move',
                                        color: appliedTheme.colors.textSecondary
                                    } }), content.type === "text" && _jsx(Type, { style: { width: '1rem', height: '1rem' } }), content.type === "image" && _jsx(Image, { style: { width: '1rem', height: '1rem' } }), content.type === "video" && _jsx(Video, { style: { width: '1rem', height: '1rem' } }), content.type === "audio" && _jsx(Volume2, { style: { width: '1rem', height: '1rem' } }), _jsx("span", { style: {
                                        fontWeight: '500',
                                        textTransform: 'capitalize'
                                    }, children: content.type })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.25rem' }, children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: onMoveUp, disabled: !canMoveUp, style: {
                                        height: '1.5rem',
                                        width: '1.5rem',
                                        padding: 0
                                    }, theme: appliedTheme, children: _jsx(ArrowUp, { style: { width: '0.75rem', height: '0.75rem' } }) }), _jsx(Button, { size: "sm", variant: "ghost", onClick: onMoveDown, disabled: !canMoveDown, style: {
                                        height: '1.5rem',
                                        width: '1.5rem',
                                        padding: 0
                                    }, theme: appliedTheme, children: _jsx(ArrowDown, { style: { width: '0.75rem', height: '0.75rem' } }) }), _jsx(Button, { size: "sm", variant: "ghost", onClick: onDelete, style: {
                                        height: '1.5rem',
                                        width: '1.5rem',
                                        padding: 0,
                                        color: appliedTheme.colors.error || '#ef4444'
                                    }, onMouseEnter: (e) => e.currentTarget.style.opacity = '0.8', onMouseLeave: (e) => e.currentTarget.style.opacity = '1', theme: appliedTheme, children: _jsx(Trash2, { style: { width: '0.75rem', height: '0.75rem' } }) })] })] }) }), _jsx(CardContent, { theme: appliedTheme, children: renderEditor() })] }));
}
function LessonLibraryModal({ isOpen, onClose, onSelectLesson, modules, theme, }) {
    const appliedTheme = theme ?? defaultTheme;
    const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
    // Sample lesson templates
    const lessonTemplates = [
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
                        content: "<h2>Welcome!</h2><p>This is an introduction lesson template. Use this to welcome students to your course and set expectations.</p>",
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
                        content: "<h2>Knowledge Check</h2><p>Test your understanding with these questions:</p><ol><li>Question 1</li><li>Question 2</li><li>Question 3</li></ol>",
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
                        content: "<h2>Key Takeaways</h2><p>Here are the main points from this lesson:</p><ul><li>Key point 1</li><li>Key point 2</li><li>Key point 3</li></ul><p><strong>Next:</strong> Continue to the next lesson.</p>",
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
                        content: "<h2>Video Lesson</h2><p>Watch the video below and take notes on the key concepts discussed.</p><p><em>Video will be embedded here</em></p><h3>Discussion Questions:</h3><ul><li>What was the main topic?</li><li>How does this relate to previous lessons?</li></ul>",
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
                        content: "<h2>Assignment</h2><h3>Objective:</h3><p>Complete the following task to practice what you've learned.</p><h3>Instructions:</h3><ol><li>Step 1</li><li>Step 2</li><li>Step 3</li></ol><h3>Deliverables:</h3><ul><li>Item 1</li><li>Item 2</li></ul><p><strong>Due Date:</strong> [Date]</p>",
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
    const handleLibraryDragStart = (e, lesson) => {
        e.dataTransfer.setData("application/json", JSON.stringify({
            ...lesson,
            sourceType: "library",
        }));
        e.dataTransfer.effectAllowed = "copy";
    };
    const handleAddLesson = (lesson) => {
        onSelectLesson(lesson, selectedModuleIndex);
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { style: {
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
        }, children: _jsxs("div", { style: {
                borderRadius: '0.5rem',
                maxWidth: '64rem',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                backgroundColor: appliedTheme.colors.surface,
                boxShadow: appliedTheme.elevation.shadowLarge || '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }, children: [_jsxs("div", { style: { flex: 1, padding: '1.5rem' }, children: [_jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '1.5rem'
                            }, children: [_jsxs("div", { children: [_jsxs("h2", { style: {
                                                fontSize: '1.25rem',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: appliedTheme.colors.textPrimary
                                            }, children: [_jsx(Library, { style: {
                                                        width: '1.25rem',
                                                        height: '1.25rem',
                                                        color: appliedTheme.colors.accent || '#8b5cf6'
                                                    } }), "Lesson Library"] }), _jsx("p", { style: {
                                                fontSize: '0.875rem',
                                                color: appliedTheme.colors.textSecondary
                                            }, children: "Drag lessons to modules or click to add" })] }), _jsx(Button, { variant: "ghost", onClick: onClose, theme: appliedTheme, children: _jsx(X, { style: { width: '1rem', height: '1rem' } }) })] }), _jsx("div", { style: {
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                maxHeight: '24rem',
                                overflowY: 'auto'
                            }, children: lessonTemplates.map((lesson) => (_jsx("div", { draggable: true, onDragStart: (e) => handleLibraryDragStart(e, lesson), style: {
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                    transition: 'all 0.2s',
                                    cursor: 'move',
                                    borderColor: appliedTheme.colors.accent + '33' || '#8b5cf633',
                                    backgroundColor: appliedTheme.colors.accent + '11' || '#8b5cf611'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.opacity = '0.9';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.opacity = '1';
                                }, children: _jsxs("div", { style: {
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem'
                                    }, children: [_jsx(GripVertical, { style: {
                                                width: '1rem',
                                                height: '1rem',
                                                marginTop: '0.25rem',
                                                flexShrink: 0,
                                                color: appliedTheme.colors.accent + '88' || '#8b5cf688'
                                            } }), _jsxs("div", { style: {
                                                flex: 1,
                                                minWidth: 0
                                            }, children: [_jsx("h3", { style: {
                                                        fontWeight: '500',
                                                        color: appliedTheme.colors.accent || '#8b5cf6'
                                                    }, children: lesson.title }), _jsx("p", { style: {
                                                        fontSize: '0.875rem',
                                                        marginBottom: '0.5rem',
                                                        color: appliedTheme.colors.accent + 'aa' || '#8b5cf6aa'
                                                    }, children: lesson.description }), _jsxs("div", { style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                        fontSize: '0.75rem',
                                                        color: appliedTheme.colors.accent + '88' || '#8b5cf688'
                                                    }, children: [_jsxs("span", { children: [lesson.duration, " minutes"] }), _jsxs("span", { children: [lesson.content.length, " content blocks"] })] })] }), _jsxs(Button, { size: "sm", onClick: () => handleAddLesson(lesson), style: {
                                                backgroundColor: appliedTheme.colors.accent || '#8b5cf6',
                                                color: 'white',
                                                transition: 'opacity 0.2s'
                                            }, onMouseEnter: (e) => {
                                                e.currentTarget.style.opacity = '0.9';
                                            }, onMouseLeave: (e) => {
                                                e.currentTarget.style.opacity = '1';
                                            }, theme: appliedTheme, children: [_jsx(Plus, { style: { width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' } }), "Add"] })] }) }, lesson.id))) })] }), _jsxs("div", { style: {
                        width: '16rem',
                        borderLeft: `1px solid ${appliedTheme.borders.borderColor}`,
                        padding: '1rem',
                        backgroundColor: appliedTheme.colors.backgroundAlt
                    }, children: [_jsx("h3", { style: {
                                fontWeight: '500',
                                marginBottom: '0.75rem',
                                color: appliedTheme.colors.textPrimary
                            }, children: "Add to Module:" }), _jsx("div", { style: {
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }, children: modules.map((module, index) => (_jsxs("button", { onClick: () => setSelectedModuleIndex(index), style: {
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
                                }, onMouseEnter: (e) => {
                                    if (selectedModuleIndex !== index) {
                                        e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt;
                                    }
                                }, onMouseLeave: (e) => {
                                    if (selectedModuleIndex !== index) {
                                        e.currentTarget.style.backgroundColor = appliedTheme.colors.surface;
                                    }
                                }, children: [_jsx("div", { style: {
                                            fontWeight: '500',
                                            fontSize: '0.875rem'
                                        }, children: module.title }), _jsxs("div", { style: {
                                            fontSize: '0.75rem',
                                            color: appliedTheme.colors.textSecondary
                                        }, children: [module.lessons.length, " lessons"] })] }, module.id))) })] })] }) }));
}
export function CourseEditor({ courseId, onBack, onViewMode, onSave, onCancel, course, onUpdateCourse, loadCourse, theme, }) {
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
    const [editingCourse, setEditingCourse] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [showLessonLibrary, setShowLessonLibrary] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const hasInitializedLesson = useRef(false);
    // Helper function to update course and mark as changed
    const updateEditingCourse = (updatedCourse) => {
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
        }
        else {
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
                for (let moduleIdx = 0; moduleIdx < currentCourse.modules.length; moduleIdx++) {
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
        if (!editingCourse)
            return;
        try {
            setIsSaving(true);
            await onUpdateCourse(courseId, editingCourse);
            setHasUnsavedChanges(false); // Reset unsaved changes flag after successful save
        }
        catch (error) {
            console.error("Failed to save course:", error);
        }
        finally {
            setIsSaving(false);
        }
    };
    const selectLesson = (lesson, moduleIndex, lessonIndex) => {
        setSelectedLesson(lesson);
        setCurrentModuleIndex(moduleIndex);
        setCurrentLessonIndex(lessonIndex);
        setIsEditingContent(false);
    };
    const addModule = () => {
        if (!editingCourse)
            return;
        const newModule = {
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
    const updateModuleName = (moduleIndex, newName) => {
        if (!editingCourse)
            return;
        const updatedModules = [...editingCourse.modules];
        updatedModules[moduleIndex].title = newName;
        updateEditingCourse({
            ...editingCourse,
            modules: updatedModules,
        });
    };
    const deleteModule = (moduleIndex) => {
        if (!editingCourse)
            return;
        if (confirm(`Are you sure you want to delete "${editingCourse.modules[moduleIndex].title}" and all its lessons?`)) {
            const updatedModules = editingCourse.modules.filter((_, index) => index !== moduleIndex);
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
            }
            else if (currentModuleIndex > moduleIndex) {
                setCurrentModuleIndex(currentModuleIndex - 1);
            }
        }
    };
    const deleteLesson = (moduleIndex, lessonIndex) => {
        if (!editingCourse)
            return;
        const lesson = editingCourse.modules[moduleIndex].lessons[lessonIndex];
        if (confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
            const updatedModules = [...editingCourse.modules];
            updatedModules[moduleIndex] = {
                ...updatedModules[moduleIndex],
                lessons: updatedModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex),
            };
            // Update lesson orders
            updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.map((lesson, index) => ({
                ...lesson,
                order: index + 1,
            }));
            updateEditingCourse({
                ...editingCourse,
                modules: updatedModules,
            });
            // Reset selection if the deleted lesson was selected
            if (currentModuleIndex === moduleIndex &&
                currentLessonIndex === lessonIndex) {
                // Try to select another lesson in the same module
                if (updatedModules[moduleIndex].lessons.length > 0) {
                    const newLessonIndex = Math.min(lessonIndex, updatedModules[moduleIndex].lessons.length - 1);
                    setSelectedLesson(updatedModules[moduleIndex].lessons[newLessonIndex]);
                    setCurrentLessonIndex(newLessonIndex);
                }
                else {
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
            }
            else if (currentModuleIndex === moduleIndex &&
                currentLessonIndex > lessonIndex) {
                // Adjust the current lesson index if a lesson before it was deleted
                setCurrentLessonIndex(currentLessonIndex - 1);
            }
        }
    };
    const addLesson = (moduleIndex, lessonData) => {
        if (!editingCourse)
            return;
        const newLesson = lessonData
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
    const updateLessonName = (moduleIndex, lessonIndex, newName) => {
        if (!editingCourse)
            return;
        const updatedModules = [...editingCourse.modules];
        updatedModules[moduleIndex].lessons[lessonIndex].title = newName;
        updateEditingCourse({
            ...editingCourse,
            modules: updatedModules,
        });
        // Update selected lesson if it's the one being edited
        if (selectedLesson &&
            selectedLesson.id === updatedModules[moduleIndex].lessons[lessonIndex].id) {
            setSelectedLesson(updatedModules[moduleIndex].lessons[lessonIndex]);
        }
    };
    const calculateProgress = () => {
        if (!editingCourse)
            return 0;
        const totalLessons = editingCourse.modules.reduce((total, module) => total + module.lessons.length, 0);
        const completedLessons = editingCourse.modules.reduce((total, module) => total + module.lessons.filter((lesson) => lesson.isCompleted).length, 0);
        return totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;
    };
    const addContentBlock = (type) => {
        if (!selectedLesson || !editingCourse)
            return;
        const newBlock = {
            id: `content-${Date.now()}`,
            type,
            content: type === "text"
                ? { type: "text", content: "" }
                : { type, url: "", title: "", caption: "" },
            order: selectedLesson.content.length + 1,
        };
        const updatedLesson = {
            ...selectedLesson,
            content: [...selectedLesson.content, newBlock],
            updatedAt: new Date(),
        };
        updateLessonInCourse(updatedLesson);
    };
    const updateContentBlock = (blockId, updatedBlock) => {
        if (!selectedLesson)
            return;
        const updatedLesson = {
            ...selectedLesson,
            content: selectedLesson.content.map((block) => block.id === blockId ? updatedBlock : block),
            updatedAt: new Date(),
        };
        updateLessonInCourse(updatedLesson);
    };
    const deleteContentBlock = (blockId) => {
        if (!selectedLesson)
            return;
        const updatedLesson = {
            ...selectedLesson,
            content: selectedLesson.content.filter((block) => block.id !== blockId),
            updatedAt: new Date(),
        };
        updateLessonInCourse(updatedLesson);
    };
    const moveContentBlock = (blockId, direction) => {
        if (!selectedLesson)
            return;
        const currentIndex = selectedLesson.content.findIndex((block) => block.id === blockId);
        const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= selectedLesson.content.length)
            return;
        const reorderedContent = [...selectedLesson.content];
        const [movedBlock] = reorderedContent.splice(currentIndex, 1);
        reorderedContent.splice(newIndex, 0, movedBlock);
        const updatedContent = reorderedContent.map((block, index) => ({
            ...block,
            order: index + 1,
        }));
        const updatedLesson = {
            ...selectedLesson,
            content: updatedContent,
            updatedAt: new Date(),
        };
        updateLessonInCourse(updatedLesson);
    };
    // Enhanced content block drag and drop
    const handleContentBlockDragStart = (e, blockId, blockIndex) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({
            type: "content-block",
            blockId,
            blockIndex,
        }));
        e.dataTransfer.effectAllowed = "move";
        e.target.style.opacity = "0.5";
    };
    const handleContentBlockDragEnd = (e) => {
        e.target.style.opacity = "1";
    };
    const handleContentBlockDragOver = (e, _targetIndex) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };
    const handleContentBlockDrop = (e, targetIndex) => {
        e.preventDefault();
        try {
            const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
            if (dragData.type === "content-block" && selectedLesson) {
                const { blockIndex } = dragData;
                if (blockIndex === targetIndex)
                    return;
                const reorderedContent = [...selectedLesson.content];
                const [movedBlock] = reorderedContent.splice(blockIndex, 1);
                reorderedContent.splice(targetIndex, 0, movedBlock);
                const updatedContent = reorderedContent.map((block, index) => ({
                    ...block,
                    order: index + 1,
                }));
                const updatedLesson = {
                    ...selectedLesson,
                    content: updatedContent,
                    updatedAt: new Date(),
                };
                updateLessonInCourse(updatedLesson);
            }
        }
        catch (error) {
            console.error("Error handling content block drop:", error);
        }
    };
    const updateLessonInCourse = (updatedLesson) => {
        if (!editingCourse)
            return;
        const updatedModules = editingCourse.modules.map((module, moduleIndex) => {
            if (moduleIndex === currentModuleIndex) {
                return {
                    ...module,
                    lessons: module.lessons.map((lesson, lessonIndex) => lessonIndex === currentLessonIndex ? updatedLesson : lesson),
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
    const handleDragStart = (e, type, moduleIndex, lessonIndex) => {
        if (!editingCourse)
            return;
        const dragData = {
            type,
            id: type === "module"
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
        e.target.style.opacity = "0.5";
    };
    const handleDragEnd = (e) => {
        e.target.style.opacity = "1";
        setDraggedItem(null);
        setDragOverIndex(null);
    };
    const handleDragOver = (e, moduleIndex, lessonIndex) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverIndex({ moduleIndex, lessonIndex });
    };
    const handleDragLeave = () => {
        setDragOverIndex(null);
    };
    const handleDrop = (e, targetModuleIndex, targetLessonIndex) => {
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
                if (dragData.type === "lesson" &&
                    draggedItem.moduleIndex !== undefined &&
                    draggedItem.lessonIndex !== undefined) {
                    moveLesson(draggedItem.moduleIndex, draggedItem.lessonIndex, targetModuleIndex, targetLessonIndex);
                }
                else if (dragData.type === "module" &&
                    draggedItem.moduleIndex !== undefined) {
                    moveModule(draggedItem.moduleIndex, targetModuleIndex);
                }
            }
        }
        catch (error) {
            console.error("Error handling drop:", error);
        }
        setDraggedItem(null);
    };
    const moveLesson = (fromModuleIndex, fromLessonIndex, toModuleIndex, toLessonIndex) => {
        if (!editingCourse)
            return;
        const updatedModules = [...editingCourse.modules];
        const lessonToMove = updatedModules[fromModuleIndex].lessons[fromLessonIndex];
        // Remove from source
        updatedModules[fromModuleIndex].lessons.splice(fromLessonIndex, 1);
        // Add to target
        const targetIndex = toLessonIndex !== undefined
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
    const moveModule = (fromIndex, toIndex) => {
        if (!editingCourse || fromIndex === toIndex)
            return;
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
    const renderContent = (content, isEditing = false) => {
        if (isEditing && content.type === "text") {
            return (_jsx(RichTextEditor, { value: content.content.type === "text" ? content.content.content : "", onChange: (newContent) => {
                    updateContentBlock(content.id, {
                        ...content,
                        content: { type: "text", content: newContent },
                    });
                }, placeholder: "Enter your content here..." }));
        }
        // Render content exactly like CourseViewer for view mode
        switch (content.type) {
            case "text":
                if (content.content.type === "text") {
                    return (_jsx("div", { className: "prose max-w-none", 
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from trusted course data
                        dangerouslySetInnerHTML: { __html: content.content.content } }));
                }
                break;
            case "image":
                if (content.content.type === "image") {
                    return (_jsxs("div", { style: { margin: '1rem 0' }, children: [_jsx("img", { src: content.content.url, alt: content.content.title || "Course image", style: {
                                    width: '100%',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                                } }), content.content.caption && (_jsx("p", { style: {
                                    fontSize: '0.875rem',
                                    marginTop: '0.5rem',
                                    fontStyle: 'italic',
                                    color: appliedTheme.colors.textSecondary
                                }, children: content.content.caption }))] }));
                }
                break;
            case "video":
                if (content.content.type === "video") {
                    return (_jsxs("div", { style: { margin: '1rem 0' }, children: [_jsxs("video", { controls: true, style: {
                                    width: '100%',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                                }, src: content.content.url, children: [_jsx("track", { kind: "captions", label: "English", srcLang: "en" }), "Your browser does not support the video tag."] }), content.content.caption && (_jsx("p", { style: {
                                    fontSize: '0.875rem',
                                    marginTop: '0.5rem',
                                    fontStyle: 'italic',
                                    color: appliedTheme.colors.textSecondary
                                }, children: content.content.caption }))] }));
                }
                break;
            case "audio":
                if (content.content.type === "audio") {
                    return (_jsxs("div", { style: { margin: '1rem 0' }, children: [_jsxs("audio", { controls: true, style: { width: '100%' }, src: content.content.url, children: [_jsx("track", { kind: "captions", label: "English", srcLang: "en" }), "Your browser does not support the audio tag."] }), content.content.caption && (_jsx("p", { style: {
                                    fontSize: '0.875rem',
                                    marginTop: '0.5rem',
                                    fontStyle: 'italic',
                                    color: appliedTheme.colors.textSecondary
                                }, children: content.content.caption }))] }));
                }
                break;
            default:
                return _jsx("div", { children: "Unsupported content type" });
        }
        return _jsx("div", { children: "Invalid content configuration" });
    };
    if (!editingCourse) {
        return (_jsx("div", { style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: appliedTheme.colors.backgroundAlt
            }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { className: "animate-spin", style: {
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: 'transparent',
                            borderBottomColor: appliedTheme.colors.secondary || '#3b82f6',
                            margin: '0 auto 1rem'
                        } }), _jsx("p", { style: { color: appliedTheme.colors.textPrimary }, children: "Loading..." })] }) }));
    }
    const progress = calculateProgress();
    return (_jsxs("div", { style: { minHeight: '100vh', backgroundColor: appliedTheme.colors.backgroundAlt }, children: [_jsx("div", { style: {
                    backgroundColor: appliedTheme.colors.surface,
                    borderBottom: `1px solid ${appliedTheme.borders.borderColor}`
                }, children: _jsx("div", { style: {
                        maxWidth: '80rem',
                        margin: '0 auto',
                        padding: '1rem',
                        '@media (min-width: 640px)': { padding: '1rem 1.5rem' },
                        '@media (min-width: 1024px)': { padding: '1rem 2rem' }
                    }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs(Button, { variant: "ghost", onClick: onBack || onCancel, theme: appliedTheme, children: [_jsx(ArrowLeft, { style: { width: '1rem', height: '1rem', marginRight: '0.5rem' } }), "Back to Courses"] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowLessonLibrary(true), theme: appliedTheme, children: [_jsx(Library, { style: { width: '1rem', height: '1rem', marginRight: '0.5rem' } }), "Lesson Library"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: onViewMode, theme: appliedTheme, children: [_jsx(Eye, { style: { width: '1rem', height: '1rem', marginRight: '0.5rem' } }), "View"] }), _jsxs(Button, { onClick: handleSave, disabled: isSaving || !hasUnsavedChanges, theme: appliedTheme, children: [_jsx(Save, { style: { width: '1rem', height: '1rem', marginRight: '0.5rem' } }), isSaving ? "Saving..." : "Save"] }), _jsx(Badge, { variant: "default", theme: appliedTheme, children: "Edit Mode" })] })] }) }) }), _jsx("div", { style: {
                    maxWidth: '80rem',
                    margin: '0 auto',
                    padding: '2rem 1rem',
                    '@media (min-width: 640px)': { padding: '2rem 1.5rem' },
                    '@media (min-width: 1024px)': { padding: '2rem 2rem' }
                }, children: _jsxs("div", { className: "course-editor-main-grid", style: {
                        display: 'grid',
                        gridTemplateColumns: '1fr',
                        gap: '2rem'
                    }, children: [_jsx("style", { children: `
            @media (min-width: 1024px) { 
              .course-editor-main-grid { 
                grid-template-columns: 1fr 2fr !important; 
              } 
            }
          ` }), _jsx("div", { children: _jsxs(Card, { theme: appliedTheme, children: [_jsxs(CardHeader, { theme: appliedTheme, children: [_jsx(CardTitle, { theme: appliedTheme, style: { fontSize: '1.125rem' }, children: editingCourse?.title || 'Course' }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: [_jsxs("div", { style: {
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            fontSize: '0.875rem'
                                                        }, children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [progress, "%"] })] }), _jsx(Progress, { value: progress, theme: appliedTheme, style: { width: '100%' } })] })] }), _jsxs(CardContent, { theme: appliedTheme, style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [editingCourse?.modules?.map((module, moduleIndex) => {
                                                if (!module)
                                                    return null;
                                                return (_jsxs("div", { style: {
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
                                                    }, onDragOver: (e) => handleDragOver(e, moduleIndex), onDragLeave: handleDragLeave, onDrop: (e) => handleDrop(e, moduleIndex), children: [_jsxs("div", { style: {
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                cursor: 'move'
                                                            }, draggable: true, onDragStart: (e) => handleDragStart(e, "module", moduleIndex), onDragEnd: handleDragEnd, children: [_jsxs("h4", { style: {
                                                                        fontWeight: '500',
                                                                        fontSize: '0.875rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem'
                                                                    }, children: [_jsx(GripVertical, { style: { width: '0.75rem', height: '0.75rem', color: appliedTheme.colors.textSecondary } }), _jsx(BookOpen, { style: { width: '1rem', height: '1rem' } }), _jsx(EditableText, { value: module.title, onChange: (newName) => updateModuleName(moduleIndex, newName), placeholder: "Module Title" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.25rem' }, children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => addLesson(moduleIndex), style: {
                                                                                height: '1.5rem',
                                                                                width: '1.5rem',
                                                                                padding: 0
                                                                            }, title: "Add lesson", theme: appliedTheme, children: _jsx(Plus, { style: { width: '0.75rem', height: '0.75rem' } }) }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => deleteModule(moduleIndex), style: {
                                                                                height: '1.5rem',
                                                                                width: '1.5rem',
                                                                                padding: 0,
                                                                                color: appliedTheme.colors.error || '#ef4444'
                                                                            }, onMouseEnter: (e) => e.currentTarget.style.opacity = '0.8', onMouseLeave: (e) => e.currentTarget.style.opacity = '1', title: "Delete module", theme: appliedTheme, children: _jsx(Trash2, { style: { width: '0.75rem', height: '0.75rem' } }) })] })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.25rem', marginLeft: '1.5rem' }, children: module.lessons?.map((lesson, lessonIndex) => {
                                                                if (!lesson)
                                                                    return null;
                                                                return (_jsxs("div", { className: "lesson-item", style: {
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
                                                                    }, onMouseEnter: (e) => {
                                                                        if (selectedLesson?.id !== lesson.id) {
                                                                            e.currentTarget.style.backgroundColor = appliedTheme.colors.backgroundAlt;
                                                                        }
                                                                    }, onMouseLeave: (e) => {
                                                                        if (selectedLesson?.id !== lesson.id) {
                                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                                        }
                                                                    }, draggable: true, onDragStart: (e) => handleDragStart(e, "lesson", moduleIndex, lessonIndex), onDragEnd: handleDragEnd, onClick: () => selectLesson(lesson, moduleIndex, lessonIndex), onDragOver: (e) => handleDragOver(e, moduleIndex, lessonIndex), onDragLeave: handleDragLeave, onDrop: (e) => handleDrop(e, moduleIndex, lessonIndex), children: [_jsx(GripVertical, { style: {
                                                                                width: '0.75rem',
                                                                                height: '0.75rem',
                                                                                opacity: 0,
                                                                                color: appliedTheme.colors.textSecondary,
                                                                                transition: 'opacity 0.2s'
                                                                            }, className: "lesson-grip" }), _jsx(Edit, { style: {
                                                                                width: '0.75rem',
                                                                                height: '0.75rem',
                                                                                flexShrink: 0,
                                                                                color: appliedTheme.colors.secondary || '#2563eb'
                                                                            } }), _jsx(EditableText, { value: lesson.title, onChange: (newName) => updateLessonName(moduleIndex, lessonIndex, newName), placeholder: "Lesson Title", style: { flex: 1 } }), _jsxs("div", { style: {
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.25rem',
                                                                                color: appliedTheme.colors.textSecondary,
                                                                                marginLeft: 'auto'
                                                                            }, children: [_jsx(FileText, { style: { width: '0.75rem', height: '0.75rem' } }), _jsx("span", { style: { fontSize: '0.75rem' }, children: lesson.content?.length || 0 }), _jsx(Button, { size: "sm", variant: "ghost", className: "lesson-delete-btn", onClick: (e) => {
                                                                                        e.stopPropagation();
                                                                                        deleteLesson(moduleIndex, lessonIndex);
                                                                                    }, style: {
                                                                                        height: '1rem',
                                                                                        width: '1rem',
                                                                                        padding: 0,
                                                                                        opacity: 0,
                                                                                        color: appliedTheme.colors.error || '#ef4444',
                                                                                        transition: 'opacity 0.2s'
                                                                                    }, title: "Delete lesson", theme: appliedTheme, children: _jsx(Trash2, { style: { width: '0.5rem', height: '0.5rem' } }) })] })] }, lesson.id));
                                                            }) })] }, module.id));
                                            }), _jsxs(Button, { variant: "outline", size: "sm", onClick: addModule, style: { width: '100%' }, theme: appliedTheme, children: [_jsx(Plus, { style: { width: '1rem', height: '1rem', marginRight: '0.5rem' } }), "Add Module"] })] })] }) }), _jsx("div", { children: selectedLesson ? (_jsxs(Card, { theme: appliedTheme, children: [_jsx(CardHeader, { theme: appliedTheme, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx(CardTitle, { theme: appliedTheme, style: { fontSize: '1.25rem' }, children: selectedLesson.title }), _jsx("p", { style: {
                                                                marginTop: '0.25rem',
                                                                color: appliedTheme.colors.textSecondary
                                                            }, children: selectedLesson.description })] }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: _jsxs(Button, { size: "sm", variant: "outline", onClick: () => setIsEditingContent(!isEditingContent), theme: appliedTheme, children: [_jsx(Edit, { style: { width: '1rem', height: '1rem', marginRight: '0.25rem' } }), isEditingContent ? "View" : "Edit"] }) })] }) }), _jsxs(CardContent, { theme: appliedTheme, style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [selectedLesson.content.length > 0 ? (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: isEditingContent
                                                    ? // Edit mode with full content block editors
                                                        selectedLesson.content
                                                            .sort((a, b) => a.order - b.order)
                                                            .map((content, index) => (_jsx("div", { draggable: true, onDragStart: (e) => handleContentBlockDragStart(e, content.id, index), onDragEnd: handleContentBlockDragEnd, onDragOver: (e) => handleContentBlockDragOver(e, index), onDrop: (e) => handleContentBlockDrop(e, index), style: { transition: 'opacity 0.2s' }, children: _jsx(ContentBlockEditor, { content: content, onUpdate: (updatedContent) => updateContentBlock(content.id, updatedContent), onDelete: () => deleteContentBlock(content.id), onMoveUp: () => moveContentBlock(content.id, "up"), onMoveDown: () => moveContentBlock(content.id, "down"), canMoveUp: index > 0, canMoveDown: index < selectedLesson.content.length - 1, theme: appliedTheme }) }, content.id)))
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
                                                            .map((content) => (_jsx("div", { children: renderContent(content, false) }, content.id))) })) : (_jsxs("div", { style: {
                                                    textAlign: 'center',
                                                    padding: '2rem 0',
                                                    color: appliedTheme.colors.textSecondary
                                                }, children: [_jsx(FileText, { style: {
                                                            width: '3rem',
                                                            height: '3rem',
                                                            margin: '0 auto 0.75rem',
                                                            color: appliedTheme.colors.textSecondary
                                                        } }), _jsx("p", { children: "No content in this lesson yet." }), _jsx("p", { style: { fontSize: '0.875rem' }, children: "Add some content blocks to get started." })] })), isEditingContent && (_jsxs("div", { style: {
                                                    borderWidth: '2px',
                                                    borderStyle: 'dashed',
                                                    borderColor: appliedTheme.borders.borderColor,
                                                    borderRadius: '0.5rem',
                                                    padding: '1.5rem',
                                                    marginTop: '1.5rem'
                                                }, children: [_jsx("h3", { style: {
                                                            fontSize: '0.875rem',
                                                            fontWeight: '500',
                                                            marginBottom: '0.75rem',
                                                            textAlign: 'center'
                                                        }, children: "Add Content" }), _jsx("style", { children: `@media (min-width: 768px) { .content-grid-md-4 { grid-template-columns: repeat(4, 1fr); } }` }), _jsxs("div", { className: "content-grid-md-4", style: {
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(2, 1fr)',
                                                            gap: '0.75rem'
                                                        }, children: [_jsxs(Button, { variant: "outline", onClick: () => addContentBlock("text"), style: {
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    height: '4rem',
                                                                    fontSize: '0.75rem'
                                                                }, theme: appliedTheme, children: [_jsx(Type, { style: {
                                                                            width: '1.25rem',
                                                                            height: '1.25rem',
                                                                            color: appliedTheme.colors.secondary || '#2563eb'
                                                                        } }), "Text"] }), _jsxs(Button, { variant: "outline", onClick: () => addContentBlock("image"), style: {
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    height: '4rem',
                                                                    fontSize: '0.75rem'
                                                                }, theme: appliedTheme, children: [_jsx(Image, { style: {
                                                                            width: '1.25rem',
                                                                            height: '1.25rem',
                                                                            color: appliedTheme.colors.success || '#22c55e'
                                                                        } }), "Image"] }), _jsxs(Button, { variant: "outline", onClick: () => addContentBlock("video"), style: {
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    height: '4rem',
                                                                    fontSize: '0.75rem'
                                                                }, theme: appliedTheme, children: [_jsx(Video, { style: {
                                                                            width: '1.25rem',
                                                                            height: '1.25rem',
                                                                            color: appliedTheme.colors.error || '#ef4444'
                                                                        } }), "Video"] }), _jsxs(Button, { variant: "outline", onClick: () => addContentBlock("audio"), style: {
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    height: '4rem',
                                                                    fontSize: '0.75rem'
                                                                }, theme: appliedTheme, children: [_jsx(Volume2, { style: {
                                                                            width: '1.25rem',
                                                                            height: '1.25rem',
                                                                            color: appliedTheme.colors.accent || '#8b5cf6'
                                                                        } }), "Audio"] })] })] }))] })] })) : (_jsx(Card, { theme: appliedTheme, children: _jsx(CardContent, { theme: appliedTheme, style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '16rem'
                                    }, children: _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx(Edit, { style: {
                                                    width: '3rem',
                                                    height: '3rem',
                                                    margin: '0 auto 1rem',
                                                    color: appliedTheme.colors.textSecondary
                                                } }), _jsx("h3", { style: {
                                                    fontSize: '1.125rem',
                                                    fontWeight: '500',
                                                    marginBottom: '0.5rem'
                                                }, children: "Select a Lesson" }), _jsx("p", { style: { color: appliedTheme.colors.textSecondary }, children: "Choose a lesson from the sidebar to start editing" })] }) }) })) })] }) }), editingCourse && (_jsx(LessonLibraryModal, { isOpen: showLessonLibrary, onClose: () => setShowLessonLibrary(false), onSelectLesson: (lesson, moduleIndex) => {
                    addLesson(moduleIndex, lesson);
                    setShowLessonLibrary(false);
                }, modules: editingCourse.modules || [], theme: appliedTheme }))] }));
}
