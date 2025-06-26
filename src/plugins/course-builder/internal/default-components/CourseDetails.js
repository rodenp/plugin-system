import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Save, X, Upload, Settings, Plus } from 'lucide-react';
import { useCourse } from '@/core/course-context';
export function CourseDetails({ course, isOpen, onClose, onSave }) {
    const { updateCourse } = useCourse();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        coverImage: '',
        tags: [],
        isPaid: false,
        accessLevel: 'free',
        requiredPlan: 'basic',
        stripeProductId: '',
        category: '',
        difficulty: 'beginner',
        language: 'English',
        estimatedHours: 0,
        shortDescription: '',
        keywords: [],
        allowPreview: true,
        enableComments: true,
        enableDownloads: false,
        enableCertificates: false,
        maxStudents: 0,
        instructorName: '',
        instructorBio: '',
        price: 0,
        currency: 'USD',
        discountPrice: undefined
    });
    const [activeTab, setActiveTab] = useState('basic');
    const [isSaving, setIsSaving] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [newKeyword, setNewKeyword] = useState('');
    const [imageUploadError, setImageUploadError] = useState('');
    // Initialize form data when course changes
    useEffect(() => {
        if (course) {
            // Calculate estimated hours from course content
            const totalMinutes = course.modules.reduce((total, module) => total + module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0), 0);
            const estimatedHours = Math.round(totalMinutes / 60 * 10) / 10;
            setFormData({
                title: course.title || '',
                description: course.description || '',
                coverImage: course.coverImage || '',
                tags: course.tags || [],
                isPaid: course.isPaid || false,
                accessLevel: course.accessLevel || 'free',
                requiredPlan: course.requiredPlan || 'basic',
                stripeProductId: course.stripeProductId || '',
                category: course.category || '',
                difficulty: course.difficulty || 'beginner',
                language: course.language || 'English',
                estimatedHours,
                shortDescription: course.shortDescription || '',
                keywords: course.keywords || [],
                allowPreview: course.allowPreview !== false,
                enableComments: course.enableComments !== false,
                enableDownloads: course.enableDownloads || false,
                enableCertificates: course.enableCertificates || false,
                maxStudents: course.maxStudents || 0,
                instructorName: course.instructorName || '',
                instructorBio: course.instructorBio || '',
                price: course.price || 0,
                currency: course.currency || 'USD',
                discountPrice: course.discountPrice
            });
        }
    }, [course]);
    const handleSave = async () => {
        if (!course)
            return;
        try {
            setIsSaving(true);
            const updatedCourse = {
                ...course,
                title: formData.title,
                description: formData.description,
                coverImage: formData.coverImage,
                tags: formData.tags,
                isPaid: formData.isPaid,
                accessLevel: formData.accessLevel,
                requiredPlan: formData.requiredPlan,
                stripeProductId: formData.stripeProductId,
                updatedAt: new Date(),
                // Extended properties
                ...(formData.category && { category: formData.category }),
                ...(formData.difficulty && { difficulty: formData.difficulty }),
                ...(formData.language && { language: formData.language }),
                ...(formData.shortDescription && { shortDescription: formData.shortDescription }),
                ...(formData.keywords.length > 0 && { keywords: formData.keywords }),
                ...(formData.instructorName && { instructorName: formData.instructorName }),
                ...(formData.instructorBio && { instructorBio: formData.instructorBio }),
                ...(formData.price > 0 && { price: formData.price }),
                ...(formData.currency && { currency: formData.currency }),
                ...(formData.discountPrice && { discountPrice: formData.discountPrice }),
                allowPreview: formData.allowPreview,
                enableComments: formData.enableComments,
                enableDownloads: formData.enableDownloads,
                enableCertificates: formData.enableCertificates,
                ...(formData.maxStudents > 0 && { maxStudents: formData.maxStudents })
            };
            await updateCourse(updatedCourse);
            onSave?.(updatedCourse);
            onClose();
        }
        catch (error) {
            console.error('Failed to save course details:', error);
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };
    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };
    const handleAddKeyword = () => {
        if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
            setFormData(prev => ({
                ...prev,
                keywords: [...prev.keywords, newKeyword.trim()]
            }));
            setNewKeyword('');
        }
    };
    const handleRemoveKeyword = (keywordToRemove) => {
        setFormData(prev => ({
            ...prev,
            keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
        }));
    };
    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            // In a real app, you'd upload to a file service
            // For now, we'll create a placeholder URL
            const imageUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, coverImage: imageUrl }));
            setImageUploadError('');
        }
    };
    const validateImageUrl = (url) => {
        // Basic URL validation
        try {
            new URL(url);
            setImageUploadError('');
            return true;
        }
        catch {
            setImageUploadError('Please enter a valid URL');
            return false;
        }
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-hidden", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Settings, { className: "h-5 w-5" }), "Course Details"] }), _jsx(DialogDescription, { children: "Edit comprehensive course information, settings, and metadata." })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-5", children: [_jsx(TabsTrigger, { value: "basic", children: "Basic Info" }), _jsx(TabsTrigger, { value: "content", children: "Content" }), _jsx(TabsTrigger, { value: "pricing", children: "Pricing" }), _jsx(TabsTrigger, { value: "seo", children: "SEO" }), _jsx(TabsTrigger, { value: "settings", children: "Settings" })] }), _jsxs(TabsContent, { value: "basic", className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Course Title *" }), _jsx(Input, { value: formData.title, onChange: (e) => setFormData(prev => ({ ...prev, title: e.target.value })), placeholder: "Enter course title", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Short Description" }), _jsx(Input, { value: formData.shortDescription, onChange: (e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value })), placeholder: "Brief course description for listings" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Category" }), _jsxs("select", { value: formData.category, onChange: (e) => setFormData(prev => ({ ...prev, category: e.target.value })), className: "w-full p-2 border rounded-md", style: { borderColor: 'var(--course-builder-border)' }, children: [_jsx("option", { value: "", children: "Select Category" }), _jsx("option", { value: "web-development", children: "Web Development" }), _jsx("option", { value: "data-science", children: "Data Science" }), _jsx("option", { value: "design", children: "Design" }), _jsx("option", { value: "business", children: "Business" }), _jsx("option", { value: "marketing", children: "Marketing" }), _jsx("option", { value: "photography", children: "Photography" }), _jsx("option", { value: "music", children: "Music" }), _jsx("option", { value: "language", children: "Language" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Difficulty Level" }), _jsxs("select", { value: formData.difficulty, onChange: (e) => setFormData(prev => ({ ...prev, difficulty: e.target.value })), className: "w-full p-2 border rounded-md", style: { borderColor: 'var(--course-builder-border)' }, children: [_jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Language" }), _jsxs("select", { value: formData.language, onChange: (e) => setFormData(prev => ({ ...prev, language: e.target.value })), className: "w-full p-2 border rounded-md", style: { borderColor: 'var(--course-builder-border)' }, children: [_jsx("option", { value: "English", children: "English" }), _jsx("option", { value: "Spanish", children: "Spanish" }), _jsx("option", { value: "French", children: "French" }), _jsx("option", { value: "German", children: "German" }), _jsx("option", { value: "Chinese", children: "Chinese" }), _jsx("option", { value: "Japanese", children: "Japanese" })] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Cover Image" }), _jsxs("div", { className: "space-y-2", children: [_jsx(Input, { value: formData.coverImage, onChange: (e) => {
                                                                            setFormData(prev => ({ ...prev, coverImage: e.target.value }));
                                                                            if (e.target.value)
                                                                                validateImageUrl(e.target.value);
                                                                        }, placeholder: "Enter image URL" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm", style: { color: 'var(--course-builder-text-muted)' }, children: "or" }), _jsxs("label", { className: "cursor-pointer", children: [_jsx("input", { type: "file", accept: "image/*", onChange: handleImageUpload, className: "hidden" }), _jsxs(Button, { variant: "outline", size: "sm", type: "button", children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Upload Image"] })] })] }), imageUploadError && (_jsx("p", { className: "text-sm", style: { color: 'var(--course-builder-error, #ef4444)' }, children: imageUploadError })), formData.coverImage && (_jsx("div", { className: "mt-2", children: _jsx("img", { src: formData.coverImage, alt: "Course cover", className: "w-full h-32 object-cover rounded border", onError: () => setImageUploadError('Failed to load image') }) }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Instructor Name" }), _jsx(Input, { value: formData.instructorName, onChange: (e) => setFormData(prev => ({ ...prev, instructorName: e.target.value })), placeholder: "Instructor name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Estimated Duration" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "number", value: formData.estimatedHours, onChange: (e) => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 })), placeholder: "0", step: "0.5", min: "0" }), _jsx("span", { className: "text-sm", style: { color: 'var(--course-builder-text-muted)' }, children: "hours" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Course Statistics" }), _jsxs("div", { className: "space-y-2 text-sm p-3 rounded", style: { color: 'var(--course-builder-text-secondary)', backgroundColor: 'var(--course-builder-bg-muted)' }, children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Modules:" }), _jsx("span", { children: course?.modules.length || 0 })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Total Lessons:" }), _jsx("span", { children: course?.modules.reduce((total, module) => total + module.lessons.length, 0) || 0 })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Total Duration:" }), _jsxs("span", { children: [formData.estimatedHours, " hours"] })] })] })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Full Description" }), _jsx(Textarea, { value: formData.description, onChange: (e) => setFormData(prev => ({ ...prev, description: e.target.value })), placeholder: "Detailed course description", rows: 4 })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Instructor Bio" }), _jsx(Textarea, { value: formData.instructorBio, onChange: (e) => setFormData(prev => ({ ...prev, instructorBio: e.target.value })), placeholder: "Brief bio about the instructor", rows: 3 })] })] }), _jsx(TabsContent, { value: "content", className: "space-y-6", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Tags" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: newTag, onChange: (e) => setNewTag(e.target.value), placeholder: "Add a tag", onKeyPress: (e) => e.key === 'Enter' && handleAddTag() }), _jsx(Button, { onClick: handleAddTag, variant: "outline", size: "sm", children: _jsx(Plus, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "flex flex-wrap gap-1", children: formData.tags.map((tag) => (_jsxs(Badge, { variant: "secondary", className: "flex items-center gap-1", children: [tag, _jsx("button", { onClick: () => handleRemoveTag(tag), children: _jsx(X, { className: "h-3 w-3" }) })] }, tag))) })] })] }) }) }), _jsx(TabsContent, { value: "pricing", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Access Level" }), _jsxs("select", { value: formData.accessLevel, onChange: (e) => {
                                                                const level = e.target.value;
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    accessLevel: level,
                                                                    isPaid: level !== 'free'
                                                                }));
                                                            }, className: "w-full p-2 border rounded-md", style: { borderColor: 'var(--course-builder-border)' }, children: [_jsx("option", { value: "free", children: "Free" }), _jsx("option", { value: "paid", children: "Paid" }), _jsx("option", { value: "premium", children: "Premium" })] })] }), formData.accessLevel !== 'free' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Required Plan" }), _jsxs("select", { value: formData.requiredPlan, onChange: (e) => setFormData(prev => ({
                                                                        ...prev,
                                                                        requiredPlan: e.target.value
                                                                    })), className: "w-full p-2 border rounded-md", style: { borderColor: 'var(--course-builder-border)' }, children: [_jsx("option", { value: "basic", children: "Basic" }), _jsx("option", { value: "pro", children: "Pro" }), _jsx("option", { value: "enterprise", children: "Enterprise" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Stripe Product ID" }), _jsx(Input, { value: formData.stripeProductId, onChange: (e) => setFormData(prev => ({ ...prev, stripeProductId: e.target.value })), placeholder: "prod_xxxxxxxxx" }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--course-builder-text-muted)' }, children: "Enter the Stripe product ID for this course" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Price" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("select", { value: formData.currency, onChange: (e) => setFormData(prev => ({ ...prev, currency: e.target.value })), className: "w-20 p-2 border rounded-md", style: { borderColor: 'var(--course-builder-border)' }, children: [_jsx("option", { value: "USD", children: "USD" }), _jsx("option", { value: "EUR", children: "EUR" }), _jsx("option", { value: "GBP", children: "GBP" })] }), _jsx(Input, { type: "number", value: formData.price, onChange: (e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 })), placeholder: "0.00", min: "0", step: "0.01" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Discount Price (Optional)" }), _jsx(Input, { type: "number", value: formData.discountPrice || '', onChange: (e) => setFormData(prev => ({
                                                                        ...prev,
                                                                        discountPrice: e.target.value ? parseFloat(e.target.value) : undefined
                                                                    })), placeholder: "0.00", min: "0", step: "0.01" })] })] }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Enrollment Limits" }), _jsx(Input, { type: "number", value: formData.maxStudents || '', onChange: (e) => setFormData(prev => ({
                                                                ...prev,
                                                                maxStudents: e.target.value ? parseInt(e.target.value) : 0
                                                            })), placeholder: "Unlimited", min: "0" }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--course-builder-text-muted)' }, children: "Leave empty or 0 for unlimited enrollment" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium", children: "Preview Access" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { checked: formData.allowPreview, onCheckedChange: (checked) => setFormData(prev => ({ ...prev, allowPreview: checked })) }), _jsx("span", { className: "text-sm", children: "Allow preview before purchase" })] })] })] })] }) }), _jsx(TabsContent, { value: "seo", className: "space-y-6", children: _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "SEO Keywords" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: newKeyword, onChange: (e) => setNewKeyword(e.target.value), placeholder: "Add a keyword", onKeyPress: (e) => e.key === 'Enter' && handleAddKeyword() }), _jsx(Button, { onClick: handleAddKeyword, variant: "outline", size: "sm", children: _jsx(Plus, { className: "h-4 w-4" }) })] }), _jsx("div", { className: "flex flex-wrap gap-1", children: formData.keywords.map((keyword) => (_jsxs(Badge, { variant: "outline", className: "flex items-center gap-1", children: [keyword, _jsx("button", { onClick: () => handleRemoveKeyword(keyword), children: _jsx(X, { className: "h-3 w-3" }) })] }, keyword))) })] })] }) }), _jsx(TabsContent, { value: "settings", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-medium", children: "Student Interaction" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Enable Comments" }), _jsx("p", { className: "text-xs", style: { color: 'var(--course-builder-text-muted)' }, children: "Allow students to comment on lessons" })] }), _jsx(Switch, { checked: formData.enableComments, onCheckedChange: (checked) => setFormData(prev => ({ ...prev, enableComments: checked })) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Enable Downloads" }), _jsx("p", { className: "text-xs", style: { color: 'var(--course-builder-text-muted)' }, children: "Allow downloading course materials" })] }), _jsx(Switch, { checked: formData.enableDownloads, onCheckedChange: (checked) => setFormData(prev => ({ ...prev, enableDownloads: checked })) })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-medium", children: "Completion & Certification" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Enable Certificates" }), _jsx("p", { className: "text-xs", style: { color: 'var(--course-builder-text-muted)' }, children: "Issue certificates upon completion" })] }), _jsx(Switch, { checked: formData.enableCertificates, onCheckedChange: (checked) => setFormData(prev => ({ ...prev, enableCertificates: checked })) })] })] })] }) })] }) }), _jsxs(DialogFooter, { className: "mt-6", children: [_jsx(Button, { variant: "outline", onClick: onClose, disabled: isSaving, children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: isSaving || !formData.title.trim(), children: isSaving ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" }), "Saving..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Save Changes"] })) })] })] }) }));
}
