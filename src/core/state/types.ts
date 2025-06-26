// State management types for the new plugin system

import { StorageProvider, QueryOptions } from '../storage/types'
import { CrossPluginCommunication } from '../communication/CrossPluginCommunication'

export interface PluginActions {
  // Data operations
  getData: (collection: string, query?: QueryOptions) => Promise<any[]>
  getById: (collection: string, id: string) => Promise<any | null>
  createItem: (collection: string, data: any) => Promise<any>
  updateItem: (collection: string, id: string, data: any) => Promise<any>
  deleteItem: (collection: string, id: string) => Promise<void>
  
  // Batch operations
  createMany: (collection: string, items: any[]) => Promise<any[]>
  updateMany: (collection: string, updates: { id: string; data: any }[]) => Promise<any[]>
  
  // Real-time subscriptions
  subscribeToData: (collection: string, query: QueryOptions, callback: (data: any[]) => void) => () => void
  
  // Transactions
  transaction: (operations: any[]) => Promise<any[]>
}

export interface PluginData {
  [collection: string]: any[]
}

export interface PluginProps {
  // Core plugin info
  pluginId: string
  
  // User and context
  currentUser: any
  permissions: string[]
  
  // Data access (read-only from plugin perspective)
  data: PluginData
  
  // Actions to modify data
  actions: PluginActions
  
  // Cross-plugin communication
  communication: any // Will be PluginCommunicationInterface
  
  // Theme and config
  theme?: any
  config?: any
}

export interface NewSkoolPlugin {
  id: string
  name: string
  component: React.ComponentType<PluginProps>
  
  // Data requirements for optimization
  dataRequirements?: {
    collections: string[]
    realTimeCollections?: string[]
    permissions?: string[]
  }
  
  // Communication setup
  communicationSetup?: (communication: any) => void
  
  // Lifecycle methods
  onInstall?: () => Promise<void> | void
  
  // Plugin metadata
  version?: string
  description?: string
  icon?: string
  order?: number
}

export interface StateManagerConfig {
  storage: StorageProvider
  communication: CrossPluginCommunication
  enableRealTime?: boolean
  enableOptimisticUpdates?: boolean
}

export interface PluginDataSubscription {
  id: string
  pluginId: string
  collection: string
  query: QueryOptions
  callback: (data: any[]) => void
  unsubscribe: () => void
}