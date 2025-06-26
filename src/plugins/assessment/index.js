import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { eventBus } from '@core/event-bus';
const initialState = {
    assessments: {},
    submissions: {},
    gradeBooks: {},
    currentSubmission: null,
    loading: false,
    error: null,
};
// ============================================================================
// ASYNC THUNKS
// ============================================================================
export const createAssessment = createAsyncThunk('assessment/createAssessment', async (assessmentData) => {
    const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData),
    });
    if (!response.ok) {
        throw new Error('Failed to create assessment');
    }
    const assessment = await response.json();
    eventBus.emit('assessment:created', assessment);
    return assessment;
});
export const loadAssessments = createAsyncThunk('assessment/loadAssessments', async (courseId) => {
    const response = await fetch(`/api/courses/${courseId}/assessments`);
    if (!response.ok) {
        throw new Error('Failed to load assessments');
    }
    return response.json();
});
export const startAssessment = createAsyncThunk('assessment/startAssessment', async ({ assessmentId, studentId }) => {
    const response = await fetch(`/api/assessments/${assessmentId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
    });
    if (!response.ok) {
        throw new Error('Failed to start assessment');
    }
    const submission = await response.json();
    eventBus.emit('assessment:started', submission);
    return submission;
});
export const submitAnswer = createAsyncThunk('assessment/submitAnswer', async ({ submissionId, questionId, answer, timeSpent }) => {
    const response = await fetch(`/api/submissions/${submissionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, answer, timeSpent }),
    });
    if (!response.ok) {
        throw new Error('Failed to submit answer');
    }
    return response.json();
});
export const submitAssessment = createAsyncThunk('assessment/submitAssessment', async (submissionId) => {
    const response = await fetch(`/api/submissions/${submissionId}/submit`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error('Failed to submit assessment');
    }
    const submission = await response.json();
    eventBus.emit('assessment:submitted', submission);
    return submission;
});
export const gradeSubmission = createAsyncThunk('assessment/gradeSubmission', async ({ submissionId, grades, feedback }) => {
    const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades, feedback }),
    });
    if (!response.ok) {
        throw new Error('Failed to grade submission');
    }
    const gradedSubmission = await response.json();
    eventBus.emit('assessment:graded', gradedSubmission);
    return gradedSubmission;
});
export const loadGradeBook = createAsyncThunk('assessment/loadGradeBook', async (courseId) => {
    const response = await fetch(`/api/courses/${courseId}/gradebook`);
    if (!response.ok) {
        throw new Error('Failed to load grade book');
    }
    return response.json();
});
// ============================================================================
// SLICE DEFINITION
// ============================================================================
const assessmentSlice = createSlice({
    name: 'assessment',
    initialState,
    reducers: {
        setAssessment: (state, action) => {
            state.assessments[action.payload.id] = action.payload;
        },
        updateAssessment: (state, action) => {
            state.assessments[action.payload.id] = action.payload;
        },
        deleteAssessment: (state, action) => {
            delete state.assessments[action.payload];
            delete state.submissions[action.payload];
        },
        setCurrentSubmission: (state, action) => {
            state.currentSubmission = action.payload;
        },
        updateSubmissionAnswer: (state, action) => {
            if (state.currentSubmission) {
                const answerIndex = state.currentSubmission.answers.findIndex(a => a.questionId === action.payload.questionId);
                if (answerIndex !== -1) {
                    state.currentSubmission.answers[answerIndex] = {
                        ...state.currentSubmission.answers[answerIndex],
                        answer: action.payload.answer,
                        timeSpent: action.payload.timeSpent,
                    };
                }
                else {
                    state.currentSubmission.answers.push({
                        questionId: action.payload.questionId,
                        answer: action.payload.answer,
                        timeSpent: action.payload.timeSpent,
                    });
                }
            }
        },
        flagQuestion: (state, action) => {
            if (state.currentSubmission) {
                const answerIndex = state.currentSubmission.answers.findIndex(a => a.questionId === action.payload.questionId);
                if (answerIndex !== -1) {
                    state.currentSubmission.answers[answerIndex].flagged = action.payload.flagged;
                }
            }
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createAssessment.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(createAssessment.fulfilled, (state, action) => {
            state.loading = false;
            state.assessments[action.payload.id] = action.payload;
        })
            .addCase(createAssessment.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to create assessment';
        })
            .addCase(loadAssessments.fulfilled, (state, action) => {
            action.payload.forEach((assessment) => {
                state.assessments[assessment.id] = assessment;
            });
        })
            .addCase(startAssessment.fulfilled, (state, action) => {
            state.currentSubmission = action.payload;
        })
            .addCase(submitAnswer.fulfilled, (state, action) => {
            // Answer submitted successfully
        })
            .addCase(submitAssessment.fulfilled, (state, action) => {
            const assessmentId = action.payload.assessmentId;
            if (!state.submissions[assessmentId]) {
                state.submissions[assessmentId] = [];
            }
            const existingIndex = state.submissions[assessmentId].findIndex(s => s.id === action.payload.id);
            if (existingIndex !== -1) {
                state.submissions[assessmentId][existingIndex] = action.payload;
            }
            else {
                state.submissions[assessmentId].push(action.payload);
            }
            state.currentSubmission = null;
        })
            .addCase(gradeSubmission.fulfilled, (state, action) => {
            const assessmentId = action.payload.assessmentId;
            if (state.submissions[assessmentId]) {
                const existingIndex = state.submissions[assessmentId].findIndex(s => s.id === action.payload.id);
                if (existingIndex !== -1) {
                    state.submissions[assessmentId][existingIndex] = action.payload;
                }
            }
        })
            .addCase(loadGradeBook.fulfilled, (state, action) => {
            state.gradeBooks[action.payload.courseId] = action.payload;
        });
    },
});
// ============================================================================
// ASSESSMENT UTILITIES
// ============================================================================
export function calculateAssessmentScore(submission, assessment) {
    let totalPoints = 0;
    let earnedPoints = 0;
    assessment.questions.forEach(question => {
        totalPoints += question.points;
        const answer = submission.answers.find(a => a.questionId === question.id);
        if (answer) {
            earnedPoints += calculateQuestionScore(question, answer.answer);
        }
    });
    return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
}
export function calculateQuestionScore(question, answer) {
    switch (question.type) {
        case 'multiple_choice':
            const selectedOption = question.options?.find(opt => opt.id === answer);
            return selectedOption?.isCorrect ? question.points : 0;
        case 'true_false':
            const correctOption = question.options?.find(opt => opt.isCorrect);
            return correctOption?.id === answer ? question.points : 0;
        case 'fill_blank':
            if (!question.blanks || !Array.isArray(answer))
                return 0;
            let correctBlanks = 0;
            question.blanks.forEach((blank, index) => {
                const studentAnswer = answer[index]?.toLowerCase().trim();
                const isCorrect = blank.acceptedAnswers.some(accepted => blank.caseSensitive ? accepted === answer[index] : accepted.toLowerCase() === studentAnswer);
                if (isCorrect)
                    correctBlanks++;
            });
            return (correctBlanks / question.blanks.length) * question.points;
        case 'matching':
            if (!question.pairs || !Array.isArray(answer))
                return 0;
            let correctPairs = 0;
            question.pairs.forEach(pair => {
                const studentMatch = answer.find((a) => a.leftId === pair.id);
                if (studentMatch && studentMatch.rightId === pair.right) {
                    correctPairs++;
                }
            });
            return (correctPairs / question.pairs.length) * question.points;
        case 'short_answer':
        case 'essay':
            // These require manual grading
            return 0;
        default:
            return 0;
    }
}
export function getLetterGrade(percentage, gradeScale) {
    for (const grade of gradeScale) {
        if (percentage >= grade.minPercentage && percentage <= grade.maxPercentage) {
            return grade.letter;
        }
    }
    return 'F';
}
export function validateAssessment(assessment) {
    const errors = [];
    if (!assessment.title || assessment.title.trim().length === 0) {
        errors.push('Assessment title is required');
    }
    if (!assessment.questions || assessment.questions.length === 0) {
        errors.push('Assessment must have at least one question');
    }
    if (assessment.questions) {
        assessment.questions.forEach((question, index) => {
            if (!question.question || question.question.trim().length === 0) {
                errors.push(`Question ${index + 1}: Question text is required`);
            }
            if (question.points <= 0) {
                errors.push(`Question ${index + 1}: Points must be greater than 0`);
            }
            if ((question.type === 'multiple_choice' || question.type === 'true_false') &&
                (!question.options || question.options.length === 0)) {
                errors.push(`Question ${index + 1}: Options are required for ${question.type} questions`);
            }
            if (question.type === 'multiple_choice' && question.options) {
                const correctOptions = question.options.filter(opt => opt.isCorrect);
                if (correctOptions.length === 0) {
                    errors.push(`Question ${index + 1}: At least one correct answer is required`);
                }
            }
        });
    }
    return errors;
}
// ============================================================================
// PLUGIN FACTORY
// ============================================================================
export function createAssessmentPlugin() {
    return {
        id: 'assessment-system',
        name: 'Assessment & Grading System',
        version: '1.0.0',
        initialize: async () => {
            console.log('Assessment plugin initialized');
        },
        slice: assessmentSlice,
        utils: {
            calculateAssessmentScore,
            calculateQuestionScore,
            getLetterGrade,
            validateAssessment,
            // Question type helpers
            createMultipleChoiceQuestion: (question, options, points = 1) => ({
                id: `question-${Date.now()}`,
                type: 'multiple_choice',
                question,
                points,
                options: options.map((opt, index) => ({
                    id: `option-${index}`,
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                })),
            }),
            createTrueFalseQuestion: (question, isTrue, points = 1) => ({
                id: `question-${Date.now()}`,
                type: 'true_false',
                question,
                points,
                options: [
                    { id: 'true', text: 'True', isCorrect: isTrue },
                    { id: 'false', text: 'False', isCorrect: !isTrue },
                ],
            }),
            createEssayQuestion: (question, points = 10) => ({
                id: `question-${Date.now()}`,
                type: 'essay',
                question,
                points,
            }),
        },
        // Event handlers
        onLessonCompleted: (lessonId, studentId) => {
            // Check if there are assessments tied to this lesson
            eventBus.emit('assessment:lesson-completed', { lessonId, studentId });
        },
        onCourseEnrollment: (courseId, studentId) => {
            // Initialize grade book entry for student
            eventBus.emit('assessment:student-enrolled', { courseId, studentId });
        }
    };
}
// ============================================================================
// REACT HOOKS
// ============================================================================
import { useAppSelector, useAppDispatch } from '@course-framework/core/store';
export function useAssessment() {
    const dispatch = useAppDispatch();
    const { assessments, submissions, gradeBooks, currentSubmission, loading, error } = useAppSelector((state) => state.assessment || initialState);
    return {
        assessments,
        submissions,
        gradeBooks,
        currentSubmission,
        loading,
        error,
        // Actions
        createAssessment: (assessmentData) => dispatch(createAssessment(assessmentData)),
        loadAssessments: (courseId) => dispatch(loadAssessments(courseId)),
        startAssessment: (assessmentId, studentId) => dispatch(startAssessment({ assessmentId, studentId })),
        submitAnswer: (submissionId, questionId, answer, timeSpent) => dispatch(submitAnswer({ submissionId, questionId, answer, timeSpent })),
        submitAssessment: (submissionId) => dispatch(submitAssessment(submissionId)),
        gradeSubmission: (submissionId, grades, feedback) => dispatch(gradeSubmission({ submissionId, grades, feedback })),
        loadGradeBook: (courseId) => dispatch(loadGradeBook(courseId)),
        // State management
        setCurrentSubmission: (submission) => dispatch(assessmentSlice.actions.setCurrentSubmission(submission)),
        updateSubmissionAnswer: (questionId, answer, timeSpent) => dispatch(assessmentSlice.actions.updateSubmissionAnswer({ questionId, answer, timeSpent })),
        flagQuestion: (questionId, flagged) => dispatch(assessmentSlice.actions.flagQuestion({ questionId, flagged })),
        // Computed values
        getAssessment: (assessmentId) => assessments[assessmentId],
        getAssessmentSubmissions: (assessmentId) => submissions[assessmentId] || [],
        getCourseGradeBook: (courseId) => gradeBooks[courseId],
        // Helper functions
        calculateScore: (submissionId, assessmentId) => {
            const submission = submissions[assessmentId]?.find(s => s.id === submissionId);
            const assessment = assessments[assessmentId];
            if (submission && assessment) {
                return calculateAssessmentScore(submission, assessment);
            }
            return 0;
        },
    };
}
export const assessmentActions = assessmentSlice.actions;
export default assessmentSlice.reducer;
