const THEME_STORAGE_KEY = 'tornRespectTheme'

export type Theme = 'light' | 'dark'

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  
  // Default to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  
  return 'light'
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  
  // Apply to document
  const root = window.document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function toggleTheme(): Theme {
  const current = getStoredTheme()
  const newTheme = current === 'light' ? 'dark' : 'light'
  setTheme(newTheme)
  return newTheme
}

export function initializeTheme(): void {
  const theme = getStoredTheme()
  setTheme(theme)
}