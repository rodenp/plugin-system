import * as React from 'react'
import { Send, X, Video, Link, Smile } from 'lucide-react'
import type { ReplyFormProps } from '../types'
import { defaultTheme } from '../../shared/default-theme'

export const ReplyForm: React.FC<ReplyFormProps> = ({
  parentId,
  postId,
  currentUser,
  onSubmit,
  onCancel,
  placeholder = "Write a reply..."
}) => {
  const [content, setContent] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  
  // Modal states for video, link, emoji
  const [showVideoModal, setShowVideoModal] = React.useState(false)
  const [showLinkModal, setShowLinkModal] = React.useState(false)  
  const [showEmojiModal, setShowEmojiModal] = React.useState(false)

  // Auto-focus on mount
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(content.trim(), parentId)
      setContent('')
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e)
    }
    
    if (e.key === 'Escape') {
      onCancel?.()
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex space-x-3">
        {/* User avatar */}
        <div className="flex-shrink-0">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: defaultTheme.colors.surfaceAlt }}
          >
            {currentUser?.profile?.avatarUrl ? (
              <img 
                src={currentUser.profile.avatarUrl} 
                alt={currentUser.profile.displayName || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (currentUser?.profile?.displayName?.charAt(0) || 'U').toUpperCase()
            )}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full resize-none border-0 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              rows={1}
              style={{ minHeight: '36px', maxHeight: '120px' }}
            />
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                  title="Add video"
                >
                  <Video className="w-4 h-4" />
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                  title="Add link"
                >
                  <Link className="w-4 h-4" />
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowEmojiModal(true)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    content.trim() && !isSubmitting
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Video</h3>
              <button onClick={() => setShowVideoModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="url"
                placeholder="Enter video URL..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowVideoModal(false)
                    // TODO: Handle video addition
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Link</h3>
              <button onClick={() => setShowLinkModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="url"
                placeholder="Enter link URL..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Link title (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLinkModal(false)
                    // TODO: Handle link addition
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Modal */}
      {showEmojiModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Emoji</h3>
              <button onClick={() => setShowEmojiModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
              {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤐', '🤮', '🤢'].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setContent(prev => prev + emoji)
                    setShowEmojiModal(false)
                  }}
                  className="p-2 text-xl hover:bg-gray-100 rounded"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}