import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDarkStore = defineStore('dark', () => {
  const isDark = ref(false)

  const loadTheme = () => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
      isDark.value = true
      document.documentElement.classList.add('dark')
    }
    else if (stored === 'light') {
      isDark.value = false
      document.documentElement.classList.remove('dark')
    }
    else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = prefersDark
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      }
    }
  }

  const toggleDark = () => {
    isDark.value = !isDark.value
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
    else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const setDark = (value: boolean) => {
    isDark.value = value
    if (value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
    else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return {
    isDark,
    loadTheme,
    toggleDark,
    setDark,
  }
})
