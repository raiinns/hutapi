import { useMemo, useState, type ReactNode } from 'react'
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    CalendarDays,
    Check,
    Clock,
    CreditCard,
    Pencil,
    SlidersHorizontal,
    Tag,
    Wallet,
    X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useContactHistory, type SortField, type SortOrder } from '../hooks/useContactHistory'
import { useUpdateTransaksi } from '../hooks/useSupabase'
import type { Contact, StatusPelunasan, Transaksi } from '../types'
import { formatRupiah, formatWIBDate, formatWIBTime, shortId } from '../utils/format'
import CicilanModal from './CicilanModal'

interface Props {
    contact: Contact | null
    onClose: () => void
    onEdit: (t: Transaksi) => void
}

type FilterStatus = 'semua' | StatusPelunasan

export default function ContactHistoryModal({ contact, onClose, onEdit }: Props) {
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('semua')
    const [sortBy, setSortBy] = useState<SortField>('waktu')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const [showFilters, setShowFilters] = useState(false)
    const [activeCicilanTarget, setActiveCicilanTarget] = useState<Transaksi | null>(null)

    const updateTransaksiMutation = useUpdateTransaksi()

    const { data, isLoading, error } = useContactHistory({
        contactId: contact?.id || null,
        filterStatus,
        sortBy,
        sortOrder,
    })

    const handleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('desc')
        }
    }

    const handleToggleStatus = (item: Transaksi) => {
        const nextStatus: StatusPelunasan = item.status === 'lunas' ? 'belum_lunas' : 'lunas'
        updateTransaksiMutation.mutate({
            id: item.id,
            updates: { status: nextStatus },
        })
        if (nextStatus === 'lunas') {
            toast.success(`Transaksi ${item.jenis} (${formatRupiah(item.nominal)}) ditandai LUNAS`)
        } else {
            toast.success(`Status transaksi diubah kembali ke BELUM LUNAS`)
        }
    }

    const outstandingBalance = useMemo(() => {
        if (!data) return 0
        return data.totalHutangBelumLunas - data.totalPiutangBelumLunas
    }, [data])

    if (!contact) return null

    const outstandingLabel = outstandingBalance > 0
        ? `Anda berutang kepada ${contact.nama}`
        : outstandingBalance < 0
            ? `${contact.nama} berutang kepada Anda`
            : 'Tidak ada saldo yang belum lunas'

    const filteredHutang = data
        ? filterStatus === 'lunas'
            ? data.totalHutangLunas
            : data.totalHutangBelumLunas
        : 0

    const filteredPiutang = data
        ? filterStatus === 'lunas'
            ? data.totalPiutangLunas
            : data.totalPiutangBelumLunas
        : 0

    const statusOptions: Array<{ value: FilterStatus; label: string; count: number }> = [
        { value: 'semua', label: 'Semua', count: data?.count || 0 },
        {
            value: 'belum_lunas',
            label: 'Belum Lunas',
            count: data?.transaksi.filter((item) => item.status === 'belum_lunas').length || 0,
        },
        {
            value: 'dicicil',
            label: 'Dicicil',
            count: data?.transaksi.filter((item) => item.status === 'dicicil').length || 0,
        },
        {
            value: 'lunas',
            label: 'Lunas',
            count: data?.transaksi.filter((item) => item.status === 'lunas').length || 0,
        },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5">
            <button
                type="button"
                aria-label="Tutup riwayat transaksi"
                className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="contact-history-title"
                className="relative z-10 flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:max-w-2xl sm:rounded-2xl animate-fade-in"
            >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-muted/30 px-5 py-4">
                    <div className="min-w-0">
                        <h2 id="contact-history-title" className="truncate text-base font-bold text-foreground">
                            {contact.nama}
                        </h2>
                        {(contact.nomorHp || contact.catatan) && (
                            <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
                                {[contact.nomorHp, contact.catatan].filter(Boolean).join(' · ')}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto pb-28 sm:pb-5">
                    <div className="border-b border-border bg-muted/20 p-4 sm:p-5">
                        <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sisa Saldo Belum Lunas</p>
                            <p
                                className={`mt-1.5 text-xl font-bold tabular-nums ${outstandingBalance > 0
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : outstandingBalance < 0
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-foreground'
                                    }`}
                            >
                                {formatRupiah(Math.abs(outstandingBalance))}
                            </p>
                            <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">{outstandingLabel}</p>
                        </div>
                    </div>

                    <div className="space-y-3 border-b border-border p-4 sm:px-5">
                        <div className="flex items-center gap-2">
                            <div className="grid flex-1 grid-cols-4 rounded-xl border border-border bg-muted/40 p-1">
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFilterStatus(option.value)}
                                        className={`rounded-lg px-1 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${filterStatus === option.value
                                                ? 'bg-card text-foreground shadow-2xs ring-1 ring-border'
                                                : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <span className="block truncate">{option.label}</span>
                                        <span className="mt-0.5 block font-bold tabular-nums text-muted-foreground">
                                            ({option.count})
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                aria-label="Atur urutan"
                                aria-expanded={showFilters}
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-2xs transition-all cursor-pointer ${showFilters
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-card text-foreground hover:bg-muted'
                                    }`}
                            >
                                <SlidersHorizontal size={16} />
                            </button>
                        </div>

                        {showFilters && (
                            <div className="rounded-xl border border-border bg-card p-3 shadow-2xs animate-fade-in">
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Urutkan Berdasarkan
                                </p>
                                <div className="flex gap-2">
                                    <SortButton
                                        active={sortBy === 'waktu'}
                                        label="Tanggal"
                                        icon={<CalendarDays size={14} />}
                                        order={sortBy === 'waktu' ? sortOrder : undefined}
                                        onClick={() => handleSort('waktu')}
                                    />
                                    <SortButton
                                        active={sortBy === 'nominal'}
                                        label="Nominal"
                                        icon={<ArrowUpDown size={14} />}
                                        order={sortBy === 'nominal' ? sortOrder : undefined}
                                        onClick={() => handleSort('nominal')}
                                    />
                                </div>
                            </div>
                        )}

                        {data && data.count > 0 && (
                            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs">
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground">Sisa Hutang</p>
                                    <p className="mt-1 text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
                                        {formatRupiah(filteredHutang)}
                                    </p>
                                </div>
                                <div className="border-l border-border pl-3">
                                    <p className="text-xs font-bold text-muted-foreground">Sisa Piutang</p>
                                    <p className="mt-1 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                        {formatRupiah(filteredPiutang)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 sm:px-5">
                        {isLoading ? (
                            <div className="space-y-2.5" aria-label="Memuat riwayat transaksi">
                                {[0, 1, 2].map((item) => (
                                    <div key={item} className="animate-pulse rounded-xl border border-border p-4">
                                        <div className="flex justify-between gap-4">
                                            <div className="space-y-2">
                                                <div className="h-3.5 w-28 rounded bg-muted" />
                                                <div className="h-3 w-40 rounded bg-muted" />
                                            </div>
                                            <div className="h-5 w-24 rounded bg-muted" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
                                <AlertCircle size={22} className="mx-auto text-destructive" />
                                <p className="mt-2 text-sm font-bold text-destructive">Gagal memuat riwayat transaksi</p>
                            </div>
                        ) : data?.transaksi.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-8 text-center shadow-2xs">
                                <p className="text-sm font-bold text-foreground">
                                    {filterStatus === 'semua' ? 'Belum ada transaksi' : 'Tidak ada transaksi dengan status ini'}
                                </p>

                                {filterStatus !== 'semua' && (
                                    <button
                                        type="button"
                                        onClick={() => setFilterStatus('semua')}
                                        className="mt-4 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-2xs transition-colors hover:bg-muted cursor-pointer"
                                    >
                                        Lihat Semua Transaksi
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {data?.transaksi.map((item) => (
                                    <HistoryRow
                                        key={item.id}
                                        transaksi={item}
                                        onEdit={onEdit}
                                        onToggleStatus={() => handleToggleStatus(item)}
                                        onOpenCicilan={() => setActiveCicilanTarget(item)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Cicilan Modal */}
            <CicilanModal
                transaksi={activeCicilanTarget}
                onClose={() => setActiveCicilanTarget(null)}
            />
        </div>
    )
}

interface SortButtonProps {
    active: boolean
    label: string
    icon: ReactNode
    order?: SortOrder
    onClick: () => void
}

function SortButton({ active, label, icon, order, onClick }: SortButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all shadow-2xs cursor-pointer ${active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
        >
            {icon}
            <span>{label}</span>
            {order === 'asc' && <ArrowUp size={13} />}
            {order === 'desc' && <ArrowDown size={13} />}
        </button>
    )
}

function HistoryRow({
    transaksi: item,
    onEdit,
    onToggleStatus,
    onOpenCicilan,
}: {
    transaksi: Transaksi
    onEdit: (t: Transaksi) => void
    onToggleStatus: () => void
    onOpenCicilan: () => void
}) {
    const isPiutang = item.jenis === 'piutang'
    const isLunas = item.status === 'lunas'
    const isDicicil = item.status === 'dicicil'
    const totalDibayar = item.totalDibayar ?? 0
    const sisaNominal = item.sisaNominal ?? (isLunas ? 0 : item.nominal)
    const percent = item.nominal > 0 ? Math.min(100, Math.round((totalDibayar / item.nominal) * 100)) : 0

    return (
        <article className="rounded-xl border border-border bg-card p-4 shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {isPiutang ? 'Piutang' : 'Hutang'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/25 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                            <Tag size={11} />
                            {item.kategori}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                            <Wallet size={11} />
                            {item.sumberDana}
                        </span>
                    </div>
                    <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                        {formatWIBDate(item.waktu)} · {formatWIBTime(item.waktu)}
                    </p>
                </div>
                <div className="shrink-0 text-right">
                    <p
                        className={`text-base font-bold tabular-nums ${isPiutang
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                    >
                        {formatRupiah(item.nominal)}
                    </p>
                    <span
                        className={`mt-1.5 inline-block rounded-md px-2.5 py-0.5 text-xs font-bold border ${isLunas
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : isDicicil
                                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                    : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            }`}
                    >
                        {isLunas ? 'Lunas' : isDicicil ? `Dicicil (${percent}%)` : 'Belum Lunas'}
                    </span>
                </div>
            </div>

            {/* Cicilan Progress Bar (If partial payments exist or status is dicicil) */}
            {totalDibayar > 0 && !isLunas && (
                <div className="mt-3 rounded-lg bg-muted/40 p-2.5 border border-border/70 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                        <span>
                            Dibayar: <strong className="text-emerald-600 dark:text-emerald-400">{formatRupiah(totalDibayar)}</strong>
                        </span>
                        <span>
                            Sisa: <strong className="text-rose-600 dark:text-rose-400">{formatRupiah(sisaNominal)}</strong>
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border">
                        <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            )}

            {item.catatan && (
                <p className="mt-3 border-t border-border/80 pt-3 text-xs font-medium leading-relaxed text-foreground/90">
                    "{item.catatan}"
                </p>
            )}

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/50 pt-2.5">
                <div>
                    {isLunas && item.waktuLunas ? (
                        <p className="text-xs font-semibold text-muted-foreground">
                            Dilunasi {formatWIBDate(item.waktuLunas)}
                        </p>
                    ) : (
                        <span />
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Tombol Cicil */}
                    <button
                        type="button"
                        onClick={onOpenCicilan}
                        title="Bayar atau Lihat Riwayat Cicilan"
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer shadow-2xs"
                    >
                        <CreditCard size={13} />
                        Cicil
                    </button>

                    {/* Tombol Tandai Lunas / Batal Lunas */}
                    <button
                        type="button"
                        onClick={onToggleStatus}
                        title={isLunas ? 'Ubah ke Belum Lunas' : 'Tandai Lunas Sekarang'}
                        className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-all cursor-pointer shadow-2xs ${isLunas
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                            }`}
                    >
                        {isLunas ? <Clock size={13} /> : <Check size={13} />}
                        {isLunas ? 'Batal Lunas' : 'Tandai Lunas'}
                    </button>

                    <button
                        type="button"
                        onClick={() => onEdit(item)}
                        aria-label={`Edit transaksi ${shortId(item.id)}`}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground shadow-2xs transition-colors hover:bg-muted cursor-pointer"
                    >
                        <Pencil size={13} />
                        Edit
                    </button>
                </div>
            </div>
        </article>
    )
}


