// Event-driven communication for notifications between plugins

export interface PluginEvent {
  type: string
  data: any
  fromPlugin: string
  timestamp: Date
  id: string
}

export interface EventSubscription {
  id: string
  event: string
  pluginId: string
  callback: (event: PluginEvent) => void
  once?: boolean
}

export class EventBus {
  private subscriptions = new Map<string, Set<EventSubscription>>()
  private eventHistory: PluginEvent[] = []
  private maxHistorySize = 1000

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Emit an event to all subscribers
   */
  emit(eventType: string, data: any, fromPlugin: string): void {
    const event: PluginEvent = {
      type: eventType,
      data,
      fromPlugin,
      timestamp: new Date(),
      id: this.generateId()
    }

    // Store in history
    this.eventHistory.push(event)
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }

    // Notify subscribers
    const subscribers = this.subscriptions.get(eventType)
    if (subscribers) {
      const toRemove: EventSubscription[] = []
      
      subscribers.forEach(subscription => {
        try {
          subscription.callback(event)
          
          // Remove one-time subscriptions
          if (subscription.once) {
            toRemove.push(subscription)
          }
        } catch (error) {
          console.error(`Error in event subscriber for ${eventType}:`, error)
        }
      })

      // Clean up one-time subscriptions
      toRemove.forEach(sub => subscribers.delete(sub))
    }

    console.log(`[EventBus] ${fromPlugin} emitted: ${eventType}`, data)
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe(
    eventType: string, 
    callback: (event: PluginEvent) => void,
    pluginId: string,
    once = false
  ): () => void {
    const subscription: EventSubscription = {
      id: this.generateId(),
      event: eventType,
      pluginId,
      callback,
      once
    }

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set())
    }

    this.subscriptions.get(eventType)!.add(subscription)

    console.log(`[EventBus] ${pluginId} subscribed to: ${eventType}`)

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(eventType)
      if (subscribers) {
        subscribers.delete(subscription)
        if (subscribers.size === 0) {
          this.subscriptions.delete(eventType)
        }
      }
      console.log(`[EventBus] ${pluginId} unsubscribed from: ${eventType}`)
    }
  }

  /**
   * Subscribe to an event only once
   */
  once(
    eventType: string, 
    callback: (event: PluginEvent) => void,
    pluginId: string
  ): () => void {
    return this.subscribe(eventType, callback, pluginId, true)
  }

  /**
   * Get all active subscriptions for debugging
   */
  getSubscriptions(): Record<string, string[]> {
    const result: Record<string, string[]> = {}
    
    for (const [eventType, subscribers] of this.subscriptions.entries()) {
      result[eventType] = Array.from(subscribers).map(sub => sub.pluginId)
    }
    
    return result
  }

  /**
   * Get recent event history
   */
  getEventHistory(limit = 50): PluginEvent[] {
    return this.eventHistory.slice(-limit)
  }

  /**
   * Get events filtered by type or plugin
   */
  getFilteredEvents(filters: {
    eventType?: string
    fromPlugin?: string
    since?: Date
    limit?: number
  }): PluginEvent[] {
    let events = this.eventHistory

    if (filters.eventType) {
      events = events.filter(e => e.type === filters.eventType)
    }

    if (filters.fromPlugin) {
      events = events.filter(e => e.fromPlugin === filters.fromPlugin)
    }

    if (filters.since) {
      events = events.filter(e => e.timestamp >= filters.since!)
    }

    if (filters.limit) {
      events = events.slice(-filters.limit)
    }

    return events
  }

  /**
   * Clear all subscriptions (useful for testing)
   */
  clear(): void {
    this.subscriptions.clear()
    this.eventHistory = []
  }

  /**
   * Get statistics about the event bus
   */
  getStats(): {
    totalSubscriptions: number
    eventTypes: string[]
    totalEventsEmitted: number
    activePlugins: string[]
  } {
    const eventTypes = Array.from(this.subscriptions.keys())
    const activePlugins = new Set<string>()
    let totalSubscriptions = 0

    for (const subscribers of this.subscriptions.values()) {
      totalSubscriptions += subscribers.size
      subscribers.forEach(sub => activePlugins.add(sub.pluginId))
    }

    return {
      totalSubscriptions,
      eventTypes,
      totalEventsEmitted: this.eventHistory.length,
      activePlugins: Array.from(activePlugins)
    }
  }
}