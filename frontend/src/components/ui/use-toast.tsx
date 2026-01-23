import * as React from "react"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
  action?: React.ReactNode
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (props: Omit<Toast, "id">) => void
  dismiss: (toastId?: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)

  // Return a mock implementation if context is not available (for testing)
  if (!context) {
    return {
      toasts: [],
      toast: () => {},
      dismiss: () => {},
    }
  }

  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((props: Omit<Toast, "id">) => {
    const id = Date.now().toString()
    setToasts((prevToasts) => [...prevToasts, { ...props, id }])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = React.useCallback((toastId?: string) => {
    if (toastId) {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== toastId))
    } else {
      setToasts([])
    }
  }, [])

  const value = React.useMemo(
    () => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss]
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}