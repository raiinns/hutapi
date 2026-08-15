import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, X, ArrowRight } from 'lucide-react'
import type { Contact, Transaksi } from '../types'
import { formatRupiah } from '../utils/format'
import ContactHistoryModal from './ContactHistoryModal'

interface Props {
    transaksi: Transaksi[]
    contacts: Contact[]
    onEdit: (t: Transaksi) => void
}

type FilterStatus = 'semua' | 'belum_lunas' | 'lunas'
type FilterJenis = 'semua' | 'hutang' | 'piutang'

interface ContactStats {
    contact: Contact
    totalHutangBelumLunas: number
    totalPiutangBelumLunas: number
    totalHutangLunas: number
    totalPiutangLunas: number
    transaksiCount: number
}

export default function TransaksiTable({ transaksi, contacts, onEdit }: Props) {
    const [searchNama, setSearchNama] = useState('')
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('semua')
    const [filterJenis, setFilterJenis] = useState<FilterJenis>('semua')
    const [showFilter, setShowFilter] = useState(false)
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

    const statsPerContact = useMemo(() => {
        const map = new Map<string, ContactStats>()

        contacts.forEach((contact) => {
            map.set(contact.id, {
                contact,
                totalHutangBelumLunas: 0,
                totalPiutangBelumLunas: 0,
                totalHutangLunas: 0,
                totalPiutangLunas: 0,
                transaksiCount: 0,
            })
        })

        transaksi.forEach((item) => {
            if (!map.has(item.contactId)) {
                map.set(item.contactId, {
                    contact: {
                        id: item.contactId,
                        nama: item.namaContact,
                        createdAt: item.waktu,
                    },
                    totalHutangBelumLunas: 0,
                    totalPiutangBelumLunas: 0,
                    totalHutangLunas: 0,
                    totalPiutangLunas: 0,
                    transaksiCount: 0,
                })
            }

            const stats = map.get(item.contactId)!
            stats.transaksiCount++

            if (item.status === 'lunas') {
                if (item.jenis === 'hutang') stats.totalHutangLunas += item.nominal
                else stats.totalPiutangLunas += item.nominal
            } else if (item.jenis === 'hutang') {
                stats.totalHutangBelumLunas += item.nominal
            } else {
                stats.totalPiutangBelumLunas += item.nominal
            }
        })

        return Array.from(map.values()).filter((stats) => stats.transaksiCount > 0)
    }, [transaksi, contacts])

    const filteredStats = useMemo(() => {
        return statsPerContact.filter((stats) => {
            const matchNama = stats.contact.nama.toLowerCase().includes(searchNama.toLowerCase())

            let matchStatus = true
            if (filterStatus === 'belum_lunas') {
                matchStatus = stats.totalHutangBelumLunas > 0 || stats.totalPiutangBelumLunas > 0
            } else if (filterStatus === 'lunas') {
                matchStatus = stats.totalHutangLunas > 0 || stats.totalPiutangLunas > 0
            }

            let matchJenis = true
            if (filterJenis === 'hutang') {
                matchJenis = stats.totalHutangBelumLunas > 0 || stats.totalHutangLunas > 0
            } else if (filterJenis === 'piutang') {
                matchJenis = stats.totalPiutangBelumLunas > 0 || stats.totalPiutangLunas > 0
            }

            return matchNama && matchStatus && matchJenis
        })
    }, [statsPerContact, searchNama, filterStatus, filterJenis])

    const activeFilterCount = (filterStatus !== 'semua' ? 1 : 0) + (filterJenis !== 'semua' ? 1 : 0)
    const hasQuery = searchNama.trim().length > 0 || activeFilterCount > 0

    return (
        <div className="space-y-3.5 pb-safe">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        type="text"
                        placeholder="Cari nama kontak..."
                        value={searchNama}
                        onChange={(event) => setSearchNama(event.target.value)}
                        className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-9 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-2xs"
                    />
                    {searchNama && (
                        <button
                            type="button"
                            onClick={() => setSearchNama('')}
                            aria-label="Hapus pencarian"
                            className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setShowFilter(!showFilter)}
                    aria-expanded={showFilter}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all shadow-2xs ${
                        showFilter || activeFilterCount > 0
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-foreground hover:bg-muted'
                    }`}
                >
                    <SlidersHorizontal size={15} />
                    <span className="hidden sm:inline">Filter</span>
                    {activeFilterCount > 0 && (
                        <span className="rounded-full bg-primary-foreground px-1.5 py-0.5 text-xs font-bold text-primary tabular-nums">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {showFilter && (
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm animate-fade-in">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FilterGroup<FilterStatus>
                            label="Status transaksi"
                            value={filterStatus}
                            options={[
                                { value: 'semua', label: 'Semua' },
                                { value: 'belum_lunas', label: 'Belum lunas' },
                                { value: 'lunas', label: 'Lunas' },
                            ]}
                            onChange={setFilterStatus}
                        />
                        <FilterGroup<FilterJenis>
                            label="Jenis transaksi"
                            value={filterJenis}
                            options={[
                                { value: 'semua', label: 'Semua' },
                                { value: 'piutang', label: 'Piutang' },
                                { value: 'hutang', label: 'Hutang' },
                            ]}
                            onChange={setFilterJenis}
                        />
                    </div>
                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setFilterStatus('semua')
                                setFilterJenis('semua')
                            }}
                            className="mt-4 text-xs font-semibold text-primary underline-offset-4 hover:underline"
                        >
                            Reset semua filter
                        </button>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between px-1 text-xs font-semibold text-muted-foreground">
                <p>
                    <span className="font-bold text-foreground">{filteredStats.length}</span>
                    {hasQuery ? ` dari ${statsPerContact.length}` : ''} kontak
                </p>
                {activeFilterCount > 0 && <p className="text-primary font-bold">{activeFilterCount} filter aktif</p>}
            </div>

            {filteredStats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center shadow-2xs">
                    <p className="text-sm font-bold text-foreground">
                        {statsPerContact.length === 0 ? 'Belum ada riwayat transaksi' : 'Tidak ada kontak yang sesuai'}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-xs font-medium leading-relaxed text-muted-foreground">
                        {statsPerContact.length === 0
                            ? 'Transaksi akan dikelompokkan per kontak dan ditampilkan di sini.'
                            : 'Coba ubah kata pencarian atau reset filter yang aktif.'}
                    </p>
                    {statsPerContact.length > 0 && hasQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchNama('')
                                setFilterStatus('semua')
                                setFilterJenis('semua')
                            }}
                            className="mt-4 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-2xs transition-colors hover:bg-muted"
                        >
                            Tampilkan semua kontak
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-2.5">
                    {filteredStats.map((stats) => (
                        <ContactGroupCard
                            key={stats.contact.id}
                            stats={stats}
                            onClick={() => setSelectedContact(stats.contact)}
                        />
                    ))}
                </div>
            )}

            <ContactHistoryModal
                contact={selectedContact}
                onClose={() => setSelectedContact(null)}
                onEdit={onEdit}
            />
        </div>
    )
}

interface FilterGroupProps<T extends string> {
    label: string
    value: T
    options: Array<{ value: T; label: string }>
    onChange: (value: T) => void
}

function FilterGroup<T extends string>({ label, value, options, onChange }: FilterGroupProps<T>) {
    return (
        <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {label}
            </legend>
            <div className="flex rounded-xl border border-border bg-muted/50 p-1">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-all ${
                            value === option.value
                                ? 'bg-card text-foreground shadow-2xs ring-1 ring-border'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </fieldset>
    )
}

function ContactGroupCard({ stats, onClick }: { stats: ContactStats; onClick: () => void }) {
    const {
        contact,
        totalHutangBelumLunas,
        totalPiutangBelumLunas,
        transaksiCount,
    } = stats
    const hasHutang = totalHutangBelumLunas > 0
    const hasPiutang = totalPiutangBelumLunas > 0
    const lunasSemua = !hasHutang && !hasPiutang

    return (
        <button
            type="button"
            onClick={onClick}
            className="group w-full rounded-xl border border-border bg-card p-4 text-left shadow-2xs transition-all hover:border-primary/50 hover:shadow-md active:bg-muted/40"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="truncate text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {contact.nama}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{transaksiCount} transaksi</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold">
                    {lunasSemua ? (
                        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
                            Semua lunas
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-muted-foreground group-hover:text-primary">
                            Detail <ArrowRight size={14} />
                        </span>
                    )}
                </div>
            </div>

            {!lunasSemua && (
                <div className="mt-3 grid gap-2.5 border-t border-border/80 pt-3 sm:grid-cols-2">
                    {hasHutang && (
                        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5">
                            <p className="text-xs font-semibold text-muted-foreground">Anda berutang kepada {contact.nama}</p>
                            <p className="mt-0.5 text-base font-bold tabular-nums text-rose-700 dark:text-rose-400">
                                {formatRupiah(totalHutangBelumLunas)}
                            </p>
                        </div>
                    )}
                    {hasPiutang && (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                            <p className="text-xs font-semibold text-muted-foreground">{contact.nama} berutang kepada Anda</p>
                            <p className="mt-0.5 text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                                {formatRupiah(totalPiutangBelumLunas)}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </button>
    )
}
