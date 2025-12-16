import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import FilterListIcon from '@mui/icons-material/FilterList'
import RefreshIcon from '@mui/icons-material/Autorenew'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DescriptionIcon from '@mui/icons-material/Description'

// Ajuste estes imports conforme a sua estrutura real
import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import { useAuth } from '../../contextos/AuthContext'

type SalaAtendimento = {
  id_sala: number
  nome: string
  tipo_sala: string
  is_ativa: boolean
}

type TipoProtocolo = {
  id_tipo_protocolo: number
  nome: string
}

type Disciplina = {
  id_disciplina: number
  nome_disciplina: string
}

type AnoEscolar = {
  id_ano_escolar: number
  nome_ano: string
  id_nivel_ensino: number
}

type ConfigDisciplinaAno = {
  id_config: number
  id_disciplina: number
  id_ano_escolar: number
  quantidade_protocolos: number
}

type StatusMatricula = {
  id_status_matricula: number
  nome: string
}

type StatusDisciplinaAluno = {
  id_status_disciplina: number
  nome: string
}

type AlunoOption = {
  id_aluno: number
  nome: string
  email?: string | null
}

type OpcaoDisciplinaAno = {
  id_disciplina: number
  id_ano_escolar: number
  quantidade_protocolos: number
  label: string
}

type SessaoView = {
  id_sessao: number
  id_aluno: number
  id_professor: number
  id_progresso: number | null
  id_sala: number | null
  hora_entrada: string
  hora_saida: string | null
  resumo_atividades: string | null

  aluno_nome?: string
  sala_nome?: string
  sala_tipo?: string

  disciplina_nome?: string
  ano_nome?: string

  id_disciplina?: number | null
  id_ano_escolar?: number | null
}

type RegistroView = {
  id_atividade: number
  id_sessao: number
  id_progresso: number
  numero_protocolo: number
  id_tipo_protocolo: number
  status: string
  nota: number | null
  is_adaptada: boolean
  sintese: string | null
  created_at: string
  updated_at: string
  tipo_nome?: string
}

function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function hojeISODateLocal(): string {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function agoraParaInputDateTimeLocal(): string {
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function formatarDataHoraBR(iso: string | null | undefined): string {
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

function statusChipProps(status: string): { label: string; color?: 'default' | 'success' | 'warning' | 'info' | 'error' } {
  const s = normalizarTexto(status)
  if (s.includes('conclu')) return { label: status, color: 'success' }
  if (s.includes('andamento')) return { label: status, color: 'info' }
  if (s.includes('fazer')) return { label: status, color: 'warning' }
  return { label: status, color: 'default' }
}

export default function ProfessorAtendimentosPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()

  const { supabase } = useSupabase()
  const { usuario } = useAuth()
  const { sucesso, aviso, erro, info } = useNotificacaoContext()

  const [carregandoBase, setCarregandoBase] = useState(true)
  const [carregandoSessoes, setCarregandoSessoes] = useState(false)
  const [carregandoRegistros, setCarregandoRegistros] = useState(false)

  const [idProfessor, setIdProfessor] = useState<number | null>(null)

  const [salas, setSalas] = useState<SalaAtendimento[]>([])
  const [tiposProtocolo, setTiposProtocolo] = useState<TipoProtocolo[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [configs, setConfigs] = useState<ConfigDisciplinaAno[]>([])
  const [statusMatriculas, setStatusMatriculas] = useState<StatusMatricula[]>([])
  const [statusDisciplinas, setStatusDisciplinas] = useState<StatusDisciplinaAluno[]>([])
  const [alunos, setAlunos] = useState<AlunoOption[]>([])

  const [filtroDataInicio, setFiltroDataInicio] = useState<string>(hojeISODateLocal())
  const [filtroDataFim, setFiltroDataFim] = useState<string>(hojeISODateLocal())
  const [filtroTexto, setFiltroTexto] = useState<string>('')
  const [filtroSalaId, setFiltroSalaId] = useState<number | 'todas'>('todas')

  const [sessoes, setSessoes] = useState<SessaoView[]>([])

  // Dialog: Nova sessão
  const [dlgNovaSessao, setDlgNovaSessao] = useState(false)
  const [novaSessaoAluno, setNovaSessaoAluno] = useState<AlunoOption | null>(null)
  const [novaSessaoSalaId, setNovaSessaoSalaId] = useState<string>('') // string
  const [novaSessaoDiscAno, setNovaSessaoDiscAno] = useState<OpcaoDisciplinaAno | null>(null)
  const [novaSessaoEntrada, setNovaSessaoEntrada] = useState<string>(agoraParaInputDateTimeLocal())
  const [novaSessaoResumo, setNovaSessaoResumo] = useState<string>('')
  const [salvandoNovaSessao, setSalvandoNovaSessao] = useState(false)

  // Dialog: Sessão
  const [dlgSessao, setDlgSessao] = useState(false)
  const [sessaoAtual, setSessaoAtual] = useState<SessaoView | null>(null)
  const [registros, setRegistros] = useState<RegistroView[]>([])
  const [salvandoSessao, setSalvandoSessao] = useState(false)

  // Dialog: Registro
  const [dlgRegistro, setDlgRegistro] = useState(false)
  const [registroEditandoId, setRegistroEditandoId] = useState<number | null>(null)
  const [regNumero, setRegNumero] = useState<string>('') // string
  const [regTipoId, setRegTipoId] = useState<string>('') // string
  const [regStatus, setRegStatus] = useState<string>('A fazer')
  const [regNota, setRegNota] = useState<string>('')
  const [regAdaptada, setRegAdaptada] = useState<boolean>(false)
  const [regSintese, setRegSintese] = useState<string>('')
  const [salvandoRegistro, setSalvandoRegistro] = useState(false)

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const mapaConfigPorDiscAno = useMemo(() => {
    const m = new Map<string, ConfigDisciplinaAno>()
    configs.forEach((c) => {
      m.set(`${c.id_disciplina}-${c.id_ano_escolar}`, c)
    })
    return m
  }, [configs])

  const opcoesDisciplinaAno: OpcaoDisciplinaAno[] = useMemo(() => {
    const lista: OpcaoDisciplinaAno[] = []
    for (const c of configs) {
      const disc = disciplinas.find((d) => d.id_disciplina === c.id_disciplina)
      const ano = anosEscolares.find((a) => a.id_ano_escolar === c.id_ano_escolar)
      const label = `${disc?.nome_disciplina ?? 'Disciplina'} — ${ano?.nome_ano ?? 'Ano'} (protocolos: ${c.quantidade_protocolos})`
      lista.push({
        id_disciplina: c.id_disciplina,
        id_ano_escolar: c.id_ano_escolar,
        quantidade_protocolos: c.quantidade_protocolos,
        label,
      })
    }
    return lista.sort((a, b) => a.label.localeCompare(b.label))
  }, [configs, disciplinas, anosEscolares])

  const sessoesFiltradas = useMemo(() => {
    const q = normalizarTexto(filtroTexto)
    return sessoes.filter((s) => {
      const matchTexto =
        q === '' ||
        normalizarTexto(s.aluno_nome ?? '').includes(q) ||
        normalizarTexto(s.disciplina_nome ?? '').includes(q) ||
        normalizarTexto(s.ano_nome ?? '').includes(q) ||
        normalizarTexto(s.sala_nome ?? '').includes(q)

      const matchSala = filtroSalaId === 'todas' || s.id_sala === filtroSalaId
      return matchTexto && matchSala
    })
  }, [sessoes, filtroTexto, filtroSalaId])

  const abrirFicha = useCallback(
    (s: SessaoView | null) => {
      if (!s?.id_progresso) {
        aviso('Esta sessão não possui ficha/progresso vinculado (id_progresso).')
        return
      }
      navigate(`/fichas/${s.id_progresso}`)
    },
    [navigate, aviso]
  )

  const carregarBase = useCallback(async () => {
    if (!supabase) return
    if (!usuario?.id) return

    setCarregandoBase(true)
    try {
      const { data: prof, error: errProf } = await supabase
        .from('professores')
        .select('id_professor')
        .eq('user_id', usuario.id)
        .maybeSingle()

      if (errProf) {
        console.error(errProf)
        erro('Erro ao localizar seu cadastro de professor.')
        return
      }
      if (!prof?.id_professor) {
        erro('Seu usuário não está vinculado a um Professor. Peça à Secretaria/Admin para vincular.')
        return
      }
      setIdProfessor(Number(prof.id_professor))

      const [salasRes, tiposRes, discRes, anosRes, configRes, statusMatRes, statusDiscRes, alunosRes] =
        await Promise.all([
          supabase.from('salas_atendimento').select('id_sala,nome,tipo_sala,is_ativa').eq('is_ativa', true).order('nome'),
          supabase.from('tipos_protocolo').select('id_tipo_protocolo,nome').order('nome'),
          supabase.from('disciplinas').select('id_disciplina,nome_disciplina').order('nome_disciplina'),
          supabase.from('anos_escolares').select('id_ano_escolar,nome_ano,id_nivel_ensino').order('nome_ano'),
          supabase.from('config_disciplina_ano').select('id_config,id_disciplina,id_ano_escolar,quantidade_protocolos'),
          supabase.from('status_matricula').select('id_status_matricula,nome').order('id_status_matricula'),
          supabase.from('status_disciplina_aluno').select('id_status_disciplina,nome').order('id_status_disciplina'),
          supabase.from('alunos').select('id_aluno,user_id,usuarios(name,email)').order('id_aluno', { ascending: true }),
        ])

      if (salasRes.error) throw salasRes.error
      if (tiposRes.error) throw tiposRes.error
      if (discRes.error) throw discRes.error
      if (anosRes.error) throw anosRes.error
      if (configRes.error) throw configRes.error
      if (statusMatRes.error) throw statusMatRes.error
      if (statusDiscRes.error) throw statusDiscRes.error
      if (alunosRes.error) throw alunosRes.error

      setSalas((salasRes.data ?? []) as SalaAtendimento[])
      setTiposProtocolo((tiposRes.data ?? []) as TipoProtocolo[])
      setDisciplinas((discRes.data ?? []) as Disciplina[])
      setAnosEscolares((anosRes.data ?? []) as AnoEscolar[])
      setConfigs((configRes.data ?? []) as ConfigDisciplinaAno[])
      setStatusMatriculas((statusMatRes.data ?? []) as StatusMatricula[])
      setStatusDisciplinas((statusDiscRes.data ?? []) as StatusDisciplinaAluno[])

      const alunosFormatados: AlunoOption[] = (alunosRes.data ?? []).map((a: any) => {
        const u = first(a?.usuarios) as any
        return {
          id_aluno: Number(a.id_aluno),
          nome: u?.name ?? `Aluno #${a.id_aluno}`,
          email: u?.email ?? null,
        }
      })
      setAlunos(alunosFormatados)

      if (alunosFormatados.length === 0) {
        info('Nenhum aluno encontrado. Cadastre/importe alunos e matrículas pela Secretaria.')
      }
    } catch (e: any) {
      console.error(e)
      erro('Falha ao carregar dados-base da página de atendimentos.')
    } finally {
      if (mountedRef.current) setCarregandoBase(false)
    }
  }, [supabase, usuario?.id, erro, info])

  const carregarSessoes = useCallback(
    async (professorId: number, dataInicio: string, dataFim: string) => {
      if (!supabase) return

      setCarregandoSessoes(true)
      try {
        const dtIni = new Date(`${dataInicio}T00:00:00`)
        const dtFim = new Date(`${dataFim}T23:59:59`)

        const { data, error: err } = await supabase
          .from('sessoes_atendimento')
          .select(
            `
            id_sessao,
            id_aluno,
            id_professor,
            id_progresso,
            id_sala,
            hora_entrada,
            hora_saida,
            resumo_atividades,
            alunos (
              id_aluno,
              usuarios ( name )
            ),
            salas_atendimento (
              id_sala,
              nome,
              tipo_sala
            ),
            progresso_aluno (
              id_progresso,
              id_disciplina,
              id_ano_escolar,
              disciplinas ( nome_disciplina ),
              anos_escolares ( nome_ano )
            )
          `
          )
          .eq('id_professor', professorId)
          .gte('hora_entrada', dtIni.toISOString())
          .lte('hora_entrada', dtFim.toISOString())
          .order('hora_entrada', { ascending: false })

        if (err) throw err

        const lista: SessaoView[] = (data ?? []).map((s: any) => {
          const aluno = first(s?.alunos) as any
          const alunoUser = first(aluno?.usuarios) as any
          const sala = first(s?.salas_atendimento) as any
          const prog = first(s?.progresso_aluno) as any
          const disc = first(prog?.disciplinas) as any
          const ano = first(prog?.anos_escolares) as any

          return {
            id_sessao: Number(s.id_sessao),
            id_aluno: Number(s.id_aluno),
            id_professor: Number(s.id_professor),
            id_progresso: s.id_progresso != null ? Number(s.id_progresso) : null,
            id_sala: s.id_sala != null ? Number(s.id_sala) : null,
            hora_entrada: String(s.hora_entrada),
            hora_saida: s.hora_saida ? String(s.hora_saida) : null,
            resumo_atividades: s.resumo_atividades ?? null,

            aluno_nome: alunoUser?.name ?? `Aluno #${s.id_aluno}`,
            sala_nome: sala?.nome ?? (s.id_sala ? `Sala #${s.id_sala}` : '-'),
            sala_tipo: sala?.tipo_sala ?? '-',

            disciplina_nome: disc?.nome_disciplina ?? '-',
            ano_nome: ano?.nome_ano ?? '-',

            id_disciplina: prog?.id_disciplina != null ? Number(prog.id_disciplina) : null,
            id_ano_escolar: prog?.id_ano_escolar != null ? Number(prog.id_ano_escolar) : null,
          }
        })

        setSessoes(lista)
      } catch (e: any) {
        console.error(e)
        erro('Erro ao carregar sessões de atendimento.')
      } finally {
        if (mountedRef.current) setCarregandoSessoes(false)
      }
    },
    [supabase, erro]
  )

  const carregarRegistrosDaSessao = useCallback(
    async (sessaoId: number) => {
      if (!supabase) return

      setCarregandoRegistros(true)
      try {
        const { data, error: err } = await supabase
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
            tipos_protocolo ( nome )
          `
          )
          .eq('id_sessao', sessaoId)
          .order('numero_protocolo', { ascending: true })
          .order('created_at', { ascending: true })

        if (err) throw err

        const lista: RegistroView[] = (data ?? []).map((r: any) => {
          const tp = first(r?.tipos_protocolo) as any
          return {
            id_atividade: Number(r.id_atividade),
            id_sessao: Number(r.id_sessao),
            id_progresso: Number(r.id_progresso),
            numero_protocolo: Number(r.numero_protocolo),
            id_tipo_protocolo: Number(r.id_tipo_protocolo),
            status: String(r.status),
            nota: r.nota != null ? Number(r.nota) : null,
            is_adaptada: Boolean(r.is_adaptada),
            sintese: r.sintese ?? null,
            created_at: String(r.created_at),
            updated_at: String(r.updated_at),
            tipo_nome: tp?.nome ?? '-',
          }
        })

        setRegistros(lista)
      } catch (e: any) {
        console.error(e)
        erro('Erro ao carregar protocolos desta sessão.')
      } finally {
        if (mountedRef.current) setCarregandoRegistros(false)
      }
    },
    [supabase, erro]
  )

  const obterIdStatusMatriculaAtiva = useCallback((): number | null => {
    const ativa = statusMatriculas.find((s) => normalizarTexto(s.nome).includes('ativa'))
    return ativa ? Number(ativa.id_status_matricula) : null
  }, [statusMatriculas])

  const obterIdStatusDisciplinaDefault = useCallback((): number | null => {
    const cursando = statusDisciplinas.find((s) => normalizarTexto(s.nome).includes('cursando'))
    if (cursando) return Number(cursando.id_status_disciplina)

    const aCursar = statusDisciplinas.find((s) => normalizarTexto(s.nome).includes('a cursar'))
    if (aCursar) return Number(aCursar.id_status_disciplina)

    return statusDisciplinas[0]?.id_status_disciplina
      ? Number(statusDisciplinas[0].id_status_disciplina)
      : null
  }, [statusDisciplinas])

  const obterMatriculaPreferencial = useCallback(
    async (alunoId: number): Promise<number | null> => {
      if (!supabase) return null

      const ativaId = obterIdStatusMatriculaAtiva()
      const { data, error: err } = await supabase
        .from('matriculas')
        .select('id_matricula,id_status_matricula,ano_letivo,data_matricula')
        .eq('id_aluno', alunoId)
        .order('ano_letivo', { ascending: false })
        .order('data_matricula', { ascending: false })

      if (err) throw err

      const lista = (data ?? []).map((m: any) => ({
        id_matricula: Number(m.id_matricula),
        id_status_matricula: Number(m.id_status_matricula),
      }))

      if (lista.length === 0) return null

      if (ativaId != null) {
        const ativa = lista.find((m) => m.id_status_matricula === ativaId)
        if (ativa) return ativa.id_matricula
      }

      return lista[0].id_matricula
    },
    [supabase, obterIdStatusMatriculaAtiva]
  )

  const garantirProgresso = useCallback(
    async (idMatricula: number, idDisciplina: number, idAnoEscolar: number): Promise<number> => {
      if (!supabase) throw new Error('Supabase indisponível.')

      const { data: existente, error: errSel } = await supabase
        .from('progresso_aluno')
        .select('id_progresso')
        .eq('id_matricula', idMatricula)
        .eq('id_disciplina', idDisciplina)
        .eq('id_ano_escolar', idAnoEscolar)
        .maybeSingle()

      if (errSel) throw errSel
      if (existente?.id_progresso) return Number(existente.id_progresso)

      const statusDefaultId = obterIdStatusDisciplinaDefault()
      if (!statusDefaultId) {
        throw new Error('Tabela status_disciplina_aluno não possui valores para status inicial.')
      }

      const { data: criado, error: errIns } = await supabase
        .from('progresso_aluno')
        .insert({
          id_matricula: idMatricula,
          id_disciplina: idDisciplina,
          id_ano_escolar: idAnoEscolar,
          id_status_disciplina: statusDefaultId,
        })
        .select('id_progresso')
        .single()

      if (errIns) throw errIns
      if (!criado?.id_progresso) throw new Error('Falha ao criar progresso (sem id_progresso).')

      return Number(criado.id_progresso)
    },
    [supabase, obterIdStatusDisciplinaDefault]
  )

  const abrirDialogNovaSessao = useCallback(() => {
    setNovaSessaoAluno(null)
    setNovaSessaoSalaId('')
    setNovaSessaoDiscAno(null)
    setNovaSessaoEntrada(agoraParaInputDateTimeLocal())
    setNovaSessaoResumo('')
    setDlgNovaSessao(true)
  }, [])

  const criarSessao = useCallback(async () => {
    if (!supabase) return
    if (!usuario?.id) return

    if (!idProfessor) {
      erro('Professor não identificado. Recarregue a página ou verifique seu vínculo.')
      return
    }
    if (!novaSessaoAluno?.id_aluno) {
      aviso('Selecione o aluno.')
      return
    }
    if (!novaSessaoSalaId) {
      aviso('Selecione a sala.')
      return
    }
    if (!novaSessaoDiscAno) {
      aviso('Selecione disciplina/ano.')
      return
    }
    if (!novaSessaoEntrada?.trim()) {
      aviso('Informe a hora de entrada.')
      return
    }

    setSalvandoNovaSessao(true)
    try {
      const idMatricula = await obterMatriculaPreferencial(novaSessaoAluno.id_aluno)
      if (!idMatricula) {
        aviso('Este aluno não possui matrícula cadastrada. A Secretaria deve cadastrar a matrícula primeiro.')
        return
      }

      const idProgresso = await garantirProgresso(idMatricula, novaSessaoDiscAno.id_disciplina, novaSessaoDiscAno.id_ano_escolar)
      const horaEntradaISO = new Date(novaSessaoEntrada).toISOString()

      const { data: nova, error: errIns } = await supabase
        .from('sessoes_atendimento')
        .insert({
          id_aluno: novaSessaoAluno.id_aluno,
          id_professor: idProfessor,
          id_sala: Number(novaSessaoSalaId),
          id_progresso: idProgresso,
          hora_entrada: horaEntradaISO,
          resumo_atividades: novaSessaoResumo.trim() ? novaSessaoResumo.trim() : null,
        })
        .select(
          `
          id_sessao,
          id_aluno,
          id_professor,
          id_progresso,
          id_sala,
          hora_entrada,
          hora_saida,
          resumo_atividades,
          alunos ( usuarios ( name ) ),
          salas_atendimento ( nome, tipo_sala ),
          progresso_aluno (
            id_disciplina,
            id_ano_escolar,
            disciplinas ( nome_disciplina ),
            anos_escolares ( nome_ano )
          )
        `
        )
        .single()

      if (errIns) throw errIns

      sucesso('Sessão criada. Agora lance os protocolos desta sessão.')
      setDlgNovaSessao(false)

      await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)

      const aluno = first(nova?.alunos) as any
      const alunoUser = first(aluno?.usuarios) as any
      const sala = first(nova?.salas_atendimento) as any
      const prog = first(nova?.progresso_aluno) as any
      const disc = first(prog?.disciplinas) as any
      const ano = first(prog?.anos_escolares) as any

      const sessaoMontada: SessaoView = {
        id_sessao: Number(nova.id_sessao),
        id_aluno: Number(nova.id_aluno),
        id_professor: Number(nova.id_professor),
        id_progresso: nova.id_progresso != null ? Number(nova.id_progresso) : null,
        id_sala: nova.id_sala != null ? Number(nova.id_sala) : null,
        hora_entrada: String(nova.hora_entrada),
        hora_saida: nova.hora_saida ? String(nova.hora_saida) : null,
        resumo_atividades: nova.resumo_atividades ?? null,
        aluno_nome: alunoUser?.name ?? novaSessaoAluno.nome,
        sala_nome: sala?.nome ?? '-',
        sala_tipo: sala?.tipo_sala ?? '-',
        disciplina_nome: disc?.nome_disciplina ?? '-',
        ano_nome: ano?.nome_ano ?? '-',
        id_disciplina: prog?.id_disciplina != null ? Number(prog.id_disciplina) : null,
        id_ano_escolar: prog?.id_ano_escolar != null ? Number(prog.id_ano_escolar) : null,
      }

      setSessaoAtual(sessaoMontada)
      setDlgSessao(true)
      await carregarRegistrosDaSessao(sessaoMontada.id_sessao)
    } catch (e: any) {
      console.error(e)
      erro(`Falha ao criar sessão: ${e?.message || 'erro desconhecido'}`)
    } finally {
      if (mountedRef.current) setSalvandoNovaSessao(false)
    }
  }, [
    supabase,
    usuario?.id,
    idProfessor,
    novaSessaoAluno,
    novaSessaoSalaId,
    novaSessaoDiscAno,
    novaSessaoEntrada,
    novaSessaoResumo,
    obterMatriculaPreferencial,
    garantirProgresso,
    carregarSessoes,
    filtroDataInicio,
    filtroDataFim,
    carregarRegistrosDaSessao,
    sucesso,
    aviso,
    erro,
  ])

  const abrirSessao = useCallback(
    async (s: SessaoView) => {
      setSessaoAtual(s)
      setDlgSessao(true)
      await carregarRegistrosDaSessao(s.id_sessao)
    },
    [carregarRegistrosDaSessao]
  )

  const fecharSessaoDialog = useCallback(() => {
    setDlgSessao(false)
    setSessaoAtual(null)
    setRegistros([])
  }, [])

  const aplicarFiltros = useCallback(async () => {
    if (!idProfessor) {
      aviso('Professor não identificado.')
      return
    }
    await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
  }, [idProfessor, filtroDataInicio, filtroDataFim, carregarSessoes, aviso])

  const resetarParaHoje = useCallback(async () => {
    const hoje = hojeISODateLocal()
    setFiltroDataInicio(hoje)
    setFiltroDataFim(hoje)
    setFiltroTexto('')
    setFiltroSalaId('todas')
    if (idProfessor) {
      await carregarSessoes(idProfessor, hoje, hoje)
    }
  }, [idProfessor, carregarSessoes])

  const encerrarSessaoAgora = useCallback(async () => {
    if (!supabase) return
    if (!sessaoAtual) return

    if (sessaoAtual.hora_saida) {
      info('Esta sessão já está encerrada.')
      return
    }

    setSalvandoSessao(true)
    try {
      const agora = new Date().toISOString()
      const { error: errUp } = await supabase
        .from('sessoes_atendimento')
        .update({
          hora_saida: agora,
          resumo_atividades: sessaoAtual.resumo_atividades?.trim() ? sessaoAtual.resumo_atividades.trim() : null,
        })
        .eq('id_sessao', sessaoAtual.id_sessao)

      if (errUp) throw errUp

      sucesso('Sessão encerrada com sucesso.')
      const atualizada: SessaoView = { ...sessaoAtual, hora_saida: agora }
      setSessaoAtual(atualizada)

      if (idProfessor) await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
    } catch (e: any) {
      console.error(e)
      erro('Falha ao encerrar a sessão.')
    } finally {
      if (mountedRef.current) setSalvandoSessao(false)
    }
  }, [supabase, sessaoAtual, sucesso, erro, info, idProfessor, carregarSessoes, filtroDataInicio, filtroDataFim])

  const salvarResumoSessao = useCallback(async () => {
    if (!supabase) return
    if (!sessaoAtual) return

    setSalvandoSessao(true)
    try {
      const { error: errUp } = await supabase
        .from('sessoes_atendimento')
        .update({
          resumo_atividades: sessaoAtual.resumo_atividades?.trim() ? sessaoAtual.resumo_atividades.trim() : null,
        })
        .eq('id_sessao', sessaoAtual.id_sessao)

      if (errUp) throw errUp

      sucesso('Resumo da sessão salvo.')
      if (idProfessor) await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
    } catch (e: any) {
      console.error(e)
      erro('Falha ao salvar o resumo da sessão.')
    } finally {
      if (mountedRef.current) setSalvandoSessao(false)
    }
  }, [supabase, sessaoAtual, sucesso, erro, idProfessor, carregarSessoes, filtroDataInicio, filtroDataFim])

  const abrirDialogNovoRegistro = useCallback(() => {
    if (!sessaoAtual) return

    const usados = new Set(registros.map((r) => r.numero_protocolo))
    let sugestao = 1

    const idDisc = sessaoAtual.id_disciplina ?? null
    const idAno = sessaoAtual.id_ano_escolar ?? null
    const config = idDisc && idAno ? mapaConfigPorDiscAno.get(`${idDisc}-${idAno}`) : undefined

    const limite = config?.quantidade_protocolos ?? 50
    while (usados.has(sugestao) && sugestao <= limite) sugestao += 1

    setRegistroEditandoId(null)
    setRegNumero(sugestao <= limite ? String(sugestao) : '')
    setRegTipoId('')
    setRegStatus('A fazer')
    setRegNota('')
    setRegAdaptada(false)
    setRegSintese('')
    setDlgRegistro(true)
  }, [sessaoAtual, registros, mapaConfigPorDiscAno])

  const abrirEdicaoRegistro = useCallback((r: RegistroView) => {
    setRegistroEditandoId(r.id_atividade)
    setRegNumero(String(r.numero_protocolo))
    setRegTipoId(String(r.id_tipo_protocolo))
    setRegStatus(r.status)
    setRegNota(r.nota != null ? String(r.nota) : '')
    setRegAdaptada(Boolean(r.is_adaptada))
    setRegSintese(r.sintese ?? '')
    setDlgRegistro(true)
  }, [])

  const fecharDialogRegistro = useCallback(() => {
    setDlgRegistro(false)
    setRegistroEditandoId(null)
    setConfirmDeleteId(null)
  }, [])

  const validarRegistro = useCallback((): { ok: boolean; msg?: string } => {
    if (!sessaoAtual) return { ok: false, msg: 'Sessão não selecionada.' }
    if (!sessaoAtual.id_progresso) return { ok: false, msg: 'Sessão sem progresso vinculado.' }
    if (!regNumero) return { ok: false, msg: 'Selecione o número do protocolo.' }
    if (!regTipoId) return { ok: false, msg: 'Selecione o tipo de protocolo.' }
    if (!regStatus.trim()) return { ok: false, msg: 'Selecione o status.' }

    const numero = Number(regNumero)
    if (Number.isNaN(numero) || numero < 1) return { ok: false, msg: 'Número de protocolo inválido.' }

    const idDisc = sessaoAtual.id_disciplina ?? null
    const idAno = sessaoAtual.id_ano_escolar ?? null
    const config = idDisc && idAno ? mapaConfigPorDiscAno.get(`${idDisc}-${idAno}`) : undefined
    const limite = config?.quantidade_protocolos ?? null

    if (limite != null && (numero < 1 || numero > limite)) {
      return { ok: false, msg: `Número de protocolo inválido. Permitido: 1 a ${limite}.` }
    }

    const jaUsado = registros.some((x) => x.numero_protocolo === numero && x.id_atividade !== registroEditandoId)
    if (jaUsado) return { ok: false, msg: 'Já existe um registro com este número de protocolo na sessão.' }

    return { ok: true }
  }, [sessaoAtual, regNumero, regTipoId, regStatus, mapaConfigPorDiscAno, registros, registroEditandoId])

  const salvarRegistro = useCallback(async () => {
    if (!supabase) return
    if (!sessaoAtual) return

    const v = validarRegistro()
    if (!v.ok) {
      aviso(v.msg || 'Validação falhou.')
      return
    }

    const numero = Number(regNumero)
    const tipoId = Number(regTipoId)

    const notaNum = regNota.trim() === '' ? null : Number(regNota)
    if (regNota.trim() !== '' && Number.isNaN(notaNum)) {
      aviso('Nota inválida (use número).')
      return
    }

    setSalvandoRegistro(true)
    try {
      if (!sessaoAtual.id_progresso) throw new Error('Sessão sem id_progresso.')

      if (registroEditandoId) {
        const { error: errUp } = await supabase
          .from('registros_atendimento')
          .update({
            numero_protocolo: numero,
            id_tipo_protocolo: tipoId,
            status: regStatus,
            nota: notaNum,
            is_adaptada: regAdaptada,
            sintese: regSintese.trim() ? regSintese.trim() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id_atividade', registroEditandoId)

        if (errUp) throw errUp
        sucesso('Protocolo atualizado.')
      } else {
        const { error: errIns } = await supabase.from('registros_atendimento').insert({
          id_sessao: sessaoAtual.id_sessao,
          id_progresso: sessaoAtual.id_progresso,
          numero_protocolo: numero,
          id_tipo_protocolo: tipoId,
          status: regStatus,
          nota: notaNum,
          is_adaptada: regAdaptada,
          sintese: regSintese.trim() ? regSintese.trim() : null,
        })

        if (errIns) throw errIns
        sucesso('Protocolo lançado.')
      }

      setDlgRegistro(false)
      await carregarRegistrosDaSessao(sessaoAtual.id_sessao)
    } catch (e: any) {
      console.error(e)
      erro('Falha ao salvar protocolo.')
    } finally {
      if (mountedRef.current) setSalvandoRegistro(false)
    }
  }, [
    supabase,
    sessaoAtual,
    validarRegistro,
    aviso,
    sucesso,
    erro,
    regNumero,
    regTipoId,
    regStatus,
    regNota,
    regAdaptada,
    regSintese,
    registroEditandoId,
    carregarRegistrosDaSessao,
  ])

  const cancelarExcluirRegistro = useCallback(() => {
    setConfirmDeleteId(null)
  }, [])

  const confirmarExcluirRegistro = useCallback(async () => {
    if (!supabase) return
    if (!sessaoAtual) return
    if (!confirmDeleteId) return

    setSalvandoRegistro(true)
    try {
      const { error: errDel } = await supabase.from('registros_atendimento').delete().eq('id_atividade', confirmDeleteId)
      if (errDel) throw errDel

      sucesso('Registro excluído.')
      setConfirmDeleteId(null)
      await carregarRegistrosDaSessao(sessaoAtual.id_sessao)
    } catch (e: any) {
      console.error(e)
      erro('Falha ao excluir registro.')
    } finally {
      if (mountedRef.current) setSalvandoRegistro(false)
    }
  }, [supabase, sessaoAtual, confirmDeleteId, sucesso, erro, carregarRegistrosDaSessao])

  useEffect(() => {
    void (async () => {
      await carregarBase()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, supabase])

  useEffect(() => {
    if (!carregandoBase && idProfessor) {
      void carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregandoBase, idProfessor])

  const limiteProtocolosSessao = useMemo(() => {
    if (!sessaoAtual) return null
    const idDisc = sessaoAtual.id_disciplina ?? null
    const idAno = sessaoAtual.id_ano_escolar ?? null
    if (!idDisc || !idAno) return null
    const cfg = mapaConfigPorDiscAno.get(`${idDisc}-${idAno}`)
    return cfg?.quantidade_protocolos ?? null
  }, [sessaoAtual, mapaConfigPorDiscAno])

  return (
    <Box sx={{ p: 2, maxWidth: 1400, mx: 'auto' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            Atendimentos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sessões de atendimento e lançamento de protocolos (professor).
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={abrirDialogNovaSessao}
            disabled={carregandoBase || !idProfessor}
          >
            Novo atendimento
          </Button>

          <Tooltip title="Recarregar">
            <span>
              <IconButton
                onClick={async () => {
                  if (!idProfessor) return
                  await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
                }}
                disabled={carregandoBase || !idProfessor}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35),
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterListIcon fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Filtros
            </Typography>
          </Stack>

          <TextField
            size="small"
            label="Data início"
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 200 } }}
          />
          <TextField
            size="small"
            label="Data fim"
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 200 } }}
          />

          <FormControl size="small" sx={{ width: { xs: '100%', sm: 240 } }}>
            <InputLabel id="filtro-sala-label">Sala</InputLabel>
            <Select
              labelId="filtro-sala-label"
              label="Sala"
              value={filtroSalaId}
              onChange={(e) => {
                const v = String(e.target.value)
                setFiltroSalaId(v === 'todas' ? 'todas' : Number(v))
              }}
            >
              <MenuItem value="todas">
                <em>Todas</em>
              </MenuItem>
              {salas.map((s) => (
                <MenuItem key={s.id_sala} value={String(s.id_sala)}>
                  {s.nome} ({s.tipo_sala})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Buscar (aluno, disciplina, sala...)"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            sx={{ flex: 1, minWidth: { xs: '100%', md: 320 } }}
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Button variant="outlined" onClick={resetarParaHoje} startIcon={<WarningAmberIcon />}>
              Hoje
            </Button>
            <Button variant="contained" onClick={aplicarFiltros} startIcon={<CheckCircleIcon />} disabled={!idProfessor}>
              Aplicar
            </Button>
          </Stack>
        </Stack>

        {carregandoSessoes && <LinearProgress sx={{ mt: 2 }} />}

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
            Sessões encontradas: {sessoesFiltradas.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Clique em “Abrir Sessão” para lançar/editar protocolos ou em “Abrir Ficha”.
          </Typography>
        </Stack>

        <Box sx={{ mt: 1, display: 'grid', gap: 1 }}>
          {carregandoBase ? (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : sessoesFiltradas.length === 0 ? (
            <Alert severity="info">
              Nenhuma sessão no período. Clique em <strong>Novo atendimento</strong> para iniciar.
            </Alert>
          ) : (
            sessoesFiltradas.map((s) => (
              <Paper
                key={s.id_sessao}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  borderColor: s.hora_saida
                    ? alpha(theme.palette.success.main, theme.palette.mode === 'light' ? 0.25 : 0.35)
                    : alpha(theme.palette.warning.main, theme.palette.mode === 'light' ? 0.25 : 0.35),
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  alignItems={{ md: 'center' }}
                  justifyContent="space-between"
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                        {s.aluno_nome}
                      </Typography>
                      <Chip
                        size="small"
                        label={s.hora_saida ? 'Encerrada' : 'Aberta'}
                        color={s.hora_saida ? 'success' : 'warning'}
                      />
                      <Chip size="small" label={s.sala_nome ?? '-'} variant="outlined" />
                      <Chip
                        size="small"
                        label={`${s.disciplina_nome ?? '-'} — ${s.ano_nome ?? '-'}`}
                        variant="outlined"
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Entrada: {formatarDataHoraBR(s.hora_entrada)}{' '}
                      {s.hora_saida ? `• Saída: ${formatarDataHoraBR(s.hora_saida)}` : ''}
                    </Typography>

                    {s.resumo_atividades ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Resumo: {s.resumo_atividades}
                      </Typography>
                    ) : null}
                  </Box>

                  <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                    <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => void abrirSessao(s)}>
                      Abrir Sessão
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<DescriptionIcon />}
                      onClick={() => abrirFicha(s)}
                      disabled={!s.id_progresso}
                      sx={{ fontWeight: 900 }}
                    >
                      Abrir Ficha
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))
          )}
        </Box>
      </Paper>

      {/* Dialog: Nova Sessão */}
      <Dialog
        open={dlgNovaSessao}
        onClose={() => setDlgNovaSessao(false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Novo atendimento
          <IconButton onClick={() => setDlgNovaSessao(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">Fluxo: selecionar aluno + sala + disciplina/ano → criar sessão → lançar protocolos.</Alert>

            <Autocomplete
              options={alunos}
              value={novaSessaoAluno}
              onChange={(_, v) => setNovaSessaoAluno(v)}
              getOptionLabel={(o) => o.nome}
              renderInput={(params) => <TextField {...params} label="Aluno" size="small" />}
              noOptionsText="Nenhum aluno encontrado"
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="nova-sala-label">Sala</InputLabel>
                <Select
                  labelId="nova-sala-label"
                  label="Sala"
                  value={novaSessaoSalaId}
                  onChange={(e) => setNovaSessaoSalaId(String(e.target.value))}
                >
                  <MenuItem value="">
                    <em>Selecione</em>
                  </MenuItem>
                  {salas.map((s) => (
                    <MenuItem key={s.id_sala} value={String(s.id_sala)}>
                      {s.nome} ({s.tipo_sala})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Hora de entrada"
                type="datetime-local"
                value={novaSessaoEntrada}
                onChange={(e) => setNovaSessaoEntrada(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <Autocomplete
              options={opcoesDisciplinaAno}
              value={novaSessaoDiscAno}
              onChange={(_, v) => setNovaSessaoDiscAno(v)}
              getOptionLabel={(o) => o.label}
              renderInput={(params) => <TextField {...params} label="Disciplina / Ano escolar" size="small" />}
              noOptionsText="Nenhuma configuração encontrada (config_disciplina_ano)"
            />

            <TextField
              label="Resumo inicial (opcional)"
              value={novaSessaoResumo}
              onChange={(e) => setNovaSessaoResumo(e.target.value)}
              minRows={2}
              multiline
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgNovaSessao(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void criarSessao()} disabled={salvandoNovaSessao}>
            {salvandoNovaSessao ? 'Salvando...' : 'Criar sessão'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Sessão */}
      <Dialog open={dlgSessao} onClose={fecharSessaoDialog} fullWidth maxWidth="lg" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          Sessão de atendimento
          <IconButton onClick={fecharSessaoDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {!sessaoAtual ? (
            <Alert severity="warning">Sessão não selecionada.</Alert>
          ) : (
            <Stack spacing={2}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35),
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {sessaoAtual.aluno_nome}
                    </Typography>
                    <Chip
                      size="small"
                      label={sessaoAtual.hora_saida ? 'Encerrada' : 'Aberta'}
                      color={sessaoAtual.hora_saida ? 'success' : 'warning'}
                    />
                    <Chip size="small" label={sessaoAtual.sala_nome ?? '-'} variant="outlined" />
                    <Chip
                      size="small"
                      label={`${sessaoAtual.disciplina_nome ?? '-'} — ${sessaoAtual.ano_nome ?? '-'}`}
                      variant="outlined"
                    />
                    {limiteProtocolosSessao != null ? (
                      <Chip size="small" label={`Protocolos: 1..${limiteProtocolosSessao}`} variant="outlined" />
                    ) : null}
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Entrada: {formatarDataHoraBR(sessaoAtual.hora_entrada)} • Saída: {formatarDataHoraBR(sessaoAtual.hora_saida)}
                  </Typography>

                  <TextField
                    label="Resumo da sessão (salvar)"
                    value={sessaoAtual.resumo_atividades ?? ''}
                    onChange={(e) => setSessaoAtual((old) => (old ? { ...old, resumo_atividades: e.target.value } : old))}
                    minRows={2}
                    multiline
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end" flexWrap="wrap">
                    <Button
                      variant="outlined"
                      startIcon={<DescriptionIcon />}
                      onClick={() => abrirFicha(sessaoAtual)}
                      disabled={!sessaoAtual.id_progresso}
                    >
                      Abrir Ficha
                    </Button>

                    <Button variant="outlined" onClick={() => void salvarResumoSessao()} disabled={salvandoSessao}>
                      Salvar resumo
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => void encerrarSessaoAgora()}
                      disabled={salvandoSessao || Boolean(sessaoAtual.hora_saida)}
                    >
                      Encerrar sessão
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                  Protocolos / Atividades
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={abrirDialogNovoRegistro}
                  disabled={!sessaoAtual.id_progresso}
                >
                  Adicionar protocolo
                </Button>
              </Stack>

              {carregandoRegistros ? <LinearProgress /> : null}

              {registros.length === 0 ? (
                <Alert severity="info">Nenhum protocolo lançado nesta sessão ainda.</Alert>
              ) : (
                <Stack spacing={1}>
                  {registros.map((r) => {
                    const chip = statusChipProps(r.status)
                    return (
                      <Paper key={r.id_atividade} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1}
                          alignItems={{ md: 'center' }}
                          justifyContent="space-between"
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                Protocolo {r.numero_protocolo}
                              </Typography>
                              <Chip size="small" label={r.tipo_nome ?? '-'} variant="outlined" />
                              <Chip size="small" label={chip.label} color={chip.color} />
                              {r.is_adaptada ? <Chip size="small" label="Adaptada" color="info" variant="outlined" /> : null}
                              {r.nota != null ? <Chip size="small" label={`Nota: ${r.nota}`} variant="outlined" /> : null}
                            </Stack>

                            {r.sintese ? (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {r.sintese}
                              </Typography>
                            ) : null}

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Criado: {formatarDataHoraBR(r.created_at)} • Atualizado: {formatarDataHoraBR(r.updated_at)}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Editar">
                              <IconButton onClick={() => abrirEdicaoRegistro(r)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton onClick={() => setConfirmDeleteId(r.id_atividade)}>
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Paper>
                    )
                  })}
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={fecharSessaoDialog}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Registro */}
      <Dialog open={dlgRegistro} onClose={fecharDialogRegistro} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {registroEditandoId ? 'Editar protocolo' : 'Adicionar protocolo'}
          <IconButton onClick={fecharDialogRegistro} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {!sessaoAtual ? (
            <Alert severity="warning">Sessão não selecionada.</Alert>
          ) : (
            <Stack spacing={2}>
              <Alert severity="info">
                O número do protocolo é limitado pela configuração <code>config_disciplina_ano</code> (quando existir).
              </Alert>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="reg-numero-label">Nº do protocolo</InputLabel>
                  <Select
                    labelId="reg-numero-label"
                    label="Nº do protocolo"
                    value={regNumero}
                    onChange={(e) => setRegNumero(String(e.target.value))}
                  >
                    <MenuItem value="">
                      <em>Selecione</em>
                    </MenuItem>
                    {(() => {
                      const limite =
                        limiteProtocolosSessao ??
                        (sessaoAtual.id_disciplina && sessaoAtual.id_ano_escolar
                          ? mapaConfigPorDiscAno.get(`${sessaoAtual.id_disciplina}-${sessaoAtual.id_ano_escolar}`)?.quantidade_protocolos
                          : null) ??
                        50

                      const itens: number[] = []
                      for (let i = 1; i <= limite; i += 1) itens.push(i)
                      return itens.map((n) => (
                        <MenuItem key={n} value={String(n)}>
                          {n}
                        </MenuItem>
                      ))
                    })()}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="reg-tipo-label">Tipo de protocolo</InputLabel>
                  <Select
                    labelId="reg-tipo-label"
                    label="Tipo de protocolo"
                    value={regTipoId}
                    onChange={(e) => setRegTipoId(String(e.target.value))}
                  >
                    <MenuItem value="">
                      <em>Selecione</em>
                    </MenuItem>
                    {tiposProtocolo.map((t) => (
                      <MenuItem key={t.id_tipo_protocolo} value={String(t.id_tipo_protocolo)}>
                        {t.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="reg-status-label">Status</InputLabel>
                  <Select
                    labelId="reg-status-label"
                    label="Status"
                    value={regStatus}
                    onChange={(e) => setRegStatus(String(e.target.value))}
                  >
                    <MenuItem value="A fazer">A fazer</MenuItem>
                    <MenuItem value="Em andamento">Em andamento</MenuItem>
                    <MenuItem value="Concluída">Concluída</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Nota (opcional)"
                  value={regNota}
                  onChange={(e) => setRegNota(e.target.value)}
                  placeholder="Ex.: 8.5"
                />
              </Stack>

              <FormControlLabel
                control={<Switch checked={regAdaptada} onChange={(e) => setRegAdaptada(e.target.checked)} />}
                label="Atividade adaptada"
              />

              <TextField
                label="Síntese / Observação"
                value={regSintese}
                onChange={(e) => setRegSintese(e.target.value)}
                minRows={3}
                multiline
              />

              {confirmDeleteId ? <Alert severity="warning">Confirma excluir o registro #{confirmDeleteId}?</Alert> : null}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          {confirmDeleteId ? (
            <>
              <Button variant="outlined" onClick={cancelarExcluirRegistro}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => void confirmarExcluirRegistro()}
                disabled={salvandoRegistro}
              >
                {salvandoRegistro ? 'Excluindo...' : 'Excluir'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outlined" onClick={fecharDialogRegistro}>
                Cancelar
              </Button>
              {registroEditandoId ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setConfirmDeleteId(registroEditandoId)}
                  startIcon={<DeleteOutlineIcon />}
                >
                  Excluir
                </Button>
              ) : null}
              <Button variant="contained" onClick={() => void salvarRegistro()} disabled={salvandoRegistro}>
                {salvandoRegistro ? 'Salvando...' : registroEditandoId ? 'Atualizar' : 'Salvar'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}
