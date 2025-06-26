import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { CourseProvider } from '@/core/course-context';
// Import course builder public API
import { useCourseBuilderComponent } from '../course-builder';
const SkoolCourseDisplay = ({ courses, onCourseSelect, onCourseEdit, onAddCourse, showAddButton, currentPage, totalPages, totalCourses }) => {
    return (_jsxs("div", { className: "space-y-6", children: [showAddButton && (_jsx("div", { className: "flex justify-center", children: _jsxs("button", { onClick: onAddCourse, className: "flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors", children: [_jsx("div", { className: "w-8 h-8 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-gray-400 text-lg", children: "+" }) }), _jsx("span", { className: "text-sm", children: "New course" })] }) })), _jsx("div", { className: "space-y-6", children: courses.map((course) => (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-2xl mx-auto cursor-pointer hover:shadow-md transition-shadow", onClick: () => onCourseSelect(course.id), children: [_jsxs("div", { className: "h-48 bg-gray-100 flex items-center justify-center relative", children: [course.coverImage ? (_jsx("img", { src: course.coverImage, alt: course.title, className: "w-full h-full object-cover" })) : (_jsxs("div", { className: "text-center text-gray-500", children: [_jsx("div", { className: "text-4xl mb-2", children: "\uD83D\uDCDA" }), _jsx("div", { className: "text-sm", children: "Upload cover photo" })] })), showAddButton && (_jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        onCourseEdit(course.id);
                                    }, className: "absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50", children: _jsx("svg", { className: "w-4 h-4 text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" }) }) }))] }), _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: course.title }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: course.description }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center text-sm", children: [_jsx("span", { className: "text-gray-500", children: "Progress" }), _jsxs("span", { className: "text-gray-700 font-medium", children: [course.progress, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all duration-300", style: { width: `${course.progress}%` } }) })] })] })] }, course.id))) }), _jsxs("div", { className: "flex items-center justify-between mt-8", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { className: "text-gray-500 hover:text-gray-700 disabled:opacity-50", disabled: currentPage === 1, children: "Previous" }), _jsx("div", { className: "flex items-center space-x-2", children: Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (_jsx("button", { className: `w-8 h-8 rounded flex items-center justify-center text-sm ${page === currentPage
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'}`, children: page }, page))) }), _jsx("button", { className: "text-gray-500 hover:text-gray-700 disabled:opacity-50", disabled: currentPage === totalPages, children: "Next" })] }), _jsx("div", { className: "text-sm text-gray-500", children: totalCourses > 0
                            ? `${currentPage}-${currentPage} of ${totalCourses}`
                            : '0 courses' })] })] }));
};
// Classroom Service
export class ClassroomService {
    config;
    constructor(config) {
        this.config = config;
    }
    // Course management within community context
    async getCommunityCourses(communityId) {
        // Integration with existing course data
        return [];
    }
    // Navigation helpers
    getViewRoute(communityId, view, courseId) {
        return `/community/${communityId}/classroom/${view}${courseId ? `/${courseId}` : ''}`;
    }
}
// Course Dropdown Menu Component
const CourseDropdownMenu = ({ courseId, onEdit, onDuplicate, onShare, onDelete, onClose }) => {
    React.useEffect(() => {
        const handleClickOutside = () => onClose();
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [onClose]);
    return (_jsxs("div", { className: "absolute top-12 right-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]", children: [_jsx("button", { onClick: (e) => {
                    e.stopPropagation();
                    onEdit();
                    onClose();
                }, className: "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium", children: "Edit course" }), _jsx("button", { onClick: (e) => {
                    e.stopPropagation();
                    onDuplicate();
                    onClose();
                }, className: "w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-100", disabled: true, children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { children: "Move" }), _jsx("span", { className: "ml-2", children: "\u2190" })] }) }), _jsx("button", { onClick: (e) => {
                    e.stopPropagation();
                    onDuplicate();
                    onClose();
                }, className: "w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-100", disabled: true, children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { children: "Move" }), _jsx("span", { className: "ml-2", children: "\u2192" })] }) }), _jsx("button", { onClick: (e) => {
                    e.stopPropagation();
                    onDuplicate();
                    onClose();
                }, className: "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: "Duplicate course" }), _jsx("button", { onClick: (e) => {
                    e.stopPropagation();
                    onShare();
                    onClose();
                }, className: "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", children: "Share course key" }), _jsx("button", { onClick: (e) => {
                    e.stopPropagation();
                    onDelete();
                    onClose();
                }, className: "w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50", children: "Delete course" })] }));
};
// Edit Course Modal Component
const EditCourseModal = ({ course, isOpen, onClose, onSave }) => {
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
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsx("div", { className: "bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Edit course" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("form", { onSubmit: (e) => {
                            e.preventDefault();
                            onSave(formData);
                            onClose();
                        }, children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Course name" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", maxLength: 50 }), _jsxs("div", { className: "text-right text-xs text-gray-500 mt-1", children: [formData.title.length, " / 50"] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Course description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), rows: 4, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", maxLength: 500 }), _jsxs("div", { className: "text-right text-xs text-gray-500 mt-1", children: [formData.description.length, " / 500"] })] }), _jsx("div", { className: "mb-6", children: _jsx("div", { className: "grid grid-cols-5 gap-3", children: [
                                        { id: 'open', label: 'Open', desc: 'All members can access.' },
                                        { id: 'level', label: 'Level unlock', desc: 'Members unlock at a specific level.' },
                                        { id: 'buy', label: 'Buy now', desc: 'Members pay a 1-time price to unlock.' },
                                        { id: 'time', label: 'Time unlock', desc: 'Members unlock after x days.' },
                                        { id: 'private', label: 'Private', desc: 'Members you select can access.' }
                                    ].map((option) => (_jsxs("div", { className: "text-center", children: [_jsx("input", { type: "radio", id: option.id, name: "accessType", value: option.id, checked: formData.accessType === option.id, onChange: (e) => setFormData({ ...formData, accessType: e.target.value }), className: "mb-2" }), _jsxs("label", { htmlFor: option.id, className: "block", children: [_jsx("div", { className: "font-medium text-sm", children: option.label }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: option.desc })] })] }, option.id))) }) }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Cover" }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-gray-400 text-sm", children: "1460 x 752 px" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("button", { type: "button", className: "text-blue-600 hover:text-blue-800 text-sm", children: "Upload" }), _jsx("button", { type: "button", className: "ml-4 text-gray-600 hover:text-gray-800 text-sm", children: "CHANGE" })] })] })] }), _jsx("div", { className: "flex items-center justify-between mb-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "text-sm font-medium text-gray-700 mr-3", children: "Published" }), _jsx("button", { type: "button", onClick: () => setFormData({ ...formData, published: !formData.published }), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.published ? 'bg-green-600' : 'bg-gray-200'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.published ? 'translate-x-6' : 'translate-x-1'}` }) })] }) }), _jsxs("div", { className: "flex items-center justify-end space-x-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 text-sm text-gray-600 hover:text-gray-800", children: "CANCEL" }), _jsx("button", { type: "submit", className: "px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm font-medium", children: "SAVE" })] })] })] }) }) }));
};
// Inner component that uses course context
const ClassroomContent = ({ communityId, context, initialView = 'list', courseId, config, courses, loading, error, onCreateCourse, onUpdateCourse, onDeleteCourse, onLoadCourses }) => {
    const [activeView, setActiveView] = React.useState(initialView);
    const [selectedCourseId, setSelectedCourseId] = React.useState(courseId || null);
    const [showDropdownMenu, setShowDropdownMenu] = React.useState(null);
    const [showEditModal, setShowEditModal] = React.useState(false);
    // Get components from course builder plugin
    const CreateCourseForm = useCourseBuilderComponent('CreateCourseForm');
    const CourseEditor = useCourseBuilderComponent('CourseEditor');
    const CourseViewer = useCourseBuilderComponent('CourseViewer');
    // Don't render if components aren't available yet
    if (!CreateCourseForm || !CourseEditor || !CourseViewer) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("div", { className: "text-gray-500", children: "Loading classroom components..." }) }));
    }
    // Get services from plugin manager first
    const classroomService = window.__pluginManager?.getState('classroomService');
    const pluginConfig = window.__pluginManager?.getState('classroomConfig');
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
            access: 'free',
            settings: {
                approval: 'instant',
                visibility: 'public',
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
                return (_jsx("div", { className: "max-w-4xl mx-auto", children: _jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-semibold", children: "Create New Course" }), _jsx("button", { onClick: () => setActiveView('list'), className: "text-gray-500 hover:text-gray-700", children: "\u2190 Back to Courses" })] }), _jsx(CreateCourseForm, { onSuccess: () => {
                                    console.log('Course created successfully');
                                    onLoadCourses(); // Reload courses to show the new one
                                    setActiveView('list');
                                }, onCancel: () => setActiveView('list'), onCreateCourse: onCreateCourse })] }) }));
            case 'edit':
                if (!selectedCourseId) {
                    setActiveView('list');
                    return null;
                }
                return (_jsx("div", { className: "max-w-6xl mx-auto", children: _jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-semibold", children: "Edit Course" }), _jsx("button", { onClick: () => setActiveView('list'), className: "text-gray-500 hover:text-gray-700", children: "\u2190 Back to Courses" })] }), (() => {
                                const course = courses.find(c => c.id === selectedCourseId);
                                if (!course) {
                                    return _jsx("div", { children: "Course not found" });
                                }
                                return (_jsxs("form", { className: "space-y-6", onSubmit: (e) => {
                                        e.preventDefault();
                                        console.log('Course updated');
                                        onLoadCourses(); // Reload courses
                                        setActiveView('list');
                                    }, children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Course Title" }), _jsx("input", { type: "text", defaultValue: course.title, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }), _jsx("textarea", { rows: 4, defaultValue: course.description, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { type: "submit", className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700", children: "Update Course" }), _jsx("button", { type: "button", onClick: () => setActiveView('list'), className: "bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300", children: "Cancel" })] })] }));
                            })()] }) }));
            case 'view':
                if (!selectedCourseId) {
                    setActiveView('list');
                    return null;
                }
                return (_jsx("div", { className: "max-w-4xl mx-auto", children: _jsxs("div", { className: "bg-white rounded-lg shadow-sm p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-semibold", children: "Course Viewer" }), _jsx("button", { onClick: () => setActiveView('list'), className: "text-gray-500 hover:text-gray-700", children: "\u2190 Back to Courses" })] }), (() => {
                                const course = courses.find(c => c.id === selectedCourseId);
                                if (!course) {
                                    return _jsx("div", { children: "Course not found" });
                                }
                                return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-gray-100 h-64 rounded-lg flex items-center justify-center", children: course.coverImage ? (_jsx("img", { src: course.coverImage, alt: course.title, className: "max-h-full max-w-full object-contain" })) : (_jsxs("div", { className: "text-center text-gray-500", children: [_jsx("div", { className: "text-4xl mb-2", children: "\uD83D\uDCDA" }), _jsx("div", { children: "No cover image" })] })) }), _jsxs("div", { children: [_jsx("h3", { className: "text-2xl font-bold mb-4", children: course.title }), _jsx("p", { className: "text-gray-600 mb-6", children: course.description }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold mb-2", children: "Course Details" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Created: ", course.createdAt.toLocaleDateString()] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Modules: ", course.modules.length] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Category: ", course.category || 'General'] })] }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h4", { className: "font-semibold mb-2", children: "Progress" }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-3 mb-2", children: _jsx("div", { className: "bg-blue-600 h-3 rounded-full", style: { width: '0%' } }) }), _jsx("p", { className: "text-sm text-gray-600", children: "0% Complete" })] })] })] })] }));
                            })()] }) }));
            case 'list':
            default:
                return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-start space-x-6", children: [courses.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-6", children: courses.map((course) => (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group", style: { width: '320px' }, children: [_jsxs("div", { className: "h-48 bg-gray-500 flex items-center justify-center cursor-pointer relative", onClick: () => {
                                                    setSelectedCourseId(course.id);
                                                    setActiveView('view');
                                                }, children: [course.coverImage ? (_jsx("img", { src: course.coverImage, alt: course.title, className: "w-full h-full object-cover" })) : (_jsxs("div", { className: "text-center text-gray-400", children: [_jsx("div", { className: "text-4xl mb-2", children: "\uD83D\uDCDA" }), _jsx("div", { className: "text-sm", children: "No cover image" })] })), uiConfig.features.hoverMenu && communityContext.isOwner && (_jsx("button", { className: "absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", onClick: (e) => {
                                                            e.stopPropagation();
                                                            setShowDropdownMenu(showDropdownMenu === course.id ? null : course.id);
                                                        }, children: _jsx("span", { className: "text-gray-600", children: "\u2022\u2022\u2022" }) })), uiConfig.features.contextActions && showDropdownMenu === course.id && (_jsx(CourseDropdownMenu, { courseId: course.id, onEdit: () => {
                                                            setSelectedCourseId(course.id);
                                                            if (uiConfig.features.modalEdit) {
                                                                setShowEditModal(true);
                                                            }
                                                            else {
                                                                setActiveView('edit');
                                                            }
                                                        }, onDuplicate: () => {
                                                            console.log('Duplicate course:', course.id);
                                                        }, onShare: () => {
                                                            console.log('Share course:', course.id);
                                                        }, onDelete: () => {
                                                            console.log('Delete course:', course.id);
                                                        }, onClose: () => setShowDropdownMenu(null) }))] }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: course.title }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: course.description }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full", style: { width: '0%' } }) }), _jsx("div", { className: "text-xs text-gray-500", children: "0%" })] }), communityContext.isOwner && (_jsxs("div", { className: "mt-4 flex space-x-2", children: [_jsx("button", { onClick: () => {
                                                                    setSelectedCourseId(course.id);
                                                                    setActiveView('edit');
                                                                }, className: "text-xs text-blue-600 hover:text-blue-800", children: "Edit" }), _jsx("button", { onClick: () => {
                                                                    setSelectedCourseId(course.id);
                                                                    setActiveView('view');
                                                                }, className: "text-xs text-gray-600 hover:text-gray-800", children: "View" })] }))] })] }, course.id))) })) : (
                                /* Show default "Sample Course" when no courses exist */
                                _jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", style: { width: '320px' }, children: [_jsx("div", { className: "h-48 bg-gray-500 flex items-center justify-center" }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Sample Course" }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: "Som great description" }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-gray-300 h-2 rounded-full", style: { width: '0%' } }) }), _jsx("div", { className: "text-xs text-gray-500", children: "0%" })] })] })] })), communityContext.isOwner && (_jsxs("button", { onClick: () => setActiveView('create'), className: "flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors mt-6", children: [_jsx("span", { className: "text-2xl", children: "+" }), _jsx("span", { className: "text-sm", children: "New course" })] }))] }), _jsxs("div", { className: "flex items-center justify-between pt-8", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { className: "text-gray-400 text-sm", children: "\u2190 Previous" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsx("button", { className: "w-8 h-8 rounded-full bg-yellow-400 text-black text-sm font-medium flex items-center justify-center", children: "1" }) }), _jsx("button", { className: "text-gray-400 text-sm", children: "Next \u2192" })] }), _jsx("div", { className: "text-sm text-gray-500", children: courses.length > 0 ? `1-${courses.length} of ${courses.length}` : '1-1 of 1' })] })] }));
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
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white border-b border-gray-200", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6", children: [_jsxs("div", { className: "flex items-center justify-between py-4", children: [_jsx("div", { className: "flex items-center space-x-4", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-white font-semibold text-sm", children: "\uD83E\uDD89" }) }), _jsx("h1", { className: "text-xl font-semibold text-gray-900", children: "testxx" })] }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "hidden md:block", children: _jsx("input", { type: "text", placeholder: "Search", className: "w-64 px-3 py-2 border border-gray-300 rounded-md text-sm" }) }), _jsx("button", { className: "p-2 text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 17h5l-5 5v-5z" }) }) }), _jsx("button", { className: "p-2 text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 17h5l-5 5v-5z" }) }) }), _jsx("div", { className: "w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-sm font-medium text-white", children: "T" }) })] })] }), _jsx("nav", { className: "flex space-x-8", children: ['Community', 'Classroom', 'Calendar', 'Members', 'Map', 'Leaderboards', 'About'].map((tab) => (_jsx("button", { className: `py-4 px-1 border-b-2 font-medium text-sm transition-colors ${tab === 'Classroom'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: tab }, tab))) })] }) }), _jsx("div", { className: "max-w-7xl mx-auto px-6 py-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-4 gap-6", children: [_jsx("div", { className: "lg:col-span-1", children: _jsx("div", { className: "bg-white rounded-lg shadow-sm p-6", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-orange-500 rounded-lg mx-auto mb-4 flex items-center justify-center", children: _jsx("span", { className: "text-2xl", children: "\uD83E\uDD89" }) }), _jsx("h3", { className: "font-semibold text-lg mb-2", children: communityContext.community?.name }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: communityContext.community?.description || 'Community description' })] }) }) }), _jsx("div", { className: "lg:col-span-3", children: renderContent() })] }) }), uiConfig.features.modalEdit && showEditModal && selectedCourseId && (_jsx(EditCourseModal, { course: courses.find(c => c.id === selectedCourseId), isOpen: showEditModal, onClose: () => {
                    setShowEditModal(false);
                    setSelectedCourseId(null);
                }, onSave: (courseData) => {
                    console.log('Saving course data:', courseData);
                    onLoadCourses(); // Reload courses to show updates
                } }))] }));
};
// Main Classroom Component with CourseProvider
const ClassroomPage = (props) => {
    return (_jsx(CourseProvider, { children: _jsx(ClassroomContent, { ...props }) }));
};
// Plugin factory
export const createClassroomPlugin = (config) => {
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
            useClassroom: (communityId) => {
                const [activeView, setActiveView] = React.useState('list');
                const [selectedCourseId, setSelectedCourseId] = React.useState(null);
                const [loading, setLoading] = React.useState(false);
                return {
                    activeView,
                    setActiveView,
                    selectedCourseId,
                    setSelectedCourseId,
                    loading,
                    navigateToView: (view, courseId) => {
                        setActiveView(view);
                        if (courseId)
                            setSelectedCourseId(courseId);
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
