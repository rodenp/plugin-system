// React Hook for Storage Performance and Statistics
// Provides real-time monitoring of storage performance

import { useState, useEffect, useRef } from 'react';
import { useGDPRStorage } from './useGDPRStorage';

export interface StorageStatsData {
  // State manager stats
  stateManager: {
    type: string;
    totalEntities: number;
    entitiesByTable: Record<string, number>;
    memoryUsage: number;
    cacheHitRate: number;
    lastUpdated: number;
  };
  
  // Performance metrics
  performance: {
    queryTimes: {
      average: number;
      min: number;
      max: number;
      p95: number;
      p99: number;
    };
    cacheStats: {
      hitRate: number;
      missRate: number;
      totalRequests: number;
      evictions: number;
    };
    updateQueue: {
      averageBatchSize: number;
      averageProcessingTime: number;
      queueLength: number;
      totalUpdates: number;
    };
    memory: {
      totalUsage: number;
      entitiesCount: number;
      averageEntitySize: number;
    };
  };
  
  // Update queue stats
  updateQueue: {
    pendingUpdates: number;
    hasStateManager: boolean;
    config: any;
  };
  
  // General info
  mode: string;
  isInitialized: boolean;
}

// Hook for accessing storage statistics
export function useStorageStats(options: {
  // Update interval in milliseconds (default: 2000)
  updateInterval?: number;
  // Whether to auto-update (default: true)
  autoUpdate?: boolean;
  // Whether to include performance metrics (default: true)
  includePerformance?: boolean;
} = {}) {
  const storage = useGDPRStorage();
  const [stats, setStats] = useState<StorageStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  
  const {
    updateInterval = 2000,
    autoUpdate = true,
    includePerformance = true
  } = options;

  // Function to collect all stats
  const collectStats = async (): Promise<StorageStatsData> => {
    try {
      // Get basic storage stats
      const basicStats = storage.getStats();
      
      // Get performance metrics if requested
      const performanceMetrics = includePerformance 
        ? storage.getPerformanceMetrics()
        : null;
      
      // Combine into unified stats object
      const unifiedStats: StorageStatsData = {
        stateManager: {
          type: storage.getStateManagerType(),
          totalEntities: basicStats.stateManagerStats?.totalEntities || 0,
          entitiesByTable: basicStats.stateManagerStats?.entitiesByTable || {},
          memoryUsage: basicStats.stateManagerStats?.memoryUsage || 0,
          cacheHitRate: basicStats.stateManagerStats?.cacheHitRate || 0,
          lastUpdated: basicStats.stateManagerStats?.lastUpdated || Date.now()
        },
        performance: performanceMetrics || {
          queryTimes: { average: 0, min: 0, max: 0, p95: 0, p99: 0 },
          cacheStats: { hitRate: 0, missRate: 0, totalRequests: 0, evictions: 0 },
          updateQueue: { averageBatchSize: 0, averageProcessingTime: 0, queueLength: 0, totalUpdates: 0 },
          memory: { totalUsage: 0, entitiesCount: 0, averageEntitySize: 0 }
        },
        updateQueue: basicStats.updateQueue || {
          pendingUpdates: 0,
          hasStateManager: false,
          config: {}
        },
        mode: basicStats.mode || 'unknown',
        isInitialized: true
      };
      
      return unifiedStats;
      
    } catch (err) {
      throw new Error(`Failed to collect storage stats: ${err}`);
    }
  };

  // Manual refresh function
  const refreshStats = async () => {
    if (!mountedRef.current) return;
    
    try {
      setError(null);
      const newStats = await collectStats();
      
      if (mountedRef.current) {
        setStats(newStats);
        setLoading(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error('Failed to refresh stats');
      setError(error);
      console.error('Failed to refresh storage stats:', error);
    }
  };

  // Set up auto-updating
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial load
    refreshStats();
    
    // Set up interval if auto-update is enabled
    let interval: NodeJS.Timeout | undefined;
    
    if (autoUpdate && updateInterval > 0) {
      interval = setInterval(refreshStats, updateInterval);
    }
    
    return () => {
      mountedRef.current = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoUpdate, updateInterval, includePerformance]);

  return {
    // Data
    stats,
    loading,
    error,
    
    // Actions
    refresh: refreshStats,
    
    // Computed values
    hasError: error !== null,
    isStale: stats ? (Date.now() - stats.stateManager.lastUpdated) > (updateInterval * 2) : false,
    
    // Convenience getters
    totalEntities: stats?.stateManager.totalEntities || 0,
    cacheHitRate: stats?.stateManager.cacheHitRate || 0,
    pendingUpdates: stats?.updateQueue.pendingUpdates || 0,
    averageQueryTime: stats?.performance.queryTimes.average || 0,
    memoryUsage: stats?.stateManager.memoryUsage || 0,
    stateManagerType: stats?.stateManager.type || 'unknown'
  };
}

// Hook for monitoring specific performance metrics
export function usePerformanceMonitor(options: {
  // Metrics to track
  metrics?: ('queryTime' | 'cacheHit' | 'memoryUsage' | 'queueLength')[];
  // Alert thresholds
  thresholds?: {
    queryTime?: number; // ms
    cacheHitRate?: number; // percentage (0-1)
    memoryUsage?: number; // bytes
    queueLength?: number; // number of pending updates
  };
  // Update interval
  updateInterval?: number;
} = {}) {
  const { stats, loading, error, refresh } = useStorageStats({
    updateInterval: options.updateInterval || 1000,
    includePerformance: true
  });
  
  const {
    metrics = ['queryTime', 'cacheHit', 'memoryUsage', 'queueLength'],
    thresholds = {}
  } = options;
  
  // Performance alerts
  const alerts = [];
  
  if (stats && !loading) {
    if (metrics.includes('queryTime') && thresholds.queryTime) {
      if (stats.performance.queryTimes.average > thresholds.queryTime) {
        alerts.push({
          type: 'queryTime',
          severity: 'warning',
          message: `Average query time (${stats.performance.queryTimes.average.toFixed(1)}ms) exceeds threshold (${thresholds.queryTime}ms)`
        });
      }
    }
    
    if (metrics.includes('cacheHit') && thresholds.cacheHitRate) {
      if (stats.stateManager.cacheHitRate < thresholds.cacheHitRate) {
        alerts.push({
          type: 'cacheHit',
          severity: 'warning',
          message: `Cache hit rate (${(stats.stateManager.cacheHitRate * 100).toFixed(1)}%) below threshold (${(thresholds.cacheHitRate * 100).toFixed(1)}%)`
        });
      }
    }
    
    if (metrics.includes('memoryUsage') && thresholds.memoryUsage) {
      if (stats.stateManager.memoryUsage > thresholds.memoryUsage) {
        alerts.push({
          type: 'memoryUsage',
          severity: 'warning',
          message: `Memory usage (${Math.round(stats.stateManager.memoryUsage / 1024)}KB) exceeds threshold (${Math.round(thresholds.memoryUsage / 1024)}KB)`
        });
      }
    }
    
    if (metrics.includes('queueLength') && thresholds.queueLength) {
      if (stats.updateQueue.pendingUpdates > thresholds.queueLength) {
        alerts.push({
          type: 'queueLength',
          severity: 'warning',
          message: `Update queue length (${stats.updateQueue.pendingUpdates}) exceeds threshold (${thresholds.queueLength})`
        });
      }
    }
  }

  return {
    // Performance data
    queryTime: stats?.performance.queryTimes.average || 0,
    cacheHitRate: stats?.stateManager.cacheHitRate || 0,
    memoryUsage: stats?.stateManager.memoryUsage || 0,
    queueLength: stats?.updateQueue.pendingUpdates || 0,
    
    // Status
    loading,
    error,
    alerts,
    hasAlerts: alerts.length > 0,
    
    // Actions
    refresh,
    
    // Raw stats for advanced use
    stats
  };
}

// Hook for tracking storage health
export function useStorageHealth() {
  const { stats, loading, error } = useStorageStats({ updateInterval: 5000 });
  
  // Calculate overall health score (0-100)
  const healthScore = (() => {
    if (!stats || loading) return 0;
    
    let score = 100;
    
    // Deduct points for poor performance
    if (stats.performance.queryTimes.average > 100) score -= 20;
    if (stats.stateManager.cacheHitRate < 0.8) score -= 15;
    if (stats.updateQueue.pendingUpdates > 10) score -= 10;
    if (stats.stateManager.memoryUsage > 10 * 1024 * 1024) score -= 10; // 10MB
    
    // Deduct points for errors
    if (error) score -= 25;
    
    return Math.max(0, score);
  })();
  
  // Determine health status
  const healthStatus = (() => {
    if (loading) return 'checking';
    if (error) return 'error';
    if (healthScore >= 90) return 'excellent';
    if (healthScore >= 70) return 'good';
    if (healthScore >= 50) return 'warning';
    return 'critical';
  })();
  
  // Health recommendations
  const recommendations = [];
  
  if (stats && !loading && !error) {
    if (stats.performance.queryTimes.average > 100) {
      recommendations.push('Consider optimizing queries or adding indexes');
    }
    if (stats.stateManager.cacheHitRate < 0.8) {
      recommendations.push('Cache hit rate is low - consider increasing cache size or TTL');
    }
    if (stats.updateQueue.pendingUpdates > 10) {
      recommendations.push('Update queue is backing up - consider reducing batch window');
    }
    if (stats.stateManager.memoryUsage > 10 * 1024 * 1024) {
      recommendations.push('High memory usage detected - consider enabling garbage collection');
    }
  }

  return {
    healthScore,
    healthStatus,
    recommendations,
    isHealthy: healthStatus === 'excellent' || healthStatus === 'good',
    loading,
    error,
    stats
  };
}