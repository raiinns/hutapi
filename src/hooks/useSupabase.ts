import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Contact, Transaksi, NewTransaksiPayload, EditTransaksiPayload, PembayaranCicilan, NewCicilanPayload } from '../types'
import { DEFAULT_SUMBER_DANA, DEFAULT_KATEGORI } from '../types'

// Setup Helper queries
async function getCurrentUser() {
    const { data: { user } = {} } = await supabase.auth.getUser()
    return user
}

// Contacts Query
export function useContacts() {
    return useQuery({
        queryKey: ['contacts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            return data.map((d) => ({
                id: d.id,
                nama: d.nama,
                nomorHp: d.nomor_hp,
                catatan: d.catatan,
                createdAt: d.created_at,
            })) as Contact[]
        },
    })
}

// Custom Config Query
export function useCustoms() {
    return useQuery({
        queryKey: ['customs'],
        queryFn: async () => {
            const [sumberRes, katRes] = await Promise.all([
                supabase.from('custom_sumber_dana').select('*'),
                supabase.from('custom_kategori').select('*'),
            ])
            if (sumberRes.error) throw sumberRes.error
            if (katRes.error) throw katRes.error

            const customSumber = (sumberRes.data || []).map((d: any) => d.nama as string)
            const customKategori = (katRes.data || []).map((d: any) => d.nama as string)

            const allSumber: string[] = [
                ...DEFAULT_SUMBER_DANA,
                ...customSumber.filter((s) => !DEFAULT_SUMBER_DANA.includes(s)),
            ]
            const allKategori: string[] = [
                ...DEFAULT_KATEGORI,
                ...customKategori.filter((k) => !DEFAULT_KATEGORI.includes(k)),
            ]

            return {
                customSumber,
                customKategori,
                allSumber,
                allKategori,
            }
        },
    })
}

// -----------------------------------------------------------------------------
// Contacts Mutations (with Optimistic Updates)
// -----------------------------------------------------------------------------

export function useAddContact() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ nama, nomorHp, catatan }: { nama: string; nomorHp?: string; catatan?: string }) => {
            const user = await getCurrentUser()
            const { data, error } = await supabase
                .from('contacts')
                .insert({
                    user_id: user?.id,
                    nama,
                    nomor_hp: nomorHp,
                    catatan,
                })
                .select()
                .single()
            if (error) throw error
            return data
        },
        onMutate: async (newContactData) => {
            await qc.cancelQueries({ queryKey: ['contacts'] })
            const previousContacts = qc.getQueryData<Contact[]>(['contacts'])

            const optimisticContact: Contact = {
                id: `temp-${Date.now()}`,
                nama: newContactData.nama,
                nomorHp: newContactData.nomorHp,
                catatan: newContactData.catatan,
                createdAt: new Date().toISOString(),
            }

            if (previousContacts) {
                qc.setQueryData<Contact[]>(['contacts'], [optimisticContact, ...previousContacts])
            }

            return { previousContacts }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousContacts) {
                qc.setQueryData(['contacts'], context.previousContacts)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['contacts'] })
        },
    })
}

export function useUpdateContact() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<Contact, 'nama' | 'nomorHp' | 'catatan'>> }) => {
            const payload: any = {}
            if (updates.nama !== undefined) payload.nama = updates.nama
            if (updates.nomorHp !== undefined) payload.nomor_hp = updates.nomorHp
            if (updates.catatan !== undefined) payload.catatan = updates.catatan

            const { data, error } = await supabase
                .from('contacts')
                .update(payload)
                .eq('id', id)
                .select()
                .single()
            if (error) throw error

            if (updates.nama) {
                await supabase.from('transaksi').update({ nama_contact: updates.nama }).eq('contact_id', id)
            }
            return data
        },
        onMutate: async ({ id, updates }) => {
            await qc.cancelQueries({ queryKey: ['contacts'] })
            await qc.cancelQueries({ queryKey: ['transaksi'] })
            await qc.cancelQueries({ queryKey: ['contact-history'] })

            const previousContacts = qc.getQueryData<Contact[]>(['contacts'])
            const previousTransaksi = qc.getQueryData<Transaksi[]>(['transaksi'])

            if (previousContacts) {
                qc.setQueryData<Contact[]>(
                    ['contacts'],
                    previousContacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
                )
            }

            if (updates.nama && previousTransaksi) {
                qc.setQueryData<Transaksi[]>(
                    ['transaksi'],
                    previousTransaksi.map((t) => (t.contactId === id ? { ...t, namaContact: updates.nama! } : t)),
                )
            }

            return { previousContacts, previousTransaksi }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousContacts) {
                qc.setQueryData(['contacts'], context.previousContacts)
            }
            if (context?.previousTransaksi) {
                qc.setQueryData(['transaksi'], context.previousTransaksi)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['contacts'] })
            qc.invalidateQueries({ queryKey: ['transaksi'] })
            qc.invalidateQueries({ queryKey: ['contact-history'] })
        },
    })
}

export function useDeleteContact() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('contacts').delete().eq('id', id)
            if (error) throw error
        },
        onMutate: async (deletedId) => {
            await qc.cancelQueries({ queryKey: ['contacts'] })
            await qc.cancelQueries({ queryKey: ['transaksi'] })
            await qc.cancelQueries({ queryKey: ['contact-history'] })

            const previousContacts = qc.getQueryData<Contact[]>(['contacts'])
            const previousTransaksi = qc.getQueryData<Transaksi[]>(['transaksi'])

            // Optimistically remove contact
            if (previousContacts) {
                qc.setQueryData<Contact[]>(
                    ['contacts'],
                    previousContacts.filter((c) => c.id !== deletedId),
                )
            }

            // Optimistically remove all cascading transactions
            if (previousTransaksi) {
                qc.setQueryData<Transaksi[]>(
                    ['transaksi'],
                    previousTransaksi.filter((t) => t.contactId !== deletedId),
                )
            }

            return { previousContacts, previousTransaksi }
        },
        onError: (_err, _deletedId, context) => {
            if (context?.previousContacts) {
                qc.setQueryData(['contacts'], context.previousContacts)
            }
            if (context?.previousTransaksi) {
                qc.setQueryData(['transaksi'], context.previousTransaksi)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['contacts'] })
            qc.invalidateQueries({ queryKey: ['transaksi'] })
            qc.invalidateQueries({ queryKey: ['contact-history'] })
        },
    })
}

// -----------------------------------------------------------------------------
// Transaksi Query & Mutations (with Optimistic Updates)
// -----------------------------------------------------------------------------

export function useTransaksi() {
    return useQuery({
        queryKey: ['transaksi'],
        queryFn: async () => {
            const [txRes, cicilanRes] = await Promise.all([
                supabase.from('transaksi').select('*').order('waktu', { ascending: false }),
                supabase.from('pembayaran_cicilan').select('*').order('waktu', { ascending: true }),
            ])

            if (txRes.error) throw txRes.error

            const allCicilan = cicilanRes.data || []

            return (txRes.data || []).map((d) => {
                const txCicilan = allCicilan
                    .filter((c: any) => c.transaksi_id === d.id)
                    .map((c: any) => ({
                        id: c.id,
                        transaksiId: c.transaksi_id,
                        waktu: c.waktu,
                        nominal: Number(c.nominal),
                        sumberDana: c.sumber_dana,
                        catatan: c.catatan,
                        createdAt: c.created_at,
                    })) as PembayaranCicilan[]

                const totalDibayar = txCicilan.reduce((sum, c) => sum + c.nominal, 0)
                const nominal = Number(d.nominal)
                const sisaNominal = Math.max(0, nominal - totalDibayar)

                let status = d.status
                if (status !== 'lunas') {
                    if (totalDibayar >= nominal && nominal > 0) {
                        status = 'lunas'
                    } else if (totalDibayar > 0) {
                        status = 'dicicil'
                    }
                }

                return {
                    id: d.id,
                    waktu: d.waktu,
                    contactId: d.contact_id,
                    namaContact: d.nama_contact,
                    jenis: d.jenis,
                    kategori: d.kategori,
                    sumberDana: d.sumber_dana,
                    nominal,
                    catatan: d.catatan,
                    status,
                    waktuLunas: d.waktu_lunas,
                    totalDibayar,
                    sisaNominal,
                    cicilanList: txCicilan,
                }
            }) as Transaksi[]
        },
    })
}

// -----------------------------------------------------------------------------
// Cicilan Hooks (Query & Mutations)
// -----------------------------------------------------------------------------

export function useCicilan(transaksiId: string | null) {
    return useQuery({
        queryKey: ['cicilan', transaksiId],
        queryFn: async (): Promise<PembayaranCicilan[]> => {
            if (!transaksiId) return []
            const { data, error } = await supabase
                .from('pembayaran_cicilan')
                .select('*')
                .eq('transaksi_id', transaksiId)
                .order('waktu', { ascending: false })
            if (error) throw error
            return (data || []).map((c: any) => ({
                id: c.id,
                transaksiId: c.transaksi_id,
                waktu: c.waktu,
                nominal: Number(c.nominal),
                sumberDana: c.sumber_dana,
                catatan: c.catatan,
                createdAt: c.created_at,
            }))
        },
        enabled: !!transaksiId,
    })
}

export function useAddCicilan() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: NewCicilanPayload) => {
            const user = await getCurrentUser()
            const { data, error } = await supabase
                .from('pembayaran_cicilan')
                .insert({
                    user_id: user?.id,
                    transaksi_id: payload.transaksiId,
                    waktu: payload.waktu || new Date().toISOString(),
                    nominal: payload.nominal,
                    sumber_dana: payload.sumberDana,
                    catatan: payload.catatan,
                })
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSettled: (_data, _error, variables) => {
            qc.invalidateQueries({ queryKey: ['transaksi'] })
            qc.invalidateQueries({ queryKey: ['contact-history'] })
            qc.invalidateQueries({ queryKey: ['cicilan', variables.transaksiId] })
        },
    })
}

export function useDeleteCicilan() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, transaksiId }: { id: string; transaksiId: string }) => {
            const { error } = await supabase
                .from('pembayaran_cicilan')
                .delete()
                .eq('id', id)
            if (error) throw error
        },
        onSettled: (_data, _error, variables) => {
            qc.invalidateQueries({ queryKey: ['transaksi'] })
            qc.invalidateQueries({ queryKey: ['contact-history'] })
            qc.invalidateQueries({ queryKey: ['cicilan', variables.transaksiId] })
        },
    })
}


export function useAddTransaksi() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: NewTransaksiPayload) => {
            const user = await getCurrentUser()
            const transactionTime = payload.waktu || new Date().toISOString()
            const { data, error } = await supabase
                .from('transaksi')
                .insert({
                    user_id: user?.id,
                    waktu: transactionTime,
                    contact_id: payload.contactId,
                    nama_contact: payload.namaContact,
                    jenis: payload.jenis,
                    kategori: payload.kategori,
                    sumber_dana: payload.sumberDana,
                    nominal: payload.nominal,
                    catatan: payload.catatan,
                    status: 'belum_lunas',
                })
                .select()
                .single()
            if (error) throw error
            return data
        },
        onMutate: async (newPayload) => {
            await qc.cancelQueries({ queryKey: ['transaksi'] })
            await qc.cancelQueries({ queryKey: ['contact-history'] })

            const previousTransaksi = qc.getQueryData<Transaksi[]>(['transaksi'])

            const optimisticItem: Transaksi = {
                id: `temp-${Date.now()}`,
                waktu: newPayload.waktu || new Date().toISOString(),
                contactId: newPayload.contactId,
                namaContact: newPayload.namaContact,
                jenis: newPayload.jenis,
                kategori: newPayload.kategori,
                sumberDana: newPayload.sumberDana,
                nominal: newPayload.nominal,
                catatan: newPayload.catatan,
                status: 'belum_lunas',
            }

            if (previousTransaksi) {
                qc.setQueryData<Transaksi[]>(['transaksi'], [optimisticItem, ...previousTransaksi])
            }

            return { previousTransaksi }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousTransaksi) {
                qc.setQueryData(['transaksi'], context.previousTransaksi)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['transaksi'] })
            qc.invalidateQueries({ queryKey: ['contact-history'] })
        },
    })
}

export function useUpdateTransaksi() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: EditTransaksiPayload }) => {
            const payload: any = {}
            if (updates.contactId) payload.contact_id = updates.contactId
            if (updates.namaContact) payload.nama_contact = updates.namaContact
            if (updates.jenis) payload.jenis = updates.jenis
            if (updates.kategori) payload.kategori = updates.kategori
            if (updates.sumberDana) payload.sumber_dana = updates.sumberDana
            if (updates.nominal !== undefined) payload.nominal = updates.nominal
            if (updates.catatan !== undefined) payload.catatan = updates.catatan
            if (updates.status) payload.status = updates.status
            if (updates.waktu) payload.waktu = updates.waktu

            if (updates.status === 'lunas') payload.waktu_lunas = new Date().toISOString()
            else if (updates.status === 'belum_lunas') payload.waktu_lunas = null

            const { data, error } = await supabase.from('transaksi').update(payload).eq('id', id).select().single()
            if (error) throw error
            return data
        },
        onMutate: async ({ id, updates }) => {
            await qc.cancelQueries({ queryKey: ['transaksi'] })
            await qc.cancelQueries({ queryKey: ['contact-history'] })

            const previousTransaksi = qc.getQueryData<Transaksi[]>(['transaksi'])

            if (previousTransaksi) {
                qc.setQueryData<Transaksi[]>(
                    ['transaksi'],
                    previousTransaksi.map((t) => {
                        if (t.id === id) {
                            const isLunas = updates.status ? updates.status === 'lunas' : t.status === 'lunas'
                            return {
                                ...t,
                                ...updates,
                                waktuLunas: isLunas ? (t.waktuLunas || new Date().toISOString()) : undefined,
                            }
                        }
                        return t
                    }),
                )
            }

            return { previousTransaksi }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousTransaksi) {
                qc.setQueryData(['transaksi'], context.previousTransaksi)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['transaksi'] })
            qc.invalidateQueries({ queryKey: ['contact-history'] })
        },
    })
}

export function useDeleteTransaksi() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('transaksi').delete().eq('id', id)
            if (error) throw error
        },
        onMutate: async (deletedId) => {
            await qc.cancelQueries({ queryKey: ['transaksi'] })
            await qc.cancelQueries({ queryKey: ['contact-history'] })

            const previousTransaksi = qc.getQueryData<Transaksi[]>(['transaksi'])

            if (previousTransaksi) {
                qc.setQueryData<Transaksi[]>(
                    ['transaksi'],
                    previousTransaksi.filter((t) => t.id !== deletedId),
                )
            }

            return { previousTransaksi }
        },
        onError: (_err, _deletedId, context) => {
            if (context?.previousTransaksi) {
                qc.setQueryData(['transaksi'], context.previousTransaksi)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['transaksi'] })
            qc.invalidateQueries({ queryKey: ['contact-history'] })
        },
    })
}

// -----------------------------------------------------------------------------
// Customs Mutations (with Optimistic Updates)
// -----------------------------------------------------------------------------

export function useAddSumber() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (nama: string) => {
            const user = await getCurrentUser()
            const { data, error } = await supabase
                .from('custom_sumber_dana')
                .insert({
                    user_id: user?.id,
                    nama: nama.trim(),
                })
                .select()
                .single()
            if (error) throw error
            return data
        },
        onMutate: async (newSumber) => {
            await qc.cancelQueries({ queryKey: ['customs'] })
            const previousCustoms = qc.getQueryData<any>(['customs'])

            if (previousCustoms) {
                const trimmed = newSumber.trim()
                const customSumber = [...previousCustoms.customSumber, trimmed]
                const allSumber = [...new Set([...previousCustoms.allSumber, trimmed])]
                qc.setQueryData(['customs'], { ...previousCustoms, customSumber, allSumber })
            }

            return { previousCustoms }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousCustoms) {
                qc.setQueryData(['customs'], context.previousCustoms)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['customs'] })
        },
    })
}

export function useDeleteSumber() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (nama: string) => {
            const { error } = await supabase.from('custom_sumber_dana').delete().eq('nama', nama)
            if (error) throw error
        },
        onMutate: async (deletedSumber) => {
            await qc.cancelQueries({ queryKey: ['customs'] })
            const previousCustoms = qc.getQueryData<any>(['customs'])

            if (previousCustoms) {
                const customSumber = previousCustoms.customSumber.filter((s: string) => s !== deletedSumber)
                const allSumber = previousCustoms.allSumber.filter((s: string) => s !== deletedSumber || DEFAULT_SUMBER_DANA.includes(s))
                qc.setQueryData(['customs'], { ...previousCustoms, customSumber, allSumber })
            }

            return { previousCustoms }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousCustoms) {
                qc.setQueryData(['customs'], context.previousCustoms)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['customs'] })
        },
    })
}

export function useAddKategori() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (nama: string) => {
            const user = await getCurrentUser()
            const { data, error } = await supabase
                .from('custom_kategori')
                .insert({
                    user_id: user?.id,
                    nama: nama.trim(),
                })
                .select()
                .single()
            if (error) throw error
            return data
        },
        onMutate: async (newKategori) => {
            await qc.cancelQueries({ queryKey: ['customs'] })
            const previousCustoms = qc.getQueryData<any>(['customs'])

            if (previousCustoms) {
                const trimmed = newKategori.trim()
                const customKategori = [...previousCustoms.customKategori, trimmed]
                const allKategori = [...new Set([...previousCustoms.allKategori, trimmed])]
                qc.setQueryData(['customs'], { ...previousCustoms, customKategori, allKategori })
            }

            return { previousCustoms }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousCustoms) {
                qc.setQueryData(['customs'], context.previousCustoms)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['customs'] })
        },
    })
}

export function useDeleteKategori() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (nama: string) => {
            const { error } = await supabase.from('custom_kategori').delete().eq('nama', nama)
            if (error) throw error
        },
        onMutate: async (deletedKategori) => {
            await qc.cancelQueries({ queryKey: ['customs'] })
            const previousCustoms = qc.getQueryData<any>(['customs'])

            if (previousCustoms) {
                const customKategori = previousCustoms.customKategori.filter((k: string) => k !== deletedKategori)
                const allKategori = previousCustoms.allKategori.filter((k: string) => k !== deletedKategori || DEFAULT_KATEGORI.includes(k))
                qc.setQueryData(['customs'], { ...previousCustoms, customKategori, allKategori })
            }

            return { previousCustoms }
        },
        onError: (_err, _variables, context) => {
            if (context?.previousCustoms) {
                qc.setQueryData(['customs'], context.previousCustoms)
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ['customs'] })
        },
    })
}

