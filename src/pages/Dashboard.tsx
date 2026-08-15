import { useState } from 'react'
import { CirclePlus, X } from 'lucide-react'
import type { Transaksi, Contact, NewTransaksiPayload, EditTransaksiPayload } from '../types'

import SummaryCards from '../components/SummaryCards'
import TransaksiForm from '../components/TransaksiForm'
import TransaksiTable from '../components/TransaksiTable'
import EditModal from '../components/EditModal'

interface Props {
    contacts: Contact[]
    transaksi: Transaksi[]
    allSumber: string[]
    allKategori: string[]
    totalPiutang: number
    totalHutang: number
    saldoPerSumber: Record<string, number>
    onAddTransaksi: (payload: NewTransaksiPayload) => void
    onEditTransaksi: (id: string, updates: EditTransaksiPayload) => void
    onDeleteTransaksi: (id: string) => void
    onAddContact: (nama: string) => Promise<Contact>
    onAddSumber: (nama: string) => void
    onDeleteSumber: (nama: string) => void
    onAddKategori: (nama: string) => void
    onDeleteKategori: (nama: string) => void
}

export default function Dashboard({
    contacts,
    transaksi,
    allSumber,
    allKategori,
    totalPiutang,
    totalHutang,
    saldoPerSumber,
    onAddTransaksi,
    onEditTransaksi,
    onDeleteTransaksi,
    onAddContact,
    onAddSumber,
    onDeleteSumber,
    onAddKategori,
    onDeleteKategori,
}: Props) {
    const [editTarget, setEditTarget] = useState<Transaksi | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)

    const handleAddSubmit = (payload: NewTransaksiPayload) => {
        onAddTransaksi(payload)
        setShowAddForm(false)
    }

    return (
        <div className="space-y-7 pb-20 lg:pb-0">
            <div className="flex items-start justify-between gap-4">
                <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">Dasbor</h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="hidden items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 lg:flex"
                >
                    <CirclePlus size={17} />
                    Tambah transaksi
                </button>
            </div>

            <SummaryCards
                totalPiutang={totalPiutang}
                totalHutang={totalHutang}
                saldoPerSumber={saldoPerSumber}
            />

            <div className="flex items-end justify-between gap-4">
                <h2 className="text-base font-semibold text-foreground">Saldo per kontak</h2>
                <span className="flex-none text-xs text-muted-foreground">
                    {transaksi.length} transaksi
                </span>
            </div>

            {/* Transaksi Table */}
            <TransaksiTable 
                transaksi={transaksi} 
                contacts={contacts} 
                onEdit={setEditTarget} 
            />

            {/* Edit Modal */}
            <EditModal
                transaksi={editTarget}
                onClose={() => setEditTarget(null)}
                onSave={onEditTransaksi}
                onDelete={onDeleteTransaksi}
            />

            {/* Add Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
                    <div
                        className="absolute inset-0 bg-black/45 transition-opacity"
                        onClick={() => setShowAddForm(false)}
                    />

                    <div className="relative z-10 max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-xl bg-card shadow-xl sm:max-h-[90vh] sm:rounded-xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
                            <h3 className="text-base font-semibold text-foreground">Tambah transaksi</h3>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Tutup form"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 pb-24 sm:pb-5">
                            <TransaksiForm
                                contacts={contacts}
                                allSumber={allSumber}
                                allKategori={allKategori}
                                onSubmit={handleAddSubmit}
                                onAddContact={onAddContact}
                                onAddSumber={onAddSumber}
                                onDeleteSumber={onDeleteSumber}
                                onAddKategori={onAddKategori}
                                onDeleteKategori={onDeleteKategori}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button (FAB) */}
            <button
                onClick={() => setShowAddForm(true)}
                className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/20 lg:hidden"
                aria-label="Tambah transaksi baru"
                title="Tambah transaksi"
            >
                <CirclePlus 
                    size={28} 
                    strokeWidth={2}
                    className="pointer-events-none"
                />
            </button>
        </div>
    )
}
