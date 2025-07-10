import * as React from 'react'
import { ThumbsUp, MessageCircle, MoreHorizontal, Link } from 'lucide-react'
import type { CommentItemProps, PostComment } from '../types'
import { defaultTheme } from '../../shared/default-theme'
import { ReplyForm } from './ReplyForm'
import { ContentRenderer } from './ContentRenderer'
import { UnifiedCarousel } from './UnifiedCarousel'
import { RichTextArea } from './RichTextArea'
import { UnifiedToolbar } from './UnifiedToolbar'

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onLike,  
  onUnlike,
  onReply,
  onEdit,
  onDelete,
  maxDepth,
  commentsDisabled = false
}) => {
  const [showReplyForm, setShowReplyForm] = React.useState(false)
  // Always show replies by default, let user hide them if needed
  const [showReplies, setShowReplies] = React.useState(true)
  const [showAllReplies, setShowAllReplies] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editContent, setEditContent] = React.useState(comment.content)
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [editAttachments, setEditAttachments] = React.useState<Array<{id: string, file: File, preview: string}>>([])
  const [editVideoUrl, setEditVideoUrl] = React.useState('')
  const [editLinkUrl, setEditLinkUrl] = React.useState('')

  // Toolbar state for edit mode
  const [editMediaType, setEditMediaType] = React.useState<string>('none')
  const [editPollOptions, setEditPollOptions] = React.useState<string[]>(['', ''])
  const editContentRef = React.useRef<HTMLDivElement>(null)

  // Fix depth calculation for replies in the replies array
  // Replies in the replies array should have depth = parent.depth + 1
  const fixedComment = {
    ...comment,
    replies: (comment.replies || []).map(reply => ({
      ...reply,
      depth: comment.depth + 1
    }))
  };

  const handleLikeComment = async () => {
    try {
      if (fixedComment.likedByUser) {
        await onUnlike(fixedComment.id)
      } else {
        await onLike(fixedComment.id)
      }
    } catch (error) {
      console.error('Error toggling comment like:', error)
    }
  }

  const handleReply = async (content: string, _parentId?: string, mediaData?: any) => {
    try {
      await onReply(content, fixedComment.id, mediaData)  // Pass media data to onReply
      console.log(`DEBUG:CommentItem:handleReply:Reply added successfully, content=${content}, parentId=${fixedComment.id}, mediaData=${JSON.stringify(mediaData)})`)
      setShowReplyForm(false)
    } catch (error) {
      console.error('Error adding reply:', error)
    }
  }

  const handleStartEdit = () => {
    setEditContent(fixedComment.content)
    
    // Initialize edit attachments with current comment attachments
    if ((fixedComment as any).attachments) {
      const convertedAttachments = (fixedComment as any).attachments.map((att: any) => ({
        id: att.id,
        file: new File([], att.name || 'file', { type: att.type || 'application/octet-stream' }),
        preview: att.preview || ''
      }))
      setEditAttachments(convertedAttachments)
    } else {
      setEditAttachments([])
    }
    
    // Initialize video and link URLs
    setEditVideoUrl(fixedComment.videoUrl || '')
    setEditLinkUrl(fixedComment.linkUrl || '')
    
    // Initialize media type based on comment content
    if (fixedComment.videoUrl) {
      setEditMediaType('video')
    } else if ((fixedComment as any).pollData) {
      setEditMediaType('poll')
      setEditPollOptions((fixedComment as any).pollData.options || ['', ''])
    } else {
      setEditMediaType('none')
    }
    
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditContent(fixedComment.content)
    setEditAttachments([])
    setEditVideoUrl('')
    setEditLinkUrl('')
    setEditMediaType('none')
    setEditPollOptions(['', ''])
    setIsEditing(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement> | any) => {
    // Handle GIF attachment from toolbar
    if (event.gifAttachment) {
      setEditAttachments(prev => [...prev, event.gifAttachment])
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
            
            const maxDimension = 300
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
            
            setEditAttachments(prev => [...prev, { id, file, preview: compressedPreview }])
          }
          img.src = preview
        } else {
          setEditAttachments(prev => [...prev, { id, file, preview }])
        }
      }
      
      reader.readAsDataURL(file)
    })

    event.target.value = ''
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      alert('Comment cannot be empty.')
      return
    }

    try {
      if (onEdit) {
        // Create media data for the comment edit
        let mediaData: any = {}
        
        // Set media type based on what content exists
        if (editMediaType === 'poll') {
          const validOptions = editPollOptions.filter(opt => opt.trim())
          if (validOptions.length >= 2) {
            mediaData.type = 'poll'
            mediaData.options = validOptions
          }
        }

        // Always include attachments in media data (even if empty array)
        mediaData.attachments = editAttachments.map(att => ({
          id: att.id,
          name: att.file.name,
          size: att.file.size,
          type: att.file.type,
          preview: att.preview
        }))
        
        await onEdit(comment.id, editContent.trim(), mediaData)
        
        // Update the comment object with new data (for immediate UI sync)
        Object.assign(comment, {
          content: editContent.trim(),
          attachments: mediaData.attachments.length > 0 ? mediaData.attachments : undefined,
          pollData: editMediaType === 'poll' ? { options: editPollOptions.filter(opt => opt.trim()) } : undefined,
          isEdited: true,
          updatedAt: new Date()
        })
        
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error editing comment:', error)
      alert('Error saving changes. Please try again.')
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this comment? This will also delete all replies.')) {
      try {
        if (onDelete) {
          await onDelete(comment.id)
        }
      } catch (error) {
        console.error('Error deleting comment:', error)
        alert('Error deleting comment. Please try again.')
      }
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

  // Limit replies: only allow replies to comments with depth 0 or 1
  // depth 0 = top-level comment on a post
  // depth 1 = first-level reply to a comment
  // depth 2+ = no more replies allowed (to prevent deep nesting)
  const canReply = fixedComment.depth < 2
  const hasReplies = fixedComment.replies && fixedComment.replies.length > 0

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
              {fixedComment.authorAvatar ? (
                <img 
                  src={fixedComment.authorAvatar} 
                  alt={fixedComment.authorName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (fixedComment.authorName || 'U').charAt(0).toUpperCase()
              )}
            </div>
            
            {fixedComment.authorLevel && (
              <div 
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-xs text-white font-bold"
                style={{ backgroundColor: defaultTheme.colors.secondary }}
              >
                {fixedComment.authorLevel}
              </div>
            )}
          </div>
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-2xl px-4 py-3 relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-gray-900">
                  {fixedComment.authorName}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(fixedComment.createdAt)}
                </span>
              </div>
              
              {/* 3-dot menu - only show for comment author */}
              {currentUser?.id === fixedComment.authorId && (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {showDropdown && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDropdown(false)}
                      />
                      {/* Dropdown menu */}
                      <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-32">
                        <button
                          onClick={() => {
                            handleStartEdit()
                            setShowDropdown(false)
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete()
                            setShowDropdown(false)
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {isEditing ? (
              /* Edit mode - single rounded container with text, carousel, and toolbar */
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 space-y-3">
                <RichTextArea
                  ref={editContentRef}
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Edit your comment..."
                  rows={3}
                  style={{
                    width: '100%',
                    resize: 'none',
                    border: 'none',
                    borderRadius: '0',
                    padding: '0',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    backgroundColor: 'transparent'
                  }}
                />
                
                {/* Carousel inside the container - only show if there's content */}
                {editAttachments.length > 0 && (
                  <UnifiedCarousel
                    key={`comment-carousel-${comment.id}-edit`}
                    attachments={editAttachments.map(att => ({
                      id: att.id,
                      name: att.file.name,
                      size: att.file.size,
                      type: att.file.type,
                      preview: att.preview
                    }))}
                    pollData={undefined}
                    content={editContent}
                    theme={defaultTheme}
                    type="comment"
                    editMode={true}
                    onDeleteAttachment={(attachmentId: string) => {
                      setEditAttachments(prev => prev.filter(att => att.id !== attachmentId));
                    }}
                    onAddAttachment={() => {
                      // Trigger file input for comment carousel
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.multiple = true
                      input.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt'
                      input.onchange = (event) => {
                        const files = (event.target as HTMLInputElement).files
                        if (!files) return

                        Array.from(files).forEach((file: File) => {
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
                                
                                const maxDimension = 300
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
                                
                                setEditAttachments(prev => [...prev, { id, file, preview: compressedPreview }])
                              }
                              img.src = preview
                            } else {
                              setEditAttachments(prev => [...prev, { id, file, preview }])
                            }
                          }
                          
                          reader.readAsDataURL(file)
                        })

                        // Reset input
                        input.value = ''
                      }
                      input.click()
                    }}
                  />
                )}
                
                {/* UnifiedToolbar inside the container */}
                <UnifiedToolbar
                  theme={defaultTheme}
                  content={editContent}
                  setContent={setEditContent}
                  contentRef={editContentRef}
                  linkUrl={editLinkUrl}
                  setLinkUrl={setEditLinkUrl}
                  videoUrl={editVideoUrl}
                  setVideoUrl={setEditVideoUrl}
                  mediaType={editMediaType}
                  setMediaType={setEditMediaType}
                  pollOptions={editPollOptions}
                  setPollOptions={setEditPollOptions}
                  attachments={editAttachments}
                  setAttachments={setEditAttachments}
                  onFileUpload={handleFileUpload}
                  compact={true}
                  showSubmit={false}
                  hideAttachments={true}
                  type="comment"
                />
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-700">
                  <ContentRenderer content={fixedComment.content} theme={defaultTheme} excludeGifs={true} />
                </div>
                
                {/* View mode carousel - only show if there's content */}
                {(fixedComment as any).attachments?.length > 0 && (
                  <div className="mt-3">
                    <UnifiedCarousel
                      key={`comment-carousel-${fixedComment.id}-view`}
                      attachments={(fixedComment as any).attachments}
                      pollData={undefined}
                      content={fixedComment.content}
                      theme={defaultTheme}
                      type="comment"
                      editMode={false}
                    />
                  </div>
                )}
              </>
            )}
            
            {/* Save/Cancel buttons for edit mode - positioned outside the container */}
            {isEditing && (
              <div className="flex gap-2 mt-3 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                  className="px-4 py-2 bg-gray-300 text-black font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  SAVE
                </button>
              </div>
            )}
          </div>

          {/* Comment actions */}
          <div className="flex items-center space-x-4 mt-2 ml-2">
            <button
              onClick={handleLikeComment}
              className={`flex items-center space-x-1 text-xs transition-colors ${
                fixedComment.likedByUser 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <ThumbsUp 
                className={`w-3 h-3 ${fixedComment.likedByUser ? 'fill-current' : ''}`}
              />
              {fixedComment.likes > 0 && (
                <span className="font-medium">{fixedComment.likes}</span>
              )}
            </button>
            
            {canReply && !commentsDisabled && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Reply
              </button>
            )}
            
          </div>

          {/* Reply form */}
          {showReplyForm && !commentsDisabled && (
            <div className="mt-3 ml-2">
              <ReplyForm
                parentId={fixedComment.id}
                postId={fixedComment.postId}
                currentUser={currentUser}
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`Reply to ${fixedComment.authorName}...`}
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
                  <span>View {fixedComment.replies.length} {fixedComment.replies.length === 1 ? 'reply' : 'replies'}</span>
                </button>
              )}
              
              {/* Show replies when showReplies is true */}
              {showReplies && (
                <div className="space-y-3 border-l-2 border-gray-100 pl-4 ml-2">
                  {/* Show first 2 replies or all if showAllReplies is true */}
                  {(showAllReplies ? fixedComment.replies : fixedComment.replies.slice(0, 2)).map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUser={currentUser}
                      onLike={onLike}
                      onUnlike={onUnlike}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      maxDepth={2}
                      commentsDisabled={commentsDisabled}
                    />
                  ))}
                  
                  {/* Show "View x more replies" if there are more than 2 replies and not showing all */}
                  {fixedComment.replies.length > 2 && !showAllReplies && (
                    <button
                      onClick={() => setShowAllReplies(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-2"
                    >
                      View {fixedComment.replies.length - 2} more {fixedComment.replies.length - 2 === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                  
                  {/* Show hide button only if there are multiple replies */}
                  {fixedComment.replies.length > 1 && (
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