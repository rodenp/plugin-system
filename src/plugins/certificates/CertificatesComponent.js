import * as React from 'react';
import { defaultTheme } from '../shared/default-theme';
// ============================================================================
// COMPONENT
// ============================================================================
export const CertificatesComponent = ({ currentUser, communityId, community, userRole, theme, certificates = [], templates = [], userCertificates = [], courseCertificates = [], settings, loading = false, error, onCreateTemplate, onGenerateCertificate, onVerifyCertificate, onRevokeCertificate, onDownloadCertificate, onShareToLinkedIn, onUpdateSettings, }) => {
    // Apply theme
    const appliedTheme = theme || defaultTheme;
    // Local state
    const [activeTab, setActiveTab] = React.useState('certificates');
    const [selectedCertificate, setSelectedCertificate] = React.useState(null);
    const [showCreateTemplate, setShowCreateTemplate] = React.useState(false);
    const [verificationCode, setVerificationCode] = React.useState('');
    // Event handlers
    const handleCreateTemplate = async () => {
        if (onCreateTemplate) {
            try {
                await onCreateTemplate({
                    name: 'New Certificate Template',
                    description: 'A new certificate template',
                    template: {
                        width: 1056,
                        height: 816,
                        backgroundColor: '#ffffff',
                        layout: 'landscape',
                        elements: []
                    },
                    variables: [],
                    isActive: true
                });
                setShowCreateTemplate(false);
            }
            catch (error) {
                console.error('Failed to create template:', error);
            }
        }
    };
    const handleGenerateCertificate = async (courseId, studentId) => {
        if (onGenerateCertificate) {
            try {
                await onGenerateCertificate(courseId, studentId, settings?.defaultTemplateId);
            }
            catch (error) {
                console.error('Failed to generate certificate:', error);
            }
        }
    };
    const handleVerifyCertificate = async () => {
        if (onVerifyCertificate && verificationCode) {
            try {
                const result = await onVerifyCertificate(verificationCode);
                console.log('Verification result:', result);
            }
            catch (error) {
                console.error('Failed to verify certificate:', error);
            }
        }
    };
    const handleDownload = async (certificateId, format = 'pdf') => {
        if (onDownloadCertificate) {
            try {
                await onDownloadCertificate(certificateId, format);
            }
            catch (error) {
                console.error('Failed to download certificate:', error);
            }
        }
    };
    const handleShareLinkedIn = async (certificateId) => {
        if (onShareToLinkedIn) {
            try {
                await onShareToLinkedIn(certificateId);
            }
            catch (error) {
                console.error('Failed to share to LinkedIn:', error);
            }
        }
    };
    const handleRevoke = async (certificateId, reason) => {
        if (onRevokeCertificate) {
            try {
                await onRevokeCertificate(certificateId, reason);
            }
            catch (error) {
                console.error('Failed to revoke certificate:', error);
            }
        }
    };
    // Helper functions
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date(date));
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'issued': return appliedTheme.colors.secondary;
            case 'revoked': return appliedTheme.colors.danger;
            case 'expired': return appliedTheme.colors.muted;
            default: return appliedTheme.colors.textSecondary;
        }
    };
    // Render tab navigation
    const renderTabNavigation = () => (React.createElement('div', {
        style: {
            display: 'flex',
            borderBottom: `1px solid ${appliedTheme.borders.borderColor}`,
            marginBottom: appliedTheme.spacing.lg
        }
    }, ['certificates', 'templates', 'settings'].map(tab => React.createElement('button', {
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
    // Render certificates list
    const renderCertificatesList = () => (React.createElement('div', {
        style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: appliedTheme.spacing.lg
        }
    }, certificates.map(certificate => React.createElement('div', {
        key: certificate.id,
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            boxShadow: appliedTheme.borders.boxShadow,
            padding: appliedTheme.spacing.lg,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            cursor: 'pointer'
        },
        onClick: () => setSelectedCertificate(certificate)
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
    }, certificate.courseName), React.createElement('p', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            margin: 0
        }
    }, certificate.studentName)), React.createElement('span', {
        style: {
            padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.sm}`,
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeXs,
            fontWeight: 500,
            backgroundColor: getStatusColor(certificate.status) + '20',
            color: getStatusColor(certificate.status),
            textTransform: 'uppercase'
        }
    }, certificate.status)), React.createElement('div', {
        style: {
            fontSize: appliedTheme.font.sizeSm,
            color: appliedTheme.colors.textSecondary,
            marginBottom: appliedTheme.spacing.md
        }
    }, React.createElement('p', { style: { margin: 0 } }, `Certificate #${certificate.certificateNumber}`), React.createElement('p', { style: { margin: 0 } }, `Issued: ${formatDate(certificate.issuedAt)}`), React.createElement('p', { style: { margin: 0 } }, `Score: ${certificate.finalScore}%`)), React.createElement('div', {
        style: {
            display: 'flex',
            gap: appliedTheme.spacing.sm
        }
    }, React.createElement('button', {
        onClick: (e) => {
            e.stopPropagation();
            handleDownload(certificate.id, 'pdf');
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
    }, 'Download'), settings?.enableSocialSharing && React.createElement('button', {
        onClick: (e) => {
            e.stopPropagation();
            handleShareLinkedIn(certificate.id);
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
    }, 'Share'))))));
    // Render verification section
    const renderVerification = () => (React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg,
            marginBottom: appliedTheme.spacing.lg
        }
    }, React.createElement('h3', {
        style: {
            fontSize: appliedTheme.font.sizeLg,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.md,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Verify Certificate'), React.createElement('div', {
        style: {
            display: 'flex',
            gap: appliedTheme.spacing.sm,
            alignItems: 'center'
        }
    }, React.createElement('input', {
        type: 'text',
        placeholder: 'Enter verification code',
        value: verificationCode,
        onChange: (e) => setVerificationCode(e.target.value),
        style: {
            flex: 1,
            padding: appliedTheme.spacing.sm,
            border: `1px solid ${appliedTheme.borders.borderColor}`,
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm
        }
    }), React.createElement('button', {
        onClick: handleVerifyCertificate,
        disabled: !verificationCode,
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: verificationCode ? appliedTheme.colors.secondary : appliedTheme.colors.muted,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: verificationCode ? 'pointer' : 'not-allowed'
        }
    }, 'Verify'))));
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
    }, 'Loading certificates...'), 
    // Tab content
    !loading && activeTab === 'certificates' && React.createElement('div', {}, renderVerification(), React.createElement('div', {
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
    }, 'Certificates'), (userRole === 'owner' || userRole === 'admin') && React.createElement('button', {
        onClick: () => handleGenerateCertificate('sample-course', currentUser.id),
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
        }
    }, 'Generate Certificate')), renderCertificatesList()), activeTab === 'templates' && React.createElement('div', {}, React.createElement('div', {
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
    }, 'Certificate Templates'), (userRole === 'owner' || userRole === 'admin') && React.createElement('button', {
        onClick: handleCreateTemplate,
        style: {
            padding: `${appliedTheme.spacing.sm} ${appliedTheme.spacing.md}`,
            backgroundColor: appliedTheme.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: appliedTheme.borders.borderRadius,
            fontSize: appliedTheme.font.sizeSm,
            cursor: 'pointer'
        }
    }, 'Create Template')), React.createElement('div', {
        style: {
            textAlign: 'center',
            padding: appliedTheme.spacing.xl,
            color: appliedTheme.colors.textSecondary
        }
    }, `${templates.length} template(s) available`)), activeTab === 'settings' && React.createElement('div', {}, React.createElement('h2', {
        style: {
            fontSize: appliedTheme.font.sizeXl,
            fontWeight: 600,
            marginBottom: appliedTheme.spacing.lg,
            color: appliedTheme.colors.textPrimary
        }
    }, 'Certificate Settings'), React.createElement('div', {
        style: {
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.lg
        }
    }, React.createElement('p', {
        style: {
            color: appliedTheme.colors.textSecondary,
            margin: 0
        }
    }, settings ? 'Certificate settings are configured.' : 'No certificate settings found.'))));
};
