# New Plugin System - Community Plugin

## Overview
This document describes the features and architecture of the new plugin system, specifically focusing on the storage-agnostic data handling approach implemented in the community plugin.

## New Plugin System Features

### 1. Storage-Agnostic Architecture

The new plugin system completely separates plugins from storage concerns, allowing for maximum flexibility and reusability.

#### Key Principles
- **Host-Owned Data**: The host application owns all data and storage operations
- **Plugin Agnosticism**: Plugins have no knowledge of storage implementation (PostgreSQL, IndexedDB, localStorage, etc.)
- **Props-Based Interface**: All data flows through component props, not internal state management
- **Callback-Driven Actions**: Plugins communicate actions back to host through callback functions

#### Data Flow Architecture
```
Host App (Storage Provider) → Props → Plugin Component
Plugin Component → Callbacks → Host App (Storage Provider)
```

### 2. Cross-Plugin Communication System

#### Event-Driven Architecture
- **EventBus**: Central event system for broadcasting plugin events
- **Service Registry**: Direct method calls between plugins
- **Data Streams**: Reactive shared state for real-time updates

#### Communication Methods
```typescript
// Event Broadcasting
eventBus.emit('course.created', { courseId, title, communityId });
eventBus.on('course.created', (data) => {
  // Community plugin listens and creates announcement post
});

// Service Calls
const courseService = serviceRegistry.get('courseBuilder');
const course = await courseService.getCourse(courseId);

// Data Streams
const postsStream = dataStreamManager.getStream('posts');
postsStream.subscribe((posts) => {
  // Real-time updates across plugins
});
```

### 3. Plugin Interface Definition

#### Core Plugin Structure
```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  component: React.ComponentType<PluginProps>;
  dependencies?: string[];
  
  // Lifecycle hooks
  onInit?: (manager: PluginManager) => Promise<void>;
  onDestroy?: () => Promise<void>;
  onInstall?: () => Promise<void>;
  
  // Plugin-specific configuration
  config?: Record<string, any>;
}
```

#### Plugin Props Interface
```typescript
interface PluginProps {
  // Context data
  currentUser: User;
  communityId: string;
  community: Community;
  userRole: string;
  
  // Plugin-specific data (passed by host)
  [key: string]: any;
}
```

### 4. Host Application Responsibilities

#### Data Management
```typescript
class HostDataManager {
  // Storage provider abstraction
  private storageProvider: StorageProvider;
  
  // Plugin data state
  private pluginData: Map<string, any> = new Map();
  
  // Provide data to plugins
  getPluginProps(pluginId: string): PluginProps {
    return {
      ...baseProps,
      ...this.pluginData.get(pluginId)
    };
  }
  
  // Handle plugin actions
  async handlePluginAction(pluginId: string, action: string, data: any) {
    switch (action) {
      case 'createPost':
        const post = await this.storageProvider.createPost(data);
        this.updatePluginData('community', { posts: [...posts, post] });
        this.eventBus.emit('post.created', post);
        break;
      // ... other actions
    }
  }
}
```

#### Storage Provider Interface
```typescript
interface StorageProvider {
  // Posts
  getPosts(communityId: string): Promise<Post[]>;
  createPost(post: Omit<Post, 'id' | 'createdAt'>): Promise<Post>;
  updatePost(postId: string, updates: Partial<Post>): Promise<Post>;
  deletePost(postId: string): Promise<void>;
  
  // Likes
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  
  // Comments
  getComments(postId: string): Promise<Comment[]>;
  createComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment>;
  
  // Courses
  getCourses(communityId: string): Promise<Course[]>;
  createCourse(course: Omit<Course, 'id' | 'createdAt'>): Promise<Course>;
  
  // Real-time subscriptions
  subscribe(entity: string, callback: (data: any) => void): () => void;
}
```

### 5. Community Plugin Implementation

#### Component Props Interface
```typescript
interface CommunityFeedProps extends PluginProps {
  // Data from host
  posts: Post[];
  loading: boolean;
  error?: string;
  
  // Action callbacks to host
  onCreatePost: (post: Omit<Post, 'id' | 'createdAt'>) => Promise<void>;
  onLikePost: (postId: string) => Promise<void>;
  onUnlikePost: (postId: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onAddComment: (postId: string, content: string) => Promise<void>;
  
  // Optional callbacks
  onLoadMore?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}
```

#### Component Implementation
```typescript
const CommunityFeedComponent: React.FC<CommunityFeedProps> = ({
  posts,
  loading,
  error,
  onCreatePost,
  onLikePost,
  onDeletePost,
  currentUser,
  userRole,
  // ... other props
}) => {
  // Only UI state - no data state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  
  // All data operations go through callbacks
  const handleCreatePost = async (content: string) => {
    try {
      await onCreatePost({
        content,
        authorId: currentUser.id,
        author: currentUser.profile.displayName,
        communityId,
        category: 'general'
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };
  
  // Render posts from props
  return (
    <div className="community-feed">
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onLike={() => onLikePost(post.id)}
          onDelete={() => onDeletePost(post.id)}
          canDelete={userRole === 'owner' || post.authorId === currentUser.id}
        />
      ))}
      
      {showCreateForm && (
        <CreatePostForm
          onSubmit={handleCreatePost}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};
```

### 6. Real-Time Updates

#### WebSocket Integration
```typescript
class RealTimeManager {
  private ws: WebSocket;
  private eventBus: EventBus;
  
  connect(communityId: string) {
    this.ws = new WebSocket(`ws://api/communities/${communityId}/live`);
    
    this.ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      
      switch (type) {
        case 'post.created':
          this.eventBus.emit('post.created', data);
          break;
        case 'post.liked':
          this.eventBus.emit('post.liked', data);
          break;
        // ... other real-time events
      }
    };
  }
}
```

#### Host Integration
```typescript
// Host app listens to real-time events and updates plugin data
eventBus.on('post.created', (post) => {
  const currentPosts = this.getPluginData('community').posts;
  this.updatePluginData('community', {
    posts: [post, ...currentPosts]
  });
  this.rerenderPlugin('community');
});
```

### 7. Benefits of New Architecture

#### For Plugin Developers
- **Simple Interface**: Only need to handle props and callbacks
- **No Storage Concerns**: Focus purely on UI and user interactions
- **Easy Testing**: Mock data and callbacks for comprehensive testing
- **Reusability**: Same plugin works with any storage backend

#### For Host Applications
- **Full Control**: Complete ownership of data and storage
- **Flexible Storage**: Easy to switch between storage providers
- **Performance**: Optimize data fetching, caching, and real-time updates
- **Security**: Centralized data validation and access control

#### For System Architecture
- **Modularity**: Clean separation of concerns
- **Scalability**: Easy to add new plugins without affecting existing ones
- **Maintainability**: Clear interfaces and minimal coupling
- **Extensibility**: Simple to add new features and capabilities

### 8. Migration Benefits

#### From Redux-Based to Props-Based
- **Reduced Complexity**: No need to manage Redux stores per plugin
- **Better Performance**: Host app can optimize data fetching patterns
- **Improved Testing**: Easier to test components in isolation
- **Enhanced Reusability**: Plugins work in any React application

#### Storage Provider Flexibility
```typescript
// Easy to switch storage backends
const postgresProvider = new PostgreSQLStorageProvider(config);
const indexedDBProvider = new IndexedDBStorageProvider();
const mockProvider = new MockStorageProvider(testData);

// Same plugin, different storage
<CommunityPlugin storageProvider={postgresProvider} />
<CommunityPlugin storageProvider={indexedDBProvider} />
<CommunityPlugin storageProvider={mockProvider} />
```

### 9. Future Enhancements

#### Planned Features
- **Plugin Hot Reloading**: Dynamic plugin updates without page refresh
- **Plugin Marketplace**: Remote plugin installation and management
- **Advanced Caching**: Intelligent data caching strategies
- **Offline Support**: Local-first architecture with sync capabilities
- **Plugin Analytics**: Usage tracking and performance monitoring

#### Extensibility Points
- **Custom Storage Providers**: Implement any storage backend
- **Plugin Middleware**: Intercept and modify plugin data flow
- **Event System Extensions**: Custom event types and handlers
- **UI Theme System**: Dynamic theming across all plugins

This new plugin system provides a robust, flexible, and maintainable architecture that scales from simple applications to complex multi-tenant platforms.