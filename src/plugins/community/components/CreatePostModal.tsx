import * as React from 'react'
import { UnifiedToolbar } from './UnifiedToolbar'
import { RichTextArea } from './RichTextArea'

interface CreatePostModalProps {
  isOpen: boolean
  currentUser: any
  theme: any
  onClose: () => void
  onCreatePost: (title: string, content: string, category: string, mediaData?: any) => void
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  currentUser,
  theme,
  onClose,
  onCreatePost
}) => {
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [category, setCategory] = React.useState('discussion')
  const [mediaType, setMediaType] = React.useState<string>('none')
  const [videoUrl, setVideoUrl] = React.useState('')
  const [linkUrl, setLinkUrl] = React.useState('')
  const [pollOptions, setPollOptions] = React.useState(['', ''])
  const [attachments, setAttachments] = React.useState<Array<{id: string, file: File, preview: string}>>([])
  const contentTextareaRef = React.useRef<HTMLDivElement>(null)

  // Clear form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTitle('')
      setContent('')
      setCategory('discussion')
      setMediaType('none')
      setVideoUrl('')
      setLinkUrl('')
      setPollOptions(['', ''])
      setAttachments([])
    }
  }, [isOpen])

  // Utility function to check storage size
  const getStorageSize = () => {
    try {
      return new Blob([JSON.stringify(localStorage)]).size
    } catch {
      return 0
    }
  }

  // Clean up old posts if storage is getting full
  const cleanupOldPosts = () => {
    try {
      const keys = Object.keys(localStorage)
      const postKeys = keys.filter(key => key.includes('_post_')).sort()
      
      // Keep only the 50 most recent posts
      if (postKeys.length > 50) {
        const keysToRemove = postKeys.slice(0, postKeys.length - 50)
        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
          // Also remove associated comments and likes
          localStorage.removeItem(key.replace('_post_', '_post_comments_'))
          localStorage.removeItem(key.replace('_post_', '_post_likes_'))
        })
      }
    } catch (error) {
      console.error('Error cleaning up old posts:', error)
    }
  }

  const handleSubmit = () => {
    if (!content.trim()) return

    let mediaData: any = null
    if (mediaType === 'video' && videoUrl.trim()) {
      mediaData = { type: 'video', url: videoUrl.trim() }
    } else if (mediaType === 'poll') {
      const validOptions = pollOptions.filter(opt => opt.trim())
      if (validOptions.length >= 2) {
        mediaData = { type: 'poll', options: validOptions }
      }
    }

    // Add attachments to media data
    if (attachments.length > 0) {
      mediaData = { 
        ...mediaData, 
        attachments: attachments.map(att => ({
          id: att.id,
          name: att.file.name,
          size: att.file.size,
          type: att.file.type,
          preview: att.preview
        }))
      }
    }

    onCreatePost(title, content, category, mediaData)
    
    // Reset form
    setTitle('')
    setContent('')
    setCategory('discussion')
    setMediaType('none')
    setVideoUrl('')
    setLinkUrl('')
    setPollOptions(['', ''])
    setAttachments([])
    onClose()
  }


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement> | any) => {
    // Handle GIF attachment from ComposeToolbar
    if (event.gifAttachment) {
      setAttachments(prev => [...prev, event.gifAttachment])
      return
    }
    
    const files = event.target.files
    if (!files) return

    Array.from(files as FileList).forEach((file: File) => {
      // Much stricter size limits for localStorage
      const maxSize = 2 * 1024 * 1024 // 2MB limit
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 2MB for attachments stored locally.`)
        return
      }

      // Check total storage usage and cleanup if needed
      let currentStorageSize = getStorageSize()
      const maxStorageSize = 5 * 1024 * 1024 // 5MB total localStorage limit
      
      if (currentStorageSize > maxStorageSize * 0.8) { // Clean up when 80% full
        cleanupOldPosts()
        currentStorageSize = getStorageSize() // Recalculate after cleanup
      }
      
      if (currentStorageSize > maxStorageSize) {
        alert('Storage quota exceeded. Please clear some data or use smaller files.')
        return
      }

      const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const preview = e.target?.result as string
          
          // For images, create a compressed version for preview
          if (file.type.startsWith('image/')) {
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              
              // Calculate new dimensions (max 800px width/height)
              const maxDimension = 800
              let { width, height } = img
              
              if (width > height) {
                if (width > maxDimension) {
                  height = (height * maxDimension) / width
                  width = maxDimension
                }
              } else {
                if (height > maxDimension) {
                  width = (width * maxDimension) / height
                  height = maxDimension
                }
              }
              
              canvas.width = width
              canvas.height = height
              
              ctx?.drawImage(img, 0, 0, width, height)
              const compressedPreview = canvas.toDataURL('image/jpeg', 0.7) // 70% quality
              
              setAttachments(prev => [...prev, { 
                id, 
                file, 
                preview: compressedPreview 
              }])
            }
            img.src = preview
          } else {
            // For non-images, store the original data URL
            setAttachments(prev => [...prev, { id, file, preview }])
          }
        } catch (error) {
          console.error('Error processing file:', error)
          alert('Error processing file. It may be too large.')
        }
      }
      
      reader.onerror = () => {
        alert('Error reading file')
      }
      
      // Read all files as data URLs for storage
      reader.readAsDataURL(file)
    })

    // Reset input
    event.target.value = ''
  }



  if (!isOpen) return null

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
      zIndex: 1000,
      padding: theme.spacing.lg
    }}>
      <div style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borders.borderRadius,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: theme.spacing.lg,
          borderBottom: `1px solid ${theme.borders.borderColor}`
        }}>
          <h2 style={{
            margin: 0,
            fontSize: theme.font.sizeLg,
            fontWeight: 600,
            color: theme.colors.textPrimary
          }}>
            Create Post
          </h2>
          <button
            onClick={onClose}
            style={{
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
        </div>

        {/* User Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md,
          padding: theme.spacing.lg,
          borderBottom: `1px solid ${theme.borders.borderColor}`
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: theme.colors.secondary,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 600,
            color: 'white',
            fontSize: theme.font.sizeLg
          }}>
            {currentUser?.profile?.displayName?.charAt(0) || 'U'}
          </div>
          <div>
            <div style={{
              fontWeight: 600,
              color: theme.colors.textPrimary,
              fontSize: theme.font.sizeMd
            }}>
              {currentUser?.profile?.displayName || 'User'}
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                border: `1px solid ${theme.borders.borderColor}`,
                borderRadius: theme.borders.borderRadius,
                fontSize: theme.font.sizeSm,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textSecondary,
                marginTop: '4px'
              }}
            >
              <option value="discussion">💬 Discussion</option>
              <option value="update">📢 Update</option>
              <option value="gem">💎 Gem</option>
              <option value="fun">🎉 Fun</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: theme.spacing.lg }}>
          {/* Title Input */}
          <input
            type="text"
            placeholder="Add a title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              border: `1px solid ${theme.borders.borderColor}`,
              borderRadius: theme.borders.borderRadius,
              fontSize: theme.font.sizeMd,
              fontWeight: 600,
              marginBottom: theme.spacing.md,
              fontFamily: theme.font.family,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary
            }}
          />

          {/* Content Rich Text Area */}
          <RichTextArea
            ref={contentTextareaRef}
            placeholder="What's on your mind?"
            value={content}
            onChange={setContent}
            rows={6}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              border: `1px solid ${theme.borders.borderColor}`,
              borderRadius: theme.borders.borderRadius,
              fontFamily: theme.font.family,
              fontSize: theme.font.sizeMd,
              lineHeight: 1.6,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              marginBottom: theme.spacing.md
            }}
          />

          {/* UnifiedToolbar */}
          <UnifiedToolbar
            theme={theme}
            content={content}
            setContent={setContent}
            contentRef={contentTextareaRef}
            linkUrl={linkUrl}
            setLinkUrl={setLinkUrl}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            mediaType={mediaType}
            setMediaType={setMediaType}
            pollOptions={pollOptions}
            setPollOptions={setPollOptions}
            attachments={attachments}
            setAttachments={setAttachments}
            onFileUpload={handleFileUpload}
            compact={false}
            showSubmit={false}
          />
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: theme.spacing.lg,
          borderTop: `1px solid ${theme.borders.borderColor}`
        }}>
          <div style={{
            fontSize: theme.font.sizeSm,
            color: theme.colors.textSecondary
          }}>
            {content.length} characters
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <button
              onClick={onClose}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                border: `1px solid ${theme.borders.borderColor}`,
                borderRadius: theme.borders.borderRadius,
                backgroundColor: 'transparent',
                color: theme.colors.textSecondary,
                fontSize: theme.font.sizeSm,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                border: 'none',
                borderRadius: theme.borders.borderRadius,
                backgroundColor: content.trim() ? theme.colors.secondary : theme.colors.muted,
                color: 'white',
                fontSize: theme.font.sizeSm,
                fontWeight: 600,
                cursor: content.trim() ? 'pointer' : 'not-allowed',
                opacity: content.trim() ? 1 : 0.6
              }}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}