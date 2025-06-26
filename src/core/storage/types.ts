// Storage system types and interfaces

export interface QueryOptions {
  where?: Record<string, any>
  orderBy?: { field: string; direction: 'asc' | 'desc' }[]
  limit?: number
  offset?: number
  include?: string[]
}

export interface Operation {
  type: 'create' | 'update' | 'delete'
  collection: string
  id?: string
  data?: any
}

export interface StorageProvider {
  // Basic CRUD operations
  get(collection: string, query?: QueryOptions): Promise<any[]>
  getById(collection: string, id: string): Promise<any | null>
  create(collection: string, data: any): Promise<any>
  update(collection: string, id: string, data: any): Promise<any>
  delete(collection: string, id: string): Promise<void>
  
  // Batch operations
  createMany(collection: string, items: any[]): Promise<any[]>
  updateMany(collection: string, updates: { id: string; data: any }[]): Promise<any[]>
  
  // Real-time subscriptions
  subscribe(
    collection: string, 
    query: QueryOptions, 
    callback: (data: any[]) => void
  ): () => void
  
  // Transactions for complex operations
  transaction(operations: Operation[]): Promise<any[]>
  
  // Connection management
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
}

export interface StorageEvent {
  type: 'created' | 'updated' | 'deleted'
  collection: string
  id: string
  data?: any
  previousData?: any
  timestamp: Date
}