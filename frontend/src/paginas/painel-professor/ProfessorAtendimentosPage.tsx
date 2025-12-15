// src/paginas/painel-professor/ProfessorAtendimentosPage.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import SchoolIcon from '@mui/icons-material/School'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'

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

  // Opcional: quando encontrado por matrícula
  id_matricula?: number | null
  numero_inscricao?: string | null
  ano_letivo?: number | null
  status_matricula_nome?: string | null
}

type OpcaoDisciplinaAno = {
  id_config: number
  id_disciplina: number
  id_ano_escolar: number
  quantidade_protocolos: number
  disciplina_nome: string
  ano_nome: string
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
  try {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  } catch {
    return (valor || '').toLowerCase().trim()
  }
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

function papelDoUsuario(usuario: any): string {
  return String(usuario?.papel ?? usuario?.role ?? usuario?.tipo ?? usuario?.tipo_usuario ?? '').trim()
}

export default function ProfessorAtendimentosPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { usuario } = useAuth()
  const { sucesso, aviso, erro, info } = useNotificacaoContext()

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const PAPEL = useMemo(() => papelDoUsuario(usuario), [usuario])
  const ehPrivilegiado = useMemo(() => {
    const p = normalizarTexto(PAPEL)
    return p.includes('admin') || p.includes('diretor') || p.includes('coorden')
  }, [PAPEL])

  const LIMITE_DISCIPLINAS_ABERTAS_PARA_PROFESSOR = 3

  const [carregandoBase, setCarregandoBase] = useState(true)
  const [carregandoSessoes, setCarregandoSessoes] = useState(false)
  const [carregandoRegistros, setCarregandoRegistros] = useState(false)

  const [idProfessor, setIdProfessor] = useState<number | null>(null)

  // Somente salas lotadas do professor
  const [salas, setSalas] = useState<SalaAtendimento[]>([])

  // Mapa: sala -> opções (disciplina/ano) permitidas naquela sala
  const [mapaSalaOpcoes, setMapaSalaOpcoes] = useState<Record<number, OpcaoDisciplinaAno[]>>({})

  // Lista “global” de configs (derivada das salas do professor) para validar limites de protocolos
  const [configs, setConfigs] = useState<ConfigDisciplinaAno[]>([])

  const [tiposProtocolo, setTiposProtocolo] = useState<TipoProtocolo[]>([])
  const [statusMatriculas, setStatusMatriculas] = useState<StatusMatricula[]>([])
  const [statusDisciplinas, setStatusDisciplinas] = useState<StatusDisciplinaAluno[]>([])

  const [filtroDataInicio, setFiltroDataInicio] = useState<string>(hojeISODateLocal())
  const [filtroDataFim, setFiltroDataFim] = useState<string>(hojeISODateLocal())
  const [filtroTexto, setFiltroTexto] = useState<string>('')
  const [filtroSalaId, setFiltroSalaId] = useState<number | 'todas'>('todas')

  const [sessoes, setSessoes] = useState<SessaoView[]>([])

  // ===========================
  // Dialog: Escolher Sala (quando > 1)
  // ===========================
  const [dlgEscolherSala, setDlgEscolherSala] = useState(false)

  // ===========================
  // Dialog: Nova sessão
  // ===========================
  const [dlgNovaSessao, setDlgNovaSessao] = useState(false)

  const [novaSessaoSalaId, setNovaSessaoSalaId] = useState<number | null>(null)

  const [novaSessaoAluno, setNovaSessaoAluno] = useState<AlunoOption | null>(null)
  const [buscaAluno, setBuscaAluno] = useState<string>('')
  const [opcoesAluno, setOpcoesAluno] = useState<AlunoOption[]>([])
  const [buscandoAluno, setBuscandoAluno] = useState(false)
  const debounceRef = useRef<number | null>(null)

  const [novaSessaoMatriculaId, setNovaSessaoMatriculaId] = useState<number | null>(null)
  const [novaSessaoNumeroInscricao, setNovaSessaoNumeroInscricao] = useState<string | null>(null)

  // Contexto do aluno na sala (fichas abertas / progresso existente)
  const [carregandoAlunoContexto, setCarregandoAlunoContexto] = useState(false)
  const [qtdeDisciplinasAbertas, setQtdeDisciplinasAbertas] = useState<number>(0)
  const [alunoTemFichaNaSala, setAlunoTemFichaNaSala] = useState<boolean>(true)
  const [progressoPorDiscAno, setProgressoPorDiscAno] = useState<Map<string, number>>(new Map())

  const [novaSessaoDiscAno, setNovaSessaoDiscAno] = useState<OpcaoDisciplinaAno | null>(null)
  const [confirmarAberturaFicha, setConfirmarAberturaFicha] = useState<boolean>(false)

  const [novaSessaoEntrada, setNovaSessaoEntrada] = useState<string>(agoraParaInputDateTimeLocal())
  const [novaSessaoResumo, setNovaSessaoResumo] = useState<string>('')

  const [salvandoNovaSessao, setSalvandoNovaSessao] = useState(false)

  // ===========================
  // Dialog: Sessão
  // ===========================
  const [dlgSessao, setDlgSessao] = useState(false)
  const [sessaoAtual, setSessaoAtual] = useState<SessaoView | null>(null)
  const [registros, setRegistros] = useState<RegistroView[]>([])
  const [salvandoSessao, setSalvandoSessao] = useState(false)

  // ===========================
  // Dialog: Registro
  // ===========================
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

  // ===========================
  // Derived
  // ===========================
  const mapaConfigPorDiscAno = useMemo(() => {
    const m = new Map<string, ConfigDisciplinaAno>()
    configs.forEach((c) => {
      m.set(`${c.id_disciplina}-${c.id_ano_escolar}`, c)
    })
    return m
  }, [configs])

  const opcoesDisciplinaAnoDaSala: OpcaoDisciplinaAno[] = useMemo(() => {
    if (!novaSessaoSalaId) return []
    return (mapaSalaOpcoes[novaSessaoSalaId] ?? []).slice().sort((a, b) => a.label.localeCompare(b.label))
  }, [novaSessaoSalaId, mapaSalaOpcoes])

  const salaSelecionada = useMemo(() => {
    if (!novaSessaoSalaId) return null
    return salas.find((s) => s.id_sala === novaSessaoSalaId) ?? null
  }, [salas, novaSessaoSalaId])

  const chaveDiscAnoSelecionada = useMemo(() => {
    if (!novaSessaoDiscAno) return null
    return `${novaSessaoDiscAno.id_disciplina}-${novaSessaoDiscAno.id_ano_escolar}`
  }, [novaSessaoDiscAno])

  const idProgressoSelecionado = useMemo(() => {
    if (!chaveDiscAnoSelecionada) return null
    return progressoPorDiscAno.get(chaveDiscAnoSelecionada) ?? null
  }, [progressoPorDiscAno, chaveDiscAnoSelecionada])

  const disciplinaJaAberta = Boolean(idProgressoSelecionado)

  const podeAbrirNovaDisciplina = useMemo(() => {
    return ehPrivilegiado || qtdeDisciplinasAbertas < LIMITE_DISCIPLINAS_ABERTAS_PARA_PROFESSOR
  }, [ehPrivilegiado, qtdeDisciplinasAbertas])

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

  const kpis = useMemo(() => {
    const total = sessoesFiltradas.length
    const abertas = sessoesFiltradas.filter((s) => !s.hora_saida).length
    const encerradas = total - abertas
    return { total, abertas, encerradas }
  }, [sessoesFiltradas])

  // ===========================
  // Base load
  // ===========================
  const carregarBase = useCallback(async () => {
    if (!supabase) return
    if (!usuario?.id) return

    setCarregandoBase(true)
    try {
      // 1) professor
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
      const professorId = Number(prof.id_professor)
      setIdProfessor(professorId)

      // 2) carregar tabelas auxiliares em paralelo (independente das salas)
      const [tiposRes, statusMatRes, statusDiscRes] = await Promise.all([
        supabase.from('tipos_protocolo').select('id_tipo_protocolo,nome').order('nome'),
        supabase.from('status_matricula').select('id_status_matricula,nome').order('id_status_matricula'),
        supabase.from('status_disciplina_aluno').select('id_status_disciplina,nome').order('id_status_disciplina'),
      ])

      if (tiposRes.error) throw tiposRes.error
      if (statusMatRes.error) throw statusMatRes.error
      if (statusDiscRes.error) throw statusDiscRes.error

      setTiposProtocolo((tiposRes.data ?? []) as TipoProtocolo[])
      setStatusMatriculas((statusMatRes.data ?? []) as StatusMatricula[])
      setStatusDisciplinas((statusDiscRes.data ?? []) as StatusDisciplinaAluno[])

      // 3) salas do professor (lotação)
      const { data: profSalas, error: errSalas } = await supabase
        .from('professores_salas')
        .select(
          `
          id_sala,
          ativo,
          salas_atendimento(
            id_sala,
            nome,
            tipo_sala,
            is_ativa
          )
        `
        )
        .eq('id_professor', professorId)
        .eq('ativo', true)

      if (errSalas) throw errSalas

      const salasProfessor: SalaAtendimento[] = (profSalas ?? [])
        .map((r: any) => first(r?.salas_atendimento))
        .filter(Boolean)
        .filter((s: any) => Boolean(s?.is_ativa))
        .map((s: any) => ({
          id_sala: Number(s.id_sala),
          nome: String(s.nome),
          tipo_sala: String(s.tipo_sala),
          is_ativa: Boolean(s.is_ativa),
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome))

      setSalas(salasProfessor)

      if (salasProfessor.length === 0) {
        info('Você não está lotado em nenhuma sala ativa. Peça ao Admin/Secretaria para vincular em Professores → Salas.')
      }

      // 4) disciplinas por sala (salas_config_disciplina_ano -> config_disciplina_ano)
      const salaIds = salasProfessor.map((s) => s.id_sala)
      if (salaIds.length > 0) {
        const { data: salaCfg, error: errCfg } = await supabase
          .from('salas_config_disciplina_ano')
          .select(
            `
            id_sala,
            config_disciplina_ano(
              id_config,
              id_disciplina,
              id_ano_escolar,
              quantidade_protocolos,
              disciplinas(nome_disciplina),
              anos_escolares(nome_ano)
            )
          `
          )
          .in('id_sala', salaIds)

        if (errCfg) throw errCfg

        const mapa: Record<number, OpcaoDisciplinaAno[]> = {}
        const uniq = new Map<number, ConfigDisciplinaAno>()

        for (const row of salaCfg ?? []) {
          const idSala = Number((row as any)?.id_sala)
          const cfg = first((row as any)?.config_disciplina_ano) as any
          if (!cfg?.id_config) continue

          const disc = first(cfg?.disciplinas) as any
          const ano = first(cfg?.anos_escolares) as any

          const opt: OpcaoDisciplinaAno = {
            id_config: Number(cfg.id_config),
            id_disciplina: Number(cfg.id_disciplina),
            id_ano_escolar: Number(cfg.id_ano_escolar),
            quantidade_protocolos: Number(cfg.quantidade_protocolos),
            disciplina_nome: String(disc?.nome_disciplina ?? `Disciplina #${cfg.id_disciplina}`),
            ano_nome: String(ano?.nome_ano ?? `Ano #${cfg.id_ano_escolar}`),
            label: `${String(disc?.nome_disciplina ?? 'Disciplina')} — ${String(ano?.nome_ano ?? 'Ano')} (protocolos: ${cfg.quantidade_protocolos})`,
          }

          if (!mapa[idSala]) mapa[idSala] = []
          mapa[idSala].push(opt)

          uniq.set(Number(cfg.id_config), {
            id_config: Number(cfg.id_config),
            id_disciplina: Number(cfg.id_disciplina),
            id_ano_escolar: Number(cfg.id_ano_escolar),
            quantidade_protocolos: Number(cfg.quantidade_protocolos),
          })
        }

        setMapaSalaOpcoes(mapa)
        setConfigs(Array.from(uniq.values()))
      } else {
        setMapaSalaOpcoes({})
        setConfigs([])
      }
    } catch (e: any) {
      console.error(e)
      erro('Falha ao carregar dados-base da página de atendimentos.')
    } finally {
      if (mountedRef.current) setCarregandoBase(false)
    }
  }, [supabase, usuario?.id, erro, info])

  // ===========================
  // Sessions load
  // ===========================
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

  // ===========================
  // Records load
  // ===========================
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

  // ===========================
  // Helpers: status default e matrícula preferencial
  // ===========================
  const obterIdStatusDisciplinaDefault = useCallback((): number | null => {
    const cursando = statusDisciplinas.find((s) => normalizarTexto(s.nome).includes('cursando'))
    if (cursando) return Number(cursando.id_status_disciplina)

    const aCursar = statusDisciplinas.find((s) => normalizarTexto(s.nome).includes('a cursar'))
    if (aCursar) return Number(aCursar.id_status_disciplina)

    return statusDisciplinas[0]?.id_status_disciplina ? Number(statusDisciplinas[0].id_status_disciplina) : null
  }, [statusDisciplinas])

  const obterMatriculaPreferencial = useCallback(
    async (alunoId: number): Promise<{ id_matricula: number; numero_inscricao?: string | null } | null> => {
      if (!supabase) return null

      // Preferir status "Ativa", se existir
      const ativa = statusMatriculas.find((s) => normalizarTexto(s.nome).includes('ativa'))
      const ativaId = ativa ? Number(ativa.id_status_matricula) : null

      const { data, error: err } = await supabase
        .from('matriculas')
        .select('id_matricula,id_status_matricula,ano_letivo,data_matricula,numero_inscricao,status_matricula(nome)')
        .eq('id_aluno', alunoId)
        .order('ano_letivo', { ascending: false })
        .order('data_matricula', { ascending: false })

      if (err) throw err

      const lista = (data ?? []).map((m: any) => {
        const sm = first(m?.status_matricula) as any
        return {
          id_matricula: Number(m.id_matricula),
          id_status_matricula: Number(m.id_status_matricula),
          numero_inscricao: m?.numero_inscricao ? String(m.numero_inscricao) : null,
          status_nome: sm?.nome ? String(sm.nome) : null,
        }
      })

      if (lista.length === 0) return null

      if (ativaId != null) {
        const ativaRow = lista.find((m) => m.id_status_matricula === ativaId)
        if (ativaRow) return { id_matricula: ativaRow.id_matricula, numero_inscricao: ativaRow.numero_inscricao }
      }

      return { id_matricula: lista[0].id_matricula, numero_inscricao: lista[0].numero_inscricao }
    },
    [supabase, statusMatriculas]
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
      if (!statusDefaultId) throw new Error('Tabela status_disciplina_aluno não possui valores para status inicial.')

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

  // ===========================
  // Busca de aluno (nome ou matrícula)
  // ===========================
  const buscarAlunos = useCallback(
    async (termo: string) => {
      if (!supabase) return

      const t = termo.trim()
      if (t.length < 2 && !/^\d+$/.test(t)) {
        setOpcoesAluno([])
        return
      }

      setBuscandoAluno(true)
      try {
        const isNum = /^\d+$/.test(t)

        // Caso 1: digitou número -> procurar por numero_inscricao
        if (isNum) {
          const { data, error: err } = await supabase
            .from('matriculas')
            .select(
              `
              id_matricula,
              id_aluno,
              numero_inscricao,
              ano_letivo,
              status_matricula(nome),
              alunos!inner(
                id_aluno,
                usuarios!inner(
                  name,
                  email
                )
              )
            `
            )
            .ilike('numero_inscricao', `%${t}%`)
            .order('ano_letivo', { ascending: false })
            .order('data_matricula', { ascending: false })
            .limit(25)

          if (err) throw err

          const opts: AlunoOption[] = (data ?? []).map((m: any) => {
            const a = first(m?.alunos) as any
            const u = first(a?.usuarios) as any
            const sm = first(m?.status_matricula) as any

            return {
              id_aluno: Number(m.id_aluno),
              nome: String(u?.name ?? `Aluno #${m.id_aluno}`),
              email: u?.email ?? null,
              id_matricula: Number(m.id_matricula),
              numero_inscricao: m?.numero_inscricao ? String(m.numero_inscricao) : null,
              ano_letivo: m?.ano_letivo != null ? Number(m.ano_letivo) : null,
              status_matricula_nome: sm?.nome ? String(sm.nome) : null,
            }
          })

          setOpcoesAluno(opts)
          return
        }

        // Caso 2: texto -> procurar alunos por nome, depois anexar matrícula “preferencial”
        const { data: alunosData, error: errAlunos } = await supabase
          .from('alunos')
          .select(
            `
            id_aluno,
            usuarios!inner(
              name,
              email
            )
          `
          )
          .ilike('usuarios.name', `%${t}%`)
          .order('id_aluno', { ascending: false })
          .limit(25)

        if (errAlunos) throw errAlunos

        const ids = (alunosData ?? []).map((a: any) => Number(a.id_aluno)).filter((x: any) => Number.isFinite(x))

        // buscar matrículas destes alunos (para exibir nº inscrição e escolher preferencial)
        let mats: any[] = []
        if (ids.length > 0) {
          const { data: matsData, error: errMats } = await supabase
            .from('matriculas')
            .select('id_matricula,id_aluno,numero_inscricao,ano_letivo,data_matricula,id_status_matricula,status_matricula(nome)')
            .in('id_aluno', ids)
            .order('ano_letivo', { ascending: false })
            .order('data_matricula', { ascending: false })
            .limit(500)

          if (errMats) throw errMats
          mats = matsData ?? []
        }

        const matsPorAluno = new Map<number, any[]>()
        for (const m of mats) {
          const aid = Number(m?.id_aluno)
          if (!matsPorAluno.has(aid)) matsPorAluno.set(aid, [])
          matsPorAluno.get(aid)!.push(m)
        }

        const escolherMelhorMatricula = (lista: any[]) => {
          if (!lista?.length) return null
          // preferir status nome contendo "ativa"
          const ativa = lista.find((m) => {
            const sm = first(m?.status_matricula) as any
            return normalizarTexto(String(sm?.nome ?? '')).includes('ativa')
          })
          return ativa ?? lista[0]
        }

        const opts: AlunoOption[] = (alunosData ?? []).map((a: any) => {
          const u = first(a?.usuarios) as any
          const listaM = matsPorAluno.get(Number(a.id_aluno)) ?? []
          const melhor = escolherMelhorMatricula(listaM)
          const sm = first(melhor?.status_matricula) as any

          return {
            id_aluno: Number(a.id_aluno),
            nome: String(u?.name ?? `Aluno #${a.id_aluno}`),
            email: u?.email ?? null,

            id_matricula: melhor?.id_matricula != null ? Number(melhor.id_matricula) : null,
            numero_inscricao: melhor?.numero_inscricao ? String(melhor.numero_inscricao) : null,
            ano_letivo: melhor?.ano_letivo != null ? Number(melhor.ano_letivo) : null,
            status_matricula_nome: sm?.nome ? String(sm.nome) : null,
          }
        })

        setOpcoesAluno(opts)
      } catch (e: any) {
        console.error(e)
        setOpcoesAluno([])
      } finally {
        if (mountedRef.current) setBuscandoAluno(false)
      }
    },
    [supabase]
  )

  // ===========================
  // Contexto do aluno na sala (progresso)
  // ===========================
  const carregarContextoAlunoNaSala = useCallback(
    async (aluno: AlunoOption, salaId: number) => {
      if (!supabase) return

      setCarregandoAlunoContexto(true)
      try {
        // 1) matrícula: se veio pelo resultado (por numero_inscricao), usa; senão tenta preferencial
        let idMatricula: number | null = aluno?.id_matricula != null ? Number(aluno.id_matricula) : null
        let numeroInscricao: string | null = aluno?.numero_inscricao ? String(aluno.numero_inscricao) : null

        if (!idMatricula) {
          const pref = await obterMatriculaPreferencial(aluno.id_aluno)
          if (!pref) {
            setNovaSessaoMatriculaId(null)
            setNovaSessaoNumeroInscricao(null)
            setQtdeDisciplinasAbertas(0)
            setAlunoTemFichaNaSala(false)
            setProgressoPorDiscAno(new Map())
            return
          }
          idMatricula = pref.id_matricula
          numeroInscricao = pref.numero_inscricao ?? null
        }

        setNovaSessaoMatriculaId(idMatricula)
        setNovaSessaoNumeroInscricao(numeroInscricao)

        // 2) progressos na matrícula
        const { data: progs, error: errProgs } = await supabase
          .from('progresso_aluno')
          .select('id_progresso,id_disciplina,id_ano_escolar,data_conclusao')
          .eq('id_matricula', idMatricula)
          .limit(2000)

        if (errProgs) throw errProgs

        const map = new Map<string, number>()
        let abertas = 0

        for (const p of progs ?? []) {
          const idDisc = Number((p as any)?.id_disciplina)
          const idAno = Number((p as any)?.id_ano_escolar)
          const idProg = Number((p as any)?.id_progresso)
          const key = `${idDisc}-${idAno}`
          if (Number.isFinite(idDisc) && Number.isFinite(idAno) && Number.isFinite(idProg)) {
            map.set(key, idProg)
          }
          // aberta se data_conclusao é null
          if ((p as any)?.data_conclusao == null) abertas += 1
        }

        setProgressoPorDiscAno(map)
        setQtdeDisciplinasAbertas(abertas)

        // 3) aluno tem ficha aberta em alguma disciplina desta sala?
        const opcoesSala = (mapaSalaOpcoes[salaId] ?? []) as OpcaoDisciplinaAno[]
        const temAlguma = opcoesSala.some((o) => map.has(`${o.id_disciplina}-${o.id_ano_escolar}`))
        setAlunoTemFichaNaSala(temAlguma)

        // UX: se já existir alguma aberta na sala, auto-seleciona a primeira disciplina “aberta”
        if (opcoesSala.length > 0) {
          const primeiraAberta = opcoesSala.find((o) => map.has(`${o.id_disciplina}-${o.id_ano_escolar}`))
          if (primeiraAberta) {
            setNovaSessaoDiscAno(primeiraAberta)
            setConfirmarAberturaFicha(false)
          } else {
            setNovaSessaoDiscAno(null)
            setConfirmarAberturaFicha(false)
          }
        } else {
          setNovaSessaoDiscAno(null)
          setConfirmarAberturaFicha(false)
        }
      } catch (e: any) {
        console.error(e)
        erro('Falha ao verificar fichas/progressos do aluno nesta sala.')
        setNovaSessaoMatriculaId(null)
        setNovaSessaoNumeroInscricao(null)
        setQtdeDisciplinasAbertas(0)
        setAlunoTemFichaNaSala(false)
        setProgressoPorDiscAno(new Map())
      } finally {
        if (mountedRef.current) setCarregandoAlunoContexto(false)
      }
    },
    [supabase, mapaSalaOpcoes, obterMatriculaPreferencial, erro]
  )

  // ===========================
  // Abertura de dialogs (fluxo sala -> novo atendimento)
  // ===========================
  const resetarFormularioNovaSessao = useCallback(() => {
    setNovaSessaoAluno(null)
    setBuscaAluno('')
    setOpcoesAluno([])
    setNovaSessaoMatriculaId(null)
    setNovaSessaoNumeroInscricao(null)
    setQtdeDisciplinasAbertas(0)
    setAlunoTemFichaNaSala(true)
    setProgressoPorDiscAno(new Map())
    setNovaSessaoDiscAno(null)
    setConfirmarAberturaFicha(false)

    setNovaSessaoEntrada(agoraParaInputDateTimeLocal())
    setNovaSessaoResumo('')
  }, [])

  const abrirNovoAtendimento = useCallback(() => {
    resetarFormularioNovaSessao()

    if (!salas.length) {
      erro('Você não possui sala vinculada. Solicite ao Admin/Secretaria para vincular em Professores → Salas.')
      return
    }

    if (salas.length === 1) {
      setNovaSessaoSalaId(salas[0].id_sala)
      setDlgNovaSessao(true)
      return
    }

    // Mais de uma sala: abre modal de escolha
    setNovaSessaoSalaId(null)
    setDlgEscolherSala(true)
  }, [resetarFormularioNovaSessao, salas, erro])

  const escolherSala = useCallback(
    (idSala: number) => {
      setNovaSessaoSalaId(idSala)

      // trocar sala implica recalcular contexto do aluno e disciplina
      setNovaSessaoDiscAno(null)
      setConfirmarAberturaFicha(false)
      setAlunoTemFichaNaSala(true)
      setProgressoPorDiscAno(new Map())

      setDlgEscolherSala(false)
      setDlgNovaSessao(true)

      if (novaSessaoAluno) {
        void carregarContextoAlunoNaSala(novaSessaoAluno, idSala)
      }
    },
    [novaSessaoAluno, carregarContextoAlunoNaSala]
  )

  // Debounce de busca do aluno (apenas quando dialog aberto)
  useEffect(() => {
    if (!dlgNovaSessao) return

    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => void buscarAlunos(buscaAluno), 350)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [buscaAluno, dlgNovaSessao, buscarAlunos])

  // Quando escolher aluno/sala, recalcula contexto
  useEffect(() => {
    if (!dlgNovaSessao) return
    if (!supabase) return
    if (!novaSessaoSalaId) return
    if (!novaSessaoAluno) return

    void carregarContextoAlunoNaSala(novaSessaoAluno, novaSessaoSalaId)
  }, [dlgNovaSessao, supabase, novaSessaoSalaId, novaSessaoAluno, carregarContextoAlunoNaSala])

  // ===========================
  // Criar sessão (com regra de abertura de ficha)
  // ===========================
  const criarSessao = useCallback(async () => {
    if (!supabase) return
    if (!usuario?.id) return

    if (!idProfessor) {
      erro('Professor não identificado. Recarregue a página ou verifique seu vínculo.')
      return
    }
    if (!novaSessaoSalaId) {
      aviso('Selecione a sala.')
      return
    }
    if (!novaSessaoAluno?.id_aluno) {
      aviso('Selecione o aluno (nome ou nº de inscrição).')
      return
    }
    if (!novaSessaoDiscAno) {
      aviso('Selecione a disciplina/ano desta sala.')
      return
    }
    if (!novaSessaoEntrada?.trim()) {
      aviso('Informe a hora de entrada.')
      return
    }

    setSalvandoNovaSessao(true)
    try {
      // Matrícula
      let idMatricula = novaSessaoMatriculaId
      if (!idMatricula) {
        const pref = await obterMatriculaPreferencial(novaSessaoAluno.id_aluno)
        if (!pref) {
          aviso('Este aluno não possui matrícula cadastrada. A Secretaria deve cadastrar a matrícula primeiro.')
          return
        }
        idMatricula = pref.id_matricula
        setNovaSessaoMatriculaId(idMatricula)
        setNovaSessaoNumeroInscricao(pref.numero_inscricao ?? null)
      }

      const key = `${novaSessaoDiscAno.id_disciplina}-${novaSessaoDiscAno.id_ano_escolar}`
      const progExistente = progressoPorDiscAno.get(key) ?? null

      // Se não houver ficha/progresso, precisamos “abrir”
      if (!progExistente) {
        if (!podeAbrirNovaDisciplina) {
          erro(
            `Aluno já possui ${qtdeDisciplinasAbertas} disciplinas abertas. Para abrir uma nova disciplina, somente ADMIN/DIRETOR/COORDENAÇÃO.`
          )
          return
        }
        if (!confirmarAberturaFicha) {
          aviso('Esta disciplina ainda não está aberta para o aluno. Marque “Confirmo abrir ficha” para continuar.')
          return
        }
      }

      const idProgresso = progExistente
        ? progExistente
        : await garantirProgresso(idMatricula, novaSessaoDiscAno.id_disciplina, novaSessaoDiscAno.id_ano_escolar)

      const horaEntradaISO = new Date(novaSessaoEntrada).toISOString()

      const { data: nova, error: errIns } = await supabase
        .from('sessoes_atendimento')
        .insert({
          id_aluno: novaSessaoAluno.id_aluno,
          id_professor: idProfessor,
          id_sala: novaSessaoSalaId,
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

      // Montar para abrir dialog da sessão
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
    novaSessaoSalaId,
    novaSessaoAluno,
    novaSessaoDiscAno,
    novaSessaoEntrada,
    novaSessaoResumo,
    novaSessaoMatriculaId,
    obterMatriculaPreferencial,
    progressoPorDiscAno,
    podeAbrirNovaDisciplina,
    qtdeDisciplinasAbertas,
    confirmarAberturaFicha,
    garantirProgresso,
    carregarSessoes,
    filtroDataInicio,
    filtroDataFim,
    carregarRegistrosDaSessao,
    sucesso,
    aviso,
    erro,
  ])

  // ===========================
  // Sessão dialog helpers
  // ===========================
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

  // ===========================
  // Registro dialog helpers
  // ===========================
  const limiteProtocolosSessao = useMemo(() => {
    if (!sessaoAtual) return null
    const idDisc = sessaoAtual.id_disciplina ?? null
    const idAno = sessaoAtual.id_ano_escolar ?? null
    if (!idDisc || !idAno) return null
    const cfg = mapaConfigPorDiscAno.get(`${idDisc}-${idAno}`)
    return cfg?.quantidade_protocolos ?? null
  }, [sessaoAtual, mapaConfigPorDiscAno])

  const abrirDialogNovoRegistro = useCallback(() => {
    if (!sessaoAtual) return

    const usados = new Set(registros.map((r) => r.numero_protocolo))
    let sugestao = 1

    const idDisc = sessaoAtual.id_disciplina ?? null
    const idAno = sessaoAtual.id_ano_escolar ?? null
    const cfg = idDisc && idAno ? mapaConfigPorDiscAno.get(`${idDisc}-${idAno}`) : undefined
    const limite = cfg?.quantidade_protocolos ?? 50

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
    const cfg = idDisc && idAno ? mapaConfigPorDiscAno.get(`${idDisc}-${idAno}`) : undefined
    const limite = cfg?.quantidade_protocolos ?? null

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

  const pedirExcluirRegistro = useCallback((id: number) => {
    setConfirmDeleteId(id)
  }, [])

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

  // ===========================
  // Initial load
  // ===========================
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

  // ===========================
  // UI
  // ===========================
  const podeCriarSessaoAgora =
    Boolean(idProfessor) &&
    Boolean(novaSessaoSalaId) &&
    Boolean(novaSessaoAluno?.id_aluno) &&
    Boolean(novaSessaoDiscAno) &&
    Boolean(novaSessaoEntrada?.trim()) &&
    (disciplinaJaAberta || (podeAbrirNovaDisciplina && confirmarAberturaFicha))

  return (
    <Box sx={{ p: 2, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
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
            Sessões do professor, com protocolos por disciplina/ano. Sala e disciplinas são carregadas pela sua lotação.
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
            <Chip size="small" label={`Total: ${kpis.total}`} variant="outlined" />
            <Chip size="small" label={`Abertas: ${kpis.abertas}`} color="warning" variant="outlined" />
            <Chip size="small" label={`Encerradas: ${kpis.encerradas}`} color="success" variant="outlined" />
            <Chip size="small" label={`Papel: ${PAPEL || '-'}`} variant="outlined" />
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={abrirNovoAtendimento}
            disabled={carregandoBase || !idProfessor || salas.length === 0}
          >
            Novo atendimento
          </Button>

          <Tooltip title="Recarregar sessões">
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

      {/* Filtros */}
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
              value={String(filtroSalaId)}
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
            Clique em “Abrir” para lançar/editar protocolos.
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
                      <Chip size="small" label={`${s.disciplina_nome ?? '-'} — ${s.ano_nome ?? '-'}`} variant="outlined" />
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

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => void abrirSessao(s)}>
                      Abrir
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))
          )}
        </Box>
      </Paper>

      {/* ===========================
          Dialog: Escolher Sala
         =========================== */}
      <Dialog open={dlgEscolherSala} onClose={() => setDlgEscolherSala(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>
          Selecione a sala do atendimento
          <IconButton onClick={() => setDlgEscolherSala(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {salas.length === 0 ? (
            <Alert severity="warning">Você não possui sala vinculada.</Alert>
          ) : (
            <Stack spacing={1}>
              <Alert severity="info">
                Você possui mais de uma sala. Selecione onde este atendimento será realizado.
              </Alert>

              {salas.map((s) => (
                <Paper
                  key={s.id_sala}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35),
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                      <MeetingRoomIcon fontSize="small" />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>{s.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.tipo_sala}
                        </Typography>
                      </Box>
                    </Stack>

                    <Button variant="contained" onClick={() => escolherSala(s.id_sala)} sx={{ textTransform: 'none', fontWeight: 900 }}>
                      Selecionar
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgEscolherSala(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===========================
          Dialog: Nova Sessão
         =========================== */}
      <Dialog open={dlgNovaSessao} onClose={() => setDlgNovaSessao(false)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          Novo atendimento
          <IconButton onClick={() => setDlgNovaSessao(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              Fluxo: escolher aluno (nome ou inscrição) → escolher disciplina/ano da sala → criar sessão → lançar protocolos.
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35),
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    icon={<MeetingRoomIcon />}
                    label={salaSelecionada ? `Sala: ${salaSelecionada.nome}` : 'Sala: não selecionada'}
                    variant="outlined"
                  />
                  {salaSelecionada ? <Chip label={salaSelecionada.tipo_sala} size="small" variant="outlined" /> : null}
                </Stack>

                {salas.length > 1 ? (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setDlgEscolherSala(true)}
                    sx={{ textTransform: 'none', fontWeight: 900 }}
                  >
                    Trocar sala
                  </Button>
                ) : null}
              </Stack>

              {novaSessaoSalaId && (mapaSalaOpcoes[novaSessaoSalaId]?.length ?? 0) === 0 ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Esta sala não possui disciplinas configuradas. Vincule em <code>salas_config_disciplina_ano</code>.
                </Alert>
              ) : null}
            </Paper>

            <Autocomplete
              fullWidth
              options={opcoesAluno}
              loading={buscandoAluno}
              value={novaSessaoAluno}
              onChange={(_, v) => {
                setNovaSessaoAluno(v)
                setConfirmarAberturaFicha(false)
              }}
              inputValue={buscaAluno}
              onInputChange={(_, v) => setBuscaAluno(v)}
              getOptionLabel={(o) => {
                const insc = o.numero_inscricao ? ` • Inscrição: ${o.numero_inscricao}` : ''
                const ano = o.ano_letivo ? ` (${o.ano_letivo})` : ''
                return `${o.nome}${insc}${ano}`
              }}
              isOptionEqualToValue={(o, v) => o.id_aluno === v.id_aluno && (o.id_matricula ?? null) === (v.id_matricula ?? null)}
              noOptionsText={
                buscaAluno.trim().length < 2 && !/^\d+$/.test(buscaAluno.trim())
                  ? 'Digite pelo menos 2 letras do nome, ou um número de inscrição...'
                  : 'Nenhum aluno encontrado'
              }
              renderOption={(props, option) => {
                const hasInscricao = Boolean(option.numero_inscricao)
                return (
                  <li {...props} key={`${option.id_aluno}-${option.id_matricula ?? 'sem-mat'}`}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                      <PersonSearchIcon fontSize="small" />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>{option.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {hasInscricao ? `Inscrição: ${option.numero_inscricao}` : 'Sem inscrição identificada'}{' '}
                          {option.ano_letivo ? `• Ano: ${option.ano_letivo}` : ''}{' '}
                          {option.status_matricula_nome ? `• Status: ${option.status_matricula_nome}` : ''}
                        </Typography>
                      </Box>
                      {hasInscricao ? <Chip size="small" label={option.numero_inscricao} variant="outlined" /> : null}
                    </Stack>
                  </li>
                )
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Aluno (nome ou nº de inscrição)"
                  placeholder="Ex.: Maria / 12345"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {buscandoAluno ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {novaSessaoAluno ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.08),
                  borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.22 : 0.3),
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip label={`Aluno: ${novaSessaoAluno.nome}`} variant="outlined" />
                    {novaSessaoNumeroInscricao ? <Chip label={`Inscrição: ${novaSessaoNumeroInscricao}`} variant="outlined" /> : null}
                    <Chip
                      label={`Disciplinas abertas (matrícula): ${qtdeDisciplinasAbertas}`}
                      color={qtdeDisciplinasAbertas >= LIMITE_DISCIPLINAS_ABERTAS_PARA_PROFESSOR ? 'warning' : 'default'}
                      variant="outlined"
                    />
                    {!ehPrivilegiado ? <Chip label="Regra: professor abre até 3" size="small" variant="outlined" /> : <Chip label="Regra: privilégio (sem limite)" size="small" color="success" variant="outlined" />}
                  </Stack>

                  {carregandoAlunoContexto ? <LinearProgress /> : null}

                  {!alunoTemFichaNaSala && !carregandoAlunoContexto ? (
                    <Alert severity="warning">
                      Este aluno <strong>não possui ficha aberta</strong> em nenhuma disciplina desta sala. Para atender, selecione uma disciplina abaixo e confirme a abertura da ficha.
                    </Alert>
                  ) : null}

                  {!podeAbrirNovaDisciplina && !ehPrivilegiado ? (
                    <Alert severity="warning">
                      O aluno já possui <strong>{qtdeDisciplinasAbertas}</strong> disciplinas abertas nesta matrícula. Para abrir uma nova disciplina, somente <strong>ADMIN/DIRETOR/COORDENAÇÃO</strong>.
                    </Alert>
                  ) : null}
                </Stack>
              </Paper>
            ) : null}

            <Autocomplete
              options={opcoesDisciplinaAnoDaSala}
              value={novaSessaoDiscAno}
              onChange={(_, v) => {
                setNovaSessaoDiscAno(v)
                setConfirmarAberturaFicha(false)
              }}
              getOptionLabel={(o) => o.label}
              noOptionsText="Nenhuma disciplina configurada para esta sala"
              renderOption={(props, option) => {
                const key = `${option.id_disciplina}-${option.id_ano_escolar}`
                const aberta = progressoPorDiscAno.has(key)
                const bloquearAbrir = !aberta && !podeAbrirNovaDisciplina

                return (
                  <li {...props} key={`${option.id_config}-${option.id_disciplina}-${option.id_ano_escolar}`}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                      <SchoolIcon fontSize="small" />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                          {option.disciplina_nome} — {option.ano_nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Protocolos: {option.quantidade_protocolos}
                        </Typography>
                      </Box>
                      {aberta ? (
                        <Chip size="small" label="Ficha aberta" color="success" variant="outlined" />
                      ) : (
                        <Chip
                          size="small"
                          label={bloquearAbrir ? 'Bloqueado' : 'Abrir ficha'}
                          color={bloquearAbrir ? 'warning' : 'info'}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </li>
                )
              }}
              renderInput={(params) => <TextField {...params} label="Disciplina / Ano (da sala)" size="small" />}
              disabled={!novaSessaoSalaId || opcoesDisciplinaAnoDaSala.length === 0}
            />

            {novaSessaoDiscAno ? (
              <>
                {!disciplinaJaAberta ? (
                  <Alert severity={podeAbrirNovaDisciplina ? 'info' : 'warning'}>
                    Esta disciplina ainda não está aberta para o aluno. Ao criar a sessão, o sistema irá <strong>abrir a ficha</strong> (criar progresso) antes do atendimento.
                  </Alert>
                ) : (
                  <Alert severity="success">Ficha já aberta para esta disciplina. Atendimento pode ser iniciado normalmente.</Alert>
                )}

                {!disciplinaJaAberta ? (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={confirmarAberturaFicha}
                        onChange={(e) => setConfirmarAberturaFicha(e.target.checked)}
                        disabled={!podeAbrirNovaDisciplina}
                      />
                    }
                    label="Confirmo abrir ficha para esta disciplina"
                  />
                ) : null}
              </>
            ) : null}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Hora de entrada"
                type="datetime-local"
                value={novaSessaoEntrada}
                onChange={(e) => setNovaSessaoEntrada(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="Resumo inicial (opcional)"
                value={novaSessaoResumo}
                onChange={(e) => setNovaSessaoResumo(e.target.value)}
                minRows={2}
                multiline
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            onClick={() => {
              setDlgNovaSessao(false)
              resetarFormularioNovaSessao()
            }}
          >
            Cancelar
          </Button>

          <Button variant="contained" onClick={() => void criarSessao()} disabled={salvandoNovaSessao || !podeCriarSessaoAgora}>
            {salvandoNovaSessao ? 'Salvando...' : 'Criar sessão'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===========================
          Dialog: Sessão
         =========================== */}
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
                    <Chip size="small" label={`${sessaoAtual.disciplina_nome ?? '-'} — ${sessaoAtual.ano_nome ?? '-'}`} variant="outlined" />
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

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
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
                              <IconButton onClick={() => pedirExcluirRegistro(r.id_atividade)}>
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

      {/* ===========================
          Dialog: Registro
         =========================== */}
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
                      const limite = limiteProtocolosSessao ?? 50
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

              <TextField label="Síntese / Observação" value={regSintese} onChange={(e) => setRegSintese(e.target.value)} minRows={3} multiline />

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
              <Button variant="contained" color="error" onClick={() => void confirmarExcluirRegistro()} disabled={salvandoRegistro}>
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
