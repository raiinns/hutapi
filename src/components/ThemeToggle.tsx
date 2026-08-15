import { useEffect, useState } from 'react'
import { Moon, Sun, Laptop } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('hutapi-theme') as Theme
            if (saved && ['light', 'dark', 'system'].includes(saved)) {
                return saved
            }
        }
        return 'system'
    })

    useEffect(() => {
        const root = document.documentElement

        const applyTheme = (t: Theme) => {
            if (t === 'dark') {
                root.classList.add('dark')
            } else if (t === 'light') {
                root.classList.remove('dark')
            } else {
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                if (systemDark) {
                    root.classList.add('dark')
                } else {
                    root.classList.remove('dark')
                }
            }
        }

        applyTheme(theme)
        localStorage.setItem('hutapi-theme', theme)

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            const listener = (e: MediaQueryListEvent) => {
                if (e.matches) {
                    root.classList.add('dark')
                } else {
                    root.classList.remove('dark')
                }
            }
            mediaQuery.addEventListener('change', listener)
            return () => mediaQuery.removeEventListener('change', listener)
        }
    }, [theme])

    const cycleTheme = () => {
        if (theme === 'system') setTheme('light')
        else if (theme === 'light') setTheme('dark')
        else setTheme('system')
    }

    return (
        <button
            onClick={cycleTheme}
            type="button"
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            title={`Tema saat ini: ${theme === 'light' ? 'Terang' : theme === 'dark' ? 'Gelap' : 'Otomatis'}`}
            aria-label="Ganti tema tampilan"
        >
            {theme === 'light' && <Sun size={15} className="text-amber-500" />}
            {theme === 'dark' && <Moon size={15} className="text-indigo-400" />}
            {theme === 'system' && <Laptop size={15} className="text-muted-foreground" />}
            <span className="capitalize">
                {theme === 'light' ? 'Terang' : theme === 'dark' ? 'Gelap' : 'Otomatis'}
            </span>
        </button>
    )
}
