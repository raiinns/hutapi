export type JenisTransaksi = 'hutang' | 'piutang'

export type StatusPelunasan = 'belum_lunas' | 'lunas'

// Bisa string bebas (custom)
export type SumberDana = string
export type KategoriTransaksi = string

export const DEFAULT_SUMBER_DANA: string[] = [
    'Cash',
    'DANA',
    'BRI',
    'GoPay',
    'SeaBank',
    'ShopeePay',
    'MitraBukalapak',
]

export const DEFAULT_KATEGORI: string[] = [
    'Uang Tunai',
    'Token Listrik',
    'Pulsa',
    'Paket Data',
]

export interface Contact {
    id: string
    nama: string
    nomorHp?: string
    catatan?: string
    createdAt: string
}

export interface Transaksi {
    id: string
    waktu: string // ISO string UTC — format ke WIB di UI
    contactId: string
    namaContact: string
    jenis: JenisTransaksi
    kategori: KategoriTransaksi
    sumberDana: SumberDana
    nominal: number
    catatan?: string
    status: StatusPelunasan
    waktuLunas?: string
}

export interface NewTransaksiPayload {
    contactId: string
    namaContact: string
    jenis: JenisTransaksi
    kategori: KategoriTransaksi
    sumberDana: SumberDana
    nominal: number
    catatan?: string
}

export interface EditTransaksiPayload {
    contactId?: string
    namaContact?: string
    jenis?: JenisTransaksi
    kategori?: KategoriTransaksi
    sumberDana?: SumberDana
    nominal?: number
    catatan?: string
    status?: StatusPelunasan
}
