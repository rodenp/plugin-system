import * as React from 'react'
import type { PluginProps, User, Community } from '../../types/plugin-interface'
import { defaultTheme } from '../shared/default-theme'
import { PostDetailModal } from './components/PostDetailModal'
import { WritePostSection } from './components/WritePostSection'
import { CreatePostModal } from './components/CreatePostModal'
import { MediaCarousel } from './components/MediaCarousel'
import { ContentRenderer } from './components/ContentRenderer'
import { CommunityService } from './community-service'
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
  commentCount?: number
  isPinned: boolean
  createdAt: string
  level?: number
  videoUrl?: string
  linkUrl?: string
  attachments?: Array<{ id: string; name: string; size: number; type: string; preview: string }>
  commenters?: Array<{ avatarUrl?: string; initials: string; name?: string }>
  newCommentTimeAgo?: string
}

interface CommunityFeedProps extends PluginProps {
  // Community-specific data from host app (extends base PluginProps)
  
  // Data passed from host app
  posts: Post[]
  userLikes?: Set<string>
  loading: boolean
  error?: string
  
  // Action callbacks to host app
  onCreatePost: (post: Omit<Post, 'id' | 'createdAt'>) => Promise<void>
  onLikePost: (postId: string) => Promise<void>
  onUnlikePost: (postId: string) => Promise<void>
  onDeletePost: (postId: string) => Promise<void>
  onAddComment: (postId: string, content: string) => Promise<void>
  onLoadMore?: () => Promise<void>
  onRefresh?: () => Promise<void>
}


const FilterButtons: React.FC<{
  filterCategory: string
  theme: any
  onFilterChange: (category: string) => void
}> = ({ filterCategory, theme, onFilterChange }) => (
  <div style={{
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.borderRadius,
    boxShadow: theme.borders.boxShadow,
    padding: theme.spacing.md
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
      {['all', 'update', 'gem', 'fun', 'discussion'].map((category) => (
        <button
          key={category}
          onClick={() => onFilterChange(category)}
          style={{
            border: `1px solid ${filterCategory === category ? theme.colors.textPrimary : theme.borders.borderColor}`,
            color: filterCategory === category ? theme.colors.textPrimary : theme.colors.textSecondary,
            borderRadius: '999px',
            padding: `${theme.spacing.xs} ${theme.spacing.md}`,
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
)

const PostCard: React.FC<{
  post: Post
  selectedPost: string | null
  theme: any
  currentUser: any
  onToggleSelect: (postId: string) => void
  onLikePost: (postId: string) => void
  onEditPost?: (postId: string) => void
}> = ({ post, selectedPost, theme, currentUser, onToggleSelect, onLikePost, onEditPost }) => (
  <div
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
        {post.author.charAt(0)}
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
        <div style={{ fontWeight: 600 }}>{post.author}</div>
        <div style={{ fontSize: theme.font.sizeSm, color: theme.colors.muted }}>
          {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
        {currentUser?.id === post.authorId && (
          <button 
            onClick={(e) => {
              e.stopPropagation()
              if (onEditPost) onEditPost(post.id)
            }}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.textSecondary,
              fontSize: theme.font.sizeSm,
              cursor: 'pointer',
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              borderRadius: theme.borders.borderRadius
            }}>
            Edit
          </button>
        )}
        {post.isPinned && <div style={{ color: theme.colors.highlight, fontWeight: 600 }}>📌 Pinned</div>}
      </div>
    </div>

    {/* Content */}
    <div style={{ marginBottom: theme.spacing.md }}>
      {post.title && (
        <div style={{ fontWeight: 600, fontSize: theme.font.sizeMd, marginBottom: theme.spacing.sm }}>
          {post.title}
        </div>
      )}
      <div style={{ fontSize: theme.font.sizeSm, color: theme.colors.textSecondary }}>
        <ContentRenderer content={post.content} theme={theme} excludeGifs={true} />
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
      
      {/* All media in unified carousel */}
      <MediaCarousel
        attachments={post.attachments}
        videoUrl={post.videoUrl}
        pollData={(post as any).pollData}
        content={post.content}
        theme={theme}
        compact={true}
      />
    </div>

    {/* Interaction buttons */}
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: theme.spacing.md, 
      fontSize: theme.font.sizeMd, 
      color: theme.colors.textSecondary, 
      marginBottom: theme.spacing.sm 
    }}>
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
        👍 {post.likes}
      </button>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span>💬 {post.comments}</span>

        <div style={{ display: 'flex', marginLeft: theme.spacing.sm }}>
          {post.commenters?.slice(0, 5).map((user, idx) => (
            <div key={idx} style={{
              width: '32px',
              height: '32px',
              borderRadius: '999px',
              backgroundColor: theme.colors.surfaceAlt,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: `2px solid ${theme.colors.surface}`,
              fontSize: '12px',
              fontWeight: 600,
              marginLeft: idx === 0 ? 0 : '-10px'
            }}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '999px' }} />
                : user.initials || '?'}
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* New comment time ago */}
    {post.newCommentTimeAgo && (
      <div style={{
        fontSize: theme.font.sizeSm,
        color: theme.colors.secondary,
        fontWeight: 500
      }}>
        New comment {post.newCommentTimeAgo}
      </div>
    )}
  </div>
)

const CommunitySidebar: React.FC<{
  currentUser: any
  community: Community
  userRole: string
  theme: any
}> = ({ community, userRole, theme }) => {
  const isOwner = userRole === 'owner'
  
  return (
    <>
      <div style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borders.borderRadius,
        boxShadow: theme.borders.boxShadow,
        padding: theme.spacing.lg
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: theme.borders.borderRadius,
            backgroundColor: theme.colors.surfaceAlt,
            margin: 'auto', display: 'flex',
            justifyContent: 'center', alignItems: 'center',
            fontSize: theme.font.size2xl, fontWeight: 600,
            marginBottom: theme.spacing.md
          }}>
            {community?.name?.charAt(0) || '🏋️'}
          </div>
          <h3 style={{ fontSize: theme.font.sizeLg, fontWeight: 600 }}>{community?.name}</h3>
          <p style={{ fontSize: theme.font.sizeSm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
            {community?.description || 'Community description'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
            <div>
              <div style={{ fontSize: theme.font.sizeLg, fontWeight: 600 }}>{community?.stats?.memberCount || 0}</div>
              <div style={{ fontSize: theme.font.sizeXs, color: theme.colors.muted }}>Members</div>
            </div>
            <div>
              <div style={{ fontSize: theme.font.sizeLg, fontWeight: 600, color: theme.colors.accent }}>{community?.stats?.online || 0}</div>
              <div style={{ fontSize: theme.font.sizeXs, color: theme.colors.muted }}>Online</div>
            </div>
            <div>
              <div style={{ fontSize: theme.font.sizeLg, fontWeight: 600, color: theme.colors.secondary }}>{community?.stats?.adminCount || 0}</div>
              <div style={{ fontSize: theme.font.sizeXs, color: theme.colors.muted }}>Admins</div>
            </div>
          </div>
          <button style={{
            backgroundColor: theme.colors.secondary,
            color: 'white',
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderRadius: theme.borders.borderRadius,
            border: 'none',
            width: '100%',
            fontWeight: 600,
            cursor: 'pointer'
          }}>INVITE PEOPLE</button>
        </div>
      </div>

      {/* Status Card */}
      <div style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borders.borderRadius,
        boxShadow: theme.borders.boxShadow,
        padding: theme.spacing.lg,
        marginTop: theme.spacing.lg
      }}>
        <h3 style={{ fontSize: theme.font.sizeLg, fontWeight: 600, marginBottom: theme.spacing.md }}>Status</h3>
        <p style={{ fontSize: theme.font.sizeSm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
          Get respect with a status emoji next to your name.
        </p>
        <div style={{ fontSize: theme.font.sizeSm, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          <div>⭐ Star — top 1% of discovery</div>
          <div>🔥 Fire — 30d activity streak</div>
          <div>🐐 Goat — highest earner</div>
          <div>🥷 Ninja — $300k MRR</div>
          <div>💎 Diamond — $100k MRR</div>
          <div>👑 Crown — $30k MRR</div>
          <div>🚀 Rocket — $10k MRR</div>
        </div>
      </div>
    </>
  )
}

export const CommunityFeedComponent: React.FC<CommunityFeedProps> = ({
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
  onDeletePost,
  onAddComment,
  onLoadMore,
  onRefresh
}) => {
  

  // Local state for UI interactions
  const [selectedPost, setSelectedPost] = React.useState<string | null>(null)
  const [filterCategory, setFilterCategory] = React.useState('all')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [modalPost, setModalPost] = React.useState<CommunityPost | null>(null)
  
  // Create post modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  
  // Enhanced posts state to include our custom posts
  const [customPosts, setCustomPosts] = React.useState<any[]>([])
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)
  
  // Initialize community service
  const communityService = React.useMemo(() => new CommunityService({
    enableComments: true,
    enableDiscussions: true,
    enableLeaderboards: false,
    enableAchievements: false,
    enableStudyGroups: false,
    moderationSettings: {
      requireApproval: false,
      autoModeration: false,
      bannedWords: []
    }
  }), [])

  // Apply theme
  const appliedTheme = defaultTheme

  // Load custom posts from localStorage
  React.useEffect(() => {
    const loadCustomPosts = () => {
      const storageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith(`${communityService.storage}_post_`)
      )
      
      const customPostsData = storageKeys.map(key => {
        try {
          const post = JSON.parse(localStorage.getItem(key) || '{}')
          // Also check for likes
          const postId = post.id
          if (postId) {
            const likesKey = `${communityService.storage}_post_likes_${postId}`
            const likes = JSON.parse(localStorage.getItem(likesKey) || '[]')
            post.likes = likes.length
            post.likedByUser = likes.some((like: any) => like.userId === (currentUser?.id || 'anonymous'))
            
            // Also get comment count
            const commentsKey = `${communityService.storage}_post_comments_${postId}`
            const comments = JSON.parse(localStorage.getItem(commentsKey) || '[]')
            post.commentCount = comments.length
          }
          
          return {
            ...post,
            createdAt: typeof post.createdAt === 'string' ? post.createdAt : new Date(post.createdAt).toISOString()
          }
        } catch {
          return null
        }
      }).filter(Boolean)
      
      setCustomPosts(customPostsData)
    }
    
    loadCustomPosts()
  }, [communityService, refreshTrigger, currentUser])

  // Combine original posts with custom posts, avoiding duplicates, and sort by newest first
  const allPosts = React.useMemo(() => {
    // Keep original posts unchanged - don't modify their counts
    const existingIds = new Set(posts.map(p => p.id))
    const uniqueCustomPosts = customPosts.filter(p => !existingIds.has(p.id))
    const combined = [...posts, ...uniqueCustomPosts]
    
    // Enhance posts with comment activity data
    const enhancedPosts = combined.map(post => {
      try {
        // Get comments for this post
        const commentsKey = `${communityService.storage}_post_comments_${post.id}`
        const comments = JSON.parse(localStorage.getItem(commentsKey) || '[]')
        
        if (comments.length === 0) {
          return post // No comments, return as-is
        }
        
        // Build unique commenters list (last 5 unique contributors)
        const uniqueCommenters = new Map()
        const sortedComments = comments.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        
        // First, add commenters from actual comments (most recent activity first)
        sortedComments.forEach((comment: any) => {
          if (!uniqueCommenters.has(comment.authorId) && uniqueCommenters.size < 5) {
            const initials = comment.authorName ? 
              comment.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase() :
              '?'
            
            uniqueCommenters.set(comment.authorId, {
              avatarUrl: comment.authorAvatar,
              initials,
              name: comment.authorName || 'Anonymous'
            })
          }
        })
        
        // Then add existing commenters from demo data (only if slots remain and they're unique)
        if (post.commenters && Array.isArray(post.commenters)) {
          post.commenters.forEach((commenter: any) => {
            // Use initials as unique key to avoid duplicates
            const uniqueKey = `demo_${commenter.initials}`
            if (!uniqueCommenters.has(uniqueKey) && 
                !Array.from(uniqueCommenters.values()).some(c => c.initials === commenter.initials) &&
                uniqueCommenters.size < 5) {
              uniqueCommenters.set(uniqueKey, {
                ...commenter,
                name: commenter.name || commenter.initials
              })
            }
          })
        }
        
        // Get the latest comment timestamp
        const latestComment = sortedComments[0]
        const latestCommentDate = new Date(latestComment.createdAt)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - latestCommentDate.getTime()) / 1000)
        
        let timeAgo = ''
        if (diffInSeconds < 60) timeAgo = 'just now'
        else if (diffInSeconds < 3600) timeAgo = `${Math.floor(diffInSeconds / 60)}m ago`
        else if (diffInSeconds < 86400) timeAgo = `${Math.floor(diffInSeconds / 3600)}h ago`
        else if (diffInSeconds < 2592000) timeAgo = `${Math.floor(diffInSeconds / 86400)}d ago`
        else timeAgo = latestCommentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        
        return {
          ...post,
          commenters: Array.from(uniqueCommenters.values()),
          newCommentTimeAgo: timeAgo // Update with latest activity
        }
      } catch (error) {
        console.error('[Community] Error enhancing post with comment data:', error)
        return post
      }
    })
    
    // Sort by creation date, newest first
    return enhancedPosts.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })
  }, [posts, customPosts, communityService, refreshTrigger])

  // Filter posts based on category
  const filteredPosts = React.useMemo(() => {
    if (filterCategory === 'all') return allPosts
    return allPosts.filter((post: Post) => post.category === filterCategory)
  }, [allPosts, filterCategory])

  // Event handlers
  const handleOpenCreateModal = React.useCallback(() => {
    setIsCreateModalOpen(true)
  }, [])

  const handleCloseCreateModal = React.useCallback(() => {
    setIsCreateModalOpen(false)
  }, [])

  const handleCreatePost = React.useCallback(async (title: string, content: string, category: string, mediaData?: any) => {
    try {
      // Create post using our community service
      const newPost = {
        id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        title,
        content,
        category,
        author: currentUser?.profile?.displayName || 'Anonymous',
        authorId: currentUser?.id || 'anonymous',
        authorAvatar: currentUser?.profile?.avatar,
        authorLevel: 1, // Default level since it's not in the user profile
        likes: 0,
        likedByUser: false,
        commentCount: 0,
        isPinned: false,
        createdAt: new Date(),
        comments: [],
        commenters: [],
        videoUrl: mediaData?.type === 'video' ? mediaData.url : undefined,
        linkUrl: mediaData?.type === 'link' ? mediaData.url : undefined,
        pollData: mediaData?.type === 'poll' ? mediaData : undefined,
        attachments: mediaData?.attachments || undefined
      }
      
      // Save to localStorage using community service format
      const postKey = `${communityService.storage}_post_${newPost.id}`
      
      try {
        localStorage.setItem(postKey, JSON.stringify(newPost))
        
        // Trigger refresh of custom posts
        setRefreshTrigger(prev => prev + 1)
        
        // Note: We don't call the original onCreatePost handler to avoid duplicates
        // Our implementation is more complete and handles media data
      } catch (storageError) {
        if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
          alert('Storage quota exceeded. Your post contains attachments that are too large. Please try with smaller files or remove some attachments.')
          console.error('[Community] Storage quota exceeded:', storageError)
          return // Don't continue with post creation
        } else {
          throw storageError // Re-throw other storage errors
        }
      }
    } catch (error) {
      console.error('[Community] Error creating post:', error)
      alert('Error creating post. Please try again with smaller attachments.')
    }
  }, [onCreatePost, currentUser, communityService, setRefreshTrigger])

  const handleLikePost = React.useCallback(async (postId: string) => {
    try {
      // Just call the original handler - don't interfere with the original system
      if (onLikePost) {
        await onLikePost(postId)
      }
    } catch (error) {
      console.error('[Community] Error liking post:', error)
    }
  }, [onLikePost])

  const handleToggleSelect = React.useCallback(async (postId: string) => {
    // Open modal instead of just selecting
    try {
      // Look for the post in both demo posts and combined posts (which includes custom posts)
      let currentPost = posts.find(p => p.id === postId)
      
      // If not found in demo posts, look in the combined allPosts array
      if (!currentPost) {
        currentPost = allPosts.find(p => p.id === postId)
      }
      
      if (currentPost) {
        // Get any existing comments from our storage for this post
        const commentsKey = `${communityService.storage}_post_comments_${postId}`
        const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]')
        
        // Build threaded comments from our storage
        const threadedComments = existingComments.length > 0 ? 
          communityService.buildCommentTree(existingComments, currentUser?.id || 'anonymous') : []
        
        // Create post with comments for modal
        const postWithComments: CommunityPost = {
          ...currentPost,
          authorAvatar: currentPost.authorAvatar || currentUser?.profile?.avatar,
          authorLevel: currentPost.level || 1,
          // Use the exact same data as shown in the feed
          likes: currentPost.likes || 0,
          likedByUser: userLikes ? userLikes.has(postId) : false,
          commentCount: Math.max(currentPost.commentCount || currentPost.comments || 0, existingComments.length),
          createdAt: new Date(currentPost.createdAt),
          comments: threadedComments,
          commenters: currentPost.commenters?.map(c => ({ 
            ...c, 
            name: c.name || c.initials 
          })) || []
        }
        
        setModalPost(postWithComments)
        setIsModalOpen(true)
      } else {
        console.warn('[Community] Post not found:', postId)
      }
    } catch (error) {
      console.error('[Community] Error loading post details:', error)
    }
  }, [communityService, posts, allPosts, currentUser, userLikes])

  const handleFilterChange = React.useCallback((category: string) => {
    setFilterCategory(category)
  }, [])

  // Modal handlers
  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false)
    setModalPost(null)
  }, [])

  const handleModalLikePost = React.useCallback(async (postId: string) => {
    try {
      // Call the original like handler to maintain consistency
      if (onLikePost) {
        await onLikePost(postId)
      }
    } catch (error) {
      console.error('[Community] Error liking post:', error)
    }
  }, [onLikePost])

  const handleModalUnlikePost = React.useCallback(async (postId: string) => {
    // Same as like since service handles toggle
    return handleModalLikePost(postId)
  }, [handleModalLikePost])

  const handleModalAddComment = React.useCallback(async (postId: string, content: string, parentId?: string, mediaData?: any) => {
    try {
      // Add comment to our storage system
      await communityService.addPostComment(
        postId, 
        content, 
        currentUser?.id || 'anonymous',
        currentUser?.profile?.displayName || 'Anonymous',
        parentId,
        mediaData
      )
      
      // Also call the demo's onAddComment callback to update the posts state
      if (onAddComment) {
        await onAddComment(postId, content)
      }
      
      // Get updated comments and refresh modal
      const commentsKey = `${communityService.storage}_post_comments_${postId}`
      const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]')
      const threadedComments = communityService.buildCommentTree(existingComments, currentUser?.id || 'anonymous')
      
      if (modalPost) {
        // Update comments immediately
        setModalPost(prev => prev ? {
          ...prev,
          comments: threadedComments,
          commentCount: existingComments.length
        } : null)
        
        // Trigger a refresh of the post data to update commenters and activity timestamp
        setRefreshTrigger(prev => prev + 1)
      }
    } catch (error) {
      console.error('[Community] Error adding comment:', error)
    }
  }, [communityService, currentUser, modalPost, onAddComment, posts])

  const handleModalLikeComment = React.useCallback(async (commentId: string) => {
    try {
      await communityService.toggleCommentLike(commentId, currentUser?.id || 'anonymous')
      // Refresh modal post data
      if (modalPost) {
        const updatedPost = await communityService.getPostWithComments(modalPost.id, currentUser?.id || 'anonymous')
        if (updatedPost) {
          setModalPost(updatedPost)
        }
      }
    } catch (error) {
      console.error('[Community] Error liking comment:', error)
    }
  }, [communityService, currentUser, modalPost])

  const handleModalUnlikeComment = React.useCallback(async (commentId: string) => {
    // Same as like since service handles toggle
    return handleModalLikeComment(commentId)
  }, [handleModalLikeComment])

  // Update modal when posts or userLikes change from parent
  React.useEffect(() => {
    if (modalPost && posts && userLikes) {
      const updatedPost = posts.find(p => p.id === modalPost.id)
      if (updatedPost) {
        setModalPost(prev => prev ? {
          ...prev,
          likes: updatedPost.likes || 0,
          likedByUser: userLikes.has(prev.id),
          commentCount: updatedPost.comments || 0  // Use the exact count from demo
        } : null)
      }
    }
  }, [posts, userLikes, refreshTrigger]) // Include refreshTrigger to force updates

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '2fr 1fr', 
      gap: appliedTheme.spacing.lg, 
      padding: appliedTheme.spacing.lg 
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: appliedTheme.spacing.lg }}>
        <WritePostSection 
          currentUser={currentUser} 
          theme={appliedTheme}
          onClick={handleOpenCreateModal}
        />
        <FilterButtons 
          filterCategory={filterCategory} 
          theme={appliedTheme}
          onFilterChange={handleFilterChange}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: appliedTheme.spacing.md }}>
          {filteredPosts.map((post: Post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              selectedPost={selectedPost} 
              theme={appliedTheme}
              currentUser={currentUser}
              onToggleSelect={handleToggleSelect}
              onLikePost={handleLikePost}
              onEditPost={(postId) => alert(`Edit post ${postId} - Edit functionality not implemented yet`)}
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
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: appliedTheme.spacing.lg }}>
        <CommunitySidebar 
          currentUser={currentUser} 
          community={community} 
          userRole={userRole}
          theme={appliedTheme}
        />
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
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        currentUser={currentUser}
        theme={appliedTheme}
        onClose={handleCloseCreateModal}
        onCreatePost={handleCreatePost}
      />
    </div>
  )
}