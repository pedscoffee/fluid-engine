/**
 * Async localStorage wrapper to prevent main thread blocking
 * Uses requestIdleCallback to defer storage operations when possible
 */

/**
 * Save data to localStorage asynchronously
 * @param {string} key - Storage key
 * @param {any} data - Data to store (will be JSON stringified)
 * @returns {Promise<void>}
 */
export function saveToStorageAsync(key, data) {
    return new Promise((resolve) => {
        const save = () => {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                resolve();
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                resolve(); // Resolve anyway to prevent blocking
            }
        };

        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
            requestIdleCallback(save, { timeout: 1000 });
        } else {
            setTimeout(save, 0);
        }
    });
}

/**
 * Load data from localStorage (synchronous, but fast)
 * @param {string} key - Storage key
 * @returns {any|null} Parsed data or null if not found
 */
export function loadFromStorage(key) {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
    return null;
}

/**
 * Remove item from localStorage asynchronously
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export function removeFromStorageAsync(key) {
    return new Promise((resolve) => {
        const remove = () => {
            try {
                localStorage.removeItem(key);
                resolve();
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                resolve();
            }
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(remove, { timeout: 500 });
        } else {
            setTimeout(remove, 0);
        }
    });
}

/**
 * Batched storage manager for multiple updates
 * Delays writes until idle to reduce localStorage thrashing
 */
export class BatchedStorage {
    constructor(key, flushDelay = 2000) {
        this.key = key;
        this.flushDelay = flushDelay;
        this.pendingData = null;
        this.flushTimer = null;
    }

    /**
     * Queue data to be saved (batches multiple calls)
     * @param {any} data - Data to save
     */
    queueSave(data) {
        this.pendingData = data;

        // Clear existing timer
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
        }

        // Schedule flush
        this.flushTimer = setTimeout(() => {
            this.flush();
        }, this.flushDelay);
    }

    /**
     * Immediately save pending data
     * @returns {Promise<void>}
     */
    async flush() {
        if (this.pendingData !== null) {
            await saveToStorageAsync(this.key, this.pendingData);
            this.pendingData = null;
        }
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * Load data from storage
     * @returns {any|null}
     */
    load() {
        return loadFromStorage(this.key);
    }
}
