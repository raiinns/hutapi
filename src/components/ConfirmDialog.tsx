import { useEffect } from 'react'
import { AlertTriangle, Trash2, Info, X } from 'lucide-react'

export interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    description: string | React.ReactNode
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    isLoading?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'danger',
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onCancel()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, isLoading, onCancel])

    if (!isOpen) return null

    const iconConfig = {
        danger: {
            icon: <Trash2 size={22} className="text-rose-600 dark:text-rose-400" />,
            bg: 'bg-rose-500/15 border-rose-500/30',
            buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500/40 shadow-rose-600/20',
        },
        warning: {
            icon: <AlertTriangle size={22} className="text-amber-600 dark:text-amber-400" />,
            bg: 'bg-amber-500/15 border-amber-500/30',
            buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500/40 shadow-amber-600/20',
        },
        info: {
            icon: <Info size={22} className="text-primary" />,
            bg: 'bg-primary/15 border-primary/30',
            buttonBg: 'bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-primary/40 shadow-primary/20',
        },
    }[variant]

    return (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-16 sm:pt-24 p-4">
            {/* Darker high-contrast Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
                onClick={isLoading ? undefined : onCancel}
                aria-hidden="true"
            />

            {/* Solid White Modal Box positioned top-center */}
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-desc"
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-2 border-slate-300 bg-white p-6 shadow-2xl ring-1 ring-black/20 animate-fade-in sm:scale-100"
            >
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    aria-label="Tutup dialog"
                    className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <X size={18} />
                </button>

                <div className="flex items-start gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconConfig.bg}`}>
                        {iconConfig.icon}
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                        <h3 id="confirm-dialog-title" className="text-lg font-extrabold tracking-tight text-slate-900">
                            {title}
                        </h3>
                        <div id="confirm-dialog-desc" className="mt-2 text-xs sm:text-sm font-semibold leading-relaxed text-slate-700">
                            {description}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="rounded-xl border border-slate-300 bg-slate-100 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-200 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex items-center justify-center gap-2 rounded-xl px-6 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold shadow-md transition-all active:scale-[0.98] focus:outline-none focus:ring-4 disabled:opacity-50 cursor-pointer ${iconConfig.buttonBg}`}
                    >
                        {isLoading ? 'Memproses...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

