import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';
// ============================================================================
// COMPONENT
// ============================================================================
export const CoursePublishingComponent = ({ currentUser, communityId, community, userRole, theme, publishingInfo = {}, reviews = {}, marketplaceEntries = {}, selectedCourse, availableCourses = [], loading = false, error, onInitializeCoursePublishing, onSubmitForReview, onPublishCourse, onUnpublishCourse, onReviewCourse, onUpdateMarketplaceEntry, onUpdatePublishingInfo, onValidateCourse, }) => {
    // Apply theme
    const appliedTheme = theme || defaultTheme;
    // Local state
    const [activeTab, setActiveTab] = React.useState('overview');
    const [activeCourse, setActiveCourse] = React.useState(selectedCourse || availableCourses[0]?.id || '');
    const [editingInfo, setEditingInfo] = React.useState(false);
    const [showReviewModal, setShowReviewModal] = React.useState(false);
    const [validationErrors, setValidationErrors] = React.useState([]);
    // Get current course data
    const courseInfo = activeCourse ? publishingInfo[activeCourse] : null;
    const courseReviews = activeCourse ? reviews[activeCourse] || [] : [];
    const marketplaceEntry = activeCourse ? marketplaceEntries[activeCourse] : null;
    const currentCourse = availableCourses.find(c => c.id === activeCourse);
    // Computed values
    const totalCourses = Object.keys(publishingInfo).length;
    const publishedCourses = Object.values(publishingInfo).filter(c => c.status === 'published').length;
    const draftCourses = Object.values(publishingInfo).filter(c => c.status === 'draft').length;
    const reviewCourses = Object.values(publishingInfo).filter(c => c.status === 'review').length;
    // Helper functions
    const getStatusColor = (status) => {
        switch (status) {
            case 'published': return appliedTheme.colors.secondary;
            case 'review': return appliedTheme.colors.warning;
            case 'draft': return appliedTheme.colors.muted;
            case 'rejected': return appliedTheme.colors.danger;
            case 'archived': return appliedTheme.colors.textSecondary;
            default: return appliedTheme.colors.muted;
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'published': return '✅';
            case 'review': return '⏳';
            case 'draft': return '📝';
            case 'rejected': return '❌';
            case 'archived': return '📦';
            default: return '📝';
        }
    };
    const canSubmitForReview = (status) => {
        return status === 'draft' || status === 'rejected';
    };
    const canPublish = (status) => {
        return status === 'review' && (userRole === 'admin' || userRole === 'owner');
    };
    const canUnpublish = (status) => {
        return status === 'published';
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };
    // Event handlers
    const handleSubmitForReview = async () => {
        if (activeCourse && courseInfo && onSubmitForReview) {
            try {
                await onSubmitForReview(activeCourse, courseInfo);
            }
            catch (error) {
                console.error('Failed to submit for review:', error);
            }
        }
    };
    const handlePublishCourse = async () => {
        if (activeCourse && courseInfo && onPublishCourse) {
            try {
                await onPublishCourse(activeCourse, courseInfo);
            }
            catch (error) {
                console.error('Failed to publish course:', error);
            }
        }
    };
    const handleUnpublishCourse = async () => {
        if (activeCourse && onUnpublishCourse) {
            try {
                await onUnpublishCourse(activeCourse);
            }
            catch (error) {
                console.error('Failed to unpublish course:', error);
            }
        }
    };
    const handleValidateCourse = async () => {
        if (activeCourse && onValidateCourse) {
            try {
                const errors = await onValidateCourse(activeCourse);
                setValidationErrors(errors);
            }
            catch (error) {
                console.error('Failed to validate course:', error);
            }
        }
    };
    const handleUpdateInfo = async (updates) => {
        if (activeCourse && onUpdatePublishingInfo) {
            try {
                await onUpdatePublishingInfo(activeCourse, updates);
                setEditingInfo(false);
            }
            catch (error) {
                console.error('Failed to update publishing info:', error);
            }
        }
    };
    // Render helpers
    const renderTabNavigation = () => (React.createElement('div', {
        style: {
            display: 'flex',
            borderBottom: `1px solid ${appliedTheme.borders.borderColor}`,
            marginBottom: appliedTheme.spacing.lg
        }
    }, ['overview', 'publishing', 'marketplace', 'reviews'].map(tab => React.createElement('button', {
        key: tab,
        onClick: () => setActiveTab(tab),
        style: {
            padding: `${appliedTheme.spacing.md} ${appliedTheme.spacing.lg}`,
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === tab ? `2px solid ${appliedTheme.colors.secondary}` : '2px solid transparent',
            color: activeTab === tab ? appliedTheme.colors.secondary : appliedTheme.colors.textSecondary,
            fontWeight: activeTab === tab ? 600 : 'normal',
            cursor: 'pointer',
            textTransform: 'capitalize'
        }
    }, tab))));
    const renderCourseSelector = () => (React.createElement('div', {
        style: {
            marginBottom: appliedTheme.spacing.lg,
            padding: appliedTheme.spacing.md,
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('label', {
        style: {
            display: 'block',
            marginBottom: appliedTheme.spacing.sm,
            fontSize: appliedTheme.font.sizeSm,
            fontWeight: 600,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Select Course'), React.createElement('select', {
        value: activeCourse,
        onChange: (e) => setActiveCourse(e.target.value),
        style: {
            width: '100%',
            padding: appliedTheme.spacing.sm,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            backgroundColor: appliedTheme.colors.background
        }
    }, React.createElement('option', { value: '' }, 'Select a course...'), availableCourses.map(course => React.createElement('option', { key: course.id, value: course.id }, course.title)))));
    const renderOverview = () => (React.createElement('div', {}, React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: appliedTheme.spacing.lg,
            marginBottom: appliedTheme.spacing.xl
        }
    }, [
        { label: 'Total Courses', value: totalCourses },
        { label: 'Published', value: publishedCourses },
        { label: 'In Review', value: reviewCourses },
        { label: 'Drafts', value: draftCourses }
    ].map((stat, index) => React.createElement('div', {
        key: index,
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            textAlign: 'center'
        }
    }, React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            color: appliedTheme.colors.textPrimary,
            marginBottom: appliedTheme.spacing.xs
        }
    }, stat.value), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary
        }
    }, stat.label)))), 
    // All courses list
    React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('h3', {
        style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Course Publishing Status'), Object.keys(publishingInfo).length > 0 ? React.createElement('div', {
        style: {
            display: 'grid',
            gap: appliedTheme.spacing.md
        }
    }, Object.values(publishingInfo).map(info => {
        const course = availableCourses.find(c => c.id === info.courseId);
        return React.createElement('div', {
            key: info.courseId,
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: appliedTheme.spacing.md,
                backgroundColor: appliedTheme.colors.background,
                borderRadius: appliedTheme.borders.borderRadius,
                border: `1px solid ${appliedTheme.borders.borderColor}`
            }
        }, React.createElement('div', {
            style: { flex: 1 }
        }, React.createElement('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: appliedTheme.spacing.sm,
                marginBottom: appliedTheme.spacing.xs
            }
        }, React.createElement('span', {
            style: { fontSize: appliedTheme.font.sizeLg }
        }, getStatusIcon(info.status)), React.createElement('h4', {
            style: {
                fontSize: appliedTheme.font.sizeMd,
                fontWeight: 600,
                margin: 0,
                color: appliedTheme.colors.textPrimary
            }
        }, course?.title || info.metadata.title)), React.createElement('div', {
            style: {
                display: 'flex',
                gap: appliedTheme.spacing.lg,
                fontSize: appliedTheme.font.sizeSm,
                color: appliedTheme.colors.textSecondary
            }
        }, React.createElement('span', {
            style: {
                padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                borderRadius: appliedTheme.borders.borderRadius,
                backgroundColor: getStatusColor(info.status) + '20',
                color: getStatusColor(info.status),
                fontWeight: 500,
                textTransform: 'capitalize'
            }
        }, info.status), React.createElement('span', {}, `${info.pricing} • ${info.visibility}`), info.publishedAt && React.createElement('span', {}, `Published: ${formatDate(info.publishedAt)}`))), React.createElement('button', {
            onClick: () => {
                setActiveCourse(info.courseId);
                setActiveTab('publishing');
            },
            style: {
                padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                backgroundColor: appliedTheme.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeXs,
                cursor: 'pointer'
            }
        }, 'Manage'));
    })) : React.createElement('p', {
        style: {
            textAlign: 'center',
            color: appliedTheme.colors.textSecondary,
            margin: 0
        }
    }, 'No courses available for publishing.'))));
    const renderPublishing = () => (React.createElement('div', {}, renderCourseSelector(), !activeCourse ? React.createElement('p', {
        style: {
            textAlign: 'center',
            color: appliedTheme.colors.textSecondary,
            padding: appliedTheme.spacing.xl
        }
    }, 'Select a course to manage publishing settings.') :
        React.createElement('div', {}, 
        // Course info and actions
        React.createElement('div', {
            style: {
                backgroundColor: appliedTheme.colors.surface,
                borderRadius: appliedTheme.borders.borderRadius,
                padding: appliedTheme.spacing.lg,
                border: `1px solid ${appliedTheme.borders.borderColor}`,
                marginBottom: appliedTheme.spacing.lg
            }
        }, React.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: appliedTheme.spacing.md
            }
        }, React.createElement('div', {}, React.createElement('h3', {
            style: {
                fontSize: appliedTheme.font.sizeLg,
                fontWeight: 600,
                margin: 0,
                marginBottom: appliedTheme.spacing.xs,
                color: appliedTheme.colors.textPrimary
            }
        }, currentCourse?.title || courseInfo?.metadata.title), courseInfo && React.createElement('div', {
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: appliedTheme.spacing.sm
            }
        }, React.createElement('span', {
            style: { fontSize: appliedTheme.font.sizeLg }
        }, getStatusIcon(courseInfo.status)), React.createElement('span', {
            style: {
                padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                borderRadius: appliedTheme.borders.borderRadius,
                backgroundColor: getStatusColor(courseInfo.status) + '20',
                color: getStatusColor(courseInfo.status),
                fontWeight: 500,
                textTransform: 'capitalize'
            }
        }, courseInfo.status))), React.createElement('div', {
            style: {
                display: 'flex',
                gap: appliedTheme.spacing.sm
            }
        }, React.createElement('button', {
            onClick: handleValidateCourse,
            style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: appliedTheme.colors.accent,
                color: 'white',
                border: 'none',
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeSm,
                cursor: 'pointer'
            }
        }, 'Validate'), courseInfo && canSubmitForReview(courseInfo.status) && React.createElement('button', {
            onClick: handleSubmitForReview,
            style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: appliedTheme.colors.warning,
                color: 'white',
                border: 'none',
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeSm,
                cursor: 'pointer'
            }
        }, 'Submit for Review'), courseInfo && canPublish(courseInfo.status) && React.createElement('button', {
            onClick: handlePublishCourse,
            style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: appliedTheme.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeSm,
                cursor: 'pointer'
            }
        }, 'Publish'), courseInfo && canUnpublish(courseInfo.status) && React.createElement('button', {
            onClick: handleUnpublishCourse,
            style: {
                padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
                backgroundColor: appliedTheme.colors.danger,
                color: 'white',
                border: 'none',
                borderRadius: appliedTheme.borders.borderRadius,
                fontSize: appliedTheme.font.sizeSm,
                cursor: 'pointer'
            }
        }, 'Unpublish'))), 
        // Validation errors
        validationErrors.length > 0 && React.createElement('div', {
            style: {
                margin: `${appliedTheme.spacing.md} 0`,
                padding: appliedTheme.spacing.md,
                backgroundColor: appliedTheme.colors.danger + '10',
                border: `1px solid ${appliedTheme.colors.danger}`,
                borderRadius: appliedTheme.borders.borderRadius
            }
        }, React.createElement('h4', {
            style: {
                fontSize: appliedTheme.font.sizeMd,
                color: appliedTheme.colors.danger,
                margin: 0,
                marginBottom: appliedTheme.spacing.sm
            }
        }, 'Validation Errors'), React.createElement('ul', {
            style: {
                margin: 0,
                paddingLeft: appliedTheme.spacing.lg,
                color: appliedTheme.colors.danger
            }
        }, validationErrors.map((error, index) => React.createElement('li', { key: index }, error)))), 
        // Course metadata
        courseInfo && React.createElement('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: appliedTheme.spacing.md
            }
        }, [
            { label: 'Category', value: courseInfo.metadata.category || 'Not set' },
            { label: 'Level', value: courseInfo.metadata.level },
            { label: 'Duration', value: `${courseInfo.metadata.duration} minutes` },
            { label: 'Lessons', value: courseInfo.metadata.totalLessons },
            { label: 'Pricing', value: courseInfo.pricing === 'paid' ? `$${courseInfo.price}` : courseInfo.pricing },
            { label: 'Language', value: courseInfo.metadata.language }
        ].map((item, index) => React.createElement('div', {
            key: index,
            style: {
                padding: appliedTheme.spacing.sm,
                backgroundColor: appliedTheme.colors.background,
                borderRadius: appliedTheme.borders.borderRadius
            }
        }, React.createElement('div', {
            style: {
                fontSize: appliedTheme.font.sizeXs,
                color: appliedTheme.colors.textSecondary,
                marginBottom: appliedTheme.spacing.xs
            }
        }, item.label), React.createElement('div', {
            style: {
                fontSize: appliedTheme.font.sizeSm,
                fontWeight: 500,
                color: appliedTheme.colors.textPrimary
            }
        }, item.value))))))));
    const renderMarketplace = () => (React.createElement('div', {}, renderCourseSelector(), !activeCourse ? React.createElement('p', {
        style: {
            textAlign: 'center',
            color: appliedTheme.colors.textSecondary,
            padding: appliedTheme.spacing.xl
        }
    }, 'Select a course to view marketplace analytics.') :
        marketplaceEntry ? React.createElement('div', {
            style: {
                backgroundColor: appliedTheme.colors.surface,
                borderRadius: appliedTheme.borders.borderRadius,
                padding: appliedTheme.spacing.lg,
                border: `1px solid ${appliedTheme.borders.borderColor}`
            }
        }, React.createElement('h3', {
            style: {
                fontSize: appliedTheme.font.sizeLg,
                fontWeight: 600,
                marginBottom: appliedTheme.spacing.lg,
                color: appliedTheme.colors.textPrimary
            }
        }, 'Marketplace Performance'), React.createElement('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: appliedTheme.spacing.md,
                marginBottom: appliedTheme.spacing.lg
            }
        }, [
            { label: 'Enrollments', value: marketplaceEntry.statistics.totalEnrollments },
            { label: 'Active Students', value: marketplaceEntry.statistics.activeStudents },
            { label: 'Completion Rate', value: `${Math.round(marketplaceEntry.statistics.completionRate * 100)}%` },
            { label: 'Average Rating', value: `${marketplaceEntry.statistics.averageRating.toFixed(1)} ⭐` },
            { label: 'Total Revenue', value: `$${marketplaceEntry.statistics.revenue.toLocaleString()}` },
            { label: 'Views', value: marketplaceEntry.statistics.viewCount.toLocaleString() }
        ].map((stat, index) => React.createElement('div', {
            key: index,
            style: {
                padding: appliedTheme.spacing.md,
                backgroundColor: appliedTheme.colors.background,
                borderRadius: appliedTheme.borders.borderRadius,
                textAlign: 'center'
            }
        }, React.createElement('div', {
            style: {
                fontSize: appliedTheme.font.sizeLg,
                fontWeight: 600,
                color: appliedTheme.colors.textPrimary,
                marginBottom: appliedTheme.spacing.xs
            }
        }, stat.value), React.createElement('div', {
            style: {
                fontSize: appliedTheme.font.sizeXs,
                color: appliedTheme.colors.textSecondary
            }
        }, stat.label))))) : React.createElement('p', {
            style: {
                textAlign: 'center',
                color: appliedTheme.colors.textSecondary,
                padding: appliedTheme.spacing.xl
            }
        }, 'No marketplace data available for this course.')));
    const renderReviews = () => (React.createElement('div', {}, renderCourseSelector(), !activeCourse ? React.createElement('p', {
        style: {
            textAlign: 'center',
            color: appliedTheme.colors.textSecondary,
            padding: appliedTheme.spacing.xl
        }
    }, 'Select a course to view reviews.') :
        React.createElement('div', {
            style: {
                backgroundColor: appliedTheme.colors.surface,
                borderRadius: appliedTheme.borders.borderRadius,
                padding: appliedTheme.spacing.lg,
                border: `1px solid ${appliedTheme.borders.borderColor}`
            }
        }, React.createElement('h3', {
            style: {
                fontSize: appliedTheme.font.sizeLg,
                fontWeight: 600,
                marginBottom: appliedTheme.spacing.lg,
                color: appliedTheme.colors.textPrimary
            }
        }, 'Course Reviews'), courseReviews.length > 0 ? React.createElement('div', {
            style: {
                display: 'grid',
                gap: appliedTheme.spacing.md
            }
        }, courseReviews.map(review => React.createElement('div', {
            key: review.id,
            style: {
                padding: appliedTheme.spacing.md,
                backgroundColor: appliedTheme.colors.background,
                borderRadius: appliedTheme.borders.borderRadius,
                border: `1px solid ${appliedTheme.borders.borderColor}`
            }
        }, React.createElement('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: appliedTheme.spacing.sm
            }
        }, React.createElement('div', {}, React.createElement('h4', {
            style: {
                fontSize: appliedTheme.font.sizeMd,
                fontWeight: 600,
                margin: 0,
                color: appliedTheme.colors.textPrimary
            }
        }, review.reviewerName), React.createElement('p', {
            style: {
                fontSize: appliedTheme.font.sizeSm,
                color: appliedTheme.colors.textSecondary,
                margin: 0
            }
        }, formatDate(review.reviewedAt))), React.createElement('span', {
            style: {
                padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
                borderRadius: appliedTheme.borders.borderRadius,
                backgroundColor: review.status === 'approved' ? appliedTheme.colors.secondary + '20' :
                    review.status === 'rejected' ? appliedTheme.colors.danger + '20' :
                        appliedTheme.colors.warning + '20',
                color: review.status === 'approved' ? appliedTheme.colors.secondary :
                    review.status === 'rejected' ? appliedTheme.colors.danger :
                        appliedTheme.colors.warning,
                fontWeight: 500,
                textTransform: 'capitalize'
            }
        }, review.status.replace('_', ' '))), React.createElement('p', {
            style: {
                fontSize: appliedTheme.font.sizeSm,
                color: appliedTheme.colors.textPrimary,
                margin: 0,
                marginBottom: appliedTheme.spacing.sm
            }
        }, review.feedback), 
        // Checklist
        React.createElement('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: appliedTheme.spacing.xs,
                fontSize: appliedTheme.font.sizeXs
            }
        }, Object.entries(review.checklist).map(([key, passed]) => React.createElement('div', {
            key: key,
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: appliedTheme.spacing.xs,
                color: passed ? appliedTheme.colors.secondary : appliedTheme.colors.danger
            }
        }, React.createElement('span', {}, passed ? '✅' : '❌'), React.createElement('span', {
            style: { textTransform: 'capitalize' }
        }, key.replace(/([A-Z])/g, ' $1').trim()))))))) : React.createElement('p', {
            style: {
                textAlign: 'center',
                color: appliedTheme.colors.textSecondary,
                margin: 0
            }
        }, 'No reviews available for this course.'))));
    return React.createElement('div', {
        style: {
            padding: appliedTheme.spacing.lg
        }
    }, renderTabNavigation(), 
    // Error display
    error && React.createElement('div', {
        style: {
            margin: `${appliedTheme.spacing.lg} 0`,
            padding: appliedTheme.spacing.md,
            backgroundColor: appliedTheme.colors.danger + '10',
            border: `1px solid ${appliedTheme.colors.danger}`,
            borderRadius: appliedTheme.borders.borderRadius,
            color: appliedTheme.colors.danger,
            fontSize: appliedTheme.font.sizeSm
        }
    }, error), 
    // Loading state
    loading && React.createElement('div', {
        style: {
            textAlign: 'center',
            padding: appliedTheme.spacing.xl,
            color: appliedTheme.colors.textSecondary
        }
    }, 'Loading course publishing data...'), 
    // Tab content
    !loading && activeTab === 'overview' && renderOverview(), !loading && activeTab === 'publishing' && renderPublishing(), !loading && activeTab === 'marketplace' && renderMarketplace(), !loading && activeTab === 'reviews' && renderReviews());
};
