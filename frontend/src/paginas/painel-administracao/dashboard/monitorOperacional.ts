import type { SupabaseClient } from '@supabase/supabase-js'

import type { PapelUsuario } from '../../../contextos/AuthContext'

export const PAPEIS_COM_MONITOR_AO_VIVO: PapelUsuario[] = [
  'ADMIN',
  'SECRETARIA',
  'COORDENACAO',
  'DIRETOR',
]

type RankingAccumulator = {
  label: string
  count: number
  alunos: Set<number | string>
  professores: Set<number | string>
  salas: Set<string>
  disciplinas: Set<string>
}

type SessaoAoVivoRow = {
  id: number
  idAluno: number | null
  idProfessor: number | null
  idSala: number | null
  alunoNome: string
  professorNome: string
  disciplinaNome: string
  salaNome: string
  horaEntrada: string
  duracaoMinutos: number
}

export type MonitorOperacionalSessao = {
  id: string
  alunoNome: string
  professorNome: string
  disciplinaNome: string
  salaNome: string
  entradaLabel: string
  duracaoLabel: string
  duracaoMinutos: number
}

export type MonitorOperacionalRankingItem = {
  label: string
  count: number
  detail: string
}

export type MonitorOperacionalData = {
  atualizadoEmIso: string
  atualizadoEmLabel: string
  totalAbertos: number
  totalAlunos: number
  salasOcupadas: number
  professoresAtivos: number
  disciplinasAtivas: number
  tempoMedioAbertoLabel: string
  maiorTempoAbertoLabel: string
  porSala: MonitorOperacionalRankingItem[]
  porDisciplina: MonitorOperacionalRankingItem[]
  porProfessor: MonitorOperacionalRankingItem[]
  sessoes: MonitorOperacionalSessao[]
  alertas: string[]
}

const first = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

const formatarHorario = (iso: string | null | undefined): string => {
  if (!iso) return 'Sem horário'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return 'Sem horário'

  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatarDuracao = (valorMinutos: number): string => {
  const total = Math.max(0, Math.round(valorMinutos || 0))
  const horas = Math.floor(total / 60)
  const minutos = total % 60

  if (!horas) return `${total} min`
  if (!minutos) return `${horas}h`
  return `${horas}h ${String(minutos).padStart(2, '0')}min`
}

const agoraIso = (): string => new Date().toISOString()

const normalizarNome = (valor: string | null | undefined, fallback: string): string => {
  const texto = String(valor ?? '').trim()
  return texto || fallback
}

const criarMapaRanking = (
  rows: SessaoAoVivoRow[],
  keyFn: (row: SessaoAoVivoRow) => string,
  labelFn: (row: SessaoAoVivoRow) => string,
): Map<string, RankingAccumulator> => {
  const mapa = new Map<string, RankingAccumulator>()

  rows.forEach(row => {
    const key = keyFn(row)
    const label = labelFn(row)

    const atual = mapa.get(key) ?? {
      label,
      count: 0,
      alunos: new Set<number | string>(),
      professores: new Set<number | string>(),
      salas: new Set<string>(),
      disciplinas: new Set<string>(),
    }

    atual.count += 1
    atual.alunos.add(row.idAluno ?? row.alunoNome)
    atual.professores.add(row.idProfessor ?? row.professorNome)
    atual.salas.add(row.salaNome)
    atual.disciplinas.add(row.disciplinaNome)

    mapa.set(key, atual)
  })

  return mapa
}

const mapToRanking = (
  mapa: Map<string, RankingAccumulator>,
  detailBuilder: (acc: RankingAccumulator) => string,
): MonitorOperacionalRankingItem[] =>
  Array.from(mapa.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.label.localeCompare(b.label, 'pt-BR')
    })
    .slice(0, 6)
    .map(item => ({
      label: item.label,
      count: item.count,
      detail: detailBuilder(item),
    }))

export const carregarMonitorOperacionalAoVivo = async (
  supabase: SupabaseClient,
): Promise<MonitorOperacionalData> => {
  const { data, error } = await supabase
    .from('sessoes_atendimento')
    .select(
      `
      id_sessao,
      id_aluno,
      id_professor,
      id_sala,
      hora_entrada,
      alunos (
        id_aluno,
        usuarios ( name )
      ),
      professores (
        id_professor,
        usuarios ( name )
      ),
      salas_atendimento (
        id_sala,
        nome,
        tipo_sala
      ),
      progresso_aluno (
        id_progresso,
        disciplinas ( nome_disciplina )
      )
    `,
    )
    .is('hora_saida', null)
    .order('hora_entrada', { ascending: true })
    .limit(300)

  if (error) throw error

  const agora = new Date()

  const sessoes: SessaoAoVivoRow[] = ((data ?? []) as any[]).map(row => {
    const aluno = first<any>(row?.alunos)
    const usuarioAluno = first<any>(aluno?.usuarios)
    const professor = first<any>(row?.professores)
    const usuarioProfessor = first<any>(professor?.usuarios)
    const sala = first<any>(row?.salas_atendimento)
    const progresso = first<any>(row?.progresso_aluno)
    const disciplina = first<any>(progresso?.disciplinas)

    const horaEntrada = String(row?.hora_entrada ?? '')
    const dataEntrada = new Date(horaEntrada)
    const duracaoMinutos = Number.isNaN(dataEntrada.getTime())
      ? 0
      : Math.max(0, Math.round((agora.getTime() - dataEntrada.getTime()) / 60000))

    return {
      id: Number(row?.id_sessao),
      idAluno: row?.id_aluno != null ? Number(row.id_aluno) : null,
      idProfessor: row?.id_professor != null ? Number(row.id_professor) : null,
      idSala: row?.id_sala != null ? Number(row.id_sala) : null,
      alunoNome: normalizarNome(usuarioAluno?.name, row?.id_aluno ? `Aluno #${String(row.id_aluno)}` : 'Aluno'),
      professorNome: normalizarNome(usuarioProfessor?.name, 'Professor não identificado'),
      disciplinaNome: normalizarNome(disciplina?.nome_disciplina, 'Sem disciplina'),
      salaNome: normalizarNome(sala?.nome, row?.id_sala ? `Sala #${String(row.id_sala)}` : 'Sem sala'),
      horaEntrada,
      duracaoMinutos,
    }
  })

  const totalAbertos = sessoes.length
  const totalAlunos = new Set(
    sessoes.map(sessao => sessao.idAluno ?? sessao.alunoNome),
  ).size
  const salasOcupadas = new Set(
    sessoes.map(sessao => sessao.idSala ?? sessao.salaNome),
  ).size
  const professoresAtivos = new Set(
    sessoes.map(sessao => sessao.idProfessor ?? sessao.professorNome),
  ).size
  const disciplinasAtivas = new Set(
    sessoes.map(sessao => sessao.disciplinaNome),
  ).size

  const duracoes = sessoes.map(sessao => sessao.duracaoMinutos)
  const maiorTempoAberto = duracoes.length ? Math.max(...duracoes) : 0
  const tempoMedioAberto = duracoes.length
    ? Math.round(duracoes.reduce((acc, valor) => acc + valor, 0) / duracoes.length)
    : 0

  const porSala = mapToRanking(
    criarMapaRanking(
      sessoes,
      sessao => `sala:${sessao.idSala ?? sessao.salaNome}`,
      sessao => sessao.salaNome,
    ),
    acc => `${acc.professores.size} professor(es) • ${acc.disciplinas.size} disciplina(s)`,
  )

  const porDisciplina = mapToRanking(
    criarMapaRanking(
      sessoes,
      sessao => `disc:${sessao.disciplinaNome}`,
      sessao => sessao.disciplinaNome,
    ),
    acc => `${acc.salas.size} sala(s) • ${acc.professores.size} professor(es)`,
  )

  const porProfessor = mapToRanking(
    criarMapaRanking(
      sessoes,
      sessao => `prof:${sessao.idProfessor ?? sessao.professorNome}`,
      sessao => sessao.professorNome,
    ),
    acc => `${acc.salas.size} sala(s) • ${acc.disciplinas.size} disciplina(s)`,
  )

  const alertas: string[] = []
  const salaMaisMovimentada = porSala[0]
  const professorMaisDemandado = porProfessor[0]
  const sessoesLongas = sessoes.filter(sessao => sessao.duracaoMinutos >= 120).length
  const sessoesSemDisciplina = sessoes.filter(
    sessao => sessao.disciplinaNome === 'Sem disciplina',
  ).length

  if (salaMaisMovimentada && salaMaisMovimentada.count >= 3) {
    alertas.push(
      `${salaMaisMovimentada.label} concentra ${salaMaisMovimentada.count} atendimentos abertos agora.`,
    )
  }

  if (professorMaisDemandado && professorMaisDemandado.count >= 4) {
    alertas.push(
      `${professorMaisDemandado.label} está com ${professorMaisDemandado.count} atendimentos simultâneos.`,
    )
  }

  if (sessoesLongas > 0) {
    alertas.push(
      `${sessoesLongas} atendimento(s) estão abertos há mais de 2 horas e merecem conferência.`,
    )
  }

  if (sessoesSemDisciplina > 0) {
    alertas.push(
      `${sessoesSemDisciplina} atendimento(s) estão sem disciplina vinculada.`,
    )
  }

  return {
    atualizadoEmIso: agoraIso(),
    atualizadoEmLabel: agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    totalAbertos,
    totalAlunos,
    salasOcupadas,
    professoresAtivos,
    disciplinasAtivas,
    tempoMedioAbertoLabel: formatarDuracao(tempoMedioAberto),
    maiorTempoAbertoLabel: formatarDuracao(maiorTempoAberto),
    porSala,
    porDisciplina,
    porProfessor,
    sessoes: sessoes.map(sessao => ({
      id: `sessao-live-${String(sessao.id)}`,
      alunoNome: sessao.alunoNome,
      professorNome: sessao.professorNome,
      disciplinaNome: sessao.disciplinaNome,
      salaNome: sessao.salaNome,
      entradaLabel: formatarHorario(sessao.horaEntrada),
      duracaoLabel: formatarDuracao(sessao.duracaoMinutos),
      duracaoMinutos: sessao.duracaoMinutos,
    })),
    alertas,
  }
}
