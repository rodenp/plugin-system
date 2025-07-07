// React Context and Hook for GDPR Storage
// Provides React integration for GDPR storage system

import { createContext, useContext } from 'react';
import { GDPRStorage } from '../index';

// GDPR Storage Context
export const GDPRStorageContext = createContext<GDPRStorage | null>(null);

// Hook to get GDPR storage instance
export function useGDPRStorage(): GDPRStorage {
  const storage = useContext(GDPRStorageContext);
  
  if (!storage) {
    throw new Error(
      'useGDPRStorage must be used within a GDPRStorageProvider. ' +
      'Make sure to wrap your component tree with GDPRStorageProvider.'
    );
  }
  
  return storage;
}

// Hook to get GDPR storage instance (nullable)
export function useOptionalGDPRStorage(): GDPRStorage | null {
  return useContext(GDPRStorageContext);
}