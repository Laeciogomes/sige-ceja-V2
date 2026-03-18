// src/paginas/painel-professor/AcompanhamentoPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  Alert,
  Autocomplete,
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

import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Autorenew'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import PhoneIcon from '@mui/icons-material/Phone'
import PlaceIcon from '@mui/icons-material/Place'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddIcon from '@mui/icons-material/Add'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import SchoolIcon from '@mui/icons-material/School'
import AvatarAlunoFicha from './ficha-acompanhamento/components/AvatarAlunoFicha'

// Contextos
import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import { useAuth } from '../../contextos/AuthContext'

// ✅ Pé-de-Meia (regra unificada)
import { avaliarPeDeMeia } from '../../utils/peDeMeia'

type SalaOption = { id_sala: number; nome: string; tipo_sala: string }

type DisciplinaOption = { id_disciplina: number; nome_disciplina: string }

type AusenteItem = {
  id_aluno: number
  id_matricula: number | null
  numero_inscricao: string | null

  aluno_nome: string
  aluno_foto_url?: string | null

  // dados para regra do Pé-de-Meia
  data_nascimento?: string | null
  data_matricula?: string | null
  ano_letivo?: number | null

  email?: string | null
  celular?: string | null
  cpf?: string | null

  logradouro?: string | null
  numero_endereco?: string | null
  bairro?: string | null
  municipio?: string | null
  cep?: string | null
  ponto_referencia?: string | null

  id_nivel_ensino?: number | null

  nis?: string | null
  possui_necessidade_especial?: boolean | null
  possui_beneficio_governo?: boolean | null

  ultima_visita?: string | null
  dias_sem_vir?: number | null

  ultima_sala_id?: number | null
  ultima_sala_nome?: string | null
  ultima_sala_tipo?: string | null

  ultima_disciplina_id?: number | null
  ultima_disciplina_nome?: string | null

  ultimo_acompanhamento_data?: string | null
  ultimo_acompanhamento_tipo?: string | null
  ultimo_acompanhamento_status?: string | null
  ultimo_acompanhamento_resumo?: string | null
}

type AcompRegistro = {
  id_acompanhamento: number
  id_aluno: number
  id_matricula: number | null
  id_sala: number | null
  id_disciplina: number | null
  data_evento: string
  tipo: string
  status: string
  observacao: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  usuarios?: { name?: string | null } | null
}

// helpers
function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function normalizarTexto(valor: string): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
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

function formatarTelefoneBR(valor: string | null | undefined): string {
  if (!valor) return '-'
  const dig = valor.replace(/\D/g, '')
  if (dig.length === 11) return `(${dig.slice(0, 2)}) ${dig.slice(2, 7)}-${dig.slice(7)}`
  if (dig.length === 10) return `(${dig.slice(0, 2)}) ${dig.slice(2, 6)}-${dig.slice(6)}`
  return valor
}

function nomeNivelEnsinoCurto(idNivel: number | null | undefined): string {
  if (idNivel === 1) return 'Fundamental'
  if (idNivel === 2) return 'Médio'
  return '-'
}

type PeDeMeiaResumoUI = {
  elegivel: boolean
  classificacao: string
  label: string
  color: 'success' | 'warning' | 'error' | 'default'
  variant: 'filled' | 'outlined'
  tooltip: string | null
}

function coletarMensagensPeDeMeia(res: any): { erros: string[]; avisos: string[] } {
  const erros: string[] = Array.isArray(res?.erros)
    ? res.erros
    : Array.isArray(res?.motivos)
      ? res.motivos
      : []

  const avisos: string[] = Array.isArray(res?.avisos) ? res.avisos : []

  return { erros, avisos }
}

function avaliarPeDeMeiaParaUI(a: AusenteItem): PeDeMeiaResumoUI {
  // CEJA: normalmente tratamos como EJA (ensino médio EJA)
  // Obs.: este cálculo é “triagem interna”; elegibilidade real é MEC/Caixa.
  const res: any = avaliarPeDeMeia(
    {
      id_nivel_ensino: a.id_nivel_ensino ?? null,
      cpf: a.cpf ?? null,
      data_nascimento: a.data_nascimento ?? null,
      nis: a.nis ?? null,
      possui_beneficio_governo: a.possui_beneficio_governo ?? null,
      data_matricula: a.data_matricula ?? null,
      ano_letivo: a.ano_letivo ?? null,
      modalidade: 'EJA',
    } as any,
    undefined,
  ) as any

  const { erros, avisos } = coletarMensagensPeDeMeia(res)
  const rawClass = String(res?.classificacao ?? 'INDETERMINADO')

  // Não marcamos como elegível sem conseguir checar idade (data_nascimento)
  const temDataNasc = Boolean((a.data_nascimento ?? '').trim())
  const classificacao = temDataNasc ? rawClass : rawClass === 'NAO_ELEGIVEL' ? 'NAO_ELEGIVEL' : 'INDETERMINADO'

  const elegivel = temDataNasc && classificacao.startsWith('ELEGIVEL')

  const tooltipParts: string[] = []
  if (!temDataNasc) {
    tooltipParts.push('Data de nascimento não informada (não dá para validar a faixa etária EJA 19–24).')
  }
  if (erros.length) tooltipParts.push(...erros)
  if (avisos.length) tooltipParts.push(...avisos)

  const tooltip = tooltipParts.length ? tooltipParts.join('\n') : null

  if (elegivel) {
    // Se é “ELEGIVEL_...” mostramos um alerta sutil
    if (classificacao !== 'ELEGIVEL') {
      return {
        elegivel: true,
        classificacao,
        label: 'Pé-de-Meia: elegível (limite)',
        color: 'warning',
        variant: 'filled',
        tooltip: tooltip ?? 'Elegível, mas com observação (ex.: idade limite durante o período).',
      }
    }

    return {
      elegivel: true,
      classificacao,
      label: 'Pé-de-Meia: elegível',
      color: 'success',
      variant: 'filled',
      tooltip,
    }
  }

  if (classificacao === 'INDETERMINADO') {
    return {
      elegivel: false,
      classificacao,
      label: 'Pé-de-Meia: conferir',
      color: 'warning',
      variant: 'outlined',
      tooltip: tooltip ?? 'Dados insuficientes no cadastro para confirmar elegibilidade.',
    }
  }

  return {
    elegivel: false,
    classificacao,
    label: 'Pé-de-Meia: não',
    color: 'default',
    variant: 'outlined',
    tooltip,
  }
}

function montarLinkWhatsApp(celular: string | null | undefined): string | null {
  if (!celular) return null
  const dig = celular.replace(/\D/g, '')
  if (!dig) return null
  const numero = dig.startsWith('55') ? dig : `55${dig}`
  return `https://wa.me/${numero}`
}

function formatarEndereco(item: AusenteItem): string {
  const partes = [item.logradouro, item.numero_endereco, item.bairro, item.municipio]
    .map((x) => (x ?? '').trim())
    .filter(Boolean)
  const base = partes.join(', ')
  const pr = (item.ponto_referencia ?? '').trim()
  return pr ? `${base} • Ref.: ${pr}` : base
}

export default function AcompanhamentoPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { usuario } = useAuth()
  const { sucesso, aviso, erro } = useNotificacaoContext()

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const papel = useMemo(() => String((usuario as any)?.papel ?? '').toUpperCase(), [usuario])
  const isProfessor = papel === 'PROFESSOR'

  // ======= filtros =======
  const [diasMinimo, setDiasMinimo] = useState<number>(15)
  const [incluirSemHistorico, setIncluirSemHistorico] = useState<boolean>(true)

  const [filtroSalaId, setFiltroSalaId] = useState<number | 'todas'>('todas')
  const [filtroDisciplinaId, setFiltroDisciplinaId] = useState<number | 'todas'>('todas')

  const [filtroTexto, setFiltroTexto] = useState<string>('')
  const [somentePeDeMeia, setSomentePeDeMeia] = useState<boolean>(false)

  // ======= base =======
  const [carregandoBase, setCarregandoBase] = useState(true)
  const [salas, setSalas] = useState<SalaOption[]>([])
  const [disciplinas, setDisciplinas] = useState<DisciplinaOption[]>([])
  const [salasPermitidasIds, setSalasPermitidasIds] = useState<Set<number>>(new Set())

  // ======= lista ausentes =======
  const [carregandoAusentes, setCarregandoAusentes] = useState(false)
  const [ausentes, setAusentes] = useState<AusenteItem[]>([])

  // ✅ cache da avaliação Pé-de-Meia
  const peDeMeiaPorAluno = useMemo(() => {
    const map = new Map<number, PeDeMeiaResumoUI>()
    for (const a of ausentes) {
      map.set(a.id_aluno, avaliarPeDeMeiaParaUI(a))
    }
    return map
  }, [ausentes])

  // ✅ filtro final (corrigido)
  const listaFiltrada = useMemo(() => {
    const q = normalizarTexto(filtroTexto)

    const lista = ausentes.filter((a) => {
      const matchTexto =
        q === '' ||
        normalizarTexto(a.aluno_nome ?? '').includes(q) ||
        normalizarTexto(a.numero_inscricao ?? '').includes(q) ||
        normalizarTexto(a.ultima_sala_nome ?? '').includes(q) ||
        normalizarTexto(a.ultima_disciplina_nome ?? '').includes(q)

      const pe = peDeMeiaPorAluno.get(a.id_aluno)
      const matchPeDeMeia = !somentePeDeMeia || Boolean(pe?.elegivel)

      const matchSala = filtroSalaId === 'todas' || a.ultima_sala_id === filtroSalaId
      const matchDisc = filtroDisciplinaId === 'todas' || a.ultima_disciplina_id === filtroDisciplinaId

      /**
       * ✅ CORREÇÃO DEFINITIVA:
       * - Se professor + Sala = "todas (minhas salas)", não pode eliminar "sem histórico".
       * - Se incluirSemHistorico=true e ultima_sala_id null => deixa passar.
       * - Se salasPermitidasIds ainda estiver vazio, não bloqueia (evita lista 0 enquanto carrega lotação).
       */
      const aplicarFiltroMinhasSalas = isProfessor && filtroSalaId === 'todas'

      const matchMinhasSalas = (() => {
        if (!aplicarFiltroMinhasSalas) return true

        // se ainda não carregou as salas permitidas, não bloqueia a lista inteira
        if (!salasPermitidasIds || salasPermitidasIds.size === 0) return true

        // aluno sem histórico: só deixa se "incluirSemHistorico" estiver ligado
        if (a.ultima_sala_id == null) return incluirSemHistorico

        // aluno com sala: precisa estar nas salas do professor
        return salasPermitidasIds.has(Number(a.ultima_sala_id))
      })()

      return matchTexto && matchPeDeMeia && matchSala && matchDisc && matchMinhasSalas
    })

    return lista
  }, [ausentes, filtroTexto, somentePeDeMeia, filtroSalaId, filtroDisciplinaId, isProfessor, salasPermitidasIds, incluirSemHistorico, peDeMeiaPorAluno])

  const totalSemContato = useMemo(
    () => listaFiltrada.filter((x) => normalizarTexto(x.ultimo_acompanhamento_status ?? '').includes('sem contato')).length,
    [listaFiltrada],
  )

  const totalComContato = useMemo(
    () => listaFiltrada.filter((x) => normalizarTexto(x.ultimo_acompanhamento_status ?? '').includes('com contato')).length,
    [listaFiltrada],
  )

  // ======= dialogs =======
  const [dlgAluno, setDlgAluno] = useState(false)
  const [alunoAtual, setAlunoAtual] = useState<AusenteItem | null>(null)

  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [historico, setHistorico] = useState<AcompRegistro[]>([])

  // novo registro
  const [novoTipo, setNovoTipo] = useState<string>('Contato')
  const [novoStatus, setNovoStatus] = useState<string>('Sem contato')
  const [novoDataEvento, setNovoDataEvento] = useState<string>(() => {
    const d = new Date()
    const yyyy = String(d.getFullYear())
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  })
  const [novoObs, setNovoObs] = useState<string>('')

  const [salvandoNovo, setSalvandoNovo] = useState(false)

  const [confirmDelId, setConfirmDelId] = useState<number | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // ======= load base =======
  const carregarBase = useCallback(async () => {
    if (!supabase) return
    if (!usuario?.id) return

    setCarregandoBase(true)
    try {
      // salas
      const { data: salasData, error: errSalas } = await supabase
        .from('salas_atendimento')
        .select('id_sala,nome,tipo_sala,is_ativa')
        .eq('is_ativa', true)
        .order('nome')

      if (errSalas) throw errSalas
      const salasOpts = (salasData ?? []).map((s: any) => ({
        id_sala: Number(s.id_sala),
        nome: String(s.nome),
        tipo_sala: String(s.tipo_sala),
      })) as SalaOption[]
      setSalas(salasOpts)

      // disciplinas
      const { data: discData, error: errDisc } = await supabase.from('disciplinas').select('id_disciplina,nome_disciplina').order('nome_disciplina')
      if (errDisc) throw errDisc
      const discOpts = (discData ?? []).map((d: any) => ({
        id_disciplina: Number(d.id_disciplina),
        nome_disciplina: String(d.nome_disciplina),
      })) as DisciplinaOption[]
      setDisciplinas(discOpts)

      // se for professor, limita salas permitidas
      if (isProfessor) {
        const { data: prof, error: errProf } = await supabase.from('professores').select('id_professor').eq('user_id', usuario.id).maybeSingle()
        if (errProf) throw errProf

        const pid = prof?.id_professor ? Number(prof.id_professor) : null

        if (pid) {
          const { data: lotacoes, error: errLot } = await supabase
            .from('professores_salas')
            .select('id_sala,ativo')
            .eq('id_professor', pid)
            .eq('ativo', true)

          if (errLot) throw errLot
          const ids = new Set<number>((lotacoes ?? []).map((r: any) => Number(r.id_sala)))
          setSalasPermitidasIds(ids)

          // se o usuário selecionou uma sala que não é dele, volta para "todas"
          if (filtroSalaId !== 'todas' && !ids.has(Number(filtroSalaId))) {
            setFiltroSalaId('todas')
          }
        }
      }
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar base do acompanhamento.')
    } finally {
      if (mountedRef.current) setCarregandoBase(false)
    }
  }, [supabase, usuario?.id, isProfessor, filtroSalaId, erro])

  // ======= carregar ausentes (RPC) =======
  const carregarAusentes = useCallback(async () => {
    if (!supabase) return

    setCarregandoAusentes(true)
    try {
      const { data, error } = await supabase.rpc('rpc_acompanhamento_ausentes', {
        p_dias: Number(diasMinimo) || 15,
        p_id_sala: filtroSalaId === 'todas' ? null : Number(filtroSalaId),
        p_id_disciplina: filtroDisciplinaId === 'todas' ? null : Number(filtroDisciplinaId),
        p_incluir_sem_historico: incluirSemHistorico,
      })

      if (error) throw error

      const arr = (data ?? []) as any[]
      const base: AusenteItem[] = arr.map((r) => ({
        id_aluno: Number(r.id_aluno),
        id_matricula: r.id_matricula != null ? Number(r.id_matricula) : null,
        numero_inscricao: r.numero_inscricao ?? null,

        aluno_nome: r.aluno_nome ?? `Aluno #${r.id_aluno}`,
        aluno_foto_url: r.aluno_foto_url ?? null,

        email: r.email ?? null,
        celular: r.celular ?? null,
        cpf: r.cpf ?? null,

        logradouro: r.logradouro ?? null,
        numero_endereco: r.numero_endereco ?? null,
        bairro: r.bairro ?? null,
        municipio: r.municipio ?? null,
        cep: r.cep ?? null,
        ponto_referencia: r.ponto_referencia ?? null,

        id_nivel_ensino: r.id_nivel_ensino != null ? Number(r.id_nivel_ensino) : null,

        nis: r.nis ?? null,
        possui_necessidade_especial: r.possui_necessidade_especial ?? null,
        possui_beneficio_governo: r.possui_beneficio_governo ?? null,

        ultima_visita: r.ultima_visita ?? null,
        dias_sem_vir: r.dias_sem_vir != null ? Number(r.dias_sem_vir) : null,

        ultima_sala_id: r.ultima_sala_id != null ? Number(r.ultima_sala_id) : r.id_sala != null ? Number(r.id_sala) : null,
        ultima_sala_nome: r.ultima_sala_nome ?? (r.sala_nome ?? null),
        ultima_sala_tipo: r.ultima_sala_tipo ?? null,

        ultima_disciplina_id: r.ultima_disciplina_id != null ? Number(r.ultima_disciplina_id) : r.id_disciplina != null ? Number(r.id_disciplina) : null,
        ultima_disciplina_nome: r.ultima_disciplina_nome ?? (r.disciplina_nome ?? null),

        ultimo_acompanhamento_data: r.ultimo_acompanhamento_data ?? null,
        ultimo_acompanhamento_tipo: r.ultimo_acompanhamento_tipo ?? null,
        ultimo_acompanhamento_status: r.ultimo_acompanhamento_status ?? null,
        ultimo_acompanhamento_resumo: r.ultimo_acompanhamento_resumo ?? null,
      }))

      // ✅ Enriquecer dados necessários para validar Pé-de-Meia (idade e prazo/matrícula)
      // (sem isso, só daria para “chutar” por NIS/benefício)
      const idsAluno = Array.from(new Set(base.map((x) => x.id_aluno).filter(Boolean)))
      const idsMatricula = Array.from(new Set(base.map((x) => x.id_matricula).filter((x): x is number => x != null)))

      const nascPorAluno = new Map<number, string | null>()
      const matPorId = new Map<number, { data_matricula: string | null; ano_letivo: number | null }>()

      try {
        if (idsAluno.length > 0) {
          const { data: alunosData, error: errAlunos } = await supabase
            .from('alunos')
            .select('id_aluno, usuarios ( data_nascimento )')
            .in('id_aluno', idsAluno)

          if (errAlunos) throw errAlunos

          ;(alunosData ?? []).forEach((row: any) => {
            const u = first(row?.usuarios) as any
            nascPorAluno.set(Number(row.id_aluno), u?.data_nascimento ? String(u.data_nascimento) : null)
          })
        }

        if (idsMatricula.length > 0) {
          const { data: mats, error: errMats } = await supabase
            .from('matriculas')
            .select('id_matricula, data_matricula, ano_letivo')
            .in('id_matricula', idsMatricula)

          if (errMats) throw errMats

          ;(mats ?? []).forEach((m: any) => {
            matPorId.set(Number(m.id_matricula), {
              data_matricula: m.data_matricula ? String(m.data_matricula) : null,
              ano_letivo: m.ano_letivo != null ? Number(m.ano_letivo) : null,
            })
          })
        }
      } catch (e) {
        // Não travamos a tela se faltar permissão/RLS; só fica “indeterminado” no Pé-de-Meia.
        console.warn('Falha ao enriquecer dados para Pé-de-Meia (data_nascimento/data_matricula).', e)
      }

      const enriched: AusenteItem[] = base.map((a) => {
        const matInfo = a.id_matricula != null ? matPorId.get(a.id_matricula) : undefined
        return {
          ...a,
          data_nascimento: nascPorAluno.get(a.id_aluno) ?? a.data_nascimento ?? null,
          data_matricula: matInfo?.data_matricula ?? a.data_matricula ?? null,
          ano_letivo: matInfo?.ano_letivo ?? a.ano_letivo ?? null,
        }
      })

      setAusentes(enriched)
    } catch (e) {
      console.error(e)
      erro('Falha ao carregar lista de ausentes.')
    } finally {
      if (mountedRef.current) setCarregandoAusentes(false)
    }
  }, [supabase, diasMinimo, filtroSalaId, filtroDisciplinaId, incluirSemHistorico, erro])

  // ======= histórico do aluno =======
  const carregarHistoricoAluno = useCallback(
    async (id_aluno: number) => {
      if (!supabase) return

      setCarregandoHistorico(true)
      try {
        const { data, error } = await supabase
          .from('acompanhamento_aluno')
          .select(
            `
          id_acompanhamento,
          id_aluno,
          id_matricula,
          id_sala,
          id_disciplina,
          data_evento,
          tipo,
          status,
          observacao,
          created_by,
          created_at,
          updated_at,
          usuarios ( name )
        `,
          )
          .eq('id_aluno', id_aluno)
          .order('data_evento', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        const lista: AcompRegistro[] = (data ?? []).map((r: any) => ({
          id_acompanhamento: Number(r.id_acompanhamento),
          id_aluno: Number(r.id_aluno),
          id_matricula: r.id_matricula != null ? Number(r.id_matricula) : null,
          id_sala: r.id_sala != null ? Number(r.id_sala) : null,
          id_disciplina: r.id_disciplina != null ? Number(r.id_disciplina) : null,
          data_evento: String(r.data_evento),
          tipo: String(r.tipo),
          status: String(r.status),
          observacao: r.observacao ?? null,
          created_by: r.created_by ?? null,
          created_at: String(r.created_at),
          updated_at: String(r.updated_at),
          usuarios: first(r?.usuarios) as any,
        }))

        setHistorico(lista)
      } catch (e) {
        console.error(e)
        erro('Falha ao carregar histórico do aluno.')
      } finally {
        if (mountedRef.current) setCarregandoHistorico(false)
      }
    },
    [supabase, erro],
  )

  const abrirAluno = useCallback(
    async (a: AusenteItem) => {
      setAlunoAtual(a)
      setDlgAluno(true)
      setConfirmDelId(null)
      setHistorico([])

      setNovoTipo('Contato')
      setNovoStatus('Sem contato')
      setNovoObs('')
      setNovoDataEvento(() => {
        const d = new Date()
        const yyyy = String(d.getFullYear())
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        const hh = String(d.getHours()).padStart(2, '0')
        const mi = String(d.getMinutes()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
      })

      await carregarHistoricoAluno(a.id_aluno)
    },
    [carregarHistoricoAluno],
  )

  const fecharAluno = useCallback(() => {
    setDlgAluno(false)
    setAlunoAtual(null)
    setHistorico([])
    setConfirmDelId(null)
  }, [])

  const salvarNovoRegistro = useCallback(async () => {
    if (!supabase) return
    if (!alunoAtual) return

    if (!novoTipo.trim()) return aviso('Selecione o tipo.')
    if (!novoStatus.trim()) return aviso('Selecione o status.')
    if (!novoDataEvento.trim()) return aviso('Informe a data/hora.')

    const dt = new Date(novoDataEvento)
    if (Number.isNaN(dt.getTime())) return aviso('Data/hora inválida.')

    setSalvandoNovo(true)
    try {
      const payload = {
        id_aluno: alunoAtual.id_aluno,
        id_matricula: alunoAtual.id_matricula,
        id_sala: alunoAtual.ultima_sala_id,
        id_disciplina: alunoAtual.ultima_disciplina_id,
        data_evento: dt.toISOString(),
        tipo: novoTipo,
        status: novoStatus,
        observacao: novoObs.trim() ? novoObs.trim() : null,
      }

      const { error } = await supabase.from('acompanhamento_aluno').insert(payload)
      if (error) throw error

      sucesso('Registro salvo.')
      setNovoObs('')

      await carregarHistoricoAluno(alunoAtual.id_aluno)
      await carregarAusentes()
    } catch (e) {
      console.error(e)
      erro('Falha ao salvar registro.')
    } finally {
      if (mountedRef.current) setSalvandoNovo(false)
    }
  }, [supabase, alunoAtual, novoTipo, novoStatus, novoDataEvento, novoObs, aviso, sucesso, erro, carregarHistoricoAluno, carregarAusentes])

  const confirmarExcluir = useCallback((id: number) => setConfirmDelId(id), [])
  const cancelarExcluir = useCallback(() => setConfirmDelId(null), [])

  const excluirRegistro = useCallback(async () => {
    if (!supabase) return
    if (!alunoAtual) return
    if (!confirmDelId) return

    setExcluindo(true)
    try {
      const { error } = await supabase.from('acompanhamento_aluno').delete().eq('id_acompanhamento', confirmDelId)
      if (error) throw error

      sucesso('Registro excluído.')
      setConfirmDelId(null)
      await carregarHistoricoAluno(alunoAtual.id_aluno)
      await carregarAusentes()
    } catch (e) {
      console.error(e)
      erro('Falha ao excluir (verifique permissões/RLS).')
    } finally {
      if (mountedRef.current) setExcluindo(false)
    }
  }, [supabase, alunoAtual, confirmDelId, sucesso, erro, carregarHistoricoAluno, carregarAusentes])

  // ======= effects =======
  useEffect(() => {
    void carregarBase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, supabase])

  useEffect(() => {
    if (!carregandoBase) void carregarAusentes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregandoBase])

  // ======= UI helpers =======
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
    [],
  )

  return (
    <Box sx={{ p: 2, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            Acompanhamento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Alunos sem comparecer há <b>{diasMinimo}+</b> dias (com filtros e devolutiva rápida).
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap">
          <Tooltip title="Recarregar lista">
            <span>
              <IconButton onClick={() => void carregarAusentes()} disabled={carregandoBase || carregandoAusentes}>
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
            label="Dias sem vir (mín.)"
            type="number"
            inputProps={{ min: 1, max: 365 }}
            value={diasMinimo}
            onChange={(e) => setDiasMinimo(Math.max(1, Math.min(365, Number(e.target.value || 15))))}
            sx={{ width: { xs: '100%', sm: 220 } }}
          />

          <FormControl size="small" sx={{ width: { xs: '100%', sm: 300 } }}>
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
                <em>{isProfessor ? 'Todas (minhas salas)' : 'Todas'}</em>
              </MenuItem>
              {salas.map((s) => (
                <MenuItem key={s.id_sala} value={s.id_sala}>
                  {s.nome} ({s.tipo_sala})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            options={[{ id_disciplina: -1, nome_disciplina: 'Todas' } as any, ...disciplinas]}
            value={
              filtroDisciplinaId === 'todas'
                ? ({ id_disciplina: -1, nome_disciplina: 'Todas' } as any)
                : disciplinas.find((d) => d.id_disciplina === filtroDisciplinaId) ?? ({ id_disciplina: -1, nome_disciplina: 'Todas' } as any)
            }
            onChange={(_, v) => setFiltroDisciplinaId(!v || v.id_disciplina === -1 ? 'todas' : Number(v.id_disciplina))}
            getOptionLabel={(o) => o.nome_disciplina}
            renderInput={(params) => <TextField {...params} size="small" label="Disciplina" />}
            sx={{ width: { xs: '100%', sm: 340 } }}
          />

          <TextField
            size="small"
            label="Buscar (nome/RA/sala/disciplina...)"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            sx={{ flex: 1, minWidth: { xs: '100%', md: 320 } }}
          />

          <Button
            variant="contained"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={() => void carregarAusentes()}
            disabled={carregandoBase || carregandoAusentes}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Aplicar
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" sx={{ mt: 1 }}>
          <FormControlLabel
            control={<Switch checked={incluirSemHistorico} onChange={(e) => setIncluirSemHistorico(e.target.checked)} />}
            label="Incluir sem histórico"
          />
          <FormControlLabel
            control={<Switch checked={somentePeDeMeia} onChange={(e) => setSomentePeDeMeia(e.target.checked)} />}
            label="Somente Pé-de-Meia elegíveis"
          />
          <Chip size="small" label={`Total: ${listaFiltrada.length}`} variant="outlined" />
          <Chip size="small" label={`Sem contato: ${totalSemContato}`} color="warning" variant="outlined" />
          <Chip size="small" label={`Com contato: ${totalComContato}`} color="info" variant="outlined" />
        </Stack>

        {carregandoAusentes ? <LinearProgress sx={{ mt: 2 }} /> : null}
      </Paper>

      {/* Lista */}
      <Box sx={{ mt: 2 }}>
        {carregandoBase ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : listaFiltrada.length === 0 ? (
          <Alert severity="info">Nenhum aluno encontrado com os filtros atuais.</Alert>
        ) : (
          <Box sx={cardGridSx}>
            {listaFiltrada.map((a) => {
              const pe = peDeMeiaPorAluno.get(a.id_aluno) ?? {
                elegivel: false,
                classificacao: 'INDETERMINADO',
                label: 'Pé-de-Meia: conferir',
                color: 'warning' as const,
                variant: 'outlined' as const,
                tooltip: null,
              }

              const statusTxt = (a.ultimo_acompanhamento_status ?? '').trim()
              const statusNorm = normalizarTexto(statusTxt)
              const statusColor =
                statusNorm.includes('sem contato') ? 'warning' : statusNorm.includes('com contato') ? 'info' : statusNorm.includes('retorn') ? 'success' : 'default'

              const peChip = (
                <Chip size="small" label={pe.label} color={pe.color as any} variant={pe.variant} />
              )

              return (
                <Card
                  key={a.id_aluno}
                  elevation={2}
                  onClick={() => void abrirAluno(a)}
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
                      <AvatarAlunoFicha
                        supabase={supabase as any}
                        idAluno={a.id_aluno}
                        fotoUrl={a.aluno_foto_url ?? null}
                        nome={a.aluno_nome}
                        variant="circular"
                        sx={{ width: 56, height: 56, border: '2px solid', borderColor: 'primary.main' }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, overflowWrap: 'anywhere', lineHeight: 1.2 }}>
                          {a.aluno_nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          RA: {a.numero_inscricao ?? '-'} • Nível: {nomeNivelEnsinoCurto(a.id_nivel_ensino)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                      <Chip size="small" icon={<MeetingRoomIcon />} label={a.ultima_sala_nome ?? 'Sala: -'} variant="outlined" />
                      <Chip size="small" icon={<SchoolIcon />} label={a.ultima_disciplina_nome ?? 'Disciplina: -'} variant="outlined" />
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                      {a.dias_sem_vir != null ? (
                        <Chip size="small" label={`${a.dias_sem_vir} dias sem vir`} color="warning" />
                      ) : (
                        <Chip size="small" label="Sem histórico" variant="outlined" />
                      )}

                      {pe.tooltip ? <Tooltip title={<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{pe.tooltip}</pre>}>{peChip}</Tooltip> : peChip}

                      {a.possui_necessidade_especial ? <Chip size="small" label="PCD" color="info" variant="outlined" /> : null}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" display="block">
                      Última visita: {formatarDataHoraBR(a.ultima_visita)}
                    </Typography>

                    {statusTxt ? (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Chip size="small" label={statusTxt} color={statusColor as any} />
                        <Typography variant="caption" color="text.secondary">
                          {formatarDataHoraBR(a.ultimo_acompanhamento_data)}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Sem registro de acompanhamento.
                      </Typography>
                    )}

                    {a.ultimo_acompanhamento_resumo ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {a.ultimo_acompanhamento_resumo}
                      </Typography>
                    ) : null}
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 1.2 }}>
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }} justifyContent="space-between">
                      <Chip size="small" icon={<WarningAmberIcon />} label="Clique para abrir" variant="outlined" />
                      <Chip size="small" icon={<AddIcon />} label="Registrar devolutiva" color="primary" variant="outlined" />
                    </Stack>
                  </CardActions>
                </Card>
              )
            })}
          </Box>
        )}
      </Box>

      {/* Dialog do aluno */}
      <Dialog open={dlgAluno} onClose={fecharAluno} fullWidth maxWidth="md" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {alunoAtual ? alunoAtual.aluno_nome : 'Aluno'}
          <IconButton onClick={fecharAluno} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {!alunoAtual ? (
            <Alert severity="warning">Aluno não selecionado.</Alert>
          ) : (
            <Stack spacing={2}>
              {/* header do aluno */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.25 : 0.35),
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <AvatarAlunoFicha
                      supabase={supabase as any}
                      idAluno={alunoAtual.id_aluno}
                      fotoUrl={alunoAtual.aluno_foto_url ?? null}
                      nome={alunoAtual.aluno_nome}
                      variant="circular"
                      sx={{ width: 64, height: 64, border: '2px solid', borderColor: 'primary.main' }}
                    />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {alunoAtual.aluno_nome}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        RA: {alunoAtual.numero_inscricao ?? '-'} • Nível: {nomeNivelEnsinoCurto(alunoAtual.id_nivel_ensino)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Última visita: {formatarDataHoraBR(alunoAtual.ultima_visita)} {alunoAtual.dias_sem_vir != null ? `• ${alunoAtual.dias_sem_vir} dias` : ''}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
                    {alunoAtual.celular ? (
                      <>
                        <Tooltip title="Ligar">
                          <IconButton component="a" href={`tel:${alunoAtual.celular}`} onClick={(e) => e.stopPropagation()}>
                            <PhoneIcon />
                          </IconButton>
                        </Tooltip>
                        {montarLinkWhatsApp(alunoAtual.celular) ? (
                          <Tooltip title="WhatsApp">
                            <IconButton
                              component="a"
                              href={montarLinkWhatsApp(alunoAtual.celular) ?? undefined}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <WhatsAppIcon />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </>
                    ) : (
                      <Chip size="small" label="Sem telefone" variant="outlined" />
                    )}
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip size="small" icon={<MeetingRoomIcon />} label={alunoAtual.ultima_sala_nome ?? 'Sala: -'} variant="outlined" />
                    <Chip size="small" icon={<SchoolIcon />} label={alunoAtual.ultima_disciplina_nome ?? 'Disciplina: -'} variant="outlined" />

                    {(() => {
                      const pe = peDeMeiaPorAluno.get(alunoAtual.id_aluno) ?? avaliarPeDeMeiaParaUI(alunoAtual)
                      const chip = <Chip size="small" label={pe.label} color={pe.color as any} variant={pe.variant} />
                      return pe.tooltip ? (
                        <Tooltip title={<pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{pe.tooltip}</pre>}>{chip}</Tooltip>
                      ) : (
                        chip
                      )
                    })()}

                    {alunoAtual.possui_necessidade_especial ? <Chip size="small" label="PCD" color="info" variant="outlined" /> : null}
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip size="small" label={`Telefone: ${formatarTelefoneBR(alunoAtual.celular)}`} variant="outlined" />
                    <Chip size="small" label={`Email: ${alunoAtual.email ?? '-'}`} variant="outlined" />
                    <Chip size="small" label={`CPF: ${alunoAtual.cpf ?? '-'}`} variant="outlined" />
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <PlaceIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      {formatarEndereco(alunoAtual) || 'Endereço não informado'}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              {/* novo registro */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>Registrar contato / devolutiva (quando retornar)</Typography>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="novo-tipo-label">Tipo</InputLabel>
                    <Select labelId="novo-tipo-label" label="Tipo" value={novoTipo} onChange={(e) => setNovoTipo(String(e.target.value))}>
                      <MenuItem value="Contato">Contato</MenuItem>
                      <MenuItem value="Devolutiva">Devolutiva</MenuItem>
                      <MenuItem value="Visita">Visita</MenuItem>
                      <MenuItem value="Outro">Outro</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel id="novo-status-label">Status</InputLabel>
                    <Select labelId="novo-status-label" label="Status" value={novoStatus} onChange={(e) => setNovoStatus(String(e.target.value))}>
                      <MenuItem value="Sem contato">Sem contato</MenuItem>
                      <MenuItem value="Com contato">Com contato</MenuItem>
                      <MenuItem value="Retornou">Retornou</MenuItem>
                      <MenuItem value="Em acompanhamento">Em acompanhamento</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    size="small"
                    label="Data/Hora"
                    type="datetime-local"
                    value={novoDataEvento}
                    onChange={(e) => setNovoDataEvento(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>

                <TextField
                  label="O que foi falado / observação"
                  value={novoObs}
                  onChange={(e) => setNovoObs(e.target.value)}
                  minRows={3}
                  multiline
                  fullWidth
                  sx={{ mt: 2 }}
                  placeholder="Ex.: Aluno informou que estava trabalhando e voltará na próxima semana. Reforcei frequência mínima..."
                />

                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={() => void salvarNovoRegistro()} disabled={salvandoNovo}>
                    {salvandoNovo ? 'Salvando...' : 'Salvar registro'}
                  </Button>
                </Stack>
              </Paper>

              {/* histórico */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography sx={{ fontWeight: 900 }}>Histórico (últimos 50)</Typography>
                  <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={() => alunoAtual && void carregarHistoricoAluno(alunoAtual.id_aluno)}>
                    Recarregar
                  </Button>
                </Stack>

                {carregandoHistorico ? <LinearProgress sx={{ mt: 2 }} /> : null}

                {historico.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Sem histórico ainda.
                  </Alert>
                ) : (
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {historico.map((h) => (
                      <Paper key={h.id_acompanhamento} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between">
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Chip size="small" label={h.tipo} variant="outlined" />
                              <Chip
                                size="small"
                                label={h.status}
                                color={
                                  normalizarTexto(h.status).includes('sem contato')
                                    ? 'warning'
                                    : normalizarTexto(h.status).includes('com contato')
                                      ? 'info'
                                      : normalizarTexto(h.status).includes('retorn')
                                        ? 'success'
                                        : 'default'
                                }
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatarDataHoraBR(h.data_evento)}
                              </Typography>
                              {h.usuarios?.name ? (
                                <Typography variant="caption" color="text.secondary">
                                  • por {h.usuarios.name}
                                </Typography>
                              ) : null}
                            </Stack>

                            {h.observacao ? (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                {h.observacao}
                              </Typography>
                            ) : null}
                          </Box>

                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Excluir">
                              <IconButton onClick={() => confirmarExcluir(h.id_acompanhamento)}>
                                <DeleteOutlineIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}

                {confirmDelId ? (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Confirma excluir o registro #{confirmDelId}?
                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                      <Button variant="outlined" onClick={cancelarExcluir}>
                        Cancelar
                      </Button>
                      <Button variant="contained" color="error" onClick={() => void excluirRegistro()} disabled={excluindo}>
                        {excluindo ? 'Excluindo...' : 'Excluir'}
                      </Button>
                    </Stack>
                  </Alert>
                ) : null}
              </Paper>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={fecharAluno}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* loading inicial */}
      {carregandoBase ? (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          <Chip icon={<CircularProgress size={14} />} label="Carregando..." variant="outlined" />
        </Box>
      ) : null}
    </Box>
  )
}
