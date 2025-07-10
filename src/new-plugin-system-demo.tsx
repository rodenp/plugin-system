import React from 'react';
import { createRoot } from 'react-dom/client';
import { pluginRegistry } from './store/plugin-registry';
import { defaultTheme } from './plugins/shared/default-theme';
import { newEventBus, EVENTS } from './core/new-event-bus';
import { ToastProvider, useToast } from './components/ToastProvider';
import { EventsModal } from './components/EventsModal';

// Import new plugins 
import { messagingPlugin } from './plugins/messaging';
import { communitySidebarPlugin } from './plugins/community-sidebar';
import { communityPlugin } from './plugins/community';
import { classroomPlugin } from './plugins/classroom';
import { courseBuilderPlugin } from './plugins/course-builder';
import { aboutPlugin } from './plugins/about';
import { membersPlugin } from './plugins/members';
import { merchandisePlugin } from './plugins/merchandise';
import { calendarPlugin } from './plugins/calendar';
import { leaderboardPlugin } from './plugins/leaderboard';
import { communityMyProfilePlugin } from './plugins/community-my-profile';
import { certificatesPlugin } from './plugins/certificates/plugin';
import { analyticsPlugin } from './plugins/analytics/plugin';
import { userManagementPlugin } from './plugins/user-management/plugin';
import { stripePlugin } from './plugins/stripe/new-plugin';
import { assessmentPlugin } from './plugins/assessment/plugin';
import { courseDataPlugin } from './plugins/course-data/plugin';
import { externalServicesPlugin } from './plugins/external-services/plugin';
import { featureFlagsPlugin } from './plugins/feature-flags/plugin';
import { authPlugin } from './plugins/auth/new-plugin';
import { coursePublishingPlugin } from './plugins/course-publishing/plugin';
import './index.css';

console.log('🔍 Imports loaded:', { messagingPlugin, communitySidebarPlugin, communityPlugin, classroomPlugin, courseBuilderPlugin, aboutPlugin, membersPlugin, merchandisePlugin, calendarPlugin, leaderboardPlugin, communityMyProfilePlugin });

// Inner component that uses toast
const DemoContent: React.FC = () => {
  console.log('🚀 NewPluginSystemDemo component rendering...');
  
  const [installedPlugins, setInstalledPlugins] = React.useState<Array<{id: string, name: string}>>([]);
  const [activeTab, setActiveTab] = React.useState<string>('');
  const [showEventsModal, setShowEventsModal] = React.useState(false);
  const [recentEvents, setRecentEvents] = React.useState<Array<{event: string, data: any, timestamp: Date, pluginId?: string}>>([]);
  const { showSuccess, showInfo, showWarning } = useToast();
  
  // Sample posts for community plugin (existing mock data) - with fixed dates in the past
  const samplePosts = [
    { 
      id: '1', 
      author: 'Sarah Johnson', 
      authorId: 'user_sarah_johnson',
      time: '2h', 
      createdAt: '2024-12-28T14:30:00.000Z', // December 28, 2024, 2:30 PM UTC
      postDate: '2024-12-28T14:30:00.000Z',
      content: 'Just completed my first 10K run! ![GIF](https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif) The training program in this community has been amazing. Thank you everyone for the support! 🏃‍♀️', 
      likes: 24, 
      comments: 8,
      isPinned: false,
      level: 6,
      lastCommentAt: '2024-12-28T15:45:00.000Z',
      commenters: [
        { initials: 'MJ', avatarUrl: null, userId: 'user_mj', commentDate: '2024-12-28T15:45:00.000Z' },
        { initials: 'EC', avatarUrl: null, userId: 'user_ec', commentDate: '2024-12-28T15:30:00.000Z' },
        { initials: 'RS', avatarUrl: null, userId: 'user_rs', commentDate: '2024-12-28T15:15:00.000Z' },
        { initials: 'AH', avatarUrl: null, userId: 'user_ah', commentDate: '2024-12-28T15:00:00.000Z' },
        { initials: 'TB', avatarUrl: null, userId: 'user_tb', commentDate: '2024-12-28T14:45:00.000Z' }
      ]
    },
    { 
      id: '2', 
      author: 'Mike Chen', 
      authorId: 'user_mike_chen',
      time: '4h', 
      createdAt: '2024-12-28T12:15:00.000Z', // December 28, 2024, 12:15 PM UTC
      postDate: '2024-12-28T12:15:00.000Z',
      content: 'New workout video is up! Today we\'re focusing on core strength and stability. Perfect for beginners and advanced athletes alike.', 
      likes: 18, 
      comments: 12,
      isPinned: true,
      level: 3,
      commenters: [
        { initials: 'LS', avatarUrl: null, userId: 'user_ls', commentDate: '2024-12-28T13:30:00.000Z' },
        { initials: 'AK', avatarUrl: null, userId: 'user_ak', commentDate: '2024-12-28T13:15:00.000Z' },
        { initials: 'JD', avatarUrl: null, userId: 'user_jd', commentDate: '2024-12-28T13:00:00.000Z' }
      ]
    },
    { 
      id: '3', 
      author: 'Emily Davis', 
      authorId: 'user_emily_davis',
      time: '6h', 
      createdAt: '2024-12-28T09:45:00.000Z', // December 28, 2024, 9:45 AM UTC
      postDate: '2024-12-28T09:45:00.000Z',
      content: 'Question for the group: What\'s your favorite pre-workout snack? Looking for some healthy options that give good energy.', 
      likes: 12, 
      comments: 15,
      isPinned: false,
      level: 9,
      pollData: {
        title: 'How many comments do you expect?',
        options: [
          '1 - 99 comments',
          '100 - 249 comments', 
          '250 - 499 comments',
          '500 - 999 comments',
          'Over 1,000 comments! ⭐'
        ],
        votes: [4, 0, 0, 1, 0],
        userVote: 0, // Current user voted for option 0
        optionVoters: [
          [
            { name: 'John', avatar: null },
            { name: 'Mary', avatar: null },
            { name: 'Sarah', avatar: null },
            { name: 'Mike', avatar: null }
          ],
          [],
          [],
          [
            { name: 'Alex', avatar: null }
          ],
          []
        ]
      },
      commenters: [
        { initials: 'JW', avatarUrl: null, userId: 'user_jw', commentDate: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
        { initials: 'BA', avatarUrl: null, userId: 'user_ba', commentDate: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
        { initials: 'SC', avatarUrl: null, userId: 'user_sc', commentDate: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
        { initials: 'LM', avatarUrl: null, userId: 'user_lm', commentDate: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
        { initials: 'HK', avatarUrl: null, userId: 'user_hk', commentDate: new Date(Date.now() - 25 * 60 * 1000).toISOString() }
      ]
    },
    {
      id: '4',
      author: 'Alex Rodriguez',
      authorId: 'user_alex_rodriguez',
      time: '8h',
      createdAt: '2024-12-27T20:20:00.000Z', // December 27, 2024, 8:20 PM UTC
      postDate: '2024-12-27T20:20:00.000Z',
      content: 'Amazing workout session today! ![GIF](https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif) And here\'s another one! ![GIF](https://media.giphy.com/media/l4FGGafcOHmrlQxG0/giphy.gif) Feeling great! 💪',
      likes: 15,
      comments: 5,
      isPinned: false,
      level: 4,
      commenters: [
        { initials: 'SJ', avatarUrl: null },
        { initials: 'MC', avatarUrl: null },
        { initials: 'ED', avatarUrl: null }
      ]
    }
  ];

  // Sample comments for community posts - with fixed dates
  const sampleComments = [
    // Comments for Post 1 (Sarah's 10K run - 8 comments)
    {
      id: 'comment_1_0',
      postId: '1',
      authorId: 'commenter_mike_johnson',
      authorName: 'Mike Johnson',
      content: 'Congratulations Sarah! That\'s an amazing achievement! 🎉',
      parentId: null,
      likes: 3,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T15:15:00.000Z',
      updatedAt: '2024-12-28T15:15:00.000Z'
    },
    {
      id: 'comment_1_1',
      postId: '1',
      authorId: 'commenter_emma_clark',
      authorName: 'Emma Clark',
      content: 'Way to go! I remember when you first started the program. So proud of you!',
      parentId: null,
      likes: 5,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T16:00:00.000Z',
      updatedAt: '2024-12-28T16:00:00.000Z'
    },
    {
      id: 'comment_1_2',
      postId: '1',
      authorId: 'commenter_ryan_smith',
      authorName: 'Ryan Smith',
      content: 'Inspiring! I\'m just starting week 3 of the training. Any tips for staying motivated?',
      parentId: null,
      likes: 2,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T16:45:00.000Z',
      updatedAt: '2024-12-28T16:45:00.000Z'
    },
    {
      id: 'comment_1_3',
      postId: '1',
      authorId: 'commenter_tom_brown',
      authorName: 'Tom Brown',
      content: '@Ryan Smith The key is consistency! Even on tough days, just show up. Sarah is living proof it works! 💪',
      parentId: 'comment_1_2',
      likes: 4,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T17:30:00.000Z',
      updatedAt: '2024-12-28T17:30:00.000Z'
    },
    {
      id: 'comment_1_4',
      postId: '1',
      authorId: 'user_sarah_johnson',
      authorName: 'Sarah Johnson',
      content: '@Ryan Smith Thanks Ryan! Tom is absolutely right - consistency beats perfection every time. You\'ve got this! 🏃‍♂️',
      parentId: 'comment_1_2',
      likes: 6,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T18:15:00.000Z',
      updatedAt: '2024-12-28T18:15:00.000Z'
    },
    {
      id: 'comment_1_5',
      postId: '1',
      authorId: 'commenter_lisa_wong',
      authorName: 'Lisa Wong',
      content: 'This community is so supportive! Love seeing everyone\'s progress. 🙌',
      parentId: null,
      likes: 7,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T19:00:00.000Z',
      updatedAt: '2024-12-28T19:00:00.000Z'
    },
    {
      id: 'comment_1_6',
      postId: '1',
      authorId: 'commenter_alex_davis',
      authorName: 'Alex Davis',
      content: 'Next goal: half marathon? 😉',
      parentId: null,
      likes: 2,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T19:45:00.000Z',
      updatedAt: '2024-12-28T19:45:00.000Z'
    },
    {
      id: 'comment_1_7',
      postId: '1',
      authorId: 'user_sarah_johnson',
      authorName: 'Sarah Johnson',
      content: '@Alex Davis Actually thinking about it! Maybe in 6 months... 🤔',
      parentId: 'comment_1_6',
      likes: 3,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T20:30:00.000Z',
      updatedAt: '2024-12-28T20:30:00.000Z'
    },

    // Comments for Post 2 (Mike's workout video - 12 comments)
    {
      id: 'comment_2_0',
      postId: '2',
      authorId: 'commenter_lisa_wong',
      authorName: 'Lisa Wong',
      content: 'Perfect timing! I was just looking for a core workout. Thanks Mike!',
      parentId: null,
      likes: 4,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T13:00:00.000Z',
      updatedAt: '2024-12-28T13:00:00.000Z'
    },
    {
      id: 'comment_2_1',
      postId: '2',
      authorId: 'commenter_david_kim',
      authorName: 'David Kim',
      content: 'Your form explanations are always so clear. Much appreciated! 👍',
      parentId: null,
      likes: 6,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T13:45:00.000Z',
      updatedAt: '2024-12-28T13:45:00.000Z'
    },
    {
      id: 'comment_2_2',
      postId: '2',
      authorId: 'commenter_emma_clark',
      authorName: 'Emma Clark',
      content: 'Question: How many times per week should beginners do this routine?',
      parentId: null,
      likes: 3,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T14:30:00.000Z',
      updatedAt: '2024-12-28T14:30:00.000Z'
    },
    {
      id: 'comment_2_3',
      postId: '2',
      authorId: 'user_mike_chen',
      authorName: 'Mike Chen',
      content: '@Emma Clark Great question! For beginners, I\'d recommend 2-3 times per week with rest days in between. Listen to your body!',
      parentId: 'comment_2_2',
      likes: 8,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T15:15:00.000Z',
      updatedAt: '2024-12-28T15:15:00.000Z'
    },
    {
      id: 'comment_2_4',
      postId: '2',
      authorId: 'commenter_ryan_smith',
      authorName: 'Ryan Smith',
      content: 'Just finished it. That plank hold at the end was brutal! 😅',
      parentId: null,
      likes: 5,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T16:00:00.000Z',
      updatedAt: '2024-12-28T16:00:00.000Z'
    },
    {
      id: 'comment_2_5',
      postId: '2',
      authorId: 'commenter_anna_foster',
      authorName: 'Anna Foster',
      content: 'Been doing your videos for 3 months now. Seeing real results! Thank you!',
      parentId: null,
      likes: 7,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T16:45:00.000Z',
      updatedAt: '2024-12-28T16:45:00.000Z'
    },
    {
      id: 'comment_2_6',
      postId: '2',
      authorId: 'commenter_tom_brown',
      authorName: 'Tom Brown',
      content: 'Core strength has improved so much since following your programs. Keep it up!',
      parentId: null,
      likes: 4,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T17:30:00.000Z',
      updatedAt: '2024-12-28T17:30:00.000Z'
    },
    {
      id: 'comment_2_7',
      postId: '2',
      authorId: 'commenter_james_wilson',
      authorName: 'James Wilson',
      content: 'Any modifications for people with lower back issues?',
      parentId: null,
      likes: 2,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T18:15:00.000Z',
      updatedAt: '2024-12-28T18:15:00.000Z'
    },
    {
      id: 'comment_2_8',
      postId: '2',
      authorId: 'user_mike_chen',
      authorName: 'Mike Chen',
      content: '@James Wilson Absolutely! Try the modified planks on your knees, and skip any exercises that cause discomfort. I\'ll make a video specifically for back-friendly core work soon!',
      parentId: 'comment_2_7',
      likes: 9,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T19:00:00.000Z',
      updatedAt: '2024-12-28T19:00:00.000Z'
    },
    {
      id: 'comment_2_9',
      postId: '2',
      authorId: 'user_sarah_johnson',
      authorName: 'Sarah Johnson',
      content: 'Love how you always include modifications. So inclusive! 🙏',
      parentId: null,
      likes: 6,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T19:45:00.000Z',
      updatedAt: '2024-12-28T19:45:00.000Z'
    },
    {
      id: 'comment_2_10',
      postId: '2',
      authorId: 'commenter_alex_davis',
      authorName: 'Alex Davis',
      content: 'The progression from last month\'s video is perfect. Feeling stronger already!',
      parentId: null,
      likes: 5,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T20:30:00.000Z',
      updatedAt: '2024-12-28T20:30:00.000Z'
    },
    {
      id: 'comment_2_11',
      postId: '2',
      authorId: 'commenter_emma_clark',
      authorName: 'Emma Clark',
      content: '@Mike Chen That would be amazing! Looking forward to the back-friendly version. 🙌',
      parentId: 'comment_2_8',
      likes: 3,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T21:15:00.000Z',
      updatedAt: '2024-12-28T21:15:00.000Z'
    },

    // Comments for Post 3 (Emily's pre-workout snack - 15 comments)
    {
      id: 'comment_3_0',
      postId: '3',
      authorId: 'user_sarah_johnson',
      authorName: 'Sarah Johnson',
      content: 'Banana with almond butter is my go-to! Quick energy and protein.',
      parentId: null,
      likes: 8,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T10:30:00.000Z',
      updatedAt: '2024-12-28T10:30:00.000Z'
    },
    {
      id: 'comment_3_1',
      postId: '3',
      authorId: 'user_mike_chen',
      authorName: 'Mike Chen',
      content: 'Greek yogurt with berries for me. The protein helps with recovery too.',
      parentId: null,
      likes: 6,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T11:15:00.000Z',
      updatedAt: '2024-12-28T11:15:00.000Z'
    },
    {
      id: 'comment_3_2',
      postId: '3',
      authorId: 'commenter_lisa_wong',
      authorName: 'Lisa Wong',
      content: 'Oatmeal with a drizzle of honey about 30 minutes before. Works great!',
      parentId: null,
      likes: 4,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T12:00:00.000Z',
      updatedAt: '2024-12-28T12:00:00.000Z'
    },
    {
      id: 'comment_3_3',
      postId: '3',
      authorId: 'commenter_ryan_smith',
      authorName: 'Ryan Smith',
      content: '@Sarah Johnson How much almond butter do you usually have? Don\'t want to overdo it!',
      parentId: 'comment_3_0',
      likes: 2,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T12:45:00.000Z',
      updatedAt: '2024-12-28T12:45:00.000Z'
    },
    {
      id: 'comment_3_4',
      postId: '3',
      authorId: 'user_sarah_johnson',
      authorName: 'Sarah Johnson',
      content: '@Ryan Smith Just about 1 tablespoon. Enough for energy but won\'t weigh you down!',
      parentId: 'comment_3_0',
      likes: 5,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T13:30:00.000Z',
      updatedAt: '2024-12-28T13:30:00.000Z'
    },
    {
      id: 'comment_3_5',
      postId: '3',
      authorId: 'commenter_david_kim',
      authorName: 'David Kim',
      content: 'Apple slices with a small amount of peanut butter. Simple and effective.',
      parentId: null,
      likes: 3,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T14:15:00.000Z',
      updatedAt: '2024-12-28T14:15:00.000Z'
    },
    {
      id: 'comment_3_6',
      postId: '3',
      authorId: 'commenter_tom_brown',
      authorName: 'Tom Brown',
      content: 'Coffee and a small handful of dates. Natural sugars kick in perfectly!',
      parentId: null,
      likes: 4,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T15:00:00.000Z',
      updatedAt: '2024-12-28T15:00:00.000Z'
    },
    {
      id: 'comment_3_7',
      postId: '3',
      authorId: 'commenter_anna_foster',
      authorName: 'Anna Foster',
      content: '@Mike Chen Do you have a specific brand of Greek yogurt you recommend?',
      parentId: 'comment_3_1',
      likes: 1,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T15:45:00.000Z',
      updatedAt: '2024-12-28T15:45:00.000Z'
    },
    {
      id: 'comment_3_8',
      postId: '3',
      authorId: 'user_mike_chen',
      authorName: 'Mike Chen',
      content: '@Anna Foster I usually go for plain, low-fat Greek yogurt - any brand works! Just avoid the ones with added sugars.',
      parentId: 'comment_3_1',
      likes: 7,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T16:30:00.000Z',
      updatedAt: '2024-12-28T16:30:00.000Z'
    },
    {
      id: 'comment_3_9',
      postId: '3',
      authorId: 'user_emily_davis',
      authorName: 'Emily Davis',
      content: 'Green smoothie with spinach, banana, and protein powder. Tastes better than it sounds! 😅',
      parentId: null,
      likes: 5,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T17:15:00.000Z',
      updatedAt: '2024-12-28T17:15:00.000Z'
    },
    {
      id: 'comment_3_10',
      postId: '3',
      authorId: 'commenter_alex_davis',
      authorName: 'Alex Davis',
      content: 'Sometimes just a piece of toast with honey if I\'m in a rush.',
      parentId: null,
      likes: 2,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T18:00:00.000Z',
      updatedAt: '2024-12-28T18:00:00.000Z'
    },
    {
      id: 'comment_3_11',
      postId: '3',
      authorId: 'commenter_james_wilson',
      authorName: 'James Wilson',
      content: '@Emily Davis That actually sounds amazing! Do you have a recipe?',
      parentId: 'comment_3_9',
      likes: 3,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T18:45:00.000Z',
      updatedAt: '2024-12-28T18:45:00.000Z'
    },
    {
      id: 'comment_3_12',
      postId: '3',
      authorId: 'user_emily_davis',
      authorName: 'Emily Davis',
      content: 'These are all fantastic suggestions! I\'m definitely trying the banana with almond butter tomorrow. 🍌',
      parentId: null,
      likes: 6,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T19:30:00.000Z',
      updatedAt: '2024-12-28T19:30:00.000Z'
    },
    {
      id: 'comment_3_13',
      postId: '3',
      authorId: 'commenter_lisa_wong',
      authorName: 'Lisa Wong',
      content: '@Emily Davis You\'ll love it! Such a classic combo for a reason.',
      parentId: 'comment_3_12',
      likes: 4,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T20:15:00.000Z',
      updatedAt: '2024-12-28T20:15:00.000Z'
    },
    {
      id: 'comment_3_14',
      postId: '3',
      authorId: 'user_emily_davis',
      authorName: 'Emily Davis',
      content: '@James Wilson Sure! 1 cup spinach, 1 banana, 1 scoop vanilla protein powder, 1 cup unsweetened almond milk, handful of ice. Blend and enjoy!',
      parentId: 'comment_3_9',
      likes: 8,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T21:00:00.000Z',
      updatedAt: '2024-12-28T21:00:00.000Z'
    },

    // Comments for Post 4 (Alex's workout session - 5 comments)
    {
      id: 'comment_4_0',
      postId: '4',
      authorId: 'user_mike_chen',
      authorName: 'Mike Chen',
      content: 'Looking strong Alex! Love the energy in these GIFs! 🔥',
      parentId: null,
      likes: 7,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-27T21:05:00.000Z',
      updatedAt: '2024-12-27T21:05:00.000Z'
    },
    {
      id: 'comment_4_1',
      postId: '4',
      authorId: 'user_sarah_johnson',
      authorName: 'Sarah Johnson',
      content: 'Your form on those deadlifts is perfect! 💪',
      parentId: null,
      likes: 5,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-27T21:50:00.000Z',
      updatedAt: '2024-12-27T21:50:00.000Z'
    },
    {
      id: 'comment_4_2',
      postId: '4',
      authorId: 'commenter_david_kim',
      authorName: 'David Kim',
      content: 'Those GIFs are motivating me to hit the gym right now!',
      parentId: null,
      likes: 4,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-27T22:35:00.000Z',
      updatedAt: '2024-12-27T22:35:00.000Z'
    },
    {
      id: 'comment_4_3',
      postId: '4',
      authorId: 'user_emily_davis',
      authorName: 'Emily Davis',
      content: 'What\'s your current training split? Looking for some inspiration.',
      parentId: null,
      likes: 2,
      likedByUser: false,
      replies: [],
      depth: 0,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-27T23:20:00.000Z',
      updatedAt: '2024-12-27T23:20:00.000Z'
    },
    {
      id: 'comment_4_4',
      postId: '4',
      authorId: 'user_alex_rodriguez',
      authorName: 'Alex Rodriguez',
      content: '@Emily Davis I\'m doing a 4-day upper/lower split right now. Upper body twice, lower body twice, with cardio on rest days!',
      parentId: 'comment_4_3',
      likes: 6,
      likedByUser: false,
      replies: [],
      depth: 1,
      isEdited: false,
      isPinned: false,
      createdAt: '2024-12-28T00:05:00.000Z',
      updatedAt: '2024-12-28T00:05:00.000Z'
    }
  ];

  // Sample members for members plugin
  const sampleMembers = [
    { id: '1', name: 'Sarah Johnson', username: '@sarah-johnson-4892', bio: 'Fitness coach and nutrition expert. Helping people transform their lives through healthy habits.', joined: 'Jan 11, 2024', online: true, location: 'New York' },
    { id: '2', name: 'Mike Chen', username: '@mike-chen-2847', bio: 'Personal trainer specializing in strength training and athletic performance.', joined: 'Feb 23, 2025', online: true, location: 'California' },
    { id: '3', name: 'Emily Davis', username: '@emily-davis-9183', bio: 'Yoga instructor and mindfulness coach. Bringing peace and balance to your fitness journey.', joined: 'Apr 29, 2024', online: false, location: 'Texas' }
  ];

  // Sample products for merchandise plugin
  const sampleProducts = [
    { id: '1', name: 'Community T-Shirt', price: '$25', image: '👕', description: 'Premium cotton tee with community logo' },
    { id: '2', name: 'Water Bottle', price: '$15', image: '🚰', description: 'Stainless steel 32oz bottle' },
    { id: '3', name: 'Workout Guide', price: '$39', image: '📚', description: 'Digital guide with 50+ exercises' },
    { id: '4', name: 'Community Hoodie', price: '$45', image: '👔', description: 'Comfortable hoodie for all seasons' },
    { id: '5', name: 'Protein Shaker', price: '$12', image: '🥤', description: 'BPA-free shaker with mixer ball' },
    { id: '6', name: 'Resistance Bands Set', price: '$29', image: '🏋️', description: 'Set of 5 resistance bands', soldOut: true }
  ];

  // Sample guidelines for about plugin
  const sampleGuidelines = [
    'Be respectful and supportive',
    'Share knowledge and experiences',
    'Keep content relevant to fitness and health',
    'No spam or self-promotion without permission',
    'Help others achieve their fitness goals'
  ];

  // Sample events for calendar plugin
  const sampleEvents = [
    { id: '1', title: 'Skool News', date: 3, time: '7pm' },
    { id: '2', title: 'Community Meeting', date: 10, time: '6pm' },
    { id: '3', title: 'Q&A Session', date: 17, time: '8pm' },
    { id: '4', title: 'Workshop', date: 24, time: '5pm' }
  ];

  // Sample leaderboard data for leaderboard plugin
  const sampleLeaderboards = {
    sevenDay: [
      { id: '1', name: 'Benjamin James', avatar: null, points: 27 },
      { id: '2', name: 'Istvan Toth', avatar: null, points: 11 },
      { id: '3', name: 'Anthony Pompliano', avatar: null, points: 10 },
      { id: '4', name: 'Michele Rosenthal', avatar: null, points: 8 },
      { id: '5', name: 'Kat Kropp', avatar: null, points: 6 },
      { id: '6', name: 'Sajid Peerbocus', avatar: null, points: 5 },
      { id: '7', name: 'Shandla Walker', avatar: null, points: 4 },
      { id: '8', name: 'Shirley C', avatar: null, points: 4 },
      { id: '9', name: 'Candice Rutherford', avatar: null, points: 3 },
      { id: '10', name: 'Peter Bruce', avatar: null, points: 3 }
    ],
    thirtyDay: [
      { id: '1', name: 'Michele Rosenthal', avatar: null, points: 56 },
      { id: '2', name: 'Shandla Walker', avatar: null, points: 32 },
      { id: '3', name: 'Charlotte Watson', avatar: null, points: 32 },
      { id: '4', name: 'Istvan Toth', avatar: null, points: 31 },
      { id: '5', name: 'Larry McDonald', avatar: null, points: 31 },
      { id: '6', name: 'Joshua Dudgeon', avatar: null, points: 28 },
      { id: '7', name: 'Benjamin James', avatar: null, points: 27 },
      { id: '8', name: 'Hiedi Rose Lockwood', avatar: null, points: 26 },
      { id: '9', name: 'Diana C Edge', avatar: null, points: 22 },
      { id: '10', name: 'Tim Griftani', avatar: null, points: 22 }
    ],
    allTime: [
      { id: '1', name: 'Denise M', avatar: null, points: 1107 },
      { id: '2', name: 'Dennis Jones', avatar: null, points: 900 },
      { id: '3', name: 'Jack Smith', avatar: null, points: 648 },
      { id: '4', name: 'Mike Beasant', avatar: null, points: 496 },
      { id: '5', name: 'Istvan Toth', avatar: null, points: 425 },
      { id: '6', name: 'Coen Tuerlings', avatar: null, points: 425 },
      { id: '7', name: 'Chyna SingLing', avatar: null, points: 364 },
      { id: '8', name: 'JGregory Wright', avatar: null, points: 348 },
      { id: '9', name: 'Tina Marie', avatar: null, points: 341 },
      { id: '10', name: 'Valerie K Miller', avatar: null, points: 338 }
    ]
  };

  const sampleLevels = [
    { level: 1, unlocked: true, requirement: null, memberPercentage: '90% of members' },
    { level: 2, unlocked: false, requirement: 'Unlock Post to feed', memberPercentage: '4% of members' },
    { level: 3, unlocked: false, requirement: 'Unlock Chat with members', memberPercentage: '2% of members' },
    { level: 4, unlocked: false, requirement: null, memberPercentage: '1% of members' },
    { level: 5, unlocked: false, requirement: null, memberPercentage: '1% of members' },
    { level: 6, unlocked: false, requirement: null, memberPercentage: '1% of members' },
    { level: 7, unlocked: false, requirement: null, memberPercentage: '1% of members' },
    { level: 8, unlocked: false, requirement: null, memberPercentage: '0% of members' },
    { level: 9, unlocked: false, requirement: null, memberPercentage: '0% of members' }
  ];

  const sampleFeaturedMember = {
    id: 'user-1',
    name: 'Peter Roden',
    avatar: null,
    level: 1,
    pointsToNext: 2
  };

  const sampleCurrentUserRank = {
    sevenDay: 1676,
    thirtyDay: 892,
    allTime: 1676
  };

  // Sample data for community my profile plugin
  const sampleUserProfile = {
    displayName: 'Peter Roden',
    username: '@peter-roden-7154',
    bio: 'IT professional, coach, healer',
    avatar: null,
    level: 1,
    pointsToNext: 2,
    joinDate: 'Joined Oct 24, 2024'
  };

  const sampleOwnedCommunities = [
    {
      id: '1',
      name: 'Test Group',
      initials: 'TG',
      memberCount: 1,
      type: 'Free',
      color: '#a855f7'
    }
  ];

  const sampleMemberships = [
    {
      id: '1',
      name: "Dona's AI Community",
      initials: 'DA',
      memberCount: 1600,
      type: 'Free',
      color: '#6b7280'
    },
    {
      id: '2',
      name: 'Growthworks Community',
      initials: 'GC',
      memberCount: 22600,
      type: 'Free',
      color: '#10b981'
    }
  ];

  const sampleContributions = [
    {
      id: '1', // This should match the post ID for proper sync
      author: 'Sarah Johnson',
      avatar: null,
      date: 'Oct \'24',
      category: 'General Discussion',
      title: 'First 10K run completed!',
      content: 'Just completed my first 10K run! The training program in this community has been amazing. Thank you everyone for the support!',
      likes: 24,
      comments: 8,
      newComment: 'Dec \'24'
    },
    {
      id: '2', // This should match the post ID for proper sync
      author: 'Mike Chen',
      avatar: null,
      date: 'Nov \'24',
      category: 'Fitness Training',
      title: 'New workout video is up!',
      content: 'New workout video is up! Today we\'re focusing on core strength and stability. Perfect for beginners and advanced athletes alike.',
      likes: 18,
      comments: 12,
      newComment: 'Nov \'24'
    }
  ];

  const sampleProfileStats = {
    contributions: 1,
    followers: 0,
    following: 4
  };

  // Generate sample activity data for the heatmap (365 days)
  const generateActivityData = () => {
    const data = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5), // Random activity level 0-4
        level: Math.min(4, Math.floor(Math.random() * 5)) // Level 0-4 for styling
      });
    }
    return data;
  };

  const sampleActivityData = generateActivityData();

  // Posts storage functions (defined early so they can be used in useState)
  const savePostsToStorage = async (data: any[]) => {
    try {
      const serializedData = data.map(post => ({
        ...post,
        createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt
      }));

      if (storageBackend === 'localStorage') {
        localStorage.setItem('demo-posts', JSON.stringify(serializedData));
      } else if (storageBackend === 'indexedDB') {
        const db = await initializeIndexedDB();
        
        const transaction = db.transaction(['demo-posts'], 'readwrite');
        const store = transaction.objectStore('demo-posts');
        
        await new Promise((resolve, reject) => {
          const putRequest = store.put({ key: 'posts', value: serializedData });
          putRequest.onsuccess = () => resolve(undefined);
          putRequest.onerror = () => reject(putRequest.error);
        });
        
        db.close();
      }
    } catch (error) {
      console.error(`Failed to save posts to ${storageBackend}:`, error);
    }
  };

  const loadPostsFromStorage = async (): Promise<any[]> => {
    try {
      if (storageBackend === 'localStorage') {
        const localData = localStorage.getItem('demo-posts');
        if (localData) {
          const posts = JSON.parse(localData);
          return posts.map((post: any) => ({
            ...post,
            createdAt: post.createdAt ? new Date(post.createdAt) : new Date()
          }));
        }
      } else if (storageBackend === 'indexedDB') {
        const db = await initializeIndexedDB();
        
        const transaction = db.transaction(['demo-posts'], 'readonly');
        const store = transaction.objectStore('demo-posts');
        
        const result = await new Promise<any>((resolve, reject) => {
          const getRequest = store.get('posts');
          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        });
        
        db.close();
        
        if (result && result.value) {
          return result.value.map((post: any) => ({
            ...post,
            createdAt: post.createdAt ? new Date(post.createdAt) : new Date()
          }));
        }
      }
    } catch (error) {
      console.error(`Failed to load posts from ${storageBackend}:`, error);
    }
    return []; // Return empty array when no data in storage
  };

  // User likes tracking
  const loadUserLikes = async (): Promise<Set<string>> => {
    try {
      if (storageBackend === 'localStorage') {
        const likesData = localStorage.getItem('demo-user-likes');
        return likesData ? new Set(JSON.parse(likesData)) : new Set();
      } else if (storageBackend === 'indexedDB') {
        const db = await initializeIndexedDB();
        
        const transaction = db.transaction(['demo-user-likes'], 'readonly');
        const store = transaction.objectStore('demo-user-likes');
        
        const result = await new Promise<any>((resolve, reject) => {
          const getRequest = store.get('likes');
          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        });
        
        db.close();
        
        if (result && result.value) {
          return new Set(result.value);
        }
      }
    } catch (error) {
      console.error(`Failed to load user likes from ${storageBackend}:`, error);
    }
    return new Set();
  };

  const saveUserLikes = async (likes: Set<string>) => {
    try {
      const likesArray = Array.from(likes);
      
      if (storageBackend === 'localStorage') {
        localStorage.setItem('demo-user-likes', JSON.stringify(likesArray));
      } else if (storageBackend === 'indexedDB') {
        const db = await initializeIndexedDB();
        
        const transaction = db.transaction(['demo-user-likes'], 'readwrite');
        const store = transaction.objectStore('demo-user-likes');
        
        await new Promise((resolve, reject) => {
          const putRequest = store.put({ key: 'likes', value: likesArray });
          putRequest.onsuccess = () => resolve(undefined);
          putRequest.onerror = () => reject(putRequest.error);
        });
        
        db.close();
      }
    } catch (error) {
      console.error(`Failed to save user likes to ${storageBackend}:`, error);
    }
  };

  // Storage backend configuration (needs to be early so other state can use it)
  const [storageBackend, setStorageBackend] = React.useState<'localStorage' | 'indexedDB'>('localStorage');

  // Centralized IndexedDB initialization
  const initializeIndexedDB = async (): Promise<IDBDatabase> => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('plugin_data', 3); // Use version 3 to ensure upgrade
      
      request.onsuccess = () => {
        const db = request.result;
        // Check if all required object stores exist
        const requiredStores = ['demo-posts', 'demo-user-likes', 'demo-courses', 'demo-members', 'demo-products', 'demo-events'];
        const missingStores = requiredStores.filter(store => !db.objectStoreNames.contains(store));
        
        if (missingStores.length > 0) {
          // Close and delete database to force recreation with all stores
          db.close();
          const deleteRequest = indexedDB.deleteDatabase('plugin_data');
          deleteRequest.onsuccess = () => {
            // Reopen with all stores
            const newRequest = indexedDB.open('plugin_data', 3);
            newRequest.onsuccess = () => resolve(newRequest.result);
            newRequest.onerror = () => reject(newRequest.error);
            newRequest.onupgradeneeded = createStores;
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          resolve(db);
        }
      };
      
      request.onerror = () => reject(request.error);
      
      const createStores = () => {
        const db = request.result;
        
        // Create all object stores needed
        if (!db.objectStoreNames.contains('demo-posts')) {
          db.createObjectStore('demo-posts', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('demo-user-likes')) {
          db.createObjectStore('demo-user-likes', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('demo-courses')) {
          db.createObjectStore('demo-courses', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('demo-members')) {
          db.createObjectStore('demo-members', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('demo-products')) {
          db.createObjectStore('demo-products', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('demo-events')) {
          db.createObjectStore('demo-events', { keyPath: 'key' });
        }
      };
      
      request.onupgradeneeded = createStores;
    });
  };

  // Additional storage functions for other data types
  const saveMembers = async (data: any[]) => {
    try {
      if (storageBackend === 'localStorage') {
        localStorage.setItem('demo-members', JSON.stringify(data));
      } else if (storageBackend === 'indexedDB') {
        const db = await initializeIndexedDB();
        const transaction = db.transaction(['demo-members'], 'readwrite');
        const store = transaction.objectStore('demo-members');
        await new Promise((resolve, reject) => {
          const putRequest = store.put({ key: 'members', value: data });
          putRequest.onsuccess = () => resolve(undefined);
          putRequest.onerror = () => reject(putRequest.error);
        });
        db.close();
      }
    } catch (error) {
      console.error(`Failed to save members to ${storageBackend}:`, error);
    }
  };

  const loadMembers = async (): Promise<any[]> => {
    try {
      if (storageBackend === 'localStorage') {
        const localData = localStorage.getItem('demo-members');
        return localData ? JSON.parse(localData) : [];
      } else if (storageBackend === 'indexedDB') {
        const db = await initializeIndexedDB();
        const transaction = db.transaction(['demo-members'], 'readonly');
        const store = transaction.objectStore('demo-members');
        const result = await new Promise<any>((resolve, reject) => {
          const getRequest = store.get('members');
          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        });
        db.close();
        return result && result.value ? result.value : [];
      }
    } catch (error) {
      console.error(`Failed to load members from ${storageBackend}:`, error);
    }
    return [];
  };

  const saveProducts = async (data: any[]) => {
    try {
      if (storageBackend === 'localStorage') {
        localStorage.setItem('demo-products', JSON.stringify(data));
      } else if (storageBackend === 'indexedDB') {
        const db = await initializeIndexedDB();
        const transaction = db.transaction(['demo-products'], 'readwrite');
        const store = transaction.objectStore('demo-products');
        await new Promise((resolve, reject) => {
          const putRequest = store.put({ key: 'products', value: data });
          putRequest.onsuccess = () => resolve(undefined);
          putRequest.onerror = () => reject(putRequest.error);
        });
        db.close();
      }
    } catch (error) {
      console.error(`Failed to save products to ${storageBackend}:`, error);
    }
  };

  const loadProducts = async (): Promise<any[]> => {
    try {
      if (storageBackend === 'localStorage') {
        const localData = localStorage.getItem('demo-products');
        return localData ? JSON.parse(localData) : [];
      } else if (storageBackend === 'indexedDB') {
        const db = await initializeIndexedDB();
        const transaction = db.transaction(['demo-products'], 'readonly');
        const store = transaction.objectStore('demo-products');
        const result = await new Promise<any>((resolve, reject) => {
          const getRequest = store.get('products');
          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        });
        db.close();
        return result && result.value ? result.value : [];
      }
    } catch (error) {
      console.error(`Failed to load products from ${storageBackend}:`, error);
    }
    return [];
  };

  const saveEvents = async (data: any[]) => {
    try {
      if (storageBackend === 'localStorage') {
        localStorage.setItem('demo-events', JSON.stringify(data));
      } else if (storageBackend === 'indexedDB') {
        const db = await initializeIndexedDB();
        const transaction = db.transaction(['demo-events'], 'readwrite');
        const store = transaction.objectStore('demo-events');
        await new Promise((resolve, reject) => {
          const putRequest = store.put({ key: 'events', value: data });
          putRequest.onsuccess = () => resolve(undefined);
          putRequest.onerror = () => reject(putRequest.error);
        });
        db.close();
      }
    } catch (error) {
      console.error(`Failed to save events to ${storageBackend}:`, error);
    }
  };

  const loadEvents = async (): Promise<any[]> => {
    try {
      if (storageBackend === 'localStorage') {
        const localData = localStorage.getItem('demo-events');
        return localData ? JSON.parse(localData) : [];
      } else if (storageBackend === 'indexedDB') {
        const db = await initializeIndexedDB();
        const transaction = db.transaction(['demo-events'], 'readonly');
        const store = transaction.objectStore('demo-events');
        const result = await new Promise<any>((resolve, reject) => {
          const getRequest = store.get('events');
          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        });
        db.close();
        return result && result.value ? result.value : [];
      }
    } catch (error) {
      console.error(`Failed to load events from ${storageBackend}:`, error);
    }
    return [];
  };

  // Mock data states for storage-agnostic plugins
  const [courses, setCourses] = React.useState<any[]>([]);
  const [posts, setPosts] = React.useState<any[]>([]); // Initialize empty - data comes from storage
  const [userLikes, setUserLikes] = React.useState<Set<string>>(new Set()); // Initialize empty
  const [members, setMembers] = React.useState<any[]>([]); // Initialize empty - data comes from storage
  const [products, setProducts] = React.useState<any[]>([]); // Initialize empty - data comes from storage
  const [guidelines, setGuidelines] = React.useState<string[]>(sampleGuidelines);
  const [events, setEvents] = React.useState<any[]>([]); // Initialize empty - data comes from storage
  const [leaderboards, setLeaderboards] = React.useState<any>(sampleLeaderboards);
  const [levels, setLevels] = React.useState<any[]>(sampleLevels);
  const [featuredMember, setFeaturedMember] = React.useState<any>(sampleFeaturedMember);
  const [currentUserRank, setCurrentUserRank] = React.useState<any>(sampleCurrentUserRank);
  const [userProfile, setUserProfile] = React.useState<any>(sampleUserProfile);
  const [ownedCommunities, setOwnedCommunities] = React.useState<any[]>(sampleOwnedCommunities);
  const [memberships, setMemberships] = React.useState<any[]>(sampleMemberships);
  const [contributions, setContributions] = React.useState<any[]>(sampleContributions);
  
  // Certificates mock data
  const [certificates, setCertificates] = React.useState<any[]>([
    {
      id: '1',
      certificateNumber: 'CERT-12345-ABCDE',
      courseId: 'course-1',
      courseName: 'Advanced React Development',
      studentId: 'user-1',
      studentName: 'John Doe',
      studentEmail: 'demo@example.com',
      instructorId: 'instructor-1',
      instructorName: 'Sarah Connor',
      templateId: 'template-1',
      issuedAt: new Date('2024-06-15'),
      validFrom: new Date('2024-06-15'),
      completionDate: new Date('2024-06-10'),
      finalScore: 95,
      passingScore: 80,
      totalHours: 40,
      skillsAcquired: ['React', 'Redux', 'TypeScript', 'Testing'],
      status: 'issued' as const,
      certificateUrl: '/certificates/1',
      verificationCode: 'VERIFY-123456',
      verificationUrl: '/verify/VERIFY-123456',
      isPubliclyVerifiable: true,
      shareableUrl: '/certificates/share/1'
    },
    {
      id: '2',
      certificateNumber: 'CERT-67890-FGHIJ',
      courseId: 'course-2',
      courseName: 'Node.js Backend Development',
      studentId: 'user-2',
      studentName: 'John Doe',
      studentEmail: 'john@example.com',
      instructorId: 'instructor-2',
      instructorName: 'Mike Smith',
      templateId: 'template-1',
      issuedAt: new Date('2024-05-20'),
      validFrom: new Date('2024-05-20'),
      completionDate: new Date('2024-05-15'),
      finalScore: 88,
      passingScore: 80,
      totalHours: 35,
      skillsAcquired: ['Node.js', 'Express', 'MongoDB', 'API Design'],
      status: 'issued' as const,
      certificateUrl: '/certificates/2',
      verificationCode: 'VERIFY-789012',
      verificationUrl: '/verify/VERIFY-789012',
      isPubliclyVerifiable: true,
      shareableUrl: '/certificates/share/2'
    }
  ]);

  const [certificateSettings] = React.useState({
    enableCertificates: true,
    requireManualApproval: false,
    minimumPassingScore: 80,
    certificateValidityPeriod: 24,
    allowRetake: true,
    maxRetakeAttempts: 3,
    defaultTemplateId: 'template-1',
    customBranding: {
      institutionName: 'Skool Academy',
      institutionLogo: '',
      institutionUrl: 'https://skool.com',
      primaryColor: '#0066cc',
      secondaryColor: '#22c55e',
      font: 'Georgia'
    },
    enablePublicVerification: true,
    enableBlockchainVerification: false,
    verificationBaseUrl: 'https://verify.skool.com',
    enableSocialSharing: true,
    enableLinkedInIntegration: true,
    linkedInOrganizationId: 'skool-academy'
  });

  // Analytics mock data
  const [analyticsEvents, setAnalyticsEvents] = React.useState<any[]>([
    {
      id: 'event-1',
      name: 'page_view',
      properties: {
        path: '/community',
        title: 'Community Dashboard',
        referrer: 'direct'
      },
      userId: 'user-1',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      provider: 'all',
      sent: true
    },
    {
      id: 'event-2',
      name: 'course_started',
      properties: {
        courseId: 'course-1',
        courseName: 'Advanced React Development',
        source: 'classroom'
      },
      userId: 'user-1',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      provider: 'all',
      sent: true
    },
    {
      id: 'event-3',
      name: 'post_created',
      properties: {
        postId: 'post-1',
        category: 'General Discussion',
        characterCount: 120
      },
      userId: 'user-1',
      timestamp: new Date(Date.now() - 14400000), // 4 hours ago
      provider: 'all',
      sent: true
    }
  ]);

  const [analyticsConfig] = React.useState({
    providers: ['google-analytics', 'mixpanel'],
    googleAnalytics: {
      trackingId: 'GA-XXXX-YYYY',
      gtag: true,
      sendPageView: true
    },
    mixpanel: {
      token: 'MIXPANEL_TOKEN_HERE',
      apiSecret: 'MIXPANEL_SECRET_HERE'
    },
    enabledEvents: ['page_view', 'course_started', 'lesson_completed', 'post_created'],
    userProperties: ['email', 'role', 'signup_date'],
    courseProperties: ['title', 'category', 'difficulty']
  });

  const [userAnalytics] = React.useState({
    'user-1': {
      userId: 'user-1',
      totalEvents: 25,
      coursesStarted: 3,
      coursesCompleted: 1,
      totalTimeSpent: 14400, // 4 hours in seconds
      averageSessionDuration: 1800, // 30 minutes
      lastActivity: new Date(),
      deviceInfo: {
        browser: 'Chrome',
        os: 'macOS',
        device: 'Desktop'
      },
      locationInfo: {
        country: 'United States',
        city: 'New York',
        timezone: 'America/New_York'
      }
    }
  });

  const [courseAnalytics] = React.useState({
    'course-1': {
      courseId: 'course-1',
      totalEnrollments: 150,
      totalCompletions: 89,
      averageCompletionTime: 2160, // 36 hours
      averageRating: 4.6,
      dropOffPoints: [
        { lessonId: 'lesson-3', dropOffRate: 0.15 },
        { lessonId: 'lesson-7', dropOffRate: 0.22 }
      ],
      engagementMetrics: {
        averageTimePerLesson: 45, // minutes
        totalInteractions: 1250,
        commentsCount: 89,
        questionsCount: 34
      }
    }
  });

  const [isAnalyticsTracking, setIsAnalyticsTracking] = React.useState(true);

  // User Management mock data
  const [users] = React.useState({
    'user-1': {
      id: 'user-1',
      email: 'demo@example.com',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      avatar: null,
      bio: 'Fitness enthusiast and community creator',
      phone: '+1-555-0123',
      address: {
        city: 'New York',
        state: 'NY',
        country: 'United States',
        postalCode: '10001'
      },
      jobTitle: 'Software Engineer',
      company: 'Tech Corp',
      website: 'https://johndoe.dev',
      learningGoals: ['React', 'TypeScript', 'Node.js'],
      interests: ['Fitness', 'Technology', 'Teaching'],
      skillLevel: 'advanced' as const,
      preferredLanguages: ['English'],
      timezone: 'America/New_York',
      role: 'admin' as const,
      permissions: ['*'],
      isVerified: true,
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    },
    'user-2': {
      id: 'user-2',
      email: 'student@example.com',
      firstName: 'Sarah',
      lastName: 'Wilson',
      displayName: 'Sarah Wilson',
      avatar: null,
      bio: 'Learning enthusiast',
      learningGoals: ['Fitness', 'Nutrition'],
      interests: ['Health', 'Wellness'],
      skillLevel: 'beginner' as const,
      preferredLanguages: ['English'],
      timezone: 'America/Los_Angeles',
      role: 'student' as const,
      permissions: ['view_courses', 'enroll_courses'],
      isVerified: true,
      isActive: true,
      lastLoginAt: new Date(Date.now() - 3600000),
      createdAt: new Date('2024-02-20'),
      updatedAt: new Date()
    }
  });

  const [userEnrollments] = React.useState({
    'user-1': [
      {
        id: 'enrollment-1',
        studentId: 'user-1',
        courseId: 'course-1',
        enrolledAt: new Date('2024-03-01'),
        startedAt: new Date('2024-03-02'),
        lastAccessedAt: new Date(),
        enrollmentType: 'free' as const,
        amountPaid: 0,
        currency: 'USD',
        progress: {
          overallPercentage: 75,
          lessonsCompleted: ['lesson-1', 'lesson-2', 'lesson-3'],
          assessmentsCompleted: ['assessment-1'],
          timeSpent: 180, // 3 hours
          currentLesson: 'lesson-4',
          bookmarks: ['lesson-2'],
          notes: [
            {
              id: 'note-1',
              lessonId: 'lesson-2',
              timestamp: 120,
              content: 'Important concept about state management',
              createdAt: new Date('2024-03-05')
            }
          ]
        },
        performance: {
          averageScore: 88,
          assessmentScores: { 'assessment-1': 88 },
          completionStreak: 5,
          badges: ['first_lesson', 'quick_learner'],
          achievements: ['completed_first_module']
        },
        settings: {
          notifications: true,
          publicProfile: true,
          showProgress: true,
          autoplayVideos: true,
          subtitles: false,
          playbackSpeed: 1.25
        },
        status: 'active' as const
      }
    ],
    'user-2': [
      {
        id: 'enrollment-2',
        studentId: 'user-2',
        courseId: 'course-2',
        enrolledAt: new Date('2024-03-10'),
        lastAccessedAt: new Date(Date.now() - 86400000),
        enrollmentType: 'paid' as const,
        amountPaid: 99.99,
        currency: 'USD',
        progress: {
          overallPercentage: 25,
          lessonsCompleted: ['lesson-1'],
          assessmentsCompleted: [],
          timeSpent: 45,
          currentLesson: 'lesson-2',
          bookmarks: [],
          notes: []
        },
        performance: {
          averageScore: 0,
          assessmentScores: {},
          completionStreak: 1,
          badges: ['enrolled'],
          achievements: []
        },
        settings: {
          notifications: true,
          publicProfile: false,
          showProgress: true,
          autoplayVideos: false,
          subtitles: true,
          playbackSpeed: 1
        },
        status: 'active' as const
      }
    ]
  });

  const [userActivities] = React.useState({
    'user-1': [
      {
        id: 'activity-1',
        userId: 'user-1',
        type: 'login' as const,
        description: 'User logged in',
        metadata: { loginMethod: 'email', ipAddress: '192.168.1.1' },
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: 'activity-2',
        userId: 'user-1',
        type: 'lesson_completed' as const,
        description: 'Completed lesson: Advanced React Patterns',
        metadata: { courseId: 'course-1', lessonId: 'lesson-3', duration: 45 },
        timestamp: new Date(Date.now() - 3600000),
        ipAddress: '192.168.1.1'
      },
      {
        id: 'activity-3',
        userId: 'user-1',
        type: 'course_enrolled' as const,
        description: 'Enrolled in: Advanced React Development',
        metadata: { courseId: 'course-1', enrollmentType: 'free' },
        timestamp: new Date(Date.now() - 86400000 * 2),
        ipAddress: '192.168.1.1'
      }
    ],
    'user-2': [
      {
        id: 'activity-4',
        userId: 'user-2',
        type: 'login' as const,
        description: 'User logged in',
        metadata: { loginMethod: 'email' },
        timestamp: new Date(Date.now() - 86400000),
        ipAddress: '10.0.0.1'
      }
    ]
  });

  const [userNotifications] = React.useState({
    'user-1': [
      {
        id: 'notif-1',
        userId: 'user-1',
        type: 'course' as const,
        title: 'New Lesson Available',
        message: 'A new lesson "Advanced Hooks" has been added to your course.',
        actionUrl: '/courses/course-1/lessons/lesson-5',
        actionText: 'View Lesson',
        isRead: false,
        createdAt: new Date(Date.now() - 7200000),
        priority: 'normal' as const
      },
      {
        id: 'notif-2',
        userId: 'user-1',
        type: 'system' as const,
        title: 'Profile Updated',
        message: 'Your profile has been successfully updated.',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000),
        priority: 'low' as const
      }
    ],
    'user-2': [
      {
        id: 'notif-3',
        userId: 'user-2',
        type: 'course' as const,
        title: 'Welcome to the Course!',
        message: 'Welcome to Fitness Fundamentals. Get started with your first lesson.',
        actionUrl: '/courses/course-2/lessons/lesson-1',
        actionText: 'Start Learning',
        isRead: false,
        createdAt: new Date(Date.now() - 86400000 * 10),
        priority: 'high' as const
      }
    ]
  });

  const [userGroups] = React.useState({
    'group-1': {
      id: 'group-1',
      name: 'React Study Group',
      description: 'A group for learning React together',
      type: 'study_group' as const,
      memberIds: ['user-1', 'user-2'],
      ownerId: 'user-1',
      settings: {
        isPrivate: false,
        requireApproval: false,
        allowMemberInvites: true,
        maxMembers: 50
      },
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date()
    }
  });

  // Stripe mock data
  const [stripeConfig] = React.useState({
    publishableKey: 'pk_test_51234567890abcdef',
    testMode: true
  });

  const [stripePlans] = React.useState([
    {
      id: 'basic',
      name: 'Basic Plan',
      description: 'Essential features for individuals',
      price: 999, // $9.99 in cents
      currency: 'usd',
      interval: 'month' as const,
      stripePriceId: 'price_basic_monthly',
      features: [
        'Access to basic courses',
        'Community participation',
        'Progress tracking',
        'Email support'
      ],
      trialPeriodDays: 7
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      description: 'Advanced features for professionals',
      price: 2999, // $29.99 in cents
      currency: 'usd',
      interval: 'month' as const,
      stripePriceId: 'price_pro_monthly',
      features: [
        'Access to all courses',
        'Premium content',
        'Advanced analytics',
        'Certificate generation',
        'Priority support',
        'Custom branding'
      ],
      popular: true,
      trialPeriodDays: 14
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      description: 'Custom solutions for organizations',
      price: 9999, // $99.99 in cents
      currency: 'usd',
      interval: 'month' as const,
      stripePriceId: 'price_enterprise_monthly',
      features: [
        'Everything in Pro',
        'Multi-tenant support',
        'Custom integrations',
        'Advanced user management',
        'White-label solution',
        'Dedicated support',
        'SLA guarantee'
      ],
      trialPeriodDays: 30
    }
  ]);

  const [stripeCustomer] = React.useState({
    id: 'user-1',
    email: 'demo@example.com',
    name: 'John Doe',
    stripeCustomerId: 'cus_demo_customer_123',
    subscriptionId: 'sub_demo_subscription_456',
    subscriptionStatus: 'active' as const,
    currentPlan: 'pro',
    billingCycleAnchor: new Date(),
    cancelAtPeriodEnd: false,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    trialEnd: undefined
  });

  const [stripePaymentMethods] = React.useState([
    {
      id: 'pm_demo_card_visa',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025
      },
      isDefault: true
    },
    {
      id: 'pm_demo_card_mastercard',
      type: 'card',
      card: {
        brand: 'mastercard',
        last4: '5555',
        expMonth: 8,
        expYear: 2026
      },
      isDefault: false
    }
  ]);

  const [stripeInvoices] = React.useState([
    {
      id: 'in_demo_invoice_1',
      number: 'INV-2024-001',
      status: 'paid',
      amount: 2999,
      currency: 'usd',
      created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      description: 'Pro Plan - Monthly',
      hostedInvoiceUrl: '#demo-invoice-1',
      invoicePdf: '#demo-invoice-1-pdf'
    },
    {
      id: 'in_demo_invoice_2',
      number: 'INV-2024-002',
      status: 'paid',
      amount: 2999,
      currency: 'usd',
      created: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      paidAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      description: 'Pro Plan - Monthly',
      hostedInvoiceUrl: '#demo-invoice-2',
      invoicePdf: '#demo-invoice-2-pdf'
    }
  ]);

  const [stripeSubscriptions] = React.useState([
    {
      id: 'sub_demo_subscription_456',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      plan: stripePlans.find(p => p.id === 'pro')!,
      cancelAtPeriodEnd: false,
      customerId: 'cus_demo_customer_123'
    }
  ]);

  const [isStripeConfigured, setIsStripeConfigured] = React.useState(true);

  // Assessment mock data
  const [assessments, setAssessments] = React.useState({
    'assessment-1': {
      id: 'assessment-1',
      courseId: 'course-1',
      title: 'React Fundamentals Quiz',
      description: 'Test your knowledge of React basics',
      type: 'quiz' as const,
      gradingMethod: 'automatic' as const,
      settings: {
        timeLimit: 30,
        attempts: 3,
        showCorrectAnswers: true,
        showFeedback: true,
        randomizeQuestions: false,
        randomizeOptions: false,
        passingScore: 70,
        lateSubmissionAllowed: false
      },
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice' as const,
          question: 'What is JSX?',
          points: 10,
          options: [
            { id: 'a', text: 'JavaScript XML', isCorrect: true },
            { id: 'b', text: 'Java Syntax Extension', isCorrect: false },
            { id: 'c', text: 'JSON XML', isCorrect: false },
            { id: 'd', text: 'JavaScript eXtension', isCorrect: false }
          ]
        },
        {
          id: 'q2',
          type: 'true_false' as const,
          question: 'React components must start with a capital letter.',
          points: 5,
          options: [
            { id: 'true', text: 'True', isCorrect: true },
            { id: 'false', text: 'False', isCorrect: false }
          ]
        }
      ],
      totalPoints: 15,
      weightInCourse: 20,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-01'),
      createdBy: 'instructor-1',
      published: true
    },
    'assessment-2': {
      id: 'assessment-2',
      courseId: 'course-1',
      title: 'Advanced React Assignment',
      description: 'Build a complex React application',
      type: 'assignment' as const,
      gradingMethod: 'manual' as const,
      settings: {
        timeLimit: 120,
        attempts: 1,
        showCorrectAnswers: false,
        showFeedback: true,
        randomizeQuestions: false,
        randomizeOptions: false,
        passingScore: 80,
        lateSubmissionAllowed: true,
        lateSubmissionPenalty: 10
      },
      questions: [
        {
          id: 'q3',
          type: 'essay' as const,
          question: 'Explain the difference between class components and functional components in React. Provide code examples.',
          points: 50,
          rubric: {
            criteria: [
              { id: 'c1', name: 'Accuracy', description: 'Correct explanation of concepts', maxPoints: 20 },
              { id: 'c2', name: 'Code Examples', description: 'Quality of code examples', maxPoints: 20 },
              { id: 'c3', name: 'Clarity', description: 'Clear and organized writing', maxPoints: 10 }
            ]
          }
        }
      ],
      totalPoints: 50,
      weightInCourse: 30,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-05'),
      createdBy: 'instructor-1',
      published: true
    }
  });

  const [assessmentSubmissions, setAssessmentSubmissions] = React.useState({
    'assessment-1': [
      {
        id: 'sub-1',
        assessmentId: 'assessment-1',
        studentId: 'user-1',
        studentName: 'John Doe',
        startedAt: new Date(Date.now() - 3600000),
        submittedAt: new Date(Date.now() - 3300000),
        timeSpent: 1800, // 30 minutes
        attemptNumber: 1,
        answers: [
          { questionId: 'q1', answer: 'a', timeSpent: 120 },
          { questionId: 'q2', answer: 'true', timeSpent: 60 }
        ],
        status: 'graded' as const,
        autoGradedScore: 15,
        finalScore: 15,
        feedback: 'Excellent work! Perfect score.',
        gradedBy: 'auto-grader',
        gradedAt: new Date(Date.now() - 3300000)
      }
    ],
    'assessment-2': [
      {
        id: 'sub-2',
        assessmentId: 'assessment-2',
        studentId: 'user-1',
        studentName: 'John Doe',
        startedAt: new Date(Date.now() - 86400000),
        submittedAt: new Date(Date.now() - 82800000),
        timeSpent: 3600, // 1 hour
        attemptNumber: 1,
        answers: [
          { 
            questionId: 'q3', 
            answer: 'Class components are ES6 classes that extend React.Component, while functional components are JavaScript functions that return JSX...', 
            timeSpent: 3600 
          }
        ],
        status: 'submitted' as const,
        feedback: 'Awaiting manual grading',
        gradedBy: undefined,
        gradedAt: undefined
      }
    ]
  });

  const [assessmentGradebooks] = React.useState({
    'course-1': {
      courseId: 'course-1',
      studentGrades: [
        {
          studentId: 'user-1',
          studentName: 'John Doe',
          studentEmail: 'demo@example.com',
          assessmentGrades: [
            {
              assessmentId: 'assessment-1',
              assessmentTitle: 'React Fundamentals Quiz',
              attempts: [assessmentSubmissions['assessment-1'][0]],
              bestScore: 100,
              averageScore: 100,
              status: 'completed' as const
            },
            {
              assessmentId: 'assessment-2',
              assessmentTitle: 'Advanced React Assignment',
              attempts: [assessmentSubmissions['assessment-2'][0]],
              bestScore: 0,
              averageScore: 0,
              status: 'in_progress' as const
            }
          ],
          overallGrade: {
            currentScore: 15,
            possibleScore: 65,
            percentage: 23,
            letterGrade: 'F'
          }
        }
      ],
      gradeScale: [
        { letter: 'A', minPercentage: 90, maxPercentage: 100 },
        { letter: 'B', minPercentage: 80, maxPercentage: 89 },
        { letter: 'C', minPercentage: 70, maxPercentage: 79 },
        { letter: 'D', minPercentage: 60, maxPercentage: 69 },
        { letter: 'F', minPercentage: 0, maxPercentage: 59 }
      ]
    }
  });

  // Course Data mock data
  const [courseDataCourses, setCourseDataCourses] = React.useState({
    'course-data-1': {
      id: 'course-data-1',
      title: 'Complete React Development Bootcamp',
      description: 'Master React from basics to advanced concepts including hooks, context, and modern patterns. Build real-world applications and deploy them to production.',
      instructorId: 'instructor-1',
      instructorName: 'Sarah Johnson',
      category: 'Programming',
      level: 'intermediate' as const,
      price: 99,
      currency: 'USD',
      thumbnail: 'https://via.placeholder.com/400x200?text=React+Course',
      duration: 1200, // 20 hours
      lessons: [
        {
          id: 'lesson-1',
          courseId: 'course-data-1',
          title: 'React Fundamentals',
          description: 'Learn the basics of React components and JSX',
          type: 'video' as const,
          content: {
            type: 'video' as const,
            data: {
              videoUrl: 'https://example.com/video1.mp4',
              videoDuration: 3600,
              transcript: 'Welcome to React fundamentals...'
            }
          },
          order: 1,
          duration: 60,
          isPreview: true,
          metadata: {
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-20'),
            status: 'published' as const
          }
        },
        {
          id: 'lesson-2',
          courseId: 'course-data-1',
          title: 'State and Props',
          description: 'Understanding component state and props',
          type: 'video' as const,
          content: {
            type: 'video' as const,
            data: {
              videoUrl: 'https://example.com/video2.mp4',
              videoDuration: 2700
            }
          },
          order: 2,
          duration: 45,
          isPreview: false,
          metadata: {
            createdAt: new Date('2024-01-16'),
            updatedAt: new Date('2024-01-21'),
            status: 'published' as const
          }
        }
      ],
      metadata: {
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-01'),
        publishedAt: new Date('2024-01-20'),
        status: 'published' as const,
        tags: ['react', 'javascript', 'frontend', 'web development'],
        language: 'en',
        requirements: ['Basic JavaScript knowledge', 'HTML/CSS fundamentals'],
        outcomes: ['Build React applications', 'Understand modern React patterns', 'Deploy to production']
      },
      settings: {
        allowComments: true,
        allowDownloads: false,
        showProgress: true,
        certificateEnabled: true,
        maxStudents: 1000,
        enrollmentDeadline: new Date('2024-12-31')
      },
      analytics: {
        totalEnrollments: 245,
        totalCompletions: 189,
        averageRating: 4.7,
        totalRevenue: 24255
      }
    },
    'course-data-2': {
      id: 'course-data-2',
      title: 'Introduction to Machine Learning',
      description: 'Learn the fundamentals of machine learning with Python. Cover supervised and unsupervised learning algorithms.',
      instructorId: 'instructor-2',
      instructorName: 'Dr. Michael Chen',
      category: 'Data Science',
      level: 'beginner' as const,
      price: 149,
      currency: 'USD',
      duration: 800, // 13.3 hours
      lessons: [
        {
          id: 'lesson-3',
          courseId: 'course-data-2',
          title: 'What is Machine Learning?',
          description: 'Introduction to ML concepts and applications',
          type: 'video' as const,
          content: {
            type: 'video' as const,
            data: {
              videoUrl: 'https://example.com/ml-intro.mp4',
              videoDuration: 1800
            }
          },
          order: 1,
          duration: 30,
          isPreview: true,
          metadata: {
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date('2024-02-05'),
            status: 'published' as const
          }
        }
      ],
      metadata: {
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-15'),
        publishedAt: new Date('2024-02-05'),
        status: 'published' as const,
        tags: ['machine learning', 'python', 'data science', 'ai'],
        language: 'en',
        requirements: ['Basic Python programming', 'High school mathematics'],
        outcomes: ['Understand ML concepts', 'Implement basic algorithms', 'Work with datasets']
      },
      settings: {
        allowComments: true,
        allowDownloads: true,
        showProgress: true,
        certificateEnabled: true,
        maxStudents: 500
      },
      analytics: {
        totalEnrollments: 156,
        totalCompletions: 98,
        averageRating: 4.5,
        totalRevenue: 23244
      }
    },
    'course-data-3': {
      id: 'course-data-3',
      title: 'Digital Marketing Mastery',
      description: 'Complete guide to digital marketing including SEO, social media, email marketing, and analytics.',
      instructorId: 'instructor-3',
      instructorName: 'Emily Rodriguez',
      category: 'Marketing',
      level: 'beginner' as const,
      price: 0, // Free course
      currency: 'USD',
      duration: 600, // 10 hours
      lessons: [
        {
          id: 'lesson-4',
          courseId: 'course-data-3',
          title: 'Digital Marketing Overview',
          description: 'Overview of digital marketing landscape',
          type: 'text' as const,
          content: {
            type: 'text' as const,
            data: {
              markdown: '# Digital Marketing Overview\n\nDigital marketing encompasses all marketing efforts that use digital channels...'
            }
          },
          order: 1,
          duration: 20,
          isPreview: true,
          metadata: {
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-15'),
            status: 'published' as const
          }
        }
      ],
      metadata: {
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-25'),
        publishedAt: new Date('2024-01-15'),
        status: 'published' as const,
        tags: ['digital marketing', 'seo', 'social media', 'email marketing'],
        language: 'en',
        requirements: ['Basic computer skills', 'Interest in marketing'],
        outcomes: ['Create marketing campaigns', 'Understand SEO basics', 'Use social media effectively']
      },
      settings: {
        allowComments: true,
        allowDownloads: true,
        showProgress: true,
        certificateEnabled: false
      },
      analytics: {
        totalEnrollments: 892,
        totalCompletions: 567,
        averageRating: 4.3,
        totalRevenue: 0
      }
    }
  });

  const [courseDataLessons] = React.useState({
    'lesson-1': courseDataCourses['course-data-1'].lessons[0],
    'lesson-2': courseDataCourses['course-data-1'].lessons[1],
    'lesson-3': courseDataCourses['course-data-2'].lessons[0],
    'lesson-4': courseDataCourses['course-data-3'].lessons[0]
  });

  const [courseDataEnrollments] = React.useState({
    'enrollment-1': {
      id: 'enrollment-1',
      userId: 'user-1',
      courseId: 'course-data-1',
      enrolledAt: new Date('2024-02-10'),
      status: 'active' as const,
      progress: {
        userId: 'user-1',
        courseId: 'course-data-1',
        enrolledAt: new Date('2024-02-10'),
        startedAt: new Date('2024-02-10'),
        lastAccessedAt: new Date('2024-02-25'),
        progressPercentage: 65,
        lessonsCompleted: ['lesson-1'],
        quizScores: {},
        assignmentSubmissions: {},
        totalTimeSpent: 180 // 3 hours
      },
      amountPaid: 99,
      currency: 'USD'
    },
    'enrollment-2': {
      id: 'enrollment-2',
      userId: 'user-1',
      courseId: 'course-data-3',
      enrolledAt: new Date('2024-01-20'),
      status: 'completed' as const,
      progress: {
        userId: 'user-1',
        courseId: 'course-data-3',
        enrolledAt: new Date('2024-01-20'),
        startedAt: new Date('2024-01-20'),
        completedAt: new Date('2024-02-15'),
        lastAccessedAt: new Date('2024-02-15'),
        progressPercentage: 100,
        lessonsCompleted: ['lesson-4'],
        quizScores: {},
        assignmentSubmissions: {},
        totalTimeSpent: 600, // 10 hours
        certificateEarned: {
          issuedAt: new Date('2024-02-15'),
          certificateUrl: 'https://example.com/certificate-123.pdf'
        }
      },
      amountPaid: 0,
      currency: 'USD'
    }
  });

  const [courseDataStudentProgress] = React.useState({
    'user-1': [
      courseDataEnrollments['enrollment-1'].progress,
      courseDataEnrollments['enrollment-2'].progress
    ]
  });

  // External Services mock data
  const [externalServices, setExternalServices] = React.useState({
    'email-service': {
      id: 'email-service',
      name: 'SendGrid Email Service',
      type: 'email' as const,
      provider: 'sendgrid',
      enabled: true,
      credentials: {
        apiKey: 'sg-xxxx-xxxx-xxxx'
      },
      settings: {
        fromEmail: 'noreply@example.com',
        fromName: 'Course Platform'
      },
      endpoints: {
        baseUrl: 'https://api.sendgrid.com/v3'
      },
      rateLimits: {
        requestsPerMinute: 600,
        requestsPerHour: 10000,
        requestsPerDay: 100000
      }
    },
    'ai-service': {
      id: 'ai-service',
      name: 'OpenAI Content Generation',
      type: 'ai' as const,
      provider: 'openai',
      enabled: true,
      credentials: {
        apiKey: 'sk-xxxx-xxxx-xxxx'
      },
      settings: {
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.7
      },
      endpoints: {
        baseUrl: 'https://api.openai.com/v1'
      },
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      }
    },
    'storage-service': {
      id: 'storage-service',
      name: 'AWS S3 Storage',
      type: 'storage' as const,
      provider: 'aws-s3',
      enabled: true,
      credentials: {
        accessKeyId: 'AKIA...',
        secretAccessKey: 'xxxx...',
        region: 'us-east-1'
      },
      settings: {
        bucket: 'course-platform-files',
        publicRead: false
      },
      rateLimits: {
        requestsPerMinute: 3500
      }
    },
    'sms-service': {
      id: 'sms-service',
      name: 'Twilio SMS',
      type: 'sms' as const,
      provider: 'twilio',
      enabled: false,
      credentials: {
        accountSid: 'ACxxxx...',
        authToken: 'xxxx...'
      },
      settings: {
        fromNumber: '+1234567890'
      },
      rateLimits: {
        requestsPerMinute: 60
      }
    },
    'webhook-service': {
      id: 'webhook-service',
      name: 'Integration Webhooks',
      type: 'webhook' as const,
      provider: 'generic',
      enabled: true,
      credentials: {},
      settings: {
        timeout: 5000,
        retries: 3
      },
      endpoints: {
        webhook: 'https://api.example.com/webhooks'
      }
    }
  });

  const [externalServiceStatuses] = React.useState({
    'email-service': {
      serviceId: 'email-service',
      status: 'healthy' as const,
      lastChecked: new Date(),
      responseTime: 245,
      uptime: 99.8
    },
    'ai-service': {
      serviceId: 'ai-service',
      status: 'healthy' as const,
      lastChecked: new Date(),
      responseTime: 1200,
      uptime: 98.5
    },
    'storage-service': {
      serviceId: 'storage-service',
      status: 'degraded' as const,
      lastChecked: new Date(),
      responseTime: 890,
      uptime: 97.2
    },
    'sms-service': {
      serviceId: 'sms-service',
      status: 'down' as const,
      lastChecked: new Date(),
      errorMessage: 'Service temporarily disabled',
      uptime: 0
    },
    'webhook-service': {
      serviceId: 'webhook-service',
      status: 'healthy' as const,
      lastChecked: new Date(),
      responseTime: 156,
      uptime: 99.9
    }
  });

  const [externalServiceUsage] = React.useState({
    'email-service': [
      {
        serviceId: 'email-service',
        requestCount: 1250,
        successCount: 1238,
        errorCount: 12,
        totalCost: 15.60,
        period: 'day' as const,
        timestamp: new Date()
      }
    ],
    'ai-service': [
      {
        serviceId: 'ai-service',
        requestCount: 89,
        successCount: 87,
        errorCount: 2,
        totalCost: 42.30,
        period: 'day' as const,
        timestamp: new Date()
      }
    ],
    'storage-service': [
      {
        serviceId: 'storage-service',
        requestCount: 2340,
        successCount: 2315,
        errorCount: 25,
        totalCost: 8.95,
        period: 'day' as const,
        timestamp: new Date()
      }
    ]
  });

  const [externalWebhookEvents] = React.useState([
    {
      id: 'webhook-1',
      serviceId: 'webhook-service',
      event: 'user.registered',
      payload: { userId: 'user-123', email: 'user@example.com' },
      timestamp: new Date(Date.now() - 3600000),
      status: 'completed' as const,
      retryCount: 0
    },
    {
      id: 'webhook-2',
      serviceId: 'webhook-service',
      event: 'course.created',
      payload: { courseId: 'course-456', title: 'New Course' },
      timestamp: new Date(Date.now() - 7200000),
      status: 'completed' as const,
      retryCount: 0
    },
    {
      id: 'webhook-3',
      serviceId: 'webhook-service',
      event: 'payment.processed',
      payload: { paymentId: 'pay-789', amount: 99.00 },
      timestamp: new Date(Date.now() - 10800000),
      status: 'failed' as const,
      retryCount: 3,
      errorMessage: 'Timeout after 5 seconds'
    }
  ]);

  // Feature Flags mock data
  const [featureFlagsConfig] = React.useState({
    provider: 'local' as const,
    environment: 'development',
    enableAnalytics: true,
    refreshInterval: 60,
    defaultFlags: [
      {
        id: 'create_course',
        name: 'Create Course',
        description: 'Allow users to create new courses',
        enabled: true,
        rolloutPercentage: 100,
        conditions: {
          userRoles: ['owner', 'admin', 'instructor']
        },
        environments: ['development', 'staging', 'production'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: 'access_analytics',
        name: 'Access Analytics',
        description: 'View analytics and reporting features',
        enabled: true,
        rolloutPercentage: 80,
        conditions: {
          userRoles: ['owner', 'admin'],
          planLevels: ['pro', 'enterprise']
        },
        environments: ['development', 'staging', 'production'],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-02-20')
      },
      {
        id: 'beta_features',
        name: 'Beta Features',
        description: 'Access to experimental beta features',
        enabled: false,
        rolloutPercentage: 10,
        conditions: {
          userRoles: ['owner']
        },
        environments: ['development', 'staging'],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-25')
      },
      {
        id: 'export_course',
        name: 'Export Course',
        description: 'Export courses to various formats',
        enabled: true,
        rolloutPercentage: 50,
        conditions: {
          planLevels: ['pro', 'enterprise']
        },
        environments: ['development', 'staging', 'production'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-10')
      },
      {
        id: 'ai_assistance',
        name: 'AI Assistance',
        description: 'AI-powered content generation and assistance',
        enabled: true,
        rolloutPercentage: 25,
        conditions: {
          planLevels: ['enterprise']
        },
        environments: ['development', 'staging'],
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-28')
      }
    ]
  });

  const [featureFlagsFlags] = React.useState({
    'create_course': {
      id: 'create_course',
      name: 'Create Course',
      description: 'Allow users to create new courses',
      enabled: true,
      rolloutPercentage: 100,
      conditions: {
        userRoles: ['owner', 'admin', 'instructor']
      },
      environments: ['development', 'staging', 'production'] as const,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-02-15')
    },
    'access_analytics': {
      id: 'access_analytics',
      name: 'Access Analytics',
      description: 'View analytics and reporting features',
      enabled: true,
      rolloutPercentage: 80,
      conditions: {
        userRoles: ['owner', 'admin'],
        planLevels: ['pro', 'enterprise'] as const
      },
      environments: ['development', 'staging', 'production'] as const,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-02-20')
    },
    'beta_features': {
      id: 'beta_features',
      name: 'Beta Features',
      description: 'Access to experimental beta features',
      enabled: false,
      rolloutPercentage: 10,
      conditions: {
        userRoles: ['owner']
      },
      environments: ['development', 'staging'] as const,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-25')
    },
    'export_course': {
      id: 'export_course',
      name: 'Export Course',
      description: 'Export courses to various formats',
      enabled: true,
      rolloutPercentage: 50,
      conditions: {
        planLevels: ['pro', 'enterprise'] as const
      },
      environments: ['development', 'staging', 'production'] as const,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-10')
    },
    'ai_assistance': {
      id: 'ai_assistance',
      name: 'AI Assistance',
      description: 'AI-powered content generation and assistance',
      enabled: true,
      rolloutPercentage: 25,
      conditions: {
        planLevels: ['enterprise'] as const
      },
      environments: ['development', 'staging'] as const,
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-28')
    }
  });

  const [featureFlagsPermissions] = React.useState({
    'course:create': {
      id: 'course:create',
      name: 'Create Course',
      description: 'Permission to create new courses',
      resource: 'course',
      action: 'create',
      conditions: {
        userRoles: ['owner', 'admin', 'instructor']
      }
    },
    'analytics:view': {
      id: 'analytics:view',
      name: 'View Analytics',
      description: 'Permission to view analytics data',
      resource: 'analytics',
      action: 'view',
      conditions: {
        userRoles: ['owner', 'admin'],
        planLevels: ['pro', 'enterprise'] as const
      }
    },
    'user:manage': {
      id: 'user:manage',
      name: 'Manage Users',
      description: 'Permission to manage user accounts',
      resource: 'user',
      action: 'manage',
      conditions: {
        userRoles: ['owner', 'admin']
      }
    },
    'billing:access': {
      id: 'billing:access',
      name: 'Access Billing',
      description: 'Permission to access billing information',
      resource: 'billing',
      action: 'access',
      conditions: {
        userRoles: ['owner'],
        resourceOwnership: true
      }
    }
  });

  const [featureFlagsUserFlags] = React.useState({
    'create_course': true,
    'access_analytics': true,
    'beta_features': false,
    'export_course': true,
    'ai_assistance': false
  });

  const [featureFlagsUserPermissions] = React.useState({
    'course:create': true,
    'analytics:view': true,
    'user:manage': true,
    'billing:access': true
  });

  // Load data from storage on mount and when storage backend changes
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedPosts, loadedLikes, loadedCourses, loadedMembers, loadedProducts, loadedEvents] = await Promise.all([
          loadPostsFromStorage(),
          loadUserLikes(),
          loadFromStorage(),
          loadMembers(),
          loadProducts(),
          loadEvents()
        ]);
        setPosts(loadedPosts);
        setUserLikes(loadedLikes);
        setCourses(loadedCourses);
        setMembers(loadedMembers);
        setProducts(loadedProducts);
        setEvents(loadedEvents);
      } catch (error) {
        console.error('Failed to load data from storage:', error);
      }
    };
    
    loadData();
  }, [storageBackend]); // Re-load when storage backend changes

  // Update contributions when posts change (to keep them in sync)
  React.useEffect(() => {
    setContributions(prev => prev.map(contribution => {
      const matchingPost = posts.find(post => 
        post.author === contribution.author && 
        post.content.toLowerCase().includes(contribution.title.toLowerCase().substring(0, 20))
      );
      
      if (matchingPost) {
        return {
          ...contribution,
          likes: matchingPost.likes || contribution.likes,
          comments: matchingPost.comments || contribution.comments
        };
      }
      return contribution;
    }));
  }, [posts]);
  const [profileStats, setProfileStats] = React.useState<any>(sampleProfileStats);
  const [loading, setLoading] = React.useState(false);
  const [savingStates, setSavingStates] = React.useState<{[key: string]: 'idle' | 'saving' | 'saved' | 'error'}>({});
  const [reseedFromMock, setReseedFromMock] = React.useState(false);
  
  // Helper function to generate IDs
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Export single course function (matches original)
  const exportCourse = async (id: string): Promise<string> => {
    const course = courses.find(c => c.id === id);
    if (!course) throw new Error('Course not found');
    
    return JSON.stringify({
      version: '1.0',
      course,
      exportDate: new Date().toISOString(),
    }, null, 2);
  };

  // Import/Export functionality (from original CourseList)
  const handleExportCourses = async () => {
    try {
      // Export all courses (excluding templates)
      const coursesToExport = courses.filter(c => !c.isTemplate);

      const exportPromises = coursesToExport.map(course => exportCourse(course.id));
      const exportedData = await Promise.all(exportPromises);

      // Combine all courses into one export
      const combinedExport = {
        exportVersion: '1.0',
        exportDate: new Date().toISOString(),
        courses: exportedData.map(data => JSON.parse(data)),
        totalCourses: coursesToExport.length
      };

      // Create and trigger download
      const blob = new Blob([JSON.stringify(combinedExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_courses_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('Export Complete!', `Exported ${coursesToExport.length} courses to JSON file.`);
    } catch (error) {
      console.error('Failed to export all courses:', error);
      showWarning('Export Failed', 'Failed to export courses.');
    }
  };
  
  const handleImportCourses = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const parsed = JSON.parse(data);
        
        // Support multiple import formats
        let coursesToImport: any[] = [];
        
        if (parsed.courses) {
          // New format with multiple courses or export format
          coursesToImport = Array.isArray(parsed.courses) ? parsed.courses : [parsed.courses];
        } else if (parsed.course) {
          // Single course wrapped format
          coursesToImport = [parsed.course];
        } else if (parsed.id && parsed.title) {
          // Direct course object
          coursesToImport = [parsed];
        } else {
          throw new Error('Invalid course data format');
        }
        
        // Process each course and generate new IDs to avoid conflicts (from original importCourse)
        const processedCourses = coursesToImport.map((courseData: any) => ({
          ...courseData,
          id: generateId(),
          title: `${courseData.title} (Imported)`,
          createdAt: new Date(),
          updatedAt: new Date(),
          modules: courseData.modules?.map((module: any) => ({
            ...module,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            lessons: module.lessons?.map((lesson: any) => ({
              ...lesson,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
              content: lesson.content?.map((content: any) => ({
                ...content,
                id: generateId(),
              })) || [],
            })) || [],
          })) || [],
        }));
        
        setCourses(prev => [...prev, ...processedCourses]);
        showSuccess('Import Complete!', `Imported ${processedCourses.length} courses from JSON file.`);
        
        // Emit event for cross-plugin communication
        newEventBus.emit('demo:courses-imported', { 
          count: processedCourses.length,
          source: 'json-file'
        }, 'demo-import');
        
      } catch (error) {
        console.error('Import error:', error);
        showWarning('Import Failed', 'Invalid JSON file format or corrupted course data.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };
  
  // Storage backend functions
  const saveToStorage = async (data: any[]) => {
    switch (storageBackend) {
      case 'localStorage':
        localStorage.setItem('demo-courses', JSON.stringify(data));
        break;
      case 'indexedDB':
        // Use real IndexedDB
        const db = await initializeIndexedDB();
        
        const transaction = db.transaction(['demo-courses'], 'readwrite');
        const store = transaction.objectStore('demo-courses');
        
        await new Promise((resolve, reject) => {
          const putRequest = store.put({ key: 'courses', value: data });
          putRequest.onsuccess = () => resolve(undefined);
          putRequest.onerror = () => reject(putRequest.error);
        });
        
        db.close();
        break;
      case 'mockAPI':
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 200));
        sessionStorage.setItem('demo-courses-api', JSON.stringify(data));
        break;
      case 'memory':
      default:
        // Already in memory, no persistence
        break;
    }
  };
  
  const loadFromStorage = async (): Promise<any[]> => {
    switch (storageBackend) {
      case 'localStorage':
        const localData = localStorage.getItem('demo-courses');
        return localData ? JSON.parse(localData) : [];
      case 'indexedDB':
        // Use real IndexedDB
        try {
          const db = await initializeIndexedDB();
          
          const transaction = db.transaction(['demo-courses'], 'readonly');
          const store = transaction.objectStore('demo-courses');
          
          const result = await new Promise<any>((resolve, reject) => {
            const getRequest = store.get('courses');
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
          });
          
          db.close();
          
          return result && result.value ? result.value : [];
        } catch (error) {
          console.error('Failed to load courses from IndexedDB:', error);
          return [];
        }
      case 'mockAPI':
        await new Promise(resolve => setTimeout(resolve, 300));
        const apiData = sessionStorage.getItem('demo-courses-api');
        return apiData ? JSON.parse(apiData) : [];
      case 'memory':
      default:
        return [];
    }
  };
  
  const handleStorageBackendChange = async (newBackend: typeof storageBackend) => {
    // Save current data to new backend
    if (courses.length > 0) {
      setStorageBackend(newBackend);
      // Simulate migration
      await saveToStorage(courses);
      showInfo('Storage Switched', `Data migrated to ${newBackend}. ${courses.length} courses preserved.`);
    } else {
      setStorageBackend(newBackend);
      // Load data from new backend
      const loadedCourses = await loadFromStorage();
      setCourses(loadedCourses);
      if (loadedCourses.length > 0) {
        showSuccess('Data Loaded', `Loaded ${loadedCourses.length} courses from ${newBackend}.`);
      }
    }
    
    // Emit event
    newEventBus.emit('demo:storage-backend-changed', { 
      backend: newBackend,
      courseCount: courses.length
    }, 'demo-storage');
  };

  // Reseed functionality - clear current storage and reload from mock data
  const handleReseedFromMock = React.useCallback(async () => {
    if (!reseedFromMock) return;
    
    try {
      setLoading(true);
      
      // Determine what data to reseed based on active tab
      const shouldReseedPosts = activeTab === 'messaging' || activeTab === 'community' || activeTab === 'community-sidebar';
      const shouldReseedMembers = activeTab === 'members';
      const shouldReseedProducts = activeTab === 'merchandise';
      const shouldReseedEvents = activeTab === 'calendar';
      const shouldReseedCourses = activeTab === 'classroom' || activeTab === 'course-builder';
      
      // Clear specific storage keys based on active tab
      if (storageBackend === 'localStorage') {
        const keysToRemove: string[] = [];
        
        if (shouldReseedPosts) {
          keysToRemove.push(...Object.keys(localStorage).filter(key => 
            key.startsWith('course_framework_community') || 
            key.includes('_post_') ||
            key.includes('_likes_') ||
            key.includes('_comments_')
          ));
        }
        if (shouldReseedMembers) {
          keysToRemove.push('demo-members');
        }
        if (shouldReseedProducts) {
          keysToRemove.push('demo-products');
        }
        if (shouldReseedEvents) {
          keysToRemove.push('demo-events');
        }
        if (shouldReseedCourses) {
          keysToRemove.push(...Object.keys(localStorage).filter(key => 
            key.startsWith('plugin_') && key.includes('courses')
          ));
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } else if (storageBackend === 'indexedDB') {
        // For IndexedDB, we need to clear specific object stores
        try {
          const db = await initializeIndexedDB();
          const stores: string[] = [];
          
          if (shouldReseedPosts) stores.push('demo-posts', 'demo-user-likes');
          if (shouldReseedMembers) stores.push('demo-members');
          if (shouldReseedProducts) stores.push('demo-products');
          if (shouldReseedEvents) stores.push('demo-events');
          if (shouldReseedCourses) stores.push('demo-courses');
          
          if (stores.length > 0) {
            const transaction = db.transaction(stores, 'readwrite');
            stores.forEach(storeName => {
              const store = transaction.objectStore(storeName);
              store.clear();
            });
            
            await new Promise((resolve, reject) => {
              transaction.oncomplete = () => resolve(true);
              transaction.onerror = () => reject(transaction.error);
            });
          }
          
          db.close();
        } catch (error) {
          console.warn('Error clearing IndexedDB:', error);
        }
      }
      
      // Reset state and save data based on active tab
      if (shouldReseedCourses) {
        setCourses([]);
        await saveToStorage([]);
      }
      
      if (shouldReseedPosts) {
        setPosts(samplePosts);
        setUserLikes(new Set());
      }
      
      if (shouldReseedMembers) {
        setMembers(sampleMembers);
        await saveMembers(sampleMembers);
      }
      
      if (shouldReseedProducts) {
        setProducts(sampleProducts);
        await saveProducts(sampleProducts);
      }
      
      if (shouldReseedEvents) {
        setEvents(sampleEvents);
        await saveEvents(sampleEvents);
      }
      
      // Populate storage with like data and comments from sample posts only if reseeding posts
      if (shouldReseedPosts) {
        for (const post of samplePosts) {
          // Create fake likes to match the sample post like counts with fixed dates
          const likes = [];
          const postDate = new Date(post.createdAt);
          for (let i = 0; i < (post.likes || 0); i++) {
            // Spread likes over time after post creation (up to 3 days)
            const likeDate = new Date(postDate.getTime() + (i * 3600000) + (Math.random() * 86400000 * 3));
            likes.push({
              id: `like_${post.id}_${i}`,
              userId: `sample_user_${i}`,
              userName: `User${i}`,
              postId: post.id,
              createdAt: likeDate
            });
          }
          
          // Use the static sample comments for this post
          const postComments = sampleComments.filter(comment => comment.postId === post.id);
          
          // Store posts, likes, and comments in the selected storage backend with correct prefix
          const storagePrefix = `${storageBackend}_course_framework_community`;
          const postKey = `${storagePrefix}_post_${post.id}`;
          const likesKey = `${storagePrefix}_post_likes_${post.id}`;
          const commentsKey = `${storagePrefix}_post_comments_${post.id}`;
          
          if (storageBackend === 'localStorage') {
            localStorage.setItem(postKey, JSON.stringify(post));
            localStorage.setItem(likesKey, JSON.stringify(likes));
            localStorage.setItem(commentsKey, JSON.stringify(postComments));
          } else if (storageBackend === 'indexedDB') {
            // Store in IndexedDB using the same storage abstraction
            try {
              const db = await initializeIndexedDB();
              const transaction = db.transaction(['demo-posts', 'demo-user-likes', 'demo-posts'], 'readwrite');
              const postsStore = transaction.objectStore('demo-posts');
              const likesStore = transaction.objectStore('demo-user-likes');
              const commentsStore = transaction.objectStore('demo-posts'); // Comments are stored with posts
              
              // Store posts, likes and comments using the same key format as our storage functions
              postsStore.put({ key: postKey, value: post });
              likesStore.put({ key: likesKey, value: likes });
              commentsStore.put({ key: commentsKey, value: postComments });
              
              await new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve(true);
                transaction.onerror = () => reject(transaction.error);
              });
              
              db.close();
            } catch (error) {
              console.error('Error storing data in IndexedDB:', error);
              throw new Error(`Failed to store data in IndexedDB: ${error}`);
            }
          }
        }
      }
      
      // Reset checkbox
      setReseedFromMock(false);
      
      // Create specific success message based on what was reseeded
      let dataTypes = [];
      if (shouldReseedPosts) dataTypes.push('posts');
      if (shouldReseedMembers) dataTypes.push('members');
      if (shouldReseedProducts) dataTypes.push('products');
      if (shouldReseedEvents) dataTypes.push('events');
      if (shouldReseedCourses) dataTypes.push('courses');
      
      const dataTypeText = dataTypes.length > 0 ? dataTypes.join(', ') : 'no data';
      showSuccess('Data Reseeded', `Cleared ${storageBackend} and reloaded ${dataTypeText} from mock data for the ${activeTab} tab.`);
      
    } catch (error) {
      console.error('Error reseeding data:', error);
      showWarning('Reseed Error', 'Failed to reseed data. Check console for details.');
      setReseedFromMock(false);
    } finally {
      setLoading(false);
    }
  }, [reseedFromMock, storageBackend, showSuccess, showWarning]);

  // Handle reseed checkbox changes
  React.useEffect(() => {
    if (reseedFromMock) {
      handleReseedFromMock();
    }
  }, [reseedFromMock, handleReseedFromMock]);
  
  // Storage-agnostic callback functions with event bus integration
  const handleCreateCourse = async (course: any) => {
    const tempId = Date.now().toString();
    const newCourse = { ...course, id: tempId, createdAt: new Date(), updatedAt: new Date(), lastSaved: new Date() };
    
    // Show saving state
    setSavingStates(prev => ({ ...prev, [tempId]: 'saving' }));
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    // Simulate occasional errors (10% chance)
    if (Math.random() < 0.1) {
      setSavingStates(prev => ({ ...prev, [tempId]: 'error' }));
      showWarning('Save Failed', 'Failed to save course. Retrying...');
      
      // Auto-retry after 2 seconds
      setTimeout(async () => {
        setSavingStates(prev => ({ ...prev, [tempId]: 'saving' }));
        await new Promise(resolve => setTimeout(resolve, 500));
        setCourses((prev: any[]) => [...prev, newCourse]);
        setSavingStates(prev => ({ ...prev, [tempId]: 'saved' }));
        showSuccess('Course Created!', `"${newCourse.title}" has been added to your classroom.`);
        
        // Clear saved state after 3 seconds
        setTimeout(() => {
          setSavingStates(prev => ({ ...prev, [tempId]: 'idle' }));
        }, 3000);
      }, 2000);
      return;
    }
    
    const updatedCourses = [...courses, newCourse];
    setCourses(updatedCourses);
    await saveToStorage(updatedCourses);
    setSavingStates(prev => ({ ...prev, [tempId]: 'saved' }));
    
    // Emit event and show notification
    newEventBus.emit(EVENTS.COURSE_CREATED, { course: newCourse }, 'classroom');
    showSuccess('Course Created!', `"${newCourse.title}" has been added to your classroom.`);
    
    // Clear saved state after 3 seconds
    setTimeout(() => {
      setSavingStates(prev => ({ ...prev, [tempId]: 'idle' }));
    }, 3000);
  };
  
  const handleUpdateCourse = async (courseId: string, updates: any) => {
    // Show saving state
    setSavingStates(prev => ({ ...prev, [courseId]: 'saving' }));
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200));
    
    // Simulate occasional errors (5% chance)
    if (Math.random() < 0.05) {
      setSavingStates(prev => ({ ...prev, [courseId]: 'error' }));
      showWarning('Update Failed', 'Failed to update course. Retrying...');
      
      // Auto-retry after 1.5 seconds
      setTimeout(async () => {
        setSavingStates(prev => ({ ...prev, [courseId]: 'saving' }));
        await new Promise(resolve => setTimeout(resolve, 300));
        setCourses((prev: any[]) => prev.map((course: any) => 
          course.id === courseId ? { ...course, ...updates, updatedAt: new Date(), lastSaved: new Date() } : course
        ));
        setSavingStates(prev => ({ ...prev, [courseId]: 'saved' }));
        showInfo('Course Updated', 'Your changes have been saved.');
        
        // Clear saved state after 2 seconds
        setTimeout(() => {
          setSavingStates(prev => ({ ...prev, [courseId]: 'idle' }));
        }, 2000);
      }, 1500);
      return;
    }
    
    const updatedCourses = courses.map((course: any) => 
      course.id === courseId ? { ...course, ...updates, updatedAt: new Date(), lastSaved: new Date() } : course
    );
    setCourses(updatedCourses);
    await saveToStorage(updatedCourses);
    setSavingStates(prev => ({ ...prev, [courseId]: 'saved' }));
    
    // Emit event
    newEventBus.emit(EVENTS.COURSE_UPDATED, { courseId, updates }, 'classroom');
    showInfo('Course Updated', 'Your changes have been saved.');
    
    // Clear saved state after 2 seconds
    setTimeout(() => {
      setSavingStates(prev => ({ ...prev, [courseId]: 'idle' }));
    }, 2000);
  };
  
  const handleDeleteCourse = async (courseId: string) => {
    const courseToDelete = courses.find(c => c.id === courseId);
    const updatedCourses = courses.filter((course: any) => course.id !== courseId);
    setCourses(updatedCourses);
    await saveToStorage(updatedCourses);
    
    // Emit event
    newEventBus.emit(EVENTS.COURSE_DELETED, { courseId, courseName: courseToDelete?.title }, 'classroom');
    showWarning('Course Deleted', `"${courseToDelete?.title || 'Course'}" has been removed.`);
  };

  const handleCloneCourse = async (courseId: string) => {
    const originalCourse = courses.find(c => c.id === courseId);
    if (!originalCourse) {
      showWarning('Clone Failed', 'Original course not found.');
      return;
    }
    
    const clonedCourse = {
      ...originalCourse,
      id: generateId(),
      title: `${originalCourse.title} (Copy)`,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSaved: new Date(),
      modules: originalCourse.modules?.map((module: any) => ({
        ...module,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        lessons: module.lessons?.map((lesson: any) => ({
          ...lesson,
          id: generateId(),
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          content: lesson.content?.map((content: any) => ({
            ...content,
            id: generateId(),
          })) || [],
        })) || [],
      })) || [],
    };
    
    const updatedCourses = [...courses, clonedCourse];
    setCourses(updatedCourses);
    await saveToStorage(updatedCourses);
    
    // Emit event
    newEventBus.emit(EVENTS.COURSE_CREATED, { course: clonedCourse }, 'classroom');
    showSuccess('Course Cloned!', `"${clonedCourse.title}" has been created with all completion status reset.`);
  };
  
  const handleLoadCourses = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleLoadCourse = async (courseId: string) => {
    // Find and return a specific course
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      showWarning('Course Not Found', `Course with ID ${courseId} not found.`);
      return null;
    }
    return course;
  };
  
  const handleCreatePost = async (post: any) => {
    const newPost = { ...post, id: Date.now().toString(), createdAt: new Date() };
    const updatedPosts = [...posts, newPost];
    setPosts(updatedPosts);
    
    // Save to storage
    await savePostsToStorage(updatedPosts);
    
    // Emit event
    newEventBus.emit(EVENTS.POST_CREATED, { post: newPost }, 'community');
    showSuccess('Post Created!', 'Your post has been shared with the community.');
  };

  const handleLoadComments = async (postId: string): Promise<any[]> => {
    try {
      const storagePrefix = `${storageBackend}_course_framework_community`;
      const commentsKey = `${storagePrefix}_post_comments_${postId}`;
      
      let comments: any[] = [];
      
      if (storageBackend === 'localStorage') {
        const commentsData = localStorage.getItem(commentsKey);
        comments = commentsData ? JSON.parse(commentsData) : [];
      } else if (storageBackend === 'indexedDB') {
        const request = indexedDB.open('plugin_data', 3);
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        const transaction = db.transaction(['demo-posts'], 'readonly');
        const commentsStore = transaction.objectStore('demo-posts');
        
        const commentsRequest = commentsStore.get(commentsKey);
        const commentsData = await new Promise<any>((resolve, reject) => {
          commentsRequest.onsuccess = () => resolve(commentsRequest.result);
          commentsRequest.onerror = () => reject(commentsRequest.error);
        });
        
        db.close();
        comments = commentsData?.value || [];
      }
      
      if (comments.length === 0) {
        return [];
      }
      
      // Build the comment tree structure (replies nested under parent comments)
      const commentMap = new Map();
      const rootComments: any[] = [];
      
      // First pass: create map and prepare comments
      comments.forEach((comment: any) => {
        const processedComment = {
          ...comment,
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt),
          replies: []
        };
        commentMap.set(comment.id, processedComment);
      });
      
      // Second pass: build tree structure
      comments.forEach((comment: any) => {
        const processedComment = commentMap.get(comment.id);
        if (comment.parentId) {
          const parent = commentMap.get(comment.parentId);
          if (parent) {
            parent.replies.push(processedComment);
          }
        } else {
          rootComments.push(processedComment);
        }
      });
      
      // Sort by creation date (oldest first for natural conversation flow)
      const sortComments = (commentList: any[]) => {
        commentList.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        commentList.forEach((comment: any) => {
          if (comment.replies.length > 0) {
            sortComments(comment.replies);
          }
        });
      };
      
      sortComments(rootComments);
      console.log(`[Demo] Loaded ${comments.length} total comments for post ${postId}, ${rootComments.length} top-level`);
      return rootComments;
    } catch (error) {
      console.error('[Demo] Error loading comments:', error);
      return [];
    }
  };

  const handleAddComment = async (postId: string, content: string, parentId?: string, mediaData?: any) => {
    // Create the new comment object
    const newComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId,
      authorId: mockUser.id,
      authorName: mockUser.profile.displayName,
      authorAvatar: mockUser.profile.avatar,
      content,
      parentId,
      likes: 0,
      likedByUser: false,
      replies: [],
      depth: parentId ? 1 : 0, // Simple depth calculation
      isEdited: false,
      isPinned: false,
      videoUrl: mediaData?.type === 'video' ? mediaData.url : undefined,
      linkUrl: mediaData?.linkUrl,
      attachments: mediaData?.attachments,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store comment in the appropriate storage backend
    const storagePrefix = `${storageBackend}_course_framework_community`;
    const commentsKey = `${storagePrefix}_post_comments_${postId}`;
    console.log(`handleAddComment:Adding comment to post ${postId} in ${storageBackend} at key ${commentsKey}`);
    
    if (storageBackend === 'localStorage') {
      const existingComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
      existingComments.push(newComment);
      localStorage.setItem(commentsKey, JSON.stringify(existingComments));
    } else if (storageBackend === 'indexedDB') {
      try {
        const request = indexedDB.open('plugin_data', 3);
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        const transaction = db.transaction(['demo-posts'], 'readwrite');
        const commentsStore = transaction.objectStore('demo-posts');
        
        // Get existing comments
        const existingRequest = commentsStore.get(commentsKey);
        const existingData = await new Promise<any>((resolve, reject) => {
          existingRequest.onsuccess = () => resolve(existingRequest.result);
          existingRequest.onerror = () => reject(existingRequest.error);
        });
        
        const existingComments = existingData?.value || [];
        existingComments.push(newComment);
        
        await new Promise((resolve, reject) => {
          const updateRequest = commentsStore.put({ key: commentsKey, value: existingComments });
          updateRequest.onsuccess = () => resolve(undefined);
          updateRequest.onerror = () => reject(updateRequest.error);
        });
        
        db.close();
      } catch (error) {
        console.error('Error storing comment in IndexedDB:', error);
      }
    }
    
    // Update the comment count, lastCommentAt timestamp, and commenters array for the specific post
    const updatedPosts = posts.map((post: any) => {
      if (post.id === postId) {
        // Get existing commenters
        const existingCommenters = post.commenters || [];
        
        // Create new commenter object
        const newCommenter = {
          initials: mockUser.profile.displayName.split(' ').map((n: string) => n[0]).join(''),
          avatarUrl: mockUser.profile.avatar || null,
          name: mockUser.profile.displayName,
          userId: mockUser.id,
          commentDate: new Date().toISOString()
        };
        
        // Remove existing entry for this user if they've commented before
        const filteredCommenters = existingCommenters.filter((c: any) => c.userId !== mockUser.id);
        
        // Add new commenter at the beginning (most recent)
        const updatedCommenters = [newCommenter, ...filteredCommenters];
        
        // Keep only the most recent 5 commenters
        const recentCommenters = updatedCommenters.slice(0, 5);
        
        return {
          ...post,
          comments: (post.comments || 0) + 1,
          lastCommentAt: new Date().toISOString(),
          commenters: recentCommenters
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    
    // Save posts to storage
    await savePostsToStorage(updatedPosts);
    
    // Emit event
    newEventBus.emit(EVENTS.COMMENT_ADDED, { postId, content, parentId }, 'community');
    showSuccess(parentId ? 'Reply Added!' : 'Comment Added!', parentId ? 'Your reply has been posted.' : 'Your comment has been posted.');
  };
  
  const handleLikePost = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    const isAlreadyLiked = userLikes.has(postId);
    
    // Toggle like status
    const newUserLikes = new Set(userLikes);
    let updatedPosts;
    
    if (isAlreadyLiked) {
      // Unlike: remove from user likes and decrease count
      newUserLikes.delete(postId);
      updatedPosts = posts.map((post: any) => 
        post.id === postId ? { ...post, likes: Math.max((post.likes || 0) - 1, 0) } : post
      );
      showInfo('Post Unliked!', 'Like removed from post.');
    } else {
      // Like: add to user likes and increase count
      newUserLikes.add(postId);
      updatedPosts = posts.map((post: any) => 
        post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
      );
      showInfo('Post Liked!', 'Thanks for engaging with the community.');
    }
    
    setUserLikes(newUserLikes);
    setPosts(updatedPosts);
    
    // Save to storage
    await savePostsToStorage(updatedPosts);
    await saveUserLikes(newUserLikes as Set<string>);
    
    // Emit event
    newEventBus.emit(isAlreadyLiked ? EVENTS.POST_UNLIKED : EVENTS.POST_LIKED, { 
      postId, 
      postTitle: post?.content?.substring(0, 50) 
    }, 'community');
  };

  // Post edit and delete handlers
  const handleEditPost = async (postId: string, updates: { title?: string; content: string; category?: string; mediaData?: any }) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) {
        showWarning('Edit Failed', 'Post not found.');
        return;
      }

      // Check if current user is the author
      if (post.authorId !== (mockUser?.id || 'anonymous')) {
        showWarning('Edit Failed', 'You can only edit your own posts.');
        return;
      }

      // Extract media data from updates
      const { mediaData, ...basicUpdates } = updates;
      
      // Build the updated post object
      const postUpdates: any = {
        ...basicUpdates,
        isEdited: true,
        updatedAt: new Date().toISOString()
      };

      // Handle media data updates
      if (mediaData) {
        // Clear existing media fields
        postUpdates.videoUrl = undefined;
        postUpdates.linkUrl = undefined;
        postUpdates.pollData = undefined;
        postUpdates.attachments = undefined;

        // Set new media data based on type
        if (mediaData.type === 'video' && mediaData.url) {
          postUpdates.videoUrl = mediaData.url;
        } else if (mediaData.type === 'link' && mediaData.url) {
          postUpdates.linkUrl = mediaData.url;
        } else if (mediaData.type === 'poll' && mediaData.options) {
          postUpdates.pollData = mediaData;
        }
        
        // Handle attachments - always set attachments if mediaData includes them
        if (mediaData.attachments !== undefined) {
          postUpdates.attachments = mediaData.attachments.length > 0 ? mediaData.attachments : undefined;
        }
      }

      const updatedPosts = posts.map((p: any) => 
        p.id === postId 
          ? { ...p, ...postUpdates } 
          : p
      );
      
      setPosts(updatedPosts);
      await savePostsToStorage(updatedPosts);
      
      // Emit event
      newEventBus.emit(EVENTS.POST_UPDATED, { postId, updates: { ...basicUpdates, ...postUpdates } }, 'community');
      showInfo('Post Updated!', 'Your changes have been saved.');
    } catch (error) {
      console.error('Error editing post:', error);
      showWarning('Edit Failed', 'Failed to update post. Please try again.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) {
        showWarning('Delete Failed', 'Post not found.');
        return;
      }

      // Check if current user is the author
      if (post.authorId !== (mockUser?.id || 'anonymous')) {
        showWarning('Delete Failed', 'You can only delete your own posts.');
        return;
      }

      const updatedPosts = posts.filter((p: any) => p.id !== postId);
      setPosts(updatedPosts);
      await savePostsToStorage(updatedPosts);

      // Also delete associated comments
      const storagePrefix = `${storageBackend}_course_framework_community`;
      const commentsKey = `${storagePrefix}_post_comments_${postId}`;
      
      if (storageBackend === 'localStorage') {
        localStorage.removeItem(commentsKey);
      } else if (storageBackend === 'indexedDB') {
        const request = indexedDB.open('plugin_data', 3);
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        const transaction = db.transaction(['demo-posts'], 'readwrite');
        const commentsStore = transaction.objectStore('demo-posts');
        await new Promise((resolve, reject) => {
          const deleteRequest = commentsStore.delete(commentsKey);
          deleteRequest.onsuccess = () => resolve(deleteRequest.result);
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
        
        db.close();
      }
      
      // Emit event
      newEventBus.emit(EVENTS.POST_DELETED, { postId, postTitle: post.content?.substring(0, 50) }, 'community');
      showWarning('Post Deleted', 'Your post has been removed.');
    } catch (error) {
      console.error('Error deleting post:', error);
      showWarning('Delete Failed', 'Failed to delete post. Please try again.');
    }
  };

  // Pin post handler
  const handlePinPost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) {
        showWarning('Pin Failed', 'Post not found.');
        return;
      }

      // Check if current user is the author
      if (post.authorId !== (mockUser?.id || 'anonymous')) {
        showWarning('Pin Failed', 'You can only pin your own posts.');
        return;
      }

      const newPinnedState = !post.isPinned;
      const updatedPosts = posts.map((p: any) => 
        p.id === postId ? { ...p, isPinned: newPinnedState } : p
      );
      
      setPosts(updatedPosts);
      await savePostsToStorage(updatedPosts);
      
      showSuccess(
        newPinnedState ? 'Post Pinned!' : 'Post Unpinned!', 
        newPinnedState ? 'Post has been pinned to the top of the feed.' : 'Post has been unpinned from the feed.'
      );
    } catch (error) {
      console.error('Error pinning/unpinning post:', error);
      showWarning('Pin Failed', 'Failed to update post pin status. Please try again.');
    }
  };

  // Toggle comments handler
  const handleToggleCommentsForPost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) {
        showWarning('Update Failed', 'Post not found.');
        return;
      }

      // Check if current user is the author
      if (post.authorId !== (mockUser?.id || 'anonymous')) {
        showWarning('Update Failed', 'You can only modify comment settings for your own posts.');
        return;
      }

      const newCommentsDisabled = !post.commentsDisabled;
      const updatedPosts = posts.map((p: any) => 
        p.id === postId ? { ...p, commentsDisabled: newCommentsDisabled } : p
      );
      
      setPosts(updatedPosts);
      await savePostsToStorage(updatedPosts);
      
      showSuccess(
        newCommentsDisabled ? 'Comments Disabled!' : 'Comments Enabled!', 
        newCommentsDisabled ? 'Comments have been turned off for this post.' : 'Comments have been turned on for this post.'
      );
    } catch (error) {
      console.error('Error toggling comments:', error);
      showWarning('Update Failed', 'Failed to update comment settings. Please try again.');
    }
  };

  // Comment like handlers
  const handleLikeComment = async (commentId: string) => {
    try {
      console.log('[Demo] handleLikeComment called with:', commentId);
      console.log('[Demo] Storage backend:', storageBackend);
      console.log('[Demo] Posts available:', posts.length);
      
      // Find which post contains this comment and update the comment
      for (const post of posts) {
        const storagePrefix = `${storageBackend}_course_framework_community`;
        const commentsKey = `${storagePrefix}_post_comments_${post.id}`;
        
        // Load comments from storage
        let comments: any[] = [];
        if (storageBackend === 'localStorage') {
          const commentsData = localStorage.getItem(commentsKey);
          comments = commentsData ? JSON.parse(commentsData) : [];
        } else if (storageBackend === 'indexedDB') {
          const request = indexedDB.open('plugin_data', 3);
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          
          const transaction = db.transaction(['demo-posts'], 'readwrite');
          const commentsStore = transaction.objectStore('demo-posts');
          
          const commentsRequest = commentsStore.get(commentsKey);
          const commentsData = await new Promise<any>((resolve, reject) => {
            commentsRequest.onsuccess = () => resolve(commentsRequest.result);
            commentsRequest.onerror = () => reject(commentsRequest.error);
          });
          
          comments = commentsData?.value || [];
          db.close();
        }
        
        // Find and update the comment
        const commentIndex = comments.findIndex((c: any) => c.id === commentId);
        if (commentIndex !== -1) {
          comments[commentIndex] = {
            ...comments[commentIndex],
            likes: (comments[commentIndex].likes || 0) + 1,
            likedByUser: true
          };
          
          // Save back to storage
          if (storageBackend === 'localStorage') {
            localStorage.setItem(commentsKey, JSON.stringify(comments));
          } else if (storageBackend === 'indexedDB') {
            const request = indexedDB.open('plugin_data', 3);
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            
            const transaction = db.transaction(['demo-posts'], 'readwrite');
            const commentsStore = transaction.objectStore('demo-posts');
            
            await new Promise((resolve, reject) => {
              const putRequest = commentsStore.put({ key: commentsKey, value: comments });
              putRequest.onsuccess = () => resolve(putRequest.result);
              putRequest.onerror = () => reject(putRequest.error);
            });
            
            db.close();
          }
          
          showInfo('Comment Liked!', 'Thanks for engaging with the discussion.');
          return;
        }
      }
      
      console.warn('Comment not found:', commentId);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleUnlikeComment = async (commentId: string) => {
    try {
      console.log('Unliking comment:', commentId);
      
      // Find which post contains this comment and update the comment
      for (const post of posts) {
        const storagePrefix = `${storageBackend}_course_framework_community`;
        const commentsKey = `${storagePrefix}_post_comments_${post.id}`;
        
        // Load comments from storage
        let comments: any[] = [];
        if (storageBackend === 'localStorage') {
          const commentsData = localStorage.getItem(commentsKey);
          comments = commentsData ? JSON.parse(commentsData) : [];
        } else if (storageBackend === 'indexedDB') {
          const request = indexedDB.open('plugin_data', 3);
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          
          const transaction = db.transaction(['demo-posts'], 'readwrite');
          const commentsStore = transaction.objectStore('demo-posts');
          
          const commentsRequest = commentsStore.get(commentsKey);
          const commentsData = await new Promise<any>((resolve, reject) => {
            commentsRequest.onsuccess = () => resolve(commentsRequest.result);
            commentsRequest.onerror = () => reject(commentsRequest.error);
          });
          
          comments = commentsData?.value || [];
          db.close();
        }
        
        // Find and update the comment
        const commentIndex = comments.findIndex((c: any) => c.id === commentId);
        if (commentIndex !== -1) {
          comments[commentIndex] = {
            ...comments[commentIndex],
            likes: Math.max(0, (comments[commentIndex].likes || 1) - 1),
            likedByUser: false
          };
          
          // Save back to storage
          if (storageBackend === 'localStorage') {
            localStorage.setItem(commentsKey, JSON.stringify(comments));
          } else if (storageBackend === 'indexedDB') {
            const request = indexedDB.open('plugin_data', 3);
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            
            const transaction = db.transaction(['demo-posts'], 'readwrite');
            const commentsStore = transaction.objectStore('demo-posts');
            
            await new Promise((resolve, reject) => {
              const putRequest = commentsStore.put({ key: commentsKey, value: comments });
              putRequest.onsuccess = () => resolve(putRequest.result);
              putRequest.onerror = () => reject(putRequest.error);
            });
            
            db.close();
          }
          
          showInfo('Comment Unliked!', 'Like removed from comment.');
          return;
        }
      }
      
      console.warn('Comment not found:', commentId);
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  };

  // Comment edit and delete handlers
  const handleEditComment = async (commentId: string, newContent: string, mediaData?: any) => {
    try {
      // Find which post contains this comment and update it
      for (const post of posts) {
        const storagePrefix = `${storageBackend}_course_framework_community`;
        const commentsKey = `${storagePrefix}_post_comments_${post.id}`;
        
        // Load comments from storage
        let comments: any[] = [];
        if (storageBackend === 'localStorage') {
          const commentsData = localStorage.getItem(commentsKey);
          comments = commentsData ? JSON.parse(commentsData) : [];
        } else if (storageBackend === 'indexedDB') {
          const request = indexedDB.open('plugin_data', 3);
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          
          const transaction = db.transaction(['demo-posts'], 'readwrite');
          const commentsStore = transaction.objectStore('demo-posts');
          
          const commentsRequest = commentsStore.get(commentsKey);
          const commentsData = await new Promise<any>((resolve, reject) => {
            commentsRequest.onsuccess = () => resolve(commentsRequest.result);
            commentsRequest.onerror = () => reject(commentsRequest.error);
          });
          
          comments = commentsData?.value || [];
          db.close();
        }
        
        // Find the comment to edit
        const commentIndex = comments.findIndex((c: any) => c.id === commentId);
        if (commentIndex !== -1) {
          const comment = comments[commentIndex];
          
          // Check if current user is the author
          if (comment.authorId !== (mockUser?.id || 'anonymous')) {
            showWarning('Edit Failed', 'You can only edit your own comments.');
            return;
          }

          // Update the comment
          const updatedComment = {
            ...comment,
            content: newContent,
            isEdited: true,
            updatedAt: new Date().toISOString()
          };
          
          // Handle media data updates if provided
          if (mediaData) {
            // Clear existing media fields
            updatedComment.attachments = undefined;
            
            // Set new media data
            if (mediaData.attachments && mediaData.attachments.length > 0) {
              updatedComment.attachments = mediaData.attachments;
            }
          }
          
          comments[commentIndex] = updatedComment;
          
          // Save back to storage
          if (storageBackend === 'localStorage') {
            localStorage.setItem(commentsKey, JSON.stringify(comments));
          } else if (storageBackend === 'indexedDB') {
            const request = indexedDB.open('plugin_data', 3);
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            
            const transaction = db.transaction(['demo-posts'], 'readwrite');
            const commentsStore = transaction.objectStore('demo-posts');
            
            await new Promise((resolve, reject) => {
              const putRequest = commentsStore.put({ key: commentsKey, value: comments });
              putRequest.onsuccess = () => resolve(putRequest.result);
              putRequest.onerror = () => reject(putRequest.error);
            });
            
            db.close();
          }
          
          showInfo('Comment Updated!', 'Your changes have been saved.');
          return;
        }
      }
      
      console.warn('Comment not found for editing:', commentId);
      showWarning('Edit Failed', 'Comment not found.');
    } catch (error) {
      console.error('Error editing comment:', error);
      showWarning('Edit Failed', 'Failed to update comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      // Find which post contains this comment and remove it
      for (const post of posts) {
        const storagePrefix = `${storageBackend}_course_framework_community`;
        const commentsKey = `${storagePrefix}_post_comments_${post.id}`;
        
        // Load comments from storage
        let comments: any[] = [];
        if (storageBackend === 'localStorage') {
          const commentsData = localStorage.getItem(commentsKey);
          comments = commentsData ? JSON.parse(commentsData) : [];
        } else if (storageBackend === 'indexedDB') {
          const request = indexedDB.open('plugin_data', 3);
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
          
          const transaction = db.transaction(['demo-posts'], 'readwrite');
          const commentsStore = transaction.objectStore('demo-posts');
          
          const commentsRequest = commentsStore.get(commentsKey);
          const commentsData = await new Promise<any>((resolve, reject) => {
            commentsRequest.onsuccess = () => resolve(commentsRequest.result);
            commentsRequest.onerror = () => reject(commentsRequest.error);
          });
          
          comments = commentsData?.value || [];
          db.close();
        }
        
        // Find the comment to delete
        const commentIndex = comments.findIndex((c: any) => c.id === commentId);
        if (commentIndex !== -1) {
          const comment = comments[commentIndex];
          
          // Check if current user is the author
          if (comment.authorId !== (mockUser?.id || 'anonymous')) {
            showWarning('Delete Failed', 'You can only delete your own comments.');
            return;
          }

          // Remove the comment and all its replies
          const removeCommentAndReplies = (comments: any[], targetId: string) => {
            // First, recursively remove all replies to this comment
            const repliesToRemove = comments.filter((c: any) => c.parentId === targetId);
            repliesToRemove.forEach((reply: any) => {
              removeCommentAndReplies(comments, reply.id);
            });
            
            // Then remove the comment itself
            const index = comments.findIndex((c: any) => c.id === targetId);
            if (index !== -1) {
              comments.splice(index, 1);
            }
          };

          removeCommentAndReplies(comments, commentId);
          
          // Update post comment count
          const updatedPosts = posts.map((p: any) => 
            p.id === post.id 
              ? { ...p, comments: Math.max(0, (p.comments || 0) - 1) }
              : p
          );
          setPosts(updatedPosts);
          await savePostsToStorage(updatedPosts);
          
          // Save updated comments back to storage
          if (storageBackend === 'localStorage') {
            localStorage.setItem(commentsKey, JSON.stringify(comments));
          } else if (storageBackend === 'indexedDB') {
            const request = indexedDB.open('plugin_data', 3);
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            
            const transaction = db.transaction(['demo-posts'], 'readwrite');
            const commentsStore = transaction.objectStore('demo-posts');
            
            await new Promise((resolve, reject) => {
              const putRequest = commentsStore.put({ key: commentsKey, value: comments });
              putRequest.onsuccess = () => resolve(putRequest.result);
              putRequest.onerror = () => reject(putRequest.error);
            });
            
            db.close();
          }
          
          showWarning('Comment Deleted', 'Your comment has been removed.');
          return;
        }
      }
      
      console.warn('Comment not found for deletion:', commentId);
      showWarning('Delete Failed', 'Comment not found.');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showWarning('Delete Failed', 'Failed to delete comment. Please try again.');
    }
  };

  // Certificate callback handlers
  const handleCreateTemplate = async (template: any) => {
    const newTemplate = {
      ...template,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    showSuccess('Template Created!', `Certificate template "${newTemplate.name}" has been created.`);
  };

  const handleGenerateCertificate = async (courseId: string, studentId: string, templateId?: string) => {
    const course = courses.find(c => c.id === courseId);
    const newCertificate = {
      id: generateId(),
      certificateNumber: `CERT-${Date.now()}`,
      courseId,
      courseName: course?.title || 'Sample Course',
      studentId,
      studentName: mockUser.profile.displayName,
      studentEmail: mockUser.email,
      instructorId: 'instructor-1',
      instructorName: 'Course Instructor',
      templateId: templateId || certificateSettings.defaultTemplateId,
      issuedAt: new Date(),
      validFrom: new Date(),
      completionDate: new Date(),
      finalScore: 85 + Math.floor(Math.random() * 15),
      passingScore: certificateSettings.minimumPassingScore,
      totalHours: 25 + Math.floor(Math.random() * 20),
      skillsAcquired: ['Course Completion', 'Knowledge Mastery'],
      status: 'issued' as const,
      certificateUrl: `/certificates/${generateId()}`,
      verificationCode: `VERIFY-${Date.now()}`,
      verificationUrl: `/verify/VERIFY-${Date.now()}`,
      isPubliclyVerifiable: true,
      shareableUrl: `/certificates/share/${generateId()}`
    };
    
    setCertificates(prev => [...prev, newCertificate]);
    showSuccess('Certificate Generated!', `Certificate issued for ${newCertificate.courseName}.`);
  };

  const handleVerifyCertificate = async (verificationCode: string) => {
    const certificate = certificates.find(c => c.verificationCode === verificationCode);
    if (certificate) {
      showSuccess('Certificate Verified!', `Valid certificate for ${certificate.courseName}.`);
      return {
        isValid: true,
        certificate: certificate,
        verificationDate: new Date()
      };
    } else {
      showWarning('Verification Failed', 'Certificate not found or invalid verification code.');
      return {
        isValid: false,
        verificationDate: new Date()
      };
    }
  };

  const handleRevokeCertificate = async (certificateId: string, reason: string) => {
    setCertificates(prev => prev.map(cert => 
      cert.id === certificateId 
        ? { ...cert, status: 'revoked' as const, revokedAt: new Date(), revokedReason: reason }
        : cert
    ));
    showWarning('Certificate Revoked', `Certificate has been revoked: ${reason}`);
  };

  const handleDownloadCertificate = async (certificateId: string, format: 'pdf' | 'png' | 'jpg' = 'pdf') => {
    const certificate = certificates.find(c => c.id === certificateId);
    if (certificate) {
      showInfo('Download Started', `Downloading certificate for ${certificate.courseName} as ${format.toUpperCase()}.`);
    }
  };

  const handleShareToLinkedIn = async (certificateId: string) => {
    const certificate = certificates.find(c => c.id === certificateId);
    if (certificate) {
      showInfo('LinkedIn Share', `Opening LinkedIn to share certificate for ${certificate.courseName}.`);
    }
  };

  const handleUpdateCertificateSettings = async (settings: any) => {
    showInfo('Settings Updated', 'Certificate settings have been saved.');
  };

  // Analytics callback handlers
  const handleInitializeAnalytics = async (config: any) => {
    showSuccess('Analytics Initialized!', `Analytics configured with ${config.providers.length} provider(s).`);
  };

  const handleTrackEvent = async (name: string, properties?: Record<string, any>, userId?: string) => {
    const newEvent = {
      id: `event-${Date.now()}-${Math.random()}`,
      name,
      properties: properties || {},
      userId: userId || mockUser.id,
      timestamp: new Date(),
      provider: 'all',
      sent: true
    };
    
    setAnalyticsEvents(prev => [newEvent, ...prev]);
    showInfo('Event Tracked!', `Event "${name}" has been tracked.`);
  };

  const handleIdentifyUser = async (userId: string, properties: Record<string, any>) => {
    showInfo('User Identified!', `User ${userId} has been identified with analytics providers.`);
  };

  const handleTrackPageView = async (path: string, title?: string) => {
    const newEvent = {
      id: `pageview-${Date.now()}-${Math.random()}`,
      name: 'page_view',
      properties: { path, title: title || path },
      userId: mockUser.id,
      timestamp: new Date(),
      provider: 'all',
      sent: true
    };
    
    setAnalyticsEvents(prev => [newEvent, ...prev]);
    showInfo('Page View Tracked!', `Page view for ${path} has been tracked.`);
  };

  const handleUpdateAnalyticsConfig = async (config: any) => {
    showInfo('Config Updated!', 'Analytics configuration has been updated.');
  };

  const handleToggleAnalyticsTracking = async (enabled: boolean) => {
    setIsAnalyticsTracking(enabled);
    showInfo(
      enabled ? 'Tracking Enabled!' : 'Tracking Disabled!', 
      enabled ? 'Analytics tracking is now active.' : 'Analytics tracking has been paused.'
    );
  };

  // User Management callback handlers
  const handleLoadUserProfile = async (userId: string) => {
    showInfo('Profile Loaded', `User profile for ${userId} has been loaded.`);
  };

  const handleUpdateUserProfile = async (userId: string, updates: any) => {
    showSuccess('Profile Updated!', `User profile for ${userId} has been updated.`);
  };

  const handleEnrollStudent = async (studentId: string, courseId: string, enrollmentData: any) => {
    const newEnrollment = {
      id: generateId(),
      studentId,
      courseId,
      enrolledAt: new Date(),
      lastAccessedAt: new Date(),
      ...enrollmentData,
      progress: {
        overallPercentage: 0,
        lessonsCompleted: [],
        assessmentsCompleted: [],
        timeSpent: 0,
        bookmarks: [],
        notes: []
      },
      performance: {
        averageScore: 0,
        assessmentScores: {},
        completionStreak: 0,
        badges: ['enrolled'],
        achievements: []
      },
      settings: {
        notifications: true,
        publicProfile: false,
        showProgress: true,
        autoplayVideos: true,
        subtitles: false,
        playbackSpeed: 1
      },
      status: 'active' as const
    };
    
    showSuccess('Student Enrolled!', `Student has been enrolled in course ${courseId}.`);
  };

  const handleUpdateProgress = async (enrollmentId: string, progressUpdate: any) => {
    showInfo('Progress Updated!', `Progress has been updated for enrollment ${enrollmentId}.`);
  };

  const handleAddActivity = async (activity: any) => {
    const newActivity = {
      id: generateId(),
      ...activity,
      timestamp: new Date()
    };
    
    showInfo('Activity Added!', `New activity "${activity.description}" has been logged.`);
  };

  const handleSendNotification = async (notification: any) => {
    const newNotification = {
      id: generateId(),
      ...notification,
      createdAt: new Date(),
      isRead: false
    };
    
    showSuccess('Notification Sent!', `Notification "${notification.title}" has been sent.`);
  };

  const handleCreateGroup = async (groupData: any) => {
    const newGroup = {
      id: generateId(),
      ...groupData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    showSuccess('Group Created!', `User group "${groupData.name}" has been created.`);
  };

  const handleMarkNotificationAsRead = async (userId: string, notificationId: string) => {
    showInfo('Notification Read', `Notification ${notificationId} marked as read.`);
  };

  const handleLoadUserEnrollments = async (userId: string) => {
    showInfo('Enrollments Loaded', `Enrollments for user ${userId} have been loaded.`);
  };

  const handleLoadCourseEnrollments = async (courseId: string) => {
    showInfo('Enrollments Loaded', `Enrollments for course ${courseId} have been loaded.`);
  };

  // Stripe callback handlers
  const handleConfigureStripe = async (config: any) => {
    setIsStripeConfigured(true);
    showSuccess('Stripe Configured!', `Stripe has been configured in ${config.testMode ? 'test' : 'live'} mode.`);
  };

  const handleLoadStripeCustomerData = async (customerId: string) => {
    showInfo('Customer Data Loaded', `Stripe customer data for ${customerId} has been loaded.`);
  };

  const handleCreateCheckoutSession = async (planId: string, customerId?: string) => {
    const plan = stripePlans.find(p => p.id === planId);
    const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;
    
    showSuccess('Checkout Session Created!', `Checkout session created for ${plan?.name}. In a real app, user would be redirected to Stripe.`);
    
    return {
      sessionId,
      url: checkoutUrl
    };
  };

  const handleCancelStripeSubscription = async (subscriptionId: string, immediate = false) => {
    showWarning('Subscription Canceled', `Subscription ${subscriptionId} has been ${immediate ? 'immediately canceled' : 'scheduled for cancellation at period end'}.`);
  };

  const handleResumeStripeSubscription = async (subscriptionId: string) => {
    showSuccess('Subscription Resumed!', `Subscription ${subscriptionId} has been resumed.`);
  };

  const handleCreateBillingPortalSession = async (customerId: string, returnUrl: string) => {
    const portalUrl = `https://billing.stripe.com/p/session/demo_${Date.now()}?return_url=${encodeURIComponent(returnUrl)}`;
    
    showInfo('Billing Portal', 'In a real app, user would be redirected to Stripe billing portal.');
    
    return { url: portalUrl };
  };

  const handleCreateStripeCustomer = async (params: any) => {
    const newCustomer = {
      id: generateId(),
      email: params.email,
      name: params.name,
      stripeCustomerId: `cus_${Date.now()}`
    };
    
    showSuccess('Customer Created!', `Stripe customer created for ${params.email}.`);
    return newCustomer;
  };

  const handleUpdateStripeSubscription = async (params: any) => {
    const updatedSubscription = {
      ...stripeSubscriptions[0],
      ...params,
      cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false
    };
    
    showInfo('Subscription Updated!', `Subscription ${params.subscriptionId} has been updated.`);
    return updatedSubscription;
  };

  // Assessment callback handlers
  const handleCreateAssessment = async (assessmentData: any) => {
    console.log('📝 Creating assessment:', assessmentData);
    const newAssessment = {
      ...assessmentData,
      id: `assessment-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setAssessments(prev => ({ ...prev, [newAssessment.id]: newAssessment }));
    showSuccess('Assessment Created', `"${assessmentData.title}" has been created successfully.`);
  };

  const handleLoadAssessments = async (courseId: string) => {
    console.log('📚 Loading assessments for course:', courseId);
    showInfo('Assessments Loaded', `Loaded assessments for course ${courseId}`);
  };

  const handleStartAssessment = async (assessmentId: string, studentId: string) => {
    console.log('🚀 Starting assessment:', { assessmentId, studentId });
    const newSubmission = {
      id: `submission-${Date.now()}`,
      assessmentId,
      studentId,
      studentName: mockUser.profile.displayName,
      startedAt: new Date(),
      timeSpent: 0,
      attemptNumber: 1,
      answers: [],
      status: 'in_progress' as const
    };
    setAssessmentSubmissions(prev => ({
      ...prev,
      [assessmentId]: [...(prev[assessmentId] || []), newSubmission]
    }));
    showInfo('Assessment Started', 'You can now begin the assessment.');
    return newSubmission;
  };

  const handleSubmitAnswer = async (submissionId: string, questionId: string, answer: any, timeSpent: number) => {
    console.log('💭 Submitting answer:', { submissionId, questionId, answer, timeSpent });
    showInfo('Answer Saved', 'Your answer has been saved.');
  };

  const handleSubmitAssessment = async (submissionId: string) => {
    console.log('📋 Submitting assessment:', submissionId);
    setAssessmentSubmissions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(assessmentId => {
        updated[assessmentId] = updated[assessmentId].map(sub =>
          sub.id === submissionId
            ? { ...sub, status: 'submitted' as const, submittedAt: new Date() }
            : sub
        );
      });
      return updated;
    });
    showSuccess('Assessment Submitted', 'Your assessment has been submitted for grading.');
  };

  const handleGradeSubmission = async (submissionId: string, grades: any[], feedback?: string) => {
    console.log('🎯 Grading submission:', { submissionId, grades, feedback });
    showSuccess('Assessment Graded', 'The assessment has been graded successfully.');
  };

  const handleLoadGradeBook = async (courseId: string) => {
    console.log('📊 Loading gradebook for course:', courseId);
    showInfo('Gradebook Loaded', `Gradebook loaded for course ${courseId}`);
  };

  const handleUpdateAssessment = async (assessment: any) => {
    console.log('✏️ Updating assessment:', assessment);
    setAssessments(prev => ({ ...prev, [assessment.id]: assessment }));
    showSuccess('Assessment Updated', 'Assessment has been updated successfully.');
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    console.log('🗑️ Deleting assessment:', assessmentId);
    setAssessments(prev => {
      const updated = { ...prev };
      delete updated[assessmentId];
      return updated;
    });
    setAssessmentSubmissions(prev => {
      const updated = { ...prev };
      delete updated[assessmentId];
      return updated;
    });
    showSuccess('Assessment Deleted', 'Assessment has been deleted successfully.');
  };

  // Course Data callback handlers
  const handleLoadCourseDataCourses = async (userId?: string, includeEnrollments?: boolean) => {
    console.log('📚 Loading courses:', { userId, includeEnrollments });
    showInfo('Courses Loaded', 'Course catalog has been refreshed.');
  };

  const handleLoadCourseDataCourse = async (courseId: string, userId?: string) => {
    console.log('📖 Loading course:', { courseId, userId });
    showInfo('Course Loaded', `Course ${courseId} details loaded.`);
  };

  const handleCreateCourseDataCourse = async (courseData: any) => {
    console.log('➕ Creating course:', courseData);
    const newCourse = {
      ...courseData,
      id: `course-${Date.now()}`,
      analytics: {
        totalEnrollments: 0,
        totalCompletions: 0,
        averageRating: 0,
        totalRevenue: 0
      },
      metadata: {
        ...courseData.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    setCourseDataCourses(prev => ({ ...prev, [newCourse.id]: newCourse }));
    showSuccess('Course Created', `"${courseData.title}" has been created successfully.`);
  };

  const handleUpdateCourseDataCourse = async (courseId: string, updates: any) => {
    console.log('✏️ Updating course:', { courseId, updates });
    setCourseDataCourses(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        ...updates,
        metadata: {
          ...prev[courseId].metadata,
          updatedAt: new Date()
        }
      }
    }));
    showSuccess('Course Updated', 'Course has been updated successfully.');
  };

  const handleDeleteCourseDataCourse = async (courseId: string) => {
    console.log('🗑️ Deleting course:', courseId);
    setCourseDataCourses(prev => {
      const updated = { ...prev };
      delete updated[courseId];
      return updated;
    });
    showSuccess('Course Deleted', 'Course has been deleted successfully.');
  };

  const handleEnrollInCourseData = async (courseId: string, userId: string, paymentId?: string) => {
    console.log('🎓 Enrolling in course:', { courseId, userId, paymentId });
    const course = courseDataCourses[courseId];
    if (course) {
      const newEnrollment = {
        id: `enrollment-${Date.now()}`,
        userId,
        courseId,
        enrolledAt: new Date(),
        status: 'active' as const,
        progress: {
          userId,
          courseId,
          enrolledAt: new Date(),
          lastAccessedAt: new Date(),
          progressPercentage: 0,
          lessonsCompleted: [],
          quizScores: {},
          assignmentSubmissions: {},
          totalTimeSpent: 0
        },
        amountPaid: course.price,
        currency: course.currency
      };
      showSuccess('Enrollment Successful', `You've been enrolled in "${course.title}"`);
    }
  };

  const handleUpdateCourseProgress = async (courseId: string, userId: string, lessonId?: string, completed?: boolean, timeSpent?: number, score?: number) => {
    console.log('📈 Updating course progress:', { courseId, userId, lessonId, completed, timeSpent, score });
    showInfo('Progress Updated', lessonId ? `Lesson progress updated` : 'Course progress updated');
  };

  const handleCreateCourseLesson = async (lessonData: any) => {
    console.log('📝 Creating lesson:', lessonData);
    const newLesson = {
      ...lessonData,
      id: `lesson-${Date.now()}`,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft' as const
      }
    };
    showSuccess('Lesson Created', `"${lessonData.title}" has been created.`);
  };

  const handleUpdateCourseLesson = async (lessonId: string, updates: any) => {
    console.log('✏️ Updating lesson:', { lessonId, updates });
    showSuccess('Lesson Updated', 'Lesson has been updated successfully.');
  };

  const handleLessonCompleted = async (courseId: string, moduleId: string, lessonId: string, userId: string, score?: number, timeSpent?: number) => {
    console.log('🎯 Lesson completed:', { courseId, moduleId, lessonId, userId, score, timeSpent });
    
    // Emit lesson completed event
    newEventBus.emit(EVENTS.LESSON_COMPLETED, { 
      courseId, 
      moduleId, 
      lessonId, 
      userId, 
      score, 
      timeSpent,
      completedAt: new Date()
    }, 'classroom');
    
    showSuccess('Lesson Completed!', `Lesson completed with ${score ? `score: ${score}%` : 'success'}`);
  };

  const handleModuleCompleted = async (courseId: string, moduleId: string, userId: string, averageScore?: number, totalTimeSpent?: number) => {
    console.log('🏆 Module completed:', { courseId, moduleId, userId, averageScore, totalTimeSpent });
    
    // Emit module completed event
    newEventBus.emit(EVENTS.MODULE_COMPLETED, { 
      courseId, 
      moduleId, 
      userId, 
      averageScore, 
      totalTimeSpent,
      completedAt: new Date()
    }, 'classroom');
    
    showSuccess('Module Completed!', `Module completed${averageScore ? ` with average score: ${averageScore}%` : ''}!`);
  };

  const handleCourseCompleted = async (courseId: string, userId: string, finalScore?: number, totalTimeSpent?: number, certificateEligible?: boolean) => {
    console.log('🎓 Course completed:', { courseId, userId, finalScore, totalTimeSpent, certificateEligible });
    
    // Emit course completed event
    newEventBus.emit(EVENTS.COURSE_COMPLETED, { 
      courseId, 
      userId, 
      finalScore, 
      totalTimeSpent,
      certificateEligible,
      completedAt: new Date()
    }, 'classroom');
    
    if (certificateEligible) {
      showSuccess('Course Completed!', `Congratulations! You've earned a certificate with ${finalScore}% score!`);
    } else {
      showSuccess('Course Completed!', `Course completed${finalScore ? ` with score: ${finalScore}%` : ''}!`);
    }
  };

  const handleSetCourseFilters = (filters: any) => {
    console.log('🔍 Setting course filters:', filters);
  };

  const handleSetCourseSorting = (sortBy: any, sortOrder: any) => {
    console.log('📊 Setting course sorting:', { sortBy, sortOrder });
  };

  // External Services callback handlers
  const handleInitializeExternalServices = async (services: any[]) => {
    console.log('🔌 Initializing external services:', services);
    showInfo('Services Initialized', `${services.length} external services initialized.`);
  };

  const handleTestExternalConnection = async (serviceId: string) => {
    console.log('🔍 Testing connection for service:', serviceId);
    const service = externalServices[serviceId];
    if (service) {
      if (service.enabled) {
        showSuccess('Connection Test', `${service.name} connection is healthy.`);
      } else {
        showWarning('Service Disabled', `${service.name} is currently disabled.`);
      }
    }
  };

  const handleSendExternalEmail = async (to: string | string[], subject: string, body?: string, template?: string, data?: any) => {
    console.log('📧 Sending email:', { to, subject, template, data });
    showSuccess('Email Sent', `Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`);
  };

  const handleUploadExternalFile = async (file: File, path?: string, metadata?: any) => {
    console.log('📁 Uploading file:', { fileName: file.name, size: file.size, path, metadata });
    showInfo('File Upload', `File "${file.name}" uploaded successfully.`);
  };

  const handleGenerateExternalContent = async (prompt: string, contentType?: string, options?: any) => {
    console.log('🤖 Generating content:', { prompt, contentType, options });
    showSuccess('Content Generated', 'AI content generated successfully.');
  };

  const handleAddExternalService = (service: any) => {
    console.log('➕ Adding external service:', service);
    setExternalServices(prev => ({ ...prev, [service.id]: service }));
    showSuccess('Service Added', `${service.name} has been added successfully.`);
  };

  const handleUpdateExternalService = (service: any) => {
    console.log('✏️ Updating external service:', service);
    setExternalServices(prev => ({ ...prev, [service.id]: service }));
    showSuccess('Service Updated', `${service.name} has been updated successfully.`);
  };

  const handleRemoveExternalService = (serviceId: string) => {
    console.log('🗑️ Removing external service:', serviceId);
    const service = externalServices[serviceId];
    setExternalServices(prev => {
      const updated = { ...prev };
      delete updated[serviceId];
      return updated;
    });
    showSuccess('Service Removed', `${service?.name || serviceId} has been removed.`);
  };

  const handleSendExternalWebhook = async (url: string, payload: any) => {
    console.log('🔗 Sending webhook:', { url, payload });
    showInfo('Webhook Sent', `Webhook sent to ${url}`);
  };

  // Feature Flags callback handlers
  const handleInitializeFeatureFlags = async (config: any) => {
    console.log('🎛️ Initializing feature flags:', config);
    showInfo('Feature Flags Initialized', `Initialized with ${config.defaultFlags?.length || 0} flags.`);
  };

  const handleLoadFeatureFlags = async (userId?: string, userContext?: Record<string, any>) => {
    console.log('📥 Loading feature flags:', { userId, userContext });
    showInfo('Flags Loaded', 'Feature flags refreshed successfully.');
  };

  const handleEvaluateFeatureFlag = async (flagId: string, userId?: string, userContext?: Record<string, any>, defaultValue?: boolean) => {
    console.log('🔍 Evaluating flag:', { flagId, userId, userContext, defaultValue });
    const flag = featureFlagsFlags[flagId];
    if (flag) {
      showInfo('Flag Evaluated', `${flag.name}: ${flag.enabled ? 'Enabled' : 'Disabled'}`);
    }
  };

  const handleUpdateFeatureFlag = async (flag: any) => {
    console.log('✏️ Updating feature flag:', flag);
    showSuccess('Flag Updated', `${flag.name} has been updated successfully.`);
  };

  const handleAddFeatureFlagPermission = (permission: any) => {
    console.log('➕ Adding permission rule:', permission);
    showSuccess('Permission Added', `${permission.name} permission rule has been added.`);
  };

  const handleRemoveFeatureFlagPermission = (permissionId: string) => {
    console.log('🗑️ Removing permission rule:', permissionId);
    const permission = featureFlagsPermissions[permissionId];
    showSuccess('Permission Removed', `${permission?.name || permissionId} permission rule has been removed.`);
  };

  const handleTestFeatureFlag = async (flagId: string, userId: string) => {
    console.log('🧪 Testing feature flag:', { flagId, userId });
    const flag = featureFlagsFlags[flagId];
    if (flag) {
      // Simple test logic - in real implementation this would use complex evaluation
      const result = flag.enabled && (mockUser.role === 'creator' || flag.conditions?.userRoles?.includes(mockUser.role));
      showInfo('Flag Test Result', `${flag.name}: ${result ? 'Enabled' : 'Disabled'} for current user`);
      return result;
    }
    return false;
  };

  // Auth mock data
  const [authUsers] = React.useState([
    {
      id: 'user-1',
      email: 'demo@example.com',
      name: 'John Doe',
      avatar: null,
      role: 'admin' as const,
      isVerified: true,
      metadata: { plan: 'pro', signUpSource: 'website' },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    },
    {
      id: 'user-2',
      email: 'instructor@example.com',
      name: 'Jane Smith',
      avatar: null,
      role: 'instructor' as const,
      isVerified: true,
      metadata: { plan: 'pro', signUpSource: 'invite' },
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date()
    },
    {
      id: 'user-3',
      email: 'student@example.com',
      name: 'Bob Johnson',
      avatar: null,
      role: 'student' as const,
      isVerified: false,
      metadata: { plan: 'basic', signUpSource: 'google' },
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date()
    },
    {
      id: 'user-4',
      email: 'locked@example.com',
      name: 'Locked User',
      avatar: null,
      role: 'student' as const,
      isVerified: true,
      metadata: { plan: 'basic', signUpSource: 'website' },
      createdAt: new Date('2024-03-15'),
      updatedAt: new Date()
    }
  ]);

  const [currentAuthSession] = React.useState({
    user: authUsers[0],
    accessToken: 'demo_access_token_123',
    refreshToken: 'demo_refresh_token_456',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
  });

  const [authConfig] = React.useState({
    provider: 'local' as const,
    requireEmailVerification: true,
    allowSocialLogin: true,
    socialProviders: ['google', 'github', 'discord'] as const,
    passwordMinLength: 8,
    sessionTimeout: 60, // minutes
    maxLoginAttempts: 5,
    lockoutDuration: 30 // minutes
  });

  const [authLoginAttempts] = React.useState({
    'user-3': 2,
    'user-4': 5
  });

  const [authLockedUsers] = React.useState({
    'user-4': new Date(Date.now() - 10 * 60 * 1000) // locked 10 minutes ago
  });

  // Auth callback handlers
  const handleSignIn = async (credentials: any) => {
    console.log('🔐 Signing in:', credentials);
    showSuccess('Sign In Successful', `Welcome back, ${credentials.email}!`);
  };

  const handleSignUp = async (credentials: any) => {
    console.log('📝 Signing up:', credentials);
    showSuccess('Sign Up Successful', `Welcome ${credentials.name || credentials.email}! Please check your email for verification.`);
  };

  const handleSignOut = async () => {
    console.log('🚪 Signing out');
    showInfo('Signed Out', 'You have been signed out successfully.');
  };

  const handleUpdateAuthUser = async (userId: string, updates: any) => {
    console.log('👤 Updating user:', { userId, updates });
    const user = authUsers.find(u => u.id === userId);
    showSuccess('User Updated', `${user?.name || userId} has been updated successfully.`);
  };

  const handleDeleteAuthUser = async (userId: string) => {
    console.log('🗑️ Deleting user:', userId);
    const user = authUsers.find(u => u.id === userId);
    showWarning('User Deleted', `${user?.name || userId} has been deleted permanently.`);
  };

  const handleResetPassword = async (email: string) => {
    console.log('🔄 Resetting password for:', email);
    showInfo('Password Reset', `Password reset instructions sent to ${email}.`);
  };

  const handleUpdatePassword = async (userId: string, newPassword: string) => {
    console.log('🔑 Updating password for:', userId);
    const user = authUsers.find(u => u.id === userId);
    showSuccess('Password Updated', `Password for ${user?.name || userId} has been updated.`);
  };

  const handleSendVerificationEmail = async (userId: string) => {
    console.log('📧 Sending verification email to:', userId);
    const user = authUsers.find(u => u.id === userId);
    showInfo('Verification Email Sent', `Verification email sent to ${user?.email || userId}.`);
  };

  const handleVerifyEmail = async (token: string) => {
    console.log('✅ Verifying email with token:', token);
    showSuccess('Email Verified', 'Email address has been verified successfully.');
  };

  const handleSignInWithProvider = async (provider: string) => {
    console.log('🔗 Signing in with provider:', provider);
    showSuccess('OAuth Sign In', `Successfully signed in with ${provider}.`);
  };

  const handleUnlockUser = async (userId: string) => {
    console.log('🔓 Unlocking user:', userId);
    const user = authUsers.find(u => u.id === userId);
    showSuccess('User Unlocked', `${user?.name || userId} has been unlocked.`);
  };

  const handleUpdateAuthConfig = async (config: any) => {
    console.log('⚙️ Updating auth config:', config);
    showSuccess('Configuration Updated', 'Authentication configuration has been updated.');
  };

  // Course Publishing mock data
  const [coursePublishingInfo] = React.useState({
    'course-1': {
      courseId: 'course-1',
      status: 'published' as const,
      visibility: 'public' as const,
      pricing: 'paid' as const,
      price: 99,
      currency: 'USD',
      publishedAt: new Date('2024-01-15'),
      submittedForReviewAt: new Date('2024-01-10'),
      reviewedAt: new Date('2024-01-12'),
      reviewedBy: 'Review Team',
      metadata: {
        title: 'Complete Web Development Bootcamp',
        description: 'Learn HTML, CSS, JavaScript, React, Node.js, and more in this comprehensive web development course.',
        shortDescription: 'Master modern web development with hands-on projects',
        category: 'Web Development',
        subcategory: 'Full Stack',
        tags: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
        level: 'intermediate' as const,
        language: 'English',
        duration: 2400, // 40 hours
        totalLessons: 120,
        whatYouWillLearn: [
          'Build responsive websites with HTML and CSS',
          'Create interactive web applications with JavaScript',
          'Develop modern apps with React',
          'Build APIs with Node.js and Express',
          'Work with databases'
        ],
        requirements: [
          'Basic computer skills',
          'No prior programming experience required'
        ],
        targetAudience: [
          'Beginners wanting to learn web development',
          'Career changers',
          'Students'
        ]
      },
      seo: {
        metaTitle: 'Complete Web Development Bootcamp - Learn Full Stack Development',
        metaDescription: 'Master web development with our comprehensive bootcamp. Learn HTML, CSS, JavaScript, React, and Node.js.',
        keywords: ['web development', 'HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
        slug: 'complete-web-development-bootcamp'
      },
      marketing: {
        featured: true,
        promotionalText: 'Join 50,000+ students already enrolled!',
        discountPercentage: 20,
        discountValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        testimonials: [
          {
            id: 'test-1',
            studentName: 'Sarah Johnson',
            rating: 5,
            text: 'This course changed my career! I went from complete beginner to landing my first developer job.',
            date: new Date('2024-02-01')
          },
          {
            id: 'test-2',
            studentName: 'Mike Chen',
            rating: 5,
            text: 'Excellent course structure and hands-on projects. Highly recommended!',
            date: new Date('2024-02-15')
          }
        ]
      }
    },
    'course-2': {
      courseId: 'course-2',
      status: 'review' as const,
      visibility: 'unlisted' as const,
      pricing: 'free' as const,
      submittedForReviewAt: new Date('2024-03-01'),
      metadata: {
        title: 'Introduction to Python Programming',
        description: 'Learn Python programming from scratch with practical examples and exercises.',
        shortDescription: 'Python basics for beginners',
        category: 'Programming',
        subcategory: 'Python',
        tags: ['Python', 'Programming', 'Beginner'],
        level: 'beginner' as const,
        language: 'English',
        duration: 1200, // 20 hours
        totalLessons: 80,
        whatYouWillLearn: [
          'Python syntax and fundamentals',
          'Data structures and algorithms',
          'Object-oriented programming',
          'File handling and modules'
        ],
        requirements: ['Computer with internet access'],
        targetAudience: ['Programming beginners', 'Students', 'Professionals']
      },
      seo: {
        keywords: ['python', 'programming', 'beginner'],
        slug: 'intro-to-python-programming'
      },
      marketing: {
        featured: false,
        testimonials: []
      }
    }
  });

  const [coursePublishingReviews] = React.useState({
    'course-1': [
      {
        id: 'review-1',
        courseId: 'course-1',
        reviewerId: 'reviewer-1',
        reviewerName: 'Alex Review',
        status: 'approved' as const,
        feedback: 'Excellent course content and structure. All quality standards met.',
        checklist: {
          contentQuality: true,
          audioVideoQuality: true,
          courseCurriculum: true,
          instructorPresentation: true,
          technicalRequirements: true,
          communityGuidelines: true
        },
        reviewedAt: new Date('2024-01-12')
      }
    ]
  });

  const [coursePublishingMarketplace] = React.useState({
    'course-1': {
      courseId: 'course-1',
      publishingInfo: coursePublishingInfo['course-1'],
      statistics: {
        totalEnrollments: 15420,
        activeStudents: 8930,
        completionRate: 0.78,
        averageRating: 4.8,
        totalRatings: 2840,
        revenue: 125000,
        viewCount: 89340,
        lastActivityAt: new Date()
      }
    }
  });

  const [availableCoursesForPublishing] = React.useState([
    {
      id: 'course-1',
      title: 'Complete Web Development Bootcamp',
      description: 'Learn HTML, CSS, JavaScript, React, Node.js, and more'
    },
    {
      id: 'course-2',
      title: 'Introduction to Python Programming',
      description: 'Learn Python programming from scratch'
    },
    {
      id: 'course-3',
      title: 'Advanced React Patterns',
      description: 'Master advanced React concepts and patterns'
    }
  ]);

  // Course Publishing callback handlers
  const handleInitializeCoursePublishing = async (courseId: string) => {
    console.log('📚 Initializing course publishing for:', courseId);
    showInfo('Publishing Initialized', `Course ${courseId} publishing settings loaded.`);
  };

  const handleSubmitForReview = async (courseId: string, publishingInfo: any) => {
    console.log('📝 Submitting course for review:', { courseId, publishingInfo });
    const course = availableCoursesForPublishing.find(c => c.id === courseId);
    showInfo('Review Submitted', `${course?.title || courseId} has been submitted for review.`);
  };

  const handlePublishCourse = async (courseId: string, publishingInfo: any) => {
    console.log('🚀 Publishing course:', { courseId, publishingInfo });
    const course = availableCoursesForPublishing.find(c => c.id === courseId);
    showSuccess('Course Published', `${course?.title || courseId} is now live on the marketplace!`);
  };

  const handleUnpublishCourse = async (courseId: string) => {
    console.log('📦 Unpublishing course:', courseId);
    const course = availableCoursesForPublishing.find(c => c.id === courseId);
    showWarning('Course Unpublished', `${course?.title || courseId} has been removed from the marketplace.`);
  };

  const handleReviewCourse = async (courseId: string, review: any) => {
    console.log('✅ Reviewing course:', { courseId, review });
    const course = availableCoursesForPublishing.find(c => c.id === courseId);
    showSuccess('Review Completed', `Review submitted for ${course?.title || courseId}.`);
  };

  const handleUpdateMarketplaceEntry = async (courseId: string, updates: any) => {
    console.log('📊 Updating marketplace entry:', { courseId, updates });
    showSuccess('Marketplace Updated', 'Course marketplace information has been updated.');
  };

  const handleUpdatePublishingInfo = async (courseId: string, updates: any) => {
    console.log('📝 Updating publishing info:', { courseId, updates });
    showSuccess('Publishing Info Updated', 'Course publishing information has been updated.');
  };

  const handleValidateCourse = async (courseId: string) => {
    console.log('🔍 Validating course for publishing:', courseId);
    const course = availableCoursesForPublishing.find(c => c.id === courseId);
    
    // Mock validation - return some errors for demo
    const mockErrors = courseId === 'course-2' ? [
      'Course thumbnail image is required',
      'Price must be set for paid courses',
      'Learning objectives need at least 3 items'
    ] : [];
    
    if (mockErrors.length > 0) {
      showWarning('Validation Issues', `Found ${mockErrors.length} issues that need to be addressed.`);
    } else {
      showSuccess('Validation Passed', `${course?.title || courseId} is ready for publishing!`);
    }
    
    return mockErrors;
  };

  // Custom theme with green buttons
  const customTheme = {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      secondary: '#22c55e', // Change from blue to green
      accent: '#16a34a', // Darker green for accents
    }
  };

  // Mock user and community data
  const mockUser = {
    id: 'user-1',
    email: 'demo@example.com',
    profile: {
      displayName: 'John Doe',
      bio: 'Fitness enthusiast and community creator',
      avatar: null,
      timezone: 'America/New_York',
      location: 'New York, USA',
      groupname: 'courzey'
    },
    role: 'creator' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCommunity = {
    id: 'community-1',
    name: '🏋️ Fitness Masters',
    slug: 'fitness-masters',
    description: 'Get fit together! Join our community for workouts, nutrition tips, and motivation.',
    ownerId: 'user-1',
    moderators: [],
    access: 'free' as const,
    settings: {
      approval: 'instant' as const,
      visibility: 'public' as const,
      inviteOnly: false,
      features: {
        courses: true,
        events: true,
        messaging: true,
        leaderboard: true,
        badges: true,
        merch: true
      },
      gamification: {
        pointsPerLike: 1,
        pointsPerPost: 5,
        pointsPerComment: 2,
        enableLevels: true,
        customBadges: []
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        weeklyDigest: true
      }
    },
    stats: {
      memberCount: 1250,
      postCount: 3420,
      courseCount: 12,
      eventCount: 8,
      revenue: 45000
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    theme: customTheme
  } as any;

  React.useEffect(() => {
    console.log('🔧 Registering plugins...');
    console.log('courseBuilderPlugin:', courseBuilderPlugin);
    console.log('messagingPlugin:', messagingPlugin);
    console.log('communitySidebarPlugin:', communitySidebarPlugin);
    console.log('communityPlugin:', communityPlugin);
    console.log('classroomPlugin:', classroomPlugin);
    console.log('aboutPlugin:', aboutPlugin);
    console.log('membersPlugin:', membersPlugin);
    console.log('merchandisePlugin:', merchandisePlugin);
    console.log('calendarPlugin:', calendarPlugin);
    console.log('leaderboardPlugin:', leaderboardPlugin);
    console.log('communityMyProfilePlugin:', communityMyProfilePlugin);
    
    // Register new plugins (dependencies first)
    pluginRegistry.register(courseBuilderPlugin);
    pluginRegistry.register(messagingPlugin);
    pluginRegistry.register(communitySidebarPlugin);
    pluginRegistry.register(communityPlugin);
    pluginRegistry.register(classroomPlugin);
    pluginRegistry.register(aboutPlugin);
    pluginRegistry.register(membersPlugin);
    pluginRegistry.register(merchandisePlugin);
    pluginRegistry.register(calendarPlugin);
    pluginRegistry.register(leaderboardPlugin);
    pluginRegistry.register(communityMyProfilePlugin);
    pluginRegistry.register(certificatesPlugin);
    pluginRegistry.register(analyticsPlugin);
    pluginRegistry.register(userManagementPlugin);
    pluginRegistry.register(stripePlugin);
    pluginRegistry.register(assessmentPlugin);
    pluginRegistry.register(courseDataPlugin);
    pluginRegistry.register(externalServicesPlugin);
    pluginRegistry.register(featureFlagsPlugin);
    pluginRegistry.register(authPlugin);
    pluginRegistry.register(coursePublishingPlugin);
    
    // Install plugins automatically (dependencies will be auto-installed)
    pluginRegistry.install('course-builder');
    
    // Install dependencies first, then community plugin
    console.log('🔄 Installing messaging plugin...');
    pluginRegistry.install('messaging');
    console.log('🔄 Installing community-sidebar plugin...');
    pluginRegistry.install('community-sidebar');
    console.log('🔄 Installing community plugin...');
    pluginRegistry.install('community');
    pluginRegistry.install('classroom');
    pluginRegistry.install('about');
    pluginRegistry.install('members');
    pluginRegistry.install('merchandise');
    pluginRegistry.install('calendar');
    pluginRegistry.install('leaderboard');
    pluginRegistry.install('community-my-profile');
    pluginRegistry.install('certificates');
    pluginRegistry.install('analytics');
    pluginRegistry.install('user-management');
    pluginRegistry.install('stripe');
    pluginRegistry.install('assessment');
    pluginRegistry.install('course-data');
    pluginRegistry.install('external-services');
    pluginRegistry.install('feature-flags');
    pluginRegistry.install('auth');
    pluginRegistry.install('course-publishing');
    
    // Get installed plugins (exclude course-builder as it's not shown as a tab)
    const installed = pluginRegistry.getInstalledPlugins().filter(p => p.id !== 'course-builder');
    setInstalledPlugins(installed);
    if (installed.length > 0 && !activeTab) {
      setActiveTab(installed[0].id);
    }
    
    // Set up cross-plugin event listeners
    const unsubscribers: (() => void)[] = [];
    
    // Global event listener to track all events for debugging
    const originalEmit = newEventBus.emit.bind(newEventBus);
    newEventBus.emit = (event: string, data: any, pluginId?: string) => {
      // Update recent events state
      setRecentEvents(prev => [{
        event,
        data,
        timestamp: new Date(),
        pluginId
      }, ...prev.slice(0, 9)]); // Keep last 10 events
      
      // Call original emit
      return originalEmit(event, data, pluginId);
    };
    
    // Listen for course events from classroom plugin
    unsubscribers.push(
      newEventBus.on(EVENTS.COURSE_CREATED, (data) => {
        console.log('📚 Course created event received:', data);
        // Community plugin could react to new courses
        if (activeTab === 'community') {
          showInfo('New Course Available!', `Check out "${data.course.title}" in the classroom.`);
        }
      }, 'demo-listener')
    );
    
    // Listen for post events from community plugin
    unsubscribers.push(
      newEventBus.on(EVENTS.POST_CREATED, (data) => {
        console.log('💬 Post created event received:', data);
        // Classroom plugin could react to community engagement
        if (activeTab === 'classroom') {
          showInfo('Community Activity!', 'New post in the community feed.');
        }
      }, 'demo-listener')
    );
    
    // Listen for lesson completion events
    unsubscribers.push(
      newEventBus.on(EVENTS.LESSON_COMPLETED, (data) => {
        console.log('✅ Lesson completed event received:', data);
        showSuccess('Lesson Completed!', `Great job finishing "${data.lessonTitle}"`);
        
        // Check for achievements
        const completedLessons = courses.reduce((total, course) => {
          return total + course.modules?.reduce((moduleTotal: number, module: any) => {
            return moduleTotal + (module.lessons?.filter((lesson: any) => lesson.isCompleted).length || 0);
          }, 0) || 0;
        }, 0);
        
        if (completedLessons > 0 && completedLessons % 5 === 0) {
          setTimeout(() => {
            newEventBus.emit(EVENTS.USER_ACHIEVEMENT, {
              type: 'lessons_completed',
              count: completedLessons,
              badge: 'Study Streak'
            }, 'demo-achievements');
            showSuccess('🏆 Achievement Unlocked!', `Completed ${completedLessons} lessons!`);
          }, 1000);
        }
      }, 'demo-listener')
    );
    
    // Listen for plugin activation events
    unsubscribers.push(
      newEventBus.on(EVENTS.PLUGIN_ACTIVATED, (data) => {
        console.log('🔌 Plugin activated:', data);
        showInfo('Plugin Activated', `${data.pluginName} is now active.`);
      }, 'demo-listener')
    );
    
    // Initialize with empty courses array
    setCourses([]);
    
    // Emit plugin activation events for demo
    setTimeout(() => {
      installed.forEach(plugin => {
        newEventBus.emit(EVENTS.PLUGIN_ACTIVATED, { 
          pluginId: plugin.id, 
          pluginName: plugin.name 
        }, 'demo-system');
      });
    }, 1000);
    
    // Cleanup event listeners on unmount
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);


  const ActivePluginComponent = React.useMemo(() => {
    return activeTab ? pluginRegistry.getThemedPlugin(activeTab)?.component : null;
  }, [activeTab]);

    
  console.log('🎨 Current activeTab:', activeTab);
  console.log('🧩 ActivePluginComponent:', ActivePluginComponent);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            
            {/* Left - Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Plugin System Demo</h1>
            </div>
            
            {/* Right - Buttons */}
            <div className="flex items-center space-x-3">
              {/* Storage Backend Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Storage:</label>
                <select
                  value={storageBackend}
                  onChange={(e) => handleStorageBackendChange(e.target.value as typeof storageBackend)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="localStorage">Local Storage</option>
                  <option value="indexedDB">IndexedDB</option>
                </select>
              </div>
              
              {/* Reseed Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reseed-checkbox"
                  checked={reseedFromMock}
                  onChange={(e) => setReseedFromMock(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="reseed-checkbox" className="text-sm font-medium text-gray-700">
                  Reseed data from Mock Data
                </label>
              </div>
              
              {/* Import/Export Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCourses}
                  disabled={courses.length === 0}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    courses.length === 0 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                  }`}
                >
                  Export ({courses.length})
                </button>
                <label className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm">
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportCourses}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              
              <button
                onClick={() => {
                  console.log('Events button clicked, current modal state:', showEventsModal);
                  setShowEventsModal(true);
                }}
                className="relative bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Live Events
                {recentEvents.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {recentEvents.length}
                  </span>
                )}
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8">
          <nav className="flex flex-wrap gap-2 py-2">
            {installedPlugins.map((plugin: {id: string, name: string}) => (
              <button
                key={plugin.id}
                onClick={() => {
                  setActiveTab(plugin.id);
                  newEventBus.emit('demo:tab-changed', { 
                    from: activeTab, 
                    to: plugin.id,
                    pluginName: plugin.name 
                  }, 'demo-ui');
                  showInfo('Plugin Switched', `Now viewing ${plugin.name}`);
                }}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  activeTab === plugin.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                {plugin.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Plugin Content */}
      <div className="max-w-7xl mx-auto">
{(() => {
          if (!ActivePluginComponent) return null;

          // Base props that all plugins receive
          const baseProps = {
            currentUser: mockUser,
            communityId: mockCommunity.id,
            community: {
              ...mockCommunity,
              stats: {
                memberCount: 1250,
                online: 42,
                adminCount: 5
              }
            },
            userRole: "owner" as const,
          };

          // Plugin-specific props mapping (prevents duplicate attributes)
          const pluginPropsMap: Record<string, any> = {
            'messaging': {
              // Use exactly the same props as community plugin
              posts: posts,
              userLikes: userLikes,
              loading: false,
              error: undefined,
              onCreatePost: handleCreatePost,
              onLikePost: handleLikePost,
              onUnlikePost: async (postId: string) => {
                // Toggle unlike (reverse of like logic)
                const post = posts.find((p: any) => p.id === postId);
                if (post && userLikes.has(postId)) {
                  const newUserLikes = new Set(userLikes);
                  newUserLikes.delete(postId);
                  const updatedPosts = posts.map((p: any) => 
                    p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p
                  );
                  setPosts(updatedPosts);
                  setUserLikes(newUserLikes);
                  await savePostsToStorage(updatedPosts);
                  await saveUserLikes(newUserLikes as Set<string>);
                  showInfo('Post Unliked!', 'Like removed from post.');
                }
              },
              onEditPost: handleEditPost,
              onDeletePost: handleDeletePost,
              onAddComment: handleAddComment,
              onLoadComments: handleLoadComments,
              onLikeComment: handleLikeComment,
              onUnlikeComment: handleUnlikeComment,
              onEditComment: handleEditComment,
              onDeleteComment: handleDeleteComment,
              onPinPost: handlePinPost,
              onToggleCommentsForPost: handleToggleCommentsForPost,
              onLoadMore: async () => {
                // Simulated load more functionality
                console.log('Load more posts...');
              },
              onRefresh: async () => {
                // Simulated refresh functionality
                const refreshedPosts = loadPostsFromStorage();
                setPosts(refreshedPosts);
                showInfo('Refreshed!', 'Posts have been refreshed.');
              },
            },
            'community-sidebar': {
              community: {
                ...mockCommunity,
                stats: {
                  memberCount: 1250,
                  online: 42,
                  adminCount: 5
                }
              },
              currentUser: mockUser,
              userRole: 'creator',
            },
            'community': {
              // Posts data for messaging components
              posts: posts,
              userLikes: userLikes,
              loading: false,
              error: undefined,
              
              // Action handlers
              onCreatePost: handleCreatePost,
              onLikePost: handleLikePost,
              onUnlikePost: async (postId: string) => {
                // Toggle unlike (reverse of like logic)
                const post = posts.find(p => p.id === postId);
                if (post && userLikes.has(postId)) {
                  const newUserLikes = new Set(userLikes);
                  newUserLikes.delete(postId);
                  const updatedPosts = posts.map((p: any) => 
                    p.id === postId ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p
                  );
                  setPosts(updatedPosts);
                  setUserLikes(newUserLikes);
                  await savePostsToStorage(updatedPosts);
                  await saveUserLikes(newUserLikes);
                }
              },
              onEditPost: handleEditPost,
              onDeletePost: handleDeletePost,
              onAddComment: handleAddComment,
              onLoadComments: handleLoadComments,
              onLikeComment: handleLikeComment,
              onUnlikeComment: handleUnlikeComment,
              onEditComment: handleEditComment,
              onDeleteComment: handleDeleteComment,
              onLoadMore: async () => {
                // Simulated load more functionality
                console.log('Load more posts...');
              },
              onRefresh: async () => {
                // Simulated refresh functionality
                const refreshedPosts = loadPostsFromStorage();
                setPosts(refreshedPosts);
                showInfo('Refreshed!', 'Posts have been refreshed.');
              },
            },
            'classroom': {
              courses: courses,
              loading: loading,
              error: null,
              onCreateCourse: handleCreateCourse,
              onUpdateCourse: handleUpdateCourse,
              onDeleteCourse: handleDeleteCourse,
              onCloneCourse: handleCloneCourse,
              onLoadCourses: handleLoadCourses,
              onLoadCourse: handleLoadCourse,
              onCreateLesson: handleCreateCourseLesson,
              onUpdateLesson: handleUpdateCourseLesson,
              onUpdateProgress: handleUpdateCourseProgress,
              onEnrollStudent: handleEnrollStudent,
              onLoadUserEnrollments: handleLoadUserEnrollments,
              onLoadCourseEnrollments: handleLoadCourseEnrollments,
              onLessonCompleted: handleLessonCompleted,
              onModuleCompleted: handleModuleCompleted,
              onCourseCompleted: handleCourseCompleted,
              savingStates: savingStates,
            },
            'members': {
              members: members,
            },
            'merchandise': {
              products: products,
            },
            'about': {
              guidelines: guidelines,
            },
            'calendar': {
              events: events,
            },
            'leaderboard': {
              leaderboards: leaderboards,
              levels: levels,
              featuredMember: featuredMember,
              currentUserRank: currentUserRank,
            },
            'community-my-profile': {
              userProfile: userProfile,
              activityData: sampleActivityData,
              ownedCommunities: ownedCommunities,
              memberships: memberships,
              contributions: contributions,
              stats: profileStats,
            },
            'certificates': {
              certificates: certificates,
              settings: certificateSettings,
              onCreateTemplate: handleCreateTemplate,
              onGenerateCertificate: handleGenerateCertificate,
              onVerifyCertificate: handleVerifyCertificate,
              onRevokeCertificate: handleRevokeCertificate,
              onDownloadCertificate: handleDownloadCertificate,
              onShareToLinkedIn: handleShareToLinkedIn,
              onUpdateSettings: handleUpdateCertificateSettings,
            },
            'analytics': {
              config: analyticsConfig,
              events: analyticsEvents,
              userAnalytics: userAnalytics,
              courseAnalytics: courseAnalytics,
              isInitialized: true,
              isTracking: isAnalyticsTracking,
              onInitializeAnalytics: handleInitializeAnalytics,
              onTrackEvent: handleTrackEvent,
              onIdentifyUser: handleIdentifyUser,
              onTrackPageView: handleTrackPageView,
              onUpdateConfig: handleUpdateAnalyticsConfig,
              onToggleTracking: handleToggleAnalyticsTracking,
            },
            'user-management': {
              users: users, // No conflict - user-management gets users
              enrollments: userEnrollments,
              activities: userActivities,
              notifications: userNotifications,
              groups: userGroups,
              onLoadUserProfile: handleLoadUserProfile,
              onUpdateUserProfile: handleUpdateUserProfile,
              onEnrollStudent: handleEnrollStudent,
              onUpdateProgress: handleUpdateProgress,
              onAddActivity: handleAddActivity,
              onSendNotification: handleSendNotification,
              onCreateGroup: handleCreateGroup,
              onMarkNotificationAsRead: handleMarkNotificationAsRead,
              onLoadUserEnrollments: handleLoadUserEnrollments,
              onLoadCourseEnrollments: handleLoadCourseEnrollments,
            },
            'stripe': {
              config: stripeConfig,
              plans: stripePlans,
              customer: stripeCustomer,
              paymentMethods: stripePaymentMethods,
              invoices: stripeInvoices,
              subscriptions: stripeSubscriptions,
              isConfigured: isStripeConfigured,
              isTestMode: stripeConfig.testMode,
              onConfigureStripe: handleConfigureStripe,
              onLoadCustomerData: handleLoadStripeCustomerData,
              onCreateCheckoutSession: handleCreateCheckoutSession,
              onCancelSubscription: handleCancelStripeSubscription,
              onResumeSubscription: handleResumeStripeSubscription,
              onCreateBillingPortalSession: handleCreateBillingPortalSession,
              onCreateCustomer: handleCreateStripeCustomer,
              onUpdateSubscription: handleUpdateStripeSubscription,
            },
            'assessment': {
              assessments: Object.values(assessments),
              submissions: assessmentSubmissions,
              gradeBooks: assessmentGradebooks,
              onCreateAssessment: handleCreateAssessment,
              onLoadAssessments: handleLoadAssessments,
              onStartAssessment: handleStartAssessment,
              onSubmitAnswer: handleSubmitAnswer,
              onSubmitAssessment: handleSubmitAssessment,
              onGradeSubmission: handleGradeSubmission,
              onLoadGradeBook: handleLoadGradeBook,
              onUpdateAssessment: handleUpdateAssessment,
              onDeleteAssessment: handleDeleteAssessment,
            },
            'course-data': {
              courses: courseDataCourses,
              lessons: courseDataLessons,
              enrollments: courseDataEnrollments,
              studentProgress: courseDataStudentProgress,
              onLoadCourses: handleLoadCourseDataCourses,
              onLoadCourse: handleLoadCourseDataCourse,
              onCreateCourse: handleCreateCourseDataCourse,
              onUpdateCourse: handleUpdateCourseDataCourse,
              onDeleteCourse: handleDeleteCourseDataCourse,
              onEnrollInCourse: handleEnrollInCourseData,
              onUpdateProgress: handleUpdateCourseProgress,
              onCreateLesson: handleCreateCourseLesson,
              onUpdateLesson: handleUpdateCourseLesson,
              onSetFilters: handleSetCourseFilters,
              onSetSorting: handleSetCourseSorting,
            },
            'external-services': {
              services: externalServices,
              statuses: externalServiceStatuses,
              usage: externalServiceUsage,
              webhookEvents: externalWebhookEvents,
              onInitializeServices: handleInitializeExternalServices,
              onTestConnection: handleTestExternalConnection,
              onSendEmail: handleSendExternalEmail,
              onUploadFile: handleUploadExternalFile,
              onGenerateContent: handleGenerateExternalContent,
              onAddService: handleAddExternalService,
              onUpdateService: handleUpdateExternalService,
              onRemoveService: handleRemoveExternalService,
              onSendWebhook: handleSendExternalWebhook,
            },
            'feature-flags': {
              featureFlagsConfig: featureFlagsConfig,
              flags: featureFlagsFlags,
              permissions: featureFlagsPermissions,
              userFlags: featureFlagsUserFlags,
              userPermissions: featureFlagsUserPermissions,
              onInitializeFlags: handleInitializeFeatureFlags,
              onLoadFlags: handleLoadFeatureFlags,
              onEvaluateFlag: handleEvaluateFeatureFlag,
              onUpdateFlag: handleUpdateFeatureFlag,
              onAddPermission: handleAddFeatureFlagPermission,
              onRemovePermission: handleRemoveFeatureFlagPermission,
              onTestFlag: handleTestFeatureFlag,
            },
            'auth': {
              users: authUsers, // No conflict - auth gets authUsers
              currentSession: currentAuthSession,
              authConfig: authConfig,
              loginAttempts: authLoginAttempts,
              lockedUsers: authLockedUsers,
              onSignIn: handleSignIn,
              onSignUp: handleSignUp,
              onSignOut: handleSignOut,
              onUpdateUser: handleUpdateAuthUser,
              onDeleteUser: handleDeleteAuthUser,
              onResetPassword: handleResetPassword,
              onUpdatePassword: handleUpdatePassword,
              onSendVerificationEmail: handleSendVerificationEmail,
              onVerifyEmail: handleVerifyEmail,
              onSignInWithProvider: handleSignInWithProvider,
              onUnlockUser: handleUnlockUser,
              onUpdateAuthConfig: handleUpdateAuthConfig,
            },
            'course-publishing': {
              publishingInfo: coursePublishingInfo,
              reviews: coursePublishingReviews,
              marketplaceEntries: coursePublishingMarketplace,
              availableCourses: availableCoursesForPublishing,
              onInitializeCoursePublishing: handleInitializeCoursePublishing,
              onSubmitForReview: handleSubmitForReview,
              onPublishCourse: handlePublishCourse,
              onUnpublishCourse: handleUnpublishCourse,
              onReviewCourse: handleReviewCourse,
              onUpdateMarketplaceEntry: handleUpdateMarketplaceEntry,
              onUpdatePublishingInfo: handleUpdatePublishingInfo,
              onValidateCourse: handleValidateCourse,
            },
          };

          const specificProps = pluginPropsMap[activeTab] || {};

          return React.createElement(ActivePluginComponent, {
            ...baseProps,
            ...specificProps
          });
        })()}
      </div>

      {/* Events Modal */}
      <EventsModal
        isOpen={showEventsModal}
        onClose={() => setShowEventsModal(false)}
        events={recentEvents}
        onClearEvents={() => setRecentEvents([])}
      />
    </div>
  );
};

// Main wrapper component with providers
const NewPluginSystemDemo: React.FC = () => {
  return (
    <ToastProvider>
      <DemoContent />
    </ToastProvider>
  );
};

export default NewPluginSystemDemo;

// Mount if this is the main entry
if (typeof document !== 'undefined') {
  const container = document.getElementById('new-plugin-demo-root');
  if (container) {
    const root = createRoot(container);
    root.render(<NewPluginSystemDemo />);
  }
}