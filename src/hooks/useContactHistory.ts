import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Transaksi, StatusPelunasan } from '../types'

export type SortField = 'waktu' | 'nominal'
export type SortOrder = 'asc' | 'desc'

interface UseContactHistoryOptions {
    contactId: string | null
    filterStatus: 'semua' | StatusPelunasan
    sortBy: SortField
    sortOrder: SortOrder
}

export interface ContactHistoryResult {
    transaksi: Transaksi[]
    totalBelumLunas: number
    totalLunas: number
    totalHutangBelumLunas: number
    totalPiutangBelumLunas: number
    totalHutangLunas: number
    totalPiutangLunas: number
    count: number
}

export function useContactHistory({
    contactId,
    filterStatus,
    sortBy,
    sortOrder,
}: UseContactHistoryOptions) {
    return useQuery({
        queryKey: ['contact-history', contactId, filterStatus, sortBy, sortOrder],
        queryFn: async (): Promise<ContactHistoryResult> => {
            if (!contactId) {
                return {
                    transaksi: [],
                    totalBelumLunas: 0,
                    totalLunas: 0,
                    totalHutangBelumLunas: 0,
                    totalPiutangBelumLunas: 0,
                    totalHutangLunas: 0,
                    totalPiutangLunas: 0,
                    count: 0,
                }
            }

            // Build query with RLS - user can only see their own data
            let query = supabase
                .from('transaksi')
                .select('*')
                .eq('contact_id', contactId)

            // Apply status filter
            if (filterStatus !== 'semua') {
                query = query.eq('status', filterStatus)
            }

            // Apply sorting
            query = query.order(sortBy, { ascending: sortOrder === 'asc' })

            const { data, error } = await query

            if (error) throw error

            const transaksi = (data || []).map((d) => ({
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

            // Calculate totals
            let totalHutangBelumLunas = 0
            let totalPiutangBelumLunas = 0
            let totalHutangLunas = 0
            let totalPiutangLunas = 0

            for (const t of transaksi) {
                if (t.jenis === 'hutang') {
                    if (t.status === 'belum_lunas') {
                        totalHutangBelumLunas += t.nominal
                    } else {
                        totalHutangLunas += t.nominal
                    }
                } else {
                    if (t.status === 'belum_lunas') {
                        totalPiutangBelumLunas += t.nominal
                    } else {
                        totalPiutangLunas += t.nominal
                    }
                }
            }

            return {
                transaksi,
                totalBelumLunas: totalHutangBelumLunas + totalPiutangBelumLunas,
                totalLunas: totalHutangLunas + totalPiutangLunas,
                totalHutangBelumLunas,
                totalPiutangBelumLunas,
                totalHutangLunas,
                totalPiutangLunas,
                count: transaksi.length,
            }
        },
        enabled: !!contactId,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
    })
}
