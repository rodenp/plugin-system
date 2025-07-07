// React Hooks for Entity Operations
// High-level hooks for working with entities in React components

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGDPRStorage } from './useGDPRStorage';

// Hook for loading and subscribing to a single entity
export function useEntity<T = any>(
  table: string, 
  id: string,
  options: {
    // Subscribe to changes (default: true)
    subscribe?: boolean;
    // Fetch immediately on mount (default: true)
    immediate?: boolean;
    // Transform function for the entity
    transform?: (entity: T) => T;
  } = {}
) {
  const storage = useGDPRStorage();
  const [entity, setEntity] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const { 
    subscribe = true, 
    immediate = true, 
    transform 
  } = options;

  // Load entity from storage
  const loadEntity = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await storage.getEntity<T>(table, id);
      
      if (!mountedRef.current) return;
      
      const processedResult = result && transform ? transform(result) : result;
      setEntity(processedResult);
    } catch (err) {
      if (!mountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error('Failed to load entity');
      setError(error);
      console.error(`Failed to load entity ${table}:${id}:`, error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [storage, table, id, transform]);

  // Update entity in storage
  const updateEntity = useCallback(async (data: Partial<T>) => {
    try {
      // Optimistically update local state
      if (entity) {
        const optimisticUpdate = transform 
          ? transform({ ...entity, ...data } as T)
          : { ...entity, ...data } as T;
        setEntity(optimisticUpdate);
      }
      
      // Update in storage
      const currentEntity = entity || {};
      await storage.setEntity(table, id, { ...currentEntity, ...data });
      
    } catch (err) {
      // Revert optimistic update on error
      await loadEntity();
      
      const error = err instanceof Error ? err : new Error('Failed to update entity');
      setError(error);
      console.error(`Failed to update entity ${table}:${id}:`, error);
      throw error;
    }
  }, [storage, table, id, entity, transform, loadEntity]);

  // Delete entity from storage
  const deleteEntity = useCallback(async () => {
    try {
      await storage.removeEntity(table, id);
      setEntity(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete entity');
      setError(error);
      console.error(`Failed to delete entity ${table}:${id}:`, error);
      throw error;
    }
  }, [storage, table, id]);

  // Set up subscription and initial load
  useEffect(() => {
    mountedRef.current = true;
    
    let unsubscribe: (() => void) | undefined;
    
    // Initial load
    if (immediate) {
      loadEntity();
    }
    
    // Subscribe to changes
    if (subscribe) {
      unsubscribe = storage.subscribe(table, id, (updatedEntity) => {
        if (!mountedRef.current) return;
        
        const processedEntity = updatedEntity && transform 
          ? transform(updatedEntity) 
          : updatedEntity;
        setEntity(processedEntity);
        
        // If we were loading and got data, stop loading
        if (loading && updatedEntity) {
          setLoading(false);
        }
      });
    }
    
    return () => {
      mountedRef.current = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [storage, table, id, subscribe, immediate, transform, loading, loadEntity]);

  return {
    // Data
    entity,
    loading,
    error,
    
    // Actions
    updateEntity,
    deleteEntity,
    refetch: loadEntity,
    
    // Computed
    exists: entity !== null,
    hasError: error !== null
  };
}

// Hook for loading and subscribing to multiple entities with a filter
export function useEntities<T = any>(
  table: string,
  options: {
    // Filter function
    filter?: (entity: T) => boolean;
    // Sort function
    sort?: (a: T, b: T) => number;
    // Subscribe to changes (default: true)
    subscribe?: boolean;
    // Fetch immediately on mount (default: true)
    immediate?: boolean;
    // Transform function for entities
    transform?: (entity: T) => T;
    // Limit number of results
    limit?: number;
  } = {}
) {
  const storage = useGDPRStorage();
  const [entities, setEntities] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const { 
    filter, 
    sort, 
    subscribe = true, 
    immediate = true, 
    transform, 
    limit 
  } = options;

  // Load entities from storage
  const loadEntities = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Use filter if provided, otherwise get all entities
      let result = filter 
        ? await storage.getEntitiesWhere<T>(table, filter)
        : await storage.getAllEntities<T>(table);
      
      if (!mountedRef.current) return;
      
      // Apply transform if provided
      if (transform) {
        result = result.map(transform);
      }
      
      // Apply sort if provided
      if (sort) {
        result.sort(sort);
      }
      
      // Apply limit if provided
      if (limit && result.length > limit) {
        result = result.slice(0, limit);
      }
      
      setEntities(result);
    } catch (err) {
      if (!mountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error('Failed to load entities');
      setError(error);
      console.error(`Failed to load entities from ${table}:`, error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [storage, table, filter, sort, transform, limit]);

  // Add entity to the collection
  const addEntity = useCallback(async (id: string, data: T) => {
    try {
      await storage.setEntity(table, id, data);
      // The subscription will update the list automatically
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add entity');
      setError(error);
      console.error(`Failed to add entity to ${table}:`, error);
      throw error;
    }
  }, [storage, table]);

  // Update entity in the collection
  const updateEntity = useCallback(async (id: string, data: Partial<T>) => {
    try {
      // Get current entity
      const currentEntity = await storage.getEntity<T>(table, id);
      if (currentEntity) {
        await storage.setEntity(table, id, { ...currentEntity, ...data });
      }
      // The subscription will update the list automatically
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update entity');
      setError(error);
      console.error(`Failed to update entity in ${table}:`, error);
      throw error;
    }
  }, [storage, table]);

  // Remove entity from the collection
  const removeEntity = useCallback(async (id: string) => {
    try {
      await storage.removeEntity(table, id);
      // The subscription will update the list automatically
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove entity');
      setError(error);
      console.error(`Failed to remove entity from ${table}:`, error);
      throw error;
    }
  }, [storage, table]);

  // Set up subscription and initial load
  useEffect(() => {
    mountedRef.current = true;
    
    let unsubscribe: (() => void) | undefined;
    
    // Initial load
    if (immediate) {
      loadEntities();
    }
    
    // Subscribe to table changes
    if (subscribe) {
      unsubscribe = storage.subscribeToTable(table, (updatedEntities) => {
        if (!mountedRef.current) return;
        
        let result = [...updatedEntities];
        
        // Apply filter if provided
        if (filter) {
          result = result.filter(filter);
        }
        
        // Apply transform if provided
        if (transform) {
          result = result.map(transform);
        }
        
        // Apply sort if provided
        if (sort) {
          result.sort(sort);
        }
        
        // Apply limit if provided
        if (limit && result.length > limit) {
          result = result.slice(0, limit);
        }
        
        setEntities(result);
        
        // If we were loading and got data, stop loading
        if (loading && result.length >= 0) {
          setLoading(false);
        }
      });
    }
    
    return () => {
      mountedRef.current = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [storage, table, filter, sort, subscribe, immediate, transform, limit, loading, loadEntities]);

  return {
    // Data
    entities,
    loading,
    error,
    
    // Actions
    addEntity,
    updateEntity,
    removeEntity,
    refetch: loadEntities,
    
    // Computed
    count: entities.length,
    isEmpty: entities.length === 0,
    hasError: error !== null
  };
}

// Hook for managing entity state with optimistic updates
export function useEntityMutation<T = any>(table: string, id: string) {
  const storage = useGDPRStorage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutateEntity = useCallback(async (
    data: Partial<T>,
    options: {
      optimistic?: boolean;
      onSuccess?: (entity: T) => void;
      onError?: (error: Error) => void;
    } = {}
  ) => {
    const { optimistic = true, onSuccess, onError } = options;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      // Get current entity for optimistic updates
      const currentEntity = await storage.getEntity<T>(table, id);
      
      if (optimistic && currentEntity) {
        // Apply optimistic update immediately
        const optimisticEntity = { ...currentEntity, ...data };
        await storage.setEntity(table, id, optimisticEntity);
      }
      
      // Perform actual update
      const updatedEntity = currentEntity 
        ? { ...currentEntity, ...data }
        : data as T;
        
      await storage.setEntity(table, id, updatedEntity);
      
      if (onSuccess) {
        onSuccess(updatedEntity);
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Mutation failed');
      setError(error);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [storage, table, id]);

  const deleteEntity = useCallback(async (options: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  } = {}) => {
    const { onSuccess, onError } = options;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await storage.removeEntity(table, id);
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Delete failed');
      setError(error);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [storage, table, id]);

  return {
    mutateEntity,
    deleteEntity,
    isUpdating,
    error,
    hasError: error !== null,
    clearError: () => setError(null)
  };
}