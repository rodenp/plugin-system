# Plugin System Data Model

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER TABLE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ id (PK) │ username │ email │ displayName │ bio │ avatar │ level │ ... │
└─────────────────────────────────────────────────────────────────────────┘
     ▲ id                    ▲ id                    ▲ id
     │                       │                       │
     │ ownerId (FK)          │ authorId (FK)        │ authorId (FK)
     │                       │                       │
┌────┴────────────────┐ ┌────┴────────────────┐ ┌───┴─────────────────┐
│   COMMUNITY TABLE   │ │    COURSE TABLE     │ │     POST TABLE      │
├─────────────────────┤ ├─────────────────────┤ ├─────────────────────┤
│ id (PK)             │ │ id (PK)             │ │ id (PK)             │
│ name                │ │ title               │ │ authorId (FK)───────┼──→ User.id
│ description         │ │ description         │ │ author              │
│ type                │ │ authorId (FK)───────┼──→ User.id            │
│ memberCount         │ │ communityId (FK)────┼──→ Community.id       │
│ ownerId (FK)────────┼──→ User.id            │ │ content             │
│ createdAt           │ │ createdAt           │ │ likes               │
│ updatedAt           │ │ updatedAt           │ │ comments            │
└─────────────────────┘ │ lastSaved           │ │ isPinned            │
     ▲ id               └─────────────────────┘ │ level               │
     │                       ▲ id                │ communityId (FK)────┼──→ Community.id
     │ communityId (FK)      │                   │ category            │
     │                       │ courseId (FK)     │ commentersCount     │
     │                       │                   │ newCommentTimeAgo   │
     │                       │                   │ createdAt           │
     │                       │                   │ updatedAt           │
     │                  ┌────┴────────────────┐ └─────────────────────┘
     │                  │   MODULE TABLE      │      ▲ id        ▲ id
     │                  ├─────────────────────┤      │           │
     │                  │ id (PK)             │      │ postId (FK)
     │                  │ title               │      │           │ userId (FK)
     │                  │ description         │      │           │
     │                  │ courseId (FK)───────┼──→ Course.id    │
     │                  │ order               │      │      ┌────┴────────────┐
     │                  │ createdAt           │      │      │ POSTLIKE TABLE  │
     │                  │ updatedAt           │      │      ├─────────────────┤
     │                  └─────────────────────┘      │      │ postId (FK)─────┼──→ Post.id
     │                       ▲ id                    │      │ userId (FK)─────┼──→ User.id
     │                       │                       │      │ createdAt       │
     │                       │ moduleId (FK)        │      └─────────────────┘
     │                       │                       │
     │                  ┌────┴────────────────┐     │ postId (FK)
     │                  │   LESSON TABLE      │     │
     │                  ├─────────────────────┤ ┌───┴─────────────────┐
     │                  │ id (PK)             │ │   COMMENT TABLE     │
     │                  │ title               │ ├─────────────────────┤
     │                  │ content             │ │ id (PK)             │
     │                  │ type                │ │ postId (FK)─────────┼──→ Post.id
     │                  │ moduleId (FK)───────┼──→ Module.id         │
     │                  │ order               │ │ authorId (FK)───────┼──→ User.id
     │                  │ duration            │ │ author              │
     │                  │ isCompleted         │ │ content             │
     │                  │ createdAt           │ │ createdAt           │
     │                  │ updatedAt           │ │ updatedAt           │
     │                  └─────────────────────┘ └─────────────────────┘
     │                                               ▲ id
     │                                               │
     └───────────────────────────────────────────────┘ authorId (FK)
```

## Foreign Key Relationships Summary

### Direct Foreign Keys:

1. **Community.ownerId** → **User.id**
   - Each community has one owner (user)

2. **Post.authorId** → **User.id**
   - Each post has one author (user)

3. **Post.communityId** → **Community.id**
   - Each post belongs to one community

4. **Comment.postId** → **Post.id**
   - Each comment belongs to one post

5. **Comment.authorId** → **User.id**
   - Each comment has one author (user)

6. **Course.authorId** → **User.id**
   - Each course has one author (user)

7. **Course.communityId** → **Community.id**
   - Each course belongs to one community

8. **Module.courseId** → **Course.id**
   - Each module belongs to one course

9. **Lesson.moduleId** → **Module.id**
   - Each lesson belongs to one module

10. **PostLike.postId** → **Post.id**
    - Part of composite key for likes

11. **PostLike.userId** → **User.id**
    - Part of composite key for likes

### Relationship Cardinalities:

- **User** (1) → (N) **Community** (as owner)
- **User** (1) → (N) **Post** (as author)
- **User** (1) → (N) **Comment** (as author)
- **User** (1) → (N) **Course** (as author)
- **User** (N) ← → (N) **Post** (via PostLike)
- **Community** (1) → (N) **Post**
- **Community** (1) → (N) **Course**
- **Post** (1) → (N) **Comment**
- **Course** (1) → (N) **Module**
- **Module** (1) → (N) **Lesson**

## Entity Tables

### User Table
The central entity representing system users who can create content, participate in communities, and take courses.

| Column | Type | Description | Constraints |
|--------|------|-------------|--------------|
| id | String | Unique identifier (CUID) | PRIMARY KEY |
| username | String | Unique username for login | UNIQUE, NOT NULL |
| email | String | Unique email address | UNIQUE, NOT NULL |
| displayName | String | User's display name | NOT NULL |
| bio | String | User biography | NULLABLE |
| avatar | String | Avatar URL or emoji | NULLABLE |
| level | Integer | User's level (1-99) | DEFAULT 1 |
| pointsToNext | Integer | Points needed for next level | DEFAULT 100 |
| joinDate | DateTime | When user joined | NOT NULL |
| createdAt | DateTime | Timestamp of user creation | DEFAULT NOW() |
| updatedAt | DateTime | Timestamp of last update | AUTO UPDATE |

### Community Table
Groups where users can share content, take courses, and interact.

| Column | Type | Description | Constraints |
|--------|------|-------------|--------------|
| id | String | Unique identifier (CUID) | PRIMARY KEY |
| name | String | Community name | NOT NULL |
| description | String | Community description | NULLABLE |
| type | String | Either 'free' or 'paid' | DEFAULT 'free' |
| memberCount | Integer | Number of members | DEFAULT 0 |
| ownerId | String | Foreign key to User who owns the community | FOREIGN KEY → User.id |
| createdAt | DateTime | Timestamp of creation | DEFAULT NOW() |
| updatedAt | DateTime | Timestamp of last update | AUTO UPDATE |

### Post Table
User-generated content within communities.

| Column | Type | Description | Constraints |
|--------|------|-------------|--------------|
| id | String | Unique identifier (CUID) | PRIMARY KEY |
| authorId | String | Foreign key to User who created the post | FOREIGN KEY → User.id |
| author | String | Author's display name (denormalized) | NOT NULL |
| content | String | Post content text | NOT NULL |
| likes | Integer | Number of likes (denormalized) | DEFAULT 0 |
| comments | Integer | Number of comments (denormalized) | DEFAULT 0 |
| isPinned | Boolean | Whether post is pinned to top | DEFAULT false |
| level | Integer | Required user level to view | DEFAULT 1 |
| communityId | String | Foreign key to Community | FOREIGN KEY → Community.id |
| category | String | Post category | DEFAULT 'general' |
| commentersCount | Integer | Number of unique commenters | DEFAULT 0 |
| newCommentTimeAgo | String | Time since newest comment | NULLABLE |
| createdAt | DateTime | Timestamp of creation | DEFAULT NOW() |
| updatedAt | DateTime | Timestamp of last update | AUTO UPDATE |

### Comment Table
Responses to posts within communities.

| Column | Type | Description | Constraints |
|--------|------|-------------|--------------|
| id | String | Unique identifier (CUID) | PRIMARY KEY |
| postId | String | Foreign key to Post | FOREIGN KEY → Post.id |
| authorId | String | Foreign key to User who created the comment | FOREIGN KEY → User.id |
| author | String | Author's display name (denormalized) | NOT NULL |
| content | String | Comment content text | NOT NULL |
| createdAt | DateTime | Timestamp of creation | DEFAULT NOW() |
| updatedAt | DateTime | Timestamp of last update | AUTO UPDATE |

### Course Table
Educational content organized into modules and lessons.

| Column | Type | Description | Constraints |
|--------|------|-------------|--------------|
| id | String | Unique identifier (CUID) | PRIMARY KEY |
| title | String | Course title | NOT NULL |
| description | String | Course description | NULLABLE |
| authorId | String | Foreign key to User who created the course | FOREIGN KEY → User.id |
| communityId | String | Foreign key to Community where course belongs | FOREIGN KEY → Community.id |
| createdAt | DateTime | Timestamp of creation | DEFAULT NOW() |
| updatedAt | DateTime | Timestamp of last update | AUTO UPDATE |
| lastSaved | DateTime | Timestamp of last save | DEFAULT NOW() |

### Module Table
Organizational units within courses that group related lessons.

| Column | Type | Description | Constraints |
|--------|------|-------------|--------------|
| id | String | Unique identifier (CUID) | PRIMARY KEY |
| title | String | Module title | NOT NULL |
| description | String | Module description | NULLABLE |
| courseId | String | Foreign key to Course | FOREIGN KEY → Course.id |
| order | Integer | Display order within course (0-based) | DEFAULT 0 |
| createdAt | DateTime | Timestamp of creation | DEFAULT NOW() |
| updatedAt | DateTime | Timestamp of last update | AUTO UPDATE |

### Lesson Table
Individual learning units within modules.

| Column | Type | Description | Constraints |
|--------|------|-------------|--------------|
| id | String | Unique identifier (CUID) | PRIMARY KEY |
| title | String | Lesson title | NOT NULL |
| content | String | Lesson content | NULLABLE |
| type | String | Lesson type ('text', 'video', 'quiz', 'assignment') | DEFAULT 'text' |
| moduleId | String | Foreign key to Module | FOREIGN KEY → Module.id |
| order | Integer | Display order within module (0-based) | DEFAULT 0 |
| duration | Integer | Estimated duration in minutes | NULLABLE |
| isCompleted | Boolean | Whether user has completed this lesson | DEFAULT false |
| createdAt | DateTime | Timestamp of creation | DEFAULT NOW() |
| updatedAt | DateTime | Timestamp of last update | AUTO UPDATE |

### PostLike Table
Junction table for many-to-many relationship between Users and Posts.

| Column | Type | Description | Constraints |
|--------|------|-------------|--------------|
| postId | String | Foreign key to Post | FOREIGN KEY → Post.id, PART OF PK |
| userId | String | Foreign key to User | FOREIGN KEY → User.id, PART OF PK |
| createdAt | DateTime | Timestamp when user liked the post | DEFAULT NOW() |

**Primary Key**: Composite of (postId, userId)

## Relationships

### One-to-Many (1:N)
1. **User → Community** (as owner): A user can own multiple communities
2. **User → Post**: A user can create multiple posts
3. **User → Comment**: A user can create multiple comments
4. **User → Course**: A user can create multiple courses
5. **Community → Post**: A community contains multiple posts
6. **Community → Course**: A community contains multiple courses
7. **Post → Comment**: A post can have multiple comments
8. **Course → Module**: A course contains multiple modules
9. **Module → Lesson**: A module contains multiple lessons

### Many-to-Many (M:N)
1. **User ↔ Post** (via PostLike): Users can like multiple posts, and posts can be liked by multiple users

## Cascade Behaviors

- **Delete Course** → Deletes all associated Modules → Deletes all associated Lessons
- **Delete Post** → Deletes all associated Comments and PostLikes
- **Delete User** → Deletes all associated PostLikes (but preserves posts/comments for historical integrity)
- **Delete Module** → Deletes all associated Lessons

## Indexes

Recommended indexes for optimal performance:
- User: `username`, `email`
- Post: `communityId`, `authorId`, `createdAt`
- Comment: `postId`, `authorId`
- Course: `communityId`, `authorId`
- Module: `courseId`, `order`
- Lesson: `moduleId`, `order`
- PostLike: Composite index on `(postId, userId)`

## Storage Considerations

- **Denormalized Fields**: `Post.author`, `Post.likes`, `Post.comments` are denormalized for read performance
- **Soft vs Hard Deletes**: Consider implementing soft deletes for User and Post entities for data retention
- **Commenter Tracking**: Track unique commenters count instead of storing commenter details to avoid JSON fields