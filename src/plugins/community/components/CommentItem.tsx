import * as React from 'react'
import { ThumbsUp, MessageCircle, MoreHorizontal, Link } from 'lucide-react'
import type { CommentItemProps, PostComment } from '../types'
import { defaultTheme } from '../../shared/default-theme'
import { ReplyForm } from './ReplyForm'
import { ContentRenderer } from './ContentRenderer'
import { UnifiedCarousel } from './UnifiedCarousel'

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onLike,  
  onUnlike,
  onReply,
  maxDepth = 2
}) => {
  const [showReplyForm, setShowReplyForm] = React.useState(false)
  // Always show replies by default, let user hide them if needed
  const [showReplies, setShowReplies] = React.useState(true)
  const [showAllReplies, setShowAllReplies] = React.useState(false)

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

  const handleReply = async (content: string, parentId?: string, mediaData?: any) => {
    try {
      await onReply(content, comment.id, mediaData)  // Pass media data to onReply
      console.log('DEBUG:CommentItem:handleReply:Reply added successfully')
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
            
            <div className="text-sm text-gray-700">
              <ContentRenderer content={comment.content} theme={defaultTheme} excludeGifs={true} />
            </div>
            
            {/* All media in unified carousel */}
            <div className="mt-3">
              <UnifiedCarousel
                key={`comment-carousel-${comment.id}`}
                attachments={(comment as any).attachments}
                videoUrl={comment.videoUrl}
                pollData={(comment as any).pollData}
                content={comment.content}
                theme={defaultTheme}
                type="comment"
              />
            </div>
            
            {/* Link preview (separate from media carousel) */}
            {comment.linkUrl && (
              <div className="mt-3">
                <a
                  href={comment.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors group max-w-md"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      <Link className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        External Link
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {comment.linkUrl}
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            )}
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
            
            {currentUser?.id === comment.authorId && (
              <button 
                onClick={() => alert(`Edit comment ${comment.id} - Edit functionality not implemented yet`)}
                className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-gray-700 font-medium transition-opacity">
                Edit
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
                  {/* Show first 2 replies or all if showAllReplies is true */}
                  {(showAllReplies ? comment.replies : comment.replies.slice(0, 2)).map((reply) => (
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
                  
                  {/* Show "View x more replies" if there are more than 2 replies and not showing all */}
                  {comment.replies.length > 2 && !showAllReplies && (
                    <button
                      onClick={() => setShowAllReplies(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2"
                    >
                      View {comment.replies.length - 2} more {comment.replies.length - 2 === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                  
                  {/* Show hide button only if there are multiple replies */}
                  {comment.replies.length > 1 && (
                    <button
                      onClick={() => {
                        setShowReplies(false)
                        setShowAllReplies(false) // Reset when hiding
                      }}
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