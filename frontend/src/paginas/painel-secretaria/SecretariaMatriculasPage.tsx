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
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import SchoolIcon from '@mui/icons-material/School'
import EventIcon from '@mui/icons-material/Event'
import GroupIcon from '@mui/icons-material/Group'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

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
}

interface UsuarioRow {
  id: string
  name: string
  email: string
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

interface MatriculaLista {
  id: number
  alunoNome: string
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
}

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

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Estado do diálogo de nova matrícula
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
        supabase.from('alunos').select('id_aluno, user_id'),
        supabase.from('niveis_ensino').select('id_nivel_ensino, nome'),
        supabase.from('status_matricula').select(
          'id_status_matricula, nome',
        ),
        supabase
          .from('turmas')
          .select('id_turma, nome, turno, ano_letivo, id_nivel_ensino'),
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

      const matriculasList = (matriculasData || []) as unknown as MatriculaRow[]
      const alunosList = (alunosData || []) as unknown as AlunoRow[]
      const niveisList = (niveisData || []) as unknown as NivelEnsinoRow[]
      const statusList = (statusData || []) as unknown as StatusMatriculaRow[]
      const turmasList = (turmasData || []) as unknown as TurmaRow[]

      setNiveisDisponiveis(niveisList)
      setStatusDisponiveis(statusList)
      setTurmasDisponiveis(turmasList)

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

      // Também vamos precisar dos usuários para montar o dropdown de alunos
      let usuariosById = new Map<string, UsuarioRow>()
      if (userIds.length > 0) {
        const { data: usuariosData, error: usuariosError } = await supabase
          .from('usuarios')
          .select('id, name, email')
          .in('id', userIds)

        if (usuariosError) {
          console.error(usuariosError)
          erro('Erro ao carregar dados de usuários (alunos).')
        } else {
          const usuariosList = (usuariosData || []) as unknown as UsuarioRow[]
          usuariosById = new Map<string, UsuarioRow>()
          usuariosList.forEach((u) => usuariosById.set(u.id, u))
        }
      }

      // Monta lista de alunos para o formulário de nova matrícula
      const alunosDisplay: AlunoDisplay[] = alunosList
        .map((a) => {
          const u = usuariosById.get(a.user_id)
          return {
            id_aluno: a.id_aluno,
            nome: u?.name ?? 'Aluno sem vínculo de usuário',
            email: u?.email ?? '',
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
          alunoNome: usuario?.name ?? 'Aluno sem vínculo de usuário',
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
      !novaDataMatricula
    ) {
      erro(
        'Preencha aluno, nível, status, número de inscrição, ano letivo e data de matrícula.',
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
        modalidade: novaModalidade || 'Orientação de Estudos',
        ano_letivo: ano,
        data_matricula: novaDataMatricula,
        data_conclusao: novaDataConclusao || null,
        id_turma: novoTurmaId === '' ? null : (novoTurmaId as number),
      }

      const { error: insertError } = await supabase
        .from('matriculas')
        .insert(payload)

      if (insertError) {
        console.error(insertError)
        erro('Erro ao salvar matrícula.')
        return
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
          m.statusNome.toLowerCase().includes(termo)
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
            Acompanhe as matrículas por ano letivo, nível de ensino e status.
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
            placeholder="Buscar por aluno, número de matrícula, turma, nível ou status..."
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

      {/* Conteúdo */}
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
                          sx={{
                            bgcolor: alpha(
                              theme.palette.primary.main,
                              0.1,
                            ),
                            color: theme.palette.primary.main,
                          }}
                        >
                          <GroupIcon fontSize="small" />
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
                          >
                            Matrícula: {m.numeroInscricao}
                          </Typography>
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Modalidade: {m.modalidade}
                        </Typography>
                      </Stack>
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
                    Matrícula
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
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: alpha(
                                theme.palette.primary.main,
                                0.12,
                              ),
                              color: theme.palette.primary.main,
                            }}
                          >
                            <AssignmentIndIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                            >
                              {m.alunoNome}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {m.numeroInscricao}
                        </Typography>
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
                          <Tooltip title="Ver detalhes">
                            <span>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => {
                                  // futuro: abrir detalhes da matrícula
                                }}
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
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: alpha(
                              theme.palette.primary.main,
                              0.12,
                            ),
                            color: theme.palette.primary.main,
                            fontSize: 12,
                          }}
                        >
                          {aluno.nome.charAt(0).toUpperCase()}
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

              <TextField
                fullWidth
                size="small"
                label="Modalidade"
                value={novaModalidade}
                onChange={(e) => setNovaModalidade(e.target.value)}
                disabled={salvandoNova}
              />
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
    </Box>
  )
}

export default SecretariaMatriculasPage
