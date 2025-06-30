import * as React from 'react'
import { X, MessageCircle, Link } from 'lucide-react'
import type { PostDetailModalProps, CommunityPost, PostComment } from '../types'
import { defaultTheme } from '../../shared/default-theme'
import { CommentItem } from './CommentItem'
import { UnifiedToolbar } from './UnifiedToolbar'
import { ContentRenderer } from './ContentRenderer'
import { UnifiedCarousel } from './UnifiedCarousel'
import { RichTextArea } from './RichTextArea'
import { PostDropdownMenu } from './PostDropdownMenu'

export const PostDetailModal: React.FC<PostDetailModalProps & { loadingComments?: boolean; onEditPost?: (post: any) => void }> = ({
  isOpen,
  post,
  currentUser,
  onClose,
  onLikePost,
  onUnlikePost: _onUnlikePost, // Not used - onLikePost handles toggle
  onAddComment,
  onLikeComment,
  onUnlikeComment,
  onEditComment,
  onDeleteComment,
  loadingComments = false,
  onEditPost
}) => {
  
  // Comment box state
  const [commentContent, setCommentContent] = React.useState('')
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  const commentTextareaRef = React.useRef<HTMLDivElement>(null)
  
  // ComposeToolbar state
  const [linkUrl, setLinkUrl] = React.useState('')
  const [videoUrl, setVideoUrl] = React.useState('')
  const [mediaType, setMediaType] = React.useState<string>('none')
  const [pollOptions, setPollOptions] = React.useState<string[]>(['', ''])
  const [attachments, setAttachments] = React.useState<Array<{id: string, file: File, preview: string}>>([])

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
      // Just call onLikePost - it handles the toggle logic
      await onLikePost(post.id)
    } catch (error) {
      console.error('Error toggling post like:', error)
    }
  }

  const handleAddComment = async (content: string, parentId?: string, mediaData?: any) => {
    try {
      await onAddComment(post.id, content, parentId, mediaData)
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }
  
  const handleReplyToComment = async (content: string, parentId: string, mediaData?: any) => {
    try {
      await onAddComment(post.id, content, parentId, mediaData)
    } catch (error) {
      console.error('Error adding reply:', error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentContent.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      // Create media data from current state
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
      
      await handleAddComment(commentContent.trim(), undefined, mediaData)
      
      // Reset form
      setCommentContent('')
      setVideoUrl('')
      setLinkUrl('')
      setMediaType('none')
      setPollOptions(['', ''])
      setAttachments([])
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement> | any) => {
    // Handle GIF attachment from ComposeToolbar
    if (event.gifAttachment) {
      setAttachments(prev => [...prev, event.gifAttachment])
      return
    }
    
    const files = event.target.files
    if (!files) return

    Array.from(files as FileList).forEach((file: File) => {
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

  // Get top-level comments (not replies)
  // Handle both cases: comments as array or comments as number
  const commentsArray = Array.isArray(post.comments) ? post.comments : []
  const topLevelComments = commentsArray.filter(comment => !comment.parentId)
  const commentCount = (post as any).commentCount || post.comments || 0

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
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
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
            <PostDropdownMenu
              postId={post.id}
              authorId={post.authorId}
              currentUserId={currentUser?.id || ''}
              isPinned={false}
              theme={defaultTheme}
              onEdit={currentUser?.id === post.authorId && onEditPost ? () => {
                onClose();
                onEditPost(post);
              } : undefined}
              onDelete={currentUser?.id === post.authorId ? () => {
                if (confirm('Are you sure you want to delete this post?')) {
                  // TODO: Implement delete functionality
                  alert('Delete functionality not implemented yet');
                }
              } : undefined}
              onCopyLink={() => {
                const postUrl = `${window.location.origin}/post/${post.id}`;
                navigator.clipboard.writeText(postUrl);
                alert('Post link copied to clipboard!');
              }}
              onChangeCategory={() => {
                alert('Change category feature coming soon!');
              }}
              onPinToFeed={() => {
                alert('Pin to feed feature coming soon!');
              }}
              onPinToCoursePage={() => {
                alert('Pin to course page feature coming soon!');
              }}
              onToggleComments={() => {
                alert('Toggle comments feature coming soon!');
              }}
              onReport={() => {
                alert('Report feature coming soon!');
              }}
            />
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Post content */}
          <div className="p-6">
            {post.title && (
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {post.title}
              </h2>
            )}
            
            <div className="text-gray-700 mb-4">
              <ContentRenderer content={post.content} theme={defaultTheme} excludeGifs={true} />
            </div>
            
            {/* All media in unified carousel */}
            <div className="mb-4">
              <UnifiedCarousel
                key={`detail-carousel-${post.id}`}
                attachments={(post as any).attachments}
                videoUrl={post.videoUrl}
                pollData={(post as any).pollData}
                content={post.content}
                theme={defaultTheme}
                type="post-detail"
              />
            </div>
            
            {/* Link preview (separate from media carousel) */}
            {post.linkUrl && (
              <div className="mb-4">
                <a
                  href={post.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Link className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        External Link
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {post.linkUrl}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Click to open in new tab →
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            )}
            
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
                  <span className="font-medium">{commentCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments section */}
          {(topLevelComments.length > 0 || commentCount > 0) && (
            <div className="border-t border-gray-200">
              <div className="px-6 py-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Comments ({commentCount})
                </h3>
                
                <div className="space-y-4">
                  {loadingComments ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : topLevelComments.length > 0 ? (
                    topLevelComments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        currentUser={currentUser}
                        onLike={onLikeComment}
                        onUnlike={onUnlikeComment}
                        onReply={handleReplyToComment}
                        onEdit={onEditComment}
                        onDelete={onDeleteComment}
                        maxDepth={3}
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      {commentCount > 0 ? 'Loading comments...' : 'No comments yet. Be the first to comment!'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comment input at bottom - fixed position */}
        <div className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="p-4">
            <form onSubmit={handleSubmitComment}>
              <div className="flex space-x-3 mb-3">
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
                  <RichTextArea
                    ref={commentTextareaRef}
                    value={commentContent}
                    onChange={setCommentContent}
                    placeholder="Write a comment..."
                    rows={1}
                    style={{
                      width: '100%',
                      resize: 'none',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      minHeight: '36px',
                      maxHeight: '100px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* UnifiedToolbar */}
              <div className="ml-11">
                <UnifiedToolbar
                  theme={defaultTheme}
                  content={commentContent}
                  setContent={setCommentContent}
                  contentRef={commentTextareaRef}
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
                  compact={true}
                  showSubmit={true}
                  submitLabel="Post"
                  onSubmit={handleSubmitComment}
                  isSubmitting={isSubmittingComment}
                  placeholder="Write a comment..."
                />
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  )
}