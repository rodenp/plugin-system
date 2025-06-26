import * as React from 'react'
import { X, MessageCircle, MoreHorizontal, Send, Link } from 'lucide-react'
import type { PostDetailModalProps, CommunityPost, PostComment } from '../types'
import { defaultTheme } from '../../shared/default-theme'
import { CommentItem } from './CommentItem'
import { ComposeToolbar } from './ComposeToolbar'
import { ContentRenderer } from './ContentRenderer'
import { MediaCarousel } from './MediaCarousel'

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
  const commentTextareaRef = React.useRef<HTMLTextAreaElement>(null)
  
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
      if (post.likedByUser) {
        await onUnlikePost(post.id)
      } else {
        await onLikePost(post.id)
      }
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
            {currentUser?.id === post.authorId && (
              <button 
                onClick={() => alert(`Edit post ${post.id} - Edit functionality not implemented yet`)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md">
                Edit
              </button>
            )}
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
              <MediaCarousel
                attachments={(post as any).attachments}
                videoUrl={post.videoUrl}
                pollData={(post as any).pollData}
                content={post.content}
                theme={defaultTheme}
                compact={false}
                showCloseButton={false}
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
                      onReply={handleReplyToComment}
                      maxDepth={3}
                    />
                  ))}
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
                  <textarea
                    ref={commentTextareaRef}
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    style={{ minHeight: '36px', maxHeight: '100px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = Math.min(target.scrollHeight, 100) + 'px'
                    }}
                  />
                </div>
              </div>

              {/* ComposeToolbar */}
              <div className="ml-11">
                <ComposeToolbar
                  theme={defaultTheme}
                  content={commentContent}
                  setContent={setCommentContent}
                  contentRef={commentTextareaRef}
                  linkUrl={linkUrl}
                  setLinkUrl={setLinkUrl}
                  onFileUpload={handleFileUpload}
                  videoUrl={videoUrl}
                  setVideoUrl={setVideoUrl}
                  mediaType={mediaType}
                  setMediaType={setMediaType}
                  pollOptions={pollOptions}
                  setPollOptions={setPollOptions}
                  showPoll={true}
                  showVideo={true}
                  showAttachment={true}
                  compact={true}
                />
              </div>

              {/* Media-specific inputs */}
              <div className="ml-11">
                {mediaType === 'video' && (
                  <input
                    type="url"
                    placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                )}

                {mediaType === 'poll' && (
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-gray-900 mb-2">
                      Poll Options
                    </div>
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...pollOptions]
                            newOptions[index] = e.target.value
                            setPollOptions(newOptions)
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            onClick={() => {
                              const newOptions = pollOptions.filter((_, i) => i !== index)
                              setPollOptions(newOptions)
                            }}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <button
                        onClick={() => setPollOptions([...pollOptions, ''])}
                        className="text-sm text-blue-600 hover:text-blue-800 border border-dashed border-gray-300 rounded p-2 w-full"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                {/* Attachments Display */}
                {attachments.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-gray-900 mb-2">
                      Attachments ({attachments.length})
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="relative min-w-[80px] h-20 bg-gray-100 rounded border overflow-hidden">
                          {attachment.file.type.startsWith('image/') ? (
                            <img
                              src={attachment.preview}
                              alt={attachment.file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-600">
                              <div>📄</div>
                              <div className="truncate w-full px-1 text-center">
                                {attachment.file.name.length > 8 
                                  ? attachment.file.name.substring(0, 8) + '...' 
                                  : attachment.file.name}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => setAttachments(prev => prev.filter(att => att.id !== attachment.id))}
                            className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-bl flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <div className="flex justify-end mt-3 ml-11">
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

      </div>

    </div>
  )
}