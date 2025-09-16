import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import Toast, { ToastProps } from './Toast'

interface ToastItem extends ToastProps {
  id: string
}

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'onClose'>) => string
  updateToast: (id: string, updates: Partial<ToastProps>) => void
  hideToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastItem = {
      ...toast,
      id,
      onClose: () => hideToast(id)
    }
    
    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const updateToast = useCallback((id: string, updates: Partial<ToastProps>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ))
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const contextValue: ToastContextType = {
    showToast,
    updateToast,
    hideToast,
    clearAllToasts
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}