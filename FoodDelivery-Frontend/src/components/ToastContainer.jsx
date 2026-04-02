import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

let toastId = 0
let addToastCallback = null

export const toast = {
  success: (message) => {
    if (addToastCallback) addToastCallback({ type: 'success', message })
  },
  error: (message) => {
    if (addToastCallback) addToastCallback({ type: 'error', message })
  },
  info: (message) => {
    if (addToastCallback) addToastCallback({ type: 'info', message })
  },
  warning: (message) => {
    if (addToastCallback) addToastCallback({ type: 'warning', message })
  }
}

const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    addToastCallback = (toast) => {
      const id = toastId++
      setToasts((prev) => [...prev, { ...toast, id }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    }
    return () => {
      addToastCallback = null
    }
  }, [])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="size-6 text-green-500" />
      case 'error':
        return <XCircle className="size-6 text-red-500" />
      case 'warning':
        return <AlertTriangle className="size-6 text-orange-500" />
      default:
        return <Info className="size-6 text-blue-500" />
    }
  }

  const getColor = (type) => {
    switch (type) {
      case 'success':
        return 'from-green-50 to-emerald-50 border-green-200'
      case 'error':
        return 'from-red-50 to-rose-50 border-red-200'
      case 'warning':
        return 'from-orange-50 to-amber-50 border-orange-200'
      default:
        return 'from-blue-50 to-cyan-50 border-blue-200'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-9999 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`bg-gradient-to-r ${getColor(toast.type)} border-2 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-md pointer-events-auto`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {getIcon(toast.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ToastContainer
