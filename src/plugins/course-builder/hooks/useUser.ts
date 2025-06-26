import { useEffect, useState } from 'react';
import type { UserInfo } from '../types';

/**
 * Hook to access user information from the course builder plugin
 */
export function useUser(): UserInfo | null {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Get user from global plugin state
    const userInfo = (window as any).__courseFrameworkUser as UserInfo | undefined;
    setUser(userInfo || null);
  }, []);

  return user;
}

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(permission: string): boolean {
  const user = useUser();
  return user?.permissions?.includes(permission) ?? false;
}

/**
 * Hook to check if user has access to a specific plan level
 */
export function usePlanAccess(requiredLevel: 'basic' | 'pro' | 'enterprise'): boolean {
  const user = useUser();
  
  if (!user?.plan) return false;
  
  const planHierarchy = ['basic', 'pro', 'enterprise'];
  const userLevel = planHierarchy.indexOf(user.plan.level);
  const requiredLevelIndex = planHierarchy.indexOf(requiredLevel);
  
  return userLevel >= requiredLevelIndex;
}

/**
 * Hook to check if user has a specific feature
 */
export function useFeature(featureKey: string): boolean {
  const user = useUser();
  return user?.plan?.features?.includes(featureKey) ?? false;
}