import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';
// ============================================================================
// COMPONENT
// ============================================================================
export const AssessmentComponent = ({ currentUser, communityId, community, userRole, theme, assessments = {}, submissions = {}, gradeBooks = {}, currentSubmission, loading = false, error, onCreateAssessment, onLoadAssessments, onStartAssessment, onSubmitAnswer, onSubmitAssessment, onGradeSubmission, onLoadGradeBook, onUpdateAssessment, onDeleteAssessment, }) => {
    // Apply theme
    const appliedTheme = theme || defaultTheme;
    // Local state
    const [activeTab, setActiveTab] = React.useState('assessments');
    const [selectedAssessment, setSelectedAssessment] = React.useState(null);
    const [showCreateForm, setShowCreateForm] = React.useState(false);
    // Helper functions
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };
    const getAssessmentCount = () => Object.keys(assessments).length;
    const getSubmissionCount = () => Object.values(submissions).reduce((total, subs) => total + subs.length, 0);
    const getGradebookCount = () => Object.keys(gradeBooks).length;
    const getStatusColor = (status) => {
        switch (status) {
            case 'published':
            case 'completed':
            case 'graded':
                return appliedTheme.colors.secondary;
            case 'in_progress':
            case 'submitted':
                return appliedTheme.colors.warning;
            case 'draft':
            case 'not_started':
                return appliedTheme.colors.muted;
            default:
                return appliedTheme.colors.textSecondary;
        }
    };
    // Event handlers
    const handleCreateAssessment = async () => {
        if (onCreateAssessment) {
            try {
                await onCreateAssessment({
                    title: 'New Assessment',
                    description: 'A new assessment for your course',
                    type: 'quiz',
                    gradingMethod: 'automatic',
                    courseId: 'sample-course',
                    questions: [
                        {
                            id: 'q1',
                            type: 'multiple_choice',
                            question: 'What is the correct answer?',
                            points: 10,
                            options: [
                                { id: 'a', text: 'Option A', isCorrect: true },
                                { id: 'b', text: 'Option B', isCorrect: false },
                                { id: 'c', text: 'Option C', isCorrect: false },
                                { id: 'd', text: 'Option D', isCorrect: false }
                            ]
                        }
                    ],
                    settings: {
                        timeLimit: 30,
                        attempts: 3,
                        showCorrectAnswers: true,
                        showFeedback: true,
                        randomizeQuestions: false,
                        randomizeOptions: false,
                        passingScore: 70,
                        lateSubmissionAllowed: false
                    },
                    totalPoints: 10,
                    createdBy: currentUser.id,
                    published: false
                });
                setShowCreateForm(false);
            }
            catch (error) {
                console.error('Failed to create assessment:', error);
            }
        }
    };
    const handleStartAssessment = async (assessmentId) => {
        if (onStartAssessment && currentUser) {
            try {
                await onStartAssessment(assessmentId, currentUser.id);
            }
            catch (error) {
                console.error('Failed to start assessment:', error);
            }
        }
    };
    const handleLoadGradebook = async () => {
        if (onLoadGradeBook) {
            try {
                await onLoadGradeBook('sample-course');
            }
            catch (error) {
                console.error('Failed to load gradebook:', error);
            }
        }
    };
    // Render tab navigation
    const renderTabNavigation = () => (React.createElement('div', {
        style: {
            display: 'flex',
            borderBottom: `1px solid ${appliedTheme.borders.borderColor}`,
            marginBottom: appliedTheme.spacing.lg
        }
    }, ['assessments', 'submissions', 'gradebook', 'create'].map(tab => React.createElement('button', {
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
    // Render overview stats
    const renderOverview = () => (React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: appliedTheme.spacing.lg,
            marginBottom: appliedTheme.spacing.xl
        }
    }, [
        { label: 'Total Assessments', value: getAssessmentCount() },
        { label: 'Total Submissions', value: getSubmissionCount() },
        { label: 'Course Gradebooks', value: getGradebookCount() },
        { label: 'Current User Role', value: userRole }
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
    }, stat.label)))));
    // Render assessments list
    const renderAssessments = () => (React.createElement('div', {}, renderOverview(), React.createElement('div', {
        style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: appliedTheme.spacing.lg
        }
    }, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            margin: 0,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Assessments'), (userRole === 'owner' || userRole === 'admin') && React.createElement('button', {
        onClick: handleCreateAssessment,
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
        }
    }, 'Create Assessment')), React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, Object.keys(assessments).length > 0 ? (React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: appliedTheme.spacing.lg
        }
    }, Object.values(assessments).map(assessment => React.createElement('div', {
        key: assessment.id,
        style: {
            backgroundColor: appliedTheme.colors.background,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            cursor: 'pointer'
        },
        onClick: () => setSelectedAssessment(assessment)
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
    }, assessment.title), React.createElement('p', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            margin: 0
        }
    }, assessment.description || 'No description')), React.createElement('span', {
        style: {
            padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeXs,
            fontWeight: 500,
            backgroundColor: getStatusColor(assessment.published ? 'published' : 'draft') + '20',
            color: getStatusColor(assessment.published ? 'published' : 'draft'),
            textTransform: 'uppercase'
        }
    }, assessment.published ? 'Published' : 'Draft')), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.md
        }
    }, React.createElement('p', { style: { margin: 0 } }, `Type: ${assessment.type}`), React.createElement('p', { style: { margin: 0 } }, `Questions: ${assessment.questions.length}`), React.createElement('p', { style: { margin: 0 } }, `Total Points: ${assessment.totalPoints}`), React.createElement('p', { style: { margin: 0 } }, `Passing Score: ${assessment.settings.passingScore}%`)), React.createElement('div', {
        style: {
            display: 'flex',
            gap: appliedTheme.spacing.sm
        }
    }, React.createElement('button', {
        onClick: (e) => {
            e.stopPropagation();
            handleStartAssessment(assessment.id);
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
    }, 'Start'), React.createElement('button', {
        onClick: (e) => {
            e.stopPropagation();
            // View results
        },
        style: {
            padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
            backgroundColor: appliedTheme.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeXs,
            cursor: 'pointer'
        }
    }, 'Results')))))) : (React.createElement('p', {
        style: {
            color: appliedTheme.colors.textSecondary,
            textAlign: 'center',
            margin: 0
        }
    }, 'No assessments created yet.')))));
    // Render submissions
    const renderSubmissions = () => (React.createElement('div', {}, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Student Submissions'), React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('p', {
        style: {
            color: appliedTheme.colors.textSecondary,
            textAlign: 'center',
            margin: 0
        }
    }, `${getSubmissionCount()} total submissions across all assessments`))));
    // Render gradebook
    const renderGradebook = () => (React.createElement('div', {}, React.createElement('div', {
        style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: appliedTheme.spacing.lg
        }
    }, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            margin: 0,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Grade Book'), React.createElement('button', {
        onClick: handleLoadGradebook,
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
        }
    }, 'Load Gradebook')), React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('p', {
        style: {
            color: appliedTheme.colors.textSecondary,
            textAlign: 'center',
            margin: 0
        }
    }, `${getGradebookCount()} course gradebook(s) available`))));
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
    }, 'Loading assessment data...'), 
    // Tab content
    !loading && activeTab === 'assessments' && renderAssessments(), !loading && activeTab === 'submissions' && renderSubmissions(), !loading && activeTab === 'gradebook' && renderGradebook(), activeTab === 'create' && React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.xl,
            textAlign: 'center',
            border: `1px solid ${appliedTheme.borders.borderColor}`
        }
    }, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Create Assessment'), React.createElement('p', {
        style: {
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.lg
        }
    }, 'Assessment creation interface would be implemented here.'), React.createElement('button', {
        onClick: handleCreateAssessment,
        style: {
            padding: `${appliedTheme.spacing.md} ${appliedTheme.spacing.lg}`,
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeMd,
            cursor: 'pointer'
        }
    }, 'Create Sample Assessment')));
};
