// src/paginas/painel-secretaria/SecretariaMatriculasPage.tsx

import {
  useEffect,
  useMemo,
  useState,
  type FC,
  type ChangeEvent,
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

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

// === MODALIDADES (enum modalidade_matricula_enum) ===
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

  // Aluno
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

  // Dados pessoais
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

  // Matrícula
  numeroInscricao: string
  anoLetivo: number
  nivelNome: string
  turmaNome?: string | null
  turno?: string | null
  modalidade: string
  statusNome: string
  dataMatricula: string
  dataConclusao?: string | null
}

interface AlunoDisplay {
  id_aluno: number
  nome: string
  email: string
  foto_url?: string | null
}

// === COMPONENTE PRINCIPAL ===

const SecretariaMatriculasPage: FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { erro, sucesso } = useNotificacaoContext()

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
  const [alunosDisponiveis, setAlunosDisponiveis] =
    useState<AlunoDisplay[]>([])
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<TurmaRow[]>([])
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] =
    useState<DisciplinaRow[]>([])
  const [anosEscolaresDisponiveis, setAnosEscolaresDisponiveis] =
    useState<AnoEscolarRow[]>([])
  const [statusDisciplinaDisponiveis, setStatusDisciplinaDisponiveis] =
    useState<StatusDisciplinaRow[]>([])
  const [configDisciplinaAnoDisponiveis, setConfigDisciplinaAnoDisponiveis] =
    useState<ConfigDisciplinaAnoRow[]>([])

  // Guardamos também os registros brutos de alunos/usuários para mostrar ficha completa
  const [alunosDetalhes, setAlunosDetalhes] = useState<AlunoRow[]>([])
  const [usuariosDetalhes, setUsuariosDetalhes] = useState<UsuarioRow[]>([])

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Diálogo Nova Matrícula
  const [novaAberta, setNovaAberta] = useState(false)
  const [salvandoNova, setSalvandoNova] = useState(false)

  const [novoAlunoId, setNovoAlunoId] = useState<number | ''>('')
  const [novoNumeroInscricao, setNovoNumeroInscricao] = useState('')
  const [novoNivelId, setNovoNivelId] = useState<number | ''>('')
  const [novoStatusId, setNovoStatusId] = useState<number | ''>('')
  const [novoTurmaId, setNovoTurmaId] = useState<number | ''>('')
  const [novoAnoLetivo, setNovoAnoLetivo] = useState<string>(
    new Date().getFullYear().toString(),
  )
  const [novaModalidade, setNovaModalidade] =
    useState<string>('Orientação de Estudos')
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

  // Detalhe da matrícula (ficha completa do aluno)
  const [matriculaSelecionada, setMatriculaSelecionada] =
    useState<MatriculaLista | null>(null)

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

      const matriculasList =
        (matriculasData || []) as unknown as MatriculaRow[]
      const alunosList = (alunosData || []) as unknown as AlunoRow[]
      const niveisList = (niveisData || []) as unknown as NivelEnsinoRow[]
      const statusList =
        (statusData || []) as unknown as StatusMatriculaRow[]
      const turmasList = (turmasData || []) as unknown as TurmaRow[]
      const disciplinasList =
        (disciplinasData || []) as unknown as DisciplinaRow[]
      const anosEscolaresList =
        (anosEscolaresData || []) as unknown as AnoEscolarRow[]
      const statusDiscList =
        (statusDiscData || []) as unknown as StatusDisciplinaRow[]
      const configDiscAnoList =
        (configDiscAnoData || []) as unknown as ConfigDisciplinaAnoRow[]

      setNiveisDisponiveis(niveisList)
      setStatusDisponiveis(statusList)
      setTurmasDisponiveis(turmasList)
      setDisciplinasDisponiveis(disciplinasList)
      setAnosEscolaresDisponiveis(anosEscolaresList)
      setStatusDisciplinaDisponiveis(statusDiscList)
      setConfigDisciplinaAnoDisponiveis(configDiscAnoList)

      setAlunosDetalhes(alunosList)

      const anos = Array.from(
        new Set(matriculasList.map((m) => m.ano_letivo)),
      ).sort((a, b) => b - a)
      setAnosDisponiveis(anos)

      const alunosById = new Map<number, AlunoRow>()
      alunosList.forEach((a) => alunosById.set(a.id_aluno, a))

      const userIds = Array.from(
        new Set(
          matriculasList
            .map((m) => alunosById.get(m.id_aluno)?.user_id)
            .filter((id): id is string => !!id),
        ),
      )

      let usuariosList: UsuarioRow[] = []
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
          erro('Erro ao carregar dados de usuários (alunos).')
        } else {
          usuariosList =
            (usuariosData || []) as unknown as UsuarioRow[]
          usuariosById = new Map<string, UsuarioRow>()
          usuariosList.forEach((u) => usuariosById.set(u.id, u))
        }
      }

      setUsuariosDetalhes(usuariosList)

      // Lista para o select de alunos
      const alunosDisplay: AlunoDisplay[] = alunosList
        .map((a) => {
          const u = usuariosById.get(a.user_id)
          return {
            id_aluno: a.id_aluno,
            nome: u?.name ?? 'Aluno sem vínculo de usuário',
            email: u?.email ?? '',
            foto_url: u?.foto_url ?? null,
          }
        })
        .sort((a, b) => a.nome.localeCompare(b.nome))

      setAlunosDisponiveis(alunosDisplay)

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
        const usuario = aluno ? usuariosById.get(aluno.user_id) : undefined
        const nivel = niveisById.get(m.id_nivel_ensino)
        const status = statusById.get(m.id_status_matricula)
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

          numeroInscricao: m.numero_inscricao,
          anoLetivo: m.ano_letivo,
          nivelNome: nivel?.nome ?? 'Nível não definido',
          turmaNome: turma?.nome ?? null,
          turno: turma?.turno ?? null,
          modalidade: m.modalidade,
          statusNome: status?.nome ?? 'Status não definido',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    setNovoAlunoId('')
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

    sucesso('Abrindo formulário de matrícula...', 'Nova Matrícula')
  }

  const handleFecharNovaMatricula = () => {
    if (salvandoNova) return
    setNovaAberta(false)
  }

  const handleSalvarNovaMatricula = async () => {
    if (!supabase) return

    if (
      novoAlunoId === '' ||
      novoNivelId === '' ||
      novoStatusId === '' ||
      !novoNumeroInscricao.trim() ||
      !novoAnoLetivo.trim() ||
      !novaDataMatricula ||
      !novaModalidade.trim()
    ) {
      erro(
        'Preencha aluno, nível, status, número de inscrição, modalidade, ano letivo e data de matrícula.',
      )
      return
    }

    const ano = Number(novoAnoLetivo)
    if (!Number.isFinite(ano)) {
      erro('Ano letivo inválido.')
      return
    }

    try {
      setSalvandoNova(true)

      const payload = {
        id_aluno: novoAlunoId as number,
        numero_inscricao: novoNumeroInscricao.trim(),
        id_nivel_ensino: novoNivelId as number,
        id_status_matricula: novoStatusId as number,
        modalidade: novaModalidade.trim(),
        ano_letivo: ano,
        data_matricula: novaDataMatricula,
        data_conclusao: novaDataConclusao || null,
        id_turma: novoTurmaId === '' ? null : (novoTurmaId as number),
      }

      const { data: novaMatriculaData, error: insertError } = await supabase
        .from('matriculas')
        .insert(payload)
        .select('id_matricula')
        .single<{ id_matricula: number }>()

      if (insertError || !novaMatriculaData) {
        console.error(insertError)
        erro('Erro ao salvar matrícula.')
        return
      }

      const novaMatriculaId = novaMatriculaData.id_matricula

      const isAproveitamento =
        novaModalidade === 'Aproveitamento de Estudos'
      const isProgressao =
        novaModalidade === 'Progressão de Estudos'

      if (
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
          (a) => a.id_nivel_ensino === (novoNivelId as number),
        )

        if (isAproveitamento) {
          const concluidasSet = new Set(seriesConcluidasIds)
          const seriesConcluidas = anosNivel.filter((a) =>
            concluidasSet.has(a.id_ano_escolar),
          )
          const seriesRestantes = anosNivel.filter(
            (a) => !concluidasSet.has(a.id_ano_escolar),
          )

          seriesConcluidas.forEach((serie) => {
            const configs = configDisciplinaAnoDisponiveis.filter(
              (c) => c.id_ano_escolar === serie.id_ano_escolar,
            )
            configs.forEach((c) => {
              inserts.push({
                id_matricula: novaMatriculaId,
                id_disciplina: c.id_disciplina,
                id_ano_escolar: serie.id_ano_escolar,
                id_status_disciplina: statusConcluida.id_status_disciplina,
                nota_final: null,
                data_conclusao: null,
                observacoes:
                  'Disciplina concluída por aproveitamento de estudos.',
              })
            })
          })

          seriesRestantes.forEach((serie) => {
            const configs = configDisciplinaAnoDisponiveis.filter(
              (c) => c.id_ano_escolar === serie.id_ano_escolar,
            )
            configs.forEach((c) => {
              inserts.push({
                id_matricula: novaMatriculaId,
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

        if (isProgressao && serieProgressaoId !== '') {
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
            erro(
              'Matrícula criada, mas houve erro ao registrar o progresso das disciplinas.',
            )
          }
        }
      }

      await carregarDados()
      sucesso('Matrícula criada com sucesso.', 'Nova Matrícula')
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
          m.numeroInscricao.toLowerCase().includes(termo) ||
          m.nivelNome.toLowerCase().includes(termo) ||
          (m.turmaNome ?? '').toLowerCase().includes(termo) ||
          m.statusNome.toLowerCase().includes(termo) ||
          m.modalidade.toLowerCase().includes(termo) ||
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

  const getStatusColor = (status: string) => {
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

  // Dados do aluno selecionado no formulário de nova matrícula
  const dadosAlunoSelecionado = useMemo(() => {
    if (novoAlunoId === '') return null
    const id = novoAlunoId as number
    const aluno = alunosDetalhes.find((a) => a.id_aluno === id)
    if (!aluno) return null
    const usuario = usuariosDetalhes.find((u) => u.id === aluno.user_id)
    return { aluno, usuario }
  }, [novoAlunoId, alunosDetalhes, usuariosDetalhes])

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
          <Typography variant="h5" fontWeight={700}>
            Matrículas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acompanhe as matrículas por ano letivo, nível de ensino, modalidade e status.
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
                const statusColor = getStatusColor(m.statusNome)
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
                            Matrícula: {m.numeroInscricao}
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
                        <Chip
                          icon={<EventIcon fontSize="small" />}
                          label={`Ano: ${m.anoLetivo}`}
                          size="small"
                          variant="outlined"
                        />
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
                        <Chip
                          label={m.statusNome}
                          size="small"
                          sx={{
                            bgcolor: alpha(statusColor, 0.08),
                            color: statusColor,
                            fontWeight: 600,
                          }}
                        />
                      </Stack>

                      <Stack spacing={0.25}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Início: {m.dataMatricula}
                        </Typography>
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
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setMatriculaSelecionada(m)}
                        >
                          Ver ficha
                        </Button>
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
                  const statusColor = getStatusColor(m.statusNome)

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
                          {m.numeroInscricao}
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {m.modalidade}
                        </Typography>
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
                          {m.anoLetivo}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Início: {m.dataMatricula}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={m.statusNome}
                          size="small"
                          sx={{
                            bgcolor: alpha(statusColor, 0.08),
                            color: statusColor,
                            fontWeight: 600,
                          }}
                        />
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
                              >
                                Detalhes
                              </Button>
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
            {/* Aluno + nº inscrição */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="novo-aluno-label">Aluno</InputLabel>
                <Select
                  labelId="novo-aluno-label"
                  label="Aluno"
                  value={novoAlunoId === '' ? '' : String(novoAlunoId)}
                  onChange={(e) =>
                    setNovoAlunoId(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  disabled={salvandoNova || alunosDisponiveis.length === 0}
                >
                  {alunosDisponiveis.map((aluno) => (
                    <MenuItem
                      key={aluno.id_aluno}
                      value={String(aluno.id_aluno)}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Avatar
                          src={aluno.foto_url ?? undefined}
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: aluno.foto_url
                              ? undefined
                              : alpha(
                                  theme.palette.primary.main,
                                  0.12,
                                ),
                            color: theme.palette.primary.main,
                            fontSize: 12,
                          }}
                        >
                          {!aluno.foto_url &&
                            aluno.nome.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {aluno.nome}
                          </Typography>
                          {aluno.email && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {aluno.email}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Número de inscrição"
                value={novoNumeroInscricao}
                onChange={(e) => setNovoNumeroInscricao(e.target.value)}
                disabled={salvandoNova}
              />
            </Stack>

            {/* Ficha rápida do aluno selecionado */}
            {dadosAlunoSelecionado && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                  <Avatar
                    src={dadosAlunoSelecionado.usuario?.foto_url ?? undefined}
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: dadosAlunoSelecionado.usuario?.foto_url
                        ? undefined
                        : alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main,
                      fontSize: 26,
                    }}
                  >
                    {!dadosAlunoSelecionado.usuario?.foto_url &&
                      (dadosAlunoSelecionado.usuario?.name ?? '?')
                        .charAt(0)
                        .toUpperCase()}
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {dadosAlunoSelecionado.usuario?.name ??
                        'Aluno sem vínculo de usuário'}
                    </Typography>
                    {dadosAlunoSelecionado.usuario?.email && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {dadosAlunoSelecionado.usuario.email}
                      </Typography>
                    )}
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      sx={{ mt: 1 }}
                    >
                      {dadosAlunoSelecionado.aluno.nis && (
                        <Chip
                          size="small"
                          icon={<AssignmentIndIcon fontSize="small" />}
                          label={`NIS: ${dadosAlunoSelecionado.aluno.nis}`}
                          variant="outlined"
                        />
                      )}
                      {dadosAlunoSelecionado.usuario?.data_nascimento && (
                        <Chip
                          size="small"
                          icon={<EventIcon fontSize="small" />}
                          label={`Nasc.: ${dadosAlunoSelecionado.usuario.data_nascimento}`}
                          variant="outlined"
                        />
                      )}
                      {dadosAlunoSelecionado.usuario?.cpf && (
                        <Chip
                          size="small"
                          label={`CPF: ${dadosAlunoSelecionado.usuario.cpf}`}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Filiação
                    </Typography>
                    <Typography variant="body2">
                      Mãe: {dadosAlunoSelecionado.aluno.nome_mae}
                    </Typography>
                    {dadosAlunoSelecionado.aluno.nome_pai && (
                      <Typography variant="body2">
                        Pai: {dadosAlunoSelecionado.aluno.nome_pai}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Endereço
                    </Typography>
                    <Typography variant="body2">
                      <HomeIcon
                        fontSize="inherit"
                        style={{ marginRight: 4 }}
                      />
                      {dadosAlunoSelecionado.usuario?.logradouro ??
                        '—'}
                      {dadosAlunoSelecionado.usuario?.numero_endereco &&
                        `, ${dadosAlunoSelecionado.usuario.numero_endereco}`}
                    </Typography>
                    <Typography variant="body2">
                      {dadosAlunoSelecionado.usuario?.bairro ?? '—'} -{' '}
                      {dadosAlunoSelecionado.usuario?.municipio ?? '—'}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ mt: 1 }}
                >
                  <Chip
                    size="small"
                    icon={<ElderlyIcon fontSize="small" />}
                    label={
                      dadosAlunoSelecionado.aluno
                        .usa_transporte_escolar
                        ? 'Usa transporte escolar'
                        : 'Não usa transporte escolar'
                    }
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    icon={<AccessibleIcon fontSize="small" />}
                    label={
                      dadosAlunoSelecionado.aluno
                        .possui_necessidade_especial
                        ? 'Possui necessidade especial'
                        : 'Sem necessidade especial'
                    }
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    icon={<RestaurantIcon fontSize="small" />}
                    label={
                      dadosAlunoSelecionado.aluno
                        .possui_restricao_alimentar
                        ? 'Restrição alimentar'
                        : 'Sem restrição alimentar'
                    }
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    icon={<LocalAtmIcon fontSize="small" />}
                    label={
                      dadosAlunoSelecionado.aluno
                        .possui_beneficio_governo
                        ? 'Benefício de governo'
                        : 'Sem benefício de governo'
                    }
                    variant="outlined"
                  />
                </Stack>

                {dadosAlunoSelecionado.aluno.observacoes_gerais && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      Observações gerais
                    </Typography>
                    <Typography variant="body2">
                      {dadosAlunoSelecionado.aluno.observacoes_gerais}
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}

            {/* Nível, ano letivo, modalidade */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
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
                      e.target.value === '' ? '' : Number(e.target.value),
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
            </Stack>

            {/* Status, datas */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="novo-status-label">Status</InputLabel>
                <Select
                  labelId="novo-status-label"
                  label="Status"
                  value={novoStatusId === '' ? '' : String(novoStatusId)}
                  onChange={(e) =>
                    setNovoStatusId(
                      e.target.value === '' ? '' : Number(e.target.value),
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
                onChange={(e) => setNovaDataConclusao(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={salvandoNova}
              />
            </Stack>

            {/* Turma */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="novo-turma-label">Turma</InputLabel>
                <Select
                  labelId="novo-turma-label"
                  label="Turma"
                  value={novoTurmaId === '' ? '' : String(novoTurmaId)}
                  onChange={(e) =>
                    setNovoTurmaId(
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                  disabled={salvandoNova || turmasFiltradas.length === 0}
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
            </Stack>

            {/* BLOCO: APROVEITAMENTO – séries concluídas */}
            {isAproveitamento && novoNivelId !== '' && (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Aproveitamento de Estudos – Séries concluídas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecione as séries (anos escolares) que o aluno já
                  concluiu em outra escola. As disciplinas dessas séries
                  serão marcadas como concluídas por aproveitamento; as
                  séries restantes serão registradas como A Cursar.
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
                        ids = raw.split(',').map((v: string) => Number(v))
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
                  Selecione a série (ano escolar) e as disciplinas que o
                  aluno irá cursar no CEJA nesta matrícula de progressão. As
                  disciplinas serão registradas com status A Cursar. A
                  liberação para Cursando (respeitando o limite de 3
                  disciplinas ativas) será feita em outra tela pedagógica.
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
                        ids = raw.split(',').map((v: string) => Number(v))
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
                      salvandoNova || disciplinasDaSerieProgressao.length === 0
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
                    matriculaSelecionada.alunoNome.charAt(0).toUpperCase()}
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
                    Nº de inscrição: {matriculaSelecionada.numeroInscricao}
                  </Typography>
                  <Typography variant="body2">
                    Nível de ensino: {matriculaSelecionada.nivelNome}
                  </Typography>
                  <Typography variant="body2">
                    Modalidade: {matriculaSelecionada.modalidade}
                  </Typography>
                  <Typography variant="body2">
                    Ano letivo: {matriculaSelecionada.anoLetivo}
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
                    Início: {matriculaSelecionada.dataMatricula}
                  </Typography>
                  <Typography variant="body2">
                    Conclusão:{' '}
                    {matriculaSelecionada.dataConclusao ?? '—'}
                  </Typography>
                  <Typography variant="body2">
                    Status: {matriculaSelecionada.statusNome}
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
                  <Typography
                    variant="body2"
                    sx={{ mt: 1 }}
                  >
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
