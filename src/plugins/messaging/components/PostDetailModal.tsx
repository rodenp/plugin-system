import * as React from 'react'
import { X, MessageCircle } from 'lucide-react'
import type { PostDetailModalProps } from '../types'
import { defaultTheme } from '../../shared/default-theme'
import { CommentItem } from './CommentItem'
import { UnifiedToolbar } from './UnifiedToolbar'
import { ContentRenderer } from './ContentRenderer'
import { UnifiedCarousel } from './UnifiedCarousel'
import { RichTextArea } from './RichTextArea'
import { PostDropdownMenu } from './PostDropdownMenu'

export const PostDetailModal: React.FC<PostDetailModalProps & { 
  loadingComments?: boolean; 
  onEditPost?: (postId: string, updates: { title?: string; content: string; category?: string; mediaData?: any }) => Promise<void>;
  onPinPost?: (postId: string) => Promise<void>;
  onToggleComments?: (postId: string) => Promise<void>;
  onVotePoll?: (postId: string, optionIndex: number) => Promise<void>;
  onRemoveVote?: (postId: string) => Promise<void>;
}> = ({
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
  onEditPost,
  onPinPost,
  onToggleComments,
  onVotePoll,
  onRemoveVote
}) => {
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState('')
  const [editContent, setEditContent] = React.useState('')
  const [editCategory, setEditCategory] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)
  
  // Edit mode media state
  const [editMediaType, setEditMediaType] = React.useState<string>('none')
  const [editVideoUrl, setEditVideoUrl] = React.useState('')
  const [editLinkUrl, setEditLinkUrl] = React.useState('')
  const [editPollOptions, setEditPollOptions] = React.useState<string[]>(['', ''])
  const [editPollTitle, setEditPollTitle] = React.useState('')
  const [showPollPreview, setShowPollPreview] = React.useState(false)
  const [editAttachments, setEditAttachments] = React.useState<Array<{id: string, file: File, preview: string}>>([])
  const editContentRef = React.useRef<HTMLDivElement>(null)
  
  // Comment box state
  const [commentContent, setCommentContent] = React.useState('')
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)
  const commentTextareaRef = React.useRef<HTMLDivElement>(null)
  
  // Vote modal state
  const [showRemoveVoteModal, setShowRemoveVoteModal] = React.useState(false)
  const [showChangeVoteModal, setShowChangeVoteModal] = React.useState(false)
  const [pendingVoteRemoval, setPendingVoteRemoval] = React.useState<number | null>(null)
  const [pendingVoteChange, setPendingVoteChange] = React.useState<{ from: number; to: number } | null>(null)
  
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
      'discussion': defaultTheme.colors.textSecondary,
      'update': defaultTheme.colors.accent, 
      'gem': defaultTheme.colors.highlight,
      'fun': defaultTheme.colors.danger,
      'announcement': defaultTheme.colors.level
    }
    return colors[category as keyof typeof colors] || defaultTheme.colors.textSecondary
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

  const handlePostFileUpload = (event: React.ChangeEvent<HTMLInputElement> | any) => {
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

  // Get top-level comments (not replies)
  // Handle both cases: comments as array or comments as number
  const commentsArray = Array.isArray(post.comments) ? post.comments : []
  const topLevelComments = commentsArray.filter(comment => !comment.parentId)
  const commentCount = (post as any).commentCount || post.comments || 0

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        style={{
          backgroundColor: defaultTheme.colors.surface,
          borderRadius: defaultTheme.borders.borderRadius,
          boxShadow: defaultTheme.borders.boxShadow,
          width: '100%',
          maxWidth: '42rem',
          maxHeight: '95vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: defaultTheme.spacing.md,
          borderBottom: `1px solid ${defaultTheme.borders.borderColor}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: defaultTheme.spacing.sm
          }}>
            <div style={{ position: 'relative' }}>
              <div 
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: defaultTheme.colors.surface,
                  fontWeight: '600',
                  backgroundColor: defaultTheme.colors.surfaceAlt
                }}
              >
                {post.authorAvatar ? (
                  <img 
                    src={post.authorAvatar} 
                    alt={post.author}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  (post.author || 'U').charAt(0).toUpperCase()
                )}
              </div>
              
              {post.authorLevel && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: defaultTheme.font.sizeXs,
                    color: defaultTheme.colors.surface,
                    fontWeight: 'bold',
                    backgroundColor: defaultTheme.colors.secondary
                  }}
                >
                  {post.authorLevel}
                </div>
              )}
            </div>
            
            <div>
              <div style={{
                fontWeight: '600',
                color: defaultTheme.colors.textPrimary
              }}>
                {post.author || 'Anonymous'}
              </div>
              <div style={{
                fontSize: defaultTheme.font.sizeSm,
                color: defaultTheme.colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                gap: defaultTheme.spacing.xs
              }}>
                {formatTimeAgo(post.createdAt)} • 
                {isEditMode ? (
                  /* Category dropdown in header when editing */
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{
                      padding: `${defaultTheme.spacing.xs} ${defaultTheme.spacing.sm}`,
                      border: `1px solid ${defaultTheme.borders.borderColor}`,
                      borderRadius: defaultTheme.spacing.xs,
                      fontSize: defaultTheme.font.sizeXs,
                      backgroundColor: defaultTheme.colors.surface
                    }}
                  >
                    <option value="discussion">💬 Discussion</option>
                    <option value="update">📢 Update</option>
                    <option value="gem">💎 Gem</option>
                    <option value="fun">🎉 Fun</option>
                    <option value="announcement">📣 Announcement</option>
                  </select>
                ) : (
                  /* Category display in header when viewing */
                  <span 
                    style={{
                      padding: `${defaultTheme.spacing.xs} ${defaultTheme.spacing.sm}`,
                      borderRadius: '9999px',
                      fontSize: defaultTheme.font.sizeXs,
                      fontWeight: '500',
                      color: defaultTheme.colors.surface,
                      backgroundColor: getCategoryColor(post.category)
                    }}
                  >
                    {(post.category || 'general').charAt(0).toUpperCase() + (post.category || 'general').slice(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: defaultTheme.spacing.xs
          }}>
            <PostDropdownMenu
              postId={post.id}
              authorId={post.authorId}
              currentUserId={currentUser?.id || ''}
              isPinned={post.isPinned || false}
              commentsDisabled={(post as any).commentsDisabled || false}
              theme={defaultTheme}
              onEdit={currentUser?.id === post.authorId && onEditPost ? () => {
                setIsEditMode(true);
                setEditTitle(post.title || '');
                setEditContent(post.content || '');
                setEditCategory(post.category || 'discussion');
                
                // Initialize edit media state from post data
                setEditVideoUrl(post.videoUrl || '');
                setEditLinkUrl(post.linkUrl || '');
                
                // Always initialize attachments if they exist
                if ((post as any).attachments && (post as any).attachments.length > 0) {
                  setEditAttachments((post as any).attachments.map((att: any) => ({
                    id: att.id,
                    file: new File([], att.name || 'file', { type: att.type || 'application/octet-stream' }),
                    preview: att.preview || ''
                  })));
                } else {
                  setEditAttachments([]);
                }
                
                // Set media type based on what exists
                if (post.videoUrl) {
                  setEditMediaType('video');
                } else if (post.linkUrl) {
                  setEditMediaType('link');
                } else if ((post as any).pollData) {
                  setEditMediaType('poll');
                  setEditPollOptions((post as any).pollData.options || ['', '']);
                  setEditPollTitle((post as any).pollData.title || '');
                } else {
                  setEditMediaType('none');
                }
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
              onPinToFeed={onPinPost ? () => onPinPost(post.id) : undefined}
              onPinToCoursePage={() => {
                alert('Pin to course page feature coming soon!');
              }}
              onToggleComments={onToggleComments ? () => onToggleComments(post.id) : undefined}
              onReport={() => {
                alert('Report feature coming soon!');
              }}
            />
            <button 
              onClick={onClose}
              style={{
                padding: defaultTheme.spacing.sm,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = defaultTheme.colors.surfaceAlt
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <X style={{
                width: '1.25rem',
                height: '1.25rem',
                color: defaultTheme.colors.textSecondary
              }} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0
        }}>
          {/* Post content */}
          <div style={{ padding: `${defaultTheme.spacing.lg} ${defaultTheme.spacing.lg}` }}>
            {isEditMode ? (
              /* Edit mode - no extra bordered container, consistent with view mode */
              <>
                {/* Title input */}
                <input
                  type="text"
                  placeholder="Add a title (optional)"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 0,
                    border: 'none',
                    fontSize: defaultTheme.font.sizeXl,
                    fontWeight: 'bold',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    marginBottom: defaultTheme.spacing.sm,
                    color: defaultTheme.colors.textPrimary
                  }}
                />
                
                {/* Content area - using same ContentRenderer as view mode */}
                <div style={{ color: defaultTheme.colors.textPrimary }}>
                  <div
                    ref={editContentRef}
                    contentEditable
                    suppressContentEditableWarning={true}
                    onInput={(e) => {
                      const target = e.target as HTMLDivElement
                      setEditContent(target.innerHTML)
                    }}
                    dangerouslySetInnerHTML={{ __html: editContent }}
                    style={{
                      outline: 'none',
                      minHeight: '1.5em',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}
                    data-placeholder={!editContent ? "What's on your mind?" : ''}
                  />
                </div>
                
                {/* Poll in edit mode - show after text, before carousel */}
                {editMediaType === 'poll' && (
                  <div style={{
                    marginTop: defaultTheme.spacing.md,
                    marginBottom: defaultTheme.spacing.md,
                    padding: defaultTheme.spacing.md,
                    backgroundColor: defaultTheme.colors.surfaceAlt,
                    borderRadius: defaultTheme.borders.borderRadius,
                    border: `1px solid ${defaultTheme.borders.borderColor}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: defaultTheme.spacing.md
                    }}>
                      <div style={{
                        fontSize: defaultTheme.font.sizeSm,
                        fontWeight: 'bold',
                        color: defaultTheme.colors.textPrimary
                      }}>
                        Create Poll
                      </div>
                      <button
                        onClick={() => {
                          setEditMediaType('none')
                          setEditPollOptions(['', ''])
                          setEditPollTitle('')
                          setShowPollPreview(false)
                        }}
                        style={{
                          fontSize: defaultTheme.font.sizeXs,
                          color: defaultTheme.colors.danger,
                          fontWeight: 'bold',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: defaultTheme.spacing.xs
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#dc2626'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = defaultTheme.colors.danger
                        }}
                      >
                        Remove Poll
                      </button>
                    </div>
                    
                    {/* Poll Title Input */}
                    <div style={{ marginBottom: defaultTheme.spacing.md }}>
                      <label style={{
                        display: 'block',
                        fontSize: defaultTheme.font.sizeSm,
                        fontWeight: '500',
                        color: defaultTheme.colors.textPrimary,
                        marginBottom: defaultTheme.spacing.xs
                      }}>
                        Poll Question (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ask a question..."
                        value={editPollTitle}
                        onChange={(e) => setEditPollTitle(e.target.value)}
                        style={{
                          width: '100%',
                          padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.md}`,
                          border: `1px solid ${defaultTheme.borders.borderColor}`,
                          borderRadius: defaultTheme.borders.borderRadius,
                          fontSize: defaultTheme.font.sizeMd,
                          outline: 'none',
                          backgroundColor: defaultTheme.colors.surface,
                          color: defaultTheme.colors.textPrimary
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = defaultTheme.colors.secondary
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = defaultTheme.borders.borderColor
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: defaultTheme.spacing.sm }}>
                      <label style={{
                        fontSize: defaultTheme.font.sizeSm,
                        fontWeight: '500',
                        color: defaultTheme.colors.textPrimary
                      }}>
                        Poll Options
                      </label>
                      {editPollOptions.map((option, index) => (
                        <input
                          key={index}
                          type="text"
                          placeholder={`Option ${index + 1}...`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...editPollOptions]
                            newOptions[index] = e.target.value
                            setEditPollOptions(newOptions)
                          }}
                          style={{
                            width: '100%',
                            padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.md}`,
                            border: `1px solid ${defaultTheme.borders.borderColor}`,
                            borderRadius: defaultTheme.borders.borderRadius,
                            fontSize: defaultTheme.font.sizeMd,
                            outline: 'none',
                            backgroundColor: defaultTheme.colors.surface,
                            color: defaultTheme.colors.textPrimary
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = defaultTheme.colors.secondary
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = defaultTheme.borders.borderColor
                          }}
                        />
                      ))}
                      <div style={{ display: 'flex', gap: defaultTheme.spacing.sm }}>
                        <button
                          onClick={() => setEditPollOptions([...editPollOptions, ''])}
                          style={{
                            padding: `${defaultTheme.spacing.xs} ${defaultTheme.spacing.md}`,
                            fontSize: defaultTheme.font.sizeSm,
                            backgroundColor: '#dbeafe',
                            color: defaultTheme.colors.secondary,
                            borderRadius: defaultTheme.borders.borderRadius,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#bfdbfe'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#dbeafe'
                          }}
                        >
                          + Add Option
                        </button>
                        
                        {editPollOptions.filter(opt => opt.trim()).length >= 2 && (
                          <button
                            onClick={() => setShowPollPreview(!showPollPreview)}
                            style={{
                              padding: `${defaultTheme.spacing.xs} ${defaultTheme.spacing.md}`,
                              fontSize: defaultTheme.font.sizeSm,
                              backgroundColor: showPollPreview ? defaultTheme.colors.secondary : defaultTheme.colors.surfaceAlt,
                              color: showPollPreview ? defaultTheme.colors.surface : defaultTheme.colors.textPrimary,
                              borderRadius: defaultTheme.borders.borderRadius,
                              border: `1px solid ${defaultTheme.borders.borderColor}`,
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => {
                              if (!showPollPreview) {
                                e.currentTarget.style.backgroundColor = '#e5e7eb'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!showPollPreview) {
                                e.currentTarget.style.backgroundColor = defaultTheme.colors.surfaceAlt
                              }
                            }}
                          >
                            {showPollPreview ? 'Hide Preview' : 'Show Preview'}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Poll Preview - only show when requested and valid options exist */}
                    {showPollPreview && editPollOptions.filter(opt => opt.trim()).length >= 2 && (
                      <div style={{
                        marginTop: defaultTheme.spacing.lg,
                        paddingTop: defaultTheme.spacing.md,
                        borderTop: `1px solid ${defaultTheme.borders.borderColor}`
                      }}>
                        <div style={{
                          fontSize: defaultTheme.font.sizeSm,
                          fontWeight: 'bold',
                          marginBottom: defaultTheme.spacing.sm,
                          color: defaultTheme.colors.textSecondary
                        }}>
                          Preview
                        </div>
                        
                        {/* Poll Title in Preview */}
                        {editPollTitle.trim() && (
                          <div style={{
                            fontSize: defaultTheme.font.sizeMd,
                            fontWeight: 'bold',
                            marginBottom: defaultTheme.spacing.md,
                            color: defaultTheme.colors.textPrimary,
                            padding: `${defaultTheme.spacing.sm} 0`
                          }}>
                            {editPollTitle}
                          </div>
                        )}
                        
                        {editPollOptions.filter(opt => opt.trim()).map((option, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.md}`,
                            marginBottom: defaultTheme.spacing.xs,
                            backgroundColor: defaultTheme.colors.surface,
                            borderRadius: defaultTheme.borders.borderRadius,
                            border: `1px solid ${defaultTheme.borders.borderColor}`,
                            cursor: 'pointer'
                          }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              border: `2px solid ${defaultTheme.colors.secondary}`,
                              marginRight: defaultTheme.spacing.sm,
                              flexShrink: 0
                            }} />
                            <span style={{
                              color: defaultTheme.colors.textPrimary,
                              fontSize: defaultTheme.font.sizeMd
                            }}>
                              {option}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Carousel - only show if content, consistent spacing */}
                {editAttachments.length > 0 && (
                  <div style={{
                    marginTop: defaultTheme.spacing.md,
                    marginBottom: defaultTheme.spacing.md
                  }}>
                    <UnifiedCarousel
                      key={`post-carousel-${post.id}-edit`}
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
                      type="post-detail"
                      editMode={true}
                      onDeleteAttachment={(attachmentId: string) => {
                        setEditAttachments(prev => prev.filter(att => att.id !== attachmentId));
                      }}
                      onAddAttachment={() => {
                        // Trigger file input for post carousel
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
                  </div>
                )}
                
                {/* Interaction buttons and toolbar grouped together in edit mode */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: `-${defaultTheme.spacing.sm}`,
                  marginBottom: `-${defaultTheme.spacing.sm}`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: defaultTheme.spacing.lg
                  }}>
                    <button
                      onClick={handleLikePost}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: defaultTheme.spacing.xs,
                        padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.sm}`,
                        borderRadius: defaultTheme.spacing.sm,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'colors 0.2s',
                        backgroundColor: post.likedByUser ? '#dbeafe' : 'transparent',
                        color: post.likedByUser ? defaultTheme.colors.secondary : defaultTheme.colors.textSecondary
                      }}
                      onMouseEnter={(e) => {
                        if (!post.likedByUser) {
                          e.currentTarget.style.backgroundColor = defaultTheme.colors.surfaceAlt
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!post.likedByUser) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <span style={{ fontSize: defaultTheme.font.sizeLg }}>👍</span>
                      <span style={{ fontWeight: '500' }}>{post.likes}</span>
                    </button>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: defaultTheme.spacing.xs,
                      color: defaultTheme.colors.textSecondary
                    }}>
                      <MessageCircle style={{
                        width: '1.25rem',
                        height: '1.25rem'
                      }} />
                      <span style={{ fontWeight: '500' }}>{commentCount}</span>
                    </div>
                  </div>
                  
                  {/* UnifiedToolbar on the right side */}
                  <div>
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
                      onFileUpload={handlePostFileUpload}
                      compact={false}
                      showSubmit={false}
                      hideAttachments={true}
                      hidePollEditor={true}
                      type="post"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* View Mode UI */}
                {post.title && (
                  <h2 style={{
                    fontSize: defaultTheme.font.sizeXl,
                    fontWeight: 'bold',
                    color: defaultTheme.colors.textPrimary,
                    marginBottom: defaultTheme.spacing.sm
                  }}>
                    {post.title}
                  </h2>
                )}
                
                <div style={{ color: defaultTheme.colors.textPrimary }}>
                  <ContentRenderer content={post.content} theme={defaultTheme} excludeGifs={true} />
                </div>
                
                {/* Poll in view mode - show after text, before carousel */}
                {(post as any).pollData?.options && (post as any).pollData.options.length >= 2 && (
                  <div style={{
                    marginTop: defaultTheme.spacing.md,
                    marginBottom: defaultTheme.spacing.md,
                    padding: defaultTheme.spacing.md,
                    backgroundColor: defaultTheme.colors.surfaceAlt,
                    borderRadius: defaultTheme.borders.borderRadius,
                    border: `1px solid ${defaultTheme.borders.borderColor}`
                  }}>
                    {/* Poll Title in View Mode */}
                    {(post as any).pollData?.title && (
                      <div style={{
                        fontSize: defaultTheme.font.sizeMd,
                        fontWeight: 'bold',
                        marginBottom: defaultTheme.spacing.md,
                        color: defaultTheme.colors.textPrimary
                      }}>
                        {(post as any).pollData.title}
                      </div>
                    )}
                    
                    {(post as any).pollData.options.map((option: string, index: number) => {
                      const votes = (post as any).pollData?.votes?.[index] || 0
                      const totalVotes = (post as any).pollData?.votes?.reduce((sum: number, v: number) => sum + v, 0) || 0
                      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
                      
                      return (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.md}`,
                          marginBottom: index < (post as any).pollData.options.length - 1 ? defaultTheme.spacing.xs : 0,
                          backgroundColor: defaultTheme.colors.surface,
                          borderRadius: defaultTheme.borders.borderRadius,
                          border: `1px solid ${defaultTheme.borders.borderColor}`,
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onClick={() => {
                          const userVote = (post as any).pollData?.userVote
                          
                          if (userVote !== undefined && userVote === index) {
                            // User clicked on their existing vote - show remove vote modal
                            setPendingVoteRemoval(index)
                            setShowRemoveVoteModal(true)
                          } else if (userVote !== undefined && userVote !== index) {
                            // User clicked on a different option - show change vote modal
                            setPendingVoteChange({ from: userVote, to: index })
                            setShowChangeVoteModal(true)
                          } else {
                            // User hasn't voted yet - cast new vote
                            if (onVotePoll) {
                              onVotePoll(post.id, index)
                            }
                          }
                        }}>
                          {/* Progress bar background */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${percentage}%`,
                            backgroundColor: `${defaultTheme.colors.secondary}20`,
                            borderRadius: defaultTheme.borders.borderRadius,
                            transition: 'width 0.3s ease'
                          }} />
                          
                          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              border: `2px solid ${defaultTheme.colors.secondary}`,
                              backgroundColor: (post as any).pollData?.userVote === index ? defaultTheme.colors.secondary : 'transparent',
                              marginRight: defaultTheme.spacing.sm,
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {(post as any).pollData?.userVote === index && (
                                <div style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: 'white'
                                }} />
                              )}
                            </div>
                            <span style={{
                              color: defaultTheme.colors.textPrimary,
                              fontSize: defaultTheme.font.sizeMd
                            }}>
                              {option}
                            </span>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: defaultTheme.spacing.sm,
                            position: 'relative',
                            zIndex: 1
                          }}>
                            <span style={{
                              color: defaultTheme.colors.textSecondary,
                              fontSize: defaultTheme.font.sizeSm,
                              fontWeight: 'bold'
                            }}>
                              {percentage}%
                            </span>
                            <span style={{
                              color: defaultTheme.colors.textSecondary,
                              fontSize: defaultTheme.font.sizeXs
                            }}>
                              ({votes} vote{votes !== 1 ? 's' : ''})
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    
                    {/* Total votes display */}
                    {(post as any).pollData?.votes && (
                      <div style={{
                        marginTop: defaultTheme.spacing.sm,
                        textAlign: 'center',
                        color: defaultTheme.colors.textSecondary,
                        fontSize: defaultTheme.font.sizeXs
                      }}>
                        {(post as any).pollData.votes.reduce((sum: number, v: number) => sum + v, 0)} total votes
                      </div>
                    )}
                  </div>
                )}
                
                {/* View mode carousel - only show if content, no edit capabilities */}
                {(post as any).attachments?.length > 0 && (
                  <div style={{
                    marginTop: defaultTheme.spacing.md,
                    marginBottom: defaultTheme.spacing.md
                  }}>
                    <UnifiedCarousel
                      key={`post-carousel-${post.id}-view`}
                      attachments={(post as any).attachments}
                      pollData={undefined}
                      content={post.content}
                      theme={defaultTheme}
                      type="post-detail"
                      editMode={false}
                      onDeleteAttachment={undefined}
                      onAddAttachment={undefined}
                    />
                  </div>
                )}
                
                {/* Interaction buttons inside content area for view mode */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: `-${defaultTheme.spacing.sm}`,
                  marginBottom: `-${defaultTheme.spacing.sm}`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: defaultTheme.spacing.lg
                  }}>
                    <button
                      onClick={handleLikePost}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: defaultTheme.spacing.xs,
                        padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.sm}`,
                        borderRadius: defaultTheme.spacing.sm,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'colors 0.2s',
                        backgroundColor: post.likedByUser ? '#dbeafe' : 'transparent',
                        color: post.likedByUser ? defaultTheme.colors.secondary : defaultTheme.colors.textSecondary
                      }}
                      onMouseEnter={(e) => {
                        if (!post.likedByUser) {
                          e.currentTarget.style.backgroundColor = defaultTheme.colors.surfaceAlt
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!post.likedByUser) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <span style={{ fontSize: defaultTheme.font.sizeLg }}>👍</span>
                      <span style={{ fontWeight: '500' }}>{post.likes}</span>
                    </button>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: defaultTheme.spacing.xs,
                      color: defaultTheme.colors.textSecondary
                    }}>
                      <MessageCircle style={{
                        width: '1.25rem',
                        height: '1.25rem'
                      }} />
                      <span style={{ fontWeight: '500' }}>{commentCount}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Save/Cancel buttons outside the container */}
            {isEditMode && (
              <div style={{
                display: 'flex',
                gap: defaultTheme.spacing.xs,
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    // Reset edit state
                    setEditTitle(post.title || '');
                    setEditContent(post.content || '');
                    setEditCategory(post.category || 'discussion');
                    setEditMediaType('none');
                    setEditVideoUrl('');
                    setEditLinkUrl('');
                    setEditPollOptions(['', '']);
                    setEditPollTitle('');
                    setShowPollPreview(false);
                    setEditAttachments([]);
                  }}
                  style={{
                    padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.md}`,
                    color: defaultTheme.colors.textSecondary,
                    fontWeight: '500',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = defaultTheme.colors.textPrimary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = defaultTheme.colors.textSecondary
                  }}
                >
                  CANCEL
                </button>
                <button
                  onClick={async () => {
                    if (!editContent.trim() || !onEditPost) return;
                    setIsSaving(true);
                    try {
                      // Create media data from current edit state
                      let mediaData: any = { type: 'none' };
                      
                      if (editMediaType === 'video' && editVideoUrl.trim()) {
                        mediaData = { type: 'video', url: editVideoUrl.trim() };
                      } else if (editMediaType === 'link' && editLinkUrl.trim()) {
                        mediaData = { type: 'link', url: editLinkUrl.trim() };
                      } else if (editMediaType === 'poll') {
                        const validOptions = editPollOptions.filter(opt => opt.trim());
                        if (validOptions.length >= 2) {
                          mediaData = { 
                            type: 'poll', 
                            options: validOptions,
                            title: editPollTitle.trim() || undefined
                          };
                        }
                      }

                      // Always include attachments in media data (even if empty array)
                      mediaData.attachments = editAttachments.map(att => ({
                        id: att.id,
                        name: att.file.name,
                        size: att.file.size,
                        type: att.file.type,
                        preview: att.preview
                      }));

                      await onEditPost(post.id, {
                        title: editTitle,
                        content: editContent,
                        category: editCategory,
                        mediaData
                      });
                      
                      // Update the post object with the new data to sync the modal
                      Object.assign(post, {
                        title: editTitle,
                        content: editContent,
                        category: editCategory,
                        attachments: editAttachments.length > 0 ? editAttachments.map(att => ({
                          id: att.id,
                          name: att.file.name,
                          size: att.file.size,
                          type: att.file.type,
                          preview: att.preview
                        })) : undefined,
                        videoUrl: editMediaType === 'video' ? editVideoUrl : undefined,
                        linkUrl: editMediaType === 'link' ? editLinkUrl : undefined,
                        pollData: editMediaType === 'poll' ? { 
                          options: editPollOptions.filter(opt => opt.trim()),
                          title: editPollTitle.trim() || undefined
                        } : undefined
                      });
                      
                      setIsEditMode(false);
                    } catch (error) {
                      console.error('Error saving post:', error);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={!editContent.trim() || isSaving}
                  style={{
                    padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.md}`,
                    backgroundColor: defaultTheme.colors.surfaceAlt,
                    color: defaultTheme.colors.textPrimary,
                    fontWeight: '500',
                    borderRadius: defaultTheme.spacing.xs,
                    border: 'none',
                    cursor: !editContent.trim() || isSaving ? 'not-allowed' : 'pointer',
                    opacity: !editContent.trim() || isSaving ? 0.5 : 1
                  }}
                >
                  {isSaving ? 'SAVING...' : 'SAVE'}
                </button>
              </div>
            )}
            
            
            {!isEditMode && post.imageUrl && (
              <div style={{ marginBottom: defaultTheme.spacing.md }}>
                <img 
                  src={post.imageUrl}
                  alt="Post content"
                  style={{
                    width: '100%',
                    borderRadius: defaultTheme.spacing.sm
                  }}
                />
              </div>
            )}
          </div>

          {/* Comments section */}
          {(topLevelComments.length > 0 || commentCount > 0) && (
            <div style={{
              borderTop: `1px solid ${defaultTheme.borders.borderColor}`
            }}>
              <div style={{
                padding: `${defaultTheme.spacing.xs} ${defaultTheme.spacing.lg}`
              }}>
                <h3 style={{
                  fontWeight: '600',
                  color: defaultTheme.colors.textPrimary,
                  marginBottom: defaultTheme.spacing.md
                }}>
                  Comments ({commentCount})
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: defaultTheme.spacing.md }}>
                  {loadingComments ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: `${defaultTheme.spacing.xl} 0`
                    }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        border: `2px solid ${defaultTheme.borders.borderColor}`,
                        borderTop: `2px solid ${defaultTheme.colors.textPrimary}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
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
                        commentsDisabled={(post as any).commentsDisabled}
                      />
                    ))
                  ) : (
                    <p style={{
                      color: defaultTheme.colors.textSecondary,
                      textAlign: 'center',
                      padding: defaultTheme.spacing.md
                    }}>
                      {commentCount > 0 ? 'Loading comments...' : 'No comments yet. Be the first to comment!'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comment input at the end of scrollable content - show different content based on comments enabled */}
          <div style={{
            borderTop: `1px solid ${defaultTheme.borders.borderColor}`
          }}>
            {(post as any).commentsDisabled ? (
              <div style={{
                padding: `${defaultTheme.spacing.lg} ${defaultTheme.spacing.lg}`,
                textAlign: 'center',
                color: defaultTheme.colors.textSecondary,
                fontSize: defaultTheme.font.sizeMd
              }}>
                Comments are turned off for this post
              </div>
            ) : (
              <div style={{
                padding: `${defaultTheme.spacing.md} ${defaultTheme.spacing.lg}`
              }}>
                <div style={{
                  display: 'flex',
                  gap: defaultTheme.spacing.sm
                }}>
                  {/* User avatar */}
                  <div style={{ flexShrink: 0 }}>
                    <div 
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: defaultTheme.colors.surface,
                        fontSize: defaultTheme.font.sizeSm,
                        fontWeight: '600',
                        backgroundColor: defaultTheme.colors.surfaceAlt
                      }}
                    >
                      {currentUser?.profile?.avatar ? (
                        <img 
                          src={currentUser.profile.avatar} 
                          alt={currentUser.profile.displayName || 'User'}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        (currentUser?.profile?.displayName?.charAt(0) || 'U').toUpperCase()
                      )}
                    </div>
                  </div>

                  {/* Comment input container - unified style like other comments */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      backgroundColor: defaultTheme.colors.surfaceAlt,
                      borderRadius: defaultTheme.borders.borderRadius,
                      padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.md}`
                    }}>
                      <form onSubmit={handleSubmitComment}>
                        {/* Comment input inside container */}
                        <RichTextArea
                          ref={commentTextareaRef}
                          value={commentContent}
                          onChange={setCommentContent}
                          placeholder="Add your comment"
                          rows={1}
                          style={{
                            width: '100%',
                            resize: 'none',
                            border: 'none',
                            borderRadius: '0',
                            padding: '0',
                            fontSize: defaultTheme.font.sizeSm,
                            minHeight: '20px',
                            maxHeight: '100px',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            fontFamily: defaultTheme.font.family
                          }}
                        />
                        
                        {/* Carousel inside container - only show if content */}
                        {attachments.length > 0 && (
                          <div style={{ marginTop: defaultTheme.spacing.sm }}>
                            <UnifiedCarousel
                              key={`new-comment-carousel`}
                              attachments={attachments.map(att => ({
                                id: att.id,
                                name: att.file.name,
                                size: att.file.size,
                                type: att.file.type,
                                preview: att.preview
                              }))}
                              pollData={undefined}
                              content={commentContent}
                              theme={defaultTheme}
                              type="comment"
                              editMode={true}
                              onDeleteAttachment={(attachmentId: string) => {
                                setAttachments(prev => prev.filter(att => att.id !== attachmentId));
                              }}
                              onAddAttachment={() => {
                                // Trigger file input for comment carousel
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.multiple = true
                                input.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt'
                                input.onchange = (event) => {
                                  handleFileUpload(event)
                                }
                                input.click()
                              }}
                            />
                          </div>
                        )}
                        
                        {/* UnifiedToolbar inside container */}
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
                          showSubmit={false}
                          hideAttachments={true}
                          type="comment"
                        />
                      </form>
                    </div>
                    
                    {/* Save/Cancel buttons outside container - like other comments */}
                    <div style={{
                      display: 'flex',
                      gap: defaultTheme.spacing.xs,
                      marginTop: defaultTheme.spacing.sm,
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={handleSubmitComment}
                        disabled={!commentContent.trim() || isSubmittingComment}
                        style={{
                          padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.md}`,
                          backgroundColor: defaultTheme.colors.surfaceAlt,
                          color: defaultTheme.colors.textPrimary,
                          fontWeight: '500',
                          borderRadius: defaultTheme.spacing.xs,
                          border: 'none',
                          cursor: !commentContent.trim() || isSubmittingComment ? 'not-allowed' : 'pointer',
                          opacity: !commentContent.trim() || isSubmittingComment ? 0.5 : 1
                        }}
                      >
                        {isSubmittingComment ? 'POSTING...' : 'POST'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Vote Removal Confirmation Modal */}
      {showRemoveVoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: defaultTheme.colors.surface,
            borderRadius: defaultTheme.borders.borderRadius,
            padding: `${defaultTheme.spacing.xl} ${defaultTheme.spacing.xl}`,
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h2 style={{
              fontSize: defaultTheme.font.sizeLg,
              fontWeight: 'bold',
              color: defaultTheme.colors.textPrimary,
              marginBottom: defaultTheme.spacing.lg,
              margin: 0
            }}>
              Remove vote?
            </h2>
            
            <p style={{
              fontSize: defaultTheme.font.sizeMd,
              color: defaultTheme.colors.textPrimary,
              marginBottom: defaultTheme.spacing.xl,
              margin: `${defaultTheme.spacing.md} 0 ${defaultTheme.spacing.xl} 0`
            }}>
              Are you sure you want to remove your vote?
            </p>
            
            <div style={{
              display: 'flex',
              gap: defaultTheme.spacing.md,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowRemoveVoteModal(false)
                  setPendingVoteRemoval(null)
                }}
                style={{
                  padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.lg}`,
                  backgroundColor: 'transparent',
                  color: defaultTheme.colors.textSecondary,
                  border: 'none',
                  borderRadius: defaultTheme.borders.borderRadius,
                  fontSize: defaultTheme.font.sizeMd,
                  fontWeight: '500',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                CANCEL
              </button>
              
              <button
                onClick={async () => {
                  setShowRemoveVoteModal(false)
                  if (onRemoveVote && pendingVoteRemoval !== null) {
                    await onRemoveVote(post.id)
                  }
                  setPendingVoteRemoval(null)
                }}
                style={{
                  padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.lg}`,
                  backgroundColor: '#FEF3C7',
                  color: defaultTheme.colors.textPrimary,
                  border: 'none',
                  borderRadius: defaultTheme.borders.borderRadius,
                  fontSize: defaultTheme.font.sizeMd,
                  fontWeight: '500',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vote Change Confirmation Modal */}
      {showChangeVoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: defaultTheme.colors.surface,
            borderRadius: defaultTheme.borders.borderRadius,
            padding: `${defaultTheme.spacing.xl} ${defaultTheme.spacing.xl}`,
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h2 style={{
              fontSize: defaultTheme.font.sizeLg,
              fontWeight: 'bold',
              color: defaultTheme.colors.textPrimary,
              marginBottom: defaultTheme.spacing.lg,
              margin: 0
            }}>
              Change vote?
            </h2>
            
            <p style={{
              fontSize: defaultTheme.font.sizeMd,
              color: defaultTheme.colors.textPrimary,
              marginBottom: defaultTheme.spacing.xl,
              margin: `${defaultTheme.spacing.md} 0 ${defaultTheme.spacing.xl} 0`
            }}>
              Are you sure you want to change your vote?
            </p>
            
            <div style={{
              display: 'flex',
              gap: defaultTheme.spacing.md,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowChangeVoteModal(false)
                  setPendingVoteChange(null)
                }}
                style={{
                  padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.lg}`,
                  backgroundColor: 'transparent',
                  color: defaultTheme.colors.textSecondary,
                  border: 'none',
                  borderRadius: defaultTheme.borders.borderRadius,
                  fontSize: defaultTheme.font.sizeMd,
                  fontWeight: '500',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                CANCEL
              </button>
              
              <button
                onClick={async () => {
                  setShowChangeVoteModal(false)
                  if (onVotePoll && pendingVoteChange) {
                    await onVotePoll(post.id, pendingVoteChange.to)
                  }
                  setPendingVoteChange(null)
                }}
                style={{
                  padding: `${defaultTheme.spacing.sm} ${defaultTheme.spacing.lg}`,
                  backgroundColor: '#FEF3C7',
                  color: defaultTheme.colors.textPrimary,
                  border: 'none',
                  borderRadius: defaultTheme.borders.borderRadius,
                  fontSize: defaultTheme.font.sizeMd,
                  fontWeight: '500',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}