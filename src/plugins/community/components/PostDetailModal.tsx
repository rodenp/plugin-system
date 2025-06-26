import * as React from 'react'
import { X, MessageCircle, MoreHorizontal, Video, Link, Smile, Send } from 'lucide-react'
import type { PostDetailModalProps, CommunityPost, PostComment } from '../types'
import { defaultTheme } from '../../shared/default-theme'
import { CommentItem } from './CommentItem'

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  isOpen,
  post,
  currentUser,
  onClose,
  onLikePost,
  onUnlikePost,
  onAddComment,
  onLikeComment,
  onUnlikeComment
}) => {
  
  // Comment box state
  const [commentContent, setCommentContent] = React.useState('')
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  
  // Modal states for video, link, emoji
  const [showVideoModal, setShowVideoModal] = React.useState(false)
  const [showLinkModal, setShowLinkModal] = React.useState(false)  
  const [showEmojiModal, setShowEmojiModal] = React.useState(false)

  // Handle ESC key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !post) return null

  const handleLikePost = async () => {
    try {
      if (post.likedByUser) {
        await onUnlikePost(post.id)
      } else {
        await onLikePost(post.id)
      }
    } catch (error) {
      console.error('Error toggling post like:', error)
    }
  }

  const handleAddComment = async (content: string, parentId?: string) => {
    try {
      await onAddComment(post.id, content, parentId)
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      await handleAddComment(commentContent.trim())
      setCommentContent('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'discussion': '#6B7280',
      'update': '#10B981', 
      'gem': '#F59E0B',
      'fun': '#EF4444',
      'announcement': '#8B5CF6'
    }
    return colors[category as keyof typeof colors] || '#6B7280'
  }

  // Get top-level comments (not replies)
  const topLevelComments = post.comments?.filter(comment => !comment.parentId) || []

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: defaultTheme.colors.surfaceAlt }}
              >
                {post.authorAvatar ? (
                  <img 
                    src={post.authorAvatar} 
                    alt={post.author}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (post.author || 'U').charAt(0).toUpperCase()
                )}
              </div>
              
              {post.authorLevel && (
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-bold"
                  style={{ backgroundColor: defaultTheme.colors.secondary }}
                >
                  {post.authorLevel}
                </div>
              )}
            </div>
            
            <div>
              <div className="font-semibold text-gray-900">{post.author || 'Anonymous'}</div>
              <div className="text-sm text-gray-500">
                {formatTimeAgo(post.createdAt)} • 
                <span 
                  className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getCategoryColor(post.category) }}
                >
                  {(post.category || 'general').charAt(0).toUpperCase() + (post.category || 'general').slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Post content */}
          <div className="p-6">
            {post.title && (
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {post.title}
              </h2>
            )}
            
            <div className="text-gray-700 mb-4 whitespace-pre-wrap">
              {post.content}
            </div>
            
            {post.imageUrl && (
              <div className="mb-4">
                <img 
                  src={post.imageUrl}
                  alt="Post content"
                  className="w-full rounded-lg"
                />
              </div>
            )}

            {/* Interaction buttons */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLikePost}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    post.likedByUser 
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">👍</span>
                  <span className="font-medium">{post.likes}</span>
                </button>
                
                <div className="flex items-center space-x-2 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{post.commentCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments section */}
          {topLevelComments.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="px-6 py-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Comments ({post.commentCount})
                </h3>
                
                <div className="space-y-4">
                  {topLevelComments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUser={currentUser}
                      onLike={onLikeComment}
                      onUnlike={onUnlikeComment}
                      onReply={handleAddComment}
                      maxDepth={3}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comment input at bottom */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <div className="flex space-x-3">
              {/* User avatar */}
              <div className="flex-shrink-0">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: defaultTheme.colors.surfaceAlt }}
                >
                  {currentUser?.profile?.avatar ? (
                    <img 
                      src={currentUser.profile.avatar} 
                      alt={currentUser.profile.displayName || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    (currentUser?.profile?.displayName?.charAt(0) || 'U').toUpperCase()
                  )}
                </div>
              </div>

              {/* Comment input */}
              <div className="flex-1">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  style={{ minHeight: '36px', maxHeight: '120px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = target.scrollHeight + 'px'
                  }}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between ml-11">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                  title="Add video"
                >
                  <Video className="w-5 h-5" />
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                  title="Add link"
                >
                  <Link className="w-5 h-5" />
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowEmojiModal(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              
              <button
                type="submit"
                disabled={!commentContent.trim() || isSubmittingComment}
                className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  commentContent.trim() && !isSubmittingComment
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingComment ? 'Posting...' : 'Post'}</span>
              </button>
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
                    setCommentContent(prev => prev + emoji)
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