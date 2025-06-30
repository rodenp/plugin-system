import * as React from 'react'
import type { PluginProps } from '../../types/plugin-interface'
import { defaultTheme } from '../shared/default-theme'
import { WritePostSection } from './components/WritePostSection'
import { CreatePostModal } from './components/CreatePostModal'
import { PostDetailModal } from './components/PostDetailModal'
import { UnifiedCarousel } from './components/UnifiedCarousel'
import { ContentRenderer } from './components/ContentRenderer'
import { PostDropdownMenu } from './components/PostDropdownMenu'
import type { CommunityPost } from './types'

interface Post {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  authorAvatar?: string
  category: string
  likes: number
  comments: number
  isPinned: boolean
  commentsDisabled?: boolean
  createdAt: string
  level?: number
  videoUrl?: string
  linkUrl?: string
  attachments?: Array<{ id: string; name: string; size: number; type: string; preview: string }>
  commenters?: Array<{ avatarUrl?: string; initials: string; name?: string }>
  newCommentTimeAgo?: string | null
}

// Poll component for post feed - discrete display
const PostPoll: React.FC<{
  pollData: any
  theme: any
  currentUser: any
  onVote?: (optionIndex: number) => void
}> = ({ pollData, theme, currentUser, onVote }) => {
  if (!pollData || !pollData.options) return null
  
  const totalVotes = pollData.votes ? pollData.votes.reduce((sum: number, count: number) => sum + count, 0) : 0
  
  // Simple horizontal layout matching the screenshots exactly
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm
    }}>
      <div style={{
        backgroundColor: theme.colors.secondary,
        color: 'white',
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        borderRadius: '20px',
        fontSize: theme.font.sizeSm,
        fontWeight: '500'
      }}>
        Poll
      </div>
      <div style={{
        color: theme.colors.secondary,
        fontSize: theme.font.sizeMd,
        fontWeight: '500'
      }}>
        {totalVotes > 0 
          ? `${totalVotes} member${totalVotes !== 1 ? 's' : ''} have voted`
          : 'Cast your vote'
        }
      </div>
    </div>
  )
}

// PostCard component - exact copy from community-copy
const PostCard: React.FC<{
  post: Post
  selectedPost: string | null
  theme: any
  currentUser: any
  onToggleSelect: (postId: string) => void
  onLikePost: (postId: string) => void
  onEditPost?: (postId: string) => void
  onDeletePost?: (postId: string) => void
  onPinPost?: (postId: string) => void
  onToggleComments?: (postId: string) => void
  onVotePoll?: (postId: string, optionIndex: number) => void
}> = ({ post, selectedPost, theme, currentUser, onToggleSelect, onLikePost, onEditPost, onDeletePost, onPinPost, onToggleComments, onVotePoll }) => (
  <div
    className="post-card"
    style={{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borders.borderRadius,
      boxShadow: theme.borders.boxShadow,
      padding: theme.spacing.lg,
      border: post.isPinned ? `2px solid ${theme.colors.highlight}` : selectedPost === post.id ? `2px solid ${theme.colors.secondary}` : undefined,
      cursor: 'pointer',
      marginBottom: theme.spacing.md
    }}
    onClick={() => onToggleSelect(post.id)}
  >
    {/* Header: Author with avatar and level */}
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: theme.spacing.md }}>
      <div style={{
        position: 'relative',
        width: '40px',
        height: '40px',
        borderRadius: '999px',
        backgroundColor: theme.colors.surfaceAlt,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 600,
        marginRight: theme.spacing.md
      }}>
        {(post.author || 'A').charAt(0)}
        <div style={{
          position: 'absolute',
          bottom: '-4px',
          right: '-4px',
          backgroundColor: theme.colors.level,
          borderRadius: '999px',
          width: '20px',
          height: '20px',
          fontSize: '12px',
          color: 'white',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: `2px solid ${theme.colors.surface}`
        }}>
          {post.level || 1}
        </div>
      </div>

      <div style={{ flexGrow: 1 }}>
        <div style={{ fontWeight: 600 }}>{post.author || 'Anonymous'}</div>
        <div style={{ fontSize: theme.font.sizeSm, color: theme.colors.muted }}>
          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        {post.isPinned && <div style={{ color: theme.colors.highlight, fontWeight: 600 }}>📌 Pinned</div>}
        <PostDropdownMenu
          postId={post.id}
          authorId={post.authorId}
          currentUserId={currentUser?.id || ''}
          isPinned={post.isPinned}
          commentsDisabled={post.commentsDisabled}
          onEdit={() => onEditPost?.(post.id)}
          onDelete={() => onDeletePost?.(post.id)}
          onCopyLink={() => {
            const url = `${window.location.origin}${window.location.pathname}?post=${post.id}`
            navigator.clipboard.writeText(url).then(() => {
              console.log('Link copied to clipboard')
            }).catch(() => {
              console.log('Failed to copy link')
            })
          }}
          onPinToFeed={() => onPinPost?.(post.id)}
          onToggleComments={() => onToggleComments?.(post.id)}
          theme={theme}
        />
      </div>
    </div>

    {/* Content */}
    <div style={{ marginBottom: theme.spacing.xs }}>
      {post.title && (
        <div style={{ fontWeight: 600, fontSize: theme.font.sizeMd, marginBottom: theme.spacing.sm }}>
          {post.title}
        </div>
      )}
      <div style={{ fontSize: theme.font.sizeSm, color: theme.colors.textSecondary }}>
        <ContentRenderer content={post.content || ''} theme={theme} excludeGifs={true} />
      </div>
      
      {/* Link preview */}
      {post.linkUrl && (
        <div style={{ marginTop: theme.spacing.sm }}>
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              border: `1px solid ${theme.borders.borderColor}`,
              borderRadius: theme.borders.borderRadius,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.surface,
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surfaceAlt
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surface
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: theme.colors.secondary,
                borderRadius: theme.borders.borderRadius,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                🔗
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: theme.font.sizeSm,
                  fontWeight: 600,
                  color: theme.colors.secondary,
                  marginBottom: '2px'
                }}>
                  External Link
                </div>
                <div style={{
                  fontSize: theme.font.sizeXs,
                  color: theme.colors.textSecondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {post.linkUrl}
                </div>
              </div>
            </div>
          </a>
        </div>
      )}
      
      {/* Poll component - show before carousel */}
      {(post as any).pollData && (
        <PostPoll
          pollData={(post as any).pollData}
          theme={theme}
          currentUser={currentUser}
          onVote={(optionIndex: number) => onVotePoll?.(post.id, optionIndex)}
        />
      )}
      
      {/* All media in unified carousel */}
      <UnifiedCarousel
        key={`feed-carousel-${post.id}`}
        attachments={post.attachments}
        pollData={(post as any).pollData}
        content={post.content}
        theme={theme}
        type="post-feed"
      />
    </div>

    {/* Interaction buttons */}
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      fontSize: theme.font.sizeMd, 
      color: theme.colors.textSecondary, 
      marginBottom: theme.spacing.xs 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onLikePost(post.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'inherit',
            color: 'inherit'
          }}
        >
          👍 {post.likes || 0}
        </button>

        <span>💬 {post.comments || 0}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginLeft: theme.spacing.lg, gap: theme.spacing.sm }}>
        <div style={{ display: 'flex', gap: theme.spacing.xs }}>
          {post.commenters?.slice(0, 5).map((user, idx) => (
              <div key={idx} style={{
                width: '36px',
                height: '36px',
                borderRadius: '999px',
                backgroundColor: theme.colors.surfaceAlt,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: `2px solid ${theme.colors.surface}`,
                fontSize: '14px',
                fontWeight: 600
              }}>
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '999px' }} />
                  : user.initials || '?'}
              </div>
            ))}
        </div>
        
        {/* Last comment time ago - next to avatars */}
        {post.newCommentTimeAgo && (
          <div style={{
            fontSize: theme.font.sizeSm,
            color: theme.colors.secondary,
            fontWeight: 500
          }}>
            Last comment {post.newCommentTimeAgo} ago
          </div>
        )}
      </div>
      </div>
  </div>
)

// MessagingDemo shows only the posts feed (left column from community), no sidebar
export const MessagingDemo: React.FC<PluginProps & {
  posts: Post[]
  userLikes?: Set<string>
  loading: boolean
  error?: string
  onCreatePost: (post: any) => Promise<void>
  onLikePost: (postId: string) => Promise<void>
  onUnlikePost: (postId: string) => Promise<void>
  onEditPost?: (postId: string, updates: { title?: string; content: string; category?: string; mediaData?: any }) => Promise<void>
  onDeletePost: (postId: string) => Promise<void>
  onAddComment: (postId: string, content: string, parentId?: string, mediaData?: any) => Promise<void>
  onLoadComments?: (postId: string) => Promise<any[]>
  onLikeComment?: (commentId: string) => Promise<void>
  onUnlikeComment?: (commentId: string) => Promise<void>
  onEditComment?: (commentId: string, newContent: string, mediaData?: any) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  onPinPost?: (postId: string) => Promise<void>
  onToggleCommentsForPost?: (postId: string) => Promise<void>
  onLoadMore?: () => Promise<void>
  onRefresh?: () => Promise<void>
}> = ({
  currentUser,
  communityId,
  community,
  userRole,
  posts,
  userLikes,
  loading,
  error,
  onCreatePost,
  onLikePost,
  onUnlikePost,
  onEditPost,
  onDeletePost,
  onAddComment,
  onLoadComments,
  onLikeComment,
  onUnlikeComment,
  onEditComment,
  onDeleteComment,
  onPinPost,
  onToggleCommentsForPost,
  onLoadMore,
  onRefresh,
  theme
}) => {
  // Apply theme
  const appliedTheme = theme || defaultTheme;
  
  // State management for UI interactions
  const [selectedPost, setSelectedPost] = React.useState<string | null>(null)
  const [filterCategory, setFilterCategory] = React.useState('all')
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [modalPost, setModalPost] = React.useState<CommunityPost | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [editingPost, setEditingPost] = React.useState<any>(null)
  const [loadingComments, setLoadingComments] = React.useState(false)
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)

  // Calculate time ago helper function
  const calculateTimeAgo = (timestamp: string | Date | undefined) => {
    if (!timestamp) return null
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
    
    return null // Don't show after a week
  }

  // Use posts directly from props with calculated newCommentTimeAgo
  const allPosts = React.useMemo(() => {
    return posts.map(post => {
      // Get the most recent comment time from either lastCommentAt or the first commenter
      let mostRecentCommentTime = (post as any).lastCommentAt
      if (!mostRecentCommentTime && post.commenters && post.commenters.length > 0) {
        // Use the first commenter's date (most recent) if lastCommentAt is not set
        mostRecentCommentTime = (post.commenters[0] as any).commentDate
      }
      
      return {
        ...post,
        likedByUser: userLikes?.has(post.id) || false,
        newCommentTimeAgo: calculateTimeAgo(mostRecentCommentTime)
      }
    })
  }, [posts, userLikes])

  // Filter posts based on category and sort by pinned status first, then by most recent
  const filteredPosts = React.useMemo(() => {
    let posts = filterCategory === 'all' ? allPosts : allPosts.filter((post: Post) => post.category === filterCategory)
    
    // Sort by pinned status first (pinned posts at top), then by creation date descending within each group
    return posts.sort((a, b) => {
      // If one is pinned and the other isn't, prioritize the pinned one
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      
      // If both have same pinned status, sort by creation date descending (most recent first)
      const dateA = new Date(a.createdAt || a.postDate || 0)
      const dateB = new Date(b.createdAt || b.postDate || 0)
      return dateB.getTime() - dateA.getTime()
    })
  }, [allPosts, filterCategory])

  // Copy all the handlers from the original community component
  const handleOpenCreateModal = React.useCallback(() => {
    setIsCreateModalOpen(true)
  }, [])

  const handleCloseCreateModal = React.useCallback(() => {
    setIsCreateModalOpen(false)
  }, [])

  const handleOpenEditModal = React.useCallback((post: any) => {
    setEditingPost(post)
    setIsEditModalOpen(true)
  }, [])

  const handleCloseEditModal = React.useCallback(() => {
    setIsEditModalOpen(false)
    setEditingPost(null)
  }, [])

  // Create post handler - delegate to parent
  const handleCreatePost = React.useCallback(async (title: string, content: string, category: string, mediaData?: any) => {
    try {
      const newPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        title,
        content,
        category,
        author: currentUser?.profile?.displayName || 'Anonymous',
        authorId: currentUser?.id || 'anonymous',
        authorAvatar: currentUser?.profile?.avatar,
        authorLevel: 1,
        likes: 0,
        likedByUser: false,
        comments: 0,
        isPinned: false,
        createdAt: new Date().toISOString(),
        commenters: [],
        videoUrl: mediaData?.type === 'video' ? mediaData.url : undefined,
        linkUrl: mediaData?.type === 'link' ? mediaData.url : undefined,
        pollData: mediaData?.type === 'poll' ? mediaData : undefined,
        attachments: mediaData?.attachments || undefined
      }
      
      // Call parent handler
      await onCreatePost(newPost)
      handleCloseCreateModal()
    } catch (error) {
      console.error('[Messaging] Error creating post:', error)
      alert('Error creating post. Please try again.')
    }
  }, [currentUser, onCreatePost, handleCloseCreateModal])

  const handleEditPost = React.useCallback(async (postId: string, updates: { title?: string; content: string; category?: string; mediaData?: any }) => {
    try {
      if (onEditPost) {
        await onEditPost(postId, updates)
        handleCloseEditModal()
      }
    } catch (error) {
      console.error('[Messaging] Error editing post:', error)
      alert('Error editing post. Please try again.')
    }
  }, [onEditPost, handleCloseEditModal])

  const handlePinPost = React.useCallback(async (postId: string) => {
    try {
      if (onPinPost) {
        await onPinPost(postId)
        
        // Refresh modal post if it's the same post
        if (modalPost && modalPost.id === postId) {
          setModalPost(prev => prev ? {
            ...prev,
            isPinned: !prev.isPinned
          } as any : null)
        }
      }
    } catch (error) {
      console.error('[Messaging] Error pinning/unpinning post:', error)
      alert('Error updating post pin status. Please try again.')
    }
  }, [onPinPost, modalPost])

  const handleToggleCommentsForPost = React.useCallback(async (postId: string) => {
    try {
      if (onToggleCommentsForPost) {
        await onToggleCommentsForPost(postId)
        
        // Refresh modal post if it's the same post
        if (modalPost && modalPost.id === postId) {
          setModalPost(prev => prev ? {
            ...prev,
            commentsDisabled: !(prev as any).commentsDisabled
          } as any : null)
        }
      }
    } catch (error) {
      console.error('[Messaging] Error toggling comments:', error)
      alert('Error updating comment settings. Please try again.')
    }
  }, [onToggleCommentsForPost, modalPost])

  const handleVotePoll = React.useCallback(async (postId: string, optionIndex: number) => {
    try {
      console.log(`Voting on post ${postId}, option ${optionIndex}`)
      
      // Update the modal post immediately to show user's vote
      if (modalPost && modalPost.id === postId) {
        const updatedPost = { ...modalPost } as any
        
        // Handle vote change or new vote
        if (updatedPost.pollData) {
          const oldVote = updatedPost.pollData.userVote
          
          // Update vote counts
          if (oldVote !== undefined) {
            // User is changing their vote
            if (updatedPost.pollData.votes) {
              updatedPost.pollData.votes[oldVote] = Math.max(0, updatedPost.pollData.votes[oldVote] - 1)
              updatedPost.pollData.votes[optionIndex] = (updatedPost.pollData.votes[optionIndex] || 0) + 1
            }
          } else {
            // User is casting their first vote
            if (!updatedPost.pollData.votes) {
              updatedPost.pollData.votes = new Array(updatedPost.pollData.options.length).fill(0)
            }
            updatedPost.pollData.votes[optionIndex] = (updatedPost.pollData.votes[optionIndex] || 0) + 1
          }
          
          // Set user's vote
          updatedPost.pollData.userVote = optionIndex
        }
        
        setModalPost(updatedPost)
      }
      
      // In a real app, this would call a backend API
      // await onVotePoll(postId, optionIndex)
      
    } catch (error) {
      console.error('[Messaging] Error voting on poll:', error)
      alert('Error casting vote. Please try again.')
    }
  }, [modalPost])

  const handleRemoveVote = React.useCallback(async (postId: string) => {
    try {
      console.log(`Removing vote from post ${postId}`)
      
      // Update the modal post immediately to remove user's vote
      if (modalPost && modalPost.id === postId) {
        const updatedPost = { ...modalPost } as any
        
        if (updatedPost.pollData && updatedPost.pollData.userVote !== undefined) {
          const userVote = updatedPost.pollData.userVote
          
          // Decrease vote count
          if (updatedPost.pollData.votes && updatedPost.pollData.votes[userVote] > 0) {
            updatedPost.pollData.votes[userVote] = updatedPost.pollData.votes[userVote] - 1
          }
          
          // Remove user's vote
          delete updatedPost.pollData.userVote
        }
        
        setModalPost(updatedPost)
      }
      
      // In a real app, this would call a backend API
      // await onRemoveVote(postId)
      
    } catch (error) {
      console.error('[Messaging] Error removing vote:', error)
      alert('Error removing vote. Please try again.')
    }
  }, [modalPost])

  const handleLikePost = React.useCallback(async (postId: string) => {
    try {
      // Delegate to parent handler
      const isLiked = userLikes?.has(postId) || false
      if (isLiked) {
        await onUnlikePost(postId)
      } else {
        await onLikePost(postId)
      }
    } catch (error) {
      console.error('[Messaging] Error liking post:', error)
    }
  }, [userLikes, onLikePost, onUnlikePost])

  const handleToggleSelect = React.useCallback(async (postId: string) => {
    try {
      const currentPost = allPosts.find(p => p.id === postId)
      
      if (currentPost) {
        setLoadingComments(true)
        
        // Load comments if the callback is provided
        let commentsData = []
        if (onLoadComments) {
          try {
            commentsData = await onLoadComments(postId)
          } catch (error) {
            console.error('[Messaging] Error loading comments:', error)
          }
        }
        
        // For the modal, we need to create a post object that matches what PostDetailModal expects
        const postWithComments: any = {
          ...currentPost,
          authorAvatar: currentPost.authorAvatar || currentUser?.profile?.avatar,
          authorLevel: currentPost.level || 1,
          likes: currentPost.likes || 0,
          likedByUser: currentPost.likedByUser || false,
          comments: commentsData, // Actual comments data from callback
          commentCount: currentPost.comments || 0, // Keep the count separately
          createdAt: new Date(currentPost.createdAt),
          commenters: currentPost.commenters?.map(c => ({ 
            ...c, 
            name: c.name || c.initials 
          })) || []
        }
        
        setModalPost(postWithComments)
        setIsModalOpen(true)
        setSelectedPost(postId)
      }
    } catch (error) {
      console.error('[Messaging] Error opening post modal:', error)
    } finally {
      // Always clear loading state
      setLoadingComments(false)
    }
  }, [allPosts, currentUser, onLoadComments])

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false)
    setModalPost(null)
    setSelectedPost(null)
  }, [])

  // Modal handlers
  const handleModalLikePost = React.useCallback(async (postId: string) => {
    try {
      await handleLikePost(postId)
      // Update modal post to reflect like change
      if (modalPost && modalPost.id === postId) {
        const isLiked = userLikes?.has(postId) || false
        setModalPost(prev => prev ? {
          ...prev,
          likes: isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1,
          likedByUser: !isLiked
        } : null)
      }
    } catch (error) {
      console.error('[Messaging] Error liking post:', error)
    }
  }, [handleLikePost, modalPost, userLikes])

  const handleModalUnlikePost = React.useCallback(async (postId: string) => {
    // Same as like since we toggle
    return handleModalLikePost(postId)
  }, [handleModalLikePost])

  const handleModalAddComment = React.useCallback(async (postId: string, content: string, parentId?: string, mediaData?: any) => {
    try {
      // Call parent handler with parentId for replies
      await onAddComment(postId, content, parentId, mediaData)
      
      // Reload comments to show the new comment/reply
      if (modalPost && modalPost.id === postId && onLoadComments) {
        setLoadingComments(true)
        try {
          const updatedComments = await onLoadComments(postId)
          setModalPost(prev => prev ? {
            ...prev,
            comments: updatedComments,
            commentCount: (prev.commentCount || 0) + 1
          } : null)
        } catch (error) {
          console.error('[Messaging] Error reloading comments:', error)
        }
        setLoadingComments(false)
      } else if (modalPost && modalPost.id === postId) {
        // Just update the count if we can't reload
        setModalPost(prev => prev ? {
          ...prev,
          commentCount: (prev.commentCount || 0) + 1
        } : null)
      }
    } catch (error) {
      console.error('[Messaging] Error adding comment:', error)
    }
  }, [onAddComment, modalPost, onLoadComments])

  const handleModalLikeComment = React.useCallback(async (commentId: string) => {
    try {
      console.log('[Messaging] handleModalLikeComment called with:', commentId);
      console.log('[Messaging] onLikeComment available:', !!onLikeComment);
      
      if (onLikeComment) {
        console.log('[Messaging] Calling onLikeComment...');
        await onLikeComment(commentId)
        console.log('[Messaging] onLikeComment completed');
        
        // Reload comments to show updated like count
        if (modalPost && onLoadComments) {
          console.log('[Messaging] Reloading comments for post:', modalPost.id);
          const updatedComments = await onLoadComments(modalPost.id)
          console.log('[Messaging] Updated comments loaded:', updatedComments.length);
          setModalPost(prev => prev ? {
            ...prev,
            comments: updatedComments
          } as any : null)
        }
      } else {
        console.log('[Messaging] Like comment (no handler):', commentId)
      }
    } catch (error) {
      console.error('[Messaging] Error liking comment:', error)
    }
  }, [onLikeComment, modalPost, onLoadComments])

  const handleModalUnlikeComment = React.useCallback(async (commentId: string) => {
    try {
      console.log('[Messaging] handleModalUnlikeComment called with:', commentId);
      
      if (onUnlikeComment) {
        console.log('[Messaging] Calling onUnlikeComment...');
        await onUnlikeComment(commentId)
        console.log('[Messaging] onUnlikeComment completed');
        
        // Reload comments to show updated like count
        if (modalPost && onLoadComments) {
          console.log('[Messaging] Reloading comments for post:', modalPost.id);
          const updatedComments = await onLoadComments(modalPost.id)
          console.log('[Messaging] Updated comments loaded:', updatedComments.length);
          setModalPost(prev => prev ? {
            ...prev,
            comments: updatedComments
          } as any : null)
        }
      } else {
        console.log('[Messaging] Unlike comment (no handler):', commentId)
      }
    } catch (error) {
      console.error('[Messaging] Error unliking comment:', error)
    }
  }, [onUnlikeComment, modalPost, onLoadComments])

  const handleModalEditComment = React.useCallback(async (commentId: string, newContent: string, mediaData?: any) => {
    try {
      console.log('[Messaging] handleModalEditComment called with:', commentId, newContent, mediaData);
      
      if (onEditComment) {
        console.log('[Messaging] Calling onEditComment...');
        await onEditComment(commentId, newContent, mediaData);
        console.log('[Messaging] onEditComment completed');
        
        // Reload comments to show updated content
        if (modalPost && onLoadComments) {
          console.log('[Messaging] Reloading comments for post:', modalPost.id);
          const updatedComments = await onLoadComments(modalPost.id);
          console.log('[Messaging] Updated comments loaded:', updatedComments.length);
          setModalPost(prev => prev ? {
            ...prev,
            comments: updatedComments
          } as any : null);
        }
      } else {
        console.log('[Messaging] Edit comment (no handler):', commentId);
      }
    } catch (error) {
      console.error('[Messaging] Error editing comment:', error);
    }
  }, [onEditComment, modalPost, onLoadComments]);

  const handleModalDeleteComment = React.useCallback(async (commentId: string) => {
    try {
      console.log('[Messaging] handleModalDeleteComment called with:', commentId);
      
      if (onDeleteComment) {
        console.log('[Messaging] Calling onDeleteComment...');
        await onDeleteComment(commentId);
        console.log('[Messaging] onDeleteComment completed');
        
        // Reload comments to show updated list
        if (modalPost && onLoadComments) {
          console.log('[Messaging] Reloading comments for post:', modalPost.id);
          const updatedComments = await onLoadComments(modalPost.id);
          console.log('[Messaging] Updated comments loaded:', updatedComments.length);
          setModalPost(prev => prev ? {
            ...prev,
            comments: updatedComments,
            commentCount: Math.max(0, (prev.commentCount || 0) - 1)
          } as any : null);
        }
      } else {
        console.log('[Messaging] Delete comment (no handler):', commentId);
      }
    } catch (error) {
      console.error('[Messaging] Error deleting comment:', error);
    }
  }, [onDeleteComment, modalPost, onLoadComments]);

  const handleFilterChange = React.useCallback((category: string) => {
    setFilterCategory(category)
  }, [])

  // This is the exact same component from community-copy, just rendered without sidebar
  return (
    <div style={{ 
      padding: appliedTheme.spacing.lg 
    }}>
      <style>{`
        .post-card:hover .post-menu-button {
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>
      {/* Write post section */}
      <div style={{ marginBottom: appliedTheme.spacing.lg }}>
        <WritePostSection
          currentUser={currentUser}
          theme={appliedTheme}
          onClick={handleOpenCreateModal}
        />
      </div>

      {/* Filter buttons */}
      <div style={{
        backgroundColor: appliedTheme.colors.surface,
        borderRadius: appliedTheme.borders.borderRadius,
        boxShadow: appliedTheme.borders.boxShadow,
        padding: appliedTheme.spacing.md,
        marginBottom: appliedTheme.spacing.lg
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: appliedTheme.spacing.md }}>
          {['all', 'update', 'gem', 'fun', 'discussion'].map((category) => (
            <button
              key={category}
              onClick={() => handleFilterChange(category)}
              style={{
                border: `1px solid ${filterCategory === category ? appliedTheme.colors.textPrimary : appliedTheme.borders.borderColor}`,
                color: filterCategory === category ? appliedTheme.colors.textPrimary : appliedTheme.colors.textSecondary,
                borderRadius: '999px',
                padding: `${appliedTheme.spacing.xs} ${appliedTheme.spacing.md}`,
                fontWeight: 500,
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Posts list - exact same as community-copy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: appliedTheme.spacing.sm }}>
        {filteredPosts.map((post: Post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            selectedPost={selectedPost} 
            theme={appliedTheme}
            currentUser={currentUser}
            onToggleSelect={handleToggleSelect}
            onLikePost={handleLikePost}
            onEditPost={(postId) => {
              const post = posts.find(p => p.id === postId);
              if (post) {
                handleOpenEditModal(post);
              }
            }}
            onDeletePost={onDeletePost}
            onPinPost={handlePinPost}
            onToggleComments={handleToggleCommentsForPost}
            onVotePoll={handleVotePoll}
          />
        ))}
        {filteredPosts.length === 0 && (
          <div style={{
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            padding: appliedTheme.spacing.xl,
            textAlign: 'center',
            color: appliedTheme.colors.textSecondary
          }}>
            {filterCategory === 'all' 
              ? 'No posts yet. Be the first to share something!' 
              : `No posts in "${filterCategory}" category yet.`
            }
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: appliedTheme.spacing.xl,
            color: appliedTheme.colors.textSecondary 
          }}>
            Loading posts...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ 
            textAlign: 'center', 
            padding: appliedTheme.spacing.xl,
            color: '#EF4444',
            backgroundColor: '#FEF2F2',
            borderRadius: appliedTheme.borders.borderRadius,
            border: '1px solid #FECACA'
          }}>
            Error loading posts: {error}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      <PostDetailModal
        isOpen={isModalOpen}
        post={modalPost}
        currentUser={currentUser}
        onClose={handleCloseModal}
        onLikePost={handleModalLikePost}
        onUnlikePost={handleModalUnlikePost}
        onAddComment={handleModalAddComment}
        onLikeComment={handleModalLikeComment}
        onUnlikeComment={handleModalUnlikeComment}
        onEditComment={handleModalEditComment}
        onDeleteComment={handleModalDeleteComment}
        loadingComments={loadingComments}
        onEditPost={handleEditPost}
        onPinPost={handlePinPost}
        onToggleComments={handleToggleCommentsForPost}
        onVotePoll={handleVotePoll}
        onRemoveVote={handleRemoveVote}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        currentUser={currentUser}
        theme={appliedTheme}
        onClose={handleCloseCreateModal}
        onCreatePost={handleCreatePost}
      />

      {/* Edit Post Modal */}
      <CreatePostModal
        isOpen={isEditModalOpen}
        editMode={true}
        editPost={editingPost}
        currentUser={currentUser}
        theme={appliedTheme}
        onClose={handleCloseEditModal}
        onCreatePost={handleCreatePost}
        onEditPost={handleEditPost}
      />
    </div>
  )
}