// frontend/src/paginas/painel-secretaria/SecretariaSalasPage.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material'
import { green } from '@mui/material/colors'

import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import DoorFrontIcon from '@mui/icons-material/DoorFront'
import PeopleIcon from '@mui/icons-material/People'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

// --- INTERFACES ---
interface SalaRow {
  id_sala: number
  nome: string
  descricao: string | null
  tipo_sala: string
  is_ativa: boolean
  created_at: string
}

interface ProfessorSalaRow {
  id_professor: number
  id_sala: number
  data_inicio: string | null
  data_fim: string | null
  ativo: boolean
}

interface SalaConfigRow {
  id_sala: number
  id_config: number
}

interface ConfigDisciplinaAno {
  id_config: number
  id_disciplina: number
  id_ano_escolar: number
  quantidade_protocolos: number
}

interface DisciplinaRow {
  id_disciplina: number
  nome_disciplina: string
  id_area_conhecimento: number | null
}

interface AreaConhecimentoRow {
  id_area_conhecimento: number
  nome_area: string
}

const SecretariaSalasPage: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { sucesso, aviso, erro } = useNotificacaoContext()

  // --- ESTADOS ---
  const [salas, setSalas] = useState<SalaRow[]>([])
  const [professoresSalas, setProfessoresSalas] = useState<ProfessorSalaRow[]>([])
  const [salasConfigs, setSalasConfigs] = useState<SalaConfigRow[]>([])
  const [configuracoes, setConfiguracoes] = useState<ConfigDisciplinaAno[]>([])
  const [disciplinas, setDisciplinas] = useState<DisciplinaRow[]>([])
  const [areas, setAreas] = useState<AreaConhecimentoRow[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)

  const [busca, setBusca] = useState<string>('')
  const [filtroStatus, setFiltroStatus] = useState<string>('') // '', 'ATIVAS', 'INATIVAS'

  const [dialogAberto, setDialogAberto] = useState<boolean>(false)
  const [editando, setEditando] = useState<SalaRow | null>(null)
  const [formNome, setFormNome] = useState<string>('')
  const [formDescricao, setFormDescricao] = useState<string>('')
  const [formAtiva, setFormAtiva] = useState<boolean>(true)

  // disciplinas selecionadas na modal (IDs numéricos)
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([])
  const [filtroAreaModal, setFiltroAreaModal] = useState<string>('')

  const [salvando, setSalvando] = useState<boolean>(false)

  // paginação da lista de salas
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // --- CARREGAMENTO ---
  const carregarDados = async () => {
    if (!supabase) return
    try {
      setCarregando(true)

      const [
        { data: salasData, error: salasError },
        { data: profSalasData, error: profSalasError },
        { data: salasConfigsData, error: salasConfigsError },
        { data: configsData, error: configsError },
        { data: disciplinasData, error: disciplinasError },
        { data: areasData, error: areasError },
      ] = await Promise.all([
        supabase
          .from('salas_atendimento')
          .select('id_sala, nome, descricao, tipo_sala, is_ativa, created_at')
          .order('nome', { ascending: true }),
        supabase
          .from('professores_salas')
          .select('id_professor, id_sala, data_inicio, data_fim, ativo'),
        supabase
          .from('salas_config_disciplina_ano')
          .select('id_sala, id_config'),
        supabase
          .from('config_disciplina_ano')
          .select('id_config, id_disciplina, id_ano_escolar, quantidade_protocolos'),
        supabase
          .from('disciplinas')
          .select('id_disciplina, nome_disciplina, id_area_conhecimento')
          .order('nome_disciplina', { ascending: true }),
        supabase
          .from('areas_conhecimento')
          .select('id_area_conhecimento, nome_area')
          .order('nome_area', { ascending: true }),
      ])

      if (salasError) erro('Não foi possível carregar as salas.')
      else if (salasData) setSalas(salasData as SalaRow[])

      if (profSalasError) erro('Não foi possível carregar professores.')
      else if (profSalasData) setProfessoresSalas(profSalasData as ProfessorSalaRow[])

      if (salasConfigsError) erro('Não foi possível carregar vínculos.')
      else if (salasConfigsData) setSalasConfigs(salasConfigsData as SalaConfigRow[])

      if (configsError) erro('Não foi possível carregar configurações.')
      else if (configsData) setConfiguracoes(configsData as ConfigDisciplinaAno[])

      if (disciplinasError) erro('Não foi possível carregar disciplinas.')
      else if (disciplinasData) setDisciplinas(disciplinasData as DisciplinaRow[])

      if (areasError) erro('Não foi possível carregar áreas.')
      else if (areasData) setAreas(areasData as AreaConhecimentoRow[])
    } catch (e) {
      console.error(e)
      erro('Ocorreu um erro técnico.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  // --- HANDLERS ---
  const limparFormulario = () => {
    setEditando(null)
    setFormNome('')
    setFormDescricao('')
    setFormAtiva(true)
    setDisciplinasSelecionadas([])
    setFiltroAreaModal('')
  }

  const abrirDialogNova = () => {
    limparFormulario()
    setDialogAberto(true)
  }

  const abrirDialogEdicao = (sala: SalaRow) => {
    setEditando(sala)
    setFormNome(sala.nome)
    setFormDescricao(sala.descricao ?? '')
    setFormAtiva(sala.is_ativa)

    // descobrir quais disciplinas já estão vinculadas a essa sala
    const configsSala = salasConfigs.filter((sc) => sc.id_sala === sala.id_sala)
    const configIdsSala = new Set(configsSala.map((sc) => sc.id_config))
    const disciplinasIds = new Set(
      configuracoes
        .filter((cfg) => configIdsSala.has(cfg.id_config))
        .map((cfg) => cfg.id_disciplina),
    )
    setDisciplinasSelecionadas(Array.from(disciplinasIds))
    setFiltroAreaModal('')
    setDialogAberto(true)
  }

  const fecharDialog = () => {
    if (salvando) return
    setDialogAberto(false)
  }

  const getQtdProfessoresSala = (idSala: number): number => {
    return professoresSalas.filter((ps) => ps.id_sala === idSala && ps.ativo).length
  }

  const getQtdConfigsSala = (idSala: number): number => {
    return salasConfigs.filter((sc) => sc.id_sala === idSala).length
  }

  const salasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return salas.filter((sala) => {
      const matchTexto =
        termo === '' ||
        sala.nome.toLowerCase().includes(termo) ||
        (sala.descricao ?? '').toLowerCase().includes(termo) ||
        (sala.tipo_sala ?? '').toLowerCase().includes(termo)

      let matchStatus = true
      if (filtroStatus === 'ATIVAS') {
        matchStatus = sala.is_ativa
      } else if (filtroStatus === 'INATIVAS') {
        matchStatus = !sala.is_ativa
      }

      return matchTexto && matchStatus
    })
  }, [salas, busca, filtroStatus])

  useEffect(() => {
    setPage(0)
  }, [busca, filtroStatus])

  const totalSalas = salas.length
  const totalSalasAtivas = salas.filter((s) => s.is_ativa).length
  const totalProfessoresAtivos = useMemo(() => {
    const setIds = new Set<number>()
    professoresSalas.forEach((ps) => {
      if (ps.ativo) setIds.add(ps.id_professor)
    })
    return setIds.size
  }, [professoresSalas])
  const totalConfigsVinculadas = salasConfigs.length

  const handleToggleDisciplinaSelecionada = (idDisciplina: number, checked: boolean) => {
    setDisciplinasSelecionadas((prev) => {
      if (checked) {
        if (prev.includes(idDisciplina)) return prev
        return [...prev, idDisciplina]
      }
      return prev.filter((id) => id !== idDisciplina)
    })
  }

  const disciplinasFiltradasModal = useMemo(() => {
    const filtroAreaId = filtroAreaModal ? Number(filtroAreaModal) : null
    return disciplinas.filter((d) => {
      if (filtroAreaId && d.id_area_conhecimento !== filtroAreaId) return false
      return true
    })
  }, [disciplinas, filtroAreaModal])

  const syncDisciplinasSala = async (idSala: number) => {
    if (!supabase) return

    const targetConfigs = configuracoes.filter((cfg) =>
      disciplinasSelecionadas.includes(cfg.id_disciplina),
    )
    const targetConfigIds = new Set(targetConfigs.map((c) => c.id_config))

    const atuais = salasConfigs.filter((sc) => sc.id_sala === idSala)
    const atuaisIds = new Set(atuais.map((sc) => sc.id_config))

    const idsParaAdicionar: number[] = []
    targetConfigIds.forEach((id) => {
      if (!atuaisIds.has(id)) idsParaAdicionar.push(id)
    })

    const idsParaRemover: number[] = []
    atuaisIds.forEach((id) => {
      if (!targetConfigIds.has(id)) idsParaRemover.push(id)
    })

    if (idsParaAdicionar.length > 0) {
      const registros = idsParaAdicionar.map((idConfig) => ({
        id_sala: idSala,
        id_config: idConfig,
      }))
      const { error } = await supabase
        .from('salas_config_disciplina_ano')
        .insert(registros)
      if (!error) setSalasConfigs((prev) => [...prev, ...registros])
    }

    if (idsParaRemover.length > 0) {
      const { error } = await supabase
        .from('salas_config_disciplina_ano')
        .delete()
        .eq('id_sala', idSala)
        .in('id_config', idsParaRemover)
      if (!error) {
        setSalasConfigs((prev) =>
          prev.filter(
            (sc) =>
              !(sc.id_sala === idSala && idsParaRemover.includes(sc.id_config)),
          ),
        )
      }
    }
  }

  const handleSalvar = async () => {
    if (!supabase) return
    const nome = formNome.trim()
    const descricao = formDescricao.trim()

    if (!nome) return aviso('Informe o nome da sala.')

    try {
      setSalvando(true)

      if (editando) {
        const { data, error } = await supabase
          .from('salas_atendimento')
          .update({ nome, descricao: descricao || null, is_ativa: formAtiva })
          .eq('id_sala', editando.id_sala)
          .select()
          .single()

        if (error) throw error
        if (data) {
          const salaAtualizada = data as SalaRow
          setSalas((prev) =>
            prev.map((s) =>
              s.id_sala === salaAtualizada.id_sala ? salaAtualizada : s,
            ),
          )
          await syncDisciplinasSala(salaAtualizada.id_sala)
          sucesso(`Sala atualizada com sucesso.`)
        }
      } else {
        const { data, error } = await supabase
          .from('salas_atendimento')
          .insert({ nome, descricao: descricao || null, is_ativa: formAtiva })
          .select()
          .single()

        if (error) throw error
        if (data) {
          const novaSala = data as SalaRow
          setSalas((prev) => [...prev, novaSala])
          await syncDisciplinasSala(novaSala.id_sala)
          sucesso(`Sala cadastrada com sucesso.`)
        }
      }
      setDialogAberto(false)
      limparFormulario()
    } catch (e) {
      console.error(e)
      erro('Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (sala: SalaRow) => {
    if (!supabase) return
    try {
      setSalvando(true)
      await supabase.from('professores_salas').delete().eq('id_sala', sala.id_sala)
      await supabase
        .from('salas_config_disciplina_ano')
        .delete()
        .eq('id_sala', sala.id_sala)
      const { error: salaError } = await supabase
        .from('salas_atendimento')
        .delete()
        .eq('id_sala', sala.id_sala)

      if (salaError) throw salaError

      setSalas((prev) => prev.filter((s) => s.id_sala !== sala.id_sala))
      setProfessoresSalas((prev) =>
        prev.filter((ps) => ps.id_sala !== sala.id_sala),
      )
      setSalasConfigs((prev) =>
        prev.filter((sc) => sc.id_sala !== sala.id_sala),
      )

      sucesso(`Sala excluída com sucesso.`)
    } catch (e) {
      erro('Erro ao excluir sala.')
    } finally {
      setSalvando(false)
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const salasPaginadas = useMemo(
    () =>
      salasFiltradas.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [salasFiltradas, page, rowsPerPage],
  )

  // --- ESTILOS VISUAIS ---
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

  return (
    // [FIX] Proteção contra corte lateral no mobile
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* --- CABEÇALHO --- */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                p: 0.5,
                borderRadius: 1,
                display: 'flex',
              }}
            >
              <MeetingRoomIcon fontSize="small" />
            </Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Salas de Atendimento
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Gerencie espaços e vincule disciplinas.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirDialogNova}
          sx={{ fontWeight: 'bold', borderRadius: 2 }}
          disableElevation
        >
          Nova Sala
        </Button>
      </Stack>

      {/* --- CARDS DE ESTATÍSTICA (GRID RESPONSIVO) --- */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          {
            icon: <DoorFrontIcon />,
            label: 'Total de Salas',
            val: totalSalas,
            color: 'primary.main',
            bg: alpha(theme.palette.primary.main, 0.1),
          },
          {
            icon: <CheckCircleIcon />,
            label: 'Salas Ativas',
            val: totalSalasAtivas,
            color: 'success.main',
            bg: alpha(theme.palette.success.main, 0.1),
          },
          {
            icon: <PeopleIcon />,
            label: 'Professores Lotados',
            val: totalProfessoresAtivos,
            color: 'info.main',
            bg: alpha(theme.palette.info.main, 0.1),
          },
          {
            icon: <MenuBookIcon />,
            label: 'Vínculos Ativos',
            val: totalConfigsVinculadas,
            color: 'warning.main',
            bg: alpha(theme.palette.warning.main, 0.1),
          },
        ].map((stat, idx) => (
          <Paper
            key={idx}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: `1px solid ${cardBorderColor}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: stat.bg,
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {stat.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1 }}>
                {stat.val}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={500}
                noWrap
              >
                {stat.label}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* --- FILTROS --- */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          bgcolor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            size="small"
            placeholder="Buscar sala..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            fullWidth
          />
          <FormControl size="small" sx={{ minWidth: { md: 200 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filtroStatus}
              label="Status"
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ATIVAS">Ativas</MenuItem>
              <MenuItem value="INATIVAS">Inativas</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* --- LISTAGEM DE DADOS --- */}
      {carregando ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {isMobile ? (
            /* --- MODO MOBILE: CARDS ESTILIZADOS --- */
            <Stack spacing={2}>
              {salasPaginadas.map((sala) => {
                const qtdProf = getQtdProfessoresSala(sala.id_sala)
                const qtdConfigs = getQtdConfigsSala(sala.id_sala)

                return (
                  <Paper
                    key={sala.id_sala}
                    elevation={2}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      // Borda lateral Verde (Ativa) ou Cinza (Inativa)
                      borderLeft: `5px solid ${
                        sala.is_ativa
                          ? theme.palette.success.main
                          : theme.palette.grey[400]
                      }`,
                      bgcolor: cardBgColor,
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                    >
                      {/* Conteúdo Principal Flexível */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{
                            wordBreak: 'break-word',
                            lineHeight: 1.3,
                            mb: 0.5,
                          }}
                        >
                          {sala.nome}
                        </Typography>
                        {sala.descricao && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            gutterBottom
                          >
                            {sala.descricao}
                          </Typography>
                        )}

                        <Stack
                          direction="row"
                          flexWrap="wrap"
                          gap={0.5}
                          sx={{ mt: 1 }}
                        >
                          <Chip
                            label={`${qtdProf} Prof.`}
                            size="small"
                            variant="outlined"
                            icon={<PeopleIcon style={{ fontSize: 14 }} />}
                          />
                          <Chip
                            label={`${qtdConfigs} Vínculos`}
                            size="small"
                            variant="outlined"
                            icon={<MenuBookIcon style={{ fontSize: 14 }} />}
                          />
                          {!sala.is_ativa && (
                            <Chip label="Inativa" size="small" color="default" />
                          )}
                        </Stack>
                      </Box>

                      {/* Ações Fixas */}
                      <Stack direction="column" spacing={0} sx={{ flexShrink: 0 }}>
                        <IconButton
                          size="small"
                          onClick={() => abrirDialogEdicao(sala)}
                        >
                          <EditIcon fontSize="small" color="action" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleExcluir(sala)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                )
              })}
              {salasPaginadas.length === 0 && (
                <Typography align="center" color="text.secondary">
                  Nenhuma sala encontrada.
                </Typography>
              )}
            </Stack>
          ) : (
            /* --- MODO DESKTOP: TABELA COM CABEÇALHO VERDE --- */
            <TableContainer
              component={Paper}
              elevation={0}
              variant="outlined"
              sx={{ borderRadius: 3, overflow: 'hidden' }}
            >
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: headerBgColor }}>
                    <TableCell
                      sx={{ fontWeight: 'bold', color: headerTextColor }}
                    >
                      Sala
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 'bold', color: headerTextColor }}
                    >
                      Tipo
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 'bold', color: headerTextColor }}
                    >
                      Professores
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 'bold', color: headerTextColor }}
                    >
                      Vínculos
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 'bold', color: headerTextColor }}
                    >
                      Status
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
                  {salasPaginadas.map((sala, index) => {
                    const qtdProf = getQtdProfessoresSala(sala.id_sala)
                    const qtdConfigs = getQtdConfigsSala(sala.id_sala)
                    const isEven = index % 2 === 0

                    return (
                      <TableRow
                        key={sala.id_sala}
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
                            color="text.primary"
                          >
                            {sala.nome}
                          </Typography>
                          {sala.descricao && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {sala.descricao}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{sala.tipo_sala || '—'}</TableCell>
                        <TableCell align="center">
                          <Chip label={qtdProf} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={qtdConfigs}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {sala.is_ativa ? (
                            <Chip
                              label="Ativa"
                              size="small"
                              color="success"
                              variant="outlined"
                              icon={<CheckCircleIcon />}
                            />
                          ) : (
                            <Chip
                              label="Inativa"
                              size="small"
                              color="default"
                              variant="outlined"
                              icon={<CancelIcon />}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            justifyContent="flex-end"
                            spacing={1}
                          >
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => abrirDialogEdicao(sala)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleExcluir(sala)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {salasPaginadas.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ py: 4, color: 'text.secondary' }}
                      >
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* --- PAGINAÇÃO PROTEGIDA --- */}
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          justifyContent: 'center',
          overflowX: 'auto',
        }}
      >
        <TablePagination
          component="div"
          count={salasFiltradas.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={isMobile ? '' : 'Linhas por pág.'}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Box>

      {/* --- DIALOG DE SALA --- */}
      <Dialog open={dialogAberto} onClose={fecharDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editando ? 'Editar Sala' : 'Nova Sala'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nome da Sala"
              fullWidth
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              autoFocus
            />
            <TextField
              label="Descrição (Opcional)"
              fullWidth
              multiline
              minRows={2}
              value={formDescricao}
              onChange={(e) => setFormDescricao(e.target.value)}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formAtiva}
                  onChange={(e) => setFormAtiva(e.target.checked)}
                />
              }
              label="Sala Ativa"
            />

            {/* SELEÇÃO DE DISCIPLINAS MELHORADA */}
            <Paper
              variant="outlined"
              sx={{ p: 2, bgcolor: alpha(theme.palette.action.hover, 0.1) }}
            >
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Vincular Disciplinas
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 2 }}
              >
                Selecione as disciplinas que serão atendidas nesta sala.
              </Typography>

              <FormControl
                size="small"
                fullWidth
                sx={{ mb: 2, bgcolor: 'background.paper' }}
              >
                <InputLabel>Filtrar por Área</InputLabel>
                <Select
                  value={filtroAreaModal}
                  label="Filtrar por Área"
                  onChange={(e) => setFiltroAreaModal(e.target.value)}
                >
                  <MenuItem value="">Todas as Áreas</MenuItem>
                  {areas.map((a) => (
                    <MenuItem
                      key={a.id_area_conhecimento}
                      value={String(a.id_area_conhecimento)}
                    >
                      {a.nome_area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* LISTA COM SCROLL E DESIGN LIMPO */}
              <Paper
                variant="outlined"
                sx={{
                  maxHeight: 300,
                  overflowY: 'auto',
                  bgcolor: 'background.paper',
                }}
              >
                {disciplinasFiltradasModal.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma disciplina encontrada.
                    </Typography>
                  </Box>
                ) : (
                  <Stack divider={<Divider flexItem />}>
                    {disciplinasFiltradasModal.map((disc) => {
                      const area = areas.find(
                        (a) =>
                          a.id_area_conhecimento === disc.id_area_conhecimento,
                      )
                      const isSelected = disciplinasSelecionadas.includes(
                        disc.id_disciplina,
                      )

                      return (
                        <Box
                          key={disc.id_disciplina}
                          onClick={() =>
                            handleToggleDisciplinaSelecionada(
                              disc.id_disciplina,
                              !isSelected,
                            )
                          }
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1.5,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' },
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            tabIndex={-1}
                            disableRipple
                            sx={{ mr: 1.5 }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {disc.nome_disciplina}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {area?.nome_area || 'Sem área vinculada'}
                            </Typography>
                          </Box>
                        </Box>
                      )
                    })}
                  </Stack>
                )}
              </Paper>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
        >
          <Button onClick={fecharDialog} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSalvar}
            disabled={salvando}
            disableElevation
          >
            {salvando ? 'Salvando...' : 'Salvar Dados'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SecretariaSalasPage
