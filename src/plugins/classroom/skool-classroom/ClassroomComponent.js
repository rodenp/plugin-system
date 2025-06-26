import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { defaultTheme } from '@plugin-shared/default-theme';
import { useCourseBuilderComponent } from '@/plugins/course-builder';
import { useCourse } from '@core/course-context';
export const ClassroomComponent = ({ currentUser, communityId, community, userRole, theme = defaultTheme, onCreateCourse, courses: propCourses, loading: propLoading, onDeleteCourse, onUpdateCourse: propUpdateCourse, onCloneCourse, savingStates = {} }) => {
    const [view, setView] = React.useState('list');
    const [selectedCourseId, setSelectedCourseId] = React.useState(null);
    const [showCreateDialog, setShowCreateDialog] = React.useState(false);
    const [activeDropdown, setActiveDropdown] = React.useState(null);
    const { courses: contextCourses, loading: contextLoading, error, deleteCourse: contextDeleteCourse, cloneCourse: contextCloneCourse, updateCourse: contextUpdateCourse, loadCourse } = useCourse();
    // Use courses from props if available, otherwise fall back to context
    const courses = propCourses || contextCourses;
    const loading = propLoading !== undefined ? propLoading : contextLoading;
    const deleteCourse = onDeleteCourse || contextDeleteCourse;
    const updateCourse = propUpdateCourse || contextUpdateCourse;
    const cloneCourse = onCloneCourse || contextCloneCourse;
    const CourseViewer = useCourseBuilderComponent('CourseViewer');
    const CourseEditor = useCourseBuilderComponent('CourseEditor');
    const CreateCourseForm = useCourseBuilderComponent('CreateCourseForm');
    React.useEffect(() => {
        console.log('ClassroomComponent: CourseEditor reference changed:', CourseEditor?.name || 'null');
        console.log('ClassroomComponent: CourseViewer available:', !!CourseViewer);
        console.log('ClassroomComponent: CreateCourseForm available:', !!CreateCourseForm);
        console.log('ClassroomComponent: Global components:', !!window.__courseFrameworkComponents);
    }, [CourseEditor, CourseViewer, CreateCourseForm]);
    React.useEffect(() => {
        const handleClickOutside = () => {
            setActiveDropdown(null);
        };
        if (activeDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [activeDropdown]);
    // Check if components are available and valid React components
    const componentsReady = React.useMemo(() => {
        try {
            return CourseViewer && CourseEditor && CreateCourseForm &&
                typeof CourseViewer === 'function' &&
                typeof CourseEditor === 'function' &&
                typeof CreateCourseForm === 'function';
        }
        catch (error) {
            console.error('Error checking component readiness:', error);
            return false;
        }
    }, [CourseViewer, CourseEditor, CreateCourseForm]);
    if (!componentsReady) {
        return (_jsx("div", { style: { padding: theme.spacing.lg, textAlign: 'center' }, children: _jsx("div", { style: { color: theme.colors.textSecondary }, children: "Loading classroom components..." }) }));
    }
    const handleViewCourse = (courseId) => {
        setSelectedCourseId(courseId);
        setView('view');
    };
    const handleEditCourse = (courseId) => {
        setSelectedCourseId(courseId);
        setView('edit');
    };
    const handleBackToList = () => {
        setView('list');
        setSelectedCourseId(null);
    };
    const handleCreateCourse = () => {
        setShowCreateDialog(true);
    };
    const handleCreateSuccess = () => {
        setShowCreateDialog(false);
        setView('list');
    };
    const handleDropdownToggle = (courseId, event) => {
        event.stopPropagation();
        setActiveDropdown(activeDropdown === courseId ? null : courseId);
    };
    const handleDropdownAction = (action, courseId, event) => {
        event.stopPropagation();
        setActiveDropdown(null);
        switch (action) {
            case 'edit':
                handleEditCourse(courseId);
                break;
            case 'duplicate':
                cloneCourse(courseId);
                break;
            case 'delete':
                if (window.confirm('Are you sure you want to delete this course?')) {
                    deleteCourse(courseId);
                }
                break;
        }
    };
    if (loading) {
        return (_jsx("div", { style: { padding: theme.spacing.lg }, children: _jsxs("div", { style: {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borders.borderRadius,
                    boxShadow: theme.borders.boxShadow,
                    padding: theme.spacing.lg,
                    textAlign: 'center'
                }, children: [_jsx("div", { style: { height: '8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2", style: { borderColor: theme.colors.secondary } }) }), _jsx("p", { style: { color: theme.colors.textSecondary }, children: "Loading courses..." })] }) }));
    }
    if (error) {
        return (_jsx("div", { style: { padding: theme.spacing.lg }, children: _jsx("div", { style: {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borders.borderRadius,
                    boxShadow: theme.borders.boxShadow,
                    padding: theme.spacing.lg,
                    textAlign: 'center'
                }, children: _jsxs("p", { style: { color: theme.colors.error }, children: ["Error loading courses: ", error] }) }) }));
    }
    return (_jsxs("div", { className: "p-6", children: [_jsx("style", { children: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }), view === 'list' && (_jsx("div", { className: "max-w-6xl mx-auto", children: _jsxs("div", { style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, 300px)',
                        gap: theme.spacing.lg,
                        justifyContent: 'start'
                    }, children: [courses.filter(c => !c.isTemplate).map((course) => {
                            const saveState = savingStates[course.id] || 'idle';
                            return (_jsxs("div", { style: {
                                    background: theme.colors.surface,
                                    borderRadius: theme.borders.borderRadius,
                                    boxShadow: theme?.elevation?.shadow ?? '0 1px 2px rgba(0,0,0,0.1)',
                                    border: `1px solid ${saveState === 'error' ? '#ef4444' : saveState === 'saved' ? '#22c55e' : theme.borders.borderColor}`,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'box-shadow 0.2s, border-color 0.2s',
                                    opacity: saveState === 'saving' ? 0.7 : 1
                                }, onClick: () => handleViewCourse(course.id), onMouseEnter: (e) => { e.currentTarget.style.boxShadow = theme.elevation.shadowHover; }, onMouseLeave: (e) => { e.currentTarget.style.boxShadow = theme.elevation.shadow; }, children: [_jsxs("div", { style: {
                                            height: '8rem',
                                            backgroundColor: theme.colors.backgroundAlt,
                                            borderTopLeftRadius: theme.borders.borderRadius,
                                            borderTopRightRadius: theme.borders.borderRadius,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                        }, children: [course.coverImage ? (_jsx("img", { src: course.coverImage, alt: course.title, style: {
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    borderTopLeftRadius: theme.borders.borderRadius,
                                                    borderTopRightRadius: theme.borders.borderRadius
                                                } })) : (_jsx("span", { style: { color: theme.colors.textSecondary, fontSize: theme.font.sizeXs }, children: "Upload cover photo" })), _jsxs("div", { style: {
                                                    position: 'absolute',
                                                    top: '0.5rem',
                                                    right: '0.5rem',
                                                    zIndex: 1,
                                                }, children: [_jsx("button", { onClick: (e) => handleDropdownToggle(course.id, e), style: {
                                                            width: '2rem',
                                                            height: '2rem',
                                                            borderRadius: '9999px',
                                                            background: theme.colors.surface,
                                                            boxShadow: theme.elevation.shadow,
                                                            border: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer'
                                                        }, children: _jsx("svg", { width: "16", height: "16", fill: theme.colors.textSecondary, viewBox: "0 0 20 20", children: _jsx("path", { d: "M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" }) }) }), activeDropdown === course.id && (_jsxs("div", { style: {
                                                            position: 'absolute',
                                                            top: '2.5rem',
                                                            right: 0,
                                                            background: theme.colors.surface,
                                                            border: `1px solid ${theme.borders.borderColor}`,
                                                            borderRadius: theme.borders.borderRadius,
                                                            boxShadow: theme.elevation.shadow,
                                                            zIndex: 10,
                                                            width: '12rem',
                                                            overflow: 'hidden'
                                                        }, children: [_jsx("button", { onClick: (e) => handleDropdownAction('edit', course.id, e), style: menuItemStyle(theme), children: "Edit course" }), _jsx("button", { onClick: (e) => handleDropdownAction('duplicate', course.id, e), style: menuItemStyle(theme), children: "Duplicate course" }), _jsx("button", { onClick: (e) => handleDropdownAction('delete', course.id, e), style: menuItemStyle(theme, true, true), children: "Delete course" })] }))] })] }), _jsxs("div", { style: { padding: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }, children: [_jsx("h3", { style: {
                                                            fontSize: theme.font.sizeLg,
                                                            fontWeight: 600,
                                                            color: theme.colors.textPrimary,
                                                            flex: 1,
                                                            marginRight: '0.5rem'
                                                        }, children: course.title }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }, children: [saveState === 'saving' && (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                                                            width: '0.75rem',
                                                                            height: '0.75rem',
                                                                            border: '2px solid #e5e7eb',
                                                                            borderTop: '2px solid #3b82f6',
                                                                            borderRadius: '50%',
                                                                            animation: 'spin 1s linear infinite'
                                                                        } }), _jsx("span", { style: { color: '#6b7280' }, children: "Saving..." })] })), saveState === 'saved' && (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                                                            width: '0.75rem',
                                                                            height: '0.75rem',
                                                                            backgroundColor: '#22c55e',
                                                                            borderRadius: '50%'
                                                                        } }), _jsx("span", { style: { color: '#22c55e' }, children: "Saved" })] })), saveState === 'error' && (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                                                                            width: '0.75rem',
                                                                            height: '0.75rem',
                                                                            backgroundColor: '#ef4444',
                                                                            borderRadius: '50%'
                                                                        } }), _jsx("span", { style: { color: '#ef4444' }, children: "Error" })] }))] })] }), _jsx("p", { style: {
                                                    fontSize: theme.font.sizeSm,
                                                    color: theme.colors.textSecondary,
                                                    marginBottom: '0.5rem'
                                                }, children: course.description }), course.lastSaved && (_jsxs("p", { style: {
                                                    fontSize: '0.75rem',
                                                    color: theme.colors.textSecondary,
                                                    marginBottom: '0.75rem',
                                                    fontStyle: 'italic'
                                                }, children: ["Last saved: ", new Date(course.lastSaved).toLocaleString()] })), _jsxs("div", { children: [_jsxs("div", { style: {
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            fontSize: theme.font.sizeXs,
                                                            color: theme.colors.textSecondary,
                                                            marginBottom: '0.25rem'
                                                        }, children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [course.progress || 0, "%"] })] }), _jsx("div", { style: {
                                                            width: '100%',
                                                            height: '0.375rem',
                                                            backgroundColor: theme.colors.progressBackground,
                                                            borderRadius: '9999px'
                                                        }, children: _jsx("div", { style: {
                                                                width: `${course.progress || 0}%`,
                                                                height: '100%',
                                                                backgroundColor: theme.colors.progressForeground,
                                                                borderRadius: '9999px',
                                                                transition: 'width 0.3s'
                                                            } }) })] })] })] }, course.id));
                        }), _jsxs("div", { style: {
                                background: theme.colors.surface,
                                border: `2px dashed ${theme.borders.borderColor}`,
                                borderRadius: theme.borders.borderRadius,
                                cursor: 'pointer',
                                textAlign: 'center',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '300px'
                            }, onClick: handleCreateCourse, children: [_jsx("div", { style: {
                                        width: '8rem',
                                        height: '8rem',
                                        background: theme.colors.backgroundAlt,
                                        borderRadius: theme.borders.borderRadius,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '1rem'
                                    }, children: _jsx("span", { style: {
                                            color: theme.colors.textSecondary,
                                            fontSize: theme.font.sizeXs
                                        }, children: "Upload cover photo" }) }), _jsx("h3", { style: {
                                        fontSize: theme.font.sizeLg,
                                        fontWeight: 600,
                                        marginBottom: '0.25rem',
                                        color: theme.colors.textPrimary
                                    }, children: "+ New course" }), _jsx("p", { style: {
                                        fontSize: theme.font.sizeXs,
                                        color: theme.colors.textSecondary
                                    }, children: "Click to create a new course" })] })] }) })), view === 'view' && selectedCourseId && (_jsxs("div", { style: { backgroundColor: theme.colors.surface, borderRadius: theme.borders.borderRadius, padding: '1rem' }, children: [_jsx("button", { onClick: handleBackToList, style: { color: theme.colors.secondary }, children: "\u2190 Back to Courses" }), _jsx(CourseViewer, { courseId: selectedCourseId, onBack: handleBackToList, course: courses.find(c => c.id === selectedCourseId) || null, onUpdateCourse: async (courseId, updates) => {
                            const course = courses.find(c => c.id === courseId);
                            if (course) {
                                const updatedCourse = { ...course, ...updates };
                                if (propUpdateCourse) {
                                    // Use prop handler if provided (expects courseId, updates)
                                    await propUpdateCourse(courseId, updates);
                                }
                                else if (contextUpdateCourse) {
                                    // Use context handler (expects full course object)
                                    await contextUpdateCourse(updatedCourse);
                                }
                            }
                        }, theme: theme })] })), view === 'edit' && selectedCourseId && (_jsxs("div", { style: { backgroundColor: theme.colors.surface, borderRadius: theme.borders.borderRadius, padding: '1rem' }, children: [_jsx("button", { onClick: handleBackToList, style: { color: theme.colors.secondary }, children: "\u2190 Back to Courses" }), _jsx(CourseEditor, { courseId: selectedCourseId, course: courses.find(c => c.id === selectedCourseId) || null, onSave: handleBackToList, onCancel: handleBackToList, loadCourse: loadCourse, onUpdateCourse: async (courseId, updates) => {
                            const course = courses.find(c => c.id === courseId);
                            if (course) {
                                const updatedCourse = { ...course, ...updates };
                                if (propUpdateCourse) {
                                    // Use prop handler if provided (expects courseId, updates)
                                    await propUpdateCourse(courseId, updates);
                                }
                                else if (contextUpdateCourse) {
                                    // Use context handler (expects full course object)
                                    await contextUpdateCourse(updatedCourse);
                                }
                            }
                        }, theme: theme })] })), showCreateDialog && (_jsx("div", { style: {
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50
                }, children: _jsxs("div", { style: {
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.borders.borderRadius,
                        padding: '1.5rem',
                        maxWidth: '600px',
                        width: '100%'
                    }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }, children: [_jsx("h2", { style: { fontSize: theme.font.sizeLg, fontWeight: 600 }, children: "Create Course" }), _jsx("button", { onClick: () => setShowCreateDialog(false), style: { color: theme.colors.textSecondary }, children: "\u2715" })] }), _jsx(CreateCourseForm, { onSuccess: handleCreateSuccess, onCancel: () => setShowCreateDialog(false), onCreateCourse: onCreateCourse || (async (courseData) => {
                                console.log('Creating course:', courseData);
                            }), theme: theme })] }) }))] }));
};
const menuItemStyle = (theme, isDanger = false, isLast = false) => ({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontSize: theme.font.sizeSm,
    color: isDanger ? theme.colors.error : theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    borderBottom: isLast ? 'none' : `1px solid ${theme.borders.borderColor}`,
    cursor: 'pointer'
});
