// src/paginas/painel-secretaria/SecretariaMatriculasPage.tsx

import {
  type FC,
  type ChangeEvent,
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react'


import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  InputAdornment,
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
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
  Checkbox,
  ListItemText,
  Divider,
  Switch,
  IconButton,
} from '@mui/material'

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
]

// === TIPOS DE TABELA ===

interface MatriculaRow {
  id_matricula: number
  id_aluno: number
  numero_inscricao: string | null
  id_nivel_ensino: number | null
  id_status_matricula: number | null
  modalidade: string | null
  ano_letivo: number | null
  data_matricula: string | null
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

// Lista agregada para exibição
interface MatriculaLista {
  id: number

  alunoId: number
  alunoNome: string
  alunoEmail?: string | null
  alunoFotoUrl?: string | null
  alunoNis?: string | null
  alunoNomeMae?: string | null
  alunoNomePai?: string | null
  usaTransporteEscolar?: boolean
  possuiNecessidadeEspecial?: boolean
  qualNecessidadeEspecial?: string | null
  possuiRestricaoAlimentar?: boolean
  qualRestricaoAlimentar?: string | null
  possuiBeneficioGoverno?: boolean
  qualBeneficioGoverno?: string | null
  observacoesGerais?: string | null

  dataNascimento?: string | null
  cpf?: string | null
  rg?: string | null
  celular?: string | null
  logradouro?: string | null
  numeroEndereco?: string | null
  bairro?: string | null
  municipio?: string | null
  pontoReferencia?: string | null
  raca?: string | null

  numeroInscricao: string | null
  anoLetivo: number | null
  nivelNome: string
  turmaNome?: string | null
  turno?: string | null
  modalidade: string | null
  statusNome: string | null
  dataMatricula: string | null
  dataConclusao?: string | null
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
  const [niveisDisponiveis, setNiveisDisponiveis] =
    useState<NivelEnsinoRow[]>([])
  const [statusDisponiveis, setStatusDisponiveis] =
    useState<StatusMatriculaRow[]>([])
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<TurmaRow[]>([])
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] =
    useState<DisciplinaRow[]>([])
  const [anosEscolaresDisponiveis, setAnosEscolaresDisponiveis] =
    useState<AnoEscolarRow[]>([])
  const [statusDisciplinaDisponiveis, setStatusDisciplinaDisponiveis] =
    useState<StatusDisciplinaRow[]>([])
  const [configDisciplinaAnoDisponiveis, setConfigDisciplinaAnoDisponiveis] =
    useState<ConfigDisciplinaAnoRow[]>([])

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Diálogo Nova Matrícula
  const [novaAberta, setNovaAberta] = useState(false)
  const [salvandoNova, setSalvandoNova] = useState(false)

  // --- Dados do aluno (novo cadastro) ---
  const [formAlunoNome, setFormAlunoNome] = useState('')
  const [formAlunoEmail, setFormAlunoEmail] = useState('')
  const [formAlunoDataNasc, setFormAlunoDataNasc] = useState('')
  const [formAlunoCpf, setFormAlunoCpf] = useState('')
  const [formAlunoCelular, setFormAlunoCelular] = useState('')
  const [formAlunoNis, setFormAlunoNis] = useState('')
  const [formAlunoNomeMae, setFormAlunoNomeMae] = useState('')
  const [formAlunoNomePai, setFormAlunoNomePai] = useState('')
  const [formAlunoLogradouro, setFormAlunoLogradouro] = useState('')
  const [formAlunoNumeroEnd, setFormAlunoNumeroEnd] = useState('')
  const [formAlunoBairro, setFormAlunoBairro] = useState('')
  const [formAlunoMunicipio, setFormAlunoMunicipio] = useState('')
  const [formAlunoPontoRef, setFormAlunoPontoRef] = useState('')
  const [formAlunoUsaTransporte, setFormAlunoUsaTransporte] =
    useState(false)
  const [formAlunoTemNecessidade, setFormAlunoTemNecessidade] =
    useState(false)
  const [formAlunoDescNecessidade, setFormAlunoDescNecessidade] =
    useState('')
  const [formAlunoTemRestricao, setFormAlunoTemRestricao] =
    useState(false)
  const [formAlunoDescRestricao, setFormAlunoDescRestricao] =
    useState('')
  const [formAlunoTemBeneficio, setFormAlunoTemBeneficio] =
    useState(false)
  const [formAlunoDescBeneficio, setFormAlunoDescBeneficio] =
    useState('')
  const [formAlunoObservacoes, setFormAlunoObservacoes] = useState('')
  // Foto do aluno (upload)
  const [formAlunoFotoUrl, setFormAlunoFotoUrl] = useState('')
  const [uploadingFotoAluno, setUploadingFotoAluno] = useState(false)
  const fileInputFotoRef = useRef<HTMLInputElement | null>(null)

  // --- Dados da matrícula ---
  const [novoNumeroInscricao, setNovoNumeroInscricao] = useState('')
  const [novoNivelId, setNovoNivelId] = useState<number | ''>('')
  const [novoStatusId, setNovoStatusId] = useState<number | ''>('')
  const [novoTurmaId, setNovoTurmaId] = useState<number | ''>('')
  const [novoAnoLetivo, setNovoAnoLetivo] = useState<string>(
    new Date().getFullYear().toString(),
  )
  const [novaModalidade, setNovaModalidade] = useState<string>(
    'Orientação de Estudos',
  )
  const [novaDataMatricula, setNovaDataMatricula] = useState<string>(
    new Date().toISOString().slice(0, 10),
  )
  const [novaDataConclusao, setNovaDataConclusao] = useState<string>('')

  // Aproveitamento – séries concluídas
  const [seriesConcluidasIds, setSeriesConcluidasIds] = useState<number[]>([])
  // Progressão – série + disciplinas a cursar
  const [serieProgressaoId, setSerieProgressaoId] = useState<number | ''>('')
  const [disciplinasProgressaoIds, setDisciplinasProgressaoIds] =
    useState<number[]>([])

    // Ficha de matrícula selecionada
  const [matriculaSelecionada, setMatriculaSelecionada] =
    useState<MatriculaLista | null>(null)

  // Edição de matrícula
  const [editarAberto, setEditarAberto] = useState(false)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [editandoMatricula, setEditandoMatricula] =
    useState<MatriculaLista | null>(null)

  const [editNumeroInscricao, setEditNumeroInscricao] = useState('')
  const [editNivelId, setEditNivelId] = useState<string>('')
  const [editStatusId, setEditStatusId] = useState<string>('')
  const [editAnoLetivo, setEditAnoLetivo] = useState<string>('')
  const [editModalidade, setEditModalidade] = useState<string>('')
  const [editDataMatricula, setEditDataMatricula] = useState<string>('')
  const [editDataConclusao, setEditDataConclusao] = useState<string>('')
  const [editTurmaId, setEditTurmaId] = useState<string>('')

  // Exclusão de matrícula
  const [dialogExcluirAberto, setDialogExcluirAberto] = useState(false)
  const [matriculaParaExcluir, setMatriculaParaExcluir] =
    useState<MatriculaLista | null>(null)
  const [excluindoMatricula, setExcluindoMatricula] = useState(false)

  // === Helpers ===

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

  const uploadFotoAluno = async (file: File) => {
    if (!supabase) return

    try {
      setUploadingFotoAluno(true)

      if (file.size > 5 * 1024 * 1024) {
        aviso('Tamanho máximo permitido para a foto é 5MB.')
        return
      }

      const bucket = 'avatars'
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const base = (formAlunoEmail || formAlunoNome || 'aluno')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
      const caminho = `alunos/${base || 'aluno'}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(caminho, file, { upsert: true })

      if (upErr) {
        console.error(upErr)
        erro('Erro ao enviar a foto do aluno. Verifique o Storage.')
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(caminho)

      if (!publicUrlData?.publicUrl) {
        erro('Não foi possível obter a URL pública da foto.')
        return
      }

      setFormAlunoFotoUrl(publicUrlData.publicUrl)
      sucesso('Foto do aluno atualizada.')
    } catch (e) {
      console.error(e)
      erro('Erro inesperado ao enviar a foto do aluno.')
    } finally {
      setUploadingFotoAluno(false)
    }
  }

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
        supabase
          .from('status_matricula')
          .select('id_status_matricula, nome'),
        supabase
          .from('turmas')
          .select('id_turma, nome, turno, ano_letivo, id_nivel_ensino'),
        supabase
          .from('disciplinas')
          .select('id_disciplina, nome_disciplina'),
        supabase
          .from('anos_escolares')
          .select('id_ano_escolar, nome_ano, id_nivel_ensino'),
        supabase
          .from('status_disciplina_aluno')
          .select('id_status_disciplina, nome'),
        supabase
          .from('config_disciplina_ano')
          .select(
            'id_config, id_disciplina, id_ano_escolar, quantidade_protocolos',
          ),
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

      const matriculasList: MatriculaRow[] =
        ((matriculasData ?? []) as unknown as MatriculaRow[])
      const alunosList: AlunoRow[] =
        ((alunosData ?? []) as unknown as AlunoRow[])
      const niveisList = (niveisData || []) as NivelEnsinoRow[]
      const statusList =
        (statusData || []) as StatusMatriculaRow[]
      const turmasList = (turmasData || []) as TurmaRow[]
      const disciplinasList =
        (disciplinasData || []) as DisciplinaRow[]
      const anosEscolaresList =
        (anosEscolaresData || []) as AnoEscolarRow[]
      const statusDiscList =
        (statusDiscData || []) as StatusDisciplinaRow[]
      const configDiscAnoList =
        (configDiscAnoData || []) as ConfigDisciplinaAnoRow[]

      setNiveisDisponiveis(niveisList)
      setStatusDisponiveis(statusList)
      setTurmasDisponiveis(turmasList)
      setDisciplinasDisponiveis(disciplinasList)
      setAnosEscolaresDisponiveis(anosEscolaresList)
      setStatusDisciplinaDisponiveis(statusDiscList)
      setConfigDisciplinaAnoDisponiveis(configDiscAnoList)

      const anos = Array.from(
        new Set(
          matriculasList
            .map((m) => m.ano_letivo)
            .filter((a): a is number => a != null),
        ),
      ).sort((a, b) => b - a)
      setAnosDisponiveis(anos)

      const alunosById = new Map<number, AlunoRow>()
      alunosList.forEach((a) => alunosById.set(a.id_aluno, a))

      const userIds = Array.from(
        new Set(
          alunosList
            .map((a) => a.user_id)
            .filter((id): id is string => !!id),
        ),
      )

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
          const list: UsuarioRow[] =
            usuariosData as unknown as UsuarioRow[]
          usuariosById = new Map<string, UsuarioRow>()
          list.forEach((u) => usuariosById.set(u.id, u))
        }
      }

      const niveisById = new Map<number, NivelEnsinoRow>()
      niveisList.forEach((n) => niveisById.set(n.id_nivel_ensino, n))

      const statusById = new Map<number, StatusMatriculaRow>()
      statusList.forEach((s) =>
        statusById.set(s.id_status_matricula, s),
      )

      const turmasById = new Map<number, TurmaRow>()
      turmasList.forEach((t) => turmasById.set(t.id_turma, t))

      const normalizados: MatriculaLista[] = matriculasList.map((m) => {
        const aluno = alunosById.get(m.id_aluno)
        const usuario =
          aluno && aluno.user_id
            ? usuariosById.get(aluno.user_id)
            : undefined
        const nivel = m.id_nivel_ensino
          ? niveisById.get(m.id_nivel_ensino)
          : undefined
        const status = m.id_status_matricula
          ? statusById.get(m.id_status_matricula)
          : undefined
        const turma = m.id_turma ? turmasById.get(m.id_turma) : undefined

        return {
          id: m.id_matricula,
          alunoId: m.id_aluno,
          alunoNome: usuario?.name ?? 'Aluno sem vínculo de usuário',
          alunoEmail: usuario?.email ?? null,
          alunoFotoUrl: usuario?.foto_url ?? null,
          alunoNis: aluno?.nis ?? null,
          alunoNomeMae: aluno?.nome_mae ?? null,
          alunoNomePai: aluno?.nome_pai ?? null,
          usaTransporteEscolar: aluno?.usa_transporte_escolar ?? false,
          possuiNecessidadeEspecial:
            aluno?.possui_necessidade_especial ?? false,
          qualNecessidadeEspecial:
            aluno?.qual_necessidade_especial ?? null,
          possuiRestricaoAlimentar:
            aluno?.possui_restricao_alimentar ?? false,
          qualRestricaoAlimentar:
            aluno?.qual_restricao_alimentar ?? null,
          possuiBeneficioGoverno:
            aluno?.possui_beneficio_governo ?? false,
          qualBeneficioGoverno:
            aluno?.qual_beneficio_governo ?? null,
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

          numeroInscricao: m.numero_inscricao ?? null,
          anoLetivo: m.ano_letivo ?? null,
          nivelNome: nivel?.nome ?? 'Nível não definido',
          turmaNome: turma?.nome ?? null,
          turno: turma?.turno ?? null,
          modalidade: m.modalidade ?? null,
          statusNome: status?.nome ?? null,
          dataMatricula: m.data_matricula ?? null,
          dataConclusao: m.data_conclusao ?? null,
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

    const abrirDialogEditarMatricula = (matricula: MatriculaLista) => {
    setEditandoMatricula(matricula)

    setEditNumeroInscricao(matricula.numeroInscricao ?? '')
    setEditAnoLetivo(
      matricula.anoLetivo != null
        ? String(matricula.anoLetivo)
        : new Date().getFullYear().toString(),
    )

    const nivelRow = niveisDisponiveis.find(
      (n) => n.nome === matricula.nivelNome,
    )
    setEditNivelId(
      nivelRow ? String(nivelRow.id_nivel_ensino) : '',
    )

    const statusRow = statusDisponiveis.find(
      (s) => s.nome === matricula.statusNome,
    )
    setEditStatusId(
      statusRow ? String(statusRow.id_status_matricula) : '',
    )

    let turmaId = ''
    if (matricula.turmaNome) {
      const turmaRow = turmasDisponiveis.find((t) => {
        const mesmoNome = t.nome === matricula.turmaNome
        const mesmoAno =
          matricula.anoLetivo != null
            ? t.ano_letivo === matricula.anoLetivo
            : true
        const mesmoTurno = matricula.turno
          ? t.turno === matricula.turno
          : true
        return mesmoNome && mesmoAno && mesmoTurno
      })
      if (turmaRow) {
        turmaId = String(turmaRow.id_turma)
      }
    }
    setEditTurmaId(turmaId)

    setEditModalidade(matricula.modalidade ?? '')
    setEditDataMatricula(
      matricula.dataMatricula ??
        new Date().toISOString().slice(0, 10),
    )
    setEditDataConclusao(matricula.dataConclusao ?? '')

    setEditarAberto(true)
  }

  const handleFecharEditarMatricula = () => {
    if (salvandoEdicao) return
    setEditarAberto(false)
    setEditandoMatricula(null)
  }

  const handleSalvarEdicaoMatricula = async () => {
    if (!supabase || !editandoMatricula) return

    const numeroInscricao = editNumeroInscricao.trim() || null
    const nivelId =
      editNivelId.trim() === '' ? null : Number(editNivelId)
    const statusId =
      editStatusId.trim() === '' ? null : Number(editStatusId)
    const turmaId =
      editTurmaId.trim() === '' ? null : Number(editTurmaId)
    const ano =
      editAnoLetivo.trim() === '' ? null : Number(editAnoLetivo)
    const dataMatricula =
      editDataMatricula.trim() === ''
        ? null
        : editDataMatricula
    const dataConclusao =
      editDataConclusao.trim() === ''
        ? null
        : editDataConclusao
    const modalidade = editModalidade.trim() || null

    try {
      setSalvandoEdicao(true)

      const { data, error } = await supabase
        .from('matriculas')
        .update({
          numero_inscricao: numeroInscricao,
          id_nivel_ensino: nivelId,
          id_status_matricula: statusId,
          id_turma: turmaId,
          ano_letivo: ano,
          data_matricula: dataMatricula,
          data_conclusao: dataConclusao,
          modalidade,
        })
        .eq('id_matricula', editandoMatricula.id)
        .select(
          'id_matricula, id_aluno, numero_inscricao, id_nivel_ensino, id_status_matricula, modalidade, ano_letivo, data_matricula, data_conclusao, id_turma',
        )
        .maybeSingle<MatriculaRow>()

      if (error) {
        console.error(error)
        erro('Erro ao atualizar matrícula.')
        return
      }

      if (data) {
        const nivel = data.id_nivel_ensino
          ? niveisDisponiveis.find(
              (n) => n.id_nivel_ensino === data.id_nivel_ensino,
            )
          : undefined

        const status = data.id_status_matricula
          ? statusDisponiveis.find(
              (s) =>
                s.id_status_matricula === data.id_status_matricula,
            )
          : undefined

        const turma = data.id_turma
          ? turmasDisponiveis.find(
              (t) => t.id_turma === data.id_turma,
            )
          : undefined

        setMatriculas((prev) =>
          prev.map((m) =>
            m.id === data.id_matricula
              ? {
                  ...m,
                  numeroInscricao: data.numero_inscricao,
                  anoLetivo: data.ano_letivo,
                  nivelNome: nivel?.nome ?? m.nivelNome,
                  turmaNome: turma?.nome ?? null,
                  turno: turma?.turno ?? null,
                  modalidade: data.modalidade,
                  statusNome: status?.nome ?? m.statusNome,
                  dataMatricula: data.data_matricula,
                  dataConclusao: data.data_conclusao,
                }
              : m,
          ),
        )

        setMatriculaSelecionada((atual) =>
          atual && atual.id === data.id_matricula
            ? {
                ...atual,
                numeroInscricao: data.numero_inscricao,
                anoLetivo: data.ano_letivo,
                nivelNome: nivel?.nome ?? atual.nivelNome,
                turmaNome: turma?.nome ?? null,
                turno: turma?.turno ?? null,
                modalidade: data.modalidade,
                statusNome: status?.nome ?? atual.statusNome,
                dataMatricula: data.data_matricula,
                dataConclusao: data.data_conclusao,
              }
            : atual,
        )
      }

      sucesso('Matrícula atualizada com sucesso.')
      setEditarAberto(false)
      setEditandoMatricula(null)
    } catch (e) {
      console.error(e)
      erro('Erro inesperado ao atualizar matrícula.')
    } finally {
      setSalvandoEdicao(false)
    }
  }

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

      const { error } = await supabase
        .from('matriculas')
        .delete()
        .eq('id_matricula', matriculaParaExcluir.id)

      if (error) {
        console.error(error)
        if (error.code === '23503') {
          erro(
            'Não é possível excluir esta matrícula porque existem registros vinculados (progresso, atendimentos ou protocolos).',
          )
        } else {
          erro('Erro ao excluir matrícula.')
        }
        return
      }

      setMatriculas((prev) =>
        prev.filter((m) => m.id !== matriculaParaExcluir.id),
      )

      setMatriculaSelecionada((atual) =>
        atual && atual.id === matriculaParaExcluir.id ? null : atual,
      )

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


  useEffect(() => {
    void carregarDados()
  }, [supabase])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleAbrirNovaMatricula = () => {
    const hoje = new Date()
    const hojeISO = hoje.toISOString().slice(0, 10)
    const anoAtual = hoje.getFullYear().toString()

    const statusAtivo = statusDisponiveis.find((s) =>
      s.nome.toLowerCase().includes('ativo'),
    )

    // reset aluno
    setFormAlunoNome('')
    setFormAlunoEmail('')
    setFormAlunoDataNasc('')
    setFormAlunoCpf('')
    setFormAlunoCelular('')
    setFormAlunoNis('')
    setFormAlunoNomeMae('')
    setFormAlunoNomePai('')
    setFormAlunoLogradouro('')
    setFormAlunoNumeroEnd('')
    setFormAlunoBairro('')
    setFormAlunoMunicipio('')
    setFormAlunoPontoRef('')
    setFormAlunoUsaTransporte(false)
    setFormAlunoTemNecessidade(false)
    setFormAlunoDescNecessidade('')
    setFormAlunoTemRestricao(false)
    setFormAlunoDescRestricao('')
    setFormAlunoTemBeneficio(false)
    setFormAlunoDescBeneficio('')
    setFormAlunoObservacoes('')
    setFormAlunoFotoUrl('')

    // reset matrícula
    setNovoNumeroInscricao('')
    setNovoNivelId('')
    setNovoStatusId(statusAtivo ? statusAtivo.id_status_matricula : '')
    setNovoTurmaId('')
    setNovoAnoLetivo(anoAtual)
    setNovaModalidade('Orientação de Estudos')
    setNovaDataMatricula(hojeISO)
    setNovaDataConclusao('')
    setSeriesConcluidasIds([])
    setSerieProgressaoId('')
    setDisciplinasProgressaoIds([])

    setNovaAberta(true)
  }

  const handleFecharNovaMatricula = () => {
    if (salvandoNova) return
    setNovaAberta(false)
  }

  const handleSalvarNovaMatricula = async () => {
    if (!supabase) return

    const nome = formAlunoNome.trim()
    const emailDigitado = formAlunoEmail.trim().toLowerCase() || null
    const cpf = formAlunoCpf.trim() || null

    if (!nome) {
      erro('Informe pelo menos o nome completo do aluno.')
      return
    }

    // E-mail automático se não informado
    const emailFinal = emailDigitado ?? gerarEmailAutomatico(nome)

    // Senha padrão = CPF ou fallback
    const senhaFinal =
      cpf && cpf.length >= 3
        ? cpf
        : `Ceja@${new Date().getFullYear()}`

    const nivelId = novoNivelId === '' ? null : Number(novoNivelId)
    const statusId = novoStatusId === '' ? null : Number(novoStatusId)
    const turmaId = novoTurmaId === '' ? null : Number(novoTurmaId)
    const ano =
      novoAnoLetivo.trim() === '' ? null : Number(novoAnoLetivo)

    if (!nivelId || !statusId || !ano || !novaDataMatricula) {
      aviso(
        'Nível de ensino, status, ano letivo e data de matrícula são recomendados para registrar a matrícula corretamente.',
      )
    }

    try {
      setSalvandoNova(true)

      // 1) Cria usuário de autenticação
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: emailFinal,
          password: senhaFinal,
        })

      if (signUpError || !signUpData?.user) {
        console.error(signUpError)
        erro('Erro ao criar usuário de autenticação do aluno.')
        setSalvandoNova(false)
        return
      }

      const authUserId = signUpData.user.id

      // 2) Cria registro em public.usuarios
      const usuarioPayload: Partial<UsuarioRow> & {
        id: string
        id_tipo_usuario: number
        status: string
      } = {
        id: authUserId,
        id_tipo_usuario: TIPO_USUARIO_ALUNO_ID,
        name: nome,
        username: null,
        email: emailFinal,
        data_nascimento: formAlunoDataNasc || null,
        cpf: formAlunoCpf.trim() || null,
        rg: null,
        celular: formAlunoCelular.trim() || null,
        logradouro: formAlunoLogradouro.trim() || null,
        numero_endereco: formAlunoNumeroEnd.trim() || null,
        bairro: formAlunoBairro ?? null,
        municipio: formAlunoMunicipio ?? null,
        ponto_referencia: formAlunoPontoRef ?? null,
        raca: null,
        foto_url: formAlunoFotoUrl || null,
        status: 'Ativo',
      }


      const { error: usuarioError } = await supabase
        .from('usuarios')
        .insert(usuarioPayload)

      if (usuarioError) {
        console.error(usuarioError)
        erro('Erro ao salvar dados básicos do aluno (usuário).')
        setSalvandoNova(false)
        return
      }

      // 3) Cria registro em public.alunos
      const alunoPayload: Partial<AlunoRow> = {
        user_id: authUserId,
        nis: formAlunoNis.trim() || null,
        nome_mae: formAlunoNomeMae.trim() || 'Não informado',
        nome_pai: formAlunoNomePai.trim() || null,
        usa_transporte_escolar: formAlunoUsaTransporte,
        possui_necessidade_especial: formAlunoTemNecessidade,
        qual_necessidade_especial: formAlunoTemNecessidade
          ? formAlunoDescNecessidade.trim() || null
          : null,
        possui_restricao_alimentar: formAlunoTemRestricao,
        qual_restricao_alimentar: formAlunoTemRestricao
          ? formAlunoDescRestricao.trim() || null
          : null,
        possui_beneficio_governo: formAlunoTemBeneficio,
        qual_beneficio_governo: formAlunoTemBeneficio
          ? formAlunoDescBeneficio.trim() || null
          : null,
        observacoes_gerais: formAlunoObservacoes.trim() || null,
      }

      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .insert(alunoPayload)
        .select('id_aluno')
        .single<{ id_aluno: number }>()

      if (alunoError || !alunoData) {
        console.error(alunoError)
        erro('Erro ao salvar dados específicos do aluno.')
        setSalvandoNova(false)
        return
      }

      const novoAlunoId = alunoData.id_aluno

      // 4) Cria matrícula
      const payloadMatricula: Partial<MatriculaRow> = {
        id_aluno: novoAlunoId,
        numero_inscricao: novoNumeroInscricao.trim() || null,
        id_nivel_ensino: nivelId,
        id_status_matricula: statusId,
        modalidade: novaModalidade || null,
        ano_letivo: ano,
        data_matricula: novaDataMatricula || null,
        data_conclusao: novaDataConclusao || null,
        id_turma: turmaId,
      }

      const { data: novaMatriculaData, error: insertError } =
        await supabase
          .from('matriculas')
          .insert(payloadMatricula)
          .select('id_matricula')
          .single<{ id_matricula: number }>()

      if (insertError || !novaMatriculaData) {
        console.error(insertError)
        erro('Erro ao salvar a matrícula do aluno.')
        setSalvandoNova(false)
        return
      }

      const novaMatriculaId = novaMatriculaData.id_matricula

      // 5) Aproveitamento / Progressão → registros em progresso_aluno
      const temNivel = nivelId != null

      const isAproveitamento =
        novaModalidade === 'Aproveitamento de Estudos'
      const isProgressao =
        novaModalidade === 'Progressão de Estudos'

      if (
        temNivel &&
        (isAproveitamento || isProgressao) &&
        statusDisciplinaDisponiveis.length > 0 &&
        anosEscolaresDisponiveis.length > 0 &&
        configDisciplinaAnoDisponiveis.length > 0
      ) {
        const inserts: any[] = []

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
                id_matricula: novaMatriculaId,
                id_disciplina: c.id_disciplina,
                id_ano_escolar: serie.id_ano_escolar,
                id_status_disciplina:
                  statusConcluida.id_status_disciplina,
                nota_final: null,
                data_conclusao: null,
                observacoes:
                  'Disciplina concluída por aproveitamento de estudos.',
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
                id_matricula: novaMatriculaId,
                id_disciplina: c.id_disciplina,
                id_ano_escolar: serie.id_ano_escolar,
                id_status_disciplina:
                  statusACursar.id_status_disciplina,
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
              id_matricula: novaMatriculaId,
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

        if (inserts.length > 0) {
          const { error: progError } = await supabase
            .from('progresso_aluno')
            .insert(inserts)

          if (progError) {
            console.error(progError)
            aviso(
              'Matrícula criada, mas houve erro ao registrar o progresso das disciplinas.',
            )
          }
        }
      }

      await carregarDados()
      sucesso(
        `Matrícula criada com sucesso. Usuário: ${emailFinal} | Senha inicial: ${
          cpf || senhaFinal
        }`,
      )
      setNovaAberta(false)
    } catch (e) {
      console.error(e)
      erro('Erro inesperado ao salvar matrícula.')
    } finally {
      setSalvandoNova(false)
    }
  }

  const matriculasFiltradas = useMemo(() => {
    let lista = [...matriculas]

    const termo = busca.trim().toLowerCase()
    if (termo) {
      lista = lista.filter((m) => {
        return (
          m.alunoNome.toLowerCase().includes(termo) ||
          (m.numeroInscricao ?? '')
            .toLowerCase()
            .includes(termo) ||
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
      const nivelObj = niveisDisponiveis.find(
        (n) => n.id_nivel_ensino === nivelId,
      )
      if (nivelObj) {
        lista = lista.filter((m) => m.nivelNome === nivelObj.nome)
      }
    }
    if (filtroStatus !== 'todos') {
      lista = lista.filter((m) => m.statusNome === filtroStatus)
    }

    return lista
  }, [matriculas, busca, filtroAno, filtroNivel, filtroStatus, niveisDisponiveis])

  useEffect(() => {
    setPage(0)
  }, [busca, filtroAno, filtroNivel, filtroStatus])

  const matriculasPaginadas = useMemo(
    () =>
      matriculasFiltradas.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [matriculasFiltradas, page, rowsPerPage],
  )

  const turmasFiltradas = useMemo(() => {
    let lista = [...turmasDisponiveis]

    if (novoNivelId !== '') {
      const nivelIdNum = Number(novoNivelId)
      lista = lista.filter((t) => t.id_nivel_ensino === nivelIdNum)
    }

    if (novoAnoLetivo.trim() !== '') {
      const ano = Number(novoAnoLetivo)
      if (Number.isFinite(ano)) {
        lista = lista.filter((t) => t.ano_letivo === ano)
      }
    }

    return lista
  }, [turmasDisponiveis, novoNivelId, novoAnoLetivo])

  const seriesDoNivel = useMemo(() => {
    if (novoNivelId === '') return []
    const nivelIdNum = Number(novoNivelId)
    return anosEscolaresDisponiveis
      .filter((a) => a.id_nivel_ensino === nivelIdNum)
      .sort((a, b) => a.nome_ano.localeCompare(b.nome_ano))
  }, [anosEscolaresDisponiveis, novoNivelId])

  const disciplinasDaSerieProgressao = useMemo(() => {
    if (serieProgressaoId === '') return []
    const serieIdNum = Number(serieProgressaoId)
    const configs = configDisciplinaAnoDisponiveis.filter(
      (c) => c.id_ano_escolar === serieIdNum,
    )
    const ids = configs.map((c) => c.id_disciplina)
    return disciplinasDisponiveis.filter((d) => ids.includes(d.id_disciplina))
  }, [serieProgressaoId, configDisciplinaAnoDisponiveis, disciplinasDisponiveis])

  const headerBgColor =
    theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.light, 0.18)
      : alpha(theme.palette.primary.dark, 0.35)

  const headerTextColor =
    theme.palette.mode === 'light'
      ? theme.palette.primary.dark
      : theme.palette.primary.contrastText

  const zebraColor =
    theme.palette.mode === 'light'
      ? alpha(theme.palette.grey[400], 0.12)
      : alpha(theme.palette.common.white, 0.04)

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

  const isAproveitamento =
    novaModalidade === 'Aproveitamento de Estudos'
  const isProgressao =
    novaModalidade === 'Progressão de Estudos'

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
            Cadastre novos alunos, defina a modalidade (orientação, aproveitamento
            ou progressão) e acompanhe as matrículas do CEJA.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ fontWeight: 600 }}
          onClick={handleAbrirNovaMatricula}
        >
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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="stretch"
        >
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

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ minWidth: { md: 420 } }}
          >
            <FormControl size="small" fullWidth>
              <InputLabel id="filtro-ano-label">Ano letivo</InputLabel>
              <Select
                labelId="filtro-ano-label"
                label="Ano letivo"
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                {anosDisponiveis.map((ano) => (
                  <MenuItem key={ano} value={String(ano)}>
                    {ano}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="filtro-nivel-label">
                Nível de ensino
              </InputLabel>
              <Select
                labelId="filtro-nivel-label"
                label="Nível de ensino"
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                {niveisDisponiveis.map((nivel) => (
                  <MenuItem
                    key={nivel.id_nivel_ensino}
                    value={String(nivel.id_nivel_ensino)}
                  >
                    {nivel.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel id="filtro-status-label">Status</InputLabel>
              <Select
                labelId="filtro-status-label"
                label="Status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
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
                  <Paper
                    key={m.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                      >
                        <Avatar
                          src={m.alunoFotoUrl ?? undefined}
                          sx={{
                            bgcolor: m.alunoFotoUrl
                              ? undefined
                              : alpha(
                                  theme.palette.primary.main,
                                  0.1,
                                ),
                            color: theme.palette.primary.main,
                          }}
                        >
                          {!m.alunoFotoUrl &&
                            m.alunoNome.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            sx={{ wordBreak: 'break-word' }}
                          >
                            {m.alunoNome}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Matrícula:{' '}
                            {m.numeroInscricao ?? '—'}
                          </Typography>
                          {m.alunoNis && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              NIS: {m.alunoNis}
                            </Typography>
                          )}
                        </Box>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                      >
                        <Chip
                          icon={<SchoolIcon fontSize="small" />}
                          label={m.nivelNome}
                          size="small"
                          variant="outlined"
                        />
                        {m.turmaNome && (
                          <Chip
                            label={`Turma: ${m.turmaNome}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {m.turno && (
                          <Chip
                            label={`Turno: ${m.turno}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {m.anoLetivo && (
                          <Chip
                            icon={<EventIcon fontSize="small" />}
                            label={`Ano: ${m.anoLetivo}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {m.modalidade && (
                          <Chip
                            label={m.modalidade}
                            size="small"
                            sx={{
                              bgcolor: alpha(
                                theme.palette.info.main,
                                0.06,
                              ),
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
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Início: {m.dataMatricula}
                          </Typography>
                        )}
                        {m.dataConclusao && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Conclusão: {m.dataConclusao}
                          </Typography>
                        )}
                      </Stack>

                      <Box sx={{ pt: 1, textAlign: 'right' }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => setMatriculaSelecionada(m)}
                            disabled={salvandoEdicao || excluindoMatricula}
                          >
                            Ver ficha
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => abrirDialogEditarMatricula(m)}
                            disabled={salvandoEdicao || excluindoMatricula}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            onClick={() => abrirDialogExcluirMatricula(m)}
                            disabled={excluindoMatricula}
                          >
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
                  <TableCell
                    sx={{ fontWeight: 700, color: headerTextColor }}
                  >
                    Aluno
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: headerTextColor }}
                  >
                    Matrícula / NIS
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: headerTextColor }}
                  >
                    Nível / Modalidade
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: headerTextColor }}
                  >
                    Turma / Turno
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: headerTextColor }}
                  >
                    Ano letivo
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: headerTextColor }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, color: headerTextColor }}
                  >
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
                          bgcolor: alpha(
                            theme.palette.primary.main,
                            0.06,
                          ),
                        },
                      }}
                    >
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <Avatar
                            src={m.alunoFotoUrl ?? undefined}
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: m.alunoFotoUrl
                                ? undefined
                                : alpha(
                                    theme.palette.primary.main,
                                    0.12,
                                  ),
                              color: theme.palette.primary.main,
                            }}
                          >
                            {!m.alunoFotoUrl &&
                              m.alunoNome.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                            >
                              {m.alunoNome}
                            </Typography>
                            {m.alunoEmail && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {m.alunoEmail}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {m.numeroInscricao ?? '—'}
                        </Typography>
                        {m.alunoNis && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            NIS: {m.alunoNis}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {m.nivelNome}
                        </Typography>
                        {m.modalidade && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {m.modalidade}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {m.turmaNome ?? '—'}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {m.turno ?? ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {m.anoLetivo ?? '—'}
                        </Typography>
                        {m.dataMatricula && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
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
  <Stack
    direction="row"
    spacing={1}
    justifyContent="flex-end"
  >
    <Tooltip title="Ver ficha completa do aluno e da matrícula">
      <span>
        <Button
          size="small"
          variant="text"
          onClick={() => setMatriculaSelecionada(m)}
          disabled={salvandoEdicao || excluindoMatricula}
        >
          Detalhes
        </Button>
      </span>
    </Tooltip>
    <Tooltip title="Editar matrícula">
      <span>
        <IconButton
          size="small"
          onClick={() => abrirDialogEditarMatricula(m)}
          disabled={salvandoEdicao || excluindoMatricula}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
    <Tooltip title="Excluir matrícula">
      <span>
        <IconButton
          size="small"
          color="error"
          onClick={() => abrirDialogExcluirMatricula(m)}
          disabled={excluindoMatricula}
        >
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
      <Dialog
        open={novaAberta}
        onClose={handleFecharNovaMatricula}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Nova matrícula</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Seção: Dados do aluno */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Dados do aluno
              </Typography>

              {/* Avatar + upload */}
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Avatar
                  src={formAlunoFotoUrl || undefined}
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: formAlunoFotoUrl
                      ? undefined
                      : alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    fontSize: 28,
                  }}
                >
                  {!formAlunoFotoUrl &&
                    (formAlunoNome ? formAlunoNome[0].toUpperCase() : '?')}
                </Avatar>
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PhotoCameraIcon />}
                    disabled={uploadingFotoAluno || salvandoNova}
                    onClick={() => fileInputFotoRef.current?.click()}
                    sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                  >
                    {uploadingFotoAluno ? 'Enviando...' : 'Enviar foto'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" display="block">
                    A foto será salva no perfil do aluno (tabela usuários).
                  </Typography>
                  <input
                    ref={fileInputFotoRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        void uploadFotoAluno(file)
                      }
                    }}
                  />
                </Box>
              </Stack>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Nome completo do aluno"
                  value={formAlunoNome}
                  onChange={(e) => setFormAlunoNome(e.target.value)}
                  disabled={salvandoNova}
                  helperText="Obrigatório para criar o usuário do aluno."
                />
                <TextField
                  fullWidth
                  size="small"
                  label="E-mail do aluno (opcional)"
                  type="email"
                  value={formAlunoEmail}
                  onChange={(e) => setFormAlunoEmail(e.target.value)}
                  disabled={salvandoNova}
                  helperText="Se vazio, será gerado automaticamente (ex.: joao_silva@ceja.com)."
                />
                <TextField
                  fullWidth
                  size="small"
                  label="CPF (opcional)"
                  value={formAlunoCpf}
                  onChange={(e) => setFormAlunoCpf(e.target.value)}
                  disabled={salvandoNova}
                  helperText="Se informado, será usado como senha inicial."
                />
              </Stack>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Data de nascimento"
                  type="date"
                  value={formAlunoDataNasc}
                  onChange={(e) => setFormAlunoDataNasc(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={salvandoNova}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Celular"
                  value={formAlunoCelular}
                  onChange={(e) => setFormAlunoCelular(e.target.value)}
                  disabled={salvandoNova}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="NIS (opcional)"
                  value={formAlunoNis}
                  onChange={(e) => setFormAlunoNis(e.target.value)}
                  disabled={salvandoNova}
                />
              </Stack>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Nome da mãe (opcional)"
                  value={formAlunoNomeMae}
                  onChange={(e) => setFormAlunoNomeMae(e.target.value)}
                  disabled={salvandoNova}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Nome do pai (opcional)"
                  value={formAlunoNomePai}
                  onChange={(e) => setFormAlunoNomePai(e.target.value)}
                  disabled={salvandoNova}
                />
              </Stack>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Logradouro"
                  value={formAlunoLogradouro}
                  onChange={(e) =>
                    setFormAlunoLogradouro(e.target.value)
                  }
                  disabled={salvandoNova}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Número"
                  value={formAlunoNumeroEnd}
                  onChange={(e) => setFormAlunoNumeroEnd(e.target.value)}
                  disabled={salvandoNova}
                />
              </Stack>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Bairro"
                  value={formAlunoBairro}
                  onChange={(e) => setFormAlunoBairro(e.target.value)}
                  disabled={salvandoNova}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Município"
                  value={formAlunoMunicipio}
                  onChange={(e) =>
                    setFormAlunoMunicipio(e.target.value)
                  }
                  disabled={salvandoNova}
                />
              </Stack>

              <TextField
                fullWidth
                size="small"
                label="Ponto de referência (opcional)"
                value={formAlunoPontoRef}
                onChange={(e) => setFormAlunoPontoRef(e.target.value)}
                disabled={salvandoNova}
                sx={{ mb: 1.5 }}
              />

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formAlunoUsaTransporte}
                      onChange={(e) =>
                        setFormAlunoUsaTransporte(e.target.checked)
                      }
                      disabled={salvandoNova}
                      size="small"
                    />
                  }
                  label="Usa transporte escolar"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formAlunoTemNecessidade}
                      onChange={(e) =>
                        setFormAlunoTemNecessidade(e.target.checked)
                      }
                      disabled={salvandoNova}
                      size="small"
                    />
                  }
                  label="Possui necessidade especial"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formAlunoTemRestricao}
                      onChange={(e) =>
                        setFormAlunoTemRestricao(e.target.checked)
                      }
                      disabled={salvandoNova}
                      size="small"
                    />
                  }
                  label="Restrição alimentar"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formAlunoTemBeneficio}
                      onChange={(e) =>
                        setFormAlunoTemBeneficio(e.target.checked)
                      }
                      disabled={salvandoNova}
                      size="small"
                    />
                  }
                  label="Benefício de governo"
                />
              </Stack>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Descrição da necessidade especial"
                  value={formAlunoDescNecessidade}
                  onChange={(e) =>
                    setFormAlunoDescNecessidade(e.target.value)
                  }
                  disabled={salvandoNova || !formAlunoTemNecessidade}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Descrição da restrição alimentar"
                  value={formAlunoDescRestricao}
                  onChange={(e) =>
                    setFormAlunoDescRestricao(e.target.value)
                  }
                  disabled={salvandoNova || !formAlunoTemRestricao}
                />
              </Stack>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Benefício de governo (detalhes)"
                  value={formAlunoDescBeneficio}
                  onChange={(e) =>
                    setFormAlunoDescBeneficio(e.target.value)
                  }
                  disabled={salvandoNova || !formAlunoTemBeneficio}
                />
              </Stack>

              <TextField
                fullWidth
                size="small"
                label="Observações gerais do aluno"
                value={formAlunoObservacoes}
                onChange={(e) =>
                  setFormAlunoObservacoes(e.target.value)
                }
                disabled={salvandoNova}
                multiline
                minRows={2}
              />
            </Box>

            <Divider />

            {/* Seção: Dados da matrícula */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Dados da matrícula
              </Typography>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <TextField
                  fullWidth
                  size="small"
                  label="Número de inscrição"
                  value={novoNumeroInscricao}
                  onChange={(e) =>
                    setNovoNumeroInscricao(e.target.value)
                  }
                  disabled={salvandoNova}
                />

                <FormControl fullWidth size="small">
                  <InputLabel id="novo-nivel-label">
                    Nível de ensino
                  </InputLabel>
                  <Select
                    labelId="novo-nivel-label"
                    label="Nível de ensino"
                    value={novoNivelId === '' ? '' : String(novoNivelId)}
                    onChange={(e) =>
                      setNovoNivelId(
                        e.target.value === ''
                          ? ''
                          : Number(e.target.value),
                      )
                    }
                    disabled={salvandoNova}
                  >
                    {niveisDisponiveis.map((nivel) => (
                      <MenuItem
                        key={nivel.id_nivel_ensino}
                        value={String(nivel.id_nivel_ensino)}
                      >
                        {nivel.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Ano letivo"
                  type="number"
                  value={novoAnoLetivo}
                  onChange={(e) => setNovoAnoLetivo(e.target.value)}
                  disabled={salvandoNova}
                />
              </Stack>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <FormControl fullWidth size="small">
                  <InputLabel id="nova-modalidade-label">
                    Modalidade
                  </InputLabel>
                  <Select
                    labelId="nova-modalidade-label"
                    label="Modalidade"
                    value={novaModalidade}
                    onChange={(e) => setNovaModalidade(e.target.value)}
                    disabled={salvandoNova}
                  >
                    {MODALIDADES_MATRICULA.map((mod) => (
                      <MenuItem key={mod.value} value={mod.value}>
                        {mod.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="novo-status-label">Status</InputLabel>
                  <Select
                    labelId="novo-status-label"
                    label="Status"
                    value={
                      novoStatusId === '' ? '' : String(novoStatusId)
                    }
                    onChange={(e) =>
                      setNovoStatusId(
                        e.target.value === ''
                          ? ''
                          : Number(e.target.value),
                      )
                    }
                    disabled={salvandoNova}
                  >
                    {statusDisponiveis.map((s) => (
                      <MenuItem
                        key={s.id_status_matricula}
                        value={String(s.id_status_matricula)}
                      >
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
                  value={novaDataMatricula}
                  onChange={(e) => setNovaDataMatricula(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={salvandoNova}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Data de conclusão (opcional)"
                  type="date"
                  value={novaDataConclusao}
                  onChange={(e) =>
                    setNovaDataConclusao(e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  disabled={salvandoNova}
                />
              </Stack>

              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ mb: 1.5 }}
              >
                <FormControl fullWidth size="small">
                  <InputLabel id="novo-turma-label">Turma</InputLabel>
                  <Select
                    labelId="novo-turma-label"
                    label="Turma"
                    value={novoTurmaId === '' ? '' : String(novoTurmaId)}
                    onChange={(e) =>
                      setNovoTurmaId(
                        e.target.value === ''
                          ? ''
                          : Number(e.target.value),
                      )
                    }
                    disabled={salvandoNova || turmasFiltradas.length === 0}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Sem turma vinculada</em>
                    </MenuItem>
                    {turmasFiltradas.map((t) => (
                      <MenuItem
                        key={t.id_turma}
                        value={String(t.id_turma)}
                      >
                        {t.nome} — {t.turno} ({t.ano_letivo})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* BLOCO: APROVEITAMENTO – séries concluídas */}
            {isAproveitamento && novoNivelId !== '' && (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Aproveitamento de Estudos – Séries concluídas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecione as séries (anos escolares) que o aluno já concluiu em
                  outra escola. As disciplinas dessas séries serão marcadas como
                  concluídas; as séries restantes serão registradas como &quot;A
                  Cursar&quot;.
                </Typography>

                <FormControl fullWidth size="small">
                  <InputLabel id="series-concluidas-label">
                    Séries concluídas
                  </InputLabel>
                  <Select
                    labelId="series-concluidas-label"
                    multiple
                    label="Séries concluídas"
                    value={seriesConcluidasIds}
                    onChange={(e) => {
                      const raw = e.target.value as unknown
                      let ids: number[] = []
                      if (typeof raw === 'string') {
                        ids = raw
                          .split(',')
                          .map((v: string) => Number(v))
                      } else if (Array.isArray(raw)) {
                        ids = (raw as Array<string | number>).map((v) =>
                          Number(v),
                        )
                      }
                      setSeriesConcluidasIds(ids)
                    }}
                    renderValue={(selected) => {
                      const ids = selected as number[]
                      const nomes = seriesDoNivel
                        .filter((s) => ids.includes(s.id_ano_escolar))
                        .map((s) => s.nome_ano)
                      return nomes.join(', ')
                    }}
                    disabled={salvandoNova || seriesDoNivel.length === 0}
                  >
                    {seriesDoNivel.map((serie) => (
                      <MenuItem
                        key={serie.id_ano_escolar}
                        value={serie.id_ano_escolar}
                      >
                        <Checkbox
                          size="small"
                          checked={seriesConcluidasIds.includes(
                            serie.id_ano_escolar,
                          )}
                        />
                        <ListItemText primary={serie.nome_ano} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}

            {/* BLOCO: PROGRESSÃO – série e disciplinas a cursar */}
            {isProgressao && novoNivelId !== '' && (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Progressão de Estudos – Série e disciplinas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecione a série (ano escolar) e as disciplinas que o aluno
                  irá cursar no CEJA. As disciplinas serão registradas com status
                  &quot;A Cursar&quot;. O controle de até 3 disciplinas
                  &quot;Cursando&quot; por vez será feito na tela pedagógica
                  (professor/coordenação/direção).
                </Typography>

                <FormControl fullWidth size="small">
                  <InputLabel id="serie-progressao-label">
                    Série (ano escolar)
                  </InputLabel>
                  <Select
                    labelId="serie-progressao-label"
                    label="Série (ano escolar)"
                    value={
                      serieProgressaoId === ''
                        ? ''
                        : String(serieProgressaoId)
                    }
                    onChange={(e) =>
                      setSerieProgressaoId(
                        e.target.value === ''
                          ? ''
                          : Number(e.target.value),
                      )
                    }
                    disabled={salvandoNova || seriesDoNivel.length === 0}
                  >
                    {seriesDoNivel.map((serie) => (
                      <MenuItem
                        key={serie.id_ano_escolar}
                        value={serie.id_ano_escolar}
                      >
                        {serie.nome_ano}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="disciplinas-progressao-label">
                    Disciplinas a cursar
                  </InputLabel>
                  <Select
                    labelId="disciplinas-progressao-label"
                    multiple
                    label="Disciplinas a cursar"
                    value={disciplinasProgressaoIds}
                    onChange={(e) => {
                      const raw = e.target.value as unknown
                      let ids: number[] = []
                      if (typeof raw === 'string') {
                        ids = raw
                          .split(',')
                          .map((v: string) => Number(v))
                      } else if (Array.isArray(raw)) {
                        ids = (raw as Array<string | number>).map((v) =>
                          Number(v),
                        )
                      }
                      setDisciplinasProgressaoIds(ids)
                    }}
                    renderValue={(selected) => {
                      const ids = selected as number[]
                      const nomes = disciplinasDaSerieProgressao
                        .filter((d) => ids.includes(d.id_disciplina))
                        .map((d) => d.nome_disciplina)
                      return nomes.join(', ')
                    }}
                    disabled={
                      salvandoNova ||
                      disciplinasDaSerieProgressao.length === 0
                    }
                  >
                    {disciplinasDaSerieProgressao.map((disc) => (
                      <MenuItem
                        key={disc.id_disciplina}
                        value={disc.id_disciplina}
                      >
                        <Checkbox
                          size="small"
                          checked={disciplinasProgressaoIds.includes(
                            disc.id_disciplina,
                          )}
                        />
                        <ListItemText primary={disc.nome_disciplina} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleFecharNovaMatricula}
            disabled={salvandoNova}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSalvarNovaMatricula}
            disabled={salvandoNova}
          >
            {salvandoNova ? 'Salvando...' : 'Salvar matrícula'}
          </Button>
        </DialogActions>
      </Dialog>

            {/* Dialog Editar matrícula */}
      <Dialog
        open={editarAberto}
        onClose={handleFecharEditarMatricula}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Editar matrícula</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {editandoMatricula && (
              <>
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    gutterBottom
                  >
                    Aluno
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                  >
                    <Avatar
                      src={editandoMatricula.alunoFotoUrl ?? undefined}
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: editandoMatricula.alunoFotoUrl
                          ? undefined
                          : alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      }}
                    >
                      {!editandoMatricula.alunoFotoUrl &&
                        editandoMatricula.alunoNome
                          .charAt(0)
                          .toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {editandoMatricula.alunoNome}
                      </Typography>
                      {editandoMatricula.numeroInscricao && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Matrícula: {editandoMatricula.numeroInscricao}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    gutterBottom
                  >
                    Dados da matrícula
                  </Typography>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ mb: 1.5 }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="Número de inscrição"
                      value={editNumeroInscricao}
                      onChange={(e) =>
                        setEditNumeroInscricao(e.target.value)
                      }
                      disabled={salvandoEdicao || excluindoMatricula}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Ano letivo"
                      type="number"
                      value={editAnoLetivo}
                      onChange={(e) =>
                        setEditAnoLetivo(e.target.value)
                      }
                      disabled={salvandoEdicao || excluindoMatricula}
                    />
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ mb: 1.5 }}
                  >
                    <FormControl fullWidth size="small">
                      <InputLabel id="edit-nivel-label">
                        Nível de ensino
                      </InputLabel>
                      <Select
                        labelId="edit-nivel-label"
                        label="Nível de ensino"
                        value={editNivelId}
                        onChange={(e) =>
                          setEditNivelId(e.target.value as string)
                        }
                        disabled={salvandoEdicao || excluindoMatricula}
                      >
                        <MenuItem value="">
                          <em>Não definido</em>
                        </MenuItem>
                        {niveisDisponiveis.map((nivel) => (
                          <MenuItem
                            key={nivel.id_nivel_ensino}
                            value={String(nivel.id_nivel_ensino)}
                          >
                            {nivel.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel id="edit-status-label">
                        Status da matrícula
                      </InputLabel>
                      <Select
                        labelId="edit-status-label"
                        label="Status da matrícula"
                        value={editStatusId}
                        onChange={(e) =>
                          setEditStatusId(e.target.value as string)
                        }
                        disabled={salvandoEdicao || excluindoMatricula}
                      >
                        <MenuItem value="">
                          <em>Não definido</em>
                        </MenuItem>
                        {statusDisponiveis.map((status) => (
                          <MenuItem
                            key={status.id_status_matricula}
                            value={String(status.id_status_matricula)}
                          >
                            {status.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ mb: 1.5 }}
                  >
                    <FormControl fullWidth size="small">
                      <InputLabel id="edit-modalidade-label">
                        Modalidade
                      </InputLabel>
                      <Select
                        labelId="edit-modalidade-label"
                        label="Modalidade"
                        value={editModalidade}
                        onChange={(e) =>
                          setEditModalidade(e.target.value as string)
                        }
                        disabled={salvandoEdicao || excluindoMatricula}
                      >
                        {MODALIDADES_MATRICULA.map((mod) => (
                          <MenuItem key={mod.value} value={mod.value}>
                            {mod.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel id="edit-turma-label">
                        Turma
                      </InputLabel>
                      <Select
                        labelId="edit-turma-label"
                        label="Turma"
                        value={editTurmaId}
                        onChange={(e) =>
                          setEditTurmaId(e.target.value as string)
                        }
                        disabled={salvandoEdicao || excluindoMatricula}
                      >
                        <MenuItem value="">
                          <em>Sem turma</em>
                        </MenuItem>
                        {turmasDisponiveis.map((t) => (
                          <MenuItem
                            key={t.id_turma}
                            value={String(t.id_turma)}
                          >
                            {t.nome} — {t.turno} ({t.ano_letivo})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      label="Data da matrícula"
                      type="date"
                      value={editDataMatricula}
                      onChange={(e) =>
                        setEditDataMatricula(e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      disabled={salvandoEdicao || excluindoMatricula}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Data de conclusão"
                      type="date"
                      value={editDataConclusao}
                      onChange={(e) =>
                        setEditDataConclusao(e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      disabled={salvandoEdicao || excluindoMatricula}
                    />
                  </Stack>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleFecharEditarMatricula}
            disabled={salvandoEdicao || excluindoMatricula}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSalvarEdicaoMatricula}
            disabled={salvandoEdicao || excluindoMatricula}
          >
            {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={dialogExcluirAberto}
        onClose={fecharDialogExcluirMatricula}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Tem certeza de que deseja excluir a matrícula do aluno{' '}
            <strong>
              {matriculaParaExcluir?.alunoNome ?? 'selecionado'}
            </strong>
            ?
          </Typography>
          {matriculaParaExcluir?.numeroInscricao && (
            <Typography variant="body2" color="text.secondary">
              Matrícula: {matriculaParaExcluir.numeroInscricao}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button
            onClick={fecharDialogExcluirMatricula}
            disabled={excluindoMatricula}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmarExcluirMatricula}
            disabled={excluindoMatricula}
          >
            {excluindoMatricula ? 'Excluindo...' : 'Excluir matrícula'}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Dialog de ficha completa (aluno + matrícula) */}
      {matriculaSelecionada && (
        <Dialog
          open={!!matriculaSelecionada}
          onClose={() => setMatriculaSelecionada(null)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Ficha do aluno e da matrícula</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3}>
              {/* Cabeçalho com foto + nome */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
              >
                <Avatar
                  src={matriculaSelecionada.alunoFotoUrl ?? undefined}
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: matriculaSelecionada.alunoFotoUrl
                      ? undefined
                      : alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    fontSize: 32,
                  }}
                >
                  {!matriculaSelecionada.alunoFotoUrl &&
                    matriculaSelecionada.alunoNome
                      .charAt(0)
                      .toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {matriculaSelecionada.alunoNome}
                  </Typography>
                  {matriculaSelecionada.alunoEmail && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {matriculaSelecionada.alunoEmail}
                    </Typography>
                  )}
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    sx={{ mt: 1 }}
                  >
                    {matriculaSelecionada.alunoNis && (
                      <Chip
                        size="small"
                        icon={<AssignmentIndIcon fontSize="small" />}
                        label={`NIS: ${matriculaSelecionada.alunoNis}`}
                        variant="outlined"
                      />
                    )}
                    {matriculaSelecionada.dataNascimento && (
                      <Chip
                        size="small"
                        icon={<EventIcon fontSize="small" />}
                        label={`Nasc.: ${matriculaSelecionada.dataNascimento}`}
                        variant="outlined"
                      />
                    )}
                    {matriculaSelecionada.cpf && (
                      <Chip
                        size="small"
                        label={`CPF: ${matriculaSelecionada.cpf}`}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
              </Stack>

              <Divider />

              {/* Filiação e endereço */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    gutterBottom
                  >
                    Filiação
                  </Typography>
                  <Typography variant="body2">
                    Mãe:{' '}
                    {matriculaSelecionada.alunoNomeMae ?? 'Não informado'}
                  </Typography>
                  <Typography variant="body2">
                    Pai:{' '}
                    {matriculaSelecionada.alunoNomePai ?? 'Não informado'}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    gutterBottom
                  >
                    Endereço
                  </Typography>
                  <Typography variant="body2">
                    <HomeIcon
                      fontSize="inherit"
                      style={{ marginRight: 4 }}
                    />
                    {matriculaSelecionada.logradouro ?? 'Não informado'}
                    {matriculaSelecionada.numeroEndereco &&
                      `, ${matriculaSelecionada.numeroEndereco}`}
                  </Typography>
                  <Typography variant="body2">
                    {matriculaSelecionada.bairro ?? '—'} -{' '}
                    {matriculaSelecionada.municipio ?? '—'}
                  </Typography>
                  {matriculaSelecionada.pontoReferencia && (
                    <Typography variant="body2">
                      Ref.: {matriculaSelecionada.pontoReferencia}
                    </Typography>
                  )}
                </Box>
              </Stack>

              {/* Situação escolar da matrícula */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    gutterBottom
                  >
                    Matrícula
                  </Typography>
                  <Typography variant="body2">
                    Nº de inscrição:{' '}
                    {matriculaSelecionada.numeroInscricao ?? '—'}
                  </Typography>
                  <Typography variant="body2">
                    Nível de ensino: {matriculaSelecionada.nivelNome}
                  </Typography>
                  <Typography variant="body2">
                    Modalidade: {matriculaSelecionada.modalidade ?? '—'}
                  </Typography>
                  <Typography variant="body2">
                    Ano letivo: {matriculaSelecionada.anoLetivo ?? '—'}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    gutterBottom
                  >
                    Turma e datas
                  </Typography>
                  <Typography variant="body2">
                    Turma: {matriculaSelecionada.turmaNome ?? '—'}
                  </Typography>
                  <Typography variant="body2">
                    Turno: {matriculaSelecionada.turno ?? '—'}
                  </Typography>
                  <Typography variant="body2">
                    Início: {matriculaSelecionada.dataMatricula ?? '—'}
                  </Typography>
                  <Typography variant="body2">
                    Conclusão:{' '}
                    {matriculaSelecionada.dataConclusao ?? '—'}
                  </Typography>
                  <Typography variant="body2">
                    Status: {matriculaSelecionada.statusNome ?? '—'}
                  </Typography>
                </Box>
              </Stack>

              {/* Informações complementares (transporte/saúde/benefícios) */}
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  gutterBottom
                >
                  Informações complementares
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  flexWrap="wrap"
                >
                  <Chip
                    size="small"
                    icon={<ElderlyIcon fontSize="small" />}
                    label={
                      matriculaSelecionada.usaTransporteEscolar
                        ? 'Usa transporte escolar'
                        : 'Não usa transporte escolar'
                    }
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    icon={<AccessibleIcon fontSize="small" />}
                    label={
                      matriculaSelecionada.possuiNecessidadeEspecial
                        ? 'Possui necessidade especial'
                        : 'Sem necessidade especial'
                    }
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    icon={<RestaurantIcon fontSize="small" />}
                    label={
                      matriculaSelecionada.possuiRestricaoAlimentar
                        ? 'Restrição alimentar'
                        : 'Sem restrição alimentar'
                    }
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    icon={<LocalAtmIcon fontSize="small" />}
                    label={
                      matriculaSelecionada.possuiBeneficioGoverno
                        ? 'Benefício de governo'
                        : 'Sem benefício de governo'
                    }
                    variant="outlined"
                  />
                </Stack>

                {matriculaSelecionada.qualNecessidadeEspecial && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Necessidade especial:{' '}
                    {matriculaSelecionada.qualNecessidadeEspecial}
                  </Typography>
                )}
                {matriculaSelecionada.qualRestricaoAlimentar && (
                  <Typography variant="body2">
                    Restrição alimentar:{' '}
                    {matriculaSelecionada.qualRestricaoAlimentar}
                  </Typography>
                )}
                {matriculaSelecionada.qualBeneficioGoverno && (
                  <Typography variant="body2">
                    Benefício de governo:{' '}
                    {matriculaSelecionada.qualBeneficioGoverno}
                  </Typography>
                )}
                {matriculaSelecionada.observacoesGerais && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Observações gerais
                    </Typography>
                    <Typography variant="body2">
                      {matriculaSelecionada.observacoesGerais}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setMatriculaSelecionada(null)}
            >
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}

export default SecretariaMatriculasPage
