import type {
  FaixaProtocolosAno,
  PeDeMeiaChipUI,
  PeDeMeiaClassificacaoUI,
  ProgressoOption,
} from './types'

const SUPABASE_PUBLIC_STORAGE_BASE = (() => {
  const raw = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
  return raw ? `${raw}/storage/v1/object/public` : ''
})()

export function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

type StorageListEntry = { name?: string | null } | null | undefined

export type SupabaseStorageLike = {
  storage: {
    from: (bucket: string) => {
      list: (
        path?: string,
        options?: Record<string, unknown>
      ) => Promise<{ data: Array<StorageListEntry> | null; error: unknown }>
    }
  }
} | null | undefined

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

function selecionarMelhorArquivo(entries: Array<StorageListEntry> | null | undefined, prefix: string): string | undefined {
  const nomes = (entries ?? [])
    .map((item) => String(item?.name ?? '').trim())
    .filter(Boolean)
    .filter((name) => name.startsWith(prefix))
    .sort((a, b) => b.localeCompare(a))

  return nomes[0]
}

export function extrairCaminhoFotoStorage(fotoUrl?: string | null, bucket = 'avatars'): string | undefined {
  const raw = String(fotoUrl ?? '').trim()
  if (!raw || /^(data:|blob:)/i.test(raw)) return undefined

  const path = sanitizeStoragePath(raw, bucket)
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return undefined
  return path.replace(/^\/+/, '') || undefined
}

export function resolverFotoUrl(fotoUrl?: string | null, bucket = 'avatars'): string | undefined {
  const raw = String(fotoUrl ?? '').trim()
  if (!raw) return undefined
  if (/^(data:|blob:)/i.test(raw)) return raw

  const path = sanitizeStoragePath(raw, bucket)
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path

  return SUPABASE_PUBLIC_STORAGE_BASE ? `${SUPABASE_PUBLIC_STORAGE_BASE}/${bucket}/${path}` : raw
}

export function resolverFotoUrlComVersao(fotoUrl?: string | null, bucket = 'avatars'): string | undefined {
  const normalizada = resolverFotoUrl(fotoUrl, bucket)
  if (!normalizada) return undefined
  const versionKey = String(fotoUrl ?? normalizada)
  return `${normalizada}${normalizada.includes('?') ? '&' : '?'}v=${encodeURIComponent(versionKey)}`
}

export async function buscarFotoAlunoNoStorage(
  supabase: SupabaseStorageLike,
  idAluno?: number | null,
  bucket = 'avatars'
): Promise<string | undefined> {
  if (!supabase || !idAluno) return undefined

  const storage = supabase.storage.from(bucket)
  const prefix = `aluno-${idAluno}-`

  try {
    const { data: raizDireta } = await storage.list('alunos', {
      limit: 100,
      search: prefix,
      sortBy: { column: 'name', order: 'desc' },
    } as any)

    const arquivoDireto = selecionarMelhorArquivo(raizDireta, prefix)
    if (arquivoDireto) return `alunos/${arquivoDireto}`

    const { data: filhosRaiz } = await storage.list('alunos', {
      limit: 100,
      sortBy: { column: 'name', order: 'desc' },
    } as any)

    const candidatos: string[] = []
    for (const item of filhosRaiz ?? []) {
      const nomePasta = String(item?.name ?? '').trim()
      if (!nomePasta) continue

      const { data: filhosSubpasta, error } = await storage.list(`alunos/${nomePasta}`, {
        limit: 100,
        search: prefix,
        sortBy: { column: 'name', order: 'desc' },
      } as any)

      if (error) continue

      const arquivoSubpasta = selecionarMelhorArquivo(filhosSubpasta, prefix)
      if (arquivoSubpasta) {
        candidatos.push(`alunos/${nomePasta}/${arquivoSubpasta}`)
      }
    }

    return candidatos.sort((a, b) => b.localeCompare(a))[0]
  } catch (error) {
    console.warn('[buscarFotoAlunoNoStorage] Falha ao localizar foto do aluno no bucket avatars.', error)
    return undefined
  }
}

export async function resolverFotoAlunoUrl(
  supabase: SupabaseStorageLike,
  idAluno?: number | null,
  fotoUrl?: string | null,
  bucket = 'avatars'
): Promise<string | undefined> {
  const direta = resolverFotoUrlComVersao(fotoUrl, bucket)
  if (direta) return direta

  const caminhoFallback = await buscarFotoAlunoNoStorage(supabase, idAluno, bucket)
  if (!caminhoFallback) return undefined

  return resolverFotoUrlComVersao(caminhoFallback, bucket)
}

export function hojeISODateLocal(): string {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function agoraParaInputDateTimeLocal(): string {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export function formatarDataHoraBR(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function nomeNivelEnsinoCurto(idNivel: number | null | undefined): string {
  if (idNivel === 1) return 'Fundamental'
  if (idNivel === 2) return 'Médio'
  return '-'
}

export function nomeNivelEnsinoLongo(idNivel: number | null | undefined): string {
  if (idNivel === 1) return 'Ensino Fundamental'
  if (idNivel === 2) return 'Ensino Médio'
  return '-'
}

export function isStatusDisciplinaAberta(statusNome: string): boolean {
  const s = normalizarTexto(statusNome)
  if (
    s.includes('aprov') ||
    s.includes('reprov') ||
    s.includes('conclu') ||
    s.includes('final') ||
    s.includes('encerr') ||
    s.includes('tranc') ||
    s.includes('cancel') ||
    s.includes('inativ')
  ) {
    return false
  }
  return true
}

export function statusChipProps(status: string): {
  label: string
  color?: 'default' | 'success' | 'warning' | 'info' | 'error'
} {
  const s = normalizarTexto(status)
  if (s.includes('conclu')) return { label: status, color: 'success' }
  if (s.includes('andamento')) return { label: status, color: 'info' }
  if (s.includes('fazer')) return { label: status, color: 'warning' }
  return { label: status, color: 'default' }
}

export function renderNumeroInscricao(option: { numero_inscricao?: string | null }): string {
  const ra = option.numero_inscricao?.trim()
  return ra ? `RA: ${ra}` : 'RA: -'
}

export function formatarEnderecoAluno(input: {
  aluno_logradouro?: string | null
  aluno_numero_endereco?: string | null
  aluno_bairro?: string | null
  aluno_municipio?: string | null
  aluno_ponto_referencia?: string | null
} | null | undefined): string {
  if (!input) return '-'

  const linha1 = [input.aluno_logradouro?.trim(), input.aluno_numero_endereco?.trim()].filter(Boolean).join(', ')
  const linha2 = [input.aluno_bairro?.trim(), input.aluno_municipio?.trim()].filter(Boolean).join(' - ')
  const ref = input.aluno_ponto_referencia?.trim()

  return [linha1, linha2, ref ? `Ref.: ${ref}` : null].filter(Boolean).join(' • ') || '-'
}

export function isBuscaNumerica(input: string): boolean {
  const t = input.trim()
  return t.length > 0 && /^[\d.\-\s]+$/.test(t)
}

export function extrairDigitos(input: string): string {
  return input.replace(/\D/g, '')
}

export function formatarCPF(digitos: string): string {
  const d = extrairDigitos(digitos).padStart(11, '0').slice(-11)
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

export function calcularIdade(dataNascStr: string, refDate: Date): number {
  const nasc = new Date(dataNascStr)
  if (Number.isNaN(nasc.getTime())) return -1
  let idade = refDate.getFullYear() - nasc.getFullYear()
  const m = refDate.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && refDate.getDate() < nasc.getDate())) {
    idade--
  }
  return idade
}

export function avaliarPeDeMeiaCEJA(opts: {
  id_nivel_ensino?: number | null
  cpf?: string | null
  data_nascimento?: string | null
  nis?: string | null
  possui_beneficio_governo?: boolean | null
  data_matricula?: string | null
  ano_letivo?: number | null
}): { classificacao: PeDeMeiaClassificacaoUI; motivos: string[] } {
  const motivos: string[] = []

  const nivel = opts.id_nivel_ensino ?? null
  if (nivel !== 2) {
    motivos.push('Não é Ensino Médio.')
    return { classificacao: 'NAO_ELEGIVEL', motivos }
  }

  const cpfOk = Boolean(opts.cpf && String(opts.cpf).trim() !== '')
  if (!cpfOk) motivos.push('CPF ausente (cadastro incompleto).')

  const cadOk = Boolean((opts.nis && String(opts.nis).trim() !== '') || opts.possui_beneficio_governo)
  if (!cadOk) motivos.push('CadÚnico não confirmado (sem NIS e sem benefício informado).')

  const dataMat = opts.data_matricula ? new Date(opts.data_matricula) : null
  const dataMatOk = Boolean(dataMat && !Number.isNaN(dataMat.getTime()))
  if (!dataMatOk) motivos.push('Data de matrícula ausente/ inválida.')

  const anoLetivo =
    opts.ano_letivo != null
      ? Number(opts.ano_letivo)
      : dataMatOk && dataMat
        ? dataMat.getFullYear()
        : new Date().getFullYear()

  let corteOk: boolean | null = null
  if (dataMatOk && dataMat) {
    const inicioPrimeiro = new Date(anoLetivo, 0, 7)
    const cutoff1 = new Date(inicioPrimeiro)
    cutoff1.setMonth(cutoff1.getMonth() + 2)

    const inicioSegundo = new Date(anoLetivo, 6, 1)
    const cutoff2 = new Date(inicioSegundo)
    cutoff2.setMonth(cutoff2.getMonth() + 2)

    if (dataMat <= inicioSegundo) {
      corteOk = dataMat <= cutoff1
    } else {
      corteOk = dataMat <= cutoff2
    }

    if (!corteOk) motivos.push('Matrícula fora do prazo inicial do semestre.')
  }

  let idadeOk: boolean | null = null
  if (opts.data_nascimento) {
    const dataRef = new Date(anoLetivo, 11, 31)
    const idade = calcularIdade(opts.data_nascimento, dataRef)
    if (idade < 0) {
      idadeOk = null
      motivos.push('Data de nascimento inválida.')
    } else {
      idadeOk = idade >= 19 && idade <= 24
      if (!idadeOk) motivos.push(`Idade fora da faixa 19–24 em 31/12/${anoLetivo} (idade: ${idade}).`)
    }
  } else {
    motivos.push('Data de nascimento ausente (não dá para confirmar a idade).')
  }

  if (idadeOk === false) return { classificacao: 'NAO_ELEGIVEL', motivos }
  if (corteOk === false) return { classificacao: 'NAO_ELEGIVEL', motivos }

  const dadosEssenciaisOk = cpfOk && cadOk && idadeOk === true && corteOk === true
  if (dadosEssenciaisOk) return { classificacao: 'ELEGIVEL', motivos }

  return { classificacao: 'CONFERIR', motivos }
}

export function chipPeDeMeiaUI(opts: {
  id_nivel_ensino?: number | null
  cpf?: string | null
  data_nascimento?: string | null
  nis?: string | null
  possui_beneficio_governo?: boolean | null
  data_matricula?: string | null
  ano_letivo?: number | null
}): PeDeMeiaChipUI {
  const r = avaliarPeDeMeiaCEJA(opts)
  const labelBase =
    r.classificacao === 'ELEGIVEL'
      ? 'Elegível'
      : r.classificacao === 'NAO_ELEGIVEL'
        ? 'Não elegível'
        : 'Conferir dados'

  const color = r.classificacao === 'ELEGIVEL' ? 'success' : r.classificacao === 'NAO_ELEGIVEL' ? 'error' : 'warning'
  const variant = r.classificacao === 'NAO_ELEGIVEL' ? 'outlined' : 'filled'
  const tooltip = r.motivos.length ? r.motivos.join('\n') : undefined

  return {
    label: `Pé-de-Meia: ${labelBase}`,
    color,
    variant,
    tooltip,
  }
}

export function escolherProgressoPorDisciplina(lista: ProgressoOption[], idDisciplina: number): ProgressoOption | null {
  const candidatos = lista.filter((p) => p.id_disciplina === idDisciplina)
  if (candidatos.length === 0) return null

  const ordenado = [...candidatos].sort((a, b) => {
    const aAberta = isStatusDisciplinaAberta(a.status_nome ?? '') ? 1 : 0
    const bAberta = isStatusDisciplinaAberta(b.status_nome ?? '') ? 1 : 0
    if (bAberta !== aAberta) return bAberta - aAberta
    if (b.id_ano_escolar !== a.id_ano_escolar) return b.id_ano_escolar - a.id_ano_escolar
    return b.id_progresso - a.id_progresso
  })

  return ordenado[0] ?? null
}

export function agruparAbertasPorDisciplina(abertas: ProgressoOption[]): ProgressoOption[] {
  const mapa = new Map<number, ProgressoOption>()

  abertas.forEach((p) => {
    const cur = mapa.get(p.id_disciplina)
    if (!cur) {
      mapa.set(p.id_disciplina, p)
      return
    }
    if (p.id_ano_escolar !== cur.id_ano_escolar) {
      if (p.id_ano_escolar > cur.id_ano_escolar) mapa.set(p.id_disciplina, p)
      return
    }
    if (p.id_progresso > cur.id_progresso) mapa.set(p.id_disciplina, p)
  })

  return Array.from(mapa.values()).sort((a, b) => a.disciplina_nome.localeCompare(b.disciplina_nome))
}

export function resumoFaixasProtocolos(faixas: FaixaProtocolosAno[]): string {
  if (!faixas?.length) return ''
  return faixas
    .filter((f) => Number(f.quantidade_protocolos ?? 0) > 0)
    .map((f) => `${f.ano_nome}: ${f.inicio}-${f.fim}`)
    .join(' • ')
}

export function anoPorNumeroProtocolo(faixas: FaixaProtocolosAno[], n: number): string | null {
  const f = (faixas ?? []).find((x) => n >= x.inicio && n <= x.fim)
  return f?.ano_nome ?? null
}
