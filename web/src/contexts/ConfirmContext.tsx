import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, X } from 'lucide-react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

type ConfirmFunction = (options: ConfirmOptions | string) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFunction>(() => Promise.resolve(false))

export const useConfirm = () => useContext(ConfirmContext)

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' })
  const [resolver, setResolver] = useState<(value: boolean) => void>()

  const confirm: ConfirmFunction = useCallback((opts) => {
    return new Promise((resolve) => {
      setOptions(typeof opts === 'string' ? { message: opts } : opts)
      setResolver(() => resolve)
      setIsOpen(true)
    })
  }, [])

  const handleConfirm = () => {
    if (resolver) resolver(true)
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (resolver) resolver(false)
    setIsOpen(false)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={(open) => {
        if (!open) handleCancel()
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] animate-in fade-in duration-200" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-[9999] w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white p-6 shadow-2xl focus:outline-none animate-in zoom-in-95 fade-in duration-200 border border-gray-100">
            
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${options.variant === 'danger' ? 'bg-red-100 text-red-500' : options.variant === 'warning' ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-500'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              
              <div className="flex-1 mt-1">
                <Dialog.Title className="text-lg font-bold text-gray-900 mb-2">
                  {options.title || 'Confirmação'}
                </Dialog.Title>
                <Dialog.Description className="text-gray-600 text-sm leading-relaxed mb-6">
                  {options.message}
                </Dialog.Description>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Dialog.Close asChild>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-200 focus:outline-none"
                >
                  {options.cancelText || 'Cancelar'}
                </button>
              </Dialog.Close>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors focus:ring-2 focus:outline-none ${options.variant === 'danger' ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500/50' : 'bg-dolce-rosa hover:bg-dolce-rosa-escuro focus:ring-dolce-rosa/50'}`}
              >
                {options.confirmText || 'Confirmar'}
              </button>
            </div>
            
            <Dialog.Close asChild>
              <button
                onClick={handleCancel}
                className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  )
}
