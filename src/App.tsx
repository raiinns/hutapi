import { useEffect, useState } from 'react'
import {
    BookOpenText,
    LayoutDashboard,
    LogOut,
    Users,
} from 'lucide-react'
import { useSupabaseStore as useStore } from './hooks/useSupabaseStore'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Auth from './components/Auth'
import ThemeToggle from './components/ThemeToggle'
import { supabase } from './lib/supabase'

type Page = 'dashboard' | 'contacts'

export default function App() {
    const [session, setSession] = useState<any>(null)
    const [page, setPage] = useState<Page>('dashboard')

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    const {
        contacts,
        transaksi,
        allSumber,
        allKategori,
        addContact,
        updateContact,
        deleteContact,
        addTransaksi,
        updateTransaksi,
        deleteTransaksi,
        addSumber,
        deleteSumber,
        addKategori,
        deleteKategori,
        totalPiutangBelumLunas,
        totalHutangBelumLunas,
        saldoPerSumber,
    } = useStore()

    if (!session) {
        return <Auth />
    }

    return (
        <div className="min-h-screen bg-background text-foreground lg:flex">
            <aside className="hidden min-h-screen w-60 flex-col border-r border-border bg-card lg:fixed lg:inset-y-0 lg:left-0 lg:flex">
                <Brand />

                <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Navigasi utama">
                    <DesktopNavItem
                        icon={<LayoutDashboard size={18} />}
                        label="Dasbor"
                        active={page === 'dashboard'}
                        onClick={() => setPage('dashboard')}
                    />
                    <DesktopNavItem
                        icon={<Users size={18} />}
                        label="Kontak"
                        active={page === 'contacts'}
                        onClick={() => setPage('contacts')}
                        badge={contacts.length > 0 ? String(contacts.length) : undefined}
                    />
                </nav>

                <div className="space-y-2 border-t border-border p-3">
                    <div className="px-1">
                        <ThemeToggle />
                    </div>
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <LogOut size={17} />
                        Keluar
                    </button>
                </div>
            </aside>

            <div className="min-w-0 flex-1 lg:pl-60">
                <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur lg:hidden">
                    <div className="flex h-16 items-center justify-between px-4">
                        <Brand compact />
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={() => supabase.auth.signOut()}
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Keluar dari akun"
                                title="Keluar"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="pb-24 lg:pb-10">
                    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
                        {page === 'dashboard' ? (
                            <Dashboard
                                contacts={contacts}
                                transaksi={transaksi}
                                allSumber={allSumber}
                                allKategori={allKategori}
                                totalPiutang={totalPiutangBelumLunas}
                                totalHutang={totalHutangBelumLunas}
                                saldoPerSumber={saldoPerSumber}
                                onAddTransaksi={addTransaksi}
                                onEditTransaksi={updateTransaksi}
                                onDeleteTransaksi={deleteTransaksi}
                                onAddContact={async (nama) => await addContact(nama)}
                                onAddSumber={addSumber}
                                onDeleteSumber={deleteSumber}
                                onAddKategori={addKategori}
                                onDeleteKategori={deleteKategori}
                            />
                        ) : (
                            <Contacts
                                contacts={contacts}
                                onAdd={addContact}
                                onUpdate={updateContact}
                                onDelete={deleteContact}
                            />
                        )}
                    </div>
                </main>

                <nav className="safe-area-pb fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden" aria-label="Navigasi mobile">
                    <div className="mx-auto flex max-w-lg">
                        <MobileNavItem
                            icon={<LayoutDashboard size={20} />}
                            label="Dasbor"
                            active={page === 'dashboard'}
                            onClick={() => setPage('dashboard')}
                        />
                        <MobileNavItem
                            icon={<Users size={20} />}
                            label="Kontak"
                            active={page === 'contacts'}
                            onClick={() => setPage('contacts')}
                            badge={contacts.length > 0 ? String(contacts.length) : undefined}
                        />
                    </div>
                </nav>
            </div>
        </div>
    )
}

function Brand({ compact = false }: { compact?: boolean }) {
    return (
        <div className={compact ? 'flex items-center gap-2.5' : 'flex h-20 items-center gap-3 border-b border-border px-5'}>
            <div className={`${compact ? 'h-9 w-9' : 'h-10 w-10'} flex items-center justify-center rounded-xl bg-primary text-primary-foreground`}>
                <BookOpenText size={compact ? 18 : 20} strokeWidth={2} />
            </div>
            <p className="text-sm font-bold tracking-tight text-foreground">HUTAPI</p>
        </div>
    )
}

interface NavItemProps {
    icon: React.ReactNode
    label: string
    active: boolean
    onClick: () => void
    badge?: string
}

function DesktopNavItem({ icon, label, active, onClick, badge }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
        >
            {icon}
            <span className="flex-1 text-left">{label}</span>
            {badge && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {badge}
                </span>
            )}
        </button>
    )
}

function MobileNavItem({ icon, label, active, onClick, badge }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
            }`}
        >
            <span className="relative">
                {icon}
                {badge && (
                    <span className="absolute -right-3 -top-2 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground">
                        {badge}
                    </span>
                )}
            </span>
            <span>{label}</span>
            {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-primary" />}
        </button>
    )
}
