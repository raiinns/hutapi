import { useState, useEffect, type FormEvent } from 'react'
import { X, ChevronDown, Trash2, CheckCircle, Tag, Wallet } from 'lucide-react'
import type { Transaksi, JenisTransaksi, KategoriTransaksi, SumberDana, StatusPelunasan, EditTransaksiPayload } from '../types'
import { DEFAULT_KATEGORI, DEFAULT_SUMBER_DANA } from '../types'
import { appendThousand } from '../utils/format'

interface Props {
    transaksi: Transaksi | null
    onClose: () => void
    onSave: (id: string, updates: EditTransaksiPayload) => void
    onDelete: (id: string) => void
}

export default function EditModal({ transaksi, onClose, onSave, onDelete }: Props) {
    const [jenis, setJenis] = useState<JenisTransaksi>('piutang')
    const [kategori, setKategori] = useState<KategoriTransaksi>('Uang Tunai')
    const [sumberDana, setSumberDana] = useState<SumberDana>('Cash')
    const [nominal, setNominal] = useState('')
    const [catatan, setCatatan] = useState('')
    const [status, setStatus] = useState<StatusPelunasan>('belum_lunas')

    useEffect(() => {
        if (transaksi) {
            setJenis(transaksi.jenis)
            setKategori(transaksi.kategori)
            setSumberDana(transaksi.sumberDana)
            setNominal(String(transaksi.nominal))
            setCatatan(transaksi.catatan ?? '')
            setStatus(transaksi.status)
        }
    }, [transaksi])

    if (!transaksi) return null

    function formatDisplayNominal(val: string): string {
        if (!val) return ''
        return Number(val).toLocaleString('id-ID')
    }

    function handleNominalInput(val: string) {
        setNominal(val.replace(/\D/g, ''))
    }

    function handleAppend000() {
        setNominal((prev) => appendThousand(prev || '0'))
    }

    function handleSave(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        onSave(transaksi!.id, {
            jenis,
            kategori,
            sumberDana,
            nominal: Number(nominal),
            catatan: catatan.trim() || undefined,
            status,
        })
        onClose()
    }

    function handleDelete() {
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini? Data tidak bisa dikembalikan.')) {
            onDelete(transaksi!.id)
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} aria-hidden="true" />

            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-transaction-title"
                className="relative z-20 flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl animate-fade-in"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
                    <h2 id="edit-transaction-title" className="text-base font-bold text-foreground">Edit Transaksi</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup edit transaksi"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X size={18} />
                    </button>
                </header>

                <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
                    <div className="space-y-5 overflow-y-auto p-5">
                        <fieldset className="space-y-2">
                            <legend className="text-xs font-bold uppercase tracking-wider text-foreground">Jenis Transaksi</legend>
                            <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setJenis('piutang')}
                                    aria-pressed={jenis === 'piutang'}
                                    className={`min-h-11 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${jenis === 'piutang'
                                            ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                                            : 'text-muted-foreground hover:bg-card hover:text-foreground'
                                        }`}
                                >
                                    Piutang
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setJenis('hutang')}
                                    aria-pressed={jenis === 'hutang'}
                                    className={`min-h-11 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${jenis === 'hutang'
                                            ? 'bg-rose-600 text-white shadow-xs dark:bg-rose-500'
                                            : 'text-muted-foreground hover:bg-card hover:text-foreground'
                                        }`}
                                >
                                    Hutang
                                </button>
                            </div>
                        </fieldset>

                        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 shadow-2xs">
                            <p className="text-xs font-bold text-muted-foreground">Kontak Terkait</p>
                            <p className="mt-0.5 text-base font-bold text-foreground">{transaksi.namaContact}</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="edit-transaction-amount" className="text-xs font-bold text-foreground">Nominal (Rp)</label>
                            <div className="flex items-stretch gap-2">
                                <div className="relative min-w-0 flex-1">
                                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-foreground">Rp</span>
                                    <input
                                        id="edit-transaction-amount"
                                        type="text"
                                        inputMode="numeric"
                                        value={formatDisplayNominal(nominal)}
                                        onChange={(e) => handleNominalInput(e.target.value.replace(/\./g, '').replace(/,/g, ''))}
                                        className="min-h-11 w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 font-mono text-base font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAppend000}
                                    title="Tambahkan 000 di akhir angka"
                                    aria-label="Tambahkan 000 di akhir nominal"
                                    className="min-h-11 rounded-xl border border-border bg-card px-4 py-2.5 font-mono text-sm font-bold text-primary shadow-2xs transition-all hover:bg-primary/10 hover:border-primary"
                                >
                                    +000
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 dark:bg-indigo-500/10">
                                <label htmlFor="edit-transaction-category" className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                    <Tag size={14} />
                                    Kategori
                                </label>
                                <div className="relative">
                                    <select
                                        id="edit-transaction-category"
                                        value={kategori}
                                        onChange={(e) => setKategori(e.target.value as KategoriTransaksi)}
                                        className="min-h-11 w-full appearance-none rounded-xl border border-indigo-500/30 bg-card px-3.5 py-2.5 pr-9 text-sm font-semibold text-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                                    >
                                        {DEFAULT_KATEGORI.map((item) => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                                </div>
                            </div>

                            <div className="space-y-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 dark:bg-sky-500/10">
                                <label htmlFor="edit-transaction-source" className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
                                    <Wallet size={14} />
                                    Sumber Dana
                                </label>
                                <div className="relative">
                                    <select
                                        id="edit-transaction-source"
                                        value={sumberDana}
                                        onChange={(e) => setSumberDana(e.target.value as SumberDana)}
                                        className="min-h-11 w-full appearance-none rounded-xl border border-sky-500/30 bg-card px-3.5 py-2.5 pr-9 text-sm font-semibold text-foreground focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
                                    >
                                        {DEFAULT_SUMBER_DANA.map((item) => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-500" />
                                </div>
                            </div>
                        </div>

                        <fieldset className="space-y-2">
                            <legend className="text-xs font-bold uppercase tracking-wider text-foreground">Status Pelunasan</legend>
                            <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setStatus('belum_lunas')}
                                    aria-pressed={status === 'belum_lunas'}
                                    className={`min-h-11 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${status === 'belum_lunas'
                                            ? 'bg-rose-600 text-white shadow-xs dark:bg-rose-500'
                                            : 'text-muted-foreground hover:bg-card hover:text-foreground'
                                        }`}
                                >
                                    Belum Lunas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus('lunas')}
                                    aria-pressed={status === 'lunas'}
                                    className={`min-h-11 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${status === 'lunas'
                                            ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500'
                                            : 'text-muted-foreground hover:bg-card hover:text-foreground'
                                        }`}
                                >
                                    Lunas
                                </button>
                            </div>
                        </fieldset>

                        <div className="space-y-2">
                            <label htmlFor="edit-transaction-note" className="text-xs font-bold text-foreground">
                                Catatan <span className="font-normal text-muted-foreground">(opsional)</span>
                            </label>
                            <textarea
                                id="edit-transaction-note"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                rows={3}
                                placeholder="Tambahkan detail transaksi"
                                className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                            />
                        </div>
                    </div>

                    <footer className="flex shrink-0 gap-3 border-t border-border bg-card p-4 sm:px-5">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-400 transition-colors hover:bg-rose-500/20 shadow-2xs"
                        >
                            <Trash2 size={15} />
                            Hapus
                        </button>
                        <button
                            type="submit"
                            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.99]"
                        >
                            <CheckCircle size={17} />
                            Simpan Perubahan
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    )
}
