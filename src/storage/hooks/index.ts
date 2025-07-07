// Storage Hooks - Main Export File
// Centralized exports for all React hooks

// Core hooks
export {
  GDPRStorageContext,
  useGDPRStorage,
  useOptionalGDPRStorage
} from './useGDPRStorage';

export {
  useEntity,
  useEntities,
  useEntityMutation
} from './useEntity';

export {
  useStorageStats,
  usePerformanceMonitor,
  useStorageHealth,
  type StorageStatsData
} from './useStorageStats';

// Provider component for easy setup
export { GDPRStorageProvider, withGDPRStorage } from './GDPRStorageProvider';