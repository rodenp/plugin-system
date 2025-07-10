import type { Plugin } from '../../types/plugin-interface';
import { pluginRegistry } from '../../store/plugin-registry';
import { PostDetailModal } from './components/PostDetailModal';
import { CommentItem } from './components/CommentItem';
import { ReplyForm } from './components/ReplyForm';
import { CreatePostModal } from './components/CreatePostModal';
import { WritePostSection } from './components/WritePostSection';
import { ContentRenderer } from './components/ContentRenderer';
import { UnifiedCarousel } from './components/UnifiedCarousel';
import { AttachmentDownloadModal } from './components/AttachmentDownloadModal';
import { PostDropdownMenu } from './components/PostDropdownMenu';
import { Messaging } from './Messaging';

export const messagingPlugin: Plugin = {
  id: 'messaging',
  name: 'Messaging',
  component: Messaging,
  dependencies: [], // No dependencies
  icon: '💬',
  order: 1,
  onInstall: async () => {
    // Register components with service registry
    pluginRegistry.registerService('messaging', {
      version: '1.0.0',
      components: {
        PostDetailModal,
        CommentItem,
        ReplyForm,
        CreatePostModal,
        WritePostSection,
        ContentRenderer,
        UnifiedCarousel,
        AttachmentDownloadModal,
        PostDropdownMenu,
        MessagingFeedComponent: Messaging, // Export the feed component for community plugin
      }
    });
    console.log('🔌 Messaging plugin initialized with service registry');
  },
  onUninstall: async () => {
    console.log('🔌 Messaging plugin destroyed');
  }
};

// Export the hook for accessing components
export { useMessagingComponent } from './useMessagingComponent';
export type { MessagingComponents } from './useMessagingComponent';

// Export types
export * from './types';
//export { MessageService } from './message-service';