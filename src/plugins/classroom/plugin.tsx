import React from 'react';
import { Plugin, PluginFactory } from '@/core/plugin-manager';
import { CommunityContext } from '../../types/multi-tenant';
import { CourseProvider } from '@/core/course-context';

// Import course builder public API
import { useCourseBuilderComponent } from '../course-builder';

// Skool-style course display component
interface Course {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  progress: number;
  modules: any[];
}

const SkoolCourseDisplay: React.FC<{
  courses: Course[];
  onCourseSelect: (courseId: string) => void;
  onCourseEdit: (courseId: string) => void;
  onAddCourse: () => void;
  showAddButton: boolean;
  currentPage: number;
  totalPages: number;
  totalCourses: number;
}> = ({ 
  courses, 
  onCourseSelect, 
  onCourseEdit, 
  onAddCourse, 
  showAddButton,
  currentPage,
  totalPages,
  totalCourses 
}) => {
  return (
    <div className="space-y-6">
      {/* Add Course Button (if owner) */}
      {showAddButton && (
        <div className="flex justify-center">
          <button
            onClick={onAddCourse}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-lg">+</span>
            </div>
            <span className="text-sm">New course</span>
          </button>
        </div>
      )}

      {/* Course Cards - Single column layout */}
      <div className="space-y-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-2xl mx-auto cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onCourseSelect(course.id)}
          >
            {/* Cover Image Section */}
            <div className="h-48 bg-gray-100 flex items-center justify-center relative">
              {course.coverImage ? (
                <img 
                  src={course.coverImage} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">📚</div>
                  <div className="text-sm">Upload cover photo</div>
                </div>
              )}
              
              {/* Edit button for owners */}
              {showAddButton && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCourseEdit(course.id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Content Section */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {course.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {course.description}
              </p>
              
              {/* Progress Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-gray-700 font-medium">{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-8">
        <div className="flex items-center space-x-4">
          <button 
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`w-8 h-8 rounded flex items-center justify-center text-sm ${
                  page === currentPage
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button 
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
        
        <div className="text-sm text-gray-500">
          {totalCourses > 0 
            ? `${currentPage}-${currentPage} of ${totalCourses}`
            : '0 courses'
          }
        </div>
      </div>
    </div>
  );
};

export interface ClassroomConfig {
  apiUrl: string;
  ssr?: boolean;
  communityId?: string;
  // UI presentation modes - don't affect core course builder functionality
  presentation?: {
    mode?: 'default' | 'skool' | 'grid' | 'list' | 'custom';
    layout?: {
      columns?: number;
      cardStyle?: 'compact' | 'full' | 'minimal';
      showProgress?: boolean;
      showImages?: boolean;
    };
    interactions?: {
      hoverMenu?: boolean;
      contextActions?: boolean;
      modalEdit?: boolean;
    };
    navigation?: {
      pagination?: boolean;
      infiniteScroll?: boolean;
      perPage?: number;
    };
  };
  // Custom actions for community-specific needs
  customActions?: Array<{
    id: string;
    label: string;
    icon?: string;
    handler: (courseId: string) => void;
    condition?: (course: Course) => boolean;
  }>;
  // Course builder integration - uses existing UI when needed
  courseBuilder?: {
    enableInlineEdit?: boolean;
    showManagementUI?: boolean;
    allowCreation?: boolean;
  };
}

export interface ClassroomState {
  activeView: 'list' | 'create' | 'edit' | 'view';
  selectedCourseId: string | null;
  loading: boolean;
  error: string | null;
}

// Classroom Service
export class ClassroomService {
  private config: ClassroomConfig;

  constructor(config: ClassroomConfig) {
    this.config = config;
  }

  // Course management within community context
  async getCommunityCourses(communityId: string) {
    // Integration with existing course data
    return [];
  }

  // Navigation helpers
  getViewRoute(communityId: string, view: string, courseId?: string): string {
    return `/community/${communityId}/classroom/${view}${courseId ? `/${courseId}` : ''}`;
  }
}

// Course Dropdown Menu Component
const CourseDropdownMenu: React.FC<{
  courseId: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ courseId, onEdit, onDuplicate, onShare, onDelete, onClose }) => {
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div className="absolute top-12 right-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
      >
        Edit course
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-100"
        disabled
      >
        <div className="flex items-center">
          <span>Move</span>
          <span className="ml-2">←</span>
        </div>
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-100"
        disabled
      >
        <div className="flex items-center">
          <span>Move</span>
          <span className="ml-2">→</span>
        </div>
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        Duplicate course
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShare();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        Share course key
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        Delete course
      </button>
    </div>
  );
};

// Edit Course Modal Component
const EditCourseModal: React.FC<{
  course: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (courseData: any) => void;
}> = ({ course, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = React.useState({
    title: course?.title || '',
    description: course?.description || '',
    accessType: 'open',
    published: true
  });

  React.useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        accessType: 'open',
        published: true
      });
    }
  }, [course]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Edit course</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
            onClose();
          }}>
            {/* Course Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course name
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.title.length} / 50
              </div>
            </div>

            {/* Course Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.description.length} / 500
              </div>
            </div>

            {/* Access Type */}
            <div className="mb-6">
              <div className="grid grid-cols-5 gap-3">
                {[
                  { id: 'open', label: 'Open', desc: 'All members can access.' },
                  { id: 'level', label: 'Level unlock', desc: 'Members unlock at a specific level.' },
                  { id: 'buy', label: 'Buy now', desc: 'Members pay a 1-time price to unlock.' },
                  { id: 'time', label: 'Time unlock', desc: 'Members unlock after x days.' },
                  { id: 'private', label: 'Private', desc: 'Members you select can access.' }
                ].map((option) => (
                  <div key={option.id} className="text-center">
                    <input
                      type="radio"
                      id={option.id}
                      name="accessType"
                      value={option.id}
                      checked={formData.accessType === option.id}
                      onChange={(e) => setFormData({...formData, accessType: e.target.value})}
                      className="mb-2"
                    />
                    <label htmlFor={option.id} className="block">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Cover Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">1460 x 752 px</span>
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    className="ml-4 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    CHANGE
                  </button>
                </div>
              </div>
            </div>

            {/* Published Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-3">Published</span>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, published: !formData.published})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.published ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm font-medium"
              >
                SAVE
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface ClassroomContentProps {
  communityId: string;
  context?: CommunityContext;
  initialView?: string;
  courseId?: string;
  config?: ClassroomConfig;
  
  // Data from host app
  courses: Course[];
  loading: boolean;
  error?: string;
  
  // Action callbacks to host app
  onCreateCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
  onLoadCourses: () => Promise<void>;
}

// Inner component that uses course context
const ClassroomContent: React.FC<ClassroomContentProps> = ({ 
  communityId, 
  context, 
  initialView = 'list',
  courseId,
  config,
  courses,
  loading,
  error,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onLoadCourses
}) => {
  const [activeView, setActiveView] = React.useState<'list' | 'create' | 'edit' | 'view'>(initialView as any);
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(courseId || null);
  const [showDropdownMenu, setShowDropdownMenu] = React.useState<string | null>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);

  // Get components from course builder plugin
  const CreateCourseForm = useCourseBuilderComponent('CreateCourseForm');
  const CourseEditor = useCourseBuilderComponent('CourseEditor');
  const CourseViewer = useCourseBuilderComponent('CourseViewer');

  // Don't render if components aren't available yet
  if (!CreateCourseForm || !CourseEditor || !CourseViewer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading classroom components...</div>
      </div>
    );
  }

  // Get services from plugin manager first
  const classroomService = (window as any).__pluginManager?.getState('classroomService') as ClassroomService;
  const pluginConfig = (window as any).__pluginManager?.getState('classroomConfig') as ClassroomConfig;

  // Configuration with defaults - use passed config or plugin config
  const configToUse = config || pluginConfig;
  const uiConfig = {
    uiMode: configToUse?.uiMode || 'default',
    features: {
      hoverMenu: configToUse?.features?.hoverMenu ?? false,
      contextActions: configToUse?.features?.contextActions ?? false,
      modalEdit: configToUse?.features?.modalEdit ?? false,
      progressTracking: configToUse?.features?.progressTracking ?? true,
      pagination: configToUse?.features?.pagination ?? true,
      ...configToUse?.features
    },
    customActions: configToUse?.customActions || []
  };

  // Enable Skool features if uiMode is 'skool'
  if (uiConfig.uiMode === 'skool') {
    uiConfig.features.hoverMenu = true;
    uiConfig.features.contextActions = true;
    uiConfig.features.modalEdit = true;
  }

  // Load courses when component mounts
  React.useEffect(() => {
    console.log('ClassroomContent mounting, loading courses...');
    onLoadCourses().then(() => {
      console.log('Courses loaded successfully');
    }).catch((error) => {
      console.error('Failed to load courses:', error);
    });
  }, [onLoadCourses]);

  // Community context (real or mock)
  const communityContext = context || {
    community: {
      id: communityId,
      name: 'Demo Community',
      slug: 'demo-community',
      description: 'A demo community for testing',
      ownerId: 'user-1',
      moderators: [],
      access: 'free' as const,
      settings: {
        approval: 'instant' as const,
        visibility: 'public' as const,
        inviteOnly: false,
        features: {
          courses: true,
          events: true,
          messaging: true,
          leaderboard: true,
          badges: true,
          merch: true
        },
        gamification: {
          pointsPerLike: 1,
          pointsPerPost: 5,
          pointsPerComment: 2,
          enableLevels: true,
          customBadges: []
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          weeklyDigest: true
        }
      },
      stats: {
        memberCount: 1250,
        postCount: 3420,
        courseCount: 12,
        eventCount: 8,
        monthlyRevenue: 2500,
        totalRevenue: 30000,
        growthRate: 0.15
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    currentUser: {
      id: 'user-1',
      email: 'demo@example.com',
      profile: { displayName: 'Demo User' },
      createdAt: new Date(),
      updatedAt: new Date(),
      ownedCommunities: [communityId],
      memberships: []
    },
    membership: null,
    permissions: ['posts:create', 'posts:like', 'community:manage', 'courses:create', 'courses:edit'],
    isOwner: true,
    isModerator: false,
    isMember: true
  };

  const renderContent = () => {
    switch (activeView) {
      case 'create':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Create New Course</h2>
                <button
                  onClick={() => setActiveView('list')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back to Courses
                </button>
              </div>
              
              <CreateCourseForm
                onSuccess={() => {
                  console.log('Course created successfully');
                  onLoadCourses(); // Reload courses to show the new one
                  setActiveView('list');
                }}
                onCancel={() => setActiveView('list')}
                onCreateCourse={onCreateCourse}
              />
            </div>
          </div>
        );

      case 'edit':
        if (!selectedCourseId) {
          setActiveView('list');
          return null;
        }
        return (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Edit Course</h2>
                <button
                  onClick={() => setActiveView('list')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back to Courses
                </button>
              </div>
              
              {/* Simple Edit Form */}
              {(() => {
                const course = courses.find(c => c.id === selectedCourseId);
                if (!course) {
                  return <div>Course not found</div>;
                }
                
                return (
                  <form className="space-y-6" onSubmit={(e) => {
                    e.preventDefault();
                    console.log('Course updated');
                    onLoadCourses(); // Reload courses
                    setActiveView('list');
                  }}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Title
                      </label>
                      <input
                        type="text"
                        defaultValue={course.title}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        defaultValue={course.description}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Update Course
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveView('list')}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                );
              })()}
            </div>
          </div>
        );

      case 'view':
        if (!selectedCourseId) {
          setActiveView('list');
          return null;
        }
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Course Viewer</h2>
                <button
                  onClick={() => setActiveView('list')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back to Courses
                </button>
              </div>
              {/* Simple Course Viewer */}
              {(() => {
                const course = courses.find(c => c.id === selectedCourseId);
                if (!course) {
                  return <div>Course not found</div>;
                }
                
                return (
                  <div className="space-y-6">
                    <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                      {course.coverImage ? (
                        <img src={course.coverImage} alt={course.title} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="text-center text-gray-500">
                          <div className="text-4xl mb-2">📚</div>
                          <div>No cover image</div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold mb-4">{course.title}</h3>
                      <p className="text-gray-600 mb-6">{course.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Course Details</h4>
                          <p className="text-sm text-gray-600">Created: {course.createdAt.toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">Modules: {course.modules.length}</p>
                          <p className="text-sm text-gray-600">Category: {course.category || 'General'}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Progress</h4>
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div className="bg-blue-600 h-3 rounded-full" style={{ width: '0%' }}></div>
                          </div>
                          <p className="text-sm text-gray-600">0% Complete</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );

      case 'list':
      default:
        return (
          <div className="space-y-6">
            {/* Course Display */}
            <div className="flex items-start space-x-6">
              {/* Course Cards */}
              {courses.length > 0 ? (
                <div className="flex flex-wrap gap-6">
                  {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group" style={{width: '320px'}}>
                      {/* Cover Image Section */}
                      <div 
                        className="h-48 bg-gray-500 flex items-center justify-center cursor-pointer relative"
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setActiveView('view');
                        }}
                      >
                        {course.coverImage ? (
                          <img 
                            src={course.coverImage} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <div className="text-4xl mb-2">📚</div>
                            <div className="text-sm">No cover image</div>
                          </div>
                        )}
                        
                        {/* Three Dots Menu - Only show if hover menu is enabled and user is owner */}
                        {uiConfig.features.hoverMenu && communityContext.isOwner && (
                          <button
                            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDropdownMenu(showDropdownMenu === course.id ? null : course.id);
                            }}
                          >
                            <span className="text-gray-600">•••</span>
                          </button>
                        )}
                        
                        {/* Dropdown Menu - Only show if context actions are enabled */}
                        {uiConfig.features.contextActions && showDropdownMenu === course.id && (
                          <CourseDropdownMenu
                            courseId={course.id}
                            onEdit={() => {
                              setSelectedCourseId(course.id);
                              if (uiConfig.features.modalEdit) {
                                setShowEditModal(true);
                              } else {
                                setActiveView('edit');
                              }
                            }}
                            onDuplicate={() => {
                              console.log('Duplicate course:', course.id);
                            }}
                            onShare={() => {
                              console.log('Share course:', course.id);
                            }}
                            onDelete={() => {
                              console.log('Delete course:', course.id);
                            }}
                            onClose={() => setShowDropdownMenu(null)}
                          />
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          {course.description}
                        </p>
                        
                        {/* Progress Section */}
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                          </div>
                          <div className="text-xs text-gray-500">0%</div>
                        </div>

                        {/* Action Buttons */}
                        {communityContext.isOwner && (
                          <div className="mt-4 flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedCourseId(course.id);
                                setActiveView('edit');
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCourseId(course.id);
                                setActiveView('view');
                              }}
                              className="text-xs text-gray-600 hover:text-gray-800"
                            >
                              View
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Show default "Sample Course" when no courses exist */
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{width: '320px'}}>
                  <div className="h-48 bg-gray-500 flex items-center justify-center">
                    {/* Empty gray area like in screenshot */}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Sample Course
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Som great description
                    </p>
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-300 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                      <div className="text-xs text-gray-500">0%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Course Button - To the right like in screenshot */}
              {communityContext.isOwner && (
                <button
                  onClick={() => setActiveView('create')}
                  className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors mt-6"
                >
                  <span className="text-2xl">+</span>
                  <span className="text-sm">New course</span>
                </button>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-8">
              <div className="flex items-center space-x-4">
                <button className="text-gray-400 text-sm">
                  ← Previous
                </button>
                
                <div className="flex items-center space-x-2">
                  <button className="w-8 h-8 rounded-full bg-yellow-400 text-black text-sm font-medium flex items-center justify-center">
                    1
                  </button>
                </div>
                
                <button className="text-gray-400 text-sm">
                  Next →
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                {courses.length > 0 ? `1-${courses.length} of ${courses.length}` : '1-1 of 1'}
              </div>
            </div>
          </div>
        );
    }
  };

  // Debug loading state
  console.log('ClassroomContent render - loading:', loading, 'courses:', courses.length);

  // Temporarily disable loading check to see what renders
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="text-gray-500">Loading classroom...</div>
  //     </div>
  //   );
  // }

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Skool-style Header with Tabs */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">🦉</span>
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900">testxx</h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="hidden md:block">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-64 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                
                {/* Notifications and User */}
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  </svg>
                </button>
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">T</span>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="flex space-x-8">
              {['Community', 'Classroom', 'Calendar', 'Members', 'Map', 'Leaderboards', 'About'].map((tab) => (
                <button
                  key={tab}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    tab === 'Classroom'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main Layout with Sidebar */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">🦉</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{communityContext.community?.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {communityContext.community?.description || 'Community description'}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {renderContent()}
            </div>
          </div>
        </div>
        
        {/* Edit Course Modal - Only show if modal editing is enabled */}
        {uiConfig.features.modalEdit && showEditModal && selectedCourseId && (
          <EditCourseModal
            course={courses.find(c => c.id === selectedCourseId)}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedCourseId(null);
            }}
            onSave={(courseData) => {
              console.log('Saving course data:', courseData);
              onLoadCourses(); // Reload courses to show updates
            }}
          />
        )}
      </div>
  );
};

interface ClassroomPageProps {
  communityId: string;
  context?: CommunityContext;
  initialView?: string;
  courseId?: string;
  config?: ClassroomConfig;
  
  // Data from host app
  courses: Course[];
  loading: boolean;
  error?: string;
  
  // Action callbacks to host app
  onCreateCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
  onLoadCourses: () => Promise<void>;
}

// Main Classroom Component with CourseProvider
const ClassroomPage: React.FC<ClassroomPageProps> = (props) => {
  return (
    <CourseProvider>
      <ClassroomContent {...props} />
    </CourseProvider>
  );
};

// Plugin factory
export const createClassroomPlugin: PluginFactory<ClassroomConfig> = (config) => {
  const classroomService = new ClassroomService(config);

  return {
    name: 'classroom',
    version: '1.0.0',
    dependencies: ['course-builder'],
    
    components: {
      ClassroomPage,
      SkoolCourseDisplay
    },
    
    hooks: {
      useClassroom: (communityId: string) => {
        const [activeView, setActiveView] = React.useState('list');
        const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(null);
        const [loading, setLoading] = React.useState(false);
        
        return {
          activeView,
          setActiveView,
          selectedCourseId,
          setSelectedCourseId,
          loading,
          navigateToView: (view: string, courseId?: string) => {
            setActiveView(view);
            if (courseId) setSelectedCourseId(courseId);
            return classroomService.getViewRoute(communityId, view, courseId);
          }
        };
      }
    },
    
    routes: [
      {
        path: '/community/:communityId/classroom',
        component: 'ClassroomPage',
        exact: false
      },
      {
        path: '/community/:communityId/classroom/:view',
        component: 'ClassroomPage',
        exact: false
      },
      {
        path: '/community/:communityId/classroom/:view/:courseId',
        component: 'ClassroomPage',
        exact: true
      }
    ],
    
    onInit: async (manager) => {
      manager.setState('classroomService', classroomService);
      manager.setState('classroomConfig', config);
      console.log('Classroom plugin initialized');
    },
    
    onDestroy: async () => {
      console.log('Classroom plugin destroyed');
    }
  };
};