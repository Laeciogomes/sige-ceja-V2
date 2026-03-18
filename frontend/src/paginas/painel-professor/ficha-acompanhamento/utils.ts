const SUPABASE_PUBLIC_STORAGE_BASE = (() => {
  const raw = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
  return raw ? `${raw}/storage/v1/object/public` : ''
})()

export type TipoProtocoloNomeLike = { nome?: string | null } | { nome?: string | null }[] | null | undefined

export type RegistroAtividadeLike = {
  numero_protocolo?: number | string | null
  id_tipo_protocolo?: number | string | null
  status?: string | null
  nota?: number | string | null
  tipos_protocolo?: TipoProtocoloNomeLike
}

export type SessaoHistoricoLike = {
  resumo_atividades?: string | null
  atividades?: RegistroAtividadeLike[] | null
}

export type SupabaseLike = {
  storage: {
    from: (bucket: string) => {
      list: (path?: string, options?: Record<string, unknown>) => Promise<{ data: Array<{ name: string }> | null; error: unknown }>
      download?: (path: string) => Promise<{ data: Blob | null; error: unknown }>
    }
  }
} | null | undefined

export function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export function normalizarTexto(valor: string): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function sanitizeStoragePath(rawValue: string, bucket: string): string | null {
  const raw = String(rawValue || '').trim()
  if (!raw) return null

  let path = raw

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path)
      const match = url.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i)
      if (match?.[2]) {
        path = match[2]
      } else {
        return raw
      }
    } catch {
      return raw
    }
  }

  path = path
    .replace(/^\/+/, '')
    .replace(/^storage\/v1\/object\/public\/[^/]+\//i, '')
    .replace(/^object\/public\/[^/]+\//i, '')
    .replace(/^public\/[^/]+\//i, '')
    .replace(new RegExp(`^${bucket}/`, 'i'), '')

  if (!path.includes('/') && /^aluno-/i.test(path)) {
    path = `alunos/${path}`
  }

  return path || null
}



export function extrairCaminhoFotoStorage(fotoUrl?: string | null, bucket = 'avatars'): string | undefined {
  const raw = String(fotoUrl ?? '').trim()
  if (!raw || /^(data:|blob:)/i.test(raw)) return undefined

  const path = sanitizeStoragePath(raw, bucket)
  if (!path) return undefined
  if (/^https?:\/\//i.test(path) || path.startsWith('/')) return undefined
  return path
}

async function blobParaDataUrl(blob: Blob): Promise<string | undefined> {
  return await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result || '') || undefined)
    reader.onerror = () => resolve(undefined)
    reader.readAsDataURL(blob)
  })
}

async function fetchAsDataUrl(url?: string | null): Promise<string | undefined> {
  const raw = String(url ?? '').trim()
  if (!raw) return undefined

  try {
    const response = await fetch(raw, { mode: 'cors', credentials: 'omit', cache: 'no-store' })
    if (!response.ok) return undefined
    const blob = await response.blob()
    return await blobParaDataUrl(blob)
  } catch (error) {
    console.warn('[fetchAsDataUrl] Falha ao carregar imagem externa para data URL.', error)
    return undefined
  }
}

async function downloadStorageAsDataUrl(supabase: SupabaseLike, bucket: string, path?: string | null): Promise<string | undefined> {
  const cleanedPath = String(path ?? '').trim()
  if (!supabase || !cleanedPath) return undefined

  try {
    const api = supabase.storage.from(bucket)
    if (!api?.download) return undefined
    const { data, error } = await api.download(cleanedPath)
    if (error || !data) {
      if (error) console.warn('[downloadStorageAsDataUrl] Falha ao baixar arquivo do storage.', error)
      return undefined
    }
    return await blobParaDataUrl(data)
  } catch (error) {
    console.warn('[downloadStorageAsDataUrl] Erro inesperado ao baixar arquivo do storage.', error)
    return undefined
  }
}

function isNomeArquivoImagem(nome: string): boolean {
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(String(nome ?? '').trim())
}

function selecionarArquivoMaisRecente(entries: Array<{ name: string }> | null | undefined, prefix: string): string | undefined {
  const nomes = (entries ?? [])
    .map((item) => String(item?.name ?? '').trim())
    .filter(Boolean)
    .filter((name) => name.startsWith(prefix))
    .filter(isNomeArquivoImagem)
    .sort((a, b) => b.localeCompare(a))

  return nomes[0]
}

async function buscarCaminhoFotoAlunoNoStorage(
  supabase: SupabaseLike,
  idAluno?: number | null,
  bucket = 'avatars'
): Promise<string | undefined> {
  if (!supabase || !idAluno) return undefined

  const storage = supabase.storage.from(bucket)
  const prefix = `aluno-${idAluno}-`

  const procurarEmPasta = async (pasta: string): Promise<string | undefined> => {
    const { data, error } = await storage.list(pasta, {
      limit: 200,
      offset: 0,
      sortBy: { column: 'name', order: 'desc' },
    } as any)

    if (error) return undefined

    const arquivo = selecionarArquivoMaisRecente(data as Array<{ name: string }> | null | undefined, prefix)
    if (!arquivo) return undefined
    return pasta ? `${pasta}/${arquivo}` : arquivo
  }

  for (const pasta of ['', 'alunos', 'alunos/alunos']) {
    const encontrado = await procurarEmPasta(pasta)
    if (encontrado) return encontrado
  }

  const { data: raiz, error: erroRaiz } = await storage.list('', {
    limit: 200,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  } as any)

  if (erroRaiz) return undefined

  for (const item of raiz ?? []) {
    const nome = String(item?.name ?? '').trim()
    if (!nome || isNomeArquivoImagem(nome)) continue

    for (const pasta of [nome, `${nome}/alunos`]) {
      const encontrado = await procurarEmPasta(pasta)
      if (encontrado) return encontrado
    }
  }

  return undefined
}

export function resolverFotoUrl(fotoUrl?: string | null, bucket = 'avatars'): string | undefined {
  const raw = String(fotoUrl ?? '').trim()
  if (!raw) return undefined
  if (/^(data:|blob:)/i.test(raw)) return raw

  const path = sanitizeStoragePath(raw, bucket)
  if (!path) return undefined
  if (/^https?:\/\//i.test(path) || path.startsWith('/')) return path
  return SUPABASE_PUBLIC_STORAGE_BASE ? `${SUPABASE_PUBLIC_STORAGE_BASE}/${bucket}/${path}` : raw
}

export function resolverFotoUrlComVersao(fotoUrl?: string | null, bucket = 'avatars'): string | undefined {
  const normalizada = resolverFotoUrl(fotoUrl, bucket)
  if (!normalizada) return undefined
  const versionKey = String(fotoUrl ?? normalizada)
  return `${normalizada}${normalizada.includes('?') ? '&' : '?'}v=${encodeURIComponent(versionKey)}`
}

export async function resolverFotoAlunoUrl(
  supabase: SupabaseLike,
  idAluno?: number | null,
  fotoUrl?: string | null,
  bucket = 'avatars'
): Promise<string | undefined> {
  const direta = resolverFotoUrlComVersao(fotoUrl, bucket)
  if (direta) return direta

  try {
    const caminhoFallback = await buscarCaminhoFotoAlunoNoStorage(supabase, idAluno, bucket)
    if (!caminhoFallback) return undefined
    return resolverFotoUrlComVersao(caminhoFallback, bucket)
  } catch (error) {
    console.warn('[resolverFotoAlunoUrl] Falha ao localizar foto do aluno no storage.', error)
    return undefined
  }
}

export async function carregarFotoAlunoDataUrl(
  supabase: SupabaseLike,
  idAluno?: number | null,
  fotoUrl?: string | null,
  bucket = 'avatars'
): Promise<string | undefined> {
  const raw = String(fotoUrl ?? '').trim()
  if (/^data:/i.test(raw)) return raw

  const caminhoDireto = extrairCaminhoFotoStorage(fotoUrl, bucket)
  if (caminhoDireto) {
    const viaDownload = await downloadStorageAsDataUrl(supabase, bucket, caminhoDireto)
    if (viaDownload) return viaDownload
  }

  const direta = resolverFotoUrlComVersao(fotoUrl, bucket)
  if (direta) {
    const viaFetch = await fetchAsDataUrl(direta)
    if (viaFetch) return viaFetch
  }

  try {
    const caminhoFallback = await buscarCaminhoFotoAlunoNoStorage(supabase, idAluno, bucket)
    if (!caminhoFallback) return undefined

    const viaDownload = await downloadStorageAsDataUrl(supabase, bucket, caminhoFallback)
    if (viaDownload) return viaDownload

    return await fetchAsDataUrl(resolverFotoUrlComVersao(caminhoFallback, bucket))
  } catch (error) {
    console.warn('[carregarFotoAlunoDataUrl] Falha ao localizar foto do aluno no storage.', error)
    return undefined
  }
}

function ehLinhaTransferencia(linha?: string | null): boolean {
  const original = String(linha ?? '').trim()
  if (!original) return false

  const normalizada = normalizarTexto(original)
  return (
    normalizada.startsWith('[transferencia]') ||
    normalizada.includes('encerrado por transferencia para') ||
    normalizada.includes('transferido para') ||
    normalizada.includes('sessao transferida para') ||
    normalizada.startsWith('transferencia:')
  )
}

export function limparResumoTransferencia(texto?: string | null): string {
  const linhas = String(texto ?? '')
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean)
    .filter((linha) => !ehLinhaTransferencia(linha))

  return linhas.join('\n').trim()
}

export function sessaoEhSomenteTransferencia(sessao?: SessaoHistoricoLike | null): boolean {
  if (!sessao) return false
  const possuiAtividades = Array.isArray(sessao.atividades) && sessao.atividades.length > 0
  const resumoOriginal = String(sessao.resumo_atividades ?? '').trim()
  const resumoLimpo = limparResumoTransferencia(resumoOriginal)

  return !possuiAtividades && !resumoLimpo && ehLinhaTransferencia(resumoOriginal)
}

export function sessaoDeveAparecerNoHistorico(sessao?: SessaoHistoricoLike | null): boolean {
  return !sessaoEhSomenteTransferencia(sessao)
}

function limparMarcadoresHash(texto?: string | null): string {
  return String(texto ?? '')
    .replace(/\(\s*#\s*\d+\s*\)/gi, '')
    .replace(/#\s*(\d+)/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function nomeTipoAtividade(atividade: RegistroAtividadeLike): string {
  const nome = limparMarcadoresHash(first(atividade.tipos_protocolo)?.nome?.trim())
  return nome || `Tipo ${atividade.id_tipo_protocolo ?? '-'}`
}

export function formatarNotaCompacta(nota?: number | string | null): string {
  if (nota === null || nota === undefined || String(nota).trim() === '') return ''
  const n = Number(nota)
  if (!Number.isFinite(n)) return ''
  const texto = Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',')
  return ` • Nota: ${texto}`
}

export function formatarRegistroAtividadeLinha(atividade: RegistroAtividadeLike): string {
  const tipoNome = nomeTipoAtividade(atividade)
  const numero = atividade.numero_protocolo != null && String(atividade.numero_protocolo).trim() !== '' ? `Protocolo ${atividade.numero_protocolo}` : ''
  const status = limparMarcadoresHash(String(atividade.status ?? '').trim())
  const detalhe = [numero, status].filter(Boolean).join(' • ')
  return `${tipoNome}${detalhe ? ` (${detalhe})` : ''}${formatarNotaCompacta(atividade.nota)}`
}

export function formatarRegistroSessaoTexto(sessao: SessaoHistoricoLike): string {
  const partes = (sessao.atividades ?? []).map((atividade) => formatarRegistroAtividadeLinha(atividade)).filter(Boolean)
  const resumoLimpo = limparResumoTransferencia(sessao.resumo_atividades)
  return [partes.join('; '), resumoLimpo].filter(Boolean).join('\n').trim()
}

export function formatarTelefoneBR(valor?: string | null): string {
  const digitos = String(valor ?? '').replace(/\D/g, '')
  if (!digitos) return ''
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return valor?.trim() || ''
}

export function formatarDataBR(valor?: string | null): string {
  if (!valor) return ''
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR')
}

export function formatarHoraBR(valor?: string | null): string {
  if (!valor) return ''
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatarEnderecoLinha(input: {
  logradouro?: string | null
  numero_endereco?: string | null
  bairro?: string | null
  municipio?: string | null
  ponto_referencia?: string | null
} | null | undefined): string {
  if (!input) return ''
  const linha1 = [input.logradouro?.trim(), input.numero_endereco?.trim()].filter(Boolean).join(', ')
  const linha2 = [input.bairro?.trim(), input.municipio?.trim()].filter(Boolean).join(' - ')
  const ref = input.ponto_referencia?.trim()
  return [linha1, linha2, ref ? `Ref.: ${ref}` : ''].filter(Boolean).join(' • ')
}
