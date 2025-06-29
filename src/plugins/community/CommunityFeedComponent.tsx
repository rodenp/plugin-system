import * as React from 'react'
import type { PluginProps } from '../../types/plugin-interface'
import { defaultTheme } from '../shared/default-theme'
import { usePluginComponent } from '../../core/hooks/usePluginComponent'

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
  // Data passed from host app
  posts: Post[]
  userLikes?: Set<string>
  loading: boolean
  error?: string
  
  // Action callbacks to host app
  onCreatePost: (post: Omit<Post, 'id' | 'createdAt'>) => Promise<void>
  onLikePost: (postId: string) => Promise<void>
  onUnlikePost: (postId: string) => Promise<void>
  onEditPost?: (postId: string, updates: { title?: string; content: string; category?: string; mediaData?: any }) => Promise<void>
  onDeletePost: (postId: string) => Promise<void>
  onAddComment: (postId: string, content: string) => Promise<void>
  onLoadComments?: (postId: string) => Promise<any[]>
  onLikeComment?: (commentId: string) => Promise<void>
  onUnlikeComment?: (commentId: string) => Promise<void>
  onEditComment?: (commentId: string, newContent: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  onLoadMore?: () => Promise<void>
  onRefresh?: () => Promise<void>
}

export const CommunityFeedComponent: React.FC<CommunityFeedProps> = (props) => {
  const {
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
    onLoadMore,
    onRefresh,
    theme
  } = props;

  // Get components from dependency plugins using universal hook
  const MessagingFeedComponent = usePluginComponent('messaging', 'MessagingFeedComponent');
  const CommunitySidebar = usePluginComponent('community-sidebar', 'CommunitySidebar');
  
  // Apply theme
  const appliedTheme = theme || defaultTheme;
  
  // Simple layout coordinator - just arrange the pieces
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '2fr 1fr', 
      gap: appliedTheme.spacing.lg, 
      padding: appliedTheme.spacing.lg 
    }}>
      {/* Left Column - Messaging Plugin handles all the feed logic */}
      <div>
        {MessagingFeedComponent ? (
          <MessagingFeedComponent 
            currentUser={currentUser}
            communityId={communityId}
            community={community}
            userRole={userRole}
            posts={posts}
            userLikes={userLikes}
            loading={loading}
            error={error}
            onCreatePost={onCreatePost}
            onLikePost={onLikePost}
            onUnlikePost={onUnlikePost}
            onEditPost={onEditPost}
            onDeletePost={onDeletePost}
            onAddComment={onAddComment}
            onLoadComments={onLoadComments}
            onLikeComment={onLikeComment}
            onUnlikeComment={onUnlikeComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            onLoadMore={onLoadMore}
            onRefresh={onRefresh}
            theme={appliedTheme}
          />
        ) : (
          <div style={{ 
            padding: appliedTheme.spacing.xl, 
            textAlign: 'center',
            color: appliedTheme.colors.textSecondary,
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            boxShadow: appliedTheme.borders.boxShadow
          }}>
            Loading messaging...
          </div>
        )}
      </div>
      
      {/* Right Column - Sidebar Plugin handles all the sidebar logic */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: appliedTheme.spacing.lg }}>
        {CommunitySidebar ? (
          <CommunitySidebar 
            community={community}
            currentUser={currentUser}
            userRole={userRole}
            theme={appliedTheme}
          />
        ) : (
          <div style={{ 
            padding: appliedTheme.spacing.xl, 
            textAlign: 'center',
            color: appliedTheme.colors.textSecondary,
            backgroundColor: appliedTheme.colors.surface,
            borderRadius: appliedTheme.borders.borderRadius,
            boxShadow: appliedTheme.borders.boxShadow
          }}>
            Loading sidebar...
          </div>
        )}
      </div>
    </div>
  );
};