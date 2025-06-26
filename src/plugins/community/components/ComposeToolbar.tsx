import * as React from 'react'

interface ComposeToolbarProps {
  theme: any
  content: string
  setContent: (content: string) => void
  contentRef: React.RefObject<HTMLTextAreaElement>
  linkUrl: string
  setLinkUrl: (url: string) => void
  onFileUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void
  videoUrl?: string
  setVideoUrl?: (url: string) => void
  mediaType?: string
  setMediaType?: (type: string) => void
  pollOptions?: string[]
  setPollOptions?: (options: string[]) => void
  showPoll?: boolean
  showVideo?: boolean
  showAttachment?: boolean
  compact?: boolean
}

export const ComposeToolbar: React.FC<ComposeToolbarProps> = ({
  theme,
  content,
  setContent,
  contentRef,
  linkUrl,
  setLinkUrl,
  onFileUpload,
  videoUrl,
  setVideoUrl,
  mediaType,
  setMediaType,
  pollOptions,
  setPollOptions,
  showPoll = true,
  showVideo = true,
  showAttachment = true,
  compact = false
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [showGifPicker, setShowGifPicker] = React.useState(false)

  const insertAtCursor = (textToInsert: string) => {
    const textarea = contentRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + textToInsert + content.substring(end)
    
    setContent(newContent)
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
    }, 0)
  }

  const insertLinkAtCursor = () => {
    if (!linkUrl.trim()) return

    const textarea = contentRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const url = linkUrl.trim()
    
    // Create a markdown-style link or just the URL if no selection
    const selectedText = content.substring(start, end)
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

  const insertEmojiAtCursor = (emoji: string) => {
    insertAtCursor(emoji)
    setShowEmojiPicker(false)
  }

  const insertGifAtCursor = (gifUrl: string) => {
    const gifMarkdown = `![GIF](${gifUrl})`
    insertAtCursor(gifMarkdown)
    setShowGifPicker(false)
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
        {showAttachment && onFileUpload && (
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
              onChange={onFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        )}
        
        {/* Video */}
        {showVideo && setMediaType && (
          <button
            onClick={() => setMediaType(mediaType === 'video' ? 'none' : 'video')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: buttonSize,
              borderRadius: compact ? '8px' : '12px',
              backgroundColor: mediaType === 'video' ? theme.colors.secondary : theme.colors.surface,
              color: mediaType === 'video' ? 'white' : theme.colors.textSecondary,
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
        {showPoll && setMediaType && (
          <button
            onClick={() => setMediaType(mediaType === 'poll' ? 'none' : 'poll')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: buttonSize,
              borderRadius: compact ? '8px' : '12px',
              backgroundColor: mediaType === 'poll' ? theme.colors.secondary : theme.colors.surface,
              color: mediaType === 'poll' ? 'white' : theme.colors.textSecondary,
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

        {/* Link input */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          backgroundColor: theme.colors.surface,
          borderRadius: compact ? '8px' : '12px',
          padding: '2px',
          minHeight: compact ? '24px' : '28px',
          minWidth: compact ? '150px' : '200px'
        }}>
          <input
            type="url"
            placeholder="Paste link..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            style={{
              flex: 1,
              padding: compact ? '2px 6px' : '4px 8px',
              border: 'none',
              borderRadius: compact ? '6px' : '10px',
              fontSize: fontSize,
              backgroundColor: 'transparent',
              color: theme.colors.textPrimary,
              outline: 'none'
            }}
          />
          {linkUrl.trim() && (
            <button
              onClick={insertLinkAtCursor}
              style={{
                padding: compact ? '2px 6px' : '4px 8px',
                border: 'none',
                borderRadius: compact ? '4px' : '8px',
                backgroundColor: theme.colors.secondary,
                color: 'white',
                fontSize: compact ? '8px' : '10px',
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
          marginBottom: theme.spacing.sm,
          padding: theme.spacing.sm,
          border: `1px solid ${theme.borders.borderColor}`,
          borderRadius: theme.borders.borderRadius,
          backgroundColor: theme.colors.surfaceAlt,
          maxHeight: compact ? '150px' : '200px',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: theme.font.sizeXs,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.xs
          }}>
            Select Emoji
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: compact ? 'repeat(6, 1fr)' : 'repeat(8, 1fr)',
            gap: compact ? '4px' : '8px'
          }}>
            {['😀', '😂', '😊', '😍', '🤔', '😭', '😎', '🔥', '💯', '👍', '👎', '❤️', '💔', '🎉', '🎊', '👏', '🙌', '🤝', '💪', '🙏', '✨', '⭐', '🌟', '💎', '🏆', '🎯', '⚡', '💡', '🚀', '🎨', '🎵', '🎪'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => insertEmojiAtCursor(emoji)}
                style={{
                  padding: compact ? '4px' : '8px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: theme.colors.surface,
                  fontSize: compact ? '16px' : '20px',
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
            Select GIF
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
                onClick={() => insertGifAtCursor(gifUrl)}
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