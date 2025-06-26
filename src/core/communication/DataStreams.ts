// Reactive data streams for shared state between plugins

export interface DataStream<T = any> {
  readonly current: T
  subscribe(callback: (data: T) => void): () => void
  update(data: Partial<T>): void
  replace(data: T): void
  reset(): void
}

export interface StreamSubscription<T = any> {
  id: string
  streamId: string
  pluginId: string
  callback: (data: T) => void
}

export class DataStreams {
  private streams = new Map<string, InternalDataStream<any>>()
  private subscriptions = new Map<string, Set<StreamSubscription>>()

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Create a new data stream
   */
  createStream<T>(streamId: string, initialData: T, ownerPlugin?: string): DataStream<T> {
    if (this.streams.has(streamId)) {
      console.warn(`[DataStreams] Stream ${streamId} already exists`)
      return this.getStream<T>(streamId)
    }

    const stream = new InternalDataStream<T>(streamId, initialData, this)
    this.streams.set(streamId, stream)

    console.log(`[DataStreams] Created stream: ${streamId}`, ownerPlugin ? `(owned by ${ownerPlugin})` : '')

    return stream
  }

  /**
   * Get an existing data stream
   */
  getStream<T>(streamId: string): DataStream<T> {
    const stream = this.streams.get(streamId)
    if (!stream) {
      throw new Error(`Stream ${streamId} does not exist`)
    }
    return stream as DataStream<T>
  }

  /**
   * Check if a stream exists
   */
  hasStream(streamId: string): boolean {
    return this.streams.has(streamId)
  }

  /**
   * Get or create a stream
   */
  getOrCreateStream<T>(streamId: string, initialData: T): DataStream<T> {
    if (this.hasStream(streamId)) {
      return this.getStream<T>(streamId)
    }
    return this.createStream<T>(streamId, initialData)
  }

  /**
   * Subscribe to a stream with plugin tracking
   */
  subscribeToStream<T>(
    streamId: string, 
    callback: (data: T) => void, 
    pluginId: string
  ): () => void {
    const subscription: StreamSubscription<T> = {
      id: this.generateId(),
      streamId,
      pluginId,
      callback
    }

    if (!this.subscriptions.has(streamId)) {
      this.subscriptions.set(streamId, new Set())
    }

    this.subscriptions.get(streamId)!.add(subscription)

    console.log(`[DataStreams] ${pluginId} subscribed to stream: ${streamId}`)

    // Return unsubscribe function
    return () => {
      const streamSubs = this.subscriptions.get(streamId)
      if (streamSubs) {
        streamSubs.delete(subscription)
        if (streamSubs.size === 0) {
          this.subscriptions.delete(streamId)
        }
      }
      console.log(`[DataStreams] ${pluginId} unsubscribed from stream: ${streamId}`)
    }
  }

  /**
   * Notify all subscribers of a stream update
   */
  notifySubscribers<T>(streamId: string, data: T): void {
    const subscribers = this.subscriptions.get(streamId)
    if (subscribers) {
      subscribers.forEach(subscription => {
        try {
          subscription.callback(data)
        } catch (error) {
          console.error(`[DataStreams] Error notifying subscriber ${subscription.pluginId} for stream ${streamId}:`, error)
        }
      })
    }
  }

  /**
   * Delete a stream
   */
  deleteStream(streamId: string): void {
    this.streams.delete(streamId)
    this.subscriptions.delete(streamId)
    console.log(`[DataStreams] Deleted stream: ${streamId}`)
  }

  /**
   * Get all active streams
   */
  getActiveStreams(): string[] {
    return Array.from(this.streams.keys())
  }

  /**
   * Get stream subscribers for debugging
   */
  getStreamSubscribers(streamId: string): string[] {
    const subscribers = this.subscriptions.get(streamId)
    return subscribers ? Array.from(subscribers).map(sub => sub.pluginId) : []
  }

  /**
   * Get all subscribers grouped by stream
   */
  getAllSubscribers(): Record<string, string[]> {
    const result: Record<string, string[]> = {}
    
    for (const [streamId, subscribers] of this.subscriptions.entries()) {
      result[streamId] = Array.from(subscribers).map(sub => sub.pluginId)
    }
    
    return result
  }

  /**
   * Clear all streams and subscriptions
   */
  clear(): void {
    this.streams.clear()
    this.subscriptions.clear()
  }

  /**
   * Get statistics about streams
   */
  getStats(): {
    totalStreams: number
    totalSubscriptions: number
    activePlugins: string[]
    streamSizes: Record<string, number>
  } {
    const totalStreams = this.streams.size
    let totalSubscriptions = 0
    const activePlugins = new Set<string>()
    const streamSizes: Record<string, number> = {}

    for (const [streamId, subscribers] of this.subscriptions.entries()) {
      const subCount = subscribers.size
      totalSubscriptions += subCount
      streamSizes[streamId] = subCount
      
      subscribers.forEach(sub => activePlugins.add(sub.pluginId))
    }

    return {
      totalStreams,
      totalSubscriptions,
      activePlugins: Array.from(activePlugins),
      streamSizes
    }
  }
}

/**
 * Internal implementation of DataStream
 */
class InternalDataStream<T> implements DataStream<T> {
  private data: T
  private readonly streamId: string
  private readonly dataStreams: DataStreams

  constructor(streamId: string, initialData: T, dataStreams: DataStreams) {
    this.streamId = streamId
    this.data = { ...initialData }
    this.dataStreams = dataStreams
  }

  get current(): T {
    return { ...this.data }
  }

  subscribe(callback: (data: T) => void): () => void {
    // Note: This creates an anonymous subscription
    // For plugin tracking, use DataStreams.subscribeToStream instead
    return this.dataStreams.subscribeToStream(this.streamId, callback, 'anonymous')
  }

  update(data: Partial<T>): void {
    this.data = { ...this.data, ...data }
    this.dataStreams.notifySubscribers(this.streamId, this.current)
    console.log(`[DataStreams] Stream ${this.streamId} updated:`, data)
  }

  replace(data: T): void {
    this.data = { ...data }
    this.dataStreams.notifySubscribers(this.streamId, this.current)
    console.log(`[DataStreams] Stream ${this.streamId} replaced`)
  }

  reset(): void {
    // Reset to empty object, streams should define their own reset logic
    this.data = {} as T
    this.dataStreams.notifySubscribers(this.streamId, this.current)
    console.log(`[DataStreams] Stream ${this.streamId} reset`)
  }
}