// Main communication hub combining all communication methods
import { EventBus, PluginEvent } from './EventBus'
import { ServiceRegistry, PluginService } from './ServiceRegistry'
import { DataStreams, DataStream } from './DataStreams'

export interface PluginCommunicationInterface {
  // Event-driven communication
  events: {
    emit: (eventType: string, data: any) => void
    subscribe: (eventType: string, callback: (event: PluginEvent) => void) => () => void
    once: (eventType: string, callback: (event: PluginEvent) => void) => () => void
  }
  
  // Service calls
  services: {
    call: (targetPlugin: string, method: string, ...args: any[]) => Promise<any>
    register: (service: PluginService) => void
    getAvailable: () => Record<string, string[]>
  }
  
  // Shared data streams
  streams: {
    get: <T>(streamId: string) => DataStream<T>
    create: <T>(streamId: string, initialData: T) => DataStream<T>
    getOrCreate: <T>(streamId: string, initialData: T) => DataStream<T>
    subscribe: <T>(streamId: string, callback: (data: T) => void) => () => void
  }
}

export class CrossPluginCommunication {
  private eventBus = new EventBus()
  private serviceRegistry = new ServiceRegistry()
  private dataStreams = new DataStreams()

  /**
   * Get communication interface for a specific plugin
   */
  getInterface(pluginId: string): PluginCommunicationInterface {
    return {
      events: {
        emit: (eventType: string, data: any) => {
          this.eventBus.emit(eventType, data, pluginId)
        },
        subscribe: (eventType: string, callback: (event: PluginEvent) => void) => {
          return this.eventBus.subscribe(eventType, callback, pluginId)
        },
        once: (eventType: string, callback: (event: PluginEvent) => void) => {
          return this.eventBus.once(eventType, callback, pluginId)
        }
      },
      
      services: {
        call: async (targetPlugin: string, method: string, ...args: any[]) => {
          return await this.serviceRegistry.callService(targetPlugin, method, pluginId, ...args)
        },
        register: (service: PluginService) => {
          this.serviceRegistry.registerService(pluginId, service)
        },
        getAvailable: () => {
          return this.serviceRegistry.getAvailableServicesFor(pluginId)
        }
      },
      
      streams: {
        get: <T>(streamId: string) => {
          return this.dataStreams.getStream<T>(streamId)
        },
        create: <T>(streamId: string, initialData: T) => {
          return this.dataStreams.createStream<T>(streamId, initialData, pluginId)
        },
        getOrCreate: <T>(streamId: string, initialData: T) => {
          return this.dataStreams.getOrCreateStream<T>(streamId, initialData)
        },
        subscribe: <T>(streamId: string, callback: (data: T) => void) => {
          return this.dataStreams.subscribeToStream<T>(streamId, callback, pluginId)
        }
      }
    }
  }

  /**
   * Set service permissions for a plugin
   */
  setServicePermissions(pluginId: string, allowedCallers: string[]): void {
    this.serviceRegistry.setPermissions(pluginId, allowedCallers)
  }

  /**
   * Global event emission (for system events)
   */
  emitSystemEvent(eventType: string, data: any): void {
    this.eventBus.emit(eventType, data, 'system')
  }

  /**
   * Create system-level data streams
   */
  createSystemStream<T>(streamId: string, initialData: T): DataStream<T> {
    return this.dataStreams.createStream<T>(streamId, initialData, 'system')
  }

  /**
   * Get debugging information
   */
  getDebugInfo(): {
    events: {
      subscriptions: Record<string, string[]>
      recentEvents: PluginEvent[]
      stats: any
    }
    services: {
      available: Record<string, string[]>
      recentCalls: any[]
      stats: any
    }
    streams: {
      active: string[]
      subscribers: Record<string, string[]>
      stats: any
    }
  } {
    return {
      events: {
        subscriptions: this.eventBus.getSubscriptions(),
        recentEvents: this.eventBus.getEventHistory(20),
        stats: this.eventBus.getStats()
      },
      services: {
        available: this.serviceRegistry.getAvailableServices(),
        recentCalls: this.serviceRegistry.getCallHistory(20),
        stats: this.serviceRegistry.getStats()
      },
      streams: {
        active: this.dataStreams.getActiveStreams(),
        subscribers: this.dataStreams.getAllSubscribers(),
        stats: this.dataStreams.getStats()
      }
    }
  }

  /**
   * Clean up all communication for a plugin
   */
  cleanupPlugin(pluginId: string): void {
    // Services are automatically cleaned up by their unsubscribe functions
    // Streams subscriptions are also cleaned up automatically
    // This method is mainly for explicit cleanup if needed
    this.serviceRegistry.unregister(pluginId)
    console.log(`[CrossPluginCommunication] Cleaned up plugin: ${pluginId}`)
  }

  /**
   * Clear all communication (for testing)
   */
  clear(): void {
    this.eventBus.clear()
    this.serviceRegistry.clear()
    this.dataStreams.clear()
  }

  /**
   * Initialize common system streams
   */
  initializeSystemStreams(): void {
    // Current user stream
    this.createSystemStream('current-user', null)
    
    // Global app settings
    this.createSystemStream('app-settings', {
      theme: 'default',
      language: 'en',
      notifications: true
    })
    
    // Plugin states
    this.createSystemStream('plugin-states', {})
    
    console.log('[CrossPluginCommunication] System streams initialized')
  }
}