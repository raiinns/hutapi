import { useState, type FormEvent } from 'react'
import {
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    FileText,
    History,
    Percent,
    Plus,
    Trash2,
    Wallet,
    X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useCicilan, useAddCicilan, useDeleteCicilan, useCustoms } from '../hooks/useSupabase'
import type { Transaksi, PembayaranCicilan } from '../types'
import { appendThousand, formatRupiah, formatWIBDate, formatWIBTime, toDatetimeLocal } from '../utils/format'
import ConfirmDialog from './ConfirmDialog'

interface Props {
    transaksi: Transaksi | null
    onClose: () => void
}

export default function CicilanModal({ transaksi, onClose }: Props) {
    if (!transaksi) return null

    const [nominalStr, setNominalStr] = useState('')
    const [waktu, setWaktu] = useState(() => toDatetimeLocal(new Date()))
    const [sumberDana, setSumberDana] = useState(transaksi.sumberDana || 'Cash')
    const [catatan, setCatatan] = useState('')
    const [deleteTarget, setDeleteTarget] = useState<PembayaranCicilan | null>(null)

    const { data: customs } = useCustoms()
    const allSumber = customs?.allSumber || ['Cash', 'DANA', 'BRI', 'GoPay', 'SeaBank', 'ShopeePay', 'MitraBukalapak']

    const { data: cicilanList = [], isLoading } = useCicilan(transaksi.id)
    const addCicilanMutation = useAddCicilan()
    const deleteCicilanMutation = useDeleteCicilan()

    const nominalPokok = Number(transaksi.nominal) || 0
    const totalDibayar = cicilanList.reduce((acc, c) => acc + c.nominal, 0)
    const sisaTagihan = Math.max(0, nominalPokok - totalDibayar)
    const progressPercent = nominalPokok > 0 ? Math.min(100, Math.round((totalDibayar / nominalPokok) * 100)) : 0
    const isPiutang = transaksi.jenis === 'piutang'

    const handleNominalChange = (val: string) => {
        setNominalStr(val.replace(/\D/g, ''))
    }

    const handleAppend000 = () => {
        setNominalStr((prev) => appendThousand(prev || '0'))
    }

    const handleSetFullRemaining = () => {
        setNominalStr(String(sisaTagihan))
    }

    const handleSubmitPayment = async (e: FormEvent) => {
        e.preventDefault()
        const nominalVal = Number(nominalStr)
        if (!nominalVal || nominalVal <= 0) {
            toast.error('Masukkan nominal cicilan yang valid')
            return
        }

        if (nominalVal > sisaTagihan && sisaTagihan > 0) {
            toast.error(`Nominal melebihi sisa tagihan (${formatRupiah(sisaTagihan)})`)
            return
        }

        try {
            await addCicilanMutation.mutateAsync({
                transaksiId: transaksi.id,
                nominal: nominalVal,
                sumberDana,
                catatan: catatan.trim() || undefined,
                waktu: new Date(waktu).toISOString(),
            })

            toast.success(`Cicilan ${formatRupiah(nominalVal)} berhasil dicatat`)
            setNominalStr('')
            setCatatan('')
        } catch (err: any) {
            toast.error('Gagal mencatat cicilan: ' + (err?.message || 'Terjadi kesalahan'))
        }
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return
        try {
            await deleteCicilanMutation.mutateAsync({
                id: deleteTarget.id,
                transaksiId: transaksi.id,
            })
            toast.success('Entri pembayaran cicilan berhasil dihapus')
            setDeleteTarget(null)
        } catch (err: any) {
            toast.error('Gagal menghapus cicilan: ' + (err?.message || 'Terjadi kesalahan'))
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Box */}
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="cicilan-modal-title"
                className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:max-w-xl sm:rounded-2xl animate-fade-in"
            >
                {/* Header */}
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-muted/30 px-5 py-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <CreditCard size={15} />
                            </span>
                            <h2 id="cicilan-modal-title" className="truncate text-base font-bold text-foreground">
                                Pembayaran Cicilan
                            </h2>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                            {isPiutang ? 'Piutang kepada' : 'Hutang dari'}{' '}
                            <strong className="text-foreground font-bold">{transaksi.namaContact}</strong> · {transaksi.kategori}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup modal cicilan"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                    {/* Status & Progress Summary Card */}
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3.5 shadow-2xs">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-muted-foreground uppercase tracking-wider">Progress Pelunasan</span>
                            <span
                                className={`font-extrabold px-2.5 py-0.5 rounded-full text-xs border ${
                                    sisaTagihan === 0
                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                        : progressPercent > 0
                                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                            : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                }`}
                            >
                                {sisaTagihan === 0 ? 'LUNAS' : progressPercent > 0 ? `DICICIL (${progressPercent}%)` : 'BELUM LUNAS'}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                            <div className="h-3 w-full overflow-hidden rounded-full bg-muted border border-border">
                                <div
                                    className={`h-full transition-all duration-500 ${
                                        sisaTagihan === 0 ? 'bg-emerald-500' : 'bg-primary'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                            <div className="rounded-xl border border-border bg-card p-2.5 shadow-2xs">
                                <p className="text-[11px] font-semibold text-muted-foreground">Total Pokok</p>
                                <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-foreground tabular-nums truncate">
                                    {formatRupiah(nominalPokok)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-2.5 shadow-2xs">
                                <p className="text-[11px] font-semibold text-muted-foreground">Sudah Dibayar</p>
                                <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                                    {formatRupiah(totalDibayar)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-2.5 shadow-2xs">
                                <p className="text-[11px] font-semibold text-muted-foreground">Sisa Tagihan</p>
                                <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 tabular-nums truncate">
                                    {formatRupiah(sisaTagihan)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Input Form (Only if sisaTagihan > 0) */}
                    {sisaTagihan > 0 ? (
                        <form onSubmit={handleSubmitPayment} className="space-y-3.5 rounded-2xl border border-border bg-card p-4 shadow-sm">
                            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                                <Plus size={14} className="text-primary" />
                                Catat Cicilan Baru
                            </h3>

                            {/* Nominal Input */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="cicilan-nominal" className="text-xs font-bold text-foreground">
                                        Nominal Pembayaran
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleSetFullRemaining}
                                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                                    >
                                        Bayar Lunas Sisa ({formatRupiah(sisaTagihan)})
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-muted-foreground">
                                            Rp
                                        </span>
                                        <input
                                            id="cicilan-nominal"
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={nominalStr ? Number(nominalStr).toLocaleString('id-ID') : ''}
                                            onChange={(e) => handleNominalChange(e.target.value)}
                                            className="min-h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3.5 py-2.5 font-bold text-foreground text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAppend000}
                                        aria-label="Tambahkan 000"
                                        className="min-h-11 rounded-xl border border-border bg-card px-3.5 py-2.5 font-mono text-sm font-bold text-primary shadow-2xs transition-all hover:bg-primary/10 hover:border-primary cursor-pointer"
                                    >
                                        +000
                                    </button>
                                </div>
                            </div>

                            {/* Tanggal & Sumber Dana */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label htmlFor="cicilan-waktu" className="flex items-center gap-1 text-xs font-bold text-foreground">
                                        <Calendar size={13} className="text-primary" />
                                        Tanggal & Waktu
                                    </label>
                                    <input
                                        id="cicilan-waktu"
                                        type="datetime-local"
                                        value={waktu}
                                        onChange={(e) => setWaktu(e.target.value)}
                                        onClick={(e) => e.currentTarget.showPicker?.()}
                                        className="min-h-11 w-full cursor-pointer rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="cicilan-sumber" className="flex items-center gap-1 text-xs font-bold text-foreground">
                                        <Wallet size={13} className="text-primary" />
                                        Sumber Dana
                                    </label>
                                    <select
                                        id="cicilan-sumber"
                                        value={sumberDana}
                                        onChange={(e) => setSumberDana(e.target.value)}
                                        className="min-h-11 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                                    >
                                        {allSumber.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Catatan */}
                            <div className="space-y-1.5">
                                <label htmlFor="cicilan-catatan" className="flex items-center gap-1 text-xs font-bold text-foreground">
                                    <FileText size={13} className="text-primary" />
                                    Catatan Cicilan <span className="font-normal text-muted-foreground">(opsional)</span>
                                </label>
                                <input
                                    id="cicilan-catatan"
                                    type="text"
                                    placeholder="Contoh: Cicilan ke-1 via transfer"
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    className="min-h-11 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={addCicilanMutation.isPending}
                                className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                            >
                                <Plus size={16} />
                                {addCicilanMutation.isPending ? 'Menyimpan...' : 'Simpan Pembayaran Cicilan'}
                            </button>
                        </form>
                    ) : (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                            <CheckCircle size={24} className="mx-auto text-emerald-600 dark:text-emerald-400" />
                            <p className="mt-1 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                Transaksi ini telah lunas sepenuhnya
                            </p>
                        </div>
                    )}

                    {/* Riwayat Log Pembayaran */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                                <History size={14} className="text-primary" />
                                Riwayat Log Pembayaran ({cicilanList.length})
                            </h3>
                        </div>

                        {isLoading ? (
                            <div className="space-y-2">
                                {[0, 1].map((i) => (
                                    <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-muted/40" />
                                ))}
                            </div>
                        ) : cicilanList.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs font-semibold text-muted-foreground">
                                Belum ada riwayat pembayaran cicilan untuk transaksi ini.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cicilanList.map((c, idx) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-extrabold text-foreground tabular-nums">
                                                    #{cicilanList.length - idx}
                                                </span>
                                                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                    {formatRupiah(c.nominal)}
                                                </span>
                                                <span className="rounded-md border border-sky-500/25 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                                                    {c.sumberDana}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                                                {formatWIBDate(c.waktu)} · {formatWIBTime(c.waktu)}
                                                {c.catatan && <span className="text-foreground"> — "{c.catatan}"</span>}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(c)}
                                            aria-label="Hapus cicilan"
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Confirm Dialog to Delete Installment Log */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Hapus Log Cicilan?"
                description={
                    <span>
                        Apakah Anda yakin ingin menghapus catatan cicilan sebesar{' '}
                        <strong>{formatRupiah(deleteTarget?.nominal || 0)}</strong> ini? Sisa tagihan transaksi akan bertambah kembali.
                    </span>
                }
                confirmText="Ya, Hapus Cicilan"
                cancelText="Batal"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}
