import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  Alert,
  Autocomplete,
  Avatar,
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
import SchoolIcon from '@mui/icons-material/School'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'

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

type AlunoBuscaOption = {
  id_aluno: number
  nome: string
  email?: string | null

  // Se veio pelo número de matrícula:
  id_matricula?: number | null
  numero_inscricao?: string | null
  ano_letivo?: number | null
  id_status_matricula?: number | null
}

type DisciplinaSalaOption = {
  id_config: number
  id_disciplina: number
  id_ano_escolar: number
  quantidade_protocolos: number
  disciplina_nome: string
  ano_nome: string
  label: string
}

type ProgressoResumo = {
  id_progresso: number
  id_disciplina: number
  id_ano_escolar: number
  data_conclusao: string | null
  status_nome?: string | null
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
  aluno_foto_url?: string | null
  numero_inscricao?: string | null

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

function chaveDiscAno(idDisciplina: number, idAnoEscolar: number): string {
  return `${idDisciplina}-${idAnoEscolar}`
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

  // ===== Permissões para abrir nova disciplina se aluno já tiver 3+ fichas abertas =====
  const podeForcarAbrirDisciplina = useMemo(() => {
    const papel = String((usuario as any)?.papel ?? (usuario as any)?.role ?? '').toUpperCase()
    // ajuste se seus papéis forem diferentes:
    return ['ADMIN', 'DIRETOR', 'COORDENACAO'].includes(papel)
  }, [usuario])

  // ===== Loading =====
  const [carregandoBase, setCarregandoBase] = useState(true)
  const [carregandoSessoes, setCarregandoSessoes] = useState(false)
  const [carregandoRegistros, setCarregandoRegistros] = useState(false)

  // ===== Identidade professor =====
  const [idProfessor, setIdProfessor] = useState<number | null>(null)

  // ===== Base do professor =====
  const [salas, setSalas] = useState<SalaAtendimento[]>([])
  const [tiposProtocolo, setTiposProtocolo] = useState<TipoProtocolo[]>([])
  const [configs, setConfigs] = useState<ConfigDisciplinaAno[]>([])
  const [statusMatriculas, setStatusMatriculas] = useState<StatusMatricula[]>([])
  const [statusDisciplinas, setStatusDisciplinas] = useState<StatusDisciplinaAluno[]>([])

  // configs por sala
  const [configPorSala, setConfigPorSala] = useState<Map<number, DisciplinaSalaOption[]>>(new Map())

  // ===== Filtros =====
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>(hojeISODateLocal())
  const [filtroDataFim, setFiltroDataFim] = useState<string>(hojeISODateLocal())
  const [filtroTexto, setFiltroTexto] = useState<string>('')
  const [filtroSalaId, setFiltroSalaId] = useState<string>('todas')

  // ===== Sessões =====
  const [sessoes, setSessoes] = useState<SessaoView[]>([])

  // ===== Dialog: Novo atendimento (novo fluxo) =====
  const [dlgNovaSessao, setDlgNovaSessao] = useState(false)
  const [novaSala, setNovaSala] = useState<SalaAtendimento | null>(null)

  const [alunoBuscaInput, setAlunoBuscaInput] = useState('')
  const [alunoBuscando, setAlunoBuscando] = useState(false)
  const [alunoOpcoes, setAlunoOpcoes] = useState<AlunoBuscaOption[]>([])
  const [novaSessaoAluno, setNovaSessaoAluno] = useState<AlunoBuscaOption | null>(null)

  const [novaSessaoDiscAno, setNovaSessaoDiscAno] = useState<DisciplinaSalaOption | null>(null)
  const [novaSessaoEntrada, setNovaSessaoEntrada] = useState<string>(agoraParaInputDateTimeLocal())
  const [novaSessaoResumo, setNovaSessaoResumo] = useState<string>('')
  const [salvandoNovaSessao, setSalvandoNovaSessao] = useState(false)

  // Matrícula preferencial carregada + fichas do aluno
  const [novaSessaoMatriculaId, setNovaSessaoMatriculaId] = useState<number | null>(null)
  const [carregandoFichasAluno, setCarregandoFichasAluno] = useState(false)
  const [fichasAlunoMap, setFichasAlunoMap] = useState<Map<string, ProgressoResumo>>(new Map())
  const [qtdFichasAbertas, setQtdFichasAbertas] = useState<number>(0)

  // Confirmar abrir ficha (se não existir progresso)
  const [dlgConfirmAbrirFicha, setDlgConfirmAbrirFicha] = useState(false)

  // ===== Dialog: Sessão =====
  const [dlgSessao, setDlgSessao] = useState(false)
  const [sessaoAtual, setSessaoAtual] = useState<SessaoView | null>(null)
  const [registros, setRegistros] = useState<RegistroView[]>([])
  const [salvandoSessao, setSalvandoSessao] = useState(false)

  // ===== Dialog: Registro =====
  const [dlgRegistro, setDlgRegistro] = useState(false)
  const [registroEditandoId, setRegistroEditandoId] = useState<number | null>(null)
  const [regNumero, setRegNumero] = useState<string>('') // string para Select
  const [regTipoId, setRegTipoId] = useState<string>('') // string para Select
  const [regStatus, setRegStatus] = useState<string>('A fazer')
  const [regNota, setRegNota] = useState<string>('')
  const [regAdaptada, setRegAdaptada] = useState<boolean>(false)
  const [regSintese, setRegSintese] = useState<string>('')
  const [salvandoRegistro, setSalvandoRegistro] = useState(false)

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // ===== Map config por disciplina/ano =====
  const mapaConfigPorDiscAno = useMemo(() => {
    const m = new Map<string, ConfigDisciplinaAno>()
    configs.forEach((c) => {
      m.set(`${c.id_disciplina}-${c.id_ano_escolar}`, c)
    })
    return m
  }, [configs])

  // ===== Helpers de status =====
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

  // ===== Buscar matrícula preferencial =====
  const obterMatriculaPreferencial = useCallback(
    async (aluno: AlunoBuscaOption): Promise<number | null> => {
      if (!supabase) return null

      // se veio pelo campo matrícula, aproveita:
      if (aluno.id_matricula) return Number(aluno.id_matricula)

      const ativaId = obterIdStatusMatriculaAtiva()
      const { data, error: err } = await supabase
        .from('matriculas')
        .select('id_matricula,id_status_matricula,ano_letivo,data_matricula')
        .eq('id_aluno', aluno.id_aluno)
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

  // ===== Carregar fichas do aluno (progresso) =====
  const carregarFichasDoAluno = useCallback(
    async (aluno: AlunoBuscaOption, salaId: number) => {
      if (!supabase) return
      setCarregandoFichasAluno(true)
      try {
        const idMatricula = await obterMatriculaPreferencial(aluno)
        if (!idMatricula) {
          setNovaSessaoMatriculaId(null)
          setFichasAlunoMap(new Map())
          setQtdFichasAbertas(0)
          return
        }

        setNovaSessaoMatriculaId(idMatricula)

        const { data, error: err } = await supabase
          .from('progresso_aluno')
          .select(
            `
            id_progresso,
            id_disciplina,
            id_ano_escolar,
            data_conclusao,
            status_disciplina_aluno ( nome )
          `
          )
          .eq('id_matricula', idMatricula)
          .order('id_progresso', { ascending: false })

        if (err) throw err

        const map = new Map<string, ProgressoResumo>()
        const abertasKeys = new Set<string>()

        for (const p of data ?? []) {
          const status = first((p as any).status_disciplina_aluno) as any
          const resumo: ProgressoResumo = {
            id_progresso: Number((p as any).id_progresso),
            id_disciplina: Number((p as any).id_disciplina),
            id_ano_escolar: Number((p as any).id_ano_escolar),
            data_conclusao: (p as any).data_conclusao ? String((p as any).data_conclusao) : null,
            status_nome: status?.nome ?? null,
          }

          const k = chaveDiscAno(resumo.id_disciplina, resumo.id_ano_escolar)
          if (!map.has(k)) map.set(k, resumo)
          if (!resumo.data_conclusao) abertasKeys.add(k)
        }

        // Se quiser “forçar” disciplina só da sala:
        // (a regra do limite 3 é global do aluno, então deixo global mesmo)
        setFichasAlunoMap(map)
        setQtdFichasAbertas(abertasKeys.size)

        // se trocar sala/aluno, limpa disciplina selecionada (pra evitar inconsistência)
        const disciplinasDaSala = configPorSala.get(salaId) ?? []
        if (disciplinasDaSala.length > 0 && mountedRef.current) {
          setNovaSessaoDiscAno((old) => {
            if (!old) return old
            const ok = disciplinasDaSala.some((x) => x.id_disciplina === old.id_disciplina && x.id_ano_escolar === old.id_ano_escolar)
            return ok ? old : null
          })
        }
      } catch (e: any) {
        console.error(e)
        aviso('Não foi possível carregar as fichas do aluno.')
        setFichasAlunoMap(new Map())
        setQtdFichasAbertas(0)
      } finally {
        if (mountedRef.current) setCarregandoFichasAluno(false)
      }
    },
    [supabase, obterMatriculaPreferencial, aviso, configPorSala]
  )

  // ===== Buscar alunos por nome ou matrícula =====
  const debounceRef = useRef<number | null>(null)

  const buscarAlunos = useCallback(
    async (termo: string) => {
      if (!supabase) return
      const t = termo.trim()
      if (t.length < 2) {
        setAlunoOpcoes([])
        return
      }

      setAlunoBuscando(true)
      try {
        const isNumero = /^\d+$/.test(t)

        if (isNumero) {
          const { data, error: err } = await supabase
            .from('matriculas')
            .select(
              `
              id_matricula,
              id_aluno,
              numero_inscricao,
              ano_letivo,
              id_status_matricula,
              alunos!inner(
                id_aluno,
                usuarios!inner(name,email)
              )
            `
            )
            .ilike('numero_inscricao', `%${t}%`)
            .order('ano_letivo', { ascending: false })
            .limit(20)

          if (err) throw err

          const opts: AlunoBuscaOption[] = (data ?? []).map((m: any) => {
            const aluno = first(m.alunos) as any
            const u = first(aluno?.usuarios) as any
            return {
              id_aluno: Number(m.id_aluno),
              nome: u?.name ?? `Aluno #${m.id_aluno}`,
              email: u?.email ?? null,
              id_matricula: Number(m.id_matricula),
              numero_inscricao: m.numero_inscricao ? String(m.numero_inscricao) : null,
              ano_letivo: m.ano_letivo != null ? Number(m.ano_letivo) : null,
              id_status_matricula: m.id_status_matricula != null ? Number(m.id_status_matricula) : null,
            }
          })

          setAlunoOpcoes(opts)
          return
        }

        // busca por nome
        const { data: alunosRes, error: errAlunos } = await supabase
          .from('alunos')
          .select(
            `
            id_aluno,
            usuarios!inner(name,email)
          `
          )
          .ilike('usuarios.name', `%${t}%`)
          .order('id_aluno', { ascending: false })
          .limit(20)

        if (errAlunos) throw errAlunos

        const ids = (alunosRes ?? []).map((a: any) => Number(a.id_aluno)).filter(Boolean)
        const base: AlunoBuscaOption[] = (alunosRes ?? []).map((a: any) => {
          const u = first(a?.usuarios) as any
          return {
            id_aluno: Number(a.id_aluno),
            nome: u?.name ?? `Aluno #${a.id_aluno}`,
            email: u?.email ?? null,
          }
        })

        if (ids.length === 0) {
          setAlunoOpcoes([])
          return
        }

        // pega uma matrícula “boa” por aluno (ativa se existir, senão a mais recente)
        const ativaId = obterIdStatusMatriculaAtiva()
        const { data: mats, error: errMats } = await supabase
          .from('matriculas')
          .select('id_matricula,id_aluno,numero_inscricao,ano_letivo,id_status_matricula,data_matricula')
          .in('id_aluno', ids)
          .order('ano_letivo', { ascending: false })
          .order('data_matricula', { ascending: false })
          .limit(300)

        if (errMats) throw errMats

        const matsPorAluno = new Map<number, any[]>()
        for (const m of mats ?? []) {
          const ida = Number((m as any).id_aluno)
          const arr = matsPorAluno.get(ida) ?? []
          arr.push(m)
          matsPorAluno.set(ida, arr)
        }

        const opts: AlunoBuscaOption[] = base.map((a) => {
          const lista = matsPorAluno.get(a.id_aluno) ?? []
          let melhor: any | null = null
          if (ativaId != null) {
            melhor = lista.find((x) => Number((x as any).id_status_matricula) === ativaId) ?? null
          }
          if (!melhor) melhor = lista[0] ?? null

          return {
            ...a,
            id_matricula: melhor?.id_matricula != null ? Number(melhor.id_matricula) : null,
            numero_inscricao: melhor?.numero_inscricao ? String(melhor.numero_inscricao) : null,
            ano_letivo: melhor?.ano_letivo != null ? Number(melhor.ano_letivo) : null,
            id_status_matricula: melhor?.id_status_matricula != null ? Number(melhor.id_status_matricula) : null,
          }
        })

        setAlunoOpcoes(opts)
      } catch (e: any) {
        console.error(e)
        aviso('Falha ao buscar alunos.')
        setAlunoOpcoes([])
      } finally {
        if (mountedRef.current) setAlunoBuscando(false)
      }
    },
    [supabase, aviso, obterIdStatusMatriculaAtiva]
  )

  // ===== Carregar base (professor, salas e configs da sala) =====
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

      const professorId = Number(prof.id_professor)
      setIdProfessor(professorId)

      const [salasRes, tiposRes, statusMatRes, statusDiscRes] = await Promise.all([
        supabase
          .from('professores_salas')
          .select(
            `
            id_sala,
            salas_atendimento!inner(
              id_sala,
              nome,
              tipo_sala,
              is_ativa
            )
          `
          )
          .eq('id_professor', professorId)
          .eq('ativo', true),
        supabase.from('tipos_protocolo').select('id_tipo_protocolo,nome').order('nome'),
        supabase.from('status_matricula').select('id_status_matricula,nome').order('id_status_matricula'),
        supabase.from('status_disciplina_aluno').select('id_status_disciplina,nome').order('id_status_disciplina'),
      ])

      if (salasRes.error) throw salasRes.error
      if (tiposRes.error) throw tiposRes.error
      if (statusMatRes.error) throw statusMatRes.error
      if (statusDiscRes.error) throw statusDiscRes.error

      const salasParsed: SalaAtendimento[] = (salasRes.data ?? [])
        .map((row: any) => first(row?.salas_atendimento) as any)
        .filter((s: any) => s && s.is_ativa)
        .map((s: any) => ({
          id_sala: Number(s.id_sala),
          nome: String(s.nome),
          tipo_sala: String(s.tipo_sala),
          is_ativa: Boolean(s.is_ativa),
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome))

      setSalas(salasParsed)
      setTiposProtocolo((tiposRes.data ?? []) as TipoProtocolo[])
      setStatusMatriculas((statusMatRes.data ?? []) as StatusMatricula[])
      setStatusDisciplinas((statusDiscRes.data ?? []) as StatusDisciplinaAluno[])

      if (salasParsed.length === 0) {
        info('Você ainda não está lotado em nenhuma sala ativa.')
        setConfigPorSala(new Map())
        setConfigs([])
        return
      }

      // Carregar disciplinas da(s) sala(s)
      const salaIds = salasParsed.map((s) => s.id_sala)
      const { data: cfgRows, error: cfgErr } = await supabase
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
        .in('id_sala', salaIds)

      if (cfgErr) throw cfgErr

      const map = new Map<number, DisciplinaSalaOption[]>()
      const cfgList: ConfigDisciplinaAno[] = []

      for (const row of cfgRows ?? []) {
        const cfg = first((row as any).config_disciplina_ano) as any
        if (!cfg) continue

        const disc = first(cfg?.disciplinas) as any
        const ano = first(cfg?.anos_escolares) as any

        const option: DisciplinaSalaOption = {
          id_config: Number(cfg.id_config),
          id_disciplina: Number(cfg.id_disciplina),
          id_ano_escolar: Number(cfg.id_ano_escolar),
          quantidade_protocolos: Number(cfg.quantidade_protocolos ?? 0),
          disciplina_nome: disc?.nome_disciplina ?? 'Disciplina',
          ano_nome: ano?.nome_ano ?? 'Ano',
          label: `${disc?.nome_disciplina ?? 'Disciplina'} — ${ano?.nome_ano ?? 'Ano'} (protocolos: ${Number(cfg.quantidade_protocolos ?? 0)})`,
        }

        const sid = Number((row as any).id_sala)
        const arr = map.get(sid) ?? []
        arr.push(option)
        map.set(sid, arr)

        cfgList.push({
          id_config: Number(cfg.id_config),
          id_disciplina: Number(cfg.id_disciplina),
          id_ano_escolar: Number(cfg.id_ano_escolar),
          quantidade_protocolos: Number(cfg.quantidade_protocolos ?? 0),
        })
      }

      for (const [sid, arr] of map.entries()) {
        arr.sort((a, b) => a.label.localeCompare(b.label))
        map.set(sid, arr)
      }

      const dedupe = new Map<string, ConfigDisciplinaAno>()
      for (const c of cfgList) dedupe.set(chaveDiscAno(c.id_disciplina, c.id_ano_escolar), c)

      setConfigPorSala(map)
      setConfigs([...dedupe.values()])
    } catch (e: any) {
      console.error(e)
      erro('Falha ao carregar dados-base da página de atendimentos.')
    } finally {
      if (mountedRef.current) setCarregandoBase(false)
    }
  }, [supabase, usuario?.id, erro, info])

  // ===== Carregar sessões =====
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
              matriculas ( numero_inscricao ),
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
            numero_inscricao: mat?.numero_inscricao ? String(mat.numero_inscricao) : null,

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

  // ===== Carregar registros =====
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

  // ===== Buscar / filtrar sessões =====
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

      const matchSala = filtroSalaId === 'todas' || String(s.id_sala ?? '') === filtroSalaId
      return matchTexto && matchSala
    })
  }, [sessoes, filtroTexto, filtroSalaId])

  const sessoesAbertas = useMemo(() => sessoesFiltradas.filter((s) => !s.hora_saida), [sessoesFiltradas])
  const sessoesEncerradas = useMemo(() => sessoesFiltradas.filter((s) => !!s.hora_saida), [sessoesFiltradas])

  // ===== Abrir novo atendimento =====
  const abrirDialogNovaSessao = useCallback(() => {
    // reset
    setNovaSessaoAluno(null)
    setAlunoBuscaInput('')
    setAlunoOpcoes([])
    setNovaSessaoDiscAno(null)
    setNovaSessaoEntrada(agoraParaInputDateTimeLocal())
    setNovaSessaoResumo('')
    setNovaSessaoMatriculaId(null)
    setFichasAlunoMap(new Map())
    setQtdFichasAbertas(0)
    setDlgConfirmAbrirFicha(false)

    // sala automática se tiver só 1
    if (salas.length === 1) setNovaSala(salas[0])
    else setNovaSala(null)

    setDlgNovaSessao(true)
  }, [salas])

  // quando muda sala ou aluno no modal, recarrega fichas
  useEffect(() => {
    if (!dlgNovaSessao) return
    if (!novaSala?.id_sala) return
    if (!novaSessaoAluno?.id_aluno) return
    void carregarFichasDoAluno(novaSessaoAluno, novaSala.id_sala)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dlgNovaSessao, novaSala?.id_sala, novaSessaoAluno?.id_aluno])

  // disciplinas possíveis pela sala
  const disciplinasDaSala = useMemo(() => {
    if (!novaSala) return []
    return configPorSala.get(novaSala.id_sala) ?? []
  }, [novaSala, configPorSala])

  const temFichaEmAlgumaDisciplinaDaSala = useMemo(() => {
    if (!novaSala) return false
    const opts = configPorSala.get(novaSala.id_sala) ?? []
    for (const o of opts) {
      const k = chaveDiscAno(o.id_disciplina, o.id_ano_escolar)
      if (fichasAlunoMap.has(k)) return true
    }
    return false
  }, [novaSala, configPorSala, fichasAlunoMap])

  // ===== Criar progresso (abrir ficha) =====
  const criarProgresso = useCallback(
    async (idMatricula: number, idDisciplina: number, idAnoEscolar: number): Promise<number> => {
      if (!supabase) throw new Error('Supabase indisponível.')

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

  // ===== Criar sessão (núcleo) =====
  const inserirSessao = useCallback(
    async (idProgresso: number | null) => {
      if (!supabase) return
      if (!usuario?.id) return
      if (!idProfessor) return
      if (!novaSala?.id_sala) return
      if (!novaSessaoAluno?.id_aluno) return
      if (!novaSessaoEntrada?.trim()) return

      const horaEntradaISO = new Date(novaSessaoEntrada).toISOString()

      const { data: nova, error: errIns } = await supabase
        .from('sessoes_atendimento')
        .insert({
          id_aluno: novaSessaoAluno.id_aluno,
          id_professor: idProfessor,
          id_sala: novaSala.id_sala,
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
          alunos ( usuarios ( name, foto_url ) ),
          salas_atendimento ( nome, tipo_sala ),
          progresso_aluno (
            id_progresso,
            id_disciplina,
            id_ano_escolar,
            matriculas ( numero_inscricao ),
            disciplinas ( nome_disciplina ),
            anos_escolares ( nome_ano )
          )
        `
        )
        .single()

      if (errIns) throw errIns

      // monta sessão
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

        aluno_nome: alunoUser?.name ?? novaSessaoAluno.nome,
        aluno_foto_url: alunoUser?.foto_url ?? null,
        numero_inscricao: mat?.numero_inscricao ? String(mat.numero_inscricao) : null,

        sala_nome: sala?.nome ?? novaSala.nome,
        sala_tipo: sala?.tipo_sala ?? novaSala.tipo_sala,

        disciplina_nome: disc?.nome_disciplina ?? '-',
        ano_nome: ano?.nome_ano ?? '-',
        id_disciplina: prog?.id_disciplina != null ? Number(prog.id_disciplina) : null,
        id_ano_escolar: prog?.id_ano_escolar != null ? Number(prog.id_ano_escolar) : null,
      }

      sucesso('Atendimento iniciado. Agora lance os protocolos desta sessão.')
      setDlgNovaSessao(false)

      await carregarSessoes(idProfessor, filtroDataInicio, filtroDataFim)

      setSessaoAtual(sessaoMontada)
      setDlgSessao(true)
      await carregarRegistrosDaSessao(sessaoMontada.id_sessao)
    },
    [
      supabase,
      usuario?.id,
      idProfessor,
      novaSala?.id_sala,
      novaSessaoAluno?.id_aluno,
      novaSessaoEntrada,
      novaSessaoResumo,
      carregarSessoes,
      filtroDataInicio,
      filtroDataFim,
      carregarRegistrosDaSessao,
      sucesso,
      novaSessaoAluno,
      novaSala,
    ]
  )

  // ===== Criar sessão (fluxo completo com regra das fichas) =====
  const criarSessao = useCallback(async () => {
    if (!supabase) return
    if (!idProfessor) {
      erro('Professor não identificado. Recarregue a página ou verifique seu vínculo.')
      return
    }
    if (!novaSala) {
      aviso('Selecione a sala do atendimento.')
      return
    }
    if (!novaSessaoAluno) {
      aviso('Selecione o aluno (nome ou matrícula).')
      return
    }
    if (!novaSessaoDiscAno) {
      aviso('Selecione a disciplina/ano desta sala.')
      return
    }

    setSalvandoNovaSessao(true)
    try {
      const idMatricula = novaSessaoMatriculaId ?? (await obterMatriculaPreferencial(novaSessaoAluno))
      if (!idMatricula) {
        aviso('Este aluno não possui matrícula cadastrada. A Secretaria deve cadastrar a matrícula primeiro.')
        return
      }

      const key = chaveDiscAno(novaSessaoDiscAno.id_disciplina, novaSessaoDiscAno.id_ano_escolar)
      const existente = fichasAlunoMap.get(key)

      if (existente?.id_progresso) {
        await inserirSessao(existente.id_progresso)
        return
      }

      // não existe ficha nessa disciplina -> perguntar se quer abrir
      if (qtdFichasAbertas >= 3 && !podeForcarAbrirDisciplina) {
        erro(
          `Este aluno já possui ${qtdFichasAbertas} disciplina(s) com ficha aberta. Somente Administração/Direção/Coordenação pode abrir uma nova disciplina.`
        )
        return
      }

      setDlgConfirmAbrirFicha(true)
    } catch (e: any) {
      console.error(e)
      erro(`Falha ao iniciar atendimento: ${e?.message || 'erro desconhecido'}`)
    } finally {
      if (mountedRef.current) setSalvandoNovaSessao(false)
    }
  }, [
    supabase,
    idProfessor,
    novaSala,
    novaSessaoAluno,
    novaSessaoDiscAno,
    novaSessaoMatriculaId,
    obterMatriculaPreferencial,
    fichasAlunoMap,
    qtdFichasAbertas,
    podeForcarAbrirDisciplina,
    inserirSessao,
    aviso,
    erro,
  ])

  const confirmarAbrirFichaECriarSessao = useCallback(async () => {
    if (!supabase) return
    if (!novaSessaoAluno || !novaSessaoDiscAno) return

    setSalvandoNovaSessao(true)
    try {
      const idMatricula = novaSessaoMatriculaId ?? (await obterMatriculaPreferencial(novaSessaoAluno))
      if (!idMatricula) {
        aviso('Aluno sem matrícula. A Secretaria deve cadastrar a matrícula primeiro.')
        return
      }

      const idProg = await criarProgresso(idMatricula, novaSessaoDiscAno.id_disciplina, novaSessaoDiscAno.id_ano_escolar)

      // atualiza estado local (pra não ficar “sem ficha” até o próximo refresh)
      const k = chaveDiscAno(novaSessaoDiscAno.id_disciplina, novaSessaoDiscAno.id_ano_escolar)
      setFichasAlunoMap((old) => {
        const n = new Map(old)
        n.set(k, {
          id_progresso: idProg,
          id_disciplina: novaSessaoDiscAno.id_disciplina,
          id_ano_escolar: novaSessaoDiscAno.id_ano_escolar,
          data_conclusao: null,
          status_nome: 'Cursando',
        })
        return n
      })

      setDlgConfirmAbrirFicha(false)
      await inserirSessao(idProg)
    } catch (e: any) {
      console.error(e)
      erro('Falha ao abrir ficha / criar sessão.')
    } finally {
      if (mountedRef.current) setSalvandoNovaSessao(false)
    }
  }, [supabase, novaSessaoAluno, novaSessaoDiscAno, novaSessaoMatriculaId, obterMatriculaPreferencial, criarProgresso, inserirSessao, aviso, erro])

  // ===== Abrir sessão =====
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

  // ===== Filtros =====
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

  // ===== Encerrar sessão =====
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

  // ===== Registros =====
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

  // ===== Efeitos iniciais =====
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

  // ===== Debounce da busca aluno =====
  useEffect(() => {
    if (!dlgNovaSessao) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      void buscarAlunos(alunoBuscaInput)
    }, 350)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [alunoBuscaInput, buscarAlunos, dlgNovaSessao])

  // ===== UI: cards de sessão =====
  const SessaoCard = ({ s }: { s: SessaoView }) => {
    const aberta = !s.hora_saida
    const borderColor = aberta ? theme.palette.warning.main : theme.palette.success.main

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 1.6,
          borderRadius: 2.5,
          borderColor: alpha(borderColor, theme.palette.mode === 'light' ? 0.35 : 0.45),
          bgcolor: alpha(borderColor, theme.palette.mode === 'light' ? 0.03 : 0.08),
          transition: 'transform 120ms ease',
          '&:hover': { transform: 'translateY(-1px)' },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={1.4} sx={{ minWidth: 0 }}>
            <Avatar src={s.aluno_foto_url ?? undefined} sx={{ width: 44, height: 44 }}>
              {(s.aluno_nome ?? '?').slice(0, 1).toUpperCase()}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }} noWrap>
                  {s.aluno_nome}
                </Typography>
                <Chip size="small" label={aberta ? 'Em atendimento' : 'Encerrada'} color={aberta ? 'warning' : 'success'} />
                {s.numero_inscricao ? <Chip size="small" label={`Matrícula: ${s.numero_inscricao}`} variant="outlined" /> : null}
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                <strong>{s.disciplina_nome ?? '-'}</strong> — {s.ano_nome ?? '-'} • {s.sala_nome ?? '-'}
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                Entrada: {formatarDataHoraBR(s.hora_entrada)} {s.hora_saida ? `• Saída: ${formatarDataHoraBR(s.hora_saida)}` : ''}
              </Typography>

              {s.resumo_atividades ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }} noWrap>
                  Resumo: {s.resumo_atividades}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => void abrirSessao(s)}>
            Abrir
          </Button>
        </Stack>
      </Paper>
    )
  }

  return (
    <Box sx={{ p: 2, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            Atendimentos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inicie atendimentos por <strong>Nome</strong> ou <strong>Nº da Matrícula</strong>, e lance protocolos.
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
            <Chip icon={<MeetingRoomIcon />} label={`Minhas salas: ${salas.length}`} variant="outlined" />
            <Chip icon={<SchoolIcon />} label={`Configurações: ${configs.length}`} variant="outlined" />
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirDialogNovaSessao} disabled={carregandoBase || !idProfessor || salas.length === 0}>
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
            <Select labelId="filtro-sala-label" label="Sala" value={filtroSalaId} onChange={(e) => setFiltroSalaId(String(e.target.value))}>
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
            label="Buscar (aluno, matrícula, disciplina, sala...)"
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

        {/* Lista em “estilo zip”: cards em grid */}
        {carregandoBase ? (
          <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : sessoesFiltradas.length === 0 ? (
          <Alert severity="info">
            Nenhuma sessão no período. Clique em <strong>Novo atendimento</strong> para iniciar.
          </Alert>
        ) : (
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                Em atendimento agora: {sessoesAbertas.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Clique em “Abrir” para lançar/editar protocolos.
              </Typography>

              <Box
                sx={{
                  mt: 1,
                  display: 'grid',
                  gap: 1,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                }}
              >
                {sessoesAbertas.map((s) => (
                  <SessaoCard key={s.id_sessao} s={s} />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                Histórico no período: {sessoesEncerradas.length}
              </Typography>

              <Box
                sx={{
                  mt: 1,
                  display: 'grid',
                  gap: 1,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                }}
              >
                {sessoesEncerradas.map((s) => (
                  <SessaoCard key={s.id_sessao} s={s} />
                ))}
              </Box>
            </Box>
          </Stack>
        )}
      </Paper>

      {/* Dialog: Novo Atendimento */}
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
              Fluxo v2: <strong>Sala</strong> → <strong>Aluno</strong> (nome/matrícula) → <strong>Disciplina</strong> → criar sessão.
            </Alert>

            {/* Sala (auto se tiver só 1) */}
            {salas.length <= 1 ? (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MeetingRoomIcon fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    Sala
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {novaSala ? (
                    <>
                      <strong>{novaSala.nome}</strong> ({novaSala.tipo_sala})
                    </>
                  ) : (
                    <em>Nenhuma sala encontrada para seu professor.</em>
                  )}
                </Typography>
              </Paper>
            ) : (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <MeetingRoomIcon fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    Escolha a sala do atendimento
                  </Typography>
                  {novaSala ? <Chip size="small" label={novaSala.nome} color="primary" variant="outlined" /> : null}
                </Stack>

                <Box
                  sx={{
                    mt: 1.2,
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  }}
                >
                  {salas.map((s) => {
                    const active = novaSala?.id_sala === s.id_sala
                    return (
                      <Paper
                        key={s.id_sala}
                        variant="outlined"
                        onClick={() => setNovaSala(s)}
                        sx={{
                          p: 1.4,
                          borderRadius: 2,
                          cursor: 'pointer',
                          borderColor: active ? theme.palette.primary.main : alpha(theme.palette.divider, 0.9),
                          bgcolor: active ? alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.06 : 0.15) : 'transparent',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                          {s.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.tipo_sala}
                        </Typography>
                      </Paper>
                    )
                  })}
                </Box>
              </Paper>
            )}

            {/* Aluno */}
            <Autocomplete
              options={alunoOpcoes}
              value={novaSessaoAluno}
              onChange={(_, v) => setNovaSessaoAluno(v)}
              inputValue={alunoBuscaInput}
              onInputChange={(_, v) => setAlunoBuscaInput(v)}
              getOptionLabel={(o) => {
                const ra = o.numero_inscricao ? ` — Matrícula: ${o.numero_inscricao}` : ''
                return `${o.nome}${ra}`
              }}
              noOptionsText={alunoBuscando ? 'Buscando...' : 'Digite pelo menos 2 caracteres'}
              loading={alunoBuscando}
              isOptionEqualToValue={(a, b) => a.id_aluno === b.id_aluno && (a.id_matricula ?? null) === (b.id_matricula ?? null)}
              renderOption={(props, o) => (
                <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {o.nome}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    {o.numero_inscricao ? <Chip size="small" label={`Matrícula: ${o.numero_inscricao}`} variant="outlined" /> : null}
                    {o.ano_letivo ? <Chip size="small" label={`Ano: ${o.ano_letivo}`} variant="outlined" /> : null}
                  </Stack>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Aluno (Nome ou Nº Matrícula)"
                  size="small"
                  placeholder="Ex.: Maria / 202400123"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <PersonSearchIcon fontSize="small" style={{ marginRight: 8, opacity: 0.65 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {alunoBuscando ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {/* Disciplina/Ano da sala */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SchoolIcon fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  Disciplina / Ano (pela sala)
                </Typography>
                {carregandoFichasAluno ? <Chip size="small" label="Carregando fichas..." variant="outlined" /> : null}
              </Stack>

              {!novaSala ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Selecione uma sala para ver as disciplinas.
                </Alert>
              ) : disciplinasDaSala.length === 0 ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Esta sala ainda não tem disciplinas configuradas em <code>salas_config_disciplina_ano</code>.
                </Alert>
              ) : !novaSessaoAluno ? (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Selecione o aluno para o sistema verificar se ele já tem ficha aberta em alguma disciplina desta sala.
                </Alert>
              ) : (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      size="small"
                      label={`Fichas abertas (global): ${qtdFichasAbertas}/3`}
                      color={qtdFichasAbertas >= 3 ? 'warning' : 'default'}
                      variant="outlined"
                    />
                    {!temFichaEmAlgumaDisciplinaDaSala ? (
                      <Chip size="small" label="Nenhuma ficha nesta sala" color="warning" variant="outlined" />
                    ) : (
                      <Chip size="small" label="Já possui ficha nesta sala" color="success" variant="outlined" />
                    )}
                    {qtdFichasAbertas >= 3 && !podeForcarAbrirDisciplina ? (
                      <Chip size="small" label="Professor não pode abrir nova disciplina" color="error" variant="outlined" />
                    ) : null}
                  </Stack>

                  <Autocomplete
                    options={disciplinasDaSala}
                    value={novaSessaoDiscAno}
                    onChange={(_, v) => setNovaSessaoDiscAno(v)}
                    getOptionLabel={(o) => o.label}
                    renderOption={(props, o) => {
                      const k = chaveDiscAno(o.id_disciplina, o.id_ano_escolar)
                      const prog = fichasAlunoMap.get(k)
                      const tem = !!prog
                      const aberta = prog ? !prog.data_conclusao : false

                      return (
                        <Box component="li" {...props} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {o.disciplina_nome} — {o.ano_nome}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Chip size="small" label={`Protocolos: ${o.quantidade_protocolos}`} variant="outlined" />
                            {tem ? (
                              <Chip size="small" label={aberta ? 'Ficha aberta' : 'Ficha existe'} color={aberta ? 'success' : 'info'} variant="outlined" />
                            ) : (
                              <Chip size="small" label="Sem ficha" color="warning" variant="outlined" />
                            )}
                          </Stack>
                        </Box>
                      )
                    }}
                    renderInput={(params) => <TextField {...params} label="Selecione a disciplina" size="small" />}
                    noOptionsText="Nenhuma disciplina configurada nesta sala"
                  />
                </Stack>
              )}
            </Paper>

            {/* Entrada e resumo */}
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
                size="small"
                label="Resumo inicial (opcional)"
                value={novaSessaoResumo}
                onChange={(e) => setNovaSessaoResumo(e.target.value)}
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgNovaSessao(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void criarSessao()} disabled={salvandoNovaSessao}>
            {salvandoNovaSessao ? 'Salvando...' : 'Iniciar atendimento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar abrir ficha */}
      <Dialog open={dlgConfirmAbrirFicha} onClose={() => setDlgConfirmAbrirFicha(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>
          Abrir ficha nesta disciplina?
          <IconButton onClick={() => setDlgConfirmAbrirFicha(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1}>
            <Alert severity="warning">
              O aluno não possui ficha nesta disciplina desta sala. Deseja <strong>abrir uma nova ficha</strong> para continuar?
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Fichas abertas (global): <strong>{qtdFichasAbertas}</strong>/3
            </Typography>

            {qtdFichasAbertas >= 3 && podeForcarAbrirDisciplina ? (
              <Alert severity="info">Seu perfil permite abrir mesmo com 3+ fichas abertas (Admin/Direção/Coordenação).</Alert>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={() => setDlgConfirmAbrirFicha(false)}>
            Não, voltar
          </Button>
          <Button variant="contained" color="warning" onClick={() => void confirmarAbrirFichaECriarSessao()} disabled={salvandoNovaSessao}>
            {salvandoNovaSessao ? 'Abrindo...' : 'Sim, abrir ficha e iniciar'}
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
                    <Avatar src={sessaoAtual.aluno_foto_url ?? undefined} sx={{ width: 44, height: 44 }}>
                      {(sessaoAtual.aluno_nome ?? '?').slice(0, 1).toUpperCase()}
                    </Avatar>

                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {sessaoAtual.aluno_nome}
                    </Typography>

                    <Chip size="small" label={sessaoAtual.hora_saida ? 'Encerrada' : 'Aberta'} color={sessaoAtual.hora_saida ? 'success' : 'warning'} />
                    {sessaoAtual.numero_inscricao ? <Chip size="small" label={`Matrícula: ${sessaoAtual.numero_inscricao}`} variant="outlined" /> : null}
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
                O número do protocolo é limitado pela configuração <code>config_disciplina_ano</code> (quando existir).
              </Alert>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="reg-numero-label">Nº do protocolo</InputLabel>
                  <Select labelId="reg-numero-label" label="Nº do protocolo" value={regNumero} onChange={(e) => setRegNumero(String(e.target.value))}>
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
