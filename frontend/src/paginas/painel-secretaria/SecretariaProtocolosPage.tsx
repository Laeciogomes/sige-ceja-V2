// frontend/src/paginas/painel-secretaria/SecretariaProtocolosPage.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
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
  TablePagination,
  TextField,
  Typography,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
} from '@mui/material'
import { green } from '@mui/material/colors'

import DescriptionIcon from '@mui/icons-material/Description'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import CategoryIcon from '@mui/icons-material/Category'
import SchoolIcon from '@mui/icons-material/School'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

// --- INTERFACES ---
interface AreaConhecimento {
  id_area_conhecimento: number
  nome_area: string
}

interface DisciplinaRow {
  id_disciplina: number
  nome_disciplina: string
  id_area_conhecimento: number | null
}

interface NivelEnsinoRow {
  id_nivel_ensino: number
  nome: string
}

interface AnoEscolarRow {
  id_ano_escolar: number
  nome_ano: string
  id_nivel_ensino: number
}

interface ConfigDisciplinaAno {
  id_config: number
  id_disciplina: number
  id_ano_escolar: number
  quantidade_protocolos: number
}

interface SalaConfigRow {
  id_sala: number
  id_config: number
}

const SecretariaProtocolosPage: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { sucesso, aviso, erro } = useNotificacaoContext()

  // --- ESTADOS ---
  const [areas, setAreas] = useState<AreaConhecimento[]>([])
  const [disciplinas, setDisciplinas] = useState<DisciplinaRow[]>([])
  const [niveis, setNiveis] = useState<NivelEnsinoRow[]>([])
  const [anos, setAnos] = useState<AnoEscolarRow[]>([])
  const [configs, setConfigs] = useState<ConfigDisciplinaAno[]>([])
  const [salasConfigs, setSalasConfigs] = useState<SalaConfigRow[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)

  const [busca, setBusca] = useState<string>('')
  const [filtroArea, setFiltroArea] = useState<string>('')
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>('')
  const [filtroNivel, setFiltroNivel] = useState<string>('')

  const [dialogAberto, setDialogAberto] = useState<boolean>(false)
  const [editando, setEditando] = useState<ConfigDisciplinaAno | null>(null)
  
  // Form States
  const [formAreaId, setFormAreaId] = useState<string>('')
  const [formDisciplinaId, setFormDisciplinaId] = useState<string>('')
  const [formNivelId, setFormNivelId] = useState<string>('')
  const [formAnoId, setFormAnoId] = useState<string>('')
  const [formQtd, setFormQtd] = useState<string>('1')
  const [salvando, setSalvando] = useState<boolean>(false)

  // Paginação
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // --- CARREGAMENTO ---
  const carregarDados = async () => {
    if (!supabase) return
    try {
      setCarregando(true)

      const [
        { data: areasData, error: areasError },
        { data: disciplinasData, error: disciplinasError },
        { data: niveisData, error: niveisError },
        { data: anosData, error: anosError },
        { data: configsData, error: configsError },
        { data: salasConfigsData, error: salasConfigsError },
      ] = await Promise.all([
        supabase.from('areas_conhecimento').select('id_area_conhecimento, nome_area').order('nome_area'),
        supabase.from('disciplinas').select('id_disciplina, nome_disciplina, id_area_conhecimento').order('nome_disciplina'),
        supabase.from('niveis_ensino').select('id_nivel_ensino, nome').order('nome'),
        supabase.from('anos_escolares').select('id_ano_escolar, nome_ano, id_nivel_ensino').order('id_nivel_ensino').order('nome_ano'),
        supabase.from('config_disciplina_ano').select('id_config, id_disciplina, id_ano_escolar, quantidade_protocolos'),
        supabase.from('salas_config_disciplina_ano').select('id_sala, id_config'),
      ])

      if (areasError) erro('Erro ao carregar áreas.')
      else if (areasData) setAreas(areasData)

      if (disciplinasError) erro('Erro ao carregar disciplinas.')
      else if (disciplinasData) setDisciplinas(disciplinasData)

      if (niveisError) erro('Erro ao carregar níveis.')
      else if (niveisData) setNiveis(niveisData)

      if (anosError) erro('Erro ao carregar anos.')
      else if (anosData) setAnos(anosData)

      if (configsError) erro('Erro ao carregar configurações.')
      else if (configsData) setConfigs(configsData)

      if (salasConfigsError) erro('Erro ao carregar vínculos de salas.')
      else if (salasConfigsData) setSalasConfigs(salasConfigsData)

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

  // --- HELPER FUNCTIONS ---
  const limparFormulario = () => {
    setEditando(null)
    setFormAreaId('')
    setFormDisciplinaId('')
    setFormNivelId('')
    setFormAnoId('')
    setFormQtd('1')
  }

  const abrirDialogNova = () => {
    limparFormulario()
    setDialogAberto(true)
  }

  const abrirDialogEdicao = (config: ConfigDisciplinaAno) => {
    setEditando(config)
    const disc = disciplinas.find((d) => d.id_disciplina === config.id_disciplina)
    const ano = anos.find((a) => a.id_ano_escolar === config.id_ano_escolar)
    const nivel = ano ? niveis.find((n) => n.id_nivel_ensino === ano.id_nivel_ensino) : null
    
    setFormAreaId(disc?.id_area_conhecimento ? String(disc.id_area_conhecimento) : '')
    setFormDisciplinaId(String(config.id_disciplina))
    setFormNivelId(nivel ? String(nivel.id_nivel_ensino) : '')
    setFormAnoId(String(config.id_ano_escolar))
    setFormQtd(String(config.quantidade_protocolos))
    setDialogAberto(true)
  }

  const fecharDialog = () => {
    if (salvando) return
    setDialogAberto(false)
  }

  const getAreaByDisciplina = (disc: DisciplinaRow | undefined | null) => {
    if (!disc || disc.id_area_conhecimento == null) return null
    return areas.find((a) => a.id_area_conhecimento === disc.id_area_conhecimento) || null
  }

  // --- DADOS ENRIQUECIDOS ---
  const configsEnriquecidas = useMemo(() => {
    return configs.map((cfg) => {
      const disc = disciplinas.find((d) => d.id_disciplina === cfg.id_disciplina)
      const ano = anos.find((a) => a.id_ano_escolar === cfg.id_ano_escolar)
      const nivel = ano ? niveis.find((n) => n.id_nivel_ensino === ano.id_nivel_ensino) : null
      const area = getAreaByDisciplina(disc)

      return {
        ...cfg,
        disciplinaNome: disc?.nome_disciplina ?? '—',
        areaId: area?.id_area_conhecimento ?? null,
        areaNome: area?.nome_area ?? 'Sem área',
        anoId: ano?.id_ano_escolar ?? null,
        anoNome: ano?.nome_ano ?? '—',
        nivelId: nivel?.id_nivel_ensino ?? null,
        nivelNome: nivel?.nome ?? '—',
      }
    })
  }, [configs, disciplinas, anos, niveis, areas])

  // --- FILTROS ---
  const configsFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return configsEnriquecidas.filter((cfg) => {
      const matchTexto =
        termo === '' ||
        cfg.disciplinaNome.toLowerCase().includes(termo) ||
        cfg.areaNome.toLowerCase().includes(termo) ||
        cfg.anoNome.toLowerCase().includes(termo) ||
        cfg.nivelNome.toLowerCase().includes(termo)

      let matchArea = true
      if (filtroArea) matchArea = cfg.areaId === Number(filtroArea)

      let matchDisciplina = true
      if (filtroDisciplina) matchDisciplina = cfg.id_disciplina === Number(filtroDisciplina)

      let matchNivel = true
      if (filtroNivel) matchNivel = cfg.nivelId === Number(filtroNivel)

      return matchTexto && matchArea && matchDisciplina && matchNivel
    })
  }, [configsEnriquecidas, busca, filtroArea, filtroDisciplina, filtroNivel])

  useEffect(() => {
    setPage(0)
  }, [busca, filtroArea, filtroDisciplina, filtroNivel])

  // --- PAGINAÇÃO ---
  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const configsPaginadas = useMemo(
    () => configsFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [configsFiltradas, page, rowsPerPage]
  )

  // --- CRUD HANDLERS ---
  const handleSalvar = async () => {
    if (!supabase) return
    const disciplinaId = Number(formDisciplinaId)
    const anoId = Number(formAnoId)
    const qtd = Number(formQtd)

    if (!disciplinaId) return aviso('Selecione a disciplina.')
    if (!anoId) return aviso('Selecione o ano escolar.')
    if (qtd < 0) return aviso('Quantidade inválida.')

    try {
      setSalvando(true)
      if (editando) {
        const { data, error } = await supabase
          .from('config_disciplina_ano')
          .update({ quantidade_protocolos: qtd })
          .eq('id_config', editando.id_config)
          .select()
          .single()

        if (error) throw error
        if (data) {
          setConfigs((prev) => prev.map((c) => c.id_config === data.id_config ? data : c))
          sucesso('Atualizado com sucesso.')
        }
      } else {
        const existente = configs.find(c => c.id_disciplina === disciplinaId && c.id_ano_escolar === anoId)
        if (existente) {
           setSalvando(false)
           return aviso('Já existe configuração para esta disciplina e ano.')
        }

        const { data, error } = await supabase
          .from('config_disciplina_ano')
          .insert({ id_disciplina: disciplinaId, id_ano_escolar: anoId, quantidade_protocolos: qtd })
          .select()
          .single()

        if (error) throw error
        if (data) {
          setConfigs((prev) => [...prev, data])
          sucesso('Cadastrado com sucesso.')
        }
      }
      fecharDialog()
      limparFormulario()
    } catch (e) {
      console.error(e)
      erro('Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (config: ConfigDisciplinaAno) => {
    if (!supabase) return
    const vinculadaSala = salasConfigs.some((sc) => sc.id_config === config.id_config)
    if (vinculadaSala) return aviso('Não é possível excluir: configuração em uso por sala.')

    try {
      setSalvando(true)
      const { error } = await supabase
        .from('config_disciplina_ano')
        .delete()
        .eq('id_config', config.id_config)

      if (error) throw error
      setConfigs((prev) => prev.filter((c) => c.id_config !== config.id_config))
      sucesso('Excluído com sucesso.')
    } catch (e) {
      erro('Erro ao excluir.')
    } finally {
      setSalvando(false)
    }
  }

  // Listas auxiliares para o form
  const disciplinasFiltradasForm = useMemo(() => {
    const areaId = formAreaId ? Number(formAreaId) : null
    return disciplinas.filter((d) => areaId ? d.id_area_conhecimento === areaId : true)
  }, [disciplinas, formAreaId])

  const anosFiltradosForm = useMemo(() => {
    const nivelId = formNivelId ? Number(formNivelId) : null
    return anos.filter((a) => nivelId ? a.id_nivel_ensino === nivelId : true)
  }, [anos, formNivelId])

  // --- ESTATÍSTICAS ---
  const totalConfiguracoes = configs.length
  const totalDisciplinasConfiguradas = new Set(configs.map((c) => c.id_disciplina)).size
  const totalProtocolos = configs.reduce((acc, cfg) => acc + (cfg.quantidade_protocolos || 0), 0)

  // --- ESTILOS VISUAIS ---
  const cardBorderColor = theme.palette.divider
  const cardBgColor = theme.palette.background.paper
  const zebraColor = theme.palette.mode === 'light' 
    ? alpha(theme.palette.grey[400], 0.15) 
    : alpha(theme.palette.common.white, 0.05)

  // Cores do Cabeçalho Verde
  const headerBgColor = theme.palette.mode === 'light'
    ? green[100] 
    : alpha(green[900], 0.4)
  const headerTextColor = theme.palette.mode === 'light'
    ? theme.palette.success.dark 
    : theme.palette.success.light

  return (
    // [FIX] Proteção contra corte lateral no mobile
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      width: '100%', 
      maxWidth: '100vw', 
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      {/* --- CABEÇALHO DA PÁGINA --- */}
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
                display: 'flex'
              }}
            >
              <DescriptionIcon fontSize="small" />
            </Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Protocolos
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Defina a carga de protocolos por disciplina e ano escolar.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirDialogNova}
          sx={{ fontWeight: 'bold', borderRadius: 2 }}
          disableElevation
        >
          Nova Configuração
        </Button>
      </Stack>

      {/* --- CARDS DE ESTATÍSTICA (GRID RESPONSIVO) --- */}
      <Box
        sx={{
          display: 'grid',
          // [FIX] minmax para evitar estouro
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { icon: <DescriptionIcon />, label: 'Configurações', val: totalConfiguracoes, color: 'primary.main', bg: alpha(theme.palette.primary.main, 0.1) },
          { icon: <MenuBookIcon />, label: 'Disciplinas Ativas', val: totalDisciplinasConfiguradas, color: 'success.main', bg: alpha(theme.palette.success.main, 0.1) },
          { icon: <CheckCircleIcon />, label: 'Total de Protocolos', val: totalProtocolos, color: 'warning.main', bg: alpha(theme.palette.warning.main, 0.1) },
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
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
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
                flexShrink: 0
              }}
            >
              {stat.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1 }}>
                {stat.val}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
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
        sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.5) }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            size="small"
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ minWidth: { md: '60%' } }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Área</InputLabel>
              <Select value={filtroArea} label="Área" onChange={(e) => setFiltroArea(e.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                {areas.map((a) => <MenuItem key={a.id_area_conhecimento} value={String(a.id_area_conhecimento)}>{a.nome_area}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Nível</InputLabel>
              <Select value={filtroNivel} label="Nível" onChange={(e) => setFiltroNivel(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {niveis.map((n) => <MenuItem key={n.id_nivel_ensino} value={String(n.id_nivel_ensino)}>{n.nome}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
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
              {configsPaginadas.map((cfg) => {
                const emUsoSala = salasConfigs.some((sc) => sc.id_config === cfg.id_config)
                const hasProtocolos = cfg.quantidade_protocolos > 0

                return (
                  <Paper
                    key={cfg.id_config}
                    elevation={2}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      // Borda lateral Azul (ativo) ou Laranja (zerado)
                      borderLeft: `5px solid ${hasProtocolos ? theme.palette.primary.main : theme.palette.warning.main}`,
                      bgcolor: cardBgColor,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      {/* Conteúdo Principal Flexível */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight={700}
                          sx={{ 
                            wordBreak: 'break-word',
                            lineHeight: 1.3,
                            mb: 0.5
                          }}
                        >
                          {cfg.disciplinaNome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                           {cfg.areaNome}
                        </Typography>

                        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                          <Chip 
                            icon={<SchoolIcon style={{ fontSize: 14 }} />}
                            label={`${cfg.nivelNome} • ${cfg.anoNome}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip 
                            label={`${cfg.quantidade_protocolos} un.`}
                            size="small"
                            color={hasProtocolos ? 'primary' : 'default'}
                            variant={hasProtocolos ? 'filled' : 'outlined'}
                          />
                          {emUsoSala && <Chip label="Em uso" size="small" color="success" variant="outlined" />}
                        </Stack>
                      </Box>

                      {/* Ações Fixas */}
                      <Stack direction="column" spacing={0} sx={{ flexShrink: 0 }}>
                        <IconButton size="small" onClick={() => abrirDialogEdicao(cfg)}>
                          <EditIcon fontSize="small" color="action" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleExcluir(cfg)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                )
              })}
              {configsPaginadas.length === 0 && <Typography align="center" color="text.secondary">Nada encontrado.</Typography>}
            </Stack>
          ) : (
            /* --- MODO DESKTOP: TABELA COM CABEÇALHO VERDE --- */
            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Table size="medium">
                <TableHead>
                   {/* Linha com fundo VERDE */}
                  <TableRow sx={{ bgcolor: headerBgColor }}>
                    <TableCell sx={{ fontWeight: 'bold', color: headerTextColor }}>Disciplina</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: headerTextColor }}>Área</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: headerTextColor }}>Nível & Ano</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: headerTextColor }}>Protocolos</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: headerTextColor }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: headerTextColor }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {configsPaginadas.map((cfg, index) => {
                    const emUsoSala = salasConfigs.some((sc) => sc.id_config === cfg.id_config)
                    const isEven = index % 2 === 0
                    
                    return (
                      <TableRow 
                        key={cfg.id_config} 
                        sx={{ 
                           bgcolor: isEven ? 'inherit' : zebraColor,
                           '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                        }}
                      >
                        <TableCell>
                           <Typography variant="body2" fontWeight={600} color="text.primary">
                             {cfg.disciplinaNome}
                           </Typography>
                        </TableCell>
                        <TableCell>
                           <Typography variant="caption" sx={{ bgcolor: alpha(theme.palette.grey[500], 0.1), p: 0.5, borderRadius: 1 }}>
                             {cfg.areaNome}
                           </Typography>
                        </TableCell>
                        <TableCell>
                           <Typography variant="body2">
                             {cfg.nivelNome} - <b>{cfg.anoNome}</b>
                           </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={cfg.quantidade_protocolos} 
                            size="small" 
                            color={cfg.quantidade_protocolos > 0 ? 'primary' : 'default'}
                            variant={cfg.quantidade_protocolos > 0 ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 'bold', minWidth: 30 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {emUsoSala ? (
                            <Chip label="Em Sala" size="small" color="success" variant="outlined" icon={<CheckCircleIcon />} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">Disponível</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => abrirDialogEdicao(cfg)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton size="small" color="error" onClick={() => handleExcluir(cfg)}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {configsPaginadas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <TablePagination
          component="div"
          count={configsFiltradas.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={isMobile ? '' : 'Linhas por pág.'}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Box>

      {/* --- DIALOG --- */}
      <Dialog open={dialogAberto} onClose={fecharDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editando ? 'Editar Configuração' : 'Nova Configuração'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            
            {/* Seletor de Área (apenas filtro) */}
            <FormControl fullWidth>
              <InputLabel>Filtrar Disciplinas por Área</InputLabel>
              <Select
                label="Filtrar Disciplinas por Área"
                value={formAreaId}
                onChange={(e) => {
                  setFormAreaId(e.target.value)
                  if (!editando) setFormDisciplinaId('')
                }}
                disabled={!!editando}
              >
                <MenuItem value=""><em>Todas as áreas</em></MenuItem>
                {areas.map((a) => (
                  <MenuItem key={a.id_area_conhecimento} value={String(a.id_area_conhecimento)}>
                    {a.nome_area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Disciplina</InputLabel>
              <Select
                label="Disciplina"
                value={formDisciplinaId}
                onChange={(e) => setFormDisciplinaId(e.target.value)}
                disabled={!!editando}
              >
                {disciplinasFiltradasForm.map((d) => (
                  <MenuItem key={d.id_disciplina} value={String(d.id_disciplina)}>
                    {d.nome_disciplina}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Nível</InputLabel>
                <Select
                  label="Nível"
                  value={formNivelId}
                  onChange={(e) => {
                    setFormNivelId(e.target.value)
                    setFormAnoId('')
                  }}
                  disabled={!!editando}
                >
                  {niveis.map((n) => (
                    <MenuItem key={n.id_nivel_ensino} value={String(n.id_nivel_ensino)}>
                      {n.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Ano Escolar</InputLabel>
                <Select
                  label="Ano Escolar"
                  value={formAnoId}
                  onChange={(e) => setFormAnoId(e.target.value)}
                  disabled={!formNivelId || !!editando}
                >
                  {anosFiltradosForm.map((a) => (
                    <MenuItem key={a.id_ano_escolar} value={String(a.id_ano_escolar)}>
                      {a.nome_ano}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Quantidade de Protocolos"
              type="number"
              fullWidth
              inputProps={{ min: 0 }}
              value={formQtd}
              onChange={(e) => setFormQtd(e.target.value)}
              helperText="Define a carga de avaliações para esta turma."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={fecharDialog} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={handleSalvar} disabled={salvando} disableElevation>
            {salvando ? 'Salvando...' : 'Salvar Dados'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SecretariaProtocolosPage