import { useState } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

const toasts: Toast[] = []
let toastId = 0

export function toast({ title, description, variant = 'default' }: Omit<Toast, 'id'>) {
  const id = (++toastId).toString()
  const newToast: Toast = { id, title, description, variant }
  
  toasts.push(newToast)
  
  // Simple console logging for now - in a real app you'd use a toast library
  console.log(`Toast (${variant}): ${title}${description ? ` - ${description}` : ''}`)
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
    }
  }, 5000)
}