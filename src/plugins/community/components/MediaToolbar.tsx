import * as React from 'react'
import { EmojiPickerModal } from './EmojiPickerModal'

interface MediaAttachment {
  id: string
  file: File
  preview: string
}

interface MediaToolbarProps {
  theme: any
  content: string
  setContent: (content: string) => void
  contentRef: React.RefObject<HTMLTextAreaElement>
  
  // Media state
  videoUrls: string[]
  setVideoUrls: (urls: string[]) => void
  attachments: MediaAttachment[]
  setAttachments: (attachments: MediaAttachment[]) => void
  pollOptions?: string[]
  setPollOptions?: (options: string[]) => void
  
  // UI options
  showPoll?: boolean
  showVideo?: boolean
  showAttachment?: boolean
  compact?: boolean
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({
  theme,
  content,
  setContent,
  contentRef,
  videoUrls,
  setVideoUrls,
  attachments,
  setAttachments,
  pollOptions,
  setPollOptions,
  showPoll = true,
  showVideo = true,
  showAttachment = true,
  compact = false
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [showGifPicker, setShowGifPicker] = React.useState(false)
  const [showVideoInput, setShowVideoInput] = React.useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = React.useState('')
  const [showPollInput, setShowPollInput] = React.useState(false)

  const insertAtCursor = (textToInsert: string) => {
    const textarea = contentRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + textToInsert + content.substring(end)
    
    setContent(newContent)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
    }, 0)
  }

  const insertEmojiAtCursor = (emoji: string) => {
    insertAtCursor(emoji)
  }

  const addVideoToCarousel = () => {
    if (currentVideoUrl.trim()) {
      setVideoUrls([...videoUrls, currentVideoUrl.trim()])
      setCurrentVideoUrl('')
      setShowVideoInput(false)
    }
  }

  const removeVideo = (index: number) => {
    const newUrls = videoUrls.filter((_, i) => i !== index)
    setVideoUrls(newUrls)
  }

  const addGifToCarousel = (gifUrl: string) => {
    // Add GIF as markdown in content for UnifiedCarousel to detect
    const gifMarkdown = `![GIF](${gifUrl})`
    insertAtCursor(gifMarkdown)
    setShowGifPicker(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const maxSize = 2 * 1024 * 1024 // 2MB limit
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 2MB.`)
        return
      }

      const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const preview = e.target?.result as string
        
        if (file.type.startsWith('image/')) {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            const maxDimension = 400
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
            const compressedPreview = canvas.toDataURL('image/jpeg', 0.7)
            
            setAttachments(prev => [...prev, { id, file, preview: compressedPreview }])
          }
          img.src = preview
        } else {
          setAttachments(prev => [...prev, { id, file, preview }])
        }
      }
      
      reader.readAsDataURL(file)
    })

    event.target.value = ''
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const buttonSize = compact ? '4px 8px' : '6px 10px'
  const fontSize = compact ? '10px' : '12px'

  return (
    <>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: compact ? '4px' : '8px',
        marginBottom: theme.spacing.sm,
        padding: compact ? '4px' : '8px',
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: compact ? '16px' : '20px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Attachment */}
        {showAttachment && (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: buttonSize,
            borderRadius: compact ? '8px' : '12px',
            backgroundColor: theme.colors.surface,
            color: theme.colors.textSecondary,
            fontSize: fontSize,
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
        )}
        
        {/* Video */}
        {showVideo && (
          <button
            onClick={() => setShowVideoInput(!showVideoInput)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: buttonSize,
              borderRadius: compact ? '8px' : '12px',
              backgroundColor: showVideoInput ? theme.colors.secondary : theme.colors.surface,
              color: showVideoInput ? 'white' : theme.colors.textSecondary,
              fontSize: fontSize,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🎥</span>
            <span>Video</span>
          </button>
        )}
        
        {/* Poll */}
        {showPoll && setPollOptions && (
          <button
            onClick={() => setShowPollInput(!showPollInput)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: buttonSize,
              borderRadius: compact ? '8px' : '12px',
              backgroundColor: showPollInput ? theme.colors.secondary : theme.colors.surface,
              color: showPollInput ? 'white' : theme.colors.textSecondary,
              fontSize: fontSize,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📊</span>
            <span>Poll</span>
          </button>
        )}

        {/* Emoji */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: buttonSize,
            borderRadius: compact ? '8px' : '12px',
            backgroundColor: showEmojiPicker ? theme.colors.secondary : theme.colors.surface,
            color: showEmojiPicker ? 'white' : theme.colors.textSecondary,
            fontSize: fontSize,
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <span>😀</span>
          <span>Emoji</span>
        </button>

        {/* GIF */}
        <button
          onClick={() => setShowGifPicker(!showGifPicker)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: buttonSize,
            borderRadius: compact ? '8px' : '12px',
            backgroundColor: showGifPicker ? theme.colors.secondary : theme.colors.surface,
            color: showGifPicker ? 'white' : theme.colors.textSecondary,
            fontSize: fontSize,
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <span>🎬</span>
          <span>GIF</span>
        </button>
      </div>

      {/* Video Input */}
      {showVideoInput && (
        <div style={{
          marginBottom: theme.spacing.sm,
          padding: theme.spacing.sm,
          border: `1px solid ${theme.borders.borderColor}`,
          borderRadius: theme.borders.borderRadius,
          backgroundColor: theme.colors.surface
        }}>
          <div style={{
            display: 'flex',
            gap: theme.spacing.sm,
            alignItems: 'center'
          }}>
            <input
              type="url"
              placeholder="Enter video URL (YouTube, Vimeo, etc.)"
              value={currentVideoUrl}
              onChange={(e) => setCurrentVideoUrl(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: `1px solid ${theme.borders.borderColor}`,
                borderRadius: theme.borders.borderRadius,
                fontSize: theme.font.sizeSm
              }}
            />
            <button
              onClick={addVideoToCarousel}
              disabled={!currentVideoUrl.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: currentVideoUrl.trim() ? theme.colors.accent : theme.colors.surfaceAlt,
                color: currentVideoUrl.trim() ? 'white' : theme.colors.textSecondary,
                border: 'none',
                borderRadius: theme.borders.borderRadius,
                cursor: currentVideoUrl.trim() ? 'pointer' : 'not-allowed',
                fontSize: theme.font.sizeSm,
                fontWeight: 600
              }}
            >
              Add Video
            </button>
          </div>
        </div>
      )}

      {/* Poll Input */}
      {showPollInput && setPollOptions && pollOptions && (
        <div style={{
          marginBottom: theme.spacing.sm,
          padding: theme.spacing.sm,
          border: `1px solid ${theme.borders.borderColor}`,
          borderRadius: theme.borders.borderRadius,
          backgroundColor: theme.colors.surface
        }}>
          <div style={{
            fontSize: theme.font.sizeSm,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm
          }}>
            Poll Options
          </div>
          {pollOptions.map((option, index) => (
            <div key={index} style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => {
                  const newOptions = [...pollOptions]
                  newOptions[index] = e.target.value
                  setPollOptions(newOptions)
                }}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  border: `1px solid ${theme.borders.borderColor}`,
                  borderRadius: theme.borders.borderRadius,
                  fontSize: theme.font.sizeSm
                }}
              />
              {pollOptions.length > 2 && (
                <button
                  onClick={() => {
                    const newOptions = pollOptions.filter((_, i) => i !== index)
                    setPollOptions(newOptions)
                  }}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: theme.colors.surfaceAlt,
                    border: 'none',
                    borderRadius: theme.borders.borderRadius,
                    cursor: 'pointer',
                    color: theme.colors.textSecondary
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 5 && (
            <button
              onClick={() => setPollOptions([...pollOptions, ''])}
              style={{
                padding: '6px 12px',
                backgroundColor: theme.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: theme.borders.borderRadius,
                cursor: 'pointer',
                fontSize: theme.font.sizeSm
              }}
            >
              + Add Option
            </button>
          )}
        </div>
      )}

      {/* Current Videos Display */}
      {videoUrls.length > 0 && (
        <div style={{
          marginBottom: theme.spacing.sm,
          padding: theme.spacing.sm,
          border: `1px solid ${theme.borders.borderColor}`,
          borderRadius: theme.borders.borderRadius,
          backgroundColor: theme.colors.surface
        }}>
          <div style={{
            fontSize: theme.font.sizeSm,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.sm
          }}>
            Videos ({videoUrls.length})
          </div>
          {videoUrls.map((url, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.xs,
              padding: theme.spacing.xs,
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: theme.borders.borderRadius
            }}>
              <span style={{ flex: 1, fontSize: theme.font.sizeXs, color: theme.colors.textSecondary }}>
                {url.length > 50 ? url.substring(0, 50) + '...' : url}
              </span>
              <button
                onClick={() => removeVideo(index)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.colors.textSecondary,
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Current Attachments Display */}
      {attachments.length > 0 && (
        <div style={{
          marginBottom: theme.spacing.sm,
          padding: theme.spacing.sm,
          border: `1px solid ${theme.borders.borderColor}`,
          borderRadius: theme.borders.borderRadius,
          backgroundColor: theme.colors.surface
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
            flexWrap: 'wrap'
          }}>
            {attachments.map((attachment) => (
              <div key={attachment.id} style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.borders.borderRadius,
                overflow: 'hidden'
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
                    fontSize: '12px',
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                    padding: '4px'
                  }}>
                    <div style={{ fontSize: '20px' }}>📄</div>
                    <div style={{
                      fontSize: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%'
                    }}>
                      {attachment.file.name}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'rgba(255, 0, 0, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '12px',
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

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiClick={insertEmojiAtCursor}
        theme={theme}
      />

      {/* GIF Picker */}
      {showGifPicker && (
        <div style={{
          marginBottom: theme.spacing.sm,
          padding: theme.spacing.sm,
          border: `1px solid ${theme.borders.borderColor}`,
          borderRadius: theme.borders.borderRadius,
          backgroundColor: theme.colors.surfaceAlt,
          maxHeight: compact ? '200px' : '300px',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: theme.font.sizeXs,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.xs
          }}>
            Click a GIF to add to your post
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: compact ? '4px' : '8px'
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
                onClick={() => addGifToCarousel(gifUrl)}
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
                    height: compact ? '60px' : '80px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}