// src/paginas/fichas/FichaAcompanhamentoPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'
import { useAuth } from '../../contextos/AuthContext'

// ===================== Helpers =====================

function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function normalizarTexto(valor: string): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function formatDateBR(iso?: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

function formatTimeBR(iso?: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateTimeBR(iso?: string | null): string {
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

function parseNota(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function isModalidadeOrientacao(modalidade?: string | null): boolean {
  const s = normalizarTexto(modalidade ?? '')
  return s.includes('orientacao')
}

// datetime-local helpers (ISO <-> input local)
function formatForInputLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function inputLocalToISO(v: string): string {
  const d = new Date(v)
  return d.toISOString()
}

function arredondarMediaFinal(n: number | null): number | null {
  if (n === null || !Number.isFinite(n)) return null

  // ✅ regra generalizada por faixas (0,25 / 0,75)
  const inteiro = Math.floor(n)
  const frac = n - inteiro

  if (frac < 0.25) return inteiro
  if (frac < 0.75) return inteiro + 0.5
  return inteiro + 1
}

function formatarBR(n: number): string {
  // 6 -> "6" | 6.5 -> "6,5"
  return Number.isInteger(n) ? String(n) : String(n).replace('.', ',')
}

// ===================== Pé-de-Meia (triagem local) =====================
// Observação: regras oficiais podem mudar; aqui é uma TRIAGEM baseada em dados disponíveis no SIGE.

type PeDeMeiaModalidade = 'REGULAR' | 'EJA'
type PeDeMeiaClassificacao = 'ELEGIVEL' | 'ELEGIVEL_ATE_FIM_DO_PERIODO' | 'NAO_ELEGIVEL' | 'INDETERMINADO'

type PeDeMeiaInput = {
  id_nivel_ensino?: number | null
  cpf?: string | null
  data_nascimento?: string | null
  ano_letivo?: number | null
  data_matricula?: string | null
  nis?: string | null
  possui_beneficio_governo?: boolean | null
  qual_beneficio_governo?: string | null
  modalidade?: PeDeMeiaModalidade | null
}

type PeDeMeiaResultado = {
  classificacao: PeDeMeiaClassificacao
  modalidade: PeDeMeiaModalidade
  erros: string[]
  avisos: string[]
}

type PeDeMeiaConfig = {
  modalidade_padrao?: PeDeMeiaModalidade
  tipo_periodo_eja?: 'SEMESTRAL' | 'ANUAL'
  exigir_cpf?: boolean
  exigir_cadunico?: boolean
  validar_prazo_matricula?: boolean
  prazo_matricula_meses?: number
  // calendário “padrão” (pode variar por rede/estado)
  inicio_ano_letivo_mes?: number // 1..12
  inicio_ano_letivo_dia?: number // 1..31
  inicio_semestre2_mes?: number
  inicio_semestre2_dia?: number
  fim_semestre1_mes?: number
  fim_semestre1_dia?: number
  fim_ano_letivo_mes?: number
  fim_ano_letivo_dia?: number
}

const PEDEMEIA_DEFAULT: Required<PeDeMeiaConfig> = {
  modalidade_padrao: 'EJA',
  tipo_periodo_eja: 'SEMESTRAL',
  exigir_cpf: true,
  exigir_cadunico: true,
  // ⚠️ como o calendário real pode variar, aqui a validação vira “conferir” (não bloqueia automaticamente)
  validar_prazo_matricula: true,
  prazo_matricula_meses: 2,

  // calendário base (ajustável depois, se você me passar as datas oficiais do seu CEJA)
  inicio_ano_letivo_mes: 1,
  inicio_ano_letivo_dia: 7,
  inicio_semestre2_mes: 7,
  inicio_semestre2_dia: 1,
  fim_semestre1_mes: 7,
  fim_semestre1_dia: 1,
  fim_ano_letivo_mes: 12,
  fim_ano_letivo_dia: 31,
}

function criarDataUTC(ano: number, mes1a12: number, dia: number): Date {
  const m = Math.max(1, Math.min(12, Number(mes1a12))) - 1
  const d = Math.max(1, Math.min(31, Number(dia)))
  return new Date(Date.UTC(ano, m, d, 12, 0, 0))
}

function parseDataFlex(valor: string | null | undefined): Date | null {
  if (!valor) return null
  const s = String(valor).trim()
  if (!s) return null

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map((x) => Number(x))
    if (!y || !m || !d) return null
    return criarDataUTC(y, m, d)
  }

  // ISO datetime
  const dt = new Date(s)
  if (Number.isNaN(dt.getTime())) return null
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 12, 0, 0))
}

function somenteDigitos(valor: string): string {
  return (valor || '').replace(/\D+/g, '')
}

function temCpfMinimoOk(cpf: string | null | undefined): boolean {
  const d = somenteDigitos(String(cpf || ''))
  return d.length === 11
}

function calcularIdadeUTC(nasc: Date, ref: Date): number {
  const an = nasc.getUTCFullYear()
  const mn = nasc.getUTCMonth()
  const dn = nasc.getUTCDate()

  const ar = ref.getUTCFullYear()
  const mr = ref.getUTCMonth()
  const dr = ref.getUTCDate()

  let idade = ar - an
  if (mr < mn || (mr === mn && dr < dn)) idade -= 1
  return idade
}

function inferirCadUnico(input: PeDeMeiaInput): boolean | null {
  const nis = somenteDigitos(String(input.nis || ''))
  if (nis.length >= 8) return true

  if (input.possui_beneficio_governo === true) return true
  if (input.possui_beneficio_governo === false) return false

  return null
}

function addMesesUTC(data: Date, meses: number): Date {
  const d = new Date(data.getTime())
  const ano = d.getUTCFullYear()
  const mes = d.getUTCMonth()
  const dia = d.getUTCDate()
  return new Date(Date.UTC(ano, mes + meses, dia, 12, 0, 0))
}

function determinarPeriodo(
  modalidade: PeDeMeiaModalidade,
  tipoPeriodoEja: 'SEMESTRAL' | 'ANUAL',
  dataMatricula: Date | null,
  anoRef: number,
  cfg: Required<Pick<
    PeDeMeiaConfig,
    | 'inicio_ano_letivo_mes'
    | 'inicio_ano_letivo_dia'
    | 'inicio_semestre2_mes'
    | 'inicio_semestre2_dia'
    | 'fim_semestre1_mes'
    | 'fim_semestre1_dia'
    | 'fim_ano_letivo_mes'
    | 'fim_ano_letivo_dia'
  >>
): { inicio: Date; fim: Date; tipo: 'SEMESTRAL' | 'ANUAL' } {
  const fimAno = criarDataUTC(anoRef, cfg.fim_ano_letivo_mes, cfg.fim_ano_letivo_dia)

  if (modalidade === 'EJA') {
    if (tipoPeriodoEja === 'ANUAL') {
      const inicioAno = criarDataUTC(anoRef, cfg.inicio_ano_letivo_mes, cfg.inicio_ano_letivo_dia)
      return { inicio: inicioAno, fim: fimAno, tipo: 'ANUAL' }
    }

    const inicioSem1 = criarDataUTC(anoRef, cfg.inicio_ano_letivo_mes, cfg.inicio_ano_letivo_dia)
    const inicioSem2 = criarDataUTC(anoRef, cfg.inicio_semestre2_mes, cfg.inicio_semestre2_dia)
    const fimSem1 = criarDataUTC(anoRef, cfg.fim_semestre1_mes, cfg.fim_semestre1_dia)

    const semestre2 = dataMatricula ? dataMatricula.getUTCMonth() + 1 >= cfg.inicio_semestre2_mes : false
    if (semestre2) return { inicio: inicioSem2, fim: fimAno, tipo: 'SEMESTRAL' }
    return { inicio: inicioSem1, fim: fimSem1, tipo: 'SEMESTRAL' }
  }

  const inicioAno = criarDataUTC(anoRef, cfg.inicio_ano_letivo_mes, cfg.inicio_ano_letivo_dia)
  return { inicio: inicioAno, fim: fimAno, tipo: 'ANUAL' }
}

function avaliarPeDeMeia(input: PeDeMeiaInput, config?: PeDeMeiaConfig): PeDeMeiaResultado {
  const cfg = { ...PEDEMEIA_DEFAULT, ...(config || {}) }
  const agora = new Date()
  const anoRef = Number(input.ano_letivo || agora.getUTCFullYear())

  const modalidade: PeDeMeiaModalidade = (input.modalidade || cfg.modalidade_padrao) as PeDeMeiaModalidade
  const tipoPeriodo = modalidade === 'EJA' ? cfg.tipo_periodo_eja : 'ANUAL'

  const erros: string[] = []
  const avisos: string[] = []

  // Ensino Médio (programa é para Ensino Médio)
  if (input.id_nivel_ensino != null && Number(input.id_nivel_ensino) !== 2) {
    erros.push('Não é Ensino Médio (Pé-de-Meia é para Ensino Médio).')
  }

  // CPF (mínimo)
  const cpfOk = temCpfMinimoOk(input.cpf)
  if (cfg.exigir_cpf && !cpfOk) {
    avisos.push('CPF ausente/ inválido (sem CPF regular, o pagamento não acontece).')
  }

  // CadÚnico (inferência por NIS ou benefício informado)
  const cad = inferirCadUnico(input)
  if (cfg.exigir_cadunico) {
    if (cad === false) erros.push('Sem indício de CadÚnico/baixa renda (NIS vazio e sem benefício informado).')
    if (cad === null) avisos.push('CadÚnico não confirmado (NIS vazio e benefício não informado).')
  }

  // Datas para idade
  const dataNascimento = parseDataFlex(input.data_nascimento || null)
  if (!dataNascimento) avisos.push('Data de nascimento não informada (idade não pode ser confirmada).')

  const dataMatricula = parseDataFlex(input.data_matricula || null)
  if (!dataMatricula) avisos.push('Data de matrícula não informada (prazo de matrícula não pode ser conferido).')

  const periodo = determinarPeriodo(modalidade, tipoPeriodo, dataMatricula, anoRef, {
    inicio_ano_letivo_mes: cfg.inicio_ano_letivo_mes,
    inicio_ano_letivo_dia: cfg.inicio_ano_letivo_dia,
    inicio_semestre2_mes: cfg.inicio_semestre2_mes,
    inicio_semestre2_dia: cfg.inicio_semestre2_dia,
    fim_semestre1_mes: cfg.fim_semestre1_mes,
    fim_semestre1_dia: cfg.fim_semestre1_dia,
    fim_ano_letivo_mes: cfg.fim_ano_letivo_mes,
    fim_ano_letivo_dia: cfg.fim_ano_letivo_dia,
  })

  const data31 = criarDataUTC(anoRef, 12, 31)

  const idadeInicio = dataNascimento ? calcularIdadeUTC(dataNascimento, periodo.inicio) : null
  const idadeFim = dataNascimento ? calcularIdadeUTC(dataNascimento, periodo.fim) : null
  const idade31 = dataNascimento ? calcularIdadeUTC(dataNascimento, data31) : null

  // Regras de idade (baseadas no que o MEC divulga: Regular 14–24; EJA 19–24)
  if (modalidade === 'REGULAR') {
    if (idadeInicio != null && (idadeInicio < 14 || idadeInicio > 24)) {
      erros.push('Fora da faixa etária do Ensino Médio regular (14 a 24 anos).')
    }
  } else {
    // EJA
    if (idade31 != null && idade31 < 19) erros.push('EJA: precisa ter 19+ até 31/12 do ano de referência.')
    if (idadeInicio != null && idadeInicio > 24) erros.push('EJA: fora da faixa etária (início do período com mais de 24 anos).')

    // regra operacional: se completa 25 durante o período, tende a desligar ao final do período
    if (idadeInicio != null && idadeFim != null && idadeInicio < 25 && idadeFim >= 25) {
      avisos.push('EJA: completa 25 durante o período; tende a ser desligado ao final do período letivo.')
    }
  }

  // Prazo matrícula: até X meses do início do período (aqui marcamos como “conferir”, pois calendário real pode variar)
  if (cfg.validar_prazo_matricula && dataMatricula) {
    const limite = addMesesUTC(periodo.inicio, cfg.prazo_matricula_meses)
    const dentro = dataMatricula.getTime() <= limite.getTime()
    if (!dentro) {
      avisos.push(`Matrícula parece fora do prazo (após ${cfg.prazo_matricula_meses} meses do início do período). Conferir calendário da rede.`)
    }
  }

  // Classificação final (triagem)
  let classificacao: PeDeMeiaClassificacao = 'ELEGIVEL'

  if (erros.length > 0) {
    classificacao = 'NAO_ELEGIVEL'
  } else {
    const faltaCpf = cfg.exigir_cpf && !cpfOk
    const faltaIdade = dataNascimento == null
    const faltaCad = cfg.exigir_cadunico && cad == null

    // Se faltar dado essencial ou existir aviso relevante (ex.: prazo), preferimos “INDETERMINADO”
    const temAvisoRelevante = avisos.some((a) => normalizarTexto(a).includes('prazo') || normalizarTexto(a).includes('calendario'))

    if (faltaCpf || faltaIdade || faltaCad || temAvisoRelevante) {
      classificacao = 'INDETERMINADO'
    }
  }

  return { classificacao, modalidade, erros, avisos }
}

function labelPeDeMeia(classificacao: PeDeMeiaClassificacao): string {
  switch (classificacao) {
    case 'ELEGIVEL':
      return 'Elegível'
    case 'ELEGIVEL_ATE_FIM_DO_PERIODO':
      return 'Elegível (até fim do período)'
    case 'NAO_ELEGIVEL':
      return 'Não elegível'
    case 'INDETERMINADO':
    default:
      return 'Conferir dados'
  }
}

function chipColorPeDeMeia(classificacao: PeDeMeiaClassificacao): 'success' | 'warning' | 'error' | 'default' {
  switch (classificacao) {
    case 'ELEGIVEL':
      return 'success'
    case 'ELEGIVEL_ATE_FIM_DO_PERIODO':
      return 'warning'
    case 'NAO_ELEGIVEL':
      return 'error'
    case 'INDETERMINADO':
    default:
      return 'warning'
  }
}

function modalidadePeDeMeiaSugerida(matriculaModalidade: string | null | undefined): PeDeMeiaModalidade {
  const m = normalizarTexto(matriculaModalidade ?? '')
  if (m.includes('regular')) return 'REGULAR'
  if (m.includes('eja')) return 'EJA'
  // CEJA normalmente é EJA
  return 'EJA'
}

// ===================== Constantes =====================

const TIPOS = {
  PESQUISA: 1,
  COMPLEMENTAR: 2,
  AVALIACAO: 3,
  ASO: 4,
  RECUPERACAO: 5,
} as const

// ===================== Types =====================

type TipoProtocoloRow = {
  id_tipo_protocolo: number
  nome: string
}

type UsuarioJoin = {
  id?: string
  name?: string
  email?: string
  foto_url?: string | null
  cpf?: string | null
  data_nascimento?: string | null
}

type AlunoJoin = {
  id_aluno: number
  nis?: string | null
  possui_necessidade_especial: boolean
  qual_necessidade_especial?: string | null
  possui_beneficio_governo?: boolean | null
  qual_beneficio_governo?: string | null
  usuarios?: UsuarioJoin | UsuarioJoin[] | null
}

type MatriculaJoin = {
  id_matricula: number
  numero_inscricao: string
  modalidade: string
  ano_letivo: number
  data_matricula: string
  id_nivel_ensino?: number | null
  niveis_ensino?: { nome?: string | null } | { nome?: string | null }[] | null
  alunos?: AlunoJoin | AlunoJoin[] | null
}

type DisciplinaJoin = {
  id_disciplina: number
  nome_disciplina: string
}

type AnoEscolarJoin = {
  id_ano_escolar: number
  nome_ano: string
  id_nivel_ensino?: number | null
}

type ProgressoJoin = {
  id_progresso: number
  id_matricula: number
  id_disciplina: number
  id_ano_escolar: number
  nota_final: number | null
  observacoes: string | null
  disciplinas?: DisciplinaJoin | DisciplinaJoin[] | null
  anos_escolares?: AnoEscolarJoin | AnoEscolarJoin[] | null
  matriculas?: MatriculaJoin | MatriculaJoin[] | null
}

type RegistroAtividade = {
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

type GradeData = {
  headers: { serie: string; colspan: number }[]
  protocolos: number[]
  body: { etapa: string; notas: (number | null)[] }[]
  mediaFinal: number | null
}

type ProtocoloAtividadeState = {
  id_tipo: number
  registro: {
    id_atividade?: number
    id_sessao?: number
    status?: string
    nota?: number | string | null
    is_adaptada?: boolean
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

// ===================== Subcomponentes =====================

function FichaHeader(props: {
  progresso: ProgressoJoin
  anosCursados?: string
  peDeMeia: PeDeMeiaResultado
  isPCD: boolean
}) {
  const { progresso, anosCursados, peDeMeia, isPCD } = props

  const disc = first(progresso.disciplinas)
  const mat = first(progresso.matriculas)
  const aluno = first(mat?.alunos)
  const user = first(aluno?.usuarios)
  const nivel = first(mat?.niveis_ensino)?.nome ?? ''
  const modalidade = String(mat?.modalidade ?? '')

  const tooltipPeDeMeia = useMemo(() => {
    const linhas: string[] = []
    if (peDeMeia.erros?.length) {
      linhas.push('Motivos (não elegível):')
      peDeMeia.erros.forEach((e) => linhas.push(`• ${e}`))
    }
    if (peDeMeia.avisos?.length) {
      if (linhas.length) linhas.push('')
      linhas.push('Observações:')
      peDeMeia.avisos.forEach((a) => linhas.push(`• ${a}`))
    }
    return linhas.join('\n') || 'Sem detalhes.'
  }, [peDeMeia])

  return (
    <Paper
      sx={{
        p: 2,
        mb: 3,
        borderRadius: '12px',
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'center', sm: 'center' }}
        sx={{ width: '100%', minWidth: 0 }}
      >
        <Avatar sx={{ width: 86, height: 86, flexShrink: 0 }} src={user?.foto_url ?? undefined} variant="rounded">
          <PersonIcon sx={{ fontSize: 60 }} />
        </Avatar>

        <Box sx={{ width: '100%', minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              lineHeight: 1.1,
              textAlign: { xs: 'center', sm: 'left' },
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}
          >
            {user?.name ?? 'Aluno'}
          </Typography>

          {/* chips quebram linha no mobile */}
          <Stack
            direction="row"
            useFlexGap
            flexWrap="wrap"
            spacing={1}
            sx={{
              mt: 1,
              width: '100%',
              justifyContent: { xs: 'center', sm: 'flex-start' },
              '& .MuiChip-root': { maxWidth: '100%' },
              '& .MuiChip-label': { whiteSpace: 'normal' },
            }}
          >
            <Chip label={`RA: ${mat?.numero_inscricao ?? '-'}`} size="small" />
            <Chip label={disc?.nome_disciplina ?? '-'} color="primary" size="small" />

            <Tooltip title={<span style={{ whiteSpace: 'pre-wrap' }}>{tooltipPeDeMeia}</span>} arrow>
              <Chip
                label={`Pé-de-Meia: ${labelPeDeMeia(peDeMeia.classificacao)}`}
                color={chipColorPeDeMeia(peDeMeia.classificacao)}
                variant={peDeMeia.classificacao === 'ELEGIVEL' ? 'filled' : 'outlined'}
                size="small"
              />
            </Tooltip>

            <Chip
              label={isPCD ? 'PCD: Sim' : 'PCD: Não'}
              color={isPCD ? 'info' : 'default'}
              variant={isPCD ? 'filled' : 'outlined'}
              size="small"
            />
          </Stack>

          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              Nível: {nivel || '-'}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
              Modalidade: <strong>{modalidade || '-'}</strong>
              {modalidade === 'Aproveitamento de Estudos' && anosCursados ? ` (${anosCursados})` : ''}
            </Typography>
          </Box>

          {aluno?.possui_necessidade_especial ? (
            <Chip
              icon={<WarningAmberIcon />}
              label={aluno?.qual_necessidade_especial || 'Necessidade Especial Declarada'}
              color="warning"
              size="small"
              sx={{
                mt: 1.25,
                height: 'auto',
                maxWidth: '100%',
                '& .MuiChip-label': { py: '4px', whiteSpace: 'normal', lineHeight: 1.2 },
              }}
            />
          ) : null}
        </Box>
      </Stack>
    </Paper>
  )
}

function GradeDeNotas(props: { gradeData: GradeData | null }) {
  const { gradeData } = props
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  if (!gradeData || !gradeData.headers?.length) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Nenhum protocolo definido para esta ficha.
      </Alert>
    )
  }

  // Descobre a “Série” (header) de cada protocolo pelo colspan acumulado
  const getSerieByIndex = (idx: number): string => {
    let acc = 0
    for (const h of gradeData.headers) {
      const start = acc
      const end = acc + Number(h.colspan || 0) - 1
      if (idx >= start && idx <= end) return h.serie
      acc += Number(h.colspan || 0)
    }
    return gradeData.headers[0]?.serie ?? '-'
  }

  // ======= MOBILE: cards =======
  if (isMobile) {
    return (
      <>
        <Typography variant="h6" gutterBottom>
          Grade de Notas
        </Typography>

        {/* Média final */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            mb: 2,
            width: '100%',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography sx={{ fontWeight: 900 }}>Média Final</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: 22 }}>
              {(() => {
                const v = arredondarMediaFinal(gradeData.mediaFinal)
                return v !== null ? formatarBR(v) : '-'
              })()}
            </Typography>
          </Stack>
        </Paper>

        {/* Cards por protocolo */}
        <Stack spacing={1.5}>
          {gradeData.protocolos.map((numeroProtocolo, idx) => {
            const serie = getSerieByIndex(idx)

            return (
              <Paper
                key={`${serie}-${numeroProtocolo}`}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  width: '100%',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                    <Typography sx={{ fontWeight: 900 }}>
                      {serie} • Protocolo {numeroProtocolo}ª
                    </Typography>
                  </Stack>

                  <Divider />

                  {/* linhas da grade */}
                  <Stack spacing={0.75}>
                    {gradeData.body.map((row) => {
                      const val = row.notas[idx] ?? null
                      return (
                        <Stack key={row.etapa} direction="row" justifyContent="space-between" spacing={2}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                            {row.etapa}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 900 }}>
                            {val !== null ? String(val).replace('.', ',') : '-'}
                          </Typography>
                        </Stack>
                      )
                    })}
                  </Stack>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      </>
    )
  }

  // ======= DESKTOP: tabela =======
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Grade de Notas
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '12px',
          mb: 2,
          width: '100%',
          maxWidth: '100%',
          overflowX: 'auto',
        }}
      >
        <Table
          size="small"
          sx={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: 900,
          }}
        >
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, border: '1px solid #ddd', whiteSpace: 'nowrap' }} rowSpan={2}>
                ETAPA/SÉRIE
              </TableCell>

              {gradeData.headers.map((h) => (
                <TableCell
                  key={h.serie}
                  align="center"
                  colSpan={h.colspan}
                  sx={{ fontWeight: 900, border: '1px solid #ddd', whiteSpace: 'nowrap' }}
                >
                  {h.serie}
                </TableCell>
              ))}

              <TableCell sx={{ fontWeight: 900, border: '1px solid #ddd', whiteSpace: 'nowrap' }} rowSpan={2}>
                MÉDIA
              </TableCell>
            </TableRow>

            <TableRow>
              {gradeData.protocolos.map((p) => (
                <TableCell key={p} align="center" sx={{ fontWeight: 900, border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                  {p}ª
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {gradeData.body.map((row, idx) => (
              <TableRow key={row.etapa}>
                <TableCell sx={{ fontWeight: 900, border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{row.etapa}</TableCell>

                {row.notas.map((nota, i) => (
                  <TableCell key={i} align="center" sx={{ border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                    {nota !== null ? String(nota).replace('.', ',') : '-'}
                  </TableCell>
                ))}

                {idx === 0 ? (
                  <TableCell
                    align="center"
                    rowSpan={gradeData.body.length}
                    sx={{
                      fontWeight: 900,
                      fontSize: '1.05rem',
                      verticalAlign: 'middle',
                      border: '1px solid #ddd',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {(() => {
                      const v = arredondarMediaFinal(gradeData.mediaFinal)
                      return v !== null ? formatarBR(v) : '-'
                    })()}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

function HistoricoAtendimentos(props: {
  sessoes: SessaoHistorico[]
  onEdit: (s: SessaoHistorico) => void
  onDelete: (s: SessaoHistorico) => void
}) {
  const { sessoes, onEdit, onDelete } = props
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const hasActivityType = (sessao: SessaoHistorico, type: 'AT' | 'AV' | 'RE') => {
    const typeMap: Record<'AT' | 'AV' | 'RE', number[]> = {
      AT: [TIPOS.PESQUISA, TIPOS.COMPLEMENTAR],
      AV: [TIPOS.AVALIACAO, TIPOS.ASO],
      RE: [TIPOS.RECUPERACAO],
    }
    return (sessao.atividades || []).some((a) => typeMap[type].includes(Number(a.id_tipo_protocolo)))
  }

  // ======= MOBILE: cards =======
  if (isMobile) {
    return (
      <>
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Histórico de Atendimentos
        </Typography>

        {sessoes.length === 0 ? (
          <Alert severity="info">Nenhum histórico de atendimento para esta disciplina.</Alert>
        ) : (
          <Stack spacing={1.5}>
            {sessoes.map((sessao) => {
              const registroTexto = (sessao.atividades || [])
                .map((at) => {
                  const tipoNome = first(at.tipos_protocolo)?.nome ?? 'Atividade'
                  const status = at.status || 'N/D'
                  const nota =
                    at.nota !== null && at.nota !== undefined ? ` (Nota ${Number(at.nota).toFixed(1).replace('.', ',')})` : ''
                  return `${tipoNome} #${at.numero_protocolo}: ${status}${nota}`
                })
                .join('\n')

              return (
                <Paper
                  key={sessao.id_sessao}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2, width: '100%', minWidth: 0, overflow: 'hidden' }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, overflowWrap: 'anywhere' }}>{formatDateBR(sessao.hora_entrada)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeBR(sessao.hora_entrada)} → {sessao.hora_saida ? formatTimeBR(sessao.hora_saida) : '...'}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => onEdit(sessao)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton size="small" onClick={() => onDelete(sessao)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      Professor(a): <strong>{sessao.professor_nome || 'N/A'}</strong>
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label="OR" variant="outlined" />
                      <Chip
                        size="small"
                        label="AT"
                        color={hasActivityType(sessao, 'AT') ? 'info' : 'default'}
                        variant={hasActivityType(sessao, 'AT') ? 'filled' : 'outlined'}
                      />
                      <Chip
                        size="small"
                        label="AV"
                        color={hasActivityType(sessao, 'AV') ? 'info' : 'default'}
                        variant={hasActivityType(sessao, 'AV') ? 'filled' : 'outlined'}
                      />
                      <Chip
                        size="small"
                        label="RE"
                        color={hasActivityType(sessao, 'RE') ? 'info' : 'default'}
                        variant={hasActivityType(sessao, 'RE') ? 'filled' : 'outlined'}
                      />
                    </Stack>

                    <Divider />

                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {registroTexto || '-'}
                    </Typography>

                    {sessao.resumo_atividades ? (
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                        {sessao.resumo_atividades}
                      </Typography>
                    ) : null}
                  </Stack>
                </Paper>
              )
            })}
          </Stack>
        )}
      </>
    )
  }

  // ======= DESKTOP: tabela =======
  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Histórico de Atendimentos Detalhado
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Horário</TableCell>
              <TableCell align="center">OR</TableCell>
              <TableCell align="center">AT</TableCell>
              <TableCell align="center">AV</TableCell>
              <TableCell align="center">RE</TableCell>
              <TableCell>Professor(a)</TableCell>
              <TableCell sx={{ width: '45%' }}>Registro da Atividade</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sessoes.length > 0 ? (
              sessoes.map((sessao) => {
                const registroTexto = (sessao.atividades || [])
                  .map((at) => {
                    const tipoNome = first(at.tipos_protocolo)?.nome ?? 'Atividade'
                    const status = at.status || 'N/D'
                    const nota = at.nota !== null && at.nota !== undefined ? ` - Nota: ${Number(at.nota).toFixed(1)}` : ''
                    return `${tipoNome} (#${at.numero_protocolo}) (${status})${nota}`
                  })
                  .join('; ')

                return (
                  <TableRow key={sessao.id_sessao}>
                    <TableCell>{formatDateBR(sessao.hora_entrada)}</TableCell>
                    <TableCell>{`${formatTimeBR(sessao.hora_entrada)} - ${sessao.hora_saida ? formatTimeBR(sessao.hora_saida) : '...'}`}</TableCell>
                    <TableCell align="center">X</TableCell>
                    <TableCell align="center">{hasActivityType(sessao, 'AT') ? 'X' : ''}</TableCell>
                    <TableCell align="center">{hasActivityType(sessao, 'AV') ? 'X' : ''}</TableCell>
                    <TableCell align="center">{hasActivityType(sessao, 'RE') ? 'X' : ''}</TableCell>
                    <TableCell>{sessao.professor_nome || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{registroTexto || '-'}</Typography>
                      {sessao.resumo_atividades ? (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1, whiteSpace: 'pre-wrap' }}>
                          {sessao.resumo_atividades}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar Sessão e Atividades">
                        <IconButton size="small" onClick={() => onEdit(sessao)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir Sessão Inteira">
                        <IconButton size="small" onClick={() => onDelete(sessao)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Nenhum histórico de atendimento para esta disciplina.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

function EditHistoricoModal(props: {
  open: boolean
  onClose: () => void
  sessao: SessaoHistorico | null
  totalProtocolos: number
  tipos: TipoProtocoloRow[]
  onSave: (payload: {
    sessaoUpdate: { id_sessao: number; hora_entrada: string; hora_saida: string | null; resumo_atividades: string | null }
    upserts: Array<{
      id_atividade?: number
      id_sessao: number
      id_progresso: number
      numero_protocolo: number
      id_tipo_protocolo: number
      status: string
      nota: number | null
      is_adaptada: boolean
      sintese: string | null
    }>
    deletes: number[]
  }) => Promise<void>
}) {
  const { open, onClose, sessao, onSave, totalProtocolos, tipos } = props
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [horaEntrada, setHoraEntrada] = useState<string>('')
  const [horaSaida, setHoraSaida] = useState<string>('')
  const [resumo, setResumo] = useState<string>('')

  type EditAtividade = {
    id_atividade?: number
    id_sessao: number
    id_progresso: number
    numero_protocolo: number
    id_tipo_protocolo: number
    status: string
    nota: number | null
    is_adaptada: boolean
    sintese: string | null
  }

  const [atividades, setAtividades] = useState<EditAtividade[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [erroLocal, setErroLocal] = useState<string>('')

  useEffect(() => {
    if (!sessao) {
      setHoraEntrada('')
      setHoraSaida('')
      setResumo('')
      setAtividades([])
      setDeletedIds([])
      setErroLocal('')
      return
    }

    setHoraEntrada(sessao.hora_entrada ?? '')
    setHoraSaida(sessao.hora_saida ?? '')
    setResumo(sessao.resumo_atividades ?? '')
    setDeletedIds([])
    setErroLocal('')

    const list: EditAtividade[] = (sessao.atividades ?? []).map((a) => ({
      id_atividade: a.id_atividade,
      id_sessao: a.id_sessao,
      id_progresso: a.id_progresso,
      numero_protocolo: Number(a.numero_protocolo),
      id_tipo_protocolo: Number(a.id_tipo_protocolo),
      status: String(a.status || 'A fazer'),
      nota: a.nota != null ? Number(a.nota) : null,
      is_adaptada: Boolean(a.is_adaptada),
      sintese: a.sintese ?? null,
    }))

    setAtividades(list)
  }, [sessao])

  const handleAtividadeChange = (index: number, patch: Partial<EditAtividade>) => {
    setAtividades((old) => {
      const next = [...old]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const handleRemoveAtividade = (index: number) => {
    setAtividades((old) => {
      const next = [...old]
      const rem = next.splice(index, 1)[0]
      if (rem?.id_atividade) {
        setDeletedIds((d) => Array.from(new Set([...d, rem.id_atividade as number])))
      }
      return next
    })
  }

  const handleAddAtividade = () => {
    if (!sessao) return
    const padraoTipo = tipos[0]?.id_tipo_protocolo ?? TIPOS.PESQUISA
    setAtividades((old) => [
      {
        id_sessao: sessao.id_sessao,
        id_progresso: sessao.id_progresso,
        numero_protocolo: 1,
        id_tipo_protocolo: Number(padraoTipo),
        status: 'A fazer',
        nota: null,
        is_adaptada: false,
        sintese: null,
      },
      ...old,
    ])
  }

  const validar = (): boolean => {
    setErroLocal('')
    if (!sessao) return false

    if (!horaEntrada) {
      setErroLocal('Informe a hora de entrada da sessão.')
      return false
    }
    const dE = new Date(horaEntrada)
    if (Number.isNaN(dE.getTime())) {
      setErroLocal('Hora de entrada inválida.')
      return false
    }

    if (horaSaida) {
      const dS = new Date(horaSaida)
      if (Number.isNaN(dS.getTime())) {
        setErroLocal('Hora de saída inválida.')
        return false
      }
      if (dS.getTime() < dE.getTime()) {
        setErroLocal('Hora de saída não pode ser menor que a hora de entrada.')
        return false
      }
    }

    const maxProt = Math.max(1, totalProtocolos || 1)

    for (const a of atividades) {
      if (!Number.isFinite(a.numero_protocolo) || a.numero_protocolo < 1 || a.numero_protocolo > maxProt) {
        setErroLocal(`Número do protocolo inválido: ${a.numero_protocolo}.`)
        return false
      }
      if (!Number.isFinite(a.id_tipo_protocolo) || a.id_tipo_protocolo <= 0) {
        setErroLocal('Tipo de protocolo inválido.')
        return false
      }
      if (!String(a.status || '').trim()) {
        setErroLocal('Status inválido em uma atividade.')
        return false
      }
      if (a.nota !== null && !Number.isFinite(a.nota)) {
        setErroLocal('Nota inválida em uma atividade.')
        return false
      }
    }

    const seen = new Set<string>()
    for (const a of atividades) {
      const key = `${a.numero_protocolo}-${a.id_tipo_protocolo}`
      if (seen.has(key)) {
        setErroLocal(`Duplicidade: já existe atividade com protocolo ${a.numero_protocolo} e tipo ${a.id_tipo_protocolo}.`)
        return false
      }
      seen.add(key)
    }

    return true
  }

  const handleSave = async () => {
    if (!sessao) return
    if (!validar()) return

    setSaving(true)
    try {
      await onSave({
        sessaoUpdate: {
          id_sessao: sessao.id_sessao,
          hora_entrada: new Date(horaEntrada).toISOString(),
          hora_saida: horaSaida ? new Date(horaSaida).toISOString() : null,
          resumo_atividades: resumo?.trim() ? resumo.trim() : null,
        },
        upserts: atividades.map((a) => ({
          id_atividade: a.id_atividade,
          id_sessao: sessao.id_sessao,
          id_progresso: sessao.id_progresso,
          numero_protocolo: Number(a.numero_protocolo),
          id_tipo_protocolo: Number(a.id_tipo_protocolo),
          status: String(a.status || 'A fazer'),
          nota: a.nota != null ? Number(a.nota) : null,
          is_adaptada: Boolean(a.is_adaptada),
          sintese: a.sintese?.trim() ? a.sintese.trim() : null,
        })),
        deletes: deletedIds,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" fullScreen={isMobile}>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Editar Sessão {sessao ? `(${formatDateBR(sessao.hora_entrada)})` : ''}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!sessao ? (
          <Alert severity="warning">Sessão não selecionada.</Alert>
        ) : (
          <Stack spacing={2}>
            {erroLocal ? <Alert severity="error">{erroLocal}</Alert> : null}

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Dados da Sessão</Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Hora de entrada"
                  type="datetime-local"
                  value={horaEntrada ? formatForInputLocal(horaEntrada) : ''}
                  onChange={(e) => setHoraEntrada(inputLocalToISO(e.target.value))}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Hora de saída (opcional)"
                  type="datetime-local"
                  value={horaSaida ? formatForInputLocal(horaSaida) : ''}
                  onChange={(e) => setHoraSaida(e.target.value ? inputLocalToISO(e.target.value) : '')}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <TextField
                sx={{ mt: 2 }}
                fullWidth
                label="Resumo/Observações da sessão"
                multiline
                minRows={3}
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
              />
            </Paper>

            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography sx={{ fontWeight: 900 }}>Atividades (editar tudo)</Typography>
              <Button startIcon={<AddIcon />} variant="outlined" onClick={handleAddAtividade}>
                Adicionar atividade
              </Button>
            </Stack>

            {atividades.length === 0 ? (
              <Alert severity="info">Nenhuma atividade registrada nesta sessão.</Alert>
            ) : (
              <Stack spacing={1}>
                {atividades.map((a, idx) => {
                  const tipoNome = tipos.find((t) => t.id_tipo_protocolo === a.id_tipo_protocolo)?.nome ?? `Tipo #${a.id_tipo_protocolo}`
                  const showNota = !(a.id_tipo_protocolo === TIPOS.PESQUISA || a.id_tipo_protocolo === TIPOS.ASO)
                  const maxProt = Math.max(1, totalProtocolos || 1)

                  return (
                    <Paper key={`${a.id_atividade ?? 'new'}-${idx}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900 }}>{tipoNome}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {a.id_atividade ? `ID atividade: ${a.id_atividade}` : 'Nova atividade (será inserida)'}
                          </Typography>
                        </Box>

                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleRemoveAtividade(idx)}>
                          Remover
                        </Button>
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Protocolo</InputLabel>
                          <Select
                            label="Protocolo"
                            value={String(a.numero_protocolo)}
                            onChange={(e) => handleAtividadeChange(idx, { numero_protocolo: Number(e.target.value) })}
                          >
                            {Array.from({ length: maxProt }, (_, i) => i + 1).map((n) => (
                              <MenuItem key={n} value={String(n)}>
                                {n}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            label="Tipo"
                            value={String(a.id_tipo_protocolo)}
                            onChange={(e) => handleAtividadeChange(idx, { id_tipo_protocolo: Number(e.target.value) })}
                          >
                            {tipos.map((t) => (
                              <MenuItem key={t.id_tipo_protocolo} value={String(t.id_tipo_protocolo)}>
                                {t.nome}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select label="Status" value={String(a.status || 'A fazer')} onChange={(e) => handleAtividadeChange(idx, { status: String(e.target.value) })}>
                            <MenuItem value="A fazer">A fazer</MenuItem>
                            <MenuItem value="Em andamento">Em andamento</MenuItem>
                            <MenuItem value="Concluída">Concluída</MenuItem>
                          </Select>
                        </FormControl>

                        {showNota ? (
                          <TextField
                            fullWidth
                            size="small"
                            label="Nota"
                            type="number"
                            value={a.nota ?? ''}
                            onChange={(e) => handleAtividadeChange(idx, { nota: parseNota(e.target.value) })}
                          />
                        ) : null}
                      </Stack>

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
                        <FormControlLabel
                          control={<Checkbox checked={!!a.is_adaptada} onChange={(e) => handleAtividadeChange(idx, { is_adaptada: e.target.checked })} />}
                          label="Adaptada"
                        />

                        <TextField fullWidth size="small" label="Síntese" value={a.sintese ?? ''} onChange={(e) => handleAtividadeChange(idx, { sintese: e.target.value })} />
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
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={() => void handleSave()} disabled={saving} variant="contained">
          {saving ? <CircularProgress size={22} color="inherit" /> : 'Salvar Alterações'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function ProtocolosDeEstudo(props: {
  protocolos: ProtocoloState[]
  idProgresso: number
  onSaveAtividade: (payload: {
    id_atividade?: number
    id_progresso: number
    numero_protocolo: number
    id_tipo_protocolo: number
    status: string
    nota: number | null
    is_adaptada: boolean
    sintese: string | null
  }) => Promise<void>
  onDataChange: () => Promise<void>
}) {
  const { protocolos: initialProtocols, idProgresso, onSaveAtividade, onDataChange } = props

  const [protocolos, setProtocolos] = useState<ProtocoloState[]>(initialProtocols || [])
  const [savingStatus, setSavingStatus] = useState<Record<number, boolean>>({})
  const [expanded, setExpanded] = useState<number | false>(false)

  useEffect(() => {
    setProtocolos(initialProtocols || [])
  }, [initialProtocols])

  const handleAccordionChange =
    (panel: number) =>
    (_event: any, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false)
    }

  const handleAtividadeChange = (
    protocoloIndex: number,
    atividadeKey: keyof ProtocoloState['atividades'],
    field: string,
    value: any
  ) => {
    setProtocolos((old) => {
      const next = JSON.parse(JSON.stringify(old)) as ProtocoloState[]
      const reg = next[protocoloIndex].atividades[atividadeKey].registro || {}
      ;(reg as any)[field] = value
      next[protocoloIndex].atividades[atividadeKey].registro = reg
      return next
    })
  }

  const getProtocoloStatus = (atividades: ProtocoloState['atividades']) => {
    const pesquisaOk = atividades.pesquisa?.registro?.status === 'Concluída'
    const complementarOk = atividades.complementar?.registro?.status === 'Concluída'

    const avaliacaoStatus = atividades.avaliacao?.registro?.status
    const avaliacaoNota = parseNota(atividades.avaliacao?.registro?.nota)

    const recuperacaoStatus = atividades.recuperacao?.registro?.status
    const recuperacaoNota = parseNota(atividades.recuperacao?.registro?.nota)

    if (pesquisaOk && complementarOk && avaliacaoStatus === 'Concluída') {
      if (avaliacaoNota !== null && avaliacaoNota >= 6) return { label: 'Protocolo Concluído', color: 'success' as const }
      if (
        avaliacaoNota !== null &&
        avaliacaoNota < 6 &&
        recuperacaoStatus === 'Concluída' &&
        recuperacaoNota !== null &&
        recuperacaoNota >= 6
      ) {
        return { label: 'Protocolo Concluído', color: 'success' as const }
      }
    }

    const isEmAndamento = Object.values(atividades).some((ativ) => ativ?.registro && (ativ.registro.status ?? 'A fazer') !== 'A fazer')
    if (isEmAndamento) return { label: 'Em Andamento', color: 'info' as const }

    return { label: 'A Fazer', color: 'default' as const }
  }

  const getNotaFinalProtocolo = (atividades: ProtocoloState['atividades']) => {
    const notaComp = parseNota(atividades.complementar?.registro?.nota)
    const notaAval = parseNota(atividades.avaliacao?.registro?.nota)
    const notaRec = parseNota(atividades.recuperacao?.registro?.nota)

    if (notaComp !== null) {
      if (notaAval !== null && notaAval >= 6) return ((notaComp + notaAval) / 2).toFixed(2)
      if (notaAval !== null && notaAval < 6 && notaRec !== null) return ((notaComp + notaRec) / 2).toFixed(2)
    }
    return '-'
  }

  const renderAtividade = (protoIndex: number, ativKey: keyof ProtocoloState['atividades'], label: string) => {
    const atividade = protocolos[protoIndex].atividades[ativKey]
    const registro = atividade.registro || {}
    const showNota = !['pesquisa', 'aso'].includes(String(ativKey))

    return (
      <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2, mb: 1 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {label}
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 200 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={String(registro.status || 'A fazer')}
              onChange={(e) => handleAtividadeChange(protoIndex, ativKey, 'status', String(e.target.value))}
            >
              <MenuItem value="A fazer">A fazer</MenuItem>
              <MenuItem value="Em andamento">Em andamento</MenuItem>
              <MenuItem value="Concluída">Concluída</MenuItem>
            </Select>
          </FormControl>

          {showNota ? (
            <TextField
              size="small"
              label="Nota"
              type="number"
              value={registro.nota ?? ''}
              onChange={(e) => handleAtividadeChange(protoIndex, ativKey, 'nota', e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 140 } }}
            />
          ) : null}

          <FormControlLabel
            control={
              <Checkbox checked={!!registro.is_adaptada} onChange={(e) => handleAtividadeChange(protoIndex, ativKey, 'is_adaptada', e.target.checked)} />
            }
            label="Adaptada"
          />
        </Stack>

        <TextField
          sx={{ mt: 1 }}
          size="small"
          fullWidth
          label="Síntese"
          value={(registro as any).sintese ?? ''}
          onChange={(e) => handleAtividadeChange(protoIndex, ativKey, 'sintese', e.target.value)}
        />
      </Paper>
    )
  }

  const handleSalvarProtocolo = async (protocoloIndex: number) => {
    const prot = protocolos[protocoloIndex]
    const atividades = prot.atividades

    const notaAval = parseNota(atividades.avaliacao?.registro?.nota)
    const precisaRec = notaAval !== null && notaAval < 6

    setSavingStatus((prev) => ({ ...prev, [protocoloIndex]: true }))
    try {
      const keys: (keyof ProtocoloState['atividades'])[] = ['pesquisa', 'complementar', 'avaliacao', 'aso', 'recuperacao']

      for (const k of keys) {
        const a = atividades[k]
        if (!a) continue

        const jaExiste = !!a.registro?.id_atividade
        if ((k === 'aso' || k === 'recuperacao') && !precisaRec && !jaExiste) continue

        const payload = {
          id_atividade: a.registro?.id_atividade,
          id_progresso: idProgresso,
          numero_protocolo: prot.numero,
          id_tipo_protocolo: a.id_tipo,
          status: String(a.registro?.status || 'A fazer'),
          nota: parseNota(a.registro?.nota),
          is_adaptada: Boolean(a.registro?.is_adaptada),
          sintese: ((a.registro as any)?.sintese ?? null) as string | null,
        }

        await onSaveAtividade(payload)
      }

      await onDataChange()
    } finally {
      setSavingStatus((prev) => ({ ...prev, [protocoloIndex]: false }))
    }
  }

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Registro de Atividades
      </Typography>

      <Paper sx={{ p: 2, borderRadius: '12px', overflow: 'hidden' }}>
        {protocolos.map((protocolo, protoIndex) => {
          const atividades = protocolo.atividades

          const notaAvaliacao = parseNota(atividades.avaliacao?.registro?.nota)

          // ✅ correção: mostrar ASO/Recuperação também quando já existem registros,
          // mesmo que a nota de avaliação tenha sido alterada depois.
          const asoExiste = Boolean(atividades.aso?.registro?.id_atividade)
          const recExiste = Boolean(atividades.recuperacao?.registro?.id_atividade)
          const showRecuperacao = (notaAvaliacao !== null && notaAvaliacao < 6) || asoExiste || recExiste

          const statusInfo = getProtocoloStatus(atividades)

          return (
            <Accordion
              key={`${protocolo.numero}-${protocolo.ano_escolar}`}
              expanded={expanded === protocolo.numero}
              onChange={handleAccordionChange(protocolo.numero)}
              disableGutters
              elevation={0}
              sx={{
                border: '1px solid #ddd',
                borderRadius: 2,
                mb: 1,
                overflow: 'hidden',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} sx={{ width: '100%', minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
                    Protocolo {protocolo.numero} ({protocolo.ano_escolar})
                  </Typography>

                  <Box sx={{ flex: 1 }} />

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip label={`Nota: ${getNotaFinalProtocolo(atividades)}`} color="primary" size="small" variant="outlined" />
                    <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
                  </Stack>
                </Stack>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 1.5 }}>
                {renderAtividade(protoIndex, 'pesquisa', 'Atividade de Pesquisa')}
                {renderAtividade(protoIndex, 'complementar', 'Atividade Complementar')}
                {renderAtividade(protoIndex, 'avaliacao', 'Avaliação')}
                {showRecuperacao ? renderAtividade(protoIndex, 'aso', 'ASO') : null}
                {showRecuperacao ? renderAtividade(protoIndex, 'recuperacao', 'Recuperação') : null}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => void handleSalvarProtocolo(protoIndex)}
                    disabled={!!savingStatus[protoIndex]}
                  >
                    {savingStatus[protoIndex] ? <CircularProgress size={22} color="inherit" /> : 'Salvar Protocolo'}
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Paper>
    </>
  )
}

function ObservacoesEditaveis(props: {
  initialText: string
  progressoId: number
  onSave: (progressoId: number, texto: string) => Promise<void>
}) {
  const { initialText, progressoId, onSave } = props

  const [editMode, setEditMode] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setObservacoes(initialText || '')
  }, [initialText])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(progressoId, observacoes)
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setObservacoes(initialText || '')
    setEditMode(false)
  }

  return (
    <Paper sx={{ p: 2, borderRadius: '12px', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6">Observações Gerais da Disciplina</Typography>
        {!editMode ? (
          <Button startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
            Editar
          </Button>
        ) : null}
      </Box>

      <Divider />

      {!editMode ? (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', minHeight: 50, mt: 2, p: 1 }}>
          {observacoes || 'Nenhuma observação cadastrada.'}
        </Typography>
      ) : (
        <>
          <TextField
            fullWidth
            multiline
            rows={5}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            variant="outlined"
            autoFocus
            sx={{ mt: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Button onClick={handleCancel}>Cancelar</Button>
            <Button onClick={() => void handleSave()} variant="contained" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Observações'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  )
}

// ===================== Página =====================

export default function FichaAcompanhamentoPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { usuario } = useAuth()
  const { sucesso, erro, aviso } = useNotificacaoContext()

  const params = useParams()
  const navigate = useNavigate()

  const idProgressoParam = String((params as any)?.id_progresso ?? '')
  const idProgresso = Number(idProgressoParam)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const [loading, setLoading] = useState(true)
  const [progresso, setProgresso] = useState<ProgressoJoin | null>(null)

  const [faixas, setFaixas] = useState<FaixaAnoProtocolos[]>([])
  const [gradeData, setGradeData] = useState<GradeData | null>(null)
  const [protocolos, setProtocolos] = useState<ProtocoloState[]>([])
  const [sessoes, setSessoes] = useState<SessaoHistorico[]>([])
  const [observacoes, setObservacoes] = useState<string>('')

  const [tiposProtocolo, setTiposProtocolo] = useState<TipoProtocoloRow[]>([])

  const [idProfessor, setIdProfessor] = useState<number | null>(null)
  const sessaoAutoRef = useRef<number | null>(null)

  const [historicoModalOpen, setHistoricoModalOpen] = useState(false)
  const [sessaoParaEditar, setSessaoParaEditar] = useState<SessaoHistorico | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessaoParaExcluir, setSessaoParaExcluir] = useState<SessaoHistorico | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const totalProtocolos = useMemo(() => (faixas?.length ? faixas[faixas.length - 1].fim : 0), [faixas])

  const peDeMeia = useMemo<PeDeMeiaResultado>(() => {
    if (!progresso) return { classificacao: 'INDETERMINADO', modalidade: 'EJA', erros: [], avisos: ['Ficha ainda não carregada.'] }

    const mat = first(progresso.matriculas)
    const aluno = first(mat?.alunos)
    const user = first(aluno?.usuarios)

    const nivelId =
      (mat?.id_nivel_ensino != null ? Number(mat.id_nivel_ensino) : null) ??
      (first(progresso.anos_escolares)?.id_nivel_ensino != null ? Number(first(progresso.anos_escolares)?.id_nivel_ensino) : null)

    const modalidadeSug = modalidadePeDeMeiaSugerida(mat?.modalidade ?? null)

    return avaliarPeDeMeia(
      {
        id_nivel_ensino: nivelId,
        cpf: user?.cpf ?? null,
        data_nascimento: user?.data_nascimento ?? null,
        ano_letivo: mat?.ano_letivo != null ? Number(mat.ano_letivo) : null,
        data_matricula: mat?.data_matricula ?? null,
        nis: aluno?.nis ?? null,
        possui_beneficio_governo: aluno?.possui_beneficio_governo ?? null,
        qual_beneficio_governo: aluno?.qual_beneficio_governo ?? null,
        modalidade: modalidadeSug,
      },
      {
        // Mantém validação de prazo como “conferir” (INDETERMINADO), já que calendário pode variar.
        validar_prazo_matricula: true,
        prazo_matricula_meses: 2,
      }
    )
  }, [progresso])

  const isPCD = useMemo(() => {
    if (!progresso) return false
    const mat = first(progresso.matriculas)
    const aluno = first(mat?.alunos)
    return Boolean(aluno?.possui_necessidade_especial)
  }, [progresso])

  const faixaResumo = useMemo(() => (faixas.length ? faixas.map((f) => `${f.ano_nome}: ${f.inicio}-${f.fim}`).join(' • ') : ''), [faixas])

  const carregarIdProfessor = useCallback(async () => {
    if (!supabase) return
    if (!usuario?.id) return

    const { data, error: e } = await supabase.from('professores').select('id_professor').eq('user_id', usuario.id).maybeSingle()
    if (e) return
    if (data?.id_professor) setIdProfessor(Number(data.id_professor))
  }, [supabase, usuario?.id])

  const carregarTiposProtocolo = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('tipos_protocolo').select('id_tipo_protocolo,nome').order('id_tipo_protocolo')
    if (!error) setTiposProtocolo((data ?? []) as any)
  }, [supabase])

  const calcularFaixas = useCallback((configs: Array<{ id_ano_escolar: number; nome_ano: string; quantidade_protocolos: number }>) => {
    const ord = [...configs].sort((a, b) => Number(a.id_ano_escolar) - Number(b.id_ano_escolar))
    let acc = 0
    return ord
      .filter((c) => Number(c.quantidade_protocolos ?? 0) > 0)
      .map((c) => {
        const ini = acc + 1
        const fim = acc + Number(c.quantidade_protocolos)
        acc = fim
        return { id_ano_escolar: Number(c.id_ano_escolar), ano_nome: String(c.nome_ano), quantidade: Number(c.quantidade_protocolos), inicio: ini, fim }
      })
  }, [])

  const montarProtocolos = useCallback(
    (args: { total: number; getAnoNome: (numero: number) => string; registros: RegistroAtividade[] }): ProtocoloState[] => {
      const { total, getAnoNome, registros } = args

      const map = new Map<string, RegistroAtividade>()
      for (const r of registros) {
        const key = `${r.numero_protocolo}-${r.id_tipo_protocolo}`
        const prev = map.get(key)
        if (!prev) map.set(key, r)
        else {
          const tPrev = new Date(prev.updated_at || prev.created_at).getTime()
          const tNow = new Date(r.updated_at || r.created_at).getTime()
          if (tNow >= tPrev) map.set(key, r)
        }
      }

      const buildAtiv = (numero: number, id_tipo: number): ProtocoloAtividadeState => {
        const r = map.get(`${numero}-${id_tipo}`)
        return {
          id_tipo,
          registro: r
            ? {
                id_atividade: r.id_atividade,
                id_sessao: r.id_sessao,
                status: r.status,
                nota: r.nota,
                is_adaptada: r.is_adaptada,
                sintese: r.sintese ?? null,
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
      for (let n = 1; n <= total; n += 1) {
        lista.push({
          numero: n,
          ano_escolar: getAnoNome(n),
          atividades: {
            pesquisa: buildAtiv(n, TIPOS.PESQUISA),
            complementar: buildAtiv(n, TIPOS.COMPLEMENTAR),
            avaliacao: buildAtiv(n, TIPOS.AVALIACAO),
            aso: buildAtiv(n, TIPOS.ASO),
            recuperacao: buildAtiv(n, TIPOS.RECUPERACAO),
          },
        })
      }
      return lista
    },
    []
  )

  const montarGrade = useCallback(
    (args: { headers: { serie: string; colspan: number }[]; total: number; protocolos: ProtocoloState[]; mediaFinalBanco: number | null }): GradeData => {
      const { headers, total, protocolos: protos, mediaFinalBanco } = args
      const nums = Array.from({ length: total }, (_, i) => i + 1)

      const notaAtividade = nums.map((n) => {
        const p = protos.find((x) => x.numero === n)
        return p ? parseNota(p.atividades.complementar?.registro?.nota) : null
      })

      const notaAvaliacaoEfetiva = nums.map((n) => {
        const p = protos.find((x) => x.numero === n)
        if (!p) return null
        const aval = parseNota(p.atividades.avaliacao?.registro?.nota)
        const rec = parseNota(p.atividades.recuperacao?.registro?.nota)
        if (aval !== null && aval >= 6) return aval
        if (aval !== null && aval < 6 && rec !== null) return rec
        return aval
      })

      const mediaPorProtocolo = nums.map((_n, idx) => {
        const a = notaAtividade[idx]
        const b = notaAvaliacaoEfetiva[idx]
        if (a === null || b === null) return null
        return Number(((a + b) / 2).toFixed(2))
      })

      let mediaFinal = mediaFinalBanco
      if (mediaFinal === null) {
        const vals = mediaPorProtocolo.filter((x) => x !== null) as number[]
        if (vals.length) {
          const m = vals.reduce((acc, v) => acc + v, 0) / vals.length
          mediaFinal = Number(m.toFixed(2))
        }
      }

      return {
        headers,
        protocolos: nums,
        body: [
          { etapa: 'NOTA ATIVIDADE', notas: notaAtividade },
          { etapa: 'NOTA AVALIAÇÃO', notas: notaAvaliacaoEfetiva },
          { etapa: 'MÉDIA', notas: mediaPorProtocolo },
        ],
        mediaFinal,
      }
    },
    []
  )

  const fetchData = useCallback(async () => {
    if (!supabase) return
    if (!Number.isFinite(idProgresso)) {
      aviso('ID da ficha inválido.')
      return
    }

    setLoading(true)
    try {
      // 1) Progresso + joins (inclui NIS/benefícios/PCD + CPF/DN para triagem do Pé-de-Meia)
      const { data: prog, error: eProg } = await supabase
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
          anos_escolares(id_ano_escolar,nome_ano,id_nivel_ensino),
          matriculas(
            id_matricula,
            numero_inscricao,
            modalidade,
            ano_letivo,
            data_matricula,
            id_nivel_ensino,
            niveis_ensino(nome),
            alunos(
              id_aluno,
              nis,
              possui_beneficio_governo,
              qual_beneficio_governo,
              possui_necessidade_especial,
              qual_necessidade_especial,
              usuarios(name,email,foto_url,cpf,data_nascimento)
            )
          )
        `
        )
        .eq('id_progresso', idProgresso)
        .maybeSingle()

      if (eProg) throw eProg
      if (!prog) throw new Error('Progresso não encontrado.')

      const progRow = prog as any as ProgressoJoin
      setProgresso(progRow)
      setObservacoes(String(progRow.observacoes ?? ''))

      const mat = first(progRow.matriculas)
      const modalidade = String(mat?.modalidade ?? '')
      const nivelId =
        (mat?.id_nivel_ensino != null ? Number(mat.id_nivel_ensino) : null) ??
        (first(progRow.anos_escolares)?.id_nivel_ensino != null ? Number(first(progRow.anos_escolares)?.id_nivel_ensino) : null)

      // 2) Config protocolos (multi-ano se orientação)
      let faixasLocal: FaixaAnoProtocolos[] = []
      let headers: { serie: string; colspan: number }[] = []

      if (isModalidadeOrientacao(modalidade) && nivelId != null) {
        const { data: cfgs, error: eCfgAll } = await supabase
          .from('config_disciplina_ano')
          .select(
            `
            id_ano_escolar,
            quantidade_protocolos,
            anos_escolares ( nome_ano, id_nivel_ensino )
          `
          )
          .eq('id_disciplina', Number(progRow.id_disciplina))

        if (eCfgAll) throw eCfgAll

        const configs = (cfgs ?? [])
          .map((c: any) => {
            const ano = first(c?.anos_escolares) as any
            return {
              id_ano_escolar: Number(c.id_ano_escolar),
              nome_ano: String(ano?.nome_ano ?? `Ano #${c.id_ano_escolar}`),
              quantidade_protocolos: Number(c.quantidade_protocolos ?? 0),
              id_nivel_ensino: ano?.id_nivel_ensino != null ? Number(ano.id_nivel_ensino) : null,
            }
          })
          .filter((x) => Number(x.quantidade_protocolos) > 0 && Number(x.id_nivel_ensino) === Number(nivelId))

        faixasLocal = calcularFaixas(configs)
        headers = faixasLocal.map((f) => ({ serie: f.ano_nome, colspan: f.quantidade }))
      } else {
        const anoNome = first(progRow.anos_escolares)?.nome_ano ?? '-'

        const { data: cfg, error: eCfg } = await supabase
          .from('config_disciplina_ano')
          .select('quantidade_protocolos')
          .eq('id_disciplina', Number(progRow.id_disciplina))
          .eq('id_ano_escolar', Number(progRow.id_ano_escolar))
          .maybeSingle()

        if (eCfg) throw eCfg

        const quantidade = Number(cfg?.quantidade_protocolos ?? 0)
        faixasLocal =
          quantidade > 0
            ? [{ id_ano_escolar: Number(progRow.id_ano_escolar), ano_nome: anoNome, quantidade, inicio: 1, fim: quantidade }]
            : []
        headers = quantidade > 0 ? [{ serie: anoNome, colspan: quantidade }] : []
      }

      setFaixas(faixasLocal)
      const total = faixasLocal.length ? faixasLocal[faixasLocal.length - 1].fim : 0

      // 3) Registros do progresso (todos)
      const { data: regs, error: eRegs } = await supabase
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
        .eq('id_progresso', idProgresso)
        .order('numero_protocolo', { ascending: true })
        .order('id_tipo_protocolo', { ascending: true })
        .limit(20000)

      if (eRegs) throw eRegs
      const registros = (regs ?? []) as any as RegistroAtividade[]

      // 4) Sessões (histórico)
      const { data: sess, error: eSess } = await supabase
        .from('sessoes_atendimento')
        .select(
          `
          id_sessao,
          id_progresso,
          hora_entrada,
          hora_saida,
          resumo_atividades,
          professores( usuarios(name) ),
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
        .eq('id_progresso', idProgresso)
        .order('hora_entrada', { ascending: false })
        .limit(5000)

      if (eSess) throw eSess

      const sessoesMontadas: SessaoHistorico[] = (sess ?? []).map((s: any) => {
        const profNome = first(first(s?.professores)?.usuarios)?.name ?? ''
        const atvs = (s?.registros_atendimento ?? []) as any[]
        const ordenadas = [...atvs].sort((a, b) => {
          const na = Number(a.numero_protocolo) - Number(b.numero_protocolo)
          if (na !== 0) return na
          return Number(a.id_tipo_protocolo) - Number(b.id_tipo_protocolo)
        })

        return {
          id_sessao: Number(s.id_sessao),
          id_progresso: Number(s.id_progresso ?? idProgresso),
          hora_entrada: String(s.hora_entrada),
          hora_saida: s.hora_saida ? String(s.hora_saida) : null,
          resumo_atividades: s.resumo_atividades ?? null,
          professor_nome: String(profNome),
          atividades: ordenadas as RegistroAtividade[],
        }
      })

      setSessoes(sessoesMontadas)

      // 5) Protocolos + Grade
      const protos = montarProtocolos({
        total,
        getAnoNome: (n: number) => {
          const f = faixasLocal.find((x) => n >= x.inicio && n <= x.fim)
          return f?.ano_nome ?? '-'
        },
        registros,
      })
      setProtocolos(protos)

      const grade = montarGrade({
        headers,
        total,
        protocolos: protos,
        mediaFinalBanco: progRow.nota_final,
      })
      setGradeData(grade)

      sessaoAutoRef.current = null
    } catch (e: any) {
      console.error(e)
      erro(e?.message || 'Falha ao carregar dados da ficha.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [supabase, idProgresso, calcularFaixas, montarProtocolos, montarGrade, aviso, erro])

  const getOrCreateSessaoParaInserir = useCallback(async (): Promise<number | null> => {
    if (!supabase) return null
    if (!progresso) return null

    if (sessaoAutoRef.current) return sessaoAutoRef.current

    if (sessoes.length > 0) {
      sessaoAutoRef.current = sessoes[0].id_sessao
      return sessaoAutoRef.current
    }

    if (!usuario?.id) {
      aviso('Usuário não identificado. Faça login novamente.')
      return null
    }

    let profId = idProfessor
    if (!profId) {
      const { data, error: eProf } = await supabase.from('professores').select('id_professor').eq('user_id', usuario.id).maybeSingle()
      if (eProf) {
        console.error(eProf)
        aviso('Não foi possível identificar o professor para criar sessão automática.')
        return null
      }
      profId = data?.id_professor ? Number(data.id_professor) : null
      setIdProfessor(profId)
    }

    if (!profId) {
      aviso('Seu usuário não está vinculado a um Professor.')
      return null
    }

    const mat = first(progresso.matriculas) as any
    const aluno = first(mat?.alunos) as any
    const alunoId = Number(aluno?.id_aluno)
    if (!Number.isFinite(alunoId)) {
      aviso('Aluno não identificado para criar sessão automática.')
      return null
    }

    const now = new Date().toISOString()
    const { data: created, error: eIns } = await supabase
      .from('sessoes_atendimento')
      .insert({
        id_aluno: alunoId,
        id_professor: profId,
        id_progresso: progresso.id_progresso,
        hora_entrada: now,
        hora_saida: now,
        resumo_atividades: null,
      })
      .select('id_sessao')
      .single()

    if (eIns) {
      console.error(eIns)
      aviso('Falha ao criar sessão automática para registrar atividades.')
      return null
    }

    const idSessao = Number(created?.id_sessao)
    if (!Number.isFinite(idSessao)) return null

    sessaoAutoRef.current = idSessao
    return idSessao
  }, [supabase, progresso, sessoes, usuario?.id, idProfessor, aviso])

  const salvarAtividade = useCallback(
    async (payload: {
      id_atividade?: number
      id_progresso: number
      numero_protocolo: number
      id_tipo_protocolo: number
      status: string
      nota: number | null
      is_adaptada: boolean
      sintese: string | null
    }) => {
      if (!supabase) return

      try {
        if (payload.id_atividade) {
          const { error: eUp } = await supabase
            .from('registros_atendimento')
            .update({
              status: payload.status,
              nota: payload.nota,
              is_adaptada: payload.is_adaptada,
              sintese: payload.sintese,
              updated_at: new Date().toISOString(),
            })
            .eq('id_atividade', payload.id_atividade)

          if (eUp) throw eUp
        } else {
          const idSessao = await getOrCreateSessaoParaInserir()
          if (!idSessao) throw new Error('Sem sessão para inserir atividade.')

          const { error: eIns } = await supabase.from('registros_atendimento').insert({
            id_sessao: idSessao,
            id_progresso: payload.id_progresso,
            numero_protocolo: payload.numero_protocolo,
            id_tipo_protocolo: payload.id_tipo_protocolo,
            status: payload.status,
            nota: payload.nota,
            is_adaptada: payload.is_adaptada,
            sintese: payload.sintese,
          })

          if (eIns) throw eIns
        }

        sucesso('Atividade salva com sucesso!')
      } catch (e: any) {
        console.error(e)
        erro(e?.message || 'Erro ao salvar atividade.')
      }
    },
    [supabase, sucesso, erro, getOrCreateSessaoParaInserir]
  )

  const handleOpenHistoricoModal = (s: SessaoHistorico) => {
    setSessaoParaEditar(s)
    setHistoricoModalOpen(true)
  }

  const handleCloseHistoricoModal = () => {
    setSessaoParaEditar(null)
    setHistoricoModalOpen(false)
  }

  const handleSaveHistoricoCompleto = useCallback(
    async (payload: {
      sessaoUpdate: { id_sessao: number; hora_entrada: string; hora_saida: string | null; resumo_atividades: string | null }
      upserts: Array<{
        id_atividade?: number
        id_sessao: number
        id_progresso: number
        numero_protocolo: number
        id_tipo_protocolo: number
        status: string
        nota: number | null
        is_adaptada: boolean
        sintese: string | null
      }>
      deletes: number[]
    }) => {
      if (!supabase) return

      try {
        const { error: eSess } = await supabase
          .from('sessoes_atendimento')
          .update({
            hora_entrada: payload.sessaoUpdate.hora_entrada,
            hora_saida: payload.sessaoUpdate.hora_saida,
            resumo_atividades: payload.sessaoUpdate.resumo_atividades,
          })
          .eq('id_sessao', payload.sessaoUpdate.id_sessao)
        if (eSess) throw eSess

        if (payload.deletes?.length) {
          const { error: eDel } = await supabase.from('registros_atendimento').delete().in('id_atividade', payload.deletes)
          if (eDel) throw eDel
        }

        for (const a of payload.upserts) {
          if (a.id_atividade) {
            const { error: eUp } = await supabase
              .from('registros_atendimento')
              .update({
                numero_protocolo: a.numero_protocolo,
                id_tipo_protocolo: a.id_tipo_protocolo,
                status: a.status,
                nota: a.nota,
                is_adaptada: a.is_adaptada,
                sintese: a.sintese,
                updated_at: new Date().toISOString(),
              })
              .eq('id_atividade', a.id_atividade)
            if (eUp) throw eUp
          } else {
            const { error: eIns } = await supabase.from('registros_atendimento').insert({
              id_sessao: a.id_sessao,
              id_progresso: a.id_progresso,
              numero_protocolo: a.numero_protocolo,
              id_tipo_protocolo: a.id_tipo_protocolo,
              status: a.status,
              nota: a.nota,
              is_adaptada: a.is_adaptada,
              sintese: a.sintese,
            })
            if (eIns) throw eIns
          }
        }

        sucesso('Sessão e atividades atualizadas com sucesso!')
        await fetchData()
      } catch (e: any) {
        console.error(e)
        erro(e?.message || 'Erro ao salvar alterações completas do histórico.')
      }
    },
    [supabase, sucesso, erro, fetchData]
  )

  const handleOpenDeleteDialog = (s: SessaoHistorico) => {
    setSessaoParaExcluir(s)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = useCallback(async () => {
    if (!supabase) return
    if (!sessaoParaExcluir) return

    setIsDeleting(true)
    try {
      const { error: eDelRegs } = await supabase.from('registros_atendimento').delete().eq('id_sessao', sessaoParaExcluir.id_sessao)
      if (eDelRegs) throw eDelRegs

      const { error: eDelSess } = await supabase.from('sessoes_atendimento').delete().eq('id_sessao', sessaoParaExcluir.id_sessao)
      if (eDelSess) throw eDelSess

      sucesso('Registro de atendimento excluído com sucesso.')
      setDeleteDialogOpen(false)
      setSessaoParaExcluir(null)
      await fetchData()
    } catch (e: any) {
      console.error(e)
      erro('Erro ao excluir registro.')
    } finally {
      if (mountedRef.current) setIsDeleting(false)
    }
  }, [supabase, sessaoParaExcluir, sucesso, erro, fetchData])

  const handleSaveObservacoes = useCallback(
    async (progressoId_: number, novasObs: string) => {
      if (!supabase) return
      try {
        const { error: eUp } = await supabase.from('progresso_aluno').update({ observacoes: novasObs }).eq('id_progresso', progressoId_)
        if (eUp) throw eUp
        sucesso('Observações salvas com sucesso!')
        await fetchData()
      } catch (e: any) {
        console.error(e)
        erro(e?.message || 'Erro ao salvar observações.')
      }
    },
    [supabase, sucesso, erro, fetchData]
  )

  useEffect(() => {
    void carregarIdProfessor()
    void carregarTiposProtocolo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, usuario?.id])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const anosCursados = useMemo(() => '', [])

  if (!supabase) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Supabase não configurado.
      </Alert>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!progresso) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Dados insuficientes para carregar a ficha.
      </Alert>
    )
  }

  return (
    <Box
      sx={{
        maxWidth: 1400,
        mx: 'auto',
        p: { xs: 1.5, sm: 2 },
        width: '100%',
        minWidth: 0,
        overflowX: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, minWidth: 0 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            ml: 1,
            minWidth: 0,
            overflowWrap: 'anywhere',
          }}
        >
          Ficha de Acompanhamento
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.2 : 0.35),
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal' }}
          >
            ID Progresso: <b>{progresso.id_progresso}</b> • Atualizado: <b>{formatDateTimeBR(new Date().toISOString())}</b>
          </Typography>

          {faixaResumo ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal' }}
            >
              Protocolos por ano: <b>{faixaResumo}</b>
            </Typography>
          ) : null}
        </Stack>
      </Paper>

      <FichaHeader progresso={progresso} anosCursados={anosCursados} peDeMeia={peDeMeia} isPCD={isPCD} />

      <GradeDeNotas gradeData={gradeData} />

      <ProtocolosDeEstudo
        protocolos={protocolos}
        idProgresso={progresso.id_progresso}
        onSaveAtividade={salvarAtividade}
        onDataChange={fetchData}
      />

      <HistoricoAtendimentos sessoes={sessoes} onEdit={handleOpenHistoricoModal} onDelete={handleOpenDeleteDialog} />

      <ObservacoesEditaveis initialText={observacoes} progressoId={progresso.id_progresso} onSave={handleSaveObservacoes} />

      <EditHistoricoModal
        open={historicoModalOpen}
        onClose={handleCloseHistoricoModal}
        sessao={sessaoParaEditar}
        totalProtocolos={Math.max(1, totalProtocolos || 1)}
        tipos={tiposProtocolo}
        onSave={handleSaveHistoricoCompleto}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 900 }}>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir o registro de atendimento do dia <b>{sessaoParaExcluir ? formatDateBR(sessaoParaExcluir.hora_entrada) : ''}</b>?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={() => void handleConfirmDelete()} color="error" disabled={isDeleting}>
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
