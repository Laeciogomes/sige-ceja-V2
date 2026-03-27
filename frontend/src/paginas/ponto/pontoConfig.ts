export const PONTO_GEOFENCE = {
  nome: 'CEJA / ponto autorizado',
  latitude: -4.355711431819915,
  longitude: -39.31288742287426,
  raioMetros: 700,
} as const

export const TIPOS_REGISTRO_PONTO = ['Entrada', 'Saida'] as const
export type TipoRegistroPonto = (typeof TIPOS_REGISTRO_PONTO)[number]

export const formatarDistancia = (metros: number | null | undefined) => {
  if (metros == null || !Number.isFinite(metros)) return '—'
  if (metros < 1000) return `${Math.round(metros)} m`
  return `${(metros / 1000).toFixed(2)} km`
}

export const haversineMetros = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3
  const toRad = (n: number) => (n * Math.PI) / 180
  const phi1 = toRad(lat1)
  const phi2 = toRad(lat2)
  const dPhi = toRad(lat2 - lat1)
  const dLambda = toRad(lon2 - lon1)
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export const formatarDataISO = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const formatarMesISO = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export const dataHoraLocal = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleString('pt-BR')
}

export const dataLocal = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString('pt-BR')
}
