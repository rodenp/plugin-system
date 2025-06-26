# New Community Plugin Migration Specification

## Overview
This document outlines the planned changes to implement storage-agnostic data handling in the new community plugin. The goal is to make minimal changes while transitioning from Redux-based state management to a host-owned data architecture.

## Current Architecture (Community Plugin)
- **State Management**: Redux slices for posts, likes, comments
- **Data Fetching**: Direct API calls within components
- **Storage**: Components directly interact with backend APIs
- **Cross-Plugin Communication**: Redux actions and selectors

## New Architecture (New Community Plugin)

### 1. Data Flow Changes
**BEFORE**: Component → Redux Action → API Call → Redux State → Component
**AFTER**: Component → Callback Prop → Host App → Storage Provider → Callback Prop → Component

### 2. Props Interface Changes

#### Current Component Props
```typescript
interface CommunityFeedProps {
  communityId: string;
  currentUser: User;
  userRole: string;
}
```

#### New Component Props
```typescript
interface NewCommunityFeedProps {
  communityId: string;
  currentUser: User;
  userRole: string;
  
  // Data passed from host app
  posts: Post[];
  loading: boolean;
  error?: string;
  
  // Action callbacks to host app
  onCreatePost: (post: Omit<Post, 'id' | 'createdAt'>) => Promise<void>;
  onLikePost: (postId: string) => Promise<void>;
  onUnlikePost: (postId: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onAddComment: (postId: string, content: string) => Promise<void>;
  onLoadMore?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}
```

### 3. Component Changes

#### Files to Modify
- `src/plugins/new-community/CommunityFeedComponent.tsx`
- `src/plugins/new-community/plugin.tsx`
- `src/plugins/new-community/index.ts`

#### Specific Changes

**1. Remove Redux Dependencies**
```typescript
// REMOVE these imports
import { useSelector, useDispatch } from 'react-redux';
import { createPost, likePost, deletePost } from './store';

// REMOVE these hooks
const dispatch = useDispatch();
const posts = useSelector(state => state.community.posts);
```

**2. Replace with Props**
```typescript
// ADD props parameter to component
const CommunityFeedComponent: React.FC<NewCommunityFeedProps> = ({
  posts,
  loading,
  error,
  onCreatePost,
  onLikePost,
  onUnlikePost,
  onDeletePost,
  onAddComment,
  // ... other props
}) => {
  // Component logic remains mostly the same
};
```

**3. Replace Action Calls**
```typescript
// BEFORE
const handleLike = (postId: string) => {
  dispatch(likePost(postId));
};

// AFTER  
const handleLike = async (postId: string) => {
  try {
    await onLikePost(postId);
  } catch (error) {
    console.error('Failed to like post:', error);
  }
};
```

**4. Remove Local State Management**
```typescript
// REMOVE local loading states (now passed as props)
const [loading, setLoading] = useState(false);
const [posts, setPosts] = useState([]);

// KEEP UI-only local state
const [showCreateForm, setShowCreateForm] = useState(false);
const [selectedPost, setSelectedPost] = useState(null);
```

### 4. Plugin Definition Changes

#### Current Plugin Export
```typescript
export const communityPlugin: SkoolPlugin = {
  id: 'community',
  name: 'Community',
  component: CommunityFeedComponent,
  reduxSlice: communitySlice,  // REMOVE
  // ...
};
```

#### New Plugin Export  
```typescript
export const newCommunityPlugin: Plugin = {
  id: 'community',
  name: 'Community',
  component: CommunityFeedComponent,
  // No Redux slice - data handled by host
  // ...
};
```

### 5. Host App Integration

The host app (demo) will be responsible for:

1. **Data Management**: Fetching posts, managing loading states
2. **Storage Operations**: Creating, updating, deleting posts
3. **Cross-Plugin Events**: Announcing course creation to community feed
4. **Real-time Updates**: Handling live data synchronization

#### Demo Integration Example
```typescript
const CommunityWithData: React.FC<Props> = (props) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleCreatePost = async (postData) => {
    // Host app handles storage
    const newPost = await storageProvider.createPost(postData);
    setPosts(prev => [newPost, ...prev]);
  };
  
  return (
    <CommunityFeedComponent
      {...props}
      posts={posts}
      loading={loading}
      onCreatePost={handleCreatePost}
      // ... other callbacks
    />
  );
};
```

### 6. Data Types (No Changes Required)

The existing Post, User, and Comment interfaces can remain unchanged:

```typescript
interface Post {
  id: string;
  author: string;
  content: string;
  likes: number;
  comments: number;
  createdAt: string;
  // ... existing fields
}
```

### 7. Benefits of These Changes

1. **Storage Agnostic**: Plugin doesn't know about PostgreSQL, IndexedDB, etc.
2. **Host Control**: Host app owns all data and can switch storage backends
3. **Testability**: Easy to test with mock data and callbacks
4. **Reusability**: Plugin can work in any host app that provides the required props
5. **Performance**: Host can optimize data fetching and caching

### 8. Migration Strategy

1. **Copy existing community plugin to new-community**
2. **Update component props interface**
3. **Remove Redux dependencies and state management**
4. **Replace dispatch calls with callback props**
5. **Update plugin definition to remove Redux slice**
6. **Test with demo app providing data via props**

### 9. Validation Checklist

- [ ] Component receives all data via props
- [ ] No direct API calls in component
- [ ] No Redux imports or usage
- [ ] All user actions go through callback props
- [ ] Loading states handled by host app
- [ ] Error handling via props
- [ ] Cross-plugin communication works via host app

## Implementation Priority

**Phase 1**: Basic data flow (posts display, create, like)
**Phase 2**: Comments and advanced interactions  
**Phase 3**: Real-time updates and cross-plugin events
**Phase 4**: Performance optimizations and caching

This approach ensures the community plugin becomes completely storage-agnostic while maintaining all existing functionality.