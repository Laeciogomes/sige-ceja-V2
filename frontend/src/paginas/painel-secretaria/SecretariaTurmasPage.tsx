import {
  useEffect,
  useMemo,
  useState,
  type FC,
  type FormEvent,
  type ChangeEvent,
} from 'react'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
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
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material'
import { green } from '@mui/material/colors'
import { useNavigate } from 'react-router-dom'

import ClassIcon from '@mui/icons-material/Class'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GroupsIcon from '@mui/icons-material/Groups'
import SchoolIcon from '@mui/icons-material/School'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

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

type FiltroStatus = 'ativos' | 'inativos' | 'todos'

interface MapaQtdAlunos {
  [idTurma: number]: number
}

const SecretariaTurmasPage: FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()

  const { supabase } = useSupabase()
  const { sucesso, aviso, erro } = useNotificacaoContext()

  const [turmas, setTurmas] = useState<TurmaRow[]>([])
  const [niveis, setNiveis] = useState<NivelEnsinoRow[]>([])
  const [quantidadeAlunosPorTurma, setQuantidadeAlunosPorTurma] =
    useState<MapaQtdAlunos>({})
  const [carregando, setCarregando] = useState<boolean>(true)

  const [busca, setBusca] = useState<string>('')
  const [filtroNivel, setFiltroNivel] = useState<string>('')
  const [filtroAno, setFiltroAno] = useState<string>('')
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('ativos')

  const [dialogAberto, setDialogAberto] = useState<boolean>(false)
  const [editando, setEditando] = useState<TurmaRow | null>(null)
  const [formNome, setFormNome] = useState<string>('')
  const [formCodigo, setFormCodigo] = useState<string>('')
  const [formNivelId, setFormNivelId] = useState<string>('')
  const [formTurno, setFormTurno] = useState<string>('Multiturno')
  const [formAnoLetivo, setFormAnoLetivo] = useState<string>(
    new Date().getFullYear().toString(),
  )
  const [formAtiva, setFormAtiva] = useState<boolean>(true)
  const [salvando, setSalvando] = useState<boolean>(false)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Estado para modal de exclusão
  const [dialogExcluirAberto, setDialogExcluirAberto] =
    useState<boolean>(false)
  const [turmaParaExcluir, setTurmaParaExcluir] = useState<TurmaRow | null>(
    null,
  )

  const carregarDados = async () => {
    if (!supabase) return
    try {
      setCarregando(true)

      const [
        { data: turmasData, error: turmasError },
        { data: niveisData, error: niveisError },
        { data: matriculasData, error: matriculasError },
      ] = await Promise.all([
        supabase
          .from('turmas')
          .select(
            'id_turma, nome, codigo_turma, id_nivel_ensino, turno, ano_letivo, is_ativa',
          )
          .order('ano_letivo', { ascending: false })
          .order('nome', { ascending: true }),
        supabase
          .from('niveis_ensino')
          .select('id_nivel_ensino, nome')
          .order('id_nivel_ensino', { ascending: true }),
        supabase
          .from('matriculas')
          .select('id_turma, id_status_matricula')
          .not('id_turma', 'is', null),
      ])

      if (turmasError) {
        console.error(turmasError)
        erro('Erro ao carregar turmas.')
      } else if (turmasData) {
        setTurmas(turmasData as TurmaRow[])
      }

      if (niveisError) {
        console.error(niveisError)
        erro('Erro ao carregar níveis de ensino.')
      } else if (niveisData) {
        setNiveis(niveisData as NivelEnsinoRow[])
      }

      if (matriculasError) {
        console.error(matriculasError)
        erro('Erro ao carregar matrículas para contagem de alunos.')
      } else if (matriculasData) {
        const mapa: MapaQtdAlunos = {}
        for (const m of matriculasData as {
          id_turma: number | null
          id_status_matricula: number | null
        }[]) {
          if (m.id_turma == null) continue
          // só conta matrículas ativas (id_status_matricula = 1)
          if (m.id_status_matricula !== 1) continue
          mapa[m.id_turma] = (mapa[m.id_turma] ?? 0) + 1
        }
        setQuantidadeAlunosPorTurma(mapa)
      }
    } catch (e) {
      console.error(e)
      erro('Erro técnico ao carregar dados das turmas.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregarDados()
  }, [supabase])

  const limparFormulario = () => {
    setFormNome('')
    setFormCodigo('')
    setFormNivelId('')
    setFormTurno('Multiturno')
    setFormAnoLetivo(new Date().getFullYear().toString())
    setFormAtiva(true)
    setEditando(null)
  }

  const abrirDialogNovaTurma = () => {
    limparFormulario()
    setDialogAberto(true)
  }

  const abrirDialogEditarTurma = (turma: TurmaRow) => {
    setEditando(turma)
    setFormNome(turma.nome)
    setFormCodigo(turma.codigo_turma ?? '')
    setFormNivelId(String(turma.id_nivel_ensino))
    setFormTurno(turma.turno || 'Multiturno')
    setFormAnoLetivo(
      turma.ano_letivo
        ? String(turma.ano_letivo)
        : new Date().getFullYear().toString(),
    )
    setFormAtiva(turma.is_ativa !== false)
    setDialogAberto(true)
  }

  const fecharDialog = () => {
    if (salvando) return
    setDialogAberto(false)
  }

  const handleSalvarTurma = async (event?: FormEvent) => {
    if (event) event.preventDefault()
    if (!supabase) return

    const nome = formNome.trim()
    if (!nome) {
      aviso('Informe o nome da turma.')
      return
    }

    const nivelIdNumber = Number.parseInt(formNivelId, 10)
    if (!nivelIdNumber || Number.isNaN(nivelIdNumber)) {
      aviso('Selecione o nível de ensino.')
      return
    }

    const anoNumber = Number.parseInt(formAnoLetivo, 10)
    if (Number.isNaN(anoNumber) || anoNumber < 2000 || anoNumber > 2100) {
      aviso('Informe um ano letivo válido.')
      return
    }

    try {
      setSalvando(true)

      const payload = {
        nome,
        codigo_turma: formCodigo.trim() || null,
        id_nivel_ensino: nivelIdNumber,
        turno: formTurno || 'Multiturno',
        ano_letivo: anoNumber,
        is_ativa: formAtiva,
      }

      if (editando) {
        const { data, error } = await supabase
          .from('turmas')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id_turma', editando.id_turma)
          .select()
          .single()

        if (error) {
          console.error(error)
          erro('Erro ao atualizar turma.')
          return
        }

        if (data) {
          setTurmas((prev) =>
            prev.map((t) =>
              t.id_turma === editando.id_turma ? (data as TurmaRow) : t,
            ),
          )
          sucesso('Turma atualizada com sucesso!')
        }
      } else {
        const { data, error } = await supabase
          .from('turmas')
          .insert(payload)
          .select()
          .single()

        if (error) {
          console.error(error)
          const codigo = (error as any).code as string | undefined
          if (codigo === '42501') {
            erro(
              'Você não tem permissão para criar turmas. Fale com o administrador do sistema.',
            )
          } else {
            erro('Erro ao criar turma.')
          }
          return
        }

        if (data) {
          setTurmas((prev) => [...prev, data as TurmaRow])
          sucesso('Turma criada com sucesso!')
        }
      }

      setDialogAberto(false)
      limparFormulario()
    } catch (e) {
      console.error(e)
      erro('Erro ao salvar turma.')
    } finally {
      setSalvando(false)
    }
  }

  // Abre a modal de confirmação de exclusão
  const abrirDialogExcluirTurma = (turma: TurmaRow) => {
    setTurmaParaExcluir(turma)
    setDialogExcluirAberto(true)
  }

  const fecharDialogExcluirTurma = () => {
    if (salvando) return
    setDialogExcluirAberto(false)
    setTurmaParaExcluir(null)
  }

  // Executa a exclusão após confirmação na modal
  const handleConfirmarExclusaoTurma = async () => {
    if (!supabase || !turmaParaExcluir) return

    try {
      setSalvando(true)
      const { error } = await supabase
        .from('turmas')
        .delete()
        .eq('id_turma', turmaParaExcluir.id_turma)

      if (error) {
        console.error(error)
        const codigo = (error as any).code as string | undefined
        if (codigo === '23503') {
          erro(
            'Não é possível excluir uma turma que possui matrículas vinculadas.',
          )
        } else if (codigo === '42501') {
          erro(
            'Você não tem permissão para excluir turmas. Fale com o administrador do sistema.',
          )
        } else {
          erro('Erro ao excluir turma.')
        }
        return
      }

      setTurmas((prev) =>
        prev.filter((t) => t.id_turma !== turmaParaExcluir.id_turma),
      )
      setQuantidadeAlunosPorTurma((prev) => {
        const novo = { ...prev }
        delete novo[turmaParaExcluir.id_turma]
        return novo
      })
      sucesso('Turma excluída com sucesso.')
      setDialogExcluirAberto(false)
      setTurmaParaExcluir(null)
    } catch (e) {
      console.error(e)
      erro('Erro técnico ao excluir turma.')
    } finally {
      setSalvando(false)
    }
  }

  // Navegação para página de alunos da turma
  const handleVerAlunosTurma = (turma: TurmaRow) => {
    navigate(`/secretaria/turmas/${turma.id_turma}/alunos`, {
      state: { turmaId: turma.id_turma, turmaNome: turma.nome },
    })
  }

  const anosDisponiveis = useMemo(() => {
    const anos = Array.from(
      new Set(turmas.map((t) => t.ano_letivo)),
    ).filter((ano): ano is number => !!ano)
    return anos.sort((a, b) => b - a)
  }, [turmas])

  const getNomeNivel = (idNivel: number): string => {
    const nivel = niveis.find((n) => n.id_nivel_ensino === idNivel)
    return nivel ? nivel.nome : '—'
  }

  const turmasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return turmas.filter((turma) => {
      const textoBase = `${turma.nome ?? ''} ${
        turma.codigo_turma ?? ''
      } ${getNomeNivel(turma.id_nivel_ensino)} ${turma.turno ?? ''} ${
        turma.ano_letivo ?? ''
      }`.toLowerCase()

      const matchBusca = termo === '' || textoBase.includes(termo)
      const matchNivel =
        !filtroNivel || String(turma.id_nivel_ensino) === filtroNivel
      const matchAno =
        !filtroAno || String(turma.ano_letivo) === filtroAno
      const matchStatus =
        filtroStatus === 'todos'
          ? true
          : filtroStatus === 'ativos'
          ? turma.is_ativa !== false
          : turma.is_ativa === false

      return matchBusca && matchNivel && matchAno && matchStatus
    })
  }, [turmas, busca, filtroNivel, filtroAno, filtroStatus, niveis])

  useEffect(() => {
    setPage(0)
  }, [busca, filtroNivel, filtroAno, filtroStatus])

  const turmasPaginadas = useMemo(
    () =>
      turmasFiltradas.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [turmasFiltradas, page, rowsPerPage],
  )

  const totalTurmas = turmas.length
  const totalTurmasAtivas = turmas.filter(
    (t) => t.is_ativa !== false,
  ).length
  const totalAlunosAtivos = Object.values(quantidadeAlunosPorTurma).reduce(
    (acc, val) => acc + val,
    0,
  )

  const cardBorderColor = theme.palette.divider
  const cardBgColor = theme.palette.background.paper
  const zebraColor =
    theme.palette.mode === 'light'
      ? alpha(theme.palette.grey[400], 0.15)
      : alpha(theme.palette.common.white, 0.05)

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

  const handleLimparFiltros = () => {
    setBusca('')
    setFiltroNivel('')
    setFiltroAno('')
    setFiltroStatus('ativos')
  }

  const qtdAlunosTurmaSelecionada =
    turmaParaExcluir
      ? quantidadeAlunosPorTurma[turmaParaExcluir.id_turma] ?? 0
      : 0

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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Turmas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie as turmas do CEJA e acompanhe quantos alunos estão ativos. A mesma turma pode continuar por mais de um ano até o aluno concluir as disciplinas.
            em cada turma.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={abrirDialogNovaTurma}
        >
          Nova turma
        </Button>
      </Box>

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
            <ClassIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1 }}>
              {totalTurmas}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Turmas cadastradas
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
              {totalTurmasAtivas}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Turmas ativas
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
            <GroupsIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1 }}>
              {totalAlunosAtivos}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Alunos ativos em turmas
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, borderRadius: 2 }} elevation={0} variant="outlined">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            size="small"
            placeholder="Buscar por nome ou código da turma..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="filtro-nivel-label">Nível</InputLabel>
              <Select
                labelId="filtro-nivel-label"
                label="Nível"
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {niveis.map((nivel) => (
                  <MenuItem
                    key={nivel.id_nivel_ensino}
                    value={String(nivel.id_nivel_ensino)}
                  >
                    {nivel.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel id="filtro-ano-label">Ano de referência</InputLabel>
              <Select
                labelId="filtro-ano-label"
                label="Ano de referência"
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {anosDisponiveis.map((ano) => (
                  <MenuItem key={ano} value={String(ano)}>
                    {ano}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="filtro-status-label">Situação</InputLabel>
              <Select
                labelId="filtro-status-label"
                label="Situação"
                value={filtroStatus}
                onChange={(e) =>
                  setFiltroStatus(e.target.value as FiltroStatus)
                }
              >
                <MenuItem value="ativos">Ativas</MenuItem>
                <MenuItem value="inativos">Inativas</MenuItem>
                <MenuItem value="todos">Todas</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack
            direction={{ xs: 'row' }}
            spacing={1}
            justifyContent="flex-end"
            sx={{ width: { xs: '100%', md: 'auto' } }}
          >
            <Button variant="outlined" size="small" onClick={handleLimparFiltros}>
              Limpar filtros
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Lista de turmas */}
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
              // MOBILE: CARDS
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  {turmasFiltradas.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ py: 2 }}
                    >
                      Nenhuma turma encontrada com os filtros aplicados.
                    </Typography>
                  )}

                  {turmasFiltradas.map((turma) => {
                    const qtdAlunos =
                      quantidadeAlunosPorTurma[turma.id_turma] ?? 0
                    const isAtiva = turma.is_ativa !== false

                    return (
                      <Paper
                        key={turma.id_turma}
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          p: 2,
                          bgcolor: theme.palette.background.paper,
                        }}
                      >
                        <Stack spacing={1.5}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={2}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                sx={{ wordBreak: 'break-word' }}
                              >
                                {turma.nome}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                Código: {turma.codigo_turma || '—'}
                              </Typography>
                            </Box>
                            <Chip
                              label={isAtiva ? 'Ativa' : 'Inativa'}
                              size="small"
                              color={isAtiva ? 'success' : 'default'}
                              variant={isAtiva ? 'filled' : 'outlined'}
                            />
                          </Stack>

                          <Stack spacing={0.5}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Nível / Ano de referência
                            </Typography>
                            <Typography variant="body2">
                              {getNomeNivel(turma.id_nivel_ensino)} • Referência{' '}
                              {turma.ano_letivo}
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={2}>
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Turno
                              </Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <Chip
                                  label={turma.turno || 'Multiturno'}
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                />
                              </Box>
                            </Box>
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Alunos ativos
                              </Typography>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ mt: 0.5 }}
                              >
                                {qtdAlunos}{' '}
                                <Typography
                                  component="span"
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {qtdAlunos === 1 ? 'aluno' : 'alunos'}
                                </Typography>
                              </Typography>
                            </Box>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                            sx={{ pt: 1 }}
                          >
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleVerAlunosTurma(turma)}
                              startIcon={<GroupsIcon fontSize="small" />}
                            >
                              Alunos
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => abrirDialogEditarTurma(turma)}
                              startIcon={<EditIcon fontSize="small" />}
                            >
                              Editar
                            </Button>
                            <Button
                              size="small"
                              variant="text"
                              color="error"
                              onClick={() => abrirDialogExcluirTurma(turma)}
                              startIcon={<DeleteOutlineIcon fontSize="small" />}
                              disabled={salvando}
                            >
                              Excluir
                            </Button>
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
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Identificação
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Nível / Ano de referência
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Turno
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Alunos ativos
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Situação
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 'bold', color: headerTextColor }}
                      >
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {turmasPaginadas.map((turma, index) => {
                      const qtdAlunos =
                        quantidadeAlunosPorTurma[turma.id_turma] ?? 0
                      const isAtiva = turma.is_ativa !== false
                      const isEven = index % 2 === 0

                      return (
                        <TableRow
                          key={turma.id_turma}
                          hover
                          sx={{
                            bgcolor: isEven ? 'inherit' : zebraColor,
                            '&:hover': {
                              bgcolor: alpha(
                                theme.palette.primary.main,
                                0.08,
                              ),
                            },
                          }}
                        >
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{
                                wordBreak: 'break-word',
                                lineHeight: 1.3,
                                mb: 0.5,
                              }}
                            >
                              {turma.nome}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Código: {turma.codigo_turma || '—'}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Stack spacing={0.5}>
                              <Typography variant="body2">
                                {getNomeNivel(turma.id_nivel_ensino)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Referência {turma.ano_letivo}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={turma.turno || 'Multiturno'}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          </TableCell>

                          <TableCell>
                            <Stack spacing={0.25}>
                              <Typography variant="body2" fontWeight={600}>
                                {qtdAlunos}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                alunos ativos
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={isAtiva ? 'Ativa' : 'Inativa'}
                              size="small"
                              color={isAtiva ? 'success' : 'default'}
                              variant={isAtiva ? 'filled' : 'outlined'}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Stack
                              direction="row"
                              justifyContent="flex-end"
                              spacing={1}
                            >
                              <Tooltip title="Ver alunos da turma">
                                <span>
                                  <Button
                                    variant="text"
                                    size="small"
                                    onClick={() =>
                                      handleVerAlunosTurma(turma)
                                    }
                                    startIcon={<GroupsIcon fontSize="small" />}
                                  >
                                    Alunos
                                  </Button>
                                </span>
                              </Tooltip>
                              <Tooltip title="Editar">
                                <span>
                                  <Button
                                    variant="text"
                                    size="small"
                                    onClick={() =>
                                      abrirDialogEditarTurma(turma)
                                    }
                                    startIcon={<EditIcon fontSize="small" />}
                                  >
                                    Editar
                                  </Button>
                                </span>
                              </Tooltip>
                              <Tooltip title="Excluir">
                                <span>
                                  <Button
                                    variant="text"
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      abrirDialogExcluirTurma(turma)
                                    }
                                    startIcon={
                                      <DeleteOutlineIcon fontSize="small" />
                                    }
                                    disabled={salvando}
                                  >
                                    Excluir
                                  </Button>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      )
                    })}

                    {turmasPaginadas.length === 0 && !carregando && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Nenhuma turma encontrada com os filtros aplicados.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <TablePagination
                  component="div"
                  count={turmasFiltradas.length}
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

      {/* Modal de criar/editar turma */}
      <Dialog open={dialogAberto} onClose={fecharDialog} fullWidth maxWidth="sm">
        <form onSubmit={handleSalvarTurma}>
          <DialogTitle>{editando ? 'Editar turma' : 'Nova turma'}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2} mt={1}>
              <TextField
                label="Nome da turma"
                fullWidth
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                required
              />

              <TextField
                label="Código da turma (opcional)"
                fullWidth
                value={formCodigo}
                onChange={(e) => setFormCodigo(e.target.value)}
              />

              <FormControl fullWidth required>
                <InputLabel id="nivel-ensino-label">
                  Nível de ensino
                </InputLabel>
                <Select
                  labelId="nivel-ensino-label"
                  label="Nível de ensino"
                  value={formNivelId}
                  onChange={(e) => setFormNivelId(e.target.value)}
                >
                  {niveis.map((nivel) => (
                    <MenuItem
                      key={nivel.id_nivel_ensino}
                      value={String(nivel.id_nivel_ensino)}
                    >
                      {nivel.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="turno-label">Turno</InputLabel>
                  <Select
                    labelId="turno-label"
                    label="Turno"
                    value={formTurno}
                    onChange={(e) => setFormTurno(e.target.value)}
                  >
                    <MenuItem value="Manhã">Manhã</MenuItem>
                    <MenuItem value="Tarde">Tarde</MenuItem>
                    <MenuItem value="Noite">Noite</MenuItem>
                    <MenuItem value="Multiturno">Multiturno</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Ano de referência"
                  type="number"
                  fullWidth
                  value={formAnoLetivo}
                  onChange={(e) => setFormAnoLetivo(e.target.value)}
                  inputProps={{ min: 2000, max: 2100 }}
                  helperText="Campo de referência histórica. Não obriga abrir uma turma nova a cada ano."
                  required
                />
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={formAtiva}
                    onChange={(e) => setFormAtiva(e.target.checked)}
                    color="primary"
                  />
                }
                label="Turma ativa"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={fecharDialog} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog
        open={dialogExcluirAberto}
        onClose={fecharDialogExcluirTurma}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.error.main, 0.12),
                color: theme.palette.error.main,
              }}
            >
              <WarningAmberIcon />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Confirmar exclusão
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Esta ação não poderá ser desfeita.
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            Tem certeza de que deseja excluir a turma{' '}
            <strong>{turmaParaExcluir?.nome ?? 'selecionada'}</strong>?
          </Typography>

          {qtdAlunosTurmaSelecionada > 0 && (
            <Typography
              variant="body2"
              color="error"
              sx={{ fontWeight: 500 }}
            >
              Atenção: existem {qtdAlunosTurmaSelecionada}{' '}
              {qtdAlunosTurmaSelecionada === 1 ? 'aluno' : 'alunos'} com
              matrícula ativa vinculados a esta turma. A exclusão poderá falhar
              se houver vínculos no sistema.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={fecharDialogExcluirTurma} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmarExclusaoTurma}
            disabled={salvando}
          >
            {salvando ? 'Excluindo...' : 'Excluir turma'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SecretariaTurmasPage
