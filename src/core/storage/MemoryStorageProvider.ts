// In-memory storage provider for testing and development
import { StorageProvider, QueryOptions, Operation, StorageEvent } from './types'

export class MemoryStorageProvider implements StorageProvider {
  private data: Map<string, Map<string, any>> = new Map()
  private subscribers: Map<string, Set<Function>> = new Map()
  private connected = false

  async connect(): Promise<void> {
    this.connected = true
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.subscribers.clear()
  }

  isConnected(): boolean {
    return this.connected
  }

  private getCollection(collection: string): Map<string, any> {
    if (!this.data.has(collection)) {
      this.data.set(collection, new Map())
    }
    return this.data.get(collection)!
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private matchesQuery(item: any, query?: QueryOptions): boolean {
    if (!query?.where) return true
    
    return Object.entries(query.where).every(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle operators like { $gt: 5 }, { $in: [1,2,3] }
        return Object.entries(value).every(([operator, operatorValue]) => {
          switch (operator) {
            case '$eq': return item[key] === operatorValue
            case '$ne': return item[key] !== operatorValue
            case '$gt': return item[key] > operatorValue
            case '$gte': return item[key] >= operatorValue
            case '$lt': return item[key] < operatorValue
            case '$lte': return item[key] <= operatorValue
            case '$in': return Array.isArray(operatorValue) && operatorValue.includes(item[key])
            case '$nin': return Array.isArray(operatorValue) && !operatorValue.includes(item[key])
            default: return true
          }
        })
      }
      return item[key] === value
    })
  }

  private sortResults(items: any[], orderBy?: { field: string; direction: 'asc' | 'desc' }[]): any[] {
    if (!orderBy || orderBy.length === 0) return items

    return [...items].sort((a, b) => {
      for (const { field, direction } of orderBy) {
        const aVal = a[field]
        const bVal = b[field]
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1
        if (aVal > bVal) return direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  async get(collection: string, query?: QueryOptions): Promise<any[]> {
    const coll = this.getCollection(collection)
    let items = Array.from(coll.values()).filter(item => this.matchesQuery(item, query))
    
    // Apply sorting
    if (query?.orderBy) {
      items = this.sortResults(items, query.orderBy)
    }
    
    // Apply pagination
    if (query?.offset) {
      items = items.slice(query.offset)
    }
    if (query?.limit) {
      items = items.slice(0, query.limit)
    }
    
    return items
  }

  async getById(collection: string, id: string): Promise<any | null> {
    const coll = this.getCollection(collection)
    return coll.get(id) || null
  }

  async create(collection: string, data: any): Promise<any> {
    const coll = this.getCollection(collection)
    const id = data.id || this.generateId()
    const item = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    coll.set(id, item)
    this.notifySubscribers(collection, 'created', item)
    return item
  }

  async update(collection: string, id: string, data: any): Promise<any> {
    const coll = this.getCollection(collection)
    const existing = coll.get(id)
    if (!existing) {
      throw new Error(`Item with id ${id} not found in collection ${collection}`)
    }
    
    const updated = {
      ...existing,
      ...data,
      id, // Preserve ID
      updatedAt: new Date()
    }
    
    coll.set(id, updated)
    this.notifySubscribers(collection, 'updated', updated, existing)
    return updated
  }

  async delete(collection: string, id: string): Promise<void> {
    const coll = this.getCollection(collection)
    const existing = coll.get(id)
    if (!existing) {
      throw new Error(`Item with id ${id} not found in collection ${collection}`)
    }
    
    coll.delete(id)
    this.notifySubscribers(collection, 'deleted', null, existing)
  }

  async createMany(collection: string, items: any[]): Promise<any[]> {
    const results = await Promise.all(
      items.map(item => this.create(collection, item))
    )
    return results
  }

  async updateMany(collection: string, updates: { id: string; data: any }[]): Promise<any[]> {
    const results = await Promise.all(
      updates.map(({ id, data }) => this.update(collection, id, data))
    )
    return results
  }

  subscribe(
    collection: string, 
    query: QueryOptions, 
    callback: (data: any[]) => void
  ): () => void {
    const subscriptionKey = `${collection}:${JSON.stringify(query)}`
    
    if (!this.subscribers.has(subscriptionKey)) {
      this.subscribers.set(subscriptionKey, new Set())
    }
    
    const subscribers = this.subscribers.get(subscriptionKey)!
    
    const wrappedCallback = async () => {
      const data = await this.get(collection, query)
      callback(data)
    }
    
    subscribers.add(wrappedCallback)
    
    // Send initial data
    wrappedCallback()
    
    // Return unsubscribe function
    return () => {
      subscribers.delete(wrappedCallback)
      if (subscribers.size === 0) {
        this.subscribers.delete(subscriptionKey)
      }
    }
  }

  async transaction(operations: Operation[]): Promise<any[]> {
    // Simple implementation - in real DB this would be atomic
    const results: any[] = []
    
    for (const op of operations) {
      try {
        switch (op.type) {
          case 'create':
            results.push(await this.create(op.collection, op.data))
            break
          case 'update':
            if (!op.id) throw new Error('Update operation requires id')
            results.push(await this.update(op.collection, op.id, op.data))
            break
          case 'delete':
            if (!op.id) throw new Error('Delete operation requires id')
            await this.delete(op.collection, op.id)
            results.push(null)
            break
        }
      } catch (error) {
        // In real implementation, rollback previous operations
        throw new Error(`Transaction failed at operation ${operations.indexOf(op)}: ${error}`)
      }
    }
    
    return results
  }

  private notifySubscribers(
    collection: string, 
    type: 'created' | 'updated' | 'deleted', 
    data?: any, 
    previousData?: any
  ): void {
    // Notify all subscribers for this collection
    for (const [subscriptionKey, subscribers] of this.subscribers.entries()) {
      if (subscriptionKey.startsWith(`${collection}:`)) {
        subscribers.forEach(callback => {
          // Call callback to refresh data
          (callback as Function)()
        })
      }
    }
  }

  // Development helper methods
  clear(): void {
    this.data.clear()
    this.subscribers.clear()
  }

  getAllData(): Record<string, any[]> {
    const result: Record<string, any[]> = {}
    for (const [collection, items] of this.data.entries()) {
      result[collection] = Array.from(items.values())
    }
    return result
  }

  seed(seedData: Record<string, any[]>): void {
    this.clear()
    for (const [collection, items] of Object.entries(seedData)) {
      for (const item of items) {
        this.create(collection, item)
      }
    }
  }
}