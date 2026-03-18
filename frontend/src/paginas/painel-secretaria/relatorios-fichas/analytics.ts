import type { SupabaseClient } from '@supabase/supabase-js'

export type SupabaseLike = SupabaseClient<any, 'public', any>

export type PeriodoAnaliticoDias = 7 | 30 | 90 | 180

export type GraficoItem = {
  label: string
  value: number
  secondary?: string
  color?: string
}

export type TendenciaItem = {
  key: string
  label: string
  value: number
}

export type AtendimentoAbertoAgora = {
  idSessao: number
  alunoNome: string
  professorNome: string
  disciplinaNome: string
  salaNome: string
  horaEntrada: string | null
  minutosEmAberto: number
}

export type InsightGestao = {
  titulo: string
  descricao: string
}

export type AnaliticoRelatoriosFichas = {
  atualizadoEm: string
  periodoDias: PeriodoAnaliticoDias
  indicadores: {
    atendimentosPeriodo: number
    alunosAtendidosPeriodo: number
    atendimentosAbertosAgora: number
    professoresEmAtendimentoAgora: number
    salasOcupadasAgora: number
    mediaNotas: number | null
    duracaoMediaMinutos: number | null
    taxaConclusaoAtividades: number | null
  }
  porProfessor: GraficoItem[]
  porDisciplina: GraficoItem[]
  porSala: GraficoItem[]
  abertosPorProfessor: GraficoItem[]
  abertosPorSala: GraficoItem[]
  tendenciaDiaria: TendenciaItem[]
  statusAtividades: GraficoItem[]
  atendimentosAbertosAgora: AtendimentoAbertoAgora[]
  insights: InsightGestao[]
}

type SessaoNormalizada = {
  idSessao: number
  idAluno: number | null
  idProfessor: number | null
  idSala: number | null
  horaEntrada: string | null
  horaSaida: string | null
  alunoNome: string
  professorNome: string
  salaNome: string
  disciplinaNome: string
}

type RegistroNormalizado = {
  status: string
  nota: number | null
  professorNome: string
  salaNome: string
  disciplinaNome: string
}

const COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#ea580c', '#dc2626', '#0891b2', '#4338ca', '#ca8a04']

const first = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

const nomeSeguro = (valor: unknown, fallback: string): string => {
  const texto = String(valor ?? '').trim()
  return texto || fallback
}

const paraNumero = (valor: unknown): number | null => {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

const inicioPeriodoIso = (dias: number): string => {
  const agora = new Date()
  agora.setHours(0, 0, 0, 0)
  agora.setDate(agora.getDate() - (dias - 1))
  return agora.toISOString()
}

const chaveDiaLocal = (valor: string | null | undefined): string | null => {
  if (!valor) return null
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const labelDiaCurto = (chave: string): string => {
  const [ano, mes, dia] = chave.split('-').map(Number)
  const data = new Date(ano, (mes ?? 1) - 1, dia ?? 1)
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const media = (valores: Array<number | null | undefined>): number | null => {
  const itens = valores.filter((valor): valor is number => typeof valor === 'number' && Number.isFinite(valor))
  if (!itens.length) return null
  const soma = itens.reduce((acc, item) => acc + item, 0)
  return soma / itens.length
}

const mediaDuracaoMinutos = (sessoes: SessaoNormalizada[]): number | null => {
  const duracoes = sessoes
    .map((sessao) => {
      if (!sessao.horaEntrada || !sessao.horaSaida) return null
      const inicio = new Date(sessao.horaEntrada).getTime()
      const fim = new Date(sessao.horaSaida).getTime()
      if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim <= inicio) return null
      return Math.round((fim - inicio) / 60000)
    })
    .filter((item): item is number => typeof item === 'number' && Number.isFinite(item))

  return media(duracoes)
}

const percentual = (parte: number, total: number): number | null => {
  if (!total) return null
  return (parte / total) * 100
}

const rankear = (
  mapa: Map<string, { value: number; secondary?: string; detalhes?: Set<string> }>,
  top = 8,
): GraficoItem[] => {
  return [...mapa.entries()]
    .map(([label, item], index) => ({
      label,
      value: item.value,
      secondary: item.secondary ?? (item.detalhes && item.detalhes.size ? [...item.detalhes].slice(0, 3).join(' • ') : undefined),
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, top)
}

const normalizarSessao = (row: any): SessaoNormalizada => {
  const aluno = first(row?.alunos)
  const alunoUsuario = first(aluno?.usuarios)
  const professor = first(row?.professores)
  const professorUsuario = first(professor?.usuarios)
  const sala = first(row?.salas_atendimento)
  const progresso = first(row?.progresso_aluno)
  const disciplina = first(progresso?.disciplinas)

  return {
    idSessao: Number(row?.id_sessao),
    idAluno: paraNumero(row?.id_aluno),
    idProfessor: paraNumero(row?.id_professor),
    idSala: paraNumero(row?.id_sala),
    horaEntrada: row?.hora_entrada ? String(row.hora_entrada) : null,
    horaSaida: row?.hora_saida ? String(row.hora_saida) : null,
    alunoNome: nomeSeguro(alunoUsuario?.name, `Aluno ${row?.id_aluno ?? ''}`.trim() || 'Aluno'),
    professorNome: nomeSeguro(professorUsuario?.name, 'Professor não identificado'),
    salaNome: nomeSeguro(sala?.nome, row?.id_sala ? `Sala ${row.id_sala}` : 'Sala não informada'),
    disciplinaNome: nomeSeguro(disciplina?.nome_disciplina, 'Disciplina não informada'),
  }
}

const normalizarRegistro = (row: any): RegistroNormalizado => {
  const sessao = first(row?.sessoes_atendimento)
  const professor = first(sessao?.professores)
  const professorUsuario = first(professor?.usuarios)
  const sala = first(sessao?.salas_atendimento)
  const progresso = first(sessao?.progresso_aluno)
  const disciplina = first(progresso?.disciplinas)

  return {
    status: nomeSeguro(row?.status, 'Sem status'),
    nota: paraNumero(row?.nota),
    professorNome: nomeSeguro(professorUsuario?.name, 'Professor não identificado'),
    salaNome: nomeSeguro(sala?.nome, 'Sala não informada'),
    disciplinaNome: nomeSeguro(disciplina?.nome_disciplina, 'Disciplina não informada'),
  }
}

const gerarTendencia = (sessoes: SessaoNormalizada[], periodoDias: PeriodoAnaliticoDias): TendenciaItem[] => {
  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)
  inicio.setDate(inicio.getDate() - (periodoDias - 1))

  const mapa = new Map<string, number>()
  for (let i = 0; i < periodoDias; i += 1) {
    const dia = new Date(inicio)
    dia.setDate(inicio.getDate() + i)
    const chave = chaveDiaLocal(dia.toISOString())
    if (chave) mapa.set(chave, 0)
  }

  sessoes.forEach((sessao) => {
    const chave = chaveDiaLocal(sessao.horaEntrada)
    if (!chave) return
    mapa.set(chave, (mapa.get(chave) ?? 0) + 1)
  })

  return [...mapa.entries()].map(([key, value]) => ({
    key,
    label: labelDiaCurto(key),
    value,
  }))
}

const montarInsights = (dados: Omit<AnaliticoRelatoriosFichas, 'insights'>): InsightGestao[] => {
  const insights: InsightGestao[] = []
  const liderProfessor = dados.porProfessor[0]
  if (liderProfessor) {
    insights.push({
      titulo: 'Professor com maior volume',
      descricao: `${liderProfessor.label} lidera o período com ${liderProfessor.value} atendimentos registrados.`,
    })
  }

  const liderDisciplina = dados.porDisciplina[0]
  if (liderDisciplina) {
    insights.push({
      titulo: 'Disciplina mais demandada',
      descricao: `${liderDisciplina.label} concentrou ${liderDisciplina.value} atendimentos no período analisado.`,
    })
  }

  const salaPressao = dados.abertosPorSala[0]
  if (salaPressao && salaPressao.value > 0) {
    insights.push({
      titulo: 'Ponto de atenção agora',
      descricao: `${salaPressao.label} tem ${salaPressao.value} atendimento(s) aberto(s) neste momento.`,
    })
  } else {
    insights.push({
      titulo: 'Situação atual das salas',
      descricao: 'Não há atendimentos em aberto neste momento, o que indica operação sem fila ativa.',
    })
  }

  return insights.slice(0, 3)
}

export async function carregarAnaliticoRelatoriosFichas(
  supabase: SupabaseLike,
  periodoDias: PeriodoAnaliticoDias,
): Promise<AnaliticoRelatoriosFichas> {
  const startIso = inicioPeriodoIso(periodoDias)

  const selectSessoes = `
    id_sessao,
    id_aluno,
    id_professor,
    id_sala,
    hora_entrada,
    hora_saida,
    alunos(
      id_aluno,
      usuarios(name)
    ),
    professores(
      id_professor,
      usuarios(name)
    ),
    salas_atendimento(
      id_sala,
      nome
    ),
    progresso_aluno(
      id_disciplina,
      disciplinas(nome_disciplina)
    )
  `

  const selectRegistros = `
    id_atividade,
    status,
    nota,
    created_at,
    sessoes_atendimento!inner(
      id_sessao,
      id_professor,
      id_sala,
      hora_entrada,
      hora_saida,
      professores(
        id_professor,
        usuarios(name)
      ),
      salas_atendimento(
        id_sala,
        nome
      ),
      progresso_aluno(
        id_disciplina,
        disciplinas(nome_disciplina)
      )
    )
  `

  const [sessoesPeriodoQuery, sessoesAbertasQuery, registrosPeriodoQuery] = await Promise.all([
    supabase
      .from('sessoes_atendimento')
      .select(selectSessoes)
      .gte('hora_entrada', startIso)
      .order('hora_entrada', { ascending: true })
      .range(0, 4999),
    supabase
      .from('sessoes_atendimento')
      .select(selectSessoes)
      .is('hora_saida', null)
      .order('hora_entrada', { ascending: false })
      .range(0, 999),
    supabase
      .from('registros_atendimento')
      .select(selectRegistros)
      .gte('created_at', startIso)
      .order('created_at', { ascending: false })
      .range(0, 7999),
  ])

  if (sessoesPeriodoQuery.error) throw sessoesPeriodoQuery.error
  if (sessoesAbertasQuery.error) throw sessoesAbertasQuery.error
  if (registrosPeriodoQuery.error) throw registrosPeriodoQuery.error

  const sessoesPeriodo = ((sessoesPeriodoQuery.data ?? []) as any[]).map(normalizarSessao)
  const sessoesAbertas = ((sessoesAbertasQuery.data ?? []) as any[]).map(normalizarSessao)
  const registrosPeriodo = ((registrosPeriodoQuery.data ?? []) as any[]).map(normalizarRegistro)

  const alunosPeriodo = new Set(
    sessoesPeriodo
      .map((sessao) => sessao.idAluno)
      .filter((item): item is number => typeof item === 'number' && Number.isFinite(item)),
  )

  const professoresAbertos = new Set(
    sessoesAbertas
      .map((sessao) => sessao.professorNome)
      .filter(Boolean),
  )

  const salasAbertas = new Set(
    sessoesAbertas
      .map((sessao) => sessao.salaNome)
      .filter(Boolean),
  )

  const mapaProfessor = new Map<string, { value: number; detalhes?: Set<string> }>()
  sessoesPeriodo.forEach((sessao) => {
    const atual = mapaProfessor.get(sessao.professorNome) ?? { value: 0, detalhes: new Set<string>() }
    atual.value += 1
    atual.detalhes?.add(sessao.disciplinaNome)
    mapaProfessor.set(sessao.professorNome, atual)
  })

  const mapaDisciplina = new Map<string, { value: number; detalhes?: Set<string> }>()
  sessoesPeriodo.forEach((sessao) => {
    const atual = mapaDisciplina.get(sessao.disciplinaNome) ?? { value: 0, detalhes: new Set<string>() }
    atual.value += 1
    atual.detalhes?.add(sessao.professorNome)
    mapaDisciplina.set(sessao.disciplinaNome, atual)
  })

  const mapaSala = new Map<string, { value: number; detalhes?: Set<string> }>()
  sessoesPeriodo.forEach((sessao) => {
    const atual = mapaSala.get(sessao.salaNome) ?? { value: 0, detalhes: new Set<string>() }
    atual.value += 1
    atual.detalhes?.add(sessao.professorNome)
    mapaSala.set(sessao.salaNome, atual)
  })

  const mapaAbertosProfessor = new Map<string, { value: number; detalhes?: Set<string> }>()
  const mapaAbertosSala = new Map<string, { value: number; detalhes?: Set<string> }>()
  const agora = Date.now()
  const abertosAgora: AtendimentoAbertoAgora[] = sessoesAbertas.map((sessao) => {
    const inicio = sessao.horaEntrada ? new Date(sessao.horaEntrada).getTime() : NaN
    const minutos = Number.isFinite(inicio) ? Math.max(1, Math.round((agora - inicio) / 60000)) : 0

    const porProfessor = mapaAbertosProfessor.get(sessao.professorNome) ?? { value: 0, detalhes: new Set<string>() }
    porProfessor.value += 1
    porProfessor.detalhes?.add(sessao.salaNome)
    mapaAbertosProfessor.set(sessao.professorNome, porProfessor)

    const porSala = mapaAbertosSala.get(sessao.salaNome) ?? { value: 0, detalhes: new Set<string>() }
    porSala.value += 1
    porSala.detalhes?.add(sessao.professorNome)
    mapaAbertosSala.set(sessao.salaNome, porSala)

    return {
      idSessao: sessao.idSessao,
      alunoNome: sessao.alunoNome,
      professorNome: sessao.professorNome,
      disciplinaNome: sessao.disciplinaNome,
      salaNome: sessao.salaNome,
      horaEntrada: sessao.horaEntrada,
      minutosEmAberto: minutos,
    }
  }).sort((a, b) => b.minutosEmAberto - a.minutosEmAberto)

  const mapaStatus = new Map<string, { value: number }>()
  registrosPeriodo.forEach((registro) => {
    const atual = mapaStatus.get(registro.status) ?? { value: 0 }
    atual.value += 1
    mapaStatus.set(registro.status, atual)
  })

  const notas = registrosPeriodo.map((registro) => registro.nota)
  const atividadesConcluidas = [...mapaStatus.entries()].reduce((acc, [status, item]) => {
    return status.toLowerCase().includes('conclu') ? acc + item.value : acc
  }, 0)

  const base: Omit<AnaliticoRelatoriosFichas, 'insights'> = {
    atualizadoEm: new Date().toISOString(),
    periodoDias,
    indicadores: {
      atendimentosPeriodo: sessoesPeriodo.length,
      alunosAtendidosPeriodo: alunosPeriodo.size,
      atendimentosAbertosAgora: sessoesAbertas.length,
      professoresEmAtendimentoAgora: professoresAbertos.size,
      salasOcupadasAgora: salasAbertas.size,
      mediaNotas: media(notas),
      duracaoMediaMinutos: mediaDuracaoMinutos(sessoesPeriodo),
      taxaConclusaoAtividades: percentual(atividadesConcluidas, registrosPeriodo.length),
    },
    porProfessor: rankear(mapaProfessor),
    porDisciplina: rankear(mapaDisciplina),
    porSala: rankear(mapaSala),
    abertosPorProfessor: rankear(mapaAbertosProfessor),
    abertosPorSala: rankear(mapaAbertosSala),
    tendenciaDiaria: gerarTendencia(sessoesPeriodo, periodoDias),
    statusAtividades: [...mapaStatus.entries()]
      .map(([label, item], index) => ({
        label,
        value: item.value,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value),
    atendimentosAbertosAgora: abertosAgora.slice(0, 24),
  }

  return {
    ...base,
    insights: montarInsights(base),
  }
}
