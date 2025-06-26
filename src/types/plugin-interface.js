/**
 * Storage-Agnostic Plugin System Interfaces
 *
 * These interfaces define the contract for plugins in a storage-agnostic way.
 * Plugins using these interfaces can work with any storage backend (PostgreSQL,
 * Memory, IndexedDB, etc.) without knowing the implementation details.
 */
// ============================================================================
// Type Guards and Utilities
// ============================================================================
/**
 * Type guard to check if a component uses themed props
 */
export function isThemedPlugin(props) {
    return props.theme !== undefined;
}
/**
 * Helper to create a plugin definition with type safety
 */
export function createPlugin(definition) {
    return {
        order: 0, // Default order
        ...definition,
    };
}
// ============================================================================
// Export Summary (Note: Types are already exported above)
// ============================================================================
