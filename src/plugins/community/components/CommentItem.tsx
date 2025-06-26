import * as React from 'react'
import { ThumbsUp, MessageCircle, MoreHorizontal } from 'lucide-react'
import type { CommentItemProps, PostComment } from '../types'
import { defaultTheme } from '../../shared/default-theme'
import { ReplyForm } from './ReplyForm'

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onLike,  
  onUnlike,
  onReply,
  maxDepth = 3
}) => {
  const [showReplyForm, setShowReplyForm] = React.useState(false)
  // Always show replies by default, let user hide them if needed
  const [showReplies, setShowReplies] = React.useState(true)

  const handleLikeComment = async () => {
    try {
      if (comment.likedByUser) {
        await onUnlike(comment.id)
      } else {
        await onLike(comment.id)
      }
    } catch (error) {
      console.error('Error toggling comment like:', error)
    }
  }

  const handleReply = async (content: string) => {
    try {
      await onReply(content, comment.id)  // Fixed parameter order: content first, parentId second
      setShowReplyForm(false)
    } catch (error) {
      console.error('Error adding reply:', error)
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

  const canReply = comment.depth < maxDepth
  const hasReplies = comment.replies && comment.replies.length > 0
  

  return (
    <div className="group">
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: defaultTheme.colors.surfaceAlt }}
            >
              {comment.authorAvatar ? (
                <img 
                  src={comment.authorAvatar} 
                  alt={comment.authorName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (comment.authorName || 'U').charAt(0).toUpperCase()
              )}
            </div>
            
            {comment.authorLevel && (
              <div 
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-xs text-white font-bold"
                style={{ backgroundColor: defaultTheme.colors.secondary }}
              >
                {comment.authorLevel}
              </div>
            )}
          </div>
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm text-gray-900">
                {comment.authorName}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
            
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {comment.content}
            </div>
          </div>

          {/* Comment actions */}
          <div className="flex items-center space-x-4 mt-2 ml-2">
            <button
              onClick={handleLikeComment}
              className={`flex items-center space-x-1 text-xs transition-colors ${
                comment.likedByUser 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <ThumbsUp 
                className={`w-3 h-3 ${comment.likedByUser ? 'fill-current' : ''}`}
              />
              {comment.likes > 0 && (
                <span className="font-medium">{comment.likes}</span>
              )}
            </button>
            
            {canReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Reply
              </button>
            )}
            
            <button className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-gray-600 transition-opacity">
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>

          {/* Reply form */}
          {showReplyForm && (
            <div className="mt-3 ml-2">
              <ReplyForm
                parentId={comment.id}
                postId={comment.postId}
                currentUser={currentUser}
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`Reply to ${comment.authorName}...`}
              />
            </div>
          )}

          {/* Nested replies */}
          {hasReplies && (
            <div className="mt-3">
              {/* Show view button only if replies are hidden AND there are replies */}
              {!showReplies && (
                <button
                  onClick={() => setShowReplies(true)}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 font-medium mb-3 ml-2"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                </button>
              )}
              
              {/* Show replies when showReplies is true */}
              {showReplies && (
                <div className="space-y-3 border-l-2 border-gray-100 pl-4 ml-2">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUser={currentUser}
                      onLike={onLike}
                      onUnlike={onUnlike}
                      onReply={onReply}
                      maxDepth={maxDepth}
                    />
                  ))}
                  
                  {/* Show hide button only if there are multiple replies */}
                  {comment.replies.length > 1 && (
                    <button
                      onClick={() => setShowReplies(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium ml-2"
                    >
                      Hide replies
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}