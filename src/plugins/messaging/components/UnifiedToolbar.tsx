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
  hideAttachments?: boolean
  hidePollEditor?: boolean
  // New props for enhanced functionality
  type?: 'post' | 'comment' | 'reply'
  category?: string
  setCategory?: (category: string) => void
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
  placeholder = 'Write something...',
  hideAttachments = false,
  hidePollEditor = false,
  type = 'comment',
  category = 'discussion',
  setCategory
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [showGifPicker, setShowGifPicker] = React.useState(false)
  const [showLinkModal, setShowLinkModal] = React.useState(false)
  const [showVideoModal, setShowVideoModal] = React.useState(false)
  const [linkInputUrl, setLinkInputUrl] = React.useState('')
  const [videoInputUrl, setVideoInputUrl] = React.useState('')
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
      
      // Try to use stored range first, then current selection
      let range = storedRange
      const selection = window.getSelection()
      
      if (!range && selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
      }
      
      if (range) {
        // Restore the selection
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
        
        range.deleteContents()
        
        const textNode = document.createTextNode(textToInsert)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.setEndAfter(textNode)
        
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
        
        // Trigger input event to update the content
        element.dispatchEvent(new Event('input', { bubbles: true }))
        
        // Clear stored range after use
        setStoredRange(null)
      } else {
        // No stored range and no current selection - insert at end
        element.focus()
        const textNode = document.createTextNode(textToInsert)
        element.appendChild(textNode)
        
        // Position cursor after the inserted text
        if (selection) {
          const newRange = document.createRange()
          newRange.setStartAfter(textNode)
          newRange.setEndAfter(textNode)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
        
        // Trigger input event to update the content
        element.dispatchEvent(new Event('input', { bubbles: true }))
      }
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

  const handleLinkSubmit = () => {
    if (!linkInputUrl.trim()) return
    
    // Use existing link insertion logic but with modal input
    const url = linkInputUrl.trim()
    const element = contentRef.current
    if (!element) return

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
      }
      
      setStoredRange(null)
    }
    
    // Close modal and reset
    setShowLinkModal(false)
    setLinkInputUrl('')
  }

  const handleVideoSubmit = () => {
    if (!videoInputUrl.trim()) return
    
    // Create a video attachment (following GIF pattern)
    const videoAttachment = {
      id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      file: new File([], 'Video', { type: 'video/url' }),
      preview: videoInputUrl.trim()
    }
    
    // Use the same mechanism as GIFs
    const fakeEvent = {
      target: { files: null },
      gifAttachment: videoAttachment
    }
    
    onFileUpload(fakeEvent)
    setShowVideoModal(false)
    setVideoInputUrl('')
  }

  return (
    <>
      {/* New screenshot-style toolbar */}
      <div className="flex items-center justify-end p-2 mt-2">
        <div className="flex items-center gap-2">
          {/* File attachment */}
          <label className="cursor-pointer p-1 hover:bg-gray-200 rounded" title="Attach file">
            <span className="text-base">📎</span>
            <input
              type="file"
              multiple
              onChange={onFileUpload}
              style={{ display: 'none' }}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />
          </label>
          
          {/* Link */}
          <button 
            className="p-1 hover:bg-gray-200 rounded"
            onClick={() => setShowLinkModal(true)}
            title="Add link"
          >
            <span className="text-base">🔗</span>
          </button>
          
          {/* Video */}
          <button 
            className="p-1 hover:bg-gray-200 rounded"
            onClick={() => setShowVideoModal(true)}
            title="Add video"
          >
            <span className="text-base">🎥</span>
          </button>
          
          {/* Poll - only show for posts */}
          {type === 'post' && (
            <button 
              className="p-1 hover:bg-gray-200 rounded"
              onClick={() => {
                if (mediaType === 'poll') {
                  setMediaType('none')
                  setPollOptions(['', ''])
                } else {
                  setMediaType('poll')
                  setPollOptions(['', ''])
                }
              }}
              title="Add poll"
            >
              <span className="text-base">📊</span>
            </button>
          )}
          
          {/* Emoji */}
          <button 
            className="p-1 hover:bg-gray-200 rounded"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add emoji"
          >
            <span className="text-base">😀</span>
          </button>
          
          {/* GIF */}
          <button 
            className="p-1 hover:bg-gray-200 rounded"
            onClick={() => setShowGifPicker(!showGifPicker)}
            title="Add GIF"
          >
            <span className="text-base">🎬</span>
          </button>
          
        </div>
        
        {/* Right side buttons */}
        <div className="flex items-center gap-2 ml-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 font-medium"
            >
              CANCEL
            </button>
          )}
          {showSubmit && onSubmit && (
            <button
              onClick={onSubmit}
              disabled={!content.trim() || isSubmitting}
              className="px-4 py-2 bg-yellow-400 text-black font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'SAVING...' : submitLabel.toUpperCase()}
            </button>
          )}
        </div>
      </div>
      
      
      {/* Poll options when poll is selected - always show under text content */}
      {mediaType === 'poll' && !hidePollEditor && (
        <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700">Poll Options</div>
            <button
              onClick={() => {
                setMediaType('none')
                setPollOptions(['', ''])
              }}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Remove Poll
            </button>
          </div>
          <div className="space-y-2">
            {pollOptions.map((option, index) => (
              <input
                key={index}
                type="text"
                placeholder={`Option ${index + 1}...`}
                value={option}
                onChange={(e) => {
                  const newOptions = [...pollOptions];
                  newOptions[index] = e.target.value;
                  setPollOptions(newOptions);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ))}
            <button
              onClick={() => setPollOptions([...pollOptions, ''])}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              + Add Option
            </button>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add link</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter a URL
              </label>
              <input
                type="url"
                value={linkInputUrl}
                onChange={(e) => setLinkInputUrl(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                placeholder="https://..."
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkInputUrl('');
                }}
                className="px-4 py-2 text-gray-600 font-medium"
              >
                CANCEL
              </button>
              <button
                onClick={handleLinkSubmit}
                disabled={!linkInputUrl.trim()}
                className="px-4 py-2 bg-yellow-400 text-black font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                LINK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add video</h2>
            <p className="text-gray-600 mb-4">Add a YouTube, Vimeo, Loom, or Wistia link.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link
              </label>
              <input
                type="url"
                value={videoInputUrl}
                onChange={(e) => setVideoInputUrl(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                placeholder=""
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoInputUrl('');
                }}
                className="px-4 py-2 text-gray-600 font-medium"
              >
                CANCEL
              </button>
              <button
                onClick={handleVideoSubmit}
                disabled={!videoInputUrl.trim()}
                className="px-4 py-2 bg-yellow-400 text-black font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                LINK
              </button>
            </div>
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
        <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Click a GIF to add to your post
          </div>
          <div className="grid grid-cols-3 gap-2">
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
                className="p-1 border-none rounded bg-white cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden"
              >
                <img
                  src={gifUrl}
                  alt={`GIF ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}