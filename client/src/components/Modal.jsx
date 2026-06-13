import { useEffect } from 'react'
import Button from './Button'

function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 px-5 py-8">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <section
        className="relative w-full max-w-lg rounded-md border border-neutral-200 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-6 border-b border-neutral-200 pb-5">
          <h2 className="font-serif text-2xl text-neutral-950">{title}</h2>
          <button
            type="button"
            className="flex size-9 items-center justify-center border border-neutral-200 text-xl leading-none text-neutral-500 transition hover:border-neutral-950 hover:text-neutral-950"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="py-6">{children}</div>
        <div className="flex justify-end border-t border-neutral-200 pt-5">
          <Button variant="transparent" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </section>
    </div>
  )
}

export default Modal
