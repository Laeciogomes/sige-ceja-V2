// frontend/src/paginas/painel-secretaria/SecretariaTurmaAlunosPage.tsx
import {
  useEffect,
  useMemo,
  useState,
  type FC,
  type ChangeEvent,
} from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material'
import { green } from '@mui/material/colors'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import GroupsIcon from '@mui/icons-material/Groups'
import SchoolIcon from '@mui/icons-material/School'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

// ✅ Regra unificada do Pé-de-Meia
import { avaliarPeDeMeia } from '../../utils/peDeMeia'

interface TurmaRow {
  id_turma: number
  nome: string
  codigo_turma: string | null
  id_nivel_ensino: number
  turno: string | null
  ano_letivo: number
  is_ativa: boolean | null
}

interface NivelEnsinoRow {
  id_nivel_ensino: number
  nome: string
}

interface MatriculaRow {
  id_matricula: number
  id_aluno: number
  id_turma: number
  numero_inscricao: string | null
  id_status_matricula: number
  data_matricula: string | null
  ano_letivo: number
}

interface AlunoRow {
  id_aluno: number
  user_id: string
}

interface UsuarioRow {
  id: string
  name: string
  cpf: string | null
  data_nascimento: string | null
  email: string
  foto_url: string | null
}

interface StatusMatriculaRow {
  id_status_matricula: number
  nome: string
}

interface AlunoLista {
  id_matricula: number
  id_aluno: number
  numeroInscricao: string | null
  nome: string
  cpf: string | null
  statusId: number
  statusNome: string
  dataMatricula: string | null
  dataNascimento: string | null
  elegivelPeDeMeia: boolean
}

type FiltroStatus = 'todos' | number
type FiltroPeDeMeia = 'todos' | 'sim' | 'nao'

const chunkArray = <T,>(arr: T[], chunkSize: number): T[][] => {
  if (chunkSize <= 0) return [arr]
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    out.push(arr.slice(i, i + chunkSize))
  }
  return out
}

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr))

const SecretariaTurmaAlunosPage: FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const { turmaId } = useParams<{ turmaId: string }>()
  const location = useLocation() as {
    state?: { turmaId?: number; turmaNome?: string }
  }

  const { supabase } = useSupabase()
  const { erro } = useNotificacaoContext()

  const [turma, setTurma] = useState<TurmaRow | null>(null)
  const [nivel, setNivel] = useState<NivelEnsinoRow | null>(null)
  const [matriculas, setMatriculas] = useState<MatriculaRow[]>([])
  const [alunos, setAlunos] = useState<AlunoRow[]>([])
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [statusMatriculas, setStatusMatriculas] = useState<
    StatusMatriculaRow[]
  >([])
  const [carregando, setCarregando] = useState<boolean>(true)

  const [busca, setBusca] = useState<string>('')
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos')
  const [filtroPeDeMeia, setFiltroPeDeMeia] =
    useState<FiltroPeDeMeia>('todos')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const turmaIdNumber = useMemo(() => {
    if (turmaId) return Number.parseInt(turmaId, 10)
    if (location.state?.turmaId) return location.state.turmaId
    return NaN
  }, [turmaId, location.state])

  // ---- Elegibilidade Pé-de-Meia (regra unificada) ----
  // Mantemos o comportamento anterior desta tela:
  // - Exigir CPF
  // - Exigir idade (EJA 19-24) a partir da data de nascimento
  // - Aplicar regra interna de prazo de matrícula (2 meses do início do período) como BLOQUEIO
  // - NÃO exigir CadÚnico aqui (porque esta listagem não carrega NIS/benefício)
  const calcularElegibilidadePeDeMeia = (
    m: MatriculaRow,
    u: UsuarioRow | undefined,
    turmaAtual: TurmaRow | null,
  ): boolean => {
    if (!turmaAtual) return false
    if (!u) return false

    const res: any = avaliarPeDeMeia(
      {
        id_nivel_ensino: turmaAtual.id_nivel_ensino,
        cpf: u.cpf ?? null,
        data_nascimento: u.data_nascimento ?? null,
        nis: null,
        possui_beneficio_governo: null,
        data_matricula: m.data_matricula ?? null,
        ano_letivo: turmaAtual.ano_letivo,
        modalidade: 'EJA',
      } as any,
      {
        exigir_cadunico: false,
        exigir_cpf: true,

        // ✅ preserva a regra antiga desta tela
        validar_prazo_matricula: true,
        prazo_matricula_meses: 2,
        prazo_matricula_modo: 'BLOQUEAR',

        // Datas padrão que você já usava no sistema:
        inicio_ano_mes: 1,
        inicio_ano_dia: 7,
        inicio_sem2_mes: 7,
        inicio_sem2_dia: 1,

        // CEJA geralmente semestral
        periodo_eja: 'SEMESTRAL',
      } as any,
    ) as any

    const classificacao = String(res?.classificacao ?? 'INDETERMINADO')
    return classificacao.startsWith('ELEGIVEL')
  }

  // Carrega turma, nível, matrículas, alunos, usuarios, status
  const carregarDados = async () => {
    if (!supabase || Number.isNaN(turmaIdNumber)) {
      erro('Turma inválida.')
      return
    }

    try {
      setCarregando(true)

      const [
        { data: turmaData, error: turmaError },
        { data: niveisData, error: nivelError },
        { data: matriculasData, error: matriculasError },
        { data: statusData, error: statusError },
      ] = await Promise.all([
        supabase
          .from('turmas')
          .select(
            'id_turma, nome, codigo_turma, id_nivel_ensino, turno, ano_letivo, is_ativa',
          )
          .eq('id_turma', turmaIdNumber)
          .single<TurmaRow>(),
        supabase.from('niveis_ensino').select('id_nivel_ensino, nome'),
        supabase
          .from('matriculas')
          .select(
            'id_matricula, id_aluno, id_turma, numero_inscricao, id_status_matricula, data_matricula, ano_letivo',
          )
          .eq('id_turma', turmaIdNumber),
        supabase
          .from('status_matricula')
          .select('id_status_matricula, nome'),
      ])

      if (turmaError || !turmaData) {
        console.error(turmaError)
        erro('Erro ao carregar dados da turma.')
      } else {
        setTurma(turmaData)
      }

      if (nivelError || !niveisData) {
        console.error(nivelError)
      } else if (turmaData) {
        const niv = (niveisData as NivelEnsinoRow[]).find(
          (n) => n.id_nivel_ensino === turmaData.id_nivel_ensino,
        )
        if (niv) setNivel(niv)
      }

      if (matriculasError) {
        console.error(matriculasError)
        erro('Erro ao carregar matrículas da turma.')
        setMatriculas([])
      } else if (matriculasData) {
        setMatriculas(matriculasData as MatriculaRow[])
      } else {
        setMatriculas([])
      }

      if (statusError) {
        console.error(statusError)
        erro('Erro ao carregar status de matrícula.')
        setStatusMatriculas([])
      } else if (statusData) {
        setStatusMatriculas(statusData as StatusMatriculaRow[])
      } else {
        setStatusMatriculas([])
      }

      const matList = ((matriculasData ?? []) as MatriculaRow[]) ?? []
      const idsAlunos = uniq(
        matList
          .map((m) => m.id_aluno)
          .filter((id): id is number => typeof id === 'number'),
      )

      if (idsAlunos.length === 0) {
        setAlunos([])
        setUsuarios([])
        return
      }

      // === Busca em lotes para evitar URL gigante / 400 em .in(...) ===
      // Ajuste fino: se sua turma for enorme, reduza esses tamanhos.
      const ALUNOS_CHUNK = 200
      const USUARIOS_CHUNK = 80

      // 1) Busca alunos (id_aluno, user_id) em chunks
      const alunosChunks = chunkArray(idsAlunos, ALUNOS_CHUNK)

      const alunosAcumulados: AlunoRow[] = []
      for (const chunk of alunosChunks) {
        const { data: alunosData, error: alunosError } = await supabase
          .from('alunos')
          .select('id_aluno, user_id')
          .in('id_aluno', chunk)

        if (alunosError) {
          console.error(alunosError)
          erro('Erro ao carregar alunos.')
          // não interrompe: tenta continuar com os próximos chunks
          continue
        }

        alunosAcumulados.push(...((alunosData ?? []) as AlunoRow[]))
      }

      setAlunos(alunosAcumulados)

      const userIds = uniq(
        alunosAcumulados
          .map((a) => a.user_id)
          .filter((id): id is string => !!id),
      )

      if (userIds.length === 0) {
        setUsuarios([])
        return
      }

      // 2) Busca usuários (perfil do aluno) em chunks
      const usuariosChunks = chunkArray(userIds, USUARIOS_CHUNK)

      const usuariosAcumulados: UsuarioRow[] = []
      for (const chunk of usuariosChunks) {
        const { data: usuariosData, error: usuariosError } = await supabase
          .from('usuarios')
          .select('id, name, cpf, data_nascimento, email, foto_url')
          .in('id', chunk)

        if (usuariosError) {
          console.error(usuariosError)
          erro('Erro ao carregar dados de usuários (alunos).')
          continue
        }

        usuariosAcumulados.push(...((usuariosData ?? []) as UsuarioRow[]))
      }

      setUsuarios(usuariosAcumulados)
    } catch (e) {
      console.error(e)
      erro('Erro técnico ao carregar dados da turma.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregarDados()
  }, [supabase, turmaIdNumber])

  // Enriquecer dados de alunos + Pé de Meia
  const alunosEnriquecidos: AlunoLista[] = useMemo(() => {
    const statusMap = new Map<number, string>()
    statusMatriculas.forEach((s) =>
      statusMap.set(s.id_status_matricula, s.nome),
    )

    const alunoMap = new Map<number, AlunoRow>()
    alunos.forEach((a) => alunoMap.set(a.id_aluno, a))

    const usuarioMap = new Map<string, UsuarioRow>()
    usuarios.forEach((u) => usuarioMap.set(u.id, u))

    return matriculas.map((m) => {
      const aluno = alunoMap.get(m.id_aluno)
      const usuario = aluno ? usuarioMap.get(aluno.user_id) : undefined
      const statusNome =
        statusMap.get(m.id_status_matricula) ?? 'Status desconhecido'
      const elegivel = calcularElegibilidadePeDeMeia(m, usuario, turma)

      return {
        id_matricula: m.id_matricula,
        id_aluno: m.id_aluno,
        numeroInscricao: m.numero_inscricao ?? null,
        nome: usuario?.name ?? 'Aluno sem usuário',
        cpf: usuario?.cpf ?? null,
        statusId: m.id_status_matricula,
        statusNome,
        dataMatricula: m.data_matricula,
        dataNascimento: usuario?.data_nascimento ?? null,
        elegivelPeDeMeia: elegivel,
      }
    })
  }, [matriculas, alunos, usuarios, statusMatriculas, turma])

  // Filtros (Nome, CPF e Matrícula/numero_inscricao)
  const alunosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const termoDigits = termo.replace(/[^\d]/g, '')

    return alunosEnriquecidos.filter((a) => {
      const nomeLower = a.nome.toLowerCase()
      const cpfDigits = (a.cpf ?? '').replace(/[^\d]/g, '')
      const matriculaLower = (a.numeroInscricao ?? '').toLowerCase()
      const matriculaDigits = (a.numeroInscricao ?? '').replace(/[^\d]/g, '')

      const matchNome = termo !== '' && nomeLower.includes(termo)

      const matchCpf = termoDigits !== '' && cpfDigits.includes(termoDigits)

      const matchMatricula =
        termo !== '' &&
        (matriculaLower.includes(termo) ||
          (termoDigits !== '' && matriculaDigits.includes(termoDigits)))

      const matchBusca = termo === '' || matchNome || matchCpf || matchMatricula

      const matchStatus =
        filtroStatus === 'todos' ? true : a.statusId === filtroStatus

      let matchPe = true
      if (filtroPeDeMeia === 'sim') matchPe = a.elegivelPeDeMeia
      else if (filtroPeDeMeia === 'nao') matchPe = !a.elegivelPeDeMeia

      return matchBusca && matchStatus && matchPe
    })
  }, [alunosEnriquecidos, busca, filtroStatus, filtroPeDeMeia])

  useEffect(() => {
    setPage(0)
  }, [busca, filtroStatus, filtroPeDeMeia])

  const alunosPaginados = useMemo(
    () =>
      alunosFiltrados.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [alunosFiltrados, page, rowsPerPage],
  )

  // Estatísticas
  const totalAlunos = alunosEnriquecidos.length
  const totalPorStatus = useMemo(() => {
    const mapa = new Map<number, number>()
    alunosEnriquecidos.forEach((a) => {
      mapa.set(a.statusId, (mapa.get(a.statusId) ?? 0) + 1)
    })
    return mapa
  }, [alunosEnriquecidos])

  const totalAtivos = useMemo(() => {
    const statusAtivo = statusMatriculas.find((s) =>
      s.nome.toLowerCase().includes('ativo'),
    )
    if (!statusAtivo) return 0
    return totalPorStatus.get(statusAtivo.id_status_matricula) ?? 0
  }, [statusMatriculas, totalPorStatus])

  const totalElegiveis = useMemo(
    () => alunosEnriquecidos.filter((a) => a.elegivelPeDeMeia).length,
    [alunosEnriquecidos],
  )

  // Estilos
  const cardBorderColor = theme.palette.divider
  const cardBgColor = theme.palette.background.paper
  const zebraColor =
    theme.palette.mode === 'light'
      ? alpha(theme.palette.grey[400], 0.15)
      : alpha(theme.palette.common.white, 0.05)

  // Cores do Cabeçalho Verde
  const headerBgColor =
    theme.palette.mode === 'light' ? green[100] : alpha(green[900], 0.4)
  const headerTextColor =
    theme.palette.mode === 'light'
      ? theme.palette.success.dark
      : theme.palette.success.light

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleVoltar = () => {
    navigate('/secretaria/turmas')
  }

  const handleStatusFilterChange = (value: string) => {
    if (value === 'todos') {
      setFiltroStatus('todos')
    } else {
      setFiltroStatus(Number(value))
    }
  }

  const turmaNomeHeader = turma?.nome || location.state?.turmaNome || 'Turma'

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: 1400,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {/* Cabeçalho */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={handleVoltar}
            >
              Voltar
            </Button>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Alunos da turma: {turmaNomeHeader}
              </Typography>
              {turma && (
                <Typography variant="body2" color="text.secondary">
                  {nivel?.nome ?? 'Nível não informado'} • Ano letivo{' '}
                  {turma.ano_letivo} • {turma.turno ? turma.turno : 'Multiturno'}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>
      </Stack>

      {/* Cards de resumo */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${cardBorderColor}`,
            bgcolor: cardBgColor,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GroupsIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1 }}>
              {totalAlunos}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Alunos matriculados
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${cardBorderColor}`,
            bgcolor: cardBgColor,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.success.main, 0.12),
              color: theme.palette.success.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SchoolIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1 }}>
              {totalAtivos}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Matrículas ativas
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${cardBorderColor}`,
            bgcolor: cardBgColor,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.info.main, 0.12),
              color: theme.palette.info.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PersonIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1 }}>
              {totalElegiveis}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Elegíveis ao Pé de Meia
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Filtros */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nome, CPF ou matrícula..."
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
            sx={{ minWidth: { md: 450 } }}
          >
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Status da matrícula</InputLabel>
              <Select
                label="Status da matrícula"
                value={filtroStatus === 'todos' ? 'todos' : String(filtroStatus)}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                <MenuItem value="todos">
                  <em>Todos</em>
                </MenuItem>
                {statusMatriculas.map((s) => (
                  <MenuItem
                    key={s.id_status_matricula}
                    value={String(s.id_status_matricula)}
                  >
                    {s.nome}
                    {totalPorStatus.get(s.id_status_matricula) != null && (
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 0.5 }}
                      >
                        ({totalPorStatus.get(s.id_status_matricula) ?? 0})
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Pé de Meia</InputLabel>
              <Select
                label="Pé de Meia"
                value={filtroPeDeMeia}
                onChange={(e) =>
                  setFiltroPeDeMeia(e.target.value as FiltroPeDeMeia)
                }
              >
                <MenuItem value="todos">
                  <em>Todos</em>
                </MenuItem>
                <MenuItem value="sim">Elegíveis</MenuItem>
                <MenuItem value="nao">Não elegíveis</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Paper>

      {/* Lista de alunos */}
      <TableContainer
        component={Paper}
        elevation={0}
        variant="outlined"
        sx={{ borderRadius: 3, overflow: 'hidden' }}
      >
        {carregando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {isMobile ? (
              // CARDS MOBILE
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  {alunosFiltrados.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ py: 2 }}
                    >
                      Nenhum aluno encontrado para esta turma.
                    </Typography>
                  )}

                  {alunosFiltrados.map((a) => (
                    <Paper
                      key={a.id_matricula}
                      variant="outlined"
                      sx={{ borderRadius: 2, p: 2 }}
                    >
                      <Stack spacing={1}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          sx={{ wordBreak: 'break-word' }}
                        >
                          {a.nome}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          Matrícula: {a.numeroInscricao || '—'}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          CPF: {a.cpf || '—'}
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          sx={{ mt: 0.5 }}
                        >
                          <Chip
                            label={a.statusNome}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {a.dataMatricula && (
                            <Chip
                              label={`Desde ${new Date(
                                a.dataMatricula,
                              ).toLocaleDateString('pt-BR')}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          <Chip
                            label={
                              a.elegivelPeDeMeia
                                ? 'Pé de Meia: elegível'
                                : 'Pé de Meia: não elegível'
                            }
                            size="small"
                            color={a.elegivelPeDeMeia ? 'success' : 'default'}
                            variant={a.elegivelPeDeMeia ? 'filled' : 'outlined'}
                          />
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            ) : (
              // TABELA DESKTOP
              <>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ bgcolor: headerBgColor }}>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Aluno
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Matrícula
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        CPF
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Data matrícula
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Pé de Meia
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alunosPaginados.map((a, index) => {
                      const isEven = index % 2 === 0
                      return (
                        <TableRow
                          key={a.id_matricula}
                          sx={{
                            bgcolor: isEven ? 'inherit' : zebraColor,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                            },
                          }}
                        >
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ wordBreak: 'break-word' }}
                            >
                              {a.nome}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {a.numeroInscricao || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {a.cpf || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={a.statusNome}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            {a.dataMatricula
                              ? new Date(a.dataMatricula).toLocaleDateString(
                                  'pt-BR',
                                )
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={a.elegivelPeDeMeia ? 'Elegível' : 'Não elegível'}
                              size="small"
                              color={a.elegivelPeDeMeia ? 'success' : 'default'}
                              variant={a.elegivelPeDeMeia ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {alunosPaginados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Nenhum aluno encontrado para esta turma.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <TablePagination
                  component="div"
                  count={alunosFiltrados.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </>
            )}
          </>
        )}
      </TableContainer>
    </Box>
  )
}

export default SecretariaTurmaAlunosPage
