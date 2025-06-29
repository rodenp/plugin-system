import * as React from 'react'
import { Send, X } from 'lucide-react'
import { EmojiPickerModal } from './EmojiPickerModal'

interface UnifiedToolbarProps {
  theme: any
  content: string
  setContent: (content: string) => void
  contentRef: React.RefObject<HTMLTextAreaElement | HTMLDivElement>
  linkUrl: string
  setLinkUrl: (url: string) => void
  videoUrl: string
  setVideoUrl: (url: string) => void
  mediaType: string
  setMediaType: (type: string) => void
  pollOptions: string[]
  setPollOptions: (options: string[]) => void
  attachments: Array<{id: string, file: File, preview: string}>
  setAttachments: (attachments: Array<{id: string, file: File, preview: string}> | ((prev: Array<{id: string, file: File, preview: string}>) => Array<{id: string, file: File, preview: string}>)) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement> | any) => void
  compact?: boolean
  showSubmit?: boolean
  submitLabel?: string
  onSubmit?: (e: React.FormEvent) => void
  onCancel?: () => void
  isSubmitting?: boolean
  placeholder?: string
}

export const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
  theme,
  content,
  setContent,
  contentRef,
  linkUrl,
  setLinkUrl,
  videoUrl,
  setVideoUrl,
  mediaType,
  setMediaType,
  pollOptions,
  setPollOptions,
  attachments,
  setAttachments,
  onFileUpload,
  compact = false,
  showSubmit = false,
  submitLabel = 'Post',
  onSubmit,
  onCancel,
  isSubmitting = false,
  placeholder = 'Write something...'
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [showGifPicker, setShowGifPicker] = React.useState(false)
  const [storedSelection, setStoredSelection] = React.useState<{start: number, end: number} | null>(null)

  const insertAtCursor = (textToInsert: string) => {
    const element = contentRef.current
    if (!element) return

    if ('selectionStart' in element) {
      // Handle textarea
      const start = element.selectionStart || 0
      const end = element.selectionEnd || 0
      const newContent = content.substring(0, start) + textToInsert + content.substring(end)
      
      setContent(newContent)
      
      setTimeout(() => {
        element.focus()
        element.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
      }, 0)
    } else {
      // Handle contentEditable div
      element.focus()
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        
        const textNode = document.createTextNode(textToInsert)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.setEndAfter(textNode)
        selection.removeAllRanges()
        selection.addRange(range)
        
        // Trigger input event to update the content
        element.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
  }

  const insertLinkAtCursor = () => {
    if (!linkUrl.trim()) return

    const element = contentRef.current
    if (!element) return

    const url = linkUrl.trim()

    if ('selectionStart' in element) {
      // Handle textarea
      let start = 0
      let end = 0
      
      // Use stored selection if available, otherwise current selection
      if (storedSelection) {
        start = storedSelection.start
        end = storedSelection.end
      } else {
        start = element.selectionStart || 0
        end = element.selectionEnd || 0
      }
      
      // Get selected text or use cursor position
      const selectedText = content.substring(start, end)
      const formattedLink = selectedText ? `[${selectedText}](${url})` : `[${url}](${url})`
      
      const newContent = content.substring(0, start) + formattedLink + content.substring(end)
      
      setContent(newContent)
      setLinkUrl('')
      setStoredSelection(null)
      
      // Restore focus and position cursor
      setTimeout(() => {
        element.focus()
        const linkEnd = start + formattedLink.length
        element.setSelectionRange(linkEnd, linkEnd)
      }, 0)
    } else {
      // Handle contentEditable div - insert actual HTML link
      element.focus()
      
      // Use stored range if available, otherwise try current selection
      let range = storedRange
      if (!range) {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0)
        }
      }
      
      if (range) {
        const selectedText = range.toString()
        
        // Create the actual HTML link element
        const linkElement = document.createElement('a')
        linkElement.href = url
        linkElement.style.color = '#0066cc'
        linkElement.style.textDecoration = 'underline'
        linkElement.style.cursor = 'pointer'
        linkElement.contentEditable = 'false'
        linkElement.textContent = selectedText || url
        
        // Restore the selection first
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
          
          // If there was selected text, replace it; if not, insert at cursor position
          if (selectedText) {
            range.deleteContents()
          }
          range.insertNode(linkElement)
          
          // Position cursor after the inserted link
          range.setStartAfter(linkElement)
          range.setEndAfter(linkElement)
          selection.removeAllRanges()
          selection.addRange(range)
        }
        
        // Trigger input event to update the content
        element.dispatchEvent(new Event('input', { bubbles: true }))
      } else {
        // No stored range, insert at current cursor position
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const currentRange = selection.getRangeAt(0)
          
          // Create the actual HTML link element (same as above)
          const linkElement = document.createElement('a')
          linkElement.href = url
          linkElement.style.color = '#0066cc'
          linkElement.style.textDecoration = 'underline'
          linkElement.style.cursor = 'pointer'
          linkElement.contentEditable = 'false'
          linkElement.textContent = url  // URL becomes the visible text
          
          // Insert at current cursor position (no deleteContents since nothing selected)
          currentRange.insertNode(linkElement)
          
          // Position cursor after the inserted link
          currentRange.setStartAfter(linkElement)
          currentRange.setEndAfter(linkElement)
          selection.removeAllRanges()
          selection.addRange(currentRange)
          
          // Trigger input event to update the content
          element.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }
      
      setLinkUrl('')
      setStoredSelection(null)
      setStoredRange(null)
    }
  }

  // Store selection when user interacts with the content area
  const [storedRange, setStoredRange] = React.useState<Range | null>(null)

  React.useEffect(() => {
    const element = contentRef.current
    if (!element) return

    const storeSelection = () => {
      if ('selectionStart' in element) {
        // Handle textarea
        setStoredSelection({
          start: element.selectionStart || 0,
          end: element.selectionEnd || 0
        })
      } else {
        // Handle contentEditable - store the actual DOM range
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0 && element.contains(selection.anchorNode)) {
          const range = selection.getRangeAt(0).cloneRange()
          setStoredRange(range)
        }
      }
    }

    // Only add event listeners if the element supports them
    if (typeof element.addEventListener === 'function') {
      element.addEventListener('mouseup', storeSelection)
      element.addEventListener('keyup', storeSelection)
      element.addEventListener('focus', storeSelection)

      return () => {
        element.removeEventListener('mouseup', storeSelection)
        element.removeEventListener('keyup', storeSelection)
        element.removeEventListener('focus', storeSelection)
      }
    }
  }, [contentRef])


  const insertEmojiAtCursor = (emoji: string) => {
    insertAtCursor(emoji)
  }

  const insertGifAtCursor = (gifUrl: string) => {
    // Create a fake file event for GIF URL
    const gifAttachment = {
      id: `gif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      file: new File([], 'GIF', { type: 'image/gif' }),
      preview: gifUrl
    }
    // Simulate a file upload event
    const fakeEvent = {
      target: {
        files: null
      },
      gifAttachment // Pass the gif data
    }
    onFileUpload(fakeEvent)
    setShowGifPicker(false)
  }

  const [containerWidth, setContainerWidth] = React.useState<number>(0)
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  // Measure container width and adapt layout
  React.useEffect(() => {
    const updateWidth = () => {
      if (toolbarRef.current) {
        setContainerWidth(toolbarRef.current.offsetWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Responsive sizing based on container width
  const isVerySmall = containerWidth < 400
  const isSmall = containerWidth < 600
  const shouldStack = containerWidth < 500

  const buttonSize = compact || isVerySmall ? '3px 6px' : isSmall ? '4px 8px' : '6px 10px'
  const fontSize = compact || isVerySmall ? '9px' : isSmall ? '10px' : '12px'
  const gap = compact || isVerySmall ? '2px' : isSmall ? '4px' : '8px'
  const padding = compact || isVerySmall ? '3px' : isSmall ? '4px' : '8px'
  const borderRadius = compact || isVerySmall ? '12px' : isSmall ? '16px' : '20px'

  return (
    <>
      {/* Toolbar */}
      <div 
        ref={toolbarRef}
        style={{
          display: 'flex',
          gap: gap,
          marginBottom: theme.spacing.sm,
          padding: padding,
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: borderRadius,
          alignItems: shouldStack ? 'stretch' : 'center',
          flexWrap: shouldStack ? 'wrap' : 'nowrap',
          flexDirection: shouldStack ? 'column' : 'row'
        }}>
        {shouldStack ? (
          // Stacked layout for narrow screens
          <>
            {/* Top row - main actions */}
            <div style={{
              display: 'flex',
              gap: gap,
              width: '100%',
              flexWrap: 'wrap',
              justifyContent: 'space-around'
            }}>
              {/* Attachment */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: buttonSize,
                borderRadius: '8px',
                backgroundColor: theme.colors.surface,
                color: theme.colors.textSecondary,
                fontSize: fontSize,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flex: '1 1 auto',
                justifyContent: 'center',
                minWidth: '0'
              }}>
                <span>📎</span>
                {!isVerySmall && <span>File</span>}
                <input
                  type="file"
                  multiple
                  onChange={onFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
              
              {/* Video */}
              <button
                onClick={() => setMediaType(mediaType === 'video' ? 'none' : 'video')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: buttonSize,
                  borderRadius: '8px',
                  backgroundColor: mediaType === 'video' ? theme.colors.secondary : theme.colors.surface,
                  color: mediaType === 'video' ? 'white' : theme.colors.textSecondary,
                  fontSize: fontSize,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  flex: '1 1 auto',
                  justifyContent: 'center',
                  minWidth: '0'
                }}
              >
                <span>🎥</span>
                {!isVerySmall && <span>Video</span>}
              </button>

              {/* Poll */}
              <button
                onClick={() => setMediaType(mediaType === 'poll' ? 'none' : 'poll')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: buttonSize,
                  borderRadius: '8px',
                  backgroundColor: mediaType === 'poll' ? theme.colors.secondary : theme.colors.surface,
                  color: mediaType === 'poll' ? 'white' : theme.colors.textSecondary,
                  fontSize: fontSize,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  flex: '1 1 auto',
                  justifyContent: 'center',
                  minWidth: '0'
                }}
              >
                <span>📊</span>
                {!isVerySmall && <span>Poll</span>}
              </button>

              {/* Emoji */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: buttonSize,
                  borderRadius: '8px',
                  backgroundColor: showEmojiPicker ? theme.colors.secondary : theme.colors.surface,
                  color: showEmojiPicker ? 'white' : theme.colors.textSecondary,
                  fontSize: fontSize,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  flex: '1 1 auto',
                  justifyContent: 'center',
                  minWidth: '0'
                }}
              >
                <span>😀</span>
                {!isVerySmall && <span>Emoji</span>}
              </button>

              {/* GIF */}
              <button
                onClick={() => setShowGifPicker(!showGifPicker)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: buttonSize,
                  borderRadius: '8px',
                  backgroundColor: showGifPicker ? theme.colors.secondary : theme.colors.surface,
                  color: showGifPicker ? 'white' : theme.colors.textSecondary,
                  fontSize: fontSize,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  flex: '1 1 auto',
                  justifyContent: 'center',
                  minWidth: '0'
                }}
              >
                <span>🎬</span>
                {!isVerySmall && <span>GIF</span>}
              </button>
            </div>

            {/* Bottom row - link input */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              backgroundColor: theme.colors.surface,
              borderRadius: '8px',
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
                  borderRadius: '6px',
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
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: theme.colors.secondary,
                    color: 'white',
                    fontSize: '8px',
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
          </>
        ) : (
          // Horizontal layout for wider screens
          <>
            {/* Attachment */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: buttonSize,
              borderRadius: compact || isVerySmall ? '8px' : '12px',
              backgroundColor: theme.colors.surface,
              color: theme.colors.textSecondary,
              fontSize: fontSize,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}>
              <span>📎</span>
              <span>{isVerySmall ? 'File' : 'Attachment'}</span>
              <input
                type="file"
                multiple
                onChange={onFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            
            {/* Video */}
            <button
              onClick={() => setMediaType(mediaType === 'video' ? 'none' : 'video')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: buttonSize,
                borderRadius: compact || isVerySmall ? '8px' : '12px',
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

            {/* Poll */}
            <button
              onClick={() => setMediaType(mediaType === 'poll' ? 'none' : 'poll')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: buttonSize,
                borderRadius: compact || isVerySmall ? '8px' : '12px',
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

            {/* Emoji */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: buttonSize,
                borderRadius: compact || isVerySmall ? '8px' : '12px',
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
                borderRadius: compact || isVerySmall ? '8px' : '12px',
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
              borderRadius: compact || isVerySmall ? '8px' : '12px',
              padding: '2px',
              minHeight: compact || isVerySmall ? '24px' : '28px',
              minWidth: compact || isVerySmall ? '120px' : '180px'
            }}>
              <input
                type="url"
                placeholder="Paste link..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onMouseDown={() => {
                  const element = contentRef.current
                  if (element && typeof element.focus === 'function') {
                    
                    if ('selectionStart' in element) {
                      // Handle textarea
                      setStoredSelection({
                        start: element.selectionStart || 0,
                        end: element.selectionEnd || 0
                      })
                    } else {
                      // Handle contentEditable - store the current range
                      const selection = window.getSelection()
                      if (selection && selection.rangeCount > 0 && element.contains(selection.anchorNode)) {
                        const range = selection.getRangeAt(0).cloneRange()
                        setStoredRange(range)
                      }
                    }
                  }
                }}
                style={{
                  flex: 1,
                  padding: compact || isVerySmall ? '2px 6px' : '4px 8px',
                  border: 'none',
                  borderRadius: compact || isVerySmall ? '6px' : '10px',
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
                    padding: compact || isVerySmall ? '2px 6px' : '4px 8px',
                    border: 'none',
                    borderRadius: compact || isVerySmall ? '4px' : '8px',
                    backgroundColor: theme.colors.secondary,
                    color: 'white',
                    fontSize: compact || isVerySmall ? '8px' : '10px',
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
          </>
        )}
      </div>

      {/* Media-specific inputs */}
      {mediaType === 'video' && (
        <div style={{
          display: 'flex',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.sm
        }}>
          <input
            type="url"
            placeholder="Enter video URL (YouTube, Vimeo, etc.)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            style={{
              flex: 1,
              padding: compact ? theme.spacing.sm : theme.spacing.md,
              border: `1px solid ${theme.borders.borderColor}`,
              borderRadius: theme.borders.borderRadius,
              fontSize: compact ? theme.font.sizeSm : theme.font.sizeMd,
              fontFamily: theme.font.family,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary
            }}
          />
          <button
            onClick={() => {
              if (videoUrl.trim()) {
                // Add video as an attachment object
                const videoAttachment = {
                  id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                  file: new File([], 'Video', { type: 'video/url' }),
                  preview: videoUrl.trim()
                }
                setAttachments(prev => [...prev, videoAttachment])
                setVideoUrl('')
                setMediaType('none')
              }
            }}
            disabled={!videoUrl.trim()}
            style={{
              padding: compact ? `${theme.spacing.xs} ${theme.spacing.sm}` : `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: videoUrl.trim() ? theme.colors.accent : theme.colors.surfaceAlt,
              color: videoUrl.trim() ? 'white' : theme.colors.textSecondary,
              border: 'none',
              borderRadius: theme.borders.borderRadius,
              cursor: videoUrl.trim() ? 'pointer' : 'not-allowed',
              fontSize: compact ? theme.font.sizeXs : theme.font.sizeSm,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            Add Video
          </button>
        </div>
      )}

      {mediaType === 'poll' && (
        <div style={{ marginBottom: theme.spacing.sm }}>
          <div style={{
            fontSize: compact ? theme.font.sizeXs : theme.font.sizeSm,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.xs
          }}>
            Poll Options
          </div>
          {pollOptions.map((option, index) => (
            <div key={index} style={{
              display: 'flex',
              gap: theme.spacing.xs,
              marginBottom: theme.spacing.xs
            }}>
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
                  padding: compact ? theme.spacing.xs : theme.spacing.sm,
                  border: `1px solid ${theme.borders.borderColor}`,
                  borderRadius: theme.borders.borderRadius,
                  fontSize: compact ? theme.font.sizeXs : theme.font.sizeSm,
                  fontFamily: theme.font.family,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary
                }}
              />
              {pollOptions.length > 2 && (
                <button
                  onClick={() => {
                    const newOptions = pollOptions.filter((_, i) => i !== index)
                    setPollOptions(newOptions)
                  }}
                  style={{
                    padding: compact ? theme.spacing.xs : theme.spacing.sm,
                    border: `1px solid ${theme.colors.danger}`,
                    borderRadius: theme.borders.borderRadius,
                    backgroundColor: 'transparent',
                    color: theme.colors.danger,
                    cursor: 'pointer',
                    fontSize: compact ? theme.font.sizeXs : theme.font.sizeSm
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
                padding: compact ? theme.spacing.xs : theme.spacing.sm,
                border: `1px dashed ${theme.borders.borderColor}`,
                borderRadius: theme.borders.borderRadius,
                backgroundColor: 'transparent',
                color: theme.colors.textSecondary,
                cursor: 'pointer',
                fontSize: compact ? theme.font.sizeXs : theme.font.sizeSm,
                width: '100%'
              }}
            >
              + Add Option
            </button>
          )}
        </div>
      )}

      {/* Attachments Display */}
      {attachments.length > 0 && (
        <div style={{
          marginBottom: theme.spacing.sm,
          padding: compact ? theme.spacing.xs : theme.spacing.sm,
          border: `1px solid ${theme.borders.borderColor}`,
          borderRadius: theme.borders.borderRadius,
          backgroundColor: theme.colors.surfaceAlt
        }}>
          <div style={{
            fontSize: compact ? theme.font.sizeXs : theme.font.sizeSm,
            fontWeight: 600,
            color: theme.colors.textPrimary,
            marginBottom: theme.spacing.xs
          }}>
            Attachments ({attachments.length})
          </div>
          <div style={{
            display: 'flex',
            gap: compact ? theme.spacing.xs : theme.spacing.sm,
            overflowX: 'auto',
            padding: theme.spacing.xs
          }}>
            {attachments.map((attachment) => (
              <div key={attachment.id} style={{
                position: 'relative',
                minWidth: compact ? '60px' : '80px',
                height: compact ? '60px' : '80px',
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
                ) : attachment.file.type === 'video/url' ? (
                  (() => {
                    const url = attachment.preview
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                      let videoId = ''
                      if (url.includes('youtu.be/')) {
                        videoId = url.split('youtu.be/')[1].split('?')[0]
                      } else if (url.includes('youtube.com/watch?v=')) {
                        videoId = url.split('v=')[1].split('&')[0]
                      }
                      
                      return (
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&controls=0&modestbranding=1&rel=0&disablekb=1`}
                          style={{
                            width: 'auto',
                            height: '100%',
                            aspectRatio: '16/9',
                            border: 'none',
                            borderRadius: theme.borders.borderRadius,
                            pointerEvents: 'none'
                          }}
                          title="Embedded YouTube video"
                        />
                      )
                    } else if (url.includes('vimeo.com')) {
                      const videoId = url.split('vimeo.com/')[1].split('?')[0]
                      return (
                        <iframe
                          src={`https://player.vimeo.com/video/${videoId}?autoplay=0&muted=1&controls=0&title=0&byline=0&portrait=0`}
                          style={{
                            width: 'auto',
                            height: '100%',
                            aspectRatio: '16/9',
                            border: 'none',
                            borderRadius: theme.borders.borderRadius,
                            pointerEvents: 'none'
                          }}
                          title="Embedded Vimeo video"
                        />
                      )
                    } else {
                      return (
                        <video 
                          src={url}
                          muted
                          style={{
                            width: 'auto',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: theme.borders.borderRadius,
                            pointerEvents: 'none'
                          }}
                        />
                      )
                    }
                  })()
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
                    <div style={{ fontSize: compact ? '16px' : '20px', marginBottom: theme.spacing.xs }}>📄</div>
                    <div style={{
                      fontSize: compact ? theme.font.sizeXs : theme.font.sizeSm,
                      color: theme.colors.textSecondary,
                      wordBreak: 'break-all'
                    }}>
                      {attachment.file.name.length > (compact ? 6 : 8)
                        ? attachment.file.name.substring(0, compact ? 6 : 8) + '...' 
                        : attachment.file.name}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setAttachments(prev => prev.filter(att => att.id !== attachment.id))}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: compact ? '16px' : '20px',
                    height: compact ? '16px' : '20px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    border: 'none',
                    fontSize: compact ? '10px' : '12px',
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

      {/* Submit/Cancel buttons */}
      {showSubmit && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'end',
          gap: theme.spacing.sm
        }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: compact ? `${theme.spacing.xs} ${theme.spacing.sm}` : `${theme.spacing.sm} ${theme.spacing.md}`,
                color: theme.colors.textSecondary,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: compact ? theme.font.sizeXs : theme.font.sizeSm
              }}
            >
              <X className={`w-${compact ? '3' : '4'} h-${compact ? '3' : '4'}`} />
            </button>
          )}
          
          <button
            type="submit"
            onClick={onSubmit}
            disabled={!content.trim() || isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              padding: compact ? `${theme.spacing.xs} ${theme.spacing.sm}` : `${theme.spacing.sm} ${theme.spacing.md}`,
              borderRadius: theme.borders.borderRadius,
              fontSize: compact ? theme.font.sizeXs : theme.font.sizeSm,
              fontWeight: 600,
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: content.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
              backgroundColor: content.trim() && !isSubmitting ? theme.colors.secondary : theme.colors.muted,
              color: 'white'
            }}
          >
            <Send className={`w-${compact ? '3' : '4'} h-${compact ? '3' : '4'}`} />
            <span>{isSubmitting ? 'Posting...' : submitLabel}</span>
          </button>
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
            fontSize: compact ? theme.font.sizeXs : theme.font.sizeSm,
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