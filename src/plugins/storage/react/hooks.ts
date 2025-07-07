// React Hooks for StoragePlugin - Comprehensive hook system
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StoragePlugin } from '../StoragePlugin';
import {
  StorageEntity,
  QueryFilter,
  StorageError,
  EntityType,
  ConsentRecord,
  AuditLog,
  DataExportResult
} from '../types';

// Hook configuration types
interface UseStorageOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  cacheEnabled?: boolean;
  optimistic?: boolean;
  errorRetry?: boolean;
  maxRetries?: number;
}

interface UseQueryOptions<T> extends UseStorageOptions {
  filter?: QueryFilter<T>;
  enabled?: boolean;
  suspense?: boolean;
}

interface StorageHookResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

interface MutationResult<T> {
  mutate: (data: any) => Promise<T>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

// Storage Context Hook
export function useStorage(): StoragePlugin | null {
  const [storage, setStorage] = useState<StoragePlugin | null>(null);
  
  useEffect(() => {
    // Get storage instance from service registry or context
    // This would be provided by the StorageProvider
    const storageInstance = (window as any).__STORAGE_PLUGIN_INSTANCE__;
    setStorage(storageInstance || null);
  }, []);
  
  return storage;
}

// Generic entity hook
export function useEntity<T extends StorageEntity>(
  table: string,
  id: string,
  options: UseStorageOptions = {}
): StorageHookResult<T> {
  const storage = useStorage();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const retryCount = useRef(0);
  const refreshTimer = useRef<NodeJS.Timeout>();
  
  const fetchData = useCallback(async () => {
    if (!storage || !id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await storage.read<T>(table, id);
      setData(result);
      retryCount.current = 0;
      
    } catch (err) {
      const error = err as Error;
      
      if (options.errorRetry && retryCount.current < (options.maxRetries || 3)) {
        retryCount.current++;
        setTimeout(fetchData, 1000 * retryCount.current);
        return;
      }
      
      setError(error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [storage, table, id, options.errorRetry, options.maxRetries]);
  
  const invalidate = useCallback(() => {
    setData(null);
    setError(null);
    fetchData();
  }, [fetchData]);
  
  // Auto-refresh setup
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      refreshTimer.current = setInterval(fetchData, options.refreshInterval);
      
      return () => {
        if (refreshTimer.current) {
          clearInterval(refreshTimer.current);
        }
      };
    }
  }, [options.autoRefresh, options.refreshInterval, fetchData]);
  
  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Storage change subscription
  useEffect(() => {
    if (!storage) return;
    
    const unsubscribe = storage.on('data_updated', (event: any) => {
      if (event.table === table && event.id === id) {
        setData(event.entity);
      }
    });
    
    return unsubscribe;
  }, [storage, table, id]);
  
  return { data, loading, error, refetch: fetchData, invalidate };
}

// Query hook
export function useQuery<T extends StorageEntity>(
  table: string,
  options: UseQueryOptions<T> = {}
): StorageHookResult<T[]> {
  const storage = useStorage();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryKey = useRef<string>('');
  
  const fetchData = useCallback(async () => {
    if (!storage || !options.enabled) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await storage.query<T>(table, options.filter);
      setData(result);
      
      // Update query key for caching
      queryKey.current = JSON.stringify({ table, filter: options.filter });
      
    } catch (err) {
      setError(err as Error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [storage, table, options.filter, options.enabled]);
  
  const invalidate = useCallback(() => {
    setData([]);
    setError(null);
    fetchData();
  }, [fetchData]);
  
  // Initial fetch
  useEffect(() => {
    if (options.enabled !== false) {
      fetchData();
    }
  }, [fetchData, options.enabled]);
  
  // Storage change subscription
  useEffect(() => {
    if (!storage) return;
    
    const unsubscribe = storage.on('data_created', (event: any) => {
      if (event.table === table) {
        setData(prev => [...prev, event.entity]);
      }
    });
    
    const unsubscribe2 = storage.on('data_updated', (event: any) => {
      if (event.table === table) {
        setData(prev => prev.map(item => 
          item.id === event.id ? event.entity : item
        ));
      }
    });
    
    const unsubscribe3 = storage.on('data_deleted', (event: any) => {
      if (event.table === table) {
        setData(prev => prev.filter(item => item.id !== event.id));
      }
    });
    
    return () => {
      unsubscribe();
      unsubscribe2();
      unsubscribe3();
    };
  }, [storage, table]);
  
  return { data, loading, error, refetch: fetchData, invalidate };
}

// Mutation hooks
export function useCreateEntity<T extends StorageEntity>(
  table: string,
  options: UseStorageOptions = {}
): MutationResult<T> {
  const storage = useStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const mutate = useCallback(async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    if (!storage) {
      throw new Error('Storage not available');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await storage.create<T>(table, data as T);
      return result;
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [storage, table]);
  
  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);
  
  return { mutate, loading, error, reset };
}

export function useUpdateEntity<T extends StorageEntity>(
  table: string,
  options: UseStorageOptions = {}
): MutationResult<T> {
  const storage = useStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const mutate = useCallback(async ({ id, ...data }: { id: string } & Partial<T>) => {
    if (!storage) {
      throw new Error('Storage not available');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await storage.update<T>(table, id, data);
      return result;
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [storage, table]);
  
  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);
  
  return { mutate, loading, error, reset };
}

export function useDeleteEntity(
  table: string,
  options: UseStorageOptions = {}
): MutationResult<void> {
  const storage = useStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const mutate = useCallback(async (id: string) => {
    if (!storage) {
      throw new Error('Storage not available');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await storage.delete(table, id);
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [storage, table]);
  
  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);
  
  return { mutate, loading, error, reset };
}

// Specialized entity hooks
export function useUser(userId: string, options?: UseStorageOptions) {
  return useEntity(EntityType.USERS, userId, options);
}

export function usePost(postId: string, options?: UseStorageOptions) {
  return useEntity(EntityType.POSTS, postId, options);
}

export function useCourse(courseId: string, options?: UseStorageOptions) {
  return useEntity(EntityType.COURSES, courseId, options);
}

export function useComment(commentId: string, options?: UseStorageOptions) {
  return useEntity(EntityType.COMMENTS, commentId, options);
}

// Query hooks for collections
export function useUsers(filter?: QueryFilter<any>, options?: UseQueryOptions<any>) {
  return useQuery(EntityType.USERS, { ...options, filter });
}

export function usePosts(filter?: QueryFilter<any>, options?: UseQueryOptions<any>) {
  return useQuery(EntityType.POSTS, { ...options, filter });
}

export function useCourses(filter?: QueryFilter<any>, options?: UseQueryOptions<any>) {
  return useQuery(EntityType.COURSES, { ...options, filter });
}

export function useComments(postId?: string, options?: UseQueryOptions<any>) {
  const filter = postId ? { where: { postId } } : undefined;
  return useQuery(EntityType.COMMENTS, { ...options, filter });
}

// GDPR-specific hooks
export function useConsent(userId: string): {
  consents: ConsentRecord[];
  loading: boolean;
  error: Error | null;
  grantConsent: (purposes: string[]) => Promise<void>;
  revokeConsent: (purposes: string[]) => Promise<void>;
  checkConsent: (purpose: string) => Promise<boolean>;
} {
  const storage = useStorage();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchConsents = useCallback(async () => {
    if (!storage) return;
    
    try {
      setLoading(true);
      const result = await storage.getConsentStatus(userId);
      setConsents(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [storage, userId]);
  
  const grantConsent = useCallback(async (purposes: string[]) => {
    if (!storage) throw new Error('Storage not available');
    
    await storage.grantConsent(userId, purposes);
    await fetchConsents();
  }, [storage, userId, fetchConsents]);
  
  const revokeConsent = useCallback(async (purposes: string[]) => {
    if (!storage) throw new Error('Storage not available');
    
    await storage.revokeConsent(userId, purposes);
    await fetchConsents();
  }, [storage, userId, fetchConsents]);
  
  const checkConsent = useCallback(async (purpose: string) => {
    if (!storage) return false;
    
    return await storage.checkConsent(userId, purpose);
  }, [storage, userId]);
  
  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);
  
  return {
    consents,
    loading,
    error,
    grantConsent,
    revokeConsent,
    checkConsent
  };
}

export function useDataExport(userId: string): {
  exportData: () => Promise<DataExportResult>;
  loading: boolean;
  error: Error | null;
  lastExport: DataExportResult | null;
} {
  const storage = useStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastExport, setLastExport] = useState<DataExportResult | null>(null);
  
  const exportData = useCallback(async () => {
    if (!storage) throw new Error('Storage not available');
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await storage.exportUserData(userId);
      setLastExport(result);
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [storage, userId]);
  
  return {
    exportData,
    loading,
    error,
    lastExport
  };
}

export function useDataDeletion(userId: string): {
  deleteData: () => Promise<void>;
  loading: boolean;
  error: Error | null;
} {
  const storage = useStorage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const deleteData = useCallback(async () => {
    if (!storage) throw new Error('Storage not available');
    
    try {
      setLoading(true);
      setError(null);
      
      await storage.deleteUserData(userId);
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [storage, userId]);
  
  return {
    deleteData,
    loading,
    error
  };
}

// Audit trail hook
export function useAuditTrail(userId?: string, options?: {
  actions?: string[];
  resources?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): {
  auditLogs: AuditLog[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const storage = useStorage();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchAuditLogs = useCallback(async () => {
    if (!storage) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // This would require adding audit log methods to the main plugin interface
      // For now, we'll simulate the interface
      const auditLogger = (storage as any).auditLogger;
      if (auditLogger && userId) {
        const logs = await auditLogger.getUserAuditTrail(userId, options);
        setAuditLogs(logs);
      } else {
        setAuditLogs([]);
      }
      
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [storage, userId, options]);
  
  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);
  
  return {
    auditLogs,
    loading,
    error,
    refresh: fetchAuditLogs
  };
}

// Performance and cache hooks
export function useStorageStats(): {
  stats: any;
  loading: boolean;
  error: Error | null;
} {
  const storage = useStorage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchStats = useCallback(async () => {
    if (!storage) return;
    
    try {
      setLoading(true);
      
      const [performanceMetrics, storageInfo, status] = await Promise.all([
        storage.getPerformanceMetrics(),
        storage.getStorageInfo(),
        Promise.resolve(storage.getStatus())
      ]);
      
      setStats({
        performance: performanceMetrics,
        storage: storageInfo,
        status
      });
      
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [storage]);
  
  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);
  
  return { stats, loading, error };
}

// Optimistic updates hook
export function useOptimisticUpdates<T extends StorageEntity>(
  table: string,
  initialData: T[] = []
) {
  const [optimisticData, setOptimisticData] = useState<T[]>(initialData);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Partial<T>>>(new Map());
  
  const addOptimisticUpdate = useCallback((id: string, update: Partial<T>) => {
    setPendingUpdates(prev => new Map(prev).set(id, update));
    setOptimisticData(prev => 
      prev.map(item => item.id === id ? { ...item, ...update } : item)
    );
  }, []);
  
  const removeOptimisticUpdate = useCallback((id: string) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);
  
  const revertOptimisticUpdate = useCallback((id: string, originalData: T) => {
    removeOptimisticUpdate(id);
    setOptimisticData(prev => 
      prev.map(item => item.id === id ? originalData : item)
    );
  }, [removeOptimisticUpdate]);
  
  return {
    optimisticData,
    pendingUpdates,
    addOptimisticUpdate,
    removeOptimisticUpdate,
    revertOptimisticUpdate
  };
}

// Real-time subscription hook
export function useRealtimeSubscription<T extends StorageEntity>(
  table: string,
  filter?: QueryFilter<T>
) {
  const storage = useStorage();
  const [data, setData] = useState<T[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  useEffect(() => {
    if (!storage) return;
    
    setConnectionStatus('connecting');
    
    // Subscribe to real-time updates
    const unsubscribe = storage.on(`realtime:${table}`, (event: any) => {
      setConnectionStatus('connected');
      
      switch (event.action) {
        case 'created':
          setData(prev => [...prev, event.entity]);
          break;
        case 'updated':
          setData(prev => 
            prev.map(item => item.id === event.entity.id ? event.entity : item)
          );
          break;
        case 'deleted':
          setData(prev => prev.filter(item => item.id !== event.entityId));
          break;
      }
    });
    
    // Initial data fetch
    storage.query<T>(table, filter).then(setData);
    
    return () => {
      unsubscribe();
      setConnectionStatus('disconnected');
    };
  }, [storage, table, filter]);
  
  return { data, connectionStatus };
}