// LocalStorage 工具函数

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  }
  catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error)
    return defaultValue
  }
}

export function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  }
  catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  }
  catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error)
  }
}
