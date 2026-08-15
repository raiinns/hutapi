import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Contact, Transaksi, NewTransaksiPayload, EditTransaksiPayload } from '../types'
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
            // map db shape to app shape
            return data.map(d => ({
                id: d.id,
                nama: d.nama,
                nomorHp: d.nomor_hp,
                catatan: d.catatan,
                createdAt: d.created_at,
            })) as Contact[]
        }
    })
}

// Custom Config Query
export function useCustoms() {
    return useQuery({
        queryKey: ['customs'],
        queryFn: async () => {
            const [sumberRes, katRes] = await Promise.all([
                supabase.from('custom_sumber_dana').select('*'),
                supabase.from('custom_kategori').select('*')
            ])
            if (sumberRes.error) throw sumberRes.error
            if (katRes.error) throw katRes.error

            const customSumber = sumberRes.data.map((d: any) => d.nama as string)
            const customKategori = katRes.data.map((d: any) => d.nama as string)

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
        }
    })
}

// Mutations
export function useAddContact() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ nama, nomorHp, catatan }: { nama: string, nomorHp?: string, catatan?: string }) => {
            const user = await getCurrentUser()
            const { data, error } = await supabase.from('contacts').insert({
                user_id: user?.id,
                nama,
                nomor_hp: nomorHp,
                catatan
            }).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] })
    })
}

export function useUpdateContact() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: Partial<Pick<Contact, 'nama' | 'nomorHp' | 'catatan'>> }) => {
            const payload: any = {}
            if (updates.nama !== undefined) payload.nama = updates.nama
            if (updates.nomorHp !== undefined) payload.nomor_hp = updates.nomorHp
            if (updates.catatan !== undefined) payload.catatan = updates.catatan

            const { data, error } = await supabase.from('contacts').update(payload).eq('id', id).select().single()
            if (error) throw error
            
            // if name changes, update transaction names too
            if (updates.nama) {
                await supabase.from('transaksi').update({ nama_contact: updates.nama }).eq('contact_id', id)
                qc.invalidateQueries({ queryKey: ['transaksi'] })
            }
            return data
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] })
    })
}

export function useDeleteContact() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('contacts').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['contacts'] })
            qc.invalidateQueries({ queryKey: ['transaksi'] })
        }
    })
}

export function useTransaksi() {
    return useQuery({
        queryKey: ['transaksi'],
        queryFn: async () => {
            const { data, error } = await supabase.from('transaksi').select('*').order('waktu', { ascending: false })
            if (error) throw error
            return data.map(d => ({
                id: d.id,
                waktu: d.waktu,
                contactId: d.contact_id,
                namaContact: d.nama_contact,
                jenis: d.jenis,
                kategori: d.kategori,
                sumberDana: d.sumber_dana,
                nominal: Number(d.nominal),
                catatan: d.catatan,
                status: d.status,
                waktuLunas: d.waktu_lunas,
            })) as Transaksi[]
        }
    })
}

export function useAddTransaksi() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: NewTransaksiPayload) => {
            const user = await getCurrentUser()
            const { data, error } = await supabase.from('transaksi').insert({
                user_id: user?.id,
                waktu: new Date().toISOString(),
                contact_id: payload.contactId,
                nama_contact: payload.namaContact,
                jenis: payload.jenis,
                kategori: payload.kategori,
                sumber_dana: payload.sumberDana,
                nominal: payload.nominal,
                catatan: payload.catatan,
                status: 'belum_lunas',
            }).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['transaksi'] })
    })
}

export function useUpdateTransaksi() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: EditTransaksiPayload }) => {
            const payload: any = {}
            if (updates.contactId) payload.contact_id = updates.contactId
            if (updates.namaContact) payload.nama_contact = updates.namaContact
            if (updates.jenis) payload.jenis = updates.jenis
            if (updates.kategori) payload.kategori = updates.kategori
            if (updates.sumberDana) payload.sumber_dana = updates.sumberDana
            if (updates.nominal) payload.nominal = updates.nominal
            if (updates.catatan) payload.catatan = updates.catatan
            if (updates.status) payload.status = updates.status

            if (updates.status === 'lunas') payload.waktu_lunas = new Date().toISOString()
            else if (updates.status === 'belum_lunas') payload.waktu_lunas = null

            const { data, error } = await supabase.from('transaksi').update(payload).eq('id', id).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['transaksi'] })
    })
}

export function useDeleteTransaksi() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('transaksi').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['transaksi'] })
    })
}

export function useAddSumber() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (nama: string) => {
            const user = await getCurrentUser()
            const { data, error } = await supabase.from('custom_sumber_dana').insert({
                user_id: user?.id,
                nama: nama.trim()
            }).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['customs'] })
    })
}

export function useDeleteSumber() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (nama: string) => {
            const { error } = await supabase.from('custom_sumber_dana').delete().eq('nama', nama)
            if (error) throw error
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['customs'] })
    })
}

export function useAddKategori() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (nama: string) => {
            const user = await getCurrentUser()
            const { data, error } = await supabase.from('custom_kategori').insert({
                user_id: user?.id,
                nama: nama.trim()
            }).select().single()
            if (error) throw error
            return data
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['customs'] })
    })
}

export function useDeleteKategori() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (nama: string) => {
            const { error } = await supabase.from('custom_kategori').delete().eq('nama', nama)
            if (error) throw error
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['customs'] })
    })
}
