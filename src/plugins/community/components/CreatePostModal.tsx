import * as React from 'react'

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
  const [mediaType, setMediaType] = React.useState<'none' | 'video' | 'link' | 'poll' | 'emoji' | 'gif'>('none')
  const [videoUrl, setVideoUrl] = React.useState('')
  const [linkUrl, setLinkUrl] = React.useState('')
  const [pollOptions, setPollOptions] = React.useState(['', ''])
  const [attachments, setAttachments] = React.useState<Array<{id: string, file: File, preview: string}>>([])
  const [cursorPosition, setCursorPosition] = React.useState(0)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [showGifPicker, setShowGifPicker] = React.useState(false)
  const contentTextareaRef = React.useRef<HTMLTextAreaElement>(null)

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
      setCursorPosition(0)
      setShowEmojiPicker(false)
      setShowGifPicker(false)
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

  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ''])
    }
  }

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index))
    }
  }

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
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

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const insertLinkAtCursor = () => {
    if (!linkUrl.trim()) return

    const textarea = contentTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const url = linkUrl.trim()
    
    // Create a markdown-style link or just the URL if no selection
    const selectedText = content.substring(start, end)
    const linkText = selectedText || url
    const formattedLink = selectedText ? `[${selectedText}](${url})` : url
    
    const newContent = content.substring(0, start) + formattedLink + content.substring(end)
    
    setContent(newContent)
    setLinkUrl('')
    
    // Set cursor position after the inserted link
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + formattedLink.length, start + formattedLink.length)
    }, 0)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setCursorPosition(e.target.selectionStart)
  }

  const handleContentClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    setCursorPosition(target.selectionStart)
  }

  const handleContentKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    setCursorPosition(target.selectionStart)
  }

  const insertEmojiAtCursor = (emoji: string) => {
    const textarea = contentTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + emoji + content.substring(end)
    
    setContent(newContent)
    
    // Set cursor position after the inserted emoji
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  const insertGifAtCursor = (gifUrl: string) => {
    const textarea = contentTextareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const gifMarkdown = `![GIF](${gifUrl})`
    const newContent = content.substring(0, start) + gifMarkdown + content.substring(end)
    
    setContent(newContent)
    
    // Set cursor position after the inserted GIF
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + gifMarkdown.length, start + gifMarkdown.length)
    }, 0)
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

          {/* Content Textarea */}
          <textarea
            ref={contentTextareaRef}
            placeholder="What's on your mind?"
            value={content}
            onChange={handleContentChange}
            onClick={handleContentClick}
            onKeyUp={handleContentKeyUp}
            rows={6}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              border: `1px solid ${theme.borders.borderColor}`,
              borderRadius: theme.borders.borderRadius,
              resize: 'vertical',
              fontFamily: theme.font.family,
              fontSize: theme.font.sizeMd,
              lineHeight: 1.6,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              marginBottom: theme.spacing.md
            }}
          />

          {/* Compact Toolbar */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: theme.spacing.md,
            padding: '8px',
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: '20px',
            alignItems: 'center'
          }}>
            {/* Compact buttons */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '12px',
              backgroundColor: theme.colors.surface,
              color: theme.colors.textSecondary,
              fontSize: '12px',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}>
              <span>📎</span>
              <span>Attachment</span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            
            <button
              onClick={() => setMediaType(mediaType === 'video' ? 'none' : 'video')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '12px',
                backgroundColor: mediaType === 'video' ? theme.colors.secondary : theme.colors.surface,
                color: mediaType === 'video' ? 'white' : theme.colors.textSecondary,
                fontSize: '12px',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>🎥</span>
              <span>Video</span>
            </button>
            
            <button
              onClick={() => setMediaType(mediaType === 'poll' ? 'none' : 'poll')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '12px',
                backgroundColor: mediaType === 'poll' ? theme.colors.secondary : theme.colors.surface,
                color: mediaType === 'poll' ? 'white' : theme.colors.textSecondary,
                fontSize: '12px',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>📊</span>
              <span>Poll</span>
            </button>

            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '12px',
                backgroundColor: showEmojiPicker ? theme.colors.secondary : theme.colors.surface,
                color: showEmojiPicker ? 'white' : theme.colors.textSecondary,
                fontSize: '12px',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>😀</span>
              <span>Emoji</span>
            </button>

            <button
              onClick={() => setShowGifPicker(!showGifPicker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '12px',
                backgroundColor: showGifPicker ? theme.colors.secondary : theme.colors.surface,
                color: showGifPicker ? 'white' : theme.colors.textSecondary,
                fontSize: '12px',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>🎬</span>
              <span>GIF</span>
            </button>

            {/* Integrated link input */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              backgroundColor: theme.colors.surface,
              borderRadius: '12px',
              padding: '2px',
              minHeight: '28px'
            }}>
              <input
                type="url"
                placeholder="Paste link..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '12px',
                  backgroundColor: 'transparent',
                  color: theme.colors.textPrimary,
                  outline: 'none'
                }}
              />
              {linkUrl.trim() && (
                <button
                  onClick={insertLinkAtCursor}
                  style={{
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: theme.colors.secondary,
                    color: 'white',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    marginRight: '2px',
                    textTransform: 'uppercase'
                  }}
                >
                  Insert
                </button>
              )}
            </div>
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.md,
              border: `1px solid ${theme.borders.borderColor}`,
              borderRadius: theme.borders.borderRadius,
              backgroundColor: theme.colors.surfaceAlt,
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div style={{
                fontSize: theme.font.sizeSm,
                fontWeight: 600,
                color: theme.colors.textPrimary,
                marginBottom: theme.spacing.sm
              }}>
                Select Emoji
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '8px'
              }}>
                {['😀', '😂', '😊', '😍', '🤔', '😭', '😎', '🔥', '💯', '👍', '👎', '❤️', '💔', '🎉', '🎊', '👏', '🙌', '🤝', '💪', '🙏', '✨', '⭐', '🌟', '💎', '🏆', '🎯', '⚡', '💡', '🚀', '🎨', '🎵', '🎪'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      insertEmojiAtCursor(emoji)
                      setShowEmojiPicker(false)
                    }}
                    style={{
                      padding: '8px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: theme.colors.surface,
                      fontSize: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.muted + '30'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.surface
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GIF Picker */}
          {showGifPicker && (
            <div style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.md,
              border: `1px solid ${theme.borders.borderColor}`,
              borderRadius: theme.borders.borderRadius,
              backgroundColor: theme.colors.surfaceAlt,
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <div style={{
                fontSize: theme.font.sizeSm,
                fontWeight: 600,
                color: theme.colors.textPrimary,
                marginBottom: theme.spacing.sm
              }}>
                Select GIF
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {[
                  'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                  'https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif',
                  'https://media.giphy.com/media/l4FGGafcOHmrlQxG0/giphy.gif',
                  'https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif',
                  'https://media.giphy.com/media/26tknCqiJrBQG6bxC/giphy.gif',
                  'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif'
                ].map((gifUrl, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      insertGifAtCursor(gifUrl)
                      setShowGifPicker(false)
                    }}
                    style={{
                      padding: '4px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: theme.colors.surface,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={gifUrl}
                      alt={`GIF ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attachments Display */}
          {attachments.length > 0 && (
            <div style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.md,
              border: `1px solid ${theme.borders.borderColor}`,
              borderRadius: theme.borders.borderRadius,
              backgroundColor: theme.colors.surfaceAlt
            }}>
              <div style={{
                fontSize: theme.font.sizeSm,
                fontWeight: 600,
                color: theme.colors.textPrimary,
                marginBottom: theme.spacing.sm
              }}>
                Attachments ({attachments.length})
              </div>
              <div style={{
                display: 'flex',
                gap: theme.spacing.sm,
                overflowX: 'auto',
                padding: theme.spacing.xs
              }}>
                {attachments.map((attachment) => (
                  <div key={attachment.id} style={{
                    position: 'relative',
                    minWidth: '100px',
                    height: '100px',
                    borderRadius: theme.borders.borderRadius,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.borders.borderColor}`
                  }}>
                    {attachment.file.type.startsWith('image/') ? (
                      <img
                        src={attachment.preview}
                        alt={attachment.file.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: theme.spacing.xs,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: theme.spacing.xs }}>📄</div>
                        <div style={{
                          fontSize: theme.font.sizeXs,
                          color: theme.colors.textSecondary,
                          wordBreak: 'break-all'
                        }}>
                          {attachment.file.name.length > 12 
                            ? attachment.file.name.substring(0, 12) + '...' 
                            : attachment.file.name}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media-specific inputs */}
          {mediaType === 'video' && (
            <input
              type="url"
              placeholder="Enter video URL (YouTube, Vimeo, etc.)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                border: `1px solid ${theme.borders.borderColor}`,
                borderRadius: theme.borders.borderRadius,
                fontSize: theme.font.sizeMd,
                fontFamily: theme.font.family,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textPrimary,
                marginBottom: theme.spacing.md
              }}
            />
          )}

          {mediaType === 'poll' && (
            <div style={{ marginBottom: theme.spacing.md }}>
              <div style={{
                fontSize: theme.font.sizeSm,
                fontWeight: 600,
                color: theme.colors.textPrimary,
                marginBottom: theme.spacing.sm
              }}>
                Poll Options
              </div>
              {pollOptions.map((option, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm
                }}>
                  <input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    style={{
                      flex: 1,
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.borders.borderColor}`,
                      borderRadius: theme.borders.borderRadius,
                      fontSize: theme.font.sizeMd,
                      fontFamily: theme.font.family,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.textPrimary
                    }}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(index)}
                      style={{
                        padding: theme.spacing.sm,
                        border: `1px solid ${theme.colors.danger}`,
                        borderRadius: theme.borders.borderRadius,
                        backgroundColor: 'transparent',
                        color: theme.colors.danger,
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 5 && (
                <button
                  onClick={addPollOption}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    border: `1px dashed ${theme.borders.borderColor}`,
                    borderRadius: theme.borders.borderRadius,
                    backgroundColor: 'transparent',
                    color: theme.colors.textSecondary,
                    cursor: 'pointer',
                    fontSize: theme.font.sizeSm
                  }}
                >
                  + Add Option
                </button>
              )}
            </div>
          )}
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