import { useState, useEffect } from 'react';
import type { PostDetailModalProps, CommentItemProps, ReplyFormProps } from './types';

export interface MessagingComponents {
  PostDetailModal: React.ComponentType<PostDetailModalProps>;
  CommentItem: React.ComponentType<CommentItemProps>;
  ReplyForm: React.ComponentType<ReplyFormProps>;
  CreatePostModal: React.ComponentType<any>; // Use any for now since it has internal interface
  MessagingFeedComponent: React.ComponentType<any>; // Feed component for community plugin
}

export function useMessagingComponent<K extends keyof MessagingComponents>(
  componentName: K
): MessagingComponents[K] | null {
  const [component, setComponent] = useState<MessagingComponents[K] | null>(null);
  
  useEffect(() => {
    const checkForComponent = () => {
      const components = (window as any).__messagingComponents;
      if (components && components[componentName]) {
        setComponent(() => components[componentName]);
        return true;
      }
      return false;
    };
    
    // Initial check
    if (!checkForComponent()) {
      // Poll every 100ms for up to 5 seconds
      const interval = setInterval(() => {
        if (checkForComponent()) {
          clearInterval(interval);
        }
      }, 100);
      
      // Cleanup after 5 seconds
      setTimeout(() => clearInterval(interval), 5000);
      
      return () => clearInterval(interval);
    }
  }, [componentName]);
  
  return component;
}