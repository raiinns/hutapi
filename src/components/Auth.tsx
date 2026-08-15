import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import ThemeToggle from './ThemeToggle'

export default function Auth() {
    const [isLoading, setIsLoading] = useState(false)
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            toast.error('Email dan password wajib diisi.')
            return
        }

        setIsLoading(true)
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                toast.success('Login berhasil.')
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                toast.success('Registrasi berhasil. Silakan masuk.')
                setIsLogin(true)
            }
        } catch (error: any) {
            toast.error(error.message || 'Terjadi kesalahan')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 transition-colors">
            <div className="absolute right-4 top-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-sm">
                <div className="mb-7 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md">
                        <BookOpen size={28} className="text-primary-foreground" strokeWidth={2.2} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">HUTAPI</h1>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">Catatan Keuangan, Hutang & Piutang</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                    <h2 className="mb-5 text-lg font-bold text-foreground">
                        {isLogin ? 'Masuk ke Hutapi' : 'Buat Akun Baru'}
                    </h2>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label htmlFor="auth-email" className="mb-1.5 block text-xs font-bold text-foreground">Email</label>
                            <input
                                id="auth-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
                                placeholder="nama@email.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="auth-password" className="mb-1.5 block text-xs font-bold text-foreground">Password</label>
                            <input
                                id="auth-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
                                placeholder="Minimal 6 karakter"
                                autoComplete={isLogin ? 'current-password' : 'new-password'}
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
                        >
                            {isLoading && <Loader2 size={17} className="animate-spin" />}
                            {isLogin ? 'Masuk' : 'Daftar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
