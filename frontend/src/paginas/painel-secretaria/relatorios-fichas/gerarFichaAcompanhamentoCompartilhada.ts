import {
  baixarFichaAcompanhamentoPdf,
  montarEnderecoPdf,
  montarHistoricoPdfRows,
} from '../../painel-professor/ficha-acompanhamento/pdf/gerarFichaAcompanhamentoPdf'
import {
  carregarFotoAlunoDataUrl,
  first,
  normalizarTexto,
  resolverFotoAlunoUrl,
  sessaoDeveAparecerNoHistorico,
} from '../../painel-professor/ficha-acompanhamento/utils'

type SupabaseLike = any

type UsuarioJoin = {
  name?: string | null
  email?: string | null
  foto_url?: string | null
  celular?: string | null
  data_nascimento?: string | null
  logradouro?: string | null
  numero_endereco?: string | null
  bairro?: string | null
  municipio?: string | null
  ponto_referencia?: string | null
  facebook_url?: string | null
  instagram_url?: string | null
}

type AlunoJoin = {
  id_aluno: number
  usuarios?: UsuarioJoin | UsuarioJoin[] | null
}

type MatriculaJoin = {
  id_matricula: number
  numero_inscricao: string
  modalidade?: string | null
  ano_letivo?: number | null
  data_matricula?: string | null
  id_nivel_ensino?: number | null
  id_status_matricula?: number | null
  niveis_ensino?: { nome?: string | null } | { nome?: string | null }[] | null
  alunos?: AlunoJoin | AlunoJoin[] | null
}

type DisciplinaJoin = {
  id_disciplina: number
  nome_disciplina?: string | null
}

type AnoEscolarJoin = {
  id_ano_escolar: number
  nome_ano?: string | null
  id_nivel_ensino?: number | null
}

type ProgressoJoin = {
  id_progresso: number
  id_matricula: number
  id_disciplina: number
  id_ano_escolar: number
  nota_final: number | null
  observacoes?: string | null
  disciplinas?: DisciplinaJoin | DisciplinaJoin[] | null
  anos_escolares?: AnoEscolarJoin | AnoEscolarJoin[] | null
}

type RegistroAtividade = {
  id_atividade: number
  id_sessao: number
  id_progresso: number
  numero_protocolo: number
  id_tipo_protocolo: number
  status: string
  nota: number | null
  is_adaptada?: boolean | null
  sintese?: string | null
  created_at: string
  updated_at: string
  tipos_protocolo?: { nome?: string | null } | { nome?: string | null }[] | null
}

type SessaoHistorico = {
  id_sessao: number
  id_progresso: number
  hora_entrada: string
  hora_saida: string | null
  resumo_atividades: string | null
  professor_nome: string
  atividades: RegistroAtividade[]
}

type ProtocoloAtividadeState = {
  id_tipo: number
  registro: {
    id_atividade?: number
    id_sessao?: number
    status?: string
    nota?: number | string | null
    is_adaptada?: boolean | null
    sintese?: string | null
  } | null
}

type ProtocoloState = {
  numero: number
  ano_escolar: string
  atividades: {
    pesquisa: ProtocoloAtividadeState
    complementar: ProtocoloAtividadeState
    avaliacao: ProtocoloAtividadeState
    aso: ProtocoloAtividadeState
    recuperacao: ProtocoloAtividadeState
  }
}

type FaixaAnoProtocolos = {
  id_ano_escolar: number
  ano_nome: string
  quantidade: number
  inicio: number
  fim: number
}

type GradeData = {
  headers: { serie: string; colspan: number }[]
  protocolos: number[]
  body: { etapa: string; notas: (number | null)[] }[]
  mediaFinal: number | null
}

const TIPOS = {
  PESQUISA: 1,
  COMPLEMENTAR: 2,
  AVALIACAO: 3,
  ASO: 4,
  RECUPERACAO: 5,
} as const

const statusAtivaCache = new WeakMap<object, Promise<number | null>>()

function parseNota(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function isModalidadeOrientacao(modalidade?: string | null): boolean {
  return normalizarTexto(String(modalidade ?? '')).includes('orientacao')
}

function sessaoHasActivityType(
  sessao: { atividades?: Array<{ id_tipo_protocolo?: number | null }> | null },
  type: 'AT' | 'AV' | 'RE'
) {
  const typeMap: Record<'AT' | 'AV' | 'RE', number[]> = {
    AT: [TIPOS.PESQUISA, TIPOS.COMPLEMENTAR],
    AV: [TIPOS.AVALIACAO, TIPOS.ASO],
    RE: [TIPOS.RECUPERACAO],
  }

  return (sessao.atividades || []).some((atividade) =>
    typeMap[type].includes(Number(atividade.id_tipo_protocolo))
  )
}

function calcularFaixas(
  configs: Array<{
    id_ano_escolar: number
    nome_ano: string
    quantidade_protocolos: number
  }>
): FaixaAnoProtocolos[] {
  const ordenadas = [...configs].sort(
    (a, b) => Number(a.id_ano_escolar) - Number(b.id_ano_escolar)
  )

  let acumulado = 0
  return ordenadas
    .filter((config) => Number(config.quantidade_protocolos ?? 0) > 0)
    .map((config) => {
      const inicio = acumulado + 1
      const fim = acumulado + Number(config.quantidade_protocolos)
      acumulado = fim
      return {
        id_ano_escolar: Number(config.id_ano_escolar),
        ano_nome: String(config.nome_ano),
        quantidade: Number(config.quantidade_protocolos),
        inicio,
        fim,
      }
    })
}

function montarProtocolos(args: {
  total: number
  getAnoNome: (numero: number) => string
  registros: RegistroAtividade[]
}): ProtocoloState[] {
  const { total, getAnoNome, registros } = args

  const mapa = new Map<string, RegistroAtividade>()
  for (const registro of registros) {
    const key = `${registro.numero_protocolo}-${registro.id_tipo_protocolo}`
    const anterior = mapa.get(key)
    if (!anterior) {
      mapa.set(key, registro)
      continue
    }

    const anteriorTempo = new Date(
      anterior.updated_at || anterior.created_at
    ).getTime()
    const atualTempo = new Date(
      registro.updated_at || registro.created_at
    ).getTime()
    if (atualTempo >= anteriorTempo) mapa.set(key, registro)
  }

  const buildAtividade = (
    numeroProtocolo: number,
    idTipo: number
  ): ProtocoloAtividadeState => {
    const registro = mapa.get(`${numeroProtocolo}-${idTipo}`)
    return {
      id_tipo: idTipo,
      registro: registro
        ? {
            id_atividade: registro.id_atividade,
            id_sessao: registro.id_sessao,
            status: registro.status,
            nota: registro.nota,
            is_adaptada: registro.is_adaptada,
            sintese: registro.sintese ?? null,
          }
        : {
            status: 'A fazer',
            nota: null,
            is_adaptada: false,
            sintese: null,
          },
    }
  }

  const lista: ProtocoloState[] = []
  for (let numero = 1; numero <= total; numero += 1) {
    lista.push({
      numero,
      ano_escolar: getAnoNome(numero),
      atividades: {
        pesquisa: buildAtividade(numero, TIPOS.PESQUISA),
        complementar: buildAtividade(numero, TIPOS.COMPLEMENTAR),
        avaliacao: buildAtividade(numero, TIPOS.AVALIACAO),
        aso: buildAtividade(numero, TIPOS.ASO),
        recuperacao: buildAtividade(numero, TIPOS.RECUPERACAO),
      },
    })
  }

  return lista
}

function montarGrade(args: {
  headers: { serie: string; colspan: number }[]
  total: number
  protocolos: ProtocoloState[]
  mediaFinalBanco: number | null
}): GradeData {
  const { headers, total, protocolos, mediaFinalBanco } = args
  const numeros = Array.from({ length: total }, (_, index) => index + 1)

  const notaAtividade = numeros.map((numero) => {
    const protocolo = protocolos.find((item) => item.numero === numero)
    return protocolo
      ? parseNota(protocolo.atividades.complementar?.registro?.nota)
      : null
  })

  const notaAvaliacaoEfetiva = numeros.map((numero) => {
    const protocolo = protocolos.find((item) => item.numero === numero)
    if (!protocolo) return null
    const avaliacao = parseNota(protocolo.atividades.avaliacao?.registro?.nota)
    const recuperacao = parseNota(
      protocolo.atividades.recuperacao?.registro?.nota
    )
    if (avaliacao !== null && avaliacao >= 6) return avaliacao
    if (avaliacao !== null && avaliacao < 6 && recuperacao !== null) {
      return recuperacao
    }
    return avaliacao
  })

  const mediaPorProtocolo = numeros.map((_numero, index) => {
    const atividade = notaAtividade[index]
    const avaliacao = notaAvaliacaoEfetiva[index]
    if (atividade === null || avaliacao === null) return null
    return Number(((atividade + avaliacao) / 2).toFixed(2))
  })

  let mediaFinal = mediaFinalBanco
  if (mediaFinal === null) {
    const valores = mediaPorProtocolo.filter(
      (valor): valor is number => valor !== null
    )
    if (valores.length) {
      const media = valores.reduce((acc, valor) => acc + valor, 0) / valores.length
      mediaFinal = Number(media.toFixed(2))
    }
  }

  return {
    headers,
    protocolos: numeros,
    body: [
      { etapa: 'NOTA ATIVIDADE', notas: notaAtividade },
      { etapa: 'NOTA AVALIAÇÃO', notas: notaAvaliacaoEfetiva },
      { etapa: 'MÉDIA', notas: mediaPorProtocolo },
    ],
    mediaFinal,
  }
}

async function getStatusAtivaId(supabase: SupabaseLike): Promise<number | null> {
  if (!supabase) return null
  const cacheKey = supabase as object
  const cached = statusAtivaCache.get(cacheKey)
  if (cached) return cached

  const promise = (async () => {
    const { data, error } = await supabase
      .from('status_matricula')
      .select('id_status_matricula,nome')

    if (error) {
      console.warn(
        '[gerarFichaAcompanhamentoCompartilhada] Falha ao consultar status_matricula.',
        error
      )
      return null
    }

    const ativa = (data ?? []).find((item: any) =>
      normalizarTexto(String(item?.nome ?? '')).includes('ativa')
    )

    return ativa?.id_status_matricula ?? null
  })()

  statusAtivaCache.set(cacheKey, promise)
  return promise
}


async function buscarMatriculasAluno(args: {
  supabase: SupabaseLike
  alunoId: number
  anoLetivo?: number
  statusAtivaId: number | null
  apenasAtivas?: boolean
}): Promise<MatriculaJoin[]> {
  const { supabase, alunoId, anoLetivo, statusAtivaId, apenasAtivas = false } = args

  const selectMatricula = `
    id_matricula,
    numero_inscricao,
    modalidade,
    ano_letivo,
    data_matricula,
    id_nivel_ensino,
    id_status_matricula,
    niveis_ensino(nome),
    alunos(
      id_aluno,
      usuarios(
        name,
        email,
        foto_url,
        celular,
        data_nascimento,
        logradouro,
        numero_endereco,
        bairro,
        municipio,
        ponto_referencia,
        facebook_url,
        instagram_url
      )
    )
  `

  let query = supabase
    .from('matriculas')
    .select(selectMatricula)
    .eq('id_aluno', alunoId)
    .order('ano_letivo', { ascending: false, nullsFirst: false })
    .order('data_matricula', { ascending: false, nullsFirst: false })
    .order('id_matricula', { ascending: false })
    .limit(40)

  if (Number.isFinite(anoLetivo)) {
    query = query.eq('ano_letivo', Number(anoLetivo))
  }

  if (apenasAtivas && statusAtivaId) {
    query = query.eq('id_status_matricula', statusAtivaId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as MatriculaJoin[]
}

function compararMatriculasPorPrioridade(
  a: MatriculaJoin,
  b: MatriculaJoin,
  statusAtivaId: number | null
) {
  const aAtiva = statusAtivaId != null && Number(a.id_status_matricula) === Number(statusAtivaId) ? 1 : 0
  const bAtiva = statusAtivaId != null && Number(b.id_status_matricula) === Number(statusAtivaId) ? 1 : 0
  if (aAtiva !== bAtiva) return bAtiva - aAtiva

  const anoDiff = Number(b.ano_letivo ?? 0) - Number(a.ano_letivo ?? 0)
  if (anoDiff !== 0) return anoDiff

  const dataA = a.data_matricula ? new Date(a.data_matricula).getTime() : 0
  const dataB = b.data_matricula ? new Date(b.data_matricula).getTime() : 0
  if (dataA !== dataB) return dataB - dataA

  return Number(b.id_matricula ?? 0) - Number(a.id_matricula ?? 0)
}

async function buscarProgressosDisciplina(args: {
  supabase: SupabaseLike
  idsMatriculas: number[]
  disciplinaId: number
}): Promise<ProgressoJoin[]> {
  const { supabase, idsMatriculas, disciplinaId } = args
  if (!idsMatriculas.length) return []

  const { data, error } = await supabase
    .from('progresso_aluno')
    .select(
      `
      id_progresso,
      id_matricula,
      id_disciplina,
      id_ano_escolar,
      nota_final,
      observacoes,
      disciplinas(id_disciplina,nome_disciplina),
      anos_escolares(id_ano_escolar,nome_ano,id_nivel_ensino)
    `
    )
    .in('id_matricula', idsMatriculas)
    .eq('id_disciplina', disciplinaId)
    .order('id_progresso', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data ?? []) as ProgressoJoin[]
}

function escolherContextoMatriculaEProgresso(args: {
  matriculas: MatriculaJoin[]
  progressos: ProgressoJoin[]
  statusAtivaId: number | null
}) {
  const { matriculas, progressos, statusAtivaId } = args
  const matriculasOrdenadas = [...matriculas].sort((a, b) =>
    compararMatriculasPorPrioridade(a, b, statusAtivaId)
  )
  const ordem = new Map<number, number>()
  matriculasOrdenadas.forEach((matricula, index) => {
    ordem.set(Number(matricula.id_matricula), index)
  })
  const matriculaPorId = new Map<number, MatriculaJoin>()
  matriculasOrdenadas.forEach((matricula) => {
    matriculaPorId.set(Number(matricula.id_matricula), matricula)
  })

  const progressosOrdenados = [...progressos].sort((a, b) => {
    const ordemA = ordem.get(Number(a.id_matricula)) ?? Number.MAX_SAFE_INTEGER
    const ordemB = ordem.get(Number(b.id_matricula)) ?? Number.MAX_SAFE_INTEGER
    if (ordemA !== ordemB) return ordemA - ordemB
    return Number(b.id_progresso) - Number(a.id_progresso)
  })

  const progresso = progressosOrdenados[0] ?? null
  const matricula = progresso
    ? matriculaPorId.get(Number(progresso.id_matricula)) ?? matriculasOrdenadas[0] ?? null
    : matriculasOrdenadas[0] ?? null

  return { matricula, progresso }
}

function formatarDataBR(valor?: string | null): string {
  if (!valor) return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleDateString('pt-BR')
}

export async function gerarFichaAcompanhamentoCompartilhada(args: {
  supabase: SupabaseLike
  alunoId: number
  disciplinaId: number
  anoLetivo?: number
  disciplinaNomeFallback?: string
}) {
  const { supabase, alunoId, disciplinaId, anoLetivo, disciplinaNomeFallback } = args

  if (!supabase) throw new Error('Supabase não configurado.')
  if (!Number.isFinite(alunoId)) throw new Error('Aluno inválido.')
  if (!Number.isFinite(disciplinaId)) throw new Error('Disciplina inválida.')
  if (anoLetivo != null && !Number.isFinite(anoLetivo)) {
    throw new Error('Ano letivo inválido.')
  }

  const statusAtivaId = await getStatusAtivaId(supabase)
  const matriculasPreferenciais = await buscarMatriculasAluno({
    supabase,
    alunoId,
    anoLetivo,
    statusAtivaId,
    apenasAtivas: true,
  })
  const matriculasFallback = matriculasPreferenciais.length
    ? matriculasPreferenciais
    : await buscarMatriculasAluno({
        supabase,
        alunoId,
        anoLetivo,
        statusAtivaId,
        apenasAtivas: false,
      })

  if (!matriculasFallback.length) {
    throw new Error(
      anoLetivo != null
        ? 'Aluno não possui matrícula no ano letivo selecionado.'
        : 'Aluno não possui matrícula cadastrada.'
    )
  }

  let matriculasContexto = matriculasFallback
  let idsMatriculas = matriculasContexto
    .map((item) => Number(item.id_matricula))
    .filter((item) => Number.isFinite(item))
  let progressos = await buscarProgressosDisciplina({
    supabase,
    idsMatriculas,
    disciplinaId,
  })

  if (!progressos.length && anoLetivo == null) {
    const todasMatriculas = await buscarMatriculasAluno({
      supabase,
      alunoId,
      statusAtivaId,
      apenasAtivas: false,
    })
    if (todasMatriculas.length) {
      matriculasContexto = todasMatriculas
      idsMatriculas = matriculasContexto
        .map((item) => Number(item.id_matricula))
        .filter((item) => Number.isFinite(item))
      progressos = await buscarProgressosDisciplina({
        supabase,
        idsMatriculas,
        disciplinaId,
      })
    }
  }

  const { matricula, progresso } = escolherContextoMatriculaEProgresso({
    matriculas: matriculasContexto,
    progressos,
    statusAtivaId,
  })

  if (!matricula) {
    throw new Error(
      anoLetivo != null
        ? 'Aluno não possui matrícula no ano letivo selecionado.'
        : 'Aluno não possui matrícula cadastrada.'
    )
  }

  if (!progresso) {
    throw new Error(
      anoLetivo != null
        ? 'Não há ficha/progresso cadastrado para esta disciplina no ano letivo selecionado.'
        : 'Não há ficha/progresso cadastrado para esta disciplina nas matrículas localizadas do aluno.'
    )
  }

  const aluno = first(matricula.alunos)
  const usuario = first(aluno?.usuarios)

  const modalidade = String(matricula.modalidade ?? '')
  const nivelId =
    matricula.id_nivel_ensino != null
      ? Number(matricula.id_nivel_ensino)
      : first(progresso.anos_escolares)?.id_nivel_ensino != null
        ? Number(first(progresso.anos_escolares)?.id_nivel_ensino)
        : null

  let faixas: FaixaAnoProtocolos[] = []
  let headers: { serie: string; colspan: number }[] = []

  if (isModalidadeOrientacao(modalidade) && nivelId != null) {
    const { data: configsRaw, error: cfgError } = await supabase
      .from('config_disciplina_ano')
      .select(
        `
        id_ano_escolar,
        quantidade_protocolos,
        anos_escolares(nome_ano,id_nivel_ensino)
      `
      )
      .eq('id_disciplina', Number(progresso.id_disciplina))

    if (cfgError) throw cfgError

    const configs = (configsRaw ?? [])
      .map((item: any) => {
        const ano = first(item?.anos_escolares)
        return {
          id_ano_escolar: Number(item.id_ano_escolar),
          nome_ano: String(ano?.nome_ano ?? `Ano ${item.id_ano_escolar}`),
          quantidade_protocolos: Number(item.quantidade_protocolos ?? 0),
          id_nivel_ensino:
            ano?.id_nivel_ensino != null ? Number(ano.id_nivel_ensino) : null,
        }
      })
      .filter(
        (item: { quantidade_protocolos: number; id_nivel_ensino: number | null }) =>
          Number(item.quantidade_protocolos) > 0 &&
          Number(item.id_nivel_ensino) === Number(nivelId)
      )

    faixas = calcularFaixas(configs)
    headers = faixas.map((faixa) => ({
      serie: faixa.ano_nome,
      colspan: faixa.quantidade,
    }))
  } else {
    const anoNome = first(progresso.anos_escolares)?.nome_ano ?? '-'

    const { data: cfgRaw, error: cfgError } = await supabase
      .from('config_disciplina_ano')
      .select('quantidade_protocolos')
      .eq('id_disciplina', Number(progresso.id_disciplina))
      .eq('id_ano_escolar', Number(progresso.id_ano_escolar))
      .maybeSingle()

    if (cfgError) throw cfgError

    const quantidade = Number(cfgRaw?.quantidade_protocolos ?? 0)
    faixas =
      quantidade > 0
        ? [
            {
              id_ano_escolar: Number(progresso.id_ano_escolar),
              ano_nome: String(anoNome),
              quantidade,
              inicio: 1,
              fim: quantidade,
            },
          ]
        : []
    headers = quantidade > 0 ? [{ serie: String(anoNome), colspan: quantidade }] : []
  }

  const totalProtocolos = faixas.length ? faixas[faixas.length - 1].fim : 0

  const { data: registrosRaw, error: registrosError } = await supabase
    .from('registros_atendimento')
    .select(
      `
      id_atividade,
      id_sessao,
      id_progresso,
      numero_protocolo,
      id_tipo_protocolo,
      status,
      nota,
      is_adaptada,
      sintese,
      created_at,
      updated_at,
      tipos_protocolo(nome)
    `
    )
    .eq('id_progresso', Number(progresso.id_progresso))
    .order('numero_protocolo', { ascending: true })
    .order('id_tipo_protocolo', { ascending: true })
    .limit(20000)

  if (registrosError) throw registrosError
  const registros = (registrosRaw ?? []) as RegistroAtividade[]

  const { data: sessoesRaw, error: sessoesError } = await supabase
    .from('sessoes_atendimento')
    .select(
      `
      id_sessao,
      id_progresso,
      hora_entrada,
      hora_saida,
      resumo_atividades,
      professores(usuarios(name)),
      registros_atendimento(
        id_atividade,
        id_sessao,
        id_progresso,
        numero_protocolo,
        id_tipo_protocolo,
        status,
        nota,
        is_adaptada,
        sintese,
        created_at,
        updated_at,
        tipos_protocolo(nome)
      )
    `
    )
    .eq('id_progresso', Number(progresso.id_progresso))
    .order('hora_entrada', { ascending: false })
    .limit(5000)

  if (sessoesError) throw sessoesError

  const sessoes: SessaoHistorico[] = (sessoesRaw ?? []).map((sessao: any) => {
    const professorNome = first(first(sessao?.professores)?.usuarios)?.name ?? ''
    const atividades = [...((sessao?.registros_atendimento ?? []) as RegistroAtividade[])].sort(
      (a, b) => {
        const protocoloDiff = Number(a.numero_protocolo) - Number(b.numero_protocolo)
        if (protocoloDiff !== 0) return protocoloDiff
        return Number(a.id_tipo_protocolo) - Number(b.id_tipo_protocolo)
      }
    )

    return {
      id_sessao: Number(sessao.id_sessao),
      id_progresso: Number(sessao.id_progresso ?? progresso.id_progresso),
      hora_entrada: String(sessao.hora_entrada),
      hora_saida: sessao.hora_saida ? String(sessao.hora_saida) : null,
      resumo_atividades: sessao.resumo_atividades ?? null,
      professor_nome: String(professorNome),
      atividades,
    }
  })

  const sessoesHistorico = sessoes.filter((sessao) =>
    sessaoDeveAparecerNoHistorico(sessao)
  )
  const sessoesOrdenadas = [...sessoesHistorico].sort(
    (a, b) =>
      new Date(a.hora_entrada).getTime() - new Date(b.hora_entrada).getTime()
  )

  const sessoesParaPdf = sessoesHistorico.map((sessao) => ({
    ...sessao,
    hasAT: sessaoHasActivityType(sessao, 'AT'),
    hasAV: sessaoHasActivityType(sessao, 'AV'),
    hasRE: sessaoHasActivityType(sessao, 'RE'),
  }))

  const protocolos = montarProtocolos({
    total: totalProtocolos,
    getAnoNome: (numero) => {
      const faixa = faixas.find(
        (item) => numero >= item.inicio && numero <= item.fim
      )
      return faixa?.ano_nome ?? '-'
    },
    registros,
  })

  const gradeData = montarGrade({
    headers,
    total: totalProtocolos,
    protocolos,
    mediaFinalBanco: progresso.nota_final,
  })

  const primeiraSessao = sessoesOrdenadas[0] ?? null
  const ultimaSessao = sessoesOrdenadas[sessoesOrdenadas.length - 1] ?? null
  const disciplinaNome =
    first(progresso.disciplinas)?.nome_disciplina ??
    disciplinaNomeFallback ??
    `Disciplina ${disciplinaId}`
  const nivelNome = first(matricula.niveis_ensino)?.nome ?? '-'

  const situacao = isModalidadeOrientacao(modalidade)
    ? 'ORIENT'
    : gradeData.mediaFinal != null
      ? 'CLASSIF'
      : 'PROGR'

  const fotoUrlResolvida = await resolverFotoAlunoUrl(
    supabase,
    aluno?.id_aluno ?? null,
    usuario?.foto_url ?? null
  )
  const fotoDataUrl = await carregarFotoAlunoDataUrl(
    supabase,
    aluno?.id_aluno ?? null,
    usuario?.foto_url ?? null
  )

  const numeroInscricao = String(matricula.numero_inscricao ?? '')
  const fileName = `ficha-acompanhamento-${numeroInscricao || alunoId}.pdf`

  await baixarFichaAcompanhamentoPdf(
    {
      numeroInscricao,
      nivel: String(nivelNome || '-'),
      disciplina: String(disciplinaNome || '-'),
      inicio: formatarDataBR(
        primeiraSessao?.hora_entrada ?? matricula.data_matricula ?? null
      ),
      termino: formatarDataBR(
        ultimaSessao?.hora_saida ?? ultimaSessao?.hora_entrada ?? null
      ),
      nome: String(usuario?.name ?? `Aluno ${alunoId}`),
      nomeSocial: '',
      telefone: usuario?.celular ?? '',
      dataNascimento: usuario?.data_nascimento ?? '',
      endereco: montarEnderecoPdf({
        logradouro: usuario?.logradouro ?? '',
        numero_endereco: usuario?.numero_endereco ?? '',
        bairro: usuario?.bairro ?? '',
        municipio: usuario?.municipio ?? '',
        ponto_referencia: usuario?.ponto_referencia ?? '',
      }),
      bairro: String(usuario?.bairro ?? ''),
      pontoReferencia: String(usuario?.ponto_referencia ?? ''),
      whatsapp: usuario?.celular ?? '',
      facebook: String(usuario?.facebook_url ?? ''),
      instagram: String(usuario?.instagram_url ?? ''),
      email: String(usuario?.email ?? ''),
      situacao,
      gradeData,
      historico: montarHistoricoPdfRows(sessoesParaPdf),
      observacoes: String(progresso.observacoes ?? ''),
      assinaturaProfessor: String(
        ultimaSessao?.professor_nome ||
          sessoesOrdenadas[sessoesOrdenadas.length - 1]?.professor_nome ||
          ''
      ),
      fotoUrl: fotoUrlResolvida ?? usuario?.foto_url ?? '',
      fotoDataUrl: fotoDataUrl ?? '',
    },
    fileName
  )

  return {
    alunoNome: String(usuario?.name ?? `Aluno ${alunoId}`),
    numeroInscricao,
    disciplinaNome: String(disciplinaNome || '-'),
    fileName,
  }
}
