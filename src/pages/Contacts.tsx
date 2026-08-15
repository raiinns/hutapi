import { useState } from 'react'
import { Pencil, Trash2, X, UserCircle2, Phone, UserPlus, FileText, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Contact } from '../types'
import ConfirmDialog from '../components/ConfirmDialog'

interface Props {
    contacts: Contact[]
    onAdd: (nama: string, nomorHp?: string, catatan?: string) => void
    onUpdate: (id: string, updates: Partial<Pick<Contact, 'nama' | 'nomorHp' | 'catatan'>>) => void
    onDelete: (id: string) => void
}

interface EditState {
    id: string
    nama: string
    nomorHp: string
    catatan: string
}

export default function Contacts({ contacts, onAdd, onUpdate, onDelete }: Props) {
    const [showForm, setShowForm] = useState(false)
    const [newNama, setNewNama] = useState('')
    const [newHp, setNewHp] = useState('')
    const [newCatatan, setNewCatatan] = useState('')
    const [editState, setEditState] = useState<EditState | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)

    function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!newNama.trim()) {
            toast.error('Nama kontak tidak boleh kosong')
            return
        }
        onAdd(newNama.trim(), newHp.trim() || undefined, newCatatan.trim() || undefined)
        toast.success(`Kontak "${newNama.trim()}" berhasil ditambahkan`)
        setNewNama('')
        setNewHp('')
        setNewCatatan('')
        setShowForm(false)
    }

    function handleEdit(c: Contact) {
        setEditState({
            id: c.id,
            nama: c.nama,
            nomorHp: c.nomorHp ?? '',
            catatan: c.catatan ?? '',
        })
    }

    function handleSaveEdit() {
        if (!editState) return
        if (!editState.nama.trim()) {
            toast.error('Nama kontak tidak boleh kosong')
            return
        }
        onUpdate(editState.id, {
            nama: editState.nama.trim(),
            nomorHp: editState.nomorHp.trim() || undefined,
            catatan: editState.catatan.trim() || undefined,
        })
        toast.success('Perubahan kontak berhasil disimpan')
        setEditState(null)
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return
        onDelete(deleteTarget.id)
        toast.success(`Kontak "${deleteTarget.nama}" beserta seluruh riwayat transaksi telah dihapus`)
        setDeleteTarget(null)
    }

    const inputClassName =
        'w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15'

    return (
        <div className="space-y-4">
            <header className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-semibold leading-tight text-foreground lg:text-2xl">Kontak</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{contacts.length}</span>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    <Plus size={15} />
                    Tambah kontak
                </button>
            </header>

            {contacts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted/40">
                        <UserCircle2 size={21} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Belum ada kontak</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {contacts.map((c) => (
                        <div key={c.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                            {editState?.id === c.id ? (
                                <div className="space-y-3 p-3.5">
                                    <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                                        <p className="text-sm font-semibold text-foreground">Edit kontak</p>
                                        <button
                                            type="button"
                                            onClick={() => setEditState(null)}
                                            aria-label="Tutup edit kontak"
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <UserCircle2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={editState.nama}
                                                onChange={(e) => setEditState({ ...editState, nama: e.target.value })}
                                                className={inputClassName}
                                                aria-label="Nama kontak"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="tel"
                                                placeholder="Nomor HP"
                                                value={editState.nomorHp}
                                                onChange={(e) => setEditState({ ...editState, nomorHp: e.target.value })}
                                                className={inputClassName}
                                                aria-label="Nomor HP kontak"
                                            />
                                        </div>
                                        <div className="relative">
                                            <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Catatan"
                                                value={editState.catatan}
                                                onChange={(e) => setEditState({ ...editState, catatan: e.target.value })}
                                                className={inputClassName}
                                                aria-label="Catatan kontak"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setEditState(null)}
                                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveEdit}
                                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                                        >
                                            Simpan
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-3.5">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                                        <UserCircle2 size={19} className="text-primary" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold leading-tight text-foreground">{c.nama}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                            {c.nomorHp && (
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Phone size={11} className="flex-shrink-0" />
                                                    {c.nomorHp}
                                                </span>
                                            )}
                                            {c.catatan && (
                                                <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                                                    <FileText size={11} className="flex-shrink-0" />
                                                    <span className="truncate">{c.catatan}</span>
                                                </span>
                                            )}
                                        </div>

                                    </div>

                                    <div className="flex flex-shrink-0 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(c)}
                                            aria-label={`Edit ${c.nama}`}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(c)}
                                            aria-label={`Hapus ${c.nama}`}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-3 sm:items-center sm:p-4 backdrop-blur-xs animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="add-contact-title"
                >
                    <form
                        onSubmit={handleAdd}
                        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-5 shadow-xl animate-fade-in"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <UserPlus size={17} />
                                </div>
                                <h3 id="add-contact-title" className="text-base font-semibold text-foreground">Tambah kontak</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                aria-label="Tutup form tambah kontak"
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label htmlFor="new-contact-name" className="mb-1.5 block text-xs font-medium text-foreground">Nama lengkap</label>
                                <div className="relative">
                                    <UserCircle2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        id="new-contact-name"
                                        type="text"
                                        placeholder="Contoh: Budi Santoso"
                                        value={newNama}
                                        onChange={(e) => setNewNama(e.target.value)}
                                        required
                                        autoFocus
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="new-contact-phone" className="mb-1.5 block text-xs font-medium text-foreground">Nomor HP <span className="font-normal text-muted-foreground">(opsional)</span></label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        id="new-contact-phone"
                                        type="tel"
                                        placeholder="08xxxxxxxxxx"
                                        value={newHp}
                                        onChange={(e) => setNewHp(e.target.value)}
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="new-contact-note" className="mb-1.5 block text-xs font-medium text-foreground">Catatan <span className="font-normal text-muted-foreground">(opsional)</span></label>
                                <div className="relative">
                                    <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        id="new-contact-note"
                                        type="text"
                                        placeholder="Contoh: Pelanggan toko"
                                        value={newCatatan}
                                        onChange={(e) => setNewCatatan(e.target.value)}
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-border pt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
                            >
                                Simpan kontak
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Hapus Kontak?"
                description={
                    <span>
                        Menghapus kontak <strong className="text-foreground font-bold">"{deleteTarget?.nama}"</strong> akan menghapus <strong>seluruh catatan riwayat transaksi hutang dan piutang</strong> dari kontak ini.
                    </span>
                }
                confirmText="Ya, Hapus Semua"
                cancelText="Batal"
                variant="danger"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    )
}

