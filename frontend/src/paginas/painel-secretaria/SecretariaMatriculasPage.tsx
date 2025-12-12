// src/paginas/painel-secretaria/SecretariaMatriculasPage.tsx

import {
  type FC,
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  Avatar,
  Box,
  Button,
  Checkbox,
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
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import { green } from '@mui/material/colors'

import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import SchoolIcon from '@mui/icons-material/School'
import EventIcon from '@mui/icons-material/Event'
import HomeIcon from '@mui/icons-material/Home'
import ElderlyIcon from '@mui/icons-material/Elderly'
import AccessibleIcon from '@mui/icons-material/Accessible'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CloseIcon from '@mui/icons-material/Close'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

// Tipo de usuário ALUNO na tabela tipos_usuario
const TIPO_USUARIO_ALUNO_ID = 5

// Modalidades do enum modalidade_matricula_enum
const MODALIDADES_MATRICULA = [
  {
    value: 'Orientação de Estudos',
    label: 'Orientação de Estudos (com protocolos completos)',
  },
  {
    value: 'Aproveitamento de Estudos',
    label: 'Aproveitamento de Estudos',
  },
  {
    value: 'Progressão de Estudos',
    label: 'Progressão de Estudos',
  },
] as const

// === TIPOS DE TABELA ===

interface MatriculaRow {
  id_matricula: number
  id_aluno: number
  numero_inscricao: string
  id_nivel_ensino: number
  id_status_matricula: number
  modalidade: string
  ano_letivo: number
  data_matricula: string
  data_conclusao: string | null
  id_turma: number | null
}

interface AlunoRow {
  id_aluno: number
  user_id: string
  nis: string | null
  nome_mae: string
  nome_pai: string | null
  usa_transporte_escolar: boolean
  possui_necessidade_especial: boolean
  qual_necessidade_especial: string | null
  possui_restricao_alimentar: boolean
  qual_restricao_alimentar: string | null
  possui_beneficio_governo: boolean
  qual_beneficio_governo: string | null
  observacoes_gerais: string | null
}

interface UsuarioRow {
  id: string
  id_tipo_usuario?: number
  status?: string
  name: string
  email: string
  username: string | null
  foto_url: string | null
  data_nascimento: string | null
  cpf: string | null
  rg: string | null
  celular: string | null
  logradouro: string | null
  numero_endereco: string | null
  bairro: string | null
  municipio: string | null
  ponto_referencia: string | null
  raca: string | null
}

interface NivelEnsinoRow {
  id_nivel_ensino: number
  nome: string
}

interface StatusMatriculaRow {
  id_status_matricula: number
  nome: string
}

interface TurmaRow {
  id_turma: number
  nome: string
  turno: string
  ano_letivo: number
  id_nivel_ensino: number
}

interface DisciplinaRow {
  id_disciplina: number
  nome_disciplina: string
}

interface AnoEscolarRow {
  id_ano_escolar: number
  nome_ano: string
  id_nivel_ensino: number
}

interface StatusDisciplinaRow {
  id_status_disciplina: number
  nome: string
}

interface ConfigDisciplinaAnoRow {
  id_config: number
  id_disciplina: number
  id_ano_escolar: number
  quantidade_protocolos: number
}

// Lista agregada para exibição (Opção B: mantém IDs — evita “voltar” nome→id na edição)
interface MatriculaLista {
  id: number // id_matricula
  alunoId: number // id_aluno
  userId: string | null // alunos.user_id

  // dados do usuário / aluno
  alunoNome: string
  alunoEmail: string | null
  alunoFotoUrl: string | null
  alunoNis: string | null
  alunoNomeMae: string | null
  alunoNomePai: string | null
  usaTransporteEscolar: boolean
  possuiNecessidadeEspecial: boolean
  qualNecessidadeEspecial: string | null
  possuiRestricaoAlimentar: boolean
  qualRestricaoAlimentar: string | null
  possuiBeneficioGoverno: boolean
  qualBeneficioGoverno: string | null
  observacoesGerais: string | null

  dataNascimento: string | null
  cpf: string | null
  rg: string | null
  celular: string | null
  logradouro: string | null
  numeroEndereco: string | null
  bairro: string | null
  municipio: string | null
  pontoReferencia: string | null
  raca: string | null

  // dados da matrícula (com IDs)
  numeroInscricao: string
  anoLetivo: number
  nivelId: number
  nivelNome: string
  turmaId: number | null
  turmaNome: string | null
  turno: string | null
  statusId: number
  statusNome: string
  modalidade: string
  dataMatricula: string
  dataConclusao: string | null
}

interface AlunoFormState {
  nome: string
  email: string
  dataNasc: string
  cpf: string
  celular: string
  nis: string
  nomeMae: string
  nomePai: string
  logradouro: string
  numeroEnd: string
  bairro: string
  municipio: string
  pontoRef: string
  usaTransporte: boolean
  temNecessidade: boolean
  descNecessidade: string
  temRestricao: boolean
  descRestricao: string
  temBeneficio: boolean
  descBeneficio: string
  observacoes: string
  fotoUrl: string
}

interface MatriculaFormState {
  formId: string
  idMatricula?: number
  nivelId: number | ''
  numeroInscricao: string
  anoLetivo: string
  statusId: number | ''
  turmaId: number | ''
  modalidade: string
  dataMatricula: string
  dataConclusao: string
  // Aproveitamento
  seriesConcluidasIds: number[]
  // Progressão
  serieProgressaoId: number | ''
  disciplinasProgressaoIds: number[]
  // Edição: se true, reescreve progresso_aluno desta matrícula
  regenerarProgresso: boolean
}

// === HELPERS ===

const hojeISO = () => new Date().toISOString().slice(0, 10)

const gerarIdLocal = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const criarAlunoFormVazio = (): AlunoFormState => ({
  nome: '',
  email: '',
  dataNasc: '',
  cpf: '',
  celular: '',
  nis: '',
  nomeMae: '',
  nomePai: '',
  logradouro: '',
  numeroEnd: '',
  bairro: '',
  municipio: '',
  pontoRef: '',
  usaTransporte: false,
  temNecessidade: false,
  descNecessidade: '',
  temRestricao: false,
  descRestricao: '',
  temBeneficio: false,
  descBeneficio: '',
  observacoes: '',
  fotoUrl: '',
})

const parseMultiNumber = (raw: unknown): number[] => {
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n))
  }
  if (Array.isArray(raw)) {
    return raw
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n))
  }
  return []
}

const gerarEmailAutomatico = (nome: string): string => {
  const slug = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .split(/\s+/)

  const primeiro = slug[0] ?? 'aluno'
  const ultimo = slug.length > 1 ? slug[slug.length - 1] : 'ceja'

  return `${primeiro}_${ultimo}@ceja.com`
}

// Gera inserts para progresso_aluno a partir da modalidade da matrícula
const gerarInsertsProgresso = (args: {
  idMatricula: number
  nivelId: number
  modalidade: string
  seriesConcluidasIds: number[]
  serieProgressaoId: number | ''
  disciplinasProgressaoIds: number[]
  anosEscolaresDisponiveis: AnoEscolarRow[]
  statusDisciplinaDisponiveis: StatusDisciplinaRow[]
  configDisciplinaAnoDisponiveis: ConfigDisciplinaAnoRow[]
}): Array<Record<string, unknown>> => {
  const {
    idMatricula,
    nivelId,
    modalidade,
    seriesConcluidasIds,
    serieProgressaoId,
    disciplinasProgressaoIds,
    anosEscolaresDisponiveis,
    statusDisciplinaDisponiveis,
    configDisciplinaAnoDisponiveis,
  } = args

  const isAproveitamento = modalidade === 'Aproveitamento de Estudos'
  const isProgressao = modalidade === 'Progressão de Estudos'

  if (!isAproveitamento && !isProgressao) return []
  if (statusDisciplinaDisponiveis.length === 0) return []
  if (anosEscolaresDisponiveis.length === 0) return []
  if (configDisciplinaAnoDisponiveis.length === 0) return []

  const statusConcluida =
    statusDisciplinaDisponiveis.find((s) => {
      const n = s.nome.toLowerCase()
      return n.includes('aprov') || n.includes('conclu')
    }) ?? statusDisciplinaDisponiveis[0]

  const statusACursar =
    statusDisciplinaDisponiveis.find((s) =>
      s.nome.toLowerCase().includes('cursar'),
    ) ?? statusDisciplinaDisponiveis[0]

  const anosNivel = anosEscolaresDisponiveis.filter(
    (a) => a.id_nivel_ensino === nivelId,
  )

  const inserts: Array<Record<string, unknown>> = []

  if (isAproveitamento) {
    const concluidasSet = new Set(seriesConcluidasIds)

    const seriesConcluidas = anosNivel.filter((a) =>
      concluidasSet.has(a.id_ano_escolar),
    )
    const seriesRestantes = anosNivel.filter(
      (a) => !concluidasSet.has(a.id_ano_escolar),
    )

    // Séries concluídas → disciplinas concluídas
    seriesConcluidas.forEach((serie) => {
      const configs = configDisciplinaAnoDisponiveis.filter(
        (c) => c.id_ano_escolar === serie.id_ano_escolar,
      )
      configs.forEach((c) => {
        inserts.push({
          id_matricula: idMatricula,
          id_disciplina: c.id_disciplina,
          id_ano_escolar: serie.id_ano_escolar,
          id_status_disciplina: statusConcluida.id_status_disciplina,
          nota_final: null,
          data_conclusao: null,
          observacoes: 'Disciplina concluída por aproveitamento de estudos.',
        })
      })
    })

    // Séries restantes → disciplinas A Cursar
    seriesRestantes.forEach((serie) => {
      const configs = configDisciplinaAnoDisponiveis.filter(
        (c) => c.id_ano_escolar === serie.id_ano_escolar,
      )
      configs.forEach((c) => {
        inserts.push({
          id_matricula: idMatricula,
          id_disciplina: c.id_disciplina,
          id_ano_escolar: serie.id_ano_escolar,
          id_status_disciplina: statusACursar.id_status_disciplina,
          nota_final: null,
          data_conclusao: null,
          observacoes:
            'Disciplina marcada como A Cursar após aproveitamento de estudos.',
        })
      })
    })
  }

  if (
    isProgressao &&
    serieProgressaoId !== '' &&
    disciplinasProgressaoIds.length > 0
  ) {
    const serieIdNum = Number(serieProgressaoId)
    const configs = configDisciplinaAnoDisponiveis.filter(
      (c) =>
        c.id_ano_escolar === serieIdNum &&
        disciplinasProgressaoIds.includes(c.id_disciplina),
    )

    configs.forEach((c) => {
      inserts.push({
        id_matricula: idMatricula,
        id_disciplina: c.id_disciplina,
        id_ano_escolar: serieIdNum,
        id_status_disciplina: statusACursar.id_status_disciplina,
        nota_final: null,
        data_conclusao: null,
        observacoes:
          'Disciplina definida como A Cursar na matrícula de Progressão de Estudos.',
      })
    })
  }

  return inserts
}

// === SUBCOMPONENTE: BLOCO DE MATRÍCULA POR NÍVEL ===

interface MatriculaNivelCardProps {
  modo: 'novo' | 'editar'
  form: MatriculaFormState
  setForm: (patch: Partial<MatriculaFormState>) => void
  removerBloco?: () => void
  desabilitado: boolean
  niveisDisponiveis: NivelEnsinoRow[]
  statusDisponiveis: StatusMatriculaRow[]
  turmasDisponiveis: TurmaRow[]
  disciplinasDisponiveis: DisciplinaRow[]
  anosEscolaresDisponiveis: AnoEscolarRow[]
  configDisciplinaAnoDisponiveis: ConfigDisciplinaAnoRow[]
  themeMode: 'light' | 'dark'
}

const MatriculaNivelCard: FC<MatriculaNivelCardProps> = (props) => {
  const {
    modo,
    form,
    setForm,
    removerBloco,
    desabilitado,
    niveisDisponiveis,
    statusDisponiveis,
    turmasDisponiveis,
    disciplinasDisponiveis,
    anosEscolaresDisponiveis,
    configDisciplinaAnoDisponiveis,
    themeMode,
  } = props

  const nivelIdNum = form.nivelId === '' ? null : Number(form.nivelId)
  const nivelNome =
    nivelIdNum != null
      ? niveisDisponiveis.find((n) => n.id_nivel_ensino === nivelIdNum)?.nome ??
        'Nível'
      : 'Nível não selecionado'

  const isAproveitamento = form.modalidade === 'Aproveitamento de Estudos'
  const isProgressao = form.modalidade === 'Progressão de Estudos'

  const turmasFiltradas = useMemo(() => {
    if (nivelIdNum == null) return []
    let lista = turmasDisponiveis.filter((t) => t.id_nivel_ensino === nivelIdNum)

    const ano = Number(form.anoLetivo)
    if (form.anoLetivo.trim() !== '' && Number.isFinite(ano)) {
      lista = lista.filter((t) => t.ano_letivo === ano)
    }
    return lista
  }, [turmasDisponiveis, nivelIdNum, form.anoLetivo])

  const seriesDoNivel = useMemo(() => {
    if (nivelIdNum == null) return []
    return anosEscolaresDisponiveis
      .filter((a) => a.id_nivel_ensino === nivelIdNum)
      .sort((a, b) => a.nome_ano.localeCompare(b.nome_ano))
  }, [anosEscolaresDisponiveis, nivelIdNum])

  const disciplinasDaSerieProgressao = useMemo(() => {
    if (form.serieProgressaoId === '') return []
    const serieIdNum = Number(form.serieProgressaoId)
    const configs = configDisciplinaAnoDisponiveis.filter(
      (c) => c.id_ano_escolar === serieIdNum,
    )
    const ids = configs.map((c) => c.id_disciplina)
    return disciplinasDisponiveis.filter((d) => ids.includes(d.id_disciplina))
  }, [form.serieProgressaoId, configDisciplinaAnoDisponiveis, disciplinasDisponiveis])

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor:
          themeMode === 'light'
            ? alpha(green[400], 0.25)
            : alpha(green[300], 0.25),
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ wordBreak: 'break-word' }}>
              Matrícula — {nivelNome}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cada nível pode (e deve) ter número de inscrição e turma próprios.
            </Typography>
          </Box>

          {removerBloco && (
            <Tooltip title="Remover este bloco (apenas do formulário)">
              <span>
                <IconButton size="small" onClick={removerBloco} disabled={desabilitado}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id={`nivel-label-${form.formId}`}>Nível de ensino</InputLabel>
            <Select
              labelId={`nivel-label-${form.formId}`}
              label="Nível de ensino"
              value={form.nivelId === '' ? '' : String(form.nivelId)}
              onChange={(e) =>
                setForm({
                  nivelId: e.target.value === '' ? '' : Number(e.target.value),
                  turmaId: '',
                  seriesConcluidasIds: [],
                  serieProgressaoId: '',
                  disciplinasProgressaoIds: [],
                })
              }
              disabled={desabilitado}
            >
              <MenuItem value="">
                <em>Selecione</em>
              </MenuItem>
              {niveisDisponiveis.map((nivel) => (
                <MenuItem key={nivel.id_nivel_ensino} value={String(nivel.id_nivel_ensino)}>
                  {nivel.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Número de inscrição"
            value={form.numeroInscricao}
            onChange={(e) => setForm({ numeroInscricao: e.target.value })}
            disabled={desabilitado || form.nivelId === ''}
            helperText="Obrigatório (tabela matriculas.numero_inscricao é NOT NULL)."
          />

          <TextField
            fullWidth
            size="small"
            label="Ano letivo"
            type="number"
            value={form.anoLetivo}
            onChange={(e) => setForm({ anoLetivo: e.target.value })}
            disabled={desabilitado || form.nivelId === ''}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id={`modalidade-label-${form.formId}`}>Modalidade</InputLabel>
            <Select
              labelId={`modalidade-label-${form.formId}`}
              label="Modalidade"
              value={form.modalidade}
              onChange={(e) => {
                const nova = e.target.value
                // sempre que muda modalidade, zera campos específicos para evitar “lixo”
                setForm({
                  modalidade: nova,
                  seriesConcluidasIds: [],
                  serieProgressaoId: '',
                  disciplinasProgressaoIds: [],
                })
              }}
              disabled={desabilitado || form.nivelId === ''}
            >
              {MODALIDADES_MATRICULA.map((mod) => (
                <MenuItem key={mod.value} value={mod.value}>
                  {mod.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id={`status-label-${form.formId}`}>Status</InputLabel>
            <Select
              labelId={`status-label-${form.formId}`}
              label="Status"
              value={form.statusId === '' ? '' : String(form.statusId)}
              onChange={(e) => setForm({ statusId: e.target.value === '' ? '' : Number(e.target.value) })}
              disabled={desabilitado || form.nivelId === ''}
            >
              <MenuItem value="">
                <em>Selecione</em>
              </MenuItem>
              {statusDisponiveis.map((s) => (
                <MenuItem key={s.id_status_matricula} value={String(s.id_status_matricula)}>
                  {s.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Data da matrícula"
            type="date"
            value={form.dataMatricula}
            onChange={(e) => setForm({ dataMatricula: e.target.value })}
            InputLabelProps={{ shrink: true }}
            disabled={desabilitado || form.nivelId === ''}
          />

          <TextField
            fullWidth
            size="small"
            label="Data de conclusão (opcional)"
            type="date"
            value={form.dataConclusao}
            onChange={(e) => setForm({ dataConclusao: e.target.value })}
            InputLabelProps={{ shrink: true }}
            disabled={desabilitado || form.nivelId === ''}
          />
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id={`turma-label-${form.formId}`}>Turma</InputLabel>
            <Select
              labelId={`turma-label-${form.formId}`}
              label="Turma"
              value={form.turmaId === '' ? '' : String(form.turmaId)}
              onChange={(e) => setForm({ turmaId: e.target.value === '' ? '' : Number(e.target.value) })}
              disabled={desabilitado || form.nivelId === ''}
              displayEmpty
            >
              <MenuItem value="">
                <em>Sem turma vinculada</em>
              </MenuItem>
              {turmasFiltradas.map((t) => (
                <MenuItem key={t.id_turma} value={String(t.id_turma)}>
                  {t.nome} — {t.turno} ({t.ano_letivo})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {modo === 'editar' && (
            <FormControlLabel
              sx={{ ml: { xs: 0, md: 1 } }}
              control={
                <Switch
                  size="small"
                  checked={form.regenerarProgresso}
                  onChange={(e) => setForm({ regenerarProgresso: e.target.checked })}
                  disabled={desabilitado || form.nivelId === ''}
                />
              }
              label="Regerar progresso (progresso_aluno)"
            />
          )}
        </Stack>

        {/* BLOCO: APROVEITAMENTO */}
        {isAproveitamento && form.nivelId !== '' && (
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={800}>
              Aproveitamento de Estudos — Séries concluídas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selecione as séries (anos escolares) que o aluno já concluiu em outra escola.
              As disciplinas dessas séries serão marcadas como concluídas; as séries restantes serão registradas como &quot;A Cursar&quot;.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel id={`series-concluidas-label-${form.formId}`}>Séries concluídas</InputLabel>
              <Select
                labelId={`series-concluidas-label-${form.formId}`}
                multiple
                label="Séries concluídas"
                value={form.seriesConcluidasIds}
                onChange={(e) => setForm({ seriesConcluidasIds: parseMultiNumber(e.target.value) })}
                renderValue={(selected) => {
                  const ids = selected as number[]
                  const nomes = seriesDoNivel
                    .filter((s) => ids.includes(s.id_ano_escolar))
                    .map((s) => s.nome_ano)
                  return nomes.join(', ')
                }}
                disabled={desabilitado || seriesDoNivel.length === 0}
              >
                {seriesDoNivel.map((serie) => (
                  <MenuItem key={serie.id_ano_escolar} value={serie.id_ano_escolar}>
                    <Checkbox size="small" checked={form.seriesConcluidasIds.includes(serie.id_ano_escolar)} />
                    <ListItemText primary={serie.nome_ano} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        )}

        {/* BLOCO: PROGRESSÃO */}
        {isProgressao && form.nivelId !== '' && (
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={800}>
              Progressão de Estudos — Série e disciplinas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selecione a série (ano escolar) e as disciplinas que o aluno irá cursar no CEJA.
              As disciplinas serão registradas com status &quot;A Cursar&quot;.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel id={`serie-progressao-label-${form.formId}`}>Série (ano escolar)</InputLabel>
              <Select
                labelId={`serie-progressao-label-${form.formId}`}
                label="Série (ano escolar)"
                value={form.serieProgressaoId === '' ? '' : String(form.serieProgressaoId)}
                onChange={(e) =>
                  setForm({
                    serieProgressaoId: e.target.value === '' ? '' : Number(e.target.value),
                    disciplinasProgressaoIds: [],
                  })
                }
                disabled={desabilitado || seriesDoNivel.length === 0}
              >
                <MenuItem value="">
                  <em>Selecione</em>
                </MenuItem>
                {seriesDoNivel.map((serie) => (
                  <MenuItem key={serie.id_ano_escolar} value={serie.id_ano_escolar}>
                    {serie.nome_ano}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id={`disciplinas-progressao-label-${form.formId}`}>Disciplinas a cursar</InputLabel>
              <Select
                labelId={`disciplinas-progressao-label-${form.formId}`}
                multiple
                label="Disciplinas a cursar"
                value={form.disciplinasProgressaoIds}
                onChange={(e) => setForm({ disciplinasProgressaoIds: parseMultiNumber(e.target.value) })}
                renderValue={(selected) => {
                  const ids = selected as number[]
                  const nomes = disciplinasDaSerieProgressao
                    .filter((d) => ids.includes(d.id_disciplina))
                    .map((d) => d.nome_disciplina)
                  return nomes.join(', ')
                }}
                disabled={desabilitado || disciplinasDaSerieProgressao.length === 0}
              >
                {disciplinasDaSerieProgressao.map((disc) => (
                  <MenuItem key={disc.id_disciplina} value={disc.id_disciplina}>
                    <Checkbox size="small" checked={form.disciplinasProgressaoIds.includes(disc.id_disciplina)} />
                    <ListItemText primary={disc.nome_disciplina} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

// === COMPONENTE PRINCIPAL ===

const SecretariaMatriculasPage: FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { erro, sucesso, aviso } = useNotificacaoContext()

  const [matriculas, setMatriculas] = useState<MatriculaLista[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)

  const [busca, setBusca] = useState('')
  const [filtroAno, setFiltroAno] = useState<string>('todos')
  const [filtroNivel, setFiltroNivel] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])
  const [niveisDisponiveis, setNiveisDisponiveis] = useState<NivelEnsinoRow[]>([])
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusMatriculaRow[]>([])
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<TurmaRow[]>([])
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<DisciplinaRow[]>([])
  const [anosEscolaresDisponiveis, setAnosEscolaresDisponiveis] = useState<AnoEscolarRow[]>([])
  const [statusDisciplinaDisponiveis, setStatusDisciplinaDisponiveis] = useState<StatusDisciplinaRow[]>([])
  const [configDisciplinaAnoDisponiveis, setConfigDisciplinaAnoDisponiveis] = useState<ConfigDisciplinaAnoRow[]>([])

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // ===== NOVA MATRÍCULA (CADASTRO) =====
  const [novaAberta, setNovaAberta] = useState(false)
  const [salvandoNova, setSalvandoNova] = useState(false)

  const [novoAluno, setNovoAluno] = useState<AlunoFormState>(criarAlunoFormVazio())
  const [uploadingFotoNovoAluno, setUploadingFotoNovoAluno] = useState(false)
  const fileInputFotoNovoRef = useRef<HTMLInputElement | null>(null)

  const [novoBlocosMatricula, setNovoBlocosMatricula] = useState<MatriculaFormState[]>([])

  // ===== EDIÇÃO =====
  const [editarAberto, setEditarAberto] = useState(false)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const [editAluno, setEditAluno] = useState<AlunoFormState>(criarAlunoFormVazio())
  const [editAlunoId, setEditAlunoId] = useState<number | null>(null)
  const [editUserId, setEditUserId] = useState<string | null>(null)

  const [uploadingFotoEditAluno, setUploadingFotoEditAluno] = useState(false)
  const fileInputFotoEditRef = useRef<HTMLInputElement | null>(null)

  const [editBlocosMatricula, setEditBlocosMatricula] = useState<MatriculaFormState[]>([])

  // Exclusão de matrícula
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false)
  const [matriculaParaExcluir, setMatriculaParaExcluir] = useState<MatriculaLista | null>(null)
  const [excluindoMatricula, setExcluindoMatricula] = useState(false)

  // Ficha selecionada
  const [matriculaSelecionada, setMatriculaSelecionada] = useState<MatriculaLista | null>(null)

  // ===== MAPAS ÚTEIS =====
  const niveisById = useMemo(() => {
    const m = new Map<number, NivelEnsinoRow>()
    niveisDisponiveis.forEach((n) => m.set(n.id_nivel_ensino, n))
    return m
  }, [niveisDisponiveis])



  const statusAtivoId = useMemo(() => {
    const ativo = statusDisponiveis.find((s) => s.nome.toLowerCase().includes('ativo'))
    return ativo?.id_status_matricula ?? statusDisponiveis[0]?.id_status_matricula ?? null
  }, [statusDisponiveis])

  // ===== Upload foto (genérico) =====
  const uploadFotoAluno = async (file: File, alvo: 'novo' | 'edit') => {
    if (!supabase) return

    try {
      if (alvo === 'novo') setUploadingFotoNovoAluno(true)
      else setUploadingFotoEditAluno(true)

      if (file.size > 5 * 1024 * 1024) {
        aviso('Tamanho máximo permitido para a foto é 5MB.')
        return
      }

      const bucket = 'avatars'
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()

      const baseRaw =
        alvo === 'novo'
          ? (novoAluno.email || novoAluno.nome || 'aluno')
          : (editAluno.email || editAluno.nome || 'aluno')

      const base = baseRaw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')

      const caminho = `alunos/${base || 'aluno'}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage.from(bucket).upload(caminho, file, { upsert: true })

      if (upErr) {
        console.error(upErr)
        erro('Erro ao enviar a foto do aluno. Verifique o Storage.')
        return
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(caminho)

      if (!publicUrlData?.publicUrl) {
        erro('Não foi possível obter a URL pública da foto.')
        return
      }

      if (alvo === 'novo') setNovoAluno((p) => ({ ...p, fotoUrl: publicUrlData.publicUrl }))
      else setEditAluno((p) => ({ ...p, fotoUrl: publicUrlData.publicUrl }))

      sucesso('Foto do aluno atualizada.')
    } catch (e) {
      console.error(e)
      erro('Erro inesperado ao enviar a foto do aluno.')
    } finally {
      if (alvo === 'novo') setUploadingFotoNovoAluno(false)
      else setUploadingFotoEditAluno(false)
    }
  }

  // ===== Carregar dados =====

  const carregarDados = async () => {
    if (!supabase) return

    try {
      setCarregando(true)

      const [
        { data: matriculasData, error: matriculasError },
        { data: alunosData, error: alunosError },
        { data: niveisData, error: niveisError },
        { data: statusData, error: statusError },
        { data: turmasData, error: turmasError },
        { data: disciplinasData, error: disciplinasError },
        { data: anosEscolaresData, error: anosEscolaresError },
        { data: statusDiscData, error: statusDiscError },
        { data: configDiscAnoData, error: configDiscAnoError },
      ] = await Promise.all([
        supabase
          .from('matriculas')
          .select(
            [
              'id_matricula',
              'id_aluno',
              'numero_inscricao',
              'id_nivel_ensino',
              'id_status_matricula',
              'modalidade',
              'ano_letivo',
              'data_matricula',
              'data_conclusao',
              'id_turma',
            ].join(','),
          )
          .order('ano_letivo', { ascending: false })
          .order('data_matricula', { ascending: false }),
        supabase.from('alunos').select(
          [
            'id_aluno',
            'user_id',
            'nis',
            'nome_mae',
            'nome_pai',
            'usa_transporte_escolar',
            'possui_necessidade_especial',
            'qual_necessidade_especial',
            'possui_restricao_alimentar',
            'qual_restricao_alimentar',
            'possui_beneficio_governo',
            'qual_beneficio_governo',
            'observacoes_gerais',
          ].join(','),
        ),
        supabase.from('niveis_ensino').select('id_nivel_ensino, nome'),
        supabase.from('status_matricula').select('id_status_matricula, nome'),
        supabase.from('turmas').select('id_turma, nome, turno, ano_letivo, id_nivel_ensino'),
        supabase.from('disciplinas').select('id_disciplina, nome_disciplina'),
        supabase.from('anos_escolares').select('id_ano_escolar, nome_ano, id_nivel_ensino'),
        supabase.from('status_disciplina_aluno').select('id_status_disciplina, nome'),
        supabase
          .from('config_disciplina_ano')
          .select('id_config, id_disciplina, id_ano_escolar, quantidade_protocolos'),
      ])

      if (matriculasError) {
        console.error(matriculasError)
        erro('Erro ao carregar matrículas.')
      }
      if (alunosError) {
        console.error(alunosError)
        erro('Erro ao carregar alunos.')
      }
      if (niveisError) {
        console.error(niveisError)
        erro('Erro ao carregar níveis de ensino.')
      }
      if (statusError) {
        console.error(statusError)
        erro('Erro ao carregar status de matrícula.')
      }
      if (turmasError) {
        console.error(turmasError)
        erro('Erro ao carregar turmas.')
      }
      if (disciplinasError) {
        console.error(disciplinasError)
        erro('Erro ao carregar disciplinas.')
      }
      if (anosEscolaresError) {
        console.error(anosEscolaresError)
        erro('Erro ao carregar anos escolares.')
      }
      if (statusDiscError) {
        console.error(statusDiscError)
        erro('Erro ao carregar status de disciplina.')
      }
      if (configDiscAnoError) {
        console.error(configDiscAnoError)
        erro('Erro ao carregar configuração de disciplinas por série.')
      }

      const matriculasList = (matriculasData ?? []) as unknown as MatriculaRow[]
      const alunosList = (alunosData ?? []) as unknown as AlunoRow[]
      const niveisList = (niveisData ?? []) as NivelEnsinoRow[]
      const statusList = (statusData ?? []) as StatusMatriculaRow[]
      const turmasList = (turmasData ?? []) as TurmaRow[]
      const disciplinasList = (disciplinasData ?? []) as DisciplinaRow[]
      const anosEscolaresList = (anosEscolaresData ?? []) as AnoEscolarRow[]
      const statusDiscList = (statusDiscData ?? []) as StatusDisciplinaRow[]
      const configDiscAnoList = (configDiscAnoData ?? []) as ConfigDisciplinaAnoRow[]

      setNiveisDisponiveis(niveisList)
      setStatusDisponiveis(statusList)
      setTurmasDisponiveis(turmasList)
      setDisciplinasDisponiveis(disciplinasList)
      setAnosEscolaresDisponiveis(anosEscolaresList)
      setStatusDisciplinaDisponiveis(statusDiscList)
      setConfigDisciplinaAnoDisponiveis(configDiscAnoList)

      const anos = Array.from(new Set(matriculasList.map((m) => m.ano_letivo).filter((a) => a != null))).sort(
        (a, b) => b - a,
      )
      setAnosDisponiveis(anos)

      const alunosById = new Map<number, AlunoRow>()
      alunosList.forEach((a) => alunosById.set(a.id_aluno, a))

      const userIds = Array.from(new Set(alunosList.map((a) => a.user_id).filter((id): id is string => !!id)))

      let usuariosById = new Map<string, UsuarioRow>()
      if (userIds.length > 0) {
        const { data: usuariosData, error: usuariosError } = await supabase
          .from('usuarios')
          .select(
            [
              'id',
              'name',
              'email',
              'username',
              'foto_url',
              'data_nascimento',
              'cpf',
              'rg',
              'celular',
              'logradouro',
              'numero_endereco',
              'bairro',
              'municipio',
              'ponto_referencia',
              'raca',
            ].join(','),
          )
          .in('id', userIds)

        if (usuariosError) {
          console.error(usuariosError)
          erro('Erro ao carregar dados dos usuários (alunos).')
        } else if (usuariosData) {
          const list = usuariosData as unknown as UsuarioRow[]
          usuariosById = new Map<string, UsuarioRow>()
          list.forEach((u) => usuariosById.set(u.id, u))
        }
      }

      const niveisMap = new Map<number, NivelEnsinoRow>()
      niveisList.forEach((n) => niveisMap.set(n.id_nivel_ensino, n))

      const statusMap = new Map<number, StatusMatriculaRow>()
      statusList.forEach((s) => statusMap.set(s.id_status_matricula, s))

      const turmasMap = new Map<number, TurmaRow>()
      turmasList.forEach((t) => turmasMap.set(t.id_turma, t))

      const normalizados: MatriculaLista[] = matriculasList.map((m) => {
        const aluno = alunosById.get(m.id_aluno)
        const usuario = aluno?.user_id ? usuariosById.get(aluno.user_id) : undefined
        const nivel = niveisMap.get(m.id_nivel_ensino)
        const status = statusMap.get(m.id_status_matricula)
        const turma = m.id_turma != null ? turmasMap.get(m.id_turma) : undefined

        return {
          id: m.id_matricula,
          alunoId: m.id_aluno,
          userId: aluno?.user_id ?? null,

          alunoNome: usuario?.name ?? 'Aluno sem vínculo de usuário',
          alunoEmail: usuario?.email ?? null,
          alunoFotoUrl: usuario?.foto_url ?? null,
          alunoNis: aluno?.nis ?? null,
          alunoNomeMae: aluno?.nome_mae ?? null,
          alunoNomePai: aluno?.nome_pai ?? null,
          usaTransporteEscolar: aluno?.usa_transporte_escolar ?? false,
          possuiNecessidadeEspecial: aluno?.possui_necessidade_especial ?? false,
          qualNecessidadeEspecial: aluno?.qual_necessidade_especial ?? null,
          possuiRestricaoAlimentar: aluno?.possui_restricao_alimentar ?? false,
          qualRestricaoAlimentar: aluno?.qual_restricao_alimentar ?? null,
          possuiBeneficioGoverno: aluno?.possui_beneficio_governo ?? false,
          qualBeneficioGoverno: aluno?.qual_beneficio_governo ?? null,
          observacoesGerais: aluno?.observacoes_gerais ?? null,

          dataNascimento: usuario?.data_nascimento ?? null,
          cpf: usuario?.cpf ?? null,
          rg: usuario?.rg ?? null,
          celular: usuario?.celular ?? null,
          logradouro: usuario?.logradouro ?? null,
          numeroEndereco: usuario?.numero_endereco ?? null,
          bairro: usuario?.bairro ?? null,
          municipio: usuario?.municipio ?? null,
          pontoReferencia: usuario?.ponto_referencia ?? null,
          raca: usuario?.raca ?? null,

          numeroInscricao: m.numero_inscricao,
          anoLetivo: m.ano_letivo,
          nivelId: m.id_nivel_ensino,
          nivelNome: nivel?.nome ?? 'Nível não definido',
          turmaId: m.id_turma,
          turmaNome: turma?.nome ?? null,
          turno: turma?.turno ?? null,
          statusId: m.id_status_matricula,
          statusNome: status?.nome ?? 'Status não definido',
          modalidade: m.modalidade,
          dataMatricula: m.data_matricula,
          dataConclusao: m.data_conclusao,
        }
      })

      setMatriculas(normalizados)
    } catch (e) {
      console.error(e)
      erro('Erro inesperado ao carregar matrículas.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregarDados()
  }, [supabase])

  // ===== PAGINAÇÃO =====

  const handleChangePage = (event: unknown, newPage: number) => {
    void event
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // ===== ABRIR/FECHAR NOVO =====

  const criarBlocoMatriculaPadrao = (): MatriculaFormState => ({
    formId: gerarIdLocal(),
    nivelId: '',
    numeroInscricao: '',
    anoLetivo: new Date().getFullYear().toString(),
    statusId: statusAtivoId ?? '',
    turmaId: '',
    modalidade: 'Orientação de Estudos',
    dataMatricula: hojeISO(),
    dataConclusao: '',
    seriesConcluidasIds: [],
    serieProgressaoId: '',
    disciplinasProgressaoIds: [],
    regenerarProgresso: false,
  })

  const handleAbrirNovaMatricula = () => {
    setNovoAluno(criarAlunoFormVazio())
    setNovoBlocosMatricula([criarBlocoMatriculaPadrao()])
    setNovaAberta(true)
  }

  const handleFecharNovaMatricula = () => {
    if (salvandoNova) return
    setNovaAberta(false)
  }

  const adicionarBlocoNovo = () => {
    setNovoBlocosMatricula((prev) => [...prev, criarBlocoMatriculaPadrao()])
  }

  const adicionarTodosNiveisNovo = () => {
    if (niveisDisponiveis.length === 0) return

    setNovoBlocosMatricula((prev) => {
      const jaTem = new Set(prev.map((b) => b.nivelId).filter((v): v is number => v !== ''))
      const novos: MatriculaFormState[] = []
      niveisDisponiveis.forEach((n) => {
        if (!jaTem.has(n.id_nivel_ensino)) {
          novos.push({
            ...criarBlocoMatriculaPadrao(),
            nivelId: n.id_nivel_ensino,
          })
        }
      })
      return [...prev, ...novos]
    })
  }

  // ===== SALVAR NOVO =====

  const validarBlocosMatricula = (
    blocos: MatriculaFormState[],
    opts: { modo: 'novo' | 'editar' } = { modo: 'novo' },
  ): { ok: boolean; msg?: string } => {
    if (blocos.length === 0) return { ok: false, msg: 'Adicione pelo menos uma matrícula.' }

    for (const [idx, b] of blocos.entries()) {
      if (b.nivelId === '') return { ok: false, msg: `Selecione o nível de ensino no bloco ${idx + 1}.` }
      if (!b.numeroInscricao.trim())
        return { ok: false, msg: `Informe o número de inscrição no bloco ${idx + 1} (nível: ${niveisById.get(Number(b.nivelId))?.nome ?? b.nivelId}).` }
      if (!b.anoLetivo.trim() || !Number.isFinite(Number(b.anoLetivo)))
        return { ok: false, msg: `Informe um ano letivo válido no bloco ${idx + 1}.` }
      if (b.statusId === '') return { ok: false, msg: `Selecione um status no bloco ${idx + 1}.` }
      if (!b.modalidade.trim()) return { ok: false, msg: `Selecione a modalidade no bloco ${idx + 1}.` }
      if (!b.dataMatricula.trim()) return { ok: false, msg: `Informe a data de matrícula no bloco ${idx + 1}.` }

      if (b.modalidade === 'Progressão de Estudos') {
        const precisaDefinirProgressao =
          opts.modo === 'novo' || !b.idMatricula || b.regenerarProgresso
        if (precisaDefinirProgressao) {
          if (b.serieProgressaoId === '')
            return {
              ok: false,
              msg: `Selecione a série (ano escolar) no bloco ${idx + 1} (Progressão).`,
            }
          if (b.disciplinasProgressaoIds.length === 0)
            return {
              ok: false,
              msg: `Selecione ao menos uma disciplina no bloco ${idx + 1} (Progressão).`,
            }
        }
      }
    }

    return { ok: true }
  }

  const handleSalvarNovaMatricula = async () => {
    if (!supabase) return

    const nome = novoAluno.nome.trim()
    const emailDigitado = novoAluno.email.trim().toLowerCase() || null
    const cpf = novoAluno.cpf.trim() || null

    if (!nome) {
      erro('Informe pelo menos o nome completo do aluno.')
      return
    }

    const valid = validarBlocosMatricula(novoBlocosMatricula, { modo: 'novo' })
    if (!valid.ok) {
      erro(valid.msg || 'Verifique os dados das matrículas.')
      return
    }

    const emailFinal = emailDigitado ?? gerarEmailAutomatico(nome)
    const senhaFinal = cpf && cpf.length >= 3 ? cpf : `Ceja@${new Date().getFullYear()}`

    try {
      setSalvandoNova(true)

      // 1) Cria usuário de autenticação (OBS: signUp pode trocar a sessão em ambientes sem confirmação de e-mail)
      const { data: sessAntesData } = await supabase.auth.getSession()
      const sessAntes = sessAntesData.session

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: emailFinal,
        password: senhaFinal,
      })

      if (signUpError || !signUpData?.user) {
        console.error(signUpError)
        erro('Erro ao criar usuário de autenticação do aluno.')
        return
      }

      const authUserId = signUpData.user.id

      // Se o signUp devolveu sessão (ambiente sem confirmação de e-mail), restaura a sessão anterior
      if (sessAntes && signUpData.session) {
        const { error: setSessErr } = await supabase.auth.setSession({
          access_token: sessAntes.access_token,
          refresh_token: sessAntes.refresh_token,
        })
        if (setSessErr) {
          console.warn('Não foi possível restaurar a sessão anterior após signUp:', setSessErr)
        }
      }

      // 2) Cria registro em public.usuarios
      const usuarioPayload: Partial<UsuarioRow> & { id: string; id_tipo_usuario: number; status: string } = {
        id: authUserId,
        id_tipo_usuario: TIPO_USUARIO_ALUNO_ID,
        name: nome,
        username: null,
        email: emailFinal,
        data_nascimento: novoAluno.dataNasc || null,
        cpf: novoAluno.cpf.trim() || null,
        rg: null,
        celular: novoAluno.celular.trim() || null,
        logradouro: novoAluno.logradouro.trim() || null,
        numero_endereco: novoAluno.numeroEnd.trim() || null,
        bairro: novoAluno.bairro.trim() || null,
        municipio: novoAluno.municipio.trim() || null,
        ponto_referencia: novoAluno.pontoRef.trim() || null,
        raca: null,
        foto_url: novoAluno.fotoUrl || null,
        status: 'Ativo',
      }

      const { error: usuarioError } = await supabase.from('usuarios').insert(usuarioPayload)

      if (usuarioError) {
        console.error(usuarioError)
        erro('Erro ao salvar dados básicos do aluno (usuário).')
        return
      }

      // 3) Cria registro em public.alunos
      const alunoPayload: Partial<AlunoRow> = {
        user_id: authUserId,
        nis: novoAluno.nis.trim() || null,
        nome_mae: novoAluno.nomeMae.trim() || 'Não informado',
        nome_pai: novoAluno.nomePai.trim() || null,
        usa_transporte_escolar: novoAluno.usaTransporte,
        possui_necessidade_especial: novoAluno.temNecessidade,
        qual_necessidade_especial: novoAluno.temNecessidade ? novoAluno.descNecessidade.trim() || null : null,
        possui_restricao_alimentar: novoAluno.temRestricao,
        qual_restricao_alimentar: novoAluno.temRestricao ? novoAluno.descRestricao.trim() || null : null,
        possui_beneficio_governo: novoAluno.temBeneficio,
        qual_beneficio_governo: novoAluno.temBeneficio ? novoAluno.descBeneficio.trim() || null : null,
        observacoes_gerais: novoAluno.observacoes.trim() || null,
      }

      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .insert(alunoPayload)
        .select('id_aluno')
        .single<{ id_aluno: number }>()

      if (alunoError || !alunoData) {
        console.error(alunoError)
        erro('Erro ao salvar dados específicos do aluno.')
        return
      }

      const novoAlunoId = alunoData.id_aluno

      // 4) Insere uma matrícula por bloco (nível)
      const matriculasPayload = novoBlocosMatricula.map((b) => ({
        id_aluno: novoAlunoId,
        numero_inscricao: b.numeroInscricao.trim(),
        id_nivel_ensino: Number(b.nivelId),
        id_status_matricula: Number(b.statusId),
        modalidade: b.modalidade,
        ano_letivo: Number(b.anoLetivo),
        data_matricula: b.dataMatricula,
        data_conclusao: b.dataConclusao.trim() ? b.dataConclusao : null,
        id_turma: b.turmaId === '' ? null : Number(b.turmaId),
      }))

      const { data: matriculasInseridas, error: insertMatriculasError } = await supabase
        .from('matriculas')
        .insert(matriculasPayload)
        .select(
          'id_matricula, id_aluno, numero_inscricao, id_nivel_ensino, id_status_matricula, modalidade, ano_letivo, data_matricula, data_conclusao, id_turma',
        )

      if (insertMatriculasError || !matriculasInseridas || matriculasInseridas.length === 0) {
        console.error(insertMatriculasError)
        erro('Erro ao salvar a(s) matrícula(s) do aluno.')
        return
      }

      // 5) Progresso (aproveitamento/progressão) por matrícula
      const insertsProgressoTotal: Array<Record<string, unknown>> = []
      for (const m of matriculasInseridas as unknown as MatriculaRow[]) {
        const bloco = novoBlocosMatricula.find((b) => Number(b.nivelId) === m.id_nivel_ensino && b.numeroInscricao.trim() === m.numero_inscricao)
        if (!bloco) continue

        const inserts = gerarInsertsProgresso({
          idMatricula: m.id_matricula,
          nivelId: m.id_nivel_ensino,
          modalidade: bloco.modalidade,
          seriesConcluidasIds: bloco.seriesConcluidasIds,
          serieProgressaoId: bloco.serieProgressaoId,
          disciplinasProgressaoIds: bloco.disciplinasProgressaoIds,
          anosEscolaresDisponiveis,
          statusDisciplinaDisponiveis,
          configDisciplinaAnoDisponiveis,
        })

        insertsProgressoTotal.push(...inserts)
      }

      if (insertsProgressoTotal.length > 0) {
        const { error: progError } = await supabase.from('progresso_aluno').insert(insertsProgressoTotal)
        if (progError) {
          console.error(progError)
          aviso('Matrícula(s) criada(s), mas houve erro ao registrar o progresso das disciplinas.')
        }
      }

      await carregarDados()
      sucesso(`Aluno e matrícula(s) criados com sucesso. Usuário: ${emailFinal} | Senha inicial: ${cpf || senhaFinal}`)
      setNovaAberta(false)
    } catch (e) {
      console.error(e)
      erro('Erro inesperado ao salvar matrícula.')
    } finally {
      setSalvandoNova(false)
    }
  }

  // ===== ABRIR/FECHAR EDITAR =====

  const abrirDialogEditarMatricula = (matricula: MatriculaLista) => {
    // Carrega aluno (dados comuns) a partir do agregado
    setEditAluno({
      nome: matricula.alunoNome ?? '',
      email: matricula.alunoEmail ?? '',
      dataNasc: matricula.dataNascimento ?? '',
      cpf: matricula.cpf ?? '',
      celular: matricula.celular ?? '',
      nis: matricula.alunoNis ?? '',
      nomeMae: matricula.alunoNomeMae ?? '',
      nomePai: matricula.alunoNomePai ?? '',
      logradouro: matricula.logradouro ?? '',
      numeroEnd: matricula.numeroEndereco ?? '',
      bairro: matricula.bairro ?? '',
      municipio: matricula.municipio ?? '',
      pontoRef: matricula.pontoReferencia ?? '',
      usaTransporte: !!matricula.usaTransporteEscolar,
      temNecessidade: !!matricula.possuiNecessidadeEspecial,
      descNecessidade: matricula.qualNecessidadeEspecial ?? '',
      temRestricao: !!matricula.possuiRestricaoAlimentar,
      descRestricao: matricula.qualRestricaoAlimentar ?? '',
      temBeneficio: !!matricula.possuiBeneficioGoverno,
      descBeneficio: matricula.qualBeneficioGoverno ?? '',
      observacoes: matricula.observacoesGerais ?? '',
      fotoUrl: matricula.alunoFotoUrl ?? '',
    })

    setEditAlunoId(matricula.alunoId)
    setEditUserId(matricula.userId)

    // Carrega TODAS as matrículas deste aluno (para atender “fundamental + médio”)
    const matriculasDoAluno = matriculas.filter((m) => m.alunoId === matricula.alunoId)

    const blocos: MatriculaFormState[] = matriculasDoAluno.map((m) => ({
      formId: gerarIdLocal(),
      idMatricula: m.id,
      nivelId: m.nivelId,
      numeroInscricao: m.numeroInscricao ?? '',
      anoLetivo: m.anoLetivo != null ? String(m.anoLetivo) : new Date().getFullYear().toString(),
      statusId: m.statusId ?? '',
      turmaId: m.turmaId ?? '',
      modalidade: m.modalidade ?? 'Orientação de Estudos',
      dataMatricula: m.dataMatricula ?? hojeISO(),
      dataConclusao: m.dataConclusao ?? '',
      seriesConcluidasIds: [],
      serieProgressaoId: '',
      disciplinasProgressaoIds: [],
      regenerarProgresso: false,
    }))

    setEditBlocosMatricula(blocos.length > 0 ? blocos : [criarBlocoMatriculaPadrao()])
    setEditarAberto(true)
  }

  const handleFecharEditarMatricula = () => {
    if (salvandoEdicao) return
    setEditarAberto(false)
    setEditAlunoId(null)
    setEditUserId(null)
    setEditBlocosMatricula([])
  }

  const adicionarBlocoEdit = () => {
    setEditBlocosMatricula((prev) => [...prev, criarBlocoMatriculaPadrao()])
  }

  const adicionarTodosNiveisEdit = () => {
    if (niveisDisponiveis.length === 0) return

    setEditBlocosMatricula((prev) => {
      const jaTem = new Set(prev.map((b) => b.nivelId).filter((v): v is number => v !== ''))
      const novos: MatriculaFormState[] = []
      niveisDisponiveis.forEach((n) => {
        if (!jaTem.has(n.id_nivel_ensino)) {
          novos.push({
            ...criarBlocoMatriculaPadrao(),
            nivelId: n.id_nivel_ensino,
            regenerarProgresso: true,
          })
        }
      })
      return [...prev, ...novos]
    })
  }

  // ===== SALVAR EDIÇÃO =====

  const handleSalvarEdicaoMatricula = async () => {
    if (!supabase) return
    if (!editAlunoId || !editUserId) {
      erro('Não foi possível identificar o aluno (id_aluno / user_id).')
      return
    }

    const nome = editAluno.nome.trim()
    if (!nome) {
      erro('Informe pelo menos o nome completo do aluno.')
      return
    }

    const valid = validarBlocosMatricula(editBlocosMatricula, { modo: 'editar' })
    if (!valid.ok) {
      erro(valid.msg || 'Verifique os dados das matrículas.')
      return
    }

    try {
      setSalvandoEdicao(true)

      // 1) Atualiza public.usuarios (OBS: isso NÃO altera o email/senha no Auth)
      // Observação de tipagem: em UsuarioRow, "email" é string (não-null). Em edição,
      // se o campo de e-mail estiver vazio, NÃO atualizamos a coluna (mantém o valor atual).
      const emailTrim = editAluno.email.trim().toLowerCase()

      const usuarioUpdate: Partial<UsuarioRow> = {
        name: nome,
        ...(emailTrim ? { email: emailTrim } : {}),
        data_nascimento: editAluno.dataNasc || null,
        cpf: editAluno.cpf.trim() || null,
        celular: editAluno.celular.trim() || null,
        logradouro: editAluno.logradouro.trim() || null,
        numero_endereco: editAluno.numeroEnd.trim() || null,
        bairro: editAluno.bairro.trim() || null,
        municipio: editAluno.municipio.trim() || null,
        ponto_referencia: editAluno.pontoRef.trim() || null,
        foto_url: editAluno.fotoUrl || null,
      }

      const { error: usuarioError } = await supabase.from('usuarios').update(usuarioUpdate).eq('id', editUserId)

      if (usuarioError) {
        console.error(usuarioError)
        erro('Erro ao atualizar dados do usuário (aluno).')
        return
      }

      // 2) Atualiza public.alunos
      const alunoUpdate: Partial<AlunoRow> = {
        nis: editAluno.nis.trim() || null,
        nome_mae: editAluno.nomeMae.trim() || 'Não informado',
        nome_pai: editAluno.nomePai.trim() || null,
        usa_transporte_escolar: editAluno.usaTransporte,
        possui_necessidade_especial: editAluno.temNecessidade,
        qual_necessidade_especial: editAluno.temNecessidade ? editAluno.descNecessidade.trim() || null : null,
        possui_restricao_alimentar: editAluno.temRestricao,
        qual_restricao_alimentar: editAluno.temRestricao ? editAluno.descRestricao.trim() || null : null,
        possui_beneficio_governo: editAluno.temBeneficio,
        qual_beneficio_governo: editAluno.temBeneficio ? editAluno.descBeneficio.trim() || null : null,
        observacoes_gerais: editAluno.observacoes.trim() || null,
      }

      const { error: alunoError } = await supabase.from('alunos').update(alunoUpdate).eq('id_aluno', editAlunoId)

      if (alunoError) {
        console.error(alunoError)
        erro('Erro ao atualizar dados específicos do aluno.')
        return
      }

      // 3) Atualiza/insere matriculas
      const insertsProgressoTotal: Array<Record<string, unknown>> = []

      for (const bloco of editBlocosMatricula) {
        const payload = {
          numero_inscricao: bloco.numeroInscricao.trim(),
          id_nivel_ensino: Number(bloco.nivelId),
          id_status_matricula: Number(bloco.statusId),
          modalidade: bloco.modalidade,
          ano_letivo: Number(bloco.anoLetivo),
          data_matricula: bloco.dataMatricula,
          data_conclusao: bloco.dataConclusao.trim() ? bloco.dataConclusao : null,
          id_turma: bloco.turmaId === '' ? null : Number(bloco.turmaId),
        }

        let idMatricula = bloco.idMatricula

        if (idMatricula) {
          const { error: upErr } = await supabase.from('matriculas').update(payload).eq('id_matricula', idMatricula)
          if (upErr) {
            console.error(upErr)
            erro('Erro ao atualizar matrícula.')
            return
          }
        } else {
          const { data: ins, error: insErr } = await supabase
            .from('matriculas')
            .insert({ ...payload, id_aluno: editAlunoId })
            .select('id_matricula')
            .single<{ id_matricula: number }>()

          if (insErr || !ins) {
            console.error(insErr)
            erro('Erro ao inserir nova matrícula.')
            return
          }
          idMatricula = ins.id_matricula
        }

        const isPrecisaProgresso =
          bloco.modalidade === 'Aproveitamento de Estudos' || bloco.modalidade === 'Progressão de Estudos'

        if (isPrecisaProgresso && idMatricula) {
          // Só gera/insere progresso em 2 cenários:
          // (1) matrícula nova (não existia idMatricula antes), ou
          // (2) usuário marcou “Regerar progresso”.
          if (!bloco.idMatricula || bloco.regenerarProgresso) {
            const { error: delProgErr } = await supabase
              .from('progresso_aluno')
              .delete()
              .eq('id_matricula', idMatricula)
            if (delProgErr) {
              console.error(delProgErr)
              aviso('Não foi possível limpar o progresso anterior (progresso_aluno).')
            }

            const inserts = gerarInsertsProgresso({
              idMatricula,
              nivelId: Number(bloco.nivelId),
              modalidade: bloco.modalidade,
              seriesConcluidasIds: bloco.seriesConcluidasIds,
              serieProgressaoId: bloco.serieProgressaoId,
              disciplinasProgressaoIds: bloco.disciplinasProgressaoIds,
              anosEscolaresDisponiveis,
              statusDisciplinaDisponiveis,
              configDisciplinaAnoDisponiveis,
            })
            insertsProgressoTotal.push(...inserts)
          }
        }
      }

      if (insertsProgressoTotal.length > 0) {
        const { error: progError } = await supabase.from('progresso_aluno').insert(insertsProgressoTotal)
        if (progError) {
          console.error(progError)
          aviso('Alterações salvas, mas houve erro ao registrar o progresso das disciplinas.')
        }
      }

      await carregarDados()
      sucesso('Aluno e matrícula(s) atualizados com sucesso.')
      setEditarAberto(false)
    } catch (e) {
      console.error(e)
      erro('Erro inesperado ao atualizar matrícula.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  // ===== EXCLUSÃO =====

  const abrirDialogExcluirMatricula = (matricula: MatriculaLista) => {
    setMatriculaParaExcluir(matricula)
    setDialogExcluirAberto(true)
  }

  const fecharDialogExcluirMatricula = () => {
    if (excluindoMatricula) return
    setDialogExcluirAberto(false)
    setMatriculaParaExcluir(null)
  }

  const handleConfirmarExcluirMatricula = async () => {
    if (!supabase || !matriculaParaExcluir) return

    try {
      setExcluindoMatricula(true)

      const { error } = await supabase.from('matriculas').delete().eq('id_matricula', matriculaParaExcluir.id)

      if (error) {
        console.error(error)
        if ((error as any).code === '23503') {
          erro(
            'Não é possível excluir esta matrícula porque existem registros vinculados (progresso, atendimentos ou protocolos).',
          )
        } else {
          erro('Erro ao excluir matrícula.')
        }
        return
      }

      await carregarDados()

      setMatriculaSelecionada((atual) => (atual && atual.id === matriculaParaExcluir.id ? null : atual))

      sucesso('Matrícula excluída com sucesso.')
      setDialogExcluirAberto(false)
      setMatriculaParaExcluir(null)
    } catch (e) {
      console.error(e)
      erro('Erro inesperado ao excluir matrícula.')
    } finally {
      setExcluindoMatricula(false)
    }
  }

  // ===== FILTRO / BUSCA =====

  const matriculasFiltradas = useMemo(() => {
    let lista = [...matriculas]

    const termo = busca.trim().toLowerCase()
    if (termo) {
      lista = lista.filter((m) => {
        return (
          m.alunoNome.toLowerCase().includes(termo) ||
          (m.numeroInscricao ?? '').toLowerCase().includes(termo) ||
          m.nivelNome.toLowerCase().includes(termo) ||
          (m.turmaNome ?? '').toLowerCase().includes(termo) ||
          (m.statusNome ?? '').toLowerCase().includes(termo) ||
          (m.modalidade ?? '').toLowerCase().includes(termo) ||
          (m.alunoNis ?? '').toLowerCase().includes(termo)
        )
      })
    }

    if (filtroAno !== 'todos') {
      const ano = Number(filtroAno)
      lista = lista.filter((m) => m.anoLetivo === ano)
    }
    if (filtroNivel !== 'todos') {
      const nivelId = Number(filtroNivel)
      lista = lista.filter((m) => m.nivelId === nivelId)
    }
    if (filtroStatus !== 'todos') {
      lista = lista.filter((m) => m.statusNome === filtroStatus)
    }

    return lista
  }, [matriculas, busca, filtroAno, filtroNivel, filtroStatus])

  useEffect(() => {
    setPage(0)
  }, [busca, filtroAno, filtroNivel, filtroStatus])

  const matriculasPaginadas = useMemo(
    () =>
      matriculasFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [matriculasFiltradas, page, rowsPerPage],
  )

  // ===== ESTILO DO CABEÇALHO (VERDE) =====

  // Cores do Cabeçalho Verde (igual às outras tabelas)
  const headerBgColor = theme.palette.mode === 'light' ? green[100] : alpha(green[900], 0.4)
  const headerTextColor =
    theme.palette.mode === 'light' ? theme.palette.success.dark : theme.palette.success.light

  const zebraColor = theme.palette.mode === 'light' ? alpha(theme.palette.grey[400], 0.12) : alpha(theme.palette.common.white, 0.04)

  const getStatusColor = (status: string | null) => {
    if (!status) return theme.palette.text.secondary
    const normalized = status.toLowerCase()
    if (normalized.includes('ativo')) return theme.palette.success.main
    if (normalized.includes('conclu')) return theme.palette.info.main
    if (normalized.includes('tranc')) return theme.palette.warning.main
    if (normalized.includes('evad')) return theme.palette.error.main
    if (normalized.includes('transfer')) return theme.palette.secondary.main
    return theme.palette.text.secondary
  }

  // === RENDER ===

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: '100vw',
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        boxSizing: 'border-box',
      }}
    >
      {/* Cabeçalho */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Matrículas
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Cadastre novos alunos, defina a modalidade (orientação, aproveitamento ou progressão) e acompanhe as matrículas do CEJA.
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />} sx={{ fontWeight: 600 }} onClick={handleAbrirNovaMatricula}>
          Nova matrícula
        </Button>
      </Stack>

      {/* Filtros e busca */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por aluno, matrícula, NIS, turma, nível, modalidade ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ minWidth: { md: 420 } }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="filtro-ano-label">Ano letivo</InputLabel>
              <Select labelId="filtro-ano-label" label="Ano letivo" value={filtroAno} onChange={(e) => setFiltroAno(e.target.value)}>
                <MenuItem value="todos">Todos</MenuItem>
                {anosDisponiveis.map((ano) => (
                  <MenuItem key={ano} value={String(ano)}>
                    {ano}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="filtro-nivel-label">Nível de ensino</InputLabel>
              <Select
                labelId="filtro-nivel-label"
                label="Nível de ensino"
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                {niveisDisponiveis.map((nivel) => (
                  <MenuItem key={nivel.id_nivel_ensino} value={String(nivel.id_nivel_ensino)}>
                    {nivel.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="filtro-status-label">Status</InputLabel>
              <Select labelId="filtro-status-label" label="Status" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                <MenuItem value="todos">Todos</MenuItem>
                {statusDisponiveis.map((s) => (
                  <MenuItem key={s.id_status_matricula} value={s.nome}>
                    {s.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Paper>

      {/* Lista de matrículas */}
      <TableContainer
        component={Paper}
        elevation={0}
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {carregando ? (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : matriculasFiltradas.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nenhuma matrícula encontrada com os filtros atuais.
            </Typography>
          </Box>
        ) : isMobile ? (
          // MOBILE: CARDS
          <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
              {matriculasFiltradas.map((m) => {
                const statusColor = getStatusColor(m.statusNome ?? null)
                return (
                  <Paper key={m.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={m.alunoFotoUrl ?? undefined}
                          sx={{
                            bgcolor: m.alunoFotoUrl ? undefined : alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                          }}
                        >
                          {!m.alunoFotoUrl && m.alunoNome.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                            {m.alunoNome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Matrícula: {m.numeroInscricao ?? '—'}
                          </Typography>
                          {m.alunoNis && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              NIS: {m.alunoNis}
                            </Typography>
                          )}
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip icon={<SchoolIcon fontSize="small" />} label={m.nivelNome} size="small" variant="outlined" />
                        {m.turmaNome && <Chip label={`Turma: ${m.turmaNome}`} size="small" variant="outlined" />}
                        {m.turno && <Chip label={`Turno: ${m.turno}`} size="small" variant="outlined" />}
                        {m.anoLetivo && <Chip icon={<EventIcon fontSize="small" />} label={`Ano: ${m.anoLetivo}`} size="small" variant="outlined" />}
                        {m.modalidade && (
                          <Chip
                            label={m.modalidade}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.06),
                              color: theme.palette.info.main,
                              fontWeight: 600,
                            }}
                          />
                        )}
                        {m.statusNome && (
                          <Chip
                            label={m.statusNome}
                            size="small"
                            sx={{
                              bgcolor: alpha(statusColor, 0.08),
                              color: statusColor,
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Stack>

                      <Stack spacing={0.25}>
                        {m.dataMatricula && (
                          <Typography variant="caption" color="text.secondary">
                            Início: {m.dataMatricula}
                          </Typography>
                        )}
                        {m.dataConclusao && (
                          <Typography variant="caption" color="text.secondary">
                            Conclusão: {m.dataConclusao}
                          </Typography>
                        )}
                      </Stack>

                      <Box sx={{ pt: 1, textAlign: 'right' }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="text" onClick={() => setMatriculaSelecionada(m)} disabled={salvandoEdicao || excluindoMatricula}>
                            Ver ficha
                          </Button>
                          <Button size="small" variant="text" onClick={() => abrirDialogEditarMatricula(m)} disabled={salvandoEdicao || excluindoMatricula}>
                            Editar
                          </Button>
                          <Button size="small" color="error" variant="text" onClick={() => abrirDialogExcluirMatricula(m)} disabled={excluindoMatricula}>
                            Excluir
                          </Button>
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                )
              })}
            </Stack>
          </Box>
        ) : (
          // DESKTOP: TABELA
          <>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: headerBgColor }}>
                  <TableCell sx={{ fontWeight: 700, color: headerTextColor }}>Aluno</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: headerTextColor }}>Matrícula / NIS</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: headerTextColor }}>Nível / Modalidade</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: headerTextColor }}>Turma / Turno</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: headerTextColor }}>Ano letivo</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: headerTextColor }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: headerTextColor }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matriculasPaginadas.map((m, index) => {
                  const isEven = index % 2 === 0
                  const statusColor = getStatusColor(m.statusNome ?? null)

                  return (
                    <TableRow
                      key={m.id}
                      hover
                      sx={{
                        bgcolor: isEven ? 'inherit' : zebraColor,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                        },
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            src={m.alunoFotoUrl ?? undefined}
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: m.alunoFotoUrl ? undefined : alpha(theme.palette.primary.main, 0.12),
                              color: theme.palette.primary.main,
                            }}
                          >
                            {!m.alunoFotoUrl && m.alunoNome.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {m.alunoNome}
                            </Typography>
                            {m.alunoEmail && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {m.alunoEmail}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{m.numeroInscricao ?? '—'}</Typography>
                        {m.alunoNis && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            NIS: {m.alunoNis}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{m.nivelNome}</Typography>
                        {m.modalidade && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {m.modalidade}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{m.turmaNome ?? '—'}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {m.turno ?? ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{m.anoLetivo ?? '—'}</Typography>
                        {m.dataMatricula && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Início: {m.dataMatricula}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.statusNome && (
                          <Chip
                            label={m.statusNome}
                            size="small"
                            sx={{
                              bgcolor: alpha(statusColor, 0.08),
                              color: statusColor,
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Ver ficha completa do aluno e da matrícula">
                            <span>
                              <Button size="small" variant="text" onClick={() => setMatriculaSelecionada(m)} disabled={salvandoEdicao || excluindoMatricula}>
                                Detalhes
                              </Button>
                            </span>
                          </Tooltip>
                          <Tooltip title="Editar aluno + matrículas (todos os níveis deste aluno)">
                            <span>
                              <IconButton size="small" onClick={() => abrirDialogEditarMatricula(m)} disabled={salvandoEdicao || excluindoMatricula}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Excluir matrícula">
                            <span>
                              <IconButton size="small" color="error" onClick={() => abrirDialogExcluirMatricula(m)} disabled={excluindoMatricula}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={matriculasFiltradas.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Linhas por página"
            />
          </>
        )}
      </TableContainer>

      {/* Dialog de nova matrícula */}
      <Dialog open={novaAberta} onClose={handleFecharNovaMatricula} fullWidth maxWidth="md">
        <DialogTitle>Nova matrícula</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Seção: Dados do aluno */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Dados do aluno
              </Typography>

              {/* Avatar + upload */}
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar
                  src={novoAluno.fotoUrl || undefined}
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: novoAluno.fotoUrl ? undefined : alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    fontSize: 28,
                  }}
                >
                  {!novoAluno.fotoUrl && (novoAluno.nome ? novoAluno.nome[0].toUpperCase() : '?')}
                </Avatar>
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PhotoCameraIcon />}
                    disabled={uploadingFotoNovoAluno || salvandoNova}
                    onClick={() => fileInputFotoNovoRef.current?.click()}
                    sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                  >
                    {uploadingFotoNovoAluno ? 'Enviando...' : 'Enviar foto'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" display="block">
                    A foto será salva no perfil do aluno (tabela usuários).
                  </Typography>
                  <input
                    ref={fileInputFotoNovoRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void uploadFotoAluno(file, 'novo')
                    }}
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nome completo do aluno"
                  value={novoAluno.nome}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, nome: e.target.value }))}
                  disabled={salvandoNova}
                  helperText="Obrigatório para criar o usuário do aluno."
                />
                <TextField
                  fullWidth
                  size="small"
                  label="E-mail do aluno (opcional)"
                  type="email"
                  value={novoAluno.email}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, email: e.target.value }))}
                  disabled={salvandoNova}
                  helperText="Se vazio, será gerado automaticamente (ex.: joao_silva@ceja.com)."
                />
                <TextField
                  fullWidth
                  size="small"
                  label="CPF (opcional)"
                  value={novoAluno.cpf}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, cpf: e.target.value }))}
                  disabled={salvandoNova}
                  helperText="Se informado, será usado como senha inicial."
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Data de nascimento"
                  type="date"
                  value={novoAluno.dataNasc}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, dataNasc: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  disabled={salvandoNova}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Celular"
                  value={novoAluno.celular}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, celular: e.target.value }))}
                  disabled={salvandoNova}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="NIS (opcional)"
                  value={novoAluno.nis}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, nis: e.target.value }))}
                  disabled={salvandoNova}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nome da mãe (opcional)"
                  value={novoAluno.nomeMae}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, nomeMae: e.target.value }))}
                  disabled={salvandoNova}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Nome do pai (opcional)"
                  value={novoAluno.nomePai}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, nomePai: e.target.value }))}
                  disabled={salvandoNova}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Logradouro"
                  value={novoAluno.logradouro}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, logradouro: e.target.value }))}
                  disabled={salvandoNova}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Número"
                  value={novoAluno.numeroEnd}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, numeroEnd: e.target.value }))}
                  disabled={salvandoNova}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bairro"
                  value={novoAluno.bairro}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, bairro: e.target.value }))}
                  disabled={salvandoNova}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Município"
                  value={novoAluno.municipio}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, municipio: e.target.value }))}
                  disabled={salvandoNova}
                />
              </Stack>

              <TextField
                fullWidth
                size="small"
                label="Ponto de referência (opcional)"
                value={novoAluno.pontoRef}
                onChange={(e) => setNovoAluno((p) => ({ ...p, pontoRef: e.target.value }))}
                disabled={salvandoNova}
                sx={{ mb: 1.5 }}
              />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={novoAluno.usaTransporte}
                      onChange={(e) => setNovoAluno((p) => ({ ...p, usaTransporte: e.target.checked }))}
                      disabled={salvandoNova}
                      size="small"
                    />
                  }
                  label="Usa transporte escolar"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={novoAluno.temNecessidade}
                      onChange={(e) => setNovoAluno((p) => ({ ...p, temNecessidade: e.target.checked }))}
                      disabled={salvandoNova}
                      size="small"
                    />
                  }
                  label="Possui necessidade especial"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={novoAluno.temRestricao}
                      onChange={(e) => setNovoAluno((p) => ({ ...p, temRestricao: e.target.checked }))}
                      disabled={salvandoNova}
                      size="small"
                    />
                  }
                  label="Restrição alimentar"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={novoAluno.temBeneficio}
                      onChange={(e) => setNovoAluno((p) => ({ ...p, temBeneficio: e.target.checked }))}
                      disabled={salvandoNova}
                      size="small"
                    />
                  }
                  label="Benefício de governo"
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Descrição da necessidade especial"
                  value={novoAluno.descNecessidade}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, descNecessidade: e.target.value }))}
                  disabled={salvandoNova || !novoAluno.temNecessidade}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Descrição da restrição alimentar"
                  value={novoAluno.descRestricao}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, descRestricao: e.target.value }))}
                  disabled={salvandoNova || !novoAluno.temRestricao}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Benefício de governo (detalhes)"
                  value={novoAluno.descBeneficio}
                  onChange={(e) => setNovoAluno((p) => ({ ...p, descBeneficio: e.target.value }))}
                  disabled={salvandoNova || !novoAluno.temBeneficio}
                />
              </Stack>

              <TextField
                fullWidth
                size="small"
                label="Observações gerais do aluno"
                value={novoAluno.observacoes}
                onChange={(e) => setNovoAluno((p) => ({ ...p, observacoes: e.target.value }))}
                disabled={salvandoNova}
                multiline
                minRows={2}
              />
            </Box>

            <Divider />

            {/* Seção: Matrículas (múltiplos níveis) */}
            <Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Matrículas (por nível)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Um aluno pode ter mais de uma matrícula (ex.: concluiu Fundamental e iniciou Médio). Cada matrícula tem número de inscrição e turma próprios.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" size="small" onClick={adicionarBlocoNovo} disabled={salvandoNova}>
                    Adicionar matrícula
                  </Button>
                  <Button variant="outlined" size="small" onClick={adicionarTodosNiveisNovo} disabled={salvandoNova || niveisDisponiveis.length === 0}>
                    Adicionar todos os níveis
                  </Button>
                </Stack>
              </Stack>

              <Stack spacing={2} sx={{ mt: 2 }}>
                {novoBlocosMatricula.map((bloco) => (
                  <MatriculaNivelCard
                    key={bloco.formId}
                    modo="novo"
                    form={bloco}
                    setForm={(patch) =>
                      setNovoBlocosMatricula((prev) =>
                        prev.map((b) => (b.formId === bloco.formId ? { ...b, ...patch } : b)),
                      )
                    }
                    removerBloco={
                      novoBlocosMatricula.length > 1
                        ? () => setNovoBlocosMatricula((prev) => prev.filter((b) => b.formId !== bloco.formId))
                        : undefined
                    }
                    desabilitado={salvandoNova}
                    niveisDisponiveis={niveisDisponiveis}
                    statusDisponiveis={statusDisponiveis}
                    turmasDisponiveis={turmasDisponiveis}
                    disciplinasDisponiveis={disciplinasDisponiveis}
                    anosEscolaresDisponiveis={anosEscolaresDisponiveis}
                    configDisciplinaAnoDisponiveis={configDisciplinaAnoDisponiveis}
                    themeMode={theme.palette.mode}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleFecharNovaMatricula} disabled={salvandoNova}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSalvarNovaMatricula} disabled={salvandoNova}>
            {salvandoNova ? 'Salvando...' : 'Salvar matrícula(s)'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Editar matrícula (mesmo layout do cadastro) */}
      <Dialog open={editarAberto} onClose={handleFecharEditarMatricula} fullWidth maxWidth="md">
        <DialogTitle>Editar aluno e matrículas</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Seção: Dados do aluno (edição) */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Dados do aluno
              </Typography>

              {/* Avatar + upload */}
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar
                  src={editAluno.fotoUrl || undefined}
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: editAluno.fotoUrl ? undefined : alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    fontSize: 28,
                  }}
                >
                  {!editAluno.fotoUrl && (editAluno.nome ? editAluno.nome[0].toUpperCase() : '?')}
                </Avatar>
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PhotoCameraIcon />}
                    disabled={uploadingFotoEditAluno || salvandoEdicao || excluindoMatricula}
                    onClick={() => fileInputFotoEditRef.current?.click()}
                    sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                  >
                    {uploadingFotoEditAluno ? 'Enviando...' : 'Enviar foto'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Atualiza o campo usuarios.foto_url (não altera Auth).
                  </Typography>
                  <input
                    ref={fileInputFotoEditRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void uploadFotoAluno(file, 'edit')
                    }}
                  />
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nome completo do aluno"
                  value={editAluno.nome}
                  onChange={(e) => setEditAluno((p) => ({ ...p, nome: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="E-mail (tabela usuários)"
                  type="email"
                  value={editAluno.email}
                  onChange={(e) => setEditAluno((p) => ({ ...p, email: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                  helperText="Obs.: alterar aqui não altera o e-mail de login no Auth."
                />
                <TextField
                  fullWidth
                  size="small"
                  label="CPF (tabela usuários)"
                  value={editAluno.cpf}
                  onChange={(e) => setEditAluno((p) => ({ ...p, cpf: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Data de nascimento"
                  type="date"
                  value={editAluno.dataNasc}
                  onChange={(e) => setEditAluno((p) => ({ ...p, dataNasc: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Celular"
                  value={editAluno.celular}
                  onChange={(e) => setEditAluno((p) => ({ ...p, celular: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="NIS (tabela alunos)"
                  value={editAluno.nis}
                  onChange={(e) => setEditAluno((p) => ({ ...p, nis: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nome da mãe (tabela alunos)"
                  value={editAluno.nomeMae}
                  onChange={(e) => setEditAluno((p) => ({ ...p, nomeMae: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Nome do pai (tabela alunos)"
                  value={editAluno.nomePai}
                  onChange={(e) => setEditAluno((p) => ({ ...p, nomePai: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Logradouro"
                  value={editAluno.logradouro}
                  onChange={(e) => setEditAluno((p) => ({ ...p, logradouro: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Número"
                  value={editAluno.numeroEnd}
                  onChange={(e) => setEditAluno((p) => ({ ...p, numeroEnd: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bairro"
                  value={editAluno.bairro}
                  onChange={(e) => setEditAluno((p) => ({ ...p, bairro: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Município"
                  value={editAluno.municipio}
                  onChange={(e) => setEditAluno((p) => ({ ...p, municipio: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula}
                />
              </Stack>

              <TextField
                fullWidth
                size="small"
                label="Ponto de referência (opcional)"
                value={editAluno.pontoRef}
                onChange={(e) => setEditAluno((p) => ({ ...p, pontoRef: e.target.value }))}
                disabled={salvandoEdicao || excluindoMatricula}
                sx={{ mb: 1.5 }}
              />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editAluno.usaTransporte}
                      onChange={(e) => setEditAluno((p) => ({ ...p, usaTransporte: e.target.checked }))}
                      disabled={salvandoEdicao || excluindoMatricula}
                      size="small"
                    />
                  }
                  label="Usa transporte escolar"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editAluno.temNecessidade}
                      onChange={(e) => setEditAluno((p) => ({ ...p, temNecessidade: e.target.checked }))}
                      disabled={salvandoEdicao || excluindoMatricula}
                      size="small"
                    />
                  }
                  label="Possui necessidade especial"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editAluno.temRestricao}
                      onChange={(e) => setEditAluno((p) => ({ ...p, temRestricao: e.target.checked }))}
                      disabled={salvandoEdicao || excluindoMatricula}
                      size="small"
                    />
                  }
                  label="Restrição alimentar"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editAluno.temBeneficio}
                      onChange={(e) => setEditAluno((p) => ({ ...p, temBeneficio: e.target.checked }))}
                      disabled={salvandoEdicao || excluindoMatricula}
                      size="small"
                    />
                  }
                  label="Benefício de governo"
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Descrição da necessidade especial"
                  value={editAluno.descNecessidade}
                  onChange={(e) => setEditAluno((p) => ({ ...p, descNecessidade: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula || !editAluno.temNecessidade}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Descrição da restrição alimentar"
                  value={editAluno.descRestricao}
                  onChange={(e) => setEditAluno((p) => ({ ...p, descRestricao: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula || !editAluno.temRestricao}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Benefício de governo (detalhes)"
                  value={editAluno.descBeneficio}
                  onChange={(e) => setEditAluno((p) => ({ ...p, descBeneficio: e.target.value }))}
                  disabled={salvandoEdicao || excluindoMatricula || !editAluno.temBeneficio}
                />
              </Stack>

              <TextField
                fullWidth
                size="small"
                label="Observações gerais do aluno"
                value={editAluno.observacoes}
                onChange={(e) => setEditAluno((p) => ({ ...p, observacoes: e.target.value }))}
                disabled={salvandoEdicao || excluindoMatricula}
                multiline
                minRows={2}
              />
            </Box>

            <Divider />

            {/* Seção: Matrículas (múltiplos níveis) — edição */}
            <Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Matrículas (por nível)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Edite as matrículas existentes (um bloco por matrícula) e, se necessário, adicione novas matrículas para outros níveis.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" size="small" onClick={adicionarBlocoEdit} disabled={salvandoEdicao || excluindoMatricula}>
                    Adicionar matrícula
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={adicionarTodosNiveisEdit}
                    disabled={salvandoEdicao || excluindoMatricula || niveisDisponiveis.length === 0}
                  >
                    Adicionar todos os níveis
                  </Button>
                </Stack>
              </Stack>

              <Stack spacing={2} sx={{ mt: 2 }}>
                {editBlocosMatricula.map((bloco) => (
                  <MatriculaNivelCard
                    key={bloco.formId}
                    modo="editar"
                    form={bloco}
                    setForm={(patch) =>
                      setEditBlocosMatricula((prev) =>
                        prev.map((b) => (b.formId === bloco.formId ? { ...b, ...patch } : b)),
                      )
                    }
                    removerBloco={
                      !bloco.idMatricula && editBlocosMatricula.length > 1
                        ? () =>
                            setEditBlocosMatricula((prev) =>
                              prev.filter((b) => b.formId !== bloco.formId),
                            )
                        : undefined
                    }
                    desabilitado={salvandoEdicao || excluindoMatricula}
                    niveisDisponiveis={niveisDisponiveis}
                    statusDisponiveis={statusDisponiveis}
                    turmasDisponiveis={turmasDisponiveis}
                    disciplinasDisponiveis={disciplinasDisponiveis}
                    anosEscolaresDisponiveis={anosEscolaresDisponiveis}
                    configDisciplinaAnoDisponiveis={configDisciplinaAnoDisponiveis}
                    themeMode={theme.palette.mode}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleFecharEditarMatricula} disabled={salvandoEdicao || excluindoMatricula}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSalvarEdicaoMatricula} disabled={salvandoEdicao || excluindoMatricula}>
            {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={dialogExcluirAberto} onClose={fecharDialogExcluirMatricula} fullWidth maxWidth="xs">
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Tem certeza de que deseja excluir a matrícula do aluno{' '}
            <strong>{matriculaParaExcluir?.alunoNome ?? 'selecionado'}</strong>?
          </Typography>
          {matriculaParaExcluir?.numeroInscricao && (
            <Typography variant="body2" color="text.secondary">
              Matrícula: {matriculaParaExcluir.numeroInscricao}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={fecharDialogExcluirMatricula} disabled={excluindoMatricula}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmarExcluirMatricula} disabled={excluindoMatricula}>
            {excluindoMatricula ? 'Excluindo...' : 'Excluir matrícula'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de ficha completa (aluno + matrícula) */}
      {matriculaSelecionada && (
        <Dialog open={!!matriculaSelecionada} onClose={() => setMatriculaSelecionada(null)} fullWidth maxWidth="md">
          <DialogTitle>Ficha do aluno e da matrícula</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3}>
              {/* Cabeçalho com foto + nome */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Avatar
                  src={matriculaSelecionada.alunoFotoUrl ?? undefined}
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: matriculaSelecionada.alunoFotoUrl ? undefined : alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    fontSize: 32,
                  }}
                >
                  {!matriculaSelecionada.alunoFotoUrl && matriculaSelecionada.alunoNome.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {matriculaSelecionada.alunoNome}
                  </Typography>
                  {matriculaSelecionada.alunoEmail && (
                    <Typography variant="body2" color="text.secondary">
                      {matriculaSelecionada.alunoEmail}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    {matriculaSelecionada.alunoNis && (
                      <Chip size="small" icon={<AssignmentIndIcon fontSize="small" />} label={`NIS: ${matriculaSelecionada.alunoNis}`} variant="outlined" />
                    )}
                    {matriculaSelecionada.dataNascimento && (
                      <Chip size="small" icon={<EventIcon fontSize="small" />} label={`Nasc.: ${matriculaSelecionada.dataNascimento}`} variant="outlined" />
                    )}
                    {matriculaSelecionada.cpf && <Chip size="small" label={`CPF: ${matriculaSelecionada.cpf}`} variant="outlined" />}
                  </Stack>
                </Box>
              </Stack>

              <Divider />

              {/* Filiação e endereço */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Filiação
                  </Typography>
                  <Typography variant="body2">Mãe: {matriculaSelecionada.alunoNomeMae ?? 'Não informado'}</Typography>
                  <Typography variant="body2">Pai: {matriculaSelecionada.alunoNomePai ?? 'Não informado'}</Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Endereço
                  </Typography>
                  <Typography variant="body2">
                    <HomeIcon fontSize="inherit" style={{ marginRight: 4 }} />
                    {matriculaSelecionada.logradouro ?? 'Não informado'}
                    {matriculaSelecionada.numeroEndereco && `, ${matriculaSelecionada.numeroEndereco}`}
                  </Typography>
                  <Typography variant="body2">
                    {matriculaSelecionada.bairro ?? '—'} - {matriculaSelecionada.municipio ?? '—'}
                  </Typography>
                  {matriculaSelecionada.pontoReferencia && <Typography variant="body2">Ref.: {matriculaSelecionada.pontoReferencia}</Typography>}
                </Box>
              </Stack>

              {/* Situação escolar da matrícula */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Matrícula
                  </Typography>
                  <Typography variant="body2">Nº de inscrição: {matriculaSelecionada.numeroInscricao ?? '—'}</Typography>
                  <Typography variant="body2">Nível de ensino: {matriculaSelecionada.nivelNome}</Typography>
                  <Typography variant="body2">Modalidade: {matriculaSelecionada.modalidade ?? '—'}</Typography>
                  <Typography variant="body2">Ano letivo: {matriculaSelecionada.anoLetivo ?? '—'}</Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Turma e datas
                  </Typography>
                  <Typography variant="body2">Turma: {matriculaSelecionada.turmaNome ?? '—'}</Typography>
                  <Typography variant="body2">Turno: {matriculaSelecionada.turno ?? '—'}</Typography>
                  <Typography variant="body2">Início: {matriculaSelecionada.dataMatricula ?? '—'}</Typography>
                  <Typography variant="body2">Conclusão: {matriculaSelecionada.dataConclusao ?? '—'}</Typography>
                  <Typography variant="body2">Status: {matriculaSelecionada.statusNome ?? '—'}</Typography>
                </Box>
              </Stack>

              {/* Informações complementares */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Informações complementares
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
                  <Chip
                    size="small"
                    icon={<ElderlyIcon fontSize="small" />}
                    label={matriculaSelecionada.usaTransporteEscolar ? 'Usa transporte escolar' : 'Não usa transporte escolar'}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    icon={<AccessibleIcon fontSize="small" />}
                    label={matriculaSelecionada.possuiNecessidadeEspecial ? 'Possui necessidade especial' : 'Sem necessidade especial'}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    icon={<RestaurantIcon fontSize="small" />}
                    label={matriculaSelecionada.possuiRestricaoAlimentar ? 'Restrição alimentar' : 'Sem restrição alimentar'}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    icon={<LocalAtmIcon fontSize="small" />}
                    label={matriculaSelecionada.possuiBeneficioGoverno ? 'Benefício de governo' : 'Sem benefício de governo'}
                    variant="outlined"
                  />
                </Stack>

                {matriculaSelecionada.qualNecessidadeEspecial && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Necessidade especial: {matriculaSelecionada.qualNecessidadeEspecial}
                  </Typography>
                )}
                {matriculaSelecionada.qualRestricaoAlimentar && <Typography variant="body2">Restrição alimentar: {matriculaSelecionada.qualRestricaoAlimentar}</Typography>}
                {matriculaSelecionada.qualBeneficioGoverno && <Typography variant="body2">Benefício de governo: {matriculaSelecionada.qualBeneficioGoverno}</Typography>}
                {matriculaSelecionada.observacoesGerais && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Observações gerais
                    </Typography>
                    <Typography variant="body2">{matriculaSelecionada.observacoesGerais}</Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setMatriculaSelecionada(null)}>Fechar</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}

export default SecretariaMatriculasPage
