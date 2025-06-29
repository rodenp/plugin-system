import * as React from 'react'

interface AttachmentDownloadModalProps {
  isOpen: boolean
  attachment: {
    id: string
    name: string
    size: number
    type: string
    preview: string
  } | null
  theme: any
  onClose: () => void
}

export const AttachmentDownloadModal: React.FC<AttachmentDownloadModalProps> = ({
  isOpen,
  attachment,
  theme,
  onClose
}) => {
  const handleDownload = () => {
    if (!attachment) return

    // Create download link
    const link = document.createElement('a')
    link.href = attachment.preview
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen || !attachment) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: theme.spacing.lg
    }}>
      <div style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borders.borderRadius,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: '500px',
        padding: theme.spacing.xl,
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: theme.spacing.md,
            right: theme.spacing.md,
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: theme.colors.textSecondary,
            padding: theme.spacing.xs,
            borderRadius: theme.borders.borderRadius
          }}
        >
          ×
        </button>

        {/* Header */}
        <h2 style={{
          fontSize: theme.font.size2xl,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.lg,
          marginTop: 0
        }}>
          No preview available
        </h2>

        {/* File info */}
        <div style={{
          marginBottom: theme.spacing.xl
        }}>
          <div style={{
            fontSize: theme.font.sizeLg,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm,
            wordBreak: 'break-all'
          }}>
            {attachment.name}
          </div>
          <div style={{
            fontSize: theme.font.sizeMd,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.sm
          }}>
            {attachment.type || 'Unknown type'} • {formatFileSize(attachment.size)}
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          style={{
            width: '100%',
            padding: theme.spacing.lg,
            backgroundColor: '#f4c430', // Golden yellow like in the screenshot
            color: '#000',
            border: 'none',
            borderRadius: theme.borders.borderRadius,
            fontSize: theme.font.sizeLg,
            fontWeight: 600,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          Download
        </button>
      </div>
    </div>
  )
}