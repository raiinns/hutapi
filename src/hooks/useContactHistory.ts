import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Transaksi, StatusPelunasan, PembayaranCicilan } from '../types'

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

            // Fetch transactions and their payments
            const [txRes, cicilanRes] = await Promise.all([
                supabase
                    .from('transaksi')
                    .select('*')
                    .eq('contact_id', contactId)
                    .order(sortBy, { ascending: sortOrder === 'asc' }),
                supabase
                    .from('pembayaran_cicilan')
                    .select('*')
                    .order('waktu', { ascending: true }),
            ])

            if (txRes.error) throw txRes.error

            const allCicilan = cicilanRes.data || []

            let rawTransaksi = (txRes.data || []).map((d) => {
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

            // Calculate totals across all transactions
            let totalHutangBelumLunas = 0
            let totalPiutangBelumLunas = 0
            let totalHutangLunas = 0
            let totalPiutangLunas = 0

            for (const t of rawTransaksi) {
                const unpaid = t.status === 'lunas' ? 0 : (t.sisaNominal ?? t.nominal)
                if (t.jenis === 'hutang') {
                    if (t.status === 'lunas') {
                        totalHutangLunas += t.nominal
                    } else {
                        totalHutangBelumLunas += unpaid
                    }
                } else {
                    if (t.status === 'lunas') {
                        totalPiutangLunas += t.nominal
                    } else {
                        totalPiutangBelumLunas += unpaid
                    }
                }
            }

            // Apply filter status
            const filteredTransaksi = filterStatus === 'semua'
                ? rawTransaksi
                : rawTransaksi.filter((t) => t.status === filterStatus)

            return {
                transaksi: filteredTransaksi,
                totalBelumLunas: totalHutangBelumLunas + totalPiutangBelumLunas,
                totalLunas: totalHutangLunas + totalPiutangLunas,
                totalHutangBelumLunas,
                totalPiutangBelumLunas,
                totalHutangLunas,
                totalPiutangLunas,
                count: filteredTransaksi.length,
            }
        },
        enabled: !!contactId,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
    })
}

