import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('hutapi-theme') as Theme
            if (saved && ['light', 'dark'].includes(saved)) {
                return saved
            }
        }
        return 'light'
    })

    useEffect(() => {
        const root = document.documentElement
        if (theme === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
        localStorage.setItem('hutapi-theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
    }

    return (
        <button
            onClick={toggleTheme}
            type="button"
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            title={`Tema saat ini: ${theme === 'light' ? 'Terang' : 'Gelap'}`}
            aria-label="Ganti tema tampilan"
        >
            {theme === 'light' ? (
                <Sun size={15} className="text-amber-500" />
            ) : (
                <Moon size={15} className="text-indigo-400" />
            )}
            <span className="capitalize">
                {theme === 'light' ? 'Terang' : 'Gelap'}
            </span>
        </button>
    )
}

