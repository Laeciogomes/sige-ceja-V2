import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
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
import RefreshIcon from '@mui/icons-material/Autorenew'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SchoolIcon from '@mui/icons-material/School'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import DescriptionIcon from '@mui/icons-material/Description'

// Contextos
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

type StatusMatricula = {
  id_status_matricula: number
  nome: string
}

type StatusDisciplinaAluno = {
  id_status_disciplina: number
  nome: string
}

type SalaDisciplinaAnoOption = {
  id_config: number
  id_disciplina: number
  id_ano_escolar: number
  quantidade_protocolos: number
  disciplina_nome: string
  ano_nome: string
  label: string
}

type AlunoBuscaOption = {
  id_aluno: number
  nome: string
  email?: string | null
  foto_url?: string | null

  id_matricula?: number | null
  numero_inscricao?: string | null
}

type ProgressoOption = {
  id_progresso: number
  id_disciplina: number
  id_ano_escolar: number
  disciplina_nome: string
  ano_nome: string
  status_nome?: string | null
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

  aluno_nome: string
  aluno_foto_url?: string | null
  numero_inscricao?: string | null

  sala_nome?: string | null
  sala_tipo?: string | null

  disciplina_nome?: string | null
  ano_nome?: string | null

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

// helpers
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

function isStatusDisciplinaAberta(statusNome: string): boolean {
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

function statusChipProps(status: string): {
  label: string
  color?: 'default' | 'success' | 'warning' | 'info' | 'error'
} {
  const s = normalizarTexto(status)
  if (s.includes('conclu')) return { label: status, color: 'success' }
  if (s.includes('andamento')) return { label: status, color: 'info' }
  if (s.includes('fazer')) return { label: status, color: 'warning' }
  return { label: status, color: 'default' }
}

function renderNumeroInscricao(option: { numero_inscricao?: string | null }): string {
  const ra = option.numero_inscricao?.trim()
  return ra ? `RA: ${ra}` : 'RA: -'
}

/**
 * ✅ Detecta se o usuário está tentando buscar por RA
 * (permite digitar só números, ou com pontos/traços/espaços)
 */
function isBuscaPorRA(input: string): boolean {
  const t = input.trim()
  return t.length > 0 && /^[\d.\-\s]+$/.test(t)
}

function extrairDigitos(input: string): string {
  return input.replace(/\D/g, '')
}

/**
 * ✅ Escolhe um progresso "melhor" para uma disciplina, ignorando ano na escolha:
 * - prioriza progresso ABERTO
 * - depois prioriza maior id_ano_escolar
 * - depois maior id_progresso
 */
function escolherProgressoPorDisciplina(lista: ProgressoOption[], idDisciplina: number): ProgressoOption | null {
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

/**
 * ✅ Agrupa fichas abertas por disciplina (sem dividir por ano),
 * mantendo a melhor (maior ano / maior id).
 */
function agruparAbertasPorDisciplina(abertas: ProgressoOption[]): ProgressoOption[] {
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

export default function ProfessorAtendimentosPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()

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

  // ======= abrir ficha =======
  const abrirFichaAcompanhamento = useCallback(
    (idProgresso: number | null | undefined) => {
      if (!idProgresso) {
        aviso('Não foi possível abrir a ficha: sessão sem id_progresso.')
        return
      }
      navigate(`/fichas/${idProgresso}`)
    },
    [navigate, aviso]
  )

  // ======= estados base =======
  const [carregandoBase, setCarregandoBase] = useState(true)
  const [carregandoSessoes, setCarregandoSessoes] = useState(false)
  const [carregandoRegistros, setCarregandoRegistros] = useState(false)

  const [idProfessor, setIdProfessor] = useState<number | null>(null)
  const [minhasSalas, setMinhasSalas] = useState<SalaAtendimento[]>([])
  const [configsPorSala, setConfigsPorSala] = useState<Record<number, SalaDisciplinaAnoOption[]>>({})
  const [tiposProtocolo, setTiposProtocolo] = useState<TipoProtocolo[]>([])
  const [statusMatriculas, setStatusMatriculas] = useState<StatusMatricula[]>([])
  const [statusDisciplinas, setStatusDisciplinas] = useState<StatusDisciplinaAluno[]>([])

  const podeAbrirMaisQue3 = useMemo(() => {
    const p = String((usuario as any)?.papel ?? '').toUpperCase()
    return p === 'ADMIN' || p === 'DIRETOR' || p === 'COORDENACAO'
  }, [usuario])

  // ======= filtros/listagem =======
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>(hojeISODateLocal())
  const [filtroDataFim, setFiltroDataFim] = useState<string>(hojeISODateLocal())
  const [filtroTexto, setFiltroTexto] = useState<string>('')
  const [filtroSalaId, setFiltroSalaId] = useState<number | 'todas'>('todas')

  const [sessoes, setSessoes] = useState<SessaoView[]>([])
  const [resumoPorSessao, setResumoPorSessao] = useState<Record<number, string>>({})

  const sessoesFiltradas = useMemo(() => {
    const q = normalizarTexto(filtroTexto)
    return sessoes.filter((s) => {
      const matchTexto =
        q === '' ||
        normalizarTexto(s.aluno_nome ?? '').includes(q) ||
        normalizarTexto(s.disciplina_nome ?? '').includes(q) ||
        normalizarTexto(s.ano_nome ?? '').includes(q) ||
        normalizarTexto(s.sala_nome ?? '').includes(q) ||
        normalizarTexto(s.numero_inscricao ?? '').includes(q)

      const matchSala = filtroSalaId === 'todas' || s.id_sala === filtroSalaId

      return matchTexto && matchSala
    })
  }, [sessoes, filtroTexto, filtroSalaId])

  const sessoesAbertas = useMemo(() => sessoesFiltradas.filter((s) => !s.hora_saida), [sessoesFiltradas])
  const sessoesHistorico = useMemo(() => sessoesFiltradas.filter((s) => Boolean(s.hora_saida)), [sessoesFiltradas])

  const cardGridSx = useMemo(
    () => ({
      display: 'grid',
      gap: 2,
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
      },
    }),
    []
  )

  // ======= dialogs: escolher sala e iniciar atendimento =======
  const [dlgEscolherSala, setDlgEscolherSala] = useState(false)
  const [dlgNovoAtendimento, setDlgNovoAtendimento] = useState(false)

  const [salaAtendimentoId, setSalaAtendimentoId] = useState<number | null>(null)

  // busca aluno
  const [alunoInput, setAlunoInput] = useState<string>('')
  const [buscandoAlunos, setBuscandoAlunos] = useState(false)
  const [opcoesAluno, setOpcoesAluno] = useState<AlunoBuscaOption[]>([])
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoBuscaOption | null>(null)

  // fichas/progresso
  const [carregandoFichas, setCarregandoFichas] = useState(false)
  const [progressosAlunoTodos, setProgressosAlunoTodos] = useState<ProgressoOption[]>([])
  const [fichasAbertasNaSala, setFichasAbertasNaSala] = useState<ProgressoOption[]>([])
  const [qtdDisciplinasAbertas, setQtdDisciplinasAbertas] = useState<number | null>(null)

  const [usarFichaExistente, setUsarFichaExistente] = useState(true)
  const [progressoEscolhidoId, setProgressoEscolhidoId] = useState<number | null>(null)

  const [configSelecionada, setConfigSelecionada] = useState<SalaDisciplinaAnoOption | null>(null)

  const [novoHoraEntrada, setNovoHoraEntrada] = useState<string>(agoraParaInputDateTimeLocal())
  const [novoResumo, setNovoResumo] = useState<string>('')
  const [salvandoNovoAtendimento, setSalvandoNovoAtendimento] = useState(false)

  // ✅ modal confirmar abertura de ficha (quando precisa criar progresso novo)
  const [dlgConfirmAbrirFicha, setDlgConfirmAbrirFicha] = useState(false)

  // ======= sessão/protocolos =======
  const [dlgSessao, setDlgSessao] = useState(false)
  const [sessaoAtual, setSessaoAtual] = useState<SessaoView | null>(null)
  const [registros, setRegistros] = useState<RegistroView[]>([])
  const [salvandoSessao, setSalvandoSessao] = useState(false)

  const [dlgRegistro, setDlgRegistro] = useState(false)
  const [registroEditandoId, setRegistroEditandoId] = useState<number | null>(null)
  const [regNumero, setRegNumero] = useState<string>('')
  const [regTipoId, setRegTipoId] = useState<string>('')
  const [regStatus, setRegStatus] = useState<string>('A fazer')
  const [regNota, setRegNota] = useState<string>('')
  const [regAdaptada, setRegAdaptada] = useState<boolean>(false)
  const [regSintese, setRegSintese] = useState<string>('')
  const [salvandoRegistro, setSalvandoRegistro] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  /**
   * ✅ Mapa de limite de protocolos por (SALA + DISCIPLINA)
    * Como agora não dividimos por ano, usamos o TOTAL (SOMA) de quantidade_protocolos por sala+disciplina.

   */
  const mapaLimitePorSalaDisciplina = useMemo(() => {
    const m = new Map<string, number>()
    Object.entries(configsPorSala).forEach(([salaIdStr, lista]) => {
      const salaId = Number(salaIdStr)
      lista.forEach((o) => {
        m.set(`${salaId}-${o.id_disciplina}`, Number(o.quantidade_protocolos ?? 0))
      })
    })
    return m
  }, [configsPorSala])

  const limiteProtocolosSessao = useMemo(() => {
    if (!sessaoAtual?.id_sala || !sessaoAtual?.id_disciplina) return null
    return mapaLimitePorSalaDisciplina.get(`${sessaoAtual.id_sala}-${sessaoAtual.id_disciplina}`) ?? null
  }, [sessaoAtual, mapaLimitePorSalaDisciplina])

  const configsDaSalaSelecionada = useMemo(() => {
    if (!salaAtendimentoId) return []
    return configsPorSala[salaAtendimentoId] ?? []
  }, [configsPorSala, salaAtendimentoId])

  const idProgressoSelecionadoParaAbrirFicha = useMemo(() => {
    if (usarFichaExistente) return progressoEscolhidoId ?? null
    if (configSelecionada) {
      const ex = escolherProgressoPorDisciplina(progressosAlunoTodos, configSelecionada.id_disciplina)
      return ex?.id_progresso ?? null
    }
    return null
  }, [usarFichaExistente, progressoEscolhidoId, configSelecionada, progressosAlunoTodos])

  // ======= base load =======
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

      if (errProf) throw errProf
      if (!prof?.id_professor) {
        erro('Seu usuário não está vinculado a um Professor. Peça à Secretaria/Admin para vincular.')
        return
      }

      const professorId = Number(prof.id_professor)
      setIdProfessor(professorId)

      const { data: lotacoes, error: errLot } = await supabase
        .from('professores_salas')
        .select('id_sala, ativo, salas_atendimento ( id_sala, nome, tipo_sala, is_ativa )')
        .eq('id_professor', professorId)
        .eq('ativo', true)

      if (errLot) throw errLot

      const salas = (lotacoes ?? [])
        .map((r: any) => first(r?.salas_atendimento))
        .filter(Boolean)
        .map((s: any) => ({
          id_sala: Number(s.id_sala),
          nome: String(s.nome),
          tipo_sala: String(s.tipo_sala),
          is_ativa: Boolean(s.is_ativa),
        })) as SalaAtendimento[]

      const salasAtivas = salas.filter((s) => s.is_ativa)

      if (salasAtivas.length === 0) {
        erro('Você não está lotado(a) em nenhuma sala ativa. Peça ao Admin/Secretaria para configurar.')
        setMinhasSalas([])
        return
      }

      setMinhasSalas(salasAtivas)

      const salaIds = salasAtivas.map((s) => s.id_sala)

      const [tiposRes, statusMatRes, statusDiscRes, cfgSalaRes] = await Promise.all([
        supabase.from('tipos_protocolo').select('id_tipo_protocolo,nome').order('nome'),
        supabase.from('status_matricula').select('id_status_matricula,nome').order('id_status_matricula'),
        supabase.from('status_disciplina_aluno').select('id_status_disciplina,nome').order('id_status_disciplina'),
        supabase
          .from('salas_config_disciplina_ano')
          .select(
            `
            id_sala,
            id_config,
            config_disciplina_ano (
              id_config,
              id_disciplina,
              id_ano_escolar,
              quantidade_protocolos,
              disciplinas ( nome_disciplina ),
              anos_escolares ( nome_ano )
            )
          `
          )
          .in('id_sala', salaIds),
      ])

      if (tiposRes.error) throw tiposRes.error
      if (statusMatRes.error) throw statusMatRes.error
      if (statusDiscRes.error) throw statusDiscRes.error
      if (cfgSalaRes.error) throw cfgSalaRes.error

      setTiposProtocolo((tiposRes.data ?? []) as TipoProtocolo[])
      setStatusMatriculas((statusMatRes.data ?? []) as StatusMatricula[])
      setStatusDisciplinas((statusDiscRes.data ?? []) as StatusDisciplinaAluno[])

      /**
       * ✅ Monta configs por sala, MAS agora "junta" por disciplina (não divide por ano).
       * Regra: para cada disciplina dentro da sala, pega a config com MAIOR quantidade_protocolos.
       */
      /**
 * ✅ Monta configs por sala, "juntando" por disciplina (não divide por ano)
 * Regra correta: para cada disciplina dentro da sala, SOMA quantidade_protocolos de todos os anos.
 * Mantém id_ano_escolar como o MAIOR (mais recente) apenas para usar como "ano representativo" na criação de progresso.
 */
const tmp: Record<number, Map<number, SalaDisciplinaAnoOption>> = {}

;(cfgSalaRes.data ?? []).forEach((row: any) => {
  const salaId = Number(row.id_sala)
  const cfg = first(row?.config_disciplina_ano) as any
  if (!cfg?.id_config) return

  const disc = first(cfg?.disciplinas) as any
  const ano = first(cfg?.anos_escolares) as any

  const disciplinaNome = disc?.nome_disciplina
    ? String(disc.nome_disciplina)
    : `Disciplina #${cfg.id_disciplina}`

  const anoNome = ano?.nome_ano ? String(ano.nome_ano) : `Ano #${cfg.id_ano_escolar}`
  const qtd = Number(cfg.quantidade_protocolos ?? 0)

  const opt: SalaDisciplinaAnoOption = {
    id_config: Number(cfg.id_config),
    id_disciplina: Number(cfg.id_disciplina),
    id_ano_escolar: Number(cfg.id_ano_escolar),
    quantidade_protocolos: qtd,
    disciplina_nome: disciplinaNome,
    ano_nome: anoNome,
    label: '', // define depois
  }

  if (!tmp[salaId]) tmp[salaId] = new Map<number, SalaDisciplinaAnoOption>()

  const atual = tmp[salaId].get(opt.id_disciplina)

  if (!atual) {
    tmp[salaId].set(opt.id_disciplina, opt)
    return
  }

  const soma = Number(atual.quantidade_protocolos ?? 0) + Number(opt.quantidade_protocolos ?? 0)

  // mantém um ano "representativo" (o maior), só para criação de progresso
  const usarOptComoRepresentativo = opt.id_ano_escolar > atual.id_ano_escolar

  tmp[salaId].set(opt.id_disciplina, {
    ...atual,
    quantidade_protocolos: soma,
    ...(usarOptComoRepresentativo
      ? {
          id_ano_escolar: opt.id_ano_escolar,
          ano_nome: opt.ano_nome,
          id_config: opt.id_config,
        }
      : {}),
  })
})

const mapaFinal: Record<number, SalaDisciplinaAnoOption[]> = {}
Object.entries(tmp).forEach(([salaIdStr, mapDisc]) => {
  const salaId = Number(salaIdStr)
  const lista = Array.from(mapDisc.values()).map((o) => ({
    ...o,
    label: `${o.disciplina_nome} (protocolos: ${o.quantidade_protocolos})`,
  }))
  lista.sort((a, b) => a.label.localeCompare(b.label))
  mapaFinal[salaId] = lista
})

setConfigsPorSala(mapaFinal)

    } catch (e: any) {
      console.error(e)
      erro('Falha ao carregar dados-base do atendimento.')
    } finally {
      if (mountedRef.current) setCarregandoBase(false)
    }
  }, [supabase, usuario?.id, erro])

  // ======= sessões =======
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
              usuarios ( name, foto_url )
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
              anos_escolares ( nome_ano ),
              matriculas ( numero_inscricao )
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
          const mat = first(prog?.matriculas) as any

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
            aluno_foto_url: alunoUser?.foto_url ?? null,
            numero_inscricao: mat?.numero_inscricao ?? null,

            sala_nome: sala?.nome ?? (s.id_sala ? `Sala #${s.id_sala}` : '-'),
            sala_tipo: sala?.tipo_sala ?? '-',

            disciplina_nome: disc?.nome_disciplina ?? '-',
            ano_nome: ano?.nome_ano ?? '-',

            id_disciplina: prog?.id_disciplina != null ? Number(prog.id_disciplina) : null,
            id_ano_escolar: prog?.id_ano_escolar != null ? Number(prog.id_ano_escolar) : null,
          }
        })

        setSessoes(lista)

        const r: Record<number, string> = {}
        lista.forEach((s) => {
          r[s.id_sessao] = s.resumo_atividades ?? ''
        })
        setResumoPorSessao(r)
      } catch (e: any) {
        console.error(e)
        erro('Erro ao carregar sessões de atendimento.')
      } finally {
        if (mountedRef.current) setCarregandoSessoes(false)
      }
    },
    [supabase, erro]
  )

  const finalizarSessaoRapido = useCallback(
    async (sessao: SessaoView) => {
      if (!supabase) return
      if (!idProfessor) return
      if (sessao.hora_saida) return

      try {
        const agora = new Date().toISOString()
        const resumo = (resumoPorSessao[sessao.id_sessao] ?? '').trim()

        const { error: errUp } = await supabase
          .from('sessoes_atendimento')
          .update({
            hora_saida: agora,
            resumo_atividades: resumo ? resumo : null,
          })
          .eq('id_sessao', sessao.id_sessao)

        if (errUp) throw errUp

        sucesso('Atendimento finalizado.')
        await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)
      } catch (e: any) {
        console.error(e)
        erro('Falha ao finalizar atendimento.')
      }
    },
    [supabase, idProfessor, resumoPorSessao, sucesso, erro, carregarSessoes, filtroDataInicio, filtroDataFim]
  )

  // ======= registros =======
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
    } catch (e: any) {
      console.error(e)
      erro('Falha ao salvar o resumo da sessão.')
    } finally {
      if (mountedRef.current) setSalvandoSessao(false)
    }
  }, [supabase, sessaoAtual, sucesso, erro])

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
      setSessaoAtual((old) => (old ? { ...old, hora_saida: agora } : old))
    } catch (e: any) {
      console.error(e)
      erro('Falha ao encerrar a sessão.')
    } finally {
      if (mountedRef.current) setSalvandoSessao(false)
    }
  }, [supabase, sessaoAtual, sucesso, erro, info])

  // ======= regras matricula/progresso =======
  const obterIdStatusMatriculaAtiva = useCallback((): number | null => {
    const ativa = statusMatriculas.find((s) => normalizarTexto(s.nome).includes('ativa'))
    return ativa ? Number(ativa.id_status_matricula) : null
  }, [statusMatriculas])

  const obterIdStatusDisciplinaDefault = useCallback((): number | null => {
    const cursando = statusDisciplinas.find((s) => normalizarTexto(s.nome).includes('cursando'))
    if (cursando) return Number(cursando.id_status_disciplina)

    const aCursar = statusDisciplinas.find((s) => normalizarTexto(s.nome).includes('a cursar'))
    if (aCursar) return Number(aCursar.id_status_disciplina)

    return statusDisciplinas[0]?.id_status_disciplina ? Number(statusDisciplinas[0].id_status_disciplina) : null
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

  // ======= buscar aluno (nome ou RA) =======
  const buscarAlunos = useCallback(
    async (termo: string) => {
      if (!supabase) return
      const t = termo.trim()

      if (t.length < 2) {
        setOpcoesAluno([])
        return
      }

      setBuscandoAlunos(true)
      try {
        // ✅ Busca NUMÉRICA: serve tanto para RA (numero_inscricao) quanto para ID interno (id_matricula)
        if (isBuscaPorRA(t)) {
          const digitos = extrairDigitos(t)
          if (digitos.length < 2) {
            setOpcoesAluno([])
            return
          }

          const selectSql = `
            id_matricula,
            numero_inscricao,
            id_aluno,
            ano_letivo,
            data_matricula,
            alunos (
              id_aluno,
              usuarios ( name, email, foto_url )
            )
          `

          // 1) sempre tenta RA por "contém"
          const orParts: string[] = [`numero_inscricao.ilike.%${digitos}%`]

          // 2) também tenta pelo id_matricula (PK) quando fizer sentido (evita overflow/bagunça)
          const idMat = Number(digitos)
          if (Number.isFinite(idMat) && idMat > 0 && idMat <= 2147483647) {
            orParts.push(`id_matricula.eq.${idMat}`)
          }

          const { data, error: err } = await supabase
            .from('matriculas')
            .select(selectSql)
            .or(orParts.join(','))
            .order('ano_letivo', { ascending: false })
            .order('data_matricula', { ascending: false })
            .limit(25)

          if (err) throw err

          const opts: AlunoBuscaOption[] = (data ?? []).map((m: any) => {
            const aluno = first(m?.alunos) as any
            const u = first(aluno?.usuarios) as any

            return {
              id_aluno: Number(m.id_aluno),
              nome: u?.name ?? `Aluno #${m.id_aluno}`,
              email: u?.email ?? null,
              foto_url: u?.foto_url ?? null,
              id_matricula: Number(m.id_matricula),
              numero_inscricao: m.numero_inscricao ? String(m.numero_inscricao) : null,
            }
          })

          setOpcoesAluno(opts)
          return
        }

        // Nome (mantém igual ao seu)
        const { data, error: err } = await supabase
          .from('alunos')
          .select(
            `
              id_aluno,
              usuarios!inner ( name, email, foto_url ),
              matriculas ( id_matricula, numero_inscricao, ano_letivo, data_matricula, id_status_matricula )
            `
          )
          .ilike('usuarios.name', `%${t}%`)
          .order('id_aluno', { ascending: false })
          .limit(25)

        if (err) throw err

        const opts: AlunoBuscaOption[] = (data ?? []).map((a: any) => {
          const u = first(a?.usuarios) as any
          const mats = (a?.matriculas ?? [])
            .map((m: any) => ({
              id_matricula: Number(m.id_matricula),
              numero_inscricao: m.numero_inscricao ? String(m.numero_inscricao) : null,
              ano_letivo: Number(m.ano_letivo ?? 0),
              data_matricula: m.data_matricula ? String(m.data_matricula) : '1900-01-01',
            }))
            .sort((x: any, y: any) => {
              if (y.ano_letivo !== x.ano_letivo) return y.ano_letivo - x.ano_letivo
              return new Date(y.data_matricula).getTime() - new Date(x.data_matricula).getTime()
            })

          const top = mats[0] ?? null

          return {
            id_aluno: Number(a.id_aluno),
            nome: u?.name ?? `Aluno #${a.id_aluno}`,
            email: u?.email ?? null,
            foto_url: u?.foto_url ?? null,
            id_matricula: top?.id_matricula ?? null,
            numero_inscricao: top?.numero_inscricao ?? null,
          }
        })

        setOpcoesAluno(opts)
      } catch (e: any) {
        console.error(e)
        erro('Falha ao buscar alunos.')
      } finally {
        if (mountedRef.current) setBuscandoAlunos(false)
      }
    },
    [supabase, erro]
  )


  // ======= carregar fichas do aluno (progresso) =======
  const carregarFichasDoAlunoNaSala = useCallback(
    async (aluno: AlunoBuscaOption, salaId: number) => {
      if (!supabase) return

      setCarregandoFichas(true)
      try {
        const idMatricula = aluno.id_matricula ?? (await obterMatriculaPreferencial(aluno.id_aluno))
        if (!idMatricula) {
          setProgressosAlunoTodos([])
          setFichasAbertasNaSala([])
          setQtdDisciplinasAbertas(null)
          setProgressoEscolhidoId(null)
          setConfigSelecionada(null)
          setUsarFichaExistente(false)
          aviso('Este aluno não possui matrícula cadastrada. A Secretaria deve cadastrar a matrícula primeiro.')
          return
        }

        const { data, error: err } = await supabase
          .from('progresso_aluno')
          .select(
            `
            id_progresso,
            id_disciplina,
            id_ano_escolar,
            id_status_disciplina,
            status_disciplina_aluno ( nome ),
            disciplinas ( nome_disciplina ),
            anos_escolares ( nome_ano )
          `
          )
          .eq('id_matricula', idMatricula)

        if (err) throw err

        const todos: ProgressoOption[] = (data ?? []).map((p: any) => {
          const st = first(p?.status_disciplina_aluno) as any
          const disc = first(p?.disciplinas) as any
          const ano = first(p?.anos_escolares) as any

          const disciplinaNome = disc?.nome_disciplina ? String(disc.nome_disciplina) : `Disciplina #${p.id_disciplina}`
          const anoNome = ano?.nome_ano ? String(ano.nome_ano) : `Ano #${p.id_ano_escolar}`
          const statusNome = st?.nome ? String(st.nome) : null

          return {
            id_progresso: Number(p.id_progresso),
            id_disciplina: Number(p.id_disciplina),
            id_ano_escolar: Number(p.id_ano_escolar),
            disciplina_nome: disciplinaNome,
            ano_nome: anoNome,
            status_nome: statusNome,
            // ✅ não precisa dividir por ano na lista (mantém o ano no objeto, mas o label fica simples)
            label: `${disciplinaNome}${statusNome ? ` • ${statusNome}` : ''}`,
          }
        })

        setProgressosAlunoTodos(todos)

        const abertasRaw = todos.filter((p) => isStatusDisciplinaAberta(p.status_nome ?? ''))

        // ✅ conta disciplinas abertas (únicas), não “anos”
        const qtdAbertasDisc = new Set(abertasRaw.map((p) => p.id_disciplina)).size
        setQtdDisciplinasAbertas(qtdAbertasDisc)

        // ✅ filtro das disciplinas que existem na sala (sem dividir por ano)
        const setDisciplinasSala = new Set((configsPorSala[salaId] ?? []).map((c) => c.id_disciplina))

        // ✅ junta abertas por disciplina e mantém 1 por disciplina
        const abertasPorDisc = agruparAbertasPorDisciplina(abertasRaw)
        const abertasNaSala = abertasPorDisc.filter((p) => setDisciplinasSala.has(p.id_disciplina))
        setFichasAbertasNaSala(abertasNaSala)

        if (abertasNaSala.length > 0) {
          setUsarFichaExistente(true)
          setProgressoEscolhidoId(abertasNaSala[0].id_progresso)
          setConfigSelecionada(null)
        } else {
          setUsarFichaExistente(false)
          setProgressoEscolhidoId(null)
        }
      } catch (e: any) {
        console.error(e)
        erro('Falha ao verificar fichas do aluno.')
      } finally {
        if (mountedRef.current) setCarregandoFichas(false)
      }
    },
    [supabase, obterMatriculaPreferencial, configsPorSala, aviso, erro]
  )

  // ======= abrir fluxo iniciar atendimento =======
  const abrirFluxoNovoAtendimento = useCallback(() => {
    if (carregandoBase) return
    if (!idProfessor) {
      aviso('Professor não identificado.')
      return
    }
    if (minhasSalas.length === 0) {
      aviso('Você não tem salas configuradas.')
      return
    }

    // reset
    setAlunoInput('')
    setOpcoesAluno([])
    setAlunoSelecionado(null)
    setProgressosAlunoTodos([])
    setFichasAbertasNaSala([])
    setQtdDisciplinasAbertas(null)
    setUsarFichaExistente(true)
    setProgressoEscolhidoId(null)
    setConfigSelecionada(null)
    setNovoHoraEntrada(agoraParaInputDateTimeLocal())
    setNovoResumo('')
    setDlgConfirmAbrirFicha(false)

    if (minhasSalas.length === 1) {
      setSalaAtendimentoId(minhasSalas[0].id_sala)
      setDlgNovoAtendimento(true)
    } else {
      setSalaAtendimentoId(null)
      setDlgEscolherSala(true)
    }
  }, [carregandoBase, idProfessor, minhasSalas, aviso])

  const escolherSalaEContinuar = useCallback((idSala: number) => {
    setSalaAtendimentoId(idSala)
    setDlgEscolherSala(false)
    setDlgNovoAtendimento(true)
  }, [])

  // debounce de busca aluno
  useEffect(() => {
    if (!dlgNovoAtendimento) return
    const t = alunoInput.trim()
    const h = setTimeout(() => {
      void buscarAlunos(t)
    }, 350)
    return () => clearTimeout(h)
  }, [alunoInput, dlgNovoAtendimento, buscarAlunos])

  // ao escolher aluno + sala, carrega fichas
  useEffect(() => {
    if (!dlgNovoAtendimento) return
    if (!alunoSelecionado?.id_aluno) return
    if (!salaAtendimentoId) return
    void carregarFichasDoAlunoNaSala(alunoSelecionado, salaAtendimentoId)
  }, [dlgNovoAtendimento, alunoSelecionado?.id_aluno, salaAtendimentoId, carregarFichasDoAlunoNaSala])

  const podeAbrirNovaDisciplina = useMemo(() => {
    if (podeAbrirMaisQue3) return true
    if (qtdDisciplinasAbertas == null) return true
    return qtdDisciplinasAbertas < 3
  }, [podeAbrirMaisQue3, qtdDisciplinasAbertas])

  const criarAtendimento = useCallback(
    async (opts?: { confirmarCriacaoFicha?: boolean }) => {
      if (!supabase) return
      if (!usuario?.id) return
      if (!idProfessor) return

      if (!salaAtendimentoId) {
        aviso('Selecione a sala.')
        return
      }
      if (!alunoSelecionado?.id_aluno) {
        aviso('Selecione o aluno.')
        return
      }
      if (!novoHoraEntrada?.trim()) {
        aviso('Informe a hora de entrada.')
        return
      }

      setSalvandoNovoAtendimento(true)
      try {
        const idMatricula = alunoSelecionado.id_matricula ?? (await obterMatriculaPreferencial(alunoSelecionado.id_aluno))
        if (!idMatricula) {
          aviso('Este aluno não possui matrícula cadastrada.')
          return
        }

        let idProgresso: number | null = null

        if (usarFichaExistente) {
          if (!progressoEscolhidoId) {
            aviso('Selecione uma ficha aberta da sala.')
            return
          }
          idProgresso = progressoEscolhidoId
        } else {
          if (!configSelecionada) {
            aviso('Selecione a disciplina para abrir ficha.')
            return
          }

          // ✅ como agora não divide por ano, procura qualquer progresso daquela disciplina
          const existente = escolherProgressoPorDisciplina(progressosAlunoTodos, configSelecionada.id_disciplina)

          // ✅ Se NÃO existe progresso => precisa confirmar “abrir ficha”
          if (!existente && !opts?.confirmarCriacaoFicha) {
            if (!podeAbrirNovaDisciplina) {
              erro('Este aluno já possui 3 ou mais disciplinas abertas. Apenas ADMIN/DIRETOR/COORDENAÇÃO pode abrir nova disciplina.')
              return
            }
            setDlgConfirmAbrirFicha(true)
            return
          }

          if (!existente) {
            if (!podeAbrirNovaDisciplina) {
              erro('Este aluno já possui 3 ou mais disciplinas abertas. Apenas ADMIN/DIRETOR/COORDENAÇÃO pode abrir nova disciplina.')
              return
            }
          }

          // cria (ou reaproveita) com o ano representativo da config “melhor” da disciplina na sala
          idProgresso = existente
            ? existente.id_progresso
            : await garantirProgresso(idMatricula, configSelecionada.id_disciplina, configSelecionada.id_ano_escolar)
        }

        const horaEntradaISO = new Date(novoHoraEntrada).toISOString()

        const { data: nova, error: errIns } = await supabase
          .from('sessoes_atendimento')
          .insert({
            id_aluno: alunoSelecionado.id_aluno,
            id_professor: idProfessor,
            id_sala: salaAtendimentoId,
            id_progresso: idProgresso,
            hora_entrada: horaEntradaISO,
            resumo_atividades: novoResumo.trim() ? novoResumo.trim() : null,
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
          alunos ( usuarios ( name, foto_url ) ),
          salas_atendimento ( nome, tipo_sala ),
          progresso_aluno (
            id_disciplina,
            id_ano_escolar,
            disciplinas ( nome_disciplina ),
            anos_escolares ( nome_ano ),
            matriculas ( numero_inscricao )
          )
        `
          )
          .single()

        if (errIns) throw errIns

        sucesso('Atendimento iniciado.')

        setDlgConfirmAbrirFicha(false)
        setDlgNovoAtendimento(false)

        await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)

        const aluno = first(nova?.alunos) as any
        const alunoUser = first(aluno?.usuarios) as any
        const sala = first(nova?.salas_atendimento) as any
        const prog = first(nova?.progresso_aluno) as any
        const disc = first(prog?.disciplinas) as any
        const ano = first(prog?.anos_escolares) as any
        const mat = first(prog?.matriculas) as any

        const sessaoMontada: SessaoView = {
          id_sessao: Number(nova.id_sessao),
          id_aluno: Number(nova.id_aluno),
          id_professor: Number(nova.id_professor),
          id_progresso: nova.id_progresso != null ? Number(nova.id_progresso) : null,
          id_sala: nova.id_sala != null ? Number(nova.id_sala) : null,
          hora_entrada: String(nova.hora_entrada),
          hora_saida: nova.hora_saida ? String(nova.hora_saida) : null,
          resumo_atividades: nova.resumo_atividades ?? null,
          aluno_nome: alunoUser?.name ?? alunoSelecionado.nome,
          aluno_foto_url: alunoUser?.foto_url ?? null,
          numero_inscricao: mat?.numero_inscricao ?? alunoSelecionado.numero_inscricao ?? null,
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
        erro(`Falha ao iniciar atendimento: ${e?.message || 'erro desconhecido'}`)
      } finally {
        if (mountedRef.current) setSalvandoNovoAtendimento(false)
      }
    },
    [
      supabase,
      usuario?.id,
      idProfessor,
      salaAtendimentoId,
      alunoSelecionado,
      novoHoraEntrada,
      novoResumo,
      usarFichaExistente,
      progressoEscolhidoId,
      configSelecionada,
      progressosAlunoTodos,
      podeAbrirNovaDisciplina,
      obterMatriculaPreferencial,
      garantirProgresso,
      carregarSessoes,
      filtroDataInicio,
      filtroDataFim,
      carregarRegistrosDaSessao,
      sucesso,
      aviso,
      erro,
    ]
  )

  // ======= filtros =======
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
    if (idProfessor) await carregarSessoes(idProfessor, hoje, hoje)
  }, [idProfessor, carregarSessoes])

  // ======= registro dialog =======
  const abrirDialogNovoRegistro = useCallback(() => {
    if (!sessaoAtual) return

    const usados = new Set(registros.map((r) => r.numero_protocolo))
    let sugestao = 1

    const limite = limiteProtocolosSessao ?? 50
    while (usados.has(sugestao) && sugestao <= limite) sugestao += 1

    setRegistroEditandoId(null)
    setRegNumero(sugestao <= limite ? String(sugestao) : '')
    setRegTipoId('')
    setRegStatus('A fazer')
    setRegNota('')
    setRegAdaptada(false)
    setRegSintese('')
    setDlgRegistro(true)
  }, [sessaoAtual, registros, limiteProtocolosSessao])

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

    const limite = limiteProtocolosSessao ?? null
    if (limite != null && (numero < 1 || numero > limite)) return { ok: false, msg: `Permitido: 1 a ${limite}.` }

    const jaUsado = registros.some((x) => x.numero_protocolo === numero && x.id_atividade !== registroEditandoId)
    if (jaUsado) return { ok: false, msg: 'Já existe um registro com este número na sessão.' }

    return { ok: true }
  }, [sessaoAtual, regNumero, regTipoId, regStatus, limiteProtocolosSessao, registros, registroEditandoId])

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

  // ======= effects =======
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

  // ======= UI =======
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
            Inicie atendimentos por sala e lance protocolos (estilo SIGE‑CEJA V2).
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={abrirFluxoNovoAtendimento}
            disabled={carregandoBase || !idProfessor}
          >
            Iniciar atendimento
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

          <FormControl size="small" sx={{ width: { xs: '100%', sm: 260 } }}>
            <InputLabel id="filtro-sala-label">Sala</InputLabel>
            <Select
              labelId="filtro-sala-label"
              label="Sala"
              value={filtroSalaId as any}
              onChange={(e) => {
                const v = e.target.value as any
                setFiltroSalaId(v === 'todas' ? 'todas' : Number(v))
              }}
            >
              <MenuItem value="todas">
                <em>Todas</em>
              </MenuItem>
              {minhasSalas.map((s) => (
                <MenuItem key={s.id_sala} value={s.id_sala}>
                  {s.nome} ({s.tipo_sala})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Buscar (aluno, RA, disciplina, sala...)"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            sx={{ flex: 1, minWidth: { xs: '100%', md: 340 } }}
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Button variant="outlined" onClick={resetarParaHoje} startIcon={<WarningAmberIcon />}>
              Hoje
            </Button>
            <Button variant="contained" onClick={aplicarFiltros} startIcon={<CheckCircleOutlineIcon />} disabled={!idProfessor}>
              Aplicar
            </Button>
          </Stack>
        </Stack>

        {carregandoSessoes && <LinearProgress sx={{ mt: 2 }} />}

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {/* Abertos */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Alunos em Atendimento ({sessoesAbertas.length})
              </Typography>
              <Chip size="small" label="Abertos" color="warning" />
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {carregandoBase ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : sessoesAbertas.length === 0 ? (
              <Alert severity="info">Nenhum atendimento em andamento no filtro atual.</Alert>
            ) : (
              <Box sx={cardGridSx}>
                {sessoesAbertas.map((s) => (
                  <Card
                    key={s.id_sessao}
                    elevation={2}
                    onClick={() => void abrirSessao(s)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                        <Avatar
                          src={s.aluno_foto_url ?? undefined}
                          alt={s.aluno_nome}
                          sx={{
                            width: 56,
                            height: 56,
                            border: '2px solid',
                            borderColor: 'primary.main',
                          }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }} title={s.aluno_nome}>
                            {s.aluno_nome}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {renderNumeroInscricao({ numero_inscricao: s.numero_inscricao })}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                        <Chip label={s.disciplina_nome ?? '-'} color="primary" variant="outlined" size="small" />
                        <Chip label={s.ano_nome ?? '-'} variant="outlined" size="small" />
                        <Chip label={s.sala_nome ?? '-'} variant="outlined" size="small" icon={<MeetingRoomIcon />} />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" display="block">
                        Entrada: {formatarDataHoraBR(s.hora_entrada)}
                      </Typography>

                      <TextField
                        label="Resumo (opcional)"
                        fullWidth
                        multiline
                        minRows={2}
                        size="small"
                        value={resumoPorSessao[s.id_sessao] ?? ''}
                        onChange={(e) =>
                          setResumoPorSessao((old) => ({
                            ...old,
                            [s.id_sessao]: e.target.value,
                          }))
                        }
                        onClick={(e) => e.stopPropagation()}
                        sx={{ mt: 1.2 }}
                      />
                    </CardContent>

                    <Divider />

                    <CardActions sx={{ p: 1.2 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          sx={{ flex: 1 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            void abrirSessao(s)
                          }}
                        >
                          Abrir
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          sx={{ flex: 1 }}
                          disabled={!s.id_progresso}
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirFichaAcompanhamento(s.id_progresso)
                          }}
                        >
                          Abrir Ficha
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          startIcon={<CheckCircleOutlineIcon />}
                          sx={{ flex: 1 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            void finalizarSessaoRapido(s)
                          }}
                        >
                          Finalizar
                        </Button>
                      </Stack>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>

          {/* Histórico */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Histórico ({sessoesHistorico.length})
              </Typography>
              <Chip size="small" label="Encerrados" color="success" />
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {carregandoBase ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : sessoesHistorico.length === 0 ? (
              <Alert severity="info">Nenhum atendimento encerrado no filtro atual.</Alert>
            ) : (
              <Box sx={cardGridSx}>
                {sessoesHistorico.map((s) => (
                  <Card
                    key={s.id_sessao}
                    elevation={1}
                    onClick={() => void abrirSessao(s)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                        <Avatar src={s.aluno_foto_url ?? undefined} alt={s.aluno_nome} sx={{ width: 52, height: 52 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800 }} title={s.aluno_nome}>
                            {s.aluno_nome}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {renderNumeroInscricao({ numero_inscricao: s.numero_inscricao })}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                        <Chip label={s.disciplina_nome ?? '-'} color="primary" variant="outlined" size="small" />
                        <Chip label={s.ano_nome ?? '-'} variant="outlined" size="small" />
                        <Chip label={s.sala_nome ?? '-'} variant="outlined" size="small" icon={<MeetingRoomIcon />} />
                      </Stack>

                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatarDataHoraBR(s.hora_entrada)} → {formatarDataHoraBR(s.hora_saida)}
                      </Typography>

                      {s.resumo_atividades ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {s.resumo_atividades}
                        </Typography>
                      ) : null}
                    </CardContent>

                    <Divider />

                    <CardActions sx={{ p: 1.2 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          sx={{ flex: 1 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            void abrirSessao(s)
                          }}
                        >
                          Abrir
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          sx={{ flex: 1 }}
                          disabled={!s.id_progresso}
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirFichaAcompanhamento(s.id_progresso)
                          }}
                        >
                          Abrir Ficha
                        </Button>
                      </Stack>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Stack>
      </Paper>

      {/* Dialog: escolher sala */}
      <Dialog open={dlgEscolherSala} onClose={() => setDlgEscolherSala(false)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          Qual sala você vai atender?
          <IconButton onClick={() => setDlgEscolherSala(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Você está lotado(a) em mais de uma sala. Selecione abaixo para iniciar o atendimento.
          </Alert>

          <Box sx={cardGridSx}>
            {minhasSalas.map((s) => (
              <Card
                key={s.id_sala}
                elevation={2}
                onClick={() => escolherSalaEContinuar(s.id_sala)}
                sx={{
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                  border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35)}`,
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <MeetingRoomIcon />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }} noWrap title={s.nome}>
                        {s.nome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tipo: {s.tipo_sala}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgEscolherSala(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: iniciar atendimento */}
      <Dialog open={dlgNovoAtendimento} onClose={() => setDlgNovoAtendimento(false)} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          Iniciar atendimento
          <IconButton onClick={() => setDlgNovoAtendimento(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              Busque o aluno por <strong>nome</strong> ou <strong>RA</strong>. A sala e as disciplinas vêm da sua lotação.
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35),
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>Sala</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {minhasSalas.find((x) => x.id_sala === salaAtendimentoId)?.nome ?? '-'} •{' '}
                      {minhasSalas.find((x) => x.id_sala === salaAtendimentoId)?.tipo_sala ?? '-'}
                    </Typography>
                  </Box>
                </Stack>

                {minhasSalas.length > 1 ? (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setDlgNovoAtendimento(false)
                      setDlgEscolherSala(true)
                    }}
                  >
                    Trocar sala
                  </Button>
                ) : null}
              </Stack>
            </Paper>

            <Autocomplete
              options={opcoesAluno}
              value={alunoSelecionado}
              inputValue={alunoInput}
              onInputChange={(_, v) => setAlunoInput(v)}
              onChange={(_, v) => setAlunoSelecionado(v)}
              loading={buscandoAlunos}
              isOptionEqualToValue={(a, b) => a.id_aluno === b.id_aluno && (a.id_matricula ?? null) === (b.id_matricula ?? null)}
              getOptionLabel={(o) => o?.nome ?? ''}
              noOptionsText={alunoInput.trim().length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum aluno encontrado'}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={`${option.id_aluno}-${option.id_matricula ?? 'x'}`}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                    <Avatar src={option.foto_url ?? undefined} alt={option.nome} sx={{ width: 36, height: 36 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap sx={{ fontWeight: 800 }}>
                        {option.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {renderNumeroInscricao(option)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Aluno (nome) ou Matrícula (RA)"
                  placeholder="Ex.: Maria / 202500123 / 6089"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {buscandoAlunos ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                size="small"
                label="Hora de entrada"
                type="datetime-local"
                value={novoHoraEntrada}
                onChange={(e) => setNovoHoraEntrada(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                size="small"
                label="Resumo inicial (opcional)"
                value={novoResumo}
                onChange={(e) => setNovoResumo(e.target.value)}
              />
            </Stack>

            {alunoSelecionado && salaAtendimentoId ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                    <Typography sx={{ fontWeight: 900 }}>Ficha / Disciplina</Typography>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      {qtdDisciplinasAbertas != null ? (
                        <Chip
                          size="small"
                          label={`Disciplinas abertas: ${qtdDisciplinasAbertas}`}
                          color={podeAbrirNovaDisciplina ? 'info' : 'warning'}
                          variant="outlined"
                        />
                      ) : null}

                      {idProgressoSelecionadoParaAbrirFicha ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          onClick={() => abrirFichaAcompanhamento(idProgressoSelecionadoParaAbrirFicha)}
                        >
                          Abrir Ficha
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>

                  {carregandoFichas ? <LinearProgress /> : null}

                  {!carregandoFichas && fichasAbertasNaSala.length === 0 ? (
                    <Alert severity="warning">
                      Nenhuma <strong>ficha aberta</strong> para este aluno nesta sala.
                      <br />
                      {podeAbrirNovaDisciplina || podeAbrirMaisQue3 ? (
                        <>Você pode abrir uma nova disciplina.</>
                      ) : (
                        <>O aluno já tem 3 ou mais disciplinas abertas — somente ADMIN/DIRETOR/COORDENAÇÃO pode abrir mais.</>
                      )}
                    </Alert>
                  ) : null}

                  <FormControlLabel
                    control={
                      <Switch
                        checked={usarFichaExistente}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setUsarFichaExistente(checked)
                          if (checked) {
                            setConfigSelecionada(null)
                            setProgressoEscolhidoId(fichasAbertasNaSala[0]?.id_progresso ?? null)
                          } else {
                            setProgressoEscolhidoId(null)
                          }
                        }}
                        disabled={fichasAbertasNaSala.length === 0}
                      />
                    }
                    label="Usar ficha aberta existente (na sala)"
                  />

                  {usarFichaExistente ? (
                    <Autocomplete
                      options={fichasAbertasNaSala}
                      value={fichasAbertasNaSala.find((x) => x.id_progresso === progressoEscolhidoId) ?? null}
                      onChange={(_, v) => setProgressoEscolhidoId(v?.id_progresso ?? null)}
                      getOptionLabel={(o) => o.label}
                      renderInput={(params) => <TextField {...params} label="Ficha aberta na sala" size="small" />}
                      noOptionsText="Nenhuma ficha aberta na sala"
                    />
                  ) : (
                    <>
                      <Alert severity="info">
                        Selecione a <strong>disciplina</strong> da sala para abrir (ou reaproveitar, se já existir).
                        <br />
                        Se ainda não existir ficha, vamos pedir confirmação antes de criar.
                      </Alert>

                      <Autocomplete
                        options={configsDaSalaSelecionada}
                        value={configSelecionada}
                        onChange={(_, v) => setConfigSelecionada(v)}
                        getOptionLabel={(o) => o.label}
                        renderInput={(params) => <TextField {...params} label="Disciplina (da sala)" size="small" />}
                        noOptionsText="Nenhuma disciplina configurada para esta sala"
                      />

                      {!podeAbrirNovaDisciplina && !podeAbrirMaisQue3 ? (
                        <Alert severity="error">
                          Bloqueado: aluno com 3+ disciplinas abertas. Apenas ADMIN/DIRETOR/COORDENAÇÃO pode abrir nova disciplina.
                        </Alert>
                      ) : null}
                    </>
                  )}
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgNovoAtendimento(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void criarAtendimento()} disabled={salvandoNovoAtendimento}>
            {salvandoNovoAtendimento ? 'Iniciando...' : 'Iniciar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Confirmar abertura de ficha (quando vai criar progresso novo) */}
      <Dialog open={dlgConfirmAbrirFicha} onClose={() => setDlgConfirmAbrirFicha(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          Confirmar abertura de ficha
          <IconButton onClick={() => setDlgConfirmAbrirFicha(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta disciplina ainda <strong>não possui ficha</strong> para este aluno.
            <br />
            Ao confirmar, o sistema vai <strong>criar a ficha (progresso)</strong> e iniciar o atendimento.
          </Alert>

          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Aluno:</strong> {alunoSelecionado?.nome ?? '-'} ({renderNumeroInscricao(alunoSelecionado ?? {})})
            </Typography>
            <Typography variant="body2">
              <strong>Sala:</strong> {minhasSalas.find((x) => x.id_sala === salaAtendimentoId)?.nome ?? '-'}
            </Typography>
            <Typography variant="body2">
              <strong>Disciplina:</strong> {configSelecionada ? `${configSelecionada.disciplina_nome}` : '-'}
            </Typography>

            {!podeAbrirMaisQue3 ? (
              <Typography variant="caption" color="text.secondary">
                * Regra: professor só pode ter até 3 disciplinas abertas por aluno. (ADMIN/DIRETOR/COORDENAÇÃO ignora)
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgConfirmAbrirFicha(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setDlgConfirmAbrirFicha(false)
              void criarAtendimento({ confirmarCriacaoFicha: true })
            }}
          >
            Abrir ficha e iniciar
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
                    <Chip size="small" label={`${sessaoAtual.disciplina_nome ?? '-'} — ${sessaoAtual.ano_nome ?? '-'}`} variant="outlined" />
                    {limiteProtocolosSessao != null ? <Chip size="small" label={`Protocolos: 1..${limiteProtocolosSessao}`} variant="outlined" /> : null}
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
                    <Button variant="outlined" startIcon={<DescriptionIcon />} disabled={!sessaoAtual.id_progresso} onClick={() => abrirFichaAcompanhamento(sessaoAtual.id_progresso)}>
                      Abrir Ficha
                    </Button>

                    <Button variant="outlined" onClick={() => void salvarResumoSessao()} disabled={salvandoSessao}>
                      Salvar resumo
                    </Button>

                    <Button variant="contained" color="warning" onClick={() => void encerrarSessaoAgora()} disabled={salvandoSessao || Boolean(sessaoAtual.hora_saida)}>
                      Encerrar sessão
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                  Protocolos / Atividades
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={abrirDialogNovoRegistro} disabled={!sessaoAtual.id_progresso}>
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
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between">
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
                O número do protocolo é limitado pela configuração da sala (via <code>config_disciplina_ano</code>).
              </Alert>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="reg-numero-label">Nº do protocolo</InputLabel>
                  <Select labelId="reg-numero-label" label="Nº do protocolo" value={regNumero} onChange={(e) => setRegNumero(String(e.target.value))}>
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
                  <Select labelId="reg-tipo-label" label="Tipo de protocolo" value={regTipoId} onChange={(e) => setRegTipoId(String(e.target.value))}>
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
                  <Select labelId="reg-status-label" label="Status" value={regStatus} onChange={(e) => setRegStatus(String(e.target.value))}>
                    <MenuItem value="A fazer">A fazer</MenuItem>
                    <MenuItem value="Em andamento">Em andamento</MenuItem>
                    <MenuItem value="Concluída">Concluída</MenuItem>
                  </Select>
                </FormControl>

                <TextField fullWidth size="small" label="Nota (opcional)" value={regNota} onChange={(e) => setRegNota(e.target.value)} placeholder="Ex.: 8.5" />
              </Stack>

              <FormControlLabel control={<Switch checked={regAdaptada} onChange={(e) => setRegAdaptada(e.target.checked)} />} label="Atividade adaptada" />

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
                <Button variant="outlined" color="error" onClick={() => setConfirmDeleteId(registroEditandoId)} startIcon={<DeleteOutlineIcon />}>
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
