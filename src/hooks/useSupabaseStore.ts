import {
    useContacts,
    useTransaksi,
    useCustoms,
    useAddContact,
    useUpdateContact,
    useDeleteContact,
    useAddTransaksi,
    useUpdateTransaksi,
    useDeleteTransaksi,
    useAddSumber,
    useDeleteSumber,
    useAddKategori,
    useDeleteKategori,
    useAddCicilan,
    useDeleteCicilan,
} from './useSupabase'
import type { Contact, Transaksi, NewTransaksiPayload, EditTransaksiPayload, NewCicilanPayload } from '../types'

export function useSupabaseStore() {
    const { data: contacts = [] } = useContacts()
    const { data: transaksi = [] } = useTransaksi()
    const { data: customs } = useCustoms()

    const addContactMutation = useAddContact()
    const updateContactMutation = useUpdateContact()
    const deleteContactMutation = useDeleteContact()

    const addTransaksiMutation = useAddTransaksi()
    const updateTransaksiMutation = useUpdateTransaksi()
    const deleteTransaksiMutation = useDeleteTransaksi()

    const addCicilanMutation = useAddCicilan()
    const deleteCicilanMutation = useDeleteCicilan()

    const addSumberMutation = useAddSumber()
    const deleteSumberMutation = useDeleteSumber()
    const addKategoriMutation = useAddKategori()
    const deleteKategoriMutation = useDeleteKategori()

    const addContact = async (nama: string, nomorHp?: string, catatan?: string): Promise<Contact> => {
        const result = await addContactMutation.mutateAsync({ nama, nomorHp, catatan })
        return {
            id: result.id,
            nama: result.nama,
            nomorHp: result.nomor_hp,
            catatan: result.catatan,
            createdAt: result.created_at
        } as Contact
    }
    const updateContact = (id: string, updates: Partial<Pick<Contact, 'nama' | 'nomorHp' | 'catatan'>>) => {
        updateContactMutation.mutate({ id, updates })
    }
    const deleteContact = (id: string) => {
        deleteContactMutation.mutate(id)
    }

    const addTransaksi = async (payload: NewTransaksiPayload): Promise<Transaksi> => {
        const result = await addTransaksiMutation.mutateAsync(payload)
        return {
            id: result.id,
            contactId: result.contact_id,
            namaContact: result.nama_contact,
            jenis: result.jenis,
            kategori: result.kategori,
            sumberDana: result.sumber_dana,
            nominal: Number(result.nominal),
            catatan: result.catatan,
            status: result.status,
            waktu: result.waktu,
            waktuLunas: result.waktu_lunas
        } as Transaksi
    }
    const updateTransaksi = (id: string, updates: EditTransaksiPayload) => {
        updateTransaksiMutation.mutate({ id, updates })
    }
    const deleteTransaksi = (id: string) => {
        deleteTransaksiMutation.mutate(id)
    }

    const addCicilan = async (payload: NewCicilanPayload) => {
        return await addCicilanMutation.mutateAsync(payload)
    }
    const deleteCicilan = (id: string, transaksiId: string) => {
        deleteCicilanMutation.mutate({ id, transaksiId })
    }

    const addSumber = (nama: string) => addSumberMutation.mutate(nama)
    const deleteSumber = (nama: string) => deleteSumberMutation.mutate(nama)
    const addKategori = (nama: string) => addKategoriMutation.mutate(nama)
    const deleteKategori = (nama: string) => deleteKategoriMutation.mutate(nama)

    // Accurate calculation taking partial installment payments into account
    const totalPiutangBelumLunas = transaksi
        .filter((t) => t.jenis === 'piutang' && t.status !== 'lunas')
        .reduce((sum, t) => sum + (t.sisaNominal ?? t.nominal), 0)

    const totalHutangBelumLunas = transaksi
        .filter((t) => t.jenis === 'hutang' && t.status !== 'lunas')
        .reduce((sum, t) => sum + (t.sisaNominal ?? t.nominal), 0)

    const saldoPerSumber = (() => {
        const map: Record<string, number> = {}
        for (const t of transaksi.filter((x) => x.status !== 'lunas')) {
            if (!map[t.sumberDana]) map[t.sumberDana] = 0
            const amount = t.sisaNominal ?? t.nominal
            map[t.sumberDana] += t.jenis === 'hutang' ? amount : -amount
        }
        return map
    })()

    return {
        contacts,
        transaksi,
        allSumber: customs?.allSumber || [],
        allKategori: customs?.allKategori || [],
        customSumber: customs?.customSumber || [],
        customKategori: customs?.customKategori || [],
        addContact,
        updateContact,
        deleteContact,
        addTransaksi,
        updateTransaksi,
        deleteTransaksi,
        addCicilan,
        deleteCicilan,
        addSumber,
        deleteSumber,
        addKategori,
        deleteKategori,
        totalPiutangBelumLunas,
        totalHutangBelumLunas,
        saldoPerSumber,
    }
}

