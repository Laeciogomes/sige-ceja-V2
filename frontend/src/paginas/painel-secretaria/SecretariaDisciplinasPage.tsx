// frontend/src/paginas/painel-secretaria/SecretariaDisciplinasPage.tsx
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
import { green } from '@mui/material/colors' // Importação essencial para as cores

import MenuBookIcon from '@mui/icons-material/MenuBook'
import CategoryIcon from '@mui/icons-material/Category'
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

const SecretariaDisciplinasPage: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { supabase } = useSupabase()
  const { sucesso, aviso, erro } = useNotificacaoContext()

  const [areas, setAreas] = useState<AreaConhecimento[]>([])
  const [disciplinas, setDisciplinas] = useState<DisciplinaRow[]>([])
  const [carregando, setCarregando] = useState<boolean>(true)

  const [busca, setBusca] = useState<string>('')
  const [filtroArea, setFiltroArea] = useState<string>('')

  const [dialogAberto, setDialogAberto] = useState<boolean>(false)
  const [editando, setEditando] = useState<DisciplinaRow | null>(null)
  const [formNome, setFormNome] = useState<string>('')
  const [formAreaId, setFormAreaId] = useState<string>('')
  const [salvando, setSalvando] = useState<boolean>(false)

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // -- CARREGAMENTO DE DADOS --
  const carregarDados = async () => {
    if (!supabase) return
    try {
      setCarregando(true)
      const [
        { data: areasData, error: areasError },
        { data: disciplinasData, error: disciplinasError },
      ] = await Promise.all([
        supabase
          .from('areas_conhecimento')
          .select('id_area_conhecimento, nome_area')
          .order('nome_area', { ascending: true }),
        supabase
          .from('disciplinas')
          .select('id_disciplina, nome_disciplina, id_area_conhecimento')
          .order('nome_disciplina', { ascending: true }),
      ])

      if (areasError) erro('Erro ao carregar áreas.')
      else if (areasData) setAreas(areasData as AreaConhecimento[])

      if (disciplinasError) erro('Erro ao carregar disciplinas.')
      else if (disciplinasData) setDisciplinas(disciplinasData as DisciplinaRow[])
    } catch (e) {
      console.error(e)
      erro('Erro técnico ao carregar dados.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  // -- HANDLERS DE FORMULÁRIO --
  const limparFormulario = () => {
    setEditando(null)
    setFormNome('')
    setFormAreaId('')
  }

  const abrirDialogNova = () => {
    limparFormulario()
    setDialogAberto(true)
  }

  const abrirDialogEdicao = (disciplina: DisciplinaRow) => {
    setEditando(disciplina)
    setFormNome(disciplina.nome_disciplina)
    setFormAreaId(disciplina.id_area_conhecimento ? String(disciplina.id_area_conhecimento) : '')
    setDialogAberto(true)
  }

  const fecharDialog = () => {
    if (salvando) return
    setDialogAberto(false)
  }

  const handleSalvar = async () => {
    if (!supabase) return
    const nome = formNome.trim()
    if (!nome) {
      aviso('O nome é obrigatório.')
      return
    }
    const areaIdNumber = formAreaId ? Number(formAreaId) : null

    try {
      setSalvando(true)
      if (editando) {
        const { data, error } = await supabase
          .from('disciplinas')
          .update({ nome_disciplina: nome, id_area_conhecimento: areaIdNumber })
          .eq('id_disciplina', editando.id_disciplina)
          .select()
          .single()

        if (error) throw error
        if (data) {
          setDisciplinas((prev) => prev.map((d) => (d.id_disciplina === data.id_disciplina ? data : d)))
          sucesso('Disciplina atualizada!')
        }
      } else {
        const { data, error } = await supabase
          .from('disciplinas')
          .insert({ nome_disciplina: nome, id_area_conhecimento: areaIdNumber })
          .select()
          .single()

        if (error) throw error
        if (data) {
          setDisciplinas((prev) => [...prev, data])
          sucesso('Disciplina cadastrada!')
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

  const handleExcluir = async (disciplina: DisciplinaRow) => {
    if (!supabase) return
    try {
      setSalvando(true)
      const { error } = await supabase
        .from('disciplinas')
        .delete()
        .eq('id_disciplina', disciplina.id_disciplina)

      if (error) {
        erro('Não foi possível excluir. Verifique vínculos.')
        return
      }
      setDisciplinas((prev) => prev.filter((d) => d.id_disciplina !== disciplina.id_disciplina))
      sucesso('Excluída com sucesso.')
    } catch (e) {
      erro('Erro ao excluir.')
    } finally {
      setSalvando(false)
    }
  }

  // -- FILTROS E PAGINAÇÃO --
  const getNomeArea = (idArea: number | null): string => {
    if (!idArea) return '—'
    const area = areas.find((a) => a.id_area_conhecimento === idArea)
    return area ? area.nome_area : '—'
  }

  const disciplinasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return disciplinas.filter((disciplina) => {
      const nomeArea = getNomeArea(disciplina.id_area_conhecimento)
      const matchNome =
        termo === '' ||
        disciplina.nome_disciplina.toLowerCase().includes(termo) ||
        nomeArea.toLowerCase().includes(termo)
      
      let matchArea = true
      if (filtroArea === 'COM_AREA') matchArea = !!disciplina.id_area_conhecimento
      else if (filtroArea === 'SEM_AREA') matchArea = !disciplina.id_area_conhecimento
      else if (filtroArea !== '') matchArea = String(disciplina.id_area_conhecimento ?? '') === filtroArea

      return matchNome && matchArea
    })
  }, [disciplinas, areas, busca, filtroArea])

  useEffect(() => setPage(0), [busca, filtroArea])

  const handleChangePage = (_e: unknown, newPage: number) => setPage(newPage)
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10))
    setPage(0)
  }

  const disciplinasPaginadas = useMemo(
    () => disciplinasFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [disciplinasFiltradas, page, rowsPerPage]
  )

  const totalDisciplinas = disciplinas.length
  const totalAreas = areas.length
  const disciplinasSemArea = disciplinas.filter((d) => !d.id_area_conhecimento).length

  // -- CORES E ESTILOS --
  const cardBorderColor = theme.palette.divider
  const cardBgColor = theme.palette.background.paper
  
  // Cor das linhas "zebradas"
  const zebraColor = theme.palette.mode === 'light' 
    ? alpha(theme.palette.grey[400], 0.15) 
    : alpha(theme.palette.common.white, 0.05)

  // DEFINIÇÃO DA COR DO CABEÇALHO (VERDE)
  const headerBgColor = theme.palette.mode === 'light'
    ? green[100] // Verde claro visível
    : alpha(green[900], 0.4) // Verde escuro sutil

  const headerTextColor = theme.palette.mode === 'light'
    ? theme.palette.success.dark // Texto verde escuro no modo claro
    : theme.palette.success.light // Texto verde claro no modo escuro

  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        width: '100%', 
        maxWidth: '100vw', 
        overflowX: 'hidden',
        boxSizing: 'border-box'
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
                display: 'flex'
              }}
            >
              <MenuBookIcon fontSize="small" />
            </Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Disciplinas
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gerencie o catálogo acadêmico da instituição.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirDialogNova}
          sx={{ fontWeight: 'bold', borderRadius: 2 }}
          disableElevation
        >
          Nova Disciplina
        </Button>
      </Stack>

      {/* --- CARDS DE ESTATÍSTICA (GRID) --- */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          { icon: <MenuBookIcon />, label: 'Total Cadastrado', val: totalDisciplinas, color: 'primary.main', bg: alpha(theme.palette.primary.main, 0.1) },
          { icon: <CategoryIcon />, label: 'Áreas de Conhecimento', val: totalAreas, color: 'success.main', bg: alpha(theme.palette.success.main, 0.1) },
          { icon: <FilterListIcon />, label: 'Sem Vínculo', val: disciplinasSemArea, color: 'warning.main', bg: alpha(theme.palette.warning.main, 0.1) },
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

      {/* --- BARRA DE FILTROS --- */}
      <Paper 
        elevation={0} 
        variant="outlined" 
        sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.5) }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            size="small"
            placeholder="Pesquisar disciplina..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
            fullWidth
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
            <InputLabel>Filtrar por Área</InputLabel>
            <Select
              label="Filtrar por Área"
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="COM_AREA">Com Área</MenuItem>
              <MenuItem value="SEM_AREA">Sem Área</MenuItem>
              {areas.map((a) => (
                <MenuItem key={a.id_area_conhecimento} value={String(a.id_area_conhecimento)}>
                  {a.nome_area}
                </MenuItem>
              ))}
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
              {disciplinasPaginadas.map((row) => {
                 const nomeArea = getNomeArea(row.id_area_conhecimento)
                 const hasArea = !!row.id_area_conhecimento
                 
                 return (
                   <Paper
                     key={row.id_disciplina}
                     elevation={2}
                     sx={{
                       p: 2,
                       borderRadius: 2,
                       position: 'relative',
                       overflow: 'hidden',
                       borderLeft: `5px solid ${hasArea ? theme.palette.primary.main : theme.palette.warning.main}`,
                       bgcolor: cardBgColor,
                     }}
                   >
                     <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
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
                            {row.nome_disciplina}
                          </Typography>
                          
                          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={0.5}>
                             <Chip 
                               label={hasArea ? nomeArea : 'Sem Área'} 
                               size="small" 
                               color={hasArea ? 'default' : 'warning'}
                               variant={hasArea ? 'filled' : 'outlined'}
                               sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                             />
                          </Stack>
                        </Box>

                        <Stack direction="column" spacing={0}>
                          <IconButton size="small" onClick={() => abrirDialogEdicao(row)}>
                            <EditIcon fontSize="small" color="action" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleExcluir(row)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                     </Stack>
                   </Paper>
                 )
              })}
              {disciplinasPaginadas.length === 0 && (
                <Typography align="center" color="text.secondary">Nenhum registro encontrado.</Typography>
              )}
            </Stack>
          ) : (
            // MODO DESKTOP: TABELA COM CABEÇALHO VERDE (Corrigido)
            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Table size="medium">
                <TableHead>
                  {/* Aplicação da cor VERDE diretamente na TableRow */}
                  <TableRow sx={{ bgcolor: headerBgColor }}>
                    <TableCell sx={{ fontWeight: 'bold', color: headerTextColor }}>Disciplina</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: headerTextColor }}>Área de Conhecimento</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: headerTextColor }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disciplinasPaginadas.map((row, index) => {
                     const isEven = index % 2 === 0
                     const nomeArea = getNomeArea(row.id_area_conhecimento)
                     
                     return (
                       <TableRow 
                         key={row.id_disciplina} 
                         sx={{ 
                           bgcolor: isEven ? 'inherit' : zebraColor,
                           '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                         }}
                       >
                         <TableCell>
                           <Typography variant="body2" fontWeight={600} color="text.primary">
                             {row.nome_disciplina}
                           </Typography>
                         </TableCell>
                         <TableCell>
                           {row.id_area_conhecimento ? (
                             <Chip label={nomeArea} size="small" variant="outlined" />
                           ) : (
                             <Typography variant="caption" color="text.secondary" fontStyle="italic">Sem vínculo</Typography>
                           )}
                         </TableCell>
                         <TableCell align="right">
                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                              <Tooltip title="Editar">
                                <IconButton size="small" onClick={() => abrirDialogEdicao(row)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir">
                                <IconButton size="small" color="error" onClick={() => handleExcluir(row)}>
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                         </TableCell>
                       </TableRow>
                     )
                  })}
                  {disciplinasPaginadas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
          count={disciplinasFiltradas.length}
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
          {editando ? 'Editar Disciplina' : 'Nova Disciplina'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nome da Disciplina"
              fullWidth
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              placeholder="Ex: Matemática Financeira"
            />
            <FormControl fullWidth>
              <InputLabel>Área de Conhecimento</InputLabel>
              <Select
                label="Área de Conhecimento"
                value={formAreaId}
                onChange={(e) => setFormAreaId(e.target.value)}
              >
                <MenuItem value=""><em>Nenhuma (Sem vínculo)</em></MenuItem>
                {areas.map((a) => (
                  <MenuItem key={a.id_area_conhecimento} value={String(a.id_area_conhecimento)}>
                    {a.nome_area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

export default SecretariaDisciplinasPage