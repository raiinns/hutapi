import { useState, type FormEvent } from 'react'
import { Plus, ChevronDown, Settings2, X, Check, Tag, Wallet } from 'lucide-react'
import type { Contact, NewTransaksiPayload } from '../types'
import { appendThousand } from '../utils/format'

interface Props {
    contacts: Contact[]
    allSumber: string[]
    allKategori: string[]
    onSubmit: (payload: NewTransaksiPayload) => void
    onAddContact: (nama: string) => Promise<Contact>
    onAddSumber: (nama: string) => void
    onAddKategori: (nama: string) => void
    onDeleteSumber: (nama: string) => void
    onDeleteKategori: (nama: string) => void
}

export default function TransaksiForm({
    contacts,
    allSumber,
    allKategori,
    onSubmit,
    onAddContact,
    onAddSumber,
    onAddKategori,
    onDeleteSumber,
    onDeleteKategori,
}: Props) {
    const [contactId, setContactId] = useState('')
    const [namaManual, setNamaManual] = useState('')
    const [showNewContact, setShowNewContact] = useState(false)
    const [jenis, setJenis] = useState<'hutang' | 'piutang'>('piutang')
    const [kategori, setKategori] = useState(allKategori[0] ?? 'Uang Tunai')
    const [sumberDana, setSumberDana] = useState(allSumber[0] ?? 'Cash')
    const [nominal, setNominal] = useState('')
    const [catatan, setCatatan] = useState('')
    const [showManageKategori, setShowManageKategori] = useState(false)
    const [showManageSumber, setShowManageSumber] = useState(false)
    const [newKategoriInput, setNewKategoriInput] = useState('')
    const [newSumberInput, setNewSumberInput] = useState('')

    function handleNominalChange(val: string) {
        setNominal(val.replace(/\D/g, ''))
    }

    function handleAppend000() {
        setNominal((prev) => appendThousand(prev || '0'))
    }

    function formatDisplay(val: string): string {
        if (!val) return ''
        return Number(val).toLocaleString('id-ID')
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!nominal || Number(nominal) <= 0) return

        let finalContactId = contactId
        let finalNama = contacts.find((contact) => contact.id === contactId)?.nama ?? ''

        if (showNewContact && namaManual.trim()) {
            try {
                const created = await onAddContact(namaManual.trim())
                finalContactId = created.id
                finalNama = created.nama
            } catch {
                alert('Gagal membuat kontak baru. Silakan coba lagi.')
                return
            }
        } else if (!contactId) {
            alert('Pilih nama kontak terlebih dahulu')
            return
        }

        if (!finalContactId) {
            alert('Terjadi kesalahan saat membuat kontak. ID tidak valid.')
            return
        }

        onSubmit({
            contactId: finalContactId,
            namaContact: finalNama,
            jenis,
            kategori,
            sumberDana,
            nominal: Number(nominal),
            catatan: catatan.trim() || undefined,
        })

        setNominal('')
        setCatatan('')
        setNamaManual('')
        setShowNewContact(false)
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-5">
                <fieldset className="space-y-2">
                    <legend className="text-xs font-bold uppercase tracking-wider text-foreground">Jenis Transaksi</legend>
                    <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/50 p-1">
                        <button
                            type="button"
                            onClick={() => setJenis('piutang')}
                            aria-pressed={jenis === 'piutang'}
                            className={`min-h-11 rounded-lg px-3 py-2 text-xs sm:text-sm font-bold transition-all ${jenis === 'piutang'
                                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
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
                                    ? 'bg-rose-600 text-white shadow-sm dark:bg-rose-500'
                                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                                }`}
                        >
                            Hutang
                        </button>
                    </div>
                </fieldset>

                <div className="space-y-2">
                    <label htmlFor={showNewContact ? 'new-contact-name' : 'transaction-contact'} className="text-xs font-bold text-foreground">
                        Nama Kontak
                    </label>
                    {showNewContact ? (
                        <div className="flex gap-2">
                            <input
                                id="new-contact-name"
                                type="text"
                                placeholder="Tulis nama kontak baru..."
                                value={namaManual}
                                onChange={(e) => setNamaManual(e.target.value)}
                                autoFocus
                                className="min-h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setShowNewContact(false)
                                    setNamaManual('')
                                }}
                                className="min-h-11 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-2xs transition-colors hover:bg-muted"
                            >
                                Batal
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <div className="relative min-w-0 flex-1">
                                <select
                                    id="transaction-contact"
                                    value={contactId}
                                    onChange={(e) => setContactId(e.target.value)}
                                    className="min-h-11 w-full appearance-none rounded-xl border border-input bg-card px-3.5 py-2.5 pr-9 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                                >
                                    <option value="">-- Pilih Kontak --</option>
                                    {contacts.map((contact) => (
                                        <option key={contact.id} value={contact.id}>{contact.nama}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowNewContact(true)
                                    setContactId('')
                                }}
                                className="min-h-11 whitespace-nowrap rounded-xl border border-primary/50 bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 shadow-2xs"
                            >
                                + Kontak Baru
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="transaction-amount" className="text-xs font-bold text-foreground">Nominal (Rp)</label>
                    <div className="flex items-stretch gap-2">
                        <div className="relative min-w-0 flex-1">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-foreground">Rp</span>
                            <input
                                id="transaction-amount"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={formatDisplay(nominal)}
                                onChange={(e) => handleNominalChange(e.target.value.replace(/\./g, '').replace(/,/g, ''))}
                                className="min-h-11 w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 font-mono text-base font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                                required
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
                        <div className="flex min-h-8 items-center justify-between gap-2">
                            <label htmlFor="transaction-category" className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                <Tag size={14} />
                                Kategori
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowManageKategori(true)}
                                className="flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-500/15 dark:text-indigo-400"
                            >
                                <Settings2 size={13} /> Kelola
                            </button>
                        </div>
                        <div className="relative">
                            <select
                                id="transaction-category"
                                value={kategori}
                                onChange={(e) => setKategori(e.target.value)}
                                className="min-h-11 w-full appearance-none rounded-xl border border-indigo-500/30 bg-card px-3.5 py-2.5 pr-9 text-sm font-semibold text-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                            >
                                {allKategori.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                        </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 dark:bg-sky-500/10">
                        <div className="flex min-h-8 items-center justify-between gap-2">
                            <label htmlFor="transaction-source" className="flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
                                <Wallet size={14} />
                                Sumber Dana
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowManageSumber(true)}
                                className="flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-sky-600 transition-colors hover:bg-sky-500/15 dark:text-sky-400"
                            >
                                <Settings2 size={13} /> Kelola
                            </button>
                        </div>
                        <div className="relative">
                            <select
                                id="transaction-source"
                                value={sumberDana}
                                onChange={(e) => setSumberDana(e.target.value)}
                                className="min-h-11 w-full appearance-none rounded-xl border border-sky-500/30 bg-card px-3.5 py-2.5 pr-9 text-sm font-semibold text-foreground focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
                            >
                                {allSumber.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-500" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="transaction-note" className="text-xs font-bold text-foreground">
                        Catatan <span className="font-normal text-muted-foreground">(opsional)</span>
                    </label>
                    <textarea
                        id="transaction-note"
                        placeholder="Tambahkan keteletan detail transaksi (misal: Beli pulsa, pinjam uang)"
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
                    />
                </div>

                <button
                    type="submit"
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.99]"
                >
                    <Plus size={18} />
                    Simpan Transaksi
                </button>
            </form>

            {showManageKategori && (
                <ManageListModal
                    title="Kelola Kategori"
                    items={allKategori}
                    defaultItems={['Uang Tunai', 'Token Listrik', 'Pulsa', 'Paket Data']}
                    inputValue={newKategoriInput}
                    onInputChange={setNewKategoriInput}
                    onAdd={() => {
                        onAddKategori(newKategoriInput)
                        setNewKategoriInput('')
                    }}
                    onDelete={onDeleteKategori}
                    onClose={() => setShowManageKategori(false)}
                />
            )}

            {showManageSumber && (
                <ManageListModal
                    title="Kelola Sumber Dana"
                    items={allSumber}
                    defaultItems={['Cash', 'BCA', 'Mandiri', 'BRI', 'GoPay', 'OVO', 'Dana']}
                    inputValue={newSumberInput}
                    onInputChange={setNewSumberInput}
                    onAdd={() => {
                        onAddSumber(newSumberInput)
                        setNewSumberInput('')
                    }}
                    onDelete={onDeleteSumber}
                    onClose={() => setShowManageSumber(false)}
                />
            )}
        </>
    )
}

interface ManageListModalProps {
    title: string
    items: string[]
    defaultItems: string[]
    inputValue: string
    onInputChange: (val: string) => void
    onAdd: () => void
    onDelete: (item: string) => void
    onClose: () => void
}

function ManageListModal({
    title,
    items,
    defaultItems,
    inputValue,
    onInputChange,
    onAdd,
    onDelete,
    onClose,
}: ManageListModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="text-base font-bold text-foreground">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Tambah item baru..."
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        className="min-h-10 flex-1 rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                        type="button"
                        onClick={onAdd}
                        disabled={!inputValue.trim()}
                        className="flex min-h-10 items-center gap-1 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-2xs disabled:opacity-50 hover:bg-primary/90"
                    >
                        <Plus size={16} /> Tambah
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-border pr-1">
                    {items.map((item) => {
                        const isDefault = defaultItems.includes(item)
                        return (
                            <div key={item} className="flex items-center justify-between pt-2">
                                <span className="text-sm font-semibold text-foreground">{item}</span>
                                {!isDefault && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(item)}
                                        className="text-xs font-bold text-rose-600 hover:underline dark:text-rose-400"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="pt-2 border-t border-border flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-2xs hover:bg-muted"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>
    )
}
