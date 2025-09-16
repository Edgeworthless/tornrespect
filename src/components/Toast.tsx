import { useEffect, useState } from 'react'
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export interface ToastProps {
  type: 'loading' | 'success' | 'error'
  title: string
  message?: string
  progress?: { current: number; total?: number }
  duration?: number
  onClose?: () => void
}

export default function Toast({ type, title, message, progress, duration = 2500, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [type, duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'loading':
        return <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'loading':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/50'
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/50'
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/50'
    }
  }

  const getProgressText = () => {
    if (!progress) return null
    
    const { current, total } = progress
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {current.toLocaleString()} attacks processed
        {total ? ` / ${total.toLocaleString()}` : ' (fetching in batches...)'}
      </div>
    )
  }

  const getProgressBar = () => {
    if (!progress || type !== 'loading') return null
    
    const { current, total } = progress
    const percentage = total ? (current / total) * 100 : 50
    
    return (
      <div className="mt-2 h-1.5 w-full rounded-full bg-blue-200 dark:bg-blue-800">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            total ? 'bg-blue-600 dark:bg-blue-400' : 'bg-blue-600 dark:bg-blue-400 animate-pulse'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div
        className={`
          w-96 shadow-lg rounded-lg border ${getColors()}
          pointer-events-auto overflow-hidden
        `}
      >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {title}
                </p>
                {message && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {message}
                  </p>
                )}
                {getProgressText()}
                {getProgressBar()}
              </div>
              {type !== 'loading' && (
                <div className="ml-4 flex flex-shrink-0">
                  <button
                    className="inline-flex rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}