import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Save, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Tag, 
  Settings, 
  Users, 
  Calendar,
  Globe,
  Lock,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import type { Course } from '@/types/core';
import { useCourse } from '@/core/course-context';

interface CourseDetailsProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedCourse: Course) => void;
}

interface FormData {
  title: string;
  description: string;
  coverImage: string;
  tags: string[];
  isPaid: boolean;
  accessLevel: 'free' | 'paid' | 'premium';
  requiredPlan: 'basic' | 'pro' | 'enterprise';
  stripeProductId: string;
  // Additional metadata
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  estimatedHours: number;
  // SEO and marketing
  shortDescription: string;
  keywords: string[];
  // Advanced settings
  allowPreview: boolean;
  enableComments: boolean;
  enableDownloads: boolean;
  enableCertificates: boolean;
  maxStudents: number;
  // Instructor info
  instructorName: string;
  instructorBio: string;
  // Pricing
  price: number;
  currency: string;
  discountPrice?: number;
}

export function CourseDetails({ course, isOpen, onClose, onSave }: CourseDetailsProps) {
  const { updateCourse } = useCourse();
  const [formData, setFormData] = useState<FormData>({
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
      const totalMinutes = course.modules.reduce(
        (total, module) => total + module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
        0
      );
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
        category: (course as any).category || '',
        difficulty: (course as any).difficulty || 'beginner',
        language: (course as any).language || 'English',
        estimatedHours,
        shortDescription: (course as any).shortDescription || '',
        keywords: (course as any).keywords || [],
        allowPreview: (course as any).allowPreview !== false,
        enableComments: (course as any).enableComments !== false,
        enableDownloads: (course as any).enableDownloads || false,
        enableCertificates: (course as any).enableCertificates || false,
        maxStudents: (course as any).maxStudents || 0,
        instructorName: (course as any).instructorName || '',
        instructorBio: (course as any).instructorBio || '',
        price: (course as any).price || 0,
        currency: (course as any).currency || 'USD',
        discountPrice: (course as any).discountPrice
      });
    }
  }, [course]);

  const handleSave = async () => {
    if (!course) return;

    try {
      setIsSaving(true);

      const updatedCourse: Course = {
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
      } as Course;

      await updateCourse(updatedCourse);
      onSave?.(updatedCourse);
      onClose();
    } catch (error) {
      console.error('Failed to save course details:', error);
    } finally {
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

  const handleRemoveTag = (tagToRemove: string) => {
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

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload to a file service
      // For now, we'll create a placeholder URL
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, coverImage: imageUrl }));
      setImageUploadError('');
    }
  };

  const validateImageUrl = (url: string) => {
    // Basic URL validation
    try {
      new URL(url);
      setImageUploadError('');
      return true;
    } catch {
      setImageUploadError('Please enter a valid URL');
      return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Course Details
          </DialogTitle>
          <DialogDescription>
            Edit comprehensive course information, settings, and metadata.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Course Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter course title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Short Description</label>
                    <Input
                      value={formData.shortDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                      placeholder="Brief course description for listings"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border rounded-md" style={{ borderColor: 'var(--course-builder-border)' }}
                    >
                      <option value="">Select Category</option>
                      <option value="web-development">Web Development</option>
                      <option value="data-science">Data Science</option>
                      <option value="design">Design</option>
                      <option value="business">Business</option>
                      <option value="marketing">Marketing</option>
                      <option value="photography">Photography</option>
                      <option value="music">Music</option>
                      <option value="language">Language</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                      className="w-full p-2 border rounded-md" style={{ borderColor: 'var(--course-builder-border)' }}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full p-2 border rounded-md" style={{ borderColor: 'var(--course-builder-border)' }}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cover Image</label>
                    <div className="space-y-2">
                      <Input
                        value={formData.coverImage}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, coverImage: e.target.value }));
                          if (e.target.value) validateImageUrl(e.target.value);
                        }}
                        placeholder="Enter image URL"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--course-builder-text-muted)' }}>or</span>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button variant="outline" size="sm" type="button">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Image
                          </Button>
                        </label>
                      </div>
                      {imageUploadError && (
                        <p className="text-sm" style={{ color: 'var(--course-builder-error, #ef4444)' }}>{imageUploadError}</p>
                      )}
                      {formData.coverImage && (
                        <div className="mt-2">
                          <img
                            src={formData.coverImage}
                            alt="Course cover"
                            className="w-full h-32 object-cover rounded border"
                            onError={() => setImageUploadError('Failed to load image')}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Instructor Name</label>
                    <Input
                      value={formData.instructorName}
                      onChange={(e) => setFormData(prev => ({ ...prev, instructorName: e.target.value }))}
                      placeholder="Instructor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estimated Duration</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={formData.estimatedHours}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                        step="0.5"
                        min="0"
                      />
                      <span className="text-sm" style={{ color: 'var(--course-builder-text-muted)' }}>hours</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Course Statistics</label>
                    <div className="space-y-2 text-sm p-3 rounded" style={{ color: 'var(--course-builder-text-secondary)', backgroundColor: 'var(--course-builder-bg-muted)' }}>
                      <div className="flex justify-between">
                        <span>Modules:</span>
                        <span>{course?.modules.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Lessons:</span>
                        <span>
                          {course?.modules.reduce((total, module) => total + module.lessons.length, 0) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Duration:</span>
                        <span>{formData.estimatedHours} hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed course description"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Instructor Bio</label>
                <Textarea
                  value={formData.instructorBio}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructorBio: e.target.value }))}
                  placeholder="Brief bio about the instructor"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Content */}
            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      />
                      <Button onClick={handleAddTag} variant="outline" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </TabsContent>

            {/* Pricing */}
            <TabsContent value="pricing" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Access Level</label>
                    <select
                      value={formData.accessLevel}
                      onChange={(e) => {
                        const level = e.target.value as 'free' | 'paid' | 'premium';
                        setFormData(prev => ({ 
                          ...prev, 
                          accessLevel: level, 
                          isPaid: level !== 'free' 
                        }));
                      }}
                      className="w-full p-2 border rounded-md" style={{ borderColor: 'var(--course-builder-border)' }}
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>

                  {formData.accessLevel !== 'free' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Required Plan</label>
                        <select
                          value={formData.requiredPlan}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            requiredPlan: e.target.value as 'basic' | 'pro' | 'enterprise' 
                          }))}
                          className="w-full p-2 border rounded-md" style={{ borderColor: 'var(--course-builder-border)' }}
                        >
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Stripe Product ID</label>
                        <Input
                          value={formData.stripeProductId}
                          onChange={(e) => setFormData(prev => ({ ...prev, stripeProductId: e.target.value }))}
                          placeholder="prod_xxxxxxxxx"
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--course-builder-text-muted)' }}>Enter the Stripe product ID for this course</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Price</label>
                        <div className="flex gap-2">
                          <select
                            value={formData.currency}
                            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                            className="w-20 p-2 border rounded-md" style={{ borderColor: 'var(--course-builder-border)' }}
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                          <Input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Discount Price (Optional)</label>
                        <Input
                          type="number"
                          value={formData.discountPrice || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            discountPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                          }))}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Enrollment Limits</label>
                    <Input
                      type="number"
                      value={formData.maxStudents || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        maxStudents: e.target.value ? parseInt(e.target.value) : 0 
                      }))}
                      placeholder="Unlimited"
                      min="0"
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--course-builder-text-muted)' }}>Leave empty or 0 for unlimited enrollment</p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium">Preview Access</label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.allowPreview}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowPreview: checked }))}
                      />
                      <span className="text-sm">Allow preview before purchase</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* SEO */}
            <TabsContent value="seo" className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">SEO Keywords</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Add a keyword"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                    />
                    <Button onClick={handleAddKeyword} variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" className="flex items-center gap-1">
                        {keyword}
                        <button onClick={() => handleRemoveKeyword(keyword)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Student Interaction</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Enable Comments</label>
                      <p className="text-xs" style={{ color: 'var(--course-builder-text-muted)' }}>Allow students to comment on lessons</p>
                    </div>
                    <Switch
                      checked={formData.enableComments}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableComments: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Enable Downloads</label>
                      <p className="text-xs" style={{ color: 'var(--course-builder-text-muted)' }}>Allow downloading course materials</p>
                    </div>
                    <Switch
                      checked={formData.enableDownloads}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableDownloads: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Completion & Certification</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Enable Certificates</label>
                      <p className="text-xs" style={{ color: 'var(--course-builder-text-muted)' }}>Issue certificates upon completion</p>
                    </div>
                    <Switch
                      checked={formData.enableCertificates}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableCertificates: checked }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !formData.title.trim()}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}