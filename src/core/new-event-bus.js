export class NewEventBus {
    listeners = new Map();
    eventHistory = [];
    // Subscribe to an event
    on(event, listener, pluginId) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        const listeners = this.listeners.get(event);
        listeners.push(listener);
        console.log(`🎧 Plugin ${pluginId || 'unknown'} subscribed to event: ${event}`);
        // Return unsubscribe function
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
                console.log(`🎧 Plugin ${pluginId || 'unknown'} unsubscribed from event: ${event}`);
            }
        };
    }
    // Emit an event
    emit(event, data, pluginId) {
        console.log(`📡 Event emitted: ${event}`, { data, from: pluginId });
        // Store in history
        this.eventHistory.push({
            event,
            data,
            timestamp: new Date(),
            pluginId
        });
        // Keep only last 100 events
        if (this.eventHistory.length > 100) {
            this.eventHistory.shift();
        }
        // Notify all listeners
        const listeners = this.listeners.get(event) || [];
        listeners.forEach(listener => {
            try {
                listener(data);
            }
            catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }
    // Get event history (for debugging)
    getEventHistory() {
        return [...this.eventHistory];
    }
    // Clear all listeners
    clear() {
        this.listeners.clear();
        this.eventHistory = [];
    }
    // Get active listeners count
    getListenersCount(event) {
        if (event) {
            return this.listeners.get(event)?.length || 0;
        }
        let total = 0;
        this.listeners.forEach(listeners => {
            total += listeners.length;
        });
        return total;
    }
}
// Create global event bus instance
export const newEventBus = new NewEventBus();
// Common event types for the new plugin system
export const EVENTS = {
    // Course events
    COURSE_CREATED: 'course:created',
    COURSE_UPDATED: 'course:updated',
    COURSE_DELETED: 'course:deleted',
    COURSE_VIEWED: 'course:viewed',
    LESSON_COMPLETED: 'lesson:completed',
    // Community events  
    POST_CREATED: 'post:created',
    POST_LIKED: 'post:liked',
    POST_UNLIKED: 'post:unliked',
    COMMENT_ADDED: 'comment:added',
    // User events
    USER_ACHIEVEMENT: 'user:achievement',
    USER_LEVEL_UP: 'user:level-up',
    // System events
    PLUGIN_ACTIVATED: 'plugin:activated',
    PLUGIN_DEACTIVATED: 'plugin:deactivated',
    NOTIFICATION_SHOW: 'notification:show',
};
