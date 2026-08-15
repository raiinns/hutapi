/** Format angka ke mata uang IDR */
export function formatRupiah(nominal: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(nominal)
}

/**
 * Format ISO string ke waktu WIB — versi panjang untuk detail
 * Contoh: "Minggu, 29 Mar 2026, 20:15 WIB"
 */
export function formatWIBLong(isoString: string): string {
    const date = new Date(isoString)
    const dayName = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
    }).format(date)

    const rest = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date)

    return `${dayName}, ${rest} WIB`
}

/**
 * Format lengkap dengan nama hari — Hari, Tanggal Bulan Tahun
 * Contoh: "Minggu, 29 Maret 2026"
 */
export function formatWIBDate(isoString: string): string {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date)
}

/**
 * Format waktu saja — HH:mm WIB
 */
export function formatWIBTime(isoString: string): string {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date) + ' WIB'
}

/**
 * Format ISO ke tanggal + waktu WIB (untuk info umum)
 */
export function formatWIB(isoString: string, showDate = true, showTime = true): string {
    const date = new Date(isoString)
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jakarta',
        ...(showDate ? { day: '2-digit', month: '2-digit', year: 'numeric' } : {}),
        ...(showTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
    }
    const formatted = new Intl.DateTimeFormat('id-ID', options).format(date)
    return showTime ? `${formatted} WIB` : formatted
}

/** Singkat ID untuk display */
export function shortId(id: string): string {
    return id.slice(-6).toUpperCase()
}

/** Format nominal input: tambahkan 000 di akhir */
export function appendThousand(current: string): string {
    if (!current) return '1000'
    const num = parseInt(current, 10)
    if (isNaN(num)) return current
    return String(num * 1000)
}

/** Konversi ISO string atau Date ke format input datetime-local (YYYY-MM-DDTHH:mm) dalam waktu lokal */
export function toDatetimeLocal(isoOrDate?: string | Date | null): string {
    const d = isoOrDate ? new Date(isoOrDate) : new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

/** Konversi value dari datetime-local ke ISO UTC string */
export function fromDatetimeLocal(localStr: string): string {
    if (!localStr) return new Date().toISOString()
    const d = new Date(localStr)
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

