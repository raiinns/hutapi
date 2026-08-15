import { ChevronDown, ChevronUp, Landmark, WalletCards, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useState } from 'react'
import { formatRupiah } from '../utils/format'

interface Props {
    totalPiutang: number
    totalHutang: number
    saldoPerSumber: Record<string, number>
}

const PREVIEW_COUNT = 4

export default function SummaryCards({ totalPiutang, totalHutang, saldoPerSumber }: Props) {
    const [expanded, setExpanded] = useState(false)
    const entries = Object.entries(saldoPerSumber)
    const hasMore = entries.length > PREVIEW_COUNT
    const visibleEntries = expanded ? entries : entries.slice(0, PREVIEW_COUNT)

    return (
        <section className="space-y-4" aria-labelledby="financial-summary-title">
            <h2 id="financial-summary-title" className="text-base font-semibold text-foreground tracking-tight">
                Ringkasan Keuangan
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
                <SummaryCard
                    label="Piutang"
                    amount={totalPiutang}
                    tone="positive"
                    icon={<ArrowUpRight size={18} className="text-emerald-600 dark:text-emerald-400" />}
                />
                <SummaryCard
                    label="Hutang"
                    amount={totalHutang}
                    tone="negative"
                    icon={<ArrowDownLeft size={18} className="text-rose-600 dark:text-rose-400" />}
                />
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow">
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3.5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-2xs">
                            <WalletCards size={17} />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">Sumber Dana</h3>
                    </div>
                    <span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground shadow-2xs">
                        {entries.length} sumber
                    </span>
                </div>

                {entries.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                        <Landmark size={24} className="mx-auto text-muted-foreground/60" />
                        <p className="mt-2 text-sm font-semibold text-foreground">Belum ada transaksi aktif</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Tambah transaksi untuk melihat saldo sumber dana.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {visibleEntries.map(([source, balance]) => {
                            const isDebt = balance > 0
                            const isReceivable = balance < 0

                            return (
                                <div key={source} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-2xs">
                                            <Landmark size={15} />
                                        </div>
                                        <p className="min-w-0 truncate text-sm font-medium text-foreground">{source}</p>
                                    </div>
                                    <p className={`flex-none text-sm font-bold tabular-nums ${isDebt
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : isReceivable
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-foreground'
                                        }`}>
                                        {isDebt ? '−' : isReceivable ? '+' : ''}{formatRupiah(Math.abs(balance))}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                )}

                {hasMore && (
                    <button
                        onClick={() => setExpanded((current) => !current)}
                        className="flex w-full items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {expanded ? 'Tampilkan Lebih Sedikit' : `Lihat ${entries.length - PREVIEW_COUNT} Sumber Lainnya`}
                    </button>
                )}
            </div>
        </section>
    )
}

interface SummaryCardProps {
    label: string
    amount: number
    tone: 'positive' | 'negative' | 'neutral'
    prefix?: string
    icon?: React.ReactNode
}

function SummaryCard({ label, amount, tone, prefix, icon }: SummaryCardProps) {
    const toneClass = tone === 'positive'
        ? 'text-emerald-700 dark:text-emerald-400'
        : tone === 'negative'
            ? 'text-rose-700 dark:text-rose-400'
            : 'text-foreground'

    const badgeBg = tone === 'positive'
        ? 'border-emerald-500/20 bg-emerald-500/5'
        : tone === 'negative'
            ? 'border-rose-500/20 bg-rose-500/5'
            : 'border-border bg-card'

    return (
        <div className={`rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md ${badgeBg}`}>
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                {icon && <div className="p-1 rounded-md bg-card border border-border shadow-2xs">{icon}</div>}
            </div>
            <p className={`mt-3 text-xl font-bold tracking-tight tabular-nums ${toneClass}`}>
                {prefix}{formatRupiah(amount)}
            </p>
        </div>
    )
}
