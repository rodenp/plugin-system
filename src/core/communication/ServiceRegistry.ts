// Service registry for direct method calls between plugins

export interface PluginService {
  [methodName: string]: (...args: any[]) => Promise<any> | any
}

export interface ServiceCall {
  id: string
  targetPlugin: string
  method: string
  args: any[]
  fromPlugin: string
  timestamp: Date
  status: 'pending' | 'completed' | 'error'
  result?: any
  error?: string
  duration?: number
}

export class ServiceRegistry {
  private services = new Map<string, PluginService>()
  private callHistory: ServiceCall[] = []
  private maxHistorySize = 1000
  private permissions = new Map<string, Set<string>>() // plugin -> allowed callers

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Register services for a plugin
   */
  registerService(pluginId: string, service: PluginService): void {
    this.services.set(pluginId, service)
    
    const methodNames = Object.keys(service)
    console.log(`[ServiceRegistry] ${pluginId} registered services:`, methodNames)
  }

  /**
   * Set permissions for who can call a plugin's services
   */
  setPermissions(pluginId: string, allowedCallers: string[]): void {
    this.permissions.set(pluginId, new Set(allowedCallers))
    console.log(`[ServiceRegistry] ${pluginId} permissions set for:`, allowedCallers)
  }

  /**
   * Check if a plugin can call another plugin's service
   */
  private canCall(fromPlugin: string, targetPlugin: string): boolean {
    const permissions = this.permissions.get(targetPlugin)
    
    // If no permissions set, allow all calls
    if (!permissions) return true
    
    // Check if caller is in allowed list
    return permissions.has(fromPlugin) || permissions.has('*')
  }

  /**
   * Call a service method on another plugin
   */
  async callService(
    targetPlugin: string, 
    method: string, 
    fromPlugin: string,
    ...args: any[]
  ): Promise<any> {
    const callRecord: ServiceCall = {
      id: this.generateId(),
      targetPlugin,
      method,
      args,
      fromPlugin,
      timestamp: new Date(),
      status: 'pending'
    }

    const startTime = Date.now()

    try {
      // Check permissions
      if (!this.canCall(fromPlugin, targetPlugin)) {
        throw new Error(`Plugin ${fromPlugin} is not allowed to call services on ${targetPlugin}`)
      }

      // Get the target service
      const service = this.services.get(targetPlugin)
      if (!service) {
        throw new Error(`Plugin ${targetPlugin} is not registered or has no services`)
      }

      // Get the specific method
      const serviceMethod = service[method]
      if (!serviceMethod || typeof serviceMethod !== 'function') {
        throw new Error(`Method ${method} not found on plugin ${targetPlugin}`)
      }

      console.log(`[ServiceRegistry] ${fromPlugin} calling ${targetPlugin}.${method}(${args.map(a => JSON.stringify(a)).join(', ')})`)

      // Call the method
      const result = await serviceMethod(...args)

      // Record success
      callRecord.status = 'completed'
      callRecord.result = result
      callRecord.duration = Date.now() - startTime

      console.log(`[ServiceRegistry] Call completed in ${callRecord.duration}ms:`, result)

      return result

    } catch (error) {
      // Record error
      callRecord.status = 'error'
      callRecord.error = error instanceof Error ? error.message : String(error)
      callRecord.duration = Date.now() - startTime

      console.error(`[ServiceRegistry] Call failed after ${callRecord.duration}ms:`, error)

      throw error

    } finally {
      // Store call history
      this.callHistory.push(callRecord)
      if (this.callHistory.length > this.maxHistorySize) {
        this.callHistory.shift()
      }
    }
  }

  /**
   * Get available services for discovery
   */
  getAvailableServices(): Record<string, string[]> {
    const result: Record<string, string[]> = {}
    
    for (const [pluginId, service] of this.services.entries()) {
      result[pluginId] = Object.keys(service)
    }
    
    return result
  }

  /**
   * Get services available to a specific plugin (respecting permissions)
   */
  getAvailableServicesFor(pluginId: string): Record<string, string[]> {
    const result: Record<string, string[]> = {}
    
    for (const [targetPlugin, service] of this.services.entries()) {
      if (this.canCall(pluginId, targetPlugin)) {
        result[targetPlugin] = Object.keys(service)
      }
    }
    
    return result
  }

  /**
   * Get call history for debugging
   */
  getCallHistory(limit = 50): ServiceCall[] {
    return this.callHistory.slice(-limit)
  }

  /**
   * Get filtered call history
   */
  getFilteredCalls(filters: {
    targetPlugin?: string
    fromPlugin?: string
    method?: string
    status?: 'pending' | 'completed' | 'error'
    since?: Date
    limit?: number
  }): ServiceCall[] {
    let calls = this.callHistory

    if (filters.targetPlugin) {
      calls = calls.filter(c => c.targetPlugin === filters.targetPlugin)
    }

    if (filters.fromPlugin) {
      calls = calls.filter(c => c.fromPlugin === filters.fromPlugin)
    }

    if (filters.method) {
      calls = calls.filter(c => c.method === filters.method)
    }

    if (filters.status) {
      calls = calls.filter(c => c.status === filters.status)
    }

    if (filters.since) {
      calls = calls.filter(c => c.timestamp >= filters.since!)
    }

    if (filters.limit) {
      calls = calls.slice(-filters.limit)
    }

    return calls
  }

  /**
   * Unregister a plugin's services
   */
  unregister(pluginId: string): void {
    this.services.delete(pluginId)
    this.permissions.delete(pluginId)
    console.log(`[ServiceRegistry] ${pluginId} services unregistered`)
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear()
    this.permissions.clear()
    this.callHistory = []
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalPlugins: number
    totalMethods: number
    totalCalls: number
    successRate: number
    averageDuration: number
  } {
    const totalPlugins = this.services.size
    let totalMethods = 0
    
    for (const service of this.services.values()) {
      totalMethods += Object.keys(service).length
    }

    const totalCalls = this.callHistory.length
    const successfulCalls = this.callHistory.filter(c => c.status === 'completed').length
    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0

    const callsWithDuration = this.callHistory.filter(c => c.duration !== undefined)
    const averageDuration = callsWithDuration.length > 0 
      ? callsWithDuration.reduce((sum, c) => sum + (c.duration || 0), 0) / callsWithDuration.length
      : 0

    return {
      totalPlugins,
      totalMethods,
      totalCalls,
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(averageDuration * 100) / 100
    }
  }
}