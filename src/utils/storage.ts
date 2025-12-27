/**
 * Storage utility functions for localStorage operations
 */

/**
 * Get a value from localStorage
 * @param key - The key to retrieve
 * @param defaultValue - Default value if key doesn't exist
 * @returns The parsed value or default value
 */
export function getStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return defaultValue ?? null
    }
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return defaultValue ?? null
  }
}

/**
 * Set a value in localStorage
 * @param key - The key to store
 * @param value - The value to store (will be JSON stringified)
 */
export function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error)
  }
}

/**
 * Remove a value from localStorage
 * @param key - The key to remove
 */
export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error)
  }
}

/**
 * Clear all values from localStorage
 */
export function clearStorage(): void {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}
