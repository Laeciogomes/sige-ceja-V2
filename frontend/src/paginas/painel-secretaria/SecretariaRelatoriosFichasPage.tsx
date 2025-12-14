// src/paginas/painel-secretaria/SecretariaRelatoriosFichasPage.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react'

import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
  Autocomplete,
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'
import TableViewIcon from '@mui/icons-material/TableView'
import DownloadIcon from '@mui/icons-material/Download'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import SchoolIcon from '@mui/icons-material/School'
import AssessmentIcon from '@mui/icons-material/Assessment'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'
import RefreshIcon from '@mui/icons-material/Refresh'
import ClearIcon from '@mui/icons-material/Clear'

import Papa from 'papaparse'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

type FormatoRelatorio = 'PDF' | 'EXCEL' | 'AMBOS'

type CategoriaRelatorio = 'Cadastrais' | 'Pedagógicos' | 'Administrativos'

interface RelatorioConfig {
  id: string
  titulo: string
  descricao: string
  categoria: CategoriaRelatorio
  formato: FormatoRelatorio
  icon: React.ReactNode
  cor: string

  // Regras de filtro
  requerAnoLetivo?: boolean
  requerAluno?: boolean
}

// ---------- Tipos mínimos para joins ----------

type UsuarioJoin = {
  id?: string
  name?: string
  email?: string
  foto_url?: string | null
  cpf?: string | null
  rg?: string | null
  celular?: string | null
  data_nascimento?: string | null
  sexo?: string | null
  logradouro?: string | null
  numero_endereco?: string | null
  bairro?: string | null
  municipio?: string | null
}

type AlunoJoin = {
  id_aluno: number
  nis?: string | null
  usuarios?: UsuarioJoin | UsuarioJoin[] | null
}

type TurmaJoin = {
  id_turma?: number
  nome?: string
  codigo_turma?: string | null
  turno?: string | null
}

type StatusMatriculaJoin = {
  id_status_matricula?: number
  nome?: string
}

type NivelEnsinoJoin = {
  id_nivel_ensino?: number
  nome?: string
}

type SalaJoin = {
  id_sala?: number
  nome?: string
}

type ProfessorJoin = {
  id_professor?: number
  usuarios?: UsuarioJoin | UsuarioJoin[] | null
}

type DisciplinaJoin = {
  id_disciplina?: number
  nome_disciplina?: string
  areas_conhecimento?: {
    id_area_conhecimento?: number
    nome_area?: string
  } | null
}

type AnoEscolarJoin = {
  id_ano_escolar?: number
  nome_ano?: string
}

type StatusDisciplinaJoin = {
  id_status_disciplina?: number
  nome?: string
}

type MatriculaRelatorioRow = {
  id_matricula: number
  ano_letivo: number
  numero_inscricao: string
  modalidade: string
  data_matricula: string
  data_conclusao: string | null

  alunos?: AlunoJoin | null
  turmas?: TurmaJoin | null
  niveis_ensino?: NivelEnsinoJoin | null
  status_matricula?: StatusMatriculaJoin | null
}

type SessaoRelatorioRow = {
  id_sessao: number
  hora_entrada: string
  hora_saida: string | null
  resumo_atividades: string | null

  salas_atendimento?: SalaJoin | null
  alunos?: AlunoJoin | null
  professores?: ProfessorJoin | null
}

type ProgressoRelatorioRow = {
  id_progresso: number
  nota_final: number | null
  data_conclusao: string | null
  observacoes: string | null

  disciplinas?: DisciplinaJoin | null
  anos_escolares?: AnoEscolarJoin | null
  status_disciplina_aluno?: StatusDisciplinaJoin | null
  matriculas?: {
    id_matricula?: number
    ano_letivo?: number
    alunos?: AlunoJoin | null
  } | null
}

// ---------- UI helpers ----------

type IndicadorCardProps = {
  titulo: string
  valor: string
  subtitulo?: string
  icon: React.ReactNode
  cor: string
  carregando?: boolean
}

const IndicadorCard: React.FC<IndicadorCardProps> = ({
  titulo,
  valor,
  subtitulo,
  icon,
  cor,
  carregando,
}) => {
  const theme = useTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {carregando ? (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
          }}
        />
      ) : null}

      <Stack direction="row" spacing={2} alignItems="flex-start" mb={1.5}>
        <Avatar
          variant="rounded"
          sx={{
            bgcolor: alpha(cor, 0.12),
            color: cor,
            width: 44,
            height: 44,
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
            {titulo}
          </Typography>

          <Typography
            variant="h5"
            fontWeight={800}
            sx={{ lineHeight: 1.1, wordBreak: 'break-word' }}
          >
            {carregando ? '—' : valor}
          </Typography>

          {subtitulo ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.4 }}
            >
              {subtitulo}
            </Typography>
          ) : null}
        </Box>
      </Stack>

      <Box
        sx={{
          position: 'absolute',
          right: -18,
          bottom: -18,
          width: 90,
          height: 90,
          borderRadius: '50%',
          bgcolor: alpha(cor, 0.08),
        }}
      />
    </Paper>
  )
}

// ---------- Utilidades ----------

const obterPrimeiro = <T,>(valor?: T | T[] | null): T | null => {
  if (!valor) return null
  if (Array.isArray(valor)) return valor[0] ?? null
  return valor
}

const escapeHtml = (texto: string): string =>
  texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const normalizarTexto = (valor: string): string => {
  try {
    return valor
      .normalize('NFD')
      // remove diacríticos
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
  } catch {
    return valor.toLowerCase().trim()
  }
}

const obterIntervaloAnoUTC = (ano: number) => {
  const inicio = new Date(Date.UTC(ano, 0, 1, 0, 0, 0, 0)).toISOString()
  const fim = new Date(Date.UTC(ano + 1, 0, 1, 0, 0, 0, 0)).toISOString()
  return { inicio, fim }
}

const baixarBlob = (nomeArquivo: string, blob: Blob) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

const baixarCsv = (nomeArquivo: string, linhas: Record<string, unknown>[]) => {
  const csv = Papa.unparse(linhas, {
    delimiter: ';',
    quotes: true,
    skipEmptyLines: 'greedy',
  })

  // BOM para Excel (UTF-8)
  const conteudo = `\uFEFF${csv}`
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' })
  baixarBlob(nomeArquivo, blob)
}

const formatarDataHora = (iso: string | null | undefined): string => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('pt-BR')
  } catch {
    return iso
  }
}

const nomeMesCurto = (mesIndex: number): string => {
  const meses = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]
  return meses[mesIndex] ?? `M${mesIndex + 1}`
}

// ---------- Relatórios disponíveis ----------

const relatoriosData: RelatorioConfig[] = [
  {
    id: 'rel-geral-alunos',
    titulo: 'Relatório Geral de Alunos (Ano Letivo)',
    descricao:
      'Listagem de matrículas do ano letivo selecionado, com dados básicos do aluno, turma e status.',
    categoria: 'Cadastrais',
    formato: 'EXCEL',
    icon: <PeopleAltIcon />,
    cor: '#2196F3',
    requerAnoLetivo: true,
  },
  {
    id: 'ficha-individual',
    titulo: 'Ficha Individual do Aluno',
    descricao:
      'Dados cadastrais e histórico de matrículas. Abre uma versão para impressão (Salvar como PDF).',
    categoria: 'Cadastrais',
    formato: 'PDF',
    icon: <AssignmentIndIcon />,
    cor: '#00BCD4',
    requerAluno: true,
  },
  {
    id: 'rel-frequencia-aluno',
    titulo: 'Frequência do Aluno (Atendimentos)',
    descricao:
      'Lista de atendimentos do aluno no ano selecionado (data/hora, sala, professor e resumo).',
    categoria: 'Pedagógicos',
    formato: 'EXCEL',
    icon: <EventAvailableIcon />,
    cor: '#7B1FA2',
    requerAnoLetivo: true,
    requerAluno: true,
  },
  {
    id: 'rel-salas',
    titulo: 'Ocupação por Sala de Atendimento (Ano)',
    descricao:
      'Exporta atendimentos do ano letivo selecionado com aluno, professor, sala e horários.',
    categoria: 'Pedagógicos',
    formato: 'EXCEL',
    icon: <SchoolIcon />,
    cor: '#FF9800',
    requerAnoLetivo: true,
  },
  {
    id: 'progresso-disciplina',
    titulo: 'Progresso por Disciplina (Ano)',
    descricao:
      'Exporta o progresso do aluno (por disciplina/ano escolar) filtrado pelo ano letivo selecionado.',
    categoria: 'Pedagógicos',
    formato: 'EXCEL',
    icon: <AssessmentIcon />,
    cor: '#4CAF50',
    requerAnoLetivo: true,
  },
  {
    id: 'censo-escolar',
    titulo: 'Exportação Censo Escolar',
    descricao:
      'Dados formatados para importação no sistema do Educacenso (em construção).',
    categoria: 'Administrativos',
    formato: 'EXCEL',
    icon: <TableViewIcon />,
    cor: '#607D8B',
  },
]

// ---------- Página ----------

type AlunoOpcao = {
  id_aluno: number
  nome: string
  email?: string | null
  foto_url?: string | null
}

type ResumoAno = {
  matriculasAno: number
  matriculasAtivasAno: number
  atendimentosAno: number
  protocolosAno: number
}

type ResumoAluno = {
  atendimentosTotal: number
  atendimentosDiasDistintos: number
  atendimentosPorMes: number[] // 12

  protocolosTotal: number
  protocolosPorStatus: Record<string, number>

  progressoTotalDisciplinas: number
  progressoPorStatus: Record<string, number>
}

const SecretariaRelatoriosFichasPage: React.FC = () => {
  const theme = useTheme()
  const { supabase } = useSupabase()
  const { sucesso, erro, aviso, info } = useNotificacaoContext()

  const [buscaRelatorio, setBuscaRelatorio] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Filtros
  const [anosLetivos, setAnosLetivos] = useState<number[]>([])
  const [carregandoAnosLetivos, setCarregandoAnosLetivos] = useState(false)
  const [anoLetivoSelecionado, setAnoLetivoSelecionado] = useState<number | ''>('')

  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoOpcao | null>(null)
  const [buscaAluno, setBuscaAluno] = useState('')
  const [opcoesAluno, setOpcoesAluno] = useState<AlunoOpcao[]>([])
  const [carregandoBuscaAluno, setCarregandoBuscaAluno] = useState(false)

  // Resumos
  const [carregandoResumoAno, setCarregandoResumoAno] = useState(false)
  const [resumoAno, setResumoAno] = useState<ResumoAno>({
    matriculasAno: 0,
    matriculasAtivasAno: 0,
    atendimentosAno: 0,
    protocolosAno: 0,
  })

  const [carregandoResumoAluno, setCarregandoResumoAluno] = useState(false)
  const [resumoAluno, setResumoAluno] = useState<ResumoAluno>({
    atendimentosTotal: 0,
    atendimentosDiasDistintos: 0,
    atendimentosPorMes: Array.from({ length: 12 }, () => 0),
    protocolosTotal: 0,
    protocolosPorStatus: {},
    progressoTotalDisciplinas: 0,
    progressoPorStatus: {},
  })

  // Cache interno de status (evita múltiplas queries)
  const statusMatriculaAtivoIdRef = useRef<number | null>(null)

  const carregarStatusMatriculaAtivoId = async (): Promise<number | null> => {
    if (!supabase) return null
    if (statusMatriculaAtivoIdRef.current) return statusMatriculaAtivoIdRef.current

    const { data, error: e } = await supabase
      .from('status_matricula')
      .select('id_status_matricula, nome')

    if (e) {
      console.error(e)
      return null
    }

    const ativo = (data ?? []).find((s: { id_status_matricula: number; nome: string }) =>
      ['ativo', 'ativa'].includes(normalizarTexto(s.nome)),
    )

    statusMatriculaAtivoIdRef.current = ativo?.id_status_matricula ?? null
    return statusMatriculaAtivoIdRef.current
  }

  const carregarAnosLetivos = async () => {
    if (!supabase) return

    setCarregandoAnosLetivos(true)
    try {
      // Não existe DISTINCT no client do Supabase; buscamos um número razoável e deduplicamos.
      const [{ data: anosMatriculas, error: errMat }, { data: anosTurmas, error: errTur }] =
        await Promise.all([
          supabase
            .from('matriculas')
            .select('ano_letivo')
            .order('ano_letivo', { ascending: false })
            .limit(2000),
          supabase
            .from('turmas')
            .select('ano_letivo')
            .order('ano_letivo', { ascending: false })
            .limit(2000),
        ])

      if (errMat) {
        console.error(errMat)
      }
      if (errTur) {
        console.error(errTur)
      }

      const anos = [
        ...(anosMatriculas ?? []).map((r: { ano_letivo: number }) => r.ano_letivo),
        ...(anosTurmas ?? []).map((r: { ano_letivo: number }) => r.ano_letivo),
      ]
        .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))

      const dedup = Array.from(new Set(anos)).sort((a, b) => b - a)

      // fallback: se a base estiver vazia, sugere o ano atual
      const anoAtual = new Date().getFullYear()
      const listaFinal = dedup.length > 0 ? dedup : [anoAtual]

      setAnosLetivos(listaFinal)

      // default (se ainda não setado)
      setAnoLetivoSelecionado(prev => {
        if (prev !== '') return prev
        if (listaFinal.includes(anoAtual)) return anoAtual
        return listaFinal[0] ?? ''
      })
    } catch (e) {
      console.error(e)
      erro('Não foi possível carregar os anos letivos disponíveis.', 'Erro')
    } finally {
      setCarregandoAnosLetivos(false)
    }
  }

  const carregarResumoDoAno = async (ano: number) => {
    if (!supabase) return

    setCarregandoResumoAno(true)
    try {
      const { inicio, fim } = obterIntervaloAnoUTC(ano)
      const statusAtivoId = await carregarStatusMatriculaAtivoId()

      const [
        { count: countMatriculasAno, error: eMatAno },
        { count: countMatriculasAtivas, error: eMatAtivas },
        { count: countSessoesAno, error: eSessoes },
        { count: countProtocolosAno, error: eProtocolos },
      ] = await Promise.all([
        supabase
          .from('matriculas')
          .select('id_matricula', { count: 'exact', head: true })
          .eq('ano_letivo', ano),
        statusAtivoId
          ? supabase
              .from('matriculas')
              .select('id_matricula', { count: 'exact', head: true })
              .eq('ano_letivo', ano)
              .eq('id_status_matricula', statusAtivoId)
          : supabase
              .from('matriculas')
              .select('id_matricula', { count: 'exact', head: true })
              .eq('ano_letivo', ano),
        supabase
          .from('sessoes_atendimento')
          .select('id_sessao', { count: 'exact', head: true })
          .gte('hora_entrada', inicio)
          .lt('hora_entrada', fim),
        supabase
          .from('registros_atendimento')
          .select('id_atividade', { count: 'exact', head: true })
          .gte('created_at', inicio)
          .lt('created_at', fim),
      ])

      if (eMatAno) console.error(eMatAno)
      if (eMatAtivas) console.error(eMatAtivas)
      if (eSessoes) console.error(eSessoes)
      if (eProtocolos) console.error(eProtocolos)

      setResumoAno({
        matriculasAno: countMatriculasAno ?? 0,
        matriculasAtivasAno: countMatriculasAtivas ?? 0,
        atendimentosAno: countSessoesAno ?? 0,
        protocolosAno: countProtocolosAno ?? 0,
      })
    } catch (e) {
      console.error(e)
      erro('Erro ao carregar indicadores do ano.', 'Erro')
    } finally {
      setCarregandoResumoAno(false)
    }
  }

  const carregarResumoDoAluno = async (ano: number, alunoId: number) => {
    if (!supabase) return

    setCarregandoResumoAluno(true)
    try {
      const { inicio, fim } = obterIntervaloAnoUTC(ano)

      // 1) Sessões (frequência)
      const { data: sessoesData, error: eSessoes } = await supabase
        .from('sessoes_atendimento')
        .select('hora_entrada')
        .eq('id_aluno', alunoId)
        .gte('hora_entrada', inicio)
        .lt('hora_entrada', fim)
        .order('hora_entrada', { ascending: true })
        .limit(2000)

      if (eSessoes) {
        console.error(eSessoes)
        throw new Error('Falha ao carregar atendimentos do aluno.')
      }

      const horas = (sessoesData ?? []).map((s: { hora_entrada: string }) => s.hora_entrada)

      const diasSet = new Set<string>()
      const porMes = Array.from({ length: 12 }, () => 0)

      for (const h of horas) {
        const d = new Date(h)
        // usamos UTC para coerência com o filtro UTC
        const diaIso = d.toISOString().slice(0, 10)
        diasSet.add(diaIso)
        porMes[d.getUTCMonth()] = (porMes[d.getUTCMonth()] ?? 0) + 1
      }

      // 2) Protocolos / atividades do aluno (via inner join na sessão)
      const { data: protocolosData, error: eProtocolos } = await supabase
        .from('registros_atendimento')
        .select(
          `
            status,
            sessoes_atendimento!inner(
              id_aluno,
              hora_entrada
            )
          `,
        )
        .eq('sessoes_atendimento.id_aluno', alunoId)
        .gte('sessoes_atendimento.hora_entrada', inicio)
        .lt('sessoes_atendimento.hora_entrada', fim)
        .limit(5000)

      if (eProtocolos) {
        console.error(eProtocolos)
        throw new Error('Falha ao carregar protocolos do aluno.')
      }

      const statusContagem: Record<string, number> = {}
      const statusEsperados = ['A fazer', 'Em andamento', 'Concluída']

      for (const st of statusEsperados) {
        statusContagem[st] = 0
      }

      for (const item of protocolosData ?? []) {
        const raw = (item as { status?: string }).status ?? ''
        const norm = normalizarTexto(raw)

        let chave = raw
        if (norm.includes('conclu')) chave = 'Concluída'
        else if (norm.includes('andamento')) chave = 'Em andamento'
        else if (norm.includes('fazer')) chave = 'A fazer'
        else chave = raw || 'Outro'

        statusContagem[chave] = (statusContagem[chave] ?? 0) + 1
      }

      const totalProtocolos = Object.values(statusContagem).reduce((acc, v) => acc + v, 0)

      // 3) Progresso (disciplinas) do aluno no ano (via matrículas do ano)
      const { data: matriculasAlunoAno, error: eMatriculasAluno } = await supabase
        .from('matriculas')
        .select('id_matricula')
        .eq('id_aluno', alunoId)
        .eq('ano_letivo', ano)

      if (eMatriculasAluno) {
        console.error(eMatriculasAluno)
        throw new Error('Falha ao carregar matrícula do aluno no ano.')
      }

      const idsMatriculas = (matriculasAlunoAno ?? [])
        .map((m: { id_matricula: number }) => m.id_matricula)
        .filter((v): v is number => typeof v === 'number')

      let progressoTotal = 0
      const progressoStatus: Record<string, number> = {}

      if (idsMatriculas.length > 0) {
        const { data: progressoData, error: eProg } = await supabase
          .from('progresso_aluno')
          .select(
            `
              id_progresso,
              status_disciplina_aluno(
                nome
              )
            `,
          )
          .in('id_matricula', idsMatriculas)
          .limit(5000)

        if (eProg) {
          console.error(eProg)
          throw new Error('Falha ao carregar progresso do aluno.')
        }

        progressoTotal = (progressoData ?? []).length

        for (const row of progressoData ?? []) {
          const nomeStatus =
            (row as { status_disciplina_aluno?: { nome?: string } | null }).status_disciplina_aluno
              ?.nome ?? 'Sem status'
          progressoStatus[nomeStatus] = (progressoStatus[nomeStatus] ?? 0) + 1
        }
      }

      setResumoAluno({
        atendimentosTotal: horas.length,
        atendimentosDiasDistintos: diasSet.size,
        atendimentosPorMes: porMes,
        protocolosTotal: totalProtocolos,
        protocolosPorStatus: statusContagem,
        progressoTotalDisciplinas: progressoTotal,
        progressoPorStatus: progressoStatus,
      })
    } catch (e) {
      console.error(e)
      erro(
        e instanceof Error ? e.message : 'Erro ao carregar indicadores do aluno.',
        'Erro',
      )
    } finally {
      setCarregandoResumoAluno(false)
    }
  }

  // Busca de aluno (debounce)
  const debounceRef = useRef<number | null>(null)

  const buscarAlunos = async (termo: string) => {
    if (!supabase) return

    const t = termo.trim()
    if (t.length < 2) {
      setOpcoesAluno([])
      return
    }

    setCarregandoBuscaAluno(true)

    try {
      const termoNumerico = Number(t)
      const isId = Number.isFinite(termoNumerico) && String(termoNumerico) === t

      const queryBase = supabase
        .from('alunos')
        .select(
          `
            id_aluno,
            usuarios!inner(
              name,
              email,
              foto_url
            )
          `,
        )
        .limit(15)
        .order('id_aluno', { ascending: false })

      const { data, error: e } = isId
        ? await queryBase.eq('id_aluno', termoNumerico)
        : await queryBase.ilike('usuarios.name', `%${t}%`)

      if (e) {
        console.error(e)
        throw new Error('Falha ao buscar alunos.')
      }

      const opcoes: AlunoOpcao[] = (data ?? []).map((a: { id_aluno: number; usuarios?: UsuarioJoin | UsuarioJoin[] | null }) => {
        const u = obterPrimeiro(a.usuarios)
        return {
          id_aluno: a.id_aluno,
          nome: u?.name ?? `Aluno #${a.id_aluno}`,
          email: u?.email ?? null,
          foto_url: u?.foto_url ?? null,
        }
      })

      setOpcoesAluno(opcoes)
    } catch (e) {
      console.error(e)
      setOpcoesAluno([])
    } finally {
      setCarregandoBuscaAluno(false)
    }
  }

  // Busca paginada (para exportações)
  const fetchAllPaginated = async <T,>(
    builder: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown | null }>,
    opts?: { pageSize?: number; maxRows?: number },
  ): Promise<T[]> => {
    const pageSize = opts?.pageSize ?? 1000
    const maxRows = opts?.maxRows ?? 20000

    let from = 0
    let all: T[] = []

    while (true) {
      const to = from + pageSize - 1
      const { data, error: e } = await builder(from, to)
      if (e) throw e

      const page = data ?? []
      all = all.concat(page)

      if (page.length < pageSize) break
      if (all.length >= maxRows) break

      from += pageSize
    }

    return all.slice(0, maxRows)
  }

  // ---------- Geração de relatórios ----------

  const gerarRelatorioGeralAlunosAno = async (ano: number) => {
    if (!supabase) return

    const statusAtivoId = await carregarStatusMatriculaAtivoId()

    const linhas = await fetchAllPaginated<MatriculaRelatorioRow>(
      async (from, to) => {
        const q = supabase
          .from('matriculas')
          .select(
            `
              id_matricula,
              ano_letivo,
              numero_inscricao,
              modalidade,
              data_matricula,
              data_conclusao,
              alunos(
                id_aluno,
                nis,
                usuarios(
                  name,
                  email,
                  cpf,
                  rg,
                  celular,
                  data_nascimento,
                  sexo,
                  municipio,
                  bairro,
                  logradouro,
                  numero_endereco
                )
              ),
              turmas(
                nome,
                codigo_turma,
                turno
              ),
              niveis_ensino(
                nome
              ),
              status_matricula(
                nome
              )
            `,
          )
          .eq('ano_letivo', ano)
          .order('id_matricula', { ascending: true })
          .range(from, to)

        // Por padrão, puxa todas as matrículas do ano.
        // Se existir um status "Ativo/Ativa" cadastrado, prioriza filtrar para alunos ativos.
        const { data, error: e } = statusAtivoId
          ? await q.eq('id_status_matricula', statusAtivoId)
          : await q

        return { data: data as MatriculaRelatorioRow[] | null, error: e as unknown | null }
      },
      { pageSize: 1000, maxRows: 20000 },
    )

    if (linhas.length >= 20000) {
      aviso(
        'Exportação muito grande: limitamos em 20.000 registros para evitar travamento do navegador.',
        'Atenção',
      )
    }

    const csvRows = linhas.map(m => {
      const aluno = m.alunos ?? null
      const usuario = obterPrimeiro(aluno?.usuarios) ?? null

      return {
        id_matricula: m.id_matricula,
        ano_letivo: m.ano_letivo,
        numero_inscricao: m.numero_inscricao,
        modalidade: m.modalidade,
        status_matricula: m.status_matricula?.nome ?? '',
        nivel_ensino: m.niveis_ensino?.nome ?? '',
        turma: m.turmas?.nome ?? '',
        turno: m.turmas?.turno ?? '',
        codigo_turma: m.turmas?.codigo_turma ?? '',
        data_matricula: m.data_matricula,
        data_conclusao: m.data_conclusao ?? '',

        id_aluno: aluno?.id_aluno ?? '',
        nis: aluno?.nis ?? '',
        aluno_nome: usuario?.name ?? '',
        aluno_email: usuario?.email ?? '',
        cpf: usuario?.cpf ?? '',
        rg: usuario?.rg ?? '',
        celular: usuario?.celular ?? '',
        data_nascimento: usuario?.data_nascimento ?? '',
        sexo: usuario?.sexo ?? '',

        municipio: usuario?.municipio ?? '',
        bairro: usuario?.bairro ?? '',
        logradouro: usuario?.logradouro ?? '',
        numero_endereco: usuario?.numero_endereco ?? '',
      }
    })

    baixarCsv(`relatorio-geral-alunos_${ano}.csv`, csvRows)
  }

  const gerarFichaIndividualImpressao = async (aluno: AlunoOpcao) => {
    if (!supabase) return

    const [{ data: alunoRow, error: eAluno }, { data: matriculas, error: eMat }] =
      await Promise.all([
        supabase
          .from('alunos')
          .select(
            `
              id_aluno,
              nis,
              nome_mae,
              nome_pai,
              usa_transporte_escolar,
              possui_necessidade_especial,
              qual_necessidade_especial,
              possui_restricao_alimentar,
              qual_restricao_alimentar,
              possui_beneficio_governo,
              qual_beneficio_governo,
              observacoes_gerais,
              usuarios(
                name,
                email,
                cpf,
                rg,
                celular,
                data_nascimento,
                sexo,
                municipio,
                bairro,
                logradouro,
                numero_endereco
              )
            `,
          )
          .eq('id_aluno', aluno.id_aluno)
          .maybeSingle(),
        supabase
          .from('matriculas')
          .select(
            `
              id_matricula,
              ano_letivo,
              numero_inscricao,
              modalidade,
              data_matricula,
              data_conclusao,
              niveis_ensino(nome),
              turmas(nome, turno),
              status_matricula(nome)
            `,
          )
          .eq('id_aluno', aluno.id_aluno)
          .order('ano_letivo', { ascending: false })
          .order('data_matricula', { ascending: false }),
      ])

    if (eAluno) {
      console.error(eAluno)
      throw new Error('Falha ao carregar dados do aluno.')
    }
    if (eMat) {
      console.error(eMat)
      throw new Error('Falha ao carregar matrículas do aluno.')
    }

    const usuario = obterPrimeiro((alunoRow as { usuarios?: UsuarioJoin | UsuarioJoin[] | null } | null)?.usuarios)

    const linhasMatriculas = (matriculas ?? [])
      .map(m => {
        const nivel = (m as { niveis_ensino?: { nome?: string } | null }).niveis_ensino?.nome ?? ''
        const turma = (m as { turmas?: { nome?: string; turno?: string } | null }).turmas
        const status = (m as { status_matricula?: { nome?: string } | null }).status_matricula?.nome ?? ''

        return `
          <tr>
            <td>${escapeHtml(String((m as { ano_letivo?: number }).ano_letivo ?? ''))}</td>
            <td>${escapeHtml(String((m as { numero_inscricao?: string }).numero_inscricao ?? ''))}</td>
            <td>${escapeHtml(String((m as { modalidade?: string }).modalidade ?? ''))}</td>
            <td>${escapeHtml(status)}</td>
            <td>${escapeHtml(nivel)}</td>
            <td>${escapeHtml(String(turma?.nome ?? ''))}</td>
            <td>${escapeHtml(String(turma?.turno ?? ''))}</td>
            <td>${escapeHtml(String((m as { data_matricula?: string }).data_matricula ?? ''))}</td>
            <td>${escapeHtml(String((m as { data_conclusao?: string | null }).data_conclusao ?? ''))}</td>
          </tr>
        `
      })
      .join('')

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Ficha do Aluno - ${escapeHtml(aluno.nome)}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            h1 { margin: 0 0 4px; font-size: 20px; }
            h2 { margin: 18px 0 8px; font-size: 16px; }
            .sub { color: #444; font-size: 12px; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
            .item { font-size: 12px; }
            .label { color: #555; font-weight: 700; margin-right: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 11px; text-align: left; }
            th { background: #f2f2f2; }
            .footer { margin-top: 18px; font-size: 10px; color: #666; }
            @page { margin: 18mm; }
          </style>
        </head>
        <body>
          <h1>Ficha Individual do Aluno</h1>
          <div class="sub">Gerado em ${escapeHtml(new Date().toLocaleString('pt-BR'))}</div>

          <h2>Identificação</h2>
          <div class="grid">
            <div class="item"><span class="label">ID Aluno:</span> ${escapeHtml(String(aluno.id_aluno))}</div>
            <div class="item"><span class="label">Nome:</span> ${escapeHtml(String(usuario?.name ?? aluno.nome))}</div>
            <div class="item"><span class="label">E-mail:</span> ${escapeHtml(String(usuario?.email ?? ''))}</div>
            <div class="item"><span class="label">NIS:</span> ${escapeHtml(String((alunoRow as { nis?: string | null } | null)?.nis ?? ''))}</div>

            <div class="item"><span class="label">CPF:</span> ${escapeHtml(String(usuario?.cpf ?? ''))}</div>
            <div class="item"><span class="label">RG:</span> ${escapeHtml(String(usuario?.rg ?? ''))}</div>
            <div class="item"><span class="label">Celular:</span> ${escapeHtml(String(usuario?.celular ?? ''))}</div>
            <div class="item"><span class="label">Data Nasc.:</span> ${escapeHtml(String(usuario?.data_nascimento ?? ''))}</div>

            <div class="item"><span class="label">Município:</span> ${escapeHtml(String(usuario?.municipio ?? ''))}</div>
            <div class="item"><span class="label">Bairro:</span> ${escapeHtml(String(usuario?.bairro ?? ''))}</div>
            <div class="item"><span class="label">Logradouro:</span> ${escapeHtml(String(usuario?.logradouro ?? ''))}</div>
            <div class="item"><span class="label">Número:</span> ${escapeHtml(String(usuario?.numero_endereco ?? ''))}</div>
          </div>

          <h2>Informações Complementares</h2>
          <div class="grid">
            <div class="item"><span class="label">Nome da mãe:</span> ${escapeHtml(String((alunoRow as { nome_mae?: string } | null)?.nome_mae ?? ''))}</div>
            <div class="item"><span class="label">Nome do pai:</span> ${escapeHtml(String((alunoRow as { nome_pai?: string | null } | null)?.nome_pai ?? ''))}</div>

            <div class="item"><span class="label">Transporte escolar:</span> ${escapeHtml(String((alunoRow as { usa_transporte_escolar?: boolean } | null)?.usa_transporte_escolar ? 'Sim' : 'Não'))}</div>
            <div class="item"><span class="label">Necessidade especial:</span> ${escapeHtml(String((alunoRow as { possui_necessidade_especial?: boolean } | null)?.possui_necessidade_especial ? 'Sim' : 'Não'))}</div>
            <div class="item"><span class="label">Qual necessidade:</span> ${escapeHtml(String((alunoRow as { qual_necessidade_especial?: string | null } | null)?.qual_necessidade_especial ?? ''))}</div>

            <div class="item"><span class="label">Restrição alimentar:</span> ${escapeHtml(String((alunoRow as { possui_restricao_alimentar?: boolean } | null)?.possui_restricao_alimentar ? 'Sim' : 'Não'))}</div>
            <div class="item"><span class="label">Qual restrição:</span> ${escapeHtml(String((alunoRow as { qual_restricao_alimentar?: string | null } | null)?.qual_restricao_alimentar ?? ''))}</div>

            <div class="item"><span class="label">Benefício do governo:</span> ${escapeHtml(String((alunoRow as { possui_beneficio_governo?: boolean } | null)?.possui_beneficio_governo ? 'Sim' : 'Não'))}</div>
            <div class="item"><span class="label">Qual benefício:</span> ${escapeHtml(String((alunoRow as { qual_beneficio_governo?: string | null } | null)?.qual_beneficio_governo ?? ''))}</div>
          </div>

          <h2>Histórico de Matrículas</h2>
          <table>
            <thead>
              <tr>
                <th>Ano</th>
                <th>Inscrição</th>
                <th>Modalidade</th>
                <th>Status</th>
                <th>Nível</th>
                <th>Turma</th>
                <th>Turno</th>
                <th>Data Matrícula</th>
                <th>Data Conclusão</th>
              </tr>
            </thead>
            <tbody>
              ${linhasMatriculas || '<tr><td colspan="9">Sem matrículas encontradas.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">SIGECEJA V2</div>
        </body>
      </html>
    `

    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) {
      aviso(
        'O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.',
        'Atenção',
      )
      return
    }

    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  const gerarFrequenciaAlunoAno = async (ano: number, aluno: AlunoOpcao) => {
    if (!supabase) return

    const { inicio, fim } = obterIntervaloAnoUTC(ano)

    const linhas = await fetchAllPaginated<SessaoRelatorioRow>(
      async (from, to) => {
        const { data, error: e } = await supabase
          .from('sessoes_atendimento')
          .select(
            `
              id_sessao,
              hora_entrada,
              hora_saida,
              resumo_atividades,
              salas_atendimento(
                nome
              ),
              professores(
                usuarios(
                  name
                )
              )
            `,
          )
          .eq('id_aluno', aluno.id_aluno)
          .gte('hora_entrada', inicio)
          .lt('hora_entrada', fim)
          .order('hora_entrada', { ascending: true })
          .range(from, to)

        return { data: data as SessaoRelatorioRow[] | null, error: e as unknown | null }
      },
      { pageSize: 1000, maxRows: 20000 },
    )

    const csvRows = linhas.map(s => {
      const profUsuario = obterPrimeiro(s.professores?.usuarios)

      return {
        ano_letivo: ano,
        id_aluno: aluno.id_aluno,
        aluno_nome: aluno.nome,
        id_sessao: s.id_sessao,
        hora_entrada: formatarDataHora(s.hora_entrada),
        hora_saida: formatarDataHora(s.hora_saida),
        sala: s.salas_atendimento?.nome ?? '',
        professor: profUsuario?.name ?? '',
        resumo: s.resumo_atividades ?? '',
      }
    })

    baixarCsv(`frequencia_aluno_${aluno.id_aluno}_${ano}.csv`, csvRows)
  }

  const gerarOcupacaoPorSalaAno = async (ano: number) => {
    if (!supabase) return

    const { inicio, fim } = obterIntervaloAnoUTC(ano)

    const linhas = await fetchAllPaginated<SessaoRelatorioRow>(
      async (from, to) => {
        const { data, error: e } = await supabase
          .from('sessoes_atendimento')
          .select(
            `
              id_sessao,
              hora_entrada,
              hora_saida,
              resumo_atividades,
              salas_atendimento(
                nome
              ),
              alunos(
                id_aluno,
                usuarios(
                  name
                )
              ),
              professores(
                id_professor,
                usuarios(
                  name
                )
              )
            `,
          )
          .gte('hora_entrada', inicio)
          .lt('hora_entrada', fim)
          .order('hora_entrada', { ascending: true })
          .range(from, to)

        return { data: data as SessaoRelatorioRow[] | null, error: e as unknown | null }
      },
      { pageSize: 1000, maxRows: 20000 },
    )

    if (linhas.length >= 20000) {
      aviso(
        'Exportação muito grande: limitamos em 20.000 registros para evitar travamento do navegador.',
        'Atenção',
      )
    }

    const csvRows = linhas.map(s => {
      const alunoUsuario = obterPrimeiro(s.alunos?.usuarios)
      const profUsuario = obterPrimeiro(s.professores?.usuarios)

      return {
        ano_letivo: ano,
        id_sessao: s.id_sessao,
        hora_entrada: formatarDataHora(s.hora_entrada),
        hora_saida: formatarDataHora(s.hora_saida),
        sala: s.salas_atendimento?.nome ?? '',
        id_aluno: s.alunos?.id_aluno ?? '',
        aluno_nome: alunoUsuario?.name ?? '',
        id_professor: s.professores?.id_professor ?? '',
        professor_nome: profUsuario?.name ?? '',
        resumo: s.resumo_atividades ?? '',
      }
    })

    baixarCsv(`ocupacao_salas_${ano}.csv`, csvRows)
  }

  const gerarProgressoPorDisciplinaAno = async (ano: number) => {
    if (!supabase) return

    const linhas = await fetchAllPaginated<ProgressoRelatorioRow>(
      async (from, to) => {
        const { data, error: e } = await supabase
          .from('progresso_aluno')
          .select(
            `
              id_progresso,
              nota_final,
              data_conclusao,
              observacoes,
              disciplinas(
                nome_disciplina,
                areas_conhecimento(
                  nome_area
                )
              ),
              anos_escolares(
                nome_ano
              ),
              status_disciplina_aluno(
                nome
              ),
              matriculas!inner(
                ano_letivo,
                alunos(
                  id_aluno,
                  usuarios(
                    name
                  )
                )
              )
            `,
          )
          .eq('matriculas.ano_letivo', ano)
          .order('id_progresso', { ascending: true })
          .range(from, to)

        return { data: data as ProgressoRelatorioRow[] | null, error: e as unknown | null }
      },
      { pageSize: 1000, maxRows: 20000 },
    )

    if (linhas.length >= 20000) {
      aviso(
        'Exportação muito grande: limitamos em 20.000 registros para evitar travamento do navegador.',
        'Atenção',
      )
    }

    const csvRows = linhas.map(p => {
      const alunoJoin = p.matriculas?.alunos ?? null
      const alunoUsuario = obterPrimeiro(alunoJoin?.usuarios)

      return {
        ano_letivo: ano,
        id_progresso: p.id_progresso,
        id_aluno: alunoJoin?.id_aluno ?? '',
        aluno_nome: alunoUsuario?.name ?? '',
        area: p.disciplinas?.areas_conhecimento?.nome_area ?? '',
        disciplina: p.disciplinas?.nome_disciplina ?? '',
        ano_escolar: p.anos_escolares?.nome_ano ?? '',
        status: p.status_disciplina_aluno?.nome ?? '',
        nota_final: p.nota_final ?? '',
        data_conclusao: p.data_conclusao ?? '',
        observacoes: p.observacoes ?? '',
      }
    })

    baixarCsv(`progresso_por_disciplina_${ano}.csv`, csvRows)
  }

  const handleGerarRelatorio = async (relatorio: RelatorioConfig) => {
    if (!supabase) {
      erro(
        'Supabase não está configurado. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
        'Configuração',
      )
      return
    }

    if (relatorio.requerAnoLetivo && anoLetivoSelecionado === '') {
      aviso('Selecione um ano letivo antes de gerar este relatório.', 'Filtro obrigatório')
      return
    }

    if (relatorio.requerAluno && !alunoSelecionado) {
      aviso('Selecione um aluno antes de gerar este relatório.', 'Filtro obrigatório')
      return
    }

    setLoadingId(relatorio.id)
    try {
      if (relatorio.id === 'rel-geral-alunos') {
        await gerarRelatorioGeralAlunosAno(Number(anoLetivoSelecionado))
        sucesso('Arquivo gerado com sucesso.', relatorio.titulo)
        return
      }

      if (relatorio.id === 'ficha-individual') {
        await gerarFichaIndividualImpressao(alunoSelecionado as AlunoOpcao)
        info('Abrimos a ficha para impressão. Use “Salvar como PDF”.', 'Ficha pronta')
        return
      }

      if (relatorio.id === 'rel-frequencia-aluno') {
        await gerarFrequenciaAlunoAno(Number(anoLetivoSelecionado), alunoSelecionado as AlunoOpcao)
        sucesso('Arquivo gerado com sucesso.', relatorio.titulo)
        return
      }

      if (relatorio.id === 'rel-salas') {
        await gerarOcupacaoPorSalaAno(Number(anoLetivoSelecionado))
        sucesso('Arquivo gerado com sucesso.', relatorio.titulo)
        return
      }

      if (relatorio.id === 'progresso-disciplina') {
        await gerarProgressoPorDisciplinaAno(Number(anoLetivoSelecionado))
        sucesso('Arquivo gerado com sucesso.', relatorio.titulo)
        return
      }

      // fallback
      aviso('Relatório em construção. (Card já está pronto; falta regra de exportação.)', 'Em breve')
    } catch (e) {
      console.error(e)
      erro('Não foi possível gerar o relatório. Verifique permissões/RLS e tente novamente.', 'Erro')
    } finally {
      setLoadingId(null)
    }
  }

  // ---------- Efeitos ----------

  useEffect(() => {
    // Ao entrar na página
    void carregarAnosLetivos()
    // Garantir cache de status logo cedo (não é obrigatório, mas melhora UX)
    void carregarStatusMatriculaAtivoId()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  useEffect(() => {
    if (anoLetivoSelecionado === '') return
    void carregarResumoDoAno(Number(anoLetivoSelecionado))
    // Se houver aluno selecionado, recarrega indicador do aluno também
    if (alunoSelecionado) {
      void carregarResumoDoAluno(Number(anoLetivoSelecionado), alunoSelecionado.id_aluno)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anoLetivoSelecionado])

  useEffect(() => {
    if (anoLetivoSelecionado === '' || !alunoSelecionado) {
      // reseta para não ficar mostrando dados de outro aluno
      setResumoAluno({
        atendimentosTotal: 0,
        atendimentosDiasDistintos: 0,
        atendimentosPorMes: Array.from({ length: 12 }, () => 0),
        protocolosTotal: 0,
        protocolosPorStatus: {},
        progressoTotalDisciplinas: 0,
        progressoPorStatus: {},
      })
      return
    }

    void carregarResumoDoAluno(Number(anoLetivoSelecionado), alunoSelecionado.id_aluno)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoSelecionado])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      void buscarAlunos(buscaAluno)
    }, 350)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaAluno])

  // ---------- UI (relatórios filtrados) ----------

  const relatoriosFiltrados = useMemo(() => {
    const termo = buscaRelatorio.trim().toLowerCase()
    if (!termo) return relatoriosData

    return relatoriosData.filter(rel =>
      rel.titulo.toLowerCase().includes(termo) || rel.descricao.toLowerCase().includes(termo),
    )
  }, [buscaRelatorio])

  const categorias = useMemo(() => {
    return Array.from(new Set(relatoriosFiltrados.map(r => r.categoria)))
  }, [relatoriosFiltrados])

  const chipsFrequenciaMes = useMemo(() => {
    const chips: { mes: string; valor: number }[] = []
    resumoAluno.atendimentosPorMes.forEach((v, idx) => {
      if (v > 0) chips.push({ mes: nomeMesCurto(idx), valor: v })
    })
    return chips
  }, [resumoAluno.atendimentosPorMes])

  const chipsProtocolos = useMemo(() => {
    return Object.entries(resumoAluno.protocolosPorStatus)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
  }, [resumoAluno.protocolosPorStatus])

  const chipsProgresso = useMemo(() => {
    return Object.entries(resumoAluno.progressoPorStatus)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
  }, [resumoAluno.progressoPorStatus])

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Central de Relatórios e Indicadores
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Selecione o ano letivo (e, se necessário, um aluno) para ver indicadores e gerar exportações.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          bgcolor: theme.palette.background.default,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Ano letivo</InputLabel>
            <Select
              value={anoLetivoSelecionado}
              label="Ano letivo"
              onChange={e => setAnoLetivoSelecionado(Number(e.target.value))}
              disabled={carregandoAnosLetivos || !supabase}
            >
              {anosLetivos.map(ano => (
                <MenuItem key={ano} value={ano}>
                  {ano}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            fullWidth
            options={opcoesAluno}
            loading={carregandoBuscaAluno}
            value={alunoSelecionado}
            onChange={(_e, novo) => setAlunoSelecionado(novo)}
            inputValue={buscaAluno}
            onInputChange={(_e, novoValor) => setBuscaAluno(novoValor)}
            getOptionLabel={opt => `${opt.nome} (ID: ${opt.id_aluno})`}
            isOptionEqualToValue={(o, v) => o.id_aluno === v.id_aluno}
            noOptionsText={buscaAluno.trim().length < 2 ? 'Digite pelo menos 2 caracteres...' : 'Nenhum aluno encontrado'}
            renderInput={params => (
              <TextField
                {...params}
                size="small"
                label="Buscar aluno (nome ou ID)"
                placeholder="Ex: Maria / 123"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {carregandoBuscaAluno ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Limpar aluno">
              <span>
                <IconButton
                  onClick={() => {
                    setAlunoSelecionado(null)
                    setBuscaAluno('')
                    setOpcoesAluno([])
                  }}
                  disabled={!alunoSelecionado}
                >
                  <ClearIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Atualizar indicadores">
              <span>
                <IconButton
                  onClick={() => {
                    if (anoLetivoSelecionado === '') {
                      aviso('Selecione um ano letivo.', 'Filtro')
                      return
                    }
                    void carregarResumoDoAno(Number(anoLetivoSelecionado))
                    if (alunoSelecionado) {
                      void carregarResumoDoAluno(Number(anoLetivoSelecionado), alunoSelecionado.id_aluno)
                    }
                  }}
                  disabled={anoLetivoSelecionado === ''}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <TextField
          fullWidth
          size="small"
          placeholder="Buscar relatório (ex: 'Alunos', 'Progresso', 'Frequência')..."
          value={buscaRelatorio}
          onChange={e => setBuscaRelatorio(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'background.paper' }}
        />
      </Paper>

      {!supabase ? (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Supabase não configurado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Defina as variáveis <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> no
            build (Cloudflare Pages) para habilitar relatórios e indicadores.
          </Typography>
        </Paper>
      ) : null}

      {/* Indicadores do ano */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="h6" fontWeight={800}>
            Indicadores do Ano Letivo
          </Typography>
          {anoLetivoSelecionado !== '' ? (
            <Chip label={`Ano ${anoLetivoSelecionado}`} size="small" sx={{ fontWeight: 700 }} />
          ) : null}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          <IndicadorCard
            titulo="Matrículas no ano"
            valor={String(resumoAno.matriculasAno)}
            subtitulo="Total de matrículas cadastradas"
            icon={<PeopleAltIcon />}
            cor={theme.palette.primary.main}
            carregando={carregandoResumoAno}
          />

          <IndicadorCard
            titulo="Matrículas ativas"
            valor={String(resumoAno.matriculasAtivasAno)}
            subtitulo="Status Ativo/Ativa"
            icon={<PeopleAltIcon />}
            cor="#4CAF50"
            carregando={carregandoResumoAno}
          />

          <IndicadorCard
            titulo="Atendimentos (sessões)"
            valor={String(resumoAno.atendimentosAno)}
            subtitulo="Sessoes_atendimento no ano"
            icon={<EventAvailableIcon />}
            cor="#2196F3"
            carregando={carregandoResumoAno}
          />

          <IndicadorCard
            titulo="Protocolos lançados"
            valor={String(resumoAno.protocolosAno)}
            subtitulo="Registros_atendimento no ano"
            icon={<PlaylistAddCheckIcon />}
            cor="#FF9800"
            carregando={carregandoResumoAno}
          />
        </Box>
      </Box>

      {/* Indicadores do aluno */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="h6" fontWeight={800}>
            Indicadores do Aluno
          </Typography>

          {alunoSelecionado ? (
            <Chip
              label={`${alunoSelecionado.nome} (ID ${alunoSelecionado.id_aluno})`}
              size="small"
              sx={{ fontWeight: 700, maxWidth: 520 }}
            />
          ) : (
            <Chip
              label="Selecione um aluno para ver frequência e progresso"
              size="small"
              variant="outlined"
            />
          )}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2.25,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {carregandoResumoAluno ? (
              <LinearProgress
                sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }}
              />
            ) : null}

            <Stack direction="row" spacing={2} alignItems="flex-start" mb={1.5}>
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: alpha('#2196F3', 0.12),
                  color: '#2196F3',
                  width: 44,
                  height: 44,
                }}
              >
                <EventAvailableIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                  Frequência (Atendimentos)
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                  {alunoSelecionado ? resumoAluno.atendimentosTotal : '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
                  Dias distintos: {alunoSelecionado ? resumoAluno.atendimentosDiasDistintos : '—'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {alunoSelecionado ? (
                chipsFrequenciaMes.length > 0 ? (
                  chipsFrequenciaMes.map(c => (
                    <Chip
                      key={c.mes}
                      size="small"
                      label={`${c.mes}: ${c.valor}`}
                      sx={{ fontWeight: 700 }}
                    />
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Sem atendimentos no ano selecionado.
                  </Typography>
                )
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Selecione um aluno para exibir a distribuição por mês.
                </Typography>
              )}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.25,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {carregandoResumoAluno ? (
              <LinearProgress
                sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }}
              />
            ) : null}

            <Stack direction="row" spacing={2} alignItems="flex-start" mb={1.5}>
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: alpha('#FF9800', 0.12),
                  color: '#FF9800',
                  width: 44,
                  height: 44,
                }}
              >
                <PlaylistAddCheckIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                  Protocolos (Atividades)
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                  {alunoSelecionado ? resumoAluno.protocolosTotal : '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
                  Status (A fazer / Andamento / Concluída)
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {alunoSelecionado ? (
                chipsProtocolos.length > 0 ? (
                  chipsProtocolos.map(([k, v]) => (
                    <Chip key={k} size="small" label={`${k}: ${v}`} sx={{ fontWeight: 700 }} />
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Sem protocolos registrados no ano selecionado.
                  </Typography>
                )
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Selecione um aluno para exibir os protocolos por status.
                </Typography>
              )}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.25,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {carregandoResumoAluno ? (
              <LinearProgress
                sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }}
              />
            ) : null}

            <Stack direction="row" spacing={2} alignItems="flex-start" mb={1.5}>
              <Avatar
                variant="rounded"
                sx={{
                  bgcolor: alpha('#4CAF50', 0.12),
                  color: '#4CAF50',
                  width: 44,
                  height: 44,
                }}
              >
                <AssessmentIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                  Progresso (Disciplinas)
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                  {alunoSelecionado ? resumoAluno.progressoTotalDisciplinas : '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
                  Disciplinas registradas no progresso
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {alunoSelecionado ? (
                chipsProgresso.length > 0 ? (
                  chipsProgresso.map(([k, v]) => (
                    <Chip key={k} size="small" label={`${k}: ${v}`} sx={{ fontWeight: 700 }} />
                  ))
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Sem progresso cadastrado para a matrícula do ano selecionado.
                  </Typography>
                )
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Selecione um aluno para exibir o progresso por status.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Lista de relatórios */}
      {relatoriosFiltrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5, opacity: 0.7 }}>
          <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            Nenhum relatório encontrado
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Tente buscar com outros termos.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={4}>
          {categorias.map(cat => (
            <Box key={cat}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 2, color: theme.palette.primary.main }}
              >
                {cat}
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {relatoriosFiltrados
                  .filter(r => r.categoria === cat)
                  .map(relatorio => (
                    <Paper
                      key={relatorio.id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        transition: 'all 0.2s ease-in-out',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          borderColor: relatorio.cor,
                          boxShadow: `0 4px 12px ${alpha(relatorio.cor, 0.15)}`,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      {loadingId === relatorio.id ? (
                        <LinearProgress
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                          }}
                          color="primary"
                        />
                      ) : null}

                      <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                        <Avatar
                          variant="rounded"
                          sx={{
                            bgcolor: alpha(relatorio.cor, 0.1),
                            color: relatorio.cor,
                          }}
                        >
                          {relatorio.icon}
                        </Avatar>

                        <Box>
                          <Typography
                            variant="subtitle1"
                            fontWeight={800}
                            lineHeight={1.2}
                            mb={0.5}
                          >
                            {relatorio.titulo}
                          </Typography>

                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            <Chip
                              label={
                                relatorio.formato === 'AMBOS'
                                  ? 'PDF / Excel'
                                  : relatorio.formato
                              }
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                fontWeight: 700,
                              }}
                            />

                            {relatorio.requerAnoLetivo ? (
                              <Chip
                                label="Ano letivo"
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  fontWeight: 700,
                                }}
                              />
                            ) : null}

                            {relatorio.requerAluno ? (
                              <Chip
                                label="Aluno"
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  fontWeight: 700,
                                }}
                              />
                            ) : null}
                          </Stack>
                        </Box>
                      </Stack>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, minHeight: 44 }}
                      >
                        {relatorio.descricao}
                      </Typography>

                      <Divider sx={{ mb: 2 }} />

                      <Button
                        variant="contained"
                        fullWidth
                        disabled={loadingId === relatorio.id}
                        onClick={() => void handleGerarRelatorio(relatorio)}
                        startIcon={loadingId === relatorio.id ? null : <DownloadIcon />}
                        sx={{
                          bgcolor: alpha(relatorio.cor, 0.92),
                          '&:hover': { bgcolor: relatorio.cor },
                          textTransform: 'none',
                          fontWeight: 700,
                        }}
                      >
                        {loadingId === relatorio.id ? 'Gerando...' : 'Gerar Arquivo'}
                      </Button>
                    </Paper>
                  ))}
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}

export default SecretariaRelatoriosFichasPage
