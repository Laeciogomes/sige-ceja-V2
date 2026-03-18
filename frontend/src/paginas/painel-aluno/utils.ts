import type { SupabaseClient } from '@supabase/supabase-js'

import { carregarFotoAlunoDataUrl, resolverFotoAlunoUrl } from '../painel-professor/ficha-acompanhamento/utils'

export type SupabaseLike = SupabaseClient | null

export type UsuarioAlunoPerfil = {
  id: string
  name: string
  email: string | null
  foto_url?: string | null
  data_nascimento?: string | null
  cpf?: string | null
  celular?: string | null
  bairro?: string | null
  municipio?: string | null
  status?: string | null
}

export type AlunoPerfil = {
  id_aluno: number
  user_id: string
  nis?: string | null
  nome_mae?: string | null
  nome_pai?: string | null
  possui_necessidade_especial?: boolean | null
  qual_necessidade_especial?: string | null
  possui_beneficio_governo?: boolean | null
  qual_beneficio_governo?: string | null
  observacoes_gerais?: string | null
  usuario: UsuarioAlunoPerfil
}

export type AlunoBuscaOption = {
  id_aluno: number
  nome: string
  email?: string | null
  foto_url?: string | null
  id_matricula?: number | null
  numero_inscricao?: string | null
  ano_letivo?: number | null
  data_matricula?: string | null
  id_nivel_ensino?: number | null
}

export type MatriculaResumo = {
  id_matricula: number
  numero_inscricao: string | null
  id_nivel_ensino: number | null
  nivel_nome: string | null
  id_status_matricula: number | null
  status_nome: string | null
  modalidade: string | null
  ano_letivo: number | null
  data_matricula: string | null
  data_conclusao: string | null
  id_turma: number | null
  turma_nome: string | null
  turma_codigo: string | null
  turma_turno: string | null
  turma_ano_letivo: number | null
  turma_ativa: boolean | null
}

export type ProgressoResumo = {
  id_progresso: number
  id_matricula: number
  id_disciplina: number | null
  disciplina_nome: string | null
  id_ano_escolar: number | null
  ano_nome: string | null
  id_status_disciplina: number | null
  status_nome: string | null
  nota_final: number | null
  data_conclusao: string | null
  observacoes: string | null
  numero_inscricao: string | null
  ano_letivo: number | null
  nivel_nome: string | null
  modalidade: string | null
  turma_nome: string | null
  protocolos_total: number
  protocolos_concluidos: number
  protocolos_avaliados: number
}

export type SessaoAlunoResumo = {
  id_sessao: number
  id_progresso: number | null
  hora_entrada: string
  hora_saida: string | null
  resumo_atividades: string | null
  sala_nome: string | null
  professor_nome: string | null
  disciplina_nome: string | null
}

export function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export function formatarDataBR(iso?: string | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export function formatarDataHoraBR(iso?: string | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function formatarNota(valor?: number | null): string {
  if (valor == null || Number.isNaN(valor)) return '-'
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 1,
    maximumFractionDigits: 1,
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

export function normalizarTexto(valor: string): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function extrairDigitos(input: string): string {
  return String(input ?? '').replace(/\D/g, '')
}

export function obterIniciais(nome: string): string {
  const partes = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  if (!partes.length) return 'A'
  return partes.map(parte => parte.charAt(0).toUpperCase()).join('')
}

export function isStatusMatriculaAtiva(statusNome?: string | null): boolean {
  const s = normalizarTexto(String(statusNome ?? ''))
  if (!s) return false
  if (s.includes('conclu') || s.includes('cancel') || s.includes('tranc') || s.includes('inativ')) return false
  return s.includes('ativ') || s.includes('curso') || s.includes('andamento') || s.includes('matric')
}

export function isStatusDisciplinaAberta(statusNome?: string | null): boolean {
  const s = normalizarTexto(String(statusNome ?? ''))
  if (!s) return false
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

export function corPorStatus(statusNome?: string | null): 'success' | 'warning' | 'error' | 'default' | 'info' {
  const s = normalizarTexto(String(statusNome ?? ''))
  if (!s) return 'default'
  if (s.includes('aprov') || s.includes('conclu') || s.includes('ativo') || s.includes('eleg')) return 'success'
  if (s.includes('reprov') || s.includes('cancel') || s.includes('tranc') || s.includes('inativ')) return 'error'
  if (s.includes('curso') || s.includes('andamento') || s.includes('fazer') || s.includes('pend')) return 'warning'
  return 'info'
}

export function calcularPercentualProgresso(concluidas: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((concluidas / total) * 100)))
}

export function formatarTempoDecorrido(dataIso?: string | null): string {
  if (!dataIso) return '-'
  const inicio = new Date(dataIso).getTime()
  if (Number.isNaN(inicio)) return '-'
  const diffMs = Math.max(0, Date.now() - inicio)
  const totalMin = Math.floor(diffMs / 60000)
  const horas = Math.floor(totalMin / 60)
  const minutos = totalMin % 60
  if (horas <= 0) return `${minutos} min`
  return `${horas}h ${String(minutos).padStart(2, '0')}min`
}

function preferirMatricula(lista: MatriculaResumo[]): MatriculaResumo | null {
  if (!lista.length) return null
  const ordenada = [...lista].sort((a, b) => {
    const pesoA = isStatusMatriculaAtiva(a.status_nome) ? 1 : 0
    const pesoB = isStatusMatriculaAtiva(b.status_nome) ? 1 : 0
    if (pesoA !== pesoB) return pesoB - pesoA
    const dataA = new Date(a.data_matricula ?? 0).getTime()
    const dataB = new Date(b.data_matricula ?? 0).getTime()
    if (dataA !== dataB) return dataB - dataA
    return b.id_matricula - a.id_matricula
  })
  return ordenada[0] ?? null
}

export async function resolverFotoAlunoPainel(
  supabase: SupabaseLike,
  idAluno?: number | null,
  fotoUrl?: string | null,
): Promise<string | undefined> {
  const dataUrl = await carregarFotoAlunoDataUrl(supabase, idAluno, fotoUrl)
  if (dataUrl) return dataUrl
  return await resolverFotoAlunoUrl(supabase, idAluno, fotoUrl)
}

export async function buscarAlunosParaPainel(
  supabase: SupabaseLike,
  termo: string,
): Promise<AlunoBuscaOption[]> {
  const api = supabase
  const query = String(termo ?? '').trim()
  if (!api || query.length < 2) return []

  const digitos = extrairDigitos(query)
  const like = `%${query}%`
  const alunosPorId = new Map<number, { id_aluno: number; user_id: string }>()
  const usuariosPorId = new Map<string, { id: string; name: string; email: string | null; foto_url: string | null }>()
  const matriculasPorAluno = new Map<number, MatriculaResumo[]>()

  const { data: usuariosPorNome } = await api
    .from('usuarios')
    .select('id, name, email, foto_url')
    .eq('id_tipo_usuario', 5)
    .ilike('name', like)
    .limit(12)

  const idsUsuario = ((usuariosPorNome ?? []) as Array<{ id: string; name: string; email?: string | null; foto_url?: string | null }>)
    .map(item => item.id)
    .filter(Boolean)

  if (idsUsuario.length) {
    const { data: alunosPorUsuarios } = await api
      .from('alunos')
      .select('id_aluno, user_id')
      .in('user_id', idsUsuario)

    for (const aluno of (alunosPorUsuarios ?? []) as Array<{ id_aluno: number; user_id: string }>) {
      alunosPorId.set(Number(aluno.id_aluno), {
        id_aluno: Number(aluno.id_aluno),
        user_id: String(aluno.user_id),
      })
    }

    for (const usuario of (usuariosPorNome ?? []) as Array<{ id: string; name: string; email?: string | null; foto_url?: string | null }>) {
      usuariosPorId.set(String(usuario.id), {
        id: String(usuario.id),
        name: String(usuario.name ?? 'Aluno'),
        email: usuario.email ?? null,
        foto_url: usuario.foto_url ?? null,
      })
    }
  }

  if (digitos.length >= 2) {
    const { data: matsPorRa } = await api
      .from('matriculas')
      .select('id_matricula, id_aluno, numero_inscricao, ano_letivo, data_matricula, id_nivel_ensino, modalidade, data_conclusao, id_status_matricula')
      .ilike('numero_inscricao', `%${digitos}%`)
      .limit(20)

    const alunoIdsDasMats = ((matsPorRa ?? []) as Array<{ id_aluno: number }>).map(item => Number(item.id_aluno))
    if (alunoIdsDasMats.length) {
      const { data: alunosDasMats } = await api
        .from('alunos')
        .select('id_aluno, user_id')
        .in('id_aluno', alunoIdsDasMats)

      const userIdsFaltantes = new Set<string>()
      for (const aluno of (alunosDasMats ?? []) as Array<{ id_aluno: number; user_id: string }>) {
        alunosPorId.set(Number(aluno.id_aluno), {
          id_aluno: Number(aluno.id_aluno),
          user_id: String(aluno.user_id),
        })
        userIdsFaltantes.add(String(aluno.user_id))
      }

      const userIdsNaoCarregados = [...userIdsFaltantes].filter(id => !usuariosPorId.has(id))
      if (userIdsNaoCarregados.length) {
        const { data: usuariosExtras } = await api
          .from('usuarios')
          .select('id, name, email, foto_url')
          .in('id', userIdsNaoCarregados)

        for (const usuario of (usuariosExtras ?? []) as Array<{ id: string; name: string; email?: string | null; foto_url?: string | null }>) {
          usuariosPorId.set(String(usuario.id), {
            id: String(usuario.id),
            name: String(usuario.name ?? 'Aluno'),
            email: usuario.email ?? null,
            foto_url: usuario.foto_url ?? null,
          })
        }
      }

      for (const mat of (matsPorRa ?? []) as Array<Record<string, unknown>>) {
        const alunoId = Number(mat.id_aluno)
        const lista = matriculasPorAluno.get(alunoId) ?? []
        lista.push({
          id_matricula: Number(mat.id_matricula),
          numero_inscricao: String(mat.numero_inscricao ?? ''),
          id_nivel_ensino: Number(mat.id_nivel_ensino ?? 0) || null,
          nivel_nome: null,
          id_status_matricula: Number(mat.id_status_matricula ?? 0) || null,
          status_nome: null,
          modalidade: String(mat.modalidade ?? ''),
          ano_letivo: Number(mat.ano_letivo ?? 0) || null,
          data_matricula: String(mat.data_matricula ?? ''),
          data_conclusao: (mat.data_conclusao as string | null) ?? null,
          id_turma: null,
          turma_nome: null,
          turma_codigo: null,
          turma_turno: null,
          turma_ano_letivo: null,
          turma_ativa: null,
        })
        matriculasPorAluno.set(alunoId, lista)
      }
    }
  }

  const idsAlunos = [...alunosPorId.keys()]
  if (!idsAlunos.length) return []

  const faltantesMatricula = idsAlunos.filter(id => !matriculasPorAluno.has(id))
  if (faltantesMatricula.length) {
    const { data: matsExtras } = await api
      .from('matriculas')
      .select('id_matricula, id_aluno, numero_inscricao, ano_letivo, data_matricula, id_nivel_ensino, modalidade, data_conclusao, id_status_matricula')
      .in('id_aluno', faltantesMatricula)
      .order('data_matricula', { ascending: false })

    for (const mat of (matsExtras ?? []) as Array<Record<string, unknown>>) {
      const alunoId = Number(mat.id_aluno)
      const lista = matriculasPorAluno.get(alunoId) ?? []
      lista.push({
        id_matricula: Number(mat.id_matricula),
        numero_inscricao: String(mat.numero_inscricao ?? ''),
        id_nivel_ensino: Number(mat.id_nivel_ensino ?? 0) || null,
        nivel_nome: null,
        id_status_matricula: Number(mat.id_status_matricula ?? 0) || null,
        status_nome: null,
        modalidade: String(mat.modalidade ?? ''),
        ano_letivo: Number(mat.ano_letivo ?? 0) || null,
        data_matricula: String(mat.data_matricula ?? ''),
        data_conclusao: (mat.data_conclusao as string | null) ?? null,
        id_turma: null,
        turma_nome: null,
        turma_codigo: null,
        turma_turno: null,
        turma_ano_letivo: null,
        turma_ativa: null,
      })
      matriculasPorAluno.set(alunoId, lista)
    }
  }

  const opcoes: AlunoBuscaOption[] = []
  for (const idAluno of idsAlunos) {
    const aluno = alunosPorId.get(idAluno)
    if (!aluno) continue
    const usuario = usuariosPorId.get(aluno.user_id)
    if (!usuario) continue
    const matricula = preferirMatricula(matriculasPorAluno.get(idAluno) ?? [])
    opcoes.push({
      id_aluno: idAluno,
      nome: usuario.name,
      email: usuario.email ?? null,
      foto_url: usuario.foto_url ?? null,
      id_matricula: matricula?.id_matricula ?? null,
      numero_inscricao: matricula?.numero_inscricao ?? null,
      ano_letivo: matricula?.ano_letivo ?? null,
      data_matricula: matricula?.data_matricula ?? null,
      id_nivel_ensino: matricula?.id_nivel_ensino ?? null,
    })
  }

  opcoes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  return opcoes.slice(0, 20)
}

export async function carregarPerfilAlunoPorUserId(
  supabase: SupabaseLike,
  userId: string,
): Promise<AlunoPerfil | null> {
  const api = supabase
  if (!api || !userId) return null

  const { data, error } = await api
    .from('alunos')
    .select(`
      id_aluno,
      user_id,
      nis,
      nome_mae,
      nome_pai,
      possui_necessidade_especial,
      qual_necessidade_especial,
      possui_beneficio_governo,
      qual_beneficio_governo,
      observacoes_gerais,
      usuarios!inner (
        id,
        name,
        email,
        foto_url,
        data_nascimento,
        cpf,
        celular,
        bairro,
        municipio,
        status
      )
    `)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return mapearPerfilAluno(data)
}

export async function carregarPerfilAlunoPorId(
  supabase: SupabaseLike,
  idAluno: number,
): Promise<AlunoPerfil | null> {
  const api = supabase
  if (!api || !idAluno) return null

  const { data, error } = await api
    .from('alunos')
    .select(`
      id_aluno,
      user_id,
      nis,
      nome_mae,
      nome_pai,
      possui_necessidade_especial,
      qual_necessidade_especial,
      possui_beneficio_governo,
      qual_beneficio_governo,
      observacoes_gerais,
      usuarios!inner (
        id,
        name,
        email,
        foto_url,
        data_nascimento,
        cpf,
        celular,
        bairro,
        municipio,
        status
      )
    `)
    .eq('id_aluno', idAluno)
    .maybeSingle()

  if (error || !data) return null
  return mapearPerfilAluno(data)
}

function mapearPerfilAluno(data: Record<string, unknown>): AlunoPerfil {
  const usuarioRaw = first(data.usuarios as Record<string, unknown> | Array<Record<string, unknown>> | null)
  const usuario: UsuarioAlunoPerfil = {
    id: String(usuarioRaw?.id ?? ''),
    name: String(usuarioRaw?.name ?? 'Aluno'),
    email: (usuarioRaw?.email as string | null) ?? null,
    foto_url: (usuarioRaw?.foto_url as string | null) ?? null,
    data_nascimento: (usuarioRaw?.data_nascimento as string | null) ?? null,
    cpf: (usuarioRaw?.cpf as string | null) ?? null,
    celular: (usuarioRaw?.celular as string | null) ?? null,
    bairro: (usuarioRaw?.bairro as string | null) ?? null,
    municipio: (usuarioRaw?.municipio as string | null) ?? null,
    status: (usuarioRaw?.status as string | null) ?? null,
  }

  return {
    id_aluno: Number(data.id_aluno),
    user_id: String(data.user_id ?? usuario.id),
    nis: (data.nis as string | null) ?? null,
    nome_mae: (data.nome_mae as string | null) ?? null,
    nome_pai: (data.nome_pai as string | null) ?? null,
    possui_necessidade_especial: (data.possui_necessidade_especial as boolean | null) ?? null,
    qual_necessidade_especial: (data.qual_necessidade_especial as string | null) ?? null,
    possui_beneficio_governo: (data.possui_beneficio_governo as boolean | null) ?? null,
    qual_beneficio_governo: (data.qual_beneficio_governo as string | null) ?? null,
    observacoes_gerais: (data.observacoes_gerais as string | null) ?? null,
    usuario,
  }
}

export async function carregarMatriculasAluno(
  supabase: SupabaseLike,
  idAluno: number,
): Promise<MatriculaResumo[]> {
  const api = supabase
  if (!api || !idAluno) return []

  const { data, error } = await api
    .from('matriculas')
    .select(`
      id_matricula,
      numero_inscricao,
      id_nivel_ensino,
      id_status_matricula,
      modalidade,
      ano_letivo,
      data_matricula,
      data_conclusao,
      id_turma,
      niveis_ensino ( nome ),
      status_matricula ( nome ),
      turmas ( id_turma, nome, codigo_turma, turno, ano_letivo, is_ativa )
    `)
    .eq('id_aluno', idAluno)
    .order('data_matricula', { ascending: false })

  if (error || !data) return []

  return (data as Array<Record<string, unknown>>).map(item => {
    const nivel = first(item.niveis_ensino as Record<string, unknown> | Array<Record<string, unknown>> | null)
    const status = first(item.status_matricula as Record<string, unknown> | Array<Record<string, unknown>> | null)
    const turma = first(item.turmas as Record<string, unknown> | Array<Record<string, unknown>> | null)
    return {
      id_matricula: Number(item.id_matricula),
      numero_inscricao: (item.numero_inscricao as string | null) ?? null,
      id_nivel_ensino: Number(item.id_nivel_ensino ?? 0) || null,
      nivel_nome: (nivel?.nome as string | null) ?? null,
      id_status_matricula: Number(item.id_status_matricula ?? 0) || null,
      status_nome: (status?.nome as string | null) ?? null,
      modalidade: (item.modalidade as string | null) ?? null,
      ano_letivo: Number(item.ano_letivo ?? 0) || null,
      data_matricula: (item.data_matricula as string | null) ?? null,
      data_conclusao: (item.data_conclusao as string | null) ?? null,
      id_turma: Number(item.id_turma ?? 0) || null,
      turma_nome: (turma?.nome as string | null) ?? null,
      turma_codigo: (turma?.codigo_turma as string | null) ?? null,
      turma_turno: (turma?.turno as string | null) ?? null,
      turma_ano_letivo: Number(turma?.ano_letivo ?? 0) || null,
      turma_ativa: (turma?.is_ativa as boolean | null) ?? null,
    }
  })
}

export async function carregarProgressosAluno(
  supabase: SupabaseLike,
  matriculas: MatriculaResumo[],
): Promise<ProgressoResumo[]> {
  const api = supabase
  const idsMatricula = matriculas.map(item => item.id_matricula)
  if (!api || !idsMatricula.length) return []

  const { data, error } = await api
    .from('progresso_aluno')
    .select(`
      id_progresso,
      id_matricula,
      id_disciplina,
      id_ano_escolar,
      id_status_disciplina,
      nota_final,
      data_conclusao,
      observacoes,
      disciplinas ( nome_disciplina ),
      anos_escolares ( nome_ano ),
      status_disciplina_aluno ( nome )
    `)
    .in('id_matricula', idsMatricula)
    .order('id_matricula', { ascending: false })
    .order('id_progresso', { ascending: false })

  if (error || !data) return []

  const progressoBase = (data as Array<Record<string, unknown>>).map(item => {
    const disciplina = first(item.disciplinas as Record<string, unknown> | Array<Record<string, unknown>> | null)
    const ano = first(item.anos_escolares as Record<string, unknown> | Array<Record<string, unknown>> | null)
    const status = first(item.status_disciplina_aluno as Record<string, unknown> | Array<Record<string, unknown>> | null)
    const matricula = matriculas.find(mat => mat.id_matricula === Number(item.id_matricula))
    return {
      id_progresso: Number(item.id_progresso),
      id_matricula: Number(item.id_matricula),
      id_disciplina: Number(item.id_disciplina ?? 0) || null,
      disciplina_nome: (disciplina?.nome_disciplina as string | null) ?? null,
      id_ano_escolar: Number(item.id_ano_escolar ?? 0) || null,
      ano_nome: (ano?.nome_ano as string | null) ?? null,
      id_status_disciplina: Number(item.id_status_disciplina ?? 0) || null,
      status_nome: (status?.nome as string | null) ?? null,
      nota_final: item.nota_final == null ? null : Number(item.nota_final),
      data_conclusao: (item.data_conclusao as string | null) ?? null,
      observacoes: (item.observacoes as string | null) ?? null,
      numero_inscricao: matricula?.numero_inscricao ?? null,
      ano_letivo: matricula?.ano_letivo ?? null,
      nivel_nome: matricula?.nivel_nome ?? null,
      modalidade: matricula?.modalidade ?? null,
      turma_nome: matricula?.turma_nome ?? null,
      protocolos_total: 0,
      protocolos_concluidos: 0,
      protocolos_avaliados: 0,
    }
  })

  const idsProgresso = progressoBase.map(item => item.id_progresso)
  if (!idsProgresso.length) return progressoBase

  const { data: atividades } = await api
    .from('registros_atendimento')
    .select('id_progresso, status, nota')
    .in('id_progresso', idsProgresso)

  const resumoAtividades = new Map<number, { total: number; concluidos: number; avaliados: number }>()
  for (const item of (atividades ?? []) as Array<{ id_progresso: number; status?: string | null; nota?: number | null }>) {
    const atual = resumoAtividades.get(Number(item.id_progresso)) ?? {
      total: 0,
      concluidos: 0,
      avaliados: 0,
    }
    atual.total += 1
    const status = normalizarTexto(String(item.status ?? ''))
    if (status.includes('conclu')) atual.concluidos += 1
    if (item.nota != null) atual.avaliados += 1
    resumoAtividades.set(Number(item.id_progresso), atual)
  }

  return progressoBase.map(item => {
    const resumo = resumoAtividades.get(item.id_progresso)
    return {
      ...item,
      protocolos_total: resumo?.total ?? 0,
      protocolos_concluidos: resumo?.concluidos ?? 0,
      protocolos_avaliados: resumo?.avaliados ?? 0,
    }
  })
}

export async function carregarSessoesAluno(
  supabase: SupabaseLike,
  idAluno: number,
  limit = 20,
): Promise<SessaoAlunoResumo[]> {
  const api = supabase
  if (!api || !idAluno) return []

  const { data, error } = await api
    .from('sessoes_atendimento')
    .select(`
      id_sessao,
      id_progresso,
      hora_entrada,
      hora_saida,
      resumo_atividades,
      salas_atendimento ( nome ),
      professores ( usuarios ( name ) ),
      progresso_aluno ( disciplinas ( nome_disciplina ) )
    `)
    .eq('id_aluno', idAluno)
    .order('hora_entrada', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as Array<Record<string, unknown>>).map(item => {
    const sala = first(item.salas_atendimento as Record<string, unknown> | Array<Record<string, unknown>> | null)
    const professor = first(item.professores as Record<string, unknown> | Array<Record<string, unknown>> | null)
    const professorUsuario = first(professor?.usuarios as Record<string, unknown> | Array<Record<string, unknown>> | null)
    const progresso = first(item.progresso_aluno as Record<string, unknown> | Array<Record<string, unknown>> | null)
    const disciplina = first(progresso?.disciplinas as Record<string, unknown> | Array<Record<string, unknown>> | null)
    return {
      id_sessao: Number(item.id_sessao),
      id_progresso: Number(item.id_progresso ?? 0) || null,
      hora_entrada: String(item.hora_entrada ?? ''),
      hora_saida: (item.hora_saida as string | null) ?? null,
      resumo_atividades: (item.resumo_atividades as string | null) ?? null,
      sala_nome: (sala?.nome as string | null) ?? null,
      professor_nome: (professorUsuario?.name as string | null) ?? null,
      disciplina_nome: (disciplina?.nome_disciplina as string | null) ?? null,
    }
  })
}
