// frontend/src/paginas/painel-secretaria/SecretariaAreasConhecimentoPage.tsx
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

import CategoryIcon from '@mui/icons-material/Category'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import FilterListIcon from '@mui/icons-material/FilterList'

import { useSupabase } from '../../contextos/SupabaseContext'
import { useNotificacaoContext } from '../../contextos/NotificacaoContext'

interface AreaConhecimento {
  id_area_conhecimento: number
  nome_area: string
}

interface DisciplinaRow {
  id_disciplina: number
  nome_disciplina: string
  id_area_conhecimento: number | null
}

const SecretariaAreasConhecimentoPage: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { sucesso, aviso, erro } = useNotificacaoContext()

  const [areas, setAreas] = useState<AreaConhecimento[]>([])
  const [disciplinas, setDisciplinas] = useState<DisciplinaRow[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)

  const [busca, setBusca] = useState<string>('')
  const [filtroUso, setFiltroUso] = useState<string>('') // 'COM_DISCIPLINAS' | 'SEM_DISCIPLINAS' | ''

  const [dialogAberto, setDialogAberto] = useState<boolean>(false)
  const [editando, setEditando] = useState<AreaConhecimento | null>(null)
  const [formNome, setFormNome] = useState<string>('')
  const [salvando, setSalvando] = useState<boolean>(false)

  // paginação
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const carregarDados = async () => {
    if (!supabase) return
    try {
      setCarregando(true)

      const [{ data: areasData, error: areasError }, { data: disciplinasData, error: disciplinasError }] =
        await Promise.all([
          supabase
            .from('areas_conhecimento')
            .select('id_area_conhecimento, nome_area')
            .order('nome_area', { ascending: true }),
          supabase
            .from('disciplinas')
            .select('id_disciplina, nome_disciplina, id_area_conhecimento'),
        ])

      if (areasError) erro('Não foi possível carregar as áreas.')
      else if (areasData) setAreas(areasData as AreaConhecimento[])

      if (disciplinasError) erro('Não foi possível carregar as disciplinas.')
      else if (disciplinasData) setDisciplinas(disciplinasData as DisciplinaRow[])

    } catch (e) {
      console.error(e)
      erro('Ocorreu um erro ao carregar os dados.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const limparFormulario = () => {
    setEditando(null)
    setFormNome('')
  }

  const abrirDialogNova = () => {
    limparFormulario()
    setDialogAberto(true)
  }

  const abrirDialogEdicao = (area: AreaConhecimento) => {
    setEditando(area)
    setFormNome(area.nome_area)
    setDialogAberto(true)
  }

  const fecharDialog = () => {
    if (salvando) return
    setDialogAberto(false)
  }

  const getQtdDisciplinas = (idArea: number): number =>
    disciplinas.filter((d) => d.id_area_conhecimento === idArea).length

  const areasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return areas.filter((area) => {
      const qtd = getQtdDisciplinas(area.id_area_conhecimento)

      const matchNome = termo === '' || area.nome_area.toLowerCase().includes(termo)

      let matchUso = true
      if (filtroUso === 'COM_DISCIPLINAS') {
        matchUso = qtd > 0
      } else if (filtroUso === 'SEM_DISCIPLINAS') {
        matchUso = qtd === 0
      }

      return matchNome && matchUso
    })
  }, [areas, disciplinas, busca, filtroUso])

  useEffect(() => {
    setPage(0)
  }, [busca, filtroUso])

  const totalAreas = areas.length
  const areasComUsoSet = new Set(
    disciplinas.filter((d) => d.id_area_conhecimento != null).map((d) => d.id_area_conhecimento as number),
  )
  const areasComDisciplinas = areasComUsoSet.size
  const areasSemDisciplinas = totalAreas - areasComDisciplinas
  const totalDisciplinasVinculadas = disciplinas.filter((d) => d.id_area_conhecimento != null).length

  const handleSalvar = async () => {
    if (!supabase) return
    const nome = formNome.trim()
    if (!nome) return aviso('Informe o nome da área.', 'Campo obrigatório')

    try {
      setSalvando(true)

      if (editando) {
        const { data, error } = await supabase
          .from('areas_conhecimento')
          .update({ nome_area: nome })
          .eq('id_area_conhecimento', editando.id_area_conhecimento)
          .select()
          .single()

        if (error) throw error
        if (data) {
          setAreas((prev) => prev.map((a) => a.id_area_conhecimento === data.id_area_conhecimento ? data : a))
          sucesso(`Área atualizada com sucesso.`)
        }
      } else {
        const { data, error } = await supabase
          .from('areas_conhecimento')
          .insert({ nome_area: nome })
          .select()
          .single()

        if (error) throw error
        if (data) {
          setAreas((prev) => [...prev, data])
          sucesso(`Área cadastrada com sucesso.`)
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

  const handleExcluir = async (area: AreaConhecimento) => {
    if (!supabase) return
    const qtd = getQtdDisciplinas(area.id_area_conhecimento)
    if (qtd > 0) return aviso(`Não é possível excluir: existem ${qtd} disciplinas vinculadas.`)

    try {
      setSalvando(true)
      const { error } = await supabase
        .from('areas_conhecimento')
        .delete()
        .eq('id_area_conhecimento', area.id_area_conhecimento)

      if (error) throw error
      setAreas((prev) => prev.filter((a) => a.id_area_conhecimento !== area.id_area_conhecimento))
      sucesso(`Área excluída com sucesso.`)
    } catch (e) {
      erro('Erro ao excluir.')
    } finally {
      setSalvando(false)
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const areasPaginadas = useMemo(
    () => areasFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [areasFiltradas, page, rowsPerPage]
  )

  // --- CORES E ESTILOS ---
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
    // [FIX] Layout protegido contra cortes
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      width: '100%', 
      maxWidth: '100vw', 
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      
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
                display: 'flex'
              }}
            >
              <CategoryIcon fontSize="small" />
            </Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Áreas de Conhecimento
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Organize o currículo escolar agrupando disciplinas.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirDialogNova}
          sx={{ fontWeight: 'bold', borderRadius: 2 }}
          disableElevation
        >
          Nova Área
        </Button>
      </Stack>

      {/* --- CARDS DE ESTATÍSTICA --- */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { icon: <CategoryIcon />, label: 'Áreas Cadastradas', val: totalAreas, color: 'primary.main', bg: alpha(theme.palette.primary.main, 0.1) },
          { icon: <MenuBookIcon />, label: 'Disciplinas Vinculadas', val: totalDisciplinasVinculadas, color: 'success.main', bg: alpha(theme.palette.success.main, 0.1) },
          { icon: <FilterListIcon />, label: 'Áreas Vazias', val: areasSemDisciplinas, color: 'warning.main', bg: alpha(theme.palette.warning.main, 0.1) },
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
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
            fullWidth
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
            <InputLabel>Status de Uso</InputLabel>
            <Select
              label="Status de Uso"
              value={filtroUso}
              onChange={(e) => setFiltroUso(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="COM_DISCIPLINAS">Em Uso (Com Disciplinas)</MenuItem>
              <MenuItem value="SEM_DISCIPLINAS">Sem Uso (Vazias)</MenuItem>
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
          {/* MODO MOBILE: CARDS ESTILIZADOS */}
          {isMobile ? (
            <Stack spacing={2}>
              {areasPaginadas.map((area) => {
                const qtd = getQtdDisciplinas(area.id_area_conhecimento)
                const emUso = qtd > 0

                return (
                  <Paper
                    key={area.id_area_conhecimento}
                    elevation={2}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      // Borda lateral Azul (ativo) ou Laranja (vazio)
                      borderLeft: `5px solid ${emUso ? theme.palette.primary.main : theme.palette.warning.main}`,
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
                          {area.nome_area}
                        </Typography>
                        
                        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={0.5}>
                          <Chip 
                            label={`${qtd} Disciplina(s)`}
                            size="small"
                            color={emUso ? 'primary' : 'default'}
                            variant={emUso ? 'filled' : 'outlined'}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </Stack>
                      </Box>

                      {/* Ações Fixas */}
                      <Stack direction="column" spacing={0} sx={{ flexShrink: 0 }}>
                        <IconButton size="small" onClick={() => abrirDialogEdicao(area)}>
                          <EditIcon fontSize="small" color="action" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleExcluir(area)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                )
              })}
              {areasPaginadas.length === 0 && (
                <Typography align="center" color="text.secondary">Nenhuma área encontrada.</Typography>
              )}
            </Stack>
          ) : (
            // MODO DESKTOP: TABELA COM CABEÇALHO VERDE
            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ bgcolor: headerBgColor }}>
                    <TableCell sx={{ fontWeight: 'bold', color: headerTextColor }}>Área de Conhecimento</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: headerTextColor }}>Disciplinas Vinculadas</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: headerTextColor }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: headerTextColor }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {areasPaginadas.map((area, index) => {
                    const qtd = getQtdDisciplinas(area.id_area_conhecimento)
                    const emUso = qtd > 0
                    const isEven = index % 2 === 0
                    
                    return (
                      <TableRow 
                        key={area.id_area_conhecimento} 
                        sx={{ 
                          bgcolor: isEven ? 'inherit' : zebraColor,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {area.nome_area}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={qtd} 
                            size="small" 
                            variant="outlined" 
                            sx={{ minWidth: 40, fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography 
                            variant="caption" 
                            fontWeight={600}
                            color={emUso ? 'success.main' : 'text.secondary'}
                          >
                            {emUso ? 'Em Uso' : 'Vazia'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => abrirDialogEdicao(area)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton size="small" color="error" onClick={() => handleExcluir(area)}>
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {areasPaginadas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
          count={areasFiltradas.length}
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
          {editando ? 'Editar Área' : 'Nova Área'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nome da Área"
              fullWidth
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              placeholder="Ex: Ciências Humanas"
              autoFocus
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

export default SecretariaAreasConhecimentoPage