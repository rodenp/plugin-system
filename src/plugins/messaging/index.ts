import type { Plugin } from '../../types/plugin-interface';
import { PostDetailModal } from './components/PostDetailModal';
import { CommentItem } from './components/CommentItem';
import { ReplyForm } from './components/ReplyForm';
import { CreatePostModal } from './components/CreatePostModal';
import { WritePostSection } from './components/WritePostSection';
import { ContentRenderer } from './components/ContentRenderer';
import { UnifiedCarousel } from './components/UnifiedCarousel';
import { AttachmentDownloadModal } from './components/AttachmentDownloadModal';
import { MessagingDemo } from './MessagingDemo';

export const messagingPlugin: Plugin = {
  id: 'messaging',
  name: 'Messaging',
  component: MessagingDemo,
  dependencies: [], // No dependencies
  icon: '💬',
  order: 1,
  onInstall: async () => {
    // Expose components globally for dependent plugins
    (window as any).__messagingComponents = {
      PostDetailModal,
      CommentItem,
      ReplyForm,
      CreatePostModal,
      WritePostSection,
      ContentRenderer,
      UnifiedCarousel,
      AttachmentDownloadModal,
      MessagingFeedComponent: MessagingDemo, // Export the feed component for community plugin
    };
    console.log('🔌 Messaging plugin initialized');
  },
  onUninstall: async () => {
    // Clean up global components
    delete (window as any).__messagingComponents;
    console.log('🔌 Messaging plugin destroyed');
  }
};

// Export the hook for accessing components
export { useMessagingComponent } from './useMessagingComponent';
export type { MessagingComponents } from './useMessagingComponent';

// Export types
export * from './types';
export { MessageService } from './message-service';